// ─────────────────────────────────────────
//  CollegeYatra — Admin Panel JS
//  ✅  No credentials stored here
//  ✅  Auth handled entirely by server sessions
//  ✅  Credentials compared via bcrypt on server
// ─────────────────────────────────────────

/* ── TOAST ── */
const toastEl = document.getElementById('toast');
let toastTimer;
function showToast(msg, type = 'success') {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.className   = 'toast show ' + type;
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3500);
}

/* ── DOM refs ── */
const loginPage = document.getElementById('loginPage');
const adminPage = document.getElementById('adminPage');
const loginForm = document.getElementById('loginForm');
const loginErr  = document.getElementById('loginErr');
const loginBtn  = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

/* ── Check existing session on load ── */
async function checkSession() {
  try {
    const res  = await fetch('/api/auth/check');
    const data = await res.json();
    if (data.authenticated) {
      showAdminPanel();
      refreshAll();
    }
    // else: stay on login page (already shown by default)
  } catch (e) {
    // server unreachable — stay on login page
  }
}

/* ── Login ── */
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginBtn.textContent = 'Signing in…';
  loginBtn.disabled    = true;
  loginErr.classList.remove('show');

  const username = document.getElementById('lusername').value.trim();
  const password = document.getElementById('lpassword').value;

  try {
    const res  = await fetch('/api/auth/login', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body:        JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      document.getElementById('lpassword').value = '';
      document.getElementById('lusername').value = '';
      showAdminPanel();
      refreshAll();
    } else {
      loginErr.textContent = data.error || 'Invalid credentials.';
      loginErr.classList.add('show');
      document.getElementById('lpassword').value = '';
      setTimeout(() => loginErr.classList.remove('show'), 4000);
    }
  } catch (err) {
    loginErr.textContent = 'Cannot reach server. Is it running?';
    loginErr.classList.add('show');
  } finally {
    loginBtn.textContent = 'Sign In';
    loginBtn.disabled    = false;
  }
});

/* ── Logout ── */
logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  adminPage.classList.remove('active');
  loginPage.style.display = '';
});

/* ── Toggle views ── */
function showAdminPanel() {
  loginPage.style.display = 'none';
  adminPage.classList.add('active');
}

/* ── Navigation ── */
const sectionIds = ['dashboard', 'upload', 'manage'];
const navBtns    = document.querySelectorAll('[data-section]');

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function showSection(id) {
  sectionIds.forEach(s => {
    document.getElementById('section' + cap(s)).classList.toggle('active', s === id);
  });
  navBtns.forEach(b => b.classList.toggle('active', b.dataset.section === id));
  if (id === 'manage')    buildManageGrid();
  if (id === 'dashboard') updateDashStats();
}

navBtns.forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
window.showSection = showSection;

/* ── Dashboard stats ── */
async function updateDashStats() {
  try {
    const res  = await fetch('/api/images');
    const imgs = await res.json();
    const uploaded = imgs.filter(i => !i.isDefault).length;
    document.getElementById('statTotal').textContent    = imgs.length;
    document.getElementById('statUploaded').textContent = uploaded;
  } catch (e) {
    showToast('Cannot reach server.', 'error');
  }
}

/* ── Upload ── */
const uploadZone    = document.getElementById('uploadZone');
const fileInput     = document.getElementById('fileInput');
const uploadPreview = document.getElementById('uploadPreview');
const previewThumb  = document.getElementById('previewThumb');
const previewName   = document.getElementById('previewName');
const captionInput  = document.getElementById('captionInput');
const uploadBtn     = document.getElementById('uploadBtn');
const uploadInfo    = document.getElementById('uploadInfo');

let pendingFile = null;

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file.', 'error');
    return;
  }
  pendingFile       = file;
  previewThumb.src  = URL.createObjectURL(file);
  previewName.textContent = `${file.name}  —  ${(file.size / 1024).toFixed(1)} KB`;
  uploadPreview.classList.add('show');
  captionInput.placeholder = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  uploadInfo.textContent   = 'Ready to upload. Add a caption and click "Upload Photo".';
}

