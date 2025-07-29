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

// js/foldersModel.js
'use strict';

window.FoldersModel = {
    folders: [],
    init: function () {
        this.folders = window.Storage.loadFolders();
    },
    getFolderById: function (id) {
        return this.folders.find(f => f.id === id) || null;
    },
    getFolderName: function (id) {
        const folder = this.getFolderById(id);
        return folder ? folder.name : '';
    },
    addFolder: function (folder) {
        const messages = window.getLocalizedMessages();
        if (!folder || typeof folder.name !== 'string' || !folder.name.trim()) {
            window.showError(messages.errors.invalidFolders);
            return false;
        }
        // Evitar carpetas duplicadas por nombre (case-insensitive)
        if (this.folders.some(f => f.name.trim().toLowerCase() === folder.name.trim().toLowerCase())) {
            window.showError(messages.errors.duplicateFolder);
            return false;
        }
        this.folders.push(folder);
        window.Storage.saveFolders(this.folders);
        return true;
    },
    editFolder: function (id, newName) {
        const messages = window.getLocalizedMessages();
        const folder = this.folders.find(f => f.id === id);
        if (!folder) {
            window.showError(messages.errors.invalidFolders);
            return false;
        }
        if (!newName || typeof newName !== 'string' || !newName.trim()) {
            window.showError(messages.errors.invalidFolders);
            return false;
        }
        // Evitar nombres duplicados (case-insensitive)
        if (this.folders.some(f => f.id !== id && f.name.trim().toLowerCase() === newName.trim().toLowerCase())) {
            window.showError(messages.errors.duplicateFolder);
            return false;
        }
        folder.name = newName;
        window.Storage.saveFolders(this.folders);
        return true;
    },
    deleteFolder: function (id) {
        this.folders = this.folders.filter(f => f.id !== id);
        window.Storage.saveFolders(this.folders);
    }
};
