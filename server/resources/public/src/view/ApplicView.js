/**
 * ApplicView - отвечает за рендеринг применимостей в таблице
 */
class ApplicView {
    constructor(applicManager, model) {
        this.applicManager = applicManager;
        this.model = model;
    }

    /**
     * Рендер одного тега применимости
     * @param {Object} applic - объект применимости или ID
     * @param {boolean} withDelete - показывать кнопку удаления
     * @param {number} rowIndex - индекс строки задачи
     * @param {string} targetType - тип цели: 'field', 'limit', 'personnel', 'task', 'workAreaGroup', 'dmRef', 'taskDuration'
     * @param {number|string} targetIndex - индекс цели (для limit, personnel и т.д.) или ключ поля (для field)
     */
    renderApplicTag(applic, withDelete = true, rowIndex = null, targetType = null, targetIndex = null) {
        const applicId = typeof applic === 'string' ? applic : applic.id;
        const applicData = this.applicManager.getApplic(applicId);
        
        if (!applicData) {
            console.warn(`Applicability ${applicId} not found`);
            return $('<span></span>').addClass('text-muted').text(`[${applicId}]`);
        }

        const displayValue = applicId;

        const $tag = $('<div></div>').addClass('applic-tag');
        $tag.append(
            $('<span></span>').addClass('applic-text').text(`${displayValue}`)
        );

        if (withDelete && rowIndex !== null && targetType !== null) {
            const $deleteBtn = $('<button></button>')
                .addClass('btn btn-xs btn-outline-danger btn-remove btn-icon btn-square delete-applic edit-mode-btn')
                // .html('&times;')
                .attr('title', 'Удалить применимость')
                .data('applic-id', applicId)
                .on('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleDelete(rowIndex, targetType, targetIndex);
                });

            $tag.append($deleteBtn);
        }

        return $tag;
    }

    /**
     * Обработка удаления применимости
     */
    handleDelete(rowIndex, targetType, targetIndex) {
        if (targetType === 'field') {
            this.model.removeApplicForField(rowIndex, targetIndex);
        } else if (targetType === 'limit') {
            this.model.removeApplicForLimit(rowIndex, targetIndex);
        } else if (targetType === 'personnel') {
            this.model.removeApplicForPersonnel(rowIndex, targetIndex);
        } else if (targetType === 'task') {
            this.model.updateApplicForTask(rowIndex, null);
        } else if (targetType === 'remarks') {
            this.model.removeApplicForRemarks(rowIndex);
        } else if (targetType === 'workAreaGroup') {
            this.model.removeApplicForWorkAreaGroup(rowIndex, targetIndex);
        } else if (targetType === 'dmRef') {
            this.model.removeApplicForDmRef(rowIndex, targetIndex);
        } else if (targetType === 'taskDuration') {
            this.model.removeApplicForTaskDuration(rowIndex, targetIndex);
        }
    }

    /**
     * Рендер списка применимостей (для старых мест, где использовался renderApplicList)
     */
    renderApplicList(applic, rowIndex) {
        const $container = $('<div></div>').addClass('applic-container');

        if(applic != undefined){
            const applicId = typeof applic === 'string' ? applic : applic.applicabilityTask;
            // const displayValue = this.model.getApplicDisplayValue(applicId);
            const applicData = this.applicManager.getApplic(applicId);
            if (applicData) {
                $container.append(this.renderApplicTag(applicData, true, rowIndex, "task", rowIndex));
            }
        }

        return $container;
    }

    /**
     * Рендер блока применимости с учетом типа (для ячеек с allowApplic)
     */
    renderApplicBlock(applicId, rowIndex, targetType, targetIndex) {
        if (!applicId) return null;

    const applicData = this.applicManager.getApplic(applicId);
    if (!applicData) {
        console.warn(`Applicability ${applicId} not found in manager`);
        return null;
    }

    return this.renderApplicTag(applicData, true, rowIndex, targetType, targetIndex);
    }

    /**
     * Вспомогательный метод для получения displayValue
     */
    getDisplayValue(applicId) {
        const applicData = this.applicManager.getApplic(applicId);
        return applicData ? applicData.displayValue : applicId;
    }
}
