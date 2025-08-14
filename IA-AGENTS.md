# DOCUMENTACIÓN TÉCNICA COMPLETA DEL SISTEMA PROMPT MANAGER

## ARQUITECTURA GENERAL DEL SISTEMA

### Paradigma Arquitectónico
El sistema implementa una **Aplicación de Página Única (SPA)** basada en el patrón **Model-View-Controller (MVC)** con arquitectura modular desacoplada y **Event-Driven Architecture**. La aplicación utiliza **JavaScript ES6+ vanilla** sin frameworks externos, implementando patrones de diseño avanzados para gestión de estado, comunicación inter-módulos y optimización de rendimiento.

### Estructura Jerárquica de Dependencias
```
CAPA 1 - FUNDAMENTOS:
├── constants.js (Configuración global y constantes de eventos)
├── eventBus.js (Sistema de eventos pub/sub centralizado)
├── performance.js (Utilidades de optimización y debounce)
├── utils.js (Funciones de utilidad general y modales)
└── domUtils.js (Manipulación DOM optimizada y factories)

CAPA 2 - INTERNACIONALIZACIÓN:
└── i18n.js (Sistema de traducciones es/en con aplicación dinámica)

CAPA 3 - PERSISTENCIA Y MODELOS:
├── storage.js (Abstracción de localStorage con manejo de errores)
├── promptsModel.js (Modelo de datos de prompts con eventos)
└── foldersModel.js (Modelo de datos de carpetas con eventos)

CAPA 4 - VISTA:
├── view/core.js (Renderizado principal y gestión de estado de edición)
├── view/pagination.js (Sistema de paginación y controles)
└── view/folders.js (Gestión de carpetas y renderizado)

CAPA 5 - CONTROLADORES ESPECIALIZADOS:
├── controllers/filtersController.js (Gestión de estado de filtros)
├── controllers/paginationController.js (Control de paginación)
├── controllers/promptFormController.js (Formulario de creación de prompts)
├── controllers/promptContainerController.js (Contenedor e interacciones CRUD)
├── controllers/foldersController.js (Gestión CRUD de carpetas)
└── controllers/importExportController.js (I/O de archivos JSON)

CAPA 6 - COORDINACIÓN:
├── controller.js (Controlador principal MVC con event listeners)
└── app.js (Bootstrap y inicialización secuencial)
```

## MODELO DE DATOS Y ESTRUCTURAS

### Esquema de Entidad Prompt
```javascript
{
  id: string,              // UUID único generado por window.generateUUID()
  text: string,            // Contenido del prompt (máximo 10,000 caracteres)
  tags: string[],          // Array de etiquetas para categorización
  favorite: boolean,       // Estado de favorito para filtrado prioritario
  folderId: string|null,   // Referencia a carpeta (obligatoria para creación)
  createdAt: number,       // Timestamp de creación (Date.now())
  updatedAt: number,       // Timestamp de última modificación
  usageCount: number       // Contador de usos para estadísticas y ordenamiento
}
```

### Esquema de Entidad Folder
```javascript
{
  id: string,              // UUID único para identificación
  name: string             // Nombre de la carpeta (único, case-insensitive)
}
```

### Configuración Global del Sistema
```javascript
window.CONFIG = {
  MAX_PROMPT_LENGTH: 10000,        // Límite de caracteres por prompt
  DEFAULT_ITEMS_PER_PAGE: 10,      // Paginación por defecto
  TOAST_DURATION: 2200,            // Duración de notificaciones (ms)
  MAX_FOLDERS_VISIBLE: 5           // Carpetas visibles antes de colapso
}
```

## PATRONES DE DISEÑO IMPLEMENTADOS

### 1. Model-View-Controller (MVC) con Event-Driven Architecture
- **Model**: `PromptsModel`, `FoldersModel` - Gestión de datos y emisión de eventos
- **View**: `View` object - Renderizado DOM y manipulación visual
- **Controller**: `Controller` + controladores especializados - Coordinación via eventos

