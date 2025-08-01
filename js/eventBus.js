'use strict';

/**
 * SISTEMA DE EVENTOS CENTRALIZADO (EVENT BUS)
 * 
 * PATRÓN: Observer Pattern / Publish-Subscribe
 * PROPÓSITO: Comunicación desacoplada entre módulos sin dependencias directas
 * ESTRUCTURA: Map<string, Set<Function>> para O(1) lookup y deduplicación automática
 * 
 * VENTAJAS:
 * - Desacoplamiento: Módulos no necesitan referencias directas
 * - Escalabilidad: Múltiples listeners por evento
 * - Performance: Set evita callbacks duplicados automáticamente
 * - Error isolation: Try/catch por callback individual
 * 
 * DEPENDENCIAS: window.showError (utils.js)
 * CONSUMIDORES: Todos los módulos que requieren comunicación inter-módulo
 */
window.EventBus = {
  /**
   * ALMACÉN DE EVENTOS
   * 
   * ESTRUCTURA: Map<eventName: string, callbacks: Set<Function>>
   * VENTAJAS DE MAP: O(1) lookup, iteración ordenada, claves de cualquier tipo
   * VENTAJAS DE SET: Deduplicación automática, O(1) add/delete
   */
  events: new Map(),
  
  /**
   * REGISTRO DE CALLBACK PARA EVENTO
   * 
   * @param {string} event Nombre del evento a escuchar
   * @param {Function} callback Función a ejecutar cuando se dispare el evento
   * 
   * VALIDACIÓN: Verifica que callback sea función para evitar errores runtime
   * INICIALIZACIÓN LAZY: Crea Set solo cuando se necesita para memoria eficiente
   * DEDUPLICACIÓN: Set automáticamente previene callbacks duplicados
   */
  on: function(event, callback) {
    // VALIDACIÓN DE TIPO: Previene errores de ejecución posteriores
    if (typeof callback !== 'function') {
      window.showError('EventBus.on: callback debe ser una función', { log: true });
      return;
    }
    
    // INICIALIZACIÓN LAZY: Crea Set solo cuando se registra primer callback
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    // REGISTRO: Set automáticamente maneja deduplicación
    this.events.get(event).add(callback);
  },

  /**
   * EMISIÓN DE EVENTO CON DATOS
   * 
   * @param {string} event Nombre del evento a disparar
   * @param {*} data Datos a pasar a los callbacks
   * 
   * OPTIMIZACIÓN UI: Eventos de UI se ejecutan en requestAnimationFrame
   * DETECCIÓN AUTOMÁTICA: Eventos con 'ui:' o 'view:' se consideran de UI
   * EJECUCIÓN INMEDIATA: Eventos no-UI se ejecutan síncronamente
   */
  emit: function(event, data) {
    const callbacks = this.events.get(event);
    
    // EARLY RETURN: Evita procesamiento innecesario si no hay listeners
    if (callbacks && callbacks.size > 0) {
      // DETECCIÓN DE EVENTOS UI: Heurística basada en nombre del evento
      const isUIEvent = event.includes('ui:') || event.includes('view:');
      
      if (isUIEvent) {
        // OPTIMIZACIÓN UI: Ejecutar en próximo frame para evitar bloqueo
        requestAnimationFrame(() => {
          this.executeCallbacks(callbacks, data, event);
        });
      } else {
        // EJECUCIÓN INMEDIATA: Para eventos de lógica de negocio
        this.executeCallbacks(callbacks, data, event);
      }
    }
  },

  /**
   * EJECUCIÓN SEGURA DE CALLBACKS
   * 
   * @param {Set<Function>} callbacks Set de funciones a ejecutar
   * @param {*} data Datos a pasar a cada callback
   * @param {string} event Nombre del evento (para logging de errores)
   * 
   * ERROR ISOLATION: Try/catch individual previene que un callback roto afecte otros
   * LOGGING: Errores se reportan con contexto del evento para debugging
   */
  executeCallbacks: function(callbacks, data, event) {
    callbacks.forEach(callback => {
      try {
        // EJECUCIÓN: Callback recibe data como único parámetro
        callback(data);
      } catch (error) {
        // ERROR ISOLATION: Un callback roto no afecta los demás
        window.showError(`Error en evento '${event}': ${error.message}`, { log: true });
      }
    });
  },

  /**
   * DESREGISTRO DE CALLBACK
   * 
   * @param {string} event Nombre del evento
   * @param {Function} callback Función específica a desregistrar
   * 
   * LIMPIEZA AUTOMÁTICA: Elimina evento completo si no quedan callbacks
   * PREVENCIÓN DE MEMORY LEAKS: Importante para componentes dinámicos
   */
  off: function(event, callback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      
      // LIMPIEZA: Elimina evento si no quedan callbacks para liberar memoria
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
  },

  /**
   * LIMPIEZA DE EVENTOS
   * 
   * @param {string} [event] Evento específico a limpiar, o undefined para todos
   * 
   * FLEXIBILIDAD: Puede limpiar evento específico o todos los eventos
   * USO: Útil para cleanup en tests o reset de aplicación
   */
  clear: function(event) {
    if (event) {
      // LIMPIEZA ESPECÍFICA: Solo el evento indicado
      this.events.delete(event);
    } else {
      // LIMPIEZA TOTAL: Todos los eventos (útil para reset)
      this.events.clear();
    }
  },

  /**
   * ESTADÍSTICAS DE EVENTOS
   * 
   * @returns {Object} Objeto con conteo de callbacks por evento
   * 
   * DEBUGGING: Útil para monitorear uso del EventBus
   * PERFORMANCE: Ayuda a identificar eventos con muchos listeners
   */
  getStats: function() {
    const stats = {};
    this.events.forEach((callbacks, event) => {
      stats[event] = callbacks.size;
    });
    return stats;
  }
};
