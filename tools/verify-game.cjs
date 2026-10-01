const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'dist', 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const data = vm.runInNewContext(`${js.slice(0,js.indexOf('const state ='))}\n({levels, adventures, habitats, growth, counting, memoryPairs})`);

assert.equal(data.levels.length,5);
assert.deepEqual([...data.levels].map(level=>level.id).join(','),'1,2,3,4,5');
assert.equal(data.adventures.length,7);
for(const adventure of data.adventures){
  assert.equal(adventure.answers.length,3);
  assert.equal(adventure.answers.filter(answer=>answer.correct).length,1);
  assert(adventure.answers.filter(answer=>!answer.correct).every(answer=>answer.why?.length>20));
  assert(adventure.praise.length>20);
}
assert.equal(new Set(data.habitats.map(item=>item.home)).size,3);
assert.equal(data.growth.length,4);
assert.equal(data.counting.map(item=>item.count).join(','),'1,2,3,4');
assert.equal(new Set(data.memoryPairs.map(item=>item.icon)).size,3);

const elementIds=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
for(const match of js.matchAll(/\$\('([^']+)'\)/g))assert(elementIds.has(match[1]),`Missing HTML element: ${match[1]}`);

const voiceLines=JSON.parse(fs.readFileSync(path.join(root,'tools','voice-lines.json'),'utf8'));
const voiceContext={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'dist','voice-map.js'),'utf8'),voiceContext);
assert.equal(Object.keys(voiceContext.window.voiceMap).length,voiceLines.length);
const voiceDir=path.join(root,'dist','assets','voice');
for(const {text,file} of voiceLines){
  assert.equal(voiceContext.window.voiceMap[text],file);
  const size=fs.statSync(path.join(voiceDir,file)).size;
  assert(size>1000,`Missing or empty audio: ${file}`);
}
assert(html.includes('src="voice-map.js"'));
console.log(`Verified five levels, 7 safety questions, required elements, and ${voiceLines.length} audio clips.`);
