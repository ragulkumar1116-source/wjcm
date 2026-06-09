// ============================================================
//  SHARED LAYOUT – renders sidebar + topbar into any page
// ============================================================

function renderLayout(pageTitle) {
  const page = location.pathname.split('/').pop();

  const navItems = [
    { href: 'dashboard.html',   ico: '📊', label: 'Dashboard',   roles: ['admin','collector','viewer'] },
    { href: 'members.html',      ico: '👥', label: 'Members',     roles: ['admin','collector'] },
    { href: 'collections.html',   ico: '💰', label: 'Collections', roles: ['admin','collector'] },
    { href: 'reports.html',       ico: '📋', label: 'Reports',     roles: ['admin','collector','viewer'] },
    { href: 'settings.html',      ico: '⚙️', label: 'Settings',    roles: ['admin'] },
  ];

  // Defensive checks to prevent crashes if App state isn't ready
  const role = (typeof App !== 'undefined' && App.getRole) ? (App.getRole() || 'viewer') : 'viewer';
  const user = (typeof App !== 'undefined' && App.getUser) ? App.getUser() : null;
  const initials = (user?.displayName || user?.email || 'U').slice(0,2).toUpperCase();

  const navHTML = navItems
    .filter(n => n.roles.includes(role))
    .map(n => `
      <a href="${n.href}" class="nav-link ${page === n.href ? 'active' : ''}">
        <span class="nav-ico">${n.ico}</span>
        <span>${n.label}</span>
      </a>
    `).join('');

  const settings = (typeof App !== 'undefined' && App.getSettings) ? (App.getSettings() || {}) : {};
  const churchName = settings.churchName || 'My Church';

  // Build the complete, valid outer layout shell structure
  const html = `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-logo">✝</div>
        <div class="sidebar-brand-text">
          <h3>${churchName}</h3>
          <p>Youth Collection</p>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">Menu</div>
        ${navHTML}
      </nav>
      <div class="sidebar-footer">
        <div class="user-chip" onclick="App.signOut()">
          <div class="user-avatar">${initials}</div>
          <div class="user-chip-info">
            <div class="name">${user?.displayName || user?.email || 'User'}</div>
            <div class="role">${role.charAt(0).toUpperCase() + role.slice(1)} · Sign out</div>
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>

    <div class="main">
      <div class="offline-banner" id="offline-banner">
        📴 You're offline. Changes are saved locally and will sync when you reconnect.
      </div>
      <div class="topbar">
        <div class="topbar-left">
          <button class="hamburger" onclick="toggleSidebar()">
            <span></span><span></span><span></span>
          </button>
          <h2>${pageTitle}</h2>
        </div>
        <div class="topbar-right">
          <div class="conn-indicator">
            <div class="conn-dot" id="conn-dot"></div>
            <span id="conn-label">–</span>
          </div>
          <div class="sync-btn-wrap">
            <button class="btn btn-outline btn-sm" onclick="if(typeof SyncEngine !== 'undefined') SyncEngine.flush()" title="Sync pending data">
              🔄 Sync
            </button>
            <div id="sync-badge">0</div>
          </div>
        </div>
      </div>
      <div class="page-body" id="page-body"></div>
    </div>
  `;

  // Inject layout architecture safely at the beginning of body elements
  document.body.insertAdjacentHTML('afterbegin', html);

  // Bind connection listeners safely without breaking if targets are absent
  window.addEventListener('offline', () => {
    const banner = document.getElementById('offline-banner');
    if (banner) banner.classList.add('show');
  });
  window.addEventListener('online', () => {
    const banner = document.getElementById('offline-banner');
    if (banner) banner.classList.remove('show');
  });
  
  if (!navigator.onLine) {
    const banner = document.getElementById('offline-banner');
    if (banner) banner.classList.add('show');
  }
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sb) sb.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sb) sb.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}