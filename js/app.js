'use strict';

/**
 * OBJETO APLICACIÓN PRINCIPAL
 * 
 * PROPÓSITO: Bootstrap y coordinación de inicialización de toda la aplicación
 * PATRÓN: Application Controller Pattern para orquestación de startup
 * RESPONSABILIDADES:
 * - Validación de dependencias críticas
 * - Inicialización secuencial de módulos
 * - Manejo de errores de inicialización
 * - Emisión de eventos de ciclo de vida
 * 
 * ORDEN DE INICIALIZACIÓN:
 * 1. Validación de constantes críticas
 * 2. Inicialización de capa de persistencia y modelos
 * 3. Configuración de internacionalización
 * 4. Inicialización de vista y controladores
 * 5. Emisión de evento APP_READY
 */
const App = {
    /**
     * MÉTODO DE INICIALIZACIÓN PRINCIPAL
     * 
     * PATRÓN: Async initialization con manejo de errores centralizado
     * ESTRATEGIA: Promise.all para paralelización donde es posible
     * ERROR HANDLING: Try/catch global con delegación a handleInitError
     * 
     * FASES DE INICIALIZACIÓN:
     * 1. VALIDACIÓN: Verifica dependencias críticas
     * 2. PERSISTENCIA: Storage y modelos de datos
     * 3. I18N: Sistema de internacionalización
     * 4. UI: Vista y controladores
     * 5. READY: Notificación de aplicación lista
     */
    init: async function() {
        try {
            // FASE 1: VALIDACIÓN DE DEPENDENCIAS CRÍTICAS
            if (!window.STORAGE_KEYS) {
                window.showError('STORAGE_KEYS no está disponible, usando valores por defecto', { log: true });
                // FALLBACK: Definición de emergencia para prevenir crash total
                window.STORAGE_KEYS = {
                    PROMPTS: 'prompts',
                    FOLDERS: 'folders',
                    LANG: 'appLang',
                    THEME: 'darkMode'
                };
            }
            
            // FASE 2: INICIALIZACIÓN DE PERSISTENCIA Y MODELOS
            // PARALELIZACIÓN: Storage y modelos pueden inicializarse concurrentemente
            await Promise.all([
                this.initModule('Storage'),      // Configuración de localStorage y datos iniciales
                this.initModule('PromptsModel'), // Carga de prompts desde storage
                this.initModule('FoldersModel')  // Carga de carpetas desde storage
            ]);
            
            // FASE 3: CONFIGURACIÓN DE INTERNACIONALIZACIÓN
            // MANEJO DE ERRORES: I18N no debe bloquear la aplicación si falla
            if (typeof window.initLanguage === 'function') {
                try {
                    window.initLanguage();
                } catch (langError) {
                    window.showError('Error inicializando idioma: ' + langError.message, { log: true });
                    window.currentLang = 'es'; // FALLBACK: Español por defecto
                }
            }
            
            // FASE 4: INICIALIZACIÓN DE INTERFAZ DE USUARIO
            // SECUENCIAL: View debe estar listo antes que Controller
            await Promise.all([
                this.initModule('View'),       // Renderizado inicial y configuración DOM
                this.initModule('Controller')  // Event listeners y coordinación
            ]);
            
            // FASE 5: NOTIFICACIÓN DE APLICACIÓN LISTA
            // EVENTO: Permite a otros módulos reaccionar cuando app está completamente inicializada
            window.EventBus.emit(window.EVENTS.APP_INITIALIZED);
            
        } catch (error) {
            // ERROR HANDLING: Captura cualquier error de inicialización
            console.error('Error inicializando la aplicación:', error);
            this.handleInitError(error);
        }
    },

    /**
     * INICIALIZADOR DE MÓDULO INDIVIDUAL
     * 
     * @param {string} moduleName Nombre del módulo a inicializar
     * @returns {Promise} Promise que resuelve cuando módulo está inicializado
     * 
     * PATRÓN: Promise wrapper para inicialización uniforme de módulos
     * VALIDACIÓN: Verifica existencia del módulo y método init
     * FLEXIBILIDAD: Maneja módulos con init síncrono o asíncrono
     * 
     * CASOS MANEJADOS:
     * - Módulo no existe: Rechaza con error específico
     * - Módulo sin init: Advertencia pero continúa (opcional)
     * - Init síncrono: Envuelve en Promise.resolve
     * - Init asíncrono: Maneja Promise directamente
     */
    initModule: function(moduleName) {
        return new Promise((resolve, reject) => {
            try {
                // VALIDACIÓN DE EXISTENCIA: Verifica que módulo esté disponible
                if (!window[moduleName]) {
                    reject(new Error(`Módulo ${moduleName} no está disponible`));
                    return;
                }
                
                // VALIDACIÓN DE INTERFAZ: Verifica que módulo tenga método init
                if (typeof window[moduleName].init !== 'function') {
                    window.showError(`Módulo ${moduleName} no tiene método init, saltando inicialización`, { log: true });
                    resolve(); // CONTINÚA: Módulo sin init no bloquea aplicación
                    return;
                }
                
                // EJECUCIÓN: Llama al método init del módulo
                const result = window[moduleName].init();
                
                // NORMALIZACIÓN: Convierte resultado a Promise para manejo uniforme
                Promise.resolve(result).then(resolve).catch(reject);
                
            } catch (error) {
                // ERROR HANDLING: Captura errores síncronos durante inicialización
                reject(new Error(`Error inicializando ${moduleName}: ${error.message}`));
            }
        });
    },

    /**
     * MANEJADOR DE ERRORES DE INICIALIZACIÓN
     * 
     * @param {Error} error Error ocurrido durante inicialización
     * 
     * PROPÓSITO: Manejo centralizado de errores críticos de startup
     * ESTRATEGIA: Múltiples niveles de fallback para notificación
     * GRACEFUL DEGRADATION: Si showError falla, usa console + alert
     * 
     * NIVELES DE FALLBACK:
     * 1. window.showError (toast + console)
     * 2. console.error + alert (si showError no disponible)
     */
    handleInitError: function(error) {
        const errorMsg = 'Error al inicializar la aplicación';
        
        // NIVEL 1: Usa sistema de errores de la aplicación si disponible
        if (typeof window.showError === 'function') {
            window.showError(errorMsg);
        } else {
            // NIVEL 2: Fallback a métodos nativos del navegador
            console.error(errorMsg, error);
            alert(errorMsg); // ÚLTIMO RECURSO: Alert nativo para notificar usuario
        }
    }
};

