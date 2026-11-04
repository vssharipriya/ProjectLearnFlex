'use strict';
/* LearnFlex backend: authenticated demo API, SQLite persistence and scoped access.
 * This remains a controlled hackathon/pilot backend, not a certified student-information system.
 */
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { URL } = require('node:url');

const ROOT = __dirname;
const DATA_DIR = path.resolve(process.env.LEARNFLEX_DATA_DIR || path.join(ROOT, 'data'));
const SEED_FILE = path.join(ROOT, 'data', 'seed.json');
const DB_FILE = path.join(DATA_DIR, 'learnflex.sqlite');
const JSON_FILE = path.join(DATA_DIR, 'state.json');
const PORT = Number(process.env.PORT || 3100);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_BODY = 4 * 1024 * 1024;
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const RETENTION_DAYS = Math.max(0, Number(process.env.LEARNFLEX_RETENTION_DAYS || 365));
const sessions = new Map();
const loginAttempts = new Map();
const sseClients = new Set();
fs.mkdirSync(DATA_DIR, { recursive: true });

function loadOrGenerateSeed() {
  if (fs.existsSync(SEED_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    } catch (e) {
      const backup = `${SEED_FILE}.corrupt-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      try { fs.renameSync(SEED_FILE, backup); } catch (backupError) { throw new Error(`seed.json is invalid and could not be preserved: ${backupError.message}`); }
      console.error(`Invalid seed.json preserved at ${backup}. Rebuilding from packaged curriculum: ${e.message}`);
    }
  }
  const base = require('./curriculum.js');
  require('./ncert-curriculum.js');
  const pack = globalThis.LEARNFLEX_CURRICULUM || base;
  const demoUsers = [
    {id:'TEACH06',name:'Ms. Kavya Rao',role:'teacher',className:'Class 6',grade:6,section:'A',school:'Green Valley School'},
    {id:'LF6001',name:'Asha',role:'student',className:'Class 6',grade:6,section:'A',school:'Green Valley School',demoProfile:'ready'},
    {id:'LF6002',name:'Rohan',role:'student',className:'Class 6',grade:6,section:'A',school:'Green Valley School',demoProfile:'misconception'},
    {id:'LF6003',name:'Meera',role:'student',className:'Class 6',grade:6,section:'A',school:'Green Valley School',demoProfile:'reinforcement'},
    {id:'LF6004',name:'Ishaan',role:'student',className:'Class 6',grade:6,section:'A',school:'Green Valley School'},
    {id:'LF6005',name:'Tara',role:'student',className:'Class 6',grade:6,section:'A',school:'Green Valley School'},
    {id:'TEACH07',name:'Mr. Arjun Kumar',role:'teacher',className:'Class 7',grade:7,section:'A',school:'Green Valley School'},
    {id:'LF7001',name:'Anika',role:'student',className:'Class 7',grade:7,section:'A',school:'Green Valley School'},
    {id:'LF7002',name:'Vihaan',role:'student',className:'Class 7',grade:7,section:'A',school:'Green Valley School'},
    {id:'LF7003',name:'Sara',role:'student',className:'Class 7',grade:7,section:'A',school:'Green Valley School'},
    {id:'LF7004',name:'Dev',role:'student',className:'Class 7',grade:7,section:'A',school:'Green Valley School'},
    {id:'LF7005',name:'Mira',role:'student',className:'Class 7',grade:7,section:'A',school:'Green Valley School'},
    {id:'TEACH08',name:'Ms. Ananya Rao',role:'teacher',className:'Class 8',grade:8,section:'A',school:'Green Valley School'},
    {id:'LF8001',name:'Aarav',role:'student',className:'Class 8',grade:8,section:'A',school:'Green Valley School'},
    {id:'LF8002',name:'Diya',role:'student',className:'Class 8',grade:8,section:'A',school:'Green Valley School'},
    {id:'LF8003',name:'Kabir',role:'student',className:'Class 8',grade:8,section:'A',school:'Green Valley School'},
    {id:'LF8004',name:'Nisha',role:'student',className:'Class 8',grade:8,section:'A',school:'Green Valley School'},
    {id:'LF8005',name:'Arjun',role:'student',className:'Class 8',grade:8,section:'A',school:'Green Valley School'},
    {id:'TEACH09',name:'Mr. Vikram Reddy',role:'teacher',className:'Class 9',grade:9,section:'A',school:'Green Valley School'},
    {id:'LF9001',name:'Kavya',role:'student',className:'Class 9',grade:9,section:'A',school:'Green Valley School'},
    {id:'LF9002',name:'Rehan',role:'student',className:'Class 9',grade:9,section:'A',school:'Green Valley School'},
    {id:'LF9003',name:'Ira',role:'student',className:'Class 9',grade:9,section:'A',school:'Green Valley School'},
    {id:'LF9004',name:'Neil',role:'student',className:'Class 9',grade:9,section:'A',school:'Green Valley School'},
    {id:'LF9005',name:'Pooja',role:'student',className:'Class 9',grade:9,section:'A',school:'Green Valley School'},
    {id:'TEACH10',name:'Ms. Priya Sharma',role:'teacher',className:'Class 10',grade:10,section:'A',school:'Green Valley School'},
    {id:'LF10001',name:'Aditya',role:'student',className:'Class 10',grade:10,section:'A',school:'Green Valley School'},
    {id:'LF10002',name:'Sana',role:'student',className:'Class 10',grade:10,section:'A',school:'Green Valley School'},
    {id:'LF10003',name:'Ritvik',role:'student',className:'Class 10',grade:10,section:'A',school:'Green Valley School'},
    {id:'LF10004',name:'Meera Shah',role:'student',className:'Class 10',grade:10,section:'A',school:'Green Valley School'},
    {id:'LF10005',name:'Zoya',role:'student',className:'Class 10',grade:10,section:'A',school:'Green Valley School'}
  ];
  const topics = pack.topics.map(topic => ({
    ...topic,
    questions: Array.isArray(topic.questionSets?.standard) ? topic.questionSets.standard : (Array.isArray(topic.questions) ? topic.questions : []),
    questionSets: topic.questionSets || {}
  }));
  const curriculumMeta = {
    board: pack.board,
    academicSession: pack.academicSession,
    session: pack.session || pack.academicSession || '2026-27',
    sourceEdition: pack.sourceEdition,
    sourceNote: pack.sourceNote,
    alignmentStatus: pack.alignmentStatus,
    reviewWorkflow: pack.reviewWorkflow,
    subjects: pack.subjects,
    subjectClassCoverage: pack.subjectClassCoverage,
    prerequisiteCoverage: pack.prerequisiteCoverage
  };
  const generated = { users: demoUsers, topics, curriculum: curriculumMeta };
  try {
    fs.mkdirSync(path.dirname(SEED_FILE), { recursive: true });
    fs.writeFileSync(SEED_FILE, JSON.stringify(generated, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write seed.json to disk:', err.message);
  }
  return generated;
}

const seed = loadOrGenerateSeed();

// Shared credentials requested for this controlled project build.
// Do not use these shared passwords for real student records or public production deployment.
const DEMO_STUDENT_PASSWORD = String(process.env.LEARNFLEX_DEMO_STUDENT_PASSWORD || 'learn@984');
const DEMO_TEACHER_PASSWORD = String(process.env.LEARNFLEX_DEMO_TEACHER_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'teach@489'));
if (process.env.NODE_ENV === 'production' && DEMO_TEACHER_PASSWORD.length < 16) {
  throw new Error('Production startup blocked: configure LEARNFLEX_DEMO_TEACHER_PASSWORD with a unique secret of at least 16 characters.');
}
function loadStudentInvites() {
  const raw = String(process.env.LEARNFLEX_STUDENT_INVITES || '').trim();
  if (!raw) return {};
  let parsed; try { parsed = JSON.parse(raw); } catch { throw new Error('LEARNFLEX_STUDENT_INVITES must be valid JSON.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('LEARNFLEX_STUDENT_INVITES must be a JSON object.');
  return parsed;
}
const STUDENT_INVITES = loadStudentInvites();
function passwordHash(password, salt) {
  // Reduced work factor is available only to isolated automated tests; never enable it in a deployed environment.
  const N = process.env.LEARNFLEX_TEST_FAST_HASH === 'true' && process.env.NODE_ENV !== 'production' ? 256 : 16384;
  return crypto.scryptSync(password, salt, 64, { N, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex');
}
function buildSeedUsers() {
  return seed.users.map(u => {
    const salt = crypto.randomBytes(24).toString('hex');
    const password = u.role === 'teacher' ? DEMO_TEACHER_PASSWORD : DEMO_STUDENT_PASSWORD;
    return { ...u, salt, passwordHash:passwordHash(password, salt) };
  });
}
const initialState = {
  // Seed accounts are hashed only when a new database is created or migrated.
  users:[], topics:seed.topics, results:[], progress:{}, preferences:{}, recoveries:[],
  diagnosticChecks:[], auditLog:[], consentRecords:[], pilotEvidence:[], invitationUsage:{}, curriculum:seed.curriculum,
  curriculumVersion:'cbse-2026-27-full-chapter-catalog-v9-adaptive-prerequisites'
};

let sqlite = null;
let state;
try {
  const { DatabaseSync } = require('node:sqlite');
  sqlite = new DatabaseSync(DB_FILE);
  sqlite.exec(`PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), state_json TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT NOT NULL, action TEXT NOT NULL, subject_id TEXT, detail_json TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS consent_records (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, teacher_id TEXT NOT NULL, status TEXT NOT NULL, evidence_ref TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS assessment_attempts (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, topic_id TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, attempt_json TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_assessment_student ON assessment_attempts(student_id);
    CREATE INDEX IF NOT EXISTS idx_assessment_topic ON assessment_attempts(topic_id);
    CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);`);
  const saved = sqlite.prepare('SELECT state_json FROM app_state WHERE id=1').get();
  state = saved ? JSON.parse(saved.state_json) : structuredClone(initialState);
  hydrateCompatibilityQuestions(state);
  if (!saved) { state.users=buildSeedUsers(); persistState(); }
} catch (error) {
  console.warn('SQLite is unavailable; using atomic JSON persistence for this run:', error.message);
  const saved = readJSON(JSON_FILE, null);
  state = saved || structuredClone(initialState);
  hydrateCompatibilityQuestions(state);
  if (!saved) { state.users=buildSeedUsers(); persistState(); }
}

// Upgrade existing local databases to the CBSE 2026–27 curriculum while preserving learner history.
function migrateCurriculumState() {
  const currentVersion = initialState.curriculumVersion;
  if (!state) state = structuredClone(initialState);
  const needsCurriculumUpgrade = state.curriculumVersion !== currentVersion;
  const hasRetiredLanguageReviewData = Object.prototype.hasOwnProperty.call(state,'languageReviews');
  // Older builds persisted the large topic catalogue twice. Keep the canonical state.topics only.
  const hasDuplicateCurriculumTopics = Boolean(state.curriculum && Array.isArray(state.curriculum.topics));
  if (needsCurriculumUpgrade) {
    state.topics = structuredClone(seed.topics);
    state.curriculum = structuredClone(seed.curriculum);
    state.curriculumVersion = currentVersion;
  }
  if (hasRetiredLanguageReviewData) delete state.languageReviews;
  if (hasDuplicateCurriculumTopics) delete state.curriculum.topics;
  if (!state.curriculum || typeof state.curriculum !== 'object') state.curriculum = structuredClone(seed.curriculum || {});
  state.pilotEvidence=Array.isArray(state.pilotEvidence)?state.pilotEvidence:[];
  state.invitationUsage=state.invitationUsage&&typeof state.invitationUsage==='object'?state.invitationUsage:{};
  if (needsCurriculumUpgrade) {
    const byId=new Map((state.users||[]).map(u=>[u.id,u]));
    for(const u of buildSeedUsers()) if(!byId.has(u.id)) byId.set(u.id,u);
    state.users=[...byId.values()].filter(u=>!['LF1001','LF1002','LF1003','TEACH01'].includes(u.id));
  }
  if (needsCurriculumUpgrade || hasRetiredLanguageReviewData || hasDuplicateCurriculumTopics) persistState();
}
migrateCurriculumState();

function refreshProvisionedDemoCredentials() {
  // Keep the per-account salted hashes generated for a fresh database. Re-hashing
  // every seeded account on every restart made startup unnecessarily expensive
  // and silently reset credentials in existing deployments.
  let changed=false;
  state.users=(state.users||[]).map(user=>{
    if(!user || !user.id) return user;
    const cleanName=String(user.name||'').replace(/\s+Demo$/i,'');
    if(cleanName!==user.name){changed=true;return {...user,name:cleanName};}
    return user;
  });
  if(changed)persistState();
}
refreshProvisionedDemoCredentials();

function readJSON(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return structuredClone(fallback); } }
function atomicWrite(file, value) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), { mode:0o600 });
  fs.renameSync(tmp, file);
}
function hydrateCompatibilityQuestions(targetState) {
  if (!targetState || !Array.isArray(targetState.topics)) return;
  for (const topic of targetState.topics) {
    if (!Array.isArray(topic.questions) && Array.isArray(topic.questionSets?.standard)) topic.questions = topic.questionSets.standard;
  }
}
function compactPersistedState(sourceState) {
  const copy = structuredClone(sourceState);
  for (const topic of (copy.topics || [])) {
    // Legacy API consumers still receive topic.questions in memory, but the
    // persisted database stores the canonical tier bank only.
    if (Array.isArray(topic.questionSets?.standard)) delete topic.questions;
  }
  return copy;
}
function persistState() {
  const now = new Date().toISOString();
  const compact = compactPersistedState(state);
  if (sqlite) sqlite.prepare(`INSERT INTO app_state(id,state_json,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET state_json=excluded.state_json, updated_at=excluded.updated_at`).run(JSON.stringify(compact), now);
  else atomicWrite(JSON_FILE, compact);
}
function audit(actor, action, subject='', detail={}) {
  const record = { actor, action, subject, detail, createdAt:new Date().toISOString() };
  state.auditLog = state.auditLog || []; state.auditLog.push(record); state.auditLog = state.auditLog.slice(-5000);
  if (sqlite) sqlite.prepare('INSERT INTO audit_logs(actor_id,action,subject_id,detail_json,created_at) VALUES(?,?,?,?,?)').run(actor, action, subject || null, JSON.stringify(detail), record.createdAt);
  persistState();
}
function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'SAMEORIGIN',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'Content-Length':Buffer.byteLength(body)
  });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve,reject)=>{
    let body='';
    req.on('data', chunk=>{ body += chunk; if (Buffer.byteLength(body)>MAX_BODY) { reject(new Error('Request body is too large.')); req.destroy(); } });
    req.on('end',()=>{ if (!body) return resolve({}); try { resolve(JSON.parse(body)); } catch { reject(new Error('Request body must be valid JSON.')); } });
    req.on('error',reject);
  });
}
function broadcast(type, data={}) {
  const packet=`event: update\ndata: ${JSON.stringify({type,...data})}\n\n`;
  for (const res of sseClients) { try { res.write(packet); } catch { sseClients.delete(res); } }
}
function normalizeId(value) { return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g,''); }
function findUser(id) { return state.users.find(u=>u.id===id); }
function authUser(req, _url) {
  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i,'');
  const token = bearer;
  const item = sessions.get(token);
  if (!item || item.expiresAt < Date.now()) { if(item) sessions.delete(token); return null; }
  return findUser(item.userId) || null;
}
function sameClass(a,b) { return Boolean(a && b && a.className===b.className && a.school===b.school && String(a.section||'A').toUpperCase()===String(b.section||'A').toUpperCase()); }
function loginAllowed(ip) {
  const now=Date.now();
  if(loginAttempts.size>5000) for(const [key,value] of loginAttempts) if(value.resetAt<now) loginAttempts.delete(key);
  const row=loginAttempts.get(ip)||{count:0,resetAt:now+15*60*1000};
  if(row.resetAt<now){row.count=0;row.resetAt=now+15*60*1000;}
  row.count++;loginAttempts.set(ip,row);return row.count<=12;
}
function requireAuth(req,res,url) { const user=authUser(req,url); if(!user){json(res,401,{error:'Please sign in again to continue.'});return null;} return user; }
function publicUser(user) { const {passwordHash,salt,password,...safe}=user; return safe; }
function publicStateFor(user) {
  const allowed = user.role==='teacher'
    ? state.users.filter(u=>u.role==='teacher'?u.id===user.id:sameClass(u,user))
    : state.users.filter(u=>u.id===user.id);
  const ids=new Set(allowed.filter(u=>u.role==='student').map(u=>u.id));
  const filtered={
    users:allowed.map(publicUser), topics:[], curriculum:state.curriculum,
    results:state.results.filter(r=>ids.has(r.userId)),
    progress:Object.fromEntries(Object.entries(state.progress||{}).filter(([id])=>ids.has(id))),
    preferences:Object.fromEntries(Object.entries(state.preferences||{}).filter(([id])=>ids.has(id)||id===user.id)),
    recoveries:state.recoveries.filter(r=>ids.has(r.userId)),
    diagnosticChecks:(state.diagnosticChecks||[]).filter(r=>ids.has(r.userId)),
    auditLog:user.role==='teacher'?(state.auditLog||[]).filter(a=>a.actor===user.id||ids.has(a.subject)):[],
    consentRecords:user.role==='teacher'?(state.consentRecords||[]).filter(c=>ids.has(c.studentId)):[],
    pilotEvidence:user.role==='teacher'?(state.pilotEvidence||[]).filter(e=>ids.has(e.studentId)):[],
    curriculumVersion:state.curriculumVersion
  };
  return filtered;
}
function mergeById(old=[], incoming=[], key='id') {
  const map=new Map((old||[]).map(x=>[String(x[key]),x]));
  for(const item of incoming||[]) if(item && item[key]!==undefined) map.set(String(item[key]),{...(map.get(String(item[key]))||{}),...item});
  return [...map.values()];
}
function getResolvedQuestion(topicId, ref) {
  const topic=state.topics.find(t=>t.id===topicId); if(!topic) return null;
  const all=[...(topic.questions||[]),...Object.values(topic.questionSets||{}).flat()];
  const id=String(ref||'');
  if(id.endsWith('-followup')) {
    const parentId=id.slice(0,-9);
    const parent=all.find(q=>q.id===parentId);
    return parent && parent.followUp ? { ...parent.followUp, id } : null;
  }
  return all.find(q=>q.id===id) || null;
}
function validateAttempt(raw, studentId) {
  if(!raw || !raw.id || raw.demoScenario || raw.userId!==studentId || !Array.isArray(raw.answers) || !Array.isArray(raw.questionIds) || raw.questionIds.length!==raw.answers.length || !raw.questionIds.length || raw.questionIds.length>20) return null;
  const topic=state.topics.find(t=>t.id===raw.topicId); if(!topic) return null;
  let correct=0; const signals=[];
  for(let i=0;i<raw.questionIds.length;i++) {
    const q=getResolvedQuestion(topic.id,raw.questionIds[i]); const selected=Number(raw.answers[i]);
    if(!q || !Number.isInteger(selected) || selected<0 || selected>=q.options.length) return null;
    const ok=selected===q.answer; if(ok) correct++;
    const conf=['high','medium','low'].includes(raw.confidence?.[i])?raw.confidence[i]:'medium';
    const key=q.misconceptionByOption?.[selected];
    const mapped=key && q.misconceptions?.[key];
    signals.push({question:q.q,questionId:q.id,selectedIndex:selected,selectedAnswer:q.options[selected],correct:ok,confidence:conf,misconception:ok?null:(mapped?{key,label:mapped.label,why:mapped.why,explanation:mapped.explanation,action:mapped.action,teacherNext:mapped.teacherNext}:null),followUpQuestion:q.followUp?.q||mapped?.followUp?.q||null});
  }
  const score=Math.round(correct/raw.questionIds.length*100);
  return { ...raw, userId:studentId, score, correct, total:raw.questionIds.length, responseSignals:signals, serverValidated:true, serverValidatedAt:new Date().toISOString(), demoScenario:false };
}
function validateRecovery(raw, studentId) {
  if(!raw||!raw.id||raw.userId!==studentId) return null;
  const source=(state.results||[]).find(x=>String(x.id)===String(raw.sourceResultId)&&x.userId===studentId&&x.topicId===raw.topicId);
  const topic=state.topics.find(t=>t.id===raw.topicId);
  if(!source||!topic) return null;
  const safe={id:String(raw.id),userId:studentId,topicId:topic.id,topicTitle:topic.title,subject:topic.subject,sourceResultId:source.id,initialScore:source.score,initialCorrect:source.correct,initialTotal:source.total,createdAt:source.date,status:'recommended',signals:(source.responseSignals||[]).filter(x=>!x.correct||x.confidence!=='high').map(x=>({question:x.question,confidence:x.confidence,correct:x.correct,selectedAnswer:x.selectedAnswer,misconception:x.misconception?.label||null})),reasons:[]};
  if(source.score<70) safe.reasons.push(`Starting assessment: ${source.correct}/${source.total} correct (${source.score}%).`);
  if((source.responseSignals||[]).some(x=>!x.correct&&x.confidence==='high')) safe.reasons.push('One or more confident incorrect answers may indicate a concept worth discussing.');
  if((source.responseSignals||[]).some(x=>x.correct&&x.confidence!=='high')) safe.reasons.push('Correct answers with uncertainty may benefit from reinforcement.');
  const verifyPhase=(prefix)=>{
    const ids=raw[`${prefix}QuestionIds`],answers=raw[`${prefix}Answers`];
    if(!Array.isArray(ids)||!Array.isArray(answers)||!ids.length||ids.length!==answers.length||ids.length>10) return null;
    let correct=0;
    for(let i=0;i<ids.length;i++){const q=getResolvedQuestion(topic.id,ids[i]),a=Number(answers[i]);if(!q||!Number.isInteger(a)||a<0||a>=q.options.length)return null;if(a===q.answer)correct++;}
    return {score:Math.round(correct/ids.length*100),correct,total:ids.length,answers:answers.map(Number),questionIds:ids.map(String)};
  };
  const practice=verifyPhase('practice'), checkpoint=verifyPhase('checkpoint');
  if(practice){safe.practiceScore=practice.score;safe.practiceCorrect=practice.correct;safe.practiceTotal=practice.total;safe.practiceAnswers=practice.answers;safe.practiceQuestionIds=practice.questionIds;safe.practiceCompletedAt=raw.practiceCompletedAt||null;safe.status='checkpoint_ready';}
  if(checkpoint){safe.checkpointScore=checkpoint.score;safe.checkpointCorrect=checkpoint.correct;safe.checkpointTotal=checkpoint.total;safe.checkpointAnswers=checkpoint.answers;safe.checkpointQuestionIds=checkpoint.questionIds;safe.checkpointCompletedAt=raw.checkpointCompletedAt||null;safe.status='completed';}
  return safe;
}

function mergeClientState(user, incoming) {
  if(!incoming || typeof incoming!=='object') throw new Error('State payload is incomplete.');
  // Assessment and progress writes may only originate from the authenticated learner.
  // A teacher can read their class scope, but cannot impersonate a learner via /api/sync.
  const allowedStudentIds = user.role==='student' ? new Set([user.id]) : new Set();
  const incomingResults=(incoming.results||[]).filter(r=>allowedStudentIds.has(r.userId)).map(r=>validateAttempt(r,r.userId)).filter(Boolean);
  state.results=mergeById(state.results,incomingResults,'id').sort((a,b)=>new Date(a.date||0)-new Date(b.date||0));
  if(sqlite) for(const attempt of incomingResults) sqlite.prepare('INSERT OR REPLACE INTO assessment_attempts(id,student_id,topic_id,score,total,attempt_json,created_at) VALUES(?,?,?,?,?,?,?)').run(String(attempt.id),attempt.userId,attempt.topicId,attempt.score,attempt.total,JSON.stringify(attempt),attempt.date||new Date().toISOString());
  // A diagnostic is derived from validated question-level evidence. Never trust a
  // browser-submitted misconception label or follow-up score as the source of truth.
  const addDiagnostic=(event)=>{
    const existing=(state.diagnosticChecks||[]).find(x=>x.userId===event.userId&&x.questionId===event.questionId);
    if(existing) { Object.assign(existing,{...event,id:existing.id,followUpOutcome:existing.followUpOutcome||'pending',followUpScore:existing.followUpScore,completedAt:existing.completedAt}); }
    else state.diagnosticChecks.push(event);
  };
  state.diagnosticChecks=state.diagnosticChecks||[];
  // The browser may queue an incorrect answer while offline. Validate the option and
  // derive its misconception and follow-up from the server's curriculum, not its text.
  for(const raw of incoming.diagnosticChecks||[]) {
    if(!allowedStudentIds.has(raw.userId)) continue;
    const topic=state.topics.find(t=>t.id===raw.topicId),q=topic?.questions.find(x=>x.id===raw.questionId);
    const index=Number(raw.selectedIndex),confidence=['high','medium','low'].includes(raw.confidence)?raw.confidence:'medium';
    if(!q||!Number.isInteger(index)||index<0||index>=q.options.length||index===q.answer||!q.followUp) continue;
    const key=q.misconceptionByOption?.[index],mapped=key&&q.misconceptions?.[key];if(!mapped)continue;
    addDiagnostic({id:String(raw.id||crypto.randomUUID()).slice(0,128),userId:raw.userId,topicId:topic.id,questionId:q.id,selectedIndex:index,confidence,selectedAnswer:q.options[index],misconception:mapped.label,why:mapped.why,explanation:mapped.explanation,action:mapped.action,teacherNext:mapped.teacherNext,followUpQuestion:q.followUp.q,initialOutcome:'incorrect',followUpOutcome:'pending',createdAt:new Date().toISOString()});
  }
  for(const attempt of incomingResults) {
    if(attempt.kind==='targeted-check'&&attempt.parentQuestionId) continue;
    (attempt.responseSignals||[]).forEach((signal,index)=>{
      if(signal.correct||!signal.misconception||!signal.followUpQuestion) return;
      addDiagnostic({id:`diag-${attempt.id}-${index}`,userId:attempt.userId,topicId:attempt.topicId,questionId:signal.questionId,selectedIndex:signal.selectedIndex,confidence:signal.confidence,misconception:signal.misconception.label,why:signal.misconception.why,explanation:signal.misconception.explanation,action:signal.misconception.action,teacherNext:signal.misconception.teacherNext,selectedAnswer:signal.selectedAnswer,followUpQuestion:signal.followUpQuestion,initialOutcome:'incorrect',followUpOutcome:'pending',createdAt:attempt.date});
    });
  }
  for(const attempt of incomingResults) if(attempt.kind==='targeted-check'&&attempt.parentQuestionId) {
    const prior=state.diagnosticChecks.find(x=>x.userId===attempt.userId&&x.questionId===attempt.parentQuestionId);
    if(prior) { prior.followUpOutcome=attempt.score===100?'correct':'not-yet-secure'; prior.followUpScore=attempt.score; prior.completedAt=attempt.date; }
  }
  state.recoveries=mergeById(state.recoveries,(incoming.recoveries||[]).filter(r=>allowedStudentIds.has(r.userId)).map(r=>validateRecovery(r,r.userId)).filter(Boolean),'id');
  state.progress={...(state.progress||{})};
  for(const id of allowedStudentIds) {
    const existing=state.progress[id]||{};
    if(incoming.progress && incoming.progress[id]) state.progress[id]={...existing,...incoming.progress[id]};
    // Progress/completion flags are recalculated from the validated attempts, not accepted as score claims.
    const records=state.results.filter(r=>r.userId===id&&r.kind!=='targeted-check');
    const topicIds=[...new Set(records.map(r=>r.topicId))];
    const topics={...(state.progress[id]?.topics||{})};
    for(const topicId of topicIds) {
      const rows=records.filter(r=>r.topicId===topicId).sort((a,b)=>new Date(a.date)-new Date(b.date));
      const latest=rows[rows.length-1];
      topics[topicId]={...(topics[topicId]||{}),lastScore:latest.score,completed:latest.score>=70,attempts:rows.length,lastAt:latest.date};
    }
    state.progress[id]={...(state.progress[id]||{}),topics};
  }
  state.preferences={...(state.preferences||{})};
  for(const id of allowedStudentIds) if(incoming.preferences && incoming.preferences[id]) state.preferences[id]=incoming.preferences[id];
  // The retired Language Review feature is not accepted or exposed by the API.
  delete state.languageReviews;
  persistState(); audit(user.id,'state-sync',user.id,{acceptedAttempts:incomingResults.length});
  broadcast('state',{changedAt:new Date().toISOString()});
}
function checkRetention() {
  if(!RETENTION_DAYS) return;
  const cutoff=Date.now()-RETENTION_DAYS*86400000;
  const keep=r=>new Date(r.date||r.createdAt||0).getTime()>=cutoff;
  state.results=(state.results||[]).filter(keep); state.recoveries=(state.recoveries||[]).filter(keep);
  state.diagnosticChecks=(state.diagnosticChecks||[]).filter(keep);
  persistState();
}
checkRetention();
async function api(req,res,url) {
  const p=url.pathname;
  if(req.method==='GET'&&p==='/api/health') return json(res,200,{ok:true,service:'LearnFlex',storage:sqlite?'sqlite':'atomic-json-fallback',backend:true,topicCount:state.topics.length,studentCount:state.users.filter(u=>u.role==='student').length,teacherCount:state.users.filter(u=>u.role==='teacher').length,retentionDays:RETENTION_DAYS,time:new Date().toISOString()});
  if(req.method==='GET'&&p==='/api/curriculum') {
    return json(res,200,{
      ok:true,
      board:state.curriculum?.board || 'CBSE (NCERT-aligned)',
      session:state.curriculum?.session || '2026-27',
      subjects:state.curriculum?.subjects || [],
      subjectClassCoverage:state.curriculum?.subjectClassCoverage || [],
      totalTopics:state.topics.length,
      classes:['Class 6','Class 7','Class 8','Class 9','Class 10']
    });
  }
  if(req.method==='GET'&&p==='/api/curriculum/topics') {
    const gradeParam = Number(url.searchParams.get('grade'));
    const classParam = url.searchParams.get('className') || (gradeParam ? `Class ${gradeParam}` : null);
    const subjectParam = url.searchParams.get('subject');
    let matched = state.topics;
    if(classParam) matched = matched.filter(t => t.className.toLowerCase() === classParam.toLowerCase());
    if(subjectParam) matched = matched.filter(t => t.subject.toLowerCase() === subjectParam.toLowerCase());
    const publicList = matched.map(t => ({
      id: t.id,
      title: t.title,
      grade: t.grade,
      className: t.className,
      subject: t.subject,
      chapterNumber: t.chapterNumber,
      lesson: t.lesson ? t.lesson.slice(0, 180) + '…' : '',
      example: t.example ? t.example.slice(0, 180) + '…' : '',
      questionCount: t.questionCount || 20
    }));
    return json(res,200,{ok:true,count:publicList.length,topics:publicList});
  }
  if(req.method==='POST'&&p==='/api/contact') {
    const body=await readBody(req);
    const name=String(body.name||'').trim().slice(0,100);
    const email=String(body.email||'').trim().toLowerCase().slice(0,120);
    const subject=String(body.subject||'').trim().slice(0,150);
    const message=String(body.message||'').trim().slice(0,2000);
    if(!name || !email || !message || !email.includes('@')) {
      return json(res,400,{error:'Please provide your name, a valid email address, and a message.'});
    }
    const inquiry = {
      id: crypto.randomUUID(),
      name,
      email,
      subject: subject || 'General Inquiry',
      message,
      createdAt: new Date().toISOString()
    };
    state.contactInquiries = state.contactInquiries || [];
    state.contactInquiries.push(inquiry);
    persistState();
    audit('guest','contact-inquiry',email,{subject:inquiry.subject});
    return json(res,201,{ok:true,message:'Thank you for reaching out to LearnFlex. Your message has been received.'});
  }
  if(req.method==='POST'&&p==='/api/auth/register') {
    const body=await readBody(req);
    const role=String(body.role||'').toLowerCase();
    if(role==='teacher') return json(res,403,{error:'Teacher accounts are provisioned by an authorized school administrator. Public self-registration is available for students only.'});
    if(role!=='student') return json(res,400,{error:'Public registration is available for students only.'});
    const rawName=String(body.name||'').trim();
    if(!rawName || rawName.length<2 || rawName.length>80) return json(res,400,{error:'Please enter a valid name (2 to 80 characters).'});
    const inviteCode=String(body.inviteCode||'').trim();
    if(!inviteCode) return json(res,403,{error:'A valid school invitation code is required. Ask your teacher or school administrator for one.'});
    const invite=STUDENT_INVITES[inviteCode];
    if(!invite || typeof invite!=='object') return json(res,403,{error:'This school invitation code is invalid or has expired.'});
    if(invite.expiresAt && Date.parse(invite.expiresAt)<=Date.now()) return json(res,403,{error:'This school invitation code has expired. Ask your administrator for a new code.'});
    const useCount=Number(state.invitationUsage[inviteCode]||0), maxUses=Number(invite.maxUses||0);
    if(maxUses>0 && useCount>=maxUses) return json(res,403,{error:'This school invitation code has reached its registration limit.'});
    const className=String(invite.className||'').trim();
    const validClasses=['Class 6','Class 7','Class 8','Class 9','Class 10'];
    const school=String(invite.school||'').trim().slice(0,100);
    const section=String(invite.section||'').trim().toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,4);
    if(!validClasses.includes(className) || !school || !section) return json(res,503,{error:'This invitation is not correctly configured. Contact your school administrator.'});
    const grade=Number(className.replace(/\D/g,''))||6;
    const password=String(body.password||'');
    if(password.length<10 || password.length>128) return json(res,400,{error:'Password must be between 10 and 128 characters long.'});

    let id=normalizeId(body.id);
    if(!id) {
      const prefix = role==='student' ? `LF${grade}` : (grade<10 ? `TEACH0${grade}` : `TEACH${grade}`);
      const count = state.users.filter(u=>u.role===role&&u.className===className).length + 1;
      id = `${prefix}${String(count).padStart(3,'0')}`;
      let counter = count;
      while(findUser(id)) {
        counter++;
        id = `${prefix}${String(counter).padStart(3,'0')}`;
      }
    } else {
      if(findUser(id)) return json(res,409,{error:`User ID "${id}" is already registered. Please choose a different ID or sign in.`});
    }

    const salt = `learnflex-${role}-${id}-${crypto.randomBytes(8).toString('hex')}`;
    const hash = passwordHash(password, salt);
    const newUser = {
      id,
      name: rawName,
      role,
      className,
      grade,
      section,
      school,
      salt,
      passwordHash: hash
    };
    state.users.push(newUser);
    state.invitationUsage[inviteCode]=useCount+1;
    persistState();
    audit(newUser.id,'register',newUser.id,{role:newUser.role,className:newUser.className,school:newUser.school});
    const token = crypto.randomBytes(32).toString('base64url');
    sessions.set(token,{userId:newUser.id,expiresAt:Date.now()+TOKEN_TTL_MS});
    return json(res,201,{ok:true,token,expiresInSeconds:TOKEN_TTL_MS/1000,user:publicUser(newUser)});
  }
  if(req.method==='POST'&&p==='/api/auth/logout') {
    const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
    if(token) sessions.delete(token);
    return json(res,200,{ok:true});
  }
  if(req.method==='POST'&&p==='/api/auth/login') {
    const body=await readBody(req),id=normalizeId(body.id),ip=req.socket.remoteAddress||'unknown';
    if(!loginAllowed(ip)) return json(res,429,{error:'Too many sign-in attempts. Try again in 15 minutes.'});
    const user=findUser(id); if(!user) return json(res,401,{error:'Login details do not match.'});
    const actual=passwordHash(String(body.password||''),user.salt);
    if(!crypto.timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(user.passwordHash,'hex'))) return json(res,401,{error:'Login details do not match.'});
    const token=crypto.randomBytes(32).toString('base64url');sessions.set(token,{userId:user.id,expiresAt:Date.now()+TOKEN_TTL_MS});
    audit(user.id,'login',user.id,{});
    return json(res,200,{ok:true,token,expiresInSeconds:TOKEN_TTL_MS/1000,user:publicUser(user)});
  }
  if(req.method==='GET'&&p==='/api/events') {
    res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
    res.write(`event: ready\ndata: ${JSON.stringify({ok:true})}\n\n`);sseClients.add(res);
    const timer=setInterval(()=>{try{res.write(': keep-alive\n\n')}catch{clearInterval(timer);sseClients.delete(res)}},20000);
    req.on('close',()=>{clearInterval(timer);sseClients.delete(res)});return;
  }
  if(p.startsWith('/api/')) {
    const user=requireAuth(req,res,url); if(!user) return;
    if(req.method==='GET'&&p==='/api/state') return json(res,200,{state:publicStateFor(user)});
    if(req.method==='POST'&&p==='/api/sync') {
      const body=await readBody(req);
      try{mergeClientState(user,body.state);return json(res,200,{ok:true,state:publicStateFor(user)});}catch(e){return json(res,400,{error:e.message});}
    }
    if(req.method==='GET'&&p==='/api/backup') {
      if(user.role!=='teacher')return json(res,403,{error:'Teacher access required.'});
      const data=publicStateFor(user);
      return json(res,200,{exportedAt:new Date().toISOString(),scope:`${user.school} · ${user.className}`,data});
    }
    if(req.method==='POST'&&p==='/api/demo/reset') {
      const resetEnabled=process.env.LEARNFLEX_ALLOW_DEMO_RESET==='true';
      const resetAdminId=String(process.env.LEARNFLEX_DEMO_RESET_ID||'').trim().toUpperCase();
      if(!resetEnabled||!resetAdminId||user.id!==resetAdminId||user.role!=='teacher')return json(res,403,{error:'Shared demo reset is disabled. Use the browser-local reset or contact the demo administrator.'});
      const nextUsers=state.users.map(u=>({...u}));
      state=structuredClone(initialState);state.users=nextUsers;
      if(sqlite)sqlite.exec('DELETE FROM assessment_attempts; DELETE FROM consent_records; DELETE FROM audit_logs;');
      audit(user.id,'demo-reset',user.id,{scope:'shared-demo'});return json(res,200,{ok:true,message:'Demo state reset.'});
    }
    if(req.method==='POST'&&p==='/api/consent') {
      if(user.role!=='teacher')return json(res,403,{error:'Teacher access is required to register a guardian consent record.'});
      const body=await readBody(req),student=findUser(normalizeId(body.studentId));
      if(!student||student.role!=='student'||!sameClass(student,user))return json(res,403,{error:'Student is outside your assigned class.'});
      if(!['pending','granted','withdrawn'].includes(body.status))return json(res,400,{error:'Consent status must be pending, granted or withdrawn.'});
      const entry={id:crypto.randomUUID(),studentId:student.id,teacherId:user.id,status:body.status,evidenceRef:String(body.evidenceRef||'').slice(0,120),createdAt:new Date().toISOString()};
      state.consentRecords.push(entry);
      if(sqlite)sqlite.prepare('INSERT OR REPLACE INTO consent_records(id,student_id,teacher_id,status,evidence_ref,created_at) VALUES(?,?,?,?,?,?)').run(entry.id,entry.studentId,entry.teacherId,entry.status,entry.evidenceRef,entry.createdAt);
      audit(user.id,'consent-recorded',student.id,{status:entry.status});return json(res,201,{ok:true,record:entry});
    }
    if(req.method==='POST'&&p==='/api/pilot-evidence') {
      if(user.role!=='teacher')return json(res,403,{error:'Teacher access is required to save pilot evidence.'});
      const body=await readBody(req),student=findUser(normalizeId(body.studentId)),topic=state.topics.find(t=>t.id===String(body.topicId||''));
      if(!student||student.role!=='student'||!sameClass(student,user))return json(res,403,{error:'Student is outside your assigned class.'});
      if(!topic||topic.className!==user.className)return json(res,403,{error:'Chapter is outside your assigned class.'});
      const consent=(state.consentRecords||[]).filter(c=>c.studentId===student.id).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).at(-1);
      if(!consent||consent.status!=='granted')return json(res,403,{error:'A current guardian consent record marked Granted is required.'});
      const attempts=(state.results||[]).filter(r=>r.userId===student.id&&r.topicId===topic.id&&!r.demoScenario&&r.kind!=='targeted-check');
      const baseline=attempts.find(r=>String(r.id)===String(body.baselineAttemptId));
      const post=attempts.find(r=>String(r.id)===String(body.postAttemptId));
      if(!baseline||!post||baseline.id===post.id||new Date(post.date)<=new Date(baseline.date))return json(res,400,{error:'Choose two distinct, saved attempts for the same chapter, with post-assessment later than baseline.'});
      const clarity=Number(body.clarity),teacherUsefulness=Number(body.teacherUsefulness),minutes=body.practiceMinutes===''||body.practiceMinutes===null||body.practiceMinutes===undefined?null:Number(body.practiceMinutes);
      if(!Number.isInteger(clarity)||clarity<1||clarity>5||!Number.isInteger(teacherUsefulness)||teacherUsefulness<1||teacherUsefulness>5||!(body.misconceptionCorrected==='yes'||body.misconceptionCorrected==='no'||body.misconceptionCorrected==='unclear')||(minutes!==null&&(!Number.isFinite(minutes)||minutes<0||minutes>240)))return json(res,400,{error:'Pilot feedback values are invalid.'});
      const record={id:crypto.randomUUID(),studentId:student.id,teacherId:user.id,className:user.className,school:user.school,topicId:topic.id,topicTitle:topic.title,subject:topic.subject,baselineAttemptId:baseline.id,postAttemptId:post.id,baselineScore:baseline.score,postScore:post.score,scoreChange:post.score-baseline.score,clarity,teacherUsefulness,misconceptionCorrected:body.misconceptionCorrected,practiceMinutes:minutes,createdAt:new Date().toISOString(),consentRecordId:consent.id};
      state.pilotEvidence=state.pilotEvidence||[];state.pilotEvidence.push(record);persistState();audit(user.id,'pilot-evidence-recorded',student.id,{topicId:topic.id,scoreChange:record.scoreChange});
      return json(res,201,{ok:true,record});
    }
    if(req.method==='DELETE'&&p==='/api/account') {
      if(user.role!=='student')return json(res,403,{error:'Teacher demo accounts cannot be deleted through the student self-service endpoint.'});
      const id=user.id;state.users=state.users.filter(u=>u.id!==id);state.results=state.results.filter(r=>r.userId!==id);state.recoveries=state.recoveries.filter(r=>r.userId!==id);state.diagnosticChecks=state.diagnosticChecks.filter(r=>r.userId!==id);state.consentRecords=(state.consentRecords||[]).filter(r=>r.studentId!==id&&r.teacherId!==id);state.pilotEvidence=(state.pilotEvidence||[]).filter(r=>r.studentId!==id);delete state.progress[id];delete state.preferences[id];
      // Redact account identifiers from retained security/audit history instead of keeping a live identity link.
      state.auditLog=(state.auditLog||[]).filter(a=>a.actor!==id&&a.subject!==id);
      if(sqlite){sqlite.prepare('DELETE FROM assessment_attempts WHERE student_id=?').run(id);sqlite.prepare('DELETE FROM consent_records WHERE student_id=? OR teacher_id=?').run(id,id);sqlite.prepare("UPDATE audit_logs SET actor_id='deleted-account', subject_id=NULL, detail_json='{}' WHERE actor_id=? OR subject_id=?").run(id,id);}
      for(const [token,row] of sessions)if(row.userId===id)sessions.delete(token);
      persistState();return json(res,200,{ok:true,retainedAuditRecordsRedacted:true});
    }
    if(req.method==='GET'&&p==='/api/audit') {
      if(user.role!=='teacher')return json(res,403,{error:'Teacher access required.'});
      const ids=new Set(state.users.filter(u=>u.role==='student'&&sameClass(u,user)).map(u=>u.id));
      return json(res,200,{entries:state.auditLog.filter(x=>x.actor===user.id||ids.has(x.subject)).slice(-500)});
    }
    return json(res,404,{error:'API endpoint not found.'});
  }
  return json(res,404,{error:'API endpoint not found.'});
}

const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
function serveStatic(req,res,url) {
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return json(res,400,{error:'Invalid path.'});}
  if(pathname==='/')pathname='/index.html';
  if(pathname.includes('..')||pathname.startsWith('/data/')||['/server.js','/package.json'].includes(pathname)||pathname.startsWith('/.'))return json(res,404,{error:'Not found.'});
  const file=path.resolve(ROOT,`.${pathname}`);
  if(!file.startsWith(ROOT+path.sep)&&file!==path.join(ROOT,'index.html'))return json(res,403,{error:'Forbidden.'});
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile())return json(res,404,{error:'File not found.'});
    const ext=path.extname(file).toLowerCase();
    res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':ext==='.html'||ext==='.js'&&['/app.js','/app-enhancements.js','/curriculum.js','/ncert-curriculum.js','/adaptive-engine.js'].includes(pathname)?'no-cache':'public, max-age=300'});
    fs.createReadStream(file).pipe(res);
  });
}
const handler=async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  try { if(url.pathname.startsWith('/api/'))return await api(req,res,url); if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed.'}); if(req.method==='HEAD')return serveStatic(req,res,url); return serveStatic(req,res,url); }
  catch(error){console.error('Request error:',error);if(!res.headersSent)json(res,500,{error:'Unexpected server error.'});else res.end();}
};
let server;
const keyPath=process.env.LEARNFLEX_TLS_KEY, certPath=process.env.LEARNFLEX_TLS_CERT;
if(keyPath&&certPath) server=https.createServer({key:fs.readFileSync(path.resolve(keyPath)),cert:fs.readFileSync(path.resolve(certPath))},handler);
else server=http.createServer(handler);
server.listen(PORT,HOST,()=>{
  const scheme=keyPath&&certPath?'https':'http';
  console.log(`LearnFlex (${sqlite?'SQLite':'JSON fallback'}) running at ${scheme}://localhost:${server.address().port}`);
  if(!keyPath||!certPath)console.log('HTTP demo mode: use a trusted HTTPS host/reverse proxy for any remote pilot.');
  const addresses=Object.values(os.networkInterfaces()).flat().filter(x=>x&&!x.internal&&(x.family==='IPv4'||x.family===4)).map(x=>x.address);
  addresses.forEach(a=>console.log(`Same-Wi-Fi URL: ${scheme}://${a}:${server.address().port}`));
  console.log('Seeded account password hashes are provisioned at initialization. Production teacher access requires the administrator-configured secret; never use synthetic accounts for real student records.');
});
process.on('SIGINT',()=>{for(const res of sseClients){try{res.end();}catch{}}if(sqlite)sqlite.close();server.close(()=>process.exit(0));});
