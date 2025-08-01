# DOCUMENTACIÓN TÉCNICA COMPLETA DEL SISTEMA PROMPT MANAGER

## ARQUITECTURA GENERAL DEL SISTEMA

### Paradigma Arquitectónico
El sistema implementa una **Aplicación de Página Única (SPA)** basada en el patrón **Model-View-Controller (MVC)** con arquitectura modular desacoplada. La aplicación utiliza **JavaScript ES6+ vanilla** sin frameworks externos, implementando patrones de diseño avanzados para gestión de estado, comunicación inter-módulos y optimización de rendimiento.

### Estructura Jerárquica de Dependencias
```
CAPA 1 - FUNDAMENTOS:
├── constants.js (Configuración global y constantes)
├── eventBus.js (Sistema de eventos pub/sub)
├── performance.js (Utilidades de optimización)
├── utils.js (Funciones de utilidad general)
└── domUtils.js (Manipulación DOM optimizada)

CAPA 2 - INTERNACIONALIZACIÓN:
└── i18n.js (Sistema de traducciones es/en)

CAPA 3 - PERSISTENCIA Y MODELOS:
├── storage.js (Abstracción de localStorage)
├── promptsModel.js (Modelo de datos de prompts)
└── foldersModel.js (Modelo de datos de carpetas)

CAPA 4 - VISTA:
├── view/core.js (Renderizado principal)
├── view/pagination.js (Sistema de paginación)
└── view/folders.js (Gestión de carpetas)

CAPA 5 - CONTROLADORES ESPECIALIZADOS:
├── controllers/filtersController.js (Gestión de filtros)
├── controllers/paginationController.js (Control de paginación)
├── controllers/promptFormController.js (Formulario de prompts)
├── controllers/promptContainerController.js (Contenedor de prompts)
├── controllers/foldersController.js (Gestión de carpetas)
└── controllers/importExportController.js (I/O de archivos)

CAPA 6 - COORDINACIÓN:
├── controller.js (Controlador principal MVC)
└── app.js (Bootstrap y inicialización)
```

## MODELO DE DATOS Y ESTRUCTURAS

### Esquema de Entidad Prompt
```javascript
{
  id: string,              // UUID único generado por crypto.randomUUID()
  text: string,            // Contenido del prompt (máximo 10,000 caracteres)
  tags: string[],          // Array de etiquetas para categorización
  favorite: boolean,       // Estado de favorito para filtrado prioritario
  folderId: string|null,   // Referencia a carpeta (obligatoria)
  createdAt: number,       // Timestamp de creación (Date.now())
  updatedAt: number,       // Timestamp de última modificación
  usageCount: number       // Contador de usos para estadísticas
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

### 1. Model-View-Controller (MVC)
- **Model**: `PromptsModel`, `FoldersModel` - Gestión de datos y lógica de negocio
- **View**: `View` object - Renderizado DOM y manipulación visual
- **Controller**: `Controller` + controladores especializados - Lógica de aplicación

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
window.DOMUtils.createElement(tag, attrs, content)

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
getFilteredPrompts(prompts, filters) {
  let filtered = [...prompts];  // Copia defensiva
  
  // Aplicación secuencial de filtros
  if (filters.folder) filtered = filtered.filter(p => p.folderId === filters.folder);
  if (filters.text) filtered = filtered.filter(p => 
    p.text.toLowerCase().includes(filters.text.toLowerCase()));
  if (filters.favorite) filtered = filtered.filter(p => p.favorite);
  if (filters.tag) filtered = filtered.filter(p => 
    Array.isArray(p.tags) && p.tags.includes(filters.tag));
  
  // Ordenamiento con múltiples criterios
  if (filters.order === 'usage') {
    filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  } else if (filters.order === 'updatedAt') {
    filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } else {
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
  // Mensajes base en español (compatibilidad)
  errors: { /* mensajes de error */ },
  success: { /* mensajes de éxito */ },
  confirm: { /* mensajes de confirmación */ },
  ui: { /* elementos de interfaz */ },
  
  // Traducciones específicas por idioma
  en: {
    errors: { /* error messages */ },
    success: { /* success messages */ },
    confirm: { /* confirmation messages */ },
    ui: { /* UI elements */ }
  }
}
```

