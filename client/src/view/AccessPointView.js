/**
 * AccessPointView - представление для работы с точками доступа
 * С правильной индексацией (реальные индексы из модели)
 */
class AccessPointView extends BaseCellView {
    constructor(model, rowIndex, editable) {
        super(model, rowIndex, editable);
        
        this.accessGroups = [];
        this.updateAccessGroups();
        this.hasAccessPointData = window.accessPointDataManager && window.accessPointDataManager.isLoaded;
        
        if (!this.hasAccessPointData) {
            console.warn('[AccessPointView] AccessPointDataManager не инициализирован');
        }
    }

    updateAccessGroups() {
        const task = this.model.getFilteredTasks()[this.rowIndex];
        
        // ИСПРАВЛЕНО: Сохраняем реальный индекс из модели
        this.accessGroups = [];
        
        (task.workAreaLocationGroups || []).forEach((group, realIndex) => {
            if (group.type === 'access' || (group.accessPoints && group.accessPoints.length > 0)) {
                this.accessGroups.push({
                    group: group,
                    realIndex: realIndex  // Реальный индекс в workAreaLocationGroups
                });
            }
        });
        
        console.log('[AccessPointView] Row:', this.rowIndex, '- Всего групп в модели:', task.workAreaLocationGroups?.length);
        console.log('[AccessPointView] Row:', this.rowIndex, '- Отфильтровано групп точек доступа:', this.accessGroups.length);
        console.log('[AccessPointView] Row:', this.rowIndex, '- Реальные индексы:', this.accessGroups.map(g => g.realIndex));
    }

    renderContent() {
        const $container = $('<div>').addClass('access-point-container');

        // ИСПРАВЛЕНО: Используем realIndex вместо локального индекса
        this.accessGroups.forEach((item, localIndex) => {
            const $groupBlock = this.renderAccessGroupBlock(item.group, item.realIndex);
            $container.append($groupBlock);
        });

        if (this.editable) {
            const $addGroupBtn = this.createAddGroupButton();
            $container.append($addGroupBtn);
        }

        return $container;
    }

    renderAccessGroupBlock(group, groupIndex) {
        const self = this;
        
        const $groupBlock = $('<div>')
            .addClass('work-area-group-block access-group-block')
            .attr('data-group-index', groupIndex); // Сохраняем РЕАЛЬНЫЙ индекс

        // Заголовок группы
        const $header = $('<div>').addClass('work-area-group-header');
        
        const $leftSection = $('<div>').addClass('d-flex align-items-center');
        // Показываем реальный индекс для отладки
        const $headerTitle = $('<strong>').html(`Точки доступа <small class="text-muted ml-1">[#${groupIndex}]</small>`);
        $leftSection.append($headerTitle);

        // Применимость группы
        if (group.applicRefId) {
            const $applicTag = this.renderApplicTag(
                {
                    id: group.applicRefId,
                    displayValue: this.model.getApplicDisplayValue(group.applicRefId)
                },
                "workAreaGroup",
                groupIndex
            );
            $leftSection.append($applicTag);
        }

        $header.append($leftSection);

        // Кнопка удаления группы
        const $deleteGroupBtn = $('<button>')
            .attr('type', 'button')
            .addClass('btn btn-sm btn-outline-danger btn-remove edit-mode-btn')
            // .html('&times;')
            .attr('title', 'Удалить группу точек доступа')
            .attr('data-group-index', groupIndex);

        $deleteGroupBtn.on('click', function() {
            const groupIdx = parseInt($(this).attr('data-group-index'));
            console.log('[AccessPointView] Удаление группы:', { 
                rowIndex: self.rowIndex, 
                realGroupIndex: groupIdx 
            });
            self.model.removeWorkAreaLocationGroup(self.rowIndex, groupIdx);
        });

        if (!this.editable) {
            $deleteGroupBtn.hide();
        }

        $header.append($deleteGroupBtn);
        $groupBlock.append($header);

        // Контейнер для точек доступа
        const $accessPointsContainer = $('<div>').addClass('access-points-list');

        if (group.accessPoints && group.accessPoints.length > 0) {
            group.accessPoints.forEach((accessPoint, accessIndex) => {
                const $apBlock = this.renderAccessPointBlock(accessPoint, accessIndex, groupIndex);
                $accessPointsContainer.append($apBlock);
            });
        }

        $groupBlock.append($accessPointsContainer);

        // Кнопка добавления точки доступа
        if (this.editable) {
            const $addApBtn = this.createAddAccessPointButton(groupIndex);
            $groupBlock.append($addApBtn);
        }

        return $groupBlock;
    }

