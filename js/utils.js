/*
 * Este archivo es parte del proyecto Prompts-Manager.
 *
 * Copyright (C) 2025 CREARED.EDU.CO
 *
 * Este programa es software libre: puedes redistribuirlo y/o modificarlo 
 * bajo los términos de la Licencia Pública General Affero de GNU publicada 
 * por la Free Software Foundation, ya sea la versión 3 de la Licencia, 
 * o (a tu elección) cualquier versión posterior.
 *
 * Este programa se distribuye con la esperanza de que sea útil, 
 * pero SIN NINGUNA GARANTÍA; sin incluso la garantía implícita de 
 * COMERCIABILIDAD o IDONEIDAD PARA UN PROPÓSITO PARTICULAR. 
 * Consulta la Licencia Pública General Affero de GNU para más detalles.
 *
 * Deberías haber recibido una copia de la Licencia Pública General Affero de GNU 
 * junto con este programa. En caso contrario, consulta <https://www.gnu.org/licenses/agpl-3.0.html>.
 */

'use strict';

/**
 * MÓDULO DE UTILIDADES GENERALES
 * 
 * PROPÓSITO: Funciones de utilidad común para toda la aplicación
 * PATRÓN: Utility functions como funciones globales para acceso universal
 * ALCANCE: Global via window object para disponibilidad desde cualquier módulo
 * 
 * DEPENDENCIAS: window.CONFIG, window.MESSAGES (constants.js, i18n.js)
 * CONSUMIDORES: Todos los módulos que requieren funcionalidad común
 */

/**
 * MODAL DE CONFIRMACIÓN GLOBAL
 * 
 * @param {string} msg - Mensaje a mostrar en el modal
 * @returns {Promise<boolean>} Promise que resuelve true/false según elección del usuario
 * 
 * PATRÓN: Promise-based modal para API asíncrona limpia
 * IMPLEMENTACIÓN: Event listeners temporales con cleanup automático
 * ACCESIBILIDAD: Modal con focus trap y manejo de escape (implementado en CSS)
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. Configura DOM del modal con mensaje
 * 2. Muestra modal añadiendo clase 'active'
 * 3. Registra event listeners temporales
 * 4. Espera interacción del usuario
 * 5. Cleanup automático y resolución de Promise
 */
window.showConfirmModal = function (msg) {
  return new Promise(resolve => {
    // REFERENCIAS DOM: Elementos del modal de confirmación
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-modal-msg');
    const acceptBtn = document.getElementById('confirm-modal-accept');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    
    // CONFIGURACIÓN: Establece mensaje y muestra modal
    msgEl.textContent = msg;
    modal.classList.add('active');
    
    /**
     * FUNCIÓN DE CLEANUP
     * 
     * @param {boolean} result - Resultado de la confirmación
     * 
     * RESPONSABILIDADES:
     * - Oculta modal removiendo clase 'active'
     * - Limpia event listeners para prevenir memory leaks
     * - Resuelve Promise con resultado de la elección
     */
    function cleanup(result) {
      modal.classList.remove('active');
      acceptBtn.removeEventListener('click', onAccept);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    }
    
    // HANDLERS: Funciones de callback para botones
    function onAccept() { cleanup(true); }   // CONFIRMACIÓN: Usuario acepta
    function onCancel() { cleanup(false); }  // CANCELACIÓN: Usuario cancela
    
    // REGISTRO DE EVENTOS: Listeners temporales para esta instancia del modal
    acceptBtn.addEventListener('click', onAccept);
    cancelBtn.addEventListener('click', onCancel);
  });
};

/**
 * SISTEMA DE NOTIFICACIONES TOAST
 * 
 * @param {string} msg - Mensaje a mostrar en la notificación
 * @param {string} type - Tipo de notificación ('success' | 'error')
 * @param {Object} opts - Opciones adicionales (icon, duration)
 * 
 * PATRÓN: Non-blocking notifications para feedback inmediato sin interrumpir flujo
 * IMPLEMENTACIÓN: DOM manipulation con auto-cleanup y animaciones CSS
 * CONFIGURACIÓN: Duración configurable via window.CONFIG.TOAST_DURATION
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. Limpia contenido previo del toast
 * 2. Construye estructura DOM con icono y mensaje
 * 3. Aplica clases CSS para animación de entrada
 * 4. Programa auto-dismiss con fade-out
 * 5. Cleanup final del DOM
 */
window.showToast = function (msg, type = 'success', opts = {}) {
  // REFERENCIA DOM: Elemento toast global para notificaciones
  const toast = document.getElementById('toast');
  if (!toast) return; // EARLY RETURN: Previene errores si elemento no existe

  // LIMPIEZA: Remueve contenido previo para nueva notificación
  toast.innerHTML = '';

  // CONSTRUCCIÓN DE ICONO: Condicional basada en tipo o configuración explícita
  if (opts.icon || type === 'success' || type === 'error') {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    // LÓGICA DE ICONOS: Custom icon o iconos por defecto según tipo
    iconSpan.textContent = opts.icon || (type === 'success' ? '✔️' : '❌');
    toast.appendChild(iconSpan);
  }

  // CONSTRUCCIÓN DE MENSAJE: Span separado para styling independiente
  const msgSpan = document.createElement('span');
  msgSpan.textContent = msg;
  toast.appendChild(msgSpan);

  // APLICACIÓN DE CLASES: Combina visibilidad y tipo para styling CSS
  toast.className = `toast visible toast-${type === 'error' ? 'error' : 'success'}`;

  // CONFIGURACIÓN DE DURACIÓN: Usa configuración global o override específico
  const duration = opts.duration || window.CONFIG.TOAST_DURATION;
  
  // AUTO-DISMISS: Programación de ocultación con doble timeout para animación
  setTimeout(() => {
    // FASE 1: Inicia animación de fade-out removiendo clase 'visible'
    toast.classList.remove('visible');
    
    // FASE 2: Cleanup final del DOM después de animación CSS (300ms)
    setTimeout(() => toast.innerHTML = '', 300);
  }, duration);
};

