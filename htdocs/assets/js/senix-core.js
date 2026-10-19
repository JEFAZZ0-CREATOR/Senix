/**
 * ==========================================================
 * SENIX v2.0 — Core JS
 * Estado global, helpers, constantes
 * ==========================================================
 */

(function (window) {
    'use strict';
    
    // ==========================================================
    // CONFIGURACIÓN GLOBAL
    // ==========================================================
    const SENIX = {
        version: '2.0.0',
        name: 'SENIX',
        debug: false,
        
        // Config del sistema
        config: {
            appUrl: window.SENIX_CONFIG?.APP_URL || '',
            userId: window.SENIX_CONFIG?.USER_ID || null,
            csrfToken: window.SENIX_CONFIG?.CSRF_TOKEN || '',
            isLoggedIn: window.SENIX_CONFIG?.IS_LOGGED_IN || false
        },
        
        // Estado interno
        state: {
            loaded: false,
            scrollY: 0,
            scrollDirection: 'down',
            isMobile: false,
            isTouch: false,
            isReducedMotion: false,
            viewport: { w: 0, h: 0 },
            lastScrollY: 0,
            mouse: { x: 0, y: 0, vx: 0, vy: 0 },
            time: 0
        },
        
        // Cache de elementos
        cache: {
            body: null,
            html: null,
            nav: null,
            canvas: null
        },
        
        // Event listeners activos
        listeners: [],
        
        // Timers activos
        timers: {}
    };
    
    // ==========================================================
    // HELPERS
    // ==========================================================
    
    /**
     * Selector simple con caché
     */
    SENIX.$ = function (selector, context) {
        return (context || document).querySelector(selector);
    };
    
    /**
     * Selector múltiple
     */
    SENIX.$$ = function (selector, context) {
        return Array.prototype.slice.call((context || document).querySelectorAll(selector));
    };
    
    /**
     * Selector con caché
     */
    SENIX.cached = function (key, selector) {
        if (!SENIX.cache[key]) {
            SENIX.cache[key] = SENIX.$(selector);
        }
        return SENIX.cache[key];
    };
    
    /**
     * Añadir clases
     */
    SENIX.addClass = function (el, ...classes) {
        if (!el) return;
        classes.forEach(c => el.classList.add(c));
    };
    
    SENIX.removeClass = function (el, ...classes) {
        if (!el) return;
        classes.forEach(c => el.classList.remove(c));
    };
    
    SENIX.toggleClass = function (el, className, force) {
        if (!el) return;
        if (force === undefined) {
            el.classList.toggle(className);
        } else {
            el.classList.toggle(className, force);
        }
    };
    
    SENIX.hasClass = function (el, className) {
        return el && el.classList.contains(className);
    };
    
    /**
     * Throttle - ejecuta máximo una vez cada N ms
     */
    SENIX.throttle = function (fn, wait) {
        let lastTime = 0;
        let timeout = null;
        
        return function (...args) {
            const now = Date.now();
            const remaining = wait - (now - lastTime);
            
            if (remaining <= 0) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                lastTime = now;
                fn.apply(this, args);
            } else if (!timeout) {
                timeout = setTimeout(() => {
                    lastTime = Date.now();
                    timeout = null;
                    fn.apply(this, args);
                }, remaining);
            }
        };
    };
    
    /**
     * Debounce - espera N ms después del último trigger
     */
    SENIX.debounce = function (fn, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), wait);
        };
    };
    
    /**
     * requestAnimationFrame throttle
     */
    SENIX.rafThrottle = function (fn) {
        let ticking = false;
        return function (...args) {
            if (!ticking) {
                requestAnimationFrame(() => {
                    fn.apply(this, args);
                    ticking = false;
                });
                ticking = true;
            }
        };
    };
    
    /**
     * Clamp
     */
    SENIX.clamp = function (value, min, max) {
        return Math.max(min, Math.min(max, value));
    };
    
    /**
     * Lerp (Linear Interpolation)
     */
    SENIX.lerp = function (start, end, amt) {
        return (1 - amt) * start + amt * end;
    };
    
    /**
     * Random entre min y max
     */
    SENIX.random = function (min, max) {
        return Math.random() * (max - min) + min;
    };
    
    /**
     * Random int
     */
    SENIX.randomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    /**
     * Esperar
     */
    SENIX.wait = function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
    
    /**
     * Detecta si prefiere movimiento reducido
     */
    SENIX.prefersReducedMotion = function () {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };
    
    /**
     * Detecta si es táctil
     */
    SENIX.isTouch = function () {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );
    };
    
    /**
     * Detecta móvil
     */
    SENIX.isMobile = function () {
        return window.innerWidth <= 768;
    };
    
    /**
     * Detecta si es dispositivo de gama baja
     */
    SENIX.isLowEnd = function () {
        return (
            navigator.hardwareConcurrency <= 4 ||
            (navigator.deviceMemory && navigator.deviceMemory <= 4)
        );
    };
    
    /**
     * Añade evento con auto-cleanup
     */
    SENIX.on = function (target, event, handler, options) {
        if (!target) return;
        target.addEventListener(event, handler, options);
        SENIX.listeners.push({ target, event, handler, options });
    };
    
    /**
     * Remove all listeners
     */
    SENIX.offAll = function () {
        SENIX.listeners.forEach(({ target, event, handler, options }) => {
            target.removeEventListener(event, handler, options);
        });
        SENIX.listeners = [];
    };
    
    /**
     * Set timeout con ID
     */
    SENIX.setTimer = function (name, fn, delay) {
        if (SENIX.timers[name]) {
            clearTimeout(SENIX.timers[name]);
        }
        SENIX.timers[name] = setTimeout(fn, delay);
    };
    
    SENIX.clearTimer = function (name) {
        if (SENIX.timers[name]) {
            clearTimeout(SENIX.timers[name]);
            delete SENIX.timers[name];
        }
    };
    
    /**
     * Log solo en modo debug
     */
    SENIX.log = function (...args) {
        if (SENIX.debug) {
            console.log('[SENIX]', ...args);
        }
    };
    
    SENIX.warn = function (...args) {
        console.warn('[SENIX]', ...args);
    };
    
    SENIX.error = function (...args) {
        console.error('[SENIX]', ...args);
    };
    
    /**
     * Obtener CSRF token
     */
    SENIX.csrf = function () {
        return SENIX.config.csrfToken || 
               SENIX.$('meta[name="csrf-token"]')?.content || 
               SENIX.$('input[name="csrf_token"]')?.value || '';
    };
    
    /**
     * Fetch con CSRF
     */
    SENIX.fetch = async function (url, options = {}) {
        const defaults = {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-Token': SENIX.csrf(),
                'Accept': 'application/json'
            }
        };
        
        const config = {
            ...defaults,
            ...options,
            headers: {
                ...defaults.headers,
                ...(options.headers || {})
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            return { ok: response.ok, status: response.status, data };
        } catch (error) {
            SENIX.error('Fetch error:', error);
            return { ok: false, status: 0, data: null, error: error.message };
        }
    };
    
    /**
     * Formateo de números
     */
    SENIX.formatNumber = function (num, decimals = 0) {
        return Number(num).toLocaleString('es-MX', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };
    
    /**
     * Formateo de tiempo
     */
    SENIX.formatTime = function (seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };
    
    /**
     * Actualiza el estado de viewport
     */
    SENIX.updateViewport = function () {
        SENIX.state.viewport.w = window.innerWidth;
        SENIX.state.viewport.h = window.innerHeight;
    };
    
    /**
     * Actualiza estado mobile
     */
    SENIX.updateMobileState = function () {
        SENIX.state.isMobile = SENIX.isMobile();
        SENIX.state.isTouch = SENIX.isTouch();
        SENIX.state.isReducedMotion = SENIX.prefersReducedMotion();
    };
    
    /**
     * Detecta dirección de scroll
     */
    SENIX.detectScrollDirection = function () {
        const currentY = window.scrollY;
        SENIX.state.scrollDirection = currentY > SENIX.state.lastScrollY ? 'down' : 'up';
        SENIX.state.lastScrollY = currentY;
        SENIX.state.scrollY = currentY;
    };
    
    /**
     * Mouse tracker global
     */
    SENIX.initMouseTracker = function () {
        let lastX = 0, lastY = 0;
        
        const update = SENIX.rafThrottle((e) => {
            SENIX.state.mouse.x = e.clientX;
            SENIX.state.mouse.y = e.clientY;
            SENIX.state.mouse.vx = e.clientX - lastX;
            SENIX.state.mouse.vy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
        });
        
        SENIX.on(document, 'mousemove', update, { passive: true });
        SENIX.on(document, 'touchmove', (e) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                SENIX.state.mouse.x = t.clientX;
                SENIX.state.mouse.y = t.clientY;
            }
        }, { passive: true });
    };
    
    // ==========================================================
    // SCROLL TRACKER
    // ==========================================================
    SENIX.initScrollTracker = function () {
        const onScroll = SENIX.rafThrottle(() => {
            SENIX.detectScrollDirection();
            document.documentElement.style.setProperty('--senix-scroll-y', SENIX.state.scrollY);
        });
        
        SENIX.on(window, 'scroll', onScroll, { passive: true });
    };
    
    // ==========================================================
    // THEME COLOR
    // ==========================================================
    SENIX.updateThemeColor = function (color) {
        const meta = SENIX.$('meta[name="theme-color"]');
        if (meta) meta.content = color;
    };
    
    // ==========================================================
    // PAGE VISIBILITY
    // ==========================================================
    SENIX.initVisibilityHandler = function () {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.documentElement.classList.add('senix-hidden-tab');
            } else {
                document.documentElement.classList.remove('senix-hidden-tab');
            }
        });
    };
    
    // ==========================================================
    // HANDLE RESIZE
    // ==========================================================
    SENIX.initResizeHandler = function () {
        const onResize = SENIX.debounce(() => {
            SENIX.updateViewport();
            SENIX.updateMobileState();
            document.documentElement.style.setProperty('--senix-vh', window.innerHeight * 0.01 + 'px');
        }, 150);
        
        SENIX.on(window, 'resize', onResize, { passive: true });
        SENIX.on(window, 'orientationchange', onResize, { passive: true });
        
        // Init
        SENIX.updateViewport();
        SENIX.updateMobileState();
        document.documentElement.style.setProperty('--senix-vh', window.innerHeight * 0.01 + 'px');
    };
    
    // ==========================================================
    // SMOOTH SCROLL A SECCIÓN
    // ==========================================================
    SENIX.scrollTo = function (target, offset = 80) {
        const el = typeof target === 'string' ? SENIX.$(target) : target;
        if (!el) return;
        
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        
        window.scrollTo({
            top,
            behavior: SENIX.state.isReducedMotion ? 'auto' : 'smooth'
        });
    };
    
    // ==========================================================
    // COPY TO CLIPBOARD
    // ==========================================================
    SENIX.copyToClipboard = async function (text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:absolute;left:-9999px';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                return true;
            }
        } catch (e) {
            SENIX.error('Copy failed:', e);
            return false;
        }
    };
    
    // ==========================================================
    // LOCAL STORAGE WRAPPER
    // ==========================================================
    SENIX.storage = {
        get(key, fallback = null) {
            try {
                const value = localStorage.getItem('senix_' + key);
                return value ? JSON.parse(value) : fallback;
            } catch (e) {
                return fallback;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem('senix_' + key, JSON.stringify(value));
                return true;
            } catch (e) {
                return false;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem('senix_' + key);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        clear() {
            try {
                Object.keys(localStorage)
                    .filter(k => k.startsWith('senix_'))
                    .forEach(k => localStorage.removeItem(k));
                return true;
            } catch (e) {
                return false;
            }
        }
    };
    
    // ==========================================================
    // LAUNCH
    // ==========================================================
    SENIX.init = function () {
        SENIX.log('Inicializando SENIX Core v' + SENIX.version);
        
        SENIX.cache.body = document.body;
        SENIX.cache.html = document.documentElement;
        
        SENIX.initResizeHandler();
        SENIX.initScrollTracker();
        SENIX.initMouseTracker();
        SENIX.initVisibilityHandler();
        
        SENIX.state.loaded = true;
        
        // Emitir evento global
        window.dispatchEvent(new CustomEvent('senix:core-loaded'));
    };
    
    // ==========================================================
    // EXPORT
    // ==========================================================
    window.Senix = SENIX;
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', SENIX.init);
    } else {
        SENIX.init();
    }
    
})(window);