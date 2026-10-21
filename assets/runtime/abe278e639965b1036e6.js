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

/* NICHE-PAGE-JS */
(() => {
 const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const menu=document.querySelector('.menu-button');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));$('mobile-nav').hidden=!open;});$('mobile-nav').addEventListener('click',event=>{if(event.target.closest('a')){menu.setAttribute('aria-expanded','false');$('mobile-nav').hidden=true;}});
 window.initNicheCatalog();
 const value=window.BENEURO_NICHE_ID===undefined?new URLSearchParams(location.search).get('niche'):String(window.BENEURO_NICHE_ID),n=niches.find(n=>String(n.id)===value)||niches[0];
 document.title=n.title+' — Beneuro';$('niche-title').textContent=n.title;$('niche-audience').textContent=n.audience;$('niche-signal').textContent=n.signal;
 $('niche-channels').innerHTML=n.channels.map(id=>{const c=nicheChannels[id];return `<a class="channel-chip" href="${c.url}" target="_blank" rel="noopener noreferrer"><img class="channel-logo" src="${c.logo}" width="23" height="23" alt="" aria-hidden="true">${esc(c.label)}</a>`;}).join('');
 $('niche-stats').innerHTML=`<div class="niche-stats" data-estimated="${n.stats.estimated}">${n.stats.estimated?'<p class="niche-estimate-label">Статистика пока не известна, наша оценка:</p>':''}<div class="niche-metrics"><div><strong>${esc(n.stats.daily)}</strong><span>новых лидов в день</span></div><div><strong>${esc(n.stats.qualification)}</strong><span>конверсия в квалифицированный лид</span></div><div class="niche-cost"><strong>${esc(nicheLeadCost(n))}</strong><span>примерная стоимость квалифицированного лида</span></div></div><p class="niche-cost-basis">${esc(nicheCostBasis(n))}</p></div>`;
 const selectedCase=nicheCaseStudies[n.id],hasExample=n.id===0||!!selectedCase;
 $('example').hidden=!hasExample;$('example-link').hidden=!hasExample;$('message-example').hidden=hasExample;$('niche-message').textContent=n.message;
 if(selectedCase){
  $('example-title').textContent=selectedCase.title;
  $('example').querySelector('.eyebrow').textContent=selectedCase.eyebrow;
  $('example').querySelector('.intro-copy').textContent=selectedCase.intro;
  $('example').querySelector('.step-links').innerHTML=selectedCase.nav;
  $('example').querySelector('.walkthrough').innerHTML=selectedCase.body;
 }
 // При переходе из каталога первая секция остаётся выше, но открывается вторая.
 if((window.BENEURO_NICHE_ID!==undefined&&!location.hash)||location.hash==='#niche-content')window.addEventListener('load',()=>$('niche-content').scrollIntoView({block:'start',behavior:'instant'}),{once:true});
})();
/* /NICHE-PAGE-JS */

(() => {
 const dialog=document.querySelector('.image-dialog'),image=dialog.querySelector('img'),stage=dialog.querySelector('.image-stage'),native=dialog.querySelector('.native-button');
 let opener=null;
 function reset(){dialog.classList.remove('native');native.textContent='100%';native.setAttribute('aria-pressed','false');stage.scrollTop=0;stage.scrollLeft=0;}
 document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-screen]');if(!trigger)return;
  const figure=document.getElementById(trigger.dataset.screen),source=figure.querySelector('img');opener=trigger;reset();image.src=source.src;image.alt=source.alt;image.style.setProperty('--native-width',(source.naturalWidth||source.getAttribute('width'))+'px');dialog.querySelector('h2').textContent=source.alt;dialog.showModal();document.body.classList.add('image-open');
 });
 native.addEventListener('click',()=>{const enabled=dialog.classList.toggle('native');native.textContent=enabled?'Вписать':'100%';native.setAttribute('aria-pressed',String(enabled));stage.scrollTop=0;stage.scrollLeft=0;});
 dialog.querySelector('.close-button').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{document.body.classList.remove('image-open');image.removeAttribute('src');opener?.focus({preventScroll:true});});
 const links=[...document.querySelectorAll('.step-links a')],sections=[...document.querySelectorAll('.case-step')];
 function update(){let current=0;sections.forEach((section,index)=>{if(section.getBoundingClientRect().top<180)current=index;});links.forEach((link,index)=>{if(index===current)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');});}
 let scheduled=false;document.addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{update();scheduled=false;});},{passive:true});update();
})();
