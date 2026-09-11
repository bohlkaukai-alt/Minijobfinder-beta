// ---------- MiniJob Finder Admin-Bereich ----------
const ADMIN_CONFIG = {
    // Repository, dessen GitHub-Collaborators Admin-Zugriff erhalten sollen.
    repoOwner: "bohlkaukai-alt",
    repoName: "bohlkaukai-alt.github.io",

    // Optionaler Fallback für Entwicklung. Sicherer ist Firestore oder GitHub-Collaborator-Prüfung.
    allowedGithubEmails: [
        "bohlkaukai@gmail.com",
        "kai16boehlkau@gmail.com"
    ]
};

firebase.initializeApp(window.MINIJOB_FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

let adminUser = null;
let adminProfile = null;
let adminJobs = [];
let adminUnsubscribe = null;

function adminEscapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function adminFormatDate(value) {
    if (!value) return '-';
    let d = value.toDate ? value.toDate() : value.seconds ? new Date(value.seconds * 1000) : new Date(value);
    return d && !isNaN(d.getTime()) ? d.toLocaleString('de-DE', { dateStyle:'short', timeStyle:'short' }) : '-';
}
function adminTimestampMs(value) {
    if (!value) return 0;
    if (value.toMillis) return value.toMillis();
    if (value.seconds) return value.seconds * 1000;
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
}
function setAdminVisible(id, visible) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !visible);
}
function showAdminToast(msg) {
    let t = document.querySelector('.toast');
    if (t) t.remove();
    t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}
function adminProviderIsGithub(user) {
    return !!user?.providerData?.some(p => p.providerId === 'github.com');
}
function renderAdminUserBox() {
    const box = document.getElementById('admin-user-box');
    if (!box) return;
    if (!adminUser) { box.innerHTML = ''; return; }
    const gh = adminUser.providerData.find(p => p.providerId === 'github.com');
    box.innerHTML = `<div class="admin-user-chip">
        <span class="material-icons">admin_panel_settings</span>
        <div>
            <strong>${adminEscapeHtml(adminUser.displayName || adminUser.email || 'Admin')}</strong>
            <small>${adminEscapeHtml(gh?.email || adminUser.email || adminUser.uid)}</small>
        </div>
        <button class="icon-circle" onclick="adminLogout()" title="Abmelden"><span class="material-icons">logout</span></button>
    </div>`;
}

async function getGithubAccessToken() {
    let token = sessionStorage.getItem('mf_github_access_token') || '';
    if (token) return token;

    // Ohne Token kann GitHub nicht sicher prüfen, ob jemand Collaborator ist.
    // Deshalb muss man sich im Zweifel erneut per GitHub anmelden.
    return '';
}

async function fetchGithubViewer(token) {
    const resp = await fetch('https://api.github.com/user', {
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': 'Bearer ' + token
        }
    });
    if (!resp.ok) throw new Error('GitHub-Profil konnte nicht gelesen werden.');
    return await resp.json();
}

async function checkGithubRepositoryCollaborator(user) {
    try {
        const token = await getGithubAccessToken();
        if (!token) return { ok: false, reason: 'github-token-missing' };

        const viewer = await fetchGithubViewer(token);
        const username = viewer.login;
        if (!username) return { ok: false, reason: 'github-username-missing' };

        const url = `https://api.github.com/repos/${ADMIN_CONFIG.repoOwner}/${ADMIN_CONFIG.repoName}/collaborators/${encodeURIComponent(username)}/permission`;
        const resp = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': 'Bearer ' + token
            }
        });

        if (!resp.ok) return { ok: false, reason: 'not-collaborator-or-no-permission', username };

        const data = await resp.json();
        const permission = data.permission || '';
        const allowed = ['admin', 'maintain', 'write', 'triage', 'read'].includes(permission);

        return { ok: allowed, username, permission };
    } catch (e) {
        console.warn('GitHub-Collaborator-Prüfung fehlgeschlagen:', e);
        return { ok: false, reason: e.message || 'github-check-failed' };
    }
}

