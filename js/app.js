/**
 * app.js - Core Application Logic
 * Church Youth Collection Manager
 * Handles: LocalStorage, Firebase Sync, Offline Detection, Navigation
 */

'use strict';

// ============================================================
// GLOBAL STATE
// ============================================================
const APP = {
  version: '1.0.0',
  isOnline: navigator.onLine,
  firebaseEnabled: false,
  db: null,
  currentPage: 'dashboard',
  syncPending: false,
  syncQueue: [],
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================
const Store = {
  get(key, defaultVal = null) {
    try {
      const val = localStorage.getItem('cycm_' + key);
      return val !== null ? JSON.parse(val) : defaultVal;
    } catch { return defaultVal; }
  },
  set(key, value) {
    try {
      localStorage.setItem('cycm_' + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },
  remove(key) {
    localStorage.removeItem('cycm_' + key);
  }
};

// ============================================================
// DEFAULT SETTINGS
// ============================================================
function getSettings() {
  return Store.get('settings', {
    churchName: 'Church Youth Group',
    churchLogo: '',
    financialYear: new Date().getFullYear(),
    currencySymbol: '₹',
    monthlyTarget: 100,
    adminPin: '1234'
  });
}

function saveSettings(settings) {
  Store.set('settings', settings);
  if (APP.firebaseEnabled && APP.isOnline) {
    APP.db.ref('settings').set(settings);
  }
}

// ============================================================
// MEMBER HELPERS
// ============================================================
function getMembers() {
  return Store.get('members', []);
}

function saveMembers(members) {
  Store.set('members', members);
}

function generateMemberId() {
  const members = getMembers();
  const year = new Date().getFullYear().toString().slice(-2);
  const count = members.length + 1;
  return `YM${year}${String(count).padStart(3, '0')}`;
}

function getMemberById(id) {
  return getMembers().find(m => m.id === id);
}

// ============================================================
// COLLECTION HELPERS
// ============================================================
function getCollections() {
  return Store.get('collections', []);
}

function saveCollections(collections) {
  Store.set('collections', collections);
}

function getCollectionsByMember(memberId) {
  return getCollections().filter(c => c.memberId === memberId);
}

function getCollectionsByMonth(month, year) {
  return getCollections().filter(c => c.month === month && c.year == year);
}

function getMemberMonthlyStatus(memberId, month, year) {
  const member = getMemberById(memberId);
  if (!member) return null;
  const cols = getCollections().filter(
    c => c.memberId === memberId && c.month === month && c.year == year
  );
  const totalPaid = cols.reduce((s, c) => s + Number(c.amount), 0);
  const target = Number(member.monthlyAmount);
  const balance = Math.max(0, target - totalPaid);
  const status = totalPaid >= target ? 'Completed' : totalPaid > 0 ? 'Partial' : 'Pending';
  return { totalPaid, target, balance, status, percentage: target > 0 ? Math.min(100, Math.round((totalPaid / target) * 100)) : 0 };
}

// ============================================================
// DASHBOARD CALCULATIONS
// ============================================================
function getDashboardStats() {
  const settings = getSettings();
  const members = getMembers().filter(m => m.status === 'Active');
  const collections = getCollections();
  const now = new Date();
  const currentMonth = MONTHS[now.getMonth()];
  const currentYear = now.getFullYear();

  const totalMonthlyTarget = members.reduce((s, m) => s + Number(m.monthlyAmount || 0), 0);
  const currentMonthCols = collections.filter(c => c.month === currentMonth && c.year == currentYear);
  const currentMonthCollected = currentMonthCols.reduce((s, c) => s + Number(c.amount), 0);

  const totalAllTime = collections.reduce((s, c) => s + Number(c.amount), 0);
  const pending = Math.max(0, totalMonthlyTarget - currentMonthCollected);
  const achievement = totalMonthlyTarget > 0 ? Math.min(100, Math.round((currentMonthCollected / totalMonthlyTarget) * 100)) : 0;

  // Monthly trend (last 6 months)
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mn = MONTHS[d.getMonth()];
    const yr = d.getFullYear();
    const amt = collections.filter(c => c.month === mn && c.year == yr).reduce((s, c) => s + Number(c.amount), 0);
    trend.push({ month: MONTH_SHORT[d.getMonth()], amount: amt, year: yr });
  }

  // Top contributors (current month)
  const memberTotals = members.map(m => {
    const paid = currentMonthCols.filter(c => c.memberId === m.id).reduce((s, c) => s + Number(c.amount), 0);
    return { name: m.name, amount: paid, memberId: m.id };
  }).filter(m => m.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 5);

  return {
    totalMembers: members.length,
    totalMonthlyTarget,
    currentMonthCollected,
    pending,
    achievement,
    totalAllTime,
    currentMonth,
    currentYear,
    trend,
    topContributors: memberTotals,
    currency: settings.currencySymbol
  };
}

// ============================================================
// SYNC QUEUE (OFFLINE → ONLINE)
// ============================================================
function addToSyncQueue(action) {
  const queue = Store.get('syncQueue', []);
  queue.push({ ...action, timestamp: Date.now(), id: 'sq_' + Date.now() });
  Store.set('syncQueue', queue);
}

async function processSyncQueue() {
  if (!APP.firebaseEnabled || !APP.isOnline) return;
  const queue = Store.get('syncQueue', []);
  if (!queue.length) return;

  console.log(`🔄 Syncing ${queue.length} queued actions...`);
  const remaining = [];

  for (const action of queue) {
    try {
      if (action.type === 'SET_MEMBER') {
        await APP.db.ref(`members/${action.data.id}`).set(action.data);
      } else if (action.type === 'DEL_MEMBER') {
        await APP.db.ref(`members/${action.id}`).remove();
      } else if (action.type === 'SET_COLLECTION') {
        await APP.db.ref(`collections/${action.data.id}`).set(action.data);
      } else if (action.type === 'DEL_COLLECTION') {
        await APP.db.ref(`collections/${action.id}`).remove();
      }
    } catch (e) {
      remaining.push(action);
    }
  }
  Store.set('syncQueue', remaining);
  if (remaining.length === 0) {
    showToast('✅ All data synced to cloud!', 'success');
  }
}

// ============================================================
// FIREBASE SYNC
// ============================================================
async function pushToFirebase(type, data) {
  if (!APP.firebaseEnabled) return;
  if (!APP.isOnline) {
    addToSyncQueue({ type: `SET_${type.toUpperCase()}`, data });
    return;
  }
  try {
    await APP.db.ref(`${type.toLowerCase()}s/${data.id}`).set(data);
  } catch (e) {
    addToSyncQueue({ type: `SET_${type.toUpperCase()}`, data });
  }
}

async function deleteFromFirebase(type, id) {
  if (!APP.firebaseEnabled) return;
  if (!APP.isOnline) {
    addToSyncQueue({ type: `DEL_${type.toUpperCase()}`, id });
    return;
  }
  try {
    await APP.db.ref(`${type.toLowerCase()}s/${id}`).remove();
  } catch (e) {
    addToSyncQueue({ type: `DEL_${type.toUpperCase()}`, id });
  }
}

async function syncFromFirebase() {
  if (!APP.firebaseEnabled || !APP.isOnline) return;
  try {
    const [membersSnap, collectionsSnap, settingsSnap] = await Promise.all([
      APP.db.ref('members').once('value'),
      APP.db.ref('collections').once('value'),
      APP.db.ref('settings').once('value')
    ]);

    if (membersSnap.val()) {
      const members = Object.values(membersSnap.val());
      saveMembers(members);
    }
    if (collectionsSnap.val()) {
      const collections = Object.values(collectionsSnap.val());
      saveCollections(collections);
    }
    if (settingsSnap.val()) {
      saveSettings(settingsSnap.val());
    }
    showToast('✅ Data synced from cloud', 'success');
  } catch (e) {
    console.warn('Firebase sync failed:', e);
  }
}

// ============================================================
// ONLINE / OFFLINE DETECTION
// ============================================================
function updateOnlineStatus() {
  APP.isOnline = navigator.onLine;
  const indicator = document.getElementById('onlineIndicator');
  if (indicator) {
    indicator.className = APP.isOnline ? 'status-online' : 'status-offline';
    indicator.innerHTML = APP.isOnline
      ? '<span class="dot"></span> Online'
      : '<span class="dot"></span> Offline';
  }
  if (APP.isOnline) {
    processSyncQueue();
  }
}

window.addEventListener('online', () => {
  APP.isOnline = true;
  updateOnlineStatus();
  showToast('🌐 Back online! Syncing data...', 'info');
  setTimeout(processSyncQueue, 1000);
});

window.addEventListener('offline', () => {
  APP.isOnline = false;
  updateOnlineStatus();
  showToast('📴 You are offline. Changes saved locally.', 'warning');
});

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================
// MODAL HELPERS
// ============================================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal.active').forEach(m => {
    m.classList.remove('active');
  });
  document.body.style.overflow = '';
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) closeAllModals();
});