    renderAccessPointBlock(accessPoint, accessIndex, groupIndex) {
        const self = this;
        const accessPointNumber = accessPoint.accessPointNumber || '';
        
        // Получаем название из AccessPointDataManager
        let name = '';
        if (this.hasAccessPointData && accessPointNumber) {
            name = window.accessPointDataManager.getAccessPointName(accessPointNumber);
        }

        const $block = $('<div>')
            .addClass('access-point-block')
            .attr('data-access-index', accessIndex)
            .attr('data-group-index', groupIndex);

        const $mainRow = $('<div>').addClass('access-point-main-row');

        // Поле ввода номера точки доступа с отладкой в placeholder
        const $numberInput = $('<input>')
            .attr('type', 'text')
            .addClass('form-control-sm access-point-number-input')
            .val(accessPointNumber)
            .attr('placeholder', 'Точка доступа')
            .attr('data-access-index', accessIndex)
            .attr('data-group-index', groupIndex);

        // Подключаем автокомплит
        if (this.hasAccessPointData) {
            this.attachAutocomplete($numberInput, groupIndex, accessIndex);
        }

        // Обработчик blur
        $numberInput.on('blur', function() {
            const newNumber = $(this).val().trim();
            const accessIdx = parseInt($(this).attr('data-access-index'));
            const groupIdx = parseInt($(this).attr('data-group-index'));
            
            console.log('[AccessPointView] Изменение точки доступа:', { 
                rowIndex: self.rowIndex, 
                realGroupIndex: groupIdx, 
                accessIndex: accessIdx, 
                newValue: newNumber 
            });
            
            self.handleAccessPointChange(newNumber, groupIdx, accessIdx);
            
            // Обновляем описание при ручном вводе
            if (self.hasAccessPointData && newNumber) {
                const name = window.accessPointDataManager.getAccessPointName(newNumber);
                self.updateAccessPointDescription($(this), name);
            }
        });

        // Применимость точки доступа
        let $applicTag = $('<span>');
        if (accessPoint.applicRefId) {
            $applicTag = this.renderApplicTag(
                {
                    id: accessPoint.applicRefId,
                    displayValue: this.model.getApplicDisplayValue(accessPoint.applicRefId)
                },
                "accessPoint",
                groupIndex,
                accessIndex
            );
        }

        // Кнопка удаления точки доступа
        const $deleteButton = $('<button>')
            .attr('type', 'button')
            .addClass('btn btn-xs btn-outline-danger btn-remove edit-mode-btn')
            // .html('&times;')
            .attr('title', 'Удалить точку доступа')
            .attr('data-access-index', accessIndex)
            .attr('data-group-index', groupIndex);

        $deleteButton.on('click', function() {
            const accessIdx = parseInt($(this).attr('data-access-index'));
            const groupIdx = parseInt($(this).attr('data-group-index'));
            console.log('[AccessPointView] Удаление точки доступа:', { 
                rowIndex: self.rowIndex, 
                realGroupIndex: groupIdx, 
                accessIndex: accessIdx 
            });
            self.model.removeAccessPointFromGroup(self.rowIndex, groupIdx, accessIdx);
        });

        if (this.editable) {
            $numberInput.prop('readonly', false);
            $deleteButton.show();
        } else {
            $numberInput.prop('readonly', true);
            $deleteButton.hide();
        }

        $mainRow.append($numberInput, $applicTag, $deleteButton);
        $block.append($mainRow);

        // Тултип с названием точки доступа
        if (name) {
            const $tooltip = $('<div>')
                .addClass('access-point-description')
                .text(name);
            $block.append($tooltip);
        }

        return $block;
    }

    attachAutocomplete($input, groupIndex, accessIndex) {
        const self = this;

        $input.autocomplete({
            source: function(request, response) {
                const results = window.accessPointDataManager.searchAccessPoints(request.term, 10);
                
                response(results.map(([number, name]) => ({
                    label: `${number}${name ? ' — ' + name : ''}`,
                    value: number,
                    name: name
                })));
            },
            minLength: 1,
            delay: 300,
            
            select: function(event, ui) {
                const accessPointNumber = ui.item.value;
                const $input = $(this);
                const accessIdx = parseInt($input.attr('data-access-index'));
                const groupIdx = parseInt($input.attr('data-group-index'));
                
                console.log('[AccessPointView] Autocomplete select:', { 
                    rowIndex: self.rowIndex, 
                    realGroupIndex: groupIdx, 
                    accessIndex: accessIdx, 
                    value: accessPointNumber 
                });
                
                self.handleAccessPointChange(accessPointNumber, groupIdx, accessIdx);
                self.updateAccessPointDescription($input, ui.item.name);
                
                return true;
            }
        });
    }

