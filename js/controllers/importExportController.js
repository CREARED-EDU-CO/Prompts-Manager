'use strict';

/**
 * CONTROLADOR DE IMPORTACIÓN/EXPORTACIÓN
 * 
 * PROPÓSITO: Gestión de operaciones de I/O de archivos JSON para backup y compartición
 * PATRÓN: File I/O Controller con manejo asíncrono y validación de datos
 * RESPONSABILIDADES:
 * - Exportación de datos filtrados a JSON
 * - Importación con validación de esquema
 * - Manejo de File System Access API con fallbacks
 * - Gestión de modal de elección de importación
 * - Coordinación con filtros para exportación selectiva
 * 
 * CARACTERÍSTICAS AVANZADAS:
 * - Exportación filtrada (solo prompts visibles)
 * - Dos modos de importación (reemplazar/fusionar)
 * - Validación robusta de estructura de datos
 * - Manejo de errores de I/O con feedback al usuario
 * - Soporte para File System Access API moderno
 * 
 * DEPENDENCIAS: window.FiltersController, window.PromptsModel, window.FoldersModel, window.View
 * CONSUMIDORES: Controller principal (inicialización)
 */
window.ImportExportController = {
  /**
   * INICIALIZADOR DEL CONTROLADOR
   * 
   * @param {Function} renderAndUpdateFiltersCb Callback para actualización global tras importación
   * 
   * PATRÓN: Event binding para operaciones de archivo
   * ESTRATEGIA: Separación entre triggers de UI y lógica de I/O
   * 
   * EVENTOS CONFIGURADOS:
   * 1. Click en botón de exportación
   * 2. Click en botón de importación (trigger de file picker)
   * 3. Change en input de archivo (procesamiento de archivo seleccionado)
   */
  init: function (renderAndUpdateFiltersCb) {
    /**
     * EVENT LISTENER PARA EXPORTACIÓN
     * 
     * ELEMENTO: #export-json-btn
     * FUNCIONALIDAD: Exporta datos filtrados a archivo JSON
     * DELEGACIÓN: Método privado maneja toda la lógica de exportación
     */
    document.getElementById('export-json-btn').addEventListener('click', () => {
      this._exportToJson();
    });

    /**
     * EVENT LISTENER PARA TRIGGER DE IMPORTACIÓN
     * 
     * ELEMENTO: #import-json-btn
     * FUNCIONALIDAD: Limpia filtros y activa file picker oculto
     * PREPARACIÓN: Reset de filtros para mostrar todos los datos tras importación
     */
    document.getElementById('import-json-btn').addEventListener('click', () => {
      // PREPARACIÓN: Limpia filtros para mostrar datos importados
      this._resetFiltersForImport();
      // TRIGGER: Activa file picker oculto
      document.getElementById('import-json-input').click();
    });

    /**
     * EVENT LISTENER PARA PROCESAMIENTO DE ARCHIVO
     * 
     * ELEMENTO: #import-json-input (input file oculto)
     * EVENTO: change (cuando usuario selecciona archivo)
     * PROCESAMIENTO: FileReader API para lectura asíncrona
     * 
     * FLUJO ASÍNCRONO:
     * 1. Validar que hay archivo seleccionado
     * 2. Crear FileReader para procesamiento
     * 3. Configurar handlers de éxito y error
     * 4. Iniciar lectura como texto
     * 5. Limpiar input para permitir re-selección del mismo archivo
     */
    document.getElementById('import-json-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return; // EARLY RETURN: Sin archivo seleccionado

      // CREACIÓN DE READER: FileReader para procesamiento asíncrono
      const reader = new FileReader();
      
      /**
       * HANDLER DE ÉXITO DE LECTURA
       * 
       * RESPONSABILIDADES:
       * 1. Parsear JSON del archivo
       * 2. Validar estructura de datos
       * 3. Mostrar modal de elección de importación
       * 4. Manejo de errores de parsing
       */
      reader.onload = (evt) => {
        try {
          // PARSING: Convierte texto a objeto JavaScript
          const data = JSON.parse(evt.target.result);
          
          // VALIDACIÓN: Verifica estructura antes de proceder
          if (this._validateImportData(data)) {
            // MODAL: Muestra opciones de importación (reemplazar/fusionar)
            this._setupImportChoicePanel(data, renderAndUpdateFiltersCb);
          }
        } catch (err) {
          // ERROR DE PARSING: JSON malformado o corrupto
          window.Controller._handleErrorAndToast(err, 'Error al leer el archivo JSON');
        }
      };
      
      /**
       * HANDLER DE ERROR DE LECTURA
       * 
       * CASOS: Archivo corrupto, permisos, I/O errors
       */
      reader.onerror = (err) => {
        window.Controller._handleErrorAndToast(err, 'Error de lectura del archivo');
      };
      
      // INICIO DE LECTURA: Procesa archivo como texto UTF-8
      reader.readAsText(file);
      
      // LIMPIEZA: Permite re-selección del mismo archivo
      e.target.value = '';
    });
  },

  /**
   * EXPORTADOR DE DATOS A JSON
   * 
   * PATRÓN: Progressive enhancement con fallback para compatibilidad
   * CARACTERÍSTICAS:
   * - Exportación filtrada (solo prompts visibles)
   * - Nombre de archivo automático con fecha
   * - File System Access API moderno con fallback
   * - Formato JSON legible (indentado)
   * 
   * FLUJO DE EXPORTACIÓN:
   * 1. Obtener datos filtrados
   * 2. Generar nombre de archivo con fecha
   * 3. Intentar File System Access API moderno
   * 4. Fallback a descarga tradicional si no disponible
   * 5. Feedback al usuario sobre éxito/error
   */
  _exportToJson: async function () {
    // OBTENCIÓN DE DATOS: Solo prompts visibles según filtros actuales
    const prompts = window.PromptsModel.getFilteredPrompts(
      window.PromptsModel.prompts,
      window.FiltersController.getCurrentFilters()
    );
    
    // ESTRUCTURA DE DATOS: Objeto con carpetas y prompts filtrados
    const data = { folders: window.FoldersModel.folders, prompts: prompts };
    
    // GENERACIÓN DE NOMBRE: Formato prompts-export-YYYY-MM-DD.json
    const today = new Date();
    const dateString = today.getFullYear() + '-' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(today.getDate()).padStart(2, '0');
    const filename = `prompts-export-${dateString}.json`;
    
    try {
      // SERIALIZACIÓN: JSON con indentación para legibilidad
      const jsonString = JSON.stringify(data, null, 2);
      
      /**
       * MÉTODO MODERNO: File System Access API
       * 
       * VENTAJAS:
       * - Usuario elige ubicación de guardado
       * - Mejor UX que descarga automática
       * - Control total sobre el proceso
       * 
       * COMPATIBILIDAD: Chrome 86+, Edge 86+
       */
      if ('showSaveFilePicker' in window) {
        try {
          // PICKER DE GUARDADO: Permite al usuario elegir ubicación
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'JSON files',
              accept: { 'application/json': ['.json'] }
            }]
          });
          
          // ESCRITURA: Stream de escritura para archivos grandes
          const writable = await fileHandle.createWritable();
          await writable.write(jsonString);
          await writable.close();
          
          // FEEDBACK: Notificación de éxito
          const messages = window.getLocalizedMessages();
          window.showToast(messages.ui.exportSuccess, 'success');
          return; // SUCCESS: Termina aquí si API moderna funciona
          
        } catch (err) {
          // MANEJO DE CANCELACIÓN: Usuario cancela dialog
          if (err.name === 'AbortError') {
            return; // SALIR: Usuario canceló, no hacer nada más
          }
          window.showError('Error con File System Access API: ' + err.message, { log: true });
          // CONTINÚA: Fallback a método tradicional si hay error
        }
      }
      
      /**
       * MÉTODO FALLBACK: Descarga tradicional
       * 
       * COMPATIBILIDAD: Todos los navegadores modernos
       * MECÁNICA: Blob + Object URL + elemento <a> temporal
       * LIMITACIÓN: Usuario no elige ubicación (carpeta de descargas)
       */
      
      // CREACIÓN DE BLOB: Objeto binario con tipo MIME correcto
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // OBJECT URL: URL temporal para el blob
      const url = URL.createObjectURL(blob);
      
      // ELEMENTO TEMPORAL: <a> para trigger de descarga
      const a = document.createElement('a');
      a.style.display = 'none';  // INVISIBLE: No afecta layout
      a.href = url;
      a.download = filename;
      
      // TRIGGER DE DESCARGA: Añadir, click, remover
      document.body.appendChild(a);
      a.click();
      
      // CLEANUP: Limpia recursos después de descarga
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // IMPORTANTE: Libera memoria
      }, 100);
      
    } catch (e) {
      // ERROR GENERAL: Serialización, permisos, etc.
      window.Controller._handleErrorAndToast(e, 'Error al exportar JSON');
    }
  },

  /**
   * RESETEADOR DE FILTROS PARA IMPORTACIÓN
   * 
   * PROPÓSITO: Limpia filtros antes de importación para mostrar todos los datos
   * LÓGICA: Tras importar, usuario debe ver todos los datos (incluidos los nuevos)
   * DELEGACIÓN: Usa método público de FiltersController
   */
  _resetFiltersForImport: function () {
    window.FiltersController._clearAllFilters();
  },

  /**
   * VALIDADOR DE DATOS DE IMPORTACIÓN
   * 
   * @param {Object} data Datos parseados del archivo JSON
   * @returns {boolean} true si datos son válidos, false si hay errores
   * 
   * PATRÓN: Schema validation con early returns
   * VALIDACIONES:
   * 1. Estructura básica (objeto con prompts y folders arrays)
   * 2. Validación de cada prompt (id y text requeridos)
   * 3. Validación de cada folder (id y name requeridos)
   * 
   * ROBUSTEZ: Valida estructura mínima requerida sin ser demasiado estricto
   * FEEDBACK: Mensajes específicos para diferentes tipos de errores
   */
  _validateImportData: function (data) {
    const messages = window.getLocalizedMessages();
    
    // VALIDACIÓN DE ESTRUCTURA BÁSICA: Objeto con arrays requeridos
    if (!data || !Array.isArray(data.prompts) || !Array.isArray(data.folders)) {
      window.View.showImportMessage(messages.errors.invalidImport);
      return false;
    }
    
    // VALIDACIÓN DE PROMPTS: Cada prompt debe tener id y text
    for (const p of data.prompts) {
      if (typeof p.id !== 'string' || typeof p.text !== 'string') {
        window.View.showImportMessage(messages.errors.invalidPrompts);
        return false;
      }
    }
    
    // VALIDACIÓN DE FOLDERS: Cada folder debe tener id y name
    for (const f of data.folders) {
      if (typeof f.id !== 'string' || typeof f.name !== 'string') {
        window.View.showImportMessage(messages.errors.invalidFolders);
        return false;
      }
    }
    
    return true; // SUCCESS: Datos válidos para importación
  },

  /**
   * REEMPLAZADOR DE DATOS (MODO DESTRUCTIVO)
   * 
   * @param {Object} data Datos importados validados
   * @param {Function} renderAndUpdateFiltersCb Callback de actualización global
   * @param {Function} closePanelCb Callback para cerrar modal
   * 
   * PATRÓN: Replace operation con persistencia y feedback
   * COMPORTAMIENTO: Elimina todos los datos existentes y los reemplaza
   * USO: Cuando usuario quiere importar como nueva colección
   * 
   * FLUJO:
   * 1. Reemplazar datos en modelos (copia defensiva)
   * 2. Persistir a localStorage
   * 3. Actualizar toda la UI
   * 4. Mostrar feedback de éxito
   * 5. Cerrar modal
   */
  _replaceData: function (data, renderAndUpdateFiltersCb, closePanelCb) {
    // REEMPLAZO DE PROMPTS: Copia defensiva para evitar mutación
    window.PromptsModel.prompts = data.prompts.map(p => ({ ...p }));
    
    // REEMPLAZO DE FOLDERS: Asignación directa (arrays son inmutables aquí)
    window.FoldersModel.folders = data.folders;
    
    // PERSISTENCIA: Guarda nuevos datos en localStorage
    window.Storage.savePrompts(window.PromptsModel.prompts);
    window.Storage.saveFolders(window.FoldersModel.folders);
    
    // ACTUALIZACIÓN GLOBAL: Re-renderiza toda la aplicación
    renderAndUpdateFiltersCb();
    
    // FEEDBACK: Notifica éxito al usuario
    const messages = window.getLocalizedMessages();
    window.View.showImportMessage(messages.success.importOk, true);
    
    // CLEANUP: Cierra modal de elección
    closePanelCb();
  },

  /**
   * FUSIONADOR DE DATOS (MODO ADITIVO)
   * 
   * @param {Object} data Datos importados validados
   * @param {Function} renderAndUpdateFiltersCb Callback de actualización global
   * @param {Function} closePanelCb Callback para cerrar modal
   * 
   * PATRÓN: Merge operation con deduplicación por ID
   * COMPORTAMIENTO: Combina datos existentes con importados
   * RESOLUCIÓN DE CONFLICTOS: Datos importados sobrescriben existentes (por ID)
   * USO: Cuando usuario quiere añadir a colección existente
   * 
   * ALGORITMO DE FUSIÓN:
   * 1. Crear mapas por ID de datos existentes
   * 2. Sobrescribir/añadir datos importados
   * 3. Convertir mapas de vuelta a arrays
   * 4. Persistir y actualizar UI
   */
  _mergeData: function (data, renderAndUpdateFiltersCb, closePanelCb) {
    // FUSIÓN DE PROMPTS: Map-based merge con deduplicación por ID
    const promptsMap = Object.fromEntries(window.PromptsModel.prompts.map(p => [p.id, p]));
    for (const p of data.prompts) { 
      promptsMap[p.id] = { ...p }; // SOBRESCRITURA: Datos importados tienen prioridad
    }
    window.PromptsModel.prompts = Object.values(promptsMap);

    // FUSIÓN DE FOLDERS: Mismo algoritmo para carpetas
    const foldersMap = Object.fromEntries(window.FoldersModel.folders.map(f => [f.id, f]));
    for (const f of data.folders) { 
      foldersMap[f.id] = f; // SOBRESCRITURA: Datos importados tienen prioridad
    }
    window.FoldersModel.folders = Object.values(foldersMap);

    // PERSISTENCIA: Guarda datos fusionados
    window.Storage.savePrompts(window.PromptsModel.prompts);
    window.Storage.saveFolders(window.FoldersModel.folders);
    
    // ACTUALIZACIÓN Y FEEDBACK: Mismo patrón que replace
    renderAndUpdateFiltersCb();
    const messages = window.getLocalizedMessages();
    window.View.showImportMessage(messages.success.importOk, true);
    closePanelCb();
  },

  /**
   * CONFIGURADOR DE MODAL DE ELECCIÓN
   * 
   * @param {Object} data Datos validados listos para importar
   * @param {Function} renderAndUpdateFiltersCb Callback de actualización global
   * 
   * PATRÓN: Modal setup con event binding dinámico
   * PROPÓSITO: Permite al usuario elegir entre reemplazar o fusionar datos
   * 
   * CONFIGURACIÓN:
   * 1. Mostrar modal de elección
   * 2. Configurar callbacks para cada opción
   * 3. Configurar callback de cancelación
   * 
   * CLOSURE: Captura data y callbacks para uso en event handlers
   */
  _setupImportChoicePanel: function (data, renderAndUpdateFiltersCb) {
    // MOSTRAR MODAL: Hace visible el panel de elección
    window.View.setImportChoicePanelVisible(true);
    
    // CLOSURE PARA CERRAR: Función reutilizable para cerrar modal
    const closePanel = () => window.View.setImportChoicePanelVisible(false);

    // EVENT BINDING: Configurar handlers para cada opción
    
    // OPCIÓN REEMPLAZAR: Elimina datos existentes
    document.getElementById('import-choice-replace').onclick = () => {
      this._replaceData(data, renderAndUpdateFiltersCb, closePanel);
    };
    
    // OPCIÓN FUSIONAR: Combina con datos existentes
    document.getElementById('import-choice-merge').onclick = () => {
      this._mergeData(data, renderAndUpdateFiltersCb, closePanel);
    };
    
    // OPCIÓN CANCELAR: Cierra modal sin importar
    document.getElementById('import-choice-cancel').onclick = closePanel;
  }
};
