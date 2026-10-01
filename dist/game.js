const adventures = [
  {icon:'🍒',question:'Катя увидела красивые красные ягоды. Что делать?',voice:'Катя увидела красивые красные ягоды. Можно ли их срывать и есть?',answers:[{icon:'😋🍒',label:'Съесть ягоды',voice:'Сорвать и съесть ягоды'},{icon:'🚫🍒',label:'Не трогать',voice:'Не трогать незнакомые ягоды',correct:true},{icon:'🧺🍒',label:'Собрать в корзину',voice:'Собрать ягоды в корзину'}],praise:'Верно! Незнакомые ягоды могут быть ядовитыми. Не трогай их.'},
  {icon:'🍄',question:'Витя нашёл незнакомый гриб. Что делать?',voice:'Витя нашёл незнакомый гриб. Как ему поступить?',answers:[{icon:'✋🍄',label:'Взять гриб',voice:'Взять гриб в руки'},{icon:'👄🍄',label:'Попробовать',voice:'Попробовать гриб'},{icon:'🚫🍄',label:'Не трогать',voice:'Не трогать гриб и показать взрослому',correct:true}],praise:'Правильно! Незнакомые грибы не трогают. Покажи находку взрослому.'},
  {icon:'🦔',question:'На тропинке сидит ёжик. Как поступить?',voice:'На тропинке сидит ёжик. Можно ли его гладить?',answers:[{icon:'🤲🦔',label:'Погладить',voice:'Погладить ёжика'},{icon:'👀🦔',label:'Смотреть издали',voice:'Посмотреть издали и не трогать',correct:true},{icon:'🍞🦔',label:'Покормить',voice:'Покормить ёжика'}],praise:'Молодец! Диких животных лучше наблюдать издали и не трогать.'},
  {icon:'⛈️',question:'Началась гроза. Где безопаснее укрыться?',voice:'Началась гроза. Где безопаснее укрыться?',answers:[{icon:'🌳⚡',label:'Под деревом',voice:'Под одиноким деревом'},{icon:'🏠✅',label:'В здании',voice:'В прочном здании вместе со взрослым',correct:true},{icon:'🌊⚡',label:'У воды',voice:'У ручья или озера'}],praise:'Верно! При грозе иди со взрослым в прочное здание. Держись подальше от деревьев и воды.'},
  {icon:'🧭',question:'Катя и Витя заблудились. Что делать?',voice:'Катя и Витя заблудились в лесу. Что им делать?',answers:[{icon:'🏃🌲',label:'Бежать дальше',voice:'Бежать дальше по лесу'},{icon:'📍📣',label:'Стоять и звать',voice:'Оставаться на месте, звать на помощь и звонить 112',correct:true},{icon:'🙈🌿',label:'Спрятаться',voice:'Спрятаться в кустах'}],praise:'Отлично! Оставайтесь на месте, зовите на помощь. Если есть телефон, позвоните 112.'},
  {icon:'🧺',question:'После пикника остался мусор. Что делать?',voice:'После пикника остался мусор. Что нужно сделать?',answers:[{icon:'🌲🗑️',label:'Оставить в лесу',voice:'Оставить мусор в лесу'},{icon:'🔥🗑️',label:'Сжечь',voice:'Сжечь мусор'},{icon:'🧤🎒',label:'Унести с собой',voice:'Собрать мусор и унести с собой',correct:true}],praise:'Спасибо! Собери мусор и унеси с собой. Лес останется чистым.'},
  {icon:'💧',question:'Можно ли пить воду из ручья?',voice:'Катя хочет пить. Можно ли пить воду прямо из ручья?',answers:[{icon:'🏞️🥤',label:'Из ручья',voice:'Попить прямо из ручья'},{icon:'🚰🧴',label:'Из бутылки',voice:'Пить чистую воду из бутылки',correct:true},{icon:'🤲💧',label:'Из ладошек',voice:'Зачерпнуть из ручья ладошками'}],praise:'Правильно! Пей чистую воду из бутылки или кипячёную воду. Вода из ручья может быть опасной.'}
];

const $ = id => document.getElementById(id);
let current = 0, solved = false, soundOn = true, speakingTimer;
const stars = $('stars'), answers = $('answers'), synth = window.speechSynthesis;

function speak(lines){
  clearTimeout(speakingTimer);
  if(!soundOn || !synth) return;
  synth.cancel();
  const list = Array.isArray(lines) ? lines : [lines];
  let index = 0;
  const next = () => {
    if(index >= list.length || !soundOn) return;
    const utterance = new SpeechSynthesisUtterance(list[index++]);
    utterance.lang = 'ru-RU'; utterance.rate = .87; utterance.pitch = 1.1;
    const voices = synth.getVoices();
    utterance.voice = voices.find(v => v.lang.toLowerCase().startsWith('ru')) || null;
    utterance.onend = next;
    synth.speak(utterance);
  };
  speakingTimer = setTimeout(next,80);
}

function spokenScene(){
  const a=adventures[current];
  speak([a.voice,'Выбери картинку.',...a.answers.map((x,i)=>`Вариант ${i+1}. ${x.voice}.`)]);
}

function renderStars(){
  stars.innerHTML = '';
  for(let i=0;i<7;i++){
    const star=document.createElement('span');star.className=`star ${i<current+(solved?1:0)?'earned':''}`;
    star.textContent='★';star.setAttribute('aria-hidden','true');stars.append(star);
  }
  stars.setAttribute('aria-label',`Собрано звёзд: ${current+(solved?1:0)} из 7`);
}

function render(){
  const a=adventures[current];solved=false;
  $('sceneNumber').textContent=`ПРИКЛЮЧЕНИЕ ${current+1} ИЗ 7`;
  $('situationIcon').textContent=a.icon;
  $('questionText').textContent=a.question;
  $('speechBubble').textContent='Помоги нам выбрать правильно!';
  $('feedback').textContent='';$('feedback').className='feedback';$('nextButton').hidden=true;
  answers.innerHTML='';
  a.answers.forEach((option,index)=>{
    const button=document.createElement('button');button.type='button';button.className='answer';
    button.setAttribute('aria-label',option.voice);
    button.innerHTML=`<span class="icon" aria-hidden="true">${option.icon}</span><span class="label">${option.label}</span>`;
    button.addEventListener('click',()=>choose(index,button));answers.append(button);
  });
  renderStars();spokenScene();
}

function choose(index,button){
  if(solved || button.classList.contains('wrong')) return;
  const a=adventures[current], option=a.answers[index];
  synth?.cancel();
  if(option.correct){
    solved=true;button.classList.add('correct');
    answers.querySelectorAll('button').forEach(b=>b.disabled=true);
    $('feedback').textContent=a.praise;
    $('speechBubble').textContent=['Спасибо!','Как здорово!','Ты нам помог!'][current%3];
    $('scene').querySelector('.heroes').classList.add('happy');
    setTimeout(()=>$('scene').querySelector('.heroes').classList.remove('happy'),1500);
    $('nextButton').textContent=current===6?'Праздновать ✨':'Дальше ➜';
    $('nextButton').hidden=false;renderStars();speak([option.voice,a.praise,'Катя и Витя говорят: спасибо!']);
  }else{
    button.classList.add('wrong');button.disabled=true;
    $('feedback').className='feedback try-again';$('feedback').textContent='Ой! Попробуй другую картинку.';
    $('speechBubble').textContent='Подумай ещё!';
    speak([option.voice,'Так может быть опасно. Попробуй другую картинку.']);
  }
}

function finish(){
  synth?.cancel();$('ending').hidden=false;
  const confetti=$('confetti');confetti.innerHTML='';
  const colors=['#ffbf36','#ef6b58','#4abc84','#65b5ee','#ec8cc3'];
  for(let i=0;i<60;i++){
    const piece=document.createElement('i');piece.style.left=`${Math.random()*100}%`;
    piece.style.background=colors[i%colors.length];piece.style.animationDelay=`${Math.random()*4}s`;
    piece.style.animationDuration=`${3+Math.random()*3}s`;confetti.append(piece);
  }
  speak('Ура! Вы прошли лес и собрали все семь звёзд! Катя и Витя говорят вам большое спасибо!');
  $('restartButton').focus();
}

$('startButton').addEventListener('click',()=>{$('welcome').hidden=true;render();});
$('nextButton').addEventListener('click',()=>{if(current===6)finish();else{current++;render();}});
$('restartButton').addEventListener('click',()=>{$('ending').hidden=true;current=0;render();});
$('listenButton').addEventListener('click',spokenScene);
$('soundButton').addEventListener('click',()=>{
  soundOn=!soundOn;$('soundButton').textContent=soundOn?'🔊':'🔇';
  $('soundButton').setAttribute('aria-label',soundOn?'Выключить звук':'Включить звук');
  if(soundOn && $('welcome').hidden && $('ending').hidden)spokenScene();else synth?.cancel();
});
renderStars();

