const REPLACED_COURSE_IDS=new Set(['premiere-production-numerique-2d-3d','premiere-production-numerique-modelisation-3d-smart-cross-road','5']);
let seedCourses=[];
let cloudCourses=[];
const container=document.getElementById('courseContainer');
const search=document.getElementById('search');
const session=JSON.parse(localStorage.getItem('bl_session')||'null');
const scopeText=document.getElementById('studentScopeText');
const trimester=document.getElementById('trimester');
const domain=document.getElementById('domain');
const chapter=document.getElementById('chapter');
const resourceType=document.getElementById('resourceType');
const empty=document.getElementById('emptyState');
const count=document.getElementById('courseCount');

function normalizeCourse(c){
  if(!c) return c;
  if(!c.section){
    const old=String(c.level||'');
    if(old.startsWith('Bac ')) c={...c,level:'Bac',section:old.replace('Bac ','')};
    else if(old.startsWith('3ème ')) c={...c,level:'3ème',section:old.replace('3ème ','')};
    else if(old.startsWith('2ème ')) c={...c,level:'2ème',section:old.replace('2ème ','')};
    else c={...c,section:old==='1ère'?'Tronc commun':'Informatique'};
  }
  return {...c,trimester:String(c.trimester||'1'),resourceType:c.resourceType||'Cours',chapter:c.chapter||(c.chapters||[])[0]||''};
}
function getLocalAdminCourses(){return JSON.parse(localStorage.getItem('bl_admin_courses')||'[]').map(normalizeCourse);}

function matchesStudent(course){
  if(!session||!course)return false;
  const c=normalizeCourse(course);
  if(String(c.level||'')!==String(session.level||''))return false;
  if(session.level==='1ère')return true;
  if(!session.section)return true;
  return !c.section||c.section==='Toutes'||c.section==='Tronc commun'||c.section===session.section;
}
function escapeHtml(v=''){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function dedupe(items){const map=new Map();for(const c of items.filter(Boolean)){const n=normalizeCourse(c);map.set(String(n.id),n);}return [...map.values()];}
function allCourses(){return dedupe([...seedCourses.map(normalizeCourse),...getLocalAdminCourses(),...cloudCourses.map(normalizeCourse)]).filter(c=>!REPLACED_COURSE_IDS.has(String(c.id))&&matchesStudent(c));}
function fillSelect(select,values,label){const current=select.value;select.innerHTML=`<option value="all">${label}</option>`;values.filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b),'fr')).forEach(v=>select.insertAdjacentHTML('beforeend',`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`));select.value=[...select.options].some(o=>o.value===current)?current:'all';}
function populateDynamicFilters(){
  const list=allCourses();
  fillSelect(domain,[...new Set(list.map(c=>c.domain))],'Tous les domaines');
  fillSelect(chapter,[...new Set(list.flatMap(c=>(c.chapters||[]).length?c.chapters:[c.chapter]).filter(Boolean))],'Tous les chapitres');
}
function displayCourses(list){
  container.innerHTML='';
  count.textContent=`${list.length} ressource${list.length>1?'s':''} disponible${list.length>1?'s':''}`;
  empty.classList.toggle('hidden',list.length>0);
  list.sort((a,b)=>String(a.level).localeCompare(String(b.level),'fr')||Number(a.trimester||1)-Number(b.trimester||1)||String(a.domain||'').localeCompare(String(b.domain||''),'fr'));
  list.forEach(c=>container.insertAdjacentHTML('beforeend',`<article class="course-card course-card-v4"><div class="course-icon">${escapeHtml(c.icon||'📘')}</div><div class="course-meta"><span>${escapeHtml(c.level)}</span><span>${escapeHtml(c.section||'')}</span><span>T${escapeHtml(c.trimester||'1')}</span><span>${escapeHtml(c.resourceType||'Cours')}</span></div><h2>${escapeHtml(c.title)}</h2><p class="course-domain-line">${escapeHtml(c.domain||'Informatique')} ${c.chapter?`· ${escapeHtml(c.chapter)}`:''}</p><p>${escapeHtml(c.description||'')}</p><a class="btn primary" href="course-details.html?id=${encodeURIComponent(c.id)}">Voir la ressource</a></article>`));
}
function filterCourses(){
  const text=search.value.trim().toLowerCase(); const t=trimester.value,d=domain.value,ch=chapter.value,rt=resourceType.value;
  displayCourses(allCourses().filter(c=>{
    const hay=`${c.title} ${c.description} ${c.domain} ${c.section} ${c.chapter} ${(c.chapters||[]).join(' ')} ${c.resourceType}`.toLowerCase();
    return hay.includes(text)&&(t==='all'||String(c.trimester||'1')===t)&&(d==='all'||c.domain===d)&&(ch==='all'||c.chapter===ch||(c.chapters||[]).includes(ch))&&(rt==='all'||(c.resourceType||'Cours')===rt);
  }));
}
async function loadCloudCourses(){
  try{
    const [{db},{collection,getDocs}]=await Promise.all([import('./firebase.js'),import('https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js')]);
    const snap=await getDocs(collection(db,'courses'));
    cloudCourses=snap.docs.map(d=>normalizeCourse({id:d.id,...d.data()})).filter(matchesStudent);
  }catch(error){console.warn('Cours Firestore indisponibles, utilisation du catalogue local.',error);cloudCourses=[];}
}
async function init(){
  if(!session){location.href='login.html';return;}
  if(scopeText)scopeText.textContent=`Contenu de ton parcours : ${session.level}${session.level==='1ère'?' · Tronc commun':session.section?` · ${session.section}`:''}. Seules les ressources de ton niveau sont affichées.`;
  try{const r=await fetch('data/courses.json');seedCourses=r.ok?(await r.json()).filter(matchesStudent):[];}catch{seedCourses=[];}
  await loadCloudCourses();populateDynamicFilters();filterCourses();
}
[search,trimester,domain,chapter,resourceType].forEach(el=>el?.addEventListener(el===search?'input':'change',filterCourses));
init();
