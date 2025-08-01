'use strict';

/**
 * Módulo View Core - Funcionalidades principales del patrón MVC
 * Responsable de la renderización DOM principal, manipulación de elementos visuales y gestión de estados de interfaz.
 * Implementa el patrón Observer implícito mediante referencias directas a modelos globales.
 * Dependencias: window.PromptsModel, window.FoldersModel, window.Storage, window.DOMUtils, window.MESSAGES
 */
window.View = window.View || {};

Object.assign(window.View, {
    /**
     * Inicialización del módulo View - Punto de entrada principal
     * Establece referencias DOM críticas, configura estado de edición y ejecuta renderizado inicial
     * Flujo de datos: DOM -> View.container, PromptsModel.prompts -> renderPrompts()
     * Dependencias lógicas: Requiere elementos DOM preexistentes con IDs específicos
     */
    init: function () {
        // Referencia al contenedor principal de prompts - Nodo DOM crítico para renderizado
        this.container = document.getElementById('prompt-container');
        
        // Estado de edición activa - Control de flujo para renderizado condicional
        // null = modo visualización, string = ID del prompt en edición
        this.editingPromptId = null;
        
        // Configuración de auto-redimensionamiento para textarea principal
        // Patrón de mejora progresiva: funcionalidad opcional si elemento existe
        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            this.attachAutoResize(promptInput);
        }
        
        // Renderizado inicial de datos - Sincronización View-Model
        this.renderPrompts(window.PromptsModel.prompts);
        
        // Inicialización de funcionalidad de tema oscuro
        this.initDarkModeToggle();
    },

    /**
     * Configuración del toggle de modo oscuro
     * Implementa persistencia de preferencias mediante Storage y manipulación de atributos HTML
     * Patrón: Event-driven state management con sincronización DOM-Storage
     * Accesibilidad: Utiliza checkbox semántico para control de estado binario
     */
    initDarkModeToggle: function () {
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            // Recuperación de estado persistido - Sincronización Storage -> DOM
            const isDarkMode = window.Storage.getDarkModePreference();
            darkModeToggle.checked = isDarkMode;

            // Event listener para cambios de estado - Patrón Observer DOM nativo
            darkModeToggle.addEventListener('change', function () {
                // OPTIMIZACIÓN DE PERFORMANCE: Activa transiciones solo durante cambio de tema
                // Añade clase temporal para habilitar transiciones CSS
                document.body.classList.add('theme-transitioning');
                
                if (this.checked) {
                    // Activación de tema oscuro mediante data-attribute en documentElement
                    // Permite cascada CSS global sin especificidad excesiva
                    document.documentElement.setAttribute('data-theme', 'dark');
                    window.Storage.saveDarkModePreference(true);
                } else {
                    // Desactivación - Remoción de atributo para fallback a tema por defecto
                    document.documentElement.removeAttribute('data-theme');
                    window.Storage.saveDarkModePreference(false);
                }
                
                // CLEANUP DE PERFORMANCE: Remueve clase de transición después de completar
                // Timeout basado en duración de --transition-colors (típicamente 200-300ms)
                setTimeout(() => {
                    document.body.classList.remove('theme-transitioning');
                }, 300); // Duración ligeramente mayor que la transición CSS
            });
        }
    },

    /**
     * Renderizado principal de prompts con paginación y filtrado
     * Implementa patrón de renderizado completo: limpieza DOM -> filtrado -> paginación -> renderizado
     * Flujo de datos: prompts[] -> filtrado -> paginación -> DOM elements
     * Dependencias: PromptsModel.getFilteredPrompts(), FoldersModel.folders, DOMUtils, MESSAGES
     * 
     * @param {Array} prompts Array de objetos prompt del modelo
     * @param {Object} filters Objeto de filtros aplicables {text, favorite, tag, folder, order}
     * @param {number} page Página actual (base 1)
     * @param {number} itemsPerPage Elementos por página para cálculo de paginación
     */
    renderPrompts: function (prompts, filters = {}, page = 1, itemsPerPage = 10) {
        // Aplicación de filtros mediante delegación al modelo - Separación de responsabilidades
        const filtered = window.PromptsModel.getFilteredPrompts(prompts, filters);
        
        // Cálculo de paginación - Prevención de división por cero con operador OR
        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = filtered.slice(startIndex, endIndex);
        
        // Creación de mapa de folders para resolución eficiente de nombres
        // Patrón: Transformación Array -> Object para O(1) lookup
        const folderMap = (window.FoldersModel.folders || []).reduce((acc, f) => { acc[f.id] = f.name; return acc; }, {});

        // Limpieza completa del contenedor - Prevención de memory leaks y event listeners huérfanos
        window.DOMUtils.updateElement(this.container, '');

        // Manejo de estado vacío - Diferenciación entre sin datos y sin resultados filtrados
        if (!Array.isArray(filtered) || filtered.length === 0) {
            // Determinación contextual del mensaje basada en presencia de filtros activos
            const message = (filters && (filters.text || filters.favorite || filters.tag || filters.folder || filters.order))
                ? window.MESSAGES.ui.noPromptsFiltered
                : window.MESSAGES.ui.noPrompts;

            const messageElement = window.DOMUtils.createElement('p', {}, message);
            this.container.appendChild(messageElement);
            // Renderizado de paginación mínima para consistencia de interfaz
            this.renderPagination(1, 1, itemsPerPage);
            return;
        }

        // Renderizado de elementos de página actual
        pageItems.forEach((p, index) => {
            let promptElement;
            // Renderizado condicional basado en estado de edición
            // Patrón: State-dependent rendering
            if (this.editingPromptId === p.id) {
                promptElement = this.renderPromptEditForm(p);
            } else {
                promptElement = this._renderPromptDisplay(p, folderMap);
            }
            this.container.appendChild(promptElement);

            // Inserción de separadores visuales - Exclusión del último elemento
            if (index < pageItems.length - 1) {
                const divider = window.DOMUtils.createElement('hr', { className: 'prompt-divider' });
                this.container.appendChild(divider);
            }
        });

        // Renderizado de controles de paginación
        this.renderPagination(page, totalPages, itemsPerPage);
    },

    /**
     * Renderizado individual de prompt con validación y manejo de estados
     * Función de utilidad para renderizado granular - Patrón Factory Method
     * Implementa validación de entrada y renderizado condicional basado en estado de edición
     * 
     * @param {Object} p Objeto prompt con propiedades {id, text, tags, folderId, etc.}
     * @param {Object} folderMap Mapa de resolución folder.id -> folder.name
     * @returns {DocumentFragment|HTMLElement} Elemento DOM renderizado o fragmento vacío
     */
    renderPromptItem: function (p, folderMap) {
        // Validación de entrada - Prevención de errores de renderizado
        // Retorna DocumentFragment vacío para mantener consistencia de tipo de retorno
        if (!p || typeof p.text !== 'string') return document.createDocumentFragment();

        // Renderizado condicional basado en estado de edición
        if (this.editingPromptId === p.id) {
            const formElement = this.renderPromptEditForm(p);
            
            // Configuración asíncrona de focus y auto-resize
            // setTimeout(0) para ejecución post-renderizado DOM
            setTimeout(() => {
                const ta = formElement.querySelector('textarea');
                if (ta) {
                    // Aplicación de funcionalidad de auto-redimensionamiento
                    window.View.attachAutoResize(ta);
                    // Focus automático para UX mejorada en modo edición
                    ta.focus();
                }
            }, 0);
            return formElement;
        }

        // Renderizado en modo visualización
        return this._renderPromptDisplay(p, folderMap);
    },

    /**
     * Renderizado de prompt en modo visualización (método privado)
     * Construye estructura DOM completa: contenedor -> texto -> metadatos -> acciones
     * Implementa funcionalidad de texto expandible y sanitización XSS
     * Patrón: Template Method con construcción incremental de DOM
     * 
     * @param {Object} p Objeto prompt con todas las propiedades
     * @param {Object} folderMap Mapa de resolución de nombres de carpetas
     * @returns {HTMLElement} Elemento DOM completo del prompt
     */
    _renderPromptDisplay: function (p, folderMap) {
        // Contenedor principal con data-attribute para identificación
        const promptItem = window.DOMUtils.createElement('div', {
            className: 'prompt-item',
            dataset: { id: p.id }
        });

        // Sanitización de texto para prevención XSS
        const fullText = window.sanitizeHTML(p.text);
        
        // Lógica de truncamiento para textos largos - Umbral configurable en 500 caracteres
        const isTextLong = p.text.length > 500;
        const displayText = isTextLong ? window.sanitizeHTML(p.text.substring(0, 500)) + '...' : fullText;
        const expandableClass = isTextLong ? 'expandable-prompt' : '';

        // Contenedor de texto con data-attributes para funcionalidad de expansión
        // Patrón: Data-driven behavior mediante atributos HTML
        const textDiv = window.DOMUtils.createElement('div', {
            className: `prompt-text ${expandableClass}`,
            dataset: {
                fullText: fullText,           // Texto completo para expansión
                expanded: 'false',            // Estado de expansión inicial
                isLong: isTextLong.toString() // Flag de texto largo para control de comportamiento
            }
        });
        textDiv.innerHTML = displayText;
        promptItem.appendChild(textDiv);

        // Sección de metadatos - Información contextual y controles secundarios
        const metaDiv = window.DOMUtils.createElement('div', { className: 'prompt-meta' });

        // Resolución de diccionario de idioma con fallback
        // Patrón: Null coalescing para manejo de idiomas no disponibles
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        
        // Botón de favorito con estado visual dinámico
        // Accesibilidad: title attribute para screen readers
        const favButton = window.DOMUtils.createButton(
            p.favorite ? '★' : '☆',  // Estado visual mediante símbolos Unicode
            'btn btn-primary fav-btn',
            { 'data-id': p.id, title: dict.favorite }
        );
        metaDiv.appendChild(favButton);

        // Renderizado condicional de información de carpeta
        // Manejo de estados: carpeta válida, carpeta inexistente, sin carpeta
        if (p.folderId) {
            let folderSpan;
            // Validación de integridad referencial folder-prompt
            if (!folderMap[p.folderId]) {
                // Estado de error: referencia a carpeta inexistente
                folderSpan = window.DOMUtils.createElement('span', { className: 'prompt-folder folder-label-warning' }, dict.unknownFolder);
            } else {
                // Estado normal: carpeta válida con sanitización
                folderSpan = window.DOMUtils.createElement('span', { className: 'prompt-folder folder-label' }, window.sanitizeHTML(folderMap[p.folderId]));
            }
            metaDiv.appendChild(folderSpan);
        } else {
            // Estado por defecto: sin carpeta asignada
            const noFolderSpan = window.DOMUtils.createElement('span', { className: 'prompt-folder folder-label-secondary' }, dict.noFolder);
            metaDiv.appendChild(noFolderSpan);
        }

        // Renderizado condicional de tags
        // Validación de tipo y contenido para prevenir errores de iteración
        if (Array.isArray(p.tags) && p.tags.length) {
            const tagsSpan = window.DOMUtils.createElement('span', { className: 'tags' });
            p.tags.forEach(tag => {
                // Cada tag como elemento independiente con prefijo # y sanitización
                const tagSpan = window.DOMUtils.createElement('span', { className: 'tag' }, `#${window.sanitizeHTML(tag)}`);
                tagsSpan.appendChild(tagSpan);
                // Separador textual entre tags para legibilidad
                tagsSpan.appendChild(document.createTextNode(' '));
            });
            metaDiv.appendChild(tagsSpan);
        }

        // Información temporal - Fechas de creación y modificación
        // Formateo mediante toLocaleString() para localización automática
        if (p.createdAt) {
            const createdSpan = window.DOMUtils.createElement('span', { className: 'date' }, `${dict.created} ${new Date(p.createdAt).toLocaleString()}`);
            metaDiv.appendChild(createdSpan);
        }
        if (p.updatedAt) {
            const updatedSpan = window.DOMUtils.createElement('span', { className: 'date' }, `${dict.edited} ${new Date(p.updatedAt).toLocaleString()}`);
            metaDiv.appendChild(updatedSpan);
        }
        
        // Contador de uso - Validación de tipo numérico estricta
        if (typeof p.usageCount === 'number') {
            const usosSpan = window.DOMUtils.createElement('span', { className: 'usage' }, `${dict.usages} ${p.usageCount}`);
            metaDiv.appendChild(usosSpan);
        }

        promptItem.appendChild(metaDiv);

        // Sección de acciones - Controles principales de interacción
        const actionsDiv = window.DOMUtils.createElement('div', { className: 'prompt-actions' });

        // Botones de acción con data-attributes para event delegation
        // Patrón: Command pattern mediante data-id para identificación de target
        const copyButton = window.DOMUtils.createButton(dict.copy, 'btn btn-primary copy-btn', { 'data-id': p.id });
        const editButton = window.DOMUtils.createButton(dict.edit, 'btn btn-primary edit-btn', { 'data-id': p.id });
        // Botón de eliminación con clase de peligro para diferenciación visual
        const deleteButton = window.DOMUtils.createButton(dict.delete, 'btn btn-danger delete-btn', { 'data-id': p.id });

        actionsDiv.appendChild(copyButton);
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);

        promptItem.appendChild(actionsDiv);

        // Retorno del elemento DOM completo y funcional
        return promptItem;
    },

    /**
     * Renderizado de formulario de edición de prompt
     * Construye formulario completo con campos de texto, tags, carpeta y controles
     * Implementa validación HTML5 y poblado de datos existentes
     * Patrón: Form Builder con estado pre-poblado
     * 
     * @param {Object} p Objeto prompt con datos actuales para edición
     * @returns {HTMLFormElement} Formulario DOM completo y funcional
     */
    renderPromptEditForm: function (p) {
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;

        // Formulario principal con clases para estilos y data-attribute para identificación
        const form = window.DOMUtils.createElement('form', {
            className: 'edit-prompt-form mb-prompt-form',
            dataset: { id: p.id }
        });

        // Textarea principal con validación HTML5 requerida
        // Pre-poblado con texto actual del prompt
        const textarea = window.DOMUtils.createElement('textarea', {
            className: 'prompt-input mb-prompt-textarea',
            name: 'edit-text',
            required: 'required'
        }, p.text);
        form.appendChild(textarea);

        // Contenedor de fila para controles horizontales
        const formRow = window.DOMUtils.createElement('div', { className: 'prompt-form-row' });

        // Input de tags con conversión Array -> String para edición
        // Patrón: Data transformation para compatibilidad de interfaz
        const tagsInput = window.DOMUtils.createElement('input', {
            type: 'text',
            name: 'edit-tags',
            className: 'tags-input',
            value: (p.tags || []).join(', '),  // Conversión segura con fallback a array vacío
            placeholder: dict.tagsPlaceholder || 'Etiquetas (separadas por coma)'
        });
        formRow.appendChild(tagsInput);

        // Select de carpetas con opciones dinámicas del modelo
        const folderSelect = window.DOMUtils.createElement('select', {
            name: 'edit-folder',
            className: 'folder-select'
        });

        // Opción por defecto deshabilitada para forzar selección explícita
        const defaultOption = window.DOMUtils.createElement('option', {
            value: '',
            disabled: true
        }, dict.selectFolderOption || 'Selecciona una carpeta');
        folderSelect.appendChild(defaultOption);

        // Poblado dinámico de opciones desde FoldersModel
        // Sanitización de nombres para prevención XSS
        (window.FoldersModel.folders || []).forEach(f => {
            const option = window.DOMUtils.createElement('option', {
                value: f.id
            }, window.sanitizeHTML(f.name));
            folderSelect.appendChild(option);
        });

        // Establecimiento de valor seleccionado basado en datos actuales
        // Manejo de casos con y sin carpeta asignada
        if (p.folderId) {
            folderSelect.value = p.folderId;
        } else {
            folderSelect.value = '';
        }

        formRow.appendChild(folderSelect);

        // Botones de acción con tipos semánticos para comportamiento de formulario
        const saveButton = window.DOMUtils.createButton(dict.save || 'Guardar', 'btn btn-primary', { type: 'submit' });
        const cancelButton = window.DOMUtils.createButton(dict.cancel || 'Cancelar', 'btn btn-secondary cancel-edit-prompt-btn', { type: 'button' });

        formRow.appendChild(saveButton);
        formRow.appendChild(cancelButton);

        form.appendChild(formRow);

        return form;
    },

    /**
     * Toggle de expansión/contracción de texto de prompt
     * Implementa funcionalidad de mostrar/ocultar texto completo para prompts largos
     * Utiliza data-attributes para gestión de estado y contenido
     * Patrón: State machine con dos estados (expandido/contraído)
     * 
     * @param {HTMLElement} element Elemento DOM del texto del prompt con data-attributes
     */
    togglePromptTextExpansion: function (element) {
        // Verificación de elegibilidad para expansión basada en longitud
        const isLong = element.getAttribute('data-is-long') === 'true';

        if (isLong) {
            // Determinación de estado actual mediante data-attribute
            const isExpanded = element.getAttribute('data-expanded') === 'true';
            
            if (isExpanded) {
                // Transición: expandido -> contraído
                // Recuperación de texto completo y aplicación de truncamiento
                const fullText = element.getAttribute('data-full-text');
                const displayText = fullText.substring(0, 500) + '...';
                element.innerHTML = displayText;
                element.setAttribute('data-expanded', 'false');
            } else {
                // Transición: contraído -> expandido
                // Mostrar texto completo sin truncamiento
                const fullText = element.getAttribute('data-full-text');
                element.innerHTML = fullText;
                element.setAttribute('data-expanded', 'true');
            }
        }
    }
});
