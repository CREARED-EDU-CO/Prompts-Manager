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
 * SISTEMA DE INTERNACIONALIZACIÓN (I18N)
 * 
 * PROPÓSITO: Gestión centralizada de traducciones y localización
 * PATRÓN: Resource Bundle Pattern con estructura jerárquica
 * IDIOMAS SOPORTADOS: Español (es) e Inglés (en)
 * 
 * ESTRUCTURA:
 * - Mensajes base en español (compatibilidad hacia atrás)
 * - Traducciones específicas por idioma en objetos anidados
 * - Categorización por tipo: errors, success, confirm, ui
 * 
 * CARACTERÍSTICAS:
 * - Interpolación de variables con placeholders {variable}
 * - Funciones para mensajes dinámicos (pluralización)
 * - Fallback automático a idioma base
 * - Aplicación dinámica sin recarga de página
 * 
 * DEPENDENCIAS: Ninguna (debe cargarse temprano)
 * CONSUMIDORES: Todos los módulos que muestran texto al usuario
 */

/**
 * OBJETO PRINCIPAL DE MENSAJES
 * 
 * ESTRUCTURA JERÁRQUICA:
 * - Nivel 1: Categorías (errors, success, confirm, ui)
 * - Nivel 2: Claves específicas de mensaje
 * - Nivel 3: Idiomas específicos (es, en)
 * 
 * COMPATIBILIDAD: Mensajes en raíz para compatibilidad hacia atrás
 */
