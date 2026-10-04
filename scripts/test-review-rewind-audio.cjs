// Exercise the real rewind synthesizer against a deterministic Web Audio graph.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function audioHarness() {
  const parameter = () => ({
    calls: [],
    setValueAtTime(...args) { this.calls.push(["set", ...args]); },
    exponentialRampToValueAtTime(...args) { this.calls.push(["ramp", ...args]); },
    cancelScheduledValues(...args) { this.calls.push(["cancel", ...args]); },
  });
  let context;
  class AudioContext {
    constructor() {
      context = this;
      this.state = "running";
      this.currentTime = 10;
      this.destination = {};
      this.nodes = [];
    }
    node(type) {
      const node = {
        type, context: this, connections: [], disconnections: 0,
        connect(target) { this.connections.push(target); return target; },
        disconnect() { this.disconnections += 1; },
      };
      this.nodes.push(node);
      return node;
    }
    createGain() { return Object.assign(this.node("gain"), { gain: parameter() }); }
    createBiquadFilter() { return Object.assign(this.node("filter"), { frequency: parameter() }); }
    createOscillator() {
      return Object.assign(this.node("oscillator"), {
        frequency: parameter(), starts: [], stops: [], onended: null,
        start(time) { this.starts.push(time); },
        stop(time) { this.stops.push(time); },
      });
    }
    close() { assert.fail("The shared audio context must stay open"); }
    suspend() { assert.fail("The shared audio context must stay running"); }
  }
  const filename = path.join(__dirname, "../src/lib/dopamineSound.ts");
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, window: { AudioContext } }, { filename });
  return {
    ...module.exports,
    context: () => context,
    master: () => context.nodes[0],
    ownedNodes: () => context.nodes.slice(1),
    oscillators: () => context.nodes.filter(node => node.starts),
  };
}

test("rewind safely declines playback before audio is unlocked", () => {
  const audio = audioHarness();
  assert.equal(audio.playRewind(2.2), undefined);
  assert.equal(audio.context(), undefined);
});

test("stopping rewind silences both oscillators and disconnects only its own graph once", () => {
  const audio = audioHarness();
  audio.unlock();
  const handle = audio.playRewind(2.2);
  assert.equal(typeof handle?.stop, "function");
  const sources = audio.oscillators();
  assert.equal(sources.length, 2);
  for (const source of sources) {
    assert.deepEqual(source.starts, [10]);
    assert.deepEqual(source.stops, [12.2]);
  }
  const ended = sources.map(source => source.onended);
  audio.context().currentTime = 10.3;
  handle.stop();
  handle.stop();
  for (const callback of ended) callback?.();
  for (const source of sources) {
    assert.deepEqual(source.stops, [12.2, 10.3]);
    assert.equal(source.onended, null);
  }
  const outputGain = audio.ownedNodes().at(-1);
  assert.deepEqual(outputGain.gain.calls.slice(-2), [["cancel", 10.3], ["set", 0, 10.3]]);
  assert.equal(audio.ownedNodes().length, 5);
  assert.ok(audio.ownedNodes().every(node => node.disconnections === 1));
  assert.equal(audio.master().disconnections, 0);
  assert.equal(audio.master().gain.value, 0.35);
  assert.equal(audio.context().state, "running");
});

for (const firstEnded of [0, 1]) {
  test(`normal rewind completion disconnects its graph once (source ${firstEnded} ends first)`, () => {
    const audio = audioHarness();
    audio.unlock();
    const handle = audio.playRewind(2.2);
    const sources = audio.oscillators();
    const ended = sources.map(source => source.onended);
    assert.ok(ended.every(callback => typeof callback === "function"));
    audio.context().currentTime = 12.2;
    ended[firstEnded]();
    ended[1 - firstEnded]();
    handle.stop();
    assert.ok(audio.ownedNodes().every(node => node.disconnections === 1));
    assert.ok(sources.every(source => source.onended === null));
    assert.ok(sources.every(source => source.stops.length === 1));
    assert.equal(audio.master().disconnections, 0);
  });
}

test("canceling one rewind leaves another playback and the shared master connected", () => {
  const audio = audioHarness();
  audio.unlock();
  const first = audio.playRewind(2.2);
  const firstNodes = audio.ownedNodes();
  const second = audio.playRewind(2.2);
  const secondNodes = audio.ownedNodes().slice(firstNodes.length);
  first.stop();
  assert.ok(firstNodes.every(node => node.disconnections === 1));
  assert.ok(secondNodes.every(node => node.disconnections === 0));
  assert.ok(secondNodes.filter(node => node.stops).every(node => node.stops.length === 1));
  assert.equal(audio.master().disconnections, 0);
  second.stop();
  assert.ok(secondNodes.every(node => node.disconnections === 1));
});
