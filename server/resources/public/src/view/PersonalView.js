class PersonnelView extends BaseCellView {
    constructor(model, rowIndex, editable) {
        super(model, rowIndex, editable);
        this.personnelBlocks = [];
        this.$container = null;
        this.cachedSelectValues = {}; // Кеширование значений селектов
        this.updatePersonnelBlocks();
    }

    updatePersonnelBlocks() {
        const task = this.model.getFilteredTasks()[this.rowIndex];
        this.personnelBlocks = task.personnel || [];
    }

    renderContent() {
        this.$container = $('<div>').addClass('personnel-container');
        this.personnelBlocks = [];
        
        const task = this.model.getFilteredTasks()[this.rowIndex];
        
        (task.personnel || []).forEach((person, index) => {
            const $block = this.renderPersonnelBlock(person, index);
            this.personnelBlocks[index] = $block;
            this.$container.append($block);
        });
        
        // Кнопка добавления нового блока
        const $addButton = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .text('+ Добавить блок')
            .on('click', () => {
                this.model.addPersonnel(this.rowIndex);
            });
            
        const $buttonContainer = $('<div>').attr('style', 'display: flex; justify-content: center; margin-top: 5px;');
        $buttonContainer.append($addButton);
        this.$container.append($buttonContainer);

        if (!this.editable) {
            $addButton.hide();
        }
        
        return this.$container;
    }

    renderPersonnelBlock(person, index) {
        const $personBlock = $('<div>')
            .addClass('personnel-block')
            .attr('data-personnel-index', index)
            .attr('data-task-index', this.rowIndex);

        const $header = $('<div>').addClass('personnel-header');

        // Применимость
        if (person.applicRefId) {
            const applicData = this.model.applicMap[person.applicRefId];
            if (applicData) {
                const $applicTag = this.renderApplicTag(applicData, "personnel", index);
                $header.append($applicTag);
            }
        }  
        
        // Кнопка удаления
        const $deleteButton = $('<button>')
            .addClass('btn btn-sm btn-outline-danger btn-remove edit-mode-btn')
            .attr('title', 'Удалить блок')
            .on('click', () => {
                if (confirm('Удалить этот блок?')) {
                    this.model.removePersonnel(this.rowIndex, index);
                }
            });
        if (!this.editable) $deleteButton.hide();
        const $divDeleteBtn = $('<div>').attr('style', 'display: flex; justify-content: center;');
        $divDeleteBtn.append($deleteButton);
        $header.append($divDeleteBtn);
        
        $personBlock.append($header);
        
        // Поле для ввода количества человек
        const $numContainer = $('<div>').addClass('personnel-input-container');
        $numContainer.append($('<label>').text('Кол-во:'));
        
        const $numInput = $('<input>')
            .attr('type', 'number')
            .addClass('personnel-num-input')
            .val(person.numRequired)
            .attr('data-personnel-index', index)
            .attr('data-field', 'numRequired')
            .on('input', e => {
                // Сохраняем в кеш при вводе
                const personnelIndex = $(e.target).data('personnel-index');
                const field = $(e.target).data('field');
                const cacheKey = `${personnelIndex}-${field}`;
                this.cachedSelectValues[cacheKey] = e.target.value;
            })
            .on('blur', e => {
                const personnelIndex = $(e.target).data('personnel-index');
                const field = $(e.target).data('field');
                this.model.updatePersonnelField(this.rowIndex, personnelIndex, field, e.target.value);
                
                // Очищаем кеш после сохранения
                const cacheKey = `${personnelIndex}-${field}`;
                delete this.cachedSelectValues[cacheKey];
            });
        
        $numContainer.append($numInput);
        $personBlock.append($numContainer);
        
        // Выпадающий список для специализации
        const $catContainer = $('<div>').addClass('personnel-input-container-spec');
        $catContainer.append($('<label>').text('Специализация:'));
        
        const $catSelect = $('<select>').addClass('personnel-cat-select')
            .attr('data-personnel-index', index)
            .attr('data-field', 'personCategoryCode');
        
        // Заполняем значениями из справочника
        const personCatDict = DictionariesTC.getDictionary("personCatDict");
        
        // Добавляем опции
        Object.entries(personCatDict || {}).forEach(([key, value]) => {
            $catSelect.append($('<option>').val(key).text(value));
        });
        
        // Используем кешированное значение или значение из модели
        const cacheKey = `${index}-personCategoryCode`;
        const cachedValue = this.cachedSelectValues[cacheKey];
        const displayValue = cachedValue !== undefined ? cachedValue : person.personCategoryCode;
        $catSelect.val(displayValue);
        
        $catSelect.on('change', e => {
            const personnelIndex = $(e.target).closest('select').data('personnel-index');
            const field = $(e.target).closest('select').data('field');
            
            // Сохраняем в кеш
            const cacheKey = `${personnelIndex}-${field}`;
            this.cachedSelectValues[cacheKey] = e.target.value;
            
            this.model.updatePersonnelField(this.rowIndex, personnelIndex, field, e.target.value);
            
            // Очищаем кеш после сохранения
            delete this.cachedSelectValues[cacheKey];
        });
        
        $catContainer.append($catSelect);
        $personBlock.append($catContainer);
        
        return $personBlock;
    }

    /**
     * Гранулярное обновление конкретного блока персонала
     */
    updatePersonnelBlock(personnelIndex) {
        const task = this.model.getFilteredTasks()[this.rowIndex];
        const person = task.personnel[personnelIndex];
        
        if (person && this.personnelBlocks[personnelIndex]) {
            // Сохраняем значения перед заменой
            this.saveSelectValues(personnelIndex);
            
            // Создаем новый блок
            const $newBlock = this.renderPersonnelBlock(person, personnelIndex);
            
            // Заменяем старый блок на новый
            this.personnelBlocks[personnelIndex].replaceWith($newBlock);
            this.personnelBlocks[personnelIndex] = $newBlock;
            
            // Восстанавливаем значения
            this.restoreSelectValues(personnelIndex);
        }
    }

    /**
     * Добавляет новый блок персонала
     */
    addPersonnelBlock() {
        const task = this.model.getFilteredTasks()[this.rowIndex];
        const newIndex = task.personnel.length - 1;
        const person = task.personnel[newIndex];
        
        const $block = this.renderPersonnelBlock(person, newIndex);
        this.personnelBlocks[newIndex] = $block;
        
        // Вставляем перед кнопкой добавления
        const $buttonContainer = this.$container.find('> div:last-child');
        if ($buttonContainer.length) {
            $buttonContainer.before($block);
        } else {
            this.$container.append($block);
        }
    }

    /**
     * Сохраняет значения селектов для блока
     */
    saveSelectValues(personnelIndex) {
        if (this.personnelBlocks[personnelIndex]) {
            const $block = this.personnelBlocks[personnelIndex];
            
            // Сохраняем значение числового поля
            const $numInput = $block.find('.personnel-num-input');
            if ($numInput.length) {
                const field = $numInput.data('field');
                const cacheKey = `${personnelIndex}-${field}`;
                this.cachedSelectValues[cacheKey] = $numInput.val();
            }
            
            // Сохраняем значение селекта специализации
            const $catSelect = $block.find('.personnel-cat-select');
            if ($catSelect.length) {
                const field = $catSelect.data('field');
                const cacheKey = `${personnelIndex}-${field}`;
                this.cachedSelectValues[cacheKey] = $catSelect.val();
            }
        }
    }

    /**
     * Восстанавливает значения селектов для блока
     */
    restoreSelectValues(personnelIndex) {
        if (this.personnelBlocks[personnelIndex]) {
            const $block = this.personnelBlocks[personnelIndex];
            
            // Восстанавливаем значение числового поля
            const $numInput = $block.find('.personnel-num-input');
            if ($numInput.length) {
                const field = $numInput.data('field');
                const cacheKey = `${personnelIndex}-${field}`;
                if (this.cachedSelectValues[cacheKey] !== undefined) {
                    $numInput.val(this.cachedSelectValues[cacheKey]);
                }
            }
            
            // Восстанавливаем значение селекта специализации
            const $catSelect = $block.find('.personnel-cat-select');
            if ($catSelect.length) {
                const field = $catSelect.data('field');
                const cacheKey = `${personnelIndex}-${field}`;
                if (this.cachedSelectValues[cacheKey] !== undefined) {
                    $catSelect.val(this.cachedSelectValues[cacheKey]);
                }
            }
        }
    }

    update() {
        // Обновляем список блоков
        this.updatePersonnelBlocks();
        
        // Перерисовываем с сохранением значений
        this.$container = null;
        return this.render();
    }

    destroy() {
        console.log(`Destroying PersonnelView for row ${this.rowIndex}`);
        
        // Очищаем кеш
        this.cachedSelectValues = {};
        this.personnelBlocks = [];
        this.$container = null;
        
        super.destroy();
    }
}