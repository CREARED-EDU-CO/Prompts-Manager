'use strict';

/**
 * MÓDULO DE CONSTANTES GLOBALES
 * 
 * PROPÓSITO: Centralización de configuración y constantes para evitar magic numbers
 * PATRÓN: Configuration Object Pattern para mantenibilidad
 * ALCANCE: Global via window object para acceso desde cualquier módulo
 * 
 * DEPENDENCIAS: Ninguna (debe cargarse primero)
 * CONSUMIDORES: Todos los módulos de la aplicación
 */

/**
 * CLAVES DE ALMACENAMIENTO LOCAL
 * 
 * ESTRUCTURA: Mapeo de identificadores lógicos a claves de localStorage
 * PROPÓSITO: Centralizar claves para evitar duplicación y errores tipográficos
 * MODIFICACIÓN: Cambiar aquí afecta toda la persistencia de datos
 */
window.STORAGE_KEYS = {
  PROMPTS: 'prompts',      // Array de objetos prompt con estructura definida
  FOLDERS: 'folders',      // Array de objetos folder con id y name
  LANG: 'appLang',         // String de idioma actual ('es' | 'en')
  THEME: 'darkMode'        // Boolean de preferencia de tema oscuro
};

/**
 * CONFIGURACIÓN DE APLICACIÓN
 * 
 * ESTRUCTURA: Parámetros de comportamiento y límites operacionales
 * PERFORMANCE: Valores optimizados para balance entre UX y rendimiento
 * MODIFICACIÓN: Cambios aquí afectan comportamiento global
 */
window.CONFIG = {
  MAX_PROMPT_LENGTH: 10000,        // Límite de caracteres por prompt (validación)
  DEFAULT_ITEMS_PER_PAGE: 10,      // Paginación por defecto para performance
  TOAST_DURATION: 2200,            // Duración de notificaciones en ms
  MAX_FOLDERS_VISIBLE: 5           // Carpetas visibles antes de colapso
};

/**
 * EVENTOS DEL SISTEMA (DOMINIO TÉCNICO)
 * 
 * ESTRUCTURA: Constantes para nombres de eventos del EventBus
 * PROPÓSITO: Comunicación técnica entre módulos sin dependencias directas
 * PATRÓN: Namespace jerárquico para evitar colisiones y claridad semántica
 * DOMINIO: Exclusivamente técnico, independiente de mensajes de usuario
 * 
 * ARQUITECTURA: Separación completa entre eventos técnicos y mensajes UI
 * ESCALABILIDAD: Permite añadir eventos granulares sin afectar i18n
 * 
 * CONVENCIÓN DE NOMBRES:
 * - Prefijo de dominio (prompt, folder, app)
 * - Separador de puntos para jerarquía
 * - Verbos en pasado para indicar eventos completados
 */
window.EVENTS = {
  // EVENTOS DE PROMPTS: Ciclo de vida y operaciones
  PROMPT_CREATED: 'prompt.lifecycle.created',        // Prompt creado exitosamente
  PROMPT_UPDATED: 'prompt.lifecycle.updated',        // Prompt modificado exitosamente
  PROMPT_REMOVED: 'prompt.lifecycle.removed',        // Prompt eliminado exitosamente
  PROMPT_FAVORITED: 'prompt.action.favorited',       // Estado favorito cambiado
  PROMPT_COPIED: 'prompt.action.copied',             // Prompt copiado al portapapeles
  
  // EVENTOS DE CARPETAS: Ciclo de vida y operaciones
  FOLDER_CREATED: 'folder.lifecycle.created',        // Carpeta creada exitosamente
  FOLDER_UPDATED: 'folder.lifecycle.updated',        // Carpeta modificada exitosamente
  FOLDER_REMOVED: 'folder.lifecycle.removed',        // Carpeta eliminada exitosamente
  
  // EVENTOS DE APLICACIÓN: Ciclo de vida y estado global
  APP_INITIALIZED: 'app.lifecycle.initialized',      // Aplicación completamente inicializada
  DATA_IMPORTED: 'app.data.imported',                // Datos importados exitosamente
  DATA_EXPORTED: 'app.data.exported'                 // Datos exportados exitosamente
};

/**
 * CLAVES DE MENSAJES UI (DOMINIO DE PRESENTACIÓN)
 * 
 * ESTRUCTURA: Constantes para claves de mensajes de usuario
 * PROPÓSITO: Mapeo consistente entre eventos técnicos y feedback de usuario
 * DOMINIO: Exclusivamente presentación, independiente de eventos técnicos
 * 
 * BENEFICIOS:
 * - Separación clara entre lógica técnica y presentación
 * - Permite eventos sin mensajes y mensajes sin eventos
 * - Facilita testing y mantenimiento independiente
 * - Escalabilidad para múltiples tipos de feedback
 */
window.UI_MESSAGES = {
  // MENSAJES DE ÉXITO: Confirmaciones de operaciones completadas
  SUCCESS: {
    PROMPT_CREATED: 'promptCreated',           // Clave para "Prompt creado exitosamente"
    PROMPT_UPDATED: 'promptUpdated',           // Clave para "Prompt actualizado exitosamente"
    PROMPT_REMOVED: 'promptRemoved',           // Clave para "Prompt eliminado"
    PROMPT_COPIED: 'promptCopied',             // Clave para "Prompt copiado"
    FOLDER_CREATED: 'folderCreated',           // Clave para "Carpeta creada exitosamente"
    FOLDER_UPDATED: 'folderUpdated',           // Clave para "Carpeta actualizada exitosamente"
    FOLDER_REMOVED: 'folderRemoved',           // Clave para "Carpeta eliminada"
    DATA_IMPORTED: 'dataImported',             // Clave para "Datos importados exitosamente"
    DATA_EXPORTED: 'dataExported',             // Clave para "Datos exportados exitosamente"
    ALL_DATA_CLEARED: 'allDataCleared'         // Clave para "Todos los datos eliminados"
  },
  
  // MENSAJES DE ERROR: Notificaciones de fallos
  ERROR: {
    PROMPT_CREATION_FAILED: 'promptCreationFailed',
    PROMPT_UPDATE_FAILED: 'promptUpdateFailed',
    FOLDER_CREATION_FAILED: 'folderCreationFailed',
    FOLDER_UPDATE_FAILED: 'folderUpdateFailed',
    COPY_FAILED: 'copyFailed',
    IMPORT_FAILED: 'importFailed',
    EXPORT_FAILED: 'exportFailed'
  }
};
