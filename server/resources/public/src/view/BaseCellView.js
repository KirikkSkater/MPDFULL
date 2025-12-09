

class BaseCellView {
    constructor(model, rowIndex, editable) {
        this.model = model;
        this.rowIndex = rowIndex;
        this.editable = editable;
        this._cachedDom = null;
    }
    
    // Общий метод для рендеринга применимости
    // В BaseCellView, обновите метод renderApplicTag:

renderApplicTag(applic, targetType, targetIndex) {
    const applicId = typeof applic === 'string' ? applic : applic.id;
    const displayValue = typeof applic === 'string'
        ? this.model.getApplicDisplayValue(applic)
        : applic.displayValue;

    const $tag = $('<div>').addClass('applic-tag');
    $tag.append($('<span>').addClass('applic-text').text(displayValue || applicId));

    if (targetType && targetIndex !== null) {

        const $delBtn =  $('<button>')
        .addClass('btn btn-xs btn-outline-danger btn-remove btn-icon btn-square delete-applic edit-mode-btn')
        // .html('&times')btn btn-xs btn-outline-danger btn-remove btn-icon btn-square edit-mode-btn    
        .attr('title', 'Удалить применимость')
        .data('applic-id', applicId)
        .on('click', () => {
            // Обработка для разных типов
            switch (targetType) {
                case 'taskDuration':
                    this.model.removeApplicForTaskDuration(this.rowIndex, targetIndex);
                    break;
                case 'limit':
                    this.model.removeApplicForLimit(this.rowIndex, targetIndex);
                    break;
                case 'personnel':
                    this.model.removeApplicForPersonnel(this.rowIndex, targetIndex);
                    break;
                case 'task':
                    this.model.removeApplicForTask(this.rowIndex);
                    break;
                case 'remarks':
                    this.model.removeApplicForRemarks(this.rowIndex);
                    break;
                case 'workAreaGroup':
                    this.model.removeApplicForWorkAreaGroup(this.rowIndex, targetIndex);
                    break;
                case 'dmRef':
                    this.model.removeApplicForDmRef(this.rowIndex, targetIndex);
                    break;
                case 'field':
                    this.model.removeApplicForField(this.rowIndex, targetIndex);
                    break;
            }
        });
        $tag.append(
            $delBtn
        );

        if (!this.editable) {
            $delBtn.hide();
        } else {
            $delBtn.show();
        }
    }

    return $tag;
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