const $ = id => document.getElementById(id);

const levels = [
  {id:1,icon:'🧭',title:'Безопасная тропа',subtitle:'7 лесных ситуаций',color:'#e99e28',ending:'Вы помогли Кате и Вите безопасно пройти лес!'},
  {id:2,icon:'🐿️',title:'Чей домик?',subtitle:'Соедини зверей с домами',color:'#8ac064',ending:'Все лесные жители нашли свои домики!'},
  {id:3,icon:'🌱',title:'Как растёт дерево?',subtitle:'Разложи по порядку',color:'#6fc3a2',ending:'Из маленького семечка выросло большое дерево!'},
  {id:4,icon:'🦋',title:'Лесной счёт',subtitle:'Сосчитай от 1 до 4',color:'#8dbde9',ending:'Ты отлично посчитал лесные находки!'},
  {id:5,icon:'🍃',title:'Найди пару',subtitle:'Запомни и открой пары',color:'#c59be2',ending:'Ты нашёл все пары и потренировал память!'}
];

const adventures = [
  {icon:'🍒',question:'Катя увидела красивые красные ягоды. Что делать?',voice:'Катя увидела незнакомые красные ягоды. Что ей делать?',answers:[
    {icon:'😋🍒',label:'Съесть ягоды',voice:'Съесть ягоды',why:'Эти ягоды незнакомые. Они могут быть ядовитыми, поэтому есть их нельзя.'},
    {icon:'🚫🍒',label:'Не трогать',voice:'Не трогать незнакомые ягоды',correct:true},
    {icon:'🧺🍒',label:'Собрать ягоды',voice:'Собрать ягоды в корзину',why:'Незнакомые ягоды нельзя собирать: они могут быть ядовитыми. Лучше показать их взрослому.'}
  ],praise:'Правильно! Незнакомые ягоды могут быть ядовитыми. Оставь их на кусте и скажи взрослому.'},
  {icon:'🍄',question:'Витя нашёл незнакомый гриб. Что делать?',voice:'Витя нашёл незнакомый гриб. Как ему поступить?',answers:[
    {icon:'✋🍄',label:'Взять гриб',voice:'Взять гриб в руки',why:'Незнакомый гриб может быть ядовитым. Не бери его в руки и покажи взрослому.'},
    {icon:'👄🍄',label:'Попробовать',voice:'Попробовать гриб',why:'Пробовать лесной гриб очень опасно: он может быть ядовитым.'},
    {icon:'🚫🍄',label:'Не трогать',voice:'Не трогать гриб и показать взрослому',correct:true}
  ],praise:'Верно! Незнакомый гриб нельзя трогать или пробовать. Позови взрослого.'},
  {icon:'🦔',question:'На тропинке сидит ёжик. Как поступить?',voice:'На тропинке сидит ёжик. Как с ним поступить?',answers:[
    {icon:'🤲🦔',label:'Погладить',voice:'Погладить ёжика',why:'Ёжик — дикое животное. Он может испугаться или укусить, поэтому гладить его нельзя.'},
    {icon:'👀🦔',label:'Смотреть издали',voice:'Смотреть на ёжика издали',correct:true},
    {icon:'🍞🦔',label:'Покормить',voice:'Покормить ёжика хлебом',why:'Диких животных нельзя кормить человеческой едой: она может им навредить.'}
  ],praise:'Молодец! На дикого ёжика можно посмотреть издали. Так безопасно и для тебя, и для него.'},
  {icon:'⛈️',question:'Началась гроза. Где безопаснее укрыться?',voice:'Началась гроза. Где безопаснее укрыться?',answers:[
    {icon:'🌳⚡',label:'Под деревом',voice:'Под одиноким деревом',why:'Под одиноким деревом опасно: в него может ударить молния.'},
    {icon:'🏠✅',label:'В здании',voice:'В прочном здании вместе со взрослым',correct:true},
    {icon:'🌊⚡',label:'У воды',voice:'У ручья или озера',why:'Во время грозы рядом с водой опасно. Нужно уйти с взрослым в прочное укрытие.'}
  ],praise:'Правильно! При грозе укройся со взрослым в прочном здании. Держись подальше от воды и одиноких деревьев.'},
  {icon:'🧭',question:'Катя и Витя заблудились. Что делать?',voice:'Катя и Витя заблудились в лесу. Что им делать?',answers:[
    {icon:'🏃🌲',label:'Бежать дальше',voice:'Бежать дальше по лесу',why:'Если бежать дальше, можно уйти ещё дальше от того места, где тебя ищут. Останься на месте.'},
    {icon:'📍📣',label:'Стоять и звать',voice:'Оставаться на месте, звать на помощь и звонить 112',correct:true},
    {icon:'🙈🌿',label:'Спрятаться',voice:'Спрятаться в кустах',why:'Если спрятаться, взрослым будет трудно тебя найти. Останься на месте и громко зови на помощь.'}
  ],praise:'Отлично! Оставайся на месте и зови на помощь. Если есть телефон, позвони 112.'},
  {icon:'🧺',question:'После пикника остался мусор. Что делать?',voice:'После пикника остался мусор. Что нужно сделать?',answers:[
    {icon:'🌲🗑️',label:'Оставить в лесу',voice:'Оставить мусор в лесу',why:'Мусор загрязняет лес и может навредить животным. Его нужно забрать с собой.'},
    {icon:'🔥🗑️',label:'Сжечь',voice:'Сжечь мусор',why:'Огонь может вызвать лесной пожар. Мусор нужно собрать и унести.'},
    {icon:'🧤🎒',label:'Унести с собой',voice:'Собрать мусор и унести с собой',correct:true}
  ],praise:'Спасибо! Собери мусор и унеси с собой. Так лес останется чистым и безопасным для животных.'},
  {icon:'💧',question:'Можно ли пить воду из ручья?',voice:'Катя хочет пить. Можно ли пить воду прямо из ручья?',answers:[
    {icon:'🏞️🥤',label:'Из ручья',voice:'Попить прямо из ручья',why:'В воде ручья могут быть микробы. Даже прозрачную воду нельзя пить без очистки.'},
    {icon:'🚰🧴',label:'Из бутылки',voice:'Пить чистую воду из бутылки',correct:true},
    {icon:'🤲💧',label:'Из ладошек',voice:'Зачерпнуть воду из ручья ладошками',why:'Ладошки не очищают воду. В ручье могут быть микробы, поэтому пить её нельзя.'}
  ],praise:'Верно! Пей чистую воду из бутылки или кипячёную воду. Вода из ручья может быть опасной.'}
];

