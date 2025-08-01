'use strict';

/**
 * CONTROLADOR DE FORMULARIO DE PROMPTS
 * 
 * PROPÓSITO: Gestión del formulario principal de creación de prompts y operaciones globales
 * PATRÓN: Form Controller con validación y coordinación de estado
 * RESPONSABILIDADES:
 * - Manejo de envío del formulario de creación
 * - Validación de datos de entrada
 * - Coordinación con filtros para UX óptima
 * - Gestión de operación destructiva (eliminar todo)
 * - Feedback al usuario sobre operaciones
 * 
 * CARACTERÍSTICAS:
 * - Validación multi-nivel (longitud, carpeta requerida)
 * - Limpieza automática de filtros tras creación
 * - Procesamiento de etiquetas con sanitización
 * - Confirmación para operaciones destructivas
 * - Reset automático del formulario tras éxito
 * 
 * DEPENDENCIAS: window.PromptsModel, window.FoldersModel, window.FiltersController, window.View
 * CONSUMIDORES: Controller principal (inicialización)
 */
window.PromptFormController = {
  /**
   * INICIALIZADOR DEL CONTROLADOR
   * 
   * PATRÓN: Event-driven initialization sin dependency injection
   * EVENTOS CONFIGURADOS:
   * 1. Submit del formulario principal de creación
   * 2. Click del botón de eliminación total
   * 
   * DESACOPLAMIENTO: Los modelos disparan eventos automáticamente
   * ESTRATEGIA: Separación entre creación individual y operaciones globales
   */
  init: function () {
    /**
     * EVENT LISTENER PARA CREACIÓN DE PROMPTS
     * 
     * ELEMENTO: #prompt-form (formulario principal)
     * EVENTO: submit (incluye Enter y click en botón)
     * PROCESAMIENTO: Extracción, validación, creación, feedback
     * 
     * FLUJO COMPLETO:
     * 1. Prevenir envío por defecto
     * 2. Extraer y procesar datos del formulario
     * 3. Validar datos según reglas de negocio
     * 4. Limpiar filtros para mostrar nuevo prompt
     * 5. Crear prompt en modelo
     * 6. Actualizar toda la UI
     * 7. Limpiar formulario
     * 8. Mostrar feedback de éxito
     */
    document.getElementById('prompt-form').addEventListener('submit', async (e) => {
      e.preventDefault(); // PREVENCIÓN: Evita recarga de página

      // EXTRACCIÓN DE DATOS: Referencias a elementos del formulario
      const input = document.getElementById('prompt-input');
      const tagsInput = document.getElementById('tags-input');
      const folderSelect = document.getElementById('folder-select');

      // PROCESAMIENTO DE DATOS: Limpieza y transformación
      const text = input.value.trim();                                    // TEXTO: Limpia espacios
      const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t); // TAGS: Split, trim, filter vacíos
      const folderId = folderSelect.value || null;                        // FOLDER: Convierte string vacío a null

      // VALIDACIÓN: Verifica reglas de negocio antes de proceder
      if (!this._validatePromptData(text, folderId)) {
        return; // EARLY RETURN: Detiene procesamiento si validación falla
      }
      
      if (text) { // VERIFICACIÓN ADICIONAL: Texto no vacío
        // PREPARACIÓN UX: Limpia filtros para mostrar nuevo prompt
        window.FiltersController._clearAllFilters();
        
        // CREACIÓN: Construye objeto prompt con metadatos
        const nuevoPrompt = this._createPromptObject(text, tags, folderId);
        
        // PERSISTENCIA: Añade al modelo (incluye validación y guardado)
        // EVENTO: El modelo disparará PROMPT_ADDED automáticamente
        window.PromptsModel.addPrompt(nuevoPrompt);
        
        // LIMPIEZA: Reset del formulario para próxima entrada
        this._resetPromptForm();
        
        // FEEDBACK: Notifica éxito al usuario
        const messages = window.getLocalizedMessages();
        window.showToast(messages.success.promptCreated, 'success');
      }
    });
    
    /**
     * EVENT LISTENER PARA ELIMINACIÓN TOTAL
     * 
     * ELEMENTO: #delete-all-prompts-btn
     * FUNCIONALIDAD: Elimina todos los prompts y carpetas
     * SEGURIDAD: Confirmación obligatoria para acción destructiva
     * 
     * FLUJO:
     * 1. Mostrar modal de confirmación con advertencia clara
     * 2. Si confirmado, ejecutar eliminación total
     * 3. Mostrar feedback de operación completada
     */
    document.getElementById('delete-all-prompts-btn').addEventListener('click', async () => {
      const messages = window.getLocalizedMessages();
      
      // CONFIRMACIÓN: Modal con advertencia sobre irreversibilidad
      const ok = await window.showConfirmModal(messages.confirm.deleteAll);
      
      if (ok) {
        // ELIMINACIÓN TOTAL: Delegación al Controller principal
        window.Controller._deleteAllData();
        
        // FEEDBACK: Confirma operación completada
        window.showToast(messages.success.allDataCleared, 'success');
      }
    });
  },

  /**
   * VALIDADOR DE DATOS DE PROMPT
   * 
   * @param {string} text Texto del prompt a validar
   * @param {string|null} folderId ID de carpeta seleccionada
   * @returns {boolean} true si datos son válidos, false si hay errores
   * 
   * PATRÓN: Multi-level validation con early returns
   * VALIDACIONES IMPLEMENTADAS:
   * 1. Longitud máxima del texto
   * 2. Existencia de al menos una carpeta
   * 3. Selección obligatoria de carpeta
   * 
   * FEEDBACK: Mensajes específicos para cada tipo de error
   * CONFIGURACIÓN: Usa constantes globales para límites
   */
  _validatePromptData: function (text, folderId) {
    const messages = window.getLocalizedMessages();
    
    // VALIDACIÓN DE LONGITUD: Previene prompts excesivamente largos
    const maxLength = window.CONFIG.MAX_PROMPT_LENGTH;
    if (text.length > maxLength) {
      window.showToast(
        messages.errors.promptTooLong.replace('{max}', maxLength), 
        'error'
      );
      return false;
    }
    
    // VALIDACIÓN DE PREREQUISITOS: Debe existir al menos una carpeta
    if (!window.FoldersModel.folders.length) {
      window.View.showPromptMsg(messages.errors.mustCreateFolder);
      return false;
    }
    
    // VALIDACIÓN DE SELECCIÓN: Carpeta es obligatoria para organización
    if (!folderId) {
      window.showToast(messages.errors.mustSelectFolder, 'error');
      return false;
    }
    
    return true; // SUCCESS: Todos los criterios de validación pasaron
  },

  /**
   * FACTORY DE OBJETOS PROMPT
   * 
   * @param {string} text Contenido del prompt
   * @param {string[]} tags Array de etiquetas procesadas
   * @param {string} folderId ID de carpeta asignada
   * @returns {Object} Objeto prompt completo con metadatos
   * 
   * PATRÓN: Factory method para creación consistente
   * RESPONSABILIDADES:
   * - Generar ID único
   * - Establecer timestamps de creación
   * - Inicializar propiedades por defecto
   * - Estructurar objeto según esquema del modelo
   * 
   * METADATOS GENERADOS:
   * - id: UUID único para identificación
   * - createdAt/updatedAt: Timestamps actuales
   * - favorite: false por defecto
   * - usageCount: 0 inicialmente
   */
  _createPromptObject: function (text, tags, folderId) {
    const now = Date.now(); // TIMESTAMP: Momento actual para metadatos
    const id = window.generateUUID(); // ID ÚNICO: UUID para identificación
    
    // CONSTRUCCIÓN: Objeto con estructura completa del modelo
    return {
      id: id,                    // IDENTIFICADOR: UUID único
      text: text,                // CONTENIDO: Texto del prompt
      tags: tags,                // ETIQUETAS: Array procesado de tags
      favorite: false,           // FAVORITO: false por defecto
      folderId: folderId,        // ORGANIZACIÓN: Carpeta asignada
      createdAt: now,            // METADATO: Timestamp de creación
      updatedAt: now,            // METADATO: Timestamp de última modificación
      usageCount: 0              // ESTADÍSTICA: Contador de usos inicial
    };
  },

  /**
   * RESETEADOR DE FORMULARIO
   * 
   * PROPÓSITO: Limpia formulario tras creación exitosa
   * DELEGACIÓN: View maneja la lógica específica de limpieza
   * UX: Prepara formulario para próxima entrada
   * 
   * FUNCIONALIDADES DELEGADAS:
   * - Limpiar campos de texto
   * - Reset de selectores
   * - Ajustar altura de textarea
   */
  _resetPromptForm: function () {
    window.View.resetPromptForm();
  }
};
