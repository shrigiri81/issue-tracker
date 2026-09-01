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

    // Initialize all member pickers on the page
    initMemberPickers();
});

/* ── Team Member Picker Component ──────────────────────────────────────────── */
function setupPickerEvents(picker) {
    const searchInput = picker.querySelector('.member-picker-search input');
    const options = picker.querySelectorAll('.member-option');
    const chipsContainer = picker.querySelector('.selected-members-bar');

    function updateChips() {
        if (!chipsContainer) return;
        chipsContainer.innerHTML = '';
        let selectedCount = 0;

        picker.querySelectorAll('.member-option').forEach(function (opt) {
            const checkbox = opt.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                selectedCount++;
                const name = opt.getAttribute('data-name') || 'User';
                const initial = name.charAt(0).toUpperCase();

                const chip = document.createElement('span');
                chip.className = 'member-chip';
                chip.innerHTML = `
                    <span class="member-avatar" style="width:18px;height:18px;font-size:0.55rem">${initial}</span>
                    <span>${name}</span>
                    <button type="button" class="member-chip-remove" title="Remove ${name}">✕</button>
                `;

                chip.querySelector('.member-chip-remove').addEventListener('click', function (e) {
                    e.stopPropagation();
                    checkbox.checked = false;
                    updateChips();
                });

                chipsContainer.appendChild(chip);
            }
        });

        if (selectedCount === 0) {
            chipsContainer.innerHTML = '<span style="color:var(--text-dim);font-size:0.75rem">No members selected</span>';
        }
    }

    // Search filtering
    if (searchInput) {
        // Remove existing listener to avoid duplication
        searchInput.oninput = function () {
            const query = this.value.toLowerCase().trim();
            picker.querySelectorAll('.member-option').forEach(function (opt) {
                const name = (opt.getAttribute('data-name') || '').toLowerCase();
                const sub = (opt.getAttribute('data-sub') || '').toLowerCase();
                if (name.includes(query) || sub.includes(query)) {
                    opt.style.display = 'flex';
                } else {
                    opt.style.display = 'none';
                }
            });
        };
    }

    // Checkbox toggle listener
    options.forEach(function (opt) {
        const checkbox = opt.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.onchange = updateChips;
        }
    });

    // Initial chip render
    updateChips();
}

async function loadAsyncUsers() {
    const asyncPickers = document.querySelectorAll('.member-picker[data-async-users="true"]');
    if (!asyncPickers.length) return;

    try {
        const response = await fetch('/api/users');
        if (!response.ok) return;
        const users = await response.json();

        asyncPickers.forEach(picker => {
            const list = picker.querySelector('.member-picker-list');
            if (!list) return;
            list.innerHTML = '';
            const currentUsername = picker.getAttribute('data-current-user') || '';

            users.forEach(u => {
                const isCurrent = currentUsername && u.username === currentUsername;
                const opt = document.createElement('label');
                opt.className = 'member-option';
                opt.setAttribute('data-name', u.username);
                opt.setAttribute('data-sub', u.email || u.role || '');
                const initial = u.username ? u.username.charAt(0).toUpperCase() : 'U';

                opt.innerHTML = `
                    <input type="checkbox" name="projectMembers" value="${u.userId}" ${isCurrent ? 'checked' : ''}>
                    <div class="member-avatar">${initial}</div>
                    <div class="member-option-info">
                        <div class="member-option-name">${u.username} ${isCurrent ? '<span class="owner-tag" style="margin-left:4px">You</span>' : ''}</div>
                        <div class="member-option-sub">${u.email || u.role || 'User'}</div>
                    </div>
                `;
                list.appendChild(opt);
            });

            setupPickerEvents(picker);
        });
    } catch (e) {
        console.warn('Could not load users for picker', e);
    }
}

function initMemberPickers() {
    document.querySelectorAll('.member-picker:not([data-async-users="true"])').forEach(function (picker) {
        setupPickerEvents(picker);
    });
    // Users are already injected server-side via Thymeleaf; async fetch not needed.
    // loadAsyncUsers();
}


