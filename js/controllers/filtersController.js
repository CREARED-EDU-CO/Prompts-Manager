'use strict';

window.FiltersController = {
  state: { text: '', favorite: false, tag: '', folder: '', order: '' },
  elements: {
    searchInput: null,
    favFilter: null,
    tagFilter: null,
    folderFilter: null,
    orderFilter: null,
    clearFiltersBtn: null
  },

  init: function () {
    // Validar dependencias críticas
    if (!window.validateDependencies(['PaginationController'], 'FiltersController')) {
      return;
    }
    
    this.elements.searchInput = document.getElementById('search-input');
    this.elements.favFilter = document.getElementById('fav-filter');
    this.elements.tagFilter = document.getElementById('tag-filter');
    this.elements.folderFilter = document.getElementById('folder-filter');
    this.elements.orderFilter = document.getElementById('order-filter');
    this.elements.clearFiltersBtn = document.getElementById('clear-filters-btn');

    for (const key in this.elements) {
      if (!this.elements[key]) {
        console.error(`Error: Elemento para filtro ${key} no encontrado.`);
      }
    }

    this.elements.searchInput?.addEventListener('input', (e) => {
      this._applyFilterAndResetPage('text', e.target.value);
    });
    this.elements.favFilter?.addEventListener('change', (e) => {
      this._applyFilterAndResetPage('favorite', e.target.checked);
    });
    this.elements.tagFilter?.addEventListener('change', (e) => {
      this._applyFilterAndResetPage('tag', e.target.value);
    });
    this.elements.folderFilter?.addEventListener('change', (e) => {
      this._applyFilterAndResetPage('folder', e.target.value);
    });
    this.elements.orderFilter?.addEventListener('change', (e) => {
      this._applyFilterAndResetPage('order', e.target.value);
    });
    this.elements.clearFiltersBtn?.addEventListener('click', () => {
      this._clearAllFilters();
    });
  },

  _applyFilterAndResetPage: function (filterProperty, value) {
    this.state[filterProperty] = value;
    window.PaginationController.page = 1;
    window.PaginationController.renderPromptsWithPagination();
  },

  _clearAllFilters: function () {
    this.state = { text: '', favorite: false, tag: '', folder: '', order: '' };
    window.PaginationController.page = 1;

    if (this.elements.searchInput) this.elements.searchInput.value = '';
    if (this.elements.favFilter) this.elements.favFilter.checked = false;
    if (this.elements.tagFilter) this.elements.tagFilter.value = '';
    if (this.elements.folderFilter) this.elements.folderFilter.value = '';
    if (this.elements.orderFilter) this.elements.orderFilter.value = '';

    window.PaginationController.renderPromptsWithPagination();
  },

  getCurrentFilters: function () {
    return { ...this.state };
  }
};