### 2. Observer Pattern (EventBus)
```javascript
// Sistema de eventos centralizado para comunicación desacoplada
window.EventBus = {
  events: new Map(),                    // Map<eventName, Set<callbacks>>
  on(event, callback),                  // Registro de listeners
  emit(event, data),                    // Emisión de eventos
  off(event, callback),                 // Desregistro de listeners
  executeCallbacks(callbacks, data)     // Ejecución segura con error isolation
}

// Eventos del sistema (arquitectura event-driven):
window.EVENTS = {
  // PROMPTS: Operaciones CRUD y acciones específicas
  PROMPT_CREATED: 'prompt.lifecycle.created',        // Prompt creado exitosamente
  PROMPT_UPDATED: 'prompt.lifecycle.updated',        // Prompt modificado exitosamente
  PROMPT_REMOVED: 'prompt.lifecycle.removed',        // Prompt eliminado exitosamente
  PROMPT_FAVORITED: 'prompt.action.favorited',       // Estado favorito cambiado
  PROMPT_COPIED: 'prompt.action.copied',             // Prompt copiado al portapapeles
  
  // FOLDERS: Operaciones CRUD de organización
  FOLDER_CREATED: 'folder.lifecycle.created',        // Carpeta creada exitosamente
  FOLDER_UPDATED: 'folder.lifecycle.updated',        // Carpeta modificada exitosamente
  FOLDER_REMOVED: 'folder.lifecycle.removed',        // Carpeta eliminada exitosamente
  
  // APPLICATION: Ciclo de vida y estado global
  APP_INITIALIZED: 'app.lifecycle.initialized',      // Aplicación completamente inicializada
  DATA_IMPORTED: 'app.data.imported',                // Datos importados exitosamente
  DATA_EXPORTED: 'app.data.exported'                 // Datos exportados exitosamente
}
```

### 3. Module Pattern
Cada módulo encapsula su funcionalidad en objetos globales con métodos públicos y privados:
```javascript
window.ModuleName = {
  // Propiedades públicas
  publicProperty: value,
  
  // Métodos públicos
  init: function() { /* inicialización */ },
  publicMethod: function() { /* funcionalidad pública */ },
  
  // Métodos privados (convención con _)
  _privateMethod: function() { /* lógica interna */ }
}
```

### 4. Factory Pattern
Generación dinámica de elementos DOM y objetos de datos:
```javascript
// Factory de elementos DOM
window.DOMUtils.createElement(tag, attrs = {}, content = null)

// Factory de objetos prompt
_createPromptObject(text, tags, folderId) {
  return {
    id: window.generateUUID(),
    text, tags, folderId,
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0
  }
}
```

### 5. Strategy Pattern
Múltiples controladores especializados para diferentes aspectos:
- `FiltersController` - Estrategia de filtrado
- `PaginationController` - Estrategia de paginación
- `ImportExportController` - Estrategia de I/O

## SISTEMA DE PERSISTENCIA

### Abstracción de localStorage
```javascript
window.Storage = {
  // Claves de almacenamiento centralizadas
  STORAGE_KEYS: {
    PROMPTS: 'prompts',
    FOLDERS: 'folders', 
    LANG: 'appLang',
    THEME: 'darkMode'
  },
  
  // Métodos de persistencia con manejo de errores
  loadPrompts(): Array,
  savePrompts(prompts): boolean,
  loadFolders(): Array,
  saveFolders(folders): boolean,
  
  // Gestión de preferencias
  getDarkModePreference(): boolean,
  saveDarkModePreference(isDark): void
}
```

### Manejo de Errores de Cuota
```javascript
try {
  localStorage.setItem(key, JSON.stringify(data));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Notificación específica de cuota excedida
    window.showToast(messages.errors.storageQuota, 'error', { duration: 5000 });
  }
  // Logging y feedback general
  window.showError(messages.errors.storage.replace('{msg}', error.message));
}
```

## SISTEMA DE FILTRADO Y BÚSQUEDA

### Estado de Filtros
```javascript
FiltersController.state = {
  text: '',           // Búsqueda de texto libre (case-insensitive)
  favorite: false,    // Solo prompts favoritos
  tag: '',           // Etiqueta específica
  folder: '',        // Carpeta específica  
  order: ''          // Criterio de ordenamiento
}
```

