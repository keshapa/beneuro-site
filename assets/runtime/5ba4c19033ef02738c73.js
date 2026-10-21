// Approved raster poses change only at step boundaries, including the quiet idle loop.
(() => {
  const data=window.BENEURO_MASCOT_DATA,canvas=document.querySelector('#hero-mascot'),poster=document.querySelector('.hero-mascot-poster');
  if(!data||!canvas)return;
  const ctx=canvas.getContext('2d',{willReadFrequently:true}),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const idle=[{frame:5,start:0,end:150},{frame:1,start:150,end:300},{frame:5,start:300,end:450},{frame:1,start:450,end:3000}];
  let images,pixels,pointer,elapsed=0,last=null,paused=reduced.matches,visible=true,painted='',mode='full',currentFrame=1;
  const positions=[];let x=0;
  data.timeline.forEach((c,i)=>{x=data.motion.targets.find(t=>t.step===i+1)?.x??x;positions.push(x);});
  const duration=()=>mode==='full'?data.duration:idle.at(-1).end;
  function hit(clientX,clientY){
    if(!pixels||canvas.hidden)return false;
    const r=canvas.getBoundingClientRect(),x=Math.floor((clientX-r.left)*640/r.width),y=Math.floor((clientY-r.top)*640/r.height);
    return x>=0&&y>=0&&x<640&&y<640&&pixels[(y*640+x)*4+3]>64;
  }
  function refreshPointer(){canvas.style.pointerEvents=pointer&&hit(pointer.x,pointer.y)?'auto':'none';}
  function updateControl(){
    canvas.setAttribute('aria-pressed',String(mode==='full'));
    canvas.title=mode==='full'?'Перейти к спокойным приседаниям':'Включить полный танец';
  }
  function draw(time){
    elapsed=Math.max(0,Math.min(Number(time)||0,duration()-.001));
    const clips=mode==='full'?data.timeline:idle,index=clips.findIndex(c=>elapsed<c.end),clip=clips[index];
    const position=mode==='full'&&data.movementEnabled!==false?positions[index]:0,key=mode+':'+index;
    if(images&&key!==painted){ctx.clearRect(0,0,640,640);ctx.drawImage(images[clip.frame-1],position,0,640,640);pixels=ctx.getImageData(0,0,640,640).data;painted=key;refreshPointer();}
    currentFrame=clip.frame;
    return {mode,step:index+1,frame:clip.frame,x:position,y:0,time:elapsed};
  }
  function tick(now){
    if(last!==null&&!paused&&visible&&!document.hidden)draw((elapsed+Math.min(now-last,100))%duration());
    last=now;requestAnimationFrame(tick);
  }
  function pause(value){paused=!!value;last=null;}
  function setMode(value){mode=value==='idle'?'idle':'full';painted='';pause(false);draw(0);updateControl();}
  function toggle(){setMode(mode==='full'?'idle':'full');}
  // Transparent pixels leave the links underneath usable, including on touchscreens.
  document.addEventListener('pointermove',e=>{pointer={x:e.clientX,y:e.clientY};refreshPointer();},{passive:true});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget){pointer=null;refreshPointer();}});
  window.addEventListener('scroll',refreshPointer,{passive:true});
  window.addEventListener('resize',refreshPointer,{passive:true});
  document.addEventListener('click',e=>{
    if(e.button!==0||!e.target.closest?.('.hero-copy')||!hit(e.clientX,e.clientY))return;
    e.preventDefault();e.stopImmediatePropagation();toggle();
  },true);
  canvas.addEventListener('keydown',e=>{if(!e.repeat&&(e.key==='Enter'||e.key===' ')){e.preventDefault();toggle();}});
  reduced.addEventListener('change',()=>{if(reduced.matches){pause(true);draw(0);}});
  document.addEventListener('visibilitychange',()=>{last=null;});
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=null;},{rootMargin:'100px'}).observe(canvas);
  const ready=Promise.all(data.frames.map(f=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.fetchPriority="low";img.src=f.data;}))).then(decoded=>{images=decoded;draw(0);canvas.hidden=false;poster.hidden=true;updateControl();requestAnimationFrame(tick);return true;}).catch(()=>{canvas.hidden=true;poster.hidden=false;return false;});
  window.beneuroMascot={ready,pause,setMode,frame(seconds){mode='full';pause(true);updateControl();return draw(Number(seconds)*1000);},drawAt(ms){mode='full';pause(true);updateControl();return draw(ms);},drawIdleAt(ms){mode='idle';pause(true);updateControl();return draw(ms);},get mode(){return mode;},get currentFrame(){return currentFrame;},get elapsed(){return elapsed;},get paused(){return paused;},get duration(){return data.duration;}};
  updateControl();
})();