window.MESSAGES = {
  /**
   * MENSAJES DE ERROR
   * 
   * CATEGORÍA: Errores de validación, persistencia, y operaciones
   * INTERPOLACIÓN: Algunos mensajes usan {variable} para datos dinámicos
   * CONTEXTO: Proporcionan información específica sobre qué falló
   */
  errors: {
    promptTooLong: 'El prompt excede el límite de {max} caracteres.',
    mustCreateFolder: 'Primero debes crear una carpeta antes de añadir un prompt.',
    mustSelectFolder: 'Debes seleccionar una carpeta antes de añadir un prompt.',
    mustSelectFolderEdit: 'Debes seleccionar una carpeta antes de guardar el prompt.',
    storagePrompts: 'Error al guardar prompts: {msg}',
    storageFolders: 'Error al guardar carpetas: {msg}',
    loadFolders: 'Error al cargar carpetas: {msg}',
    exportJson: 'Error al exportar JSON: {msg}',
    importJson: 'Error al leer el archivo JSON',
    importFile: 'Error de lectura del archivo: {msg}',
    invalidPrompts: 'Formato inválido en prompts',
    invalidFolders: 'Formato inválido en folders',
    invalidImport: 'Formato inválido: faltan prompts o folders',
    duplicatePrompt: 'Ya existe un prompt con ese ID.',
    duplicateFolder: 'Ya existe una carpeta con ese nombre.',
    cannotDeleteFolderWithPrompts: 'No se puede eliminar una carpeta que contiene prompts.',
    storagePromptsQuota: 'Espacio de almacenamiento excedido. Intenta exportar y eliminar algunos prompts.',
    storageFoldersQuota: 'Espacio de almacenamiento excedido. Intenta exportar y eliminar algunos datos.',
  },
  /**
   * MENSAJES DE ÉXITO
   * 
   * CATEGORÍA: Confirmaciones de operaciones exitosas
   * PROPÓSITO: Feedback positivo para acciones del usuario
   * TONO: Conciso y confirmatorio
   */
  success: {
    promptAdded: 'Prompt añadido correctamente',
    promptEdited: 'Prompt editado correctamente',
    promptDeleted: 'Prompt eliminado',
    allDeleted: 'Todos los prompts y carpetas han sido eliminados',
    importOk: '¡Importación exitosa!'
  },
  
  /**
   * MENSAJES DE CONFIRMACIÓN
   * 
   * CATEGORÍA: Diálogos de confirmación para acciones destructivas
   * PROPÓSITO: Prevenir acciones accidentales con consecuencias irreversibles
   * TONO: Claro sobre las consecuencias de la acción
   */
  confirm: {
    deleteAll: '¿Seguro que deseas borrar TODOS los prompts y carpetas? Esta acción no se puede deshacer.',
    deletePrompt: '¿Seguro que deseas eliminar este prompt?',
    deleteFolder: '¿Seguro que deseas eliminar esta carpeta?'
  },
  ui: {
    appTitle: 'ADMINISTRADOR DE PROMPTS',
    add: 'Añadir',
    createFolder: 'Crear carpeta',
    export: 'Exportar JSON',
    import: 'Importar JSON',
    deleteAll: 'Borrar todos',
    delete: 'Eliminar',
    edit: 'Editar',
    copy: 'Copiar',
    copied: '¡Copiado!',
    cancel: 'Cancelar',
    save: 'Guardar',
    replace: 'Reemplazar',
    merge: 'Fusionar',
    showMoreFolders: n => `Mostrar ${n} carpetas más`,
    hideFolders: 'Ocultar carpetas adicionales',
    noFolders: 'No hay carpetas.',
    noPrompts: 'No hay prompts guardados.',
    noPromptsFiltered: 'No hay prompts que coincidan con los filtros seleccionados.',
    newPromptLabel: 'Nuevo prompt',
    newPromptPlaceholder: 'Escribe un nuevo prompt...',
    tagsLabel: 'Etiquetas',
    tagsPlaceholder: 'Etiquetas (separadas por coma)',
    selectFolderLabel: 'Seleccionar carpeta',
    selectFolderOption: 'Selecciona una carpeta',
    newFolderLabel: 'Nueva carpeta',
    newFolderPlaceholder: 'Nueva carpeta...',
    searchLabel: 'Buscar prompts',
    searchPlaceholder: 'Buscar...',
    clearFilters: 'Borrar filtros',
    filterByTag: 'Filtrar por etiqueta',
    allTags: 'Todas las etiquetas',
    filterByFolder: 'Filtrar por carpeta',
    allFolders: 'Todas las carpetas',
    orderBy: 'Ordenar por',
    orderByCreated: 'Ordenar por último creado',
    orderByEdited: 'Ordenar por última edición',
    orderByUsage: 'Ordenar por usos',
    onlyFavorites: 'Solo favoritos',
    exportInfo: 'Solo los prompts actualmente visibles (según los filtros aplicados) serán exportados. Si quiere exportar todos los prompts, primero borre los filtros. Las carpetas asociadas también se incluirán.',
    importChoiceMsg: '¿Deseas reemplazar o combinar todos los datos actuales por los importados? (Aceptar = reemplazar, Fusionar = combinar datos)',
    darkMode: 'Modo oscuro',
    language: 'Idioma',
    accept: 'Aceptar',
    totalPrompts: 'Total de prompts:',
    exportReminder: 'Recuerda exportar tus datos periódicamente para no perder información.',
    exportReminderDay2: 'Han pasado 2 días desde tu última actividad - Considera hacer backup de tus {count} prompts',
    exportReminderDay5: '5 días sin actividad - Es recomendable exportar tus {count} prompts',
    exportReminderDay10: '¡10 días sin actividad! Exporta urgentemente tus {count} prompts',
    unknownFolder: 'Carpeta desconocida',
    noFolder: 'Sin carpeta',
    favorite: 'Favorito',
    created: 'Creado:',
    edited: 'Editado:',
    usages: 'Usos:',
    defaultFolderName: 'General',
    examplePrompt: 'Este es un prompt de ejemplo',
    view: 'Ver:',
    perPage: 'por página',
    pagination: 'Paginación',
    previous: 'Anterior',
    next: 'Siguiente',
    copyError: 'Error al copiar al portapapeles',
    exportSuccess: 'Archivo exportado exitosamente',
    downloadFromGitHub: '📥 Descargar desde GitHub',
  },
  en: {
    errors: {
      promptTooLong: 'Prompt exceeds the limit of {max} characters.',
      mustCreateFolder: 'You must create a folder before adding a prompt.',
      mustSelectFolder: 'You must select a folder before adding a prompt.',
      mustSelectFolderEdit: 'You must select a folder before saving the prompt.',
      storagePrompts: 'Error saving prompts: {msg}',
      storageFolders: 'Error saving folders: {msg}',
      loadFolders: 'Error loading folders: {msg}',
      exportJson: 'Error exporting JSON: {msg}',
      importJson: 'Error reading JSON file',
      importFile: 'File read error: {msg}',
      invalidPrompts: 'Invalid format in prompts',
      invalidFolders: 'Invalid format in folders',
      invalidImport: 'Invalid format: prompts or folders missing',
      duplicatePrompt: 'A prompt with that ID already exists.',
      duplicateFolder: 'A folder with that name already exists.',
      cannotDeleteFolderWithPrompts: 'Cannot delete a folder that contains prompts.',
      storagePromptsQuota: 'Storage quota exceeded. Try exporting and deleting some prompts.',
      storageFoldersQuota: 'Storage quota exceeded. Try exporting and deleting some data.',
    },
    success: {
      promptAdded: 'Prompt added successfully',
      promptEdited: 'Prompt edited successfully',
      promptDeleted: 'Prompt deleted',
      allDeleted: 'All prompts and folders have been deleted',
      importOk: 'Import successful!'
    },
    confirm: {
      deleteAll: 'Are you sure you want to delete ALL prompts and folders? This action cannot be undone.',
      deletePrompt: 'Are you sure you want to delete this prompt?',
      deleteFolder: 'Are you sure you want to delete this folder?'
    },
    ui: {
      appTitle: 'PROMPT MANAGER',
      add: 'Add',
      createFolder: 'Create folder',
      export: 'Export JSON',
      import: 'Import JSON',
      deleteAll: 'Delete all',
      delete: 'Delete',
      edit: 'Edit',
      copy: 'Copy',
      copied: 'Copied!',
      cancel: 'Cancel',
      save: 'Save',
      replace: 'Replace',
      merge: 'Merge',
      showMoreFolders: n => `Show ${n} more folders`,
      hideFolders: 'Hide additional folders',
      noFolders: 'No folders.',
      noPrompts: 'No prompts saved.',
      noPromptsFiltered: 'No prompts match the selected filters.',
      newPromptLabel: 'New prompt',
      newPromptPlaceholder: 'Write a new prompt...',
      tagsLabel: 'Tags',
      tagsPlaceholder: 'Tags (comma separated)',
      selectFolderLabel: 'Select folder',
      selectFolderOption: 'Select a folder',
      newFolderLabel: 'New folder',
      newFolderPlaceholder: 'New folder...',
      searchLabel: 'Search prompts',
      searchPlaceholder: 'Search...',
      clearFilters: 'Clear filters',
      filterByTag: 'Filter by tag',
      allTags: 'All tags',
      filterByFolder: 'Filter by folder',
      allFolders: 'All folders',
      orderBy: 'Order by',
      orderByCreated: 'Order by last created',
      orderByEdited: 'Order by last edited',
      orderByUsage: 'Order by usage',
      onlyFavorites: 'Only favorites',
      exportInfo: 'Only currently visible prompts (according to applied filters) will be exported. To export all prompts, clear the filters first. Associated folders will also be included.',
      importChoiceMsg: 'Do you want to replace or merge all current data with the imported data? (Accept = replace, Merge = combine data)',
      darkMode: 'Dark mode',
      language: 'Language',
      accept: 'Accept',
      totalPrompts: 'Total prompts:',
      exportReminder: 'Remember to export your data periodically to avoid losing information.',
      exportReminderDay2: '2 days since your last activity - Consider backing up your {count} prompts',
      exportReminderDay5: '5 days without activity - It\'s recommended to export your {count} prompts',
      exportReminderDay10: '10 days without activity! Urgently export your {count} prompts',
      unknownFolder: 'Unknown folder',
      noFolder: 'No folder',
      favorite: 'Favorite',
      created: 'Created:',
      edited: 'Edited:',
      usages: 'Usages:',
      defaultFolderName: 'General',
      examplePrompt: 'This is an example prompt',
      view: 'View:',
      perPage: 'per page',
      pagination: 'Pagination',
      previous: 'Previous',
      next: 'Next',
      copyError: 'Error copying to clipboard',
      exportSuccess: 'File exported successfully',
      downloadFromGitHub: '📥 Download from GitHub',
    }
  }
};

/**
 * APLICADOR DE TRADUCCIONES AL DOM
 * 
 * @param {string|null} lang - Código de idioma a aplicar (null = idioma actual)
 * 
 * PROPÓSITO: Traduce dinámicamente todos los elementos con atributos i18n
 * PATRÓN: DOM traversal con attribute-based selection
 * PERFORMANCE: Usa querySelectorAll para batch processing
 * 
 * ATRIBUTOS SOPORTADOS:
 * - data-i18n: Traduce textContent/value del elemento
 * - data-i18n-placeholder: Traduce atributo placeholder
 * 
 * MECÁNICA:
 * 1. Resuelve diccionario según idioma especificado
 * 2. Busca todos los elementos con atributos i18n
 * 3. Extrae clave de traducción del atributo
 * 4. Aplica traducción según tipo de elemento
 * 
 * ROBUSTEZ: Maneja funciones dinámicas y elementos de formulario
 */
window.applyI18n = function (lang = null) {
  // RESOLUCIÓN DE DICCIONARIO: Usa idioma específico o fallback a base
  let dict = window.MESSAGES && window.MESSAGES.ui ? window.MESSAGES.ui : {};
  if (lang && window.MESSAGES && window.MESSAGES[lang] && window.MESSAGES[lang].ui) {
    dict = window.MESSAGES[lang].ui;
  }

  // TRADUCCIÓN DE CONTENIDO: Elementos con data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    // EXTRACCIÓN DE CLAVE: Toma última parte después del punto
    let value = key && dict ? dict[key.split('.').pop()] : '';
    
    // MANEJO DE FUNCIONES: Para mensajes dinámicos (pluralización)
    if (typeof value === 'function') value = value(0);
    
    if (value) {
      // APLICACIÓN CONTEXTUAL: Diferentes propiedades según tipo de elemento
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        el.value = value; // ELEMENTOS DE FORMULARIO: Usa value
      } else {
        el.innerText = value; // ELEMENTOS NORMALES: Usa innerText (seguro contra XSS)
      }
    }
  });

  // TRADUCCIÓN DE PLACEHOLDERS: Elementos con data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    let value = key && dict ? dict[key.split('.').pop()] : '';
    
    // MANEJO DE FUNCIONES: Consistente con traducción de contenido
    if (typeof value === 'function') value = value(0);
    
    // APLICACIÓN: Establece atributo placeholder
    if (value) el.setAttribute('placeholder', value);
  });
};

/**
 * INICIALIZADOR DEL SISTEMA DE IDIOMAS
 * 
 * PROPÓSITO: Configuración inicial del idioma y setup de cambio dinámico
 * RESPONSABILIDADES:
 * 1. Cargar idioma guardado desde localStorage
 * 2. Aplicar traducciones iniciales
 * 3. Configurar selector de idioma
 * 4. Setup de event listener para cambios de idioma
 * 5. Re-renderizado de componentes tras cambio de idioma
 * 
 * PATRÓN: Initialization + Event Setup con side effects coordinados
 * TIMING: Llamado desde App.init() después de cargar modelos
 */
window.initLanguage = function() {
  // RESOLUCIÓN DE CLAVE: Usa constante o fallback
  const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.LANG) ? window.STORAGE_KEYS.LANG : 'appLang';
  
  // CARGA DE IDIOMA: Desde localStorage o español por defecto
  let lang = localStorage.getItem(storageKey) || 'es';
  window.currentLang = lang; // VARIABLE GLOBAL: Para acceso desde otros módulos
  
  // APLICACIÓN INICIAL: Traduce toda la interfaz
  window.applyI18n(lang);
  
  // CONFIGURACIÓN DEL SELECTOR: Setup del dropdown de idiomas
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    // SINCRONIZACIÓN: Establece valor actual en el selector
    langSelect.value = lang;
    
    /**
     * EVENT LISTENER PARA CAMBIO DE IDIOMA
     * 
     * RESPONSABILIDADES:
     * 1. Persistir nueva selección
     * 2. Actualizar variable global
     * 3. Re-traducir interfaz
     * 4. Re-renderizar componentes dinámicos
     * 5. Cancelar ediciones en progreso
     * 
     * SIDE EFFECTS: Múltiples componentes deben actualizarse
     */
    langSelect.addEventListener('change', function () {
      const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.LANG) ? window.STORAGE_KEYS.LANG : 'appLang';
      
      // PERSISTENCIA: Guarda nueva selección
      localStorage.setItem(storageKey, this.value);
      window.currentLang = this.value;
      
      // RE-TRADUCCIÓN: Aplica nuevo idioma a toda la interfaz
      window.applyI18n(this.value);

      // CLEANUP DE ESTADO: Cancela ediciones en progreso
      if (window.View) {
        window.View.editingPromptId = null;
        
        // RE-RENDERIZADO DE SELECTORES: Actualiza opciones traducidas
        if (typeof window.View.updateFolderSelect === 'function') {
          window.View.updateFolderSelect(window.FoldersModel.folders);
        }
        if (typeof window.View.updateTagFilter === 'function') {
          window.View.updateTagFilter(window.PromptsModel.prompts);
        }
        if (typeof window.View.updateFolderFilter === 'function') {
          window.View.updateFolderFilter(window.FoldersModel.folders);
        }
      }

      // RE-RENDERIZADO DE COMPONENTES: Actualiza listas con nuevas traducciones
      if (window.View && typeof window.View.renderFolders === 'function') {
        window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts);
      }

      // RE-RENDERIZADO DE PAGINACIÓN: Actualiza controles de paginación
      if (window.PaginationController) {
        window.PaginationController.renderPromptsWithPagination();
      }
    });
  }
};
