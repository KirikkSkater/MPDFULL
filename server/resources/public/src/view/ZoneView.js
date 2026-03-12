/**
 * ZoneView - представление для работы с зонами
 * С правильной индексацией (реальные индексы из модели)
 */
class ZoneView extends BaseCellView {
    constructor(model, rowIndex, editable) {
        super(model, rowIndex, editable);
        
        this.zoneGroups = [];
        this.updateZoneGroups();
        this.hasZoneData = window.zoneDataManager && window.zoneDataManager.isLoaded;
        
        if (!this.hasZoneData) {
            console.warn('[ZoneView] ZoneDataManager не инициализирован');
        }
    }

    updateZoneGroups() {
        const task = this.model.getFilteredTasks()[this.rowIndex];
        
        // ИСПРАВЛЕНО: Сохраняем реальный индекс из модели
        this.zoneGroups = [];
        
        (task.workAreaLocationGroups || []).forEach((group, realIndex) => {
            if (group.type === 'zone' || (group.zones && group.zones.length > 0)) {
                this.zoneGroups.push({
                    group: group,
                    realIndex: realIndex  // Реальный индекс в workAreaLocationGroups
                });
            }
        });
        
        console.log('[ZoneView] Row:', this.rowIndex, '- Всего групп в модели:', task.workAreaLocationGroups?.length);
        console.log('[ZoneView] Row:', this.rowIndex, '- Отфильтровано групп зон:', this.zoneGroups.length);
        console.log('[ZoneView] Row:', this.rowIndex, '- Реальные индексы:', this.zoneGroups.map(g => g.realIndex));
    }

    renderContent() {
        const $container = $('<div>').addClass('zone-container');

        // ИСПРАВЛЕНО: Используем realIndex вместо локального индекса
        this.zoneGroups.forEach((item, localIndex) => {
            const $groupBlock = this.renderZoneGroupBlock(item.group, item.realIndex);
            $container.append($groupBlock);
        });

        if (this.editable) {
            const $addGroupBtn = this.createAddGroupButton();
            $container.append($addGroupBtn);
        }

        return $container;
    }

