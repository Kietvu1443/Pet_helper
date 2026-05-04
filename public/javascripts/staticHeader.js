const userDropdownBtn = document.getElementById('userDropdownBtn');
const userDropdown = document.getElementById('headerUserDropdown') || document.querySelector('.user-dropdown');
const nativeFetch = window.__petHelperNativeFetch || window.fetch.bind(window);

if (!window.__petHelperNativeFetch) {
    window.__petHelperNativeFetch = nativeFetch;
}

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

    const normalizeAuthTab = (tab) => {
        return tab === 'register' ? 'register' : 'login';
    };

    if (!window.__pendingAuthOverlayTab) {
        window.__pendingAuthOverlayTab = 'login';
    }

    const openAuthOverlaySafely = (tab = 'login') => {
        const targetTab = normalizeAuthTab(tab || window.__pendingAuthOverlayTab);
        window.__pendingAuthOverlayTab = targetTab;

        if (window.__authOverlayOpenRequested) {
            if (typeof window.overlayActivateTab === 'function') {
                window.overlayActivateTab(targetTab);
            }
            return;
        }

        const tryOpenOverlay = () => {
            const overlay = document.getElementById('auth-overlay');
            if (
                !overlay
                || typeof window.openOverlay !== 'function'
                || window.openOverlay.__petHelperOverlayStub
            ) {
                return false;
            }

            if (!overlay.classList.contains('active')) {
                window.openOverlay('auth-overlay');
            }
            if (typeof window.overlayActivateTab === 'function') {
                window.overlayActivateTab(targetTab);
            }

            window.__authOverlayOpenRequested = true;
            return true;
        };

        if (!tryOpenOverlay()) {
            window.__pendingAuthOverlayOpen = true;
        }
    };

    const openLoginOverlaySafely = () => {
        openAuthOverlaySafely('login');
    };

    const resetOverlayOpenGuard = () => {
        window.__authOverlayOpenRequested = false;
    };

    const handleOverlayReady = () => {
        if (!window.__pendingAuthOverlayOpen) {
            return;
        }

        window.__pendingAuthOverlayOpen = false;
        openAuthOverlaySafely(window.__pendingAuthOverlayTab || 'login');
    };

    if (!window.__authOverlayReadyListenerAttached) {
        window.__authOverlayReadyListenerAttached = true;
        window.addEventListener('auth-overlay:ready', handleOverlayReady);
        document.addEventListener('auth-overlay:ready', handleOverlayReady);
    }

    if (!window.__petHelperUnauthorizedErrorClass) {
        window.__petHelperUnauthorizedErrorClass = class UnauthorizedApiError extends Error {
            constructor(message) {
                super(message || 'Vui lòng đăng nhập tài khoản');
                this.name = 'UnauthorizedApiError';
                this.code = 401;
            }
        };
    }

    const getRequestPath = (input) => {
        try {
            if (typeof input === 'string') {
                return new URL(input, window.location.origin).pathname;
            }
            if (input && typeof input.url === 'string') {
                return new URL(input.url, window.location.origin).pathname;
            }
        } catch (error) {
            return '';
        }
        return '';
    };

    const shouldHandleUnauthorized = (input, init) => {
        if (init && init.__skipUnauthorizedHandler) {
            return false;
        }

        const requestPath = getRequestPath(input);
        if (!requestPath.startsWith('/api/v1/')) {
            return false;
        }

        if (
            requestPath === '/api/v1/auth/login'
            || requestPath === '/api/v1/auth/register'
            || requestPath === '/api/v1/auth/me'
            || requestPath === '/api/v1/auth/logout'
        ) {
            return false;
        }

        return true;
    };

    const rejectUnauthorized = async (response, fallbackMessage) => {
        let message = fallbackMessage || 'Vui lòng đăng nhập tài khoản';

        try {
            const payload = await response.clone().json();
            if (payload && (payload.message || payload.error)) {
                message = payload.message || payload.error;
            }
        } catch (error) {
            // Keep fallback message when payload cannot be parsed.
        }

        showGuest();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        openLoginOverlaySafely();

        throw new window.__petHelperUnauthorizedErrorClass(message);
    };

    if (!window.__petHelperUnauthorizedHandler) {
        window.__petHelperUnauthorizedHandler = rejectUnauthorized;
    }

    if (!window.openLoginOverlaySafely) {
        window.openLoginOverlaySafely = openLoginOverlaySafely;
    }

    if (!window.openAuthOverlaySafely) {
        window.openAuthOverlaySafely = openAuthOverlaySafely;
    }

    if (typeof window.openOverlay !== 'function') {
        const openOverlayStub = (id) => {
            if (id === 'auth-overlay') {
                window.__pendingAuthOverlayOpen = true;
            }
        };
        openOverlayStub.__petHelperOverlayStub = true;
        window.openOverlay = openOverlayStub;
    }

    if (typeof window.overlayActivateTab !== 'function') {
        window.overlayActivateTab = (tabName) => {
            window.__pendingAuthOverlayTab = normalizeAuthTab(tabName);
        };
    }

    if (!window.resetLoginOverlayGuard) {
        window.resetLoginOverlayGuard = resetOverlayOpenGuard;
    }

    if (!window.apiFetch) {
        window.apiFetch = async (input, init = {}) => {
            const fetchOptions = {
                credentials: 'include',
                ...init,
            };

            const response = await nativeFetch(input, fetchOptions);
            if (response.status === 401 && shouldHandleUnauthorized(input, fetchOptions)) {
                await rejectUnauthorized(response);
            }

            return response;
        };
    }

    if (!window.__authFetchInterceptorInitialized) {
        window.__authFetchInterceptorInitialized = true;
        window.fetch = async (input, init = {}) => {
            const response = await nativeFetch(input, init);
            if (response.status === 401 && shouldHandleUnauthorized(input, init)) {
                await rejectUnauthorized(response);
            }

            return response;
        };
    }

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

    window.applyHeaderGuestState = showGuest;
    window.applyHeaderUserState = showUser;

    nativeFetch('/api/v1/auth/me', {
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

    if (window.__logoutInFlight) {
        return;
    }
    window.__logoutInFlight = true;

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

    applyLoggedOutUiState();
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    try {
        await nativeFetch('/api/v1/auth/logout', {
            method: 'POST',
            credentials: 'include',
            __skipUnauthorizedHandler: true,
        });
    } catch (apiError) {
        // Always continue logout flow for UI consistency.
    }

    if (window.location.pathname !== '/') {
        window.location.href = '/';
        return;
    }

    window.location.reload();
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
