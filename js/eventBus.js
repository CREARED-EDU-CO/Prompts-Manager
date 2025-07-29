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

// Sistema de eventos optimizado para desacoplar componentes
window.EventBus = {
  events: new Map(),
  
  on(event, callback) {
    if (typeof callback !== 'function') {
      console.warn('EventBus.on: callback debe ser una función');
      return;
    }
    
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);
  },

  emit(event, data) {
    const callbacks = this.events.get(event);
    if (callbacks && callbacks.size > 0) {
      // Usar requestAnimationFrame para eventos de UI
      const isUIEvent = event.includes('ui:') || event.includes('view:');
      
      if (isUIEvent) {
        requestAnimationFrame(() => {
          this.executeCallbacks(callbacks, data, event);
        });
      } else {
        this.executeCallbacks(callbacks, data, event);
      }
    }
  },

  executeCallbacks(callbacks, data, event) {
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error en evento '${event}':`, error);
      }
    });
  },

  off(event, callback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      // Limpiar eventos vacíos para evitar memory leaks
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
  },

  // Método para limpiar todos los eventos (útil para testing o cleanup)
  clear(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  },

  // Método para obtener estadísticas de eventos (debugging)
  getStats() {
    const stats = {};
    this.events.forEach((callbacks, event) => {
      stats[event] = callbacks.size;
    });
    return stats;
  }
};
