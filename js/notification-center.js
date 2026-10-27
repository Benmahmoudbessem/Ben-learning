import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

// Notifications visibles dans la plateforme ouverte. Le push en arrière-plan
// nécessite Firebase Cloud Messaging + un service sécurisé distinct.
const ALLOWED = new Set(['chat.html','courses.html','sessions.html','homework.html','quiz.html','profile.html','notifications.html']);
let unsubscribe = [];
let role = '';
let entries = [];
let seen = new Set();
const header = document.querySelector('.site-header');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arabic = () => localStorage.getItem('bl_lang') === 'ar';
const label = (fr,ar) => arabic() ? ar : fr;
const time = item => item?.createdAt?.toMillis?.() || Date.parse(item?.createdAtIso || item?.submittedAtIso || '') || 0;
const icons = { course:'📚', chat:'💬', session:'📅', homework:'📝', approval:'✅', rejection:'❌', registration:'👤', submission:'📥' };
const target = item => ALLOWED.has(item.actionLink) ? item.actionLink : ({course:'courses.html',session:'sessions.html',homework:'homework.html',chat:'chat.html'}[item.type] || 'notifications.html');

function addAdminLink() {
  const nav = document.querySelector('#mainNav');
  const footer = document.querySelector('.footer-links');
  if (role === 'admin') {
    if (nav && !nav.querySelector('.admin-only-link') && !location.pathname.endsWith('/admin.html')) {
      const a = document.createElement('a'); a.className = 'admin-only-link'; a.href = 'admin.html';
      a.textContent = label('Administration','الإدارة'); nav.appendChild(a);
    }
    if (footer && !footer.querySelector('.admin-only-link')) {
      const a = document.createElement('a'); a.className = 'admin-only-link'; a.href='admin.html';
      a.textContent=label('Administration','الإدارة'); footer.appendChild(a);
    }
    const authLink = document.getElementById('authLink');
    if (authLink) {authLink.href='admin.html';authLink.textContent=label('Espace admin','فضاء الإدارة');}
  } else {
    document.querySelectorAll('.admin-only-link').forEach(a => a.remove());
  }
}
function construct() {
  if (!header || document.getElementById('bellCenter')) return;
  const center = document.createElement('div'); center.id='bellCenter';center.className='bell-center';center.hidden=true;
  center.innerHTML=`<button class="bell-trigger" id="bellTrigger" type="button" aria-expanded="false" aria-controls="bellPopover" aria-label="Notifications">🔔<span id="bellBadge" class="bell-badge" hidden>0</span></button>
  <div class="bell-popover" id="bellPopover" hidden><div class="bell-popover-head"><strong id="bellTitle">Notifications</strong><span id="bellTotal"></span></div>
    <div class="bell-popover-list" id="bellList"></div><div class="bell-popover-foot"><button type="button" id="bellReadAll">Tout marquer comme lu</button><a id="bellAllLink" href="notifications.html">Toutes les notifications</a><button type="button" id="bellEnable" title="Alertes du navigateur">🔔</button></div></div>`;
  const prefs = header.querySelector('.header-preferences');
  if (prefs) prefs.insertAdjacentElement('afterend',center);
  else header.insertBefore(center,header.querySelector('nav') || header.lastElementChild);
  const popover=center.querySelector('#bellPopover');
  const trigger=center.querySelector('#bellTrigger');
  trigger.addEventListener('click',() => {const open=popover.hidden; popover.hidden=!open;trigger.setAttribute('aria-expanded',String(open));});
  document.addEventListener('click',e => {if(!center.contains(e.target)){popover.hidden=true;trigger.setAttribute('aria-expanded','false');}});
  document.addEventListener('keydown',e => {if(e.key==='Escape'){popover.hidden=true;trigger.setAttribute('aria-expanded','false');}});
  center.querySelector('#bellEnable').addEventListener('click', async()=>{
    if (!('Notification' in window)) return;
    const permission=await Notification.requestPermission();
    center.querySelector('#bellEnable').textContent=permission==='granted'?'✓':'🔔';
  });
  center.querySelector('#bellReadAll').addEventListener('click',async()=>{
    if(role!=='student')return;
    const pending=entries.filter(e=>!e.read);
    await Promise.allSettled(pending.map(item=>updateDoc(doc(db,'notifications',item.id),{read:true})));
  });
  center.querySelector('#bellList').addEventListener('click', async e=>{
    const row=e.target.closest('[data-note-id]'); if(!row)return;
    const item=entries.find(n=>n.id===row.dataset.noteId); if(!item)return;
    if (role==='student'&&!item.read) await updateDoc(doc(db,'notifications',item.id),{read:true}).catch(console.warn);
    if(role==='admin' && item.studentId && item.type==='chat') {
      if(location.pathname.endsWith('/admin.html') && typeof window.openStudentChat === 'function') {
        window.openStudentChat(item.studentId);
        document.getElementById('bellPopover').hidden=true;
        return;
      }
      sessionStorage.setItem('bl_admin_open_chat',item.studentId);
    }
    if(role==='admin' && item.type==='registration') location.href='admin.html#admin-students';
    else if(role==='admin' && item.type==='submission') location.href='admin.html#admin-pedagogy';
    else if(role==='admin') location.href='admin.html#admin-inbox';
    else location.href=target(item);
  });
}
function render() {
  const center=document.getElementById('bellCenter');if(!center || !role)return;
  center.hidden=false;
  const unread=entries.filter(i=>!i.read).length;
  const badge=center.querySelector('#bellBadge');badge.hidden=!unread;badge.textContent=unread>99?'99+':String(unread);
  center.querySelector('#bellTitle').textContent=label('Notifications','الإشعارات');
  center.querySelector('#bellTotal').textContent=unread ? label(`${unread} non lue(s)`,`${unread} غير مقروءة`) : '';
  center.querySelector('#bellReadAll').hidden=role!=='student'||!unread;
  center.querySelector('#bellAllLink').hidden=role==='admin';
  center.querySelector('#bellEnable').title=label('Activer les alertes navigateur','تفعيل تنبيهات المتصفح');
  const items=[...entries].sort((a,b)=>time(b)-time(a)).slice(0,12);
  center.querySelector('#bellList').innerHTML=items.length ? items.map(n=>
    `<button class="bell-alert ${n.read?'':'unread'}" type="button" data-note-id="${esc(n.id)}"><span class="bell-emoji">${icons[n.type]||'🔔'}</span><span><strong>${esc(n.title||label('Notification','إشعار'))}</strong><small>${esc(n.body||'')}</small><time>${new Date(time(n)||Date.now()).toLocaleString(arabic()?'ar-TN':'fr-FR',{dateStyle:'short',timeStyle:'short'})}</time></span></button>`).join('') : `<p class="bell-empty">${label('Aucune nouvelle notification.','لا توجد إشعارات جديدة.')}</p>`;
}
function toast(item){
  if(!item||location.pathname.endsWith('/notifications.html'))return;
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    try { const n=new Notification(item.title || 'Ben-Learning', {body: item.body || '', icon:'assets/icons/icon-192.png'}); n.onclick=()=>{window.focus();n.close();}; }
    catch(err){console.warn('Alerte système indisponible',err);}
  }
  if(document.hidden)return;
  let elem=document.getElementById('bellToast');
  if(!elem){elem=document.createElement('a');elem.id='bellToast';elem.className='bell-toast';document.body.appendChild(elem);}
  const dest=role==='admin'?'admin.html#admin-inbox':target(item);
  elem.href=dest;elem.innerHTML=`<span>${icons[item.type]||'🔔'}</span><span><b>${esc(item.title)}</b><small>${esc(item.body)}</small></span>`;
  elem.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>elem.hidden=true,7000);
}
function attachStudent(user){
  let first=true;
  const q=query(collection(db,'notifications'),where('userId','==',user.uid));
  unsubscribe.push(onSnapshot(q,snap=>{
    const next=snap.docs.map(d=>({id:d.id,...d.data()}));
    if(!first){const newcomers=next.filter(n=>!n.read&&!seen.has(n.id));if(newcomers.length)toast(newcomers.sort((a,b)=>time(b)-time(a))[0]);}
    seen=new Set(next.map(n=>n.id));first=false;entries=next;render();
  },error=>{console.warn('Notifications élèves indisponibles',error);centerError();}));
}
function centerError(){const el=document.getElementById('bellList');if(el)el.textContent=label('Connexion aux notifications impossible.','تعذر الاتصال بالإشعارات.');}
function attachAdmin(){
  let profiles=[],messages=[],submissions=[];
  let first=true;
  const combine=()=>{
    const pending=profiles.filter(p=>(p.status||'pending')==='pending').map(p=>({id:`reg-${p.id}`,type:'registration',title:label('Inscription en attente','تسجيل في الانتظار'),body:p.name||p.email||'',createdAtIso:p.createdAtIso,read:false}));
    const chats=messages.filter(m=>m.senderRole==='student'&&m.readByAdmin===false).map(m=>({id:`chat-${m.id}`,type:'chat',title:label('Nouveau message élève','رسالة جديدة من تلميذ'),body:`${m.studentName||'Élève'} : ${m.text||''}`,studentId:m.studentId,createdAtIso:m.createdAtIso,read:false}));
    const deliveries=submissions.filter(s=>s.status==='submitted'||s.status==='pending').map(s=>({id:`submission-${s.id}`,type:'submission',title:label('Devoir remis','واجب تم تسليمه'),body:s.studentName||s.studentEmail||'',createdAtIso:s.submittedAtIso,read:false}));
    entries=[...chats,...pending,...deliveries];
    if(!first) {const newcomer=entries.find(item=>!seen.has(item.id));if(newcomer)toast(newcomer);}
    first=false;seen=new Set(entries.map(i=>i.id));render();
  };
  unsubscribe.push(onSnapshot(query(collection(db,'users'),where('role','==','student')),s=>{profiles=s.docs.map(d=>({id:d.id,...d.data()}));combine();},error=>console.warn('Inscriptions indisponibles',error)));
  unsubscribe.push(onSnapshot(collection(db,'chatMessages'),s=>{messages=s.docs.map(d=>({id:d.id,...d.data()}));combine();},error=>console.warn('Messages indisponibles',error)));
  unsubscribe.push(onSnapshot(collection(db,'homeworkSubmissions'),s=>{submissions=s.docs.map(d=>({id:d.id,...d.data()}));combine();},error=>console.warn('Rendus indisponibles',error)));
}

construct();
window.addEventListener('bl:languagechange',()=>{addAdminLink();render();});
onAuthStateChanged(auth,async user=>{
  unsubscribe.forEach(stop=>stop());unsubscribe=[];role='';entries=[];seen=new Set();
  const center=document.getElementById('bellCenter');if(center)center.hidden=true;
  if(!user){addAdminLink();return;}
  try {
    const profile=await getDoc(doc(db,'users',user.uid));
    if(!profile.exists())return;
    role=profile.data().role==='admin'?'admin':'student';
    addAdminLink();
    if(role==='admin')attachAdmin();
    else if(user.emailVerified)attachStudent(user);
    else if(center)center.hidden=true;
  }catch(error){console.warn('Rôle Firebase non vérifié',error);}
});
