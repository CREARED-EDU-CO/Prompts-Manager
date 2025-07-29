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