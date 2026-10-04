// Deterministic React regressions for PR #44. No browser or audio device needed.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { create, act } = require("react-test-renderer");

const root = path.resolve(__dirname, "..");
const element = React.createElement;
const fragment = ({ children }) => element(React.Fragment, null, children);
const Link = ({ children, ...props }) => element("a", props, children);
const motion = new Proxy({}, {
  get: (_, type) => type,
});
const framer = {
  AnimatePresence: fragment,
  MotionConfig: fragment,
  motion,
  useReducedMotion: () => false,
  useMotionValue: initial => React.useMemo(() => ({
    value: initial,
    set(value) { this.value = value; },
  }), []),
  useTransform: (value, transform) => transform(value.value),
  animate: () => ({ stop() {} }),
};

// Compile the real TSX and hooks, replacing only browser/animation boundaries.
function load(relative, mocks, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const requireModule = id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith("src/")) {
      const resolved = [id, `${id}.ts`, `${id}.tsx`, `${id}/index.tsx`]
        .find(candidate => fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile());
      if (!resolved) throw new Error(`Cannot resolve ${id}`);
      if (resolved.endsWith(".json")) return require(path.join(root, resolved));
      return load(resolved, mocks, cache);
    }
    return require(id);
  };
  vm.runInThisContext(`(function(require, module, exports) {${source}\n})`, { filename })(requireModule, module, module.exports);
  return module.exports;
}

function timelineHarness(t, initiallyMuted = false, throughContainer = false, reducedMotion = false) {
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval", "Date"] });
  const previousWindow = global.window;
  const previousObserver = global.ResizeObserver;
  const previousElement = global.Element;
  const listeners = new Map();
  const animations = [];
  class FakeElement {
    closest(selector) { return selector === ".eventCard" && this.isCard ? this : null; }
  }
  global.Element = FakeElement;
  global.window = {
    addEventListener(type, callback) { listeners.set(type, callback); },
    removeEventListener(type) { listeners.delete(type); },
  };
  global.ResizeObserver = class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ contentRect: { width: 1440, height: 800 } }]); }
    disconnect() {}
  };
  let isMuted = initiallyMuted;
  let isDopamine = true;
  const rewinds = [];
  const mocks = {
    "next/link": Link,
    "framer-motion": { ...framer, useReducedMotion: () => reducedMotion,
      animate: (...args) => { animations.push(args); return { stop() {} }; } },
    "src/contexts/DopamineMode": {
      DOPAMINE_CONTROLS_SAFE_AREA: 72,
      useDopamineMode: () => ({ isMuted, isDopamine }),
    },
    "react-vertical-timeline-component": { VerticalTimeline: fragment },
    "react-vertical-timeline-component/style.min.css": {},
    "src/components/parts/TimelineItem": { TimelineItem: fragment },
    "src/components/parts/Title": { Title: fragment },
    "src/components/parts/GenreIcon": { GenreIcon: () => element("span") },
    "src/components/parts/DopamineButton": { DopamineButton: props => element("button", props) },
    "src/lib/dopamineSound": {
      playRewind: () => {
        const sound = { stops: 0, stop() { this.stops += 1; } };
        rewinds.push(sound);
        return sound;
      },
      playPop() {}, playReveal() {}, unlock() {},
    },
  };
  const Scene = throughContainer
    ? load("src/components/container/Timeline/index.tsx", mocks).TimelineContainer
    : load("src/components/blocks/TimelineMountain/index.tsx", mocks).TimelineMountain;
  let renderer;
  act(() => {
    renderer = create(element(Scene), {
      createNodeMock: () => ({ addEventListener() {}, removeEventListener() {} }),
    });
  });
  t.after(() => {
    act(() => renderer.unmount());
    global.window = previousWindow;
    global.ResizeObserver = previousObserver;
    global.Element = previousElement;
    t.mock.timers.reset();
  });
  return {
    renderer,
    animations,
    key: (key, target = new FakeElement(), extra = {}) => {
      const event = { key, target, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; }, ...extra };
      act(() => listeners.get("keydown")?.(event));
      return event;
    },
    cardTarget: () => Object.assign(new FakeElement(), { isCard: true, scrollTop: 0, scrollHeight: 600, clientHeight: 100 }),
    tick: milliseconds => act(() => t.mock.timers.tick(milliseconds)),
    mute: value => act(() => {
      isMuted = value;
      renderer.update(element(Scene));
    }),
    exit: () => act(() => {
      isDopamine = false;
      renderer.update(element(Scene));
    }),
    rewinds: () => rewinds.length,
    stoppedRewinds: () => rewinds.map(sound => sound.stops),
    unmount: () => act(() => renderer.unmount()),
    nodes: () => renderer.root.findAll(node => node.type === "button" && /\b(node|summit)\b/.test(node.props.className)),
    click: className => act(() => renderer.root.find(node => node.type === "button" && node.props.className === className).props.onClick()),
  };
}

