// js/promptsModel.js
'use strict';

window.PromptsModel = {
    prompts: [],
    init: function () {
        this.prompts = window.Storage.loadPrompts().map(p => ({
            id: typeof p.id === 'string' ? p.id : window.generateUUID(),
            text: typeof p.text === 'string' ? p.text : '',
            tags: Array.isArray(p.tags) ? p.tags : [],
            favorite: !!p.favorite,
            folderId: typeof p.folderId === 'string' || p.folderId === null ? p.folderId : null,
            createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
            updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : Date.now(),
            usageCount: typeof p.usageCount === 'number' ? p.usageCount : 0
        }));
    },
    getFilteredPrompts: function (prompts, filters = {}) {
        let filtered = [...prompts];
        if (filters.folder) {
            filtered = filtered.filter(p => p.folderId === filters.folder);
        }
        if (filters.text) {
            const txt = filters.text.toLowerCase();
            filtered = filtered.filter(p => p.text && p.text.toLowerCase().includes(txt));
        }
        if (filters.favorite) {
            filtered = filtered.filter(p => p.favorite);
        }
        if (filters.tag) {
            filtered = filtered.filter(p => Array.isArray(p.tags) && p.tags.includes(filters.tag));
        }
        if (filters.order === 'usage') {
            filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        } else if (filters.order === 'updatedAt') {
            filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        } else {
            filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
        return filtered;
    },
    addPrompt: function (prompt) {
        const messages = window.getLocalizedMessages();
        if (!prompt || typeof prompt.text !== 'string' || !prompt.text.trim()) {
            window.showError(messages.errors.invalidPrompts);
            return false;
        }
        if (!prompt.folderId) {
            window.showError(messages.errors.mustSelectFolder);
            return false;
        }
        // Evitar prompts duplicados por ID
        if (this.prompts.some(p => p.id === prompt.id)) {
            window.showError(messages.errors.duplicatePrompt);
            return false;
        }
        this.prompts.push(prompt);
        window.Storage.savePrompts(this.prompts);
        return true;
    },
    editPrompt: function (id, data) {
        const messages = window.getLocalizedMessages();
        const idx = this.prompts.findIndex(p => p.id === id);
        if (idx === -1) {
            window.showError(messages.errors.invalidPrompts);
            return false;
        }
        if (data && typeof data.text === 'string' && !data.text.trim()) {
            window.showError(messages.errors.invalidPrompts);
            return false;
        }
        if (data && !data.folderId) {
            window.showError(messages.errors.mustSelectFolderEdit);
            return false;
        }
        this.prompts[idx] = { ...this.prompts[idx], ...data, updatedAt: Date.now() };
        window.Storage.savePrompts(this.prompts);
        return true;
    },
    deletePrompt: function (id) {
        this.prompts = this.prompts.filter(p => p.id !== id);
        window.Storage.savePrompts(this.prompts);
    },
    toggleFavorite: function (id) {
        const prompt = this.prompts.find(p => p.id === id);
        if (prompt) {
            prompt.favorite = !prompt.favorite;
            window.Storage.savePrompts(this.prompts);
        }
    },
    incrementUsage: function (id) {
        const prompt = this.prompts.find(p => p.id === id);
        if (prompt) {
            prompt.usageCount = (prompt.usageCount || 0) + 1;
            window.Storage.savePrompts(this.prompts);
        }
    }
};