// ============================================================
// CONFIRM DIALOG
// ============================================================
function confirmAction(message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmBtn').onclick = () => {
    closeModal('confirmModal');
    onConfirm();
  };
  openModal('confirmModal');
}

// ============================================================
// FORMAT HELPERS
// ============================================================
function formatCurrency(amount) {
  const s = getSettings();
  return `${s.currencySymbol}${Number(amount).toLocaleString('en-IN')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// ============================================================
// PAGE NAVIGATION (SPA-STYLE)
// ============================================================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + pageId);
  if (page) {
    page.classList.add('active');
    APP.currentPage = pageId;
  }

  const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add('active');

  // Load page data
  switch (pageId) {
    case 'dashboard': renderDashboard(); break;
    case 'members': renderMembers(); break;
    case 'collections': renderCollections(); break;
    case 'reports': renderReports(); break;
    case 'settings': renderSettings(); break;
  }

  // Close sidebar on mobile
  document.getElementById('sidebar')?.classList.remove('open');
  window.scrollTo(0, 0);
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Try Firebase
  APP.firebaseEnabled = initializeFirebase();
  if (APP.firebaseEnabled) {
    APP.db = firebase.database();
    await syncFromFirebase();
  }

  updateOnlineStatus();

  // Load default page
  showPage('dashboard');

  // Nav listeners
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (page) showPage(page);
    });
  });

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  // Login check
  checkLogin();
});

// ============================================================
// SIMPLE PIN LOGIN
// ============================================================
function checkLogin() {
  const loggedIn = Store.get('loggedIn', false);
  if (!loggedIn) {
    openModal('loginModal');
  }
}

function handleLogin() {
  const pin = document.getElementById('loginPin').value;
  const settings = getSettings();
  if (pin === settings.adminPin) {
    Store.set('loggedIn', true);
    closeModal('loginModal');
    showToast('Welcome! 🎉', 'success');
  } else {
    showToast('❌ Incorrect PIN. Try again.', 'error');
    document.getElementById('loginPin').value = '';
  }
}

function handleLogout() {
  Store.remove('loggedIn');
  openModal('loginModal');
  document.getElementById('loginPin').value = '';
}
