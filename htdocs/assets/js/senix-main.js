/**
 * ==========================================================
 * SENIX v2.0 — Main Init
 * ==========================================================
 */

(function (window) {
    'use strict';
    
    if (!window.Senix) {
        console.error('[SENIX] Core no está cargado');
        return;
    }
    
    const S = window.Senix;
    
    // ==========================================================
    // LOG BOOT
    // ==========================================================
    S.log('🚀 SENIX v' + S.version + ' iniciando...');
    
    // ==========================================================
    // SETUP GLOBAL
    // ==========================================================
    
    // Debug mode
    if (location.search.includes('debug=1') || location.hostname === 'localhost') {
        S.debug = true;
    }
    
    // Detectar valores desde data attributes
    document.documentElement.dataset.senixVersion = S.version;
    
    // ==========================================================
    // ERRORES GLOBALES
    // ==========================================================
    window.addEventListener('error', (e) => {
        S.error('Error global:', e.error || e.message);
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        S.error('Promise rechazada:', e.reason);
    });
    
    // ==========================================================
    // SERVICE WORKER
    // ==========================================================
    if ('serviceWorker' in navigator && !location.hostname.includes('localhost')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => S.log('Service Worker registrado'))
                .catch(err => S.warn('SW error:', err.message));
        });
    }
    
    // ==========================================================
    // PERFORMANCE
    // ==========================================================
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'largest-contentful-paint') {
                        S.log('LCP:', Math.round(entry.renderTime || entry.loadTime) + 'ms');
                    }
                });
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
            // Ignore
        }
    }
    
    // ==========================================================
    // READY
    // ==========================================================
    function onReady() {
        S.log('✅ SENIX listo');
        
        // Marcar body como ready
        document.body.classList.add('senix-ready');
        
        // Emitir evento
        window.dispatchEvent(new CustomEvent('senix:ready'));
        
        // Añadir animación fade-in al body
        document.body.style.opacity = '0';
        requestAnimationFrame(() => {
            document.body.style.transition = 'opacity 0.5s';
            document.body.style.opacity = '1';
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
    
})(window);