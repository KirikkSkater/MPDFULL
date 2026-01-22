class ZoneView extends BaseCellView {
    constructor(model, rowIndex, editable) {
        super(model, rowIndex, editable);
        this.zoneGroups = [];
        this.updateZoneGroups();
    }

    updateZoneGroups() {
        const task = this.model.getFilteredTasks()[this.rowIndex];
        this.zoneGroups = (task.workAreaLocationGroups || []).filter(group => 
            group.type === 'zone' || group.zones.length > 0
        );
    }

    renderContent() {
        const $container = $('<div>').addClass('work-area-groups-container');
        
        // Рендерим группы с зонами
        this.zoneGroups.forEach((group, index) => {
            const originalGroupIndex = this.getOriginalGroupIndex(group);
            if (originalGroupIndex !== -1) {
                $container.append(this.renderZoneGroup(group, originalGroupIndex));
            }
        });
        
        // Кнопка добавления группы зон
        const $addButton = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .text('Добавить зоны')
            .attr('title', 'Добавить блок зон')
            .on('click', () => {
                this.model.addWorkAreaLocationGroup(this.rowIndex, 'zone');
            });
        
        if (!this.editable) $addButton.hide();
        
        const $buttonContainer = $('<div>').attr('style', 'text-align: center; margin-top: 10px;');
        $buttonContainer.append($addButton);
        $container.append($buttonContainer);
        
        return $container;
    }

    getOriginalGroupIndex(group) {
        const task = this.model.getFilteredTasks()[this.rowIndex];
        return task.workAreaLocationGroups ? task.workAreaLocationGroups.indexOf(group) : -1;
    }

    renderZoneGroup(group, groupIndex) {
        const $groupBlock = $('<div>')
            .addClass('work-area-group-block zone-group')
            .attr('data-group-index', groupIndex)
            .attr('data-task-index', this.rowIndex);

        // Заголовок блока с применимостью
        const $header = $('<div>').addClass('work-area-group-header block-header');
        
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
            $header.append($applicTag);
        }
        
        // Кнопка удаления группы
        const $deleteButton = $('<button>')
            .addClass('btn btn-sm btn-outline-danger btn-remove edit-mode-btn')
            .attr('title', 'Удалить блок')
            .attr('style', 'margin-top: 4px; margin-left: 4px;')
            .on('click', () => {
                if (confirm('Удалить этот блок?')) {
                    this.model.removeWorkAreaLocationGroup(this.rowIndex, groupIndex);
                }
            });
        
        if (!this.editable) $deleteButton.hide();
        $header.append($deleteButton);
        $groupBlock.append($header);

        // Содержимое группы - зоны
        const $content = $('<div>').addClass('work-area-group-content');
        
        const $zonesContainer = $('<div>').addClass('zones-container');
        group.zones.forEach((zone, zoneIndex) => {
            $zonesContainer.append(this.renderZoneInGroup(zone, groupIndex, zoneIndex));
        });
        
        // Кнопка добавления зоны
        const $addZoneButton = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .text('+')
            .attr('title', 'Добавить зону')
            .on('click', () => {
                this.model.addZoneToGroup(this.rowIndex, groupIndex);
            });
        
        if (!this.editable) $addZoneButton.hide();
        $zonesContainer.append($('<div>').attr('style', 'text-align: center; margin-top: 5px; margin-bottom: 5px').append($addZoneButton));
        $content.append($zonesContainer);
        
        $groupBlock.append($content);

        // Примечания (если есть)
        const workAreaRemarks = group.remarks ? group.remarks.text : undefined;
        if (workAreaRemarks != undefined) {
            const $remarksBlock = this.renderRemarksField(workAreaRemarks, this.rowIndex, 'workArea', groupIndex);
            if ($remarksBlock) {
                $groupBlock.append($remarksBlock);
            }
        }

        return $groupBlock;
    }

    renderZoneInGroup(zone, groupIndex, zoneIndex) {
        const $zoneBlock = $('<div>').addClass('zone-in-group');
        
        const $zoneSelect = $('<select>').addClass('zone-number-select');
        const zoneNumberDict = DictionariesTC.getDictionary("zoneNumber");
        Object.entries(zoneNumberDict).forEach(([key, value]) => {
            $zoneSelect.append($('<option>').val(key).text(value));
        });
        $zoneSelect.val(zone.zoneNumber);
        
        $zoneSelect.on('change', e => {
            this.model.updateZoneField(this.rowIndex, groupIndex, zoneIndex, 'zoneNumber', e.target.value);
        });
        
        const $deleteButton = $('<button>')
            .addClass('btn btn-xs btn-outline-danger btn-remove edit-mode-btn')
            .attr('title', 'Удалить зону')
            .on('click', () => {
                // if (confirm('Удалить эту зону?')) {
                //     this.model.removeZoneFromGroup(this.rowIndex, groupIndex, zoneIndex);
                // }
                this.model.removeZoneFromGroup(this.rowIndex, groupIndex, zoneIndex);
            });
        
        if (!this.editable) $deleteButton.hide();
        
        $zoneBlock.append($zoneSelect, $deleteButton);
        return $zoneBlock;
    }

    update() {
        // Обновляем список групп
        this.updateZoneGroups();
        
        // Перерисовываем
        return super.update();
    }

    destroy() {
        console.log(`Destroying ZoneView for row ${this.rowIndex}`);
        
        // Очищаем данные
        this.zoneGroups = [];
        
        // Вызываем родительский destroy
        super.destroy();
    }
}