const habitats = [
  {animal:'🐿️',name:'Белка',home:'🌳',homeName:'Дупло в дереве',why:'Белка живёт в дупле дерева. Найди дерево.',praise:'Да! Белка прячется в дупле дерева.'},
  {animal:'🐸',name:'Лягушка',home:'🏞️',homeName:'Пруд',why:'Лягушке нужна вода. Найди пруд.',praise:'Верно! Лягушка живёт возле воды.'},
  {animal:'🐦',name:'Птица',home:'🪺',homeName:'Гнездо',why:'Птица строит гнездо. Найди гнездо.',praise:'Правильно! Птица живёт в гнезде.'}
];

const growth = [
  {icon:'🌰',name:'Семечко',praise:'Сначала в землю попадает семечко.'},
  {icon:'🌱',name:'Росток',praise:'Из семечка появляется маленький росток.'},
  {icon:'🌿',name:'Саженец',praise:'Росток подрастает и становится саженцем.'},
  {icon:'🌳',name:'Дерево',praise:'Саженец вырастает в большое дерево.'}
];

const counting = [
  {icon:'🐞',name:'божья коровка',many:'божьих коровок',count:1,options:[1,2,3]},
  {icon:'🦋',name:'бабочка',many:'бабочки',count:2,options:[1,2,3]},
  {icon:'🍄',name:'гриб',many:'гриба',count:3,options:[2,3,4]},
  {icon:'🌼',name:'цветок',many:'цветка',count:4,options:[3,4,5]}
];

