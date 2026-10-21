// Boundary controls only; the public demo's interface and behavior are unchanged.
(() => {
  if(window.parent===window)return;
  let expanded=false;
  const focusables=()=>[...document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(n=>n.getClientRects().length&&!n.closest('[inert]'));
  const internalDialog=()=>['drawer','modal'].some(id=>{const n=document.getElementById(id);return n&&!n.hidden;})||document.getElementById('sidebar')?.classList.contains('open');
  window.addEventListener('message',e=>{
    if(e.source!==parent)return;
    if(e.data?.type==='beneuro-demo-expanded')expanded=!!e.data.expanded;
    if(e.data?.type==='beneuro-demo-focus'){const list=focusables(),n=e.data.last?list.at(-1):list[0];n?.focus();}
  });
  document.addEventListener('keydown',e=>{
    if(!expanded||internalDialog())return;
    if(e.key==='Escape'){e.preventDefault();parent.postMessage({type:'beneuro-demo-close'},'*');}
    if(e.key==='Tab'){const list=focusables(),first=list[0],last=list.at(-1);if((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last)){e.preventDefault();parent.postMessage({type:'beneuro-demo-focus-close'},'*');}}
  },true);
  parent.postMessage({type:'beneuro-demo-ready'},'*');
})();
