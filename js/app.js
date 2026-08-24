(function(){
  const menuBtn=document.getElementById('menuBtn');
  const nav=document.getElementById('mainNav');

  function closeMenu(){
    if(!menuBtn||!nav) return;
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded','false');
    menuBtn.setAttribute('aria-label','Ouvrir le menu');
    const icon=menuBtn.querySelector('span');
    if(icon) icon.textContent='☰';
    document.body.classList.remove('menu-open');
  }

  function openMenu(){
    if(!menuBtn||!nav) return;
    nav.classList.add('open');
    menuBtn.setAttribute('aria-expanded','true');
    menuBtn.setAttribute('aria-label','Fermer le menu');
    const icon=menuBtn.querySelector('span');
    if(icon) icon.textContent='✕';
    document.body.classList.add('menu-open');
  }

  if(menuBtn&&nav){
    menuBtn.addEventListener('click',(event)=>{
      event.stopPropagation();
      nav.classList.contains('open')?closeMenu():openMenu();
    });
    nav.querySelectorAll('a,button').forEach(el=>el.addEventListener('click',()=>{
      if(el!==menuBtn) closeMenu();
    }));
    document.addEventListener('click',(event)=>{
      if(nav.classList.contains('open')&&!nav.contains(event.target)&&!menuBtn.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown',(event)=>{if(event.key==='Escape') closeMenu();});
    window.addEventListener('resize',()=>{if(window.innerWidth>700) closeMenu();},{passive:true});
  }

  const authLink=document.getElementById('authLink');
  const session=JSON.parse(localStorage.getItem('bl_session')||'null');
  if(authLink&&session){
    if(session.role==='student' && session.status && session.status!=='approved'){
      authLink.textContent='Suivi inscription';
      authLink.href='status.html';
    }else{
      authLink.textContent='Mon espace';
      authLink.href='profile.html';
    }
  }

  const header=document.getElementById('siteHeader');
  if(header){
    const updateHeader=()=>header.classList.toggle('scrolled',window.scrollY>18);
    updateHeader();
    window.addEventListener('scroll',updateHeader,{passive:true});
  }

  const revealItems=document.querySelectorAll('.reveal-section,.hero-reveal');
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },{threshold:.08,rootMargin:'0px 0px -20px 0px'});
    revealItems.forEach(el=>observer.observe(el));
  }else{
    revealItems.forEach(el=>el.classList.add('is-visible'));
  }

  requestAnimationFrame(()=>document.querySelectorAll('.hero-reveal').forEach(el=>el.classList.add('is-visible')));
})();

// Ben-Learning V4.1 — PWA installable
(function(){
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(err=>console.warn('Service Worker indisponible',err)));
  }
  let deferredPrompt=null;
  const installBtn=document.createElement('button');
  installBtn.type='button';installBtn.className='pwa-install-btn hidden';installBtn.innerHTML='📱 Installer Ben-Learning';installBtn.setAttribute('aria-label','Installer Ben-Learning sur cet appareil');
  document.body.appendChild(installBtn);
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove('hidden');});
  installBtn.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.classList.add('hidden');});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;installBtn.classList.add('hidden');});
})();
