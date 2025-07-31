'use strict';

/**
 * CONTROLADOR DE FILTROS
 * 
 * PROPÓSITO: Gestión centralizada del estado de filtros y coordinación con paginación
 * PATRÓN: State Management Controller con sincronización automática
 * RESPONSABILIDADES:
 * - Mantener estado de todos los filtros activos
 * - Coordinar cambios de filtros con reset de paginación
 * - Gestionar event listeners de elementos de filtrado
 * - Proporcionar interfaz para limpiar todos los filtros
 * - Sincronizar UI con estado interno
 * 
 * ARQUITECTURA DE FILTROS:
 * - text: Búsqueda de texto libre (case-insensitive)
 * - favorite: Filtro booleano para prompts favoritos
 * - tag: Filtro por etiqueta específica
 * - folder: Filtro por carpeta específica
 * - order: Criterio de ordenamiento (createdAt, updatedAt, usage)
 * 
 * DEPENDENCIAS: window.PaginationController, window.validateDependencies
 * CONSUMIDORES: PromptsModel.getFilteredPrompts(), ImportExportController
 */
window.FiltersController = {
  /**
   * ESTADO DE FILTROS
   * 
   * ESTRUCTURA: Objeto con todas las propiedades de filtrado
   * INICIALIZACIÓN: Valores por defecto que representan "sin filtros"
   * MUTABILIDAD: Estado mutable que se actualiza con interacciones del usuario
   */
  state: { 
    text: '',           // Búsqueda de texto libre
    favorite: false,    // Solo prompts favoritos
    tag: '',           // Etiqueta específica
    folder: '',        // Carpeta específica
    order: ''          // Criterio de ordenamiento
  },
  
  /**
   * CACHE DE ELEMENTOS DOM
   * 
   * PROPÓSITO: Evitar querySelector repetidos para mejor performance
   * INICIALIZACIÓN: Poblado en init() con referencias a elementos de filtrado
   * PATRÓN: Element caching para optimización de acceso DOM
   */
  elements: {
    searchInput: null,      // Input de búsqueda de texto
    favFilter: null,        // Checkbox de favoritos
    tagFilter: null,        // Select de etiquetas
    folderFilter: null,     // Select de carpetas
    orderFilter: null,      // Select de ordenamiento
    clearFiltersBtn: null   // Botón de limpiar filtros
  },

  /**
   * INICIALIZADOR DEL CONTROLADOR
   * 
   * PATRÓN: Dependency validation + Element caching + Event binding
   * VALIDACIÓN: Verifica dependencias críticas antes de proceder
   * ROBUSTEZ: Maneja elementos faltantes gracefully con logging
   * 
   * FLUJO DE INICIALIZACIÓN:
   * 1. Validar dependencias críticas
   * 2. Cachear referencias DOM
   * 3. Validar existencia de elementos
   * 4. Configurar event listeners
   */
  init: function () {
    // VALIDACIÓN DE DEPENDENCIAS: PaginationController es crítico para funcionamiento
    if (!window.validateDependencies(['PaginationController'], 'FiltersController')) {
      return;
    }
    
    // CACHEADO DE ELEMENTOS DOM: Referencias para evitar querySelector repetidos
    this.elements.searchInput = document.getElementById('search-input');
    this.elements.favFilter = document.getElementById('fav-filter');
    this.elements.tagFilter = document.getElementById('tag-filter');
    this.elements.folderFilter = document.getElementById('folder-filter');
    this.elements.orderFilter = document.getElementById('order-filter');
    this.elements.clearFiltersBtn = document.getElementById('clear-filters-btn');

    // VALIDACIÓN DE ELEMENTOS: Reporta elementos faltantes para debugging
    for (const key in this.elements) {
      if (!this.elements[key]) {
        window.showError(`Error: Elemento para filtro ${key} no encontrado.`);
      }
    }

    /**
     * CONFIGURACIÓN DE EVENT LISTENERS
     * 
     * PATRÓN: Optional chaining para elementos que pueden no existir
     * ESTRATEGIA: Cada cambio de filtro dispara reset de página + re-renderizado
     * PERFORMANCE: Debounce implícito en input de texto via navegador
     */
    
    // FILTRO DE TEXTO: Input event para búsqueda en tiempo real
    this.elements.searchInput?.addEventListener('input', (e) => {
      this._applyFilterAndResetPage('text', e.target.value);
    });
    
    // FILTRO DE FAVORITOS: Change event para checkbox
    this.elements.favFilter?.addEventListener('change', (e) => {
      this._applyFilterAndResetPage('favorite', e.target.checked);
    });
    
    // FILTRO DE ETIQUETAS: Change event para select
    this.elements.tagFilter?.addEventListener('change', (e) => {
      this._applyFilterAndResetPage('tag', e.target.value);
    });
    
    // FILTRO DE CARPETAS: Change event para select
    this.elements.folderFilter?.addEventListener('change', (e) => {
      this._applyFilterAndResetPage('folder', e.target.value);
    });
    
    // FILTRO DE ORDENAMIENTO: Change event para select
    this.elements.orderFilter?.addEventListener('change', (e) => {
      this._applyFilterAndResetPage('order', e.target.value);
    });
    
    // BOTÓN DE LIMPIAR: Click event para reset completo
    this.elements.clearFiltersBtn?.addEventListener('click', () => {
      this._clearAllFilters();
    });
  },

  /**
   * APLICADOR DE FILTRO CON RESET DE PAGINACIÓN
   * 
   * @param {string} filterProperty - Propiedad del estado a actualizar
   * @param {*} value - Nuevo valor para la propiedad
   * 
   * PATRÓN: State update + side effect coordination
   * LÓGICA: Cambio de filtro siempre resetea a página 1 (UX esperado)
   * COORDINACIÓN: Delega renderizado a PaginationController
   * 
   * FLUJO:
   * 1. Actualizar estado interno
   * 2. Reset página a 1 (lógico tras cambiar filtros)
   * 3. Disparar re-renderizado con nuevos filtros
   */
  _applyFilterAndResetPage: function (filterProperty, value) {
    // ACTUALIZACIÓN DE ESTADO: Modifica propiedad específica del filtro
    this.state[filterProperty] = value;
    
    // RESET DE PAGINACIÓN: Vuelve a primera página tras cambiar filtros
    window.PaginationController.page = 1;
    
    // RE-RENDERIZADO: Aplica nuevos filtros y muestra resultados
    window.PaginationController.renderPromptsWithPagination();
  },

  /**
   * LIMPIADOR DE TODOS LOS FILTROS
   * 
   * PROPÓSITO: Reset completo del estado de filtros y sincronización con UI
   * PATRÓN: State reset + UI synchronization + re-render
   * 
   * RESPONSABILIDADES:
   * 1. Resetear estado interno a valores por defecto
   * 2. Resetear página a 1
   * 3. Sincronizar elementos UI con estado limpio
   * 4. Disparar re-renderizado
   * 
   * USO: Botón "Limpiar filtros" y reset automático en importación
   */
  _clearAllFilters: function () {
    // RESET DE ESTADO: Vuelve a valores por defecto (sin filtros)
    this.state = { text: '', favorite: false, tag: '', folder: '', order: '' };
    
    // RESET DE PAGINACIÓN: Vuelve a primera página
    window.PaginationController.page = 1;

    // SINCRONIZACIÓN DE UI: Actualiza elementos DOM para reflejar estado limpio
    if (this.elements.searchInput) this.elements.searchInput.value = '';
    if (this.elements.favFilter) this.elements.favFilter.checked = false;
    if (this.elements.tagFilter) this.elements.tagFilter.value = '';
    if (this.elements.folderFilter) this.elements.folderFilter.value = '';
    if (this.elements.orderFilter) this.elements.orderFilter.value = '';

    // RE-RENDERIZADO: Muestra todos los prompts sin filtros
    window.PaginationController.renderPromptsWithPagination();
  },

  /**
   * GETTER DE ESTADO ACTUAL
   * 
   * @returns {Object} Copia del estado actual de filtros
   * 
   * PATRÓN: Immutable getter para prevenir mutación accidental
   * PROPÓSITO: Proporciona estado de filtros a otros módulos
   * INMUTABILIDAD: Spread operator crea copia defensiva
   * 
   * CONSUMIDORES: PromptsModel.getFilteredPrompts(), ImportExportController
   */
  getCurrentFilters: function () {
    return { ...this.state }; // COPIA DEFENSIVA: Previene mutación externa del estado
  }
};
