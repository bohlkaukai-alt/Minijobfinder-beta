// ---------- E-Mail-Bestätigungsmaske endgültig entfernen ----------
(function () {
    function cleanupVerifyMode() {
        try {
            document.body.classList.remove('verify-email-mode');
            document.documentElement.classList.remove('verify-email-mode');

            const main = document.getElementById('main-content');
            if (main && /E-Mail bestätigen|E-Mail-Adresse bestätigen/.test(main.textContent || '')) {
                main.innerHTML = '<div class="spinner"></div>';
                if (typeof navigateTo === 'function') {
                    setTimeout(() => navigateTo('jobs'), 50);
                }
            }

            const nav = document.getElementById('bottom-nav');
            if (nav && nav.style.display === 'none') nav.style.display = '';
        } catch (e) {}
    }

    document.addEventListener('DOMContentLoaded', cleanupVerifyMode);
    setTimeout(cleanupVerifyMode, 400);
    setTimeout(cleanupVerifyMode, 1200);
})();
