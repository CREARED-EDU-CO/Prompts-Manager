'use strict';

/**
 * CONTROLADOR PRINCIPAL (MVC COORDINATOR)
 * 
 * PROPÓSITO: Coordinador central del patrón MVC que orquesta todos los controladores especializados
 * PATRÓN: Facade Pattern + Coordinator Pattern para gestión de arquitectura compleja
 * RESPONSABILIDADES:
 * - Inicialización secuencial de todos los controladores especializados
 * - Coordinación de actualizaciones globales de vista
 * - Manejo centralizado de formularios de edición
 * - Gestión de operaciones destructivas globales
 * - Propagación de cambios entre componentes del sistema
 * 
 * ARQUITECTURA DE COORDINACIÓN:
 * - Binding de callbacks para comunicación entre controladores
 * - Centralización de lógica de actualización de vistas
 * - Manejo uniforme de formularios de edición (prompts y carpetas)
 * - Abstracción de operaciones complejas para controladores especializados
 * 
 * PATRÓN MVC IMPLEMENTADO:
 * - Model: PromptsModel, FoldersModel (datos y lógica de negocio)
 * - View: View object (renderizado y manipulación DOM)
 * - Controller: Este objeto + controladores especializados (lógica de aplicación)
 * 
 * DEPENDENCIAS: Todos los controladores especializados, View, Models
 * CONSUMIDORES: App.js (inicialización), controladores especializados (callbacks)
 */
window.Controller = {
  /**
   * INICIALIZADOR DEL CONTROLADOR PRINCIPAL
   * 
   * PATRÓN: Orchestrated initialization con dependency injection
   * ESTRATEGIA: Inicialización secuencial con binding de callbacks
   * 
   * ORDEN DE INICIALIZACIÓN:
   * 1. Controladores que requieren callback de actualización
   * 2. Controladores independientes (FiltersController, PaginationController)
   * 3. Renderizado inicial completo
   * 
   * CALLBACK BINDING: this.updateAllViews.bind(this) para mantener contexto
   * COORDINACIÓN: Cada controlador recibe callback para disparar actualizaciones globales
   */
  init: function () {
    /**
     * INICIALIZACIÓN DE CONTROLADORES CON CALLBACK
     * 
     * PATRÓN: Dependency injection de callback para coordinación
     * PROPÓSITO: Controladores pueden disparar actualizaciones globales
     * BINDING: .bind(this) preserva contexto del Controller principal
     */

    // FORMULARIO PRINCIPAL: Creación de prompts con actualización global
    window.PromptFormController.init(this.updateAllViews.bind(this));

    // CONTENEDOR DE PROMPTS: Interacciones CRUD con actualización global
    window.PromptContainerController.init(this.updateAllViews.bind(this));

    // FILTROS: Inicialización independiente (maneja su propia coordinación)
    window.FiltersController.init();

    // CARPETAS: CRUD de carpetas con actualización global
    window.FoldersController.init(this.updateAllViews.bind(this));

    // IMPORTACIÓN/EXPORTACIÓN: I/O de archivos con actualización global
    window.ImportExportController.init(this.updateAllViews.bind(this));

    // PAGINACIÓN: Inicialización independiente (coordinado via FiltersController)
    window.PaginationController.init();

    // RENDERIZADO INICIAL: Muestra estado inicial de la aplicación
    this.updateAllViews();
  },

  /**
   * ACTUALIZADOR GLOBAL DE VISTAS
   * 
   * PROPÓSITO: Sincronización completa de todos los componentes visuales tras cambios de datos
   * PATRÓN: Batch update pattern para evitar renders parciales inconsistentes
   * USO: Llamado tras operaciones que afectan múltiples componentes
   * 
   * COMPONENTES ACTUALIZADOS:
   * 1. Reset de paginación a página 1 (lógico tras cambios de datos)
   * 2. Re-renderizado de prompts con filtros y paginación
   * 3. Actualización de filtro de etiquetas (opciones dinámicas)
   * 4. Actualización de selector de carpetas (formulario de creación)
   * 5. Actualización de filtro de carpetas (opciones dinámicas)
   * 6. Re-renderizado de lista de carpetas con conteos
   * 
   * ORDEN CRÍTICO: Paginación primero, luego componentes dependientes
   * PERFORMANCE: Batch update evita múltiples reflows/repaints
   */
  updateAllViews: function () {
    // RESET DE PAGINACIÓN: Vuelve a página 1 tras cambios de datos
    window.PaginationController.page = 1;

    // RENDERIZADO PRINCIPAL: Prompts con filtros y paginación aplicados
    window.PaginationController.renderPromptsWithPagination();

    // ACTUALIZACIÓN DE FILTROS DINÁMICOS: Opciones basadas en datos actuales
    window.View.updateTagFilter(window.PromptsModel.prompts);        // Tags disponibles
    window.View.updateFolderSelect(window.FoldersModel.folders);     // Selector de creación
    window.View.updateFolderFilter(window.FoldersModel.folders);     // Filtro de carpetas

    // RENDERIZADO DE CARPETAS: Lista con conteos de prompts por carpeta
    window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts);
  },

  /**
   * MANEJADOR DE ENVÍO DE FORMULARIO DE EDICIÓN DE PROMPT
   * 
   * @param {string} id ID del prompt a editar
   * @param {HTMLFormControlsCollection} formElements Elementos del formulario
   * @returns {boolean} true si edición exitosa, false si error
   * 
   * PATRÓN: Extract + Validate + Update + Feedback + Sync
   * RESPONSABILIDADES:
   * - Extracción y procesamiento de datos del formulario
   * - Validación de reglas de negocio
   * - Actualización del modelo con persistencia
   * - Feedback al usuario sobre resultado
   * - Sincronización de componentes dependientes
   * 
   * VALIDACIONES:
   * - Carpeta obligatoria (regla de negocio)
   * - Texto no vacío (validación básica)
   * 
   * PROCESAMIENTO DE DATOS:
   * - Trim de espacios en texto
   * - Split y procesamiento de etiquetas
   * - Conversión de string vacío a null para carpeta
   */
  _handleEditPromptSubmit: function (id, formElements) {
    const messages = window.getLocalizedMessages();

    // EXTRACCIÓN DE DATOS: Procesamiento de elementos del formulario
    const text = formElements['edit-text'].value.trim();                                    // TEXTO: Limpia espacios
    const tags = formElements['edit-tags'].value.split(',').map(t => t.trim()).filter(t => t); // TAGS: Split, trim, filter vacíos
    const folderId = formElements['edit-folder'].value || null;                             // CARPETA: Convierte vacío a null

    // VALIDACIÓN DE CARPETA: Obligatoria para organización
    if (!folderId) {
      window.showToast(messages.errors.mustSelectFolderEdit, 'error');
      return false; // EARLY RETURN: Detiene procesamiento si validación falla
    }

    // VALIDACIÓN DE TEXTO: Debe tener contenido
    if (text) {
      // ACTUALIZACIÓN: Modifica prompt en modelo con persistencia automática
      window.PromptsModel.editPrompt(id, { text, tags, folderId });

      // FEEDBACK: Notifica éxito al usuario
      window.showToast(messages.success.promptEdited, 'success');

      // SINCRONIZACIÓN PARCIAL: Actualiza componentes afectados por cambio de tags/carpetas
      window.View.updateTagFilter(window.PromptsModel.prompts);        // Nuevas etiquetas disponibles
      window.View.updateFolderFilter(window.FoldersModel.folders);     // Filtro de carpetas
      window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts); // Conteos actualizados

      return true; // SUCCESS: Edición completada exitosamente
    }

    return false; // FAILURE: Texto vacío no válido
  },

  /**
   * MANEJADOR DE ENVÍO DE FORMULARIO DE EDICIÓN DE CARPETA
   * 
   * @param {string} id ID de la carpeta a editar
   * @param {HTMLFormControlsCollection} formElements Elementos del formulario
   * @returns {boolean} true si edición exitosa, false si error
   * 
   * PATRÓN: Extract + Validate + Update + Sync (más simple que prompts)
   * RESPONSABILIDADES:
   * - Extracción del nuevo nombre
   * - Validación básica (nombre no vacío)
   * - Actualización del modelo con validación de unicidad
   * - Sincronización de todos los selectores que usan carpetas
   * 
   * SIMPLICIDAD: Menos validaciones que prompts (solo nombre requerido)
   * SINCRONIZACIÓN: Actualiza todos los componentes que muestran carpetas
   */
  _handleEditFolderSubmit: function (id, formElements) {
    // EXTRACCIÓN: Nuevo nombre con limpieza de espacios
    const newName = formElements['edit-folder-name'].value.trim();

    if (newName) {
      // ACTUALIZACIÓN: Modelo maneja validación de unicidad y persistencia
      window.FoldersModel.editFolder(id, newName);

      // SINCRONIZACIÓN COMPLETA: Todos los selectores que usan carpetas
      window.View.updateFolderSelect(window.FoldersModel.folders);     // Selector de creación de prompts
      window.View.updateFolderFilter(window.FoldersModel.folders);     // Filtro de carpetas
      window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts); // Lista visual

      return true; // SUCCESS: Edición completada
    }

    return false; // FAILURE: Nombre vacío no válido
  },

  /**
   * MANEJADOR PÚBLICO DE FORMULARIOS DE EDICIÓN
   * 
   * @param {Event} e Evento de submit del formulario
   * @param {string} type Tipo de entidad ('prompt' | 'folder')
   * @returns {boolean} true si edición exitosa, false si error
   * 
   * PATRÓN: Polymorphic handler + Strategy pattern por tipo
   * PROPÓSITO: Punto de entrada unificado para todos los formularios de edición
   * RESPONSABILIDADES:
   * - Prevención de comportamiento por defecto del formulario
   * - Extracción de ID de la entidad a editar
   * - Delegación a manejador específico según tipo
   * - Gestión de estado post-edición (solo para prompts)
   * - Optimización de renderizado según contexto
   * 
   * OPTIMIZACIÓN INTELIGENTE:
   * - Si hay filtros activos: re-renderizado completo
   * - Si no hay filtros: reemplazo DOM local (más eficiente)
   * 
   * USO: Llamado desde controladores especializados via event delegation
   */
  handleEditFormSubmit: function (e, type) {
    // PREVENCIÓN: Evita comportamiento por defecto del formulario
    e.preventDefault();
    e.stopPropagation(); // PREVENCIÓN: Evita bubbling del evento

    // EXTRACCIÓN: ID de la entidad desde data attribute
    const id = e.target.getAttribute('data-id');
    let success = false;

    // DELEGACIÓN POR TIPO: Strategy pattern para diferentes entidades
    if (type === 'prompt') {
      // PROCESAMIENTO: Delega a manejador específico de prompts
      success = this._handleEditPromptSubmit(id, e.target.elements);

      if (success) {
        // LIMPIEZA DE ESTADO: Marca que no hay prompt en edición
        window.View.editingPromptId = null;

        /**
         * OPTIMIZACIÓN INTELIGENTE DE RENDERIZADO
         * 
         * LÓGICA: Decide entre re-renderizado completo vs reemplazo local
         * CRITERIOS:
         * - Filtros activos: Requiere re-renderizado completo
         * - Sin filtros: Permite optimización con reemplazo DOM local
         * 
         * PERFORMANCE: Reemplazo local es más eficiente para casos simples
         */
        const currentFilters = window.FiltersController.getCurrentFilters();
        const hasOrderFilter = currentFilters.order && currentFilters.order !== '';
        const hasOtherFilters = currentFilters.text || currentFilters.favorite ||
          currentFilters.tag || currentFilters.folder;

        if (hasOrderFilter || hasOtherFilters) {
          // CASO COMPLEJO: Filtros activos requieren re-renderizado completo
          window.PaginationController.renderPromptsWithPagination();
        } else {
          // CASO SIMPLE: Optimización con reemplazo DOM local
          const formElement = e.target;
          const prompt = window.PromptsModel.prompts.find(p => p.id === id);

          if (prompt) {
            // PREPARACIÓN: Mapa de carpetas para renderizado
            const folderMap = (window.FoldersModel.folders || []).reduce((acc, f) => {
              acc[f.id] = f.name;
              return acc;
            }, {});

            // RENDERIZADO LOCAL: Crea elemento de display actualizado
            const promptElement = window.View._renderPromptDisplay(prompt, folderMap);

            // REEMPLAZO: Sustituye formulario por elemento actualizado (API moderna)
            formElement.replaceWith(promptElement);
          }
        }
      }
    } else if (type === 'folder') {
      // PROCESAMIENTO: Delega a manejador específico de carpetas
      success = this._handleEditFolderSubmit(id, e.target.elements);
      // NOTA: Carpetas siempre requieren actualización completa (menos común)
    }

    return success; // RESULTADO: Indica si operación fue exitosa
  },

  /**
   * MANEJADOR CENTRALIZADO DE ERRORES CON TOAST
   * 
   * @param {Error} error Objeto error capturado
   * @param {string} msg Mensaje base para mostrar al usuario
   * @param {Object} opts Opciones adicionales para el toast
   * 
   * PATRÓN: Centralized error handling con message composition
   * PROPÓSITO: Punto único para manejo de errores con feedback consistente
   * COMPOSICIÓN: Combina mensaje base con detalles del error si están disponibles
   * 
   * FUNCIONALIDADES:
   * - Concatenación inteligente de mensajes
   * - Delegación a sistema de errores global
   * - Preservación de opciones de configuración
   * 
   * USO: Llamado desde controladores especializados para errores complejos
   */
  _handleErrorAndToast: function (error, msg, opts = {}) {
    // COMPOSICIÓN DE MENSAJE: Combina mensaje base con detalles del error
    const fullMessage = msg + (error && error.message ? ': ' + error.message : '');

    // DELEGACIÓN: Usa sistema global de manejo de errores
    window.showError(fullMessage, opts);
  },

  /**
   * ELIMINADOR TOTAL DE DATOS (OPERACIÓN DESTRUCTIVA)
   * 
   * PROPÓSITO: Reset completo de la aplicación a estado inicial
   * PATRÓN: Nuclear option para limpieza total
   * ALCANCE: Elimina todos los datos de modelos y localStorage
   * 
   * OPERACIONES DESTRUCTIVAS:
   * 1. Vaciar array de prompts en memoria
   * 2. Vaciar array de carpetas en memoria
   * 3. Eliminar todas las claves de localStorage
   * 4. Actualizar todas las vistas para reflejar estado vacío
   * 
   * SEGURIDAD: Solo llamado tras confirmación explícita del usuario
   * IRREVERSIBILIDAD: No hay mecanismo de undo para esta operación
   * 
   * USO: Botón "Eliminar todo" en PromptFormController
   */
  _deleteAllData: function () {
    // LIMPIEZA DE MODELOS: Vacía arrays en memoria
    window.PromptsModel.prompts = [];   // PROMPTS: Array vacío
    window.FoldersModel.folders = [];   // CARPETAS: Array vacío

    // LIMPIEZA DE PERSISTENCIA: Elimina todas las claves de localStorage
    Object.values(window.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    // ACTUALIZACIÓN GLOBAL: Re-renderiza toda la aplicación en estado vacío
    this.updateAllViews();
  }
};
