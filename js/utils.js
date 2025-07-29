'use strict';
window.showConfirmModal = function (msg) {
  return new Promise(resolve => {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-modal-msg');
    const acceptBtn = document.getElementById('confirm-modal-accept');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    msgEl.textContent = msg;
    modal.classList.add('active');
    function cleanup(result) {
      modal.classList.remove('active');
      acceptBtn.removeEventListener('click', onAccept);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onAccept() { cleanup(true); }
    function onCancel() { cleanup(false); }
    acceptBtn.addEventListener('click', onAccept);
    cancelBtn.addEventListener('click', onCancel);
  });
};

window.showToast = function (msg, type = 'success', opts = {}) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.innerHTML = '';

  if (opts.icon || type === 'success' || type === 'error') {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = opts.icon || (type === 'success' ? '✔️' : '❌');
    toast.appendChild(iconSpan);
  }

  const msgSpan = document.createElement('span');
  msgSpan.textContent = msg;
  toast.appendChild(msgSpan);

  toast.className = `toast visible toast-${type === 'error' ? 'error' : 'success'}`;

  const duration = opts.duration || window.CONFIG.TOAST_DURATION;
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.innerHTML = '', 300);
  }, duration);
};

window.generateUUID = function () {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback simple si el navegador no soporta randomUUID
  return Date.now().toString() + '-' + Math.random().toString(16).slice(2);
};

window.sanitizeInput = function (str) {
  if (typeof str !== 'string') return '';
  // Elimina espacios al inicio/fin, múltiples espacios y caracteres no imprimibles
  return str.replace(/\s+/g, ' ').replace(/[\x00-\x1F\x7F]+/g, '').trim();
};

// Helper function to get messages in current language
window.getLocalizedMessages = function() {
  const currentLang = window.currentLang || 'es';
  return {
    errors: window.MESSAGES[currentLang]?.errors || window.MESSAGES.errors,
    success: window.MESSAGES[currentLang]?.success || window.MESSAGES.success,
    confirm: window.MESSAGES[currentLang]?.confirm || window.MESSAGES.confirm,
    ui: window.MESSAGES[currentLang]?.ui || window.MESSAGES.ui
  };
};

// Función de utilidad para validar dependencias
window.validateDependencies = function(dependencies, moduleName = 'Unknown') {
  const missing = [];
  dependencies.forEach(dep => {
    if (!window[dep]) {
      missing.push(dep);
    }
  });
  
  if (missing.length > 0) {
    console.error(`${moduleName}: Dependencias faltantes: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

window.showError = function (msg, opts = {}) {
  // Muestra el error en el toast y en consola para depuración
  if (window.showToast) {
    window.showToast(msg, 'error', opts);
  }
  if (opts && opts.log !== false) {
    console.error(msg);
  }
};

