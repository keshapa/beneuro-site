/* HERO-CASE-VIDEO-JS */
(()=>{
 const video=document.getElementById('hero-case-film');if(!video)return;
 const $=s=>document.querySelector(s),media=$('.hero-case-media'),bar=$('.hero-case-controls'),toggle=$('.hero-case-toggle'),seek=$('.hero-case-seek'),time=$('.hero-case-time'),error=$('.hero-case-error');
 const stamp=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
 function sync(){toggle.textContent=video.paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',video.paused?'Воспроизвести видео':'Приостановить видео');seek.value=video.currentTime;time.textContent=stamp(video.currentTime)+' / '+stamp(Number.isFinite(video.duration)?Math.ceil(video.duration):Number(video.dataset.duration||88))}
 async function play(){try{await video.play()}catch(e){if(e.name!=='NotAllowedError'&&e.name!=='AbortError')error.hidden=false}}
 // Исходное разрешение загружается только по запросу полного экрана, с сохранением позиции.
 let fullQuality=false;
 function upgrade(){if(fullQuality)return;fullQuality=true;const position=video.currentTime;video.addEventListener('loadedmetadata',()=>{video.currentTime=Math.min(position,video.duration);play()},{once:true});video.src=video.dataset.fullSrc;video.load()}
 async function fullscreen(){try{const exiting=!!document.fullscreenElement;if(exiting)await document.exitFullscreen();else if(media.requestFullscreen){await media.requestFullscreen();upgrade()}else if(video.webkitEnterFullscreen){video.webkitEnterFullscreen();upgrade()}if(!exiting&&video.paused&&!video.seeking&&video.readyState>=2)await play()}catch{video.focus()}}
 video.muted=true;video.defaultMuted=true;video.controls=false;bar.hidden=false;
 toggle.addEventListener('click',()=>video.paused?play():video.pause());
 seek.addEventListener('input',()=>{video.currentTime=Number(seek.value);sync()});
 video.addEventListener('loadedmetadata',()=>{seek.disabled=false;seek.max=video.duration;sync()});
 video.addEventListener('play',()=>{error.hidden=true;sync()});for(const name of['pause','timeupdate','ended'])video.addEventListener(name,sync);
 video.addEventListener('error',()=>{error.hidden=false});
 for(const button of[$('.hero-case-fullscreen'),$('.hero-case-expand')])button.addEventListener('click',fullscreen);
 document.addEventListener('fullscreenchange',()=>{$('.hero-case-expand').setAttribute('aria-label',document.fullscreenElement?'Выйти из полноэкранного режима':'Открыть видео на весь экран')});
 // Возврат во вкладку продолжает только воспроизведение, не остановленное пользователем.
 let resumeWhenVisible=document.hidden;
 document.addEventListener('visibilitychange',()=>{if(document.hidden){resumeWhenVisible=!video.paused;video.pause()}else if(resumeWhenVisible&&!video.ended){resumeWhenVisible=false;play()}});sync();if(document.hidden)video.pause();else play();
})();

/* /HERO-CASE-VIDEO-JS */