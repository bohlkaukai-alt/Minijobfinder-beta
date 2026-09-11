// ---------- Dynamisches Minijob-Limit ----------
// Die App versucht zuerst, aktuelle Werte aus offiziellen Quellen zu lesen.
// Falls das wegen CORS/Offline/Netzwerk nicht geht, nutzt sie lokale Fallback-Werte.
// Stand Fallback: 2026 = 603 €, 2027 = 633 €.

window.MINIJOB_LIMIT_STATE = {
    monthlyLimitEuro: null,
    yearlyLimitEuro: null,
    minimumWageEuro: null,
    source: 'Noch nicht geladen',
    loadedAt: null,
    online: false
};

const MINIJOB_LIMIT_REMOTE_SOURCES = [
    {
        name: 'Minijob-Zentrale',
        url: 'https://r.jina.ai/http://www.minijob-zentrale.de/DE/die-minijobs/die-minijobs_node.html'
    },
    {
        name: 'Bundesregierung',
        url: 'https://r.jina.ai/http://www.bundesregierung.de/breg-de/aktuelles/mindestlohn-faq-1688186'
    }
];

function getFallbackMinijobLimitForDate(date = new Date()) {
    const year = date.getFullYear();

    if (year >= 2027) {
        return {
            monthlyLimitEuro: 633,
            yearlyLimitEuro: 633 * 12,
            minimumWageEuro: 14.60,
            source: 'Lokaler Fallback: offizieller Wert ab 2027',
            online: false
        };
    }

    return {
        monthlyLimitEuro: 603,
        yearlyLimitEuro: 7236,
        minimumWageEuro: 13.90,
        source: 'Lokaler Fallback: offizieller Wert 2026',
        online: false
    };
}

function parseMinijobLimitFromText(text) {
    const value = String(text || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\./g, '')
        .replace(',', '.');

    const patterns = [
        /Minijob(?:-| )?(?:Grenze|Verdienstgrenze)[\s\S]{0,120}?(\d{3,4})\s*Euro\s*(?:monatlich|im Monat)/i,
        /(\d{3,4})\s*Euro\s*(?:monatlich|im Monat)[\s\S]{0,120}?Minijob/i,
        /Geringfügigkeitsgrenze[\s\S]{0,120}?(\d{3,4})\s*Euro/i
    ];

    for (const p of patterns) {
        const m = value.match(p);
        if (m) {
            const n = Number(m[1]);
            if (n >= 400 && n <= 1200) return n;
        }
    }

    return null;
}

async function fetchCurrentMinijobLimitOnline() {
    for (const source of MINIJOB_LIMIT_REMOTE_SOURCES) {
        try {
            const resp = await fetch(source.url, { cache: 'no-store' });
            if (!resp.ok) continue;
            const text = await resp.text();
            const limit = parseMinijobLimitFromText(text);
            if (limit) {
                return {
                    monthlyLimitEuro: limit,
                    yearlyLimitEuro: limit * 12,
                    source: source.name + ' online gelesen',
                    online: true
                };
            }
        } catch (e) {
            // Quelle nicht erreichbar, nächste Quelle versuchen.
        }
    }
    return null;
}

async function loadLocalMinijobLimitFallback() {
    try {
        const resp = await fetch('assets/data/minijob-limit-fallback.json', { cache: 'no-store' });
        if (!resp.ok) throw new Error('Fallback-Datei nicht erreichbar');
        const data = await resp.json();
        const today = new Date();
        const current = (data.limits || [])
            .filter(item => new Date(item.from) <= today)
            .sort((a, b) => new Date(b.from) - new Date(a.from))[0];

        if (current) {
            return {
                monthlyLimitEuro: Number(current.monthlyLimitEuro),
                yearlyLimitEuro: Number(current.yearlyLimitEuro || current.monthlyLimitEuro * 12),
                minimumWageEuro: Number(current.minimumWageEuro || 0) || null,
                source: current.sourceLabel || data.source || 'Lokaler Fallback',
                online: false
            };
        }
    } catch (e) {}
    return getFallbackMinijobLimitForDate();
}