const memoryPairs = [
  {icon:'🦊',name:'лисичка'},
  {icon:'🦋',name:'бабочка'},
  {icon:'🍄',name:'гриб'}
];

const state = {level:0,step:0,solved:false,selectedAnimal:null,matched:new Set(),growthIndex:0,memoryCards:[],flipped:[],memoryLocked:false,session:0};
let soundOn=true, audioContext, currentAudio, speechTimer, reactionTimer, reactionSpeechTimer, flipTimer;
const synthesis=window.speechSynthesis;
const completed=loadCompleted();

function loadCompleted(){try{return new Set(JSON.parse(localStorage.getItem('forest-levels')||'[]'));}catch{return new Set();}}
function saveCompleted(){try{localStorage.setItem('forest-levels',JSON.stringify([...completed]));}catch{}}

function stopVoice(){clearTimeout(speechTimer);synthesis?.cancel();if(currentAudio){currentAudio.pause();currentAudio=null;}}

function speak(lines){
  stopVoice();
  if(!soundOn) return;
  const queue=Array.isArray(lines)?lines:[lines];
  const session=state.session;let index=0;
  const russianVoice=synthesis?.getVoices().find(v=>v.lang.toLowerCase().startsWith('ru'));
  if(!russianVoice && window.voiceMap){
    const nextAudio=()=>{
      if(index>=queue.length || !soundOn || session!==state.session)return;
      const file=window.voiceMap[queue[index++]];
      if(!file){nextAudio();return;}
      const audio=new Audio(`assets/voice/${file}`);currentAudio=audio;
      audio.onended=nextAudio;audio.onerror=nextAudio;
      audio.play().catch(()=>{currentAudio=null;});
    };
    nextAudio();return;
  }
  if(!synthesis)return;
  const next=()=>{
    if(index>=queue.length || !soundOn || session!==state.session) return;
    const utterance=new SpeechSynthesisUtterance(queue[index++]);
    utterance.lang='ru-RU';utterance.rate=.88;utterance.pitch=1.08;
    utterance.voice=russianVoice||null;
    utterance.onend=next;synthesis.speak(utterance);
  };
  speechTimer=setTimeout(next,70);
}

function playNotes(success){
  if(!soundOn) return;
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx) return;
    audioContext ||= new Ctx();audioContext.resume();
    const now=audioContext.currentTime;
    (success?[523,659,784]:[392,330]).forEach((frequency,index)=>{
      const start=now+index*(success?.12:.16);
      const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
      oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,start);
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(success?.045:.035,start+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,start+(success?.27:.3));
      oscillator.connect(gain);gain.connect(audioContext.destination);
      oscillator.start(start);oscillator.stop(start+(success?.28:.31));
    });
  }catch{}
}

function react(success,message,spoken=message){
  const flash=$('colorFlash'),reaction=$('reaction');
  clearTimeout(reactionTimer);clearTimeout(reactionSpeechTimer);flash.className='color-flash';void flash.offsetWidth;
  flash.classList.add(success?'flash-success':'flash-error');
  reaction.hidden=false;reaction.className=`reaction ${success?'good':'bad'}`;
  reaction.textContent=`${success?'✓':'!'} ${message}`;
  $('explanation').textContent=message;
  $('explanation').className=`explanation ${success?'good':'bad'}`;
  $('speechBubble').textContent=success?'Спасибо!':'Давай подумаем ещё';
  $('sceneHeroes').classList.remove('happy');
  if(success){void $('sceneHeroes').offsetWidth;$('sceneHeroes').classList.add('happy');}
  playNotes(success);
  const session=state.session;
  reactionSpeechTimer=setTimeout(()=>{if(session===state.session)speak(spoken);},success?260:330);
  reactionTimer=setTimeout(()=>{reaction.hidden=true;flash.className='color-flash';},3100);
}

