class ScheduledController {
    constructor({ parser, factory, modelClass, viewClass, $container, infoCode }) {
        this.parser = parser;
        this.factory = factory;
        this.ModelClass = modelClass;
        this.ViewClass = viewClass;
        this.$container = $container;
        this.infoCode = infoCode;
        
        this.model = null;
        this.view = null;
        this.toolbar = null;
        this.sidebar = null;
        this.dndManager = null;
        this.finishEditingCallback = null;
        
        // Состояния
        this.editMode = false;
        this.previewMode = false;
    }

    init(xmlString) {
        // Очистка предыдущих экземпляров
        this.destroy();

        // Парсинг XML
        const xmlDoc = this.parser.parse(xmlString);

        // Проверка на ошибки парсинга
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            console.error('XML parsing error:', parseError.textContent);
            throw new Error('Ошибка парсинга XML');
        }

        // Создание модели
        this.model = new this.ModelClass(xmlDoc);
        
        this.editMode = false;

        // Инициализация Toolbar
        this.initToolbar();

        // Создание view
        this.view = new this.ViewClass(this.model, this.$container);
        this.view.render();
        this.setEditMode(false); // Начальное состояние - просмотр

        // Инициализация Sidebar
        const $sidebarContainer = $('#applic-sidebar');
        this.sidebar = new ApplicSidebar(
            this.model.applicManager,
            $sidebarContainer,
            () => this.handleSidebarRefresh(),
            this.model
        );
        this.sidebar.render();

        // Подписка на изменения модели
        if (typeof this.model.onChange === 'function') {
            this.model.onChange(() => {
                try {
                    this.sidebar.render();
                } catch (e) { 
                    console.error('sidebar render error', e); 
                }
            });
        }

        // Drag & Drop
        this.dndManager = new DndManager({
            model: this.model,
            emitChange: (event) => {
                console.log('DnD event:', event);
            }
        });
        this.dndManager.init();

        // UI биндинги
        this.bindSidebarToggle();
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
            getSaving: () => this.saving
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
        if (!this.view) return true;
        
        const userConfirmed = confirm("Сохранить результат?");
        if (userConfirmed) {
            this.setEditMode(false);
            if (this.finishEditingCallback) {
                this.finishEditingCallback(true);
            }
            return true;
        } else {
            console.log("сохранение отменено");
            return false;
        }
    }

    handleExitClick() {
        const userConfirmed = confirm("Вы действительно хотите отменить изменения?");
        if (userConfirmed) {
            this.setEditMode(false);
            if (this.finishEditingCallback) {
                this.finishEditingCallback(false);
            }
        }
    }

    handlePreviewClick() {
        this.setPreviewMode(!this.previewMode);
    }

    handleSidebarRefresh() {
        try {
            this.view.render();
        } catch (e) {
            console.warn(e);
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
        if (this.view) {
            this.view.setEditMode(enabled);
        }
        
        // Обновляем toolbar
        if (this.toolbar) {
            this.toolbar.update();
        }
        
        // Управляем CSS классами
        this.updateGlobalClasses();
    }

    setPreviewMode(enabled) {
        this.previewMode = enabled;
        
        // Обновляем view таблицы
        if (this.view) {
            this.view.setPreviewMode(enabled);
        }
        
        // Обновляем toolbar
        if (this.toolbar) {
            this.toolbar.update();
        }
        
        // Управляем CSS классами
        this.updateGlobalClasses();
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
    
    bindToolbar() {
        // В вашей версии Toolbar нет setGetXMLCallback - просто обновляем
        if (this.toolbar && this.toolbar.update) {
            this.toolbar.update();
        }
        return this;
    }

    addfinishEditing(callback) {
        this.finishEditingCallback = callback;
        return this;
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========
    
    bindSidebarToggle() {
        const sidebar = $('#applic-sidebar');
        $('#toggle-sidebar-btn')
            .off('click')
            .on('click', () => sidebar.toggleClass('hidden'));
    }

    exportXML() {
        if (!this.model) {
            console.warn('Model not initialized');
            return null;
        }

        const xmlDoc = this.model.getXML();
        if (!xmlDoc) {
            console.warn('No XML document in model');
            return null;
        }

        const serializer = new XMLSerializer();
        return serializer.serializeToString(xmlDoc[0] || xmlDoc);
    }

    destroy() {
        if (this.dndManager) {
            this.dndManager.destroy();
            this.dndManager = null;
        }

        if (this.view) {
            this.view.destroy();
            this.view = null;
        }

        if (this.toolbar) {
            this.toolbar.destroy();
            this.toolbar = null;
        }

        this.sidebar = null;
        this.model = null;
    }
}
