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
window.View = {
    init: function () {
        this.container = document.getElementById('prompt-container');
        this.editingPromptId = null;
        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            this.attachAutoResize(promptInput);
        }
        this.renderPrompts(window.PromptsModel.prompts);
        this.initDarkModeToggle();
    },

    initDarkModeToggle: function () {
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            // Obtener la preferencia guardada
            const isDarkMode = window.Storage.getDarkModePreference();

            // Establecer el estado inicial del checkbox (el tema ya fue aplicado por Storage.initDarkMode)
            darkModeToggle.checked = isDarkMode;

            // Añadir evento para cambiar el modo
            darkModeToggle.addEventListener('change', function () {
                if (this.checked) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    window.Storage.saveDarkModePreference(true);
                } else {
                    document.documentElement.removeAttribute('data-theme');
                    window.Storage.saveDarkModePreference(false);
                }
            });
        }
    },

    // --- Renderizado ---
    renderPrompts: function (prompts, filters = {}, page = 1, itemsPerPage = 10) {
        const filtered = window.PromptsModel.getFilteredPrompts(prompts, filters);
        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = filtered.slice(startIndex, endIndex);
        const folderMap = (window.FoldersModel.folders || []).reduce((acc, f) => { acc[f.id] = f.name; return acc; }, {});

        // Limpiar el contenedor SOLO de prompts
        window.DOMUtils.updateElement(this.container, '');

        if (!Array.isArray(filtered) || filtered.length === 0) {
            // Mostrar mensaje de no hay prompts
            const message = (filters && (filters.text || filters.favorite || filters.tag || filters.folder || filters.order))
                ? window.MESSAGES.ui.noPromptsFiltered
                : window.MESSAGES.ui.noPrompts;

            const messageElement = window.DOMUtils.createElement('p', {}, message);
            this.container.appendChild(messageElement);
            this.renderPagination(1, 1, itemsPerPage);
            return;
        }

        // Renderizar cada prompt
        pageItems.forEach((p, index) => {
            let promptElement;
            if (this.editingPromptId === p.id) {
                promptElement = this.renderPromptEditForm(p);
            } else {
                promptElement = this._renderPromptDisplay(p, folderMap);
            }
            this.container.appendChild(promptElement);

            // Añadir separador después de cada prompt excepto el último
            if (index < pageItems.length - 1) {
                const divider = window.DOMUtils.createElement('hr', { className: 'prompt-divider' });
                this.container.appendChild(divider);
            }
        });

        this.renderPagination(page, totalPages, itemsPerPage);
    },

    renderPromptItem: function (p, folderMap) {
        if (!p || typeof p.text !== 'string') return document.createDocumentFragment();

        if (this.editingPromptId === p.id) {
            const formElement = this.renderPromptEditForm(p);
            setTimeout(() => {
                const ta = formElement.querySelector('textarea');
                if (ta) {
                    window.View.attachAutoResize(ta);
                    ta.focus();
                }
            }, 0);
            return formElement;
        }

        // Crear el elemento principal del prompt
        return this._renderPromptDisplay(p, folderMap);
    },

    _renderPromptDisplay: function (p, folderMap) {
        // Crear el elemento principal del prompt
        const promptItem = window.DOMUtils.createElement('div', {
            className: 'prompt-item',
            dataset: { id: p.id }
        });

        // Limitar el texto a 500 caracteres y añadir indicador si es más largo
        const fullText = window.sanitizeHTML(p.text);
        const isTextLong = p.text.length > 500;
        const displayText = isTextLong ? window.sanitizeHTML(p.text.substring(0, 500)) + '...' : fullText;
        const expandableClass = isTextLong ? 'expandable-prompt' : '';

        // Crear el contenedor de texto
        const textDiv = window.DOMUtils.createElement('div', {
            className: `prompt-text ${expandableClass}`,
            dataset: {
                fullText: fullText,
                expanded: 'false',
                isLong: isTextLong.toString()
            }
        });
        textDiv.innerHTML = displayText; // Usar innerHTML para preservar el HTML sanitizado
        promptItem.appendChild(textDiv);

        // Crear la sección de metadatos
        const metaDiv = window.DOMUtils.createElement('div', { className: 'prompt-meta' });

        // Botón de favorito
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        const favButton = window.DOMUtils.createButton(
            p.favorite ? '★' : '☆',
            'btn btn-primary fav-btn',
            { 'data-id': p.id, title: dict.favorite }
        );
        metaDiv.appendChild(favButton);

        // Añadir carpeta
        if (p.folderId) {
            let folderSpan;
            if (!folderMap[p.folderId]) {
                folderSpan = window.DOMUtils.createElement('span', { className: 'prompt-folder folder-label-warning' }, dict.unknownFolder);
            } else {
                folderSpan = window.DOMUtils.createElement('span', { className: 'prompt-folder folder-label' }, window.sanitizeHTML(folderMap[p.folderId]));
            }
            metaDiv.appendChild(folderSpan);
        } else {
            const noFolderSpan = window.DOMUtils.createElement('span', { className: 'prompt-folder folder-label-secondary' }, dict.noFolder);
            metaDiv.appendChild(noFolderSpan);
        }

        // Añadir etiquetas
        if (Array.isArray(p.tags) && p.tags.length) {
            const tagsSpan = window.DOMUtils.createElement('span', { className: 'tags' });
            p.tags.forEach(tag => {
                const tagSpan = window.DOMUtils.createElement('span', { className: 'tag' }, `#${window.sanitizeHTML(tag)}`);
                tagsSpan.appendChild(tagSpan);
                tagsSpan.appendChild(document.createTextNode(' '));
            });
            metaDiv.appendChild(tagsSpan);
        }

        // Añadir fechas
        if (p.createdAt) {
            const createdSpan = window.DOMUtils.createElement('span', { className: 'date' }, `${dict.created} ${new Date(p.createdAt).toLocaleString()}`);
            metaDiv.appendChild(createdSpan);
        }
        if (p.updatedAt) {
            const updatedSpan = window.DOMUtils.createElement('span', { className: 'date' }, `${dict.edited} ${new Date(p.updatedAt).toLocaleString()}`);
            metaDiv.appendChild(updatedSpan);
        }
        if (typeof p.usageCount === 'number') {
            const usosSpan = window.DOMUtils.createElement('span', { className: 'usage' }, `${dict.usages} ${p.usageCount}`);
            metaDiv.appendChild(usosSpan);
        }

        promptItem.appendChild(metaDiv);

        // Crear la sección de acciones
        const actionsDiv = window.DOMUtils.createElement('div', { className: 'prompt-actions' });

        // Botones de acción
        const copyButton = window.DOMUtils.createButton(dict.copy, 'btn btn-primary copy-btn', { 'data-id': p.id });
        const editButton = window.DOMUtils.createButton(dict.edit, 'btn btn-primary edit-btn', { 'data-id': p.id });
        const deleteButton = window.DOMUtils.createButton(dict.delete, 'btn btn-danger delete-btn', { 'data-id': p.id });

        actionsDiv.appendChild(copyButton);
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);

        promptItem.appendChild(actionsDiv);

        return promptItem;
    },

    renderPromptEditForm: function (p) {
        // Asegurarse de que dict esté definido correctamente según el idioma actual
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;

        const form = window.DOMUtils.createElement('form', {
            className: 'edit-prompt-form mb-prompt-form',
            dataset: { id: p.id }
        });

        // Textarea para el texto del prompt
        const textarea = window.DOMUtils.createElement('textarea', {
            className: 'prompt-input mb-prompt-textarea',
            name: 'edit-text',
            required: 'required'
        }, p.text);
        form.appendChild(textarea);

        // Fila de formulario para etiquetas, carpeta y botones
        const formRow = window.DOMUtils.createElement('div', { className: 'prompt-form-row' });

        // Input para etiquetas
        const tagsInput = window.DOMUtils.createElement('input', {
            type: 'text',
            name: 'edit-tags',
            className: 'tags-input',
            value: (p.tags || []).join(', '),
            placeholder: dict.tagsPlaceholder || 'Etiquetas (separadas por coma)'
        });
        formRow.appendChild(tagsInput);

        // Select para carpetas
        const folderSelect = window.DOMUtils.createElement('select', {
            name: 'edit-folder',
            className: 'folder-select'
        });

        // Opción por defecto
        const defaultOption = window.DOMUtils.createElement('option', {
            value: '',
            disabled: true
        }, dict.selectFolderOption || 'Selecciona una carpeta');
        folderSelect.appendChild(defaultOption);

        // Opciones de carpetas
        (window.FoldersModel.folders || []).forEach(f => {
            const option = window.DOMUtils.createElement('option', {
                value: f.id
            }, window.sanitizeHTML(f.name));
            folderSelect.appendChild(option);
        });

        // Establecer el valor seleccionado después de crear todas las opciones
        if (p.folderId) {
            folderSelect.value = p.folderId;
        } else {
            folderSelect.value = '';
        }

        formRow.appendChild(folderSelect);

        // Botones
        const saveButton = window.DOMUtils.createButton(dict.save || 'Guardar', 'btn btn-primary', { type: 'submit' });
        const cancelButton = window.DOMUtils.createButton(dict.cancel || 'Cancelar', 'btn btn-secondary cancel-edit-prompt-btn', { type: 'button' });

        formRow.appendChild(saveButton);
        formRow.appendChild(cancelButton);

        form.appendChild(formRow);

        return form;
    },

    togglePromptTextExpansion: function (element) {
        // Verificar si el elemento es un prompt largo
        const isLong = element.getAttribute('data-is-long') === 'true';

        if (isLong) {
            const isExpanded = element.getAttribute('data-expanded') === 'true';
            if (isExpanded) {
                // Si está expandido, contraer
                const fullText = element.getAttribute('data-full-text');
                const displayText = fullText.substring(0, 500) + '...';
                element.innerHTML = displayText;
                element.setAttribute('data-expanded', 'false');
            } else {
                // Si está contraído, expandir
                const fullText = element.getAttribute('data-full-text');
                element.innerHTML = fullText;
                element.setAttribute('data-expanded', 'true');
            }
        }
    },

    renderPagination: function (currentPage, totalPages, itemsPerPage) {
        // Obtener o crear el contenedor de paginación
        let paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) {
            paginationContainer = window.DOMUtils.createElement('div', { id: 'pagination-container' });
            const paginationSection = document.getElementById('pagination-section');
            if (paginationSection) {
                paginationSection.appendChild(paginationContainer);
            }
        }

        // Limpiar el contenedor
        window.DOMUtils.updateElement(paginationContainer, '');

        // Crear los botones de paginación si hay más de una página
        if (totalPages > 1) {
            const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
            const nav = window.DOMUtils.createElement('nav', {
                className: 'pagination',
                'aria-label': dict.pagination || 'Paginación'
            });

            // Botón anterior
            const prevButton = window.DOMUtils.createButton('«', 'btn btn-secondary page-btn', {
                'data-page': currentPage - 1,
                'aria-label': dict.previous || 'Anterior'
            });
            if (currentPage === 1) prevButton.disabled = true;
            nav.appendChild(prevButton);

            // Botones de página
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

            // Botón siguiente
            const nextButton = window.DOMUtils.createButton('»', 'btn btn-secondary page-btn', {
                'data-page': currentPage + 1,
                'aria-label': dict.next || 'Siguiente'
            });
            if (currentPage === totalPages) nextButton.disabled = true;
            nav.appendChild(nextButton);

            paginationContainer.appendChild(nav);
        }

        // Obtener o crear el contenedor del selector de elementos por página
        let perPageContainer = document.getElementById('per-page-container');
        if (!perPageContainer) {
            perPageContainer = window.DOMUtils.createElement('div', { id: 'per-page-container' });
            const paginationSection = document.getElementById('pagination-section');
            if (paginationSection) {
                paginationSection.appendChild(perPageContainer);
            }
        }

        // Crear el selector de elementos por página
        const configItem = window.DOMUtils.createElement('div', { className: 'config-item' });

        // Crear la etiqueta
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        const label = window.DOMUtils.createElement('label', {
            className: 'config-label',
            for: 'per-page-select'
        }, dict.view || 'Ver:');
        configItem.appendChild(label);

        // Crear el selector
        const select = window.DOMUtils.createElement('select', {
            id: 'per-page-select',
            className: 'config-select'
        });

        // Añadir opciones y asegurar que se seleccione la correcta
        const perPageOptions = [5, 10, 20, 50, 100];
        perPageOptions.forEach(n => {
            const option = window.DOMUtils.createElement('option', {
                value: n
            }, `${n} ${dict.perPage || 'por página'}`);

            // Establecer el atributo selected directamente en el elemento
            if (n === itemsPerPage) {
                option.selected = true;
            }

            select.appendChild(option);
        });

        // Asegurar que el valor seleccionado coincida con itemsPerPage
        select.value = itemsPerPage.toString();

        configItem.appendChild(select);

        // Actualizar el contenedor
        window.DOMUtils.updateElement(perPageContainer, configItem);
    },

    updateTagFilter: function (prompts) {
        const select = document.getElementById('tag-filter');
        if (!select) return;

        // Limpiar opciones existentes
        window.DOMUtils.updateElement(select, '');

        // Crear y añadir la opción por defecto
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        const defaultOption = window.DOMUtils.createElement('option', { value: '' }, dict.allTags);
        select.appendChild(defaultOption);

        // Obtener etiquetas únicas
        const tags = Array.from(new Set(prompts.flatMap(p => Array.isArray(p.tags) ? p.tags : [])));

        // Crear y añadir opciones para cada etiqueta
        tags.forEach(tag => {
            const sanitizedTag = window.sanitizeHTML(tag);
            const option = window.DOMUtils.createElement('option', { value: sanitizedTag }, sanitizedTag);
            select.appendChild(option);
        });
    },

    updateFolderSelect: function (folders) {
        const select = document.getElementById('folder-select');
        if (!select) return;

        // Limpiar opciones existentes
        window.DOMUtils.updateElement(select, '');

        // Crear y añadir la opción por defecto
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        const defaultOption = window.DOMUtils.createElement('option', {
            value: '',
            disabled: true,
            selected: true
        }, dict.selectFolderOption);
        select.appendChild(defaultOption);

        // Crear y añadir opciones para cada carpeta
        folders.forEach(f => {
            const option = window.DOMUtils.createElement('option', { value: f.id }, window.sanitizeHTML(f.name));
            select.appendChild(option);
        });
    },

    updateFolderFilter: function (folders) {
        const select = document.getElementById('folder-filter');
        if (!select) return;

        // Limpiar opciones existentes
        window.DOMUtils.updateElement(select, '');

        // Crear y añadir la opción por defecto
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        const defaultOption = window.DOMUtils.createElement('option', { value: '' }, dict.allFolders);
        select.appendChild(defaultOption);

        // Crear y añadir opciones para cada carpeta
        folders.forEach(f => {
            const option = window.DOMUtils.createElement('option', { value: f.id }, window.sanitizeHTML(f.name));
            select.appendChild(option);
        });
    },

    renderFolders: function (folders, prompts) {
        const list = document.getElementById('folders-list');
        if (!list) return;

        // Limpiar la lista antes de renderizar
        window.DOMUtils.updateElement(list, '');

        if (!folders.length) {
            const message = window.DOMUtils.createElement('p', {},
                window.MESSAGES[window.currentLang]?.ui?.noFolders || window.MESSAGES.ui.noFolders);
            list.appendChild(message);
            // Actualizar contador y recordatorio
            this.updateTotalPromptsAndReminder(prompts);
            return;
        }

        // Crear un array con las carpetas y sus conteos de prompts
        const foldersWithCounts = folders.map(f => {
            const count = prompts.filter(p => p.folderId === f.id).length;
            return { folder: f, count: count };
        });

        // Ordenar las carpetas por cantidad de prompts (descendente)
        foldersWithCounts.sort((a, b) => b.count - a.count);

        // Número máximo de carpetas a mostrar inicialmente
        const visibleFoldersCount = window.CONFIG.MAX_FOLDERS_VISIBLE;
        const hasMoreFolders = foldersWithCounts.length > visibleFoldersCount;
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;

        // Mostrar las primeras 5 carpetas
        foldersWithCounts.slice(0, visibleFoldersCount).forEach(item => {
            const folderItem = this._createFolderItem(item.folder, item.count, dict);
            list.appendChild(folderItem);
        });

        // Si hay más carpetas, añadir un contenedor colapsable
        if (hasMoreFolders) {
            // Botón para mostrar/ocultar carpetas adicionales
            const toggleContainer = window.DOMUtils.createElement('div', { className: 'folders-collapse-toggle' });
            const toggleBtn = window.DOMUtils.createButton(
                dict.showMoreFolders(foldersWithCounts.length - visibleFoldersCount),
                'btn btn-secondary',
                { id: 'folders-toggle-btn' }
            );
            toggleContainer.appendChild(toggleBtn);
            list.appendChild(toggleContainer);

            // Contenedor colapsable para carpetas adicionales
            const collapsedSection = window.DOMUtils.createElement('div', {
                id: 'folders-collapsed',
                className: 'folders-collapsed',
                style: 'display: none;'
            });

            // Añadir el resto de carpetas en el contenedor colapsable
            foldersWithCounts.slice(visibleFoldersCount).forEach(item => {
                const folderItem = this._createFolderItem(item.folder, item.count, dict);
                collapsedSection.appendChild(folderItem);
            });

            list.appendChild(collapsedSection);

            // Añadir el evento para mostrar/ocultar carpetas adicionales
            toggleBtn.addEventListener('click', function () {
                const isVisible = collapsedSection.style.display !== 'none';
                collapsedSection.style.display = isVisible ? 'none' : 'block';
                toggleBtn.textContent = isVisible
                    ? dict.showMoreFolders(foldersWithCounts.length - visibleFoldersCount)
                    : dict.hideFolders;
            });
        }

        // Actualizar contador y recordatorio
        this.updateTotalPromptsAndReminder(prompts);
    },

    updateTotalPromptsAndReminder: function (prompts) {
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        const totalSpan = document.getElementById('total-prompts-count');
        const reminderSpan = document.getElementById('export-reminder');
        if (totalSpan) {
            totalSpan.textContent = `${dict.totalPrompts} ${prompts.length}`;
        }
        if (reminderSpan) {
            reminderSpan.textContent = this.getDynamicExportReminderByDate(prompts, window.currentLang);
        }
    },

    // Función para obtener recordatorio dinámico basado en actividad reciente
    getDynamicExportReminderByDate: function (prompts, currentLang = 'es') {
        const dict = window.MESSAGES[currentLang]?.ui || window.MESSAGES.ui;

        // Si no hay prompts, usar mensaje estándar
        if (!prompts || prompts.length === 0) {
            return dict.exportReminder || "Recuerda exportar tus datos periódicamente.";
        }

        // Encontrar la fecha más reciente (creación o edición)
        const mostRecentDate = Math.max(...prompts.map(prompt => {
            const createdAt = prompt.createdAt || 0;
            const updatedAt = prompt.updatedAt || 0;
            return Math.max(createdAt, updatedAt);
        }));

        // Calcular días desde la última actividad
        const currentTime = Date.now();
        const daysSinceLastActivity = Math.floor((currentTime - mostRecentDate) / (1000 * 60 * 60 * 24));
        const promptCount = prompts.length;

        // Mostrar mensaje solo en días específicos usando mensajes de i18n
        if (daysSinceLastActivity === 2) {
            return `📝 ${dict.exportReminderDay2.replace('{count}', promptCount)}`;
        } else if (daysSinceLastActivity === 5) {
            return `⚠️ ${dict.exportReminderDay5.replace('{count}', promptCount)}`;
        } else if (daysSinceLastActivity >= 10) {
            return `🚨 ${dict.exportReminderDay10.replace('{count}', promptCount)}`;
        }

        // Para todos los otros días, usar mensaje estándar
        return dict.exportReminder || "Recuerda exportar tus datos periódicamente.";
    },

    _createFolderItem: function (folder, count, dict) {
        const folderItem = window.DOMUtils.createElement('div', {
            className: 'folder-item',
            dataset: { id: folder.id }
        });

        // Nombre de la carpeta con contador
        const nameSpan = window.DOMUtils.createElement('span', { className: 'folder-name' },
            `${window.sanitizeHTML(folder.name)} (${count})`);
        folderItem.appendChild(nameSpan);

        // Botón de editar
        const editBtn = window.DOMUtils.createButton(dict.edit, 'btn btn-primary edit-folder-btn', { 'data-id': folder.id });
        folderItem.appendChild(editBtn);

        // Botón de eliminar (deshabilitado si la carpeta tiene prompts)
        const deleteBtn = window.DOMUtils.createButton(dict.delete, 'btn btn-danger delete-folder-btn', { 'data-id': folder.id });
        if (count) deleteBtn.disabled = true;
        folderItem.appendChild(deleteBtn);

        return folderItem;
    },

    renderEditFolderForm: function (folder) {
        const container = document.querySelector(`.folder-item[data-id='${folder.id}']`);
        if (!container) return;

        // Si la carpeta está en el contenedor colapsable, asegurarse de que esté visible
        const collapsedSection = document.getElementById('folders-collapsed');
        if (collapsedSection && collapsedSection.contains(container) && collapsedSection.style.display === 'none') {
            collapsedSection.style.display = 'block';
            const toggleBtn = document.getElementById('folders-toggle-btn');
            if (toggleBtn) {
                const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
                toggleBtn.textContent = dict.hideFolders;
            }
        }

        // Limpiar el contenedor
        window.DOMUtils.updateElement(container, '');

        // Crear el formulario de edición
        const form = window.DOMUtils.createElement('form', {
            className: 'edit-folder-form',
            dataset: { id: folder.id }
        });

        // Input para el nombre
        const input = window.DOMUtils.createElement('input', {
            type: 'text',
            name: 'edit-folder-name',
            value: folder.name,
            required: 'required'
        });
        form.appendChild(input);

        // Botones
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        const saveBtn = window.DOMUtils.createButton(dict.save, 'btn btn-primary', { type: 'submit' });
        const cancelBtn = window.DOMUtils.createButton(dict.cancel, 'btn btn-secondary cancel-edit-folder-btn', { type: 'button' });

        form.appendChild(saveBtn);
        form.appendChild(cancelBtn);

        container.appendChild(form);
    },

    showImportMessage: function (msg, ok = false) {
        const el = document.getElementById('import-msg');
        if (!el) return;

        el.textContent = msg;
        el.style.color = ok ? 'green' : 'red';
        setTimeout(() => { el.textContent = ''; }, 4000);
    },

    autoResize: function (el) {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = (el.scrollHeight) + 'px';
    },

    attachAutoResize: function (el) {
        if (!el) return;
        el.addEventListener('input', function () {
            window.View.autoResize(this);
        });
        window.View.autoResize(el);
    },

    resetPromptForm: function () {
        const input = document.getElementById('prompt-input');
        const tagsInput = document.getElementById('tags-input');
        const folderSelect = document.getElementById('folder-select');
        if (input) input.value = '';
        if (tagsInput) tagsInput.value = '';
        if (folderSelect) folderSelect.value = '';
        if (window.View && typeof window.View.autoResize === 'function' && input) {
            window.View.autoResize(input);
        }
    },

    showPromptMsg: function (msg) {
        const msgDiv = document.getElementById('prompt-msg');
        if (msgDiv) {
            msgDiv.textContent = msg;
            msgDiv.classList.add('visible');
            setTimeout(() => {
                msgDiv.textContent = '';
                msgDiv.classList.remove('visible');
            }, 4000);
        }
    },

    setImportChoicePanelVisible: function (visible) {
        const panel = document.getElementById('import-choice-panel');
        if (panel) {
            panel.style.display = visible ? 'flex' : 'none';
        }
    }
};
