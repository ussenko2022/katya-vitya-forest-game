const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'dist/game.js'), 'utf8').split("$('menuButton').addEventListener")[0];
const audios = [];
const utterances = [];
const synthesis = {
  cancel() {},
  getVoices() { return [{lang: 'ru-RU'}]; },
  speak(utterance) { utterances.push(utterance); },
};
class FakeAudio {
  constructor(file) { this.file = file; this.paused = false; audios.push(this); }
  play() { return Promise.resolve(); }
  pause() { this.paused = true; }
}
const context = vm.createContext({
  window: {GAME_CONTENT: {ru: {}}, VOICE_ASSETS: {ru: {female: {a: 'a.mp3', b: 'b.mp3', c: 'c.mp3'}}}, speechSynthesis: synthesis},
  localStorage: {getItem() { return null; }},
  Audio: FakeAudio,
  SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
  setTimeout, clearTimeout,
});
vm.runInContext(source, context);

(async () => {
  vm.runInContext("speak(['a','b'])", context);
  const oldEnd = audios[0].onended;
  vm.runInContext("speak(['c'])", context);
  assert.equal(audios[0].paused, true);
  oldEnd(); // A delayed event from the cancelled stream must not start b.
  assert.deepEqual(audios.map(audio => audio.file), ['a.mp3', 'c.mp3']);

  vm.runInContext("speak(['a','b'])", context);
  audios.at(-1).onended();
  assert.equal(audios.at(-1).file, 'b.mp3');

  vm.runInContext("voiceMode='browser'; speak(['a','b'])", context);
  await new Promise(resolve => setTimeout(resolve, 220));
  const oldBrowserEnd = utterances.at(-1).onend;
  vm.runInContext("speak(['c'])", context);
  oldBrowserEnd(); // Cancel may dispatch onend on another machine.
  await new Promise(resolve => setTimeout(resolve, 220));
  assert.deepEqual(utterances.map(utterance => utterance.text), ['a', 'c']);

  const css = fs.readFileSync(path.join(root, 'dist/style.css'), 'utf8');
  assert.match(css, /prefers-reduced-motion:reduce\).*animation:none!important/);
  assert.match(css, /prefers-reduced-motion:reduce\).*gentle-bob 8s/);
  assert.match(css, /\.level-grid\{[^}]*margin:22px auto 0/);
  assert.doesNotMatch(css, /animation-duration:\.01ms/);
  assert.match(css, /\.world-litter\{[^}]*touch-action:none/);

  const classes = new Set();
  const itemButton = {classList: {add(value) { classes.add(value); }, remove(value) { classes.delete(value); }}, disabled: false};
  const binContents = {textContent: ''};
  const bin = {querySelector() { return binContents; }};
  const playfield = {querySelector(selector) { return selector.includes('data-trash') ? itemButton : bin; }};
  context.document = {getElementById(id) { assert.equal(id, 'stagePlayfield'); return playfield; }};
  context.testEvents = [];
  context.testStage = {itemIds: [0]};
  context.testCatalog = [{bin: 'paper', why: 'wrong container', sortPraise: 'correct container'}];
  vm.runInContext('react=(...args)=>testEvents.push(args); progress=()=>{}; completeStage=()=>{}; state.sortedTrash=new Set(); state.selectedTrash=0', context);
  assert.equal(vm.runInContext("acceptRecycling(0,'plastic',testStage,testCatalog)", context), false);
  assert.equal(itemButton.disabled, false);
  assert.equal(context.testEvents.at(-1)[0], false);
  assert.equal(vm.runInContext("acceptRecycling(0,'paper',testStage,testCatalog)", context), true);
  assert.equal(itemButton.disabled, true);
  assert.equal(classes.has('sorted'), true);
  assert.equal(binContents.textContent, '⭐');
  assert.equal(context.testEvents.at(-1)[0], true);
  console.log('Speech cancellation, reduced motion, and sorting checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
