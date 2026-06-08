/**
 * collections.js - Collection Management
 * Church Youth Collection Manager
 */

'use strict';

let collectionSearchQuery = '';
let collectionFilterMonth = '';
let collectionFilterYear = new Date().getFullYear();
let editingCollectionId = null;

// ============================================================
// RENDER COLLECTIONS PAGE
// ============================================================
function renderCollections() {
  populateCollectionFilters();
  renderCollectionsList();
  renderCollectionSummary();
}

function populateCollectionFilters() {
  const monthSel = document.getElementById('collectionMonthFilter');
  if (!monthSel.options.length || monthSel.options.length === 1) {
    monthSel.innerHTML = '<option value="">All Months</option>' +
      MONTHS.map(m => `<option value="${m}">${m}</option>`).join('');
  }
  const now = new Date();
  if (!collectionFilterMonth) {
    monthSel.value = '';
  } else {
    monthSel.value = collectionFilterMonth;
  }

  const yearSel = document.getElementById('collectionYearFilter');
  yearSel.value = collectionFilterYear;
}

function renderCollectionsList() {
  let collections = getCollections();
  const settings = getSettings();

  if (collectionFilterMonth) collections = collections.filter(c => c.month === collectionFilterMonth);
  if (collectionFilterYear) collections = collections.filter(c => c.year == collectionFilterYear);
  if (collectionSearchQuery) {
    const q = collectionSearchQuery.toLowerCase();
    collections = collections.filter(c => {
      const member = getMemberById(c.memberId);
      return (member?.name || '').toLowerCase().includes(q) ||
        c.month.toLowerCase().includes(q) ||
        (c.remarks || '').toLowerCase().includes(q);
    });
  }

  // Sort by date desc
  collections = [...collections].sort((a, b) => b.createdAt - a.createdAt);

  const container = document.getElementById('collectionsList');
  if (!collections.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <h3>No Collections Found</h3>
        <p>${collectionSearchQuery ? 'No results for your search' : 'Start by recording a collection'}</p>
        ${!collectionSearchQuery ? '<button class="btn btn-primary" onclick="openAddCollection()">+ Add Collection</button>' : ''}
      </div>`;
    return;
  }

  container.innerHTML = collections.map(c => {
    const member = getMemberById(c.memberId);
    const memberName = member ? escapeHtml(member.name) : 'Unknown Member';
    const target = member ? Number(member.monthlyAmount) : 0;
    const status = getMemberMonthlyStatus(c.memberId, c.month, c.year);
    return `
    <div class="collection-card">
      <div class="collection-left">
        <div class="member-avatar small">${getInitials(member?.name || '?')}</div>
        <div class="collection-info">
          <div class="collection-member">${memberName}</div>
          <div class="collection-meta">
            <span class="badge badge-month">${c.month} ${c.year}</span>
            ${c.remarks ? `<span class="collection-remark">"${escapeHtml(c.remarks)}"</span>` : ''}
          </div>
          <div class="collection-date">${formatDate(c.date)}</div>
        </div>
      </div>
      <div class="collection-right">
        <div class="collection-amount">${settings.currencySymbol}${Number(c.amount).toLocaleString('en-IN')}</div>
        ${status ? `<span class="badge badge-${status.status === 'Completed' ? 'success' : status.status === 'Partial' ? 'warning' : 'danger'}">${status.status}</span>` : ''}
        <div class="member-actions">
          <button class="icon-btn" onclick="editCollection('${c.id}')" title="Edit">✏️</button>
          <button class="icon-btn danger" onclick="deleteCollectionConfirm('${c.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderCollectionSummary() {
  const settings = getSettings();
  let collections = getCollections();
  const month = collectionFilterMonth || MONTHS[new Date().getMonth()];
  const year = collectionFilterYear || new Date().getFullYear();

  const monthCollections = collections.filter(c => c.month === month && c.year == year);
  const totalCollected = monthCollections.reduce((s, c) => s + Number(c.amount), 0);
  const activeMembers = getMembers().filter(m => m.status === 'Active');
  const monthlyTarget = activeMembers.reduce((s, m) => s + Number(m.monthlyAmount), 0);
  const completedCount = activeMembers.filter(m => {
    const status = getMemberMonthlyStatus(m.id, month, year);
    return status?.status === 'Completed';
  }).length;

  document.getElementById('colSummaryMonth').textContent = `${month} ${year}`;
  document.getElementById('colSummaryTarget').textContent = formatCurrency(monthlyTarget);
  document.getElementById('colSummaryCollected').textContent = formatCurrency(totalCollected);
  document.getElementById('colSummaryPending').textContent = formatCurrency(Math.max(0, monthlyTarget - totalCollected));
  document.getElementById('colSummaryCompleted').textContent = `${completedCount}/${activeMembers.length}`;

  const pct = monthlyTarget > 0 ? Math.min(100, Math.round((totalCollected / monthlyTarget) * 100)) : 0;
  document.getElementById('colSummaryProgress').style.width = pct + '%';
  document.getElementById('colSummaryPct').textContent = pct + '%';
}

// ============================================================
// ADD / EDIT COLLECTION
// ============================================================
function openAddCollection(preselectedMemberId = null) {
  editingCollectionId = null;
  document.getElementById('collectionModalTitle').textContent = 'Add Collection';
  document.getElementById('collectionForm').reset();
  document.getElementById('collectionDate').value = getTodayDate();

  // Set default month/year
  const now = new Date();
  document.getElementById('collectionMonth').value = MONTHS[now.getMonth()];
  document.getElementById('collectionYear').value = now.getFullYear();

  // Populate member select
  populateMemberSelect('collectionMember');
  if (preselectedMemberId) {
    document.getElementById('collectionMember').value = preselectedMemberId;
    updateCollectionTarget();
  }

  openModal('collectionModal');
}

function editCollection(id) {
  const collections = getCollections();
  const col = collections.find(c => c.id === id);
  if (!col) return;

  editingCollectionId = id;
  document.getElementById('collectionModalTitle').textContent = 'Edit Collection';

  populateMemberSelect('collectionMember');
  document.getElementById('collectionMember').value = col.memberId;
  document.getElementById('collectionMonth').value = col.month;
  document.getElementById('collectionYear').value = col.year;
  document.getElementById('collectionAmount').value = col.amount;
  document.getElementById('collectionDate').value = col.date;
  document.getElementById('collectionRemarks').value = col.remarks || '';

  updateCollectionTarget();
  openModal('collectionModal');
}

function populateMemberSelect(selectId) {
  const select = document.getElementById(selectId);
  const members = getMembers().filter(m => m.status === 'Active');
  select.innerHTML = '<option value="">-- Select Member --</option>' +
    members.map(m => `<option value="${m.id}">${escapeHtml(m.name)} (${m.id})</option>`).join('');
}

function updateCollectionTarget() {
  const memberId = document.getElementById('collectionMember').value;
  const month = document.getElementById('collectionMonth').value;
  const year = document.getElementById('collectionYear').value;
  const targetInfo = document.getElementById('collectionTargetInfo');

  if (!memberId || !month) {
    targetInfo.innerHTML = '';
    return;
  }

  const member = getMemberById(memberId);
  if (!member) return;

  const status = getMemberMonthlyStatus(memberId, month, year);
  const settings = getSettings();

  if (status) {
    const colorClass = status.status === 'Completed' ? 'text-success' : 'text-warning';
    targetInfo.innerHTML = `
      <div class="target-info-box">
        <span>Target: ${settings.currencySymbol}${status.target}</span>
        <span>Paid: ${settings.currencySymbol}${status.totalPaid}</span>
        <span class="${colorClass}">Balance: ${settings.currencySymbol}${status.balance}</span>
        <span class="badge badge-${status.status === 'Completed' ? 'success' : 'warning'}">${status.status}</span>
      </div>`;
  }
}

function saveCollection() {
  const memberId = document.getElementById('collectionMember').value;
  const month = document.getElementById('collectionMonth').value;
  const year = parseInt(document.getElementById('collectionYear').value);
  const amount = parseFloat(document.getElementById('collectionAmount').value);
  const date = document.getElementById('collectionDate').value;
  const remarks = document.getElementById('collectionRemarks').value.trim();

  if (!memberId) { showToast('Please select a member', 'error'); return; }
  if (!month) { showToast('Please select a month', 'error'); return; }
  if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }
  if (!date) { showToast('Please select a date', 'error'); return; }

  let collections = getCollections();

  if (editingCollectionId) {
    const idx = collections.findIndex(c => c.id === editingCollectionId);
    if (idx !== -1) {
      collections[idx] = { ...collections[idx], memberId, month, year, amount, date, remarks, updatedAt: Date.now() };
      pushToFirebase('collection', collections[idx]);
    }
    showToast('✅ Collection updated!', 'success');
  } else {
    const newCol = {
      id: 'col_' + Date.now(),
      memberId, month, year, amount, date, remarks,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    collections.push(newCol);
    pushToFirebase('collection', newCol);
    showToast('✅ Collection recorded!', 'success');
  }

  saveCollections(collections);
  closeModal('collectionModal');
  renderCollections();
}

// ============================================================
// DELETE COLLECTION
// ============================================================
function deleteCollectionConfirm(id) {
  confirmAction('Delete this collection record?', () => deleteCollection(id));
}

function deleteCollection(id) {
  let collections = getCollections();
  collections = collections.filter(c => c.id !== id);
  saveCollections(collections);
  deleteFromFirebase('collection', id);
  showToast('🗑️ Collection deleted', 'info');
  renderCollections();
}

// ============================================================
// FILTER HANDLERS
// ============================================================
function filterCollectionMonth(month) {
  collectionFilterMonth = month;
  renderCollections();
}

function filterCollectionYear(year) {
  collectionFilterYear = parseInt(year);
  renderCollections();
}

function searchCollections(query) {
  collectionSearchQuery = query;
  renderCollectionsList();
}
