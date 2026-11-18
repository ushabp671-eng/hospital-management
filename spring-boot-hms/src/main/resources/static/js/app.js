const loginForm = document.getElementById('loginForm');
const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('d-none');
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    loginError.textContent = err.error || 'Login failed';
    loginError.classList.remove('d-none');
    return;
  }

  loginView.classList.add('d-none');
  appView.classList.remove('d-none');
  logoutBtn.classList.remove('d-none');
  await loadDashboard();
  await loadTab('doctors');
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  appView.classList.add('d-none');
  logoutBtn.classList.add('d-none');
  loginView.classList.remove('d-none');
});

async function loadDashboard() {
  const res = await fetch('/api/dashboard');
  const data = await res.json();
  document.getElementById('kpiCards').innerHTML = `
    <div class="col-md-3"><div class="card p-3"><h6>Doctors</h6><h3>${data.totalDoctors}</h3></div></div>
    <div class="col-md-3"><div class="card p-3"><h6>Patients</h6><h3>${data.totalPatients}</h3></div></div>
    <div class="col-md-3"><div class="card p-3"><h6>Appointments</h6><h3>${data.totalAppointments}</h3></div></div>
    <div class="col-md-3"><div class="card p-3"><h6>Collected Revenue</h6><h3>$${Number(data.collectedRevenue).toFixed(2)}</h3></div></div>
  `;
}

async function loadTab(tab) {
  const res = await fetch(`/api/${tab}`);
  const rows = await res.json();
  document.getElementById('tabContent').innerHTML = `<pre class="mb-0">${JSON.stringify(rows, null, 2)}</pre>`;
}

document.querySelectorAll('#hmsTabs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#hmsTabs button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    loadTab(btn.dataset.tab);
  });
});
