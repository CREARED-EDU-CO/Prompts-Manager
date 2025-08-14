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
// Claves definidas en constants.js
window.STORAGE_KEYS = {
  PROMPTS: 'prompts',
  FOLDERS: 'folders', 
  LANG: 'appLang',
  THEME: 'darkMode'
};

window.Storage = {
  
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
    // ❌ INCONSISTENCIA: Case-sensitive vs filtro de texto case-insensitive
    // CORRECCIÓN SUGERIDA: Normalizar a lowercase para consistencia
    const tagLower = filters.tag.toLowerCase();
    filtered = filtered.filter(p => 
      Array.isArray(p.tags) && 
      p.tags.some(tag => tag.toLowerCase() === tagLower)
    );
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
renderPrompts(prompts, filters = {}, page = 1, itemsPerPage = 10) {
  const filtered = PromptsModel.getFilteredPrompts(prompts, filters);
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = filtered.slice(startIndex, endIndex);
  
  // Creación de mapa de folders para resolución eficiente de nombres
  // Patrón: Transformación Array -> Object para O(1) lookup
  const folderMap = (window.FoldersModel.folders || []).reduce((acc, f) => { 
    acc[f.id] = f.name; 
    return acc; 
  }, {});
  
  // Renderizado de elementos de página actual
  pageItems.forEach((prompt, index) => {
    let promptElement;
    if (this.editingPromptId === prompt.id) {
      promptElement = this.renderPromptEditForm(prompt);
    } else {
      promptElement = this._renderPromptDisplay(prompt, folderMap);
    }
    this.container.appendChild(promptElement);
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
  
  // GENERACIÓN DE NOMBRE: Variables correctamente definidas
  const today = new Date();
  const dateString = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
  const filename = `prompts-export-${dateString}.json`;
  
  const jsonString = JSON.stringify(data, null, 2);
  
  // Método moderno con fallback
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,  // ✅ Variable definida correctamente
        types: [{ description: 'JSON files', accept: { 'application/json': ['.json'] }}]
      });
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();
    } catch (err) {
      // Fallback a descarga tradicional usando filename
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;  // ✅ Variable definida correctamente
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
    // folderMap: Objeto {folderId: folderName} para resolución O(1)
    // Creado en renderPrompts() via reduce() de FoldersModel.folders
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
        // FALLBACK: Definición de emergencia para prevenir crash total
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

## ARQUITECTURA CSS Y SISTEMA DE ESTILOS

### Jerarquía de Dependencias CSS
```
ORDEN DE CARGA CRÍTICO:
1. variables.css    → Design tokens y custom properties
2. utilities.css    → Clases atómicas y utilidades
3. base.css         → Reset CSS y estilos fundamentales
4. layout.css       → Estructura espacial y contenedores
5. forms.css        → Elementos de entrada de datos
6. components.css   → Componentes reutilizables
7. modals.css       → Sistema modal y overlays
8. responsive.css   → Adaptaciones cross-device
9. dark-mode.css    → Overrides para tema oscuro
```

### Sistema de Design Tokens (variables.css)

#### **Paleta Cromática Semántica**
```css
:root {
  /* Colores funcionales con variantes de intensidad */
  --primary-color: #2563eb;           /* Azul primario - Acciones principales */
  --primary-color-darker: #1d4ed8;    /* Azul oscuro - Estados hover/active */
  --danger-color: #dc2626;            /* Rojo destructivo - Eliminaciones */
  --danger-color-darker: #b91c1c;     /* Rojo intenso - Estados activos */
  --success-color: #22c55e;           /* Verde confirmación - Éxito */
  --success-color-darker: #16a34a;    /* Verde intenso - Estados activos */
  --warning-color: #f59e0b;           /* Amarillo advertencia - Favoritos */
}
```

#### **Jerarquía Tipográfica**
```css
:root {
  /* Stack tipográfico nativo para performance */
  --font-family-base: system-ui, sans-serif;
  
  /* Escala modular (proporción 1.125 - Major Second) */
  --font-size-sm: 0.875rem;    /* 14px - Metadatos, labels */
  --font-size-base: 1rem;      /* 16px - Texto base, inputs */
  --font-size-lg: 1.125rem;    /* 18px - Títulos secundarios */
  
  /* Colores de texto con contraste WCAG AA */
  --text-color-primary: #222;         /* Contenido principal */
  --text-color-secondary: #64748b;    /* Metadatos, fechas */
}
```

#### **Sistema de Espaciado Modular**
```css
:root {
  /* Escala basada en múltiplos de 0.25rem (4px) */
  --spacing-xs: 0.3rem;    /* 4.8px - Espaciado mínimo */
  --spacing-sm: 0.5rem;    /* 8px - Espaciado pequeño */
  --spacing-md: 1rem;      /* 16px - Espaciado estándar */
  --spacing-lg: 1.5rem;    /* 24px - Espaciado grande */
  --spacing-xl: 2rem;      /* 32px - Espaciado extra */
}
```

#### **Sistema de Elevación (Sombras)**
```css
:root {
  /* Niveles de profundidad progresiva */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);     /* Elementos planos */
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.07);    /* Cards, componentes */
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.18);   /* Modales, overlays */
}
```

#### **Sistema de Transiciones**
```css
:root {
  /* Timing functions optimizadas para micro-interacciones */
  --transition-fast: 0.15s ease;     /* Hover states, cambios de color */
  --transition-normal: 0.3s ease;    /* Transformaciones, opacity */
  --transition-slow: 0.5s ease;      /* Animaciones complejas, modales */
}
```

### Tema Oscuro (Dark Mode)

#### **Estrategia de Implementación**
```css
/* Selector específico para toggle dinámico */
[data-theme="dark"] {
  /* Override de variables CSS para modo oscuro */
  --primary-color: #3b82f6;          /* Azul más claro para contraste */
  --text-color-primary: #e2e8f0;     /* Texto claro sobre fondos oscuros */
  --text-color-secondary: #94a3b8;   /* Texto gris claro */
  --background-light: #1e293b;       /* Fondo base oscuro */
  --background-card: #0f172a;        /* Fondo cards oscuro */
  --main-background: #0f172a;        /* Fondo principal oscuro */
}
```

#### **Control de Tema Dinámico**
```javascript
// JavaScript controla el toggle de tema
document.documentElement.setAttribute('data-theme', 'dark');
// CSS aplica overrides automáticamente via especificidad
```

#### **Toggle Switch Interactivo**
```css
.dark-mode-switch .switch {
  position: relative;
  width: 40px;
  height: 20px;
  /* Track del switch con forma pill */
}

.dark-mode-switch .slider:before {
  /* Thumb circular que se mueve */
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: var(--transition-normal);
}

/* Estado activo - thumb se mueve a la derecha */
input:checked + .slider:before {
  transform: translateX(var(--spacing-lg));
}
```

### Sistema de Componentes

#### **Arquitectura Component-Based**
```css
/* Componente de prompt individual */
.prompt-item {
  display: flex;
  flex-direction: column;
  background: var(--background-card);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-colors);
}

/* Texto expandible para prompts largos */
.expandable-prompt {
  cursor: pointer;
  position: relative;
}

.expandable-prompt:after {
  content: "⤵";  /* Indicador visual de expansión */
  position: absolute;
  right: var(--spacing-xs);
  bottom: var(--spacing-xs);
  opacity: 0.5;
  color: var(--primary-color);
}
```

#### **Sistema de Botones**
```css
/* Botón base con micro-interacciones */
.btn {
  border: none;
  border-radius: var(--border-radius-sm);
  padding: calc(var(--spacing-sm) - 0.05rem) var(--spacing-lg);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast), 
              transform var(--transition-fast);
}

/* Variantes semánticas */
.btn-primary {
  background: var(--primary-color);
  color: #fff;
}

.btn-danger {
  background: var(--danger-color);
  color: #fff;
}

/* Estados interactivos con elevación */
.btn-primary:hover {
  background: var(--primary-color-darker);
  transform: translateY(-2px) scale(1.04);
}
```

### Sistema Modal

#### **Overlay Pattern**
```css
#confirm-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  visibility: hidden;
  opacity: 0;
  transition: opacity var(--transition-fast), 
              visibility 0s var(--transition-fast);
}

/* Estado activo con animación de entrada */
#confirm-modal.active {
  visibility: visible;
  opacity: 1;
  transition: opacity var(--transition-fast);
}

/* Animación de escala para la caja modal */
#confirm-modal .modal-box {
  transform: scale(0.95);
  transition: transform var(--transition-fast);
}

#confirm-modal.active .modal-box {
  transform: scale(1);
}
```

### Sistema de Notificaciones Toast

#### **Feedback Visual No-Intrusivo**
```css
.toast {
  position: fixed;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  background: var(--primary-color);
  color: #fff;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  pointer-events: none;
  z-index: 5000;
  transition: opacity var(--transition-slow), 
              transform var(--transition-slow);
}

/* Estado visible con animación de entrada */
.toast.visible {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1);
}

/* Variantes semánticas */
.toast.toast-success {
  background: linear-gradient(90deg, 
    var(--success-color) 80%, 
    var(--success-color-darker) 100%);
}

.toast.toast-error {
  background: linear-gradient(90deg, 
    var(--danger-color) 80%, 
    var(--danger-color-darker) 100%);
}
```

### Sistema Responsive

#### **Estrategia Mobile-First**
```css
/* Breakpoint Tablet (900px) */
@media (max-width: 900px) {
  main {
    padding: var(--spacing-md);
    margin: var(--spacing-md) auto;
    background: var(--background-card);
  }
  
  .app-title {
    font-size: 2rem;  /* Reducción tipográfica */
  }
}

/* Breakpoint Mobile (700px) */
@media (max-width: 700px) {
  main {
    margin: var(--spacing-xs);
    padding: var(--spacing-xs);
  }
  
  /* Layout vertical para controles */
  .prompt-form-row,
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  /* Botones full-width para touch */
  .import-choice-panel .modal-actions {
    flex-direction: column;
  }
  
  .import-choice-panel .modal-actions button {
    width: 100%;
  }
}
```

### Clases Utilitarias (Atomic CSS)

#### **Sistema de Utilidades Atómicas**
```css
/* Display utilities */
.hidden { display: none; }
.flex { display: flex; }
.grid { display: grid; }

/* Typography utilities */
.text-center { text-align: center; }
.text-truncate { 
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Spacing utilities (Tailwind-inspired) */
.m-0 { margin: 0; }
.p-0 { padding: 0; }
.mx-auto { margin-left: auto; margin-right: auto; }

/* Flexbox utilities */
.flex-col { flex-direction: column; }
.justify-center { justify-content: center; }
.items-center { align-items: center; }

/* Performance utilities */
.will-change-transform { will-change: transform; }
.gpu-accelerated { transform: translateZ(0); }

/* Accessibility utilities */
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
```

### Optimizaciones de Performance CSS

#### **Hardware Acceleration**
```css
/* Promoción a composite layer */
.gpu-accelerated {
  transform: translateZ(0);
}

/* Will-change hints para animaciones */
.will-change-transform {
  will-change: transform;
}

/* CSS Containment para aislamiento */
.contain-layout { contain: layout; }
.contain-paint { contain: paint; }
```

#### **Transiciones Optimizadas**
```css
/* Transiciones específicas (más eficientes que 'all') */
.transition-opacity {
  transition: opacity var(--transition-fast);
}

.transition-transform {
  transition: transform var(--transition-fast);
}

/* Transición de colores para theming */
.transition-colors {
  transition: color var(--transition-fast),
              background-color var(--transition-fast),
              border-color var(--transition-fast);
}
```

### Accesibilidad CSS

#### **Contraste y Legibilidad**
- Ratios de contraste WCAG AA compliant (4.5:1 mínimo)
- Colores semánticos para comunicación visual clara
- Tamaños de fuente optimizados para legibilidad

#### **Focus Management**
```css
/* Estados de focus visibles */
.btn:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Focus trap para modales */
#confirm-modal[aria-modal="true"] {
  /* Implementado via JavaScript con focus management */
}
```

#### **Screen Reader Support**
```css
/* Contenido solo para screen readers */
.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

Esta documentación refleja fielmente la implementación actual del sistema Prompt Manager, detallando tanto su arquitectura JavaScript modular event-driven como su sofisticado sistema CSS con design tokens, theming dinámico, y optimizaciones de performance, creando una aplicación web robusta, accesible y escalable.
