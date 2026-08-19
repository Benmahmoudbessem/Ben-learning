const id=new URLSearchParams(location.search).get('id');
const shell=document.getElementById('courseDetail');
function adminCourses(){return JSON.parse(localStorage.getItem('bl_admin_courses')||'[]');}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function normalizeCourse(c){
  if(c.section) return c;
  const old=String(c.level||'');
  if(old.startsWith('Bac ')) return {...c,level:'Bac',section:old.replace('Bac ','')};
  if(old.startsWith('3ème ')) return {...c,level:'3ème',section:old.replace('3ème ','')};
  if(old.startsWith('2ème ')) return {...c,level:'2ème',section:old.replace('2ème ','')};
  return {...c,section:old==='1ère'?'Tronc commun':'Informatique'};
}
function youtubeEmbed(url=''){if(!url)return'';try{if(url.includes('youtube.com/watch?v=')){const v=new URL(url).searchParams.get('v');return `https://www.youtube.com/embed/${v}`;}if(url.includes('youtu.be/'))return `https://www.youtube.com/embed/${url.split('youtu.be/')[1].split('?')[0]}`;}catch(e){}return url;}

async function getLocalFileButton(course){
  if(!course.localFileKey) return '';
  try{
    const stored=await getCourseFile(course.localFileKey);
    if(!stored) return '<span class="file-unavailable">📎 Fichier local indisponible sur cet appareil</span>';
    const url=URL.createObjectURL(stored.blob);
    return `<a class="btn secondary" href="${url}" target="_blank" download="${esc(stored.name)}">📂 Ouvrir ${esc(stored.name)}</a>`;
  }catch(e){
    return '<span class="file-unavailable">📎 Impossible de lire le fichier local</span>';
  }
}

async function render(course){
  course=normalizeCourse(course);
  const chapters=(course.chapters||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>Contenu à venir.</li>';
  const exercises=(course.exercises||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>Exercices à venir.</li>';
  const video=youtubeEmbed(course.video||'');
  const localButton=await getLocalFileButton(course);
  shell.innerHTML=`<section class="course-detail-hero"><div><span class="eyebrow">${esc(course.level)} · ${esc(course.section||'')} · ${esc(course.domain||'Informatique')}</span><h1>${esc(course.title)}</h1><p>${esc(course.description||course.summary||'')}</p><div class="resource-actions">${localButton}${course.pdf?`<a class="btn secondary" href="${esc(course.pdf)}" target="_blank" rel="noopener">🔗 Ouvrir le fichier en ligne</a>`:''}<button class="btn primary" id="completeBtn">✅ Marquer comme terminé</button></div></div><div class="detail-icon">${esc(course.icon||'📘')}</div></section><div class="detail-grid"><section class="detail-block"><h2>📚 Chapitres</h2><ol class="chapter-list">${chapters}</ol></section><section class="detail-block"><h2>📝 Exercices</h2><ul class="exercise-list">${exercises}</ul></section>${video?`<section class="detail-block" style="grid-column:1/-1"><h2>🎥 Vidéo</h2><div class="video-wrap"><iframe src="${esc(video)}" title="Vidéo du cours" allowfullscreen></iframe></div></section>`:''}</div>`;
  document.getElementById('completeBtn').addEventListener('click',()=>completeCourse(course));
}
function completeCourse(course){const session=JSON.parse(localStorage.getItem('bl_session')||'null');if(!session){location.href='login.html';return;}const key=`bl_progress_${session.email}`;const list=JSON.parse(localStorage.getItem(key)||'[]');if(!list.some(x=>String(x.id)===String(course.id)))list.push({id:course.id,title:course.title,date:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(list));alert('Cours marqué comme terminé ✅');}
fetch('data/courses.json').then(r=>r.json()).then(seed=>{const course=[...seed,...adminCourses()].find(c=>String(c.id)===String(id));if(!course){shell.innerHTML='<div class="empty-state"><h3>Cours introuvable</h3><a class="btn primary" href="courses.html">Retour</a></div>';return;}render(course);}).catch(()=>{const course=adminCourses().find(c=>String(c.id)===String(id));course?render(course):shell.innerHTML='<p>Impossible de charger ce cours.</p>';});
