/**
 * ==========================================================
 * SENIX v2.0 — Preloader
 * ==========================================================
 */

(function (window) {
    'use strict';
    
    if (!window.Senix) return;
    const S = window.Senix;
    
    let loader = null;
    let progress = 0;
    let isComplete = false;
    const startTime = performance.now();
    const MIN_DURATION = 500; // Mínimo visible
    
    // ==========================================================
    // OBTENER LOADER
    // ==========================================================
    function getLoader() {
        return S.$('#senix-loader') || S.$('.senix-loader');
    }
    
    // ==========================================================
    // ACTUALIZAR PROGRESO
    // ==========================================================
    function updateProgress(percent) {
        progress = Math.min(100, Math.max(0, percent));
        
        const bar = loader && loader.querySelector('.senix-loader-progress-fill');
        if (bar) bar.style.width = progress + '%';
        
        const text = loader && loader.querySelector('.senix-loader-progress-text');
        if (text) text.textContent = Math.round(progress) + '%';
    }
    
    // ==========================================================
    // HIDE LOADER
    // ==========================================================
    function hideLoader() {
        if (isComplete || !loader) return;
        isComplete = true;
        
        updateProgress(100);
        
        // Esperar mínimo
        const elapsed = performance.now() - startTime;
        const wait = Math.max(0, MIN_DURATION - elapsed);
        
        setTimeout(() => {
            loader.classList.add('is-hidden');
            
            // Emitir evento
            window.dispatchEvent(new CustomEvent('senix:loader-hidden'));
            
            // Remover del DOM después
            setTimeout(() => {
                if (loader && loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 900);
        }, wait);
    }
    
    // ==========================================================
    // PROGRESO SIMULADO
    // ==========================================================
    function simulateProgress() {
        let fake = 0;
        const interval = setInterval(() => {
            fake += (90 - fake) * 0.08;
            if (fake >= 85) {
                clearInterval(interval);
            } else if (!isComplete) {
                updateProgress(fake);
            }
        }, 80);
        
        return interval;
    }
    
    // ==========================================================
    // DETECTAR CARGA COMPLETA
    // ==========================================================
    function detectLoad() {
        // Cuando todo cargue
        window.addEventListener('load', () => {
            setTimeout(() => {
                hideLoader();
            }, 300);
        });
        
        // Timeout de seguridad
        setTimeout(() => {
            if (!isComplete) {
                hideLoader();
            }
        }, 6000);
    }
    
    // ==========================================================
    // INIT
    // ==========================================================
    function init() {
        loader = getLoader();
        
        if (!loader) {
            S.log('No loader found');
            return;
        }
        
        // Simular progreso mientras carga
        simulateProgress();
        
        // Escuchar fin de carga
        detectLoad();
        
        // Eventos de carga
        if (document.readyState === 'complete') {
            setTimeout(hideLoader, MIN_DURATION);
        }
        
        S.log('Preloader inicializado');
    }
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export
    S.preloader = { hide: hideLoader, update: updateProgress };
    
})(window);
