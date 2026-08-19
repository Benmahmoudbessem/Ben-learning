let seedCourses=[];
const container=document.getElementById('courseContainer');
const search=document.getElementById('search');
const level=document.getElementById('level');
const section=document.getElementById('section');
const domain=document.getElementById('domain');
const empty=document.getElementById('emptyState');
const count=document.getElementById('courseCount');

function normalizeCourse(c){
  if(c.section) return c;
  const old=String(c.level||'');
  if(old.startsWith('Bac ')) return {...c,level:'Bac',section:old.replace('Bac ','')};
  if(old.startsWith('3ème ')) return {...c,level:'3ème',section:old.replace('3ème ','')};
  if(old.startsWith('2ème ')) return {...c,level:'2ème',section:old.replace('2ème ','')};
  return {...c,section:old==='1ère'?'Tronc commun':'Informatique'};
}
function getAdminCourses(){return JSON.parse(localStorage.getItem('bl_admin_courses')||'[]').map(normalizeCourse);}
function allCourses(){return [...seedCourses.map(normalizeCourse),...getAdminCourses()];}
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function populateDomains(){
  const current=domain.value;
  domain.innerHTML='<option value="all">Tous les domaines</option>';
  [...new Set(allCourses().map(c=>c.domain).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr')).forEach(v=>domain.insertAdjacentHTML('beforeend',`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`));
  domain.value=[...domain.options].some(o=>o.value===current)?current:'all';
}
function displayCourses(list){
  container.innerHTML='';
  count.textContent=`${list.length} cours disponible${list.length>1?'s':''}`;
  empty.classList.toggle('hidden',list.length>0);
  list.forEach(c=>container.insertAdjacentHTML('beforeend',`<article class="course-card"><div class="course-icon">${escapeHtml(c.icon||'📘')}</div><div class="course-meta"><span>${escapeHtml(c.level)}</span><span>${escapeHtml(c.section||'')}</span><span>${escapeHtml(c.domain||'Informatique')}</span></div><h2>${escapeHtml(c.title)}</h2><p>${escapeHtml(c.description)}</p><a class="btn primary" href="course-details.html?id=${encodeURIComponent(c.id)}">Voir le cours</a></article>`));
}
function filterCourses(){
  const text=search.value.trim().toLowerCase();
  const l=level.value,d=domain.value,s=section.value;
  displayCourses(allCourses().filter(c=>`${c.title} ${c.description} ${c.domain} ${c.section}`.toLowerCase().includes(text)&&(l==='all'||c.level===l)&&(s==='all'||c.section===s)&&(d==='all'||c.domain===d)));
}
fetch('data/courses.json').then(r=>r.json()).then(data=>{seedCourses=data.map(normalizeCourse);populateDomains();displayCourses(allCourses());}).catch(()=>{seedCourses=[];populateDomains();displayCourses(allCourses());});
search.addEventListener('input',filterCourses);level.addEventListener('change',filterCourses);section.addEventListener('change',filterCourses);domain.addEventListener('change',filterCourses);
