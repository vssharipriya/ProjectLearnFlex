/* LearnFlex quality upgrades: progressive hints, transparent teacher insights,
   local-first recovery checks, and accessibility/status refinements. No generative AI. */
(function () {
  'use strict';
  const baseRenderQuiz = renderQuiz;
  const hintProgress = new Map();
  const safe = value => escapeHTML(String(value == null ? '' : value));
  const keyFor = () => activeQuiz ? `${currentUser?.id || 'guest'}:${activeQuiz.topicId}:${activeQuiz.questions[activeQuestion]?.id || activeQuestion}` : '';

  function hintContent(level, topic, question) {
    const lang = currentLanguage || 'en';
    const labels = {
      en: ['Hint 1 · Understand the task','Hint 2 · Recall the key idea','Hint 3 · Use a worked example'],
      te: ['సూచన 1 · ప్రశ్నను అర్థం చేసుకోండి','సూచన 2 · ముఖ్య భావాన్ని గుర్తు చేసుకోండి','సూచన 3 · ఉదాహరణను ఉపయోగించండి'],
      hi: ['संकेत 1 · प्रश्न को समझें','संकेत 2 · मुख्य विचार याद करें','संकेत 3 · हल किया उदाहरण देखें']
    };
    const localized = topic.lessonI18n && topic.lessonI18n[lang];
    const prompts = {
      en: 'Pause and identify what the question is asking. Underline the important words, numbers or conditions. What information is given, and what must you find?',
      te: 'ప్రశ్న ఏమి అడుగుతోందో గుర్తించండి. ముఖ్యమైన పదాలు, సంఖ్యలు లేదా షరతులను గుర్తించి, ఇచ్చిన సమాచారం మరియు కనుగొనాల్సిన విషయాన్ని వేరు చేయండి.',
      hi: 'पहचानें कि प्रश्न क्या पूछ रहा है। मुख्य शब्दों, संख्याओं और शर्तों को पहचानें। दी गई जानकारी और जो खोजना है, उन्हें अलग करें।'
    };
    const fallback = 'Recall the main idea from the lesson. Choose a rule or representation that matches the question, then apply one step at a time.';
    if (level === 1) return { title: labels[lang]?.[0] || labels.en[0], body: prompts[lang] || prompts.en };
    if (level === 2) return { title: labels[lang]?.[1] || labels.en[1], body: localized?.lesson || topic.lesson || fallback };
    return { title: labels[lang]?.[2] || labels.en[2], body: `${localized?.example || topic.example || 'Model the problem with a drawing or table.'} ${lang==='te'?'ఇప్పుడు ఇదే ఆలోచనా విధానాన్ని ఈ ప్రశ్నకు వర్తింపజేయండి.':lang==='hi'?'अब इसी सोच को इस प्रश्न पर लागू करें।':'Now try the question again using the same reasoning, but with its own values and details.'}` };
  }

  window.learnflexRevealHint = function () {
    if (!activeQuiz) return;
    const topic = db.topics.find(t => t.id === activeQuiz.topicId);
    const q = activeQuiz.questions[activeQuestion];
    if (!topic || !q || quizAnswers[activeQuestion] !== undefined) return;
    const key = keyFor();
    const level = Math.min(3, (hintProgress.get(key) || 0) + 1);
    hintProgress.set(key, level);
    renderQuiz();
  };

  renderQuiz = function () {
    baseRenderQuiz();
    if (!activeQuiz || !$('#pageContent .question-title')) return;
    const topic = db.topics.find(t => t.id === activeQuiz.topicId);
    const q = activeQuiz.questions[activeQuestion];
    if (!topic || !q) return;
    const submitted = quizAnswers[activeQuestion] !== undefined;
    const level = hintProgress.get(keyFor()) || 0;
    const panel = document.createElement('section');
    panel.className = 'learnflex-progressive-hints';
    panel.setAttribute('aria-live', 'polite');
    panel.style.cssText = 'margin:14px 0;padding:14px 16px;border:1px solid var(--line,#dce5dd);border-radius:14px;background:var(--surface-soft,#f7faf7)';
    if (submitted) {
      panel.innerHTML = `<b>Learning support</b><p class="subtle" style="margin:6px 0 0">${level ? `You used ${level} of 3 optional hints.` : 'Hints were available before you submitted.'} Review the explanation and misconception feedback below before moving on.</p>`;
    } else {
      const hint = level ? hintContent(level, topic, q) : null;
      panel.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><b>Need a little help?</b><p class="subtle" style="margin:4px 0 0">Reveal hints one at a time. Your score is not reduced.</p></div><button type="button" class="btn soft small" id="learnflexHintButton" ${level>=3?'disabled':''}>${level>=3?'All hints shown':'Show hint '+(level+1)+' of 3'}</button></div>${hint?`<div class="feedback-box good" style="margin-top:12px"><b>${safe(hint.title)}</b><p style="margin:6px 0 0">${safe(hint.body)}</p></div>`:''}`;
      panel.querySelector('#learnflexHintButton')?.addEventListener('click', window.learnflexRevealHint);
    }
    const questionTitle = $('#pageContent .question-title');
    questionTitle.insertAdjacentElement('beforebegin', panel);

    const countEl = $('#pageContent .question-count');
    if (countEl && !countEl.querySelector('.tier-explain-badge')) {
      const tier = activeQuiz.tier || q.difficulty || 'standard';
      const badge = document.createElement('span');
      badge.className = 'tier-explain-badge pill ' + (tier==='challenge'?'hard':tier==='foundation'?'easy':'medium');
      badge.style.cssText = 'margin-left:8px;font-size:9px;vertical-align:middle;text-transform:none';
      badge.textContent = `🎯 Tier: ${tier.charAt(0).toUpperCase() + tier.slice(1)}`;
      badge.title = 'LearnFlex adaptive difficulty automatically calibrated to your learning pace';
      countEl.appendChild(badge);
    }
  };

  // A compact class-scoped insight summary. Synthetic demo profiles are never included.
  const baseInsightsPage = insightsPage;
  insightsPage = function () {
    baseInsightsPage();
    if (currentUser?.role !== 'teacher') return;
    const roster = teacherStudents();
    const ids = new Set(roster.map(s => s.id));
    const realAttempts = (db.results || []).filter(r => ids.has(r.userId) && !r.demoScenario && r.kind !== 'targeted-check');
    const latestByStudent = roster.map(s => {
      const latest = realAttempts.filter(r => r.userId === s.id).sort((a,b) => new Date(b.date)-new Date(a.date))[0];
      return { student:s, latest };
    });
    const active = latestByStudent.filter(x => x.latest);
    const improving = active.filter(x => {
      const history = realAttempts.filter(r => r.userId === x.student.id).sort((a,b)=>new Date(a.date)-new Date(b.date));
      return history.length >= 2 && history.at(-1).score > history[0].score;
    }).length;
    const noEvidence = roster.length - active.length;
    const followUps = (db.diagnosticChecks || []).filter(x => ids.has(x.userId));
    const verified = followUps.filter(x => x.followUpOutcome === 'correct').length;
    const pending = followUps.filter(x => x.followUpOutcome === 'pending').length;
    const section = document.createElement('section');
    section.className = 'quality-insight-summary';
    section.innerHTML = `<div class="section-title"><div><h3>Evidence quality & next actions</h3><p>Real learner attempts only. Empty data is shown as “not yet measured”, never as zero learning.</p></div><span class="pill">Class-scoped</span></div><div class="grid four"><div class="card stat-card"><div class="stat-number">${realAttempts.length}</div><div class="stat-label">Real assessments</div><p class="subtle">Synthetic demo records excluded</p></div><div class="card stat-card"><div class="stat-number">${active.length}/${roster.length}</div><div class="stat-label">Learners with evidence</div><p class="subtle">${noEvidence} not yet assessed</p></div><div class="card stat-card"><div class="stat-number">${improving}</div><div class="stat-label">Showing score growth</div><p class="subtle">At least two attempts, latest above first</p></div><div class="card stat-card"><div class="stat-number">${verified}/${followUps.length}</div><div class="stat-label">Follow-ups correct</div><p class="subtle">${pending} pending checks</p></div></div><div class="card"><b>Suggested teacher workflow</b><ol class="learning-steps"><li>Start with chapters where several learners have a latest score below 70%.</li><li>Open the question-level misconception signals and ask learners to explain their reasoning before assigning a cause.</li><li>Use a fresh follow-up question to check whether the explanation helped.</li><li>Compare later chapter assessments; do not treat an immediate follow-up as proof of long-term mastery.</li><li>Record pilot evidence only after school-approved consent is documented.</li></ol></div>`;
    $('#pageContent').appendChild(section);
  };

  // Keep offline work usable and retry authenticated sync when connectivity returns.
  let syncRetryQueued = false;
  async function retrySyncWhenReady() {
    if (syncRetryQueued || !navigator.onLine || !currentUser || !sessionStorage.getItem('learnflex_access_token')) return;
    syncRetryQueued = true;
    try {
      if (typeof syncStateToServer === 'function') await syncStateToServer();
      const badge = $('#globalConnectionBadge');
      if (badge) badge.textContent = backendConnected ? '● Online · changes synced' : '● Online · local copy saved';
    } finally { syncRetryQueued = false; }
  }
  window.addEventListener('online', () => setTimeout(retrySyncWhenReady, 250));
  window.addEventListener('focus', retrySyncWhenReady);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) retrySyncWhenReady(); });

  // A small, explicit privacy reminder is visible in the learner workspace.
  const baseStudentOverview = studentOverview;
  studentOverview = function () {
    baseStudentOverview();
    const note = document.createElement('div');
    note.className = 'card privacy-reminder';
    note.style.cssText = 'margin-top:18px';
    note.innerHTML = '<b>Privacy reminder</b><p class="subtle" style="margin:6px 0 0">Use only your own demo login. Do not enter phone numbers, home addresses, passwords used elsewhere, or other sensitive personal information. Your browser keeps a local copy; shared sync needs an authenticated project server.</p>';
    $('#pageContent')?.appendChild(note);
  };
})();