### Algoritmo de Filtrado
```javascript
getFilteredPrompts(prompts, filters = {}) {
  let filtered = [...prompts];  // Copia defensiva
  
  // Aplicación secuencial de filtros
  if (filters.folder) {
    filtered = filtered.filter(p => p.folderId === filters.folder);
  }
  if (filters.text) {
    const txt = filters.text.toLowerCase();
    filtered = filtered.filter(p => p.text && p.text.toLowerCase().includes(txt));
  }
  if (filters.favorite) {
    filtered = filtered.filter(p => p.favorite);
  }
  if (filters.tag) {
    filtered = filtered.filter(p => Array.isArray(p.tags) && p.tags.includes(filters.tag));
  }
  
  // Ordenamiento con múltiples criterios
  if (filters.order === 'usage') {
    filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  } else if (filters.order === 'updatedAt') {
    filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } else {
    // Orden por defecto: más reciente creado primero
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  
  return filtered;
}
```

## SISTEMA DE PAGINACIÓN

### Algoritmo de Paginación
```javascript
renderPrompts(prompts, filters, page, itemsPerPage) {
  const filtered = PromptsModel.getFilteredPrompts(prompts, filters);
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = filtered.slice(startIndex, endIndex);
  
  // Renderizado de elementos de página actual
  pageItems.forEach(prompt => {
    const element = this.renderPromptItem(prompt, folderMap);
    this.container.appendChild(element);
  });
  
  // Renderizado de controles de paginación
  this.renderPagination(page, totalPages, itemsPerPage);
}
```

## SISTEMA DE INTERNACIONALIZACIÓN

### Estructura de Mensajes
```javascript
window.MESSAGES = {
  // Mensajes base en español (compatibilidad hacia atrás)
  errors: {
    promptTooLong: 'El prompt excede el límite de {max} caracteres.',
    mustCreateFolder: 'Primero debes crear una carpeta antes de añadir un prompt.',
    mustSelectFolder: 'Debes seleccionar una carpeta antes de añadir un prompt.',
    // ... más mensajes de error
  },
  success: {
    promptCreated: 'Prompt creado exitosamente',
    promptUpdated: 'Prompt actualizado correctamente',
    promptRemoved: 'Prompt eliminado',
    // ... más mensajes de éxito
  },
  confirm: {
    deleteAll: '¿Seguro que deseas borrar TODOS los prompts y carpetas?',
    deletePrompt: '¿Seguro que deseas eliminar este prompt?',
    // ... más confirmaciones
  },
  ui: {
    appTitle: 'ADMINISTRADOR DE PROMPTS',
    add: 'Añadir',
    createFolder: 'Crear carpeta',
    // ... más elementos de UI
  },
  
  // Traducciones específicas por idioma
  en: {
    errors: { /* versiones en inglés */ },
    success: { /* versiones en inglés */ },
    confirm: { /* versiones en inglés */ },
    ui: { /* versiones en inglés */ }
  }
}
```

### Aplicación Dinámica de Traducciones
```javascript
window.applyI18n = function(lang = null) {
  // Resolución de diccionario con fallback
  let dict = window.MESSAGES && window.MESSAGES.ui ? window.MESSAGES.ui : {};
  if (lang && window.MESSAGES && window.MESSAGES[lang] && window.MESSAGES[lang].ui) {
    dict = window.MESSAGES[lang].ui;
  }

  // Traducción optimizada: una sola pasada del DOM para ambos atributos
  document.querySelectorAll('[data-i18n], [data-i18n-placeholder]').forEach(el => {
    // Traducción de contenido
    const i18nKey = el.getAttribute('data-i18n');
    if (i18nKey) {
      let value = dict ? dict[i18nKey.split('.').pop()] : '';
      if (typeof value === 'function') value = value(0);
      
      if (value) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
          el.value = value;
        } else {
          el.innerText = value;
        }
      }
    }

    // Traducción de placeholders
    const placeholderKey = el.getAttribute('data-i18n-placeholder');
    if (placeholderKey) {
      let value = dict ? dict[placeholderKey.split('.').pop()] : '';
      if (typeof value === 'function') value = value(0);
      if (value) el.setAttribute('placeholder', value);
    }
  });
}
```

## SISTEMA DE IMPORTACIÓN/EXPORTACIÓN

### Exportación con File System Access API
```javascript
_exportToJson: async function() {
  const prompts = PromptsModel.getFilteredPrompts(
    PromptsModel.prompts, 
    FiltersController.getCurrentFilters()
  );
  const data = { folders: FoldersModel.folders, prompts };
  const jsonString = JSON.stringify(data, null, 2);
  
  // Método moderno con fallback
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: `prompts-export-${dateString}.json`,
        types: [{ description: 'JSON files', accept: { 'application/json': ['.json'] }}]
      });
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();
    } catch (err) {
      // Fallback a descarga tradicional
      this._fallbackDownload(jsonString, filename);
    }
  }
}
```

