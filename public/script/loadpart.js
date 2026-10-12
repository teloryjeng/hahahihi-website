if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
    // Load Header
    fetch('/header.html')
        .then(response => {
            if (!response.ok) throw new Error(`Header not found: ${response.status}`);
            return response.text();
        })
        .then(data => {
            const placeholder = document.getElementById('header-placeholder');
            if (placeholder) {
                placeholder.innerHTML = data;
                updateAuthDisplay();
            }
        })
        .catch(err => console.error('Header error:', err));

    // Load Footer
    fetch('/footer.html')
        .then(response => {
            if (!response.ok) throw new Error(`Footer not found: ${response.status}`);
            return response.text();
        })
        .then(data => {
            const placeholder = document.getElementById('footer-placeholder');
            if (placeholder) placeholder.innerHTML = data;
        })
        .catch(err => console.error('Footer error:', err));
});

function updateAuthDisplay() {
    const userStr = localStorage.getItem('user');
    const dropdownMenu = document.querySelector('.dropdown-menu-end');

    if (userStr && dropdownMenu) {
        const user = JSON.parse(userStr);
        dropdownMenu.innerHTML = `
            <li><a class="dropdown-item fw-bold text-dark" href="/profile.html"><i class="bi bi-person me-2"></i>${user.name}</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
        `;

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user');
                window.location.reload();
            });
        }
    }
}

// ==========================================
// FUNGSI ANIMASI SEARCH MENGGUNAKAN JQUERY
// ==========================================
$(document).ready(function() {
    $(document).on('click', '#searchToggleBtn', function() {
        var $searchInput = $('#searchInput');
        $searchInput.toggleClass('show');

        if ($searchInput.hasClass('show')) {
            $searchInput.focus();
        } else {
            var query = $searchInput.val().trim();
            if (query) {
                window.location.href = '/search.html?q=' + encodeURIComponent(query);
            }
        }
    });

    $(document).on('keypress', '#searchInput', function(e) {
        if (e.which == 13) {
            var query = $(this).val().trim();
            if (query) {
                window.location.href = '/search.html?q=' + encodeURIComponent(query);
            }
        }
    });

    $(document).on('click', '.toggle-password', function() {
        const input = $(this).siblings('input');
        const icon = $(this).find('i');

        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            icon.removeClass('bi-eye').addClass('bi-eye-slash');
        } else {
            input.attr('type', 'password');
            icon.removeClass('bi-eye-slash').addClass('bi-eye');
        }
    });
});

// GLOBAL OVERLAY FUNCTION
function showOverlay(message, isSuccess, redirectUrl = null, isConfirm = false, onConfirm = null) {
    const existing = document.getElementById('global-overlay');
    if (existing) document.body.removeChild(existing);

    const overlay = document.createElement('div');
    overlay.id = 'global-overlay';
    overlay.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.5); display: flex; justify-content: center;
        align-items: center; z-index: 10000; opacity: 0; transition: opacity 0.3s ease;
    `;

    const box = document.createElement('div');
    box.style = `
        background: #fff; padding: 30px; border-radius: 15px; text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 400px; width: 90%;
        transform: scale(0.8); transition: all 0.3s ease;
    `;

    const icon = isConfirm ? 'bi-question-circle text-warning' : (isSuccess ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger');

    box.innerHTML = `
        <div class="mb-3"><i class="bi ${icon}" style="font-size: 3.5rem;"></i></div>
        <h5 class="mb-3">${isConfirm ? 'Confirmation' : (isSuccess ? 'Success' : 'Failed')}</h5>
        <p class="text-muted mb-4">${message}</p>
        <div class="d-flex gap-2 justify-content-center" id="overlay-btns"></div>
    `;

    const btnOk = document.createElement('button');
    btnOk.className = `btn ${isSuccess ? 'btn-dark' : 'btn-outline-dark'} flex-grow-1 py-2`;
    btnOk.textContent = isConfirm ? 'Yes, Continue' : 'OK';

    btnOk.onclick = () => {
        close();
        if (isConfirm && typeof onConfirm === 'function') onConfirm();
        else if (redirectUrl) window.location.href = redirectUrl;
    };

    const btnsContainer = box.querySelector('#overlay-btns');
    btnsContainer.appendChild(btnOk);

    if (isConfirm) {
        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn btn-light border flex-grow-1 py-2';
        btnCancel.textContent = 'Cancel';
        btnCancel.onclick = close;
        btnsContainer.appendChild(btnCancel);
    }

    function close() {
        overlay.style.opacity = '0';
        box.style.transform = 'scale(0.8)';
        setTimeout(() => { if (document.body.contains(overlay)) document.body.removeChild(overlay); }, 300);
    }

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        box.style.transform = 'scale(1)';
    });
}

document.addEventListener('contextmenu', function(e) {
    if (e.target.nodeName === 'IMG') {
        e.preventDefault();
    }
}, false);

function initQuoteReveal() {
    const quoteSec = document.querySelector('.quote-section');
    if (quoteSec) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    quoteSec.classList.add('revealed');
                    observer.unobserve(quoteSec);
                }
            });
        }, { threshold: 0.15 });
        observer.observe(quoteSec);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuoteReveal);
} else {
    initQuoteReveal();
}