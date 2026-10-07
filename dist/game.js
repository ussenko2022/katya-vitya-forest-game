const $ = id => document.getElementById(id);
const GAME = window.GAME_CONTENT;
let locale = 'ru';
let voiceMode = 'female';
let soundOn = true;
let audioContext, currentAudio, speechTimer, reactionTimer, reactionSpeechTimer, flipTimer;
let speechGeneration = 0, feedbackGeneration = 0;
const synthesis = window.speechSynthesis;
const state = {level:0,step:0,solved:false,selectedAnimal:null,matched:new Set(),growthIndex:0,memoryCards:[],flipped:[],memoryLocked:false,stageIndex:0,stageOrder:[],foundForest:new Set(),excludedForest:new Set(),sortedTrash:new Set(),selectedTrash:null,session:0};
const completed = loadCompleted();

const data = () => GAME[locale];
const ui = key => data().ui[key];
const format = (template, values) => template.replace(/\{(\w+)\}/g,(_,key)=>values[key] ?? '');

function loadCompleted(){try{return new Set(JSON.parse(localStorage.getItem('forest-levels')||'[]'));}catch{return new Set();}}
function saveCompleted(){try{localStorage.setItem('forest-levels',JSON.stringify([...completed]));}catch{}}
function browserVoice(){const prefix=locale==='kk'?'kk':'ru';return synthesis?.getVoices().find(v=>v.lang.toLowerCase().startsWith(prefix));}
function stopVoice(){
  speechGeneration++;
  clearTimeout(speechTimer);
  synthesis?.cancel();
  if(currentAudio){
    currentAudio.onended=null;currentAudio.onerror=null;
    currentAudio.pause();currentAudio=null;
  }
}

function updateVoiceWarning(){
  const warning=$('voiceWarning');let message='';
  if(voiceMode==='browser' && !browserVoice())message=ui('browserNoVoice');
  if(voiceMode!=='browser' && !window.VOICE_ASSETS?.[locale]?.[voiceMode])message=ui('audioMissing');
  warning.textContent=message;warning.hidden=!message;
}
function showVoiceWarning(message){const warning=$('voiceWarning');warning.textContent=message;warning.hidden=false;}

function speak(lines){
  clearTimeout(reactionSpeechTimer);
  stopVoice();
  if(!soundOn)return;
  const queue=(Array.isArray(lines)?lines:[lines]).filter(Boolean);
  const session=state.session,generation=speechGeneration;let index=0;
  if(voiceMode!=='browser'){
    const assets=window.VOICE_ASSETS?.[locale]?.[voiceMode]||{};
    const nextAudio=()=>{
      if(index>=queue.length||!soundOn||session!==state.session||generation!==speechGeneration)return;
      const file=assets[queue[index++]];
      if(!file){showVoiceWarning(ui('audioMissing'));nextAudio();return;}
      const audio=new Audio(file);currentAudio=audio;
      audio.onended=()=>{if(currentAudio===audio){currentAudio=null;nextAudio();}};
      audio.onerror=()=>{if(currentAudio===audio){currentAudio=null;showVoiceWarning(ui('audioMissing'));nextAudio();}};
      audio.play().catch(()=>{if(currentAudio===audio&&generation===speechGeneration){currentAudio=null;showVoiceWarning(ui('audioMissing'));}});
    };
    nextAudio();return;
  }
  const voice=browserVoice();
  if(!voice){updateVoiceWarning();return;}
  const next=()=>{
    if(index>=queue.length||!soundOn||session!==state.session||generation!==speechGeneration)return;
    const utterance=new SpeechSynthesisUtterance(queue[index++]);
    utterance.lang=locale==='kk'?'kk-KZ':'ru-RU';utterance.voice=voice;
    utterance.rate=.88;utterance.pitch=1.06;utterance.onend=next;utterance.onerror=next;
    synthesis.speak(utterance);
  };
  speechTimer=setTimeout(next,160);
}