uploadBtn.addEventListener('click', async () => {
  if (!pendingFile) { showToast('Please select a file first.', 'error'); return; }

  const caption = captionInput.value.trim() ||
    pendingFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');

  uploadBtn.textContent = 'Uploading…';
  uploadBtn.disabled    = true;

  try {
    const form = new FormData();
    form.append('image',   pendingFile);
    form.append('caption', caption);

    const res = await fetch('/api/images', {
      method:      'POST',
      credentials: 'same-origin',
      body:        form,
    });

    if (res.status === 401) {
      showToast('Session expired. Please log in again.', 'error');
      logoutBtn.click();
      return;
    }
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);

    showToast('✓ Photo uploaded! Now visible to everyone.', 'success');

    // Reset form
    pendingFile = null;
    fileInput.value = '';
    previewThumb.src = '';
    uploadPreview.classList.remove('show');
    captionInput.value     = '';
    uploadInfo.textContent = 'Select a file above to continue.';
    updateDashStats();
  } catch (err) {
    showToast('Upload failed: ' + err.message, 'error');
  } finally {
    uploadBtn.textContent = 'Upload Photo';
    uploadBtn.disabled    = false;
  }
});

/* ── Manage grid ── */
async function buildManageGrid() {
  const grid = document.getElementById('adminGrid');
  grid.innerHTML = '<p style="color:var(--c-muted);grid-column:1/-1;padding:30px 0;text-align:center;">Loading…</p>';

  let imgs;
  try {
    const res = await fetch('/api/images');
    imgs = await res.json();
  } catch (e) {
    grid.innerHTML = '<p style="color:var(--c-danger);grid-column:1/-1;padding:30px 0;text-align:center;">Cannot reach server.</p>';
    return;
  }

  grid.innerHTML = '';
  if (!imgs.length) {
    grid.innerHTML = '<p style="color:var(--c-muted);grid-column:1/-1;text-align:center;padding:40px 0;">No images yet. Upload some photos!</p>';
    return;
  }

  imgs.forEach(img => {
    const card = document.createElement('div');
    card.className = 'admin-img-card';
    card.dataset.id = img.id;
    card.innerHTML = `
      <div class="admin-img-wrap">
        <img src="${img.src}" alt="${img.caption}" loading="lazy" />
        <span class="admin-img-badge">${img.isDefault ? 'Default' : 'Uploaded'}</span>
      </div>
      <div class="admin-img-body">
        <p class="admin-img-name" title="${img.caption}">${img.caption}</p>
        <div class="admin-img-actions">
          <button class="btn-del" data-id="${img.id}">🗑 Delete</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.btn-del').forEach(btn =>
    btn.addEventListener('click', () => deleteImage(btn.dataset.id))
  );
}

async function deleteImage(id) {
  const card    = document.querySelector(`.admin-img-card[data-id="${id}"]`);
  const caption = card?.querySelector('.admin-img-name')?.textContent || 'this image';
  if (!confirm(`Delete "${caption}"?`)) return;

  try {
    const res = await fetch(`/api/images/${id}`, {
      method:      'DELETE',
      credentials: 'same-origin',
    });
    if (res.status === 401) { showToast('Session expired. Please log in again.', 'error'); logoutBtn.click(); return; }
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);

    if (card) {
      card.style.transition = 'opacity 0.3s, transform 0.3s';
      card.style.opacity    = '0';
      card.style.transform  = 'scale(0.9)';
      setTimeout(() => card.remove(), 320);
    }
    showToast('Image deleted.', 'success');
    updateDashStats();
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  }
}

/* ── Reset to defaults ── */
window.resetToDefaults = async function () {
  if (!confirm('Remove all uploaded images and restore the original 7 photos?')) return;
  try {
    const res = await fetch('/api/images/reset', {
      method:      'DELETE',
      credentials: 'same-origin',
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    showToast('Gallery reset to defaults.', 'success');
    buildManageGrid();
    updateDashStats();
  } catch (err) {
    showToast('Reset failed: ' + err.message, 'error');
  }
};

/* ── Init ── */
async function refreshAll() {
  await updateDashStats();
}

checkSession();
