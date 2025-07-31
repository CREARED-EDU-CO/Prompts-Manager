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
 * MÓDULO DE UTILIDADES DOM
 * 
 * PROPÓSITO: Abstracción de manipulación DOM para código más limpio y mantenible
 * PATRÓN: Utility Object Pattern con métodos especializados para operaciones DOM comunes
 * VENTAJAS: Reduce boilerplate, centraliza lógica DOM, mejora legibilidad
 * 
 * DEPENDENCIAS: Ninguna (utilidades DOM puras)
 * CONSUMIDORES: View.js, todos los controladores que manipulan DOM
 */
window.DOMUtils = {
    /**
     * FACTORY DE ELEMENTOS DOM
     * 
     * @param {string} tag - Nombre del tag HTML a crear
     * @param {Object} attrs - Objeto con atributos a aplicar al elemento
     * @param {string|Node|Array} content - Contenido a insertar en el elemento
     * @returns {HTMLElement} Elemento DOM configurado
     * 
     * PATRÓN: Factory Pattern para creación consistente de elementos DOM
     * FLEXIBILIDAD: Maneja atributos especiales (className, dataset) y contenido variado
     * 
     * CASOS DE USO:
     * - createElement('div', {className: 'container'}, 'texto')
     * - createElement('button', {dataset: {id: '123'}}, 'Click')
     * - createElement('span', {}, [textNode, otherElement])
     */
    createElement: function(tag, attrs = {}, content = null) {
        // CREACIÓN: Elemento DOM base
        const element = document.createElement(tag);
        
        // CONFIGURACIÓN DE ATRIBUTOS: Iteración sobre propiedades del objeto attrs
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                // CASO ESPECIAL: className se asigna directamente por performance
                element.className = value;
            } else if (key === 'dataset') {
                // CASO ESPECIAL: dataset requiere iteración anidada para data-* attributes
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                // CASO GENERAL: setAttribute para todos los demás atributos
                element.setAttribute(key, value);
            }
        });
        
        // INSERCIÓN DE CONTENIDO: Delegación a método especializado si hay contenido
        if (content !== null) {
            this.setContent(element, content);
        }
        
        return element;
    },
    
    /**
     * INSERTOR DE CONTENIDO POLIMÓRFICO
     * 
     * @param {HTMLElement} element - Elemento DOM destino
     * @param {string|Node|Array} content - Contenido a insertar
     * 
     * PATRÓN: Polymorphic method para manejar diferentes tipos de contenido
     * TIPOS SOPORTADOS:
     * - string: Se convierte a textContent (seguro contra XSS)
     * - Node: Se añade directamente con appendChild
     * - Array: Se procesa recursivamente cada elemento
     * 
     * SEGURIDAD: textContent previene inyección XSS vs innerHTML
     * FLEXIBILIDAD: Permite mezclar strings y nodos en arrays
     */
    setContent: function(element, content) {
        if (typeof content === 'string') {
            // CASO STRING: textContent es seguro contra XSS
            element.textContent = content;
        } else if (content instanceof Node) {
            // CASO NODE: appendChild directo para elementos DOM
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            // CASO ARRAY: Procesamiento recursivo de elementos mixtos
            content.forEach(item => {
                if (item) { // VALIDACIÓN: Ignora elementos null/undefined
                    if (typeof item === 'string') {
                        // STRING EN ARRAY: Crear TextNode explícito para appendChild
                        const textNode = document.createTextNode(item);
                        element.appendChild(textNode);
                    } else if (item instanceof Node) {
                        // NODE EN ARRAY: appendChild directo
                        element.appendChild(item);
                    }
                }
            });
        }
    },
    
    /**
     * FACTORY ESPECIALIZADO PARA BOTONES
     * 
     * @param {string} text - Texto del botón
     * @param {string} className - Clases CSS del botón
     * @param {Object} attrs - Atributos adicionales
     * @returns {HTMLButtonElement} Elemento button configurado
     * 
     * PATRÓN: Specialized Factory para elemento común (botón)
     * CONVENIENCIA: Reduce boilerplate para creación de botones
     * EXTENSIBILIDAD: attrs permite configuración adicional (data-*, eventos, etc.)
     */
    createButton: function(text, className, attrs = {}) {
        return this.createElement('button', {
            className,
            ...attrs // SPREAD: Permite override y extensión de atributos
        }, text);
    },
    
    /**
     * FACTORY ESPECIALIZADO PARA ELEMENTOS DE TEXTO
     * 
     * @param {string} text - Contenido textual
     * @param {string} className - Clases CSS
     * @returns {HTMLSpanElement} Elemento span con texto
     * 
     * PATRÓN: Specialized Factory para contenedores de texto
     * USO TÍPICO: Labels, badges, indicadores de estado
     */
    createTextElement: function(text, className) {
        return this.createElement('span', { className }, text);
    },
    
    /**
     * ACTUALIZADOR DE CONTENIDO DE ELEMENTO
     * 
     * @param {string|HTMLElement} element - Selector o elemento DOM
     * @param {string|Node|Array} content - Nuevo contenido
     * 
     * PATRÓN: Update method con limpieza automática
     * FLEXIBILIDAD: Acepta selector string o elemento DOM directo
     * SEGURIDAD: Limpia contenido previo antes de insertar nuevo
     * 
     * FLUJO:
     * 1. Resuelve elemento (selector → DOM element)
     * 2. Limpia contenido existente
     * 3. Inserta nuevo contenido usando setContent()
     */
    updateElement: function(element, content) {
        // RESOLUCIÓN: Convierte selector string a elemento DOM
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return; // EARLY RETURN: Previene errores si elemento no existe
        
        // LIMPIEZA: Remueve todo el contenido previo
        el.innerHTML = '';
        
        // INSERCIÓN: Delegación a setContent para manejo polimórfico
        if (Array.isArray(content)) {
            // CASO ARRAY: Procesamiento individual de elementos
            content.forEach(item => {
                if (item instanceof Node) {
                    el.appendChild(item);
                } else if (typeof item === 'string') {
                    el.appendChild(document.createTextNode(item));
                }
            });
        } else if (content instanceof Node) {
            // CASO NODE: appendChild directo
            el.appendChild(content);
        } else {
            // CASO STRING: textContent seguro
            el.textContent = content;
        }
    }
};

/**
 * SANITIZADOR HTML GLOBAL
 * 
 * @param {string} text - Texto a sanitizar
 * @returns {string} HTML escapado seguro
 * 
 * PATRÓN: HTML escaping usando DOM API nativo
 * SEGURIDAD: Previene XSS convirtiendo caracteres especiales a entidades HTML
 * IMPLEMENTACIÓN: Usa textContent → innerHTML para escape automático del navegador
 * 
 * MECÁNICA:
 * 1. Crea elemento temporal
 * 2. Asigna texto como textContent (escape automático)
 * 3. Lee innerHTML (texto escapado como HTML)
 * 
 * USO: Mostrar contenido de usuario en HTML sin riesgo de inyección
 */
window.sanitizeHTML = function(text) {
    const temp = document.createElement('div');
    temp.textContent = text; // ESCAPE: Navegador escapa automáticamente
    return temp.innerHTML;   // EXTRACCIÓN: HTML escapado seguro
};
