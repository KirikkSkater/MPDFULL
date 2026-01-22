class ScheduledController {
  constructor({ parser, modelClass, viewClass, $container }) {
      this.parser = parser;
      this.modelClass = modelClass;
      this.viewClass = viewClass;
      this.$container = $container;

      this.model = null;
      this.view = null;
      this.toolbar = null;
      this.sidebar = null;
      this.dnd = null;

      this.originalXml = null;
      
      // Состояния хранятся в контроллере
      this.editMode = false;
      this.previewMode = false;
      
      // Колбэки
      this.finishEditing = () => {};
      this.checkRes = () => null;
      
      this.changeListeners = [];
  }

  init(xmlString) {
      this.originalXml = xmlString;
      const xmlDoc = this.parser.parse(xmlString);

      // Модель
      this.model = new this.modelClass(xmlDoc);
      this.editMode = false;
      this.initToolbar();
      // View таблицы
      if (this.view)
          this.view.destroy();
      this.view = new this.viewClass(this.model, this.$container);
      this.view.render();
      this.setEditMode(false); // Начальное состояние - просмотр

      // Toolbar (теперь только отображение)

      // Sidebar
      const $sidebarContainer = $('#applic-sidebar');
      this.sidebar = new ApplicSidebar(
          this.model.applicMap || {}, 
          $sidebarContainer, 
          () => this.handleSidebarRefresh(),
          this.model
      );
      this.sidebar.render();

      // Подписка на изменения модели
      if (typeof this.model.onChange === 'function') {
          this.model.onChange(() => {
              try {
                  this.sidebar.applicMap = this.model.applicMap || this.sidebar.applicMap;
                  this.sidebar.render();
              } catch (e) { console.error('sidebar render error', e); }
          });
      }

      // Drag & Drop
      this.dnd = new DndManager({ 
          model: this.model, 
          emitChange: this._emitChange.bind(this) 
      });
      this.dnd.init();

      // UI биндинги
      this.bindSidebarToggle();
      
      return this;
  }

  initToolbar() {
      // Toolbar теперь получает только колбэки и состояния
      this.toolbar = new Toolbar({
        // Колбэки на действия пользователя
        onEditClick: () => this.handleEditClick(),
        onExitClick: () => this.handleExitClick(),
        onPreviewClick: () => this.handlePreviewClick(),
        onSaveClick: () => this.handleSaveClick(),
        
        // Геттеры состояний для отображения
        getEditMode: () => this.editMode,
        getPreviewMode: () => this.previewMode,
        getSaving: () => this.saving // передаем геттер сохранения
    });
      
      // Инициализируем Toolbar с текущими состояниями
      this.toolbar.update();
  }

  // ========== ОБРАБОТЧИКИ ДЕЙСТВИЙ ПОЛЬЗОВАТЕЛЯ ==========

  handleEditClick() {
      if (this.editMode) {
          // Уже в режиме редактирования - переключаемся на сохранение
          this.handleSaveClick();
      } else {
          // Включаем режим редактирования
          this.setEditMode(true);
      }
  }

  handleSaveClick() {
      // Проверка валидности
      if (this.view == undefined)
        return true;
      const checkStr = this.checkRes();
      if (checkStr) {
          alert(checkStr);
          return;
      }

      const userConfirmed = confirm("Сохранить результат?");
      if (userConfirmed) {
          this.setEditMode(false);
          this.finishEditing(true);
          return true;
      } else {
        console.log("сохранение отменено");
        return false;
      }
  }

  handleExitClick() {
      const userConfirmed = confirm("Вы действительно хотите отметить изменения?");
      if (userConfirmed) {
          this.setEditMode(false);
          this.finishEditing(false);
      }
  }

  handlePreviewClick() {
      this.setPreviewMode(!this.previewMode);
  }

  handleSidebarRefresh() {
      if (typeof this.model.renderAll === 'function') {
          this.model.renderAll();
      } else {
          try { 
              this.view.render(); 
          } catch (e) { 
              console.warn(e); 
          }
      }
  }

  // ========== УПРАВЛЕНИЕ СОСТОЯНИЯМИ ==========

  setEditMode(enabled) {
      this.editMode = enabled;
      
      // Если выключаем редактирование, выключаем и предпросмотр
      if (!enabled) {
          this.previewMode = false;
      }
      
      // Обновляем view таблицы
      if(this.view)
      this.view.setEditMode(enabled);
      
      // Обновляем toolbar
      if(this.toolbar)
      this.toolbar.update();
      
      // Управляем CSS классами
      this.updateGlobalClasses();
      
      // Генерируем события
      this._emitChange({ type: 'editModeChanged', editMode: enabled });
  }

  setPreviewMode(enabled) {
      this.previewMode = enabled;
      
      // Обновляем view таблицы
      this.view.setPreviewMode(enabled);
      
      // Обновляем toolbar
      this.toolbar.update();
      
      // Управляем CSS классами
      this.updateGlobalClasses();
      
      // Генерируем события
      this._emitChange({ type: 'previewModeChanged', previewMode: enabled });
  }

  updateGlobalClasses() {
      // Управляем CSS классами на body для глобального контроля
      if (this.previewMode) {
          document.body.classList.add('preview-mode');
      } else {
          document.body.classList.remove('preview-mode');
      }
      
      if (this.editMode) {
          document.body.classList.add('edit-mode');
      } else {
          document.body.classList.remove('edit-mode');
      }
  }

  // ========== ВНЕШНИЙ ИНТЕРФЕЙС ==========

  addfinishEditing(callback) {
      this.finishEditing = callback;
      return this;
  }

  setCheckRes(callback) {
      this.checkRes = callback;
      return this;
  }

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
          try { 
              cb(meta); 
          } catch (err) { 
              console.error('Controller change listener error', err); 
          }
      });
  }

  setSaving(saving) {
    this.saving = saving;
    // Если нужно, обновляем тулбар
    if (this.toolbar && this.toolbar.refresh) {
        this.toolbar.refresh();
    }
  }

  // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

  bindSidebarToggle() {
      const sidebar = $('#applic-sidebar');
      $('#toggle-sidebar-btn')
          .off('click')
          .on('click', () => sidebar.toggleClass('hidden'));
  }

  exportXML() {
      return new XMLSerializer().serializeToString(this.model.getXML()[0]);
  }

  destroy() {
      this.dnd?.destroy();
      this.view?.destroy();
      this.toolbar?.destroy();
  }
}