function clearFeedback(){
  clearTimeout(reactionTimer);clearTimeout(reactionSpeechTimer);clearTimeout(flipTimer);$('reaction').hidden=true;
  $('colorFlash').className='color-flash';$('explanation').textContent='';$('explanation').className='explanation';
  $('nextButton').hidden=true;$('speechBubble').textContent='Помоги нам!';
}

function setNext(label,callback){const button=$('nextButton');button.textContent=label;button.onclick=callback;button.hidden=false;}
function progress(done,total){$('sceneProgress').innerHTML=Array.from({length:total},(_,i)=>`<span class="progress-star ${i<done?'filled':''}" aria-hidden="true">★</span>`).join('');$('sceneProgress').setAttribute('aria-label',`Выполнено ${done} из ${total}`);}
function setHeading(kicker,title,instruction,icon){$('activityKicker').textContent=kicker;$('levelTitle').textContent=title;$('instruction').textContent=instruction;$('sceneIllustration').textContent=icon;}

function renderMenu(){
  $('levelGrid').innerHTML=levels.map(level=>`<button class="level-card" type="button" data-level="${level.id}" style="--accent:${level.color}" aria-label="Уровень ${level.id}. ${level.title}. ${level.subtitle}"><span class="level-card-icon" aria-hidden="true">${level.icon}</span><span class="level-card-copy"><small>УРОВЕНЬ ${level.id}</small><strong>${level.title}</strong><span>${level.subtitle}</span></span><span class="level-card-status" aria-hidden="true">${completed.has(level.id)?'⭐':'▶'}</span></button>`).join('');
  $('levelGrid').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>startLevel(Number(button.dataset.level))));
}

function showMenu(){
  state.session++;clearTimeout(reactionTimer);clearTimeout(flipTimer);stopVoice();
  clearFeedback();
  $('ending').hidden=true;$('levelScreen').hidden=true;$('menuScreen').hidden=false;$('menuButton').hidden=true;
  renderMenu();window.scrollTo(0,0);
}

function startLevel(level){
  state.session++;state.level=level;state.step=0;state.solved=false;state.selectedAnimal=null;
  state.matched=new Set();state.growthIndex=0;state.flipped=[];state.memoryLocked=false;
  $('menuScreen').hidden=true;$('ending').hidden=true;$('levelScreen').hidden=false;$('menuButton').hidden=false;
  $('levelBadge').textContent=`УРОВЕНЬ ${level} · ${levels[level-1].title.toUpperCase()}`;
  $('levelScene').className=`level-scene theme-${level}`;
  clearFeedback();window.scrollTo(0,0);
  if(level===1) renderSafety();
  if(level===2) renderHabitat();
  if(level===3) renderGrowth();
  if(level===4) renderCounting();
  if(level===5) renderMemory();
}

function finishLevel(){
  state.session++;stopVoice();completed.add(state.level);saveCompleted();
  const level=levels[state.level-1];
  $('endingTitle').textContent=`Ура! Уровень ${state.level} пройден!`;
  $('endingText').textContent=level.ending;
  $('ending').hidden=false;
  const colors=['#ffd34e','#ff8b72','#7edc9f','#81c7ec','#dda8ec'];
  $('confetti').innerHTML=Array.from({length:55},(_,i)=>`<i style="left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*3}s;animation-duration:${3+Math.random()*3}s"></i>`).join('');
  playNotes(true);speak(`Ура! Уровень ${state.level} пройден! ${level.ending}`);
  $('endingMenuButton').focus();
}

