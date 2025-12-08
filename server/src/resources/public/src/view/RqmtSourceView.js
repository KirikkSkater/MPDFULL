class RqmtSourceView extends BaseCellView {
    constructor(model, rowIndex, editable) {
        super(model, rowIndex, editable);
        this.modalId = `rqmt-source-modal-${rowIndex}-${Date.now()}`;
        this.selectedSources = [];
        this.initModal();
    }
    
    renderContent() {
        const $container = $('<div>').addClass('rqmt-source-container');
        
        // Отображаем выбранные источники
        const $selectedContainer = $('<div>').addClass('selected-sources-container');
        this.updateSelectedDisplay($selectedContainer);
        $container.append($selectedContainer);
        
        // Кнопка для открытия модального окна
        const $button = $('<button>')
            .addClass('btn btn-sm btn-outline-primary edit-mode-btn')
            .text('Выбрать источники')
            .on('click', () => {
                this.openModal();
            });
        
        if (!this.editable) $button.hide();
        
        $container.append($button);
        
        return $('<div>').addClass('rqmt-source-container'); // -- времененное решение
    }
    
    initModal() {
        // Удаляем старую модалку если существует
        $(`#${this.modalId}`).remove();
        
        // Получаем справочники
        const sourceOfRqmtDict = DictionariesTC.getDictionary("sourceOfRqmtDict");
        const sourceCriticalityDict = DictionariesTC.getDictionary("sourceCriticalityDict");
        
        // Создаем HTML для модального окна
        const modalHTML = `
            <div class="modal fade" id="${this.modalId}" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Выбор источников требований</h5>
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="container-fluid">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Источник требования:</h6>
                                        <div class="source-checkbox-list" style="max-height: 200px; overflow-y: auto;">
                                            ${Object.entries(sourceOfRqmtDict).map(([key, value]) => `
                                                <div class="form-check">
                                                    <input class="form-check-input source-checkbox" 
                                                           type="checkbox" 
                                                           id="source-${key}" 
                                                           value="${key}"
                                                           data-type="sourceOfRqmt">
                                                    <label class="form-check-label" for="source-${key}">
                                                        ${value[1]}
                                                    </label>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Критичность:</h6>
                                        <div class="criticality-checkbox-list" style="max-height: 200px; overflow-y: auto;">
                                            ${Object.entries(sourceCriticalityDict).map(([key, value]) => `
                                                <div class="form-check">
                                                    <input class="form-check-input criticality-checkbox" 
                                                           type="checkbox" 
                                                           id="criticality-${key}" 
                                                           value="${key}"
                                                           data-type="sourceCriticality">
                                                    <label class="form-check-label" for="criticality-${key}">
                                                        ${value[1]}
                                                    </label>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <h6>Выбранные комбинации:</h6>
                                        <div class="selected-combinations" style="max-height: 150px; overflow-y: auto; border: 1px solid #dee2e6; padding: 10px; border-radius: 4px;">
                                            <div class="text-muted">Нет выбранных комбинаций</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Отмена</button>
                            <button type="button" class="btn btn-primary save-sources-btn">Сохранить</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модальное окно в body
        $('body').append(modalHTML);
        
        // Находим модальное окно
        this.$modal = $(`#${this.modalId}`);
        
        // Инициализируем Bootstrap модальное окно
        this.$modal.modal({ show: false });
        
        // Назначаем обработчики
        this.$modal.find('.source-checkbox, .criticality-checkbox').on('change', () => {
            this.updateSelectedCombinations();
        });
        
        this.$modal.find('.save-sources-btn').on('click', () => {
            this.saveSources();
        });
    }
    
    openModal() {
        // Загружаем текущие источники
        const task = this.model.getFilteredTasks()[this.rowIndex];
        this.selectedSources = task.rqmtSources || [];
        
        // Обновляем чекбоксы
        this.updateCheckboxes();
        
        // Обновляем отображение комбинаций
        this.updateSelectedCombinations();
        
        // Показываем модальное окно
        this.$modal.modal('show');
    }
    
    updateCheckboxes() {
        // Собираем выбранные значения
        const selectedSources = new Set();
        const selectedCriticalities = new Set();
        
        this.selectedSources.forEach(source => {
            if (source.sourceOfRqmt) selectedSources.add(source.sourceOfRqmt);
            if (source.sourceCriticality) selectedCriticalities.add(source.sourceCriticality);
        });
        
        // Устанавливаем чекбоксы для источников
        this.$modal.find('.source-checkbox').each(function() {
            const value = $(this).val();
            $(this).prop('checked', selectedSources.has(value));
        });
        
        // Устанавливаем чекбоксы для критичностей
        this.$modal.find('.criticality-checkbox').each(function() {
            const value = $(this).val();
            $(this).prop('checked', selectedCriticalities.has(value));
        });
    }
    
    updateSelectedCombinations() {
        // Получаем выбранные значения
        const selectedSources = [];
        this.$modal.find('.source-checkbox:checked').each(function() {
            selectedSources.push($(this).val());
        });
        
        const selectedCriticalities = [];
        this.$modal.find('.criticality-checkbox:checked').each(function() {
            selectedCriticalities.push($(this).val());
        });
        
        // Генерируем все комбинации
        const combinations = [];
        
        // Если выбраны и источники и критичности
        if (selectedSources.length > 0 && selectedCriticalities.length > 0) {
            selectedSources.forEach(source => {
                selectedCriticalities.forEach(criticality => {
                    combinations.push({
                        sourceOfRqmt: source,
                        sourceCriticality: criticality
                    });
                });
            });
        }
        // Если выбраны только источники
        else if (selectedSources.length > 0) {
            selectedSources.forEach(source => {
                combinations.push({
                    sourceOfRqmt: source,
                    sourceCriticality: ''
                });
            });
        }
        // Если выбраны только критичности
        else if (selectedCriticalities.length > 0) {
            selectedCriticalities.forEach(criticality => {
                combinations.push({
                    sourceOfRqmt: '',
                    sourceCriticality: criticality
                });
            });
        }
        
        // Обновляем отображение комбинаций
        const $container = this.$modal.find('.selected-combinations');
        $container.empty();
        
        if (combinations.length === 0) {
            $container.append('<div class="text-muted">Нет выбранных комбинаций</div>');
        } else {
            combinations.forEach((combo, index) => {
                const sourceOfRqmtDict = DictionariesTC.getDictionary("sourceOfRqmtDict");
                const sourceCriticalityDict = DictionariesTC.getDictionary("sourceCriticalityDict");
                
                const sourceName = sourceOfRqmtDict[combo.sourceOfRqmt] 
                    ? sourceOfRqmtDict[combo.sourceOfRqmt][1] 
                    : combo.sourceOfRqmt || '—';
                
                const criticalityName = sourceCriticalityDict[combo.sourceCriticality]
                    ? sourceCriticalityDict[combo.sourceCriticality][1]
                    : combo.sourceCriticality || '—';
                
                const $item = $(`
                    <div class="combination-item d-flex justify-content-between align-items-center mb-1 p-1 border-bottom">
                        <span>${sourceName} (${criticalityName})</span>
                        <button type="button" class="btn btn-sm btn-outline-danger remove-combination-btn" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `);
                
                $item.find('.remove-combination-btn').on('click', (e) => {
                    e.stopPropagation();
                    this.removeCombination(index, combinations, $container);
                });
                
                $container.append($item);
            });
        }
        
        // Сохраняем текущие комбинации
        this.currentCombinations = combinations;
    }
    
    removeCombination(index, combinations, $container) {
        // Удаляем комбинацию
        combinations.splice(index, 1);
        
        // Обновляем чекбоксы на основе оставшихся комбинаций
        const selectedSources = new Set();
        const selectedCriticalities = new Set();
        
        combinations.forEach(combo => {
            if (combo.sourceOfRqmt) selectedSources.add(combo.sourceOfRqmt);
            if (combo.sourceCriticality) selectedCriticalities.add(combo.sourceCriticality);
        });
        
        // Обновляем чекбоксы
        this.$modal.find('.source-checkbox').each(function() {
            const value = $(this).val();
            $(this).prop('checked', selectedSources.has(value));
        });
        
        this.$modal.find('.criticality-checkbox').each(function() {
            const value = $(this).val();
            $(this).prop('checked', selectedCriticalities.has(value));
        });
        
        // Обновляем отображение комбинаций
        this.currentCombinations = combinations;
        this.updateSelectedCombinations();
    }
    
    saveSources() {
        // Сохраняем выбранные комбинации в модель
        if (this.currentCombinations) {
            this.model.setRqmtSources(this.rowIndex, this.currentCombinations);
        }
        
        // Закрываем модальное окно
        this.$modal.modal('hide');
        
        // Обновляем отображение в ячейке
        this.update();
    }
    
    updateSelectedDisplay($container) {
        $container.empty();
        const task = this.model.getFilteredTasks()[this.rowIndex];
        const sources = task.rqmtSources || [];
        
        if (sources.length === 0) {
            $container.append('<div class="text-muted">Нет выбранных источников</div>');
            return;
        }
        
        // Получаем справочники
        const sourceOfRqmtDict = DictionariesTC.getDictionary("sourceOfRqmtDict");
        const sourceCriticalityDict = DictionariesTC.getDictionary("sourceCriticalityDict");
        
        sources.forEach((source, index) => {
            const sourceName = sourceOfRqmtDict[source.sourceOfRqmt] 
                ? sourceOfRqmtDict[source.sourceOfRqmt][1] 
                : source.sourceOfRqmt || '—';
            
            const criticalityName = sourceCriticalityDict[source.sourceCriticality]
                ? sourceCriticalityDict[source.sourceCriticality][1]
                : source.sourceCriticality || '—';
            
            const $badge = $(`
                <span class="badge badge-light mr-1 mb-1" style="font-size: 12px;">
                    ${sourceName} (${criticalityName})
                </span>
            `);
            
            $container.append($badge);
        });
    }
    
    update() {
        // Обновляем отображение выбранных источников
        if (this._cachedDom) {
            const $container = $(this._cachedDom);
            const $selectedContainer = $container.find('.selected-sources-container');
            this.updateSelectedDisplay($selectedContainer);
        }
        return this._cachedDom;
    }
    
    setEditable(editable) {
        super.setEditable(editable);
        if (this._cachedDom) {
            const $container = $(this._cachedDom);
            $container.find('.edit-mode-btn').toggle(editable);
        }
    }
    
    destroy() {
        // Удаляем модальное окно при уничтожении view
        if (this.$modal) {
            this.$modal.remove();
        }
        super.destroy();
    }
}