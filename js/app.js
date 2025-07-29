'use strict';

const App = {
    async init() {
        try {
            // Verificar que las constantes estén disponibles (con fallback)
            if (!window.STORAGE_KEYS) {
                console.warn('STORAGE_KEYS no está disponible, usando valores por defecto');
                // Crear fallback
                window.STORAGE_KEYS = {
                    PROMPTS: 'prompts',
                    FOLDERS: 'folders',
                    LANG: 'appLang',
                    THEME: 'darkMode'
                };
            }
            
            // Inicialización asíncrona de módulos críticos
            await Promise.all([
                this.initModule('Storage'),
                this.initModule('PromptsModel'),
                this.initModule('FoldersModel')
            ]);
            
            // Inicializar idioma después de que Storage esté disponible
            if (typeof window.initLanguage === 'function') {
                try {
                    window.initLanguage();
                } catch (langError) {
                    console.warn('Error inicializando idioma:', langError);
                    // Continuar con idioma por defecto
                    window.currentLang = 'es';
                }
            }
            
            // Inicialización de UI después de los datos
            await Promise.all([
                this.initModule('View'),
                this.initModule('Controller')
            ]);
            
            // Emitir evento de aplicación lista
            window.EventBus.emit('app:ready');
        } catch (error) {
            console.error('Error inicializando la aplicación:', error);
            this.handleInitError(error);
        }
    },

    initModule(moduleName) {
        return new Promise((resolve, reject) => {
            try {
                // Validar que el módulo existe
                if (!window[moduleName]) {
                    reject(new Error(`Módulo ${moduleName} no está disponible`));
                    return;
                }
                
                // Validar que tiene método init
                if (typeof window[moduleName].init !== 'function') {
                    console.warn(`Módulo ${moduleName} no tiene método init, saltando inicialización`);
                    resolve();
                    return;
                }
                
                const result = window[moduleName].init();
                // Manejar tanto promesas como funciones síncronas
                Promise.resolve(result).then(resolve).catch(reject);
            } catch (error) {
                reject(new Error(`Error inicializando ${moduleName}: ${error.message}`));
            }
        });
    },

    handleInitError(error) {
        // Fallback más robusto
        const errorMsg = 'Error al inicializar la aplicación';
        if (typeof window.showError === 'function') {
            window.showError(errorMsg);
        } else {
            // Fallback si showError no está disponible
            console.error(errorMsg, error);
            alert(errorMsg);
        }
    }
};

// Usar requestIdleCallback si está disponible para mejor rendimiento
if ('requestIdleCallback' in window) {
    document.addEventListener('DOMContentLoaded', () => {
        requestIdleCallback(() => App.init(), { timeout: 2000 });
    });
} else {
    document.addEventListener('DOMContentLoaded', () => App.init());
}