function playNotes(success){
  if(!soundOn)return;
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
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

function react(success,message,spoken=[message]){
  const flash=$('colorFlash');
  const immersive=state.level>=6&&!$('immersiveStage').hidden;
  const feedback=immersive?$('stageFeedback'):$('explanation');
  stopVoice();feedbackGeneration++;
  clearTimeout(reactionTimer);clearTimeout(reactionSpeechTimer);
  flash.className='color-flash';void flash.offsetWidth;
  flash.classList.add(success?'flash-success':'flash-error');
  feedback.textContent=`${success?'✓':'!'} ${message}`;feedback.className=`${immersive?'stage-feedback':'explanation'} ${success?'good':'bad'}`;
  (immersive?$('stageBubble'):$('speechBubble')).textContent=success?ui('speechThanks'):ui('speechTry');
  for(const hero of (immersive?[$('stageKatya'),$('stageVitya')]:[$('sceneHeroes')])){
    if(success&&!hero.classList.contains('happy'))hero.classList.add('happy');
  }
  playNotes(success);
  const session=state.session,generation=feedbackGeneration;
  reactionSpeechTimer=setTimeout(()=>{if(session===state.session&&generation===feedbackGeneration)speak(spoken);},success?260:330);
  reactionTimer=setTimeout(()=>{if(generation===feedbackGeneration)flash.className='color-flash';},1600);
}

function clearFeedback(){
  feedbackGeneration++;stopVoice();
  clearTimeout(reactionTimer);clearTimeout(reactionSpeechTimer);clearTimeout(flipTimer);
  $('colorFlash').className='color-flash';
  for(const hero of [$('sceneHeroes'),$('stageKatya'),$('stageVitya')])hero.classList.remove('happy');
  $('explanation').textContent='';$('explanation').className='explanation';
  $('stageFeedback').textContent='';$('stageFeedback').className='stage-feedback';
  $('nextButton').hidden=true;$('stageNextButton').hidden=true;
  $('speechBubble').textContent=ui('speechBubble');$('stageBubble').textContent=ui('speechBubble');
}
function setNext(label,callback){const button=state.level>=6?$('stageNextButton'):$('nextButton');button.textContent=label;button.onclick=callback;button.hidden=false;}
function progress(done,total){
  const element=state.level>=6?$('stageProgress'):$('sceneProgress');
  element.innerHTML=Array.from({length:total},(_,i)=>`<span class="progress-star ${i<done?'filled':''}" aria-hidden="true">★</span>`).join('');
  element.setAttribute('aria-label',format(ui('progress'),{done,total}));
}
function setHeading(kicker,title,instruction,icon){$('activityKicker').textContent=kicker;$('levelTitle').textContent=title;$('instruction').textContent=instruction;$('sceneIllustration').textContent=icon;}

function applyLocale(){
  document.documentElement.lang=locale;
  document.title=data().ui.brandTitle;
  document.querySelector('.brand small').textContent=ui('brandSmall');
  document.querySelector('.brand strong').textContent=ui('brandTitle');
  $('menuButton').querySelector('span').textContent=ui('menu');
  $('menuButton').setAttribute('aria-label',ui('menu'));
  $('languageLabel').textContent=locale==='ru'?'Язык':'Тіл';
  $('voiceLabel').textContent=locale==='ru'?'Озвучка':'Дыбыс';
  $('voiceSelect').options[0].textContent=ui('voiceFemale');
  $('voiceSelect').options[1].textContent=ui('voiceMale');
  $('voiceSelect').options[2].textContent=ui('voiceBrowser');
  document.querySelector('.menu-copy .kicker').textContent=ui('menuKicker');
  $('menuTitle').textContent=ui('menuTitle');
  document.querySelector('.menu-copy p').textContent=ui('menuIntro');
  $('menuHint').textContent=ui('menuHint');$('aiDisclosure').textContent=ui('aiDisclosure');
  $('listenButton').querySelector('span').textContent=ui('listen');
  $('stageListenButton').querySelector('span').textContent=ui('listen');
  $('soundButton').setAttribute('aria-label',soundOn?(locale==='ru'?'Выключить звук':'Дыбысты өшіру'):(locale==='ru'?'Включить звук':'Дыбысты қосу'));
  $('endingMenuButton').textContent=ui('chooseGame');$('replayButton').textContent=ui('again');
  document.querySelector('.level-footer').textContent=ui('footer');
  renderMenu();updateVoiceWarning();
  if(state.level && !$('levelScreen').hidden){
    if(state.level<6)$('levelBadge').textContent=`${ui('level')} ${state.level} · ${data().levels[state.level-1].title.toUpperCase()}`;
    if(state.level===1)renderSafety(false);
    if(state.level===2)renderHabitat(false);
    if(state.level===3)renderGrowth(false);
    if(state.level===4)renderCounting(false);
    if(state.level===5)renderMemory(false);
    if(state.level===6)renderForestAnimals(false);
    if(state.level===7)renderRecycling(false);
    if([2,3,5,6,7].includes(state.level))sceneSpeech();
  }
  if(!$('ending').hidden){
    $('endingTitle').textContent=format(ui('finished'),{n:state.level});
    $('endingText').textContent=data().levels[state.level-1].ending;
  }
}

function renderMenu(){
  $('levelGrid').innerHTML=data().levels.map(level=>`<button class="level-card" type="button" data-level="${level.id}" style="--accent:${level.color}" aria-label="${ui('level')} ${level.id}. ${level.title}. ${level.subtitle}"><span class="level-card-icon" aria-hidden="true">${level.icon}</span><span class="level-card-copy"><small>${ui('level')} ${level.id}</small><strong>${level.title}</strong><span>${level.subtitle}</span></span><span class="level-card-status" aria-hidden="true">${completed.has(level.id)?'⭐':'▶'}</span></button>`).join('');
  $('levelGrid').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>startLevel(Number(button.dataset.level))));
}

