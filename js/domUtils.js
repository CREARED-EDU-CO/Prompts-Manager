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

// Utilidades para crear y manipular elementos del DOM
window.DOMUtils = {
    /**
     * Crea un elemento con atributos y contenido
     * @param {string} tag - Tipo de elemento a crear
     * @param {Object} attrs - Atributos para el elemento
     * @param {string|Node|Array} content - Contenido del elemento
     * @returns {HTMLElement} - El elemento creado
     */
    createElement: function(tag, attrs = {}, content = null) {
        const element = document.createElement(tag);
        
        // Añadir atributos
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Añadir contenido
        if (content !== null) {
            this.setContent(element, content);
        }
        
        return element;
    },
    
    /**
     * Establece el contenido de un elemento
     * @param {HTMLElement} element - Elemento al que añadir contenido
     * @param {string|Node|Array} content - Contenido a añadir
     */
    setContent: function(element, content) {
        if (typeof content === 'string') {
            element.textContent = content;
        } else if (content instanceof Node) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(item => {
                if (item) {
                    if (typeof item === 'string') {
                        const textNode = document.createTextNode(item);
                        element.appendChild(textNode);
                    } else if (item instanceof Node) {
                        element.appendChild(item);
                    }
                }
            });
        }
    },
    
    /**
     * Crea un botón con texto y atributos
     * @param {string} text - Texto del botón
     * @param {string} className - Clases CSS
     * @param {Object} attrs - Atributos adicionales
     * @returns {HTMLButtonElement} - El botón creado
     */
    createButton: function(text, className, attrs = {}) {
        return this.createElement('button', {
            className,
            ...attrs
        }, text);
    },
    
    /**
     * Crea un elemento de texto con una clase específica
     * @param {string} text - Texto a mostrar
     * @param {string} className - Clase CSS
     * @returns {HTMLElement} - El elemento span creado
     */
    createTextElement: function(text, className) {
        return this.createElement('span', { className }, text);
    },
    
    /**
     * Limpia y actualiza el contenido de un elemento
     * @param {HTMLElement|string} element - Elemento o ID del elemento a actualizar
     * @param {Array|Node|string} content - Nuevo contenido
     */
    updateElement: function(element, content) {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return;
        
        // Limpiar el elemento
        el.innerHTML = '';
        
        if (Array.isArray(content)) {
            content.forEach(item => {
                if (item instanceof Node) {
                    el.appendChild(item);
                } else if (typeof item === 'string') {
                    el.appendChild(document.createTextNode(item));
                }
            });
        } else if (content instanceof Node) {
            el.appendChild(content);
        } else {
            el.textContent = content;
        }
    }
};

// Función de utilidad para sanitizar HTML
window.sanitizeHTML = function(text) {
    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
};
