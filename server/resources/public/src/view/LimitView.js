const UNITS = [
    { key: 'th01', label: 'th01 - Flight hours'   },
    { key: 'th02', label: 'th02 - Flight cycles'  },
    { key: 'th03', label: 'th03 - Months'         },
    { key: 'th04', label: 'th04 - Weeks'          },
    { key: 'th05', label: 'th05 - Years'          },
    { key: 'th06', label: 'th06 - Days'           },
    { key: 'th08', label: 'th08 - Pressure cycles'},
    { key: 'th09', label: 'th09 - Engine cycles'  },
    { key: 'th10', label: 'th10 - Engine change'  },
    { key: 'th11', label: 'th11 - Shop visits'    }
  ];

class LimitView extends BaseCellView {

    constructor(model, rowIndex, editable) {
        super(model, rowIndex, editable);
    }
    renderContent() {
        const $container = $('<div>').addClass('limit-container');
        const task = this.model.getFilteredTasks()[this.rowIndex];
        
        (task.limits || []).forEach((limit, limitIndex) => {
            $container.append(this.renderSingleLimitBlock(limit, limitIndex));
        });
        
        // Кнопка добавления нового лимита
        const $addButton = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .text('Добавить предел')
            .on('click', () => {
                this.model.addLimitToTask(this.rowIndex);
            });
        
        if (!this.editable) $addButton.hide();
        
        const $buttonContainer = $('<div>').attr('style', 'display: flex; justify-content: center; margin-top: 5px;');
        $buttonContainer.append($addButton);
        $container.append($buttonContainer);
        
        return $container;
    }

    renderSingleLimitBlock(limit, limitIndex) {
        const $block = $('<div>')
            .addClass('limit-block')
            .attr('data-limit-index', limitIndex)
            .attr('data-task-index', this.rowIndex);

        // Заголовок с применимостью и основными полями
        const $header = $('<div>').addClass('limit-header');
        
        // Применимость
        if (limit.applicRefId) {
            const $applicTag = this.renderApplicTag(
                {
                    id: limit.applicRefId,
                    displayValue: this.model.getApplicDisplayValue(limit.applicRefId)
                },
                "limit",
                limitIndex
            );
            $header.append($applicTag);
        }

        // Основные поля лимита
        const $mainFields = $('<div>').addClass('limit-main-fields');
        
        // Тип лимита
        const $typeSelect = $('<select>').addClass('limit-type-select')
            .append('<option value="po">po</option>')
            .append('<option value="pe">pe</option>')
            .append('<option value="oc">oc</option>')
            .val(limit.limitType)
            .on('change', e => {
                this.model.updateLimitMainField(this.rowIndex, limitIndex, 'limitType', e.target.value);
                // Показываем/скрываем поле условия для типа 'oc'
                $(e.target).closest('.limit-main-fields').find('.limit-condition-input')
                    .toggle(e.target.value === 'oc');
            });

        // Условие (только для типа 'oc')
        const $conditionInput = $('<input type="text">').addClass('limit-condition-input')
            .val(limit.limitCond || '')
            .attr('placeholder', 'Условие')
            .toggle(limit.limitType === 'oc')
            .on('blur', e => {
                this.model.updateLimitMainField(this.rowIndex, limitIndex, 'limitCond', e.target.value);
            });

        $mainFields.append($typeSelect, $conditionInput);
        $header.append($mainFields);

        // Кнопка удаления лимита
        const $deleteButton = $('<button>')
            .addClass('btn btn-xs btn-outline-danger btn-remove btn-square btn-icon edit-mode-btn')
            // .html('&times;')
            .attr('title', 'Удалить предел')
            .on('click', () => {
                if (confirm('Удалить этот предел?')) {
                    this.model.removeLimitFromTask(this.rowIndex, limitIndex);
                }
            });

        if (!this.editable) $deleteButton.hide();
        $header.append($deleteButton);

        $block.append($header);

        // Основное содержимое - две колонки
        const $content = $('<div>').addClass('limit-content columns-layout');
        
        // Левая колонка - пороги
        const $thresholdsColumn = $('<div>').addClass('limit-column thresholds-column');
        $thresholdsColumn.append($('<div>').addClass('column-header').text('Пороги'));
        
        const $thresholdsList = $('<div>').addClass('thresholds-list');
        limit.thresholds.forEach((threshold, thresholdIndex) => {
            $thresholdsList.append(this.renderThreshold(threshold, limitIndex, thresholdIndex));
        });
        $thresholdsColumn.append($thresholdsList);
        
        // Кнопка добавления порога
        const $addThresholdBtn = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .text('Добавить порог')
            .on('click', () => {
                this.model.addThresholdToLimit(this.rowIndex, limitIndex);
            });
        
        if (!this.editable) $addThresholdBtn.hide();

        const $buttonContainer = $('<div>').attr('style', 'display: flex; justify-content: center;');
        $buttonContainer.append($addThresholdBtn);
        $thresholdsColumn.append($buttonContainer);

        // Правая колонка - интервалы
        const $intervalsColumn = $('<div>').addClass('limit-column intervals-column');
        $intervalsColumn.append($('<div>').addClass('column-header').text('Интервалы'));
        
        const $intervalsList = $('<div>').addClass('intervals-list');
        limit.intervals.forEach((interval, intervalIndex) => {
            $intervalsList.append(this.renderInterval(interval, limitIndex, intervalIndex));
        });
        $intervalsColumn.append($intervalsList);
        
        // Кнопка добавления интервала
        const $addIntervalBtn = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .text('Добавить интервал')
            .on('click', () => {
                this.model.addIntervalToLimit(this.rowIndex, limitIndex);
            });
        
        if (!this.editable) $addIntervalBtn.hide();
        const $buttonContainer2 = $('<div>').attr('style', 'display: flex; justify-content: center;');
        $buttonContainer2.append($addIntervalBtn);
        $intervalsColumn.append($buttonContainer2);

        $content.append($thresholdsColumn, $intervalsColumn);
        $block.append($content);

        // Примечания
        const limitRemarks = limit.remarks ? limit.remarks.text : undefined;
        if (limitRemarks != undefined) {
            const $remarksBlock = this.renderRemarksField(limitRemarks, this.rowIndex, 'limit', limitIndex);
            if ($remarksBlock) {
                $block.append($remarksBlock);
            }
        }

        return $block;
    }

