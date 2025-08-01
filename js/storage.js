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
 * MÓDULO DE GESTIÓN DE ALMACENAMIENTO
 * 
 * PROPÓSITO: Abstracción de localStorage con manejo de errores y inicialización
 * PATRÓN: Storage Abstraction Layer para desacoplar persistencia de lógica de negocio
 * RESPONSABILIDADES:
 * - Inicialización de datos por defecto
 * - Serialización/deserialización JSON
 * - Manejo de errores de cuota y corrupción
 * - Gestión de preferencias de usuario (tema, idioma)
 * 
 * DEPENDENCIAS: window.STORAGE_KEYS (constants.js), window.MESSAGES (i18n.js)
 * CONSUMIDORES: PromptsModel, FoldersModel, View (para preferencias)
 */

// VALIDACIÓN DE DEPENDENCIAS: Verifica disponibilidad de constantes críticas
if (!window.STORAGE_KEYS) {
    window.showError('Error: STORAGE_KEYS no está disponible en storage.js', { log: true });
    // FALLBACK: Definición de emergencia para prevenir crashes
    window.STORAGE_KEYS = {
        PROMPTS: 'prompts',
        FOLDERS: 'folders',
        LANG: 'appLang',
        THEME: 'darkMode'
    };
}

// ALIAS LOCAL: Para acceso más limpio dentro del módulo
const STORAGE_KEYS = window.STORAGE_KEYS;

/**
 * OBJETO STORAGE PRINCIPAL
 * 
 * PATRÓN: Module Pattern con métodos públicos para operaciones de persistencia
 * ENCAPSULACIÓN: Centraliza toda la lógica de localStorage en un objeto
 */
