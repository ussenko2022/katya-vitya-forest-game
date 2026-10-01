const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'dist', 'game.js'), 'utf8');
const dataSource = source.slice(0, source.indexOf('const state ='));
const {levels, adventures, habitats, growth, counting, memoryPairs} = vm.runInNewContext(`${dataSource}\n({levels, adventures, habitats, growth, counting, memoryPairs})`);
const lines = new Set();
const add = value => lines.add(value);

for(const adventure of adventures){
  add(adventure.voice);add('Выбери картинку.');
  adventure.answers.forEach((answer,index)=>{
    add(`Вариант ${index+1}. ${answer.voice}.`);
    if(answer.correct)add(`${answer.voice}. ${adventure.praise} Катя и Витя говорят спасибо!`);
    else add(`${answer.voice}. Нет. ${answer.why} Попробуй выбрать другую картинку.`);
  });
}

add('Помоги животным найти домики. Нажми на зверька, потом на его домик.');
add('Сначала нажми на зверька.');
for(const item of habitats){
  add(`${item.name}. Теперь выбери её домик.`);
  add(item.praise);
  add(`Это не домик для ${item.name.toLowerCase()}. ${item.why}`);
}

add('Покажи, как вырастает дерево. Что появляется сначала?');
add('Покажи, как вырастает дерево. Что будет дальше?');
for(const item of growth)add(item.praise);
for(let needed=0;needed<growth.length;needed++)for(let chosen=0;chosen<growth.length;chosen++){
  if(chosen!==needed)add(`Пока рано для ${growth[chosen].name.toLowerCase()}. Сначала найди ${growth[needed].name.toLowerCase()}.`);
}

const words=['один','два','три','четыре'];
for(const item of counting){
  add(`Посчитай. Сколько здесь ${item.many}? Нажми на правильное число.`);
  add(`Верно! Здесь ${item.count} ${item.count===1?item.name:item.many}. Ты хорошо посчитал!`);
  for(const selected of item.options){
    if(selected!==item.count)add(`Это не ${selected}. Давай пересчитаем вместе: ${words.slice(0,item.count).join(', ')}. Попробуй ещё.`);
  }
}

add('Найди две одинаковые картинки. Открой одну карточку, потом другую.');
for(const pair of memoryPairs){
  add(pair.name);
  add(`Пара найдена! Это две одинаковые картинки: ${pair.name}.`);
}
for(const first of memoryPairs)for(const second of memoryPairs){
  if(first!==second)add(`Картинки разные: ${first.name} и ${second.name}. Запомни их места и попробуй снова.`);
}

for(const level of levels)add(`Ура! Уровень ${level.id} пройден! ${level.ending}`);

const list=[...lines].map((text,index)=>({text,file:`${String(index).padStart(3,'0')}.mp3`}));
fs.writeFileSync(path.join(root,'tools','voice-lines.json'),JSON.stringify(list,null,2));
fs.writeFileSync(path.join(root,'dist','voice-map.js'),`window.voiceMap = ${JSON.stringify(Object.fromEntries(list.map(({text,file})=>[text,file])))};\n`);
console.log(`Prepared ${list.length} Russian voice lines.`);