/**
 * BOOTSTRAP DE APLICACIÓN
 * 
 * ESTRATEGIA: Progressive enhancement con optimización de performance
 * DETECCIÓN DE CARACTERÍSTICAS: requestIdleCallback para inicialización no-bloqueante
 * FALLBACK: DOMContentLoaded directo si requestIdleCallback no disponible
 * 
 * OPTIMIZACIÓN DE PERFORMANCE:
 * - requestIdleCallback: Ejecuta inicialización cuando navegador está idle
 * - timeout: 2000ms garantiza inicialización incluso si navegador ocupado
 * - DOMContentLoaded: Asegura que DOM esté listo antes de manipulación
 * 
 * COMPATIBILIDAD:
 * - Navegadores modernos: Usa requestIdleCallback para mejor UX
 * - Navegadores legacy: Fallback a inicialización inmediata post-DOMContentLoaded
 */

// DETECCIÓN DE CARACTERÍSTICA: requestIdleCallback disponible en navegadores modernos
if ('requestIdleCallback' in window) {
    // ESTRATEGIA OPTIMIZADA: Inicialización durante tiempo idle del navegador
    document.addEventListener('DOMContentLoaded', () => {
        requestIdleCallback(() => App.init(), { 
            timeout: 2000 // TIMEOUT: Garantiza inicialización máximo en 2 segundos
        });
    });
} else {
    // FALLBACK: Inicialización inmediata para navegadores sin requestIdleCallback
    document.addEventListener('DOMContentLoaded', () => App.init());
}
