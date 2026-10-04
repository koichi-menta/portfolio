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

test("profile reacts immediately when the system motion preference changes", t => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const previousWindow = global.window;
  const listeners = new Set();
  const media = { matches: false,
    addListener(callback) { listeners.add(callback); }, removeListener(callback) { listeners.delete(callback); },
    addEventListener(type, callback) { listeners.add(callback); }, removeEventListener(type, callback) { listeners.delete(callback); },
  };
  global.window = { matchMedia: () => media };
  const animations = [];
  const animateAvatar = (...args) => { animations.push(args); return { stop() {} }; };
  const { ProfileMV } = load("src/components/blocks/ProfileMV/index.tsx", {
    "next/link": Link, "next/image": () => null, "public/profile_icon.jpeg": {},
    "framer-motion": { ...framer, useReducedMotion: require("framer-motion").useReducedMotion,
      useAnimate: () => [React.useRef(null), animateAvatar] },
    "src/contexts/DopamineMode": { DOPAMINE_CONTROLS_SAFE_AREA: 72, useDopamineMode: () => ({ isMuted: true }) },
    "src/lib/dopamineSound": { unlock() {}, playBass() {}, playBurst() {}, playHat() {}, playKick() {}, playReveal() {} },
  });
  let renderer;
  t.after(() => { act(() => renderer?.unmount()); global.window = previousWindow; t.mock.timers.reset(); });
  act(() => { renderer = create(element(ProfileMV), { createNodeMock: () => ({}) }); });
  assert.ok(animations.some(([, , options]) => options.duration > 0));
  animations.length = 0;
  act(() => { media.matches = true; listeners.forEach(callback => callback()); });
  act(() => t.mock.timers.tick(60000 / 128));
  assert.ok(animations.length > 0);
  assert.ok(animations.every(([, , options]) => options.duration === 0), "An OS change must stop the imperative bounce without reloading");
  animations.length = 0;
  act(() => { media.matches = false; listeners.forEach(callback => callback()); });
  act(() => t.mock.timers.tick(60000 / 128));
  assert.ok(animations.some(([, , options]) => options.duration > 0));
});

for (const legacy of [false, true]) {
  test(`motion preference subscription updates and cleans up (${legacy ? "legacy" : "modern"} API)`, t => {
    const previousWindow = global.window;
    const listeners = new Set();
    const media = { matches: true };
    if (legacy) {
      media.addListener = callback => listeners.add(callback);
      media.removeListener = callback => listeners.delete(callback);
    } else {
      media.addEventListener = (type, callback) => { assert.equal(type, "change"); listeners.add(callback); };
      media.removeEventListener = (type, callback) => listeners.delete(callback);
    }
    global.window = { matchMedia: query => { assert.equal(query, "(prefers-reduced-motion: reduce)"); return media; } };
    const { useReducedMotionPreference } = load("src/hooks/useReducedMotionPreference.ts", {});
    const Probe = () => element("span", null, String(useReducedMotionPreference()));
    // The server snapshot stays deterministic even if an embedding host exposes window.
    assert.equal(require("react-dom/server").renderToStaticMarkup(element(Probe)), "<span>false</span>");
    let renderer;
    t.after(() => { act(() => renderer?.unmount()); global.window = previousWindow; });
    act(() => { renderer = create(element(Probe)); });
    assert.equal(renderer.toJSON().children[0], "true");
    assert.equal(listeners.size, 1);
    act(() => { media.matches = false; listeners.forEach(callback => callback()); });
    assert.equal(renderer.toJSON().children[0], "false");
    act(() => { media.matches = true; listeners.forEach(callback => callback()); });
    assert.equal(renderer.toJSON().children[0], "true");
    act(() => renderer.unmount());
    assert.equal(listeners.size, 0);
  });
}

test("motion preference safely defaults when matchMedia is unavailable", () => {
  const previousWindow = global.window;
  global.window = {};
  const { useReducedMotionPreference } = load("src/hooks/useReducedMotionPreference.ts", {});
  const Probe = () => element("span", null, String(useReducedMotionPreference()));
  let renderer;
  try {
    act(() => { renderer = create(element(Probe)); });
    assert.equal(renderer.toJSON().children[0], "false");
  } finally { act(() => renderer?.unmount()); global.window = previousWindow; }
});
