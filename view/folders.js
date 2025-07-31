'use strict';

/**
 * Módulo View Folders - Gestión de carpetas y utilidades
 * Responsable del renderizado de carpetas, mensajes, formularios y funcionalidades auxiliares
 * Incluye auto-redimensionamiento, recordatorios dinámicos y controles de interfaz
 */
window.View = window.View || {};

Object.assign(window.View, {
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
});