### Validación de Datos de Importación
```javascript
_validateImportData(data) {
  // Validación de estructura básica
  if (!data || !Array.isArray(data.prompts) || !Array.isArray(data.folders)) {
    return false;
  }
  
  // Validación de esquema de prompts
  for (const p of data.prompts) {
    if (typeof p.id !== 'string' || typeof p.text !== 'string') {
      return false;
    }
  }
  
  // Validación de esquema de folders
  for (const f of data.folders) {
    if (typeof f.id !== 'string' || typeof f.name !== 'string') {
      return false;
    }
  }
  
  return true;
}
```

## OPTIMIZACIONES DE RENDIMIENTO

### Debounce para Búsqueda
```javascript
window.Performance.debounce = function(func, wait, immediate = false) {
  let timeout;
  
  const debounced = function executedFunction(...args) {
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
  
  // Método de cancelación para cleanup
  debounced.cancel = () => {
    clearTimeout(timeout);
    timeout = null;
  };
  
  return debounced;
}
```

### Batch DOM Updates
```javascript
window.Performance.batchDOMUpdates = function(operations) {
  // Normalización: convierte función única en array
  if (!Array.isArray(operations)) {
    operations = [operations];
  }
  
  // Batch execution: todas las operaciones en un solo frame
  requestAnimationFrame(() => {
    operations.forEach(operation => {
      if (typeof operation === 'function') {
        operation();
      }
    });
  });
}
```

### Throttle para Eventos de Alta Frecuencia
```javascript
window.Performance.throttle = function(func, limit, options = {}) {
  let inThrottle, lastFunc, lastRan;
  const { leading = true, trailing = true } = options;
  
  return function(...args) {
    const context = this;
    if (!lastRan && leading) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          if (trailing) func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}
```

### RAF Debounce para Operaciones Visuales
```javascript
window.Performance.rafDebounce = function(func) {
  let rafId;
  return function(...args) {
    const context = this;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => func.apply(context, args));
  };
}
```

### Memoización para Optimización Computacional
```javascript
window.Performance.memoize = function(func, keyGenerator) {
  const cache = new Map();
  return function(...args) {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
```

### Lazy Loading con Intersection Observer
```javascript
window.Performance.lazyLoad = function(elements, callback, options = {}) {
  // Configuración con defaults sensatos
  const defaultOptions = {
    rootMargin: '50px',  // Preload 50px antes de ser visible
    threshold: 0.1,      // Trigger cuando 10% del elemento es visible
    ...options
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target, entry);
        observer.unobserve(entry.target); // Cleanup automático
      }
    });
  }, defaultOptions);

  // Normalización: convierte NodeList/single element a array
  const elementsArray = Array.isArray(elements) ? elements : Array.from(elements);
  
  elementsArray.forEach(el => {
    if (el instanceof Element) {
      observer.observe(el);
    }
  });

  return observer; // Para cleanup manual si necesario
}
```

## SISTEMA DE VISTA Y RENDERIZADO

### Gestión de Estado de Edición
```javascript
// En View.js - Estado global de edición
window.View = {
  editingPromptId: null,  // ID del prompt en edición o null
  
  // Renderizado condicional basado en estado
  renderPromptItem: function(p, folderMap) {
    if (this.editingPromptId === p.id) {
      return this.renderPromptEditForm(p);
    } else {
      return this._renderPromptDisplay(p, folderMap);
    }
  }
}
```

### Auto-resize de Textarea
```javascript
// Funcionalidad implementada en View.js
attachAutoResize: function(textarea) {
  const adjustHeight = () => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };
  
  textarea.addEventListener('input', adjustHeight);
  adjustHeight(); // Ajuste inicial
}
```

### Expansión de Texto Largo
```javascript
// Toggle de expansión para prompts largos
togglePromptTextExpansion: function(element) {
  const isLong = element.getAttribute('data-is-long') === 'true';
  if (isLong) {
    const isExpanded = element.getAttribute('data-expanded') === 'true';
    const fullText = element.getAttribute('data-full-text');
    
    if (isExpanded) {
      // Contraer: mostrar solo primeros 500 caracteres
      element.innerHTML = fullText.substring(0, 500) + '...';
      element.setAttribute('data-expanded', 'false');
    } else {
      // Expandir: mostrar texto completo
      element.innerHTML = fullText;
      element.setAttribute('data-expanded', 'true');
    }
  }
}
```

