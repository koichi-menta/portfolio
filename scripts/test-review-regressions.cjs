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

function timelineHarness(t, initiallyMuted = false) {
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval", "Date"] });
  const previousWindow = global.window;
  const previousObserver = global.ResizeObserver;
  global.window = { addEventListener() {}, removeEventListener() {} };
  global.ResizeObserver = class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ contentRect: { width: 1440, height: 800 } }]); }
    disconnect() {}
  };
  let isMuted = initiallyMuted;
  let rewinds = 0;
  const { TimelineMountain } = load("src/components/blocks/TimelineMountain/index.tsx", {
    "next/link": Link,
    "framer-motion": framer,
    "src/contexts/DopamineMode": {
      DOPAMINE_CONTROLS_SAFE_AREA: 72,
      useDopamineMode: () => ({ isMuted }),
    },
    "src/components/parts/GenreIcon": { GenreIcon: () => element("span") },
    "src/components/parts/DopamineButton": { DopamineButton: props => element("button", props) },
    "src/lib/dopamineSound": {
      playRewind: () => { rewinds += 1; },
      playPop() {}, playReveal() {}, unlock() {},
    },
  });
  let renderer;
  act(() => {
    renderer = create(element(TimelineMountain), {
      createNodeMock: () => ({ addEventListener() {}, removeEventListener() {} }),
    });
  });
  t.after(() => {
    act(() => renderer.unmount());
    global.window = previousWindow;
    global.ResizeObserver = previousObserver;
    t.mock.timers.reset();
  });
  return {
    renderer,
    tick: milliseconds => act(() => t.mock.timers.tick(milliseconds)),
    mute: value => act(() => {
      isMuted = value;
      renderer.update(element(TimelineMountain));
    }),
    rewinds: () => rewinds,
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

test("canceling the rewind hold clears its pending audio", t => {
  const scene = timelineHarness(t);
  scene.tick(250);
  scene.click("skip");
  scene.tick(500);
  assert.equal(scene.rewinds(), 0);
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
