const STORAGE_KEY = 'devplan-tasks-v1';

function toggle(btn) { btn.parentElement.classList.toggle('open'); }
function toggleStep(btn) {
  if (typeof btn === 'string') {
    btn = document.getElementById(btn);
    if (!btn) return;
  }
  if (btn.parentElement) btn.parentElement.classList.toggle('open');
}

function checkTask(el) {
  el.classList.toggle('checked');
  updateTracker();
  saveTasks();
}

// ═════════════════════
// Theme toggling
// ═════════════════════
function applyTheme(theme) {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.innerHTML = theme === 'light'
      ? '<svg width="16" height="16"><use href="#ic-sun"/></svg>'
      : '<svg width="16" height="16"><use href="#ic-moon"/></svg>';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(current);
}

function updateTracker() {
  const checks = document.querySelectorAll('.task-check');
  const all = checks.length;
  const done = document.querySelectorAll('.task-check.checked').length;
  const pct = all > 0 ? Math.round((done / all) * 100) : 0;

  const progText = document.getElementById('prog-text');
  if (progText) progText.textContent = `${done} / ${all}`;
  const progFill = document.getElementById('prog-fill');
  if (progFill) progFill.style.width = `${pct}%`;

  // Update sidebar checks
  document.querySelectorAll('.step-card').forEach((card, idx) => {
    const cardChecks = card.querySelectorAll('.task-check').length;
    const cardDone = card.querySelectorAll('.task-check.checked').length;
    const navCheck = document.getElementById(`nc-${idx + 1}`);
    if (navCheck) {
      navCheck.classList.toggle('done', cardChecks > 0 && cardDone === cardChecks);
    }
  });
}

function saveTasks() {
  const states = Array.from(document.querySelectorAll('.task-check')).map(el => el.classList.contains('checked'));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const states = JSON.parse(saved);
    const checks = document.querySelectorAll('.task-check');
    states.forEach((state, idx) => {
      if (checks[idx] && state) checks[idx].classList.add('checked');
    });
  }
}

function filterSidebar() {
  const query = document.getElementById('sidebar-search').value.toLowerCase();
  document.querySelectorAll('.sidebar-section').forEach(section => {
    let hasMatch = false;
    section.querySelectorAll('.nav-item').forEach(item => {
      const text = item.textContent.toLowerCase();
      const match = text.includes(query);
      item.style.display = match ? 'flex' : 'none';
      if (match) hasMatch = true;
    });
    section.style.display = hasMatch ? 'block' : 'none';
  });
}

function toggleSidebarMobile() {
  const layout = document.querySelector('.layout');
  const menuIconSvg = document.getElementById('menu-icon-svg');
  const isOpen = layout.classList.toggle('sb-open');

  if (menuIconSvg) {
    menuIconSvg.innerHTML = isOpen
      ? '<use href="#ic-close"/>'
      : '<use href="#ic-menu"/>';
  }
}

function switchView(view, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  document.querySelectorAll('.topbar-tab').forEach(t => t.classList.toggle('active', t === btn));

  // Close sidebar on mobile when switching views
  document.querySelector('.layout').classList.remove('sb-open');
  const menuIconSvg = document.getElementById('menu-icon-svg');
  if (menuIconSvg) menuIconSvg.innerHTML = '<use href="#ic-menu"/>';
}

function openStep(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Close sidebar on mobile
    document.querySelector('.layout').classList.remove('sb-open');
    const menuIconSvg = document.getElementById('menu-icon-svg');
    if (menuIconSvg) menuIconSvg.innerHTML = '<use href="#ic-menu"/>';

    setTimeout(() => {
      document.querySelectorAll('.step-card').forEach(c => c.classList.remove('open'));
      el.classList.add('open');
    }, 500);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);

  loadTasks();
  updateTracker();

  const first = document.querySelectorAll('.step-card')[0];
  if (first) first.classList.add('open');

  const sections = document.querySelectorAll('.step-card');
  const navItems = document.querySelectorAll('.nav-item');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 100;
    sections.forEach(s => {
      if (scrollPos >= s.offsetTop) current = s.id;
    });
    navItems.forEach(l => {
      const isActive = l.getAttribute('href') === '#' + current;
      l.classList.toggle('active', isActive);
    });
  });
});