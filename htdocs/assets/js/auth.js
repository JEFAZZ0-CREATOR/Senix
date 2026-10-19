/* Validación progresiva para formularios de autenticación SignAI.
   La validación del servidor sigue siendo la autoridad final. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function togglePassword(id, button) {
    const input = document.getElementById(id);
    if (!input) return;
    const showing = input.type === 'password';
    input.type = showing ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(showing));
    button.setAttribute('aria-label', showing ? 'Ocultar contraseña' : 'Mostrar contraseña');
    const icon = $('span', button);
    if (icon) icon.textContent = showing ? '◎' : '◉';
  }

  function passwordRequirements(password) {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
  }

  function updateStrength(input) {
    const form = input.closest('form');
    const panel = $('#password-strength', form);
    const fill = $('.strength-fill', form);
    const text = $('.strength-text', form);
    const list = $('#pw-reqs', form);
    if (!panel || !fill || !text || !list) return;
    const reqs = passwordRequirements(input.value);
    let score = 0;
    Object.entries(reqs).forEach(([key, passed]) => {
      const item = $(`[data-req="${key}"]`, list);
      if (!item) return;
      item.classList.toggle('met', passed);
      const icon = $('.req-icon', item);
      if (icon) icon.textContent = passed ? '●' : '○';
      if (passed) score++;
    });
    fill.style.width = `${score * 20}%`;
    fill.style.background = score <= 2 ? '#ff577a' : score <= 4 ? '#ffc76c' : '#4de6a4';
    text.textContent = !input.value ? 'Escribe una contraseña' : score <= 2 ? 'Contraseña débil' : score <= 4 ? 'Contraseña media' : 'Contraseña fuerte';
    text.className = `strength-text ${score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong'}`;
  }

  function setFieldError(input, message) {
    input.setCustomValidity(message || '');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    const group = input.closest('.form-group') || input.parentElement;
    let error = $('.field-error', group);
    if (message) {
      if (!error) {
        error = document.createElement('small');
        error.className = 'field-error';
        error.setAttribute('role', 'alert');
        group.appendChild(error);
      }
      error.textContent = message;
    } else if (error) error.remove();
  }

  function validateField(input, form) {
    let message = '';
    const value = input.value;
    if (input.name === 'identifier') {
      const v = value.trim();
      const isEmail = v.includes('@');
      if (!v) message = 'Escribe tu usuario o email.';
      else if (v.length > 254) message = 'El usuario o email es demasiado largo.';
      else if (/[\u0000-\u001f\u007f]/.test(v)) message = 'El usuario o email contiene caracteres no permitidos.';
      else if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) message = 'Escribe un email válido.';
      else if (!isEmail && !/^[a-zA-Z0-9_]{3,50}$/.test(v)) message = 'El usuario debe tener entre 3 y 50 caracteres: letras, números o guion bajo.';
    } else if (input.name === 'username') {
      if (!/^[a-zA-Z0-9_]{3,50}$/.test(value)) message = 'Usa de 3 a 50 caracteres: letras, números o guion bajo.';
    } else if (input.name === 'email') {
      if (!value.trim() || !input.validity.valid) message = 'Introduce una dirección de email válida.';
      else if (form.id === 'register-form' && value.length > 150) message = 'El email no puede superar 150 caracteres.';
      else if (value.length > 254) message = 'El email es demasiado largo.';
    } else if (input.name === 'password' && (form.id === 'register-form' || form.id === 'reset-password-form')) {
      const reqs = passwordRequirements(value);
      if (value.length > 72) message = 'La contraseña no puede superar 72 caracteres.';
      else if (Object.values(reqs).some(v => !v)) message = 'Completa todos los requisitos de contraseña indicados.';
    } else if (input.name === 'password_confirm' || input.hasAttribute('data-confirm-password')) {
      const originalId = input.getAttribute('data-confirm-password') || 'password';
      const original = document.getElementById(originalId);
      if (!value) message = 'Confirma tu contraseña.';
      else if (original && value !== original.value) message = 'Las contraseñas no coinciden.';
    } else if (input.name === 'full_name') {
      if (value.length > 150) message = 'El nombre completo no puede superar 150 caracteres.';
      else if (/[\u0000-\u001f\u007f]/.test(value)) message = 'El nombre contiene caracteres no permitidos.';
    } else if (input.type === 'email' && (!value.trim() || !input.validity.valid)) {
      message = 'Introduce una dirección de email válida.';
    }
    setFieldError(input, message);
    return !message;
  }

  // Mostrar/ocultar contraseña sin depender de manejadores inline.
  $$('[data-toggle-password]').forEach(button => {
    button.addEventListener('click', () => togglePassword(button.dataset.togglePassword, button));
  });

  // Indicador de fortaleza de contraseña en el registro.
  const registerPassword = $('#register-form #password');
  if (registerPassword) {
    registerPassword.addEventListener('input', () => {
      updateStrength(registerPassword);
      const confirm = $('#register-form #password_confirm');
      if (confirm && confirm.value) validateField(confirm, confirm.form);
      if (registerPassword.value.length) validateField(registerPassword, registerPassword.form);
    });
  }

  $$('form[data-auth-form]').forEach(form => {
    const fields = $$('input', form).filter(input => input.type !== 'hidden' && input.type !== 'checkbox' && input.type !== 'submit');
    fields.forEach(input => {
      input.addEventListener('blur', () => validateField(input, form));
      input.addEventListener('input', () => {
        if (input.hasAttribute('aria-invalid')) validateField(input, form);
      });
    });
    form.addEventListener('submit', event => {
      // Recortar solo el identificador y los campos de texto; nunca modificar contraseñas.
      const identifier = $('input[name="identifier"]', form);
      if (identifier) identifier.value = identifier.value.trim();
      let valid = true;
      fields.forEach(input => { if (!validateField(input, form)) valid = false; });
      const terms = $('input[name="terms"]', form);
      if (terms && !terms.checked) {
        terms.setCustomValidity('Debes aceptar los términos y condiciones.');
        valid = false;
      }
      if (!valid || !form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
        const firstInvalid = $('[aria-invalid="true"]', form) || $(':invalid', form);
        if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
        return;
      }
      const button = $('[data-submit-button]', form);
      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        const label = $('.submit-label', button) || $('span:first-child', button);
        if (label) label.textContent = 'Procesando…';
        else if (!button.querySelector('.btn-arrow')) button.textContent = 'Procesando…';
      }
    });
    const terms = $('input[name="terms"]', form);
    if (terms) terms.addEventListener('change', () => terms.setCustomValidity(''));
  });
})();