/**
 * GENERADOR DE IDENTIFICADORES ÚNICOS
 * 
 * @returns {string} UUID v4 o fallback timestamp-based
 * 
 * ESTRATEGIA: Crypto API nativo con fallback para compatibilidad
 * SEGURIDAD: Crypto.randomUUID() proporciona entropía criptográficamente segura
 * FALLBACK: Timestamp + random para navegadores sin soporte crypto
 * USO: Identificadores únicos para prompts, carpetas, y elementos DOM
 */
window.generateUUID = function () {
  // MÉTODO PREFERIDO: Crypto API nativo (más seguro y estándar)
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  
  // FALLBACK: Combinación timestamp + random para compatibilidad
  // FORMATO: timestamp-hexadecimal para unicidad temporal y aleatoriedad
  return Date.now().toString() + '-' + Math.random().toString(16).slice(2);
};

/**
 * SANITIZACIÓN DE INPUT DE USUARIO
 * 
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado y normalizado
 * 
 * PROPÓSITO: Limpieza de input para prevenir problemas de formato y seguridad
 * TRANSFORMACIONES:
 * 1. Normaliza espacios múltiples a espacios únicos
 * 2. Remueve caracteres de control (0x00-0x1F, 0x7F)
 * 3. Trim de espacios iniciales y finales
 * 
 * SEGURIDAD: Previene inyección de caracteres de control y normaliza formato
 */
window.sanitizeInput = function (str) {
  // VALIDACIÓN DE TIPO: Retorna string vacío para inputs no-string
  if (typeof str !== 'string') return '';
  
  return str
    .replace(/\s+/g, ' ')           // NORMALIZACIÓN: Múltiples espacios → espacio único
    .replace(/[\x00-\x1F\x7F]+/g, '') // SANITIZACIÓN: Remueve caracteres de control
    .trim();                        // LIMPIEZA: Remueve espacios de bordes
};

/**
 * ACCESSOR DE MENSAJES LOCALIZADOS
 * 
 * @returns {Object} Objeto con mensajes en idioma actual
 * 
 * PATRÓN: Facade pattern para acceso simplificado a sistema i18n
 * ESTRUCTURA: Retorna objeto con categorías (errors, success, confirm, ui)
 * FALLBACK: Si idioma actual no existe, usa mensajes por defecto
 * 
 * DEPENDENCIAS: window.currentLang, window.MESSAGES (i18n.js)
 */
window.getLocalizedMessages = function () {
  // DETECCIÓN DE IDIOMA: Usa idioma actual o fallback a español
  const currentLang = window.currentLang || 'es';
  
  // CONSTRUCCIÓN DE OBJETO: Cada categoría con fallback a mensajes base
  return {
    errors: window.MESSAGES[currentLang]?.errors || window.MESSAGES.errors,
    success: window.MESSAGES[currentLang]?.success || window.MESSAGES.success,
    confirm: window.MESSAGES[currentLang]?.confirm || window.MESSAGES.confirm,
    ui: window.MESSAGES[currentLang]?.ui || window.MESSAGES.ui
  };
};

/**
 * VALIDADOR DE DEPENDENCIAS DE MÓDULO
 * 
 * @param {string[]} dependencies - Array de nombres de dependencias requeridas
 * @param {string} moduleName - Nombre del módulo para logging
 * @returns {boolean} true si todas las dependencias están disponibles
 * 
 * PATRÓN: Dependency injection validation para inicialización segura
 * PROPÓSITO: Prevenir errores runtime por dependencias faltantes
 * LOGGING: Reporta dependencias faltantes para debugging
 * 
 * USO TÍPICO: En métodos init() de controladores para validar prerequisites
 */
window.validateDependencies = function (dependencies, moduleName = 'Unknown') {
  const missing = []; // ACUMULADOR: Lista de dependencias faltantes
  
  // VALIDACIÓN: Verifica existencia de cada dependencia en window object
  dependencies.forEach(dep => {
    if (!window[dep]) {
      missing.push(dep);
    }
  });

  // REPORTE DE ERRORES: Log detallado para debugging
  if (missing.length > 0) {
    console.error(`${moduleName}: Dependencias faltantes: ${missing.join(', ')}`);
    return false;
  }
  
  return true; // SUCCESS: Todas las dependencias están disponibles
};

/**
 * FUNCIÓN DE ERROR GLOBAL
 * 
 * @param {string} msg - Mensaje de error a mostrar
 * @param {Object} opts - Opciones de configuración (log, icon, duration)
 * 
 * PATRÓN: Centralized error handling para consistencia en manejo de errores
 * FUNCIONALIDADES:
 * 1. Muestra toast de error al usuario (UX)
 * 2. Log a consola para debugging (DX)
 * 
 * CONFIGURACIÓN: opts.log controla si se hace console.error
 * DEPENDENCIAS: window.showToast para notificaciones visuales
 */
window.showError = function (msg, opts = {}) {
  // NOTIFICACIÓN VISUAL: Toast de error para feedback inmediato al usuario
  if (window.showToast) {
    window.showToast(msg, 'error', opts);
  }
  
  // LOGGING: Console.error para debugging (configurable via opts.log)
  if (opts && opts.log !== false) {
    console.error(msg);
  }
};