function sceneSpeech(){
  if(state.level===1){const a=adventures[state.step];speak([a.voice,'Выбери картинку.',...a.answers.map((x,i)=>`Вариант ${i+1}. ${x.voice}.`)]);}
  if(state.level===2)speak('Помоги животным найти домики. Нажми на зверька, потом на его домик.');
  if(state.level===3)speak(`Покажи, как вырастает дерево. ${state.growthIndex===0?'Что появляется сначала?':'Что будет дальше?'}`);
  if(state.level===4)speak(`Посчитай. Сколько здесь ${counting[state.step].many}? Нажми на правильное число.`);
  if(state.level===5)speak('Найди две одинаковые картинки. Открой одну карточку, потом другую.');
}

function renderSafety(){
  state.session++;state.solved=false;clearFeedback();
  const a=adventures[state.step];
  setHeading(`СИТУАЦИЯ ${state.step+1} ИЗ 7`,a.question,'Выбери самое безопасное действие.',a.icon);
  progress(state.step,7);
  $('activityContent').innerHTML=`<div class="answer-grid">${a.answers.map((option,index)=>`<button class="answer-card" type="button" data-answer="${index}" aria-label="${option.voice}"><span class="answer-icon" aria-hidden="true">${option.icon}</span><strong>${option.label}</strong></button>`).join('')}</div>`;
  $('activityContent').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>chooseSafety(Number(button.dataset.answer),button)));
  sceneSpeech();window.scrollTo(0,0);
}

function chooseSafety(index,button){
  if(state.solved||button.classList.contains('wrong'))return;
  const a=adventures[state.step],choice=a.answers[index];
  if(choice.correct){
    state.solved=true;button.classList.add('correct');
    $('activityContent').querySelectorAll('button').forEach(item=>item.disabled=true);
    progress(state.step+1,7);react(true,a.praise,`${choice.voice}. ${a.praise} Катя и Витя говорят спасибо!`);
    setNext(state.step===6?'Завершить уровень ✨':'Дальше ➜',()=>{if(state.step===6)finishLevel();else{state.step++;renderSafety();}});
  }else{
    button.classList.add('wrong');button.disabled=true;
    react(false,choice.why,`${choice.voice}. Нет. ${choice.why} Попробуй выбрать другую картинку.`);
  }
}

function renderHabitat(){
  clearFeedback();setHeading('НАЙДИ ДОМ ДЛЯ КАЖДОГО','Чей домик?','Нажми на зверька, потом на его домик.','🐿️');progress(state.matched.size,3);
  $('activityContent').innerHTML=`<div class="match-board"><div class="match-column"><span class="column-label">ЗВЕРЯТА</span>${habitats.map((item,i)=>`<button class="match-card animal ${state.matched.has(i)?'matched':''}" type="button" data-animal="${i}" ${state.matched.has(i)?'disabled':''} aria-label="${item.name}"><span aria-hidden="true">${item.animal}</span><strong>${item.name}</strong></button>`).join('')}</div><div class="match-middle" aria-hidden="true">➜<br>➜<br>➜</div><div class="match-column"><span class="column-label">ДОМИКИ</span>${[2,0,1].map(i=>`<button class="match-card home ${state.matched.has(i)?'matched':''}" type="button" data-home="${i}" ${state.matched.has(i)?'disabled':''} aria-label="${habitats[i].homeName}"><span aria-hidden="true">${habitats[i].home}</span><strong>${habitats[i].homeName}</strong></button>`).join('')}</div></div>`;
  $('activityContent').querySelectorAll('[data-animal]').forEach(button=>button.addEventListener('click',()=>{
    state.selectedAnimal=Number(button.dataset.animal);
    $('activityContent').querySelectorAll('.animal').forEach(item=>item.classList.toggle('selected',item===button));
    speak(`${habitats[state.selectedAnimal].name}. Теперь выбери её домик.`);
  }));
  $('activityContent').querySelectorAll('[data-home]').forEach(button=>button.addEventListener('click',()=>{
    if(state.selectedAnimal===null){speak('Сначала нажми на зверька.');return;}
    const animal=state.selectedAnimal,home=Number(button.dataset.home),item=habitats[animal];
    if(animal===home){state.matched.add(animal);state.selectedAnimal=null;
      $('activityContent').querySelector(`[data-animal="${animal}"]`).classList.remove('selected');
      $('activityContent').querySelector(`[data-animal="${animal}"]`).classList.add('matched');
      $('activityContent').querySelector(`[data-animal="${animal}"]`).disabled=true;
      button.classList.add('matched');button.disabled=true;progress(state.matched.size,3);
      react(true,item.praise);
      if(state.matched.size===3)setNext('Завершить уровень ✨',finishLevel);
    }else react(false,item.why,`Это не домик для ${item.name.toLowerCase()}. ${item.why}`);
  }));
  sceneSpeech();
}

