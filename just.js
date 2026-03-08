
const API = 'https://phi-lab-server.vercel.app/api/v1/lab';
let allIssues  = [];
let currentTab = 'all';
let searchTimer = null;

/*  LOGIN  */
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

/*  LOAD ALL  */
async function loadIssues() {
  showSpinner();
  try {
    const res  = await fetch(`${API}/issues`);
    const json = await res.json();
    allIssues  = json.data || [];
    renderCards();
  } catch (err) {
    document.getElementById('cards-grid').innerHTML =
      '<div class="empty-state">Failed to load issues. Please check your connection.</div>';
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
            ${i.status === 'open' ? '`<img src="images/Open-Status.png" width="9" height="9" alt="issues"/>`Open' : '`<img src="images/Closed-Status.png" width="9" height="9" alt="issues"/>`Closed'}
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