async function isConfiguredAdmin(user) {
    if (!user || !adminProviderIsGithub(user)) return false;

    // 1. Sichere manuelle Freischaltung über Firestore.
    try {
        const doc = await db.collection('admins').doc(user.uid).get();
        if (doc.exists && doc.data()?.enabled === true) {
            adminProfile = doc.data();
            return true;
        }
    } catch (e) {
        console.warn('Admin-Dokument konnte nicht gelesen werden:', e);
    }

    // 2. GitHub-Collaborator-Prüfung für das konfigurierte Repository.
    const collaborator = await checkGithubRepositoryCollaborator(user);
    if (collaborator.ok) {
        adminProfile = {
            enabled: true,
            role: 'github-collaborator',
            github: collaborator.username,
            permission: collaborator.permission
        };
        return true;
    }

    // Wenn kein Token vorhanden ist, kann eine erneute GitHub-Anmeldung helfen.
    if (collaborator.reason === 'github-token-missing') {
        showAdminToast('Bitte erneut mit GitHub anmelden, damit die Collaborator-Berechtigung geprüft werden kann.');
    }

    // 3. Fallback nur für Entwicklung.
    const email = (user.email || '').toLowerCase();
    const gh = user.providerData.find(p => p.providerId === 'github.com');
    const ghEmail = (gh?.email || '').toLowerCase();
    if (ADMIN_CONFIG.allowedGithubEmails.includes(email) || ADMIN_CONFIG.allowedGithubEmails.includes(ghEmail)) {
        adminProfile = { enabled:true, role:'frontend-fallback' };
        return true;
    }

    return false;
}
async function adminSignInWithGithub() {
    const provider = new firebase.auth.GithubAuthProvider();
    provider.addScope('read:user');
    provider.addScope('user:email');
    try {
        const result = await auth.signInWithPopup(provider);
        const credential = firebase.auth.GithubAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) sessionStorage.setItem('mf_github_access_token', credential.accessToken);
    } catch (err) {
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
            await auth.signInWithRedirect(provider);
            return;
        }
        showAdminToast('GitHub-Login fehlgeschlagen: ' + (err.message || err));
    }
}
async function adminLogout() {
    if (adminUnsubscribe) adminUnsubscribe();
    adminUnsubscribe = null;
    await auth.signOut();
    adminUser = null;
    adminProfile = null;
    adminJobs = [];
    setAdminVisible('admin-login-card', true);
    setAdminVisible('admin-denied-card', false);
    setAdminVisible('admin-dashboard', false);
    renderAdminUserBox();
}
auth.getRedirectResult().then(result => {
    const credential = result ? firebase.auth.GithubAuthProvider.credentialFromResult(result) : null;
    if (credential?.accessToken) sessionStorage.setItem('mf_github_access_token', credential.accessToken);
}).catch(() => {});
auth.onAuthStateChanged(async user => {
    adminUser = user;
    renderAdminUserBox();

    if (!user) {
        setAdminVisible('admin-login-card', true);
        setAdminVisible('admin-denied-card', false);
        setAdminVisible('admin-dashboard', false);
        return;
    }

    setAdminVisible('admin-login-card', false);

    const ok = await isConfiguredAdmin(user);
    if (!ok) {
        setAdminVisible('admin-denied-card', true);
        setAdminVisible('admin-dashboard', false);
        return;
    }

    setAdminVisible('admin-denied-card', false);
    setAdminVisible('admin-dashboard', true);
    loadAdminJobs();
});

function getAdminJobStatus(job) {
    if (job.deleted === true || job.status === 'deleted' || job.status === 'deleted_by_admin') return 'deleted';
    return job.status || 'offen';
}
function updateAdminStats(list) {
    document.getElementById('admin-stat-total').textContent = String(list.length);
    document.getElementById('admin-stat-open').textContent = String(list.filter(j => getAdminJobStatus(j.data) === 'offen').length);
    document.getElementById('admin-stat-deleted').textContent = String(list.filter(j => getAdminJobStatus(j.data) === 'deleted').length);
}
function loadAdminJobs() {
    const box = document.getElementById('admin-job-list');
    if (box) box.innerHTML = '<div class="spinner"></div>';
    if (adminUnsubscribe) adminUnsubscribe();

    adminUnsubscribe = db.collection('jobs').onSnapshot(snap => {
        adminJobs = snap.docs.map(doc => ({ id: doc.id, data: doc.data() }));
        renderAdminJobs();
    }, err => {
        if (box) box.innerHTML = `<div class="empty-state">Jobs konnten nicht geladen werden: ${adminEscapeHtml(err.message)}</div>`;
    });
}
function renderAdminJobs() {
    const box = document.getElementById('admin-job-list');
    if (!box) return;

    const q = (document.getElementById('admin-search')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('admin-status-filter')?.value || 'all';
    const sort = document.getElementById('admin-sort')?.value || 'newest';

    let list = adminJobs.slice();

    if (q) {
        list = list.filter(item => {
            const j = item.data;
            return [j.title, j.location, j.description, j.creatorName, j.createdBy, j.category, j.payment]
                .some(v => String(v || '').toLowerCase().includes(q));
        });
    }

    if (statusFilter !== 'all') {
        list = list.filter(item => getAdminJobStatus(item.data) === statusFilter);
    }

    list.sort((a, b) => {
        if (sort === 'oldest') return adminTimestampMs(a.data.createdAt) - adminTimestampMs(b.data.createdAt);
        if (sort === 'title') return String(a.data.title || '').localeCompare(String(b.data.title || ''), 'de');
        return adminTimestampMs(b.data.createdAt) - adminTimestampMs(a.data.createdAt);
    });

    updateAdminStats(adminJobs);

    if (!list.length) {
        box.innerHTML = '<div class="empty-state">Keine passenden Jobs gefunden.</div>';
        return;
    }
    box.innerHTML = list.map(item => renderAdminJobCard(item.id, item.data)).join('');
}
function renderAdminJobCard(id, job) {
    const status = getAdminJobStatus(job);
    const deletedInfo = status === 'deleted'
        ? `<div class="admin-delete-info"><strong>Gelöscht:</strong> ${adminEscapeHtml(job.deleteReason || 'Kein Grund gespeichert')}<br><span>${adminEscapeHtml(job.deletedByEmail || '')} · ${adminFormatDate(job.deletedAt)}</span></div>`
        : '';

    return `<article class="card admin-job-card ${status === 'deleted' ? 'is-deleted' : ''}">
        <div class="admin-job-head">
            <div>
                <h3>${adminEscapeHtml(job.title || 'Ohne Titel')}</h3>
                <p class="small-muted">${adminEscapeHtml(job.category || 'Ohne Kategorie')} · ${adminEscapeHtml(job.location || 'Ohne Ort')}</p>
            </div>
            <span class="admin-status-pill admin-status-${adminEscapeHtml(status)}">${adminEscapeHtml(status)}</span>
        </div>
        <p>${adminEscapeHtml(job.description || '').slice(0, 260)}${String(job.description || '').length > 260 ? '…' : ''}</p>
        <div class="admin-job-meta">
            <span>Ersteller: ${adminEscapeHtml(job.creatorName || job.createdBy || 'Unbekannt')}</span>
            <span>Bezahlung: ${adminEscapeHtml(job.payment || '-')}</span>
            <span>Erstellt: ${adminFormatDate(job.createdAt)}</span>
            <span>ID: ${adminEscapeHtml(id)}</span>
        </div>
        ${deletedInfo}
        <div class="admin-job-actions">
            <button class="btn btn-outline" onclick="adminOpenJob('${adminEscapeHtml(id)}')">Details</button>
            ${status !== 'deleted'
                ? `<button class="btn btn-danger" onclick="adminDeleteJobWithReason('${adminEscapeHtml(id)}')">Mit Grund löschen</button>`
                : `<button class="btn btn-accent" onclick="adminRestoreJob('${adminEscapeHtml(id)}')">Wiederherstellen</button>`}
        </div>
    </article>`;
}
function adminOpenJob(jobId) {
    const item = adminJobs.find(j => j.id === jobId);
    if (!item) return;
    const j = item.data;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal-content admin-detail-modal">
        <h2>${adminEscapeHtml(j.title || 'Job')}</h2>
        <p class="small-muted">${adminEscapeHtml(j.category || '')} · ${adminEscapeHtml(j.location || '')}</p>
        <p>${adminEscapeHtml(j.description || '')}</p>
        <div class="admin-detail-grid">
            <div><strong>Status</strong><span>${adminEscapeHtml(getAdminJobStatus(j))}</span></div>
            <div><strong>Ersteller</strong><span>${adminEscapeHtml(j.creatorName || j.createdBy || '-')}</span></div>
            <div><strong>User-ID</strong><span>${adminEscapeHtml(j.createdBy || '-')}</span></div>
            <div><strong>Bezahlung</strong><span>${adminEscapeHtml(j.payment || '-')}</span></div>
            <div><strong>Koordinaten</strong><span>${adminEscapeHtml(j.lat || '-')} / ${adminEscapeHtml(j.lng || '-')}</span></div>
            <div><strong>Erstellt</strong><span>${adminFormatDate(j.createdAt)}</span></div>
        </div>
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Schließen</button>
    </div>`;
    document.body.appendChild(modal);
}
async function adminDeleteJobWithReason(jobId) {
    const item = adminJobs.find(j => j.id === jobId);
    if (!item) return;
    const reason = prompt('Warum soll dieser Job gelöscht werden? Der Grund wird protokolliert.');
    if (!reason || reason.trim().length < 5) {
        showAdminToast('Bitte einen nachvollziehbaren Löschgrund eingeben.');
        return;
    }
    if (!confirm('Job wirklich löschen/ausblenden und Grund speichern?')) return;

    try {
        const now = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('jobs').doc(jobId).set({
            status: 'deleted_by_admin',
            deleted: true,
            visible: false,
            deleteReason: reason.trim(),
            deletedAt: now,
            deletedBy: adminUser.uid,
            deletedByEmail: adminUser.email || ''
        }, { merge: true });

        await db.collection('admin_logs').add({
            action: 'delete_job',
            jobId,
            jobTitle: item.data.title || '',
            reason: reason.trim(),
            adminUid: adminUser.uid,
            adminEmail: adminUser.email || '',
            adminName: adminUser.displayName || '',
            createdAt: now
        });

        showAdminToast('Job wurde mit Grund gelöscht.');
    } catch (err) {
        showAdminToast('Job konnte nicht gelöscht werden: ' + (err.message || err));
    }
}
async function adminRestoreJob(jobId) {
    const reason = prompt('Warum soll dieser Job wiederhergestellt werden?');
    if (!reason || reason.trim().length < 5) {
        showAdminToast('Bitte einen Grund eingeben.');
        return;
    }
    try {
        const now = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('jobs').doc(jobId).set({
            status: 'offen',
            deleted: false,
            visible: true,
            restoredAt: now,
            restoredBy: adminUser.uid,
            restoredByEmail: adminUser.email || ''
        }, { merge: true });

        await db.collection('admin_logs').add({
            action: 'restore_job',
            jobId,
            reason: reason.trim(),
            adminUid: adminUser.uid,
            adminEmail: adminUser.email || '',
            adminName: adminUser.displayName || '',
            createdAt: now
        });

        showAdminToast('Job wurde wiederhergestellt.');
    } catch (err) {
        showAdminToast('Job konnte nicht wiederhergestellt werden: ' + (err.message || err));
    }
}


// ---------- Admin: E-Mail Ban per Hash ----------
function adminNormalizeEmailForBan(email) {
    const raw = String(email || '').trim().toLowerCase();
    const parts = raw.split('@');
    if (parts.length !== 2) return raw;
    let local = parts[0];
    const domain = parts[1];
    if (local.includes('+')) local = local.split('+')[0];
    if (domain === 'gmail.com' || domain === 'googlemail.com') local = local.replace(/\./g, '');
    return `${local}@${domain}`;
}
async function adminSha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function adminOpenBanEmailModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal-content admin-detail-modal">
        <h2>E-Mail sperren</h2>
        <p class="small-muted">Die E-Mail wird normalisiert und als SHA-256-Hash gespeichert. Plus-Aliase wie name+abc@domain.de werden auf name@domain.de zurückgeführt.</p>
        <input id="ban-email-input" class="form-input" type="email" placeholder="E-Mail-Adresse">
        <textarea id="ban-email-reason" class="form-textarea" placeholder="Grund der Sperre"></textarea>
        <button class="btn btn-danger" onclick="adminBanEmail()">E-Mail sperren</button>
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Abbrechen</button>
    </div>`;
    document.body.appendChild(modal);
}
async function adminBanEmail() {
    const email = document.getElementById('ban-email-input')?.value || '';
    const reason = document.getElementById('ban-email-reason')?.value.trim() || '';
    if (!email.includes('@') || reason.length < 5) {
        showAdminToast('Bitte E-Mail und nachvollziehbaren Grund eingeben.');
        return;
    }
    try {
        const canonical = adminNormalizeEmailForBan(email);
        const hash = await adminSha256Hex(canonical);
        const now = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('banned_emails').doc(hash).set({
            active: true,
            emailCanonicalHash: hash,
            reason,
            createdAt: now,
            createdBy: adminUser.uid,
            createdByEmail: adminUser.email || ''
        }, { merge: true });
        await db.collection('admin_logs').add({
            action: 'ban_email',
            emailCanonicalHash: hash,
            reason,
            adminUid: adminUser.uid,
            adminEmail: adminUser.email || '',
            createdAt: now
        });
        document.querySelector('.modal-overlay')?.remove();
        showAdminToast('E-Mail wurde gesperrt.');
    } catch (e) {
        showAdminToast('Sperre konnte nicht gespeichert werden: ' + (e.message || e));
    }
}