for (const [before, after, expected] of [[false, true, 0], [true, false, 1], [false, false, 1], [true, true, 0]]) {
  test(`rewind reads mute at sound start: ${before} -> ${after}`, t => {
    const scene = timelineHarness(t, before);
    scene.tick(250);
    scene.mute(after);
    scene.tick(249);
    assert.equal(scene.rewinds(), 0);
    scene.tick(1);
    assert.equal(scene.rewinds(), expected);
  });
}

test("timeline nodes disable during intro/replay and enable after skip/completion", t => {
  const scene = timelineHarness(t, true);
  const disabled = expected => {
    assert.equal(scene.nodes().length, 7);
    assert.ok(scene.nodes().every(node => node.props.disabled === expected));
  };
  disabled(true);
  scene.tick(500);
  disabled(true);
  scene.click("skip");
  disabled(false);
  act(() => scene.renderer.root.findAllByType("button").find(node => node.props.children === "もう一度見る").props.onClick());
  disabled(true);
  scene.tick(2700);
  for (let i = 0; i < 6; i += 1) {
    disabled(true);
    scene.tick(1000);
  }
  disabled(true);
  scene.tick(1500);
  disabled(false);
});

test("timeline reduced motion never starts a moving rewind camera", t => {
  const scene = timelineHarness(t, true, false, true);
  scene.tick(500);
  const rewind = scene.animations.find(args => args[0] === 0 && args[1] === 1);
  assert.ok(rewind, "The rewind still reaches the first event");
  assert.equal(rewind[2].duration, 0);
});

test("timeline event cards retain native keyboard scrolling and modified keys", t => {
  const scene = timelineHarness(t, true);
  scene.click("skip");
  scene.key("ArrowDown");
  scene.tick(701);
  const currentTitle = () => scene.renderer.root.find(node => node.type === "article").props["aria-label"];
  const before = currentTitle();
  const card = scene.renderer.root.find(node => node.type === "article");
  assert.equal(card.props.tabIndex, 0, "Long descriptions must be keyboard-focusable");
  assert.equal(scene.key("ArrowDown", scene.cardTarget()).defaultPrevented, false);
  assert.equal(currentTitle(), before, "Reading a card must not navigate away");
  scene.key("ArrowDown", undefined, { altKey: true });
  assert.equal(currentTitle(), before);
  assert.equal(scene.key("ArrowDown").defaultPrevented, true);
  assert.notEqual(currentTitle(), before);
});

