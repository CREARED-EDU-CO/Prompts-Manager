'use strict';

/**
 * CONTROLADOR DE CARPETAS
 * 
 * PROPÓSITO: Gestión de operaciones CRUD para carpetas y coordinación con vista
 * PATRÓN: Event-driven Controller con delegación de responsabilidades
 * RESPONSABILIDADES:
 * - Manejo de formulario de creación de carpetas
 * - Gestión de eventos de edición y eliminación
 * - Coordinación entre modelo y vista
 * - Validación de integridad referencial (carpetas con prompts)
 * - Actualización de selectores dependientes
 * 
 * ARQUITECTURA DE EVENTOS:
 * - Event delegation para elementos dinámicos
 * - Separación de concerns entre creación, edición y eliminación
 * - Manejo asíncrono para confirmaciones de usuario
 * 
 * DEPENDENCIAS: window.FoldersModel, window.View, window.PromptsModel, window.Controller
 * CONSUMIDORES: Controller principal (inicialización)
 */
window.FoldersController = {
  /**
   * INICIALIZADOR DEL CONTROLADOR
   * 
   * PATRÓN: Event-driven initialization sin dependency injection
   * ESTRATEGIA: Un listener por contenedor que maneja múltiples acciones
   * ROBUSTEZ: Event delegation funciona con elementos dinámicos
   * DESACOPLAMIENTO: Los modelos disparan eventos automáticamente
   * 
   * EVENTOS CONFIGURADOS:
   * 1. Submit del formulario de creación
   * 2. Click delegation para botones de acción
   * 3. Submit delegation para formularios de edición
   */
  init: function () {
    /**
     * EVENT LISTENER PARA CREACIÓN DE CARPETAS
     * 
     * ELEMENTO: #folder-form (formulario de nueva carpeta)
     * EVENTO: submit (incluye Enter key y click en botón)
     * VALIDACIÓN: Sanitización de input y verificación de contenido
     * 
     * FLUJO:
     * 1. Prevenir submit por defecto
     * 2. Extraer y sanitizar nombre
     * 3. Validar nombre no vacío
     * 4. Crear carpeta via método privado
     * 5. Limpiar formulario
     */
    document.getElementById('folder-form').addEventListener('submit', (e) => {
      e.preventDefault(); // PREVENCIÓN: Evita recarga de página
      
      const input = document.getElementById('folder-input');
      // SANITIZACIÓN: Limpia input y normaliza espacios
      const name = window.sanitizeInput(input.value.trim());
      
      if (name) {
        // CREACIÓN: Delega a método privado para lógica de negocio
        this._createFolder(name);
        // LIMPIEZA: Reset del formulario tras creación exitosa
        input.value = '';
      }
    });

    /**
     * EVENT DELEGATION PARA ACCIONES DE CARPETAS
     * 
     * ELEMENTO: #folders-list (contenedor de lista de carpetas)
     * ESTRATEGIA: Event delegation para elementos dinámicos
     * EVENTOS: click en botones de acción (editar, eliminar, cancelar)
     * 
     * VENTAJAS DE DELEGATION:
     * - Funciona con elementos añadidos dinámicamente
     * - Un solo listener para múltiples elementos
     * - Mejor performance que listeners individuales
     */
    document.getElementById('folders-list').addEventListener('click', async (e) => {
      // EXTRACCIÓN DE ID: data-id attribute para identificar carpeta
      const id = e.target.getAttribute('data-id');
      
      // MANEJO DE ELIMINACIÓN: Botón de eliminar carpeta
      if (e.target.classList.contains('delete-folder-btn')) {
        e.stopPropagation(); // PREVENCIÓN: Evita bubbling no deseado
        await this._handleDeleteFolderClick(id);
      } 
      // MANEJO DE EDICIÓN: Botón de editar carpeta
      else if (e.target.classList.contains('edit-folder-btn')) {
        e.stopPropagation();
        this._handleEditFolderClick(id);
      } 
      // MANEJO DE CANCELACIÓN: Botón de cancelar edición
      else if (e.target.classList.contains('cancel-edit-folder-btn')) {
        e.stopPropagation();
        // RESTAURACIÓN: Vuelve a vista normal cancelando edición
        window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts);
      }
    });

    /**
     * EVENT DELEGATION PARA FORMULARIOS DE EDICIÓN
     * 
     * ELEMENTO: #folders-list (mismo contenedor)
     * EVENTO: submit de formularios de edición inline
     * DELEGACIÓN: Al Controller principal para manejo uniforme
     * 
     * PATRÓN: Centralized form handling en Controller principal
     */
    document.getElementById('folders-list').addEventListener('submit', function (e) {
      if (e.target.classList.contains('edit-folder-form')) {
        // DELEGACIÓN: Controller principal maneja todos los formularios de edición
        window.Controller.handleEditFormSubmit(e, 'folder');
      }
    });
  },

  /**
   * CREADOR DE CARPETA PRIVADO
   * 
   * @param {string} name Nombre de la carpeta a crear
   * 
   * PATRÓN: Template method con pasos bien definidos
   * RESPONSABILIDADES:
   * 1. Generar ID único para la carpeta
   * 2. Crear carpeta en modelo (con validaciones)
   * 3. Actualizar todos los selectores dependientes
   * 4. Re-renderizar vista de carpetas
   * 
   * COORDINACIÓN: Actualiza múltiples componentes de UI tras creación
   * INTEGRIDAD: Mantiene sincronización entre modelo y vista
   */
  _createFolder: function (name) {
    // GENERACIÓN DE ID: UUID único para identificación
    const id = window.generateUUID();
    
    // CREACIÓN EN MODELO: Delega validación y persistencia al modelo
    window.FoldersModel.addFolder({ id, name });
    
    // ACTUALIZACIÓN DE SELECTORES: Sincroniza todos los dropdowns que usan carpetas
    window.View.updateFolderSelect(window.FoldersModel.folders);   // Selector de creación de prompts
    window.View.updateFolderFilter(window.FoldersModel.folders);  // Filtro de carpetas
    
    // RE-RENDERIZADO: Actualiza lista visual de carpetas con conteos
    window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts);
  },

  /**
   * MANEJADOR DE ELIMINACIÓN DE CARPETA
   * 
   * @param {string} id ID de la carpeta a eliminar
   * 
   * PATRÓN: Validation + Confirmation + Action + Update
   * VALIDACIONES:
   * 1. Verificar integridad referencial (carpeta sin prompts)
   * 2. Confirmación del usuario para acción destructiva
   * 
   * FLUJO ASÍNCRONO:
   * 1. Validar que carpeta no tenga prompts asociados
   * 2. Mostrar modal de confirmación
   * 3. Si confirmado, eliminar y actualizar UI
   * 
   * INTEGRIDAD REFERENCIAL: Previene eliminación de carpetas con prompts
   */
  _handleDeleteFolderClick: async function (id) {
    const messages = window.getLocalizedMessages();
    
    // VALIDACIÓN DE INTEGRIDAD: Verifica si carpeta tiene prompts asociados
    const usados = window.PromptsModel.prompts.some(p => p.folderId === id);
    
    if (usados) {
      // PREVENCIÓN: No permite eliminar carpetas con prompts
      window.showToast(messages.errors.cannotDeleteFolderWithPrompts, 'error');
      return false;
    }
    
    // CONFIRMACIÓN: Modal asíncrono para acción destructiva
    const ok = await window.showConfirmModal(messages.confirm.deleteFolder);
    
    if (ok) {
      // ELIMINACIÓN: Procede con eliminación tras confirmación
      window.FoldersModel.deleteFolder(id);
      
      // ACTUALIZACIÓN DE UI: Sincroniza todos los componentes dependientes
      window.View.updateFolderSelect(window.FoldersModel.folders);   // Selector de creación
      window.View.updateFolderFilter(window.FoldersModel.folders);  // Filtro de carpetas
      window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts); // Lista visual
    }
  },

  /**
   * MANEJADOR DE EDICIÓN DE CARPETA
   * 
   * @param {string} id ID de la carpeta a editar
   * 
   * PATRÓN: Find + Render edit form
   * RESPONSABILIDAD: Cambiar vista de carpeta a formulario de edición
   * 
   * FLUJO:
   * 1. Buscar carpeta por ID en modelo
   * 2. Si existe, renderizar formulario de edición inline
   * 
   * DELEGACIÓN: View se encarga del renderizado del formulario
   */
  _handleEditFolderClick: function (id) {
    // BÚSQUEDA: Encuentra carpeta en modelo por ID
    const folder = window.FoldersModel.folders.find(f => f.id === id);
    
    if (folder) {
      // RENDERIZADO: Cambia vista a formulario de edición inline
      window.View.renderEditFolderForm(folder);
    }
  }
};