## SISTEMA DE VALIDACIÓN

### Validación de Prompts
```javascript
// En PromptFormController
_validatePromptData: function(text, folderId) {
  const messages = window.getLocalizedMessages();
  
  // Validación de longitud máxima
  const maxLength = window.CONFIG.MAX_PROMPT_LENGTH;
  if (text.length > maxLength) {
    window.showToast(
      messages.errors.promptTooLong.replace('{max}', maxLength), 
      'error'
    );
    return false;
  }
  
  // Validación de prerequisitos: debe existir al menos una carpeta
  if (!window.FoldersModel.folders.length) {
    window.View.showPromptMsg(messages.errors.mustCreateFolder);
    return false;
  }
  
  // Validación de carpeta obligatoria
  if (!folderId) {
    window.showToast(messages.errors.mustSelectFolder, 'error');
    return false;
  }
  
  return true;
}
```

### Sanitización de Entrada
```javascript
window.sanitizeInput = function(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\s+/g, ' ')           // Normaliza espacios múltiples
    .replace(/[\x00-\x1F\x7F]+/g, '') // Remueve caracteres de control
    .trim();                        // Limpia bordes
}

window.sanitizeHTML = function(text) {
  const temp = document.createElement('div');
  temp.textContent = text;  // Escape automático del navegador
  return temp.innerHTML;    // HTML escapado seguro
}
```

## MANEJO DE ERRORES Y FEEDBACK

### Sistema de Notificaciones Toast
```javascript
window.showToast = function(msg, type = 'success', opts = {}) {
  const toast = document.getElementById('toast');
  if (!toast) return; // Early return si elemento no existe
  
  // Limpieza de contenido previo
  toast.innerHTML = '';
  
  // Construcción de icono condicional
  if (opts.icon || type === 'success' || type === 'error') {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = opts.icon || (type === 'success' ? '✔️' : '❌');
    toast.appendChild(iconSpan);
  }
  
  // Construcción de mensaje
  const msgSpan = document.createElement('span');
  msgSpan.textContent = msg;
  toast.appendChild(msgSpan);
  
  // Aplicación de clases CSS para styling y animación
  toast.className = `toast visible toast-${type === 'error' ? 'error' : 'success'}`;
  
  // Configuración de duración con override opcional
  const duration = opts.duration || window.CONFIG.TOAST_DURATION;
  
  // Auto-dismiss con doble timeout para animación suave
  setTimeout(() => {
    toast.classList.remove('visible'); // Inicia fade-out
    setTimeout(() => toast.innerHTML = '', 300); // Cleanup tras animación
  }, duration);
}
```

### Modal de Confirmación
```javascript
window.showConfirmModal = function(msg) {
  return new Promise(resolve => {
    // Referencias DOM del modal global
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-modal-msg');
    const acceptBtn = document.getElementById('confirm-modal-accept');
    const cancelBtn = document.getElementById('confirm-modal-cancel');

    // Configuración del modal
    msgEl.textContent = msg;
    modal.classList.add('active');

    // Función de cleanup con memory leak prevention
    function cleanup(result) {
      modal.classList.remove('active');
      acceptBtn.removeEventListener('click', onAccept);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    }

    // Event handlers con cleanup automático
    function onAccept() { cleanup(true); }
    function onCancel() { cleanup(false); }

    // Registro de event listeners temporales
    acceptBtn.addEventListener('click', onAccept);
    cancelBtn.addEventListener('click', onCancel);
  });
}
```

## FLUJO DE INICIALIZACIÓN

