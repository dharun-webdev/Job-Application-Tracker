// ===== Simple, readable JS =====
const THEME_KEY = 'jt.theme';
const session = () => (window.Auth && Auth.currentUser && Auth.currentUser()) || null;
const storeKey = () => (session() ? `jt.apps:${session().email}` : 'jt.apps:guest');

const $ = (s, r = document) => r.querySelector(s);

const state = {
    apps: [],
    view: { search: '', status: 'all', priority: 'all', sort: 'createdDesc', mode: 'list' }
};

const storage = {
    load() { try { return JSON.parse(localStorage.getItem(storeKey())) || []; } catch { return []; } },
    save(data) { localStorage.setItem(storeKey(), JSON.stringify(data)); }
};

const uid = () => Math.random().toString(36).slice(2, 9);
const fmtDate = iso => iso ? new Date(iso + 'T00:00:00').toLocaleDateString() : '—';
const esc = s => String(s || '').replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));

function seed() {
    if (state.apps.length) return; const now = Date.now(); state.apps = [
        { id: uid(), role: 'Frontend Intern', company: 'Acme Labs', location: 'Remote', status: 'applied', priority: 'high', tags: ['React', 'HTML', 'CSS'], notes: 'Referred by John', dateApplied: '2025-11-01', createdAt: now - 86400000 * 8 },
        { id: uid(), role: 'Junior Web Developer', company: 'ByteWorks', location: 'Chennai', status: 'interview', priority: 'medium', tags: ['VanillaJS', 'Fresher'], notes: 'Tech round on Friday', dateApplied: '2025-11-05', createdAt: now - 86400000 * 4 }
    ]; storage.save(state.apps);
}

function stats(items) { $('#statTotal').textContent = items.length; $('#statInterview').textContent = items.filter(a => a.status === 'interview').length; $('#statOffer').textContent = items.filter(a => a.status === 'offer').length; $('#statRejected').textContent = items.filter(a => a.status === 'rejected').length; }

function filtered() {
    const v = state.view; let items = [...state.apps];
    items = items.filter(a => (v.status === 'all' || a.status === v.status) && (v.priority === 'all' || a.priority === v.priority));
    if (v.search.trim()) { const q = v.search.toLowerCase(); items = items.filter(a => a.role.toLowerCase().includes(q) || a.company.toLowerCase().includes(q) || (a.tags || []).some(t => t.toLowerCase().includes(q))); }
    const cmp = { createdDesc: (a, b) => b.createdAt - a.createdAt, createdAsc: (a, b) => a.createdAt - b.createdAt, status: (a, b) => a.status.localeCompare(b.status), priority: (a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - ({ high: 0, medium: 1, low: 2 }[b.priority])), company: (a, b) => a.company.localeCompare(b.company) }[v.sort];
    return items.sort(cmp);
}

function renderList(items) { const list = $('#list'); list.innerHTML = ''; const tpl = $('#cardTpl'); items.forEach(a => { const node = tpl.content.cloneNode(true); const dot = { applied: '<span class="dot dot-applied"></span>', interview: '<span class="dot dot-interview"></span>', offer: '<span class="dot dot-offer"></span>', rejected: '<span class="dot dot-rejected"></span>' }[a.status]; node.querySelector('.card-title').innerHTML = `${dot}${esc(a.role)} · <span style="color:var(--muted)">${esc(a.company)}</span>`; node.querySelector('.meta').innerHTML = `📍 ${esc(a.location || '—')} · 🗓️ ${fmtDate(a.dateApplied)} · ⚑ ${a.priority.toUpperCase()}`; const tWrap = node.querySelector('.tags'); (a.tags || []).forEach(t => { const s = document.createElement('span'); s.className = 'chip'; s.textContent = t; tWrap.appendChild(s); }); node.querySelector('.notes').textContent = a.notes || ''; const art = node.querySelector('article'); art.dataset.id = a.id; list.appendChild(node); }); }

function renderBoard(items) { const board = $('#board'); board.innerHTML = ''; const cols = [{ key: 'applied', title: 'Applied' }, { key: 'interview', title: 'Interviewing' }, { key: 'offer', title: 'Offer' }, { key: 'rejected', title: 'Rejected' }]; const grid = document.createElement('div'); grid.className = 'board-grid'; cols.forEach(c => { const col = document.createElement('div'); col.className = 'board-col'; col.innerHTML = `<div class="board-head">${c.title} <span class="count">${items.filter(a => a.status === c.key).length}</span></div><div class="board-body"></div>`; const body = col.querySelector('.board-body'); items.filter(a => a.status === c.key).forEach(a => { const card = document.createElement('div'); card.className = 'mini-card'; card.innerHTML = `<div class="mini-title">${esc(a.role)}</div><div class="mini-sub">${esc(a.company)} · ${fmtDate(a.dateApplied)}</div>`; body.appendChild(card); }); grid.appendChild(col); }); board.appendChild(grid); }

function render() { const items = filtered(); stats(items); $('#emptyState').hidden = items.length !== 0; if (state.view.mode === 'list') { $('#list').hidden = false; $('#board').hidden = true; renderList(items); } else { $('#list').hidden = true; $('#board').hidden = false; renderBoard(items); } }

function readForm() { const tags = $('#tags').value.split(',').map(s => s.trim()).filter(Boolean); return { id: $('#appId').value || uid(), role: $('#role').value.trim(), company: $('#company').value.trim(), location: $('#location').value.trim(), status: $('#status').value, priority: $('#priority').value, tags, notes: $('#notes').value.trim(), dateApplied: $('#date').value, createdAt: $('#appId').value ? Number(state.apps.find(x => x.id === $('#appId').value)?.createdAt) : Date.now() }; }
function fillForm(a) { $('#appId').value = a?.id || ''; $('#role').value = a?.role || ''; $('#company').value = a?.company || ''; $('#location').value = a?.location || ''; $('#status').value = a?.status || 'applied'; $('#priority').value = a?.priority || 'medium'; $('#tags').value = (a?.tags || []).join(', '); $('#notes').value = a?.notes || ''; $('#date').value = a?.dateApplied || ''; }
function upsert(a) { const i = state.apps.findIndex(x => x.id === a.id); if (i === -1) state.apps.push(a); else state.apps[i] = a; storage.save(state.apps); render(); }
function remove(id) { state.apps = state.apps.filter(a => a.id !== id); storage.save(state.apps); render(); }
function duplicate(id) { const s = state.apps.find(a => a.id === id); if (!s) return; const c = { ...s, id: uid(), createdAt: Date.now(), notes: (s.notes ? s.notes + '\n' : '') + '[Duplicated]' }; state.apps.push(c); storage.save(state.apps); render(); }

function exportCSV() { const headers = ['Role', 'Company', 'Location', 'Status', 'Priority', 'Tags', 'Notes', 'DateApplied']; const lines = [headers.join(',')].concat(state.apps.map(a => [a.role, a.company, a.location, a.status, a.priority, (a.tags || []).join('|'), (a.notes || '').replace(/\n/g, ' '), a.dateApplied].map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(','))); const blob = new Blob([lines.join('\n')], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `job-applications-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url); }

function clearAll() { if (!confirm('This clears all saved applications and the form. Continue?')) return; localStorage.removeItem(storeKey()); state.apps = []; render(); $('#appForm').reset(); $('#appId').value = ''; }

function themeApply() { const saved = localStorage.getItem(THEME_KEY); if (saved === 'light' || saved === 'dark') { document.documentElement.setAttribute('data-theme', saved); } }
function themeToggle() { const cur = document.documentElement.getAttribute('data-theme') || 'dark'; const next = cur === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', next); localStorage.setItem(THEME_KEY, next); }

function initAuthUI() { const user = session(); const badge = $('#userBadge'), login = $('#loginLink'), reg = $('#registerLink'), out = $('#logoutBtn'); if (user) { badge.hidden = false; badge.textContent = user.name || user.email; login.hidden = true; reg.hidden = true; out.hidden = false; out.onclick = () => { Auth.setSession(null); location.href = 'login.html'; }; } else { badge.hidden = true; login.hidden = false; reg.hidden = false; out.hidden = true; } }

function init() {
    themeApply(); initAuthUI(); state.apps = storage.load(); seed(); render();
    $('#appForm').addEventListener('submit', e => { e.preventDefault(); const a = readForm(); if (!a.role || !a.company) { alert('Role and Company are required.'); return; } upsert(a); $('#appForm').reset(); $('#appId').value = ''; });
    $('#resetBtn').onclick = () => { $('#appForm').reset(); $('#appId').value = ''; };
    $('#list').addEventListener('click', e => { const btn = e.target.closest('[data-action]'); if (!btn) return; const id = e.target.closest('article').dataset.id; const act = btn.dataset.action; if (act === 'edit') fillForm(state.apps.find(x => x.id === id)); if (act === 'delete') { if (confirm('Delete this application?')) remove(id); } if (act === 'dup') duplicate(id); });
    $('#exportBtn').onclick = exportCSV; $('#clearBtn').onclick = clearAll; $('#addBtn').onclick = () => { fillForm({ status: 'applied', priority: 'medium' }); $('#role').focus(); };
    $('#filterStatus').onchange = e => { state.view.status = e.target.value; render(); };
    $('#filterPriority').onchange = e => { state.view.priority = e.target.value; render(); };
    $('#sortBy').onchange = e => { state.view.sort = e.target.value; render(); };
    $('#search').oninput = e => { state.view.search = e.target.value; render(); };
    $('#themeToggle').onclick = themeToggle;
    $('#viewToggle').onclick = () => { state.view.mode = state.view.mode === 'list' ? 'board' : 'list'; $('#viewToggle').textContent = state.view.mode === 'list' ? 'Board' : 'List'; render(); };
}

document.addEventListener('DOMContentLoaded', init);
