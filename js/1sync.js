// ============================================================
//  OFFLINE SYNC ENGINE
//  Queues every DB write to localStorage when offline.
//  On reconnect (or app restart with connection) flushes the
//  queue automatically in FIFO order.
// ============================================================

const SyncEngine = (() => {
  const QUEUE_KEY = 'cymOfflineQueue';
  let _churchId   = null;
  let _isFlushing = false;

  /* ── helpers ── */
  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch { return []; }
  }
  function saveQueue(q) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  }
  function pendingCount() { return getQueue().length; }
  function updateBadge() {
    const badge = document.getElementById('sync-badge');
    const n = pendingCount();
    if (!badge) return;
    badge.textContent = n;
    badge.style.display = n ? 'flex' : 'none';
  }

  /* ── enqueue a write operation ── */
  function enqueue(op) {
    // op = { path, value, method:'set'|'update'|'remove', ts }
    const q = getQueue();
    q.push({ ...op, ts: Date.now() });
    saveQueue(q);
    updateBadge();
  }

  /* ── flush queue to Firebase ── */
  async function flush() {
    if (_isFlushing) return;
    const q = getQueue();
    if (!q.length) return;

    _isFlushing = true;
    showSyncToast('Syncing offline data…');

    const remaining = [];
    for (const op of q) {
      try {
        const ref = db.ref(op.path);
        if (op.method === 'remove') await ref.remove();
        else if (op.method === 'update') await ref.update(op.value);
        else await ref.set(op.value);
      } catch (e) {
        console.warn('Sync failed for op:', op, e);
        remaining.push(op);
      }
    }

    saveQueue(remaining);
    updateBadge();
    _isFlushing = false;

    if (!remaining.length) showSyncToast('✓ All data synced to cloud', 'success');
    else showSyncToast(`⚠ ${remaining.length} item(s) still pending`, 'warn');
  }

  /* ── write wrapper: decides local or Firebase ── */
  async function write(path, value, method = 'set') {
    const online = navigator.onLine;
    if (online) {
      try {
        const ref = db.ref(path);
        if (method === 'remove') await ref.remove();
        else if (method === 'update') await ref.update(value);
        else await ref.set(value);
        return true;
      } catch (e) {
        console.warn('Firebase write failed, queuing:', e);
      }
    }
    // offline or firebase failed → queue
    enqueue({ path, value, method });
    showSyncToast('📴 Saved locally – will sync when online');
    return false;
  }

  /* ── read: always tries Firebase first, falls back to localStorage cache ── */
  async function read(path, cacheKey) {
    if (navigator.onLine) {
      return new Promise((res) => {
        db.ref(path).once('value', snap => {
          const val = snap.val();
          if (cacheKey) localStorage.setItem('cym_cache_' + cacheKey, JSON.stringify(val));
          res(val);
        }, () => res(readCache(cacheKey)));
      });
    }
    return readCache(cacheKey);
  }

  function readCache(cacheKey) {
    if (!cacheKey) return null;
    try { return JSON.parse(localStorage.getItem('cym_cache_' + cacheKey)); }
    catch { return null; }
  }

  function cacheWrite(cacheKey, data) {
    localStorage.setItem('cym_cache_' + cacheKey, JSON.stringify(data));
  }

  /* ── init: monitor connectivity & flush on reconnect ── */
  function init(churchId) {
    _churchId = churchId;
    updateBadge();

    window.addEventListener('online', () => {
      updateOnlineStatus(true);
      flush();
    });
    window.addEventListener('offline', () => updateOnlineStatus(false));

    // also listen to Firebase connection state
    db.ref('.info/connected').on('value', snap => {
      if (snap.val() === true) {
        updateOnlineStatus(true);
        flush();
      }
    });

    updateOnlineStatus(navigator.onLine);
  }

  /* ── UI helpers ── */
  function updateOnlineStatus(online) {
    const dot = document.getElementById('conn-dot');
    const lbl = document.getElementById('conn-label');
    if (dot) dot.className = 'conn-dot ' + (online ? 'online' : 'offline');
    if (lbl) lbl.textContent = online ? 'Online' : 'Offline';
  }

  function showSyncToast(msg, type = 'info') {
    let t = document.getElementById('sync-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'sync-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'sync-toast show ' + type;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3500);
  }

  return { init, write, read, cacheWrite, readCache, flush, pendingCount, updateBadge };
})();
