const CACHE='ben-learning-v4-9-2-shell-v1';
const SHELL=['./','./index.html','./login.html','./register.html','./css/style.css','./css/responsive.css','./js/app.js','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./manifest.webmanifest','./assets/pdf/cahier-activites-informatique-1ere.pdf'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();if(url.pathname.match(/\.(css|js|html|png|svg|webp|json|pdf|webmanifest)$/))caches.open(CACHE).then(c=>c.put(event.request,copy));return response;}).catch(()=>caches.match(event.request).then(r=>r||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