test("profile reduced motion does not launch imperative avatar transforms", t => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const animations = [];
  const animateAvatar = (...args) => { animations.push(args); return { stop() {} }; };
  const { ProfileMV } = load("src/components/blocks/ProfileMV/index.tsx", {
    "next/link": Link, "next/image": () => null, "public/profile_icon.jpeg": {},
    "framer-motion": { ...framer, useReducedMotion: () => true,
      useAnimate: () => [React.useRef(null), animateAvatar] },
    "src/contexts/DopamineMode": { DOPAMINE_CONTROLS_SAFE_AREA: 72, useDopamineMode: () => ({ isMuted: true }) },
    "src/lib/dopamineSound": { unlock() {}, playBass() {}, playBurst() {}, playHat() {}, playKick() {}, playReveal() {} },
  });
  let renderer;
  t.after(() => { act(() => renderer?.unmount()); t.mock.timers.reset(); });
  act(() => { renderer = create(element(ProfileMV), { createNodeMock: () => ({}) }); });
  for (let i = 0; i < 48; i += 1) act(() => t.mock.timers.tick(60000 / 128));
  assert.ok(animations.length > 0);
  assert.ok(animations.every(([, , options]) => options?.duration === 0),
    "MotionConfig does not govern imperative useAnimate calls");
});

test("global mute and mode exit silence an already scheduled activation burst", t => {
  const previousWindow = global.window;
  let context, mode;
  const parameter = () => ({ value: 0,
    setValueAtTime(value) { this.value = value; },
    exponentialRampToValueAtTime() {}, cancelScheduledValues() {},
  });
  class AudioContext {
    constructor() { context = this; this.state = "running"; this.currentTime = 10;
      this.sampleRate = 100; this.destination = {}; this.gains = []; this.sources = []; }
    node(extra = {}) { return { connect(target) { return target; }, disconnect() {}, ...extra }; }
    createGain() { const gain = this.node({ gain: parameter() }); this.gains.push(gain); return gain; }
    createBiquadFilter() { return this.node({ frequency: parameter() }); }
    createBuffer() { return { getChannelData: () => new Float32Array(60) }; }
    createBufferSource() { return this.createOscillator(); }
    createOscillator() {
      const source = this.node({ frequency: parameter(), starts: [],
        start(time) { this.starts.push(time); }, stop() {} });
      this.sources.push(source); return source;
    }
  }
  global.window = { AudioContext };
  const { DopamineModeProvider, useDopamineMode } = load("src/contexts/DopamineMode.tsx", {});
  const Probe = () => { mode = useDopamineMode(); return null; };
  let renderer;
  t.after(() => { act(() => renderer?.unmount()); global.window = previousWindow; });
  act(() => { renderer = create(element(DopamineModeProvider, null, element(Probe))); });
  act(() => mode.enable());
  assert.equal(context.gains[0].gain.value, 0.35);
  assert.ok(context.sources.some(source => source.starts.some(time => time > context.currentTime)),
    "The activation burst has notes scheduled after this click");
  act(() => mode.toggleMute());
  assert.equal(mode.isMuted, true);
  assert.equal(context.gains[0].gain.value, 0, "Mute must silence already scheduled notes too");
  act(() => mode.toggleMute());
  assert.equal(context.gains[0].gain.value, 0.35);
  act(() => mode.disable());
  assert.equal(context.gains[0].gain.value, 0, "Leaving dopamine mode must silence the remaining burst");
  act(() => mode.enable());
  assert.equal(context.gains[0].gain.value, 0.35);
  act(() => renderer.unmount());
  assert.equal(context.gains[0].gain.value, 0);
});

test("canceling the rewind hold clears its pending audio", t => {
  const scene = timelineHarness(t);
  scene.tick(250);
  scene.click("skip");
  scene.tick(500);
  assert.equal(scene.rewinds(), 0);
});

for (const action of ["skip", "mute", "unmount", "mode exit"]) {
  test(`canceling an active rewind via ${action} stops its audio once`, t => {
    const scene = timelineHarness(t, false, action === "mode exit");
    scene.tick(500);
    assert.equal(scene.rewinds(), 1);
    assert.deepEqual(scene.stoppedRewinds(), [0]);
    if (action === "skip") scene.click("skip");
    if (action === "mute") scene.mute(true);
    if (action === "unmount") scene.unmount();
    if (action === "mode exit") scene.exit();
    assert.deepEqual(scene.stoppedRewinds(), [1]);
    scene.tick(3000);
    scene.unmount();
    assert.deepEqual(scene.stoppedRewinds(), [1]);
  });
}

