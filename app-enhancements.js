/* LearnFlex adaptive-learning upgrade. Loaded after app.js and before init(). */
(function () {
  const curriculum = window.LEARNFLEX_CURRICULUM;
  const engine = window.LearnFlexEngine;
  if (!curriculum || !engine) throw new Error('LearnFlex curriculum or adaptive engine did not load.');

  let pendingOptionIndex = null;
  let targetedContext = null;
  let suspendedQuiz = null;
  let targetedFeedback = '';
  let activeTopicModal = null;
  let baseFinishQuiz = finishQuiz;
  let baseChooseAnswer = chooseAnswer;
  let baseChangeLanguage = changeLanguage;
  let baseApiRequest = apiRequest;

  const demoUsers = [
    {"id":"TEACH06","name":"Ms. Kavya Rao","role":"teacher","className":"Class 6","school":"Green Valley School"},
    {"id":"LF6001","name":"Asha","role":"student","className":"Class 6","school":"Green Valley School","demoProfile":"ready"},
    {"id":"LF6002","name":"Rohan","role":"student","className":"Class 6","school":"Green Valley School","demoProfile":"misconception"},
    {"id":"LF6003","name":"Meera","role":"student","className":"Class 6","school":"Green Valley School","demoProfile":"reinforcement"},
    {"id":"LF6004","name":"Ishaan","role":"student","className":"Class 6","school":"Green Valley School"},
    {"id":"LF6005","name":"Tara","role":"student","className":"Class 6","school":"Green Valley School"},
    {"id":"TEACH07","name":"Mr. Arjun Kumar","role":"teacher","className":"Class 7","school":"Green Valley School"},
    {"id":"LF7001","name":"Anika","role":"student","className":"Class 7","school":"Green Valley School"},
    {"id":"LF7002","name":"Vihaan","role":"student","className":"Class 7","school":"Green Valley School"},
    {"id":"LF7003","name":"Sara","role":"student","className":"Class 7","school":"Green Valley School"},
    {"id":"LF7004","name":"Dev","role":"student","className":"Class 7","school":"Green Valley School"},
    {"id":"LF7005","name":"Mira","role":"student","className":"Class 7","school":"Green Valley School"},
    {"id":"TEACH08","name":"Ms. Ananya Rao","role":"teacher","className":"Class 8","school":"Green Valley School"},
    {"id":"LF8001","name":"Aarav","role":"student","className":"Class 8","school":"Green Valley School"},
    {"id":"LF8002","name":"Diya","role":"student","className":"Class 8","school":"Green Valley School"},
    {"id":"LF8003","name":"Kabir","role":"student","className":"Class 8","school":"Green Valley School"},
    {"id":"LF8004","name":"Nisha","role":"student","className":"Class 8","school":"Green Valley School"},
    {"id":"LF8005","name":"Arjun","role":"student","className":"Class 8","school":"Green Valley School"},
    {"id":"TEACH09","name":"Mr. Vikram Reddy","role":"teacher","className":"Class 9","school":"Green Valley School"},
    {"id":"LF9001","name":"Kavya","role":"student","className":"Class 9","school":"Green Valley School"},
    {"id":"LF9002","name":"Rehan","role":"student","className":"Class 9","school":"Green Valley School"},
    {"id":"LF9003","name":"Ira","role":"student","className":"Class 9","school":"Green Valley School"},
    {"id":"LF9004","name":"Neil","role":"student","className":"Class 9","school":"Green Valley School"},
    {"id":"LF9005","name":"Pooja","role":"student","className":"Class 9","school":"Green Valley School"},
    {"id":"TEACH10","name":"Ms. Priya Sharma","role":"teacher","className":"Class 10","school":"Green Valley School"},
    {"id":"LF10001","name":"Aditya","role":"student","className":"Class 10","school":"Green Valley School"},
    {"id":"LF10002","name":"Sana","role":"student","className":"Class 10","school":"Green Valley School"},
    {"id":"LF10003","name":"Ritvik","role":"student","className":"Class 10","school":"Green Valley School"},
    {"id":"LF10004","name":"Meera Shah","role":"student","className":"Class 10","school":"Green Valley School"},
    {"id":"LF10005","name":"Zoya","role":"student","className":"Class 10","school":"Green Valley School"}
  ];

  function sampleResult(user, profile, topic) {
    const set = profile === 'ready' ? topic.questionSets.challenge : topic.questionSets.foundation;
    const answers = set.map((q, i) => profile === 'misconception' && i % 2 === 0 ? (q.answer + 1) % q.options.length : q.answer);
    const confidence = set.map(() => profile === 'ready' ? 'high' : profile === 'misconception' ? 'high' : 'low');
    const correct = answers.filter((a, i) => a === set[i].answer).length;
    const responseSignals = set.map((q, i) => ({
      question:q.q, selectedAnswer:q.options[answers[i]], correct:answers[i]===q.answer,
      confidence:confidence[i], misconception:engine.diagnose(q, answers[i])
    }));
    return {
      id:`demo-${user.id}-fractions`, userId:user.id, topicId:topic.id,
      subject:topic.subject, topicTitle:topic.title, score:Math.round(correct/set.length*100),
      correct, total:set.length, date:'2026-10-30T10:00:00.000Z', answers, confidence,
      responseSignals, kind:'demo-scenario', demoScenario:true,
      demoNote:'Synthetic demo profile only — not a real learner result.'
    };
  }

  ensureLearnFlexContent = function () {
    db.users = (db.users || []).filter(u => !['LF1001','LF1002','LF1003','TEACH01'].includes(u.id)).map(({password,salt,passwordHash,...safe})=>({ ...safe, name: demoUsers.some(seeded => seeded.id === safe.id) ? String(safe.name || '').replace(/\s+Demo$/i, '') : safe.name }));
    const existingUsers = new Set((db.users || []).map(u => u.id));
    let deletedIds = []; try { deletedIds = JSON.parse(localStorage.getItem('learnflex_deleted_user_ids') || '[]'); } catch (_) {}
    demoUsers.forEach(u => { if (!existingUsers.has(u.id) && !deletedIds.includes(u.id)) db.users.push({ ...u }); });
    db.topics = curriculum.topics.map(t => ({ ...t, questions:t.questions.map(q => ({ ...q })) }));
    db.curriculum = {
      board:curriculum.board, academicSession:curriculum.academicSession,
      sourceEdition:curriculum.sourceEdition, sourceNote:curriculum.sourceNote,
      alignmentStatus:curriculum.alignmentStatus, reviewWorkflow:curriculum.reviewWorkflow,
      subjects:curriculum.subjects, subjectClassCoverage:curriculum.subjectClassCoverage, prerequisiteCoverage:curriculum.prerequisiteCoverage
    };
    db.diagnosticChecks = Array.isArray(db.diagnosticChecks) ? db.diagnosticChecks : [];
    db.pilotEvidence = Array.isArray(db.pilotEvidence) ? db.pilotEvidence : [];
    delete db.languageReviews; // remove legacy data for the retired Language Review feature
    db.auditLog = Array.isArray(db.auditLog) ? db.auditLog : [];
    demoUsers.filter(u => u.demoProfile).forEach(u => {
      const id = `demo-${u.id}-fractions`;
      if (!db.results.some(r => r.id === id)) {
        const result = sampleResult(u, u.demoProfile, db.topics.find(t => t.id === 'fractions'));
        db.results.push(result);
        const score = result.score;
        db.progress[u.id] = db.progress[u.id] || { topics:{}, streak:0, activityDays:[] };
        db.progress[u.id].topics = db.progress[u.id].topics || {};
        db.progress[u.id].topics.fractions = { lastScore:score, completed:score>=70, attempts:1, lastAt:result.date };
      }
    });
    // Keep the library versioned so older local data is upgraded safely on next launch.
    db.curriculumVersion = 'cbse-2026-27-full-chapter-catalog-v9-adaptive-prerequisites';
    saveDB();
  };

  function myTopicAttempts(topicId) {
    if (!currentUser) return [];
    return (db.results || []).filter(r => r.userId === currentUser.id && r.topicId === topicId && r.kind !== 'targeted-check');
  }
  function learningPlan(topicId) { return engine.classify(myTopicAttempts(topicId)); }
  levelFor = function (topic) {
    const plan = learningPlan(topic.id);
    return plan.tier === 'challenge' ? 'hard' : (plan.tier === 'foundation' || plan.tier === 'reinforcement') ? 'easy' : 'medium';
  };
  selectQuestions = function (topic) {
    return engine.selectQuestions(topic, myTopicAttempts(topic.id)).questions;
  };

  startQuiz = function (topicId, mode='assessment', recoveryId=null) {
    closeModal();
    const topic = db.topics.find(t => t.id === topicId);
    if (!topic) return;
    let questions = [], plan = learningPlan(topicId);
    activeQuestion = 0; quizAnswers = []; quizConfidence = []; pendingOptionIndex = null;
    if (mode === 'recoveryPractice' || mode === 'checkpoint') {
      const recovery = (db.recoveries || []).find(r => r.id === recoveryId && r.userId === currentUser.id);
      if (!recovery) { toast('This recovery mission could not be found.'); return; }
      const tagged = topic.questionSets || {};
      if (mode === 'recoveryPractice') {
        const first = (tagged.foundation || [])[0] || (tagged.reinforcement || [])[0] || (tagged.standard || [])[0];
        questions = first ? [{...first}] : ((recoveryQuestionBank[topicId] || {}).practice || topic.questions).slice(0,1);
        if (!questions.length) questions = topic.questions.slice(0,1);
        recovery.status = 'in_progress'; recovery.practiceAnswers = []; recovery.practiceIndex = 0;
      } else {
        questions = (tagged.standard || []).map(q => q.followUp ? ({ ...q.followUp, id:`${q.id}-followup`, parentQuestionId:q.id }) : null).filter(Boolean).concat((tagged.challenge || []).map(q => q.followUp ? ({ ...q.followUp, id:`${q.id}-followup`, parentQuestionId:q.id }) : null).filter(Boolean)).slice(0, 3);
        if (!questions.length) questions = (recoveryQuestionBank[topicId] || {}).checkpoint || topic.questions;
        recovery.status = 'checkpoint_in_progress'; recovery.checkpointAnswers = []; recovery.checkpointConfidence = []; recovery.checkpointIndex = 0;
      }
      currentRecoveryId = recovery.id; currentPage = 'recovery'; saveDB();
    } else if (mode === 'targetedCheck') {
      questions = [targetedContext && targetedContext.followUp ? ({ ...targetedContext.followUp, id:`${targetedContext.questionId}-followup`, parentQuestionId:targetedContext.questionId }) : null].filter(Boolean);
      if (!questions.length) { toast('No separate verification question is available for this response.'); return; }
    } else {
      const selected = engine.selectAdaptiveAssessment(topic, myTopicAttempts(topicId), 3, 5);
      questions = selected.questions; plan = selected.plan;
      currentRecoveryId = null;
    }
    activeQuiz = {
      topicId, questions, plan,
      difficulty: mode==='recoveryPractice'?'guided reinforcement':mode==='checkpoint'?'independent checkpoint':mode==='targetedCheck'?'targeted concept check':plan.label,
      tier:mode==='targetedCheck'?'verification':mode==='recoveryPractice'?'foundation':mode==='checkpoint'?'standard':plan.tier,
      mode, recoveryId, adaptiveHistory:[], adaptiveDecision:'Your next question will respond to this answer.', adaptiveSupport:'', initialQuestionCount:mode==='assessment'?questions.length:0, adaptiveMax:5
    };
    renderShell(); renderPage();
  };

  function localizedQuestion(q) {
    const translated = q && q.i18n && q.i18n[currentLanguage];
    return translated ? { ...q, q:translated.q || q.q, options:translated.options || q.options, explain:translated.explain || q.explain } : q;
  }
  function selectQuizOption(index) {
    if (!activeQuiz || quizAnswers[activeQuestion] !== undefined) return;
    if (!quizConfidence[activeQuestion]) {
      toast('Choose how confident you feel before selecting an answer.'); return;
    }
    pendingOptionIndex = index; renderQuiz();
  }
  function submitQuizAnswer() {
    if (pendingOptionIndex === null || !activeQuiz) return;
    const index = pendingOptionIndex; pendingOptionIndex = null;
    baseChooseAnswer(index);
  }
  renderQuiz = function () {
    if (!activeQuiz) return;
    const topic = db.topics.find(t => t.id === activeQuiz.topicId);
    const raw = activeQuiz.questions[activeQuestion];
    if (!topic || !raw) { toast('This question set is unavailable.'); return; }
    const q = localizedQuestion(raw);
    const submitted = quizAnswers[activeQuestion] !== undefined;
    const selected = submitted ? quizAnswers[activeQuestion] : pendingOptionIndex;
    const confidence = quizConfidence[activeQuestion];
    const isPractice = activeQuiz.mode === 'recoveryPractice';
    const reinforcementHTML = activeQuiz.tier === 'reinforcement' && activeQuestion === 0 ? `<div class="diagnostic-card" style="margin:14px 0"><div class="diagnostic-kicker">A GENTLER WAY TO PRACTISE</div><h4>Let’s make the idea feel secure</h4><p>${escapeHTML(topic.lesson)}</p><div class="example"><b>Worked example</b><br>${escapeHTML(topic.example)}</div>${topic.id==='fractions'?lessonVisualHTML(topic):`<div class="visual-learning"><b>Think it through</b><p>${escapeHTML(topic.example)}</p></div>`}<p class="subtle">This is a new, easier reinforcement question—not a repeat of the previous test.</p></div>` : '';
    const confidenceHTML = `<div class="confidence-prompt"><b>Before you answer, how sure do you feel?</b><div class="confidence-options">
      <button type="button" class="confidence-option ${confidence==='high'?'selected':''}" ${submitted?'disabled':''} onclick="chooseConfidence('high')">😊 I know this</button>
      <button type="button" class="confidence-option ${confidence==='medium'?'selected':''}" ${submitted?'disabled':''} onclick="chooseConfidence('medium')">🤔 I’m not sure</button>
      <button type="button" class="confidence-option ${confidence==='low'?'selected':''}" ${submitted?'disabled':''} onclick="chooseConfidence('low')">😵 I need help</button></div></div>`;
    let feedback = '';
    if (submitted) {
      feedback = `<div class="feedback-box ${selected===raw.answer?'good':'bad'}"><b>${selected===raw.answer?'That’s right! ':'Not quite — let’s understand the step.'}</b><br>${escapeHTML(q.explain)}</div>`;
      if (selected !== raw.answer) feedback += misconceptionHTML(topic.id, raw, selected);
      else if (!isPractice && confidence !== 'high') feedback += `<div class="feedback-box good"><b>Correct, and it is okay to feel unsure.</b><br>We will keep the next teaching step gentle and reinforce this idea with a fresh example.</div>`;
    }
    const status = submitted ? 'Answer submitted' : pendingOptionIndex===null ? 'Choose confidence, then an answer' : 'Check your selection, then submit';
    const action = submitted
      ? `<button class="btn primary" onclick="nextQuestion()">${activeQuestion===activeQuiz.questions.length-1?'Finish this check':'Next question'} →</button>`
      : `<button class="btn primary" onclick="submitQuizAnswer()" ${pendingOptionIndex===null?'disabled style="opacity:.5"':''}>Submit answer</button>`;
    $('#pageContent').innerHTML = `<div class="page-intro"><div><h3>${escapeHTML(activeQuiz.mode==='targetedCheck'?'Targeted follow-up':activeQuiz.mode==='recoveryPractice'?'Guided practice':activeQuiz.mode==='checkpoint'?'Recovery checkpoint':topic.title)}</h3><p>${escapeHTML(activeQuiz.plan?.reason || 'Choose an answer, submit it, and learn from the reasoning behind it.')}</p></div><button class="btn ghost small" onclick="exitQuiz()">Save & exit</button></div>
      <div class="card" style="max-width:880px;width:100%;margin:0 auto;padding:clamp(20px,5vw,42px)">
      <div class="question-count">QUESTION ${activeQuestion+1} OF ${activeQuiz.questions.length}<span style="float:right">${escapeHTML(activeQuiz.difficulty)} · ${escapeHTML(activeQuiz.tier)}</span></div>
      <div class="quiz-progress"><span style="width:${((activeQuestion+(submitted?1:0))/activeQuiz.questions.length)*100}%"></span></div>${confidenceHTML}
      ${targetedFeedback?`<div class="feedback-box good"><b>Improvement signal · Immediate concept check</b><br>${escapeHTML(targetedFeedback)}</div>`:''}${activeQuiz.adaptiveDecision?`<div class="diagnostic-card" style="margin:12px 0"><div class="diagnostic-kicker">LIVE ADAPTATION</div><p>${escapeHTML(activeQuiz.adaptiveDecision)}</p></div>`:''}${activeQuiz.adaptiveSupport&&!submitted?`<div class="feedback-box bad"><b>Let’s strengthen the foundation</b><br>${escapeHTML(activeQuiz.adaptiveSupport)}<br><span class="subtle">Use the worked example before answering this simpler question.</span></div>`:''}${reinforcementHTML}<h3 class="question-title">${escapeHTML(q.q)}</h3><div class="option-list">${q.options.map((o,i)=>`<button class="option ${selected===i?'selected':''} ${submitted&&i===raw.answer?'correct':''} ${submitted&&selected===i&&i!==raw.answer?'wrong':''}" ${(submitted||confidence===undefined)?'disabled':''} onclick="selectQuizOption(${i})"><span class="letter">${String.fromCharCode(65+i)}</span>${escapeHTML(o)}</button>`).join('')}</div>
      ${feedback}<div class="quiz-actions"><span class="subtle">${escapeHTML(status)}</span>${action}</div></div>`;
  };
  window.selectQuizOption = selectQuizOption;
  window.submitQuizAnswer = submitQuizAnswer;

  diagnoseMisconception = function (topicId, q, selectedIndex) {
    const selected = q && q.options ? q.options[selectedIndex] : '';
    const detail = engine.diagnose(q, selectedIndex);
    if (!detail) return null;
    const topic = (db.topics || []).find(t => t.id === topicId);
    return { ...detail, selectedAnswer:selected, selectedIndex, topicId, topicTitle:topic ? topic.title : topicId, question:q.q };
  };
  misconceptionHTML = function (topicId, q, selectedIndex) {
    const d = diagnoseMisconception(topicId, q, selectedIndex);
    if (!d) return '';
    const topic = db.topics.find(t => t.id === topicId);
    const visual = topic && topic.id === 'fractions'
      ? `<div class="fraction-visual-explainer"><div class="diagnostic-kicker">SEE THE IDEA</div>${lessonVisualHTML(topic)}</div>`
      : `<div class="visual-learning"><b>Try a visual step</b><p>${escapeHTML(topic ? topic.example : 'Draw the quantities and label each step.')}</p></div>`;
    const followUp = d.followUp;
    return `<div class="diagnostic-card intervention-card">
      <div class="diagnostic-kicker">LEARNFLEX SMART RECOVERY · POSSIBLE MISCONCEPTION</div>
      <h4>1. What you selected</h4><p><b>${String.fromCharCode(65+selectedIndex)}. ${escapeHTML(d.selectedAnswer)}</b></p>
      <h4>2. What this choice may indicate</h4><p><b>${escapeHTML(d.label)}</b></p>
      <h4>3. Why this mistake can happen</h4><p>${escapeHTML(d.why || 'A familiar rule may have been applied in a different situation.')}</p>
      <h4>4. A clearer explanation</h4><p>${escapeHTML(d.explanation)}</p>
      ${visual}<div class="feedback-box good"><b>5. Try this learning action</b><br>${escapeHTML(d.action)}</div>
      <h4>7. What your teacher can do next</h4><p>${escapeHTML(d.teacherNext)}</p>
      <p class="subtle">This is a question-level learning hypothesis, not a diagnosis of the learner. Ask the student to explain their thinking before deciding what it means.</p>
      ${followUp?`<button class="btn primary" onclick="startTargetedCheck()">6. Try a different check question →</button>`:'<span class="pill">No separate follow-up supplied for this question</span>'}
    </div>`;
  };
  window.startTargetedCheck = function () {
    if (!targetedContext || !targetedContext.followUp) { toast('No follow-up question available.'); return; }
    suspendedQuiz = { quiz:activeQuiz, question:activeQuestion, answers:quizAnswers.slice(), confidence:quizConfidence.slice(), page:currentPage };
    db.diagnosticChecks.push({
      id:`diag-${Date.now()}`, userId:currentUser.id, topicId:targetedContext.topicId,
      questionId:targetedContext.questionId, selectedIndex:targetedContext.selectedIndex, confidence:targetedContext.confidence,
      misconception:targetedContext.misconception, selectedAnswer:targetedContext.selectedAnswer,
      followUpQuestion:targetedContext.followUp.q, initialOutcome:'incorrect', followUpOutcome:'pending', createdAt:new Date().toISOString()
    });
    saveDB();
    startQuiz(targetedContext.topicId, 'targetedCheck');
  };

  const originalChooseConfidence = chooseConfidence;
  chooseConfidence = function (value) { originalChooseConfidence(value); };
  nextQuestion = function () {
    if (!activeQuiz) return;
    pendingOptionIndex = null;
    if(activeQuiz.mode!=='targetedCheck') targetedFeedback='';
    const wasTargeted = activeQuiz.mode === 'targetedCheck';
    const isAdaptiveMode=activeQuiz.mode==='recoveryPractice'||activeQuiz.mode==='assessment';
    if(isAdaptiveMode) {
      const topic=db.topics.find(t=>t.id===activeQuiz.topicId);
      const q=activeQuiz.questions[activeQuestion], answer=quizAnswers[activeQuestion];
      const correct=Boolean(q && answer===q.answer), confidence=quizConfidence[activeQuestion]||'medium';
      activeQuiz.adaptiveHistory.push({questionId:q?.id,correct,confidence,tier:activeQuiz.tier});
      const recovery=activeQuiz.mode==='recoveryPractice'?(db.recoveries||[]).find(x=>x.id===activeQuiz.recoveryId&&x.userId===currentUser.id):null;
      if(recovery){recovery.practiceAnswers=quizAnswers.slice();recovery.practiceConfidence=quizConfidence.slice();recovery.practiceIndex=activeQuestion;recovery.updatedAt=new Date().toISOString();}
      const step=engine.nextAssessmentStep({mode:activeQuiz.mode,activeQuestion,initialQuestionCount:activeQuiz.initialQuestionCount||0,currentQuestionCount:activeQuiz.questions.length,maxQuestions:activeQuiz.adaptiveMax||5});
      // Finish the short opening diagnostic before appending any response-selected
      // questions. Each appended question is shown immediately (never skipped).
      if(step.action==='next-initial'){
        activeQuestion=step.nextIndex;
        saveDB();renderQuiz();return;
      }
      if(step.action==='append-adaptive' && topic) {
        const adaptive=engine.chooseAdaptiveNext(topic,activeQuiz.questions.map(item=>item.id),activeQuiz.adaptiveHistory);
        if(adaptive&&adaptive.question){
          activeQuiz.tier=adaptive.tier;activeQuiz.difficulty=`adaptive ${adaptive.tier}`;
          activeQuiz.adaptiveDecision=adaptive.decision;activeQuiz.adaptiveSupport=adaptive.support;
          activeQuiz.plan=activeQuiz.plan||{};activeQuiz.plan.reason=adaptive.decision;
          activeQuiz.questions.push(adaptive.question);activeQuestion=step.nextIndex;
          if(recovery)recovery.practiceIndex=activeQuestion;
          saveDB();renderQuiz();return;
        }
      }
      finishQuiz();return;
    }
    const last = activeQuestion === activeQuiz.questions.length - 1;
    if (wasTargeted && last) { finishQuiz(); return; }
    if (last) { finishQuiz(); return; }
    activeQuestion++;
    if (activeQuiz.mode === 'checkpoint') {
      const r = (db.recoveries || []).find(x => x.id === activeQuiz.recoveryId);
      if (r) { r.checkpointIndex=activeQuestion; saveDB(); }
    }
    renderQuiz();
  };
  const baseCreateRecovery = createRecoveryIfNeeded;
  createRecoveryIfNeeded = function (topic, result) {
    if (activeQuiz && activeQuiz.mode === 'targetedCheck') return null;
    return baseCreateRecovery(topic, result);
  };
  finishQuiz = function () {
    if (!activeQuiz) return;
    const wasTargeted = activeQuiz.mode === 'targetedCheck';
    const context = wasTargeted ? { ...targetedContext } : null;
    const plan = activeQuiz.plan || null;
    const completed = { mode:activeQuiz.mode, questions:activeQuiz.questions.slice(), answers:quizAnswers.slice(), confidence:quizConfidence.slice(), tier:activeQuiz.tier, adaptiveHistory:(activeQuiz.adaptiveHistory||[]).slice() };
    const beforeCount = db.results.filter(r => r.userId === currentUser.id).length;
    const recoveryId = activeQuiz.recoveryId;
    baseFinishQuiz();
    const myResults = db.results.filter(r => r.userId === currentUser.id);
    const result = myResults.length > beforeCount ? myResults[myResults.length - 1] : null;
    if (completed.mode === 'recoveryPractice' || completed.mode === 'checkpoint') {
      const recovery = (db.recoveries || []).find(r => r.id === recoveryId && r.userId === currentUser.id);
      if (recovery) {
        if (completed.mode === 'recoveryPractice') { recovery.practiceQuestionIds = completed.questions.map(q=>q.id); recovery.adaptiveHistory = completed.adaptiveHistory; }
        else recovery.checkpointQuestionIds = completed.questions.map(q=>q.id);
        saveDB();
      }
    }
    if (result) {
      result.questionIds = completed.questions.map(q=>q.id);
      result.questionSetTier = completed.tier;
      result.adaptiveHistory = completed.adaptiveHistory;
      result.confidence = completed.confidence;
      result.clientSubmittedAt = result.date;
    }
    if (result && wasTargeted) {
      result.kind = 'targeted-check';
      result.parentQuestionId = context && context.questionId;
      result.misconceptionChecked = context && context.misconception;
      result.previousConceptOutcome = 'incorrect';
      result.questionSetTier = 'verification';
      result.followUpOutcome = result.score === 100 ? 'correct' : 'not-yet-secure';
      const event = [...db.diagnosticChecks].reverse().find(x => x.userId === currentUser.id && x.questionId === result.parentQuestionId && x.followUpOutcome === 'pending');
      if (event) { event.followUpOutcome=result.followUpOutcome; event.followUpScore=result.score; event.completedAt=result.date; }
      saveDB();
      targetedFeedback = result.score===100
        ? 'Initial response: incorrect. New verification question: correct (100%). This is a positive immediate learning signal, not proof of long-term mastery.'
        : `Initial response: incorrect. New verification question: not correct yet (${result.score}%). Keep the visual explanation and try another worked example with your teacher.`;
      targetedContext = null;
      if(suspendedQuiz) {
        const resume=suspendedQuiz; suspendedQuiz=null;
        activeQuiz=resume.quiz;activeQuestion=resume.question;quizAnswers=resume.answers;quizConfidence=resume.confidence;currentPage=resume.page||'overview';pendingOptionIndex=null;
        renderShell();renderQuiz();
      }
    } else if (result && result.kind !== 'targeted-check') {
      result.difficulty = plan && plan.tier;
      result.learningStatus = plan && plan.label;
      result.demoScenario = Boolean(result.demoScenario);
      saveDB();
    }
  };

  function topicLessonText(topic) {
    const localized = topic.lessonI18n && topic.lessonI18n[currentLanguage];
    return localized || { title:topic.title, lesson:topic.lesson, example:topic.example, steps:lessonSteps(topic), reviewStatus:'English teaching draft' };
  }
  lessonModeHTML = function (topic, mode='read') {
    const localized = topicLessonText(topic);
    if (mode === 'visual') {
      if (topic.id==='fractions' && currentLanguage==='te') return `<div class="visual-learning"><div class="visual-label">సగం + పావు భాగం</div><div class="fraction-bars"><div class="fraction-bar two-halves"><span>1/2</span><span></span></div><div class="fraction-bar four-quarters"><span>1/4</span><span></span><span></span><span></span></div><div class="fraction-bar result-quarters"><span>1/4</span><span>1/4</span><span>1/4</span><span></span></div></div><p>రెండు భిన్నాల హారాలను ఒకేలా చేయండి: 1/2 = 2/4. కాబట్టి 2/4 + 1/4 = 3/4.</p></div>`;
      if (topic.id==='fractions' && currentLanguage==='hi') return `<div class="visual-learning"><div class="visual-label">आधा + एक चौथाई</div><div class="fraction-bars"><div class="fraction-bar two-halves"><span>1/2</span><span></span></div><div class="fraction-bar four-quarters"><span>1/4</span><span></span><span></span><span></span></div><div class="fraction-bar result-quarters"><span>1/4</span><span>1/4</span><span>1/4</span><span></span></div></div><p>दोनों भिन्नों के हर समान करें: 1/2 = 2/4। इसलिए 2/4 + 1/4 = 3/4।</p></div>`;
      return lessonVisualHTML(topic);
    }
    if (mode === 'steps') return `<div class="lesson-body"><h4>${currentLanguage==='te'?'దశలవారీగా':currentLanguage==='hi'?'Kadam dar kadam':'Step by step'}</h4><ol class="learning-steps">${(localized.steps || lessonSteps(topic)).map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ol><small class="subtle">${escapeHTML(localized.reviewStatus || 'Translation status: draft')}</small></div>`;
    if (mode === 'listen') return `<div class="visual-learning"><h4>${currentLanguage==='te'?'పాఠం వినండి':currentLanguage==='hi'?'Paath sunein':'Listen to this lesson'}</h4><p>Available speech depends on the device and installed language voice.</p><button class="btn soft" type="button" onclick="speakTopic('${topic.id}')">🔊 Hear lesson</button></div>`;
    return `<div class="lesson-body"><h4>${escapeHTML(localized.title || topic.title)}</h4><p>${escapeHTML(localized.lesson || topic.lesson)}</p><div class="example"><b>${currentLanguage==='te'?'ఉదాహరణ':currentLanguage==='hi'?'Udaharan':'Worked example'}</b><br>${escapeHTML(localized.example || topic.example)}</div><small class="subtle">${escapeHTML(localized.reviewStatus || 'English lesson draft')}</small></div>`;
  };
  friendlyExplanationHTML = function () { return ''; };
  conceptBridge = function (topic) {
    const localized = topicLessonText(topic);
    if (!topic.lessonI18n) return '';
    return `<div class="concept-bridge"><div class="diagnostic-kicker">FULL LESSON TRANSLATION STATUS</div><b>${currentLanguage==='te'?'తెలుగు పాఠం':currentLanguage==='hi'?'Hindi lesson':'Lesson language'}</b><p>${escapeHTML(localized.reviewStatus || 'Draft for educator review')}</p><small>Do not use as approved textbook translation until a native subject educator signs off.</small></div>`;
  };
  const oldOpenTopic = openTopic;
  openTopic = function (id) { activeTopicModal=id; oldOpenTopic(id); };
  changeLanguage = function (lang) {
    window.learnFlexLanguage=lang;
    baseChangeLanguage(lang);
    if (activeTopicModal && $('#modalRoot') && $('#modalRoot').innerHTML.trim()) openTopic(activeTopicModal);
  };

  // Subject/grade browsing reflects the actual board-mapped modules in this release.
  studentOverview = function () {
    const mine = db.topics.filter(t => t.className === currentUser.className);
    const results = allMyResults().filter(r => !r.demoScenario);
    const score = results.length ? Math.round(results.reduce((s,r)=>s+r.score,0)/results.length) : 0;
    const demo = currentUser.demoProfile ? `<div class="feedback-box good"><b>Demonstration learner profile</b><br>${escapeHTML(currentUser.demoProfile==='ready'?'High accuracy + high confidence → challenge-level application.':currentUser.demoProfile==='misconception'?'Confident incorrect answers → targeted misconception teaching.':'Correct but unsure → gentle foundation reinforcement.')} Synthetic demo history is labelled and must not be treated as pilot evidence.</div>` : '';
    
    // Genuine weak-topic identification using real student assessment attempts
    const attemptsByTopic = new Map();
    for(const r of results) {
      if(!attemptsByTopic.has(r.topicId)) attemptsByTopic.set(r.topicId, []);
      attemptsByTopic.get(r.topicId).push(r);
    }
    const weakTopics = [];
    for(const [topicId, history] of attemptsByTopic) {
      const topicObj = mine.find(t => t.id === topicId) || db.topics.find(t => t.id === topicId);
      if(!topicObj) continue;
      const latest = history[history.length - 1];
      const mastery = window.LearnFlexEngine ? window.LearnFlexEngine.computeMastery(history, topicId) : { isWeak: latest.score < 70, masteryLevel: latest.score >= 70 ? 'Proficient' : 'Developing' };
      if(mastery.isWeak || latest.score < 70) {
        const prerequisiteGap=window.LearnFlexEngine?.identifyPrerequisiteGap
          ? window.LearnFlexEngine.identifyPrerequisiteGap(topicObj,results,mine)
          : {status:'not-mapped',suggestedTopic:null,explanation:'Prerequisite mapping is unavailable.'};
        weakTopics.push({ topic: topicObj, latest, mastery, historyCount: history.length, prerequisiteGap });
      }
    }
    const weakSectionHTML = `<div class="section-title"><div><h3>Adaptive Weakness Identification &amp; Focus Areas</h3><p>Assessment evidence identifies topics to review. A prerequisite is called a possible gap only when recorded performance supports that suggestion.</p></div><span class="pill ${weakTopics.length ? 'medium' : 'easy'}">${weakTopics.length} Focus Area${weakTopics.length === 1 ? '' : 's'}</span></div><div class="grid two">${weakTopics.length ? weakTopics.map(w => {const gap=w.prerequisiteGap||{};const prior=gap.suggestedTopic;const gapLabel=gap.status==='possible-gap'?'Possible prerequisite gap':gap.status==='not-assessed'?'Prerequisite not yet assessed':gap.status==='no-prerequisite-gap-observed'?'No prerequisite gap observed':'No verified prerequisite mapping';return `<div class="card gap-card" style="border-left:4px solid #b86244"><div class="card-head"><b>${escapeHTML(w.topic.title)}</b><span class="score-badge low">${w.latest.score}% Score</span></div><p><b>Assessment:</b> Scored ${w.latest.correct}/${w.latest.total} (${w.latest.score}%). Status: <em>${escapeHTML(w.mastery.masteryLevel || 'Developing')}</em>. ${escapeHTML(w.mastery.recommendation || 'Review this concept.')}</p><p><b>${gapLabel}:</b> ${escapeHTML(gap.explanation||'No prerequisite evidence available.')}</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><span class="subtle">Attempts: ${w.historyCount} · ${escapeHTML(w.topic.subject)}</span><button class="btn primary small" onclick="openLesson('${w.topic.id}')">Practice chapter →</button>${prior?`<button class="btn soft small" onclick="openLesson('${prior.id}')">${gap.status==='possible-gap'?'Review':'Check'} prerequisite: ${escapeHTML(prior.title)}</button>`:''}</div></div>`}).join('') : `<div class="card" style="grid-column:1/-1;text-align:center;padding:24px;color:#5a6d5f;background:#f4faf5;border-color:#d5e8d8"><b>✓ No Critical Knowledge Gaps Flagged</b><p style="margin:4px 0 0;font-size:11px;color:#788b7d">No assessed topic currently meets the focus-queue rule. Continue practising and reassess later.</p></div>`}</div>`;

    $('#pageContent').innerHTML = `<div class="welcome-card"><div class="welcome-copy"><div class="mini">CBSE 2026–27 · ${escapeHTML(currentUser.className.toUpperCase())}</div><h2>Hey ${escapeHTML(currentUser.name.split(' ')[0])}, ready for a little win?</h2><p>LearnFlex changes the next lesson and question difficulty using your recent score, answer choice and confidence.</p><button class="btn primary small" onclick="navigate('learn')">Continue learning →</button></div><div class="welcome-art">🌱</div></div>${demo}<div class="grid four">${statCard('↗',score+'%','Average score','Real assessments in this browser','↗')}${statCard('✓',completeCount(),'Topics completed','Score of 70% or above','✦')}${statCard('◷',results.length,'Practice attempts','Synthetic demo history excluded','◎')}${statCard('∑',mine.length,'Class modules','Chapter and activity modules','↗')}</div>${weakSectionHTML}<div class="section-title"><div><h3>Subjects</h3><p>Choose a subject to browse its available chapters.</p></div><button class="link-btn" onclick="navigate('learn')">Browse all subjects →</button></div><div class="grid four">${[...new Set(mine.map(t=>t.subject))].map(s=>{const n=mine.filter(t=>t.subject===s).length;const icons={'Mathematics':'∑','Science':'⚛','Social Studies':'⌂','English':'Aa','Telugu':'తె','Hindi':'हि','Sanskrit':'सं','Arts Education':'✎','Physical Education and Well-being':'⚽','Vocational Education':'⚙','Individuals in Society':'◎','Environmental Education':'♻'};return `<div class="card subject-card" role="button" tabindex="0" onclick="navigate('learn')"><div class="subject-icon">${icons[s]||'📘'}</div><h3>${escapeHTML((((window.LEARNFLEX_SUBJECT_NAMES||{} )[currentLanguage])||{})[s]||s)}</h3><p>${n} chapters/modules</p></div>`}).join('')}</div><div class="section-title"><div><h3>Your ${escapeHTML(currentUser.className)} learning path</h3><p>Selected from the CBSE 2026–27 subject and NCERT chapter catalogue. Teacher validation is pending.</p></div></div><div class="grid two">${mine.map(lessonCard).join('')}</div><div class="section-title"><div><h3>Your recent activity</h3><p>Only your own assessment history is shown.</p></div></div><div class="card">${activityHTML(results.slice(-5).reverse())}</div><div class="section-title"><div><h3>Account & privacy</h3><p>Delete your account and its learning records from this demo service.</p></div></div><div class="card"><p class="subtle">You can request deletion at any time. A teacher should obtain parent/guardian consent before collecting real learner data; this demo does not replace school privacy procedures.</p><button class="btn ghost small" onclick="deleteLearnFlexAccount()">Delete my account and learning data</button></div>`;
  };
  learnPage = function () {
    const topics = db.topics.filter(t => currentUser.role==='teacher' || t.className===currentUser.className);
    const grades = [...new Set(topics.map(t=>t.className))].sort((a,b)=>Number(a.replace('Class ',''))-Number(b.replace('Class ','')));
    const subjects = [...new Set(topics.map(t=>t.subject))].sort((a,b)=>a.localeCompare(b));
    const localizedTitle = t => (window.learnFlexLocalizedTopicText ? window.learnFlexLocalizedTopicText(t,currentLanguage).title : t.title) || t.title;
    const subjectLabelSafe = s => ((window.LEARNFLEX_SUBJECT_NAMES && window.LEARNFLEX_SUBJECT_NAMES[currentLanguage]) || {})[s] || s;
    let classFilter=currentUser.role==='teacher'?'All':currentUser.className, subjectFilter='All';
    const countFor=(subject,grade=classFilter)=>topics.filter(t=>(grade==='All'||t.className===grade)&&t.subject===subject).length;
    $('#pageContent').innerHTML = `<div class="page-intro"><div><h3>${currentLanguage==='te'?'మీకు నచ్చిన విధంగా నేర్చుకోండి':currentLanguage==='hi'?'अपनी गति से सीखें':'Learn in your own way'}</h3><p>${currentLanguage==='te'?'తరగతి, విషయం మరియు అధ్యాయాన్ని ఎంచుకోండి.':currentLanguage==='hi'?'कक्षा, विषय और अध्याय चुनें।':'Choose a class, subject and chapter. Your recent evidence changes the next question set.'}</p></div><span class="pill">${topics.length} ${currentUser.role==='teacher'?'chapters/modules':'modules for '+currentUser.className}</span></div>
      <div class="filters curriculum-filters" style="margin-bottom:12px"><b>${currentLanguage==='te'?'తరగతి':currentLanguage==='hi'?'कक्षा':'Class'}:</b>${grades.map(g=>`<button class="filter-btn ${g===currentUser.className?'active':''}" data-class="${g}">${g}</button>`).join('')}<button class="filter-btn" data-class="All">All classes</button></div>
      <div class="filters curriculum-filters" style="margin-bottom:17px"><b>${currentLanguage==='te'?'విషయం':currentLanguage==='hi'?'विषय':'Subject'}:</b><button class="filter-btn active" data-subject="All" data-subject-label="All">${currentLanguage==='te'?'అన్ని విషయాలు':currentLanguage==='hi'?'सभी विषय':'All subjects'} (${topics.length})</button>${subjects.map(s=>`<button class="filter-btn" data-subject="${escapeHTML(s)}" data-subject-label="${escapeHTML(s)}">${escapeHTML(subjectLabelSafe(s))} (${countFor(s)})</button>`).join('')}</div>
      <div id="topicGrid" class="grid two">${topics.map(lessonCard).join('')}</div>
      <div class="pillar-note">Board: ${escapeHTML(curriculum.board)} · Session: ${escapeHTML(curriculum.academicSession)} · CBSE/NCERT chapter titles follow the listed current editions where available. Generated practice questions and translations need educator review.</div>`;
    const renderFiltered=()=>{
      const filtered=topics.filter(t=>(classFilter==='All'||t.className===classFilter)&&(subjectFilter==='All'||t.subject===subjectFilter));
      $('#topicGrid').innerHTML=filtered.length?filtered.map(lessonCard).join(''):'<div class="card empty-state">No modules match those filters.</div>';
      $$('[data-class]').forEach(b=>b.classList.toggle('active',b.dataset.class===classFilter));
      $$('[data-subject]').forEach(b=>{b.classList.toggle('active',b.dataset.subject===subjectFilter);const key=b.dataset.subjectLabel;const label=key==='All'?(currentLanguage==='te'?'అన్ని విషయాలు':currentLanguage==='hi'?'सभी विषय':'All subjects'):subjectLabelSafe(key);const count=key==='All'?topics.filter(t=>classFilter==='All'||t.className===classFilter).length:countFor(key);b.textContent=`${label} (${count})`;});
    };
    $$('[data-class]').forEach(b=>b.onclick=()=>{classFilter=b.dataset.class;renderFiltered()});
    $$('[data-subject]').forEach(b=>b.onclick=()=>{subjectFilter=b.dataset.subject;renderFiltered()});
  };

  teacherStudents = function () {
    return db.users.filter(u => u.role==='student' && u.className===currentUser.className && u.school===currentUser.school && String(u.section||'A').toUpperCase()===String(currentUser.section||'A').toUpperCase());
  };
  misconceptionInsightsHTML = function () {
    const students = teacherStudents(), byId = new Map(students.map(x=>[x.id,x]));
    const attempts = (db.results||[]).filter(r=>byId.has(r.userId)&&!r.demoScenario).slice().reverse();
    const signals = attempts.flatMap(r=>(r.responseSignals||[]).filter(x=>!x.correct&&x.misconception).map(x=>({ ...x, student:byId.get(r.userId), topicTitle:r.topicTitle, date:r.date })));
    const diagnosticCards = signals.slice(0,8).map(x=>`<div class="card"><div class="card-head"><b>${escapeHTML(x.student.name)} · ${escapeHTML(x.topicTitle)}</b><span class="pill medium">Possible misconception</span></div><p><b>Selected:</b> ${escapeHTML(x.selectedAnswer||'—')}</p><p><b>Possible reason:</b> ${escapeHTML(x.misconception.label||'Review the learner’s method')}</p><p>${escapeHTML(x.misconception.why||'Ask the learner to explain their steps.')}</p><div class="feedback-box good"><b>Teaching response</b><br>${escapeHTML(x.misconception.action||'Model a fresh example and ask the learner to try again.')}</div><p class="subtle">Teacher next step: ${escapeHTML(x.misconception.teacherNext||'Ask the learner to explain their reasoning.')}</p></div>`).join('');
    const events = (db.diagnosticChecks||[]).filter(x=>byId.has(x.userId)).slice().reverse();
    const followUps = events.slice(0,8).map(x=>`<div class="card"><b>${escapeHTML(byId.get(x.userId).name)} · ${escapeHTML(x.misconception||'Concept check')}</b><p>${escapeHTML(x.followUpQuestion||'Separate verification question')}</p><span class="pill ${x.followUpOutcome==='correct'?'easy':'medium'}">${escapeHTML(x.followUpOutcome==='correct'?'Follow-up correct':x.followUpOutcome==='not-yet-secure'?'Needs another example':'Pending')}</span></div>`).join('');
    return `<div class="section-title"><div><h3>Question-level misconception signals</h3><p>Class-scoped response evidence. A wrong option is a hypothesis to discuss, not a learner label.</p></div></div><div class="grid two">${diagnosticCards||'<div class="card empty-state">No mapped misconceptions recorded yet.</div>'}</div><div class="section-title"><div><h3>Follow-up understanding checks</h3><p>See if a learner answered a different question after the explanation.</p></div></div><div class="grid two">${followUps||'<div class="card empty-state">No targeted follow-up checks recorded yet.</div>'}</div>`;
  };

  // Attach the bearer token when the shared demo backend is used. Local-first mode remains usable offline.
  apiRequest = function (url, options={}) {
    const token = sessionStorage.getItem('learnflex_access_token');
    const headers = { ...(options.headers||{}), ...(token?{Authorization:`Bearer ${token}`}:{}) };
    return baseApiRequest(url, { ...options, headers });
  };
  const OFFLINE_AUTH_PREFIX = 'learnflex_offline_auth_v1:';
  const offlineEncoder = new TextEncoder();
  function bytesToHex(bytes) { return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join(''); }
  function hexToBytes(hex) { return new Uint8Array((String(hex).match(/.{1,2}/g) || []).map(x => parseInt(x, 16))); }
  async function deriveOfflineVerifier(password, saltHex, iterations=310000) {
    if (!globalThis.crypto?.subtle) throw new Error('Secure offline sign-in requires Web Crypto on HTTPS or localhost.');
    const key = await crypto.subtle.importKey('raw', offlineEncoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    return bytesToHex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:hexToBytes(saltHex),iterations,hash:'SHA-256'}, key, 256));
  }
  function safeProfile(user) { const {password,salt,passwordHash,...safe}=user||{}; return safe; }
  async function rememberOfflineLogin(password, user) {
    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    const iterations = 310000;
    const verifier = await deriveOfflineVerifier(password, salt, iterations);
    localStorage.setItem(OFFLINE_AUTH_PREFIX + user.id, JSON.stringify({salt,iterations,verifier,role:user.role,user:safeProfile(user),savedAt:new Date().toISOString()}));
  }
  window.learnFlexRememberOfflineLogin = rememberOfflineLogin;
  async function verifyOfflineLogin(id, password, role) {
    const raw = localStorage.getItem(OFFLINE_AUTH_PREFIX + id);
    if (!raw) return null;
    try {
      const saved = JSON.parse(raw);
      if (saved.role !== role || !saved.user || saved.user.id !== id) return null;
      const actual = await deriveOfflineVerifier(password, saved.salt, saved.iterations || 310000);
      if (actual.length !== saved.verifier.length) return null;
      let diff = 0; for (let i=0;i<actual.length;i++) diff |= actual.charCodeAt(i) ^ saved.verifier.charCodeAt(i);
      return diff === 0 ? safeProfile(saved.user) : null;
    } catch (_) { return null; }
  }
  login = async function (e) {
    e.preventDefault();
    const id=$('#loginId').value.trim().toUpperCase(), password=$('#loginPassword').value;
    if (!id || !password) { toast('Enter your ID and password.'); return; }
    let user = null, isOffline = false;
    if (location.protocol !== 'file:' && navigator.onLine) {
      try {
        const resp=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,password})});
        const payload=await resp.json().catch(()=>({}));
        if (!resp.ok) { toast(payload.error || 'Login details do not match.'); return; }
        user=safeProfile(payload.user);
        if (!user || user.role !== currentRole) { toast('This account does not match the selected role.'); return; }
        sessionStorage.setItem('learnflex_access_token',payload.token);
        sessionStorage.setItem('learnflex_access_user',id);
        try { await rememberOfflineLogin(password,user); } catch (offlineSetupError) { console.warn('Offline sign-in could not be enabled on this browser:', offlineSetupError.message); }
        const existing=db.users.findIndex(u=>u.id===user.id);
        if(existing>=0) db.users[existing]=user; else db.users.push(user);
        saveDB();
      } catch (_) {
        user=await verifyOfflineLogin(id,password,currentRole);
        if (!user) { toast('The server is unavailable. Offline sign-in is available only on a device where this account previously signed in.'); return; }
        isOffline=true;
        sessionStorage.removeItem('learnflex_access_token');sessionStorage.removeItem('learnflex_access_user');
      }
    } else {
      user=await verifyOfflineLogin(id,password,currentRole);
      if (!user) { toast('Offline sign-in is available only on a device where this account previously signed in online.'); return; }
      isOffline=true;
      sessionStorage.removeItem('learnflex_access_token');sessionStorage.removeItem('learnflex_access_user');
    }
    currentUser=user; currentLanguage=db.preferences[user.id]||'en'; window.learnFlexLanguage=currentLanguage; currentPage='overview';
    $('#roleView').classList.add('hidden');$('#authView').classList.add('hidden');$('#appView').classList.remove('hidden');
    renderShell();renderPage();if(!isOffline && navigator.onLine)connectToBackend();
    toast(isOffline ? `Offline mode · welcome back, ${user.name.split(' ')[0]}.` : `Welcome, ${user.name.split(' ')[0]}!`);
  };
  const baseLogout = logout;
  logout = function () {
    const token=sessionStorage.getItem('learnflex_access_token');
    if(token && navigator.onLine) fetch('/api/auth/logout',{method:'POST',headers:{Authorization:`Bearer ${token}`},keepalive:true}).catch(()=>{});
    sessionStorage.removeItem('learnflex_access_token'); sessionStorage.removeItem('learnflex_access_user'); baseLogout();
  };

  // Replace the unsafe full-client sync path with an authenticated, scoped session.
  syncStateToServer = async function () {
    if(backendSyncInProgress||syncingFromServer||!navigator.onLine||location.protocol==='file:'||!sessionStorage.getItem('learnflex_access_token'))return;
    backendSyncInProgress=true;
    try { const res=await apiRequest('/api/sync',{method:'POST',body:JSON.stringify({state:{results:db.results||[],recoveries:db.recoveries||[],progress:db.progress||{},preferences:db.preferences||{}}})});backendConnected=true;if(res.state)applyRemoteState(res.state,false); }
    catch(e){backendConnected=false;} finally{backendSyncInProgress=false;}
  };
  connectToBackend = async function () {
    if(location.protocol==='file:'||!sessionStorage.getItem('learnflex_access_token')) return;
    try {
      const res=await apiRequest('/api/state');backendConnected=true;if(res.state)applyRemoteState(res.state,false);
      const badge=$('#globalConnectionBadge');if(badge)badge.textContent=navigator.onLine?'● Online · authenticated backend':'● Offline · local data';
      if('EventSource'in window && !window.learnflexEvents){window.learnflexEvents=new EventSource('/api/events');window.learnflexEvents.addEventListener('update',async()=>{try{const latest=await apiRequest('/api/state');applyRemoteState(latest.state,true)}catch(e){}});window.learnflexEvents.onerror=()=>{backendConnected=false;};}
    } catch(e) { backendConnected=false; const badge=$('#globalConnectionBadge'); if(badge)badge.textContent=navigator.onLine?'● Local mode · backend not connected':'● Offline · local data only'; }
  };

  // Store a question-level diagnostic event before offering its verification item.
  const oldMisconceptionHTML = misconceptionHTML;
  misconceptionHTML = function (topicId,q,index) {
    targetedContext = { topicId, questionId:q.id, selectedIndex:index, confidence:quizConfidence[activeQuestion] || 'medium', misconception:diagnoseMisconception(topicId,q,index)?.label, selectedAnswer:q.options[index], followUp:q.followUp || (q.misconceptions && q.misconceptions[q.misconceptionByOption?.[index]]?.followUp) };
    return oldMisconceptionHTML(topicId,q,index);
  };

  window.deleteLearnFlexAccount = async function () {
    if(!currentUser || currentUser.role!=='student') return;
    if(!confirm('Permanently delete this student demo account and its learning history? This cannot be undone.')) return;
    const id=currentUser.id;
    if(!navigator.onLine || !sessionStorage.getItem('learnflex_access_token')) { toast('Connect to the server and sign in again to delete the account and its server records.'); return; }
    try { await apiRequest('/api/account',{method:'DELETE'}); }
    catch(e){toast(`Server deletion failed: ${e.message}. Your account and local data have not been removed.`);return;}
    if(window.learnFlexOffline?.purgeUserData) await window.learnFlexOffline.purgeUserData(id);
    db.users=db.users.filter(u=>u.id!==id);db.results=db.results.filter(r=>r.userId!==id);db.recoveries=(db.recoveries||[]).filter(r=>r.userId!==id);db.diagnosticChecks=(db.diagnosticChecks||[]).filter(r=>r.userId!==id);delete db.progress[id];delete db.preferences[id];
    localStorage.removeItem(OFFLINE_AUTH_PREFIX + id);
    let deleted=[];try{deleted=JSON.parse(localStorage.getItem('learnflex_deleted_user_ids')||'[]')}catch(_){};if(!deleted.includes(id))deleted.push(id);localStorage.setItem('learnflex_deleted_user_ids',JSON.stringify(deleted));sessionStorage.removeItem('learnflex_access_token');sessionStorage.removeItem('learnflex_access_user');saveDB();currentUser=null;activeQuiz=null;showRoleSelection();toast('Account and local learning data deleted.');
  };

  // A teacher only sees students from their own class and school in the interface.
  teacherStudents = function () {
    if (!currentUser || currentUser.role !== 'teacher') return [];
    return (db.users || []).filter(u => u.role === 'student' && u.className === currentUser.className && u.school === currentUser.school && String(u.section||'A').toUpperCase() === String(currentUser.section||'A').toUpperCase());
  };

  // Teacher data export and demo reset actions are visibly separated from student controls.
  teacherOverview = function () {
    const students=teacherStudents(), ids=new Set(students.map(s=>s.id));
    const results=(db.results||[]).filter(r=>ids.has(r.userId)&&!r.demoScenario);
    const recoveries=(db.recoveries||[]).filter(r=>ids.has(r.userId));
    const completed=recoveries.filter(r=>r.status==='completed'&&Number.isFinite(r.checkpointScore));
    const improved=completed.filter(r=>r.checkpointScore>r.initialScore).length;
    const avg=results.length?Math.round(results.reduce((a,r)=>a+r.score,0)/results.length):0;
    const needs=students.filter(s=>studentNeedsHelp(s.id).length>0);
    const consent=(db.consentRecords||[]).filter(c=>ids.has(c.studentId));
    $('#pageContent').innerHTML=`<div class="card" style="margin-bottom:18px"><div class="card-head"><div><h3>${escapeHTML(currentUser.className)} · ${escapeHTML(currentUser.school)}</h3><p class="subtle">All student analytics below are restricted to this teacher’s class and school.</p></div><span class="pill">Class-scoped</span></div><div class="vote-controls"><button class="btn ghost small" onclick="resetLearnFlexDemo()">Clear this browser’s demo data</button><button class="btn soft small" onclick="downloadLearnFlexBackup()">Download class backup</button></div></div>
      <div class="welcome-card"><div class="welcome-copy"><div class="mini">TEACHER WORKSPACE</div><h2>Good to see you, ${escapeHTML(currentUser.name.split(' ')[1]||currentUser.name)}.</h2><p>Understand the reasoning behind an answer, choose a teaching response, then check the concept again with a new question.</p><button class="btn primary small" onclick="navigate('students')">View student progress →</button></div><div class="welcome-art">📚</div></div>
      <div class="grid four">${statCard('♧',students.length,'Students','Assigned class only','◎')}${statCard('↗',avg+'%','Class average','Real server-validated assessments in class','↗')}${statCard('⚑',needs.length,'Need support','Recent evidence below 70%','!')}${statCard('✓',results.length,'Assessments','Real assessments in this class','✦')}</div>
      <div class="section-title"><div><h3>Students who may need support</h3><p>Use this as a conversation starter, not a fixed label.</p></div><button class="link-btn" onclick="navigate('students')">All students ↗</button></div><div class="card table-wrap">${teacherTable(students.filter(s=>needs.includes(s)).concat(students.filter(s=>!needs.includes(s))).slice(0,8))}</div>
      <div class="section-title"><div><h3>Common learning gaps</h3><p>Topics where the class may benefit from another explanation.</p></div><button class="link-btn" onclick="navigate('insights')">View insights ↗</button></div><div class="grid three">${commonGaps().filter(g=>g.topic.grade===Number(String(currentUser.className).replace(/\D/g,''))).slice(0,3).map(g=>`<div class="card"><span class="pill ${g.rate>40?'medium':'easy'}">${g.rate}% need revision</span><h3 style="font:700 14px Manrope;margin:14px 0 6px">${escapeHTML(g.topic.title)}</h3><p class="subtle">${g.flagged} of ${students.length} student(s) have a latest low score.</p></div>`).join('')||'<div class="card empty-state">No class learning gaps recorded yet.</div>'}</div>
      <div class="section-title"><div><h3>Smart Recovery follow-through</h3><p>Check whether students improved on the separate checkpoint.</p></div></div><div class="grid four">${statCard('↻',recoveries.length,'Missions','Assigned class only','↗')}${statCard('✓',completed.length,'Checkpoints','Completed missions','✓')}${statCard('↗',improved,'Scores improved','Checkpoint above start score','↗')}${statCard('◎',completed.length?Math.round(completed.reduce((a,r)=>a+r.checkpointScore,0)/completed.length)+'%':'—','Avg checkpoint','Completed missions only','◎')}</div>${smartRecoveryTeacherSection(8)}
      <div class="section-title"><div><h3>Guardian consent register</h3><p>Record evidence references only after obtaining the school-approved consent. This is not a substitute for a consent form.</p></div></div><div class="card"><div class="form-grid"><div class="field"><label for="consentStudent">Student</label><select id="consentStudent">${students.map(s=>`<option value="${escapeHTML(s.id)}">${escapeHTML(s.name)}</option>`).join('')}</select></div><div class="field"><label for="consentStatus">Status</label><select id="consentStatus"><option value="pending">Pending</option><option value="granted">Granted (evidence checked)</option><option value="withdrawn">Withdrawn</option></select></div><div class="field span2"><label for="consentEvidence">School consent form reference (no sensitive document upload)</label><input id="consentEvidence" maxlength=120 placeholder="Internal reference or register number"></div></div><button class="btn primary small" style="margin-top:14px" onclick="recordLearnFlexConsent()">Save consent status</button><div class="subtle" style="margin-top:12px">${consent.length?consent.slice(-5).reverse().map(c=>`${escapeHTML((students.find(s=>s.id===c.studentId)||{}).name||c.studentId)}: ${escapeHTML(c.status)} (${escapeHTML(c.evidenceRef||'no reference')})`).join(' · '):'No consent records saved.'}</div></div>`;
  };
  insightsPage = function () {
    const students=teacherStudents(), ids=new Set(students.map(s=>s.id));
    const results=(db.results||[]).filter(r=>ids.has(r.userId)&&!r.demoScenario);
    const gaps=commonGaps().filter(g=>g.topic.grade===Number(String(currentUser.className).replace(/\D/g,'')));
    $('#pageContent').innerHTML=`<div class="page-intro"><div><h3>Class learning insights</h3><p>Only records from ${escapeHTML(currentUser.className)} · ${escapeHTML(currentUser.school)} are included.</p></div><span class="pill">Rule-based · class-scoped</span></div><div class="grid three">${statCard('⚑',gaps.filter(g=>g.rate>0).length,'Topics with learning gaps','Based on latest class results','!')}${statCard('✓',results.length,'Assessments taken','Only this assigned class','↗')}${statCard('♧',students.filter(s=>studentNeedsHelp(s.id).length).length,'Students flagged','Recent score below 70%','◎')}</div><div class="section-title"><div><h3>Topic-level signals</h3><p>Percentage of class students with a latest score below 70%.</p></div></div><div class="card table-wrap"><table><thead><tr><th>TOPIC</th><th>SUBJECT</th><th>CLASS SIGNAL</th><th>RECOMMENDED ACTION</th></tr></thead><tbody>${gaps.map(g=>`<tr><td><b>${escapeHTML(g.topic.title)}</b></td><td>${escapeHTML(g.topic.subject)}</td><td><span class="score-badge ${g.rate>40?'warn':''}">${g.flagged}/${students.length} · ${g.rate}%</span></td><td>${g.flagged?'Re-teach with a visual model and a new check':'Keep practising; monitor future results'}</td></tr>`).join('')}</tbody></table></div>${smartRecoveryTeacherSection(8)}${misconceptionInsightsHTML()}`;
  };
  const baseInsightsForPilot = insightsPage;
  function pilotEvidencePanelHTML() {
    const students=teacherStudents().filter(s=>s.className===currentUser.className&&s.school===currentUser.school);
    const evidence=(db.pilotEvidence||[]).filter(e=>e.className===currentUser.className&&e.school===currentUser.school);
    const granted=s=>{const rows=(db.consentRecords||[]).filter(c=>c.studentId===s.id).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));return rows.length&&rows[rows.length-1].status==='granted'};
    const eligible=students.filter(granted);
    const reportRows=evidence.map(e=>{const student=students.find(s=>s.id===e.studentId);return `<tr><td>${escapeHTML(student?.name||e.studentId)}</td><td>${escapeHTML(e.topicTitle)}</td><td>${e.baselineScore}% → ${e.postScore}%</td><td>${e.scoreChange>0?'+':''}${e.scoreChange} pts</td><td>${e.clarity}/5</td><td>${e.teacherUsefulness}/5</td></tr>`}).join('');
    return `<div class="section-title"><div><h3>Pilot evidence & learning impact</h3><p>Con 3 addressed: collect real, consented baseline/post-assessment evidence. No improvement is claimed until actual attempts are recorded.</p></div><span class="pill">${evidence.length} paired evaluation(s)</span></div>
      <div class="card"><div class="feedback-box good"><b>Evidence rule</b><br>Only use school-approved consent. Choose two distinct saved attempts for the same student and chapter. This compares observed scores; it does not by itself prove causation.</div>
      ${eligible.length?`<form id="pilotEvidenceForm"><div class="form-grid"><div class="field"><label for="pilotStudent">Student with consent recorded</label><select id="pilotStudent" required>${eligible.map(s=>`<option value="${escapeHTML(s.id)}">${escapeHTML(s.name)} · ${escapeHTML(s.id)}</option>`).join('')}</select></div><div class="field"><label for="pilotTopic">Chapter</label><select id="pilotTopic" required>${db.topics.filter(t=>t.className===currentUser.className).map(t=>`<option value="${escapeHTML(t.id)}">${escapeHTML(t.subject)} — ${escapeHTML(t.title)}</option>`).join('')}</select></div><div class="field"><label for="pilotBaseline">Baseline attempt</label><select id="pilotBaseline" required></select></div><div class="field"><label for="pilotPost">Fresh post-assessment attempt</label><select id="pilotPost" required></select></div><div class="field"><label for="pilotClarity">Student clarity feedback (1–5)</label><select id="pilotClarity"><option value="1">1 — unclear</option><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option><option value="5">5 — very clear</option></select></div><div class="field"><label for="pilotUsefulness">Teacher usefulness (1–5)</label><select id="pilotUsefulness"><option value="1">1 — not useful</option><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option><option value="5">5 — very useful</option></select></div><div class="field"><label for="pilotMisconception">Target misconception corrected?</label><select id="pilotMisconception"><option value="unclear">Not sure yet</option><option value="yes">Yes, verified</option><option value="no">Not yet</option></select></div><div class="field"><label for="pilotMinutes">Practice minutes (optional)</label><input id="pilotMinutes" type="number" min="0" max="240" placeholder="e.g. 12"></div></div><button type="submit" class="btn primary" style="margin-top:14px">Save paired pilot evaluation</button></form><p class="subtle">Eligible students: ${eligible.length}. Consent must be recorded in the Guardian consent register first. Synthetic demo scenarios are excluded from attempt selection.</p>`:`<div class="empty-state"><b>No student has current recorded consent.</b>Use the Guardian consent register on Class overview after obtaining school-approved consent. Pilot records are disabled until a student has consent status “Granted”.</div>`}
      <div class="section-title"><div><h3>Recorded evidence</h3><p>Paired real attempts only; demo scenario results are excluded.</p></div><button class="btn ghost small" onclick="downloadPilotEvidence()">Export CSV ↓</button></div>
      ${reportRows?`<div class="table-wrap"><table><thead><tr><th>STUDENT</th><th>CHAPTER</th><th>BASELINE → POST</th><th>CHANGE</th><th>CLARITY</th><th>TEACHER USEFULNESS</th></tr></thead><tbody>${reportRows}</tbody></table></div>`:'<div class="empty-state">No paired pilot evaluations recorded yet. This is intentionally blank until real student attempts are available.</div>'}</div>`;
  }
  function refreshPilotAttemptOptions() {
    const studentId=$('#pilotStudent')?.value, topicId=$('#pilotTopic')?.value;
    const student=db.users.find(s=>s.id===studentId), topic=db.topics.find(t=>t.id===topicId);
    const attempts=(db.results||[]).filter(r=>r.userId===studentId&&r.topicId===topicId&&!r.demoScenario&&r.kind!=='targeted-check').sort((a,b)=>new Date(a.date)-new Date(b.date));
    ['pilotBaseline','pilotPost'].forEach(id=>{const el=$('#'+id);if(!el)return;const old=el.value;el.innerHTML=attempts.map(r=>`<option value="${escapeHTML(String(r.id))}">${new Date(r.date).toLocaleString()} · ${r.score}% (${r.correct}/${r.total})</option>`).join('');if([...el.options].some(o=>o.value===old))el.value=old;});
    if(student && topic && attempts.length<2) { const note=$('#pilotEvidenceForm'); if(note) note.querySelector('button[type="submit"]').disabled=true; }
    const base=$('#pilotBaseline'),post=$('#pilotPost'),submit=$('#pilotEvidenceForm button[type="submit"]');
    if(base&&post&&submit){submit.disabled=attempts.length<2||base.value===post.value;const update=()=>{submit.disabled=attempts.length<2||base.value===post.value};base.onchange=update;post.onchange=update;}
  }
  insightsPage = function () {
    baseInsightsForPilot();
    if(currentUser?.role!=='teacher')return;
    $('#pageContent').insertAdjacentHTML('beforeend',pilotEvidencePanelHTML());
    const student=$('#pilotStudent'),topic=$('#pilotTopic');
    if(student)student.onchange=refreshPilotAttemptOptions;
    if(topic)topic.onchange=refreshPilotAttemptOptions;
    refreshPilotAttemptOptions();
    const form=$('#pilotEvidenceForm'); if(form)form.onsubmit=e=>{e.preventDefault();savePilotEvidence();};
  };
  window.savePilotEvidence = async function () {
    const studentId=$('#pilotStudent')?.value, topicId=$('#pilotTopic')?.value, baselineId=$('#pilotBaseline')?.value, postId=$('#pilotPost')?.value;
    const student=db.users.find(s=>s.id===studentId), topic=db.topics.find(t=>t.id===topicId);
    const consent=(db.consentRecords||[]).filter(c=>c.studentId===studentId).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).at(-1);
    if(!student||!topic||!consent||consent.status!=='granted'){toast('A current consent record marked Granted is required.');return;}
    if(student.className!==currentUser.className||topic.className!==currentUser.className){toast('Choose a student and chapter from your assigned class.');return;}
    const attempts=(db.results||[]).filter(r=>r.userId===studentId&&r.topicId===topicId&&!r.demoScenario&&r.kind!=='targeted-check');
    const baseline=attempts.find(r=>String(r.id)===String(baselineId)),post=attempts.find(r=>String(r.id)===String(postId));
    if(!baseline||!post||baseline.id===post.id){toast('Choose two different real attempts for the same chapter.');return;}
    if(new Date(post.date)<=new Date(baseline.date)){toast('The post-assessment must be later than the baseline.');return;}
    const payload={studentId,topicId,baselineAttemptId:baseline.id,postAttemptId:post.id,clarity:Number($('#pilotClarity').value),teacherUsefulness:Number($('#pilotUsefulness').value),misconceptionCorrected:$('#pilotMisconception').value,practiceMinutes:$('#pilotMinutes').value?Number($('#pilotMinutes').value):null};
    try {
      const result=await apiRequest('/api/pilot-evidence',{method:'POST',body:JSON.stringify(payload)});
      db.pilotEvidence=db.pilotEvidence||[];db.pilotEvidence.push(result.record);saveDB();toast('Paired pilot evidence saved to the project server.');insightsPage();
    } catch(error) {
      if(backendConnected){toast(`Pilot evidence not saved: ${error.message}`);return;}
      db.pilotEvidence=db.pilotEvidence||[];db.pilotEvidence.push({id:`pilot-${Date.now()}`,studentId,teacherId:currentUser.id,className:currentUser.className,school:currentUser.school,topicId,topicTitle:topic.title,subject:topic.subject,baselineAttemptId:baseline.id,postAttemptId:post.id,baselineScore:baseline.score,postScore:post.score,scoreChange:post.score-baseline.score,clarity:payload.clarity,teacherUsefulness:payload.teacherUsefulness,misconceptionCorrected:payload.misconceptionCorrected,practiceMinutes:payload.practiceMinutes,createdAt:new Date().toISOString(),consentRecordId:consent.id,storage:'browser-local'});saveDB();toast('Evidence saved in this browser only; start the server to share it.');insightsPage();
    }
  };
  window.downloadPilotEvidence = function () {
    const rows=(db.pilotEvidence||[]).filter(e=>e.className===currentUser.className&&e.school===currentUser.school);
    const headers=['studentId','topicTitle','baselineScore','postScore','scoreChange','clarity','teacherUsefulness','misconceptionCorrected','practiceMinutes','createdAt'];
    const csv=[headers.join(','),...rows.map(r=>headers.map(h=>`"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))].join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='learnflex-pilot-evidence.csv';a.click();URL.revokeObjectURL(url);
  };

  const baseViewStudent = viewStudent;
  viewStudent = function (id) {
    const student=db.users.find(u=>u.id===id);
    if(currentUser?.role==='teacher' && (!student || student.role!=='student' || student.className!==currentUser.className || student.school!==currentUser.school)) { toast('This learner is outside your assigned class.'); return; }
    return baseViewStudent(id);
  };
  window.recordLearnFlexConsent = async function () {
    const studentId=$('#consentStudent')?.value, status=$('#consentStatus')?.value, evidenceRef=$('#consentEvidence')?.value.trim();
    if(!studentId||!status){toast('Select a student and status.');return;}
    try { const r=await apiRequest('/api/consent',{method:'POST',body:JSON.stringify({studentId,status,evidenceRef})}); db.consentRecords=db.consentRecords||[];db.consentRecords.push(r.record);saveDB();teacherOverview();toast('Consent status saved.'); }
    catch(e){toast(`Consent status not saved: ${e.message}`);}
  };
  window.downloadLearnFlexBackup = async function () {
    try { const res=await apiRequest('/api/backup'); const blob=new Blob([JSON.stringify(res,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download='learnflex-demo-backup.json';a.click();URL.revokeObjectURL(url);toast('Backup exported. Keep it in a secure location.'); }
    catch(e){const blob=new Blob([JSON.stringify({state:{users:(db.users||[]).filter(u=>currentUser?.role!=='teacher'||u.className===currentUser.className&&u.school===currentUser.school),results:(db.results||[]).filter(r=>currentUser?.role!=='teacher'||(db.users||[]).some(u=>u.id===r.userId&&u.className===currentUser.className&&u.school===currentUser.school)),progress:db.progress||{},preferences:db.preferences||{},recoveries:(db.recoveries||[]).filter(r=>currentUser?.role!=='teacher'||(db.users||[]).some(u=>u.id===r.userId&&u.className===currentUser.className&&u.school===currentUser.school)),diagnosticChecks:(db.diagnosticChecks||[]).filter(r=>currentUser?.role!=='teacher'||(db.users||[]).some(u=>u.id===r.userId&&u.className===currentUser.className&&u.school===currentUser.school)),consentRecords:(db.consentRecords||[]).filter(r=>currentUser?.role!=='teacher'||(db.users||[]).some(u=>u.id===r.studentId&&u.className===currentUser.className&&u.school===currentUser.school)),pilotEvidence:(db.pilotEvidence||[]).filter(r=>currentUser?.role!=='teacher'||r.className===currentUser.className&&r.school===currentUser.school)},exportedAt:new Date().toISOString(),note:'Browser-local user data backup; static curriculum is packaged separately.'},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='learnflex-browser-backup.json';a.click();URL.revokeObjectURL(url);toast('Browser-local backup downloaded.');}
  };
  window.resetLearnFlexDemo = async function () {
    if(!confirm('Clear LearnFlex progress and downloaded packs stored in this browser only? Shared server records will not be changed.'))return;
    localStorage.removeItem(STORE_KEY);localStorage.removeItem('learnflex_offline_packs');
    toast('This browser’s local demo data was cleared. Shared server records were not changed.');
    location.reload();
  };

  // Demo passwords are never embedded in browser code. Use credentials supplied privately by the demo operator.

  // Launch once all enhancement overrides are registered.
  init();
})();