    renderZoneGroupBlock(group, groupIndex) {
        const self = this;
        
        const $groupBlock = $('<div>')
            .addClass('work-area-group-block zone-group-block zone-group')
            .attr('data-group-index', groupIndex); // Сохраняем РЕАЛЬНЫЙ индекс

        // Заголовок группы
        const $header = $('<div>').addClass('work-area-group-header');
        
        const $leftSection = $('<div>').addClass('d-flex align-items-center');
        // Показываем реальный индекс для отладки
        // const $headerTitle = $('<strong>').html(`Зоны <small class="text-muted ml-1">[#${groupIndex}]</small>`);
        // $leftSection.append($headerTitle);

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
            .attr('title', 'Удалить группу зон')
            .attr('data-group-index', groupIndex);

        $deleteGroupBtn.on('click', function() {
            const groupIdx = parseInt($(this).attr('data-group-index'));
            console.log('[ZoneView] Удаление группы:', { 
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

        // Контейнер для зон
        const $zonesContainer = $('<div>').addClass('zones-list');

        if (group.zones && group.zones.length > 0) {
            group.zones.forEach((zone, zoneIndex) => {
                const $zoneBlock = this.renderZoneBlock(zone, zoneIndex, groupIndex);
                $zonesContainer.append($zoneBlock);
            });
        }

        $groupBlock.append($zonesContainer);

        // Кнопка добавления зоны
        if (this.editable) {
            const $addZoneBtn = this.createAddZoneButton(groupIndex);
            $groupBlock.append($addZoneBtn);
        }

        return $groupBlock;
    }

    renderZoneBlock(zone, zoneIndex, groupIndex) {
        const self = this;
        const zoneNumber = zone.zoneNumber || '';
        
        // Получаем описание из ZoneDataManager
        let description = '';
        if (this.hasZoneData && zoneNumber) {
            description = window.zoneDataManager.getZoneDescription(zoneNumber);
        }

        const $block = $('<div>')
            .addClass('zone-block')
            .attr('data-zone-index', zoneIndex)
            .attr('data-group-index', groupIndex);

        const $mainRow = $('<div>').addClass('zone-main-row');

        // Поле ввода номера зоны с отладкой в placeholder
        const $zoneInput = $('<input>')
            .attr('type', 'text')
            .addClass('form-control-sm zone-number-input')
            .val(zoneNumber)
            .attr('placeholder', 'Номер зоны')
            .attr('data-zone-index', zoneIndex)
            .attr('data-group-index', groupIndex);

        // Подключаем автокомплит
        if (this.hasZoneData) {
            this.attachAutocomplete($zoneInput, groupIndex, zoneIndex);
        }

        // Обработчик blur
        $zoneInput.on('blur', function() {
            const newNumber = $(this).val().trim();
            const zoneIdx = parseInt($(this).attr('data-zone-index'));
            const groupIdx = parseInt($(this).attr('data-group-index'));
            
            console.log('[ZoneView] Изменение зоны:', { 
                rowIndex: self.rowIndex, 
                realGroupIndex: groupIdx, 
                zoneIndex: zoneIdx, 
                newValue: newNumber 
            });
            
            self.handleZoneChange(newNumber, groupIdx, zoneIdx);
            
            // Обновляем описание при ручном вводе
            if (self.hasZoneData && newNumber) {
                const desc = window.zoneDataManager.getZoneDescription(newNumber);
                self.updateZoneDescription($(this), desc);
            }
        });

        // Применимость зоны
        let $applicTag = $('<span>');
        if (zone.applicRefId) {
            $applicTag = this.renderApplicTag(
                {
                    id: zone.applicRefId,
                    displayValue: this.model.getApplicDisplayValue(zone.applicRefId)
                },
                "zone",
                groupIndex,
                zoneIndex
            );
        }

        // Кнопка удаления зоны
        const $deleteBtn = $('<button>')
            .attr('type', 'button')
            .addClass('btn btn-xs btn-outline-danger btn-remove edit-mode-btn')
            // .html('&times;')
            .attr('title', 'Удалить зону')
            .attr('data-zone-index', zoneIndex)
            .attr('data-group-index', groupIndex);

        $deleteBtn.on('click', function() {
            const zoneIdx = parseInt($(this).attr('data-zone-index'));
            const groupIdx = parseInt($(this).attr('data-group-index'));
            console.log('[ZoneView] Удаление зоны:', { 
                rowIndex: self.rowIndex, 
                realGroupIndex: groupIdx, 
                zoneIndex: zoneIdx 
            });
            self.model.removeZoneFromGroup(self.rowIndex, groupIdx, zoneIdx);
        });

        if (this.editable) {
            $zoneInput.prop('readonly', false);
            $deleteBtn.show();
        } else {
            $zoneInput.prop('readonly', true);
            $deleteBtn.hide();
        }

        $mainRow.append($zoneInput, $applicTag, $deleteBtn);
        $block.append($mainRow);

        // Тултип с описанием зоны
        if (description) {
            const $tooltip = $('<div>')
                .addClass('zone-description')
                .text(description);
            $block.append($tooltip);
        }

        return $block;
    }

    attachAutocomplete($input, groupIndex, zoneIndex) {
        const self = this;

        $input.autocomplete({
            source: function(request, response) {
                const results = window.zoneDataManager.searchZones(request.term, 15);
                
                response(results.map(([number, description]) => ({
                    label: `${number}${description ? ' — ' + description : ''}`,
                    value: number,
                    description: description
                })));
            },
            minLength: 1,
            delay: 300,
            
            select: function(event, ui) {
                const zoneNumber = ui.item.value;
                const $input = $(this);
                const zoneIdx = parseInt($input.attr('data-zone-index'));
                const groupIdx = parseInt($input.attr('data-group-index'));
                
                console.log('[ZoneView] Autocomplete select:', { 
                    rowIndex: self.rowIndex, 
                    realGroupIndex: groupIdx, 
                    zoneIndex: zoneIdx, 
                    value: zoneNumber 
                });
                
                self.handleZoneChange(zoneNumber, groupIdx, zoneIdx);
                self.updateZoneDescription($input, ui.item.description);
                
                return true;
            }
        });
    }

    updateZoneDescription($input, description) {
        if (!this.hasZoneData) return;

        const $block = $input.closest('.zone-block');
        let $tooltip = $block.find('.zone-description');
        
        if (description) {
            if ($tooltip.length === 0) {
                $tooltip = $('<div>')
                    .addClass('zone-description')
                    .appendTo($block);
            }
            $tooltip.text(description);
        } else {
            $tooltip.remove();
        }
    }

    // renderApplicTag(applic, targetType, groupIndex, zoneIndex = null) {
    //     const self = this;
        
    //     if (!applic || !applic.id) {
    //         return $('<span>');
    //     }

    //     const $tag = $('<span>')
    //         .addClass('applic-tag badge badge-info ml-2')
    //         .text(applic.displayValue || applic.id);

    //     if (this.editable) {
    //         const $deleteBtn = $('<button>')
    //             .addClass('btn btn-xs btn-link text-white p-0 ml-1')
    //             .attr('title', 'Удалить применимость')
    //             .attr('data-target-type', targetType)
    //             .attr('data-group-index', groupIndex);
            
    //         if (zoneIndex !== null) {
    //             $deleteBtn.attr('data-zone-index', zoneIndex);
    //         }

    //         $deleteBtn.on('click', function(e) {
    //             e.stopPropagation();
                
    //             const targetType = $(this).attr('data-target-type');
    //             const groupIdx = parseInt($(this).attr('data-group-index'));
    //             const zoneIdxAttr = $(this).attr('data-zone-index');
                
    //             console.log('[ZoneView] Удаление применимости:', { 
    //                 rowIndex: self.rowIndex, 
    //                 targetType, 
    //                 realGroupIndex: groupIdx, 
    //                 zoneIndex: zoneIdxAttr 
    //             });
                
    //             if (targetType === "zone" && zoneIdxAttr !== undefined) {
    //                 const zoneIdx = parseInt(zoneIdxAttr);
    //                 self.model.removeApplicForZone(self.rowIndex, groupIdx, zoneIdx);
    //             } else if (targetType === "workAreaGroup") {
    //                 self.model.removeApplicForWorkAreaGroup(self.rowIndex, groupIdx);
    //             }
    //         });

    //         $tag.append($deleteBtn);
    //     }

    //     return $tag;
    // }

    createAddGroupButton() {
        const self = this;
        const $wrap = $('<div>').attr('style', "display: flex; justify-content: center; text-align: center; margin-top: 4px;")

        const $btn = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .html('Добавить группу зон');

        $btn.on('click', function() {
            console.log('[ZoneView] Добавление группы зон, rowIndex:', self.rowIndex);
            self.model.addWorkAreaLocationGroup(self.rowIndex, 'zone');
        });

        $wrap.append($btn)
        return $wrap;
    }

    createAddZoneButton(groupIndex) {
        const self = this;
        const $wrap = $('<div>').attr('style', "display: flex; justify-content: center; text-align: center; margin-top: 4px;")

        const $btn = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .html('Добавить зону')
            .attr('data-group-index', groupIndex);

        $btn.on('click', function() {
            const groupIdx = parseInt($(this).attr('data-group-index'));
            console.log('[ZoneView] Добавление зоны:', { 
                rowIndex: self.rowIndex, 
                realGroupIndex: groupIdx 
            });
            self.model.addZoneToGroup(self.rowIndex, groupIdx);
        });

        $wrap.append($btn)
        return $wrap;
    }

    handleZoneChange(newZoneNumber, groupIndex, zoneIndex) {
        try {
            this.model.updateZoneField(this.rowIndex, groupIndex, zoneIndex, 'zoneNumber', newZoneNumber);
        } catch (error) {
            console.error('[ZoneView] Ошибка обновления зоны:', error);
        }
    }

    update() {
        this.updateZoneGroups();
        return this.renderContent();
    }

    destroy() {
        try {
            if (this.$element && this.$element.find) {
                this.$element.find('.zone-number-input').each(function() {
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
            console.error('[ZoneView] Ошибка в destroy():', error);
        }
    }
}
