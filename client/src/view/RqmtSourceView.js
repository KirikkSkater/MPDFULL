class RqmtSourceView extends BaseCellView {
    constructor(model, rowIndex, editable) {
        super(model, rowIndex, editable);
        this.currentModalIndex = null;
        this.modalId = `rqmt-source-modal-${rowIndex}`;
        this.initModal();
    }
    
    renderContent() {
        const $container = $('<div>').addClass('rqmt-source-groups-container');
        
        // Получаем источники из модели
        const sources = this.model.getRqmtSources(this.rowIndex) || [];
        
        // Рендерим каждый блок rqmtSource
        sources.forEach((source, index) => {
            $container.append(this.renderRqmtSourceBlock(source, index));
        });
        
        // Кнопка добавления нового блока
        const $addButton = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .text('Добавить документ исходный')
            .attr('title', 'Добавить новый источник требований')
            .on('click', () => {
                this.model.addRqmtSource(this.rowIndex, {
                    sourceOfRqmt: '',
                    sourceCriticality: []
                });
            });
        
        if (!this.shouldShowEditElements()) $addButton.hide();
        
        const $buttonContainer = $('<div>').attr('style', 'text-align: center; margin-top: 10px;');
        $buttonContainer.append($addButton);
        $container.append($buttonContainer);
        
        return $container;
    }
    
    renderRqmtSourceBlock(source, index) {
        const $block = $('<div>')
            .addClass('rqmt-source-block')
            .attr('data-source-index', index)
            .attr('data-task-index', this.rowIndex);
        
        // Верхняя часть блока: sourceOfRqmt и кнопки
        const $header = $('<div>').addClass('rqmt-source-header');
        
        // Скрытый инпут с автодополнением для sourceOfRqmt
        const $sourceInput = this.renderSourceOfRqmtInput(source.sourceOfRqmt, index);
        $header.append($sourceInput);
        
        // Кнопка удаления блока
        const $deleteButton = $('<button>')
            .addClass('btn btn-sm btn-outline-danger btn-remove btn-icon edit-mode-btn')
            .attr('title', 'Удалить источник')
            .attr('style', 'margin-left: 10px;')
            .on('click', (e) => {
                e.stopPropagation();
                this.model.removeRqmtSource(this.rowIndex, index);
            });
        
        if (!this.shouldShowEditElements()) $deleteButton.hide();
        $header.append($deleteButton);
        
        $block.append($header);
        
        // Нижняя часть: sourceCriticality
        const $criticalityContainer = $('<div>').addClass('rqmt-source-criticality-container');
        
        // Отображаем выбранные критические через запятую
        const criticalityText = this.formatCriticalityDisplay(source.sourceCriticality);
        const $criticalityDisplay = $('<div>')
            .addClass('rqmt-source-criticality-display')
            .text(criticalityText || 'Не выбраны');
        
        $criticalityContainer.append($criticalityDisplay);
        
        // Кнопка редактирования criticality
        const $editButton = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .text('Критичность')
            .attr('title', 'Редактировать список критичностей')
            .attr('style', 'margin-top: 5px;')
            .on('click', (e) => {
                e.stopPropagation();
                this.openCriticalityModal(index);
            });
        
        if (!this.shouldShowEditElements()) $editButton.hide();
        $criticalityContainer.append($editButton);
        
        $block.append($criticalityContainer);
        
        return $block;
    }
    
    renderSourceOfRqmtInput(selectedKey, sourceIndex) {
        // Получаем справочник
        const sourceOfRqmtDict = DictionariesTC.getDictionary("sourceOfRqmtDict") || {};
        
        // Создаем массивы для быстрого поиска
        const keys = Object.keys(sourceOfRqmtDict);
        const displayTexts = keys.map(key => sourceOfRqmtDict[key][1] || key);
        const keyToDisplay = {};
        const displayToKey = {};
        
        keys.forEach(key => {
            const display = sourceOfRqmtDict[key][1] || key;
            keyToDisplay[key] = display;
            displayToKey[display] = key;
        });
        
        // Получаем отображаемое значение для выбранного ключа
        const displayValue = selectedKey ? keyToDisplay[selectedKey] || selectedKey : '';
        
        // Создаем datalist с id
        const datalistId = `source-datalist-${this.rowIndex}-${sourceIndex}`;
        
        // Создаем datalist с опциями
        const $datalist = $('<datalist>').attr('id', datalistId);
        
        // Добавляем пустую опцию
        $datalist.append($('<option>').val('').text(''));
        
        // Заполняем datalist из справочника
        keys.forEach(key => {
            const displayText = keyToDisplay[key];
            $datalist.append($('<option>').val(displayText).text(displayText));
        });
        
        // Создаем input с autocomplete
        const $input = $('<input>')
            .addClass('form-control form-control-sm rqmt-source-input')
            .attr('type', 'text')
            .attr('list', datalistId)
            .attr('data-source-index', sourceIndex)
            .attr('placeholder', 'Начните вводить для поиска...')
            .attr('title', 'Введите название документа или выберите из списка')
            .val(displayValue);
        
        // Сохраняем оригинальный ключ в data атрибуте
        $input.data('original-key', selectedKey);
        $input.data('original-display', displayValue);
        
        // Обработчик фокуса - показываем подсказку
        $input.on('focus', function() {
            $(this).addClass('focused');
            if (!$(this).val()) {
                $(this).attr('placeholder', 'Начните вводить для поиска...');
            }
        });
        
        // Обработчик потери фокуса - проверяем значение
        $input.on('blur', (e) => {
            const $input = $(e.target);
            $input.removeClass('focused');
            const enteredValue = $input.val().trim();
            const originalKey = $input.data('original-key');
            const originalDisplay = $input.data('original-display');
            
            // Если значение не изменилось, ничего не делаем
            if (enteredValue === originalDisplay) {
                return;
            }
            
            // Если поле пустое, просто сохраняем пустое значение
            if (!enteredValue) {
                this.model.updateRqmtSourceField(
                    this.rowIndex, 
                    sourceIndex, 
                    'sourceOfRqmt', 
                    ''
                );
                $input.data('original-key', '');
                $input.data('original-display', '');
                return;
            }
            
            // Ищем точное совпадение по отображаемому тексту
            let foundKey = null;
            
            // Сначала ищем точное совпадение
            if (displayToKey[enteredValue]) {
                foundKey = displayToKey[enteredValue];
            } 
            // Если не нашли точное, ищем частичное совпадение (регистронезависимо)
            else {
                const lowerEntered = enteredValue.toLowerCase();
                for (const display of displayTexts) {
                    if (display.toLowerCase() === lowerEntered) {
                        foundKey = displayToKey[display];
                        // Обновляем отображаемое значение на правильное (с правильным регистром)
                        $input.val(display);
                        break;
                    }
                }
            }
            
            // Если не нашли, показываем предупреждение
            if (!foundKey) {
                // Сохраняем возможные варианты для подсказки
                const matches = displayTexts.filter(display => 
                    display.toLowerCase().includes(enteredValue.toLowerCase())
                );
                
                let message = `Документ "${enteredValue}" не найден в списке доступных документов.`;
                
                if (matches.length > 0) {
                    message += `\n\nВозможно, вы имели в виду:\n• ${matches.join('\n• ')}`;
                } else {
                    message += `\n\nДоступные документы:\n• ${displayTexts.join('\n• ')}`;
                }
                
                message += `\n\nПожалуйста, выберите документ из списка.`;
                
                // Восстанавливаем предыдущее значение
                $input.val(originalDisplay || '');
                
                // Показываем предупреждение
                alert(message);
                
                // Возвращаем фокус на input для исправления
                setTimeout(() => {
                    $input.focus();
                }, 100);
                
                return;
            }
            
            // Обновляем модель, если значение изменилось
            if (foundKey !== originalKey) {
                this.model.updateRqmtSourceField(
                    this.rowIndex, 
                    sourceIndex, 
                    'sourceOfRqmt', 
                    foundKey
                );
                $input.data('original-key', foundKey);
                $input.data('original-display', $input.val());
            }
        });
        
        // Обработчик клавиши Enter
        $input.on('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                $input.blur();
            }
        });
        
        // Обработчик изменения для live-валидации
        $input.on('input', function() {
            const $input = $(this);
            const value = $input.val().trim();
            
            if (!value) {
                $input.removeClass('is-invalid is-valid');
                return;
            }
            
            // Проверяем, есть ли такое значение в справочнике
            const isValid = displayTexts.some(display => 
                display.toLowerCase() === value.toLowerCase()
            );
            
            if (isValid) {
                $input.removeClass('is-invalid');
                $input.addClass('is-valid');
            } else {
                $input.removeClass('is-valid');
                $input.addClass('is-invalid');
            }
        });
        
        // Контейнер для input и datalist
        const $container = $('<div>').addClass('rqmt-source-input-container');
        $container.append($input, $datalist);
        
        return $container;
    }
    
    getDisplayTextForKey(key) {
        if (!key) return '';
        const sourceOfRqmtDict = DictionariesTC.getDictionary("sourceOfRqmtDict") || {};
        const entry = sourceOfRqmtDict[key];
        return entry ? entry[1] || key : key;
    }
    
    formatCriticalityDisplay(criticalities) {
        if (!criticalities || criticalities.length === 0) return '';
        
        const sourceCriticalityDict = DictionariesTC.getDictionary("sourceCriticalityDict") || {};
        
        return criticalities.map(crit => {
            const dictEntry = sourceCriticalityDict[crit];
            return dictEntry ? dictEntry[1] : crit;
        }).join(', ');
    }
    
    initModal() {
        // Удаляем старую модалку если существует
        $(`#${this.modalId}`).remove();
        
        // Создаем модальное окно
        const modalHTML = `
            <div class="modal fade" id="${this.modalId}" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Выбор критичности источника</h5>
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="criticality-checkbox-list" style="max-height: 300px; overflow-y: auto;">
                                <!-- Чекбоксы будут заполнены динамически -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn  btn-outline-danger btn-remove edit-mode-btn" data-dismiss="modal">Отмена</button>
                            <button type="button" class="btn  btn-outline-primary btn-add edit-mode-btn save-criticalities-btn">Сохранить</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modalHTML);
        
        this.$modal = $(`#${this.modalId}`);
        this.$modal.modal({ show: false });
        
        // Назначаем обработчик сохранения
        this.$modal.find('.save-criticalities-btn').on('click', () => {
            this.saveCriticalities();
        });
    }
    
    openCriticalityModal(sourceIndex) {
        this.currentModalIndex = sourceIndex;
        
        // Получаем текущие выбранные criticalities
        const sources = this.model.getRqmtSources(this.rowIndex);
        if (!sources || sourceIndex >= sources.length) return;
        
        const currentCriticalities = sources[sourceIndex].sourceCriticality || [];
        
        // Заполняем чекбоксы
        this.fillCheckboxes(currentCriticalities);
        
        // Показываем модальное окно
        this.$modal.modal('show');
    }
    
    fillCheckboxes(selectedCriticalities) {
        const $container = this.$modal.find('.criticality-checkbox-list');
        $container.empty();
        
        const sourceCriticalityDict = DictionariesTC.getDictionary("sourceCriticalityDict") || {};
        
        Object.entries(sourceCriticalityDict).forEach(([key, value]) => {
            const isChecked = selectedCriticalities.includes(key);
            const displayText = value[1] || key;
            
            const $checkbox = $(`
                <div class="form-check">
                    <input class="form-check-input criticality-checkbox" 
                           type="checkbox" 
                           id="crit-${key}" 
                           value="${key}"
                           ${isChecked ? 'checked' : ''}>
                    <label class="form-check-label" for="crit-${key}">
                        ${displayText}
                    </label>
                </div>
            `);
            
            $container.append($checkbox);
        });
    }
    
    saveCriticalities() {
        if (this.currentModalIndex === null) return;
        
        // Собираем выбранные значения
        const selectedCriticalities = [];
        this.$modal.find('.criticality-checkbox:checked').each(function() {
            selectedCriticalities.push($(this).val());
        });
        
        // Обновляем модель
        this.model.updateRqmtSourceField(
            this.rowIndex,
            this.currentModalIndex,
            'sourceCriticality',
            selectedCriticalities
        );
        
        // Закрываем модальное окно
        this.$modal.modal('hide');
        this.currentModalIndex = null;
    }
    
    // Метод для гранулярного обновления
    addSourceBlock() {
        this.update();
    }
    
    updateSourceBlock(sourceIndex) {
        this.update();
    }
    
    update() {
        this._cachedDom = null;
        return this.render();
    }
    
    setEditable(editable) {
        super.setEditable(editable);
        if (this._cachedDom) {
            const $container = $(this._cachedDom);
            $container.find('.edit-mode-btn').toggle(this.shouldShowEditElements());
        }
    }
    
    destroy() {
        if (this.$modal) {
            this.$modal.remove();
        }
        super.destroy();
    }
}