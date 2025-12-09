
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

    this.changeListeners = [];
    this.finishEditing = () => {};
    this.dnd = null;
  }

  addfinishEditing(callback) {
    this.finishEditing = callback;
  }

  // Подписка/отписка
  onChange(callback) {
    if (typeof callback !== 'function') return () => {};
    this.changeListeners.push(callback);
    return () => {
      const idx = this.changeListeners.indexOf(callback);
      if (idx !== -1) this.changeListeners.splice(idx, 1);
    };
  }

  _emitChange(meta = {}) {
    this.changeListeners.forEach(cb => {
      try { cb(meta); } catch (err) { console.error('ScheduledController.onChange error', err); }
    });
  }

  init(xmlString) {
    this.originalXml = xmlString;
    const xmlDoc = this.parser.parse(xmlString);

    // Модель
    this.model = new this.modelClass(xmlDoc);


    //TODO: удалить старое View
    // Вью
    this.view = new this.viewClass(this.model, this.$container);
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
    }, this.model);
    this.sidebar.render();

    if (typeof this.model.onChange === 'function') {
      this.model.onChange(() => {
        try {
          this.sidebar.applicMap = this.model.applicMap || this.sidebar.applicMap;
          this.sidebar.render();
        } catch (e) { console.error('sidebar render error', e); }
      });
    }

    // Drag & Drop
    this.dnd = new DndManager({ model: this.model, emitChange: this._emitChange.bind(this) });
    this.dnd.init();

    // UI
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
         ctrl.editMode = true;
         $('.action-button-td, .action-button').removeClass('hidden');
       } else {
         ctrl.editMode = false;
       }

       ctrl.setEditMode(ctrl.editMode);
       ctrl.setPreviewButton(false);
       $(this).prepend($('<span class="icon">'));
     });

    $('#exit-btn')
      .off('click')
      .on('click', function () {
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
      // this.view.setEditable(false);
    } else {
      $editBtn.removeClass('save').addClass('edit').text('Редактировать');
      $previewBtn.prop('disabled', true);

      const userConfirmed = confirm("Сохранить результат?");
      if (userConfirmed) {
        this.editMode = false;
        this.finishEditing(true);
      } else {
        console.log("сохранение отменено");
      }

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

  destroy() {
    this.dnd?.destroy();
  }
}