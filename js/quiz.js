let allQuestions = [];
let questions = [];
const session = JSON.parse(localStorage.getItem('bl_session') || 'null');
const form = document.getElementById('quizForm');
const container = document.getElementById('quizContainer');
const result = document.getElementById('quizResult');
const topicSelect = document.getElementById('quizTopic');
const questionCount = document.getElementById('quizQuestionCount');

function relevantQuestion(q) {
  if (!session) return false;
  if (q.level && q.level !== session.level && q.level !== 'Tous') return false;
  if (session.level === '1ère') return !q.level || q.level === '1ère' || q.level === 'Tous';
  return !q.section || q.section === 'Toutes' || q.section === 'Tronc commun' || q.section === session.section;
}

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

function normalizeQuestion(q, fallback = {}) {
  const answers = Array.isArray(q?.answers) ? q.answers : Array.isArray(q?.choices) ? q.choices : [];
  const correct = Number(q?.correct ?? q?.answer);
  if (!q || typeof q.question !== 'string' || answers.length < 2 || !Number.isInteger(correct)) return null;
  return {
    id: q.id || fallback.id || `question-${Date.now()}-${Math.random()}`,
    topic: q.topic || fallback.topic || fallback.domain || 'Informatique',
    question: q.question,
    answers,
    correct,
    level: q.level || fallback.level || 'Tous',
    section: q.section || fallback.section || 'Toutes',
    source: q.source || fallback.source || 'Ben-Learning'
  };
}

function expandCloudQuiz(quiz) {
  if (!Array.isArray(quiz?.questions)) return [];
  return quiz.questions.map((question, index) => normalizeQuestion(question, {
    id: `${quiz.id}-${index}`,
    topic: quiz.topic || quiz.title,
    domain: quiz.domain,
    level: quiz.level,
    section: quiz.section,
    source: quiz.source || 'SmartTeacher'
  })).filter(Boolean);
}

function render() {
  container.innerHTML = questions.map((q, index) => `
    <section class="quiz-card">
      <span class="eyebrow">${q.source === 'SmartTeacher' ? '☁ SmartTeacher · ' : ''}${esc(q.topic || 'Informatique')} · Question ${index + 1}</span>
      <h3>${esc(q.question)}</h3>
      <div class="quiz-options">${q.answers.map((answer, answerIndex) => `
        <label class="quiz-option"><input type="radio" name="q${index}" value="${answerIndex}"><span>${esc(answer)}</span></label>
      `).join('')}</div>
    </section>
  `).join('');
  questionCount.textContent = `${questions.length} question${questions.length > 1 ? 's' : ''}`;
  result.classList.add('hidden');
}

function applyTopic() {
  const topic = topicSelect.value;
  questions = topic === 'all' ? allQuestions : allQuestions.filter(q => q.topic === topic);
  render();
}

function populateTopics() {
  topicSelect.innerHTML = '<option value="all">Quiz général</option>';
  [...new Set(allQuestions.map(q => q.topic).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .forEach(topic => topicSelect.insertAdjacentHTML('beforeend', `<option value="${esc(topic)}">${esc(topic)}</option>`));
}

async function loadSeedQuestions() {
  try {
    const response = await fetch('data/quiz.json');
    if (!response.ok) return [];
    const data = await response.json();
    return data.map(item => normalizeQuestion(item)).filter(Boolean);
  } catch (error) {
    console.warn('Quiz locaux indisponibles', error);
    return [];
  }
}

async function loadCloudQuestions() {
  try {
    const [{ db }, { collection, getDocs }] = await Promise.all([
      import('./firebase.js'),
      import('https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js')
    ]);
    const snapshot = await getDocs(collection(db, 'quizzes'));
    return snapshot.docs.flatMap(document => expandCloudQuiz({ id: document.id, ...document.data() }));
  } catch (error) {
    console.warn('Quiz SmartTeacher indisponibles, utilisation des quiz locaux.', error);
    return [];
  }
}

async function init() {
  const [localQuestions, cloudQuestions] = await Promise.all([loadSeedQuestions(), loadCloudQuestions()]);
  const unique = new Map();
  [...localQuestions, ...cloudQuestions].filter(relevantQuestion).forEach(question => unique.set(String(question.id), question));
  allQuestions = [...unique.values()];
  populateTopics();

  if (!allQuestions.length) {
    container.innerHTML = `<div class="dashboard-empty"><span>📝</span><h3>Aucun quiz pour ${esc(session?.level || 'ton niveau')}</h3><p>Les quiz de ton niveau apparaîtront ici dès qu’ils seront disponibles.</p></div>`;
    questionCount.textContent = '0 question';
    form.querySelector('button[type=submit]').classList.add('hidden');
    return;
  }
  form.querySelector('button[type=submit]').classList.remove('hidden');
  applyTopic();
}

async function syncQuizToFirebase(currentSession, item) {
  if (!currentSession?.uid) return false;
  try {
    const [{ db }, { doc, setDoc, serverTimestamp }] = await Promise.all([
      import('./firebase.js'),
      import('https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js')
    ]);
    await setDoc(doc(db, 'quizResults', item.id), {
      userId: currentSession.uid,
      title: item.title,
      topic: item.topic,
      score: item.score,
      raw: item.raw,
      totalQuestions: questions.length,
      level: item.level,
      section: item.section,
      date: item.date,
      createdAtIso: item.createdAtIso,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.warn('Synchronisation quiz impossible', error);
    return false;
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!questions.length) return;

  let score = 0;
  let answered = 0;
  questions.forEach((question, index) => {
    const answer = document.querySelector(`input[name="q${index}"]:checked`);
    if (answer) {
      answered += 1;
      if (Number(answer.value) === question.correct) score += 1;
    }
  });

  if (answered < questions.length) {
    result.classList.remove('hidden');
    result.innerHTML = '<h2>Quiz incomplet</h2><p>Réponds à toutes les questions avant de valider.</p>';
    return;
  }

  const percentage = Math.round(score / questions.length * 100);
  const topic = topicSelect.value === 'all' ? 'Général' : topicSelect.value;
  result.classList.remove('hidden');
  result.innerHTML = `<h2>${percentage}%</h2><p>${esc(topic)} · Score : ${score}/${questions.length}. ${percentage >= 70 ? 'Bravo 🎉' : 'Continue à t’entraîner 💪'}</p><small id="quizSyncState">Enregistrement du résultat…</small>`;
  result.scrollIntoView({ behavior: 'smooth' });

  const currentSession = JSON.parse(localStorage.getItem('bl_session') || 'null');
  if (!currentSession) return;

  const now = new Date();
  const item = {
    id: `${currentSession.uid || 'local'}_${now.getTime()}`,
    title: `Quiz ${topic}`,
    topic,
    score: percentage,
    raw: `${score}/${questions.length}`,
    date: now.toISOString(),
    createdAtIso: now.toISOString(),
    level: currentSession.level || '',
    section: currentSession.section || ''
  };
  const key = `bl_quiz_${currentSession.email}`;
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  history.unshift(item);
  localStorage.setItem(key, JSON.stringify(history.slice(0, 50)));

  const synced = await syncQuizToFirebase(currentSession, item);
  const state = document.getElementById('quizSyncState');
  if (state) state.textContent = synced ? '☁️ Résultat synchronisé avec SmartTeacher.' : '💾 Résultat sauvegardé localement.';
});

topicSelect.addEventListener('change', applyTopic);
init();