### Secuencia de Bootstrap
```javascript
const App = {
  init: async function() {
    try {
      // FASE 1: Validación de dependencias críticas
      if (!window.STORAGE_KEYS) {
        window.showError('STORAGE_KEYS no está disponible, usando valores por defecto', { log: true });
        // Fallback de emergencia
        window.STORAGE_KEYS = {
          PROMPTS: 'prompts',
          FOLDERS: 'folders',
          LANG: 'appLang',
          THEME: 'darkMode'
        };
      }
      
      // FASE 2: Inicialización de persistencia y modelos
      await Promise.all([
        this.initModule('Storage'),
        this.initModule('PromptsModel'),
        this.initModule('FoldersModel')
      ]);
      
      // FASE 3: Configuración de internacionalización
      if (typeof window.initLanguage === 'function') {
        try {
          window.initLanguage();
        } catch (langError) {
          window.showError('Error inicializando idioma: ' + langError.message, { log: true });
          window.currentLang = 'es'; // Fallback
        }
      }
      
      // FASE 4: Inicialización de interfaz
      await Promise.all([
        this.initModule('View'),
        this.initModule('Controller')
      ]);
      
      // FASE 5: Notificación de aplicación lista
      window.EventBus.emit(window.EVENTS.APP_INITIALIZED);
      
    } catch (error) {
      console.error('Error inicializando la aplicación:', error);
      this.handleInitError(error);
    }
  }
}
```

## CARACTERÍSTICAS DE ACCESIBILIDAD

### Elementos Semánticos
- `<main>` como contenedor principal
- `role="dialog"` para modales
- `aria-modal="true"` para modales
- `aria-labelledby` para asociación de labels
- `tabindex="-1"` para focus management

### Labels Accesibles
```html
<label for="prompt-input" class="visually-hidden" data-i18n="ui.newPromptLabel"></label>
<textarea id="prompt-input" class="prompt-input" required></textarea>
```

### Focus Management
```javascript
// Focus automático en modo edición
setTimeout(() => {
  const textarea = formElement.querySelector('textarea');
  if (textarea) {
    textarea.focus();
    window.View.attachAutoResize(textarea);
  }
}, 0);
```

## SEGURIDAD

### Prevención XSS
- Uso de `textContent` en lugar de `innerHTML` para contenido de usuario
- Sanitización HTML mediante DOM API nativo
- Validación de entrada con caracteres de control

### Validación de Datos
- Validación de tipos estricta en importación
- Verificación de esquemas de datos
- Sanitización de input de usuario

### Gestión de Recursos
- Cleanup automático de event listeners
- Revocación de Object URLs tras uso
- Desconexión de Intersection Observers

## CAPACIDADES DE ALMACENAMIENTO

### Límites por Navegador
- Chrome/Edge: ~10 MB por dominio
- Firefox: ~10 MB por dominio
- Safari: ~5-10 MB por dominio
- Navegadores móviles: ~2-5 MB por dominio

### Estimaciones de Capacidad
| Tamaño Prompt | Capacidad Estimada | Uso Típico |
|---------------|-------------------|------------|
| 100 caracteres | ~50,000 prompts | Comandos cortos |
| 300 caracteres | ~25,000 prompts | Instrucciones típicas |
| 1000 caracteres | ~9,000 prompts | Prompts complejos |
| 5000 caracteres | ~2,000 prompts | Plantillas extensas |

## FLUJOS DE DATOS CRÍTICOS

### Creación de Prompt
```
Usuario → PromptFormController (submit) → Validación → FiltersController._clearAllFilters() → 
PromptsModel.addPrompt() → Storage.savePrompts() → EventBus.emit(PROMPT_CREATED) → 
Controller.updateAllViews() → View.renderPrompts() → DOM Update
```

### Eliminación de Prompt
```
Usuario → Confirmación Modal → PromptsModel.deletePrompt() → 
Storage.savePrompts() → EventBus.emit(PROMPT_REMOVED) → 
Controller.updateAllViews() → PaginationController.renderPromptsWithPagination() → DOM Update
```

### Toggle de Favorito
```
Usuario → PromptsModel.toggleFavorite() → Storage.savePrompts() → 
EventBus.emit(PROMPT_FAVORITED) → Controller (optimized re-render) → 
PaginationController.renderPromptsWithPagination() → DOM Update
```

### Filtrado de Prompts
```
Usuario → FiltersController._applyFilterAndResetPage() → FiltersController.state → 
PaginationController.page = 1 → PaginationController.renderPromptsWithPagination() → 
PromptsModel.getFilteredPrompts() → View.renderPrompts() → DOM Update
```

### Edición de Prompt
```
Usuario → Edit Button → View.editingPromptId = id → View.renderPromptEditForm() → 
Usuario Submit → Controller.handleEditFormSubmit() → PromptsModel.editPrompt() → 
Storage.savePrompts() → EventBus.emit(PROMPT_UPDATED) → Controller.updateAllViews()
```

