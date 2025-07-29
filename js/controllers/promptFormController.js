'use strict';

window.PromptFormController = {
  init: function (renderAndUpdateFiltersCb) {
    document.getElementById('prompt-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const input = document.getElementById('prompt-input');
      const tagsInput = document.getElementById('tags-input');
      const folderSelect = document.getElementById('folder-select');

      const text = input.value.trim();
      const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
      const folderId = folderSelect.value || null;

      if (!this._validatePromptData(text, folderId)) {
        return;
      }
      if (text) {
        window.FiltersController._clearAllFilters();
        const nuevoPrompt = this._createPromptObject(text, tags, folderId);
        window.PromptsModel.addPrompt(nuevoPrompt);
        renderAndUpdateFiltersCb();
        this._resetPromptForm();
        const messages = window.getLocalizedMessages();
        window.showToast(messages.success.promptAdded, 'success');
      }
    });
    
    document.getElementById('delete-all-prompts-btn').addEventListener('click', async () => {
      const messages = window.getLocalizedMessages();
      const ok = await window.showConfirmModal(messages.confirm.deleteAll);
      if (ok) {
        window.Controller._deleteAllData();
        window.showToast(messages.success.allDeleted, 'success');
      }
    });
  },

  _validatePromptData: function (text, folderId) {
    const messages = window.getLocalizedMessages();
    const maxLength = window.CONFIG.MAX_PROMPT_LENGTH;
    if (text.length > maxLength) {
      window.showToast(messages.errors.promptTooLong.replace('{max}', maxLength), 'error');
      return false;
    }
    if (!window.FoldersModel.folders.length) {
      window.View.showPromptMsg(messages.errors.mustCreateFolder);
      return false;
    }
    if (!folderId) {
      window.showToast(messages.errors.mustSelectFolder, 'error');
      return false;
    }
    return true;
  },

  _createPromptObject: function (text, tags, folderId) {
    const now = Date.now();
    const id = window.generateUUID();
    return {
      id: id,
      text: text,
      tags: tags,
      favorite: false,
      folderId: folderId,
      createdAt: now,
      updatedAt: now,
      usageCount: 0
    };
  },

  _resetPromptForm: function () {
    window.View.resetPromptForm();
  }
};