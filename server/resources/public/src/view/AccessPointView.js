class AccessPointView extends BaseCellView {
    constructor(model, rowIndex, editable) {
        super(model, rowIndex, editable);
        this.accessGroups = [];
        this.updateAccessGroups();
    }

    updateAccessGroups() {
        const task = this.model.getFilteredTasks()[this.rowIndex];
        this.accessGroups = (task.workAreaLocationGroups || []).filter(group => 
            group.type === 'access' || group.accessPoints.length > 0
        );
    }

    renderContent() {
        const $container = $('<div>').addClass('work-area-groups-container');
        
        // Рендерим группы с точками доступа
        this.accessGroups.forEach((group, index) => {
            const originalGroupIndex = this.getOriginalGroupIndex(group);
            if (originalGroupIndex !== -1) {
                $container.append(this.renderAccessGroup(group, originalGroupIndex));
            }
        });
        
        // Кнопка добавления группы доступа
        const $addButton = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .text('Добавить точки доступа')
            .attr('title', 'Добавить блок точек доступа')
            .on('click', () => {
                this.model.addWorkAreaLocationGroup(this.rowIndex, 'access');
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

    renderAccessGroup(group, groupIndex) {
        const $groupBlock = $('<div>')
            .addClass('work-area-group-block access-group')
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

        // Содержимое группы - точки доступа
        const $content = $('<div>').addClass('work-area-group-content');
        
        const $accessContainer = $('<div>').addClass('access-points-container');
        group.accessPoints.forEach((access, accessIndex) => {
            $accessContainer.append(this.renderAccessPointInGroup(access, groupIndex, accessIndex));
        });
        
        // Кнопка добавления точки доступа
        const $addAccessButton = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
            .text('+')
            .attr('title', 'Добавить точку доступа')
            .on('click', () => {
                this.model.addAccessPointToGroup(this.rowIndex, groupIndex);
            });
        
        if (!this.editable) $addAccessButton.hide();
        $accessContainer.append($('<div>').attr('style', 'text-align: center; margin-top: 5px; margin-bottom: 5px').append($addAccessButton));
        $content.append($accessContainer);

        $groupBlock.append($content);

        // Примечания
        const workAreaRemarks = group.remarks ? group.remarks.text : undefined;
        if (workAreaRemarks != undefined) {
            const $remarksBlock = this.renderRemarksField(workAreaRemarks, this.rowIndex, 'workArea', groupIndex);
            if ($remarksBlock) {
                $groupBlock.append($remarksBlock);
            }
        }
        
        return $groupBlock;
    }

    renderAccessPointInGroup(access, groupIndex, accessIndex) {
        const $accessBlock = $('<div>').addClass('access-point-in-group');
        
        // Выбор номера точки доступа (без typeValue)
        const $numberSelect = $('<select>').addClass('access-point-number-select');
        const accessPointDict = DictionariesTC.getDictionary("accessPointNumber");
        Object.entries(accessPointDict || {}).forEach(([key, value]) => {
            $numberSelect.append($('<option>').val(key).text(value));
        });
        $numberSelect.val(access.accessPointNumber);
        
        $numberSelect.on('change', e => {
            this.model.updateAccessPointField(this.rowIndex, groupIndex, accessIndex, 'accessPointNumber', e.target.value);
        });
        
        const $deleteButton = $('<button>')
            .addClass('btn btn-xs btn-outline-danger btn-remove edit-mode-btn')
            .attr('title', 'Удалить точку доступа')
            .on('click', () => {
                // if (confirm('Удалить эту точку доступа?')) {
                //     this.model.removeAccessPointFromGroup(this.rowIndex, groupIndex, accessIndex);
                // }
                this.model.removeAccessPointFromGroup(this.rowIndex, groupIndex, accessIndex);
            });
        
        if (!this.editable) $deleteButton.hide();
        
        $accessBlock.append($numberSelect, $deleteButton);
        return $accessBlock;
    }

    update() {
        // Обновляем список групп
        this.updateAccessGroups();
        
        // Перерисовываем
        return super.update();
    }

    destroy() {
        console.log(`Destroying AccessPointView for row ${this.rowIndex}`);
        
        // Очищаем данные
        this.accessGroups = [];
        
        // Вызываем родительский destroy
        super.destroy();
    }
}