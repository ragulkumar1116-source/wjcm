/**
 * reports.js - Reports & Dashboard Rendering
 * Church Youth Collection Manager
 */

'use strict';

// ============================================================
// DASHBOARD RENDER
// ============================================================
function renderDashboard() {
  const stats = getDashboardStats();
  const settings = getSettings();

  // Update church name
  const churchNameEl = document.getElementById('churchNameDisplay');
  if (churchNameEl) churchNameEl.textContent = settings.churchName;

  // Cards
  document.getElementById('dashTotalMembers').textContent = stats.totalMembers;
  document.getElementById('dashMonthlyTarget').textContent = formatCurrency(stats.totalMonthlyTarget);
  document.getElementById('dashCollected').textContent = formatCurrency(stats.currentMonthCollected);
  document.getElementById('dashPending').textContent = formatCurrency(stats.pending);
  document.getElementById('dashAchievement').textContent = stats.achievement + '%';
  document.getElementById('dashCurrentMonth').textContent = stats.currentMonth + ' ' + stats.currentYear;

  // Progress bar
  const progressBar = document.getElementById('dashProgressBar');
  if (progressBar) {
    progressBar.style.width = stats.achievement + '%';
    progressBar.className = 'progress-fill ' + (stats.achievement >= 100 ? 'complete' : stats.achievement >= 50 ? 'good' : 'low');
  }

  // Trend Chart
  renderTrendChart(stats.trend, settings.currencySymbol);

  // Top Contributors
  renderTopContributors(stats.topContributors, settings.currencySymbol);

  // Recent collections
  renderRecentActivity();
}

function renderTrendChart(trend, currency) {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 300;
  const H = canvas.height = 160;
  ctx.clearRect(0, 0, W, H);

  if (!trend.length) return;
  const maxVal = Math.max(...trend.map(t => t.amount), 1);
  const padL = 45, padR = 10, padT = 15, padB = 35;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW = Math.min(35, chartW / trend.length - 8);

  // Gridlines
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    const val = Math.round(maxVal - (maxVal / 4) * i);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val >= 1000 ? (val/1000).toFixed(1)+'k' : val, padL - 4, y + 4);
  }

  // Bars
  trend.forEach((t, i) => {
    const x = padL + (chartW / trend.length) * i + (chartW / trend.length - barW) / 2;
    const barH = (t.amount / maxVal) * chartH;
    const y = padT + chartH - barH;
    const isLast = i === trend.length - 1;

    const grad = ctx.createLinearGradient(0, y, 0, padT + chartH);
    grad.addColorStop(0, isLast ? '#f0c040' : 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, isLast ? '#e0a020' : 'rgba(255,255,255,0.2)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    // Month label
    ctx.fillStyle = isLast ? '#f0c040' : 'rgba(255,255,255,0.7)';
    ctx.font = isLast ? 'bold 11px sans-serif' : '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.month, x + barW / 2, H - 10);
  });
}

function renderTopContributors(contributors, currency) {
  const container = document.getElementById('topContributors');
  if (!container) return;
  if (!contributors.length) {
    container.innerHTML = '<p class="text-muted text-center">No contributions this month yet</p>';
    return;
  }
  const maxAmt = contributors[0]?.amount || 1;
  container.innerHTML = contributors.map((c, i) => `
    <div class="contributor-row">
      <span class="contributor-rank">#${i+1}</span>
      <div class="contributor-avatar">${getInitials(c.name)}</div>
      <div class="contributor-info">
        <div class="contributor-name">${escapeHtml(c.name)}</div>
        <div class="contributor-bar-wrap">
          <div class="contributor-bar" style="width:${Math.round((c.amount/maxAmt)*100)}%"></div>
        </div>
      </div>
      <span class="contributor-amount">${currency}${c.amount.toLocaleString('en-IN')}</span>
    </div>
  `).join('');
}

function renderRecentActivity() {
  const container = document.getElementById('recentActivity');
  if (!container) return;
  const settings = getSettings();
  const collections = [...getCollections()].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  if (!collections.length) {
    container.innerHTML = '<p class="text-muted text-center">No recent activity</p>';
    return;
  }

  container.innerHTML = collections.map(c => {
    const member = getMemberById(c.memberId);
    return `
    <div class="activity-row">
      <div class="member-avatar small">${getInitials(member?.name || '?')}</div>
      <div class="activity-info">
        <div class="activity-name">${escapeHtml(member?.name || 'Unknown')}</div>
        <div class="activity-meta">${c.month} ${c.year} • ${formatDate(c.date)}</div>
      </div>
      <div class="activity-amount">${settings.currencySymbol}${Number(c.amount).toLocaleString('en-IN')}</div>
    </div>`;
  }).join('');
}

