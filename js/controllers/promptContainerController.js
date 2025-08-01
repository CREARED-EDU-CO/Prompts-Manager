'use strict';

/**
 * CONTROLADOR DE CONTENEDOR DE PROMPTS
 * 
 * PROPÓSITO: Gestión de interacciones dentro del contenedor principal de prompts
 * PATRÓN: Event delegation controller para elementos dinámicos
 * RESPONSABILIDADES:
 * - Manejo de acciones de prompts (copiar, editar, eliminar, favorito)
 * - Gestión de expansión/colapso de texto largo
 * - Coordinación de formularios de edición inline
 * - Integración con Clipboard API para funcionalidad de copiado
 * - Actualización de contadores de uso
 * 
 * ARQUITECTURA DE EVENTOS:
 * - Event delegation para performance con elementos dinámicos
 * - Manejo asíncrono para operaciones de clipboard y confirmaciones
 * - Separación de concerns por tipo de acción
 * - Coordinación con View para cambios de estado visual
 * 
 * DEPENDENCIAS: window.PromptsModel, window.View, window.Controller, window.validateDependencies
 * CONSUMIDORES: Controller principal (inicialización)
 */
window.PromptContainerController = {
  /**
   * CACHE DE ELEMENTOS DOM
   * 
   * container: Referencia al contenedor principal de prompts
   * PROPÓSITO: Evitar querySelector repetidos para mejor performance
   */
  elements: {
    container: null,
  },
  
  /**
   * INICIALIZADOR DEL CONTROLADOR
   * 
   * @param {Function} renderAndUpdateFiltersCb Callback para actualización global
   * 
   * PATRÓN: Dependency validation + Element caching + Event delegation setup
   * VALIDACIÓN: Verifica dependencias críticas antes de proceder
   * ESTRATEGIA: Un listener por contenedor que maneja múltiples tipos de eventos
   * 
   * EVENTOS MANEJADOS:
   * - click: Todas las acciones de botones y expansión de texto
   * - submit: Formularios de edición inline
   */
  init: function (renderAndUpdateFiltersCb) {
    // VALIDACIÓN DE DEPENDENCIAS: Módulos críticos para funcionamiento
    if (!window.validateDependencies(['PromptsModel', 'View', 'Controller'], 'PromptContainerController')) {
      return;
    }
    
    // CACHE DE ELEMENTO: Contenedor principal de prompts
    this.elements.container = document.getElementById('prompt-container');
    if (!this.elements.container) {
      window.showError('Error: Elemento #prompt-container no encontrado.');
      return;
    }

    /**
     * EVENT DELEGATION PARA CLICKS
     * 
     * PATRÓN: Event delegation con class-based routing
     * VENTAJAS: Funciona con elementos añadidos dinámicamente
     * PERFORMANCE: Un solo listener para múltiples elementos
     * 
     * ACCIONES MANEJADAS:
     * - Expansión de texto largo
     * - Edición de prompt
     * - Cancelación de edición
     * - Eliminación de prompt
     * - Toggle de favorito
     * - Copiado al portapapeles
     */
    this.elements.container.addEventListener('click', async (e) => {
      // EXTRACCIÓN DE ID: data-id attribute para identificar prompt
      const id = e.target.getAttribute('data-id');

      // MANEJO DE EXPANSIÓN DE TEXTO: Caso especial que no requiere ID
      if (this._handlePromptTextClick(e.target)) return;

      // MANEJO DE EDICIÓN: Botón de editar prompt
      if (e.target.classList.contains('edit-btn')) {
        e.stopPropagation(); // PREVENCIÓN: Evita bubbling no deseado
        this._handleEditButtonClick(id);
        return;
      }

      // MANEJO DE CANCELACIÓN: Botón de cancelar edición
      if (e.target.classList.contains('cancel-edit-prompt-btn')) {
        e.stopPropagation();
        this._handleCancelEditButtonClick();
        return;
      }

      // MANEJO DE ELIMINACIÓN: Botón de eliminar prompt (asíncrono)
      if (e.target.classList.contains('delete-btn')) {
        e.stopPropagation();
        await this._handleDeleteButtonClick(id, renderAndUpdateFiltersCb);
        return;
      }

      // MANEJO DE FAVORITO: Botón de toggle favorito
      if (e.target.classList.contains('fav-btn')) {
        e.stopPropagation();
        this._handleFavoriteButtonClick(id, renderAndUpdateFiltersCb);
        return;
      }

      // MANEJO DE COPIADO: Botón de copiar al portapapeles (asíncrono)
      if (e.target.classList.contains('copy-btn')) {
        e.stopPropagation();
        await this._handleCopyButtonClick(id, e.target, renderAndUpdateFiltersCb);
        return;
      }
    });

    /**
     * EVENT DELEGATION PARA FORMULARIOS
     * 
     * ELEMENTO: Mismo contenedor
     * EVENTO: submit de formularios de edición inline
     * DELEGACIÓN: Al Controller principal para manejo uniforme
     */
    this.elements.container.addEventListener('submit', function (e) {
      e.stopPropagation(); // PREVENCIÓN: Evita bubbling del submit
      
      if (e.target.classList.contains('edit-prompt-form')) {
        // DELEGACIÓN: Controller principal maneja todos los formularios de edición
        window.Controller.handleEditFormSubmit(e, 'prompt');
      }
    });
  },

  /**
   * MANEJADOR DE CLICK EN TEXTO DE PROMPT
   * 
   * @param {HTMLElement} target Elemento clickeado
   * @returns {boolean} true si manejó el evento, false si no aplica
   * 
   * PROPÓSITO: Detectar y manejar expansión/colapso de texto largo
   * PATRÓN: Early return pattern para casos específicos
   * CONDICIONES: Elemento debe tener clases 'prompt-text' y 'expandable-prompt'
   * 
   * FUNCIONALIDAD: Toggle entre texto truncado y texto completo
   * DELEGACIÓN: View maneja la lógica de expansión/colapso
   */
  _handlePromptTextClick: function (target) {
    // DETECCIÓN: Verifica si elemento es texto expandible
    if (target.classList.contains('prompt-text') && target.classList.contains('expandable-prompt')) {
      // DELEGACIÓN: View maneja toggle de expansión
      window.View.togglePromptTextExpansion(target);
      return true; // MANEJADO: Indica que el evento fue procesado
    }
    return false; // NO MANEJADO: Permite que otros handlers procesen el evento
  },

  /**
   * MANEJADOR DE BOTÓN DE EDICIÓN
   * 
   * @param {string} id ID del prompt a editar
   * 
   * PATRÓN: State change + DOM replacement + Focus management
   * RESPONSABILIDADES:
   * 1. Establecer estado de edición global
   * 2. Encontrar elemento DOM del prompt
   * 3. Buscar datos del prompt en modelo
   * 4. Renderizar formulario de edición
   * 5. Reemplazar elemento en DOM
   * 6. Configurar auto-resize y focus
   * 
   * COORDINACIÓN: Múltiples sistemas (estado, DOM, modelo, vista)
   */
  _handleEditButtonClick: function (id) {
    // ESTADO GLOBAL: Marca prompt como en edición
    window.View.editingPromptId = id;
    
    // BÚSQUEDA DOM: Encuentra elemento del prompt
    const promptElement = document.querySelector(`.prompt-item[data-id="${id}"]`);
    
    if (promptElement) {
      // BÚSQUEDA EN MODELO: Obtiene datos del prompt
      const prompt = window.PromptsModel.prompts.find(p => p.id === id);
      
      if (prompt) {
        // PREPARACIÓN DE DATOS: Mapa de carpetas para el formulario
        const folderMap = (window.FoldersModel.folders || []).reduce((acc, f) => { 
          acc[f.id] = f.name; 
          return acc; 
        }, {});
        
        // RENDERIZADO: Crea formulario de edición
        const formElement = window.View.renderPromptEditForm(prompt);
        
        // REEMPLAZO DOM: Sustituye elemento de display por formulario
        promptElement.parentNode.replaceChild(formElement, promptElement);
        
        /**
         * CONFIGURACIÓN POST-RENDER
         * 
         * TIMING: setTimeout para asegurar que DOM esté actualizado
         * FUNCIONALIDADES:
         * - Auto-resize del textarea
         * - Focus automático para UX
         */
        setTimeout(() => {
          const ta = formElement.querySelector('textarea');
          if (ta) {
            // AUTO-RESIZE: Ajusta altura del textarea al contenido
            window.View.attachAutoResize(ta);
            // FOCUS: Posiciona cursor para edición inmediata
            ta.focus();
          }
        }, 0);
      }
    }
  },

  /**
   * MANEJADOR DE CANCELACIÓN DE EDICIÓN
   * 
   * PATRÓN: State cleanup + DOM restoration
   * RESPONSABILIDADES:
   * 1. Limpiar estado de edición global
   * 2. Encontrar formulario de edición activo
   * 3. Restaurar vista de display del prompt
   * 4. Reemplazar formulario por elemento de display
   * 
   * RESTAURACIÓN: Vuelve al estado anterior sin guardar cambios
   */
  _handleCancelEditButtonClick: function () {
    // CAPTURA DE ESTADO: ID del prompt en edición antes de limpiar
    const editingId = window.View.editingPromptId;
    
    // LIMPIEZA DE ESTADO: Marca que no hay prompt en edición
    window.View.editingPromptId = null;
    
    // BÚSQUEDA DOM: Encuentra formulario de edición activo
    const formElement = document.querySelector(`form.edit-prompt-form[data-id="${editingId}"]`);
    
    if (formElement) {
      // BÚSQUEDA EN MODELO: Obtiene datos originales del prompt
      const prompt = window.PromptsModel.prompts.find(p => p.id === editingId);
      
      if (prompt) {
        // PREPARACIÓN: Mapa de carpetas para renderizado
        const folderMap = (window.FoldersModel.folders || []).reduce((acc, f) => { 
          acc[f.id] = f.name; 
          return acc; 
        }, {});
        
        // RESTAURACIÓN: Renderiza elemento de display original
        const promptElement = window.View._renderPromptDisplay(prompt, folderMap);
        
        // REEMPLAZO DOM: Sustituye formulario por elemento de display
        formElement.parentNode.replaceChild(promptElement, formElement);
      }
    }
  },

  /**
   * MANEJADOR DE ELIMINACIÓN DE PROMPT
   * 
   * @param {string} id ID del prompt a eliminar
   * @param {Function} renderAndUpdateFiltersCb Callback de actualización global
   * 
   * PATRÓN: Confirmation + Action + Feedback + Update
   * FLUJO ASÍNCRONO:
   * 1. Mostrar modal de confirmación
   * 2. Si confirmado, eliminar del modelo
   * 3. Actualizar toda la UI
   * 4. Mostrar feedback de éxito
   * 
   * SEGURIDAD: Confirmación obligatoria para acción destructiva
   */
  _handleDeleteButtonClick: async function (id, renderAndUpdateFiltersCb) {
    const messages = window.getLocalizedMessages();
    
    // CONFIRMACIÓN: Modal asíncrono para acción destructiva
    const ok = await window.showConfirmModal(messages.confirm.deletePrompt);
    
    if (ok) {
      // ELIMINACIÓN: Remueve del modelo y persiste
      window.PromptsModel.deletePrompt(id);
      
      // ACTUALIZACIÓN GLOBAL: Re-renderiza toda la aplicación
      renderAndUpdateFiltersCb();
      
      // FEEDBACK: Notifica éxito al usuario
      window.showToast(messages.success.promptDeleted, 'success');
    }
  },

  /**
   * MANEJADOR DE TOGGLE DE FAVORITO
   * 
   * @param {string} id ID del prompt a marcar/desmarcar
   * @param {Function} renderAndUpdateFiltersCb Callback de actualización global
   * 
   * PATRÓN: Toggle + Update (operación idempotente)
   * FUNCIONALIDAD: Alterna estado favorito del prompt
   * INMEDIATEZ: Sin confirmación (operación reversible)
   */
  _handleFavoriteButtonClick: function (id, renderAndUpdateFiltersCb) {
    // TOGGLE: Alterna estado favorito en modelo
    window.PromptsModel.toggleFavorite(id);
    
    // ACTUALIZACIÓN: Re-renderiza para mostrar cambio visual
    renderAndUpdateFiltersCb();
  },

  /**
   * MANEJADOR DE COPIADO AL PORTAPAPELES
   * 
   * @param {string} id ID del prompt a copiar
   * @param {HTMLElement} target Botón que disparó la acción
   * @param {Function} renderAndUpdateFiltersCb Callback de actualización global
   * 
   * PATRÓN: Async operation + Visual feedback + Usage tracking + Error handling
   * FUNCIONALIDADES:
   * - Copia texto al portapapeles usando Clipboard API
   * - Incrementa contador de uso del prompt
   * - Feedback visual temporal en el botón
   * - Manejo de errores de clipboard
   * 
   * FLUJO ASÍNCRONO:
   * 1. Buscar prompt en modelo
   * 2. Copiar texto al portapapeles
   * 3. Incrementar contador de uso
   * 4. Mostrar feedback visual temporal
   * 5. Restaurar botón y actualizar UI
   * 6. Manejar errores si ocurren
   */
  _handleCopyButtonClick: async function (id, target, renderAndUpdateFiltersCb) {
    // BÚSQUEDA: Encuentra prompt en modelo
    const prompt = window.PromptsModel.prompts.find(p => p.id === id);
    
    if (prompt) {
      try {
        /**
         * OPERACIÓN DE COPIADO
         * 
         * API: navigator.clipboard.writeText (moderno)
         * SEGURIDAD: Requiere contexto seguro (HTTPS o localhost)
         * PERMISOS: Puede requerir permiso del usuario
         */
        await navigator.clipboard.writeText(prompt.text);
        
        // TRACKING: Incrementa contador de uso para estadísticas
        window.PromptsModel.incrementUsage(id);
        
        /**
         * FEEDBACK VISUAL TEMPORAL
         * 
         * PATRÓN: Button state change + timeout restoration
         * UX: Usuario ve confirmación inmediata de la acción
         * TIMING: 900ms es suficiente para reconocimiento sin ser molesto
         */
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        
        // CAMBIO VISUAL: Indica éxito temporalmente
        target.textContent = dict.copied;  // "¡Copiado!" o "Copied!"
        target.disabled = true;            // Previene clicks múltiples
        
        // RESTAURACIÓN: Vuelve al estado original después de delay
        setTimeout(() => {
          target.textContent = dict.copy;   // "Copiar" o "Copy"
          target.disabled = false;          // Re-habilita botón
          
          // ACTUALIZACIÓN: Re-renderiza para mostrar nuevo contador de uso
          renderAndUpdateFiltersCb();
        }, 900);
        
      } catch (error) {
        /**
         * MANEJO DE ERRORES DE CLIPBOARD
         * 
         * ERRORES COMUNES:
         * - NotAllowedError: Usuario denegó permiso
         * - NotSupportedError: API no soportada
         * - SecurityError: Contexto inseguro (HTTP)
         * - NetworkError: Problemas de conectividad
         */
        const dict = window.MESSAGES[window.currentLang]?.ui || window.MESSAGES.ui;
        window.Controller._handleErrorAndToast(
          error, 
          dict.copyError || 'Error al copiar', 
          { icon: '📋', duration: 3000 }
        );
      }
    }
  }
};
