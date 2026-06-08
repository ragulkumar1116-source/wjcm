/**
 * members.js - Member Management
 * Church Youth Collection Manager
 */

'use strict';

let memberSearchQuery = '';
let memberFilterStatus = 'All';
let editingMemberId = null;

// ============================================================
// RENDER MEMBERS PAGE
// ============================================================
function renderMembers() {
  const members = getFilteredMembers();
  const container = document.getElementById('membersList');
  const settings = getSettings();

  // Update counters
  const all = getMembers();
  document.getElementById('memberCount').textContent = all.length;
  document.getElementById('activeCount').textContent = all.filter(m => m.status === 'Active').length;
  document.getElementById('inactiveCount').textContent = all.filter(m => m.status === 'Inactive').length;

  if (!members.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>No Members Found</h3>
        <p>${memberSearchQuery ? 'No results for "' + memberSearchQuery + '"' : 'Start by adding your first member'}</p>
        ${!memberSearchQuery ? '<button class="btn btn-primary" onclick="openAddMember()">+ Add Member</button>' : ''}
      </div>`;
    return;
  }

  container.innerHTML = members.map(m => {
    const now = new Date();
    const status = getMemberMonthlyStatus(m.id, MONTHS[now.getMonth()], now.getFullYear());
    return `
    <div class="member-card" onclick="viewMemberProfile('${m.id}')">
      <div class="member-avatar">${getInitials(m.name)}</div>
      <div class="member-info">
        <div class="member-name">${escapeHtml(m.name)}</div>
        <div class="member-meta">
          <span class="member-id">${m.id}</span>
          ${m.area ? `<span>• ${escapeHtml(m.area)}</span>` : ''}
        </div>
        <div class="member-meta">
          <span>${m.mobile || '-'}</span>
        </div>
      </div>
      <div class="member-right">
        <span class="badge badge-${m.status === 'Active' ? 'success' : 'danger'}">${m.status}</span>
        <div class="member-amount">${settings.currencySymbol}${Number(m.monthlyAmount).toLocaleString('en-IN')}/mo</div>
        ${status ? `<div class="mini-progress"><div class="mini-bar" style="width:${status.percentage}%"></div></div>` : ''}
      </div>
      <div class="member-actions" onclick="event.stopPropagation()">
        <button class="icon-btn" onclick="editMember('${m.id}')" title="Edit">✏️</button>
        <button class="icon-btn danger" onclick="deleteMemberConfirm('${m.id}')" title="Delete">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function getFilteredMembers() {
  let members = getMembers();
  if (memberFilterStatus !== 'All') {
    members = members.filter(m => m.status === memberFilterStatus);
  }
  if (memberSearchQuery) {
    const q = memberSearchQuery.toLowerCase();
    members = members.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      (m.mobile || '').includes(q) ||
      (m.area || '').toLowerCase().includes(q)
    );
  }
  return members;
}

// ============================================================
// SEARCH & FILTER
// ============================================================
function searchMembers(query) {
  memberSearchQuery = query;
  renderMembers();
}

function filterMembers(status) {
  memberFilterStatus = status;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderMembers();
}

// ============================================================
// ADD / EDIT MEMBER
// ============================================================
function openAddMember() {
  editingMemberId = null;
  document.getElementById('memberModalTitle').textContent = 'Add Member';
  document.getElementById('memberForm').reset();
  document.getElementById('memberId').value = generateMemberId();
  document.getElementById('memberStatus').value = 'Active';
  openModal('memberModal');
}

function editMember(id) {
  const member = getMemberById(id);
  if (!member) return;
  editingMemberId = id;
  document.getElementById('memberModalTitle').textContent = 'Edit Member';
  document.getElementById('memberId').value = member.id;
  document.getElementById('memberName').value = member.name;
  document.getElementById('memberMobile').value = member.mobile || '';
  document.getElementById('memberArea').value = member.area || '';
  document.getElementById('memberMonthlyAmount').value = member.monthlyAmount;
  document.getElementById('memberStatus').value = member.status;
  openModal('memberModal');
}

function saveMember() {
  const id = document.getElementById('memberId').value.trim();
  const name = document.getElementById('memberName').value.trim();
  const mobile = document.getElementById('memberMobile').value.trim();
  const area = document.getElementById('memberArea').value.trim();
  const monthlyAmount = parseFloat(document.getElementById('memberMonthlyAmount').value) || 0;
  const status = document.getElementById('memberStatus').value;

  if (!name) { showToast('Name is required', 'error'); return; }
  if (monthlyAmount <= 0) { showToast('Monthly amount must be greater than 0', 'error'); return; }

  let members = getMembers();

  if (editingMemberId) {
    const idx = members.findIndex(m => m.id === editingMemberId);
    if (idx !== -1) {
      members[idx] = { ...members[idx], name, mobile, area, monthlyAmount, status, updatedAt: Date.now() };
      pushToFirebase('member', members[idx]);
    }
    showToast('✅ Member updated!', 'success');
  } else {
    // Check duplicate ID
    if (members.find(m => m.id === id)) {
      showToast('Member ID already exists', 'error');
      return;
    }
    const newMember = {
      id, name, mobile, area, monthlyAmount, status,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    members.push(newMember);
    pushToFirebase('member', newMember);
    showToast('✅ Member added!', 'success');
  }

  saveMembers(members);
  closeModal('memberModal');
  renderMembers();
}

// ============================================================
// DELETE MEMBER
// ============================================================
function deleteMemberConfirm(id) {
  const member = getMemberById(id);
  if (!member) return;
  confirmAction(
    `Delete member "${member.name}"? This will also delete all their collection records.`,
    () => deleteMember(id)
  );
}

function deleteMember(id) {
  let members = getMembers();
  members = members.filter(m => m.id !== id);
  saveMembers(members);

  // Remove collections too
  let collections = getCollections();
  collections = collections.filter(c => c.memberId !== id);
  saveCollections(collections);

  deleteFromFirebase('member', id);
  showToast('🗑️ Member deleted', 'info');
  renderMembers();
}

// ============================================================
// VIEW MEMBER PROFILE
// ============================================================
function viewMemberProfile(id) {
  const member = getMemberById(id);
  if (!member) return;
  const settings = getSettings();
  const collections = getCollectionsByMember(id);
  const now = new Date();

  const totalPaid = collections.reduce((s, c) => s + Number(c.amount), 0);
  const yearsInvolved = [...new Set(collections.map(c => c.year))];
  const annualTarget = Number(member.monthlyAmount) * 12;
  const pendingAmount = Math.max(0, (Number(member.monthlyAmount) * (now.getMonth() + 1)) - totalPaid);

  // Build monthly history for current year
  const yearCollections = collections.filter(c => c.year == now.getFullYear());
  const monthlyRows = MONTHS.map((month, idx) => {
    const monthCols = yearCollections.filter(c => c.month === month);
    const paid = monthCols.reduce((s, c) => s + Number(c.amount), 0);
    const target = Number(member.monthlyAmount);
    const status = paid >= target ? 'Completed' : paid > 0 ? 'Partial' : (idx <= now.getMonth() ? 'Pending' : '-');
    const statusClass = paid >= target ? 'success' : paid > 0 ? 'warning' : 'danger';
    if (idx > now.getMonth() && paid === 0) return null;
    return `<tr>
      <td>${month}</td>
      <td>${settings.currencySymbol}${paid.toLocaleString('en-IN')}</td>
      <td>${settings.currencySymbol}${Math.max(0, target - paid).toLocaleString('en-IN')}</td>
      <td><span class="badge badge-${statusClass}">${status}</span></td>
    </tr>`;
  }).filter(Boolean).join('');

  document.getElementById('profileContent').innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar large">${getInitials(member.name)}</div>
      <div class="profile-details">
        <h2>${escapeHtml(member.name)}</h2>
        <div class="profile-meta">
          <span>🆔 ${member.id}</span>
          ${member.mobile ? `<span>📞 ${member.mobile}</span>` : ''}
          ${member.area ? `<span>📍 ${escapeHtml(member.area)}</span>` : ''}
        </div>
        <span class="badge badge-${member.status === 'Active' ? 'success' : 'danger'}">${member.status}</span>
      </div>
    </div>

    <div class="stats-grid-4">
      <div class="stat-card">
        <div class="stat-value">${settings.currencySymbol}${Number(member.monthlyAmount).toLocaleString('en-IN')}</div>
        <div class="stat-label">Monthly Target</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-success">${settings.currencySymbol}${totalPaid.toLocaleString('en-IN')}</div>
        <div class="stat-label">Total Paid</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-danger">${settings.currencySymbol}${pendingAmount.toLocaleString('en-IN')}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${annualTarget > 0 ? Math.min(100, Math.round((totalPaid / annualTarget) * 100)) : 0}%</div>
        <div class="stat-label">Achievement</div>
      </div>
    </div>

    <h3 style="margin: 1rem 0 0.5rem">Collection History (${now.getFullYear()})</h3>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Month</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
        <tbody>${monthlyRows || '<tr><td colspan="4" class="text-center">No collections yet</td></tr>'}</tbody>
      </table>
    </div>

    <div style="margin-top:1rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="closeModal('profileModal'); editMember('${id}')">✏️ Edit</button>
      <button class="btn btn-secondary" onclick="openAddCollectionForMember('${id}')">+ Add Collection</button>
    </div>
  `;

  openModal('profileModal');
}

function openAddCollectionForMember(memberId) {
  closeModal('profileModal');
  showPage('collections');
  setTimeout(() => openAddCollection(memberId), 100);
}

// ============================================================
// UTILS
// ============================================================
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
