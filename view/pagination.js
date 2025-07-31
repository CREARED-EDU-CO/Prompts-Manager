'use strict';

/**
 * Módulo View Pagination - Sistema de paginación y filtros
 * Responsable del renderizado de controles de paginación y actualización de filtros
 * Maneja la navegación entre páginas y la configuración de elementos por página
 */
window.View = window.View || {};

Object.assign(window.View, {
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
    }
});