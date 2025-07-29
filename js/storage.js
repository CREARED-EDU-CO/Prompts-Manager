'use strict';
// Usar las constantes globales definidas en constants.js
// Validar que las constantes estén disponibles
if (!window.STORAGE_KEYS) {
    console.error('Error: STORAGE_KEYS no está disponible en storage.js');
    // Crear un fallback temporal
    window.STORAGE_KEYS = {
        PROMPTS: 'prompts',
        FOLDERS: 'folders',
        LANG: 'appLang',
        THEME: 'darkMode'
    };
}
const STORAGE_KEYS = window.STORAGE_KEYS;

window.Storage = {
    init: function () {
        // Asegurar que currentLang esté definido tempranamente
        const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.LANG) ? window.STORAGE_KEYS.LANG : 'appLang';
        if (!window.currentLang) {
            window.currentLang = localStorage.getItem(storageKey) || 'es';
        }
        
        const lang = window.currentLang;
        const dict = (window.MESSAGES && window.MESSAGES[lang] && window.MESSAGES[lang].ui) ? window.MESSAGES[lang].ui : (window.MESSAGES && window.MESSAGES.ui) ? window.MESSAGES.ui : {
            defaultFolderName: 'General',
            examplePrompt: 'Este es un prompt de ejemplo'
        };

        if (!localStorage.getItem(STORAGE_KEYS.FOLDERS)) {
            const defaultFolder = [{ id: 'default-folder', name: dict.defaultFolderName }];
            localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(defaultFolder));
        }
        if (!localStorage.getItem(STORAGE_KEYS.PROMPTS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMPTS)).length === 0) {
            const now = Date.now();
            const ejemplo = [{ id: '_ejemplo', text: dict.examplePrompt, tags: [], favorite: false, folderId: 'default-folder', createdAt: now, updatedAt: now, usageCount: 0 }];
            localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(ejemplo));
        }

        // Inicializar preferencia de modo oscuro
        this.initDarkMode();
    },

    initDarkMode: function () {
        const darkMode = localStorage.getItem(window.STORAGE_KEYS.THEME);
        if (darkMode === 'true') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    },

    saveDarkModePreference: function (isDarkMode) {
        localStorage.setItem(window.STORAGE_KEYS.THEME, isDarkMode.toString());
    },

    getDarkModePreference: function () {
        return localStorage.getItem(window.STORAGE_KEYS.THEME) === 'true';
    },
    loadPrompts: function () {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMPTS)) || [];
    },
    savePrompts: function (prompts) {
        try {
            localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
            return true;
        } catch (error) {
            window.showError(window.MESSAGES.errors.storagePrompts.replace('{msg}', error.message));
            if (error.name === 'QuotaExceededError') {
                window.showToast(window.MESSAGES.errors.storagePromptsQuota, 'error', { duration: 5000 });
            }
            return false;
        }
    },
    loadFolders: function () {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLDERS)) || [];
        } catch (error) {
            window.showError(window.MESSAGES.errors.loadFolders.replace('{msg}', error.message));
            return [];
        }
    },
    saveFolders: function (folders) {
        try {
            localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
            return true;
        } catch (error) {
            window.showError(window.MESSAGES.errors.storageFolders.replace('{msg}', error.message));
            if (error.name === 'QuotaExceededError') {
                window.showToast(window.MESSAGES.errors.storageFoldersQuota, 'error', { duration: 5000 });
            }
            return false;
        }
    }
};