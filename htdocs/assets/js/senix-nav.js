/**
 * ==========================================================
 * SENIX v2.0 — Navigation
 * ==========================================================
 */

(function (window) {
    'use strict';
    
    if (!window.Senix) return;
    const S = window.Senix;
    
    let nav = null;
    let lastScrollY = 0;
    let isHidden = false;
    
    // ==========================================================
    // SCROLL EFFECTS
    // ==========================================================
    function initScrollEffects() {
        nav = S.$('.senix-nav');
        if (!nav) return;
        
        const threshold = 60;
        const hideThreshold = 400;
        
        const onScroll = S.rafThrottle(() => {
            const y = window.scrollY;
            
            // Background cuando scroll
            if (y > threshold) {
                nav.classList.add('is-scrolled');
            } else {
                nav.classList.remove('is-scrolled');
            }
            
            // Hide on scroll down, show on scroll up
            if (y > hideThreshold) {
                if (y > lastScrollY && !isHidden) {
                    nav.classList.add('is-hidden');
                    isHidden = true;
                } else if (y < lastScrollY && isHidden) {
                    nav.classList.remove('is-hidden');
                    isHidden = false;
                }
            } else if (isHidden) {
                nav.classList.remove('is-hidden');
                isHidden = false;
            }
            
            lastScrollY = y;
        });
        
        S.on(window, 'scroll', onScroll, { passive: true });
    }
    
    // ==========================================================
    // MOBILE MENU
    // ==========================================================
    function initMobileMenu() {
        const toggle = S.$('.senix-nav-toggle');
        if (!toggle || !nav) return;
        
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            nav.classList.toggle('is-open');
            
            // Lock scroll
            if (nav.classList.contains('is-open')) {
                document.documentElement.classList.add('senix-scroll-locked');
            } else {
                document.documentElement.classList.remove('senix-scroll-locked');
            }
        });
        
        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!nav.classList.contains('is-open')) return;
            if (e.target.closest('.senix-nav')) return;
            nav.classList.remove('is-open');
            document.documentElement.classList.remove('senix-scroll-locked');
        });
        
        // Cerrar al clickear link
        S.$$('.senix-nav-link', nav).forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('is-open');
                document.documentElement.classList.remove('senix-scroll-locked');
            });
        });
        
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('is-open')) {
                nav.classList.remove('is-open');
                document.documentElement.classList.remove('senix-scroll-locked');
            }
        });
    }
    
    // ==========================================================
    // ACTIVE LINK DETECTION
    // ==========================================================
    function initActiveLinks() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop().replace('.php', '') || 'index';
        
        S.$$('.senix-nav-link').forEach(link => {
            const href = link.getAttribute('href') || '';
            const linkPage = href.split('/').pop().replace('.php', '') || 'index';
            
            if (linkPage === currentPage) {
                link.classList.add('is-active');
            }
        });
    }
    
    // ==========================================================
    // USER DROPDOWN
    // ==========================================================
    function initUserDropdown() {
        const userBtn = S.$('.senix-user-toggle');
        const userMenu = S.$('.senix-user-menu');
        
        if (!userBtn || !userMenu) return;
        
        userBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            userMenu.classList.toggle('is-open');
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.senix-user-menu') && !e.target.closest('.senix-user-toggle')) {
                userMenu.classList.remove('is-open');
            }
        });
    }
    
    // ==========================================================
    // NOTIFICATION BADGE
    // ==========================================================
    function initNotificationBadge() {
        const badge = S.$('.senix-notif-badge');
        if (!badge) return;
        
        const count = parseInt(badge.dataset.count) || 0;
        
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    }
    
    // ==========================================================
    // LAUNCH
    // ==========================================================
    function init() {
        initScrollEffects();
        initMobileMenu();
        initActiveLinks();
        initUserDropdown();
        initNotificationBadge();
        
        S.log('Navigation inicializada');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export
    S.nav = { init };
    
})(window);