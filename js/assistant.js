/* Ben-Learning V7.4.4 — assistant pédagogique local et bilingue.
 * Aucun service d'IA générative, aucune clé API et aucune question envoyée à un tiers.
 * Les explications proviennent de data/assistant-knowledge.json ; les cours et le suivi
 * viennent du catalogue local / de Firestore selon les autorisations existantes.
 */
(() => {
  'use strict';
  const messages = document.getElementById('aiMessages');
  const form = document.getElementById('aiForm');
  const input = document.getElementById('aiInput');
  const contextPanel = document.getElementById('aiContext');
  const submit = document.getElementById('aiSend');
  if (!messages || !form || !input || !contextPanel) return;

  const session = (() => { try { return JSON.parse(localStorage.getItem('bl_session') || 'null'); } catch { return null; } })();
  if (!session?.uid) {
    location.replace('login.html?redirect=assistant.html');
    return;
  }

  const deletedCourses = new Set(['premiere-production-numerique-2d-3d', 'premiere-production-numerique-modelisation-3d-smart-cross-road', '5']);
  const state = { topics: [], courses: [], progress: [], quizzes: [], sessions: [], homework: [], submissions: [], lastTopic: null, loading: true };
  const lang = () => localStorage.getItem('bl_lang') === 'ar' ? 'ar' : 'fr';
  const labels = {
    fr: {
      bot: 'Ben — Aide pédagogique', you: 'Moi', welcome: 'Bonjour ! Pose une question sur ton cours : Python, algorithmique, Excel, SketchUp, HTML, Google Sites… Je peux expliquer une notion, donner un exemple et proposer un exercice.',
      sample: 'Exemple', steps: 'À retenir', code: 'Exemple de code', exercise: 'À toi de jouer', solution: 'Correction expliquée',
      simple: 'Expliquer simplement', example: 'Voir un exemple', practice: 'Proposer un exercice', correction: 'Voir la correction',
      openCourse: 'Consulter le cours', courseIntro: 'Ressource de ton niveau', alternative: 'Je n’ai pas de réponse suffisamment fiable à cette question dans ma bibliothèque actuelle. Reformule avec une notion précise (ex. « pourquoi == en Python ? »), consulte tes cours ou contacte ton enseignant.',
      courseFound: 'J’ai trouvé une ressource de ton niveau qui traite de ce sujet. Tu peux consulter son chapitre et ses exercices.',
      ready: 'Contenu pédagogique chargé', partial: 'Certains éléments du parcours ne sont pas disponibles. Les explications restent utilisables.',
      noSession: 'Aucune séance à venir n’est actuellement enregistrée pour ton niveau.', noHomework: 'Tu n’as aucun devoir en attente dans les données disponibles.',
      noCourse: 'Aucun nouveau cours dans les données disponibles pour ton parcours.', noData: 'Données de progression indisponibles pour le moment.',
      noQuiz: 'Tu n’as pas encore de résultat de quiz enregistré.', nextCourse: 'Prochain cours conseillé', nextSession: 'Prochaine séance', hwTitle: 'Tes devoirs', studyTitle: 'Plan de révision conseillé',
      overdue: 'Échéance dépassée', before: 'À rendre avant le', correctNoTopic: 'Choisis d’abord une notion et un exercice pour voir sa correction.',
      topicSuggestion: 'Essaie aussi ces thèmes', courseQuestions: 'Questions sur le cours', courseCompleted: 'cours terminés', quiz: 'quiz enregistrés', session: 'séance à venir', homework: 'devoirs à rendre',
      clearConfirm: 'Effacer les messages de cette conversation ?', copyCode: 'Copier le code', copied: 'Copié !', noChat: 'Poser ma question à l’enseignant', sourceNote: 'Réponses pédagogiques guidées : elles ne sont pas générées par une IA et ne remplacent pas ton enseignant.',
      localOnly: 'Base pédagogique locale + données de tes cours', noMatch: 'Je peux aussi t’aider avec les devoirs, les séances et ton prochain cours.',
      explainPrompt: 'Explique-moi la notion', questionPrompt: 'Pose ici ta question sur le cours…', send: 'Envoyer', loading: 'Chargement de ton parcours…'
    },
    ar: {
      bot: 'بن — المساعد البيداغوجي', you: 'أنا', welcome: 'مرحباً! اسأل عن دروس الإعلامية: Python، الخوارزميات، Excel، SketchUp، HTML وGoogle Sites. أستطيع شرح مفهوم وتقديم مثال وتمرين مع إصلاح.',
      sample: 'مثال', steps: 'أهم الخطوات', code: 'مثال برمجي', exercise: 'جرّب بنفسك', solution: 'الإصلاح المفسّر',
      simple: 'شرح مبسّط', example: 'أعطني مثالاً', practice: 'تمرين تطبيقي', correction: 'عرض الإصلاح',
      openCourse: 'افتح الدرس', courseIntro: 'مورد من مستواك', alternative: 'ليس لدي جواب موثوق لهذا السؤال في مكتبتي الحالية. حدّد المفهوم أكثر (مثلاً لماذا نكتب == في Python؟) أو استشر دروسك أو أستاذك.',
      courseFound: 'وجدت مورداً مناسباً لمستواك حول هذا الموضوع. يمكنك فتح الدرس وتمارينه.',
      ready: 'تم تحميل المحتوى التعليمي', partial: 'بعض بيانات مسارك غير متاحة. ما زال بإمكانك الاستفادة من الشروحات.',
      noSession: 'لا توجد حالياً حصة مقبلة مسجلة لمستواك.', noHomework: 'لا يوجد واجب غير منجز في البيانات المتاحة.',
      noCourse: 'لا توجد دروس جديدة في البيانات المتاحة لمسارك.', noData: 'تعذر تحميل بيانات التقدم حالياً.',
      noQuiz: 'ليس لديك أي نتيجة اختبار مسجلة بعد.', nextCourse: 'الدرس المقترح', nextSession: 'الحصة القادمة', hwTitle: 'واجباتك', studyTitle: 'برنامج مراجعة مقترح',
      overdue: 'انتهى الموعد', before: 'آخر أجل', correctNoTopic: 'اختر أولاً مفهوماً وتمريناً لعرض الإصلاح.',
      topicSuggestion: 'يمكنك أيضاً طرح أسئلة حول', courseQuestions: 'أسئلة حول الدرس', courseCompleted: 'دروس منجزة', quiz: 'اختبارات مسجلة', session: 'حصة مقبلة', homework: 'واجبات للإنجاز',
      clearConfirm: 'هل تريد حذف رسائل هذه المحادثة؟', copyCode: 'نسخ المثال', copied: 'تم النسخ!', noChat: 'اسأل الأستاذ مباشرة', sourceNote: 'هذه إجابات تعليمية موجّهة وليست مولّدة بواسطة ذكاء اصطناعي. يمكن الرجوع إلى الأستاذ.',
      localOnly: 'مكتبة تعليمية محلية + بيانات الدروس', noMatch: 'يمكنني أيضاً مساعدتك في الواجبات والحصص والدرس القادم.',
      explainPrompt: 'اشرح لي المفهوم', questionPrompt: 'اكتب سؤالك عن الدرس هنا…', send: 'إرسال', loading: 'جارٍ تحميل بياناتك…'
    }
  };
  const t = key => labels[lang()][key] || labels.fr[key] || key;
  const node = (tag, className, textValue) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textValue !== undefined && textValue !== null) element.textContent = String(textValue);
    return element;
  };
  const reflow = () => { messages.scrollTop = messages.scrollHeight; };
  const fmtDate = val => {
    let date = val?.toDate?.() || (val?.seconds ? new Date(val.seconds * 1000) : new Date(val || NaN));
    return !Number.isNaN(date.getTime()) ? date.toLocaleString(lang() === 'ar' ? 'ar-TN' : 'fr-TN', {dateStyle: 'medium', timeStyle: 'short'}) : '—';
  };
  const normalize = value => String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, '').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
    .replace(/[’']/g,' ').replace(/([^\p{L}\p{N}%=$]+)/gu,' ').replace(/\s+/g, ' ').trim();
  const words = value => normalize(value).split(' ').filter(Boolean);
  const stopwords = new Set('pour avec dans une les des sur pour faire comment pourquoi est il elle ils nous vous cela cette sont quoi quel quelle peux tu donne moi explique exemple cours exercice apprendre درس ما كيف لماذا هل أريد شرح مثال على في من إلى ماذا عند شرحلي أعمل نعمل'.split(' '));
  function matchAliases(question, aliases) {
    const q = ` ${normalize(question)} `;
    let best = 0;
    for (const alias of aliases || []) {
      const a = normalize(alias);
      if (!a) continue;
      if (q.includes(` ${a} `)) best = Math.max(best, 10 + Math.min(8, words(a).length * 2));
      else {
        const part = words(a).filter(w => w.length > 2 && !stopwords.has(w));
        if (part.length > 1) {
          const matching = part.filter(w => q.includes(` ${w} `)).length;
          if (matching >= 2) best = Math.max(best, 10 + matching * 2);
        }
      }
    }
    return best;
  }
  function topicMatch(question) {
    const q = normalize(question);
    const getTopic = id => state.topics.find(item => item.id === id) || null;
    if (q.includes('==') && /(pourquoi|difference|egalite|comparaison|لماذا|الفرق|الاختلاف)/.test(q)) return getTopic('python-equality');
    if (/(nombre pair|nombre impair|pair ou impair|modulo|parite|زوجي|فردي|% 2|%2)/.test(q)) return getTopic('python-parity');
    if (/double|doubler|ضعف العدد|مضاعف/.test(q)) return getTopic('python-double');
    if (/reference relative|reference absolue|المرجع النسبي|المرجع المطلق/.test(q)) return getTopic('excel-relative');
    const ranking = state.topics.map(topic => ({topic, score: Math.max(matchAliases(question, topic.aliases.fr), matchAliases(question, topic.aliases.ar))})).sort((a,b) => b.score - a.score);
    return ranking[0]?.score >= 8 ? ranking[0].topic : null;
  }
  function relevant(resource) {
    if (resource.level && resource.level !== session.level && resource.level !== 'Tous') return false;
    if (session.level === '1ère') return true;
    return !resource.section || ['Toutes','Tous','Tronc commun'].includes(resource.section) || resource.section === session.section;
  }
  function completedIds() { return new Set(state.progress.filter(x => x.completed !== false).map(x => String(x.courseId ?? x.id))); }
  function nextCourse() { const done = completedIds(); return state.courses.filter(relevant).find(c => !done.has(String(c.id))); }
  function upcomingSessions() { return state.sessions.filter(relevant).filter(s => new Date(s.startAtIso || s.startAt?.toDate?.() || s.dateTime || '') > new Date()).sort((a,b) => new Date(a.startAtIso || a.startAt?.toDate?.() || a.dateTime)-new Date(b.startAtIso || b.startAt?.toDate?.() || b.dateTime)); }
  function pendingHomework() {
    const submitted = new Set(state.submissions.map(s => String(s.homeworkId)));
    return state.homework.filter(relevant).filter(h => !submitted.has(String(h.id))).sort((a,b) => new Date(a.dueAtIso || a.dueAt || 0) - new Date(b.dueAtIso || b.dueAt || 0));
  }
  function findCourses(question, topic) {
    const query = words(question).filter(w => w.length >= 3 && !stopwords.has(w));
    const context = words([topic?.fr.title, topic?.ar.title].join(' '));
    const tokens = [...new Set([...query, ...context.filter(w => w.length >= 5)])];
    if (!tokens.length) return [];
    return state.courses.filter(relevant).map(c => {
      const head = normalize([c.title,c.domain,c.chapter].join(' '));
      const body = normalize([c.description,c.summary,c.simpleExplanation, ...(Array.isArray(c.chapters)? c.chapters:[])].join(' '));
      let score = tokens.reduce((sum,w)=>sum + (head.includes(w)?3:0) + (body.includes(w)?1:0),0);
      if (topic?.id.startsWith('python') && /python/i.test([c.title,c.domain].join(' '))) score += 3;
      if (topic?.id.startsWith('excel') && /excel|tableur|bureautique/i.test([c.title,c.domain].join(' '))) score += 3;
      if (topic?.id.startsWith('sketchup') && /sketchup|production numerique|3d/i.test(normalize([c.title,c.domain,c.description].join(' ')))) score += 3;
      if (topic?.id.startsWith('algo') && /algorith|resolution de probleme/i.test(normalize([c.title,c.domain].join(' ')))) score += 3;
      return {c,score};
    }).filter(x => x.score >= 3).sort((a,b)=>b.score-a.score).slice(0,2).map(x=>x.c);
  }
  function post(role, data = {}) {
    const item = node('article', `ai-message ${role}`);
    item.appendChild(node('span','ai-avatar',role==='bot'?'✦':'👤'));
    const bubble = node('div','ai-bubble');
    bubble.appendChild(node('strong','ai-author',role==='bot'?t('bot'):(session.name||t('you'))));
    if (typeof data === 'string') bubble.appendChild(node('p','ai-paragraph',data));
    else {
      if (data.title) bubble.appendChild(node('h3','ai-answer-heading',data.title));
      if (data.text) bubble.appendChild(node('p','ai-paragraph',data.text));
      if (Array.isArray(data.steps) && data.steps.length) {
        bubble.appendChild(node('h4','ai-answer-label',t('steps')));
        const list = node('ol','ai-steps');
        data.steps.forEach(step => list.appendChild(node('li','',step)));
        bubble.appendChild(list);
      }
      if (data.example) { bubble.appendChild(node('h4','ai-answer-label',t('sample'))); bubble.appendChild(node('p','ai-paragraph',data.example)); }
      if (data.code) {
        const heading = node('div','ai-code-heading');
        heading.appendChild(node('span','',t('code')));
        const copy = node('button','ai-copy-code',t('copyCode')); copy.type='button'; copy.addEventListener('click',async()=>{
          try { await navigator.clipboard.writeText(data.code); copy.textContent=t('copied'); setTimeout(()=>copy.textContent=t('copyCode'),1500); }
          catch { /* clipboard may be unavailable on insecure origins */ }
        }); heading.appendChild(copy); bubble.appendChild(heading);
        const pre = node('pre','ai-code'); const code = node('code','',data.code); code.dir='ltr'; pre.appendChild(code); bubble.appendChild(pre);
      }
      if (data.exercise) {
        bubble.appendChild(node('h4','ai-answer-label',t('exercise')));
        bubble.appendChild(node('p','ai-paragraph',data.exercise));
      }
      if (data.solution) {
        bubble.appendChild(node('h4','ai-answer-label',t('solution')));
        const sol = node('pre','ai-solution',data.solution); sol.dir='auto'; bubble.appendChild(sol);
      }
      if (data.courses?.length) {
        const links = node('div','ai-source-list');
        links.appendChild(node('h4','ai-answer-label',t('courseIntro')));
        data.courses.forEach(c => {
          const a = node('a','ai-source-link',`📘 ${c.title || 'Cours'} · ${t('openCourse')} ↗`);
          a.href = `course-details.html?id=${encodeURIComponent(String(c.id))}`;
          links.appendChild(a);
        }); bubble.appendChild(links);
      }
      if (data.actions?.length) {
        const actions=node('div','ai-reply-actions');
        data.actions.forEach(({label,action,id})=>{
          const b=node('button','ai-reply-action',label);b.type='button';
          b.dataset.action=action;b.dataset.topic=id||''; actions.appendChild(b);
        }); bubble.appendChild(actions);
      }
    }
    item.appendChild(bubble); messages.appendChild(item); reflow(); return item;
  }
  function showTopic(topic, mode='full') {
    state.lastTopic = topic;
    const content = topic[lang()] || topic.fr;
    const data={title:content.title};
    if(mode==='full'||mode==='simple'){ data.text=content.explanation; data.steps=mode==='simple' ? content.steps.slice(0,2) : content.steps; }
    if(mode==='full'||mode==='example'){ data.example=content.example;data.code=content.code; }
    if(mode==='exercise') data.exercise=content.exercise;
    if(mode==='solution') { data.exercise=content.exercise; data.solution=content.solution; }
    if(mode==='full'||mode==='example') data.courses=findCourses(content.title,topic);
    data.actions = [
      {label:t('simple'),action:'simple',id:topic.id},
      {label:t('example'),action:'example',id:topic.id},
      {label:t('practice'),action:'exercise',id:topic.id},
      {label:t('correction'),action:'solution',id:topic.id}
    ].filter(a => mode!=='solution'||a.action!=='solution');
    post('bot',data);
  }
  function respond(query) {
    const q = normalize(query);
    const recent = state.lastTopic;
    // Explicit follow-ups about the topic previously explained.
    if (recent && /^(un exemple|donne moi un exemple|exemple|مثال|اعطني مثال|montre un exemple)$/.test(q)) return showTopic(recent,'example');
    if (recent && /^(un exercice|exercice|donne moi un exercice|تمرين|اعطني تمرين)$/.test(q)) return showTopic(recent,'exercise');
    if (recent && /^(correction|corrige|solution|الاصلاح|حل التمرين)$/.test(q)) return showTopic(recent,'solution');
    if (recent && /^(explique simplement|plus simple|بسط الشرح|شرح مبسط)$/.test(q)) return showTopic(recent,'simple');

    // User's actual study data and planning: only after clear intent.
    if (/(devoir|travail a rendre|واجب|فروض)/.test(q) && !/(code|programme|algorithme)/.test(q)) {
      const todo=pendingHomework();
      return post('bot',{title:t('hwTitle'),text:todo.length ? `${todo.length} ${t('homework')}.` : t('noHomework'),steps:todo.slice(0,3).map(h=>`${h.title || 'Devoir'} — ${t('before')} ${fmtDate(h.dueAtIso||h.dueAt)}`),actions:[{label:t('hwTitle'),action:'homework'}]});
    }
    if (/(seance|meet|planning|rendez vous|الحصه|الحصة|حصص|موعد)/.test(q)) {
      const meeting=upcomingSessions()[0];
      return post('bot',{title:t('nextSession'),text:meeting?`${meeting.title || 'Séance'} — ${fmtDate(meeting.startAtIso||meeting.startAt||meeting.dateTime)}.`:t('noSession'),actions:meeting?[{label:t('nextSession'),action:'sessions'}]:[]});
    }
    if (/(prochain cours|cours suivant|continuer|الدرس القادم|ماذا ادرس)/.test(q)) {
      const course=nextCourse();
      return post('bot',{title:t('nextCourse'),text:course?`${course.title || 'Cours'} — ${course.description || ''}`:t('noCourse'),courses:course?[course]:[]});
    }
    if (/(revision|reviser|plan de|priorit|programme de revision|مراجعه|المراجعه|برنامج مراجعه)/.test(q)) {
      const next=nextCourse(),homework=pendingHomework(),meet=upcomingSessions()[0];
      const steps=[];
      if(next)steps.push(`${t('nextCourse')} : ${next.title}.`);
      if(homework[0])steps.push(`${t('hwTitle')} : ${homework[0].title} — ${fmtDate(homework[0].dueAtIso||homework[0].dueAt)}.`);
      if(meet)steps.push(`${t('nextSession')} : ${meet.title} — ${fmtDate(meet.startAtIso||meet.startAt)}.`);
      if(!steps.length) steps.push(t('noData'));
      return post('bot',{title:t('studyTitle'),steps,courses:next?[next]:[]});
    }
    if (/(resultat quiz|note quiz|moyenne quiz|نتائج الاختبار)/.test(q)) {
      return post('bot',{title:t('quiz'),text:state.quizzes.length ? `${state.quizzes.length} ${t('quiz')}.` : t('noQuiz')});
    }
    const topic=topicMatch(query);
    if(topic) return showTopic(topic);
    const possibleCourses=findCourses(query);
    if(possibleCourses.length) {
      const found=possibleCourses[0];
      const excerpt=String(found.simpleExplanation || found.summary || found.description || '').trim().slice(0,650);
      const example=Array.isArray(found.examples)?found.examples.filter(x=>typeof x==='string').slice(0,2).join('\n'):(typeof found.examples==='string'?found.examples:'');
      return post('bot',{title:t('courseQuestions'),text:excerpt ? `${t('courseFound')}\n${excerpt}` : t('courseFound'),example:example.slice(0,600),courses:possibleCourses,actions:[{label:t('noChat'),action:'teacher'}]});
    }
    return post('bot',{text:`${t('alternative')} ${t('noMatch')}`,actions:[{label:t('noChat'),action:'teacher'}]});
  }
  function updateContext() {
    contextPanel.replaceChildren();
    const relevantCourses=state.courses.filter(relevant).length;
    const done=completedIds().size;
    const items=[
      ['🎓',`${session.level || '—'} · ${session.section || '—'}`],
      ['📚',`${Math.min(done,relevantCourses)}/${relevantCourses} ${t('courseCompleted')}`],
      ['🧠',`${state.quizzes.length} ${t('quiz')}`],
      ['📅',`${upcomingSessions().length} ${t('session')}`],
      ['📌',`${pendingHomework().length} ${t('homework')}`]
    ];
    for (const [icon,label] of items) {
      const row=node('div','');row.appendChild(node('span','',icon)); row.appendChild(node('b','',label));contextPanel.appendChild(row);
    }
  }
  async function load() {
    const settled=await Promise.allSettled([
      fetch('./data/assistant-knowledge.json', {cache:'no-cache'}).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();}),
      fetch('./data/courses.json').then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();})
    ]);
    if(settled[0].status==='fulfilled' && Array.isArray(settled[0].value)) state.topics=settled[0].value;
    if(settled[1].status==='fulfilled' && Array.isArray(settled[1].value)) state.courses=settled[1].value.filter(c=>!deletedCourses.has(String(c.id)));
    try {
      const [{ db }, fs] = await Promise.all([import('./firebase.js'), import('https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js')]);
      const queries = [
        fs.collection(db,'courses'),
        fs.query(fs.collection(db,'courseProgress'),fs.where('userId','==',session.uid)),
        fs.query(fs.collection(db,'quizResults'),fs.where('userId','==',session.uid)),
        fs.collection(db,'sessions'), fs.collection(db,'homework'),
        fs.query(fs.collection(db,'homeworkSubmissions'),fs.where('userId','==',session.uid))
      ];
      const results=await Promise.allSettled(queries.map(q=>fs.getDocs(q)));
      const collections=results.map(s=>s.status==='fulfilled'?s.value.docs.map(doc=>({id:doc.id,...doc.data()})):[]);
      const map=new Map(state.courses.map(c=>[String(c.id),c]));
      collections[0].forEach(c=>{if(!deletedCourses.has(String(c.id)))map.set(String(c.id),c);});
      state.courses=[...map.values()];
      state.progress=collections[1]; state.quizzes=collections[2];state.sessions=collections[3];state.homework=collections[4];state.submissions=collections[5];
      if(results.some(s=>s.status==='rejected'))console.warn('Ben assistant : certaines données Firebase sont indisponibles.');
    } catch(error) { console.warn('Ben assistant : données Firebase indisponibles.',error); }
    state.loading=false;
    const hint=document.getElementById('aiLoadStatus');
    if(hint) hint.textContent=state.topics.length ? `${t('ready')} · ${state.topics.length} ${lang()==='ar'?'موضوعاً':'thèmes'}` : t('partial');
    updateContext();
  }

  function onPrompt(query) {
    const question=String(query||'').trim(); if(!question)return;
    post('user',question);respond(question);
  }
  form.addEventListener('submit',event=>{event.preventDefault();const q=input.value.trim();if(!q)return;input.value='';onPrompt(q);input.focus();});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();form.requestSubmit();}});
  document.addEventListener('click',event=>{
    const button=event.target.closest('.ai-reply-action'); if(!button)return;
    const action=button.dataset.action; const topic=state.topics.find(t=>t.id===button.dataset.topic);
    if(['simple','example','exercise','solution'].includes(action)&&topic) return showTopic(topic,action);
    if (action==='teacher') return location.assign('chat.html');
    if (action==='homework') return location.assign('homework.html');
    if (action==='sessions') return location.assign('sessions.html');
  });
  document.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>onPrompt(lang()==='ar' ? (button.dataset.promptAr||button.dataset.prompt) : button.dataset.prompt)));
  document.querySelectorAll('[data-topic-id]').forEach(button=>button.addEventListener('click',()=>{
    const topic=state.topics.find(t=>t.id===button.dataset.topicId);
    if(topic){post('user',topic[lang()].title);showTopic(topic);}
    else input.value=button.textContent.trim();
  }));
  document.getElementById('aiClear')?.addEventListener('click',()=>{
    if(!confirm(t('clearConfirm')))return;
    state.lastTopic=null; messages.replaceChildren(); post('bot',t('welcome'));
  });
  function refreshLanguage() {
    document.querySelectorAll('.ai-pro-page [data-fr][data-ar]').forEach(el=>{ el.textContent = lang()==='ar' ? el.dataset.ar : el.dataset.fr; });
    if(submit) submit.textContent=t('send');
    input.placeholder=t('questionPrompt');
    const hint=document.getElementById('aiLoadStatus');
    if(hint && !state.loading) hint.textContent=`${t('ready')} · ${state.topics.length} ${lang()==='ar'?'موضوعاً':'thèmes'}`;
    updateContext();
  }
  window.addEventListener('bl:languagechange',refreshLanguage);
  refreshLanguage();
  post('bot',t('welcome'));
  if(submit)submit.disabled=false;
  load();
})();
