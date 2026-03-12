class TaskDurationView extends BaseCellView {
    constructor(model, rowIndex, editable) {
        super(model, rowIndex, editable);
        this.durationBlocks = [];
        this.$container = null;
        this.$buttonContainer = null;
        this.cachedInputValues = {}; // Кеширование значений полей ввода
        this.updateDurationBlocks();
    }

    updateDurationBlocks() {
        const task = this.model.getFilteredTasks()[this.rowIndex];
        this.durationBlocks = task.taskDurations || [];
    }

    renderContent() {
        this.$container = $('<div>').addClass('task-duration-container');
        this.durationBlocks = [];
        
        const task = this.model.getFilteredTasks()[this.rowIndex];
        
        // Рендерим каждый блок taskDuration
        (task.taskDurations || []).forEach((duration, index) => {
            const $block = this.renderSingleTaskDurationBlock(duration, index);
            this.durationBlocks[index] = $block;
            this.$container.append($block);
        });
        
        // Кнопка добавления нового блока
        const $addButton = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .text('+')
            .attr('title', 'Добавить трудоёмкость')
            .on('click', () => {
                this.model.addTaskDuration(this.rowIndex);
            });
        
        if (!this.editable) {
            $addButton.hide();
        } else {
            $addButton.show();
        }
        
        this.$buttonContainer = $('<div>').attr('style', 'text-align: center; margin-top: 10px;');
        this.$buttonContainer.append($addButton);
        this.$container.append(this.$buttonContainer);
        
        return this.$container;
    }

    renderSingleTaskDurationBlock(duration, index) {
        const $block = $('<div>')
            .addClass('task-duration-block')
            .attr('data-duration-index', index)
            .attr('data-task-index', this.rowIndex);

        // Применимость
        if (duration.applicRefId) {
            const $applicTag = this.renderApplicTag(
                {
                    id: duration.applicRefId,
                    displayValue: this.model.getApplicDisplayValue(duration.applicRefId)
                },
                "taskDuration",
                index
            );
            $block.append($applicTag);
        }

        const $header = $('<div>').addClass('task-duration-header');

        // Кнопка удаления
        const $deleteButton = $('<button>')
            .addClass('btn btn-sm btn-outline-danger remove-task-duration-btn btn-remove edit-mode-btn')
            // .html('&times;')
            .attr('title', 'Удалить трудоёмкость')
            .on('click', () => {
                this.model.removeTaskDuration(this.rowIndex, index);
            });

        if (!this.editable) {
            $deleteButton.hide();
        } else {
            $deleteButton.show();
        }

        $header.append($deleteButton);
        $block.append($header);

        // Поля ввода для длительностей
        const fields = [
            { key: 'procedureDuration', label: 'Длительность:' },
            { key: 'startupDuration', label: 'Подготовка:' }
        ];

        fields.forEach(field => {
            const $row = $('<div>').addClass('task-duration-row');
            $row.append($('<div>').addClass('task-duration-label').text(field.label));

            // Используем кешированное значение или значение из модели
            const cacheKey = `${index}-${field.key}`;
            const cachedValue = this.cachedInputValues[cacheKey];
            const displayValue = cachedValue !== undefined ? cachedValue : duration[field.key];

            const $input = $('<input type="text">')
                .addClass('task-duration-input')
                .val(displayValue)
                .attr('data-duration-index', index)
                .attr('data-field-key', field.key)
                .on('input', e => {
                    // Сохраняем в кеш при вводе
                    const durationIndex = $(e.target).data('duration-index');
                    const fieldKey = $(e.target).data('field-key');
                    const cacheKey = `${durationIndex}-${fieldKey}`;
                    this.cachedInputValues[cacheKey] = e.target.value;
                })
                .on('blur', e => {
                    const durationIndex = $(e.target).data('duration-index');
                    const fieldKey = $(e.target).data('field-key');
                    this.model.updateTaskDurationField(this.rowIndex, durationIndex, fieldKey, e.target.value);
                    
                    // Очищаем кеш после сохранения
                    const cacheKey = `${durationIndex}-${fieldKey}`;
                    delete this.cachedInputValues[cacheKey];
                });

            $row.append($input);
            $block.append($row);
        });

        return $block;
    }

    /**
     * Гранулярное обновление конкретного блока
     */
    updateDurationBlock(durationIndex) {
        const task = this.model.getFilteredTasks()[this.rowIndex];
        const duration = task.taskDurations[durationIndex];
        
        if (duration && this.durationBlocks[durationIndex]) {
            // Сохраняем значения полей ввода перед заменой
            this.saveInputValues(durationIndex);
            
            // Создаем новый блок
            const $newBlock = this.renderSingleTaskDurationBlock(duration, durationIndex);
            
            // Заменяем старый блок на новый
            this.durationBlocks[durationIndex].replaceWith($newBlock);
            this.durationBlocks[durationIndex] = $newBlock;
            
            // Восстанавливаем сохраненные значения
            this.restoreInputValues(durationIndex);
        }
    }

    /**
     * Добавляет новый блок без полной перерисовки
     */
    addDurationBlock() {
        const task = this.model.getFilteredTasks()[this.rowIndex];
        const newIndex = task.taskDurations.length - 1;
        const duration = task.taskDurations[newIndex];
        
        const $block = this.renderSingleTaskDurationBlock(duration, newIndex);
        this.durationBlocks[newIndex] = $block;
        
        // Вставляем перед контейнером с кнопкой
        if (this.$buttonContainer) {
            this.$buttonContainer.before($block);
        } else {
            this.$container.append($block);
        }
    }

    /**
     * Сохраняет значения полей ввода для блока
     */
    saveInputValues(durationIndex) {
        if (this.durationBlocks[durationIndex]) {
            const $inputs = this.durationBlocks[durationIndex].find('.task-duration-input');
            $inputs.each((i, input) => {
                const $input = $(input);
                const fieldKey = $input.data('field-key');
                const cacheKey = `${durationIndex}-${fieldKey}`;
                this.cachedInputValues[cacheKey] = $input.val();
            });
        }
    }

    /**
     * Восстанавливает значения полей ввода для блока
     */
    restoreInputValues(durationIndex) {
        if (this.durationBlocks[durationIndex]) {
            const $inputs = this.durationBlocks[durationIndex].find('.task-duration-input');
            $inputs.each((i, input) => {
                const $input = $(input);
                const fieldKey = $input.data('field-key');
                const cacheKey = `${durationIndex}-${fieldKey}`;
                if (this.cachedInputValues[cacheKey] !== undefined) {
                    $input.val(this.cachedInputValues[cacheKey]);
                }
            });
        }
    }

    update() {
        // Обновляем список блоков
        this.updateDurationBlocks();
        
        // Перерисовываем с сохранением значений
        this.$container = null;
        this.$buttonContainer = null;
        return this.render();
    }

    setEditable(editable) {
        super.setEditable(editable);
        
        if (this.durationBlocks) {
            this.durationBlocks.forEach($block => {
                const $buttons = $block.find('.edit-mode-btn');
                $buttons.toggle(editable);
                
                // Управляем редактируемостью полей ввода
                const $inputs = $block.find('.task-duration-input');
                if (editable) {
                    $inputs.removeAttr('readonly');
                } else {
                    $inputs.attr('readonly', 'readonly');
                }
            });
        }
    }

    destroy() {
        console.log(`Destroying TaskDurationView for row ${this.rowIndex}`);
        
        // Очищаем кеш
        this.cachedInputValues = {};
        this.durationBlocks = [];
        this.$container = null;
        this.$buttonContainer = null;
        
        super.destroy();
    }
}