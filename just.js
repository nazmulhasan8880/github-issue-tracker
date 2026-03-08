
const API = 'https://phi-lab-server.vercel.app/api/v1/lab';
let allIssues  = [];
let currentTab = 'all';
let searchTimer = null;

/* ── LOGIN ── */
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
