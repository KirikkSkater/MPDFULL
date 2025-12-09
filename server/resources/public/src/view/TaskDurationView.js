
class TaskDurationView extends BaseCellView {
    renderContent() {
        const $container = $('<div>').addClass('task-duration-container');
        const task = this.model.getFilteredTasks()[this.rowIndex];
        
        // Рендерим каждый блок taskDuration
        (task.taskDurations || []).forEach((duration, index) => {
            $container.append(this.renderSingleTaskDurationBlock(duration, index));
        });
        
        // Кнопка добавления нового блока
        const $addButton = $('<button>')
            .addClass('btn btn-sm btn-outline-primary add-task-duration-btn edit-mode-btn')
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
        
        const $buttonContainer = $('<div>').attr('style', 'text-align: center; margin-top: 10px;');
        $buttonContainer.append($addButton);
        $container.append($buttonContainer);
        
        return $container;
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
            .addClass('btn btn-sm btn-outline-danger remove-task-duration-btn edit-mode-btn')
            .html('&times;')
            .attr('title', 'Удалить трудоёмкость')
            .on('click', () => {
                if (confirm('Удалить эту трудоёмкость?')) {
                    this.model.removeTaskDuration(this.rowIndex, index);
                }
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

            const $input = $('<input type="text">')
                .addClass('task-duration-input')
                .val(duration[field.key])
                .on('blur', e => {
                    this.model.updateTaskDurationField(this.rowIndex, index, field.key, e.target.value);
                });

            $row.append($input);
            $block.append($row);
        });

        return $block;
    }
}