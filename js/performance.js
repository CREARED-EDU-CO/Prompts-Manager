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

// Utilidades de rendimiento optimizadas
window.Performance = {
  // Debounce mejorado con cancelación
  debounce(func, wait, immediate = false) {
    let timeout;
    const debounced = function executedFunction(...args) {
      const context = this;
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
    
    // Método para cancelar el debounce
    debounced.cancel = () => {
      clearTimeout(timeout);
      timeout = null;
    };
    
    return debounced;
  },

  // Throttle mejorado con trailing y leading options
  throttle(func, limit, options = {}) {
    let inThrottle;
    let lastFunc;
    let lastRan;
    const { leading = true, trailing = true } = options;
    
    return function(...args) {
      const context = this;
      if (!lastRan && leading) {
        func.apply(context, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if ((Date.now() - lastRan) >= limit) {
            if (trailing) func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  },

  // RequestAnimationFrame debounce para operaciones visuales
  rafDebounce(func) {
    let rafId;
    return function(...args) {
      const context = this;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => func.apply(context, args));
    };
  },

  // Batch DOM operations para mejor rendimiento
  batchDOMUpdates(operations) {
    if (!Array.isArray(operations)) {
      operations = [operations];
    }
    
    requestAnimationFrame(() => {
      operations.forEach(operation => {
        if (typeof operation === 'function') {
          operation();
        }
      });
    });
  },

  // Lazy loading mejorado con opciones
  lazyLoad(elements, callback, options = {}) {
    const defaultOptions = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target, entry);
          observer.unobserve(entry.target);
        }
      });
    }, defaultOptions);

    // Manejar tanto NodeList como Arrays
    const elementsArray = Array.isArray(elements) ? elements : Array.from(elements);
    elementsArray.forEach(el => {
      if (el instanceof Element) {
        observer.observe(el);
      }
    });

    // Retornar observer para cleanup manual si es necesario
    return observer;
  },

  // Memoización simple para funciones costosas
  memoize(func, keyGenerator) {
    const cache = new Map();
    return function(...args) {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func.apply(this, args);
      cache.set(key, result);
      return result;
    };
  },

  // Cleanup para prevenir memory leaks
  cleanup() {
    // Limpiar observers y timeouts si es necesario
    if (this._observers) {
      this._observers.forEach(observer => observer.disconnect());
      this._observers.clear();
    }
  }
};
