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