### Importación de Datos
```
Usuario → File Picker → FileReader → JSON.parse() → Validación → 
Modal de Elección → Replace/Merge → Models Update → 
Storage.save() → EventBus.emit(DATA_IMPORTED) → Controller.updateAllViews()
```

### Exportación de Datos
```
Usuario → ImportExportController._exportToJson() → FiltersController.getCurrentFilters() → 
PromptsModel.getFilteredPrompts() → File System Access API → 
EventBus.emit(DATA_EXPORTED) → Controller (success feedback)
```

## ARQUITECTURA EVENT-DRIVEN IMPLEMENTADA

### Patrón de Comunicación
```javascript
// Controladores independientes con inicialización desacoplada
window.PromptFormController.init();
window.PromptContainerController.init();
window.FoldersController.init();
window.FiltersController.init();
window.PaginationController.init();
window.ImportExportController.init();

// Modelos emiten eventos automáticamente tras operaciones
PromptsModel.addPrompt(prompt);
// → EventBus.emit(EVENTS.PROMPT_CREATED, { prompt: prompt });
// → Controller escucha via _setupEventListeners() y coordina actualizaciones

// Event listeners centralizados en Controller
window.EventBus.on(window.EVENTS.PROMPT_CREATED, () => {
  this.updateAllViews();
});
```

### Beneficios Arquitectónicos

#### **Desacoplamiento Completo**
- Modelos independientes de vista y controladores
- Comunicación via eventos sin referencias directas
- Testing unitario simplificado por componente

#### **Extensibilidad**
```javascript
// Nuevas funcionalidades sin modificar código existente
EventBus.on(EVENTS.PROMPT_CREATED, (data) => {
  // analytics.track('prompt_created', data);
});

EventBus.on(EVENTS.PROMPT_COPIED, (data) => {
  // analytics.track('prompt_copied', { id: data.id, usageCount: data.usageCount });
  // Actualización granular del contador de uso
  setTimeout(() => {
    Controller._updateUsageCountDisplay(data.id, data.usageCount);
  }, 1000);
});
```

#### **Performance Optimizada**
- Actualizaciones granulares por tipo de evento
- `PROMPT_FAVORITED`: solo re-renderiza vista de prompts via PaginationController
- `PROMPT_COPIED`: actualiza contador de uso con retraso para preservar feedback visual
- Batch DOM updates via requestAnimationFrame
- Debounce en búsqueda de texto para optimizar consultas

#### **Trazabilidad y Debugging**
- Eventos centralizados para logging completo
- Flujo de datos observable y debuggeable
- Arquitectura consistente en toda la aplicación

## RESUMEN DE CONSISTENCIA ARQUITECTÓNICA

### Verificación de Implementación vs Documentación

**✅ ARQUITECTURA CONFIRMADA:**
- Event-Driven Architecture con EventBus centralizado
- Patrón MVC con separación clara de responsabilidades
- Controladores especializados desacoplados
- Sistema de eventos con namespace jerárquico
- Modelos con emisión automática de eventos

**✅ PATRONES DE DISEÑO VERIFICADOS:**
- Observer Pattern (EventBus)
- Factory Pattern (DOMUtils, createPromptObject)
- Strategy Pattern (controladores especializados)
- Module Pattern (encapsulación en window objects)
- Promise-based modals y operaciones asíncronas

**✅ OPTIMIZACIONES IMPLEMENTADAS:**
- Debounce, throttle, RAF debounce en Performance module
- Batch DOM updates con requestAnimationFrame
- Lazy loading con Intersection Observer
- Memoización para caching de resultados
- Validación de dependencias para inicialización segura

**✅ SISTEMAS FUNCIONALES:**
- Internacionalización completa (es/en) con aplicación dinámica
- Persistencia con manejo de errores de cuota
- Validación multi-nivel con feedback específico
- Sistema de notificaciones toast con auto-dismiss
- Modales de confirmación con cleanup automático

**✅ FLUJOS DE DATOS VERIFICADOS:**
- Creación: Form → Validation → Model → Storage → Event → View Update
- Edición: State Management → Form → Validation → Model → Event → View Update
- Filtrado: State → Reset Pagination → Filter → Render
- Import/Export: File API → Validation → Modal Choice → Model Update → Event

Esta documentación refleja fielmente la implementación actual del sistema Prompt Manager, detallando su arquitectura modular event-driven, patrones de diseño, flujos de datos y optimizaciones implementadas para crear una aplicación web robusta y escalable.