function renderGrowth(){
  clearFeedback();setHeading('ЧТО ЗА ЧЕМ?','Как растёт дерево?','Нажимай картинки по порядку: от самого маленького к большому.',state.growthIndex?growth[state.growthIndex-1].icon:'🌰');progress(state.growthIndex,4);
  const order=[3,0,2,1];
  $('activityContent').innerHTML=`<div class="growth-path">${growth.map((item,i)=>`<div class="growth-slot ${i<state.growthIndex?'filled':''}" aria-label="Шаг ${i+1}">${i<state.growthIndex?item.icon:'?'}</div>`).join('')}</div><div class="growth-options">${order.map(i=>`<button class="growth-card ${i<state.growthIndex?'used':''}" type="button" data-growth="${i}" ${i<state.growthIndex?'disabled':''} aria-label="${growth[i].name}"><span aria-hidden="true">${growth[i].icon}</span><strong>${growth[i].name}</strong></button>`).join('')}</div>`;
  $('activityContent').querySelectorAll('[data-growth]').forEach(button=>button.addEventListener('click',()=>{
    const chosen=Number(button.dataset.growth);
    if(chosen===state.growthIndex){
      const item=growth[chosen];state.growthIndex++;button.classList.add('used');button.disabled=true;
      $('activityContent').querySelectorAll('.growth-slot')[chosen].textContent=item.icon;
      $('activityContent').querySelectorAll('.growth-slot')[chosen].classList.add('filled');
      $('sceneIllustration').textContent=item.icon;progress(state.growthIndex,4);
      react(true,item.praise);
      if(state.growthIndex===4)setNext('Завершить уровень ✨',finishLevel);
    }else{
      const needed=growth[state.growthIndex];
      react(false,`${growth[chosen].name} появится позже. Сейчас найди: ${needed.name.toLowerCase()}.`,`Пока рано для ${growth[chosen].name.toLowerCase()}. Сначала найди ${needed.name.toLowerCase()}.`);
    }
  }));
  sceneSpeech();
}

function renderCounting(){
  state.session++;state.solved=false;clearFeedback();
  const item=counting[state.step];
  setHeading(`СЧИТАЕМ · ${state.step+1} ИЗ 4`,'Лесной счёт',`Сколько здесь ${item.many}? Посчитай и нажми на число.`,item.icon);progress(state.step,4);
  $('activityContent').innerHTML=`<div class="count-garden" aria-label="Предметов: ${item.count}">${Array.from({length:item.count},()=>`<span aria-hidden="true">${item.icon}</span>`).join('')}</div><div class="count-options">${item.options.map(number=>`<button class="count-card" type="button" data-count="${number}" aria-label="${number}"><strong>${number}</strong><span aria-hidden="true">${'●'.repeat(number)}</span></button>`).join('')}</div>`;
  $('activityContent').querySelectorAll('[data-count]').forEach(button=>button.addEventListener('click',()=>{
    if(state.solved)return;
    const selected=Number(button.dataset.count);
    if(selected===item.count){
      state.solved=true;button.classList.add('correct');
      $('activityContent').querySelectorAll('button').forEach(b=>b.disabled=true);
      progress(state.step+1,4);
      react(true,`Да! Здесь ${item.count} ${item.count===1?item.name:item.many}.`,`Верно! Здесь ${item.count} ${item.count===1?item.name:item.many}. Ты хорошо посчитал!`);
      setNext(state.step===3?'Завершить уровень ✨':'Дальше ➜',()=>{if(state.step===3)finishLevel();else{state.step++;renderCounting();}});
    }else{
      button.classList.add('wrong');button.disabled=true;
      const words=['один','два','три','четыре'];
      react(false,`Давай пересчитаем: ${words.slice(0,item.count).join(', ')}. Попробуй ещё.`,`Это не ${selected}. Давай пересчитаем вместе: ${words.slice(0,item.count).join(', ')}. Попробуй ещё.`);
    }
  }));
  sceneSpeech();
}

