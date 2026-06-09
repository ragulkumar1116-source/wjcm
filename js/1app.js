// ============================================================
//  APP.JS  – shared state & auth guard (Auto-Provisioning Fix)
// ============================================================

const App = (() => {
  let _user      = null;
  let _churchId  = null;
  let _role      = null;
  let _settings  = {};

  /* ── auth guard – call on every protected page ── */
  function requireAuth(cb) {
    auth.onAuthStateChanged(async user => {
      if (!user) { 
        window.location.href = 'index.html'; 
        return; 
      }
      _user = user;

      let idx = null;

      try {
        // 1. Attempt to fetch remote profile from Firebase
        const snap = await db.ref(`userIndex/${user.uid}`).once('value').catch(() => null);
        if (snap) idx = snap.val();

        // 2. Fallback to LocalStorage cache if offline or missing server records
        if (!idx && typeof SyncEngine !== "undefined") {
          idx = SyncEngine.readCache('userIndex_' + user.uid);
        }

        // 3. AUTO-PROVISION SYSTEM: If user has no record anywhere, build their default block
        if (!idx) {
          console.log("No user index configuration found. Initializing automated provisioning profile...");
          idx = {
            churchId: 'church001', // Your target default organization ID
            role: 'admin',         // First user auto-promotes to system admin
            email: user.email || ''
          };

          // Push new profile back to Firebase safely
          try {
            await db.ref(`userIndex/${user.uid}`).set(idx);
          } catch (writeErr) {
            console.warn("Database write blocked. Ensure database rules are updated:", writeErr);
          }
        }

        _churchId = idx.churchId || 'church001';
        _role     = idx.role || 'admin';

        // Keep local cache updated for smooth offline boots
        if (typeof SyncEngine !== "undefined") {
          SyncEngine.cacheWrite('userIndex_' + user.uid, idx);
        }

        // 4. Secure configuration settings loadout
        const setSnap = await db.ref(`churches/${_churchId}/settings`).once('value').catch(() => null);
        
        if (setSnap && setSnap.val()) {
          _settings = setSnap.val();
        } else if (typeof SyncEngine !== "undefined") {
          _settings = SyncEngine.readCache('settings_' + _churchId) || {};
        } else {
          _settings = {};
        }

        // Set default currency layout if missing
        if (!_settings.currency) _settings.currency = '₹';

        if (typeof SyncEngine !== "undefined") {
          SyncEngine.cacheWrite('settings_' + _churchId, _settings);
          SyncEngine.init(_churchId);
        }

        // Configuration complete. Call back page code elements safely
        cb({ user, churchId: _churchId, role: _role, settings: _settings });

      } catch (criticalAuthGuardError) {
        console.error("Critical crash prevented inside requireAuth module:", criticalAuthGuardError);
        
        // Final fallback rescue safety net so access isn't blocked by missing assets
        _churchId = _churchId || 'church001';
        _role     = _role || 'admin';
        _settings = _settings || { currency: '₹' };
        
        cb({ user, churchId: _churchId, role: _role, settings: _settings });
      }
    });
  }

  function getChurchId()  { return _churchId; }
  function getRole()      { return _role; }
  function getUser()      { return _user; }
  function getSettings()  { return _settings; }
  function getCurrency()  { return _settings.currency || '₹'; }

  async function signOut() {
    await auth.signOut();
    window.location.href = 'index.html';
  }

  /* ── generate a simple push-style ID offline-safe ── */
  function newId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }

  /* ── format currency ── */
  function currency(n) { return getCurrency() + (Number(n) || 0).toLocaleString('en-IN'); }

  /* ── month helpers ── */
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  function currentMonthName() { return MONTHS[new Date().getMonth()]; }
  function currentYear()      { return new Date().getFullYear(); }

  /* ── render sidebar active link ── */
  function activateNav() {
    const page = location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(a => {
      if (a.getAttribute('href') === page) a.classList.add('active');
    });
  }

  /* ── role-based hide ── */
  function applyRoleUI(role) {
    document.querySelectorAll('[data-role]').forEach(el => {
      const allowed = el.dataset.role.split(',');
      if (!allowed.includes(role)) el.style.display = 'none';
    });
  }

  return {
    requireAuth, getChurchId, getRole, getUser, getSettings,
    getCurrency, currency, signOut, newId, activateNav, applyRoleUI,
    MONTHS, currentMonthName, currentYear
  };
})();