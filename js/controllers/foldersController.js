'use strict';

window.FoldersController = {
  init: function (renderAndUpdateFiltersCb) {
    document.getElementById('folder-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('folder-input');
      const name = window.sanitizeInput(input.value.trim());
      if (name) {
        this._createFolder(name);
        input.value = '';
      }
    });

    document.getElementById('folders-list').addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      if (e.target.classList.contains('delete-folder-btn')) {
        e.stopPropagation();
        await this._handleDeleteFolderClick(id);
      } else if (e.target.classList.contains('edit-folder-btn')) {
        e.stopPropagation();
        this._handleEditFolderClick(id);
      } else if (e.target.classList.contains('cancel-edit-folder-btn')) {
        e.stopPropagation();
        window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts);
      }
    });

    document.getElementById('folders-list').addEventListener('submit', function (e) {
      if (e.target.classList.contains('edit-folder-form')) {
        window.Controller.handleEditFormSubmit(e, 'folder');
      }
    });
  },

  _createFolder: function (name) {
    const id = window.generateUUID();
    window.FoldersModel.addFolder({ id, name });
    window.View.updateFolderSelect(window.FoldersModel.folders);
    window.View.updateFolderFilter(window.FoldersModel.folders);
    window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts);
  },

  _handleDeleteFolderClick: async function (id) {
    const messages = window.getLocalizedMessages();
    const usados = window.PromptsModel.prompts.some(p => p.folderId === id);
    if (usados) {
      window.showToast(messages.errors.cannotDeleteFolderWithPrompts, 'error');
      return false;
    }
    const ok = await window.showConfirmModal(messages.confirm.deleteFolder);
    if (ok) {
      window.FoldersModel.deleteFolder(id);
      window.View.updateFolderSelect(window.FoldersModel.folders);
      window.View.updateFolderFilter(window.FoldersModel.folders);
      window.View.renderFolders(window.FoldersModel.folders, window.PromptsModel.prompts);
    }
  },

  _handleEditFolderClick: function (id) {
    const folder = window.FoldersModel.folders.find(f => f.id === id);
    if (folder) {
      window.View.renderEditFolderForm(folder);
    }
  }
};