// Same four stages and automatic/manual playback as the investor presentation.
(() => {
  if(!document.getElementById('demo-play'))return;
  const stages=window.BENEURO_HERO_STAGES,$=id=>document.getElementById(id),buttons=[...document.querySelectorAll('[data-step]')];
  let current=0,timer=null,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,visible=!('IntersectionObserver'in window);
  function choose(i){
    current=i;buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;});
    $('demo-title').innerHTML=stages[i][0];$('demo-panel').innerHTML=stages[i][1];$('demo-panel').setAttribute('aria-labelledby','demo-tab-'+i);
    $('demo-panel').classList.remove('swap-in');void $('demo-panel').offsetWidth;$('demo-panel').classList.add('swap-in');
  }
  function sync(){
    clearInterval(timer);timer=null;
    $('demo-play').textContent=playing?'Ⅱ':'▶';$('demo-play').setAttribute('aria-pressed',String(playing));$('demo-play').setAttribute('aria-label',playing?'Остановить автоматический показ':'Включить автоматический показ');
    if(playing&&visible&&!document.hidden)timer=setInterval(()=>choose((current+1)%stages.length),4000);
  }
  buttons.forEach((b,i)=>{
    b.addEventListener('click',()=>{playing=false;sync();choose(i);});
    b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();playing=false;sync();const n=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:-1)+4)%4;choose(n);buttons[n].focus();});
  });
  $('demo-play').addEventListener('click',()=>{playing=!playing;sync();});
  document.addEventListener('visibilitychange',sync);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches){playing=false;sync();}});
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.2}).observe($('intro'));
  window.addEventListener('pagehide',()=>{playing=false;sync();});choose(0);sync();
})();

// Один каталог и одинаковые переходы на главной и на страницах ниш.
window.initNicheCatalog=()=>{
 const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let category='all',expanded=false;
 const filters=[['all','Все направления'],...Object.entries(nicheGroups).map(([key,value])=>[key,value[0]])];
 $('niche-filters').innerHTML=filters.map(([key,title])=>`<button type="button" data-category="${key}" aria-pressed="${key==='all'}">${title}</button>`).join('');
 const normalize=s=>s.toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 // Синонимы живут в tags каталога; окончания и небольшие опечатки обрабатываем здесь.
 const stem=word=>{if(!/^[а-я]{5,}$/.test(word))return word;const base=word.replace(/(?:иями|ями|ами|ого|ему|ому|ыми|ими|ий|ый|ой|ая|яя|ое|ее|ые|ие|ую|юю|ов|ев|ам|ям|ах|ях|ом|ем|ы|и|а|у|е)$/,'');return base.length>=4?base:word;};
 const near=(a,b)=>{
  if(a.length<5||b.length<5||Math.abs(a.length-b.length)>1)return false;
  let i=0;while(i<Math.min(a.length,b.length)&&a[i]===b[i])i++;
  if(i===Math.min(a.length,b.length))return true;
  if(a.length===b.length)return a.slice(i+1)===b.slice(i+1)||(a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2));
  return a.length>b.length?a.slice(i+1)===b.slice(i):a.slice(i)===b.slice(i+1);
 };
 const searchIndex=niches.map(n=>{const text=normalize(n.title+' '+n.tags+' '+nicheGroups[n.group][0]+' '+n.channels.map(id=>nicheChannels[id].label).join(' ')),tokens=[...new Set(text.split(' '))];return {n,text,tokens,stems:tokens.map(stem)};});
 const matchesWord=(entry,word)=>entry.text.includes(word)||entry.stems.some(token=>token===stem(word))||entry.tokens.some(token=>near(word,token));
 function render(){
  const q=normalize($('niche-search').value),words=q.split(' ').filter(Boolean),matches=searchIndex.filter(entry=>(category==='all'||category===entry.n.group)&&words.every(word=>matchesWord(entry,word))).map(entry=>entry.n),shown=expanded||q||category!=='all'?matches:matches.slice(0,8);
  $('catalog-count').textContent=`${matches.length} из ${niches.length}`;
  $('niche-grid').innerHTML=shown.length?shown.map(n=>`<a class="niche-card" data-niche="${n.id}" href="${window.BENEURO_ROUTES.niches[n.id]}" aria-label="${esc(n.title)}"><span class="niche-index"><span>${String(n.id+1).padStart(2,'0')} / ${esc(nicheGroups[n.group][0])}</span><span aria-hidden="true">↗</span></span><h3>${esc(n.title)}</h3></a>`).join(''):'<div class="no-results"><h3>Такое направление пока не нашлось</h3><p>Попробуйте другое название или <a class="text-link" href="https://t.me/keshapa">обсудите вашу задачу с нами ↗</a>.</p><button class="text-button" id="reset-search">Сбросить поиск ×</button></div>';
  $('show-niches').hidden=!!q||category!=='all';$('show-niches').innerHTML=expanded?'Свернуть каталог <span>↑</span>':`Показать все направления (${niches.length}) <span>↓</span>`;
 }
 $('niche-search').addEventListener('input',render);
 $('niche-filters').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(!button)return;category=button.dataset.category;$('niche-filters').querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();});
 $('show-niches').addEventListener('click',()=>{expanded=!expanded;render();if(!expanded)$('niche-search').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
 $('niche-grid').addEventListener('click',event=>{if(!event.target.closest('#reset-search'))return;$('niche-search').value='';category='all';$('niche-filters').querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category==='all')));render();$('niche-search').focus();});
 render();
};

