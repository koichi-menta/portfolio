// React/event ownership regressions with explicit scroll metrics; no browser layout emulation.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { create, act } = require("react-test-renderer");
const { ServerStyleSheet } = require("styled-components");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const element = React.createElement;
const fragment = ({ children }) => element(React.Fragment, null, children);

function load(relative, mocks, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const localRequire = id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (!id.startsWith("src/")) return require(id);
    const resolved = [id, `${id}.ts`, `${id}.tsx`, `${id}/index.tsx`].find(candidate =>
      fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile());
    if (!resolved) throw new Error(`Cannot resolve ${id}`);
    return resolved.endsWith(".json") ? require(path.join(root, resolved)) : load(resolved, mocks, cache);
  };
  vm.runInThisContext(`(function(require, module, exports) {${source}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}

const mocks = {
  "next/link": ({ children, ...props }) => element("a", props, children),
  "next/image": () => null,
  "public/profile_icon.jpeg": {},
  "framer-motion": { AnimatePresence: fragment, MotionConfig: fragment,
    motion: new Proxy({}, { get: (_, type) => type }), useReducedMotion: () => true },
  "src/contexts/DopamineMode": { DOPAMINE_CONTROLS_SAFE_AREA: 72, useDopamineMode: () => ({ isMuted: true }) },
  "src/components/parts/DopamineButton": { DopamineButton: props => element("button", props) },
  "src/lib/dopamineSound": { playPop() {}, playTick() {}, unlock() {} },
};

function faqHarness(t) {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const previousWindow = global.window, previousElement = global.Element;
  const listeners = new Map(), keys = new Map();
  class FakeElement {
    constructor(answer = null) { this.answer = answer; }
    closest(selector) { return selector === ".answer" ? this.answer : null; }
  }
  global.Element = FakeElement;
  global.window = {
    addEventListener: (type, callback) => keys.set(type, callback),
    removeEventListener: type => keys.delete(type),
  };
  let activeElement;
  const makeAnswer = () => {
    const node = new FakeElement();
    node.answer = node;
    Object.assign(node, { scrollTop: 0, scrollHeight: 600, clientHeight: 100,
      focus(options) { activeElement = node; node.focusOptions = options; } });
    return node;
  };
  let answer = makeAnswer(), target = new FakeElement(answer), hasAnswerNode = false;
  const outside = new FakeElement();
  const column = { addEventListener: (type, callback) => listeners.set(type, callback),
    removeEventListener: type => listeners.delete(type) };
  const { FaqShorts } = load("src/components/blocks/FaqShorts/index.tsx", mocks);
  let renderer;
  t.after(() => {
    act(() => renderer?.unmount());
    global.window = previousWindow;
    global.Element = previousElement;
    t.mock.timers.reset();
  });
  act(() => { renderer = create(element(FaqShorts), { createNodeMock: node => {
    if (node.props.className !== "answer") return column;
    if (hasAnswerNode) { answer = makeAnswer(); target = new FakeElement(answer); }
    hasAnswerNode = true;
    return answer;
  } }); });
  const findColumn = () => renderer.root.find(node => node.type === "div" && node.props.className === "column");
  function dispatch(type, props = {}, at = target) {
    const event = { target: at, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...props };
    const fallback = { touchstart: "onTouchStart", touchmove: "onTouchMove", touchend: "onTouchEnd", touchcancel: "onTouchCancel" };
    const listener = type === "keydown" ? keys.get(type) : listeners.get(type) || findColumn().props[fallback[type]];
    act(() => listener?.(event));
    return event;
  }
  const scroll = delta => { answer.scrollTop = Math.max(0, Math.min(answer.scrollHeight - answer.clientHeight, answer.scrollTop + delta)); };
  let touchY = 0;
  return {
    renderer, outside, listeners, keys,
    get answer() { return answer; }, get target() { return target; },
    activeElement: () => activeElement,
    question: () => renderer.root.find(node => node.type === "p" && node.props.className === "question").props.children,
    tick: () => act(() => t.mock.timers.tick(701)),
    wheel: (deltaY, at = target, extra = {}) => {
      const event = dispatch("wheel", { deltaY, ...extra }, at);
      if (!event.defaultPrevented && at === target && !extra.ctrlKey) scroll(deltaY);
      return event;
    },
    key: (key, at = target, extra = {}) => dispatch("keydown", { key, ...extra }, at),
    start: (y = 300, at = target) => { touchY = y; return dispatch("touchstart", { touches: [{ clientY: y }] }, at); },
    move: (y, at = target) => {
      const event = dispatch("touchmove", { touches: [{ clientY: y }] }, at);
      if (!event.defaultPrevented && at === target) scroll(touchY - y);
      touchY = y;
      return event;
    },
    end: (y = touchY, at = target) => dispatch("touchend", { touches: [], changedTouches: [{ clientY: y }] }, at),
    cancel: () => dispatch("touchcancel"),
    multiTouch: () => dispatch("touchmove", { touches: [{ clientY: 200 }, { clientY: 240 }] }),
  };
}

test("FAQ wheel scrolls the answer until the edge, then changes question", t => {
  const scene = faqHarness(t), initial = scene.question();
  assert.equal(scene.wheel(120).defaultPrevented, false);
  assert.equal(scene.answer.scrollTop, 120);
  assert.equal(scene.question(), initial);
  scene.answer.scrollTop = 500;
  assert.equal(scene.wheel(100).defaultPrevented, true);
  assert.notEqual(scene.question(), initial);
  scene.tick();
  scene.answer.scrollTop = 100;
  assert.equal(scene.wheel(-100).defaultPrevented, false);
  assert.notEqual(scene.question(), initial);
  assert.equal(scene.wheel(-100).defaultPrevented, true);
  assert.equal(scene.question(), initial);
});

test("FAQ touch scroll reaching the edge does not also change question", t => {
  const scene = faqHarness(t), initial = scene.question();
  scene.answer.scrollTop = 450;
  scene.start(); scene.move(200); scene.end();
  assert.equal(scene.answer.scrollTop, 500);
  assert.equal(scene.question(), initial);
  scene.start(); scene.move(200); scene.end();
  assert.notEqual(scene.question(), initial);
});

test("FAQ reverse-direction touch can scroll away from an edge", t => {
  const scene = faqHarness(t), initial = scene.question();
  scene.start();
  assert.equal(scene.move(350).defaultPrevented, false);
  assert.equal(scene.move(200).defaultPrevented, false);
  scene.end();
  assert.equal(scene.answer.scrollTop, 150);
  assert.equal(scene.question(), initial);
});

test("FAQ touch cancellation and multitouch never navigate", t => {
  const scene = faqHarness(t), initial = scene.question();
  scene.answer.scrollTop = 500;
  scene.start(); scene.move(200); scene.cancel(); scene.end();
  assert.equal(scene.question(), initial);
  scene.start(); scene.multiTouch(); scene.end(100);
  assert.equal(scene.question(), initial);
});

test("FAQ keyboard keeps native answer scrolling and permits edge navigation", t => {
  const scene = faqHarness(t), initial = scene.question();
  const pane = scene.renderer.root.find(node => node.type === "div" && node.props.className === "answer");
  assert.equal(pane.props.tabIndex, 0);
  assert.equal(pane.props.role, "region");
  assert.equal(scene.key("ArrowDown").defaultPrevented, false);
  assert.equal(scene.question(), initial);
  scene.answer.scrollTop = 500;
  assert.equal(scene.key("PageUp").defaultPrevented, false);
  const previousAnswer = scene.answer;
  assert.equal(scene.key("ArrowDown").defaultPrevented, true);
  assert.notEqual(scene.question(), initial);
  assert.notEqual(scene.answer, previousAnswer);
  assert.equal(scene.activeElement(), scene.answer);
  assert.deepEqual(scene.answer.focusOptions, { preventScroll: true });
  const second = scene.question();
  assert.equal(scene.key("ArrowDown", scene.activeElement()).defaultPrevented, false);
  assert.equal(scene.question(), second);
  scene.tick(); scene.answer.scrollTop = 0;
  assert.equal(scene.key("ArrowUp").defaultPrevented, true);
  assert.equal(scene.question(), initial);
});

test("FAQ gestures outside the answer still navigate, with keyboard/zoom modifiers preserved", t => {
  const scene = faqHarness(t), initial = scene.question();
  assert.equal(scene.wheel(100, scene.target, { ctrlKey: true }).defaultPrevented, false);
  assert.equal(scene.key("ArrowDown", scene.outside, { altKey: true }).defaultPrevented, false);
  assert.equal(scene.question(), initial);
  scene.start(300, scene.outside);
  assert.equal(scene.move(200, scene.outside).defaultPrevented, true);
  scene.end(200, scene.outside);
  assert.notEqual(scene.question(), initial);
  act(() => scene.renderer.unmount());
  assert.equal(scene.listeners.size, 0);
  assert.equal(scene.keys.size, 0);
});

test("FAQ CSS enables vertical touch scrolling and contains answer overscroll", () => {
  const { FaqShorts } = load("src/components/blocks/FaqShorts/index.tsx", mocks);
  const sheet = new ServerStyleSheet();
  try {
    renderToStaticMarkup(sheet.collectStyles(element(FaqShorts)));
    const css = sheet.getStyleTags();
    assert.match(css, /touch-action:pan-y pinch-zoom/);
    assert.match(css, /overscroll-behavior-y:contain/);
    assert.match(css, /min-height:0/);
  } finally { sheet.seal(); }
});


test("FAQ boundary touch navigation ignores elastic overscroll offsets", t => {
  const scene = faqHarness(t), initial = scene.question();
  scene.answer.scrollTop = 512;
  scene.start(); scene.move(200); scene.end();
  assert.notEqual(scene.question(), initial);
  scene.tick();
  scene.answer.scrollTop = -12;
  scene.start(); scene.move(400); scene.end();
  assert.equal(scene.question(), initial);
});
