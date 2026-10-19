/**
 * ==========================================================
 * SENIX v2.0 — Splines Manager
 * Gestión eficiente de modelos 3D
 * ==========================================================
 */

(function (window) {
    'use strict';
    
    if (!window.Senix) return;
    const S = window.Senix;
    
    // ==========================================================
    // CONFIG
    // ==========================================================
    const CONFIG = {
        rootMargin: '200px',
        pauseOnHidden: true,
        reloadOnVisible: false
    };
    
    let iframes = [];
    let observer = null;
    
    // ==========================================================
    // INIT
    // ==========================================================
    function init() {
        iframes = S.$$('iframe[src*="spline.design"]');
        
        if (!iframes.length) {
            S.log('No Splines found');
            return;
        }
        
        S.log('Splines detectados:', iframes.length);
        
        // Observer para pausar/reanudar
        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(onIntersect, {
                rootMargin: CONFIG.rootMargin,
                threshold: 0
            });
            
            iframes.forEach(iframe => {
                // Guardar src original
                if (!iframe.dataset.splinesSrc) {
                    iframe.dataset.splinesSrc = iframe.src;
                }
                
                observer.observe(iframe);
            });
        }
        
        // Visibilidad de pestaña
        if (CONFIG.pauseOnHidden) {
            document.addEventListener('visibilitychange', onVisibilityChange);
        }
        
        // Fallback si no carga
        iframes.forEach(iframe => {
            iframe.addEventListener('error', () => {
                onLoadError(iframe);
            });
            
            // Timeout de carga
            setTimeout(() => {
                if (!iframe.dataset.loaded) {
                    // Si no cargó en 5 seg, ocultar
                    if (iframe.offsetHeight === 0) {
                        iframe.style.display = 'none';
                    }
                }
            }, 5000);
        });
    }
    
    // ==========================================================
    // INTERSECTION
    // ==========================================================
    function onIntersect(entries) {
        entries.forEach(entry => {
            const iframe = entry.target;
            
            if (entry.isIntersecting) {
                if (!iframe.dataset.loaded) {
                    iframe.dataset.loaded = 'pending';
                    
                    // Ya está visible, no hacer nada
                    iframe.style.visibility = 'visible';
                    iframe.style.opacity = '1';
                } else {
                    iframe.style.visibility = 'visible';
                    iframe.style.opacity = '1';
                }
            } else {
                // Pausar (ocultar pero mantener en DOM)
                iframe.style.visibility = 'hidden';
                iframe.style.opacity = '0';
            }
        });
    }
    
    // ==========================================================
    // VISIBILITY
    // ==========================================================
    function onVisibilityChange() {
        if (document.hidden) {
            iframes.forEach(iframe => {
                iframe.style.visibility = 'hidden';
            });
        } else {
            // Reobservar
            if (observer) {
                iframes.forEach(iframe => observer.observe(iframe));
            }
        }
    }
    
    // ==========================================================
    // ERROR HANDLER
    // ==========================================================
    function onLoadError(iframe) {
        S.warn('Spline failed to load:', iframe.src);
        
        // Mostrar fallback
        const parent = iframe.parentElement;
        if (parent && !parent.querySelector('.senix-spline-fallback')) {
            const fallback = document.createElement('div');
            fallback.className = 'senix-spline-fallback';
            fallback.style.cssText = `
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at 50% 50%, rgba(0,168,255,0.15), transparent 70%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #00a8ff;
                font-family: var(--senix-font-mono, monospace);
                font-size: 0.8rem;
                letter-spacing: 2px;
            `;
            fallback.textContent = 'SENIX · 3D';
            parent.appendChild(fallback);
            iframe.style.display = 'none';
        }
    }
    
    // ==========================================================
    // CONTROL API
    // ==========================================================
    function showAll() {
        iframes.forEach(iframe => {
            iframe.style.visibility = 'visible';
            iframe.style.opacity = '1';
        });
    }
    
    function hideAll() {
        iframes.forEach(iframe => {
            iframe.style.visibility = 'hidden';
            iframe.style.opacity = '0';
        });
    }
    
    function reload(iframe) {
        if (typeof iframe === 'string') {
            iframe = S.$(iframe);
        }
        if (!iframe) return;
        
        const src = iframe.dataset.splinesSrc || iframe.src;
        iframe.src = '';
        setTimeout(() => {
            iframe.src = src;
        }, 100);
    }
    
    function destroy() {
        if (observer) {
            iframes.forEach(iframe => observer.unobserve(iframe));
            observer.disconnect();
            observer = null;
        }
        
        iframes = [];
    }
    
    // ==========================================================
    // AUTO INIT
    // ==========================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export
    S.splines = {
        init,
        showAll,
        hideAll,
        reload,
        destroy,
        CONFIG
    };
    
})(window);