### Aplicación Dinámica de Traducciones
```javascript
window.applyI18n = function(lang) {
  const dict = window.MESSAGES[lang]?.ui || window.MESSAGES.ui;
  
  // Traducción de contenido
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = dict[key.split('.').pop()];
    if (value) el.innerText = typeof value === 'function' ? value(0) : value;
  });
  
  // Traducción de placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const value = dict[key.split('.').pop()];
    if (value) el.setAttribute('placeholder', value);
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
  return function executedFunction(...args) {
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
}
```

### Batch DOM Updates
```javascript
batchDOMUpdates(operations) {
  if (!Array.isArray(operations)) operations = [operations];
  requestAnimationFrame(() => {
    operations.forEach(operation => {
      if (typeof operation === 'function') operation();
    });
  });
}
```

### Lazy Loading con Intersection Observer
```javascript
lazyLoad(elements, callback, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target, entry);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '50px', threshold: 0.1, ...options });
  
  elements.forEach(el => observer.observe(el));
  return observer;
}
```

## SISTEMA DE VALIDACIÓN

### Validación de Prompts
```javascript
_validatePromptData(text, folderId) {
  // Validación de longitud
  if (text.length > window.CONFIG.MAX_PROMPT_LENGTH) {
    window.showToast(messages.errors.promptTooLong.replace('{max}', maxLength), 'error');
    return false;
  }
  
  // Validación de prerequisitos
  if (!window.FoldersModel.folders.length) {
    window.showToast(messages.errors.mustCreateFolder, 'error');
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
  toast.innerHTML = '';
  
  // Construcción de icono
  if (opts.icon || type === 'success' || type === 'error') {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = opts.icon || (type === 'success' ? '✔️' : '❌');
    toast.appendChild(iconSpan);
  }
  
  // Mensaje
  const msgSpan = document.createElement('span');
  msgSpan.textContent = msg;
  toast.appendChild(msgSpan);
  
  // Aplicación de clases y auto-dismiss
  toast.className = `toast visible toast-${type === 'error' ? 'error' : 'success'}`;
  const duration = opts.duration || window.CONFIG.TOAST_DURATION;
  
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.innerHTML = '', 300);
  }, duration);
}
```

### Modal de Confirmación
```javascript
window.showConfirmModal = function(msg) {
  return new Promise(resolve => {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-modal-msg');
    const acceptBtn = document.getElementById('confirm-modal-accept');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    
    msgEl.textContent = msg;
    modal.classList.add('active');
    
    function cleanup(result) {
      modal.classList.remove('active');
      acceptBtn.removeEventListener('click', onAccept);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    }
    
    const onAccept = () => cleanup(true);
    const onCancel = () => cleanup(false);
    
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
    // FASE 1: Validación de dependencias críticas
    if (!window.STORAGE_KEYS) {
      // Fallback de emergencia
      window.STORAGE_KEYS = { /* valores por defecto */ };
    }
    
    // FASE 2: Inicialización de persistencia y modelos
    await Promise.all([
      this.initModule('Storage'),
      this.initModule('PromptsModel'),
      this.initModule('FoldersModel')
    ]);
    
    // FASE 3: Configuración de internacionalización
    if (typeof window.initLanguage === 'function') {
      window.initLanguage();
    }
    
    // FASE 4: Inicialización de interfaz
    await Promise.all([
      this.initModule('View'),
      this.initModule('Controller')
    ]);
    
    // FASE 5: Notificación de aplicación lista
    window.EventBus.emit('app:ready');
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
Usuario → Formulario → Validación → PromptsModel.addPrompt() → 
Storage.savePrompts() → Controller.updateAllViews() → 
View.renderPrompts() → DOM Update → Toast Feedback
```

### Filtrado de Prompts
```
Usuario → FiltersController.state → PromptsModel.getFilteredPrompts() → 
PaginationController.renderPromptsWithPagination() → View.renderPrompts() → DOM Update
```

### Importación de Datos
```
Usuario → File Picker → FileReader → JSON.parse() → Validación → 
Modal de Elección → Replace/Merge → Models Update → 
Storage.save() → Controller.updateAllViews() → Toast Feedback
```

Esta documentación proporciona una visión completa y técnica del sistema Prompt Manager, detallando su arquitectura modular, patrones de diseño, flujos de datos y optimizaciones implementadas para crear una aplicación web robusta y escalable.
