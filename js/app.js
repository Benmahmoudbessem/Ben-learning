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

// Ben-Learning V4.9.2 — installation PWA smartphone fiable
(function(){
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(err=>console.warn('Service Worker indisponible',err)));
  }

  const ua=navigator.userAgent||'';
  const isIOS=/iphone|ipad|ipod/i.test(ua);
  const isAndroid=/android/i.test(ua);
  const isMobile=/android|iphone|ipad|ipod|mobile/i.test(ua) || window.matchMedia('(max-width: 768px)').matches;
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
  const isInAppBrowser=/FBAN|FBAV|Instagram|Line|Twitter|WhatsApp/i.test(ua);
  let deferredPrompt=null;

  if(!isMobile || isStandalone()) return;

  const installBtn=document.createElement('button');
  installBtn.type='button';
  installBtn.className='pwa-install-btn pwa-install-btn-visible';
  installBtn.innerHTML='<span class="pwa-install-icon">📲</span><span>Installer Ben-Learning</span>';
  installBtn.setAttribute('aria-label','Installer Ben-Learning sur ce smartphone');
  document.body.appendChild(installBtn);

  const modal=document.createElement('div');
  modal.className='pwa-help-overlay';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML=`
    <div class="pwa-help-card" role="dialog" aria-modal="true" aria-labelledby="pwaHelpTitle">
      <button class="pwa-help-close" type="button" aria-label="Fermer">✕</button>
      <div class="pwa-help-logo">🎓</div>
      <span class="pwa-help-kicker">Ben-Learning sur ton téléphone</span>
      <h2 id="pwaHelpTitle">Installer Ben-Learning</h2>
      <div class="pwa-help-content"></div>
      <button class="btn primary pwa-help-ok" type="button">J’ai compris</button>
    </div>`;
  document.body.appendChild(modal);

  const content=modal.querySelector('.pwa-help-content');
  const closeBtn=modal.querySelector('.pwa-help-close');
  const okBtn=modal.querySelector('.pwa-help-ok');

  function iosInstructions(){
    return `
      <p>Sur <strong>iPhone / iPad</strong>, l’installation se fait depuis Safari :</p>
      <ol class="pwa-help-steps">
        <li><b>1</b><span>Ouvre Ben-Learning dans <strong>Safari</strong>.</span></li>
        <li><b>2</b><span>Appuie sur le bouton <strong>Partager</strong> <span class="pwa-share-symbol">□↑</span>.</span></li>
        <li><b>3</b><span>Choisis <strong>Ajouter à l’écran d’accueil</strong>.</span></li>
        <li><b>4</b><span>Appuie sur <strong>Ajouter</strong>.</span></li>
      </ol>`;
  }

  function androidInstructions(){
    return `
      <p>Sur <strong>Android</strong>, ouvre Ben-Learning dans <strong>Google Chrome</strong>, puis :</p>
      <ol class="pwa-help-steps">
        <li><b>1</b><span>Appuie sur le menu <strong>⋮</strong> en haut à droite.</span></li>
        <li><b>2</b><span>Choisis <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.</span></li>
        <li><b>3</b><span>Confirme avec <strong>Installer</strong>.</span></li>
      </ol>`;
  }

  function inAppInstructions(){
    return `
      <p>Tu as ouvert Ben-Learning depuis une application intégrée.</p>
      <div class="pwa-browser-warning">⚠️ Ouvre d’abord ce lien dans <strong>${isIOS?'Safari':'Google Chrome'}</strong>, puis utilise l’option d’installation.</div>
      ${isIOS?iosInstructions():androidInstructions()}`;
  }

  function genericInstructions(){
    return `
      <p>Pour installer Ben-Learning, ouvre le menu de ton navigateur puis choisis <strong>Ajouter à l’écran d’accueil</strong> ou <strong>Installer l’application</strong>.</p>`;
  }

  function openHelp(){
    if(isInAppBrowser) content.innerHTML=inAppInstructions();
    else if(isIOS) content.innerHTML=iosInstructions();
    else if(isAndroid) content.innerHTML=androidInstructions();
    else content.innerHTML=genericInstructions();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('pwa-help-open');
  }

  function closeHelp(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('pwa-help-open');
  }

  closeBtn.addEventListener('click',closeHelp);
  okBtn.addEventListener('click',closeHelp);
  modal.addEventListener('click',e=>{if(e.target===modal) closeHelp();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open')) closeHelp();});

  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    deferredPrompt=e;
    installBtn.classList.add('pwa-ready');
  });

  installBtn.addEventListener('click',async()=>{
    if(isStandalone()){
      installBtn.remove();
      return;
    }
    if(deferredPrompt){
      try{
        deferredPrompt.prompt();
        const choice=await deferredPrompt.userChoice;
        if(choice&&choice.outcome==='accepted') installBtn.classList.add('installing');
      }catch(err){
        console.warn('Installation PWA non disponible',err);
        openHelp();
      }finally{
        deferredPrompt=null;
      }
      return;
    }
    openHelp();
  });

  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    closeHelp();
    installBtn.classList.add('installed');
    installBtn.innerHTML='<span>✅ Ben-Learning installé</span>';
    setTimeout(()=>installBtn.remove(),1800);
  });
})();
