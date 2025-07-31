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
 * MODELO DE DATOS DE PROMPTS
 * 
 * PROPÓSITO: Gestión centralizada de datos de prompts con validación y operaciones CRUD
 * PATRÓN: Active Record Pattern con métodos de negocio integrados
 * RESPONSABILIDADES:
 * - Almacenamiento en memoria de prompts
 * - Validación y normalización de datos
 * - Operaciones CRUD (Create, Read, Update, Delete)
 * - Filtrado y ordenamiento de datos
 * - Sincronización con capa de persistencia
 * 
 * ESTRUCTURA DE DATOS:
 * {
 *   id: string (UUID),
 *   text: string (contenido del prompt),
 *   tags: string[] (etiquetas para categorización),
 *   favorite: boolean (marcado como favorito),
 *   folderId: string|null (referencia a carpeta),
 *   createdAt: number (timestamp de creación),
 *   updatedAt: number (timestamp de última modificación),
 *   usageCount: number (contador de usos)
 * }
 * 
 * DEPENDENCIAS: window.Storage, window.generateUUID, window.getLocalizedMessages
 * CONSUMIDORES: View, Controllers (para operaciones CRUD)
 */
window.PromptsModel = {
    /**
     * ALMACÉN DE DATOS EN MEMORIA
     * 
     * TIPO: Array<PromptObject>
     * PROPÓSITO: Cache en memoria para operaciones rápidas sin I/O
     * SINCRONIZACIÓN: Se mantiene sincronizado con localStorage via Storage
     */
    prompts: [],
    
    /**
     * INICIALIZADOR DEL MODELO
     * 
     * RESPONSABILIDADES:
     * 1. Cargar datos desde Storage
     * 2. Validar y normalizar estructura de cada prompt
     * 3. Generar IDs faltantes
     * 4. Establecer valores por defecto para propiedades faltantes
     * 
     * PATRÓN: Data normalization con validación de tipos
     * ROBUSTEZ: Maneja datos corruptos o incompletos gracefully
     */
    init: function () {
        // CARGA Y NORMALIZACIÓN: Transforma datos raw en estructura válida
        this.prompts = window.Storage.loadPrompts().map(p => ({
            // VALIDACIÓN DE ID: Genera UUID si falta o es inválido
            id: typeof p.id === 'string' ? p.id : window.generateUUID(),
            
            // VALIDACIÓN DE TEXTO: String vacío si falta o es inválido
            text: typeof p.text === 'string' ? p.text : '',
            
            // VALIDACIÓN DE TAGS: Array vacío si falta o es inválido
            tags: Array.isArray(p.tags) ? p.tags : [],
            
            // VALIDACIÓN DE FAVORITO: Boolean con coerción
            favorite: !!p.favorite,
            
            // VALIDACIÓN DE FOLDER: String o null, null si inválido
            folderId: typeof p.folderId === 'string' || p.folderId === null ? p.folderId : null,
            
            // VALIDACIÓN DE TIMESTAMPS: Número o timestamp actual si falta
            createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
            updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : Date.now(),
            
            // VALIDACIÓN DE CONTADOR: Número o 0 si falta
            usageCount: typeof p.usageCount === 'number' ? p.usageCount : 0
        }));
    },
    /**
     * FILTRADOR Y ORDENADOR DE PROMPTS
     * 
     * @param {Array} prompts - Array de prompts a filtrar
     * @param {Object} filters - Objeto con criterios de filtrado
     * @returns {Array} Array filtrado y ordenado
     * 
     * PATRÓN: Pure function que no modifica datos originales
     * PERFORMANCE: Crea copia shallow para evitar mutación accidental
     * FLEXIBILIDAD: Múltiples criterios de filtrado combinables
     * 
     * FILTROS SOPORTADOS:
     * - folder: string (folderId específico)
     * - text: string (búsqueda case-insensitive en contenido)
     * - favorite: boolean (solo prompts favoritos)
     * - tag: string (tag específico)
     * - order: 'usage'|'updatedAt'|default (criterio de ordenamiento)
     * 
     * ORDEN DE APLICACIÓN:
     * 1. Filtros de inclusión/exclusión
     * 2. Ordenamiento según criterio especificado
     */
    getFilteredPrompts: function (prompts, filters = {}) {
        // COPIA DEFENSIVA: Previene mutación del array original
        let filtered = [...prompts];
        
        // FILTRO POR CARPETA: Coincidencia exacta de folderId
        if (filters.folder) {
            filtered = filtered.filter(p => p.folderId === filters.folder);
        }
        
        // FILTRO POR TEXTO: Búsqueda case-insensitive en contenido
        if (filters.text) {
            const txt = filters.text.toLowerCase();
            filtered = filtered.filter(p => p.text && p.text.toLowerCase().includes(txt));
        }
        
        // FILTRO POR FAVORITOS: Solo prompts marcados como favoritos
        if (filters.favorite) {
            filtered = filtered.filter(p => p.favorite);
        }
        
        // FILTRO POR TAG: Coincidencia exacta en array de tags
        if (filters.tag) {
            filtered = filtered.filter(p => Array.isArray(p.tags) && p.tags.includes(filters.tag));
        }
        
        // ORDENAMIENTO: Múltiples criterios con fallback a createdAt
        if (filters.order === 'usage') {
            // ORDEN POR USO: Más usado primero (descendente)
            filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        } else if (filters.order === 'updatedAt') {
            // ORDEN POR EDICIÓN: Más reciente primero (descendente)
            filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        } else {
            // ORDEN POR DEFECTO: Más reciente creado primero (descendente)
            filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
        
        return filtered;
    },
    /**
     * CREADOR DE NUEVO PROMPT
     * 
     * @param {Object} prompt - Objeto prompt a añadir
     * @returns {boolean} true si creación exitosa, false si error
     * 
     * PATRÓN: Validation + Persistence con feedback inmediato
     * VALIDACIONES:
     * 1. Prompt válido con texto no vacío
     * 2. Carpeta asignada (requerida)
     * 3. ID único (no duplicado)
     * 
     * FLUJO:
     * 1. Validación de datos de entrada
     * 2. Verificación de unicidad
     * 3. Adición a array en memoria
     * 4. Persistencia a localStorage
     * 5. Retorno de resultado
     */
    addPrompt: function (prompt) {
        const messages = window.getLocalizedMessages();
        
        // VALIDACIÓN DE ESTRUCTURA: Prompt debe tener texto válido
        if (!prompt || typeof prompt.text !== 'string' || !prompt.text.trim()) {
            window.showError(messages.errors.invalidPrompts);
            return false;
        }
        
        // VALIDACIÓN DE CARPETA: Prompt debe estar asignado a una carpeta
        if (!prompt.folderId) {
            window.showError(messages.errors.mustSelectFolder);
            return false;
        }
        
        // VALIDACIÓN DE UNICIDAD: ID no debe existir ya
        if (this.prompts.some(p => p.id === prompt.id)) {
            window.showError(messages.errors.duplicatePrompt);
            return false;
        }
        
        // ADICIÓN: Añade a array en memoria
        this.prompts.push(prompt);
        
        // PERSISTENCIA: Sincroniza con localStorage
        window.Storage.savePrompts(this.prompts);
        
        return true; // SUCCESS: Prompt creado exitosamente
    },
    /**
     * EDITOR DE PROMPT EXISTENTE
     * 
     * @param {string} id - ID del prompt a editar
     * @param {Object} data - Datos a actualizar
     * @returns {boolean} true si edición exitosa, false si error
     * 
     * PATRÓN: Find + Validate + Merge + Persist
     * VALIDACIONES:
     * 1. Prompt existe (ID válido)
     * 2. Texto no vacío si se proporciona
     * 3. Carpeta válida si se proporciona
     * 
     * MECÁNICA:
     * 1. Busca prompt por ID
     * 2. Valida datos de entrada
     * 3. Merge con datos existentes
     * 4. Actualiza timestamp de modificación
     * 5. Persiste cambios
     */
    editPrompt: function (id, data) {
        const messages = window.getLocalizedMessages();
        
        // BÚSQUEDA: Encuentra índice del prompt por ID
        const idx = this.prompts.findIndex(p => p.id === id);
        if (idx === -1) {
            window.showError(messages.errors.invalidPrompts);
            return false;
        }
        
        // VALIDACIÓN DE TEXTO: Si se proporciona texto, no debe estar vacío
        if (data && typeof data.text === 'string' && !data.text.trim()) {
            window.showError(messages.errors.invalidPrompts);
            return false;
        }
        
        // VALIDACIÓN DE CARPETA: Si se proporciona carpeta, debe ser válida
        if (data && !data.folderId) {
            window.showError(messages.errors.mustSelectFolderEdit);
            return false;
        }
        
        // MERGE: Combina datos existentes con nuevos datos
        this.prompts[idx] = { 
            ...this.prompts[idx],  // DATOS EXISTENTES: Preserva propiedades no modificadas
            ...data,               // DATOS NUEVOS: Sobrescribe propiedades especificadas
            updatedAt: Date.now()  // TIMESTAMP: Actualiza fecha de modificación
        };
        
        // PERSISTENCIA: Sincroniza con localStorage
        window.Storage.savePrompts(this.prompts);
        
        return true; // SUCCESS: Prompt editado exitosamente
    },
    /**
     * ELIMINADOR DE PROMPT
     * 
     * @param {string} id - ID del prompt a eliminar
     * 
     * PATRÓN: Filter + Persist (operación destructiva)
     * MECÁNICA: Filtra array excluyendo el prompt con ID especificado
     * PERSISTENCIA: Sincroniza inmediatamente con localStorage
     * 
     * NOTA: No retorna boolean porque filter siempre funciona
     * (incluso si ID no existe, simplemente no cambia nada)
     */
    deletePrompt: function (id) {
        // FILTRADO: Excluye prompt con ID especificado
        this.prompts = this.prompts.filter(p => p.id !== id);
        
        // PERSISTENCIA: Sincroniza con localStorage
        window.Storage.savePrompts(this.prompts);
    },
    
    /**
     * TOGGLE DE ESTADO FAVORITO
     * 
     * @param {string} id - ID del prompt a modificar
     * 
     * PATRÓN: Find + Toggle + Persist
     * FUNCIONALIDAD: Alterna estado favorito (true ↔ false)
     * IDEMPOTENCIA: Operación segura de repetir
     * 
     * USO TÍPICO: Click en botón de estrella en UI
     */
    toggleFavorite: function (id) {
        // BÚSQUEDA: Encuentra prompt por ID
        const prompt = this.prompts.find(p => p.id === id);
        
        if (prompt) {
            // TOGGLE: Invierte estado booleano
            prompt.favorite = !prompt.favorite;
            
            // PERSISTENCIA: Sincroniza con localStorage
            window.Storage.savePrompts(this.prompts);
        }
    },
    
    /**
     * INCREMENTADOR DE CONTADOR DE USO
     * 
     * @param {string} id - ID del prompt usado
     * 
     * PATRÓN: Find + Increment + Persist
     * PROPÓSITO: Tracking de frecuencia de uso para ordenamiento
     * ROBUSTEZ: Maneja casos donde usageCount es undefined
     * 
     * USO TÍPICO: Cuando usuario copia prompt al portapapeles
     */
    incrementUsage: function (id) {
        // BÚSQUEDA: Encuentra prompt por ID
        const prompt = this.prompts.find(p => p.id === id);
        
        if (prompt) {
            // INCREMENTO: Aumenta contador con fallback a 0
            prompt.usageCount = (prompt.usageCount || 0) + 1;
            
            // PERSISTENCIA: Sincroniza con localStorage
            window.Storage.savePrompts(this.prompts);
        }
    }
};
