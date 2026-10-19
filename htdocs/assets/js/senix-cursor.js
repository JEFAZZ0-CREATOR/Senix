/**
 * ==========================================================
 * SENIX v2.0 — Custom Cursor
 * Cursor personalizado con efecto magnético
 * ==========================================================
 */

(function (window) {
    'use strict';
    
    if (!window.Senix) return;
    const S = window.Senix;
    
    // No activar en touch
    if (S.state.isTouch || S.state.isMobile || S.state.isReducedMotion) {
        return;
    }
    
    let dot, ring;
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let dotX = 0, dotY = 0;
    let rafId = null;
    let isActive = false;
    
    const lerp = (a, b, t) => a + (b - a) * t;
    
    // ==========================================================
    // CREAR CURSOR
    // ==========================================================
    function createCursor() {
        dot = document.createElement('div');
        dot.className = 'senix-cursor';
        document.body.appendChild(dot);
        
        ring = document.createElement('div');
        ring.className = 'senix-cursor-ring';
        document.body.appendChild(ring);
    }
    
    // ==========================================================
    // ACTIVATE
    // ==========================================================
    function activate() {
        if (isActive) return;
        isActive = true;
        
        document.documentElement.style.cursor = 'none';
        dot.classList.add('is-active');
        ring.classList.add('is-active');
        
        animate();
    }
    
    function deactivate() {
        isActive = false;
        document.documentElement.style.cursor = '';
        dot.classList.remove('is-active');
        ring.classList.remove('is-active');
        
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }
    
    // ==========================================================
    // MOUSE MOVE
    // ==========================================================
    function onMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (!isActive) activate();
    }
    
    function onMouseLeave() {
        deactivate();
    }
    
    function onMouseEnter() {
        activate();
    }
    
    // ==========================================================
    // HOVER DETECTION
    // ==========================================================
    function initHoverDetection() {
        const hoverTargets = 'a, button, .senix-btn, .senix-tab, .senix-nav-link, [data-hover], input, textarea, select, [role="button"]';
        
        document.addEventListener('mouseover', (e) => {
            if (!ring) return;
            const target = e.target.closest(hoverTargets);
            if (target) {
                ring.classList.add('is-hover');
                dot.classList.add('is-hover');
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (!ring) return;
            const target = e.target.closest(hoverTargets);
            if (target) {
                ring.classList.remove('is-hover');
                dot.classList.remove('is-hover');
            }
        });
    }
    
    // ==========================================================
    // MAGNETIC EFFECT
    // ==========================================================
    function initMagnetic() {
        S.$$('[data-magnetic]').forEach(el => {
            const strength = parseFloat(el.dataset.magnetic) || 30;
            
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                el.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                el.style.transform = `translate(${x / rect.width * strength}px, ${y / rect.height * strength}px)`;
            });
            
            el.addEventListener('mouseleave', () => {
                el.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                el.style.transform = '';
            });
        });
    }
    
    // ==========================================================
    // ANIMATE
    // ==========================================================
    function animate() {
        if (!isActive) return;
        
        // Lerp suave
        dotX = lerp(dotX, mouseX, 0.35);
        dotY = lerp(dotY, mouseY, 0.35);
        ringX = lerp(ringX, mouseX, 0.15);
        ringY = lerp(ringY, mouseY, 0.15);
        
        dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        
        rafId = requestAnimationFrame(animate);
    }
    
    // ==========================================================
    // EVENTS
    // ==========================================================
    function init() {
        createCursor();
        
        document.addEventListener('mousemove', onMouseMove, { passive: true });
        document.addEventListener('mouseleave', onMouseLeave, { passive: true });
        document.addEventListener('mouseenter', onMouseEnter, { passive: true });
        
        initHoverDetection();
        initMagnetic();
        
        S.log('Custom cursor inicializado');
    }
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})(window);