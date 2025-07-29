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

window.Controller = {
  init: function () {
    window.PromptFormController.init(this.updateAllViews.bind(this));
    window.PromptContainerController.init(this.updateAllViews.bind(this));
    window.FiltersController.init();
    window.FoldersController.init(this.updateAllViews.bind(this));
    window.ImportExportController.init(this.updateAllViews.bind(this));
    window.PaginationController.init();

    this.updateAllViews();
  },

  updateAllViews: function () {
    window.PaginationController.page = 1;
    window.PaginationController.renderPromptsWithPagination();
    window.View.updateTagFilter(window.PromptsModel.prompts);
    window.View.updateFolderSelect(window.FoldersModel.folders);
    window.View.updateFolderFilter(window.FoldersModel.folders);
    window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts);
  },

  // --- MANEJO DE EDICIÓN (Internalizado) ---
  _handleEditPromptSubmit: function (id, formElements) {
    const messages = window.getLocalizedMessages();
    const text = formElements['edit-text'].value.trim();
    const tags = formElements['edit-tags'].value.split(',').map(t => t.trim()).filter(t => t);
    const folderId = formElements['edit-folder'].value || null;

    if (!folderId) {
      window.showToast(messages.errors.mustSelectFolderEdit, 'error');
      return false;
    }

    if (text) {
      window.PromptsModel.editPrompt(id, { text, tags, folderId });
      window.showToast(messages.success.promptEdited, 'success');
      // Actualizar filtros de etiquetas y carpetas tras editar
      window.View.updateTagFilter(window.PromptsModel.prompts);
      window.View.updateFolderFilter(window.FoldersModel.folders);
      // Actualizar la vista de carpetas para reflejar los nuevos conteos
      window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts);
      return true;
    }
    return false;
  },

  _handleEditFolderSubmit: function (id, formElements) {
    const newName = formElements['edit-folder-name'].value.trim();
    if (newName) {
      window.FoldersModel.editFolder(id, newName);
      window.View.updateFolderSelect(window.FoldersModel.folders);
      window.View.updateFolderFilter(window.FoldersModel.folders);
      window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts);
      return true;
    }
    return false;
  },

  handleEditFormSubmit: function (e, type) {
    e.preventDefault();
    e.stopPropagation(); // Evitar propagación del evento
    const id = e.target.getAttribute('data-id');
    let success = false;

    if (type === 'prompt') {
      success = this._handleEditPromptSubmit(id, e.target.elements);
      if (success) {
        window.View.editingPromptId = null;
        
        // Verificar si hay filtros activos que requieren re-renderizado completo
        const currentFilters = window.FiltersController.getCurrentFilters();
        const hasOrderFilter = currentFilters.order && currentFilters.order !== '';
        const hasOtherFilters = currentFilters.text || currentFilters.favorite || currentFilters.tag || currentFilters.folder;
        
        if (hasOrderFilter || hasOtherFilters) {
          // Re-renderizar toda la lista para mantener el orden y filtros correctos
          window.PaginationController.renderPromptsWithPagination();
        } else {
          // Solo reemplazar el elemento individual si no hay filtros activos
          const formElement = e.target;
          const prompt = window.PromptsModel.prompts.find(p => p.id === id);
          if (prompt) {
            const folderMap = (window.FoldersModel.folders || []).reduce((acc, f) => { acc[f.id] = f.name; return acc; }, {});
            const promptElement = window.View._renderPromptDisplay(prompt, folderMap);
            formElement.parentNode.replaceChild(promptElement, formElement);
          }
        }
      }
    } else if (type === 'folder') {
      success = this._handleEditFolderSubmit(id, e.target.elements);
      // La vista de carpetas se actualiza dentro de _handleEditFolderSubmit
    }
    return success;
  },

  // --- UTILIDADES ---
  _handleErrorAndToast: function (error, msg, opts = {}) {
    window.showError(msg + (error && error.message ? ': ' + error.message : ''), opts);
  },

  _deleteAllData: function () {
    // Borrar prompts y carpetas usando los modelos
    window.PromptsModel.prompts = [];
    window.FoldersModel.folders = [];
    // Eliminar solo las claves usadas por la app
    Object.values(window.STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    this.updateAllViews(); // Actualiza todas las vistas para reflejar el estado vacío
  },



};
