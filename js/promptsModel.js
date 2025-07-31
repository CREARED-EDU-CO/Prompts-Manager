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
 * Módulo View - Capa de presentación del patrón MVC
 * Responsable de la renderización DOM, manipulación de elementos visuales y gestión de estados de interfaz.
 * Implementa el patrón Observer implícito mediante referencias directas a modelos globales.
 * Dependencias: window.PromptsModel, window.FoldersModel, window.Storage, window.DOMUtils, window.MESSAGES
 */
window.View = {
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
            });
        }
    },

    /**
     * Renderizado principal de prompts con paginación y filtrado
     * Implementa patrón de renderizado completo: limpieza DOM -> filtrado -> paginación -> renderizado
     * Flujo de datos: prompts[] -> filtrado -> paginación -> DOM elements
     * Dependencias: PromptsModel.getFilteredPrompts(), FoldersModel.folders, DOMUtils, MESSAGES
     * 
     * @param {Array} prompts - Array de objetos prompt del modelo
     * @param {Object} filters - Objeto de filtros aplicables {text, favorite, tag, folder, order}
     * @param {number} page - Página actual (base 1)
     * @param {number} itemsPerPage - Elementos por página para cálculo de paginación
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
     * @param {Object} p - Objeto prompt con propiedades {id, text, tags, folderId, etc.}
     * @param {Object} folderMap - Mapa de resolución folder.id -> folder.name
     * @returns {DocumentFragment|HTMLElement} - Elemento DOM renderizado o fragmento vacío
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
     * @param {Object} p - Objeto prompt con todas las propiedades
     * @param {Object} folderMap - Mapa de resolución de nombres de carpetas
     * @returns {HTMLElement} - Elemento DOM completo del prompt
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
     * @param {Object} p - Objeto prompt con datos actuales para edición
     * @returns {HTMLFormElement} - Formulario DOM completo y funcional
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
     * @param {HTMLElement} element - Elemento DOM del texto del prompt con data-attributes
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
    },

    /**
     * Renderizado de controles de paginación
     * Construye navegación completa con botones anterior/siguiente y páginas numeradas
     * Implementa accesibilidad mediante ARIA labels y manejo de estados deshabilitados
     * Patrón: Lazy initialization del contenedor con fallback de creación
     * 
     * @param {number} currentPage - Página actualmente activa (base 1)
     * @param {number} totalPages - Total de páginas disponibles
     * @param {number} itemsPerPage - Elementos por página (para selector de cantidad)
     */
    renderPagination: function (currentPage, totalPages, itemsPerPage) {
        // Lazy initialization del contenedor de paginación
        // Patrón: Get-or-create para elementos DOM opcionales
        let paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) {
            paginationContainer = window.DOMUtils.createElement('div', { id: 'pagination-container' });
            const paginationSection = document.getElementById('pagination-section');
            if (paginationSection) {
                paginationSection.appendChild(paginationSection);
            }
        }

        // Limpieza del contenedor para re-renderizado completo
        window.DOMUtils.updateElement(paginationContainer, '');

        // Renderizado condicional - Solo mostrar paginación si hay múltiples páginas
        if (totalPages > 1) {
            const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
            
            // Elemento nav semántico con ARIA label para accesibilidad
            const nav = window.DOMUtils.createElement('nav', {
                className: 'pagination',
                'aria-label': dict.pagination || 'Paginación'
            });

            // Botón anterior con estado condicional deshabilitado
            // ARIA label para screen readers
            const prevButton = window.DOMUtils.createButton('«', 'btn btn-secondary page-btn', {
                'data-page': currentPage - 1,
                'aria-label': dict.previous || 'Anterior'
            });
            if (currentPage === 1) prevButton.disabled = true;
            nav.appendChild(prevButton);

            // Generación de botones numerados para cada página
            // Aplicación de clase 'active' para página actual
            for (let i = 0; i < totalPages; i++) {
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                const pageButton = window.DOMUtils.createButton(
                    pageNum.toString(),
                    `btn btn-secondary page-btn${isActive ? ' active' : ''}`,
                    { 'data-page': pageNum }
                );
                nav.appendChild(pageButton);
            }

            // Botón siguiente con estado condicional deshabilitado
            const nextButton = window.DOMUtils.createButton('»', 'btn btn-secondary page-btn', {
                'data-page': currentPage + 1,
                'aria-label': dict.next || 'Siguiente'
            });
            if (currentPage === totalPages) nextButton.disabled = true;
            nav.appendChild(nextButton);

            paginationContainer.appendChild(nav);
        }

        // Selector de elementos por página - Lazy initialization
        let perPageContainer = document.getElementById('per-page-container');
        if (!perPageContainer) {
            perPageContainer = window.DOMUtils.createElement('div', { id: 'per-page-container' });
            const paginationSection = document.getElementById('pagination-section');
            if (paginationSection) {
                paginationSection.appendChild(perPageContainer);
            }
        }

        // Contenedor de configuración con estructura semántica
        const configItem = window.DOMUtils.createElement('div', { className: 'config-item' });

        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        
        // Label asociado al select mediante atributo 'for' - Accesibilidad
        const label = window.DOMUtils.createElement('label', {
            className: 'config-label',
            for: 'per-page-select'
        }, dict.view || 'Ver:');
        configItem.appendChild(label);

        // Select de opciones de paginación con ID para asociación con label
        const select = window.DOMUtils.createElement('select', {
            id: 'per-page-select',
            className: 'config-select'
        });

        // Array de opciones predefinidas - Configuración centralizada
        const perPageOptions = [5, 10, 20, 50, 100];
        perPageOptions.forEach(n => {
            const option = window.DOMUtils.createElement('option', {
                value: n
            }, `${n} ${dict.perPage || 'por página'}`);

            // Marcado de opción seleccionada basada en valor actual
            if (n === itemsPerPage) {
                option.selected = true;
            }

            select.appendChild(option);
        });

        // Establecimiento explícito de valor para consistencia
        select.value = itemsPerPage.toString();

        configItem.appendChild(select);

        // Reemplazo completo del contenido del contenedor
        window.DOMUtils.updateElement(perPageContainer, configItem);
    },

    /**
     * Actualización dinámica del filtro de tags
     * Extrae tags únicos de todos los prompts y popula el select de filtrado
     * Implementa deduplicación mediante Set y sanitización XSS
     * Patrón: Data aggregation con transformación Array -> Set -> Array
     * 
     * @param {Array} prompts - Array de prompts para extracción de tags
     */
    updateTagFilter: function (prompts) {
        const select = document.getElementById('tag-filter');
        if (!select) return;

        // Limpieza completa del select para re-poblado
        window.DOMUtils.updateElement(select, '');

        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        
        // Opción por defecto para mostrar todos los tags
        const defaultOption = window.DOMUtils.createElement('option', { value: '' }, dict.allTags);
        select.appendChild(defaultOption);

        // Extracción y deduplicación de tags
        // flatMap para aplanar arrays anidados + Set para deduplicación
        // Validación de tipo Array para prevenir errores en prompts sin tags
        const tags = Array.from(new Set(prompts.flatMap(p => Array.isArray(p.tags) ? p.tags : [])));

        // Creación de opciones con sanitización XSS
        tags.forEach(tag => {
            const sanitizedTag = window.sanitizeHTML(tag);
            const option = window.DOMUtils.createElement('option', { value: sanitizedTag }, sanitizedTag);
            select.appendChild(option);
        });
    },

    /**
     * Actualización del select de carpetas para formularios
     * Popula opciones de carpetas disponibles con opción por defecto deshabilitada
     * Implementa sanitización y fuerza selección explícita del usuario
     * Patrón: Form population con validación de selección requerida
     * 
     * @param {Array} folders - Array de objetos folder con {id, name}
     */
    updateFolderSelect: function (folders) {
        const select = document.getElementById('folder-select');
        if (!select) return;

        // Limpieza completa para re-poblado
        window.DOMUtils.updateElement(select, '');

        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        
        // Opción por defecto deshabilitada y seleccionada para forzar elección consciente
        // Patrón: Forced selection para prevenir envíos accidentales sin carpeta
        const defaultOption = window.DOMUtils.createElement('option', {
            value: '',
            disabled: true,
            selected: true
        }, dict.selectFolderOption);
        select.appendChild(defaultOption);

        // Creación de opciones con sanitización de nombres
        folders.forEach(f => {
            const option = window.DOMUtils.createElement('option', { value: f.id }, window.sanitizeHTML(f.name));
            select.appendChild(option);
        });
    },

    /**
     * Actualización del filtro de carpetas
     * Popula select de filtrado con todas las carpetas disponibles más opción "todas"
     * Diferente de updateFolderSelect: permite selección vacía para mostrar todos
     * Patrón: Filter population con opción de reset
     * 
     * @param {Array} folders - Array de objetos folder para opciones de filtrado
     */
    updateFolderFilter: function (folders) {
        const select = document.getElementById('folder-filter');
        if (!select) return;

        // Limpieza para re-poblado completo
        window.DOMUtils.updateElement(select, '');

        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        
        // Opción "todas las carpetas" habilitada para reset de filtro
        // Diferencia clave con updateFolderSelect: opción vacía habilitada
        const defaultOption = window.DOMUtils.createElement('option', { value: '' }, dict.allFolders);
        select.appendChild(defaultOption);

        // Poblado de opciones con sanitización
        folders.forEach(f => {
            const option = window.DOMUtils.createElement('option', { value: f.id }, window.sanitizeHTML(f.name));
            select.appendChild(option);
        });
    },

    /**
     * Renderizado de lista de carpetas con contadores y funcionalidad de colapso
     * Implementa ordenamiento por uso, limitación de elementos visibles y expansión bajo demanda
     * Calcula contadores de prompts por carpeta mediante filtrado
     * Patrón: Progressive disclosure con lazy loading de elementos adicionales
     * 
     * @param {Array} folders - Array de objetos folder
     * @param {Array} prompts - Array de prompts para cálculo de contadores
     */
    renderFolders: function (folders, prompts) {
        const list = document.getElementById('folders-list');
        if (!list) return;

        // Limpieza completa de la lista
        window.DOMUtils.updateElement(list, '');

        // Manejo de estado vacío
        if (!folders.length) {
            const message = window.DOMUtils.createElement('p', {},
                window.MESSAGES[window.currentLang]?.ui?.noFolders || window.MESSAGES.ui.noFolders);
            list.appendChild(message);
            this.updateTotalPromptsAndReminder(prompts);
            return;
        }

        // Cálculo de contadores de prompts por carpeta
        // Patrón: Data enrichment mediante transformación map + filter
        const foldersWithCounts = folders.map(f => {
            const count = prompts.filter(p => p.folderId === f.id).length;
            return { folder: f, count: count };
        });

        // Ordenamiento por uso descendente - Carpetas más utilizadas primero
        foldersWithCounts.sort((a, b) => b.count - a.count);

        // Configuración de límite de elementos visibles desde CONFIG global
        const visibleFoldersCount = window.CONFIG.MAX_FOLDERS_VISIBLE;
        const hasMoreFolders = foldersWithCounts.length > visibleFoldersCount;
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;

        // Renderizado de carpetas visibles inicialmente
        // slice(0, n) para obtener primeros n elementos según configuración
        foldersWithCounts.slice(0, visibleFoldersCount).forEach(item => {
            const folderItem = this._createFolderItem(item.folder, item.count, dict);
            list.appendChild(folderItem);
        });

        // Implementación de funcionalidad de colapso/expansión para carpetas adicionales
        if (hasMoreFolders) {
            // Contenedor del botón de toggle
            const toggleContainer = window.DOMUtils.createElement('div', { className: 'folders-collapse-toggle' });
            
            // Botón con texto dinámico indicando cantidad de carpetas ocultas
            const toggleBtn = window.DOMUtils.createButton(
                dict.showMoreFolders(foldersWithCounts.length - visibleFoldersCount),
                'btn btn-secondary',
                { id: 'folders-toggle-btn' }
            );
            toggleContainer.appendChild(toggleBtn);
            list.appendChild(toggleContainer);

            // Sección colapsable inicialmente oculta
            // Patrón: Progressive disclosure con control de visibilidad CSS
            const collapsedSection = window.DOMUtils.createElement('div', {
                id: 'folders-collapsed',
                className: 'folders-collapsed',
                style: 'display: none;'  // Estado inicial oculto
            });

            // Renderizado de carpetas adicionales en sección colapsable
            foldersWithCounts.slice(visibleFoldersCount).forEach(item => {
                const folderItem = this._createFolderItem(item.folder, item.count, dict);
                collapsedSection.appendChild(folderItem);
            });

            list.appendChild(collapsedSection);

            // Event listener para toggle de visibilidad
            // Patrón: State toggle con actualización de texto del botón
            toggleBtn.addEventListener('click', function () {
                const isVisible = collapsedSection.style.display !== 'none';
                collapsedSection.style.display = isVisible ? 'none' : 'block';
                
                // Actualización dinámica del texto del botón según estado
                toggleBtn.textContent = isVisible
                    ? dict.showMoreFolders(foldersWithCounts.length - visibleFoldersCount)
                    : dict.hideFolders;
            });
        }

        // Actualización de información de resumen
        this.updateTotalPromptsAndReminder(prompts);
    },

    /**
     * Actualización de contador total de prompts y recordatorio de exportación
     * Actualiza elementos de interfaz con información de resumen y recordatorios contextuales
     * Implementa actualización condicional para prevenir errores si elementos no existen
     * Patrón: Status update con safe navigation
     * 
     * @param {Array} prompts - Array de prompts para cálculo de totales
     */
    updateTotalPromptsAndReminder: function (prompts) {
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        
        // Actualización del contador total con verificación de existencia
        const totalSpan = document.getElementById('total-prompts-count');
        const reminderSpan = document.getElementById('export-reminder');
        
        if (totalSpan) {
            totalSpan.textContent = `${dict.totalPrompts} ${prompts.length}`;
        }
        
        // Actualización del recordatorio dinámico basado en actividad
        if (reminderSpan) {
            reminderSpan.textContent = this.getDynamicExportReminderByDate(prompts, window.currentLang);
        }
    },

    /**
     * Generación de recordatorio dinámico de exportación basado en actividad temporal
     * Calcula días desde última actividad y genera mensaje contextual con urgencia escalada
     * Implementa lógica de business rules para recordatorios progresivos
     * Patrón: Rule-based messaging con escalación temporal
     * 
     * @param {Array} prompts - Array de prompts para análisis temporal
     * @param {string} currentLang - Código de idioma para localización
     * @returns {string} - Mensaje de recordatorio contextualizado
     */
    getDynamicExportReminderByDate: function (prompts, currentLang = 'es') {
        const dict = window.MESSAGES[currentLang]?.ui || window.MESSAGES.ui;

        // Manejo de caso sin datos
        if (!prompts || prompts.length === 0) {
            return dict.exportReminder || "Recuerda exportar tus datos periódicamente.";
        }

        // Cálculo de fecha de actividad más reciente
        // Considera tanto creación como actualización para determinar actividad
        const mostRecentDate = Math.max(...prompts.map(prompt => {
            const createdAt = prompt.createdAt || 0;
            const updatedAt = prompt.updatedAt || 0;
            return Math.max(createdAt, updatedAt);
        }));

        // Cálculo de días transcurridos desde última actividad
        const currentTime = Date.now();
        const daysSinceLastActivity = Math.floor((currentTime - mostRecentDate) / (1000 * 60 * 60 * 24));
        const promptCount = prompts.length;

        // Lógica de escalación de urgencia basada en tiempo transcurrido
        // Patrón: Progressive urgency con iconos y mensajes diferenciados
        if (daysSinceLastActivity === 2) {
            // Recordatorio suave - 2 días
            return `📝 ${dict.exportReminderDay2.replace('{count}', promptCount)}`;
        } else if (daysSinceLastActivity === 5) {
            // Advertencia moderada - 5 días
            return `⚠️ ${dict.exportReminderDay5.replace('{count}', promptCount)}`;
        } else if (daysSinceLastActivity >= 10) {
            // Alerta crítica - 10+ días
            return `🚨 ${dict.exportReminderDay10.replace('{count}', promptCount)}`;
        }

        // Mensaje por defecto para actividad reciente
        return dict.exportReminder || "Recuerda exportar tus datos periódicamente.";
    },

    /**
     * Creación de elemento individual de carpeta (método privado)
     * Construye item de carpeta con nombre, contador y controles de acción
     * Implementa lógica de deshabilitación de eliminación para carpetas con contenido
     * Patrón: Factory method con validación de integridad referencial
     * 
     * @param {Object} folder - Objeto folder con {id, name}
     * @param {number} count - Número de prompts en la carpeta
     * @param {Object} dict - Diccionario de traducciones
     * @returns {HTMLElement} - Elemento DOM del item de carpeta
     */
    _createFolderItem: function (folder, count, dict) {
        // Contenedor principal con data-attribute para identificación
        const folderItem = window.DOMUtils.createElement('div', {
            className: 'folder-item',
            dataset: { id: folder.id }
        });

        // Nombre de carpeta con contador entre paréntesis
        // Sanitización para prevención XSS
        const nameSpan = window.DOMUtils.createElement('span', { className: 'folder-name' },
            `${window.sanitizeHTML(folder.name)} (${count})`);
        folderItem.appendChild(nameSpan);

        // Botón de edición siempre habilitado
        const editBtn = window.DOMUtils.createButton(dict.edit, 'btn btn-primary edit-folder-btn', { 'data-id': folder.id });
        folderItem.appendChild(editBtn);

        // Botón de eliminación con lógica de deshabilitación
        // Previene eliminación de carpetas con contenido para mantener integridad referencial
        const deleteBtn = window.DOMUtils.createButton(dict.delete, 'btn btn-danger delete-folder-btn', { 'data-id': folder.id });
        if (count) deleteBtn.disabled = true;  // Deshabilitado si contiene prompts
        folderItem.appendChild(deleteBtn);

        return folderItem;
    },

    /**
     * Renderizado de formulario de edición de carpeta in-place
     * Reemplaza el item de carpeta con formulario de edición inline
     * Implementa auto-expansión de sección colapsada si es necesario
     * Patrón: In-place editing con preservación de contexto visual
     * 
     * @param {Object} folder - Objeto folder a editar con {id, name}
     */
    renderEditFolderForm: function (folder) {
        // Localización del contenedor específico mediante selector de atributo
        const container = document.querySelector(`.folder-item[data-id='${folder.id}']`);
        if (!container) return;

        // Auto-expansión de sección colapsada si la carpeta está oculta
        // Mejora UX evitando que el usuario pierda contexto visual
        const collapsedSection = document.getElementById('folders-collapsed');
        if (collapsedSection && collapsedSection.contains(container) && collapsedSection.style.display === 'none') {
            collapsedSection.style.display = 'block';
            
            // Actualización del texto del botón de toggle para reflejar estado
            const toggleBtn = document.getElementById('folders-toggle-btn');
            if (toggleBtn) {
                const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
                toggleBtn.textContent = dict.hideFolders;
            }
        }

        // Limpieza completa del contenedor para inserción de formulario
        window.DOMUtils.updateElement(container, '');

        // Formulario de edición con data-attribute para identificación
        const form = window.DOMUtils.createElement('form', {
            className: 'edit-folder-form',
            dataset: { id: folder.id }
        });

        // Input pre-poblado con nombre actual y validación HTML5
        const input = window.DOMUtils.createElement('input', {
            type: 'text',
            name: 'edit-folder-name',
            value: folder.name,
            required: 'required'
        });
        form.appendChild(input);

        // Botones de acción con tipos semánticos
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        const saveBtn = window.DOMUtils.createButton(dict.save, 'btn btn-primary', { type: 'submit' });
        const cancelBtn = window.DOMUtils.createButton(dict.cancel, 'btn btn-secondary cancel-edit-folder-btn', { type: 'button' });

        form.appendChild(saveBtn);
        form.appendChild(cancelBtn);

        container.appendChild(form);
    },

    /**
     * Visualización de mensaje de importación con auto-ocultamiento
     * Muestra mensaje temporal con codificación de color según estado de éxito/error
     * Implementa auto-limpieza mediante setTimeout para UX no intrusiva
     * Patrón: Temporary notification con visual feedback
     * 
     * @param {string} msg - Mensaje a mostrar
     * @param {boolean} ok - true para éxito (verde), false para error (rojo)
     */
    showImportMessage: function (msg, ok = false) {
        const el = document.getElementById('import-msg');
        if (!el) return;

        // Establecimiento de contenido y color basado en estado
        el.textContent = msg;
        el.style.color = ok ? 'green' : 'red';
        
        // Auto-limpieza después de 4 segundos para evitar acumulación de mensajes
        setTimeout(() => { el.textContent = ''; }, 4000);
    },

    /**
     * Función de auto-redimensionamiento de textarea
     * Ajusta altura del elemento basada en scrollHeight para eliminar scrollbars
     * Implementa reset a 'auto' para recálculo correcto del scrollHeight
     * Patrón: Dynamic sizing con recalculación de dimensiones
     * 
     * @param {HTMLElement} el - Elemento textarea a redimensionar
     */
    autoResize: function (el) {
        if (!el) return;
        
        // Reset a altura automática para permitir shrinking
        el.style.height = 'auto';
        // Establecimiento de altura basada en contenido real
        el.style.height = (el.scrollHeight) + 'px';
    },

    /**
     * Vinculación de funcionalidad de auto-redimensionamiento a elemento
     * Configura event listener para input y ejecuta redimensionamiento inicial
     * Patrón: Event binding con inicialización inmediata
     * 
     * @param {HTMLElement} el - Elemento textarea para configurar auto-resize
     */
    attachAutoResize: function (el) {
        if (!el) return;
        
        // Event listener para redimensionamiento en tiempo real durante escritura
        el.addEventListener('input', function () {
            window.View.autoResize(this);
        });
        
        // Redimensionamiento inicial para contenido pre-existente
        window.View.autoResize(el);
    },

    /**
     * Reset completo del formulario de creación de prompts
     * Limpia todos los campos del formulario y ajusta dimensiones de textarea
     * Implementa verificación de existencia de elementos para robustez
     * Patrón: Form reset con safe navigation y cleanup de estado visual
     */
    resetPromptForm: function () {
        // Referencias a elementos del formulario con verificación de existencia
        const input = document.getElementById('prompt-input');
        const tagsInput = document.getElementById('tags-input');
        const folderSelect = document.getElementById('folder-select');
        
        // Limpieza de valores con safe navigation
        if (input) input.value = '';
        if (tagsInput) tagsInput.value = '';
        if (folderSelect) folderSelect.value = '';
        
        // Redimensionamiento del textarea principal después del reset
        // Verificación de disponibilidad de función para prevenir errores
        if (window.View && typeof window.View.autoResize === 'function' && input) {
            window.View.autoResize(input);
        }
    },

    /**
     * Visualización de mensaje de prompt con auto-ocultamiento
     * Muestra mensaje temporal con clase CSS para animaciones y visibilidad
     * Implementa cleanup automático de contenido y clases CSS
     * Patrón: Temporary notification con CSS class-based animations
     * 
     * @param {string} msg - Mensaje a mostrar al usuario
     */
    showPromptMsg: function (msg) {
        const msgDiv = document.getElementById('prompt-msg');
        if (msgDiv) {
            // Establecimiento de contenido y activación de visibilidad
            msgDiv.textContent = msg;
            msgDiv.classList.add('visible');
            
            // Auto-limpieza después de 4 segundos
            // Limpia tanto contenido como clase CSS para reset completo
            setTimeout(() => {
                msgDiv.textContent = '';
                msgDiv.classList.remove('visible');
            }, 4000);
        }
    },

    /**
     * Control de visibilidad del panel de opciones de importación
     * Alterna display CSS entre flex y none para mostrar/ocultar panel modal
     * Implementa control directo de visibilidad mediante manipulación de estilos
     * Patrón: Visibility toggle con layout preservation (flex)
     * 
     * @param {boolean} visible - true para mostrar, false para ocultar
     */
    setImportChoicePanelVisible: function (visible) {
        const panel = document.getElementById('import-choice-panel');
        if (panel) {
            // Toggle entre flex (visible con layout) y none (oculto)
            // flex preserva el layout del panel modal cuando es visible
            panel.style.display = visible ? 'flex' : 'none';
        }
    }
};
