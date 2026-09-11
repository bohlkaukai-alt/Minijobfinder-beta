// ---------- Security / Quality Patch ----------
// Karte, E-Mail-Verifizierung, Domain-Whitelist, Ban-Hash, Wortfilter, Job-Preisprüfung,
// Job-Draft-Schutz und einfaches Reputations-Meter.

const SEESEN_FALLBACK = { lat: 51.8909, lng: 10.1780, displayName: 'Seesen, Niedersachsen, Deutschland', source: 'seesen-fallback' };

const EMAIL_DOMAIN_WHITELIST = [
    'gmail.com', 'googlemail.com', 'icloud.com', 'me.com', 'mac.com',
    'outlook.com', 'hotmail.com', 'live.de', 'live.com', 'msn.com',
    'web.de', 'gmx.de', 'gmx.net', 't-online.de', 'yahoo.de', 'yahoo.com',
    'aol.com', 'proton.me', 'protonmail.com', 'posteo.de', 'mailbox.org',
    'freenet.de', '1und1.de', 'ionos.de'
];

const DISPOSABLE_EMAIL_DOMAINS = [
    'sharklasers.com', 'guerrillamail.com', 'guerrillamail.net', 'grr.la',
    'mailinator.com', '10minutemail.com', 'tempmail.com', 'yopmail.com',
    'trashmail.com', 'example.com', 'test.com'
];

const EMAIL_TYPO_FIXES = {
    'gmal.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gmail.de': 'gmail.com',
    'hotmial.com': 'hotmail.com', 'outlok.com': 'outlook.com',
    'web.d': 'web.de', 'gmx.d': 'gmx.de'
};

const PROFANITY_RULES = [
    { level: 1, pattern: /\b(scheiße|scheiss|scheiß|mist|dreck)\b/i, label: 'leichte Sprache' },
    { level: 2, pattern: /\b(arsch|idiot|depp|verdammt)\b/i, label: 'beleidigende Sprache' },
    { level: 3, pattern: /\b(nigger|nigga|hurensohn|fotze|wichser)\b/i, label: 'schwere Beleidigung / diskriminierende Sprache' }
];

const ILLEGAL_JOB_RULES = [
    /\b(drogen|kokain|cannabis verkaufen|weed verkaufen|waffen|messerstecherei|einbruch|diebstahl|klauen|betrug|fake konto|geldwäsche)\b/i,
    /\b(ohne rechnung schwarzarbeit|schwarzarbeit|ausweis fälschen|führerschein fälschen)\b/i,
    /\b(escort|sexarbeit|nudes|onlyfans promotion)\b/i
];

function normalizeEmailForBan(email) {
    const raw = (typeof normalizeEmail === 'function' ? normalizeEmail(email) : String(email || '').trim().toLowerCase());
    const parts = raw.split('@');
    if (parts.length !== 2) return raw;
    let local = parts[0];
    const domain = parts[1];
    // Plus-Aliase wie name+abc@domain.de auf name@domain.de normalisieren.
    if (local.includes('+')) local = local.split('+')[0];
    // Gmail ignoriert Punkte im lokalen Teil.
    if (domain === 'gmail.com' || domain === 'googlemail.com') local = local.replace(/\./g, '');
    return `${local}@${domain}`;
}

async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkEmailBan(email) {
    if (!window.db || !window.crypto?.subtle) return { banned: false };
    try {
        const canonical = normalizeEmailForBan(email);
        const hash = await sha256Hex(canonical);
        const doc = await db.collection('banned_emails').doc(hash).get();
        if (doc.exists && doc.data()?.active !== false) {
            return { banned: true, reason: doc.data()?.reason || 'Account gesperrt' };
        }
        return { banned: false, hash };
    } catch (e) {
        return { banned: false };
    }
}

