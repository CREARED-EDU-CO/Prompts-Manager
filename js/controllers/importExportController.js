'use strict';

window.ImportExportController = {
  init: function (renderAndUpdateFiltersCb) {
    document.getElementById('export-json-btn').addEventListener('click', () => {
      this._exportToJson();
    });

    document.getElementById('import-json-btn').addEventListener('click', () => {
      this._resetFiltersForImport();
      document.getElementById('import-json-input').click();
    });

    document.getElementById('import-json-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          if (this._validateImportData(data)) {
            this._setupImportChoicePanel(data, renderAndUpdateFiltersCb);
          }
        } catch (err) {
          window.Controller._handleErrorAndToast(err, 'Error al leer el archivo JSON');
        }
      };
      reader.onerror = (err) => {
        window.Controller._handleErrorAndToast(err, 'Error de lectura del archivo');
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  },

  _exportToJson: async function () {
    const prompts = window.PromptsModel.getFilteredPrompts(
      window.PromptsModel.prompts,
      window.FiltersController.getCurrentFilters()
    );
    const data = { folders: window.FoldersModel.folders, prompts: prompts };
    
    // Generar nombre de archivo con fecha actual (YYYY-MM-DD)
    const today = new Date();
    const dateString = today.getFullYear() + '-' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(today.getDate()).padStart(2, '0');
    const filename = `prompts-export-${dateString}.json`;
    
    try {
      const jsonString = JSON.stringify(data, null, 2);
      
      // Intentar usar File System Access API si está disponible (navegadores modernos)
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'JSON files',
              accept: { 'application/json': ['.json'] }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(jsonString);
          await writable.close();
          
          const messages = window.getLocalizedMessages();
          window.showToast(messages.ui.exportSuccess, 'success');
          return;
        } catch (err) {
          // Si el usuario cancela o hay error, continuar con método tradicional
          if (err.name !== 'AbortError') {
            console.warn('Error con File System Access API:', err);
          }
        }
      }
      
      // Fallback: método tradicional de descarga
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (e) {
      window.Controller._handleErrorAndToast(e, 'Error al exportar JSON');
    }
  },

  _resetFiltersForImport: function () {
    window.FiltersController._clearAllFilters();
  },

  _validateImportData: function (data) {
    const messages = window.getLocalizedMessages();
    if (!data || !Array.isArray(data.prompts) || !Array.isArray(data.folders)) {
      window.View.showImportMessage(messages.errors.invalidImport);
      return false;
    }
    for (const p of data.prompts) {
      if (typeof p.id !== 'string' || typeof p.text !== 'string') {
        window.View.showImportMessage(messages.errors.invalidPrompts);
        return false;
      }
    }
    for (const f of data.folders) {
      if (typeof f.id !== 'string' || typeof f.name !== 'string') {
        window.View.showImportMessage(messages.errors.invalidFolders);
        return false;
      }
    }
    return true;
  },

  _replaceData: function (data, renderAndUpdateFiltersCb, closePanelCb) {
    window.PromptsModel.prompts = data.prompts.map(p => ({ ...p }));
    window.FoldersModel.folders = data.folders;
    window.Storage.savePrompts(window.PromptsModel.prompts);
    window.Storage.saveFolders(window.FoldersModel.folders);
    renderAndUpdateFiltersCb();
    const messages = window.getLocalizedMessages();
    window.View.showImportMessage(messages.success.importOk, true);
    closePanelCb();
  },

  _mergeData: function (data, renderAndUpdateFiltersCb, closePanelCb) {
    const promptsMap = Object.fromEntries(window.PromptsModel.prompts.map(p => [p.id, p]));
    for (const p of data.prompts) { promptsMap[p.id] = { ...p }; }
    window.PromptsModel.prompts = Object.values(promptsMap);

    const foldersMap = Object.fromEntries(window.FoldersModel.folders.map(f => [f.id, f]));
    for (const f of data.folders) { foldersMap[f.id] = f; }
    window.FoldersModel.folders = Object.values(foldersMap);

    window.Storage.savePrompts(window.PromptsModel.prompts);
    window.Storage.saveFolders(window.FoldersModel.folders);
    renderAndUpdateFiltersCb();
    const messages = window.getLocalizedMessages();
    window.View.showImportMessage(messages.success.importOk, true);
    closePanelCb();
  },

  _setupImportChoicePanel: function (data, renderAndUpdateFiltersCb) {
    window.View.setImportChoicePanelVisible(true);
    const closePanel = () => window.View.setImportChoicePanelVisible(false);

    document.getElementById('import-choice-replace').onclick = () => {
      this._replaceData(data, renderAndUpdateFiltersCb, closePanel);
    };
    document.getElementById('import-choice-merge').onclick = () => {
      this._mergeData(data, renderAndUpdateFiltersCb, closePanel);
    };
    document.getElementById('import-choice-cancel').onclick = closePanel;
  }
};