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
 * EVENTOS DEL SISTEMA
 * 
 * ESTRUCTURA: Constantes para nombres de eventos del EventBus
 * PROPÓSITO: Evitar errores tipográficos en pub/sub pattern
 * PATRÓN: String constants para type safety en eventos
 * 
 * NOTA: Actualmente definidos pero no utilizados extensivamente
 * TODO: Implementar sistema de eventos más robusto
 */
window.EVENTS = {
  PROMPT_ADDED: 'promptAdded',     // Disparado cuando se crea un prompt
  PROMPT_DELETED: 'promptDeleted', // Disparado cuando se elimina un prompt
  FOLDER_ADDED: 'folderAdded',     // Disparado cuando se crea una carpeta
  FOLDER_DELETED: 'folderDeleted'  // Disparado cuando se elimina una carpeta
};
