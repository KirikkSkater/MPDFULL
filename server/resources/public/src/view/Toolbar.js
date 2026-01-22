class Toolbar {
    constructor(callbacks = {}) {
        this.toolbar = document.getElementById('toolbar');
        this.tcNameBox = document.getElementById('tc-name-box-id');
        this.exitBtn = document.getElementById('exit-btn');
        this.editBtn = document.getElementById('edit-btn');
        this.previewBtn = document.getElementById('preview-btn');
        
        // Колбэки в контроллер
        this.callbacks = {
            onEditClick: callbacks.onEditClick || (() => {}),
            onExitClick: callbacks.onExitClick || (() => {}),
            onPreviewClick: callbacks.onPreviewClick || (() => {}),
            onSaveClick: callbacks.onSaveClick || (() => {})
        };
        
        // Геттеры состояний из контроллера
        this.getEditMode = callbacks.getEditMode || (() => false);
        this.getPreviewMode = callbacks.getPreviewMode || (() => false);
        this.getSaving = callbacks.getSaving || (() => false);
        
        this.initializeButtons();
        this.update();
    }
    
    initializeButtons() {
        // Обработчик кнопки Edit/Save
        this.editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.editBtn.classList.contains('edit')) {
                this.callbacks.onEditClick(); // Вход в редактирование
            } else {
                this.callbacks.onSaveClick(); // Сохранение
            }
        });
        
        // Обработчик кнопки Exit
        this.exitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.callbacks.onExitClick();
        });
        
        // Обработчик кнопки Preview
        this.previewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.callbacks.onPreviewClick();
        });
    }
    
    // Обновление внешнего вида на основе состояний из контроллера
    update() {
        const editMode = this.getEditMode();
        const previewMode = this.getPreviewMode();
        const saving = this.getSaving(); // получаем состояние сохранения
        
        // Обновляем кнопку Edit/Save с учетом сохранения
        if (editMode) {
            this.editBtn.classList.remove('edit');
            this.editBtn.classList.add('save');
            
            if (saving) {
                this.editBtn.textContent = 'Сохранение...';
                this.editBtn.disabled = true;
            } else {
                this.editBtn.textContent = 'Сохранить';
                this.editBtn.disabled = false;
            }
            this.exitBtn.disabled = false;
            this.previewBtn.disabled = false;
        } else {
            this.editBtn.classList.remove('save');
            this.editBtn.classList.add('edit');
            this.editBtn.textContent = 'Редактировать';
            this.editBtn.disabled = saving; // блокируем если идет сохранение
            this.previewBtn.disabled = true;
            this.exitBtn.disabled = true;
        }
        
        // Обновляем кнопку Preview
        if (previewMode) {
            this.previewBtn.classList.add('preview');
        } else {
            this.previewBtn.classList.remove('preview');
        }
        
        // Обновляем иконки предпросмотра
        this.updatePreviewIcons(previewMode);
        
        // Обновляем состояние полей ввода
        this.updateInputStates();
    }
    
    updatePreviewIcons(previewMode) {
        const previewIcon = document.getElementById("preview-icon");
        const hiddenIcon = document.getElementById("hidden-icon");
        
        if (previewMode) {
            if (hiddenIcon) hiddenIcon.style.display = 'block';
            if (previewIcon) previewIcon.style.display = 'none';
        } else {
            if (previewIcon) previewIcon.style.display = 'block';
            if (hiddenIcon) hiddenIcon.style.display = 'none';
        }
    }
    
    updateInputStates() {
        const editMode = this.getEditMode();
        
        // Блокируем/разблокируем поля ввода в зависимости от режима
        if (this.tcNameBox) {
            this.tcNameBox.disabled = !editMode;
        }
    }
    
    // Внешний интерфейс для принудительного обновления
    refresh() {
        this.update();
    }

    initializeButtons() {
        // Удаляем все старые обработчики перед добавлением новых
        this.removeAllEventListeners();
        
        // Добавляем новые обработчики
        this.editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.editBtn.classList.contains('edit')) {
                this.callbacks.onEditClick(); // Вход в редактирование
            } else {
                this.callbacks.onSaveClick(); // Сохранение
            }
        });
        
        this.exitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.callbacks.onExitClick();
        });
        
        this.previewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.callbacks.onPreviewClick();
        });
    }

    removeAllEventListeners() {
        // Клонируем кнопки без обработчиков событий
        const cloneEditBtn = this.editBtn.cloneNode(true);
        const cloneExitBtn = this.exitBtn.cloneNode(true);
        const clonePreviewBtn = this.previewBtn.cloneNode(true);
        
        // Заменяем старые кнопки клонами
        this.editBtn.parentNode.replaceChild(cloneEditBtn, this.editBtn);
        this.exitBtn.parentNode.replaceChild(cloneExitBtn, this.exitBtn);
        this.previewBtn.parentNode.replaceChild(clonePreviewBtn, this.previewBtn);
        
        // Обновляем ссылки на кнопки
        this.editBtn = cloneEditBtn;
        this.exitBtn = cloneExitBtn;
        this.previewBtn = clonePreviewBtn;
    }
    
    destroy() {

        this.removeAllEventListeners();
        
        // Очищаем колбэки
        this.callbacks = {
            onEditClick: () => {},
            onExitClick: () => {},
            onPreviewClick: () => {},
            onSaveClick: () => {}
        };
        
        // Сбрасываем состояние кнопок
        this.editBtn.classList.remove('edit', 'save');
        this.editBtn.classList.add('edit');
        this.editBtn.textContent = 'Редактировать';
        this.editBtn.disabled = true;
        
        this.previewBtn.classList.remove('preview');
        this.previewBtn.disabled = true;
        
        this.exitBtn.disabled = false;
        
        // Сбрасываем иконки
        this.updatePreviewIcons(false);
    }
    
    // Внешний интерфейс для принудительного обновления
    refresh() {
        this.update();
    }

}