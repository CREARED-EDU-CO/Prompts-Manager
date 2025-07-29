'use strict';

window.PaginationController = {
  page: 1,
  itemsPerPage: 10,
  elements: {
    paginationSection: null,
  },

  init: function () {
    this.initEvents();
  },

  initEvents: function () {
    this.elements.paginationSection = document.getElementById('pagination-section');
    if (!this.elements.paginationSection) {
      console.error('Error: Elemento #pagination-section no encontrado.');
      return;
    }
    
    this.elements.paginationSection.addEventListener('click', (e) => {
      if (e.target.classList.contains('page-btn')) {
        const page = parseInt(e.target.getAttribute('data-page'), 10);
        if (!isNaN(page)) {
          this._setPageAndRender(page);
        }
      }
    });

    this.elements.paginationSection.addEventListener('change', (e) => {
      if (e.target.id === 'per-page-select') {
        const itemsPerPage = parseInt(e.target.value, 10);
        if (!isNaN(itemsPerPage)) {
          this._setItemsPerPageAndRender(itemsPerPage);
        }
      }
    });
  },

  renderPromptsWithPagination: function () {
    window.View.renderPrompts(window.PromptsModel.prompts, window.FiltersController.state, this.page, this.itemsPerPage);
  },

  _setPageAndRender: function (page) {
    this.page = page;
    this.renderPromptsWithPagination();
  },

  _setItemsPerPageAndRender: function (itemsPerPage) {
    this.itemsPerPage = itemsPerPage;
    this.page = 1;
    this.renderPromptsWithPagination();
  }
};