function shuffle(items){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}

function renderMemory(){
  clearFeedback();state.matched=new Set();state.flipped=[];state.memoryLocked=false;
  state.memoryCards=shuffle([...memoryPairs,...memoryPairs].map((item,index)=>({...item,pair:index%3})));
  setHeading('ЗАПОМНИ КАРТИНКИ','Найди пару','Открывай две карточки и ищи одинаковые картинки.','🍃');progress(0,3);
  $('activityContent').innerHTML=`<div class="memory-grid">${state.memoryCards.map((item,index)=>`<button class="memory-card" type="button" data-card="${index}" aria-label="Закрытая карточка ${index+1}"><span class="card-back" aria-hidden="true">🍃</span><span class="card-front" aria-hidden="true">${item.icon}</span></button>`).join('')}</div>`;
  $('activityContent').querySelectorAll('[data-card]').forEach(button=>button.addEventListener('click',()=>flipMemory(Number(button.dataset.card),button)));
  sceneSpeech();
}

function flipMemory(index,button){
  if(state.memoryLocked||state.flipped.includes(index)||state.matched.has(state.memoryCards[index].pair))return;
  const card=state.memoryCards[index];button.classList.add('flipped');button.setAttribute('aria-label',card.name);
  state.flipped.push(index);
  if(state.flipped.length===1){speak(card.name);return;}
  const [firstIndex,secondIndex]=state.flipped;
  const first=state.memoryCards[firstIndex],second=state.memoryCards[secondIndex];
  state.memoryLocked=true;
  if(first.pair===second.pair){
    state.matched.add(first.pair);
    [firstIndex,secondIndex].forEach(i=>{$('activityContent').querySelector(`[data-card="${i}"]`).classList.add('matched');$('activityContent').querySelector(`[data-card="${i}"]`).disabled=true;});
    progress(state.matched.size,3);state.flipped=[];state.memoryLocked=false;
    react(true,`Пара найдена! Это две одинаковые картинки: ${first.name}.`);
    if(state.matched.size===3)setNext('Завершить уровень ✨',finishLevel);
  }else{
    react(false,`Картинки разные: ${first.name} и ${second.name}. Запомни их места и попробуй снова.`);
    const session=state.session;
    flipTimer=setTimeout(()=>{
      if(session!==state.session)return;
      [firstIndex,secondIndex].forEach(i=>{const element=$('activityContent').querySelector(`[data-card="${i}"]`);element.classList.remove('flipped');element.setAttribute('aria-label',`Закрытая карточка ${i+1}`);});
      state.flipped=[];state.memoryLocked=false;
    },1500);
  }
}

$('menuButton').addEventListener('click',showMenu);
$('endingMenuButton').addEventListener('click',showMenu);
$('replayButton').addEventListener('click',()=>startLevel(state.level));
$('listenButton').addEventListener('click',sceneSpeech);
$('soundButton').addEventListener('click',()=>{
  soundOn=!soundOn;$('soundButton').textContent=soundOn?'🔊':'🔇';
  $('soundButton').setAttribute('aria-label',soundOn?'Выключить звук':'Включить звук');
  if(!soundOn)stopVoice();else if(state.level && !$('levelScreen').hidden)sceneSpeech();
});
renderMenu();