/* SITE-APP */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const menu=document.querySelector('.menu-button');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));$('mobile-nav').hidden=!open;});$('mobile-nav').addEventListener('click',e=>{if(e.target.closest('a')){menu.setAttribute('aria-expanded','false');$('mobile-nav').hidden=true;}});
 window.initNicheCatalog();

 const legacyNiche=location.hash.match(/^#niche-(\d+)$/);if(legacyNiche&&niches[Number(legacyNiche[1])])location.replace(`${window.BENEURO_ROUTES.niches[Number(legacyNiche[1])]}`);
 const legacyStory=location.hash.match(/^#story-([a-z-]+)$/);if(legacyStory&&customerStories.some(c=>c.id===legacyStory[1]))location.replace(`${window.BENEURO_ROUTES.articles[legacyStory[1]]}`);
})();
/* /SITE-APP */

/* CUSTOMER-STORIES-JS */
(() => {
  const $=id=>document.getElementById(id),data=customerStories,root=$('stories'),tabs=$('customer-tabs');
  let active=0,timer=null,visible=!('IntersectionObserver'in window),playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,editing=false;
  tabs.innerHTML=data.map((c,i)=>`<button id="customer-tab-${i}" type="button" role="tab" aria-controls="customer-case-panel" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-customer="${i}">${c.tab}</button>`).join('');
  function render(i){
    active=(i+data.length)%data.length;const c=data[active],n=niches.find(n=>n.title===c.niche);
    $('customer-quote').textContent=c.headline;$('customer-name').textContent=c.person.name;$('customer-role').textContent=c.person.role;
    const photo=$('customer-photo');photo.src=c.person.photoData;photo.alt=c.person.name;photo.style.objectPosition=c.person.photoPosition;photo.hidden=false;
    $('customer-kicker').textContent=c.company+(n.stats.estimated?' · наша оценка':' · с Beneuro');
    $('customer-daily').textContent=n.stats.daily;$('customer-conversion').textContent=n.stats.qualification;$('customer-cpl').textContent=nicheLeadCost(n);
    root.querySelector('.customer-cost-basis').textContent=nicheCostBasis(n);
    $('customer-story-link').href=window.BENEURO_ROUTES.articles[c.id];$('customer-story-link').firstChild.textContent='Читать статью ';
    $('customer-case-panel').setAttribute('aria-labelledby','customer-tab-'+active);$('customer-counter').textContent=String(active+1).padStart(2,'0')+' / '+String(data.length).padStart(2,'0');
    tabs.querySelectorAll('[data-customer]').forEach((b,j)=>{b.setAttribute('aria-selected',String(j===active));b.tabIndex=j===active?0:-1;});
  }
  function sync(){clearInterval(timer);timer=null;$('customer-play').textContent=playing?'Ⅱ Пауза':'▶ Продолжить';$('customer-play').setAttribute('aria-pressed',String(playing));$('customer-play').setAttribute('aria-label',playing?'Остановить смену статей':'Включить смену статей');if(playing&&visible&&!document.hidden&&!editing)timer=setInterval(()=>render(active+1),6000);}
  window.addEventListener('beneuro:editor',e=>{editing=!!e.detail.editing;sync();});
  function manual(i){playing=false;render(i);sync();}
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-customer]');if(b)manual(Number(b.dataset.customer));});
  tabs.addEventListener('keydown',e=>{const b=e.target.closest('[data-customer]');if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=e.key==='Home'?0:e.key==='End'?data.length-1:(Number(b.dataset.customer)+(e.key==='ArrowRight'?1:-1)+data.length)%data.length;manual(i);$('customer-tab-'+i).focus();});
  $('customer-prev').addEventListener('click',()=>manual(active-1));$('customer-next').addEventListener('click',()=>manual(active+1));
  $('customer-play').addEventListener('click',()=>{playing=!playing;sync();});document.addEventListener('visibilitychange',sync);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches){playing=false;sync();}});
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.2}).observe(root);
  window.addEventListener('pagehide',()=>{playing=false;sync();});render(0);sync();
})();
/* /CUSTOMER-STORIES-JS */