    updateAccessPointDescription($input, name) {
        if (!this.hasAccessPointData) return;

        const $block = $input.closest('.access-point-block');
        let $tooltip = $block.find('.access-point-description');
        
        if (name) {
            if ($tooltip.length === 0) {
                $tooltip = $('<div>')
                    .addClass('access-point-description')
                    .appendTo($block);
            }
            $tooltip.text(name);
        } else {
            $tooltip.remove();
        }
    }

    renderApplicTag(applic, targetType, groupIndex, accessIndex = null) {
        const self = this;
        
        if (!applic || !applic.id) {
            return $('<span>');
        }

        const $tag = $('<span>')
            .addClass('applic-tag badge badge-info ml-2')
            .text(applic.displayValue || applic.id);

        if (this.editable) {
            const $deleteBtn = $('<button>')
                .addClass('btn btn-xs btn-link text-white p-0 ml-1')
                .html('&times;')
                .attr('title', 'Удалить применимость')
                .attr('data-target-type', targetType)
                .attr('data-group-index', groupIndex);
            
            if (accessIndex !== null) {
                $deleteBtn.attr('data-access-index', accessIndex);
            }

            $deleteBtn.on('click', function(e) {
                e.stopPropagation();
                
                const targetType = $(this).attr('data-target-type');
                const groupIdx = parseInt($(this).attr('data-group-index'));
                const accessIdxAttr = $(this).attr('data-access-index');
                
                console.log('[AccessPointView] Удаление применимости:', { 
                    rowIndex: self.rowIndex, 
                    targetType, 
                    realGroupIndex: groupIdx, 
                    accessIndex: accessIdxAttr 
                });
                
                if (targetType === "accessPoint" && accessIdxAttr !== undefined) {
                    const accessIdx = parseInt(accessIdxAttr);
                    self.model.removeApplicForAccessPoint(self.rowIndex, groupIdx, accessIdx);
                } else if (targetType === "workAreaGroup") {
                    self.model.removeApplicForWorkAreaGroup(self.rowIndex, groupIdx);
                }
            });

            $tag.append($deleteBtn);
        }

        return $tag;
    }

    createAddGroupButton() {
        const self = this;
        const $wrap = $('<div>').attr('style', "display: flex; justify-content: center; text-align: center; margin-top: 4px;")

        const $btn = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .html('Добавить группу точек доступа');

        $btn.on('click', function() {
            console.log('[AccessPointView] Добавление группы точек доступа, rowIndex:', self.rowIndex);
            self.model.addWorkAreaLocationGroup(self.rowIndex, 'access');
        });

        $wrap.append($btn)
        return $wrap;
    }

    createAddAccessPointButton(groupIndex) {
        const self = this;
        const $wrap = $('<div>').attr('style', "display: flex; justify-content: center; text-align: center; margin-top: 4px;")

        const $btn = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .html('Добавить точку доступа')
            .attr('data-group-index', groupIndex);

        $btn.on('click', function() {
            const groupIdx = parseInt($(this).attr('data-group-index'));
            console.log('[AccessPointView] Добавление точки доступа:', { 
                rowIndex: self.rowIndex, 
                realGroupIndex: groupIdx 
            });
            self.model.addAccessPointToGroup(self.rowIndex, groupIdx);
        });

            $wrap.append($btn)
            return $wrap;
    }

    handleAccessPointChange(newNumber, groupIndex, accessIndex) {
        try {
            this.model.updateAccessPointField(this.rowIndex, groupIndex, accessIndex, 'accessPointNumber', newNumber);
        } catch (error) {
            console.error('[AccessPointView] Ошибка обновления точки доступа:', error);
        }
    }

    update() {
        this.updateAccessGroups();
        return this.renderContent();
    }

    destroy() {
        try {
            if (this.$element && this.$element.find) {
                this.$element.find('.access-point-number-input').each(function() {
                    if ($(this).hasClass('ui-autocomplete-input')) {
                        try {
                            $(this).autocomplete('destroy');
                        } catch (e) {}
                    }
                });
            }
            if (super.destroy) {
                super.destroy();
            }
        } catch (error) {
            console.error('[AccessPointView] Ошибка в destroy():', error);
        }
    }
}
