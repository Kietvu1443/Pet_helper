const userDropdownBtn = document.getElementById('userDropdownBtn');
const userDropdown = document.getElementById('headerUserDropdown') || document.querySelector('.user-dropdown');

if (userDropdownBtn && userDropdown) {
    userDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
    });
}

(function () {
    const authUserState = document.getElementById('headerAuthUserState');
    const authGuestState = document.getElementById('headerAuthGuestState');
    const displayNameText = document.getElementById('headerDisplayNameText');
    const dropdownDisplayName = document.getElementById('headerDropdownDisplayName');
    const userRoleText = document.getElementById('headerUserRole');
    const staffOnlyLinks = document.querySelectorAll('.role-staff-only');
    const adminOnlyLinks = document.querySelectorAll('.role-admin-only');

    if (!authUserState || !authGuestState) {
        return;
    }

    const roleLabel = (role) => {
        if (role === 0) return '👑 Admin';
        if (role === 1) return '🛠️ Staff';
        return '👤 User';
    };

    const hideRoleLinks = () => {
        staffOnlyLinks.forEach((link) => {
            link.classList.add('is-auth-hidden');
            link.classList.remove('is-auth-visible');
        });
        adminOnlyLinks.forEach((link) => {
            link.classList.add('is-auth-hidden');
            link.classList.remove('is-auth-visible');
        });
    };

    const showRoleLinksForRole = (role) => {
        hideRoleLinks();
        if (role === 0 || role === 1) {
            staffOnlyLinks.forEach((link) => {
                link.classList.remove('is-auth-hidden');
                link.classList.add('is-auth-visible');
            });
        }
        if (role === 0) {
            adminOnlyLinks.forEach((link) => {
                link.classList.remove('is-auth-hidden');
                link.classList.add('is-auth-visible');
            });
        }
    };

    const showGuest = () => {
        authUserState.classList.add('is-auth-hidden');
        authUserState.classList.remove('is-auth-visible');
        authGuestState.classList.remove('is-auth-hidden');
        authGuestState.classList.add('is-auth-visible');
        hideRoleLinks();
        if (userDropdown) {
            userDropdown.classList.remove('active');
        }
    };

    const showUser = (user) => {
        const safeName = (user && user.display_name) ? user.display_name : 'Tài khoản';
        const safeRoleValue = user && typeof user.role === 'number' ? user.role : 2;
        const safeRole = roleLabel(safeRoleValue);

        if (displayNameText) {
            displayNameText.textContent = safeName;
        }
        if (dropdownDisplayName) {
            dropdownDisplayName.textContent = safeName;
        }
        if (userRoleText) {
            userRoleText.textContent = safeRole;
        }

        authUserState.classList.remove('is-auth-hidden');
        authUserState.classList.add('is-auth-visible');
        authGuestState.classList.add('is-auth-hidden');
        authGuestState.classList.remove('is-auth-visible');
        showRoleLinksForRole(safeRoleValue);
    };

    fetch('/api/v1/auth/me', {
        method: 'GET',
        credentials: 'include',
    })
        .then(async (response) => {
            let payload = null;
            try {
                payload = await response.json();
            } catch (error) {
                payload = null;
            }

            if (response.ok && payload && payload.success && payload.data && payload.data.user) {
                showUser(payload.data.user);
                return;
            }

            if (response.status === 401) {
                showGuest();
            }
        })
        .catch(() => {
            // Keep default guest/auth state on network error.
        });
})();

async function handleLogout(e) {
    e.preventDefault();

    const authUserState = document.getElementById('headerAuthUserState');
    const authGuestState = document.getElementById('headerAuthGuestState');
    const applyLoggedOutUiState = () => {
        if (authUserState) {
            authUserState.classList.add('is-auth-hidden');
            authUserState.classList.remove('is-auth-visible');
        }
        if (authGuestState) {
            authGuestState.classList.remove('is-auth-hidden');
            authGuestState.classList.add('is-auth-visible');
        }
        if (userDropdown) {
            userDropdown.classList.remove('active');
        }
    };

    let logoutSucceeded = false;
    try {
        const response = await fetch('/api/v1/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
        if (response.ok) {
            logoutSucceeded = true;
        }
    } catch (apiError) {
        logoutSucceeded = false;
    }

    if (!logoutSucceeded) {
        alert('Không thể đăng xuất. Vui lòng thử lại.');
        return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    applyLoggedOutUiState();

    if (window.location.pathname !== '/') {
        window.location.href = '/';
    }
}

(function () {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mainNav = document.getElementById('mainNav');
    const overlay = document.getElementById('mobileNavOverlay');
    const closeBtn = document.getElementById('mobileNavClose');

    if (!mainNav || !overlay) {
        return;
    }

    function openMenu() {
        mainNav.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mainNav.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMenu);
    overlay.addEventListener('click', closeMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    document.querySelectorAll('.main-nav .has-dropdown').forEach((link) => {
        link.addEventListener('click', function (e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const dropdown = this.nextElementSibling;
                if (dropdown && dropdown.classList.contains('nav-dropdown')) {
                    dropdown.classList.toggle('mobile-show');
                    document.querySelectorAll('.nav-dropdown.mobile-show').forEach((shown) => {
                        if (shown !== dropdown) {
                            shown.classList.remove('mobile-show');
                        }
                    });
                }
            }
        });
    });
})();

(function () {
    if (window.__headerScrollFxInitialized) return;
    window.__headerScrollFxInitialized = true;

    const headerEl = document.querySelector('header.header');
    if (!headerEl) return;

    const updateScrolledState = () => {
        headerEl.classList.toggle('header-scrolled', window.scrollY > 20);
    };

    window.addEventListener('scroll', updateScrolledState, { passive: true });
    updateScrolledState();
})();
