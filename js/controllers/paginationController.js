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
 * CONTROLADOR DE PAGINACIÓN
 * 
 * PROPÓSITO: Gestión de navegación por páginas para grandes conjuntos de datos
 * PATRÓN: Controller Pattern con estado interno y delegación a View
 * RESPONSABILIDADES:
 * - Mantener estado de página actual y elementos por página
 * - Manejar eventos de navegación (botones, selector)
 * - Coordinar con View para renderizado paginado
 * - Optimizar performance limitando elementos DOM
 * 
 * BENEFICIOS:
 * - Mejora performance con grandes datasets
 * - Reduce carga DOM y tiempo de renderizado
 * - Proporciona navegación intuitiva
 * - Configurable elementos por página
 * 
 * DEPENDENCIAS: window.View, window.PromptsModel, window.FiltersController
 * CONSUMIDORES: Controller principal, FiltersController
 */
window.PaginationController = {
  /**
   * ESTADO DE PAGINACIÓN
   * 
   * page: Página actual (1-indexed)
   * itemsPerPage: Número de elementos por página
   * elements: Cache de referencias DOM para performance
   */
  page: 1,
  itemsPerPage: 10,
  elements: {
    paginationSection: null, // Contenedor principal de controles de paginación
  },

  /**
   * INICIALIZADOR DEL CONTROLADOR
   * 
   * RESPONSABILIDAD: Setup de event listeners y referencias DOM
   * PATRÓN: Initialization method con delegación a métodos específicos
   */
  init: function () {
    this.initEvents();
  },

  /**
   * CONFIGURADOR DE EVENT LISTENERS
   * 
   * PATRÓN: Event delegation para performance con elementos dinámicos
   * ESTRATEGIA: Un listener por contenedor que maneja múltiples tipos de eventos
   * 
   * EVENTOS MANEJADOS:
   * - click: Botones de navegación (anterior, siguiente, números)
   * - change: Selector de elementos por página
   * 
   * VALIDACIÓN: Parsing seguro de atributos data-* con verificación NaN
   */
  initEvents: function () {
    // CACHE DE REFERENCIA DOM: Para evitar querySelector repetidos
    this.elements.paginationSection = document.getElementById('pagination-section');
    if (!this.elements.paginationSection) {
      window.showError('Error: Elemento #pagination-section no encontrado.');
      return;
    }
    
    /**
     * EVENT LISTENER PARA NAVEGACIÓN DE PÁGINAS
     * 
     * PATRÓN: Event delegation con class-based filtering
     * TARGET: Botones con clase 'page-btn' (anterior, siguiente, números)
     * VALIDACIÓN: parseInt con verificación NaN para seguridad
     */
    this.elements.paginationSection.addEventListener('click', (e) => {
      if (e.target.classList.contains('page-btn')) {
        // EXTRACCIÓN SEGURA: data-page attribute con validación
        const page = parseInt(e.target.getAttribute('data-page'), 10);
        if (!isNaN(page)) {
          this._setPageAndRender(page);
        }
      }
    });

    /**
     * EVENT LISTENER PARA SELECTOR DE ELEMENTOS POR PÁGINA
     * 
     * PATRÓN: ID-based filtering para elemento específico
     * FUNCIONALIDAD: Cambia número de elementos mostrados por página
     * SIDE EFFECT: Reset a página 1 cuando cambia elementos por página
     */
    this.elements.paginationSection.addEventListener('change', (e) => {
      if (e.target.id === 'per-page-select') {
        // EXTRACCIÓN SEGURA: value con parsing y validación
        const itemsPerPage = parseInt(e.target.value, 10);
        if (!isNaN(itemsPerPage)) {
          this._setItemsPerPageAndRender(itemsPerPage);
        }
      }
    });
  },

  /**
   * RENDERIZADOR PRINCIPAL CON PAGINACIÓN
   * 
   * PROPÓSITO: Coordina renderizado de prompts con estado de paginación actual
   * DELEGACIÓN: Pasa parámetros de paginación a View.renderPrompts()
   * 
   * PARÁMETROS PASADOS:
   * - prompts: Datos completos desde modelo
   * - filters: Estado actual de filtros
   * - page: Página actual
   * - itemsPerPage: Elementos por página
   * 
   * PATRÓN: Facade method que simplifica llamada compleja
   */
  renderPromptsWithPagination: function () {
    window.View.renderPrompts(
      window.PromptsModel.prompts,     // DATOS: Array completo de prompts
      window.FiltersController.state,  // FILTROS: Estado actual de filtros
      this.page,                       // PAGINACIÓN: Página actual
      this.itemsPerPage               // PAGINACIÓN: Elementos por página
    );
  },

  /**
   * SETTER DE PÁGINA CON RE-RENDERIZADO
   * 
   * @param {number} page Nueva página a mostrar
   * 
   * PATRÓN: State update + side effect
   * RESPONSABILIDADES:
   * 1. Actualizar estado interno
   * 2. Disparar re-renderizado
   * 
   * USO: Navegación entre páginas (botones anterior/siguiente/números)
   */
  _setPageAndRender: function (page) {
    this.page = page;
    this.renderPromptsWithPagination();
  },

  /**
   * SETTER DE ELEMENTOS POR PÁGINA CON RE-RENDERIZADO
   * 
   * @param {number} itemsPerPage Nuevo número de elementos por página
   * 
   * PATRÓN: State update + reset + side effect
   * RESPONSABILIDADES:
   * 1. Actualizar elementos por página
   * 2. Reset a página 1 (lógico tras cambiar tamaño)
   * 3. Disparar re-renderizado
   * 
   * USO: Cambio en selector de elementos por página
   * LÓGICA: Reset a página 1 previene páginas vacías tras reducir elementos
   */
  _setItemsPerPageAndRender: function (itemsPerPage) {
    this.itemsPerPage = itemsPerPage;
    this.page = 1; // RESET: Vuelve a primera página tras cambiar tamaño
    this.renderPromptsWithPagination();
  }
};
