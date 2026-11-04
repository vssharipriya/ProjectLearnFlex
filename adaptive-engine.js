/* Pure adaptive selection and diagnosis logic; usable in browser and Node tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.LearnFlexEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const tiers = ['foundation', 'reinforcement', 'standard', 'challenge'];
  const average = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  function confidenceRatio(results) {
    const values = results.flatMap(r => (r.confidence || []).map(x => x === 'high' ? 1 : x === 'medium' ? 0.5 : 0));
    return values.length ? average(values) : null;
  }
  function classify(results = []) {
    const recent = results.slice(-2);
    if (!recent.length) return { tier:'standard', label:'Starting point', reason:'A short mixed diagnostic samples the learner at three levels.', status:'new', confidence:null };
    const latest = recent[recent.length - 1];
    const score = average(recent.map(r => Number(r.score || 0)));
    const confidence = confidenceRatio(recent);
    const confidentWrong = (latest.responseSignals || []).some(s => s.correct === false && s.confidence === 'high');
    const uncertainCorrect = (latest.responseSignals || []).some(s => s.correct === true && s.confidence !== 'high');
    if (confidentWrong || score < 60) return { tier:'foundation', label:'Misconception review', reason:confidentWrong ? 'A confident incorrect choice suggests a rule or concept worth checking with a visual explanation.' : `Recent performance is ${Math.round(score)}%; rebuild the prerequisite idea before adding complexity.`, status:'recover', confidence };
    if (score >= 80 && confidence !== null && confidence >= 0.78 && !uncertainCorrect) return { tier:'challenge', label:'Ready to advance', reason:'The learner is accurate and consistently confident, so an application-level challenge is appropriate.', status:'advance', confidence };
    if (score >= 80 && (confidence === null || confidence < 0.78 || uncertainCorrect)) return { tier:'reinforcement', label:'Needs reinforcement', reason:'Accuracy is strong but confidence is not secure; use a separate easier reinforcement bank, then check again with a new example.', status:'reinforce', confidence };
    return { tier:'standard', label:'Building understanding', reason:`Recent performance is ${Math.round(score)}%; practise the same concept with a guided, standard-level example.`, status:'build', confidence };
  }
  function selectQuestions(topic, results = []) {
    const plan = classify(results);
    const sets = topic.questionSets || {};
    if (!tiers.every(t => Array.isArray(sets[t]) && sets[t].length)) {
      const fallback = Array.isArray(topic.questions) ? topic.questions.slice() : [];
      return { plan, questions:fallback, tier:plan.tier };
    }
    if (plan.status === 'new') {
      const mixed = [sets.foundation[0], sets.standard[0], sets.challenge[0]].filter(Boolean);
      return { plan, questions:mixed, tier:'diagnostic' };
    }
    const chosen = sets[plan.tier].slice();
    return { plan, questions:chosen, tier:plan.tier };
  }
  function selectAdaptiveAssessment(topic, results = [], initialCount = 3, maxQuestions = 5) {
    const selected = selectQuestions(topic, results);
    const safeMax = Math.max(1, Math.min(10, Number(maxQuestions) || 5));
    const safeInitial = Math.max(1, Math.min(safeMax, Number(initialCount) || 3));
    return { ...selected, questions: selected.questions.slice(0, safeInitial), adaptiveMax: safeMax };
  }

  function nextAssessmentStep({ mode = 'assessment', activeQuestion = 0, initialQuestionCount = 0, currentQuestionCount = 0, maxQuestions = 5 } = {}) {
    const current = Math.max(0, Number(activeQuestion) || 0);
    const initial = Math.max(0, Number(initialQuestionCount) || 0);
    const count = Math.max(0, Number(currentQuestionCount) || 0);
    const limit = Math.max(1, Math.min(10, Number(maxQuestions) || 5));
    if (mode === 'assessment' && current + 1 < initial) return { action:'next-initial', nextIndex:current + 1 };
    if (count < limit) return { action:'append-adaptive', nextIndex:count };
    return { action:'finish', nextIndex:null };
  }

  function chooseAdaptiveNext(topic, usedIds = [], history = []) {
    if (!topic || !topic.questionSets) return null;
    const used = new Set(usedIds || []);
    const recent = (history || []).slice(-2);
    const wrongRun = recent.filter(item => !item.correct).length;
    const correctRun = recent.filter(item => item.correct && item.confidence === 'high').length;
    const last = (history || [])[history.length - 1] || {};
    let tier = 'standard', decision = 'The next question checks understanding with a new example.', support = '';
    if (!last.correct && wrongRun >= 2) {
      tier = 'reinforcement';
      decision = 'Two recent answers were incorrect, so the next question reinforces the idea with a guided example.';
      support = 'Review the key idea and worked example. Focus on one step at a time.';
    } else if (!last.correct) {
      tier = 'foundation';
      decision = 'That answer suggests a foundation step may help, so the next question is simpler and more focused.';
      support = 'Start with the meaning of the key idea, then match it to the example.';
    } else if (last.confidence === 'low' || last.confidence === 'medium') {
      tier = 'reinforcement';
      decision = 'The answer was correct but confidence was not high, so the next question reinforces the idea with a fresh example.';
    } else if (correctRun >= 2) {
      tier = 'challenge';
      decision = 'You have answered correctly with high confidence more than once, so the next question increases the challenge.';
    }
    const find = key => (Array.isArray(topic.questionSets[key]) ? topic.questionSets[key] : [])
      .find(question => question && !used.has(question.id));
    let question = find(tier);
    if (!question) {
      const fallback = tier === 'challenge'
        ? ['standard', 'reinforcement', 'foundation']
        : tier === 'foundation'
          ? ['reinforcement', 'standard', 'challenge']
          : ['foundation', 'standard', 'challenge'];
      for (const key of fallback) { question = find(key); if (question) break; }
    }
    if (!question) return null;
    return { question:{ ...question }, tier, decision, support };
  }
  function diagnose(question, selectedIndex) {
    if (!question || !Number.isInteger(selectedIndex) || selectedIndex === question.answer) return null;
    const key = question.misconceptionByOption && question.misconceptionByOption[selectedIndex];
    const detail = key && question.misconceptions && question.misconceptions[key];
    if (!detail) return {
      key:'unmapped-option', label:'Reasoning to explore',
      why:'This option is incorrect, but no specific error pattern has been attached yet.',
      explanation:question.explain || 'Review the concept and compare each step.',
      action:'Ask the learner to explain how they selected this option, then try a parallel example.',
      teacherNext:'Listen to the learner’s method before reteaching. Do not assume the cause from the option alone.',
      followUp:question.followUp || null
    };
    return { key, ...detail, followUp:detail.followUp || question.followUp || null };
  }
  function computeMastery(results = [], topicId = null) {
    const list = topicId ? results.filter(r => r.topicId === topicId && r.kind !== 'targeted-check') : results.filter(r => r.kind !== 'targeted-check');
    if (!list.length) {
      return { accuracy:0, attempts:0, confidenceIndex:0, masteryLevel:'Not yet assessed', isWeak:false, recommendation:'Start with a diagnostic practice session to establish your baseline.' };
    }
    const totalCorrect = list.reduce((sum, r) => sum + (Number(r.correct) || 0), 0);
    const totalQuestions = list.reduce((sum, r) => sum + (Number(r.total) || (r.answers ? r.answers.length : 0)), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const allConfidence = list.flatMap(r => (r.confidence || []).map(c => c === 'high' ? 1.0 : c === 'medium' ? 0.6 : 0.2));
    const confidenceIndex = allConfidence.length ? Math.round(average(allConfidence) * 100) : 50;
    let masteryLevel = 'Novice';
    let recommendation = 'Review foundational concepts and worked examples with your teacher.';
    let isWeak = true;
    if (accuracy >= 85 && confidenceIndex >= 75) {
      masteryLevel = 'Mastery';
      recommendation = 'Strong mastery demonstrated! Ready for high-order application and challenge problems.';
      isWeak = false;
    } else if (accuracy >= 70) {
      masteryLevel = 'Proficient';
      recommendation = 'Conceptually sound. Continue standard practice to build speed and confidence.';
      isWeak = false;
    } else if (accuracy >= 50) {
      masteryLevel = 'Developing';
      recommendation = 'Basic understanding is emerging, but key prerequisite steps need reinforcement.';
      isWeak = true;
    }
    return { accuracy, attempts:list.length, confidenceIndex, masteryLevel, isWeak, recommendation, totalCorrect, totalQuestions };
  }
  function identifyPrerequisiteGap(topic, results = [], allTopics = [], threshold = 70) {
    const ids = [...new Set((topic && Array.isArray(topic.prereq) ? topic.prereq : []).filter(Boolean))];
    if (!ids.length) return { status:'not-mapped', topicId:topic && topic.id, prerequisites:[], suggestedTopic:null, explanation:'No explicit prerequisite is mapped for this module; do not infer a root gap.' };
    const byId = new Map((allTopics || []).map(item => [item.id,item]));
    const checks = ids.map(id => {
      const item = byId.get(id) || null;
      const mastery = computeMastery(results, id);
      return { topicId:id, title:item ? item.title : id, mastery, topic:item };
    });
    const weak = checks.filter(x => x.mastery.attempts > 0 && x.mastery.accuracy < threshold)
      .sort((a,b) => a.mastery.accuracy - b.mastery.accuracy || b.mastery.attempts-a.mastery.attempts);
    if (weak.length) return {
      status:'possible-gap', topicId:topic && topic.id, prerequisites:checks,
      suggestedTopic:weak[0].topic, suggestedTopicId:weak[0].topicId,
      evidenceAttempts:weak[0].mastery.attempts, observedAccuracy:weak[0].mastery.accuracy,
      explanation:`A mapped prerequisite has ${weak[0].mastery.accuracy}% observed accuracy across ${weak[0].mastery.attempts} recorded attempt(s). Treat this as a possible learning gap and reassess after review.`
    };
    const unassessed = checks.find(x => x.mastery.attempts === 0);
    if (unassessed) return {
      status:'not-assessed', topicId:topic && topic.id, prerequisites:checks,
      suggestedTopic:unassessed.topic, suggestedTopicId:unassessed.topicId,
      explanation:'A mapped prerequisite has not been assessed yet. Check that concept before diagnosing a root gap.'
    };
    return { status:'no-prerequisite-gap-observed', topicId:topic && topic.id, prerequisites:checks, suggestedTopic:null, explanation:'Recorded prerequisite results are at or above the review threshold; no prerequisite gap is currently indicated.' };
  }
  function explainSelection(tier, recentHistory = []) {
    const explanations = {
      foundation: {
        badgeText: 'Foundation Scaffolding',
        title: 'Rebuilding Core Concepts',
        description: 'Selected because a recent response suggested a foundational concept or misconception worth revisiting step-by-step.',
        learningAdvice: 'Take your time to understand the definitions, diagrams, and basic units before calculating.'
      },
      reinforcement: {
        badgeText: 'Reinforcement Practice',
        title: 'Strengthening Confidence',
        description: 'Selected because your answer was either correct with lower confidence, or repeated errors required a guided parallel example.',
        learningAdvice: 'Focus on explaining each step out loud to connect the idea firmly.'
      },
      standard: {
        badgeText: 'Standard Practice',
        title: 'Building Grade-Level Mastery',
        description: 'Selected to benchmark and exercise standard CBSE syllabus application questions.',
        learningAdvice: 'Follow the standard NCERT problem-solving structure carefully.'
      },
      challenge: {
        badgeText: 'High-Order Challenge',
        title: 'Advanced Application',
        description: 'Selected because you have demonstrated consistent accuracy with high confidence on preceding items.',
        learningAdvice: 'Apply multi-step reasoning and look for edge cases.'
      }
    };
    return explanations[tier] || explanations.standard;
  }
  function validateTopic(topic) {
    const problems = [];
    const sets = topic.questionSets || {};
    for (const tier of tiers) {
      for (const q of sets[tier] || []) {
        if (!Array.isArray(q.options) || !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) problems.push(`${q.id}: invalid answer index`);
        (q.options || []).forEach((_, i) => {
          if (i !== q.answer && !(q.misconceptionByOption && q.misconceptionByOption[i] && q.misconceptions && q.misconceptions[q.misconceptionByOption[i]])) problems.push(`${q.id}: option ${i} has no misconception mapping`);
        });
        if (!q.followUp || !Array.isArray(q.followUp.options) || !Number.isInteger(q.followUp.answer)) problems.push(`${q.id}: missing follow-up checkpoint`);
      }
    }
    return problems;
  }
  return { tiers, classify, selectQuestions, selectAdaptiveAssessment, nextAssessmentStep, chooseAdaptiveNext, diagnose, validateTopic, computeMastery, identifyPrerequisiteGap, explainSelection };
});