test("unmuting a canceled rewind does not restart it or reset the sequence", t => {
  const scene = timelineHarness(t);
  scene.tick(500);
  scene.mute(true);
  scene.tick(500);
  scene.mute(false);
  scene.tick(1699);
  assert.equal(scene.rewinds(), 1);
  assert.deepEqual(scene.stoppedRewinds(), [1]);
  assert.equal(scene.renderer.root.findAll(node => node.props.className === "clock rewinding").length, 1);
  scene.tick(1);
  assert.equal(scene.renderer.root.findAll(node => node.props.className === "clock rewinding").length, 0);
  assert.deepEqual(scene.stoppedRewinds(), [1]);
});

test("normal rewind completion cleans audio before the next timeline event", t => {
  const scene = timelineHarness(t);
  scene.tick(500);
  scene.tick(2199);
  assert.deepEqual(scene.stoppedRewinds(), [0]);
  scene.tick(1);
  assert.deepEqual(scene.stoppedRewinds(), [1]);
  scene.unmount();
  assert.deepEqual(scene.stoppedRewinds(), [1]);
});

test("replay owns a fresh rewind and does not stop the previous sound twice", t => {
  const scene = timelineHarness(t);
  scene.tick(500);
  scene.click("skip");
  assert.deepEqual(scene.stoppedRewinds(), [1]);
  act(() => scene.renderer.root.findAllByType("button").find(node => node.props.children === "もう一度見る").props.onClick());
  scene.tick(499);
  assert.equal(scene.rewinds(), 1);
  scene.tick(1);
  assert.equal(scene.rewinds(), 2);
  assert.deepEqual(scene.stoppedRewinds(), [1, 0]);
  scene.click("skip");
  scene.unmount();
  assert.deepEqual(scene.stoppedRewinds(), [1, 1]);
});

for (const [page, container, exported] of [["faq", "Fap", "FaqContainer"], ["profile", "Profile", "ProfileContainer"], ["timeline", "Timeline", "TimelineContainer"]]) {
  test(`${page} removes obscured chrome in dopamine mode and restores it on exit`, () => {
    let isDopamine = false;
    const mocks = {
      "next/link": Link,
      "next/head": () => null,
      "src/components/blocks/Header": { Header: () => element("nav", null, element("a", { href: "/faq" }, "FAQ")) },
      [`src/components/container/${container}`]: { [exported]: () => element("section", null, "visible scene") },
      "src/contexts/DopamineMode": {
        DOPAMINE_CONTROLS_SAFE_AREA: 72,
        useDopamineMode: () => ({ isDopamine }),
      },
    };
    const Page = load(`src/pages/${page}/index.tsx`, mocks).default;
    let renderer;
    act(() => { renderer = create(element(Page)); });
    const countChrome = className => renderer.root.findAll(node => node.type === "div" && node.props.className === className).length;
    try {
      for (const value of [false, true, false, true]) {
        act(() => { isDopamine = value; renderer.update(element(Page)); });
        assert.equal(countChrome("header"), value ? 0 : 1);
        assert.equal(countChrome("footer"), value ? 0 : 1);
        assert.equal(renderer.root.findAllByType("a").length, value ? 0 : 2);
        assert.equal(renderer.root.findAllByType("section").length, 1);
      }
    } finally { act(() => renderer.unmount()); }
  });
}

test("other layout consumers keep their navigation in dopamine mode", () => {
  const { Layout } = load("src/components/template/Layout.tsx", {
    "next/link": Link,
    "src/components/blocks/Header": { Header: () => element("nav", null, "navigation") },
    "src/contexts/DopamineMode": {
      DOPAMINE_CONTROLS_SAFE_AREA: 72,
      useDopamineMode: () => ({ isDopamine: true }),
    },
  });
  let renderer;
  act(() => { renderer = create(element(Layout, null, element("main"))); });
  try {
    assert.equal(renderer.root.findAllByType("nav").length, 1);
    assert.equal(renderer.root.findAllByType("a").length, 1);
  } finally { act(() => renderer.unmount()); }
});
