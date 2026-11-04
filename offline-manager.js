/* LearnFlex — resilient offline learning, durable outbox and reconnect sync. */
(function () {
  'use strict';
  const DB_NAME = 'learnflex-offline-v1';
  const DB_VERSION = 1;
  const OUTBOX_KEY = 'latest-state';
  const RETRY_BASE_MS = 2500;
  const RETRY_MAX_MS = 60000;
  let idbPromise;
  let retryTimer = null;
  let retryCount = 0;
  let syncRunning = false;
  let networkDegradedUntil = 0;

  function openDB() {
    if (idbPromise) return idbPromise;
    idbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB is unavailable'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('packs')) db.createObjectStore('packs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open offline storage'));
      request.onblocked = () => reject(new Error('Offline storage upgrade is blocked by another tab'));
    });
    return idbPromise;
  }
  async function storePut(storeName, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve(true);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('Offline storage write failed'));
    });
  }
  async function storeGet(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('Offline storage read failed'));
    });
  }
  async function storeAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error || new Error('Offline storage read failed'));
    });
  }
  async function storeDelete(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('Offline storage delete failed'));
    });
  }
  function compactState() {
    if (typeof db === 'undefined' || !db) return null;
    return {
      users: db.users || [], results: db.results || [], progress: db.progress || {},
      preferences: db.preferences || {}, recoveries: db.recoveries || [],
      diagnosticChecks: db.diagnosticChecks || [], consentRecords: db.consentRecords || [],
      pilotEvidence: db.pilotEvidence || [], curriculumVersion: db.curriculumVersion || ''
    };
  }
  function pendingCount() { return storeGet('outbox', OUTBOX_KEY).then(x => x ? 1 : 0).catch(() => 0); }
  function connectionLabel() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!navigator.onLine) return 'Offline';
    if (Date.now() < networkDegradedUntil) return 'Poor network';
    if (c && (c.saveData || ['slow-2g', '2g'].includes(c.effectiveType) || (c.rtt && c.rtt > 1200))) return 'Poor network';
    return 'Online';
  }
  async function updateStatus() {
    const badge = document.getElementById('globalConnectionBadge');
    const pending = await pendingCount();
    const state = connectionLabel();
    if (badge) {
      badge.textContent = state === 'Offline' ? `● Offline · ${pending} pending` : state === 'Poor network' ? `● Poor network · ${pending} pending` : pending ? `● Sync pending · ${pending}` : ((typeof backendConnected !== 'undefined' && backendConnected) ? '● Online · synced' : '● Online · local saved');
      badge.classList.toggle('offline', state !== 'Online' || pending > 0);
      badge.title = 'Your learning activity is saved on this device. Pending changes sync when a secure connection is available.';
    }
    const status = document.getElementById('offlineSyncStatus');
    if (status) status.textContent = pending ? `${pending} change set waiting to sync` : (state === 'Offline' ? 'Offline · saved on this device' : 'All changes synced');
  }
  async function queueSnapshot() {
    const state = compactState();
    if (!state) return;
    try {
      const savedAt = new Date().toISOString();
      await storePut('meta', { id: 'local-state-backup', state, savedAt });
      await storePut('outbox', { id: OUTBOX_KEY, state, savedAt, attempts: 0 });
      await storePut('meta', { id: 'last-local-save', at: savedAt });
      updateStatus();
      if (navigator.onLine) scheduleSync(900);
      else registerBackgroundSync();
    } catch (error) {
      console.warn('LearnFlex IndexedDB backup failed; localStorage remains the primary fallback.', error);
      updateStatus();
    }
  }
  function registerBackgroundSync() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(reg => reg.sync && reg.sync.register('learnflex-progress-sync')).catch(() => {});
  }
  function scheduleSync(delay) {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(flushOutbox, delay);
  }
  async function flushOutbox() {
    if (syncRunning || !navigator.onLine || (typeof currentUser === 'undefined' || !currentUser) || !sessionStorage.getItem('learnflex_access_token') || sessionStorage.getItem('learnflex_access_user') !== currentUser.id) {
      updateStatus(); return;
    }
    const queued = await storeGet('outbox', OUTBOX_KEY).catch(() => null);
    if (!queued) { updateStatus(); return; }
    syncRunning = true;
    try {
      const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const timeoutMs = c && c.effectiveType === '2g' ? 30000 : 18000;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let response;
      try {
        response = await window.apiRequest('/api/sync', {
          method: 'POST', signal: controller.signal,
          body: JSON.stringify({ state: queued.state })
        });
      } finally { clearTimeout(timeout); }
      if (response && response.state && typeof applyRemoteState === 'function') applyRemoteState(response.state, false);
      await storeDelete('outbox', OUTBOX_KEY);
      retryCount = 0;
      networkDegradedUntil = 0;
      if (typeof backendConnected !== 'undefined') backendConnected = true;
      await storePut('meta', { id: 'last-successful-sync', at: new Date().toISOString() });
    } catch (error) {
      retryCount += 1;
      networkDegradedUntil = Date.now() + 120000;
      const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * (2 ** Math.min(retryCount - 1, 5)));
      const existing = await storeGet('outbox', OUTBOX_KEY).catch(() => null);
      if (existing) await storePut('outbox', { ...existing, attempts: (existing.attempts || 0) + 1, lastError: String(error.message || error), nextRetryAt: new Date(Date.now() + delay).toISOString() }).catch(() => {});
      if (typeof backendConnected !== 'undefined') backendConnected = false;
      if (navigator.onLine) scheduleSync(delay);
    } finally {
      syncRunning = false;
      updateStatus();
    }
  }
  async function savePack(id, payload) {
    await storePut('packs', { id, ...payload, savedAt: new Date().toISOString(), schemaVersion: 2 });
    updateStatus();
  }
  async function getPacks() { return storeAll('packs'); }
  async function removePack(id) { await storeDelete('packs', id); }
  async function downloadSubject(subject) {
    const topics = (db.topics || []).filter(t => t.subject === subject);
    if (!topics.length) return toast('No chapters found for this subject.');
    try {
      await savePack(`subject:${subject}`, { kind: 'subject', subject, topicCount: topics.length, topics });
      toast(`${subject}: ${topics.length} chapters saved for offline learning on this device.`);
      renderOfflineControls();
    } catch (error) { toast('Could not save this subject. Check available browser storage.'); }
  }
  async function downloadAllSubjects() {
    const subjects = [...new Set((db.topics || []).map(t => t.subject))];
    for (const subject of subjects) await downloadSubject(subject);
    toast(`Offline packs saved for ${subjects.length} subjects.`);
  }
  function renderOfflineControls() {
    const host = document.getElementById('pageContent');
    if (!host || !host.querySelector('#topicGrid') || host.querySelector('#offlineLearningPanel')) return;
    const subjects = [...new Set((db.topics || []).map(t => t.subject))].sort();
    const panel = document.createElement('section');
    panel.id = 'offlineLearningPanel'; panel.className = 'card offline-learning-panel';
    panel.innerHTML = `<div class="offline-panel-head"><div><h3>Offline learning downloads</h3><p>Save a full subject or individual chapters to this device before going offline.</p></div><span class="pill easy">On this device</span></div><div class="offline-download-actions"><label class="offline-subject-label">Subject <select id="offlineSubjectSelect">${subjects.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('')}</select></label><button class="btn soft small" id="downloadOfflineSubject">Download subject</button><button class="btn ghost small" id="downloadAllOfflineSubjects">Download all subjects</button></div><p id="offlineSyncStatus" class="offline-sync-copy" aria-live="polite">Checking saved changes…</p><div id="offlineSavedPacks" class="offline-saved-packs">Loading downloads…</div>`;
    const intro = host.querySelector('.page-intro');
    if (intro) intro.insertAdjacentElement('afterend', panel); else host.prepend(panel);
    panel.querySelector('#downloadOfflineSubject').onclick = () => downloadSubject(panel.querySelector('#offlineSubjectSelect').value);
    panel.querySelector('#downloadAllOfflineSubjects').onclick = downloadAllSubjects;
    renderOfflinePackList(); updateStatus();
  }
  async function renderOfflinePackList() {
    const host = document.getElementById('offlineSavedPacks'); if (!host) return;
    const packs = await getPacks().catch(() => []);
    host.innerHTML = packs.length ? packs.map(p => `<div class="offline-pack-item"><span class="offline-pack-chip">${escapeHTML(p.subject || p.topic?.title || p.id)} · ${p.topicCount || 1} chapter(s)</span><button class="btn ghost small" type="button" data-open-offline-pack="${escapeHTML(p.id)}">Open</button></div>`).join('') : '<span class="subtle">No subject downloads yet. Save a subject or a chapter above.</span>';
    host.querySelectorAll('[data-open-offline-pack]').forEach(button => button.addEventListener('click', () => {
      const pack = packs.find(item => item.id === button.dataset.openOfflinePack); if (!pack) return;
      if (pack.kind === 'chapter' && pack.topic && typeof openTopic === 'function') {
        const idx=(db.topics||[]).findIndex(t=>t.id===pack.topic.id); if(idx>=0) db.topics[idx]=pack.topic; else db.topics.push(pack.topic);
        openTopic(pack.topic.id); return;
      }
      const grid = document.getElementById('topicGrid'); if (!grid) return;
      const matches = Array.isArray(pack.topics) ? pack.topics : (db.topics || []).filter(topic => topic.subject === pack.subject);
      // Make the exact downloaded module payload available to the lesson renderer offline.
      for(const savedTopic of matches){const idx=(db.topics||[]).findIndex(t=>t.id===savedTopic.id);if(idx>=0)db.topics[idx]=savedTopic;else db.topics.push(savedTopic);}
      grid.innerHTML = matches.map(lessonCard).join('');
      document.querySelectorAll('.filters [data-filter]').forEach(filter => filter.classList.toggle('active', filter.dataset.filter === pack.subject));
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }
  async function purgeUserData(userId) {
    const purge = snapshot => {
      if (!snapshot || !snapshot.state) return snapshot;
      const state = snapshot.state;
      state.users = (state.users || []).filter(user => user.id !== userId);
      state.results = (state.results || []).filter(item => item.userId !== userId);
      state.recoveries = (state.recoveries || []).filter(item => item.userId !== userId);
      state.diagnosticChecks = (state.diagnosticChecks || []).filter(item => item.userId !== userId);
      state.consentRecords = (state.consentRecords || []).filter(item => item.studentId !== userId && item.teacherId !== userId);
      state.pilotEvidence = (state.pilotEvidence || []).filter(item => item.studentId !== userId);
      if (state.progress) delete state.progress[userId];
      if (state.preferences) delete state.preferences[userId];
      return snapshot;
    };
    for (const [store,key] of [['outbox',OUTBOX_KEY],['meta','local-state-backup']]) {
      try {
        const value = await storeGet(store,key);
        if (value) await storePut(store,purge(value));
      } catch (error) { console.warn('Could not purge one offline snapshot during account deletion:',error.message); }
    }
  }
  async function restoreLocalBackup() {
    try {
      const backup = await storeGet('meta', 'local-state-backup');
      if (!backup || !backup.state || typeof mergeDBObjects !== 'function') return;
      const merged = mergeDBObjects(db || {}, backup.state);
      const before = JSON.stringify({ results: (db.results || []).length, recoveries: (db.recoveries || []).length });
      const after = JSON.stringify({ results: (merged.results || []).length, recoveries: (merged.recoveries || []).length });
      db = merged;
      if (before !== after) { saveDB(); toast('Recovered saved learning progress from this device.'); }
    } catch (error) { console.warn('Could not restore the IndexedDB progress backup.', error); }
  }
  function init() {
    if (window.__learnFlexOfflineManagerReady) return;
    window.__learnFlexOfflineManagerReady = true;
    const originalConnectToBackend = window.connectToBackend;
    if (typeof originalConnectToBackend === 'function') window.connectToBackend = async function () { const result = await originalConnectToBackend.apply(this, arguments); scheduleSync(250); return result; };
    const originalSaveDB = window.saveDB;
    if (typeof originalSaveDB === 'function') window.saveDB = function () { const result = originalSaveDB.apply(this, arguments); if (typeof syncingFromServer === 'undefined' || !syncingFromServer) queueSnapshot(); return result; };
    const originalSaveTopicPack = window.saveTopicPack;
    if (typeof originalSaveTopicPack === 'function') window.saveTopicPack = function (topicId) {
      const topic = (db.topics || []).find(t => t.id === topicId); if (!topic) return;
      originalSaveTopicPack.apply(this, arguments);
      savePack(`chapter:${topicId}`, { kind: 'chapter', subject: topic.subject, topicCount: 1, topic }).then(() => toast(`${topic.title} is ready offline.`)).catch(() => toast('Could not save this chapter for offline use.'));
    };
    const originalRemoveTopicPack = window.removeTopicPack;
    if (typeof originalRemoveTopicPack === 'function') window.removeTopicPack = function (topicId) { originalRemoveTopicPack.apply(this, arguments); removePack(`chapter:${topicId}`).catch(() => {}); };
    const originalLearnPage = window.learnPage;
    if (typeof originalLearnPage === 'function') window.learnPage = function () { const out = originalLearnPage.apply(this, arguments); setTimeout(renderOfflineControls, 0); return out; };
    window.addEventListener('online', () => { retryCount = 0; scheduleSync(300); updateStatus(); });
    window.addEventListener('offline', updateStatus);
    window.addEventListener('focus', () => { if (navigator.onLine) scheduleSync(250); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) queueSnapshot(); else if (navigator.onLine) scheduleSync(250); });
    window.addEventListener('pagehide', queueSnapshot);
    if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', updateStatus);
    if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data?.type === 'LEARNFLEX_SYNC_REQUEST') flushOutbox(); });
    // Mirror the current state once at startup; this also creates a recoverable IndexedDB copy.
    updateStatus();
    restoreLocalBackup().then(() => { queueSnapshot(); updateStatus(); });
    setTimeout(renderOfflineControls, 0);
    setTimeout(() => { if (navigator.onLine) flushOutbox(); }, 1800);
  }
  window.learnFlexOffline = { init, flush: flushOutbox, savePack, getPacks, removePack, downloadSubject, downloadAllSubjects, updateStatus, purgeUserData };
  init();
})();