// ============================================================
// REPORTS PAGE
// ============================================================
let reportYear = new Date().getFullYear();
let reportType = 'monthly';

function renderReports() {
  document.getElementById('reportYearSel').value = reportYear;
  if (reportType === 'monthly') renderMonthlyReport();
  else renderYearlyReport();
}

function switchReport(type) {
  reportType = type;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderReports();
}

function setReportYear(year) {
  reportYear = parseInt(year);
  renderReports();
}

function renderMonthlyReport() {
  const container = document.getElementById('reportContent');
  const settings = getSettings();
  const members = getMembers().filter(m => m.status === 'Active');
  const allCollections = getCollections().filter(c => c.year == reportYear);
  const now = new Date();

  const rows = MONTHS.map((month, idx) => {
    if (reportYear == now.getFullYear() && idx > now.getMonth()) return null;
    const monthCols = allCollections.filter(c => c.month === month);
    const collected = monthCols.reduce((s, c) => s + Number(c.amount), 0);
    const target = members.reduce((s, m) => s + Number(m.monthlyAmount), 0);
    const pending = Math.max(0, target - collected);
    const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
    const completedMembers = members.filter(m => {
      const status = getMemberMonthlyStatus(m.id, month, reportYear);
      return status?.status === 'Completed';
    }).length;

    return { month, collected, target, pending, pct, completedMembers, totalMembers: members.length };
  }).filter(Boolean);

  const grandTotal = rows.reduce((s, r) => s + r.collected, 0);
  const grandTarget = rows.reduce((s, r) => s + r.target, 0);

  container.innerHTML = `
    <div class="report-summary-cards">
      <div class="report-card">
        <div class="report-val">${settings.currencySymbol}${grandTotal.toLocaleString('en-IN')}</div>
        <div class="report-label">Total Collected (${reportYear})</div>
      </div>
      <div class="report-card">
        <div class="report-val">${settings.currencySymbol}${grandTarget.toLocaleString('en-IN')}</div>
        <div class="report-label">Total Target (${reportYear})</div>
      </div>
      <div class="report-card">
        <div class="report-val">${grandTarget > 0 ? Math.round((grandTotal/grandTarget)*100) : 0}%</div>
        <div class="report-label">Overall Achievement</div>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table report-table" id="monthlyReportTable">
        <thead>
          <tr>
            <th>Month</th>
            <th>Target</th>
            <th>Collected</th>
            <th>Pending</th>
            <th>Achievement</th>
            <th>Members Paid</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td><strong>${r.month}</strong></td>
              <td>${settings.currencySymbol}${r.target.toLocaleString('en-IN')}</td>
              <td class="text-success">${settings.currencySymbol}${r.collected.toLocaleString('en-IN')}</td>
              <td class="text-danger">${settings.currencySymbol}${r.pending.toLocaleString('en-IN')}</td>
              <td>
                <div class="report-progress">
                  <div class="report-bar" style="width:${r.pct}%"></div>
                  <span>${r.pct}%</span>
                </div>
              </td>
              <td>${r.completedMembers}/${r.totalMembers}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td><strong>TOTAL</strong></td>
            <td><strong>${settings.currencySymbol}${grandTarget.toLocaleString('en-IN')}</strong></td>
            <td><strong class="text-success">${settings.currencySymbol}${grandTotal.toLocaleString('en-IN')}</strong></td>
            <td><strong class="text-danger">${settings.currencySymbol}${Math.max(0,grandTarget-grandTotal).toLocaleString('en-IN')}</strong></td>
            <td><strong>${grandTarget > 0 ? Math.round((grandTotal/grandTarget)*100) : 0}%</strong></td>
            <td>-</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

function renderYearlyReport() {
  const container = document.getElementById('reportContent');
  const settings = getSettings();
  const members = getMembers().filter(m => m.status === 'Active');

  container.innerHTML = `
    <div class="table-wrap">
      <table class="data-table report-table" id="yearlyReportTable">
        <thead>
          <tr>
            <th>Member</th>
            ${MONTHS.map(m => `<th title="${m}">${m.slice(0,3)}</th>`).join('')}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${members.map(member => {
            let memberTotal = 0;
            const cells = MONTHS.map(month => {
              const status = getMemberMonthlyStatus(member.id, month, reportYear);
              const paid = status?.totalPaid || 0;
              memberTotal += paid;
              const cls = paid >= (status?.target || 0) && paid > 0 ? 'cell-complete' : paid > 0 ? 'cell-partial' : '';
              return `<td class="${cls}">${paid > 0 ? settings.currencySymbol + paid : '-'}</td>`;
            }).join('');
            return `<tr>
              <td><strong>${escapeHtml(member.name)}</strong><br><small>${member.id}</small></td>
              ${cells}
              <td><strong>${settings.currencySymbol}${memberTotal.toLocaleString('en-IN')}</strong></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

// ============================================================
// PRINT REPORT
// ============================================================
function printReport() {
  const settings = getSettings();
  const tableEl = document.querySelector('#reportContent table');
  if (!tableEl) { showToast('No report to print', 'error'); return; }

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>${settings.churchName} - Report ${reportYear}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
      h1 { color: #1a3a5c; margin-bottom: 4px; }
      p { color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #1a3a5c; color: white; padding: 8px 6px; text-align: left; }
      td { padding: 7px 6px; border-bottom: 1px solid #eee; }
      tr:nth-child(even) td { background: #f8f9fa; }
      .total-row td { background: #e8f4fd !important; font-weight: bold; border-top: 2px solid #1a3a5c; }
      .cell-complete { background: #d4edda !important; }
      .cell-partial { background: #fff3cd !important; }
      @media print { button { display: none; } }
    </style></head><body>
    <h1>⛪ ${settings.churchName}</h1>
    <p>${reportType === 'monthly' ? 'Monthly Report' : 'Yearly Report'} — ${reportYear}</p>
    ${tableEl.outerHTML}
    <p style="margin-top:20px;font-size:12px;color:#999;">Generated on ${new Date().toLocaleString('en-IN')}</p>
    </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ============================================================
// SETTINGS PAGE
// ============================================================
function renderSettings() {
  const settings = getSettings();
  document.getElementById('settingsChurchName').value = settings.churchName;
  document.getElementById('settingsFinancialYear').value = settings.financialYear;
  document.getElementById('settingsCurrency').value = settings.currencySymbol;
  document.getElementById('settingsMonthlyTarget').value = settings.monthlyTarget;
  document.getElementById('settingsAdminPin').value = settings.adminPin;

  if (settings.churchLogo) {
    document.getElementById('logoPreview').src = settings.churchLogo;
    document.getElementById('logoPreview').style.display = 'block';
  }
}

function saveSettingsForm() {
  const settings = getSettings();
  settings.churchName = document.getElementById('settingsChurchName').value.trim() || settings.churchName;
  settings.financialYear = parseInt(document.getElementById('settingsFinancialYear').value);
  settings.currencySymbol = document.getElementById('settingsCurrency').value.trim() || '₹';
  settings.monthlyTarget = parseFloat(document.getElementById('settingsMonthlyTarget').value) || 100;
  const newPin = document.getElementById('settingsAdminPin').value.trim();
  if (newPin && newPin.length >= 4) settings.adminPin = newPin;

  saveSettings(settings);
  showToast('✅ Settings saved!', 'success');
}

function handleLogoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 500 * 1024) { showToast('Logo must be under 500KB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const settings = getSettings();
    settings.churchLogo = e.target.result;
    saveSettings(settings);
    document.getElementById('logoPreview').src = e.target.result;
    document.getElementById('logoPreview').style.display = 'block';
    showToast('✅ Logo updated!', 'success');
  };
  reader.readAsDataURL(file);
}

function clearAppData() {
  confirmAction(
    '⚠️ This will delete ALL members and collections data. This cannot be undone. Continue?',
    () => {
      Store.remove('members');
      Store.remove('collections');
      Store.remove('syncQueue');
      showToast('🗑️ All data cleared', 'info');
    }
  );
}

function exportData() {
  const data = {
    members: getMembers(),
    collections: getCollections(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
    version: APP.version
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `church-youth-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Data exported!', 'success');
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.members) saveMembers(data.members);
      if (data.collections) saveCollections(data.collections);
      if (data.settings) saveSettings(data.settings);
      showToast('✅ Data imported successfully!', 'success');
      showPage('dashboard');
    } catch {
      showToast('❌ Invalid backup file', 'error');
    }
  };
  reader.readAsText(file);
}
