'use strict';

window.PromptContainerController = {
  elements: {
    container: null,
  },
  
  init: function (renderAndUpdateFiltersCb) {
    // Validar dependencias críticas
    if (!window.validateDependencies(['PromptsModel', 'View', 'Controller'], 'PromptContainerController')) {
      return;
    }
    
    this.elements.container = document.getElementById('prompt-container');
    if (!this.elements.container) {
      console.error('Error: Elemento #prompt-container no encontrado.');
      return;
    }

    this.elements.container.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');

      if (this._handlePromptTextClick(e.target)) return;

      if (e.target.classList.contains('edit-btn')) {
        e.stopPropagation();
        this._handleEditButtonClick(id);
        return;
      }

      if (e.target.classList.contains('cancel-edit-prompt-btn')) {
        e.stopPropagation();
        this._handleCancelEditButtonClick();
        return;
      }

      if (e.target.classList.contains('delete-btn')) {
        e.stopPropagation();
        await this._handleDeleteButtonClick(id, renderAndUpdateFiltersCb);
        return;
      }

      if (e.target.classList.contains('fav-btn')) {
        e.stopPropagation();
        this._handleFavoriteButtonClick(id, renderAndUpdateFiltersCb);
        return;
      }

      if (e.target.classList.contains('copy-btn')) {
        e.stopPropagation();
        await this._handleCopyButtonClick(id, e.target, renderAndUpdateFiltersCb);
        return;
      }
    });

    this.elements.container.addEventListener('submit', function (e) {
      e.stopPropagation();
      if (e.target.classList.contains('edit-prompt-form')) {
        window.Controller.handleEditFormSubmit(e, 'prompt');
      }
    });
  },

  _handlePromptTextClick: function (target) {
    if (target.classList.contains('prompt-text') && target.classList.contains('expandable-prompt')) {
      window.View.togglePromptTextExpansion(target);
      return true;
    }
    return false;
  },

  _handleEditButtonClick: function (id) {
    window.View.editingPromptId = id;
    
    const promptElement = document.querySelector(`.prompt-item[data-id="${id}"]`);
    if (promptElement) {
      const prompt = window.PromptsModel.prompts.find(p => p.id === id);
      if (prompt) {
        const folderMap = (window.FoldersModel.folders || []).reduce((acc, f) => { acc[f.id] = f.name; return acc; }, {});
        const formElement = window.View.renderPromptEditForm(prompt);
        
        promptElement.parentNode.replaceChild(formElement, promptElement);
        
        setTimeout(() => {
          const ta = formElement.querySelector('textarea');
          if (ta) {
            window.View.attachAutoResize(ta);
            ta.focus();
          }
        }, 0);
      }
    }
  },

  _handleCancelEditButtonClick: function () {
    const editingId = window.View.editingPromptId;
    window.View.editingPromptId = null;
    
    const formElement = document.querySelector(`form.edit-prompt-form[data-id="${editingId}"]`);
    if (formElement) {
      const prompt = window.PromptsModel.prompts.find(p => p.id === editingId);
      if (prompt) {
        const folderMap = (window.FoldersModel.folders || []).reduce((acc, f) => { acc[f.id] = f.name; return acc; }, {});
        const promptElement = window.View._renderPromptDisplay(prompt, folderMap);
        formElement.parentNode.replaceChild(promptElement, formElement);
      }
    }
  },

  _handleDeleteButtonClick: async function (id, renderAndUpdateFiltersCb) {
    const messages = window.getLocalizedMessages();
    const ok = await window.showConfirmModal(messages.confirm.deletePrompt);
    if (ok) {
      window.PromptsModel.deletePrompt(id);
      renderAndUpdateFiltersCb();
      window.showToast(messages.success.promptDeleted, 'success');
    }
  },

  _handleFavoriteButtonClick: function (id, renderAndUpdateFiltersCb) {
    window.PromptsModel.toggleFavorite(id);
    renderAndUpdateFiltersCb();
  },

  _handleCopyButtonClick: async function (id, target, renderAndUpdateFiltersCb) {
    const prompt = window.PromptsModel.prompts.find(p => p.id === id);
    if (prompt) {
      try {
        await navigator.clipboard.writeText(prompt.text);
        window.PromptsModel.incrementUsage(id);
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        target.textContent = dict.copied;
        target.disabled = true;
        setTimeout(() => {
          target.textContent = dict.copy;
          target.disabled = false;
          renderAndUpdateFiltersCb();
        }, 900);
      } catch (error) {
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        window.Controller._handleErrorAndToast(error, dict.copyError || 'Error al copiar', { icon: '📋', duration: 3000 });
      }
    }
  }
};