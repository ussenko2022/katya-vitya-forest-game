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
  assert.doesNotMatch(css, /animation-duration:\.01ms/);
  console.log('Speech cancellation and reduced-motion checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
