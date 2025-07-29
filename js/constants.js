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

// Constantes centralizadas de la aplicación
window.STORAGE_KEYS = {
  PROMPTS: 'prompts',
  FOLDERS: 'folders',
  LANG: 'appLang',
  THEME: 'darkMode'
};

window.CONFIG = {
  MAX_PROMPT_LENGTH: 10000,
  DEFAULT_ITEMS_PER_PAGE: 10,
  TOAST_DURATION: 2200,
  MAX_FOLDERS_VISIBLE: 5
};

window.EVENTS = {
  PROMPT_ADDED: 'promptAdded',
  PROMPT_DELETED: 'promptDeleted',
  FOLDER_ADDED: 'folderAdded',
  FOLDER_DELETED: 'folderDeleted'
};
