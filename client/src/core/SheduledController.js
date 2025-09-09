// ScheduledController.js (refactored)
class ScheduledController {
  /**
   * options: { parser, modelClass, viewClass, $container }
   */
  constructor({ parser, modelClass, viewClass, $container }) {
    this.parser = parser;
    this.modelClass = modelClass;
    this.viewClass = viewClass;
    this.$container = $container;

    this.model = null;
    this.view = null;
    this.sidebar = null;

    this.originalXml = null;
    this.editMode = false;

    // локальные слушатели "внешних" подписчиков (контроллера)
    this.changeListeners = [];

    // DnD state & handlers (для отписки)
    this._dndInitialized = false;
    this._docDragOverHandler = null;
    this._docDropHandler = null;
    this._docDragLeaveHandler = null;
    this._docDragEndHandler = null;
  }

  // Подписка/отписка - возвращаем функцию отписки
  onChange(callback) {
    if (typeof callback !== 'function') return () => {};
    this.changeListeners.push(callback);
    return () => {
      const idx = this.changeListeners.indexOf(callback);
      if (idx !== -1) this.changeListeners.splice(idx, 1);
    };
  }

  _emitChange(meta = {}) {
    // безопасно вызываем всех подписчиков
    [...this.changeListeners].forEach(cb => {
      try { cb(meta); } catch (err) { console.error('ScheduledController.onChange error', err); }
    });
  }

  init(xmlString) {
    this.originalXml = xmlString;
    const xmlDoc = this.parser.parse(xmlString);

    // Создаём модель
    this.model = new this.modelClass(xmlDoc);

    // Создаём View
    this.view = new this.viewClass(this.model, this.$container);
    // view сам подписывается на model.onChange (в ScheduleView это есть)
    this.view.render();
    this.view.setEditable(false);

    // Sidebar
    const $sidebarContainer = $('#applic-sidebar');
    this.sidebar = new ApplicSidebar(this.model.applicMap || {}, $sidebarContainer, () => {
      if (typeof this.model.renderAll === 'function') {
        this.model.renderAll();
      } else {
        try { this.view.render(); } catch (e) { console.warn(e); }
      }
    });
    this.sidebar.render();

    // Подписка sidebar на модель (обновл. списка применимостей)
    if (typeof this.model.onChange === 'function') {
      this.model.onChange((xml, meta) => {
        try {
          this.sidebar.applicMap = this.model.applicMap || this.sidebar.applicMap;
          this.sidebar.render();
        } catch (e) { console.error('sidebar render error', e); }
      });
    }

    // Инициализация DnD — делегированно, но корректно
    this._setupDndDelegation();

    // Остальные биндинги UI
    this.bindToolbar();
    this.bindSidebarToggle();
  }

  bindToolbar() {
    const ctrl = this;
  
    $('#edit-btn')
      .prop('disabled', false)
      .off('click')
      .on('click', function () {
        if ($(this).hasClass('edit')) {
          // === ВКЛЮЧАЕМ РЕЖИМ РЕДАКТИРОВАНИЯ ===
          ctrl.editMode = true;
          $('.action-button-td, .action-button').removeClass('hidden');
        } else {
          // === ВЫКЛЮЧАЕМ РЕЖИМ РЕДАКТИРОВАНИЯ ===
          ctrl.editMode = false;
        }
  
        ctrl.setEditMode(ctrl.editMode);
        ctrl.setPreviewButton(false);
        $(this).prepend($('<span class="icon">'));
      });
  
    $('#exit-btn')
      .off('click')
      .on('click', function () {
        // тут только отключаем редактирование
        ctrl.editMode = false;
        ctrl.setEditMode(ctrl.editMode);
        ctrl.setPreviewButton(false);
      });
  
    $('#preview-btn')
      .off('click')
      .on('click', function () {
        const buttons = $('.action-button-td, .action-button');
        if ($(this).hasClass('preview')) {
          buttons.removeClass('hidden');
          ctrl.setPreviewButton(false);
        } else {
          buttons.addClass('hidden');
          ctrl.setPreviewButton(true);
        }
      });
  }


  bindSidebarToggle() {
    const sidebar = $('#applic-sidebar');
    $('#toggle-sidebar-btn')
      .off('click')
      .on('click', () => sidebar.toggleClass('hidden'));
  }

  setEditMode(isEdit) {
    this.editMode = isEdit;

    const $tcNameBox = $('#tc-name-box-id');
    if ($tcNameBox.length) $tcNameBox.prop('disabled', !isEdit);

    const $editBtn = $('#edit-btn');
    const $previewBtn = $('#preview-btn');

    if (isEdit) {
      $editBtn.removeClass('edit').addClass('save').text('Сохранить');
      $previewBtn.prop('disabled', false);
      this.setPreviewButton(false);
    } else {
      $editBtn.removeClass('save').addClass('edit').text('Редактировать');
      $previewBtn.prop('disabled', true);
      this.setPreviewButton(true);
    }

    this.view.setEditable(isEdit);
  }

  setPreviewButton(isPreview) {
    $('#preview-btn').toggleClass('preview', isPreview);
  }

  exportXML() {
    return new XMLSerializer().serializeToString(this.model.getXML()[0]);
  }

  // ---------------- DnD делегированно ----------------
  _setupDndDelegation() {
    // защита от повторной инициализации
    if (this._dndInitialized) return;
    this._dndInitialized = true;

    const tableWrapperSel = '#table-container';
    const sidebarSel = '#applic-sidebar';
    const ctrl = this;

    // helper: безопасно прочитать applicId из dataTransfer
    const readApplicFromDT = (dt) => {
      if (!dt) return null;
      const tryTypes = ['text/applic', 'text/applic-id', 'application/json', 'text/plain', 'text'];
      let raw = '';
      for (const t of tryTypes) {
        try {
          raw = dt.getData(t);
          if (raw) break;
        } catch (e) { /* ignore */ }
      }
      // fallback: try dt.types list
      if (!raw) {
        try {
          const types = dt.types || [];
          for (const tt of types) {
            try {
              const v = dt.getData(tt);
              if (v) { raw = v; break; }
            } catch(e){}
          }
        } catch(e){}
      }
      if (!raw) return null;
      try {
        const js = JSON.parse(raw);
        if (js && typeof js === 'object') return js.id || js.applicId || String(raw);
      } catch (e) {
        // not JSON
      }
      return String(raw);
    };

    // dragover: разрешаем drop если курсор над строкой/ячейкой/limit
    this._docDragOverHandler = function (e) {
      try {
        const clientX = e.clientX, clientY = e.clientY;
        const el = document.elementFromPoint(clientX, clientY);
        if (!el) return;
        const $row = $(el).closest('tr[data-task-index]');
        if ($row.length) {
          // разрешаем drop
          e.preventDefault();
          try { e.dataTransfer.dropEffect = 'copy'; } catch(e){}
          // подсветка целевой строки (для UX)
          $('.applic-drag-over').not($row).removeClass('applic-drag-over');
          $row.addClass('applic-drag-over');
        } else {
          $('.applic-drag-over').removeClass('applic-drag-over');
        }
      } catch (err) {
        // защищаем от ошибок
        // console.warn('dragover handler error', err);
      }
    };

    // убираем подсветку при dragleave/dragend
    this._docDragLeaveHandler = function (e) {
      // Убираем подсветку, но даём шанс на повторный dragover
      $('.applic-drag-over').removeClass('applic-drag-over');
    };
    this._docDragEndHandler = function (e) {
      $('.applic-drag-over').removeClass('applic-drag-over');
    };

    // drop: вычисляем конкретную цель (limit / cell / row) и вызываем модельный метод
    this._docDropHandler = function (e) {
      try {
        // важно убрать подсветку
        $('.applic-drag-over').removeClass('applic-drag-over');

        // safety
        e.preventDefault();
        const dt = e.dataTransfer;
        if (!dt) return;

        const applicId = readApplicFromDT(dt);
        if (!applicId) return;

        // элемент под курсором
        const pointerElem = document.elementFromPoint(e.clientX, e.clientY);
        if (!pointerElem) return;

        // ближайшая строка
        const $row = $(pointerElem).closest('tr[data-task-index]');
        if (!$row.length) return; // не на таблице — игнорируем

        const rowIndex = parseInt($row.attr('data-task-index'), 10);

        // 1) Приоритет — конкретный limit-блок (data-limit-index)
        const $targetLimit = $(pointerElem).closest('[data-limit-index]');
        if ($targetLimit.length) {
          const limitIndex = parseInt($targetLimit.attr('data-limit-index'), 10);
          if (!isNaN(limitIndex) && typeof ctrl.model.updateApplicForLimit === 'function') {
            const ok = ctrl.model.updateApplicForLimit(rowIndex, limitIndex, applicId);
            if (ok) {
              ctrl._emitChange({ type: 'applicability:dropped', payload: { rowIndex, limitIndex, applicId, target: 'limit' }});
              return;
            }
          }
        }

        // 2) Ячейка с data-field (или data-col-key)
        const $cellElem = $(pointerElem).closest('td[data-field], td[data-col-key]');
        if ($cellElem.length) {
          const colKey = $cellElem.attr('data-field') || $cellElem.attr('data-col-key');
          if (colKey) {
            // task-level columns
            if (colKey === 'taskDescr' || colKey === 'applicability') {
              if (typeof ctrl.model.updateApplicForTask === 'function') {
                ctrl.model.updateApplicForTask(rowIndex, applicId);
                ctrl._emitChange({ type: 'applicability:dropped', payload: { rowIndex, colKey, applicId, target: 'task' }});
                return;
              }
            } else {
              if (typeof ctrl.model.updateApplicForField === 'function') {
                ctrl.model.updateApplicForField(rowIndex, colKey, applicId);
                ctrl._emitChange({ type: 'applicability:dropped', payload: { rowIndex, colKey, applicId, target: 'field' }});
                return;
              }
            }
          }
        }

        // 3) Fallback — назначаем на всю задачу
        const taskIdentifier = $row.attr('data-task-id') ?? rowIndex;
        if (typeof ctrl.model.setApplicability === 'function') {
          ctrl.model.setApplicability(taskIdentifier, applicId);
          ctrl._emitChange({ type: 'applicability:dropped', payload: { taskIdentifier, applicId, target: 'row' }});
          return;
        } else if (typeof ctrl.model.updateApplicForTask === 'function') {
          ctrl.model.updateApplicForTask(rowIndex, applicId);
          ctrl._emitChange({ type: 'applicability:dropped', payload: { rowIndex, applicId, target: 'row' }});
          return;
        }
      } catch (err) {
        console.error('Drop handler error', err);
      } finally {
        $('.applic-drag-over').removeClass('applic-drag-over');
      }
    };

    // Attach native handlers once (capture not used). Using document ensures elementFromPoint works reliably.
    document.addEventListener('dragover', this._docDragOverHandler);
    document.addEventListener('drop', this._docDropHandler);
    document.addEventListener('dragleave', this._docDragLeaveHandler);
    document.addEventListener('dragend', this._docDragEndHandler);

    // Also allow dropping back to sidebar to clear applicability
    $(document).on('dragover.sched', sidebarSel, (evt) => {
      evt.preventDefault();
      try { evt.originalEvent.dataTransfer.dropEffect = 'move'; } catch(e){}
    });

    $(document).on('drop.sched', sidebarSel, (evt) => {
      evt.preventDefault();
      const dt = evt.originalEvent && evt.originalEvent.dataTransfer;
      if (!dt) return;
      let rawTask = '';
      try {
        rawTask = dt.getData('text/task') || dt.getData('text/plain') || '';
      } catch (e) { rawTask = ''; }
      if (!rawTask) return;
      const identifier = isNaN(Number(rawTask)) ? rawTask : Number(rawTask);
      try {
        if (typeof this.model.clearApplicability === 'function') {
          this.model.clearApplicability(identifier);
        } else if (typeof this.model.setApplicability === 'function') {
          this.model.setApplicability(identifier, null);
        } else {
          const idx = this.model.getTaskIndexByIdentifier ? this.model.getTaskIndexByIdentifier(identifier) : parseInt(identifier, 10);
          if (!isNaN(idx)) this.model.updateApplicForTask(idx, null);
        }
        this._emitChange({ type: 'applicability:cleared', payload: { target: identifier } });
      } catch (err) {
        console.error('Failed to clear applicability via drop to sidebar', err);
      }
    });
  }

  // При необходимости можно вызвать этот метод, чтобы вычистить слушатели (например, при destroy)
  destroy() {
    if (this._dndInitialized) {
      document.removeEventListener('dragover', this._docDragOverHandler);
      document.removeEventListener('drop', this._docDropHandler);
      document.removeEventListener('dragleave', this._docDragLeaveHandler);
      document.removeEventListener('dragend', this._docDragEndHandler);

      $(document).off('dragover.sched');
      $(document).off('drop.sched', '#applic-sidebar');

      this._dndInitialized = false;
    }
  }
}