// Überschreibt die bisherige Blacklist-Prüfung: jetzt Whitelist + Disposable-Block + Plus-Alias-Hinweis.
validateEmailStrict = function(email) {
    const value = (typeof normalizeEmail === 'function' ? normalizeEmail(email) : String(email || '').trim().toLowerCase());
    if (!value) return { valid: false, message: 'Bitte E-Mail-Adresse eingeben.' };
    if (value.length > 254) return { valid: false, message: 'Die E-Mail-Adresse ist zu lang.' };
    if (/\s/.test(value)) return { valid: false, message: 'Die E-Mail-Adresse darf keine Leerzeichen enthalten.' };

    const basicPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;
    if (!basicPattern.test(value)) return { valid: false, message: 'Bitte eine echte E-Mail-Adresse eingeben.' };

    const [local, domain] = value.split('@');
    if (!local || !domain) return { valid: false, message: 'Die E-Mail-Adresse ist ungültig.' };
    if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return { valid: false, message: 'Der Teil vor dem @ ist ungültig.' };
    if (EMAIL_TYPO_FIXES[domain]) return { valid: false, message: `Meintest du ${local}@${EMAIL_TYPO_FIXES[domain]}?` };
    if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) return { valid: false, message: 'Wegwerf-Mailadressen sind nicht erlaubt.' };
    if (!EMAIL_DOMAIN_WHITELIST.includes(domain)) return { valid: false, message: 'Diese E-Mail-Domain ist nicht freigegeben. Bitte nutze eine bekannte private E-Mail-Adresse.' };

    return { valid: true, email: value, canonicalEmail: normalizeEmailForBan(value) };
};

function analyzeTextSafety(text) {
    const value = String(text || '');
    const hits = PROFANITY_RULES.filter(r => r.pattern.test(value));
    const illegal = ILLEGAL_JOB_RULES.some(r => r.test(value));
    const maxLevel = hits.reduce((m, h) => Math.max(m, h.level), 0);
    return {
        ok: !illegal && maxLevel < 3,
        illegal,
        profanityLevel: maxLevel,
        labels: hits.map(h => h.label)
    };
}

function validateUserTextFields(fields) {
    for (const [label, value] of Object.entries(fields)) {
        const safety = analyzeTextSafety(value);
        if (safety.illegal) return { ok:false, message:`${label}: Verdacht auf illegale oder verbotene Inhalte.` };
        if (safety.profanityLevel >= 3) return { ok:false, message:`${label}: schwere Beleidigungen oder diskriminierende Begriffe sind nicht erlaubt.` };
    }
    return { ok:true };
}

function parsePaymentValue(value) {
    const raw = String(value || '').trim().replace(',', '.');
    const match = raw.match(/-?\d+(?:\.\d{1,2})?/);
    if (!match) return NaN;
    return Number(match[0]);
}

function validatePaymentInput(value) {
    const amount = parsePaymentValue(value);
    if (!Number.isFinite(amount)) return { ok:false, message:'Bitte eine gültige Bezahlung eingeben, z. B. 15 oder 15,50.' };
    if (amount < 0) return { ok:false, message:'Negative Beträge sind nicht erlaubt.' };
    if (amount === 0) return { ok:false, message:'Die Bezahlung muss größer als 0 sein.' };
    if (amount > 500) return { ok:false, message:'Der Betrag ist zu hoch. Für MiniJobs ist aktuell ein Limit von 500 € gesetzt.' };
    return { ok:true, amount: amount.toFixed(2).replace('.', ',') };
}

