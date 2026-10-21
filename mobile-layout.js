// Короткая мобильная подача; исходные тексты и настольная панель сохраняются.
(() => {
  'use strict';
  const media = matchMedia('(max-width:800px)'), copies = [];
  function shortCopy(element, value) {
    if (!media.matches || !element || element.dataset.mobileCopy) return;
    element.dataset.mobileCopy = 'true';
    const original = document.createElement('span'), short = document.createElement('span');
    original.className = 'mobile-copy-original'; short.className = 'mobile-copy-short';
    original.append(...element.childNodes); short.textContent = value; element.append(original, short);
    copies.push([original, short]);
  }
  function syncCopy() {
    for (const [original, short] of copies) {
      original.setAttribute('aria-hidden', String(media.matches)); short.setAttribute('aria-hidden', String(!media.matches));
    }
  }
  function cleanClone(node) {
    const copy = node.cloneNode(true); copy.removeAttribute('id'); copy.querySelectorAll('[id]').forEach(n => n.removeAttribute('id')); return copy;
  }
  function disclosure(title, parts) {
    const details = document.createElement('details'), summary = document.createElement('summary'), body = document.createElement('div');
    details.className = 'mobile-disclosure'; summary.textContent = title; body.className = 'mobile-disclosure-body';
    for (const [label, value] of parts) {
      if (label) { const heading = document.createElement('span'); heading.className = 'mobile-detail-label'; heading.textContent = label; body.append(heading); }
      if (typeof value === 'string') { const p = document.createElement('p'); p.textContent = value; body.append(p); }
      else body.append(cleanClone(value));
    }
    details.append(summary, body); return details;
  }
  function tableDetails(selector, labels) {
    const source = document.querySelector(selector); if (!source || source.dataset.mobileDetails) return;
    const list = document.createElement('div'); list.className = 'mobile-disclosure-list mobile-only';
    for (const row of source.querySelectorAll('tbody tr')) list.append(disclosure(row.cells[0].textContent, labels.map((label, i) => [label, row.cells[i+1].textContent])));
    source.after(list); source.dataset.mobileDetails = 'true';
  }
  const headings = {
    '.header nav [data-page="catalog"]':'Ниши',
    '#niches-title':'Выберите нишу', '#stories-title':'Отзывы на beneuro', '#crm-title':'Наша CRM',
    '#benefits-title':'Чем Beneuro лучше?', '#pricing-title':'Тарифы', '#connect-title':'Как подключиться',
    '#faq-title':'Вопросы и ответы', '#subscription-title':'Что входит в подписку',
    '#example-title':'Пример работы агента', '.niche-message-section h2':'Первое сообщение',
    '.connect-cta h3':'Подключите агента', '.reg-copy h1':'Давайте познакомимся',
    '.reg-catalog h1':'Выберите нишу', '.bot-layout .reg-form-head h1':'Подключите Telegram'
  };
  const categories = {all:'Все',market:'Маркетплейсы',marketing:'Маркетинг',it:'IT',outsource:'Аутсорсинг',build:'Стройка',supply:'Производство',event:'События'};
  function scan() {
    for (const [selector, value] of Object.entries(headings)) document.querySelectorAll(selector).forEach(el => shortCopy(el, value));
    document.querySelectorAll('.category-filters [data-category],.reg-filters [data-category]').forEach(el => shortCopy(el, categories[el.dataset.category] || el.textContent));
    syncCopy();
  }
  scan(); media.addEventListener('change', () => {
    if (media.matches) scan();
    else {
      // Возвращаем исходные узлы: настольный редактор экспортирует прежние селекторы.
      for (const [original, short] of copies) {
        const element=original.parentElement;
        if (element && short.parentElement===element) { element.replaceChildren(...original.childNodes); delete element.dataset.mobileCopy; }
      }
      copies.length=0;
    }
  });
  const registration = document.getElementById('registration-view');
  if (registration) { let queued=false; new MutationObserver(() => { if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan();}); }).observe(registration,{childList:true,subtree:true}); }
  tableDetails('.comparison', ['Какие минусы','Как помогает Beneuro']);
  tableDetails('.subscription-table-wrap', ['Старт','Поток']);
  const overview = document.querySelector('.niche-overview');
  if (overview) {
    const list = document.createElement('div'); list.className = 'mobile-disclosure-list mobile-niche-overview mobile-only';
    for (const item of overview.children) list.append(disclosure(item.querySelector('.small-label').textContent, [[null,item.querySelector('p,.niche-channel-list')]]));
    overview.after(list); overview.dataset.mobileDetails = 'true';
  }
  document.querySelectorAll('.plan>ul').forEach(ul => {
    const details = disclosure('Что входит в тариф', [[null,ul]]); details.classList.add('mobile-only','mobile-plan-details');
    ul.after(details); ul.dataset.mobileDetails = 'true';
  });
  document.querySelectorAll('.plan>.button').forEach(button => {
    button.setAttribute('aria-label','Выбрать тариф «'+button.closest('.plan').querySelector('h3').textContent+'»');
    shortCopy(button,'Выбрать ↗');
  });
  // При изменении ширины scan() возвращает короткие подписи кнопок тарифов.
  headings['.plan>.button']='Выбрать ↗';

  // Резервируем место по самому длинному отзыву, не обрезая ни одну цитату.
  // Измерение идёт в невидимых копиях; живой слайдер не переключаем.
  const review = document.querySelector('.customer-case');
  if(review && typeof customerStories!=='undefined' && typeof niches!=='undefined'){
    const vars=['--review-quote-height','--review-author-height','--review-copy-height','--review-results-height'];
    let queued=false,lastWidth=0;
    function measureReviews(){
      const width=review.getBoundingClientRect().width;if(!width)return;
      const samples=[null,...customerStories].map(story=>{
        const sample=cleanClone(review);sample.setAttribute('aria-hidden','true');sample.inert=true;
        sample.style.cssText=`position:fixed;left:-20000px;top:0;width:${width}px;visibility:hidden;pointer-events:none;`;
        vars.forEach(key=>sample.style.setProperty(key,'0px'));
        if(story){
          const niche=niches.find(n=>n.title===story.niche),put=(selector,value)=>{sample.querySelector(selector).textContent=value;};
          put('.customer-quote',story.headline);put('.customer-author strong',story.person.name);put('.customer-author-copy>span',story.person.role);
          put('.customer-kicker',story.company+(niche.stats.estimated?' · наша оценка':' · с Beneuro'));
          put('.customer-main-result>strong',niche.stats.daily);put('.customer-secondary-results>div:first-child strong',niche.stats.qualification);
          put('.customer-secondary-results>div:last-child strong',nicheLeadCost(niche));put('.customer-cost-basis',nicheCostBasis(niche));
        }
        document.body.append(sample);return sample;
      });
      const max=selector=>Math.ceil(Math.max(...samples.map(n=>n.querySelector(selector).getBoundingClientRect().height)));
      const quote=max('.customer-quote'),author=max('.customer-author');
      samples.forEach(n=>{n.style.setProperty(vars[0],quote+'px');n.style.setProperty(vars[1],author+'px');});
      const copy=max('.customer-case-copy'),results=max('.customer-case-results');
      [quote,author,copy,results].forEach((value,i)=>review.style.setProperty(vars[i],value+'px'));
      samples.forEach(n=>n.remove());lastWidth=width;review.dataset.equalHeight='true';
    }
    const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;measureReviews();});};
    new ResizeObserver(()=>{if(Math.abs(review.getBoundingClientRect().width-lastWidth)>.5)schedule();}).observe(review);
    new MutationObserver(schedule).observe(review.querySelector('.customer-case-panel'),{childList:true,subtree:true,characterData:true});
    media.addEventListener('change',schedule);document.fonts.ready.then(schedule);document.fonts.addEventListener('loadingdone',schedule);schedule();
  }

  const registrationDialog=document.getElementById('registration-shot-dialog');
  if(registrationDialog){
    const stage=registrationDialog.querySelector('.registration-image-stage'),image=stage.querySelector('img'),native=registrationDialog.querySelector('[data-registration-native]');let opener;
    document.getElementById('connect').addEventListener('click',event=>{
      const button=event.target.closest('[data-registration-shot]');if(!button)return;opener=button;
      const source=button.querySelector('img');image.src=source.currentSrc||source.src;image.alt=source.alt;
      document.getElementById('registration-image-title').textContent=button.closest('article').querySelector('h3').textContent;
      stage.classList.remove('is-native');native.setAttribute('aria-pressed','false');registrationDialog.showModal();document.body.classList.add('registration-image-open');
    });
    native.addEventListener('click',()=>native.setAttribute('aria-pressed',String(stage.classList.toggle('is-native'))));
    registrationDialog.querySelector('[data-registration-close]').addEventListener('click',()=>registrationDialog.close());
    registrationDialog.addEventListener('click',event=>{if(event.target===registrationDialog)registrationDialog.close();});
    registrationDialog.addEventListener('close',()=>{document.body.classList.remove('registration-image-open');opener?.focus({preventScroll:true});});
  }

  // В публичном демо сохраняем широкий интерфейс панели, уменьшая его целиком.
  // Сам кабинет после регистрации не переделываем и в iframe не переносим.
  document.querySelectorAll('#crm-frame,.crm-full-main>iframe').forEach(frame => {
    const slot = document.createElement('div'); slot.className='mobile-crm-viewport'; frame.before(slot); slot.append(frame);
    function fitCRM() {
      if (!media.matches) { slot.classList.remove('is-scaled'); slot.style.removeProperty('height'); frame.style.removeProperty('width');frame.style.removeProperty('height');frame.style.removeProperty('transform');return; }
      slot.classList.add('is-scaled');
      const width=slot.clientWidth; if (!width) return;
      const scale=width/1280, full=document.body.classList.contains('crm-full-page') || !!frame.closest('.is-expanded');
      const height=full?Math.max(800,slot.clientHeight/scale):800;
      frame.style.width='1280px'; frame.style.height=height+'px'; frame.style.transform=`scale(${scale})`;
      if(!full)slot.style.height=height*scale+'px';else slot.style.removeProperty('height');
    }
    new ResizeObserver(fitCRM).observe(slot);
    const shell=frame.closest('#crm-demo-shell'); if(shell)new MutationObserver(fitCRM).observe(shell,{attributes:true,attributeFilter:['class']});
    media.addEventListener('change',fitCRM); fitCRM();
  });
})();
