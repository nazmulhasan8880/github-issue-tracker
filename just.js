const API = 'https://phi-lab-server.vercel.app/api/v1/lab';
let allIssues  = [];
let currentTab = 'all';
let searchTimer = null;

/* LOGIN */
function doLogin() {
  const u = document.getElementById('inp-user').value.trim();
  const p = document.getElementById('inp-pass').value.trim();
  const e = document.getElementById('auth-error');
  if (u === 'admin' && p === 'admin123') {
    document.getElementById('auth-page').style.display = 'none';
    const app = document.getElementById('app-page');
    app.style.display = 'flex';
    loadIssues();
  } else {
    e.textContent = 'Invalid credentials. Use admin / admin123';
  }
}

document.getElementById('inp-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('inp-user').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

/* LOAD ALL */
async function loadIssues() {
  showSpinner();
  try {
    const res  = await fetch(`${API}/issues`);
    const json = await res.json();
    allIssues  = json.data || [];
    renderCards();
  } catch (err) {
    document.getElementById('cards-grid').innerHTML =
      '<div class="empty-state">⚠️ Failed to load issues. Please check your connection.</div>';
  }
}

/* TABS */
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('search-input').value = '';
  renderCards();
}

/* SEARCH */
function handleSearch(q) {
  clearTimeout(searchTimer);
  if (!q.trim()) { renderCards(); return; }
  searchTimer = setTimeout(async () => {
    showSpinner();
    try {
      const res  = await fetch(`${API}/issues/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      const data = json.data || [];
      const filtered = currentTab === 'all' ? data : data.filter(i => i.status === currentTab);
      renderGrid(filtered);
    } catch (err) { renderCards(); }
  }, 350);
}

/* RENDER */
function showSpinner() {
  document.getElementById('cards-grid').innerHTML =
    '<div class="spinner-wrap"><div class="spinner"></div></div>';
}

function renderCards() {
  const list = currentTab === 'all'
    ? allIssues
    : allIssues.filter(i => i.status === currentTab);
  renderGrid(list);
}

function renderGrid(issues) {
  const grid = document.getElementById('cards-grid');
  document.getElementById('issue-count').textContent = issues.length + ' Issues';
  if (!issues.length) {
    grid.innerHTML = '<div class="empty-state">No issues found.</div>';
    return;
  }
  grid.innerHTML = issues.map(i => `
    <div class="card${i.status === 'closed' ? ' closed-card' : ''}" onclick="openModal(${i.id})">
      <div class="card-body">
        <div class="card-top">
          <span class="badge ${i.status === 'open' ? 'status-open' : 'status-closed'}">
            ${i.status === 'open' ? '<img src="images/Open-Status.png" width="24" height="24" alt="plus"/>' : '<img src="images/Closed-Status.png" width="24" height="24" alt="closed"/>'}            
          </span>
          <span class="badge ${priClass(i.priority)}">${h(i.priority)}</span>
        </div>
        <div class="card-title">${h(i.title)}</div>
        <div class="card-desc">${h(i.description)}</div>
        <div class="card-labels">${(i.labels || []).map(l => `
          <span class="label-chip">${labelImg(l)}<span>${h(l)}</span></span>`).join('')}
        </div>
      </div>
      <div class="card-footer">
        <div class="card-meta">By <b>${h(i.author)}</b></div>
        <div class="card-meta">${fmtDate(i.createdAt)}</div>
      </div>
    </div>`).join('');
}

/* MODAL */
async function openModal(id) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = 'Loading…';
  document.getElementById('modal-body').innerHTML =
    '<div style="display:flex;justify-content:center;padding:32px"><div class="spinner"></div></div>';
  overlay.classList.add('open');
  try {
    const res  = await fetch(`${API}/issue/${id}`);
    const json = await res.json();
    const i    = json.data;
    document.getElementById('modal-title').textContent = i.title;
    document.getElementById('modal-body').innerHTML = `
      <div class="m-row">
        <div>
          <div class="m-label">Status</div>
          <span class="modal-status badge ${i.status === 'open' ? 'status-open' : 'status-closed'}">
            ${i.status === 'open' ? '<img src="images/Open-Status.png" width="24" height="24" alt="plus"/>' : '<img src="images/Closed-Status.png" width="24" height="24" alt="closed"/>'}
          </span>
        </div>
        <div>
          <div class="m-label">Priority</div>
          <span class="badge ${priClass(i.priority)}">${h(i.priority)}</span>
        </div>
      </div>
      <div class="m-section">
        <div class="m-label">Description</div>
        <div class="m-value">${h(i.description)}</div>
      </div>
      <div class="m-row">
        <div>
          <div class="m-label">Author</div>
          <div class="m-value">${h(i.author)}</div>
        </div>
        <div>
          <div class="m-label">Assignee</div>
          <div class="m-value">${i.assignee ? h(i.assignee) : '<span style="color:var(--text-muted)">Unassigned</span>'}</div>
        </div>
      </div>
      <div class="m-section">
        <div class="m-label">Labels</div>
        <div class="m-labels">${(i.labels || []).map(l => `<span class="label-chip">${labelImg(l)}<span>${h(l)}</span></span>`).join('') || '—'}</div>
      </div>
      <div class="m-row">
        <div>
          <div class="m-label">Created</div>
          <div class="m-value" style="font-size:13px">${fmtDate(i.createdAt)}</div>
        </div>
        <div>
          <div class="m-label">Updated</div>
          <div class="m-value" style="font-size:13px">${fmtDate(i.updatedAt)}</div>
        </div>
      </div>`;
  } catch (err) {
    document.getElementById('modal-body').innerHTML =
      '<p style="color:#dc2626;font-size:13px">Failed to load issue details.</p>';
  }
}

function overlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

/* HELPERS */
function priClass(p) {
  return p === 'high' ? 'pri-high' : p === 'medium' ? 'pri-medium' : 'pri-low';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function h(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function labelImg(label) {
  const l = label.toLowerCase();
  const icons = {
    'bug':              'https://api.iconify.design/lucide/bug.svg?color=%23dc2626',
    'enhancement':      'https://api.iconify.design/lucide/sparkles.svg?color=%237c3aed',
    'documentation':    'https://api.iconify.design/lucide/file-text.svg?color=%230369a1',
    'help wanted':      'https://api.iconify.design/lucide/help-circle.svg?color=%2316a34a',
    'good first issue': 'https://api.iconify.design/lucide/heart.svg?color=%23ca8a04',
    'wontfix':          'https://api.iconify.design/lucide/x-circle.svg?color=%236b7280',
  };
  const src = icons[l] || 'https://api.iconify.design/lucide/tag.svg?color=%236b7280';
  return `<img src="${src}" width="10" height="10" alt="${label}"/>`;
}