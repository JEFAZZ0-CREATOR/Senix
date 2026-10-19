/**
 * ==========================================================
 * SENIX v2.0 — Scroll Effects
 * Reveal animations, parallax, progress bar
 * ==========================================================
 */

(function (window) {
    'use strict';
    
    if (!window.Senix) return;
    const S = window.Senix;
    
    // ==========================================================
    // REVEAL ON SCROLL
    // ==========================================================
    function initReveal() {
        const elements = S.$$('.senix-reveal, .senix-reveal-left, .senix-reveal-right, .senix-reveal-scale, .senix-reveal-blur');
        
        if (!elements.length) return;
        
        // Fallback para navegadores sin IntersectionObserver
        if (!('IntersectionObserver' in window)) {
            elements.forEach(el => el.classList.add('is-visible'));
            return;
        }
        
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    
                    // Delay desde data attribute o clase
                    const delay = el.dataset.delay || 0;
                    
                    setTimeout(() => {
                        el.classList.add('is-visible');
                        el.dispatchEvent(new CustomEvent('senix:revealed'));
                    }, delay);
                    
                    observer.unobserve(el);
                }
            });
        }, options);
        
        elements.forEach(el => observer.observe(el));
        
        S.log('Reveal inicializado:', elements.length, 'elementos');
    }
    
    // ==========================================================
    // PARALLAX
    // ==========================================================
    function initParallax() {
        const elements = S.$$('[data-parallax]');
        
        if (!elements.length) return;
        
        // Desactivar en móvil y reduced motion
        if (S.state.isMobile || S.state.isReducedMotion) {
            elements.forEach(el => el.style.transform = '');
            return;
        }
        
        let ticking = false;
        
        function update() {
            const scrollY = window.scrollY;
            const viewportH = window.innerHeight;
            
            elements.forEach(el => {
                const speed = parseFloat(el.dataset.parallax) || 0.5;
                const rect = el.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                
                // Solo si está en viewport
                if (centerY > -viewportH && centerY < viewportH * 2) {
                    const offset = (centerY - viewportH / 2) * speed;
                    el.style.transform = `translate3d(0, ${offset}px, 0)`;
                }
            });
            
            ticking = false;
        }
        
        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        }
        
        S.on(window, 'scroll', onScroll, { passive: true });
        update();
    }
    
    // ==========================================================
    // SCROLL PROGRESS BAR
    // ==========================================================
    function initScrollProgress() {
        const bar = S.$('.senix-scroll-progress');
        
        if (!bar) return;
        
        function update() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            
            bar.style.width = progress + '%';
        }
        
        S.on(window, 'scroll', S.rafThrottle(update), { passive: true });
        update();
    }
    
    // ==========================================================
    // STICKY SECTIONS
    // ==========================================================
    function initStickySections() {
        const sections = S.$$('[data-sticky]');
        
        if (!sections.length || S.state.isMobile) return;
        
        sections.forEach(section => {
            const inner = section.querySelector('[data-sticky-inner]');
            if (!inner) return;
            
            let ticking = false;
            
            function update() {
                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top;
                const sectionHeight = rect.height;
                const windowHeight = window.innerHeight;
                
                // Si la sección está en viewport
                if (sectionTop < windowHeight && sectionTop + sectionHeight > 0) {
                    const progress = Math.max(0, Math.min(1,
                        -sectionTop / (sectionHeight - windowHeight)
                    ));
                    
                    inner.style.transform = `translateY(${progress * 30}px)`;
                }
                
                ticking = false;
            }
            
            S.on(window, 'scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(update);
                    ticking = true;
                }
            }, { passive: true });
        });
    }
    
    // ==========================================================
    // COUNTERS
    // ==========================================================
    function initCounters() {
        const counters = S.$$('[data-count]');
        
        if (!counters.length) return;
        
        const observed = new WeakSet();
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !observed.has(entry.target)) {
                    observed.add(entry.target);
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(el => observer.observe(el));
    }
    
    function animateCounter(el) {
        const target = parseFloat(el.dataset.count) || 0;
        const decimals = parseInt(el.dataset.decimals) || 0;
        const duration = parseInt(el.dataset.duration) || 1800;
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        
        const start = performance.now();
        
        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;
            
            el.textContent = prefix + formatNumber(current, decimals) + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = prefix + formatNumber(target, decimals) + suffix;
                el.dispatchEvent(new CustomEvent('senix:counter-done'));
            }
        }
        
        requestAnimationFrame(update);
    }
    
    function formatNumber(num, decimals) {
        return Number(num).toLocaleString('es-MX', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    // ==========================================================
    // LAZY LOAD IFRAMES
    // ==========================================================
    function initLazyIframes() {
        const iframes = S.$$('iframe[loading="lazy"]');
        
        if (!iframes.length || !('IntersectionObserver' in window)) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const iframe = entry.target;
                
                if (entry.isIntersecting) {
                    iframe.style.visibility = 'visible';
                    if (iframe.dataset.src && !iframe.src) {
                        iframe.src = iframe.dataset.src;
                    }
                } else {
                    iframe.style.visibility = 'hidden';
                }
            });
        }, { rootMargin: '300px' });
        
        iframes.forEach(f => observer.observe(f));
    }
    
    // ==========================================================
    // SCROLL TO TOP
    // ==========================================================
    function initScrollToTop() {
        const btn = S.$('[data-scroll-top]');
        if (!btn) return;
        
        function toggle() {
            if (window.scrollY > 500) {
                btn.classList.add('is-visible');
            } else {
                btn.classList.remove('is-visible');
            }
        }
        
        S.on(window, 'scroll', S.rafThrottle(toggle), { passive: true });
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        toggle();
    }
    
    // ==========================================================
    // SMOOTH ANCHOR LINKS
    // ==========================================================
    function initSmoothAnchors() {
        S.$$('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#' || href === '#!') return;
                
                const target = document.querySelector(href);
                if (!target) return;
                
                e.preventDefault();
                S.scrollTo(target, 90);
            });
        });
    }
    
    // ==========================================================
    // LAUNCH
    // ==========================================================
    function init() {
        S.log('Inicializando scroll effects...');
        
        initReveal();
        initParallax();
        initScrollProgress();
        initStickySections();
        initCounters();
        initLazyIframes();
        initScrollToTop();
        initSmoothAnchors();
    }
    
    // Export
    S.scroll = {
        init,
        reveal: initReveal,
        counters: initCounters,
        scrollTo: S.scrollTo
    };
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})(window);