async function loadCurrentMinijobLimit() {
    const online = await fetchCurrentMinijobLimitOnline();
    const fallback = online || await loadLocalMinijobLimitFallback();

    window.MINIJOB_LIMIT_STATE = {
        ...window.MINIJOB_LIMIT_STATE,
        ...fallback,
        loadedAt: new Date().toISOString()
    };

    try {
        localStorage.setItem('mf_minijob_limit_state', JSON.stringify(window.MINIJOB_LIMIT_STATE));
    } catch (e) {}

    updateMinijobLimitUi();
    return window.MINIJOB_LIMIT_STATE;
}

function getCurrentMinijobLimitSync() {
    if (window.MINIJOB_LIMIT_STATE?.monthlyLimitEuro) return window.MINIJOB_LIMIT_STATE;

    try {
        const saved = JSON.parse(localStorage.getItem('mf_minijob_limit_state') || 'null');
        if (saved?.monthlyLimitEuro) {
            window.MINIJOB_LIMIT_STATE = saved;
            return saved;
        }
    } catch (e) {}

    const fallback = getFallbackMinijobLimitForDate();
    window.MINIJOB_LIMIT_STATE = { ...window.MINIJOB_LIMIT_STATE, ...fallback, loadedAt: new Date().toISOString() };
    return window.MINIJOB_LIMIT_STATE;
}

function updateMinijobLimitUi() {
    const state = getCurrentMinijobLimitSync();
    document.querySelectorAll('[data-minijob-limit]').forEach(el => {
        el.textContent = `${state.monthlyLimitEuro} €`;
    });
    document.querySelectorAll('[data-minijob-limit-source]').forEach(el => {
        el.textContent = state.source || '';
    });
}

function minijobLimitEscapeHtml(str) {
    if (typeof escapeHtml === 'function') return escapeHtml(str);
    return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function minijobLimitHintMarkup() {
    const state = getCurrentMinijobLimitSync();
    return `<div class="minijob-limit-hint">
        Aktuelles Minijob-Monatslimit: <strong data-minijob-limit>${state.monthlyLimitEuro} €</strong>
        <small data-minijob-limit-source>${minijobLimitEscapeHtml(state.source || '')}</small>
    </div>`;
}

function parsePaymentValueSafe(value) {
    if (typeof parsePaymentValue === 'function') return parsePaymentValue(value);
    const raw = String(value || '').trim().replace(',', '.');
    const match = raw.match(/-?\d+(?:\.\d{1,2})?/);
    if (!match) return NaN;
    return Number(match[0]);
}

// Zahlungsprüfung überschreiben: kein festes 500-€-Limit mehr.
validatePaymentInput = function(value) {
    const amount = parsePaymentValueSafe(value);
    const state = getCurrentMinijobLimitSync();
    const limit = Number(state.monthlyLimitEuro || 603);

    if (!Number.isFinite(amount)) {
        return { ok:false, message:'Bitte eine gültige Bezahlung eingeben, z. B. 15 oder 15,50.' };
    }
    if (amount < 0) return { ok:false, message:'Negative Beträge sind nicht erlaubt.' };
    if (amount === 0) return { ok:false, message:'Die Bezahlung muss größer als 0 sein.' };
    if (amount > limit) {
        return {
            ok:false,
            message:`Der Betrag überschreitet das aktuelle Minijob-Monatslimit von ${limit} €.`
        };
    }

    return { ok:true, amount: amount.toFixed(2).replace('.', ','), limit };
};

// Job-Erstellen-Seite um Limit-Hinweis ergänzen.
if (typeof showCreateJobScreen === 'function' && !showCreateJobScreen.__minijobLimitWrapped) {
    const oldShowCreateJobScreenLimit = showCreateJobScreen;
    showCreateJobScreen = function() {
        const result = oldShowCreateJobScreenLimit.apply(this, arguments);
        setTimeout(() => {
            const pay = document.getElementById('job-payment');
            if (pay && !document.querySelector('.minijob-limit-hint')) {
                pay.insertAdjacentHTML('afterend', minijobLimitHintMarkup());
                pay.setAttribute('inputmode', 'decimal');
                pay.setAttribute('min', '0');
            }
            updateMinijobLimitUi();
            loadCurrentMinijobLimit();
        }, 120);
        return result;
    };
    showCreateJobScreen.__minijobLimitWrapped = true;
}

document.addEventListener('DOMContentLoaded', () => {
    getCurrentMinijobLimitSync();
    loadCurrentMinijobLimit();
});