(() => {
  const frame=document.getElementById('crm-frame'),shell=document.getElementById('crm-demo-shell'),mount=document.getElementById('crm-demo-mount'),expand=document.getElementById('crm-expand'),close=document.getElementById('crm-collapse');
  let expanded=false,previousFocus,scrollPosition,inertNodes=[];
  const send=value=>frame.contentWindow?.postMessage(value,'*');
  function toggle(value){
    if(expanded===value)return;
    expanded=value;
    if(value){
      previousFocus=document.activeElement;scrollPosition={left:scrollX,top:scrollY};mount.style.minHeight=shell.getBoundingClientRect().height+'px';
      inertNodes=[...document.querySelectorAll('body>.header,body>.footer,body>.skip,body>.mobile-nav,main>section:not(#crm),#crm .section-heading')].map(n=>[n,n.inert]);inertNodes.forEach(([n])=>n.inert=true);
      shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','Демо-панель Beneuro');
    }else{
      inertNodes.forEach(([n,value])=>n.inert=value);inertNodes=[];shell.removeAttribute('role');shell.removeAttribute('aria-modal');shell.removeAttribute('aria-label');mount.style.minHeight='';
    }
    shell.classList.toggle('is-expanded',value);document.body.classList.toggle('crm-demo-open',value);expand.hidden=value;close.hidden=!value;expand.setAttribute('aria-expanded',String(value));send({type:'beneuro-demo-expanded',expanded:value});
    if(value)close.focus({preventScroll:true});else{window.scrollTo({...scrollPosition,behavior:'instant'});previousFocus?.focus({preventScroll:true});}
  }
  expand.addEventListener('click',()=>toggle(true));close.addEventListener('click',()=>toggle(false));
  shell.addEventListener('keydown',e=>{if(!expanded)return;if(e.key==='Escape'){e.preventDefault();toggle(false);}if(e.key==='Tab'&&document.activeElement===close){e.preventDefault();frame.focus();send({type:'beneuro-demo-focus',last:e.shiftKey});}});
  window.addEventListener('message',e=>{
    if(e.source!==frame.contentWindow)return;
    if(e.data?.type==='beneuro-demo-ready'){frame.dataset.ready='true';send({type:'beneuro-demo-expanded',expanded});}
    if(e.data?.type==='beneuro-demo-close')toggle(false);
    if(e.data?.type==='beneuro-demo-focus-close'&&expanded)close.focus({preventScroll:true});
  });
  frame.addEventListener('load',()=>send({type:'beneuro-demo-expanded',expanded}));
})();
