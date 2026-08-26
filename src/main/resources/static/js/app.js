/* ── Panel toggle ──────────────────────────────────────────────────────────── */
function togglePanel(id) {
    const body = document.getElementById(id);
    const btn  = document.querySelector('[data-panel="' + id + '"]');
    if (!body) return;
    const isOpen = body.classList.toggle('open');
    if (btn) {
        const arrow = btn.querySelector('.panel-arrow');
        if (arrow) arrow.classList.toggle('rotated', isOpen);
    }
}

/* Close panel on Escape */
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.panel-body.open').forEach(function (el) {
            el.classList.remove('open');
        });
        document.querySelectorAll('.panel-arrow.rotated').forEach(function (el) {
            el.classList.remove('rotated');
        });
    }
});

/* ── Auto-dismiss flash alerts ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
    const alerts = document.querySelectorAll('.alert[data-auto-dismiss]');
    alerts.forEach(function (alert) {
        setTimeout(function () {
            alert.style.transition = 'opacity 0.4s ease';
            alert.style.opacity = '0';
            setTimeout(function () { alert.remove(); }, 400);
        }, 4000);
    });
});
