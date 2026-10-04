// Works scene regressions with mocked browser boundaries; no real layout or native dialog emulation.
const root = require('node:path').resolve(__dirname, '..');
const path = require('node:path'), fs = require('node:fs'), vm = require('node:vm'), { test } = require('node:test'), assert = require('node:assert/strict');
const req = require('node:module').createRequire(root + '/package.json');
const React = req('react'), { create, act } = req('react-test-renderer'), ts = req('typescript');
req('styled-components'); // choose node/SSR style mode before installing test browser boundaries
const el = React.createElement;
function load(relative, mocks, cache = new Map()) {
    const file = path.join(root, relative);
    if (cache.has(file))
        return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const requireModule = id => {
        if (id in mocks)
            return mocks[id];
        if (!id.startsWith('src/'))
            return req(id);
        const rel = [id, id + '.ts', id + '.tsx', id + '/index.tsx'].find(p => fs.existsSync(path.join(root, p)) && fs.statSync(path.join(root, p)).isFile());
        return load(rel, mocks, cache);
    };
    vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename: file })(requireModule, module, module.exports);
    return module.exports;
}
function harness(t, { reduced = false, realReducedHook = false } = {}) {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const oldWindow = global.window, oldDocument = global.document;
    let muted = false, disableCount = 0;
    const listeners = new Map(), focuses = [], h4s = [], calls = [], mediaListeners = [];
    const addMediaListener = f => mediaListeners.push(f);
    const removeMediaListener = f => { const index = mediaListeners.indexOf(f); if (index >= 0) mediaListeners.splice(index, 1); };
    const media = { matches: reduced, addListener: addMediaListener, removeListener: removeMediaListener,
        addEventListener(type, f) { if (type === 'change') addMediaListener(f); },
        removeEventListener(type, f) { if (type === 'change') removeMediaListener(f); } };
    const body = { style: { position: 'relative', top: '3px', width: '90%', overflow: 'auto' } };
    const sceneNode = { scrollTop: 0, scrollTo(x, y) { this.scrollTop = y; }, querySelector(selector) { return { focus(options) { focuses.push({ kind: 'restored-card', selector, options }); } }; } };
    global.window = { setTimeout: (...args) => setTimeout(...args), clearTimeout: id => clearTimeout(id), scrollY: 123, scrollTo: (x, y) => calls.push(['window-scroll', x, y]), matchMedia: () => media };
    global.document = { body, hidden: false, addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type) };
    const audio = { stop: () => calls.push(['stop']), guarantee: () => calls.push(['guarantee']), reveal: () => calls.push(['reveal']), impact: i => calls.push(['impact', i]), collectionImpact: i => calls.push(['collectionImpact', i]) };
    const framer = { motion: new Proxy({}, { get: (_, type) => type }), useReducedMotion: () => reduced };
    const mocks = { 'next/link': ({ children, ...p }) => el('a', p, children), 'next/image': () => null, 'framer-motion': framer, ...(realReducedHook ? {} : { 'src/hooks/useReducedMotionPreference': { useReducedMotionPreference: () => reduced } }), 'src/contexts/DopamineMode': { DOPAMINE_CONTROLS_SAFE_AREA: 72, useDopamineMode: () => ({ isMuted: muted, disable: () => disableCount++ }) }, 'src/lib/dopamineSound': { createWorksAudio: () => audio, unlock() { calls.push(['unlock']); }, playTick() { calls.push(['tick']); } } };
    const Scene = load('src/components/blocks/WorksGacha/index.tsx', mocks).WorksGacha;
    let renderer;
    act(() => {
        renderer = create(el(Scene), { createNodeMock: node => {
                if (node.type === 'dialog')
                    return { showModal() { calls.push(['show-modal']); }, close() { calls.push(['close-modal']); } };
                if (node.props.className === 'sceneContent')
                    return sceneNode;
                const mock = { kind: node.type, children: node.props.children, focus(options) { focuses.push({ node: mock, kind: node.type, children: node.props.children, options }); } };
                if (node.type === 'h4')
                    h4s.push(mock);
                return mock;
            } });
    });
    let unmounted = false;
    function unmount() { if (!unmounted)
        act(() => { renderer.unmount(); unmounted = true; }); }
    t.after(() => { unmount(); global.window = oldWindow; global.document = oldDocument; t.mock.timers.reset(); });
    const find = cls => renderer.root.find(n => n.props.className === cls && typeof n.type === 'string');
    return { renderer, calls, focuses, h4s, body, sceneNode, find, unmount,
        tick: ms => act(() => t.mock.timers.tick(ms)), phase: () => renderer.root.findByType('section').props['data-phase'],
        enter: () => act(() => find('pack').props.onKeyDown({ key: 'Enter', repeat: false, preventDefault() { } })),
        key: key => act(() => renderer.root.findByType('dialog').props.onKeyDown({ key, repeat: false })),
        hide: value => act(() => { document.hidden = value; listeners.get('visibilitychange')(); }),
        setReduced(value) { act(() => { media.matches = value; mediaListeners.forEach(fn => fn()); }); },
        finishBurst() { act(() => renderer.root.findAll(n => n.props.className === 'flyingCard').at(-1).props.onAnimationEnd({ animationName: 'cardLaunch' })); },
        finishCollection() { act(() => renderer.root.findAll(n => n.props.className === 'resultCard').at(-1).props.onAnimationEnd({ animationName: 'collectionLand' })); },
        details: () => renderer.root.findAll(n => n.type === 'button' && n.props.className === 'workLink'),
        title: () => find('heroCard').findByType('h4').props.children,
        mute(value) { act(() => { muted = value; renderer.update(el(Scene)); }); },
        get disables() { return disableCount; },
    };
}
function reveal(h) { h.tick(2200); h.enter(); h.tick(360); h.finishBurst(); assert.equal(h.phase(), 'reveal'); }
test('automatic cards retain a stable focus target without stealing user focus', t => {
    const h = harness(t);
    reveal(h);
    const first = h.title(), focused = h.focuses.at(-1).node;
    assert.equal(focused.kind, 'div');
    const focusCount = h.focuses.length;
    const scene = h.find('revealScene');
    assert.equal(scene.props.tabIndex, -1);
    h.tick(2000);
    assert.notEqual(h.title(), first);
    assert.equal(h.focuses.at(-1).node, focused);
    assert.equal(h.focuses.length, focusCount);
    assert.equal(h.find('revealScene'), scene, 'Same scene survives the keyed card replacement');
    // Moving to another control must never cause each new card to steal focus.
    h.focuses.push({ kind: 'button', children: '正気に戻る' });
    h.tick(2000);
    assert.equal(h.focuses.at(-1).children, '正気に戻る');
});
test('reveal timer restarts with a full hold after hidden tab, then reaches all 4 cards', t => {
    const h = harness(t);
    reveal(h);
    const first = h.title();
    h.tick(1500);
    h.hide(true);
    h.tick(10000);
    assert.equal(h.title(), first);
    h.hide(false);
    h.tick(1999);
    assert.equal(h.title(), first);
    h.tick(1);
    assert.notEqual(h.title(), first);
    h.tick(2000);
    h.tick(2000);
    h.tick(2000);
    assert.equal(h.phase(), 'collection');
    h.finishCollection();
    assert.ok(h.details().every(n => !n.props.disabled));
});
test('all embedded detail returns restore collection scroll and focus', t => {
    const h = harness(t);
    reveal(h);
    for (let i = 0; i < 4; i++)
        h.tick(2000);
    h.finishCollection();
    for (let i = 0; i < 4; i++) {
        h.sceneNode.scrollTop = 987;
        const link = h.details()[i], slug = link.props['data-work'];
        act(() => link.props.onClick());
        assert.equal(h.phase(), 'detail');
        assert.equal(h.sceneNode.scrollTop, 0);
        act(() => h.renderer.root.findAll(n => n.type === 'button' && n.props.className === 'back')[0].props.onClick());
        assert.equal(h.phase(), 'collection');
        assert.equal(h.sceneNode.scrollTop, 987);
        assert.equal(h.focuses.at(-1).selector, `[data-work="${slug}"]`);
    }
});
test('unmount cancels all scheduled scene updates, closes dialog and restores body styles', t => {
    const h = harness(t);
    assert.equal(h.body.style.position, 'fixed');
    h.unmount();
    h.tick(10000);
    assert.deepEqual(h.body.style, { position: 'relative', top: '3px', width: '90%', overflow: 'auto' });
    assert.ok(h.calls.some(c => c[0] === 'close-modal'));
    assert.ok(h.calls.some(c => c[0] === 'window-scroll' && c[2] === 123));
});
test('collection fallback enables details even without animationend', t => {
    const h = harness(t);
    reveal(h);
    for (let i = 0; i < 4; i++)
        h.tick(2000);
    assert.equal(h.phase(), 'collection');
    assert.ok(h.details().every(n => n.props.disabled));
    h.tick(750 + 3 * 220);
    assert.ok(h.details().every(n => !n.props.disabled));
    assert.equal(h.find('collection settled').props.className, 'collection settled');
});
test('live reduced motion before opening skips charging and all hero transforms', t => {
    const h = harness(t, { realReducedHook: true });
    h.tick(2200);
    h.setReduced(true);
    h.enter();
    assert.equal(h.phase(), 'reveal');
    assert.deepEqual(h.find('heroCard').props.initial, { opacity: 0 });
    assert.deepEqual(h.find('heroCard').props.animate, { opacity: 1, y: 0, scale: 1, rotateY: 0, rotate: 0 });
    for (let i = 0; i < 4; i++)
        h.tick(1400);
    assert.equal(h.phase(), 'collection');
    assert.ok(h.details().every(n => !n.props.disabled));
});
test('live reduced motion resets transforms on the currently revealed card', t => {
    const h = harness(t, { realReducedHook: true });
    reveal(h);
    assert.ok(Array.isArray(h.find('heroCard').props.animate.rotateY));
    h.setReduced(true);
    assert.deepEqual(h.find('heroCard').props.animate, { opacity: 1, y: 0, scale: 1, rotateY: 0, rotate: 0 });
});
test('live reduced motion immediately releases a collection whose CSS animations are canceled', t => {
    const h = harness(t, { realReducedHook: true });
    reveal(h);
    for (let i = 0; i < 4; i++)
        h.tick(2000);
    assert.ok(h.details().every(n => n.props.disabled));
    h.setReduced(true);
    assert.ok(h.details().every(n => !n.props.disabled));
    assert.equal(h.find('collection settled').props.className, 'collection settled');
});
test('canceling a partial swipe resets progress and ignores unrelated pointers', t => {
    const h = harness(t);
    h.tick(2200);
    const seam = h.find('tearZone');
    const target = { getBoundingClientRect: () => ({ width: 280 }), setPointerCapture() { } };
    const pointer = (id, x) => ({ pointerId: id, clientX: x, isPrimary: true, button: 0, currentTarget: target });
    act(() => seam.props.onPointerDown(pointer(1, 120)));
    act(() => seam.props.onPointerMove(pointer(2, 250)));
    assert.equal(h.find('pack').props.style['--tear'], '0%');
    act(() => seam.props.onPointerMove(pointer(1, 155)));
    assert.notEqual(h.find('pack').props.style['--tear'], '0%');
    act(() => seam.props.onPointerCancel(pointer(1, 155)));
    assert.equal(h.find('pack').props.style['--tear'], '0%');
    assert.equal(h.phase(), 'sealed');
    act(() => seam.props.onPointerDown(pointer(3, 150)));
    act(() => seam.props.onPointerMove(pointer(3, 0)));
    assert.equal(h.phase(), 'charging');
    act(() => seam.props.onPointerMove(pointer(3, 300)));
    assert.equal(h.phase(), 'charging');
});
test('keyboard pause and focus pause each hold the current reveal until released', t => {
    const h = harness(t);
    reveal(h);
    const first = h.title();
    h.key('p');
    h.tick(9000);
    assert.equal(h.title(), first);
    h.key('p');
    h.tick(1999);
    assert.equal(h.title(), first);
    h.tick(1);
    assert.notEqual(h.title(), first);
    const second = h.title();
    act(() => h.find('linkInteraction').props.onFocus());
    h.tick(9000);
    assert.equal(h.title(), second);
    act(() => h.find('linkInteraction').props.onBlur());
    h.tick(2000);
    assert.notEqual(h.title(), second);
});
for (const end of ['onPointerUp', 'onPointerCancel', 'onPointerLeave', 'onBlur', 'hidden']) {
    test(`temporary reveal press ends on ${end} without requiring a keyboard`, t => {
        const h = harness(t);
        reveal(h);
        const title = h.title();
        act(() => h.find('linkInteraction').props.onPointerDown());
        h.tick(9000);
        assert.equal(h.title(), title, 'A held pointer protects the current link');
        if (end === 'hidden') { h.hide(true); h.hide(false); }
        else act(() => h.find('linkInteraction').props[end]());
        h.tick(1999);
        assert.equal(h.title(), title);
        h.tick(1);
        assert.notEqual(h.title(), title, 'An aborted touch or completed press resumes automatically');
    });
}
test('ending a pointer gesture preserves an explicit keyboard pause', t => {
    const h = harness(t);
    reveal(h);
    const title = h.title();
    h.key('p');
    act(() => h.find('linkInteraction').props.onPointerDown());
    act(() => h.find('linkInteraction').props.onPointerCancel());
    h.tick(9000);
    assert.equal(h.title(), title);
    h.key('p');
    h.tick(2000);
    assert.notEqual(h.title(), title);
});
test('releasing a focused link keeps it paused until focus moves away', t => {
    const h = harness(t);
    reveal(h);
    const title = h.title();
    act(() => h.find('linkInteraction').props.onPointerDown());
    act(() => h.find('linkInteraction').props.onFocus());
    act(() => h.find('linkInteraction').props.onPointerUp());
    h.tick(9000);
    assert.equal(h.title(), title);
    act(() => h.find('linkInteraction').props.onBlur());
    h.tick(2000);
    assert.notEqual(h.title(), title);
});
test('opening detail from a press cancels reveal work and does not leak its pause into replay', t => {
    const h = harness(t);
    reveal(h);
    act(() => h.find('linkInteraction').props.onPointerDown());
    act(() => h.details()[0].props.onClick());
    h.tick(9000);
    assert.equal(h.phase(), 'detail');
    act(() => h.renderer.root.findAll(n => n.type === 'button' && n.props.className === 'back')[0].props.onClick());
    assert.equal(h.phase(), 'collection');
    h.key('r');
    reveal(h);
    const title = h.title();
    h.tick(2000);
    assert.notEqual(h.title(), title);
});
test('Escape returns embedded detail to collection, then disables the mode', t => {
    const h = harness(t);
    reveal(h);
    act(() => h.details()[0].props.onClick());
    assert.equal(h.phase(), 'detail');
    const cancel = () => act(() => h.renderer.root.findByType('dialog').props.onCancel({ preventDefault() { } }));
    cancel();
    assert.equal(h.phase(), 'collection');
    assert.equal(h.disables, 0);
    cancel();
    assert.equal(h.disables, 1);
});
test('initial reduced motion skips charging, burst and collection celebration', t => {
    const h = harness(t, { reduced: true });
    h.tick(800);
    h.enter();
    assert.equal(h.phase(), 'reveal');
    for (let i = 0; i < 4; i++)
        h.tick(1400);
    assert.equal(h.phase(), 'collection');
    assert.ok(h.details().every(n => !n.props.disabled));
});
for (const phase of ['intro', 'sealed', 'charging', 'burst', 'reveal', 'collection', 'detail']) {
    test(`unmount during ${phase} stops scene audio and clears pending work`, t => {
        const h = harness(t);
        if (phase !== 'intro')
            h.tick(2200);
        if (!['intro', 'sealed'].includes(phase))
            h.enter();
        if (!['intro', 'sealed', 'charging'].includes(phase))
            h.tick(360);
        if (['reveal', 'collection', 'detail'].includes(phase))
            h.finishBurst();
        if (['collection', 'detail'].includes(phase)) {
            for (let i = 0; i < 4; i++)
                h.tick(2000);
        }
        if (phase === 'detail') {
            h.finishCollection();
            act(() => h.details()[0].props.onClick());
        }
        assert.equal(h.phase(), phase);
        const stopsBefore = h.calls.filter(c => c[0] === 'stop').length;
        h.unmount();
        assert.ok(h.calls.filter(c => c[0] === 'stop').length > stopsBefore);
        const completed = h.calls.length;
        h.tick(10000);
        assert.equal(h.calls.length, completed);
    });
}
test('replay clears pause state and owns a fresh complete four-card sequence', t => {
    const h = harness(t);
    reveal(h);
    h.key('p');
    act(() => h.details()[0].props.onClick());
    act(() => h.renderer.root.findAll(n => n.type === 'button' && n.props.className === 'back')[0].props.onClick());
    h.key('r');
    assert.equal(h.phase(), 'intro');
    reveal(h);
    const titles = [];
    for (let i = 0; i < 4; i++) {
        titles.push(h.title());
        h.tick(2000);
    }
    assert.equal(new Set(titles).size, 4);
    assert.equal(h.phase(), 'collection');
});
function worksAudioHarness() {
    const parameter = () => ({ calls: [], setValueAtTime(...a) { this.calls.push(['set', ...a]); }, linearRampToValueAtTime(...a) { this.calls.push(['linear', ...a]); }, exponentialRampToValueAtTime(...a) { this.calls.push(['ramp', ...a]); }, cancelScheduledValues(...a) { this.calls.push(['cancel', ...a]); }, setTargetAtTime(...a) { this.calls.push(['target', ...a]); } });
    let context;
    class AudioContext {
        constructor() { context = this; this.state = 'running'; this.currentTime = 10; this.destination = {}; this.nodes = []; }
        node(type) { const node = { type, context: this, connections: [], disconnections: 0, connect(target) { this.connections.push(target); return target; }, disconnect() { this.disconnections++; } }; this.nodes.push(node); return node; }
        createGain() { return Object.assign(this.node('gain'), { gain: parameter() }); }
        createOscillator() { return Object.assign(this.node('oscillator'), { frequency: parameter(), starts: [], stops: [], onended: null, start(time) { this.starts.push(time); }, stop(time) { this.stops.push(time); } }); }
        close() { assert.fail('Scene must not close the shared context'); }
        suspend() { assert.fail('Scene must not suspend the shared context'); }
    }
    const filename = path.join(root, 'src/lib/dopamineSound.ts');
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(source, { module, exports: module.exports, window: { AudioContext } }, { filename });
    return { ...module.exports, context: () => context, sources: () => context.nodes.filter(n => n.starts) };
}
test('real Works audio cancels pending notes and releases its own graph after ending', () => {
    const audio = worksAudioHarness(), scene = audio.createWorksAudio();
    scene.guarantee();
    assert.equal(audio.context(), undefined);
    audio.unlock();
    scene.guarantee();
    const ctx = audio.context(), sources = audio.sources(), owned = ctx.nodes.slice(1);
    assert.equal(sources.length, 6);
    assert.ok(sources.some(n => n.starts[0] > 10.4));
    ctx.currentTime = 10.1;
    scene.stop();
    for (const source of sources)
        assert.ok(Math.abs(source.stops.at(-1) - 10.13) < 1e-9);
    for (const source of sources)
        source.onended();
    assert.ok(owned.every(n => n.disconnections === 1));
    assert.equal(ctx.nodes[0].disconnections, 0);
    const stops = sources.map(n => n.stops.length);
    scene.stop();
    assert.deepEqual(sources.map(n => n.stops.length), stops);
});
test('real Works audio cleanup never stops another scene owner', () => {
    const audio = worksAudioHarness();
    audio.unlock();
    const a = audio.createWorksAudio(), b = audio.createWorksAudio();
    a.reveal();
    const first = audio.sources();
    b.reveal();
    const second = audio.sources().slice(first.length);
    a.stop();
    assert.ok(first.every(n => n.stops.length === 2));
    assert.ok(second.every(n => n.stops.length === 1));
    b.stop();
    assert.ok(second.every(n => n.stops.length === 2));
    assert.equal(audio.context().nodes[0].disconnections, 0);
});
