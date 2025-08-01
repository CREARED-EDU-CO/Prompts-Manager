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
 * MÓDULO DE OPTIMIZACIÓN DE PERFORMANCE
 * 
 * PROPÓSITO: Utilidades para optimizar rendimiento y responsividad de la UI
 * PATRONES: Higher-order functions, Closure pattern, Observer pattern
 * CASOS DE USO: Búsqueda en tiempo real, scroll events, resize handlers, lazy loading
 * 
 * DEPENDENCIAS: Ninguna (utilidades puras)
 * CONSUMIDORES: FiltersController (debounce), View (batchDOMUpdates), etc.
 */
window.Performance = {
  
  /**
   * DEBOUNCE: RETRASA EJECUCIÓN HASTA QUE CESEN LAS LLAMADAS
   * 
   * @param {Function} func Función a debounce
   * @param {number} wait Milisegundos de espera
   * @param {boolean} immediate Si ejecutar en leading edge
   * @returns {Function} Función debounced con método cancel
   * 
   * PATRÓN: Closure para mantener estado del timeout
   * USO TÍPICO: Búsqueda en tiempo real, validación de formularios
   * OPTIMIZACIÓN: Reduce llamadas a API/DOM durante input rápido
   */
  debounce: function(func, wait, immediate = false) {
    let timeout; // CLOSURE: Mantiene referencia al timeout entre llamadas
    
    const debounced = function executedFunction(...args) {
      const context = this; // PRESERVA CONTEXTO: Para métodos de objeto
      
      // FUNCIÓN DIFERIDA: Se ejecuta después del delay
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      
      // LÓGICA DE IMMEDIATE: Ejecuta en primera llamada si immediate=true
      const callNow = immediate && !timeout;
      
      // RESET DEL TIMER: Cada llamada cancela la anterior
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      // EJECUCIÓN INMEDIATA: Solo en primera llamada si immediate=true
      if (callNow) func.apply(context, args);
    };
    
    // MÉTODO DE CANCELACIÓN: Permite cancelar ejecución pendiente
    debounced.cancel = () => {
      clearTimeout(timeout);
      timeout = null;
    };
    
    return debounced;
  },

  /**
   * THROTTLE: LIMITA FRECUENCIA DE EJECUCIÓN
   * 
   * @param {Function} func Función a throttle
   * @param {number} limit Milisegundos mínimos entre ejecuciones
   * @param {Object} options Configuración de leading/trailing
   * @returns {Function} Función throttled
   * 
   * DIFERENCIA CON DEBOUNCE: Garantiza ejecución periódica vs esperar pausa
   * USO TÍPICO: Scroll events, resize handlers, mouse move
   * CONFIGURACIÓN: leading/trailing controlan ejecución en bordes
   */
  throttle: function(func, limit, options = {}) {
    let inThrottle;  // FLAG: Indica si estamos en período de throttle
    let lastFunc;    // TIMEOUT: Para trailing execution
    let lastRan;     // TIMESTAMP: Última ejecución para cálculos
    
    // DESTRUCTURING: Valores por defecto para opciones
    const { leading = true, trailing = true } = options;
    
    return function(...args) {
      const context = this;
      
      // LEADING EXECUTION: Primera llamada se ejecuta inmediatamente
      if (!lastRan && leading) {
        func.apply(context, args);
        lastRan = Date.now();
      } else {
        // TRAILING EXECUTION: Programa ejecución al final del período
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

  /**
   * RAF DEBOUNCE: DEBOUNCE USANDO REQUESTANIMATIONFRAME
   * 
   * @param {Function} func Función a debounce
   * @returns {Function} Función debounced con RAF
   * 
   * VENTAJA: Sincronizado con refresh rate del navegador (60fps)
   * USO TÍPICO: Animaciones, updates de UI, cálculos de layout
   * PERFORMANCE: Más eficiente que setTimeout para operaciones visuales
   */
  rafDebounce: function(func) {
    let rafId; // ID del requestAnimationFrame para cancelación
    
    return function(...args) {
      const context = this;
      
      // CANCELACIÓN: Cancela frame anterior si existe
      if (rafId) cancelAnimationFrame(rafId);
      
      // PROGRAMACIÓN: Ejecuta en próximo frame disponible
      rafId = requestAnimationFrame(() => func.apply(context, args));
    };
  },

  /**
   * BATCH DOM UPDATES: AGRUPA OPERACIONES DOM EN UN SOLO FRAME
   * 
   * @param {Function|Function[]} operations Operación(es) a ejecutar
   * 
   * PROPÓSITO: Evitar layout thrashing agrupando cambios DOM
   * PATRÓN: Batch processing para optimización de rendering
   * MECÁNICA: requestAnimationFrame garantiza ejecución antes del repaint
   */
  batchDOMUpdates: function(operations) {
    // NORMALIZACIÓN: Convierte función única en array para procesamiento uniforme
    if (!Array.isArray(operations)) {
      operations = [operations];
    }
    
    // BATCH EXECUTION: Todas las operaciones en un solo frame
    requestAnimationFrame(() => {
      operations.forEach(operation => {
        if (typeof operation === 'function') {
          operation();
        }
      });
    });
  },

  /**
   * LAZY LOADING CON INTERSECTION OBSERVER
   * 
   * @param {Element|Element[]} elements Elementos a observar
   * @param {Function} callback Función a ejecutar cuando elemento es visible
   * @param {Object} options Opciones del IntersectionObserver
   * @returns {IntersectionObserver} Observer para cleanup manual
   * 
   * PATRÓN: Observer pattern para carga diferida
   * PERFORMANCE: Reduce carga inicial cargando contenido bajo demanda
   * CLEANUP: Observer se desconecta automáticamente después de trigger
   */
  lazyLoad: function(elements, callback, options = {}) {
    // CONFIGURACIÓN: Merge de opciones con defaults sensatos
    const defaultOptions = {
      rootMargin: '50px',  // PRELOAD: Carga 50px antes de ser visible
      threshold: 0.1,      // TRIGGER: Cuando 10% del elemento es visible
      ...options
    };

    // OBSERVER: Detecta cuando elementos entran en viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // CALLBACK: Ejecuta lógica de carga
          callback(entry.target, entry);
          
          // CLEANUP: Deja de observar elemento ya procesado
          observer.unobserve(entry.target);
        }
      });
    }, defaultOptions);

    // NORMALIZACIÓN: Convierte NodeList/single element a array
    const elementsArray = Array.isArray(elements) ? elements : Array.from(elements);
    
    // REGISTRO: Inicia observación de cada elemento válido
    elementsArray.forEach(el => {
      if (el instanceof Element) {
        observer.observe(el);
      }
    });

    // RETORNO: Observer para cleanup manual si necesario
    return observer;
  },

  /**
   * MEMOIZACIÓN: CACHE DE RESULTADOS DE FUNCIÓN
   * 
   * @param {Function} func Función a memoizar
   * @param {Function} keyGenerator Función para generar clave de cache
   * @returns {Function} Función memoizada con cache interno
   * 
   * PATRÓN: Memoization pattern para optimización computacional
   * ESTRUCTURA: Map para O(1) lookup y soporte de claves complejas
   * PERSONALIZACIÓN: keyGenerator permite control sobre estrategia de caching
   */
  memoize: function(func, keyGenerator) {
    const cache = new Map(); // CACHE: Map para performance y flexibilidad de claves
    
    return function(...args) {
      // GENERACIÓN DE CLAVE: Custom o JSON.stringify por defecto
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      // CACHE HIT: Retorna resultado cacheado si existe
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      // CACHE MISS: Ejecuta función y cachea resultado
      const result = func.apply(this, args);
      cache.set(key, result);
      return result;
    };
  },

  /**
   * CLEANUP DE RECURSOS
   * 
   * PROPÓSITO: Libera observers y recursos para prevenir memory leaks
   * PATRÓN: Explicit resource management
   * USO: Llamar en unload/destroy de componentes
   */
  cleanup: function() {
    // CLEANUP DE OBSERVERS: Desconecta todos los observers registrados
    if (this._observers) {
      this._observers.forEach(observer => observer.disconnect());
      this._observers.clear();
    }
  }
};
