/**
 * ==========================================================
 * SENIX v2.0 — UI Interactions
 * Toasts, modals, dropdowns, tabs, ripples
 * ==========================================================
 */

(function (window) {
    'use strict';
    
    if (!window.Senix) return;
    const S = window.Senix;
    
    // ==========================================================
    // TOASTS
    // ==========================================================
    const Toast = {
        container: null,
        
        init() {
            let container = S.$('.senix-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'senix-toast-container';
                document.body.appendChild(container);
            }
            this.container = container;
        },
        
        show(title, message = '', type = 'info', duration = 4000) {
            if (!this.container) this.init();
            
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };
            
            const toast = document.createElement('div');
            toast.className = `senix-toast senix-toast-${type}`;
            toast.innerHTML = `
                <div class="senix-toast-icon">${icons[type] || 'ℹ'}</div>
                <div class="senix-toast-content">
                    <div class="senix-toast-title">${escapeHtml(title)}</div>
                    ${message ? `<div class="senix-toast-message">${escapeHtml(message)}</div>` : ''}
                </div>
            `;
            
            this.container.appendChild(toast);
            
            const dismiss = () => {
                toast.classList.add('is-hiding');
                setTimeout(() => {
                    if (toast.parentNode) toast.parentNode.removeChild(toast);
                }, 300);
            };
            
            const timer = setTimeout(dismiss, duration);
            
            toast.addEventListener('click', () => {
                clearTimeout(timer);
                dismiss();
            });
            
            return toast;
        },
        
        success(title, message, duration) {
            return this.show(title, message, 'success', duration);
        },
        
        error(title, message, duration) {
            return this.show(title, message, 'error', duration);
        },
        
        warning(title, message, duration) {
            return this.show(title, message, 'warning', duration);
        },
        
        info(title, message, duration) {
            return this.show(title, message, 'info', duration);
        }
    };
    
    // ==========================================================
    // MODALS
    // ==========================================================
    const Modal = {
        open(selector) {
            const modal = typeof selector === 'string' ? S.$(selector) : selector;
            if (!modal) return;
            
            modal.classList.add('is-active');
            document.documentElement.classList.add('senix-scroll-locked');
            
            // Focus trap
            const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable) focusable.focus();
            
            // Emitir evento
            window.dispatchEvent(new CustomEvent('senix:modal-open', { detail: { modal } }));
        },
        
        close(selector) {
            const modal = typeof selector === 'string' ? S.$(selector) : selector;
            if (!modal) return;
            
            modal.classList.remove('is-active');
            
            // Si no hay más modales abiertos, quitar lock
            if (!S.$('.senix-modal-overlay.is-active')) {
                document.documentElement.classList.remove('senix-scroll-locked');
            }
            
            window.dispatchEvent(new CustomEvent('senix:modal-close', { detail: { modal } }));
        },
        
        init() {
            // Botones con data-modal-open
            document.addEventListener('click', (e) => {
                const openBtn = e.target.closest('[data-modal-open]');
                if (openBtn) {
                    e.preventDefault();
                    this.open(openBtn.dataset.modalOpen);
                }
                
                const closeBtn = e.target.closest('[data-modal-close]');
                if (closeBtn) {
                    e.preventDefault();
                    const modal = closeBtn.closest('.senix-modal-overlay');
                    if (modal) this.close(modal);
                }
                
                // Click en overlay
                if (e.target.classList.contains('senix-modal-overlay')) {
                    this.close(e.target);
                }
                
                // Botón X con clase
                if (e.target.closest('.senix-modal-close')) {
                    const modal = e.target.closest('.senix-modal-overlay');
                    if (modal) this.close(modal);
                }
            });
            
            // Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const activeModal = S.$('.senix-modal-overlay.is-active');
                    if (activeModal) this.close(activeModal);
                }
            });
        }
    };
    
    // ==========================================================
    // DROPDOWNS
    // ==========================================================
    const Dropdown = {
        init() {
            document.addEventListener('click', (e) => {
                // Toggle dropdown
                const toggle = e.target.closest('[data-dropdown]');
                if (toggle) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const targetId = toggle.dataset.dropdown;
                    const menu = S.$(targetId);
                    
                    // Cerrar otros
                    S.$$('.senix-dropdown-menu.is-open').forEach(m => {
                        if (m !== menu) m.classList.remove('is-open');
                    });
                    
                    if (menu) menu.classList.toggle('is-open');
                    return;
                }
                
                // Cerrar al hacer click fuera
                if (!e.target.closest('.senix-dropdown-menu')) {
                    S.$$('.senix-dropdown-menu.is-open').forEach(m => m.classList.remove('is-open'));
                }
            });
        }
    };
    
    // ==========================================================
    // TABS
    // ==========================================================
    const Tabs = {
        init() {
            document.addEventListener('click', (e) => {
                const tab = e.target.closest('.senix-tab');
                if (!tab) return;
                
                const container = tab.closest('.senix-tabs');
                if (!container) return;
                
                const targetPanel = tab.dataset.tab;
                
                // Remover activo de todos
                container.querySelectorAll('.senix-tab').forEach(t => t.classList.remove('is-active'));
                tab.classList.add('is-active');
                
                // Mostrar panel
                const panelsContainer = container.parentElement;
                panelsContainer.querySelectorAll('[data-panel]').forEach(p => {
                    p.style.display = p.dataset.panel === targetPanel ? '' : 'none';
                });
            });
        }
    };
    
    // ==========================================================
    // RIPPLE EFFECT
    // ==========================================================
    const Ripple = {
        init() {
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.senix-btn, .senix-ripple-container');
                if (!btn) return;
                // Los CTA de navegación deben mantener una caja estable al pulsarlos.
                if (btn.closest('.senix-hero-actions, .senix-nav-actions')) return;
                
                btn.classList.add('senix-ripple-container');
                
                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                const ripple = document.createElement('span');
                ripple.className = 'senix-ripple';
                ripple.style.cssText = `
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                `;
                
                btn.appendChild(ripple);
                
                setTimeout(() => {
                    if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
                }, 600);
            });
        }
    };
    
    // ==========================================================
    // FAQ ACCORDION
    // ==========================================================
    const FAQ = {
        init() {
            document.addEventListener('click', (e) => {
                const question = e.target.closest('.senix-faq-question');
                if (!question) return;
                
                const item = question.closest('.senix-faq-item');
                if (!item) return;
                
                const isOpen = item.classList.contains('is-open');
                
                // Cerrar otros del mismo grupo (opcional)
                const group = item.parentElement;
                if (group && group.classList.contains('senix-faq')) {
                    group.querySelectorAll('.senix-faq-item.is-open').forEach(i => {
                        if (i !== item) i.classList.remove('is-open');
                    });
                }
                
                item.classList.toggle('is-open', !isOpen);
            });
        }
    };
    
    // ==========================================================
    // PASSWORD TOGGLE
    // ==========================================================
    const PasswordToggle = {
        init() {
            document.addEventListener('click', (e) => {
                const toggle = e.target.closest('.senix-input-toggle');
                if (!toggle) return;
                
                e.preventDefault();
                
                const input = toggle.parentElement.querySelector('input');
                if (!input) return;
                
                if (input.type === 'password') {
                    input.type = 'text';
                    toggle.innerHTML = '🙈';
                    toggle.setAttribute('aria-label', 'Ocultar contraseña');
                } else {
                    input.type = 'password';
                    toggle.innerHTML = '👁';
                    toggle.setAttribute('aria-label', 'Mostrar contraseña');
                }
            });
        }
    };
    
    // ==========================================================
    // PASSWORD STRENGTH METER
    // ==========================================================
    const PasswordStrength = {
        init() {
            S.$$('[data-password-strength]').forEach(input => {
                const targetSelector = input.dataset.passwordStrength;
                const bar = S.$(targetSelector);
                if (!bar) return;
                
                const fill = bar.querySelector('.senix-pw-fill') || bar;
                
                input.addEventListener('input', () => {
                    const score = this.checkStrength(input.value);
                    fill.className = 'senix-pw-fill';
                    if (input.value.length === 0) {
                        fill.style.width = '0';
                    } else if (score < 3) {
                        fill.classList.add('is-weak');
                    } else if (score < 5) {
                        fill.classList.add('is-medium');
                    } else {
                        fill.classList.add('is-strong');
                    }
                });
            });
        },
        
        checkStrength(pw) {
            let score = 0;
            if (pw.length >= 8) score++;
            if (pw.length >= 12) score++;
            if (/[A-Z]/.test(pw)) score++;
            if (/[a-z]/.test(pw)) score++;
            if (/[0-9]/.test(pw)) score++;
            if (/[^A-Za-z0-9]/.test(pw)) score++;
            return score;
        }
    };
    
    // ==========================================================
    // CARD TILT 3D
    // ==========================================================
    const Tilt = {
        init() {
            // Desactivar en touch / mobile
            if (S.state.isTouch || S.state.isMobile || S.state.isReducedMotion) {
                return;
            }
            
            S.$$('[data-tilt]').forEach(card => {
                const maxTilt = parseFloat(card.dataset.tiltMax) || 12;
                const scale = parseFloat(card.dataset.tiltScale) || 1.02;
                const speed = parseFloat(card.dataset.tiltSpeed) || 300;
                
                let rafId = null;
                let targetX = 0, targetY = 0;
                let currentX = 0, currentY = 0;
                let isHovering = false;
                
                const lerp = (a, b, t) => a + (b - a) * t;
                
                function animate() {
                    currentX = lerp(currentX, targetX, 0.15);
                    currentY = lerp(currentY, targetY, 0.15);
                    
                    card.style.transform = `
                        perspective(1200px)
                        rotateX(${-currentY * maxTilt}deg)
                        rotateY(${currentX * maxTilt}deg)
                        scale(${scale})
                    `;
                    
                    if (isHovering || Math.abs(currentX - targetX) > 0.01 || Math.abs(currentY - targetY) > 0.01) {
                        rafId = requestAnimationFrame(animate);
                    } else {
                        rafId = null;
                    }
                }
                
                card.addEventListener('mouseenter', () => {
                    isHovering = true;
                    card.style.transition = 'none';
                    if (!rafId) animate();
                });
                
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    targetX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
                    targetY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
                });
                
                card.addEventListener('mouseleave', () => {
                    isHovering = false;
                    targetX = 0;
                    targetY = 0;
                    card.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    if (rafId) cancelAnimationFrame(rafId);
                    card.style.transform = '';
                    rafId = null;
                });
            });
        }
    };
    
    // ==========================================================
    // COPY TO CLIPBOARD
    // ==========================================================
    const Clipboard = {
        init() {
            document.addEventListener('click', async (e) => {
                const btn = e.target.closest('[data-copy]');
                if (!btn) return;
                
                e.preventDefault();
                const text = btn.dataset.copy;
                const success = await S.copyToClipboard(text);
                
                if (success) {
                    Toast.success('Copiado', 'Texto copiado al portapapeles');
                } else {
                    Toast.error('Error', 'No se pudo copiar');
                }
            });
        }
    };
    
    // ==========================================================
    // HELPERS
    // ==========================================================
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    // ==========================================================
    // LAUNCH
    // ==========================================================
    function init() {
        S.log('Inicializando UI...');
        
        Toast.init();
        Modal.init();
        Dropdown.init();
        Tabs.init();
        Ripple.init();
        FAQ.init();
        PasswordToggle.init();
        PasswordStrength.init();
        Tilt.init();
        Clipboard.init();
    }
    
    // Export
    S.ui = { init, Toast, Modal, Dropdown, Tabs, Ripple, FAQ, Tilt };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})(window);