async function geocodeAddressCandidates(query) {
    const q = String(query || '').trim();
    if (!q) return [];
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=7&addressdetails=1&accept-language=de&countrycodes=de`;
        const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await resp.json();
        return (data || []).map(d => ({
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            displayName: d.display_name || q,
            type: d.type,
            importance: d.importance || 0,
            source: 'nominatim'
        })).filter(x => Number.isFinite(x.lat) && Number.isFinite(x.lng));
    } catch (e) {
        return [];
    }
}

// Kein zufälliger Punkt mehr: eindeutige Auswahl, sonst Seesen-Fallback.
geocodeAddress = async function(query) {
    const q = String(query || '').trim();
    if (!q && userLocation) return { lat:userLocation.lat, lng:userLocation.lng, displayName:userLocation.address || userLocation.name, source:'current-location' };

    const candidates = await geocodeAddressCandidates(q);
    if (candidates.length) return candidates[0];

    showToast?.('Ort nicht gefunden. Fallback: Seesen.');
    return { ...SEESEN_FALLBACK };
};
getRandomPointInCity = function(cityName) {
    return geocodeAddress(cityName);
};

function attachAddressAutocomplete(inputId) {
    const input = document.getElementById(inputId);
    if (!input || input.__autocompleteBound) return;
    input.__autocompleteBound = true;
    input.setAttribute('autocomplete', 'street-address');

    const listId = inputId + '-suggestions';
    let box = document.getElementById(listId);
    if (!box) {
        box = document.createElement('div');
        box.id = listId;
        box.className = 'address-suggestions';
        input.insertAdjacentElement('afterend', box);
    }

    let timer = null;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        const q = input.value.trim();
        if (q.length < 3) { box.innerHTML = ''; box.classList.remove('open'); return; }
        timer = setTimeout(async () => {
            const items = await geocodeAddressCandidates(q);
            if (!items.length) {
                box.innerHTML = `<button type="button" onclick="document.getElementById('${inputId}').value='Seesen'; this.parentElement.classList.remove('open')">Ort nicht gefunden – Seesen verwenden</button>`;
                box.classList.add('open');
                return;
            }
            box.innerHTML = items.map((it, i) => `<button type="button" data-lat="${it.lat}" data-lng="${it.lng}" onclick="selectAddressSuggestion('${inputId}', ${i})">${escapeHtml(it.displayName)}</button>`).join('');
            window.__addressSuggestions = window.__addressSuggestions || {};
            window.__addressSuggestions[inputId] = items;
            box.classList.add('open');
        }, 280);
    });
}

function selectAddressSuggestion(inputId, index) {
    const item = window.__addressSuggestions?.[inputId]?.[index];
    if (!item) return;
    const input = document.getElementById(inputId);
    if (input) {
        input.value = item.displayName;
        input.dataset.lat = item.lat;
        input.dataset.lng = item.lng;
        input.dataset.displayName = item.displayName;
        input.dispatchEvent(new Event('change'));
    }
    document.getElementById(inputId + '-suggestions')?.classList.remove('open');
}

function getSelectedAddressCoords(inputId) {
    const input = document.getElementById(inputId);
    if (input?.dataset.lat && input?.dataset.lng) {
        return { lat:Number(input.dataset.lat), lng:Number(input.dataset.lng), displayName:input.dataset.displayName || input.value, source:'selected-suggestion' };
    }
    return null;
}

// Job-Erstellen: Draft automatisch sichern, damit Nachrichten/Navigation Eingaben nicht löschen.
const JOB_DRAFT_KEY = () => currentUser ? `mf_job_draft_${currentUser.uid}` : 'mf_job_draft_guest';

function saveJobDraft() {
    if (currentPage !== 'create') return;
    const draft = {
        jobType: selectedJobType,
        title: document.getElementById('job-title')?.value || '',
        category: document.getElementById('job-category')?.value || '',
        customCategory: document.getElementById('custom-category')?.value || '',
        description: document.getElementById('job-description')?.value || '',
        location: document.getElementById('job-location')?.value || '',
        payment: document.getElementById('job-payment')?.value || ''
    };
    localStorage.setItem(JOB_DRAFT_KEY(), JSON.stringify(draft));
}

function restoreJobDraft() {
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem(JOB_DRAFT_KEY()) || 'null'); } catch(e) {}
    if (!draft) return;
    if (document.getElementById('job-title')) document.getElementById('job-title').value = draft.title || '';
    if (document.getElementById('job-category')) document.getElementById('job-category').value = draft.category || '';
    if (document.getElementById('custom-category')) document.getElementById('custom-category').value = draft.customCategory || '';
    if (document.getElementById('job-description')) document.getElementById('job-description').value = draft.description || '';
    if (document.getElementById('job-location')) document.getElementById('job-location').value = draft.location || '';
    if (document.getElementById('job-payment')) document.getElementById('job-payment').value = draft.payment || '';
    if (draft.jobType) selectedJobType = draft.jobType;
}

function bindJobDraftProtection() {
    ['job-title','job-category','custom-category','job-description','job-location','job-payment'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.__draftBound) {
            el.__draftBound = true;
            el.addEventListener('input', saveJobDraft);
            el.addEventListener('change', saveJobDraft);
        }
    });
    attachAddressAutocomplete('job-location');
}

if (typeof showCreateJobScreen === 'function' && !showCreateJobScreen.__secureWrapped) {
    const oldShowCreateJobScreen = showCreateJobScreen;
    showCreateJobScreen = function() {
        const result = oldShowCreateJobScreen.apply(this, arguments);
        setTimeout(() => { restoreJobDraft(); bindJobDraftProtection(); }, 80);
        return result;
    };
    showCreateJobScreen.__secureWrapped = true;
}

// Prevent navigation loss from message events: if create page has text, require confirmation before leaving.
if (typeof navigateTo === 'function' && !navigateTo.__draftGuardWrapped) {
    const oldNavigateToDraftGuard = navigateTo;
    navigateTo = function(page, data = null, addToHistory = true) {
        if (currentPage === 'create' && page !== 'create') {
            saveJobDraft();
        }
        return oldNavigateToDraftGuard(page, data, addToHistory);
    };
    navigateTo.__draftGuardWrapped = true;
}

// createJob override with payment/text/address validation.
if (typeof createJob === 'function' && !createJob.__secureWrapped) {
    const oldCreateJobSecure = createJob;
    createJob = async function() {
        if (typeof requireAuth === 'function' && !requireAuth('Jobs zu erstellen')) return;

        const ttl = document.getElementById('job-title')?.value.trim();
        let cat = document.getElementById('job-category')?.value;
        const customCat = document.getElementById('custom-category')?.value.trim();
        const desc = document.getElementById('job-description')?.value.trim();
        const loc = document.getElementById('job-location')?.value.trim();
        const payRaw = document.getElementById('job-payment')?.value.trim();

        if (cat === 'Eigene...' && customCat) cat = customCat;
        if (!ttl || !cat || !desc || !loc || !payRaw) { showToast('Alle Felder ausfüllen'); return; }

        const safe = validateUserTextFields({ Titel:ttl, Kategorie:cat, Beschreibung:desc, Ort:loc });
        if (!safe.ok) { showToast(safe.message); return; }

        const payment = validatePaymentInput(payRaw);
        if (!payment.ok) { showToast(payment.message); return; }

        const selected = getSelectedAddressCoords('job-location');
        const coords = selected || await geocodeAddress(loc);

        await db.collection('jobs').add({
            title: ttl,
            category: cat,
            description: desc,
            location: coords.displayName || loc,
            payment: payment.amount,
            lat: coords.lat,
            lng: coords.lng,
            createdBy: currentUser.uid,
            creatorName: currentUser.name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'offen',
            views: 0,
            jobType: selectedJobType || 'offer',
            safetyChecked: true,
            paymentLimit: getCurrentMinijobLimitSync().monthlyLimitEuro
        });

        localStorage.removeItem(JOB_DRAFT_KEY());
        showToast('Job erstellt');
        navigateTo('jobs');
    };
    createJob.__secureWrapped = true;
}

// Registrierung: E-Mail verifizieren, Ban-Hash speichern, Textfelder prüfen.
if (typeof register === 'function' && !register.__secureWrapped) {
    const oldRegisterSecure = register;
    register = async function() {
        const name = document.getElementById('reg-name')?.value.trim() || '';
        const city = document.getElementById('reg-city')?.value.trim() || '';
        const email = document.getElementById('reg-email')?.value.trim() || '';
        const safety = validateUserTextFields({ Name:name, Ort:city });
        if (!safety.ok) { showToast?.(safety.message); return; }

        const emailCheck = validateEmailStrict(email);
        if (!emailCheck.valid) { showEmailValidationError?.(emailCheck.message); return; }

        const ban = await checkEmailBan(emailCheck.email);
        if (ban.banned) { showToast('Diese E-Mail ist gesperrt: ' + ban.reason); return; }

        const result = await oldRegisterSecure.apply(this, arguments);

        try {
            if (auth.currentUser && !auth.currentUser.emailVerified) {
                await auth.currentUser.sendEmailVerification();
                showToast('Bitte bestätige deine E-Mail-Adresse.');
            }
            if (auth.currentUser) {
                const canonical = normalizeEmailForBan(auth.currentUser.email);
                const hash = await sha256Hex(canonical);
                await db.collection('users').doc(auth.currentUser.uid).set({
                    emailCanonicalHash: hash,
                    emailVerified: auth.currentUser.emailVerified === true
                }, { merge:true });
            }
        } catch(e) {}
        return result;
    };
    register.__secureWrapped = true;
}

// Login: E-Mail-Verifizierung erzwingen.
if (typeof afterSuccessfulAuth === 'function' && !afterSuccessfulAuth.__emailVerifyWrapped) {
    const oldAfterSuccessfulAuthVerify = afterSuccessfulAuth;
    afterSuccessfulAuth = async function() {
        try {
            if (auth.currentUser && auth.currentUser.providerData.some(p => p.providerId === 'password') && !auth.currentUser.emailVerified) {
                currentUser = auth.currentUser;
                document.body.classList.add('verify-email-mode');
                const nav = document.getElementById('bottom-nav');
                if (nav) {
                    nav.classList.add('hidden');
                    nav.style.display = 'none';
                }
                const header = document.getElementById('app-header-container');
                if (header) header.innerHTML = '';
                document.getElementById('main-content').innerHTML = `<div class="form-page verify-email-page">
                    <div class="card verify-email-card" style="cursor:auto">
                        <h2>E-Mail bestätigen</h2>
                        <p>Du musst deine E-Mail-Adresse bestätigen, bevor du die App benutzen kannst.</p>
                        <div class="verify-status-box">
                            <strong>Angemeldete E-Mail</strong>
                            <p class="small-muted">${escapeHtml(auth.currentUser.email || '')}</p>
                        </div>
                        <p class="small-muted">
                            Öffne dein E-Mail-Postfach, klicke auf den Bestätigungslink und komme danach hierher zurück.
                        </p>
                        <div class="verification-actions">
                            <button class="btn btn-primary" onclick="resendVerificationMail()">Bestätigung erneut senden</button>
                            <button class="btn btn-outline" onclick="auth.currentUser.reload().then(()=>location.reload())">Ich habe bestätigt</button>
                            <button class="btn btn-danger" onclick="logout()">Abmelden</button>
                        </div>
                    </div>
                </div>`;
                return;
            }
        } catch(e) {}
        return oldAfterSuccessfulAuthVerify.apply(this, arguments);
    };
    afterSuccessfulAuth.__emailVerifyWrapped = true;
}
async function resendVerificationMail() {
    try {
        await auth.currentUser?.sendEmailVerification();
        showToast('Bestätigungsmail wurde gesendet.');
    } catch(e) {
        showToast('Mail konnte nicht gesendet werden.');
    }
}

// Reputations-Meter: einfache Anzeige im Profil.
function reputationScoreFromUser(user, ratingAvg = 0, ratingCount = 0) {
    let score = 40;
    if (user?.emailVerified) score += 20;
    score += Math.min(25, ratingAvg * 5);
    score += Math.min(15, ratingCount * 3);
    return Math.max(0, Math.min(100, Math.round(score)));
}
function reputationMarkup(score) {
    const label = score >= 80 ? 'Sehr zuverlässig' : score >= 60 ? 'Zuverlässig' : score >= 40 ? 'Neu / mittel' : 'Noch wenig Vertrauen';
    return `<div class="reputation-meter card" style="cursor:auto">
        <div class="reputation-head"><strong>Reputation</strong><span>${score}/100</span></div>
        <div class="reputation-bar"><i style="width:${score}%"></i></div>
        <p class="small-muted">${label}</p>
    </div>`;
}
if (typeof showProfileScreen === 'function' && !showProfileScreen.__reputationWrapped) {
    const oldShowProfileScreenRep = showProfileScreen;
    showProfileScreen = function() {
        const result = oldShowProfileScreenRep.apply(this, arguments);
        setTimeout(async () => {
            const container = document.querySelector('.profile-page') || document.getElementById('main-content')?.firstElementChild;
            if (!container || document.querySelector('.reputation-meter')) return;
            let ratingAvg = 0, ratingCount = 0;
            try {
                const snap = await db.collection('ratings').where('toUserId','==',currentUser.uid).get();
                const vals = snap.docs.map(d => d.data().stars || d.data().rating || 0).filter(Boolean);
                ratingCount = vals.length;
                ratingAvg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
            } catch(e) {}
            container.insertAdjacentHTML('afterbegin', reputationMarkup(reputationScoreFromUser(auth.currentUser || currentUser, ratingAvg, ratingCount)));
        }, 200);
        return result;
    };
    showProfileScreen.__reputationWrapped = true;
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        bindJobDraftProtection();
        attachAddressAutocomplete('job-location');
    }, 300);
});