    renderThreshold(threshold, limitIndex, thresholdIndex) {
        const $thresholdRow = $('<div>').addClass('threshold-row');
        
        const $valueInput = $('<input type="text">').addClass('threshold-value-input')
            .val(threshold.value)
            .attr('placeholder', 'Значение')
            .on('blur', e => {
                this.model.updateThresholdField(this.rowIndex, limitIndex, thresholdIndex, 'value', e.target.value);
            });

        const $unitSelect = $('<select>').addClass('threshold-unit-select')
            .append(UNITS.map(u => `<option value="${u.key}">${u.label}</option>`))
            .val(threshold.unit)
            .on('change', e => {
                this.model.updateThresholdField(this.rowIndex, limitIndex, thresholdIndex, 'unit', e.target.value);
            });

        const $deleteButton = $('<button>')
            .addClass('btn btn-xs btn-outline-danger btn-remove btn-icon btn-square edit-mode-btn')
            // .html('&times;')
            .attr('title', 'Удалить порог')
            .on('click', () => {
                if (confirm('Удалить этот порог?')) {
                    this.model.removeThresholdFromLimit(this.rowIndex, limitIndex, thresholdIndex);
                }
            });

        if (!this.editable) $deleteButton.hide();

        $thresholdRow.append($valueInput, $unitSelect, $deleteButton);
        return $thresholdRow;
    }

    renderInterval(interval, limitIndex, intervalIndex) {
        const $intervalRow = $('<div>').addClass('interval-row');
        
        const $valueInput = $('<input type="text">').addClass('interval-value-input')
            .val(interval.value)
            .attr('placeholder', 'знач.')
            .on('blur', e => {
                const value = e.target.value;
                this.model.updateIntervalField(this.rowIndex, limitIndex, intervalIndex, 'value', value);
                
                // Проверяем валидность
                if (!value || value.trim() === '') {
                    alert('Ошибка: Интервал должен быть заполнен!');
                    $valueInput.addClass('error');
                } else {
                    $valueInput.removeClass('error');
                }
            });
    
        const $unitSelect = $('<select>').addClass('interval-unit-select')
            .append(UNITS.map(u => `<option value="${u.key}">${u.label}</option>`))
            .val(interval.unit)
            .on('change', e => {
                this.model.updateIntervalField(this.rowIndex, limitIndex, intervalIndex, 'unit', e.target.value);
            });
    
        // Проверяем, можно ли удалить этот интервал (не последний)
        const task = this.model.getFilteredTasks()[this.rowIndex];
        const canDelete = task.limits[limitIndex].intervals.length > 1;
    
        if (this.editable && canDelete) {
            const $deleteButton = $('<button>')
                .addClass('btn btn-xs btn-remove btn-icon btn-square btn-remove edit-mode-btn')
                // .html('&times;')
                .attr('title', 'Удалить интервал')
                .on('click', () => {
                    if (confirm('Удалить этот интервал?')) {
                        this.model.removeIntervalFromLimit(this.rowIndex, limitIndex, intervalIndex);
                    }
                });
            $intervalRow.append($valueInput, $unitSelect, $deleteButton);
        } else {
            $intervalRow.append($valueInput, $unitSelect);
            
            // Если это последний интервал, показываем подсказку
            if (!canDelete && this.editable) {
                $intervalRow.append(
                    $('<span>')
                        .addClass('text-muted')
                        .attr('title', 'Нельзя удалить последний интервал')
                        .html(' ⓘ')
                        .css('cursor', 'help')
                );
            }
        }
    
        return $intervalRow;
    }

    // Добавляем метод для рендеринга примечаний (если его нет в BaseCellView)
    renderRemarksField(remarks, rowIndex, targetType, targetIndex = null) {
        const shouldShow = remarks !== undefined && remarks !== null;
        
        if (!shouldShow && !this.editable) {
            return null;
        }

        const $container = $('<div>').addClass('remarks-block');
        $container.append($('<div>').addClass('remarks-label').text('Примечание:'));
        
        const displayText = remarks || '';
        const $textField = $('<div>')
            .addClass('remarks-text')
            .text(displayText)
            .attr('data-row-index', rowIndex)
            .attr('data-target-type', targetType);

        if (targetIndex !== null) {
            $textField.attr('data-target-index', targetIndex);
        }
        
        if (this.editable) {
            $textField.attr('contenteditable', 'true');
            $textField.on('blur', () => {
                const newText = $textField.text().trim();
                this.saveRemarks(rowIndex, targetType, targetIndex, newText);
            });
        }
        
        $container.append($textField);
        return $container;
    }

    // saveRemarks(rowIndex, targetType, targetIndex, remarks) {
    //     if (targetType === 'limit') {
    //         this.model.updateLimitRemarks(rowIndex, targetIndex, remarks);
    //     }
    // }
}