function showMenu(){
  state.session++;stopVoice();clearFeedback();
  $('ending').hidden=true;$('levelScreen').hidden=true;$('menuScreen').hidden=false;$('menuButton').hidden=true;
  renderMenu();window.scrollTo(0,0);
}

function startLevel(level){
  state.session++;state.level=level;state.step=0;state.solved=false;state.selectedAnimal=null;
  state.matched=new Set();state.growthIndex=0;state.flipped=[];state.memoryLocked=false;state.memoryCards=[];
  state.stageIndex=0;state.stageOrder=[];state.foundForest=new Set();state.excludedForest=new Set();state.sortedTrash=new Set();state.selectedTrash=null;
  $('menuScreen').hidden=true;$('ending').hidden=true;$('levelScreen').hidden=false;$('menuButton').hidden=false;
  const immersive=level>=6;
  $('levelScreen').classList.toggle('immersive-mode',immersive);
  $('levelScene').hidden=immersive;document.querySelector('.activity-panel').hidden=immersive;$('immersiveStage').hidden=!immersive;
  if(!immersive)$('levelBadge').textContent=`${ui('level')} ${level} · ${data().levels[level-1].title.toUpperCase()}`;
  $('levelScene').className=`level-scene theme-${level}`;
  clearFeedback();window.scrollTo(0,0);
  if(level===1)renderSafety();
  if(level===2)renderHabitat();
  if(level===3)renderGrowth();
  if(level===4)renderCounting();
  if(level===5)renderMemory();
  if(level===6)renderForestAnimals();
  if(level===7)renderRecycling();
}

function finishLevel(){
  state.session++;stopVoice();completed.add(state.level);saveCompleted();
  const level=data().levels[state.level-1];
  $('endingTitle').textContent=format(ui('finished'),{n:state.level});
  $('endingText').textContent=level.ending;$('ending').hidden=false;
  const colors=['#ffd34e','#ff8b72','#7edc9f','#81c7ec','#dda8ec'];
  $('confetti').innerHTML=Array.from({length:55},(_,i)=>`<i style="left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*3}s;animation-duration:${3+Math.random()*3}s"></i>`).join('');
  playNotes(true);speak([format(ui('finished'),{n:state.level}),level.ending]);
  $('endingMenuButton').focus();
}

function sceneSpeech(){
  if(state.level===1){const a=data().adventures[state.step];speak([a.voice,data().speech.choosePicture,...a.answers.map(answer=>answer.voice)]);}
  if(state.level===2)speak(data().speech.habitatIntro);
  if(state.level===3)speak(data().speech.growthIntro);
  if(state.level===4)speak(data().counting[state.step].prompt);
  if(state.level===5)speak(data().speech.memoryIntro);
  if(state.level===6)speak(data().forestStages[state.stageIndex].intro);
  if(state.level===7)speak(data().recyclingStages[state.stageIndex].intro);
}

function renderSafety(reset=true){
  state.session++;if(reset)state.solved=false;clearFeedback();
  const a=data().adventures[state.step];
  setHeading(`${ui('situation')} ${state.step+1} ${ui('of')} 7`,a.question,ui('safetyInstruction'),a.icon);
  progress(state.step+(state.solved?1:0),7);
  $('activityContent').innerHTML=`<div class="answer-grid">${a.answers.map((option,index)=>`<button class="answer-card ${state.solved&&option.correct?'correct':''}" type="button" data-answer="${index}" ${state.solved?'disabled':''} aria-label="${option.voice}"><span class="answer-icon" aria-hidden="true">${option.icon}</span><strong>${option.label}</strong></button>`).join('')}</div>`;
  $('activityContent').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>chooseSafety(Number(button.dataset.answer),button)));
  if(state.solved){$('explanation').textContent=a.praise;$('explanation').className='explanation good';setNext(state.step===6?ui('finish'):ui('next'),()=>{if(state.step===6)finishLevel();else{state.step++;renderSafety();}});}
  sceneSpeech();window.scrollTo(0,0);
}

function chooseSafety(index,button){
  if(state.solved||button.classList.contains('wrong'))return;
  const a=data().adventures[state.step],choice=a.answers[index];
  if(choice.correct){
    state.solved=true;button.classList.add('correct');
    $('activityContent').querySelectorAll('button').forEach(item=>item.disabled=true);
    progress(state.step+1,7);
    react(true,a.praise,[choice.voice,a.praise,data().speech.thanks]);
    setNext(state.step===6?ui('finish'):ui('next'),()=>{if(state.step===6)finishLevel();else{state.step++;renderSafety();}});
  }else{
    button.classList.add('wrong');button.disabled=true;
    react(false,choice.why,[choice.voice,data().speech.no,choice.why,data().speech.tryAgain]);
  }
}

function renderHabitat(announce=true){
  clearFeedback();state.selectedAnimal=null;
  setHeading(ui('habitatKicker'),data().levels[1].title,ui('habitatInstruction'),'🐿️');progress(state.matched.size,3);
  const habitats=data().habitats;
  $('activityContent').innerHTML=`<div class="match-board"><div class="match-column"><span class="column-label">${ui('animals')}</span>${habitats.map((item,i)=>`<button class="match-card animal ${state.matched.has(i)?'matched':''}" type="button" data-animal="${i}" ${state.matched.has(i)?'disabled':''} aria-label="${item.name}"><span aria-hidden="true">${item.animal}</span><strong>${item.name}</strong></button>`).join('')}</div><div class="match-middle" aria-hidden="true">➜<br>➜<br>➜</div><div class="match-column"><span class="column-label">${ui('homes')}</span>${[2,0,1].map(i=>`<button class="match-card home ${state.matched.has(i)?'matched':''}" type="button" data-home="${i}" ${state.matched.has(i)?'disabled':''} aria-label="${habitats[i].homeName}"><span aria-hidden="true">${habitats[i].home}</span><strong>${habitats[i].homeName}</strong></button>`).join('')}</div></div>`;
  $('activityContent').querySelectorAll('[data-animal]').forEach(button=>button.addEventListener('click',()=>{
    state.selectedAnimal=Number(button.dataset.animal);
    $('activityContent').querySelectorAll('.animal').forEach(item=>item.classList.toggle('selected',item===button));
    speak([habitats[state.selectedAnimal].name,data().speech.chooseHome]);
  }));
  $('activityContent').querySelectorAll('[data-home]').forEach(button=>button.addEventListener('click',()=>{
    if(state.selectedAnimal===null){speak(data().speech.chooseAnimalFirst);return;}
    const animal=state.selectedAnimal,home=Number(button.dataset.home),item=habitats[animal];
    if(animal===home){
      state.matched.add(animal);state.selectedAnimal=null;
      const animalButton=$('activityContent').querySelector(`[data-animal="${animal}"]`);
      animalButton.classList.remove('selected');animalButton.classList.add('matched');animalButton.disabled=true;
      button.classList.add('matched');button.disabled=true;progress(state.matched.size,3);
      react(true,item.praise,[item.homeName,item.praise]);
      if(state.matched.size===3)setNext(ui('finish'),finishLevel);
    }else react(false,item.why,[habitats[home].homeName,data().speech.notHome,item.why]);
  }));
  if(state.matched.size===3)setNext(ui('finish'),finishLevel);
  if(announce)sceneSpeech();
}

function renderGrowth(announce=true){
  clearFeedback();const growth=data().growth;
  setHeading(ui('growthKicker'),data().levels[2].title,ui('growthInstruction'),state.growthIndex?growth[state.growthIndex-1].icon:'🌰');progress(state.growthIndex,4);
  const order=[3,0,2,1];
  $('activityContent').innerHTML=`<div class="growth-path">${growth.map((item,i)=>`<div class="growth-slot ${i<state.growthIndex?'filled':''}" aria-label="${format(ui('step'),{n:i+1})}">${i<state.growthIndex?item.icon:'?'}</div>`).join('')}</div><div class="growth-options">${order.map(i=>`<button class="growth-card ${i<state.growthIndex?'used':''}" type="button" data-growth="${i}" ${i<state.growthIndex?'disabled':''} aria-label="${growth[i].name}"><span aria-hidden="true">${growth[i].icon}</span><strong>${growth[i].name}</strong></button>`).join('')}</div>`;
  $('activityContent').querySelectorAll('[data-growth]').forEach(button=>button.addEventListener('click',()=>{
    const chosen=Number(button.dataset.growth);
    if(chosen===state.growthIndex){
      const item=growth[chosen];state.growthIndex++;button.classList.add('used');button.disabled=true;
      $('activityContent').querySelectorAll('.growth-slot')[chosen].textContent=item.icon;
      $('activityContent').querySelectorAll('.growth-slot')[chosen].classList.add('filled');
      $('sceneIllustration').textContent=item.icon;progress(state.growthIndex,4);
      react(true,item.praise);
      if(state.growthIndex===4)setNext(ui('finish'),finishLevel);
    }else{
      const needed=growth[state.growthIndex];
      react(false,`${data().speech.tooEarly} ${needed.name}`, [growth[chosen].name,data().speech.tooEarly,needed.name]);
    }
  }));
  if(state.growthIndex===4)setNext(ui('finish'),finishLevel);
  if(announce)sceneSpeech();
}

function renderCounting(reset=true){
  state.session++;if(reset)state.solved=false;clearFeedback();
  const item=data().counting[state.step];
  setHeading(`${ui('countKicker')} · ${state.step+1} ${ui('of')} 4`,data().levels[3].title,item.prompt,item.icon);
  progress(state.step+(state.solved?1:0),4);
  $('activityContent').innerHTML=`<div class="count-garden" aria-label="${item.count}">${Array.from({length:item.count},()=>`<span aria-hidden="true">${item.icon}</span>`).join('')}</div><div class="count-options">${item.options.map(number=>`<button class="count-card ${state.solved&&number===item.count?'correct':''}" type="button" data-count="${number}" ${state.solved?'disabled':''} aria-label="${number}"><strong>${number}</strong><span aria-hidden="true">${'●'.repeat(number)}</span></button>`).join('')}</div>`;
  $('activityContent').querySelectorAll('[data-count]').forEach(button=>button.addEventListener('click',()=>{
    if(state.solved)return;
    const selected=Number(button.dataset.count);
    if(selected===item.count){
      state.solved=true;button.classList.add('correct');
      $('activityContent').querySelectorAll('button').forEach(b=>b.disabled=true);
      progress(state.step+1,4);react(true,item.praise,[data().numberWords[selected-1],item.praise]);
      setNext(state.step===3?ui('finish'):ui('next'),()=>{if(state.step===3)finishLevel();else{state.step++;renderCounting();}});
    }else{button.classList.add('wrong');button.disabled=true;react(false,item.wrong,[data().numberWords[selected-1],item.wrong]);}
  }));
  if(state.solved){$('explanation').textContent=item.praise;$('explanation').className='explanation good';setNext(state.step===3?ui('finish'):ui('next'),()=>{if(state.step===3)finishLevel();else{state.step++;renderCounting();}});}
  sceneSpeech();
}

function shuffle(items){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}

function renderMemory(reset=true){
  clearFeedback();
  if(reset){state.matched=new Set();state.flipped=[];state.memoryLocked=false;state.memoryCards=shuffle([0,1,2,0,1,2]);}
  else{state.flipped=[];state.memoryLocked=false;}
  setHeading(ui('memoryKicker'),data().levels[4].title,ui('memoryInstruction'),'🍃');progress(state.matched.size,3);
  $('activityContent').innerHTML=`<div class="memory-grid">${state.memoryCards.map((pair,index)=>`<button class="memory-card ${state.matched.has(pair)?'flipped matched':''}" type="button" data-card="${index}" ${state.matched.has(pair)?'disabled':''} aria-label="${state.matched.has(pair)?data().memoryPairs[pair].name:format(ui('closedCard'),{n:index+1})}"><span class="card-back" aria-hidden="true">🍃</span><span class="card-front" aria-hidden="true">${data().memoryPairs[pair].icon}</span></button>`).join('')}</div>`;
  $('activityContent').querySelectorAll('[data-card]').forEach(button=>button.addEventListener('click',()=>flipMemory(Number(button.dataset.card),button)));
  if(state.matched.size===3)setNext(ui('finish'),finishLevel);
  if(reset)sceneSpeech();
}

function flipMemory(index,button){
  if(state.memoryLocked||state.flipped.includes(index)||state.matched.has(state.memoryCards[index]))return;
  const pair=state.memoryCards[index],item=data().memoryPairs[pair];
  button.classList.add('flipped');button.setAttribute('aria-label',item.name);state.flipped.push(index);
  if(state.flipped.length===1){speak(item.name);return;}
  const [firstIndex,secondIndex]=state.flipped;
  const first=state.memoryCards[firstIndex],second=state.memoryCards[secondIndex];
  state.memoryLocked=true;
  if(first===second){
    state.matched.add(first);
    [firstIndex,secondIndex].forEach(i=>{const card=$('activityContent').querySelector(`[data-card="${i}"]`);card.classList.add('matched');card.disabled=true;});
    progress(state.matched.size,3);state.flipped=[];state.memoryLocked=false;
    react(true,data().speech.memoryPair,[data().speech.memoryPair,data().memoryPairs[first].name]);
    if(state.matched.size===3)setNext(ui('finish'),finishLevel);
  }else{
    react(false,data().speech.memoryDifferent);
    const session=state.session;
    flipTimer=setTimeout(()=>{
      if(session!==state.session)return;
      [firstIndex,secondIndex].forEach(i=>{const card=$('activityContent').querySelector(`[data-card="${i}"]`);card.classList.remove('flipped');card.setAttribute('aria-label',format(ui('closedCard'),{n:i+1}));});
      state.flipped=[];state.memoryLocked=false;
    },1500);
  }
}

function prepareStage(stage, kicker, done, total){
  if(!/^(forest|riverbank|shallows|twilight-forest)\.png$/.test(stage.background))throw new Error('Unexpected stage background');
  $('stageWorld').style.backgroundImage=`url('assets/${stage.background}')`;
  $('stageKicker').textContent=kicker;
  $('stageTitle').textContent=stage.title;
  $('stagePrompt').textContent=stage.intro;
  $('stageCounter').textContent=format(ui('stageOf'),{n:state.stageIndex+1,total:3});
  progress(done,total);
}

function completeStage(done,total){
  if(done!==total)return;
  setNext(state.stageIndex===2?ui('finish'):ui('nextStage'),state.stageIndex===2?finishLevel:advanceStage);
}

function advanceStage(){
  state.stageIndex++;
  state.stageOrder=[];
  state.foundForest=new Set();state.excludedForest=new Set();
  state.sortedTrash=new Set();state.selectedTrash=null;
  if(state.level===6)renderForestAnimals();else renderRecycling();
}

function renderForestAnimals(announce=true){
  clearFeedback();
  const stage=data().forestStages[state.stageIndex],catalog=data().forestAnimals;
  if(state.stageOrder.length!==stage.animalIds.length)state.stageOrder=shuffle(stage.animalIds);
  const total=stage.animalIds.filter(id=>catalog[id].forest).length;
  prepareStage(stage,ui('forestKicker'),state.foundForest.size,total);
  $('stagePlayfield').innerHTML=`<div class="animal-field">${state.stageOrder.map(id=>{
    const animal=catalog[id],found=state.foundForest.has(id),excluded=state.excludedForest.has(id);
    return `<button class="world-animal ${found?'found':''} ${excluded?'ruled-out':''}" type="button" data-forest-animal="${id}" ${found||excluded?'disabled':''} aria-label="${animal.name}"><span class="world-icon" aria-hidden="true">${animal.icon}</span><span class="world-label">${animal.name}</span></button>`;
  }).join('')}</div>`;
  $('stagePlayfield').querySelectorAll('[data-forest-animal]').forEach(button=>button.addEventListener('click',()=>{
    const id=Number(button.dataset.forestAnimal),animal=catalog[id];
    if(animal.forest){
      state.foundForest.add(id);button.classList.add('found');button.disabled=true;
      progress(state.foundForest.size,total);react(true,animal.praise,[animal.name,animal.praise]);
      completeStage(state.foundForest.size,total);
    }else{
      state.excludedForest.add(id);button.classList.add('ruled-out');button.disabled=true;
      react(false,animal.why,[animal.name,animal.why]);
    }
  }));
  completeStage(state.foundForest.size,total);
  if(announce)sceneSpeech();
}

function renderRecycling(announce=true){
  clearFeedback();state.selectedTrash=null;
  const stage=data().recyclingStages[state.stageIndex],catalog=data().recyclingItems;
  const bins=stage.binIds.map(id=>data().recyclingBins.find(bin=>bin.id===id));
  if(state.stageOrder.length!==stage.itemIds.length)state.stageOrder=shuffle(stage.itemIds);
  prepareStage(stage,ui('recyclingKicker'),state.sortedTrash.size,stage.itemIds.length);
  $('stagePlayfield').innerHTML=`<div class="world-bins">${bins.map(bin=>`<button class="world-bin bin-${bin.color}" type="button" data-bin="${bin.id}" aria-label="${bin.name}"><span class="world-bin-icon" aria-hidden="true">${bin.icon}</span><strong>${bin.name}</strong><span class="bin-contents" aria-hidden="true">${stage.itemIds.filter(id=>catalog[id].bin===bin.id&&state.sortedTrash.has(id)).map(id=>catalog[id].icon).join(' ')}</span></button>`).join('')}</div><div class="litter-field">${state.stageOrder.map(id=>{
    const item=catalog[id],done=state.sortedTrash.has(id);
    const icon=id===6?'<img src="assets/watermelon-rind.svg" alt="">':id===7?'<img src="assets/melon-rind.svg" alt="">':item.icon;
    return `<button class="world-litter ${item.bin==='nature'?'nature-item':''} ${done?(item.bin==='nature'?'protected':'sorted'):''}" type="button" data-trash="${id}" ${done?'disabled':''} aria-label="${item.name}"><span class="world-icon" aria-hidden="true">${icon}</span><span class="world-label">${item.name}</span></button>`;
  }).join('')}</div>`;
  $('stagePlayfield').querySelectorAll('[data-trash]').forEach(button=>button.addEventListener('click',()=>{
    const id=Number(button.dataset.trash),item=catalog[id];
    if(item.bin==='nature'){
      state.selectedTrash=null;
      $('stagePlayfield').querySelectorAll('[data-trash]').forEach(other=>other.classList.remove('selected'));
      state.sortedTrash.add(id);button.classList.add('protected');button.disabled=true;
      progress(state.sortedTrash.size,stage.itemIds.length);react(true,item.praise,[item.name,item.praise]);
      completeStage(state.sortedTrash.size,stage.itemIds.length);
      return;
    }
    state.selectedTrash=id;
    $('stagePlayfield').querySelectorAll('[data-trash]').forEach(other=>other.classList.toggle('selected',other===button));
    $('stageFeedback').textContent='';$('stageFeedback').className='stage-feedback';
    speak([item.name,data().speech.chooseBin]);
  }));
  $('stagePlayfield').querySelectorAll('[data-bin]').forEach(button=>button.addEventListener('click',()=>{
    const bin=bins.find(entry=>entry.id===button.dataset.bin);
    if(state.selectedTrash===null){react(false,data().speech.chooseItemFirst,[bin.name,data().speech.chooseItemFirst]);return;}
    const id=state.selectedTrash,item=catalog[id];
    if(item.bin===bin.id){
      state.sortedTrash.add(id);state.selectedTrash=null;
      const itemButton=$('stagePlayfield').querySelector(`[data-trash="${id}"]`);
      itemButton.classList.remove('selected');itemButton.classList.add('sorted');itemButton.disabled=true;
      button.querySelector('.bin-contents').textContent=stage.itemIds.filter(i=>catalog[i].bin===bin.id&&state.sortedTrash.has(i)).map(i=>catalog[i].icon).join(' ');
      progress(state.sortedTrash.size,stage.itemIds.length);react(true,item.praise,[bin.name,item.praise]);
      completeStage(state.sortedTrash.size,stage.itemIds.length);
    }else react(false,item.why,[bin.name,item.why]);
  }));
  completeStage(state.sortedTrash.size,stage.itemIds.length);
  if(announce)sceneSpeech();
}

$('menuButton').addEventListener('click',showMenu);
$('endingMenuButton').addEventListener('click',showMenu);
$('replayButton').addEventListener('click',()=>startLevel(state.level));
$('listenButton').addEventListener('click',sceneSpeech);
$('stageListenButton').addEventListener('click',sceneSpeech);
$('languageSelect').addEventListener('change',event=>{stopVoice();locale=event.target.value;state.session++;applyLocale();});
$('voiceSelect').addEventListener('change',event=>{stopVoice();voiceMode=event.target.value;updateVoiceWarning();if(state.level&&!$('levelScreen').hidden)sceneSpeech();});
$('soundButton').addEventListener('click',()=>{
  soundOn=!soundOn;$('soundButton').textContent=soundOn?'🔊':'🔇';
  $('soundButton').setAttribute('aria-label',soundOn?(locale==='ru'?'Выключить звук':'Дыбысты өшіру'):(locale==='ru'?'Включить звук':'Дыбысты қосу'));
  if(!soundOn)stopVoice();else if(state.level&&!$('levelScreen').hidden)sceneSpeech();
});
$('sceneHeroes').addEventListener('animationend',event=>{if(['cheer','gentle-cheer'].includes(event.animationName))event.currentTarget.classList.remove('happy');});
for(const id of ['stageKatya','stageVitya'])$(id).addEventListener('animationend',event=>{if(['stage-cheer','gentle-cheer'].includes(event.animationName))event.currentTarget.classList.remove('happy');});
if(synthesis)synthesis.onvoiceschanged=updateVoiceWarning;
applyLocale();
