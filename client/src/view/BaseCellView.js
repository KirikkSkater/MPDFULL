

class BaseCellView {
    constructor(model, rowIndex, editable) {
        this.model = model;
        this.rowIndex = rowIndex;
        this.editable = editable;
        this._cachedDom = null;

        this.updateFromGlobalState();

        
        this.previewMode = document.body.classList.contains('preview-mode');
    }

    updateFromGlobalState() {
        // Проверяем CSS классы на body для определения режимов
        this.previewMode = document.body.classList.contains('preview-mode');
        this.editMode = document.body.classList.contains('edit-mode');
    }
    
    // Обновленный метод для проверки, нужно ли показывать элементы редактирования
    shouldShowEditElements() {
        this.updateFromGlobalState();
        return this.editable && !this.previewMode;
    }
    
    // Метод для обновления режима редактирования (вызывается из ScheduleView)
    updateEditMode(editable) {
        this.editable = editable;
        this._cachedDom = null;
    }
    
    // Метод для установки режима предпросмотра (вызывается из ScheduleView)
    setPreviewMode(previewMode) {
        this.previewMode = previewMode;
        this._cachedDom = null;
    }

renderApplicTag(applic, targetType, targetIndex) {
        const applicId = typeof applic === 'string' ? applic : applic.id;
        const displayValue = typeof applic === 'string'
            ? this.model.getApplicDisplayValue(applic)
            : (applic.displayValue || applic.id);
        
        // Создаем тег
        const $tag = $('<div>').addClass('applic-tag');
        const rowIndex = this.rowIndex;
        // Добавляем тип для цветового кодирования
        if (targetType) {
            $tag.addClass(`type-${targetType}`);
        }
        
        // Добавляем класс если есть кнопка удаления
        // if (withDelete && rowIndex !== null && targetType !== null) {
        //     $tag.addClass('has-delete-btn');
        // } else {
        //     $tag.addClass('readonly');
        // }
        
        // Контейнер для текста
        const $textContainer = $('<div>').addClass('applic-text-container');
        
        // Текст применимости
        // const $textSpan = $('<span>')
        //     .addClass('applic-text')
        //     .text(displayValue || 'Неизвестно')
        //     .attr('title', displayValue || applicId); // Полный текст в тултипе
        
        const $textSpan = applicId;

        $textContainer.append($textSpan);
        $tag.append($textContainer);
        
        // Добавляем кнопку удаления если нужно
        if (rowIndex !== null && targetType !== null) {
            // Создаем кнопку
            const $delBtn = $('<button>')
                .addClass('btn btn-xs btn-outline-danger btn-remove btn-icon btn-square btn-remove delete-applic edit-mode-btn')
                // .html('×')
                .attr('title', 'Удалить применимость')
                .attr('aria-label', 'Удалить применимость')
                .data({
                    'applic-id': applicId,
                    'row-index': rowIndex,
                    'target-type': targetType,
                    'target-index': targetIndex
                });
            
            // Обработчик удаления
            $delBtn.on('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                if (confirm('Удалить эту применимость?')) {
                    // Маппинг типов на методы модели
                    const methodMap = {
                        'field': () => this.model.removeApplicForField(rowIndex, targetIndex),
                        'limit': () => this.model.removeApplicForLimit(rowIndex, targetIndex),
                        'personnel': () => this.model.removeApplicForPersonnel(rowIndex, targetIndex),
                        'task': () => this.model.removeApplicForTask(rowIndex),
                        'remarks': () => this.model.removeApplicForRemarks(rowIndex),
                        'workAreaGroup': () => this.model.removeApplicForWorkAreaGroup(rowIndex, targetIndex),
                        'dmRef': () => this.model.removeApplicForDmRef(rowIndex, targetIndex),
                        'taskDuration': () => this.model.removeApplicForTaskDuration(rowIndex, targetIndex)
                    };
                    
                    const handler = methodMap[targetType];
                    if (handler) {
                        handler();
                    } else {
                        console.error(`Неизвестный тип цели: ${targetType}`);
                    }
                }
            });

            $tag.append(
                $delBtn
            );
            
            // Управляем видимостью в зависимости от режима редактирования
            if (!this.editable) {
            $delBtn.hide();
        } else {
            $delBtn.show();
            }
    }
        
        return $tag;
    }

    updateApplicTagsEditMode(isEditable) {
        $('.delete-applic').each(function() {
            const $btn = $(this);
            if (isEditable) {
                $btn.show();
            } else {
                $btn.hide();
            }
        });
        
        // Обновляем классы тегов
        $('.applic-tag').toggleClass('readonly', !isEditable);
    }

saveRemarks(rowIndex, targetType, targetIndex, remarks) {
    if (!remarks || remarks.trim().length === 0) {
        remarks = '';
    }

    switch (targetType) {
        case 'limit':
            this.model.updateLimitRemarks(rowIndex, targetIndex, remarks);
            break;
        case 'workArea':
            this.model.updateWorkAreaRemarks(rowIndex, targetIndex, remarks);
            break;
        case 'task':
            this.model.updateTaskRemarks(rowIndex, remarks);
            break;
    }
}

    // Шаблонный метод - должен быть реализован в потомках
    renderContent() {
        throw new Error('Method renderContent must be implemented');
    }

    // Основной метод рендеринга, использующий кеш
    render() {
        if (!this._cachedDom) {
            this._cachedDom = this.renderContent();
        }
        return this._cachedDom;
    }

    // В BaseCellView добавляем метод для рендеринга примечаний:
renderRemarksField(remarks, rowIndex, targetType, targetIndex = null) {
    const shouldShow = remarks !== undefined && remarks !== null;
    
    if (!shouldShow && !this.editable) {
        return null;
    }

    const $container = $('<div>').addClass('remarks-block');
    
    // Заголовок "Примечание:"
    const $label = $('<div>').addClass('remarks-label').text('Примечание:');
    $container.append($label);
    
    // Поле для текста
    const displayText = remarks || '';
    const $textField = $('<div>')
        .addClass('remarks-text')
        .text(displayText)
        .attr('data-row-index', rowIndex)
        .attr('data-target-type', targetType);
    
    if (targetIndex !== null) {
        $textField.attr('data-target-index', targetIndex);
    }
    
    // Если в режиме редактирования - делаем редактируемым
    if (this.editable) {
        $textField.attr('contenteditable', 'true');
        
        // Обработчик сохранения при потере фокуса
        $textField.on('blur', () => {
            const newText = $textField.text().trim();
            this.saveRemarks(rowIndex, targetType, targetIndex, newText);
        });
        
        // Обработчики клавиш
        $textField.on('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                $textField.blur();
            } else if (e.key === 'Escape') {
                $textField.text(displayText).blur();
            }
        });
    }
    
    $container.append($textField);
    return $container;
}

    // Обновление представления (сбрасывает кеш и перерисовывает)
    update() {
        this._cachedDom = null;
        return this.render();
    }

    // Очистка (например, при удалении строки)
    destroy() {
        this._cachedDom = null;
    }
}