window.Storage = {
    /**
     * INICIALIZADOR DEL SISTEMA DE ALMACENAMIENTO
     * 
     * RESPONSABILIDADES:
     * 1. Configurar idioma por defecto desde localStorage
     * 2. Crear datos iniciales si no existen (carpeta y prompt de ejemplo)
     * 3. Inicializar preferencias de tema
     * 
     * PATRÓN: Initialization method con creación de datos por defecto
     * ORDEN DE EJECUCIÓN: Llamado desde App.init() antes que los modelos
     */
    init: function () {
        // CONFIGURACIÓN DE IDIOMA: Recupera idioma guardado o usa español por defecto
        const storageKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.LANG) ? window.STORAGE_KEYS.LANG : 'appLang';
        if (!window.currentLang) {
            window.currentLang = localStorage.getItem(storageKey) || 'es';
        }
        
        // RESOLUCIÓN DE DICCIONARIO: Obtiene mensajes localizados con múltiples fallbacks
        const lang = window.currentLang;
        const dict = (window.MESSAGES && window.MESSAGES[lang] && window.MESSAGES[lang].ui) 
            ? window.MESSAGES[lang].ui 
            : (window.MESSAGES && window.MESSAGES.ui) 
                ? window.MESSAGES.ui 
                : {
                    // FALLBACK FINAL: Valores hardcoded si sistema i18n falla
                    defaultFolderName: 'General',
                    examplePrompt: 'Este es un prompt de ejemplo'
                };

        // INICIALIZACIÓN DE CARPETAS: Crea carpeta por defecto si no existe
        if (!localStorage.getItem(STORAGE_KEYS.FOLDERS)) {
            const defaultFolder = [{ 
                id: 'default-folder', 
                name: dict.defaultFolderName 
            }];
            localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(defaultFolder));
        }
        
        // INICIALIZACIÓN DE PROMPTS: Crea prompt de ejemplo si no hay datos
        if (!localStorage.getItem(STORAGE_KEYS.PROMPTS) || 
            JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMPTS)).length === 0) {
            
            const now = Date.now();
            const ejemplo = [{ 
                id: '_ejemplo', 
                text: dict.examplePrompt, 
                tags: [], 
                favorite: false, 
                folderId: 'default-folder', 
                createdAt: now, 
                updatedAt: now, 
                usageCount: 0 
            }];
            localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(ejemplo));
        }

        // INICIALIZACIÓN DE TEMA: Configura modo oscuro según preferencias
        this.initDarkMode();
    },

    /**
     * INICIALIZADOR DE MODO OSCURO
     * 
     * PROPÓSITO: Aplica tema guardado al cargar la aplicación
     * IMPLEMENTACIÓN: Manipula data-theme attribute en documentElement
     * TIMING: Ejecutado en init() para aplicar tema antes del render inicial
     * 
     * MECÁNICA CSS: data-theme="dark" activa variables CSS del tema oscuro
     */
    initDarkMode: function () {
        const darkMode = localStorage.getItem(window.STORAGE_KEYS.THEME);
        
        if (darkMode === 'true') {
            // ACTIVACIÓN: Establece atributo para CSS selector [data-theme="dark"]
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            // DESACTIVACIÓN: Remueve atributo para usar tema claro por defecto
            document.documentElement.removeAttribute('data-theme');
        }
    },

    /**
     * GUARDADO DE PREFERENCIA DE TEMA
     * 
     * @param {boolean} isDarkMode true para modo oscuro, false para claro
     * 
     * PROPÓSITO: Persiste preferencia de tema del usuario
     * CONVERSIÓN: Boolean → string para compatibilidad con localStorage
     * SINCRONIZACIÓN: Llamado desde View cuando usuario cambia toggle
     */
    saveDarkModePreference: function (isDarkMode) {
        localStorage.setItem(window.STORAGE_KEYS.THEME, isDarkMode.toString());
    },

    /**
     * RECUPERACIÓN DE PREFERENCIA DE TEMA
     * 
     * @returns {boolean} true si modo oscuro está activado
     * 
     * PROPÓSITO: Lee preferencia guardada para configurar UI
     * CONVERSIÓN: string → boolean con comparación explícita
     * USO: View.initDarkModeToggle() para configurar estado del toggle
     */
    getDarkModePreference: function () {
        return localStorage.getItem(window.STORAGE_KEYS.THEME) === 'true';
    },
    /**
     * CARGADOR DE PROMPTS DESDE LOCALSTORAGE
     * 
     * @returns {Array} Array de objetos prompt o array vacío si no hay datos
     * 
     * PATRÓN: Simple getter con deserialización JSON
     * FALLBACK: Retorna array vacío si no hay datos (evita null/undefined)
     * ERROR HANDLING: JSON.parse puede lanzar SyntaxError si datos corruptos
     * 
     * ESTRUCTURA ESPERADA: Array de objetos con propiedades:
     * {id, text, tags, favorite, folderId, createdAt, updatedAt, usageCount}
     */
    loadPrompts: function () {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMPTS)) || [];
    },
    
    /**
     * GUARDADO DE PROMPTS A LOCALSTORAGE
     * 
     * @param {Array} prompts Array de objetos prompt a guardar
     * @returns {boolean} true si guardado exitoso, false si error
     * 
     * PATRÓN: Setter con manejo de errores y feedback al usuario
     * ERROR HANDLING: Captura QuotaExceededError y otros errores de localStorage
     * USER FEEDBACK: Muestra mensajes específicos según tipo de error
     * 
     * ERRORES COMUNES:
     * - QuotaExceededError: Límite de almacenamiento excedido
     * - SecurityError: localStorage deshabilitado (modo privado)
     */
    savePrompts: function (prompts) {
        try {
            localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
            return true; // SUCCESS: Guardado exitoso
        } catch (error) {
            // ERROR GENERAL: Mensaje con detalles del error
            window.showError(window.MESSAGES.errors.storagePrompts.replace('{msg}', error.message));
            
            // ERROR ESPECÍFICO: Cuota excedida requiere acción del usuario
            if (error.name === 'QuotaExceededError') {
                window.showToast(window.MESSAGES.errors.storagePromptsQuota, 'error', { duration: 5000 });
            }
            return false; // FAILURE: Guardado falló
        }
    },
    
    /**
     * CARGADOR DE CARPETAS DESDE LOCALSTORAGE
     * 
     * @returns {Array} Array de objetos folder o array vacío si error
     * 
     * PATRÓN: Getter con manejo de errores de deserialización
     * ERROR HANDLING: Try/catch para JSON.parse con fallback a array vacío
     * LOGGING: Reporta errores de corrupción de datos para debugging
     * 
     * ESTRUCTURA ESPERADA: Array de objetos con propiedades: {id, name}
     */
    loadFolders: function () {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLDERS)) || [];
        } catch (error) {
            // ERROR DE DESERIALIZACIÓN: Datos corruptos o formato inválido
            window.showError(window.MESSAGES.errors.loadFolders.replace('{msg}', error.message));
            return []; // FALLBACK: Array vacío para prevenir crashes
        }
    },
    
    /**
     * GUARDADO DE CARPETAS A LOCALSTORAGE
     * 
     * @param {Array} folders Array de objetos folder a guardar
     * @returns {boolean} true si guardado exitoso, false si error
     * 
     * PATRÓN: Setter con manejo de errores idéntico a savePrompts
     * CONSISTENCIA: Mismo patrón de error handling para todas las operaciones de guardado
     * ESCALABILIDAD: Fácil extensión para otros tipos de datos
     */
    saveFolders: function (folders) {
        try {
            localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
            return true; // SUCCESS: Guardado exitoso
        } catch (error) {
            // ERROR GENERAL: Mensaje con detalles del error
            window.showError(window.MESSAGES.errors.storageFolders.replace('{msg}', error.message));
            
            // ERROR ESPECÍFICO: Cuota excedida requiere acción del usuario
            if (error.name === 'QuotaExceededError') {
                window.showToast(window.MESSAGES.errors.storageFoldersQuota, 'error', { duration: 5000 });
            }
            return false; // FAILURE: Guardado falló
        }
    }
};
