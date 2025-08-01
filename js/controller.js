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
   * PATRÓN: Event-driven architecture con desacoplamiento completo
   * ESTRATEGIA: Inicialización de controladores + configuración de event listeners
   * 
   * ORDEN DE INICIALIZACIÓN:
   * 1. Configuración de event listeners para desacoplamiento
   * 2. Inicialización de controladores especializados
   * 3. Renderizado inicial completo
   * 
   * DESACOPLAMIENTO: Los modelos disparan eventos, Controller escucha y coordina
   * ARQUITECTURA: Observer pattern para comunicación inter-módulos
   */
  init: function () {
    // CONFIGURACIÓN DE EVENT LISTENERS: Desacoplamiento arquitectónico
    this._setupEventListeners();
    /**
     * INICIALIZACIÓN DE CONTROLADORES DESACOPLADOS
     * 
     * PATRÓN: Event-driven initialization sin dependency injection
     * PROPÓSITO: Controladores independientes que reaccionan a eventos
     * DESACOPLAMIENTO: No necesitan callbacks, escuchan eventos del EventBus
     */

    // FORMULARIO PRINCIPAL: Creación de prompts (eventos automáticos)
    window.PromptFormController.init();

    // CONTENEDOR DE PROMPTS: Interacciones CRUD (eventos automáticos)
    window.PromptContainerController.init();

    // FILTROS: Inicialización independiente (maneja su propia coordinación)
    window.FiltersController.init();

    // CARPETAS: CRUD de carpetas (eventos automáticos)
    window.FoldersController.init();

    // IMPORTACIÓN/EXPORTACIÓN: I/O de archivos (eventos automáticos)
    window.ImportExportController.init();

    // PAGINACIÓN: Inicialización independiente (coordinado via FiltersController)
    window.PaginationController.init();

    // RENDERIZADO INICIAL: Muestra estado inicial de la aplicación
    this.updateAllViews();
  },

  /**
   * CONFIGURADOR DE EVENT LISTENERS
   * 
   * PROPÓSITO: Desacoplamiento arquitectónico mediante Observer pattern
   * PATRÓN: Centralized event handling para coordinación de actualizaciones
   * ESCALABILIDAD: Fácil añadir nuevos listeners sin modificar modelos
   * 
   * EVENTOS ESCUCHADOS:
   * - PROMPT_*: Actualizaciones de vista tras operaciones de prompts
   * - FOLDER_*: Actualizaciones de vista tras operaciones de carpetas
   * - DATA_*: Actualizaciones globales tras importación/exportación
   * 
   * BENEFICIOS:
   * - Modelos no conocen la vista (desacoplamiento)
   * - Fácil extensión para analytics, logging, etc.
   * - Debugging mejorado con trazabilidad de eventos
   */
  _setupEventListeners: function () {
    // EVENTOS DE PROMPTS: Actualizaciones tras operaciones CRUD
    window.EventBus.on(window.EVENTS.PROMPT_CREATED, () => {
      this.updateAllViews();
    });

    window.EventBus.on(window.EVENTS.PROMPT_UPDATED, () => {
      this.updateAllViews();
    });

    window.EventBus.on(window.EVENTS.PROMPT_REMOVED, () => {
      this.updateAllViews();
    });

    window.EventBus.on(window.EVENTS.PROMPT_FAVORITED, () => {
      // OPTIMIZACIÓN: Solo re-renderizar prompts, no todos los filtros
      window.PaginationController.renderPromptsWithPagination();
    });

    window.EventBus.on(window.EVENTS.PROMPT_COPIED, (data) => {
      // ANALYTICS: Logging de uso para estadísticas
      // analytics.track('prompt_copied', { id: data.id, usageCount: data.usageCount });
      
      // ACTUALIZACIÓN GRANULAR: Solo actualiza el contador de uso sin re-renderizar todo
      // TIMING: Retraso para permitir que termine el feedback visual del botón (1000ms)
      setTimeout(() => {
        this._updateUsageCountDisplay(data.id, data.usageCount);
      }, 1000);
    });

    // EVENTOS DE CARPETAS: Actualizaciones tras operaciones CRUD
    window.EventBus.on(window.EVENTS.FOLDER_CREATED, () => {
      this.updateAllViews();
    });

    window.EventBus.on(window.EVENTS.FOLDER_UPDATED, () => {
      this.updateAllViews();
    });

    window.EventBus.on(window.EVENTS.FOLDER_REMOVED, () => {
      this.updateAllViews();
    });

    // EVENTOS DE DATOS: Actualizaciones tras importación/exportación
    window.EventBus.on(window.EVENTS.DATA_IMPORTED, () => {
      this.updateAllViews();
    });

    window.EventBus.on(window.EVENTS.DATA_EXPORTED, (data) => {
      // FEEDBACK: Notificación de exportación exitosa
      const messages = window.getLocalizedMessages();
      window.showToast(messages.success.dataExported, 'success');
    });
  },

  /**
   * ACTUALIZADOR GLOBAL DE VISTAS
   * 
   * PROPÓSITO: Sincronización completa de todos los componentes visuales tras cambios de datos
   * PATRÓN: Batch update pattern para evitar renders parciales inconsistentes
   * USO: Llamado tras operaciones que afectan múltiples componentes
   * 
   * COMPONENTES:
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
   * - Limpieza de estado de edición (antes del evento)
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
      // LIMPIEZA DE ESTADO: Marca que no hay prompt en edición ANTES de actualizar modelo
      // CRÍTICO: Debe hacerse antes del evento PROMPT_EDITED para que updateAllViews()
      // renderice el prompt en modo display, no en modo edición
      window.View.editingPromptId = null;

      // ACTUALIZACIÓN: Modifica prompt en modelo con persistencia automática
      window.PromptsModel.editPrompt(id, { text, tags, folderId });

      // FEEDBACK: Notifica éxito al usuario
      window.showToast(messages.success.promptUpdated, 'success');

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
        // NOTA: La limpieza de estado (editingPromptId = null) ya se hace en _handleEditPromptSubmit
        // NOTA: La actualización de vista se maneja automáticamente via evento PROMPT_EDITED
        
        /**
         * OPTIMIZACIÓN INTELIGENTE DE RENDERIZADO (DESHABILITADA)
         * 
         * RAZÓN: Con arquitectura event-driven, el evento PROMPT_EDITED ya dispara updateAllViews()
         * automáticamente, por lo que no necesitamos lógica de renderizado manual aquí.
         * El evento se encarga de toda la actualización de vista de manera consistente.
         */
        
        // La actualización de vista se maneja automáticamente via evento PROMPT_EDITED
        // No se requiere lógica adicional de renderizado aquí
      }
    } else if (type === 'folder') {
      // PROCESAMIENTO: Delega a manejador específico de carpetas
      success = this._handleEditFolderSubmit(id, e.target.elements);
      // NOTA: Carpetas siempre requieren actualización completa (menos común)
    }

    return success; // RESULTADO: Indica si operación fue exitosa
  },

  /**
   * MAPEADOR DE EVENTOS A MENSAJES UI
   * 
   * @param {string} eventName Nombre del evento técnico
   * @returns {string|null} Clave del mensaje UI correspondiente o null
   * 
   * PROPÓSITO: Mapeo centralizado entre eventos técnicos y mensajes de usuario
   * PATRÓN: Strategy pattern para desacoplamiento semántico
   * ESCALABILIDAD: Permite eventos sin mensajes y mensajes sin eventos
   * 
   * USO FUTURO: Para automatizar feedback basado en eventos
   * EJEMPLO: this._showEventFeedback(EVENTS.PROMPT_CREATED)
   */
  _mapEventToMessage: function(eventName) {
    const eventToMessageMap = {
      [window.EVENTS.PROMPT_CREATED]: window.UI_MESSAGES.SUCCESS.PROMPT_CREATED,
      [window.EVENTS.PROMPT_UPDATED]: window.UI_MESSAGES.SUCCESS.PROMPT_UPDATED,
      [window.EVENTS.PROMPT_REMOVED]: window.UI_MESSAGES.SUCCESS.PROMPT_REMOVED,
      [window.EVENTS.PROMPT_COPIED]: window.UI_MESSAGES.SUCCESS.PROMPT_COPIED,
      [window.EVENTS.FOLDER_CREATED]: window.UI_MESSAGES.SUCCESS.FOLDER_CREATED,
      [window.EVENTS.FOLDER_UPDATED]: window.UI_MESSAGES.SUCCESS.FOLDER_UPDATED,
      [window.EVENTS.FOLDER_REMOVED]: window.UI_MESSAGES.SUCCESS.FOLDER_REMOVED,
      [window.EVENTS.DATA_IMPORTED]: window.UI_MESSAGES.SUCCESS.DATA_IMPORTED,
      [window.EVENTS.DATA_EXPORTED]: window.UI_MESSAGES.SUCCESS.DATA_EXPORTED
    };
    
    return eventToMessageMap[eventName] || null;
  },

  /**
   * ACTUALIZADOR GRANULAR DE CONTADOR DE USO
   * 
   * @param {string} promptId ID del prompt cuyo contador actualizar
   * @param {number} usageCount Nuevo valor del contador de uso
   * 
   * PROPÓSITO: Actualiza solo el contador de uso sin re-renderizar todo el prompt
   * PATRÓN: Granular DOM update para mejor performance y UX
   * USO: Llamado tras evento PROMPT_USED con retraso para preservar feedback visual
   * 
   * MECÁNICA:
   * 1. Busca el elemento del prompt por data-id
   * 2. Busca el span del contador de uso dentro del prompt
   * 3. Actualiza solo el texto del contador
   * 4. Maneja casos donde el elemento no existe (prompt no visible)
   */
  _updateUsageCountDisplay: function(promptId, usageCount) {
    // BÚSQUEDA: Encuentra el elemento del prompt por data-id
    const promptElement = document.querySelector(`[data-id="${promptId}"]`);
    if (!promptElement) {
      // CASO: Prompt no está en la página actual (paginación)
      return;
    }
    
    // BÚSQUEDA: Encuentra el span del contador de uso dentro del prompt
    const usageSpan = promptElement.querySelector('.usage');
    if (!usageSpan) {
      // CASO: Prompt no tiene contador de uso visible
      return;
    }
    
    // ACTUALIZACIÓN: Solo el texto del contador, preservando el resto del prompt
    const messages = window.getLocalizedMessages();
    const dict = messages.ui;
    usageSpan.textContent = `${dict.usages} ${usageCount}`;
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
