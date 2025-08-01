'use strict';

/**
 * MODELO DE DATOS DE CARPETAS
 * 
 * PROPÓSITO: Gestión centralizada de carpetas para organización jerárquica de prompts
 * PATRÓN: Simple Repository Pattern con operaciones CRUD básicas
 * RESPONSABILIDADES:
 * - Almacenamiento en memoria de carpetas
 * - Operaciones CRUD para carpetas
 * - Métodos de consulta y búsqueda
 * - Sincronización con capa de persistencia
 * 
 * ESTRUCTURA DE DATOS:
 * {
 *   id: string (UUID único),
 *   name: string (nombre de la carpeta)
 * }
 * 
 * RELACIONES:
 * - Una carpeta puede contener múltiples prompts (1:N)
 * - Un prompt pertenece a una carpeta (N:1 via folderId)
 * 
 * DEPENDENCIAS: window.Storage, window.getLocalizedMessages
 * CONSUMIDORES: View, Controllers (para operaciones CRUD y consultas)
 */
window.FoldersModel = {
    /**
     * ALMACÉN DE DATOS EN MEMORIA
     * 
     * TIPO: Array<FolderObject>
     * PROPÓSITO: Cache en memoria para operaciones rápidas
     * SINCRONIZACIÓN: Mantenido en sync con localStorage via Storage
     */
    folders: [],
    
    /**
     * INICIALIZADOR DEL MODELO
     * 
     * RESPONSABILIDAD: Cargar carpetas desde Storage a memoria
     * SIMPLICIDAD: No requiere normalización como PromptsModel
     * (estructura de carpetas es más simple y estable)
     */
    init: function () {
        this.folders = window.Storage.loadFolders();
    },
    
    /**
     * BUSCADOR DE CARPETA POR ID
     * 
     * @param {string} id ID de la carpeta a buscar
     * @returns {Object|null} Objeto carpeta o null si no existe
     * 
     * PATRÓN: Simple finder con null object pattern
     * PERFORMANCE: O(n) linear search (aceptable para pocas carpetas)
     * ROBUSTEZ: Retorna null explícitamente si no encuentra
     */
    getFolderById: function (id) {
        return this.folders.find(f => f.id === id) || null;
    },
    
    /**
     * EXTRACTOR DE NOMBRE DE CARPETA
     * 
     * @param {string} id ID de la carpeta
     * @returns {string} Nombre de la carpeta o string vacío si no existe
     * 
     * PATRÓN: Convenience method que combina búsqueda + extracción
     * ROBUSTEZ: Retorna string vacío en lugar de undefined/null
     * USO TÍPICO: Mostrar nombre de carpeta en UI sin verificaciones adicionales
     */
    getFolderName: function (id) {
        const folder = this.getFolderById(id);
        return folder ? folder.name : '';
    },
    /**
     * CREADOR DE NUEVA CARPETA
     * 
     * @param {Object} folder Objeto carpeta a añadir
     * @returns {boolean} true si creación exitosa, false si error
     * 
     * PATRÓN: Validation + Uniqueness Check + Persistence
     * VALIDACIONES:
     * 1. Carpeta válida con nombre no vacío
     * 2. Nombre único (case-insensitive)
     * 
     * UNICIDAD: Comparación case-insensitive con trim para robustez
     * FLUJO: Validar → Verificar unicidad → Añadir → Persistir
     */
    addFolder: function (folder) {
        const messages = window.getLocalizedMessages();
        
        // VALIDACIÓN DE ESTRUCTURA: Carpeta debe tener nombre válido
        if (!folder || typeof folder.name !== 'string' || !folder.name.trim()) {
            window.showError(messages.errors.invalidFolders);
            return false;
        }
        
        // VALIDACIÓN DE UNICIDAD: Nombre no debe existir (case-insensitive)
        if (this.folders.some(f => f.name.trim().toLowerCase() === folder.name.trim().toLowerCase())) {
            window.showError(messages.errors.duplicateFolder);
            return false;
        }
        
        // ADICIÓN: Añade a array en memoria
        this.folders.push(folder);
        
        // PERSISTENCIA: Sincroniza con localStorage
        window.Storage.saveFolders(this.folders);
        
        return true; // SUCCESS: Carpeta creada exitosamente
    },
    
    /**
     * EDITOR DE CARPETA EXISTENTE
     * 
     * @param {string} id ID de la carpeta a editar
     * @param {string} newName Nuevo nombre para la carpeta
     * @returns {boolean} true si edición exitosa, false si error
     * 
     * PATRÓN: Find + Validate + Uniqueness Check + Update + Persist
     * VALIDACIONES:
     * 1. Carpeta existe (ID válido)
     * 2. Nuevo nombre válido (no vacío)
     * 3. Nuevo nombre único (excluyendo carpeta actual)
     * 
     * UNICIDAD: Excluye carpeta actual de verificación de duplicados
     */
    editFolder: function (id, newName) {
        const messages = window.getLocalizedMessages();
        
        // BÚSQUEDA: Encuentra carpeta por ID
        const folder = this.folders.find(f => f.id === id);
        if (!folder) {
            window.showError(messages.errors.invalidFolders);
            return false;
        }
        
        // VALIDACIÓN DE NOMBRE: Nuevo nombre debe ser válido
        if (!newName || typeof newName !== 'string' || !newName.trim()) {
            window.showError(messages.errors.invalidFolders);
            return false;
        }
        
        // VALIDACIÓN DE UNICIDAD: Nombre no debe existir en otras carpetas
        if (this.folders.some(f => f.id !== id && f.name.trim().toLowerCase() === newName.trim().toLowerCase())) {
            window.showError(messages.errors.duplicateFolder);
            return false;
        }
        
        // ACTUALIZACIÓN: Modifica nombre de la carpeta
        folder.name = newName;
        
        // PERSISTENCIA: Sincroniza con localStorage
        window.Storage.saveFolders(this.folders);
        
        return true; // SUCCESS: Carpeta editada exitosamente
    },
    
    /**
     * ELIMINADOR DE CARPETA
     * 
     * @param {string} id ID de la carpeta a eliminar
     * 
     * PATRÓN: Filter + Persist (operación destructiva)
     * MECÁNICA: Filtra array excluyendo carpeta con ID especificado
     * 
     * NOTA: No valida si carpeta tiene prompts asociados
     * (esa validación se hace en FoldersController antes de llamar este método)
     */
    deleteFolder: function (id) {
        // FILTRADO: Excluye carpeta con ID especificado
        this.folders = this.folders.filter(f => f.id !== id);
        
        // PERSISTENCIA: Sincroniza con localStorage
        window.Storage.saveFolders(this.folders);
    }
};
