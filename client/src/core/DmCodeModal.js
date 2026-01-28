/**
 * DmCodeModal - модальное окно для редактирования DM Code
 * С динамической фильтрацией, пагинацией и проверкой существования документов
 */
class DmCodeModal {
    constructor(model) {
        this.model = model;
        this.currentRowIndex = null;
        this.currentDmRefIndex = null;
        this.isEditMode = false;
        this.currentApplicId = null;
        
        // Кеш для предложений документов
        this.suggestionsCache = new Map();
        this.allSuggestions = [];
        this.filteredSuggestions = [];
        
        // Пагинация
        this.currentPage = 1;
        this.itemsPerPage = 5;
        
        // Флаг ручного редактирования preview
        this.isManuallyEdited = false;
        
        this.createModal();
        this.bindEvents();
    }

    /**
     * Создание HTML структуры модального окна
     */
    createModal() {
        this.modalHTML = `
            <div class="modal fade" id="dmCodeModal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Добавить/Редактировать DM Code</h5>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <!-- Структурированный ввод -->
                            <div class="dm-code-structured-section">
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="modelIdentCode">Идентификационный код модели *</label>
                                        <input type="text" class="form-control dm-field required-field" 
                                               id="modelIdentCode" maxlength="14" placeholder="Например: LLM">
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="systemDiffCode">Отличительный код системы *</label>
                                        <input type="text" class="form-control dm-field required-field" 
                                               id="systemDiffCode" maxlength="4" placeholder="Например: A">
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group col-md-4">
                                        <label for="systemCode">Система *</label>
                                        <input type="text" class="form-control dm-field required-field" 
                                               id="systemCode" maxlength="3" placeholder="Например: 21">
                                    </div>
                                    <div class="form-group col-md-4">
                                        <label for="subSystemCode">Подсистема</label>
                                        <input type="text" class="form-control dm-field" id="subSystemCode" 
                                               maxlength="1" placeholder="0">
                                    </div>
                                    <div class="form-group col-md-4">
                                        <label for="subSubSystemCode">Под-подсистема</label>
                                        <input type="text" class="form-control dm-field" id="subSubSystemCode" 
                                               maxlength="1" placeholder="0">
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group col-md-4">
                                        <label for="assyCode">Код сборки</label>
                                        <input type="text" class="form-control dm-field" id="assyCode" 
                                               maxlength="4" placeholder="00">
                                    </div>
                                    <div class="form-group col-md-4">
                                        <label for="disassyCode">Код разборки</label>
                                        <input type="text" class="form-control dm-field" id="disassyCode" 
                                               maxlength="2" placeholder="01">
                                    </div>
                                    <div class="form-group col-md-4">
                                        <label for="disassyCodeVariant">Вариант разборки</label>
                                        <input type="text" class="form-control dm-field" id="disassyCodeVariant" 
                                               maxlength="3" placeholder="A01">
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group col-md-4">
                                        <label for="infoCode">Информационный код</label>
                                        <input type="text" class="form-control dm-field" id="infoCode" 
                                               maxlength="3" placeholder="040">
                                    </div>
                                    <div class="form-group col-md-4">
                                        <label for="infoCodeVariant">Вариант информационного кода</label>
                                        <input type="text" class="form-control dm-field" id="infoCodeVariant" 
                                               maxlength="1" placeholder="A">
                                    </div>
                                    <div class="form-group col-md-4">
                                        <label for="itemLocationCode">Код местоположения</label>
                                        <input type="text" class="form-control dm-field" id="itemLocationCode" 
                                               maxlength="1" placeholder="A">
                                    </div>
                                </div>

                                <!-- Редактируемый превью с проверкой -->
                                <div class="form-group mt-3">
                                    <label for="dmCodePreviewInput">Сформированный DM Code (можно редактировать):</label>
                                    <div class="input-group">
                                        <input type="text" class="form-control" id="dmCodePreviewInput" 
                                               placeholder="Заполните обязательные поля" readonly>
                                        <div class="input-group-append">
                                            <button class="btn btn-outline-secondary" type="button" 
                                                    id="editPreviewBtn" title="Редактировать вручную">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-outline-primary" type="button" 
                                                    id="checkDocBtn" style="display: none;" 
                                                    title="Проверить наличие документа">
                                                <i class="fas fa-search"></i> Проверить
                                            </button>
                                        </div>
                                    </div>
                                    <small class="form-text text-muted" id="docCheckResult"></small>
                                </div>

                                <!-- Предложения существующих документов с пагинацией -->
                                <div id="dmSuggestionsContainer" class="dm-suggestions-container" style="display: none;">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h6 class="text-muted mb-0">
                                            <i class="fas fa-lightbulb"></i> 
                                            Найдено документов: <span id="totalDocsCount">0</span>
                                        </h6>
                                        <div class="dm-pagination" id="dmPagination"></div>
                                    </div>
                                    <div id="dmSuggestionsList" class="dm-suggestions-list"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-sm btn-outline-danger btn-cancel edit-mode-btn" data-dismiss="modal"><span>Отмена</span></button>
                            <button type="button" class="btn btn-sm btn-outline-primary btn-add edit-mode-btn" id="saveDmCodeBtn">Сохранить</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('body').append(this.modalHTML);
        this.modal = $('#dmCodeModal');
    }

    /**
     * Привязка событий
     */
    bindEvents() {
        const self = this;

        // Автоматическая валидация и фильтрация при вводе в любое поле
        this.modal.on('input', '.dm-field', function() {
            if (!self.isManuallyEdited) {
                self.updatePreview();
                self.validateAndFilterSuggestions();
            }
        });

        // Кнопка редактирования preview
        this.modal.on('click', '#editPreviewBtn', function() {
            const input = $('#dmCodePreviewInput');
            const btn = $(this);
            
            if (input.prop('readonly')) {
                // Включаем режим редактирования
                input.prop('readonly', false).focus().select();
                btn.html('<i class="fas fa-times"></i>');
                btn.attr('title', 'Отменить редактирование');
                self.isManuallyEdited = true;
                $('#checkDocBtn').show();
            } else {
                // Отключаем режим редактирования
                input.prop('readonly', true);
                btn.html('<i class="fas fa-edit"></i>');
                btn.attr('title', 'Редактировать вручную');
                self.isManuallyEdited = false;
                $('#checkDocBtn').hide();
                $('#docCheckResult').text('');
                self.updatePreview();
            }
        });

        // Проверка существования документа
        this.modal.on('click', '#checkDocBtn', function() {
            self.checkDocumentExistence();
        });

        // Выбор предложенного документа
        this.modal.on('click', '.dm-suggestion-item', function() {
            const dmCode = $(this).data('dmcode');
            self.fillFieldsFromDmCode(dmCode);
            self.isManuallyEdited = false;
            $('#dmCodePreviewInput').prop('readonly', true);
            $('#editPreviewBtn').html('<i class="fas fa-edit"></i>');
            $('#checkDocBtn').hide();
        });

        // Пагинация
        this.modal.on('click', '.dm-page-btn', function() {
            const page = $(this).data('page');
            self.currentPage = page;
            self.renderSuggestions();
        });

        // Сохранение
        $('#saveDmCodeBtn').on('click', () => this.saveDmCode());

        // Очистка при закрытии
        this.modal.on('hidden.bs.modal', () => this.resetModal());
    }

    /**
     * Валидация обязательных полей и запрос/фильтрация предложений
     */
    async validateAndFilterSuggestions() {
        const systemCode = $('#systemCode').val().trim();
        const systemDiffCode = $('#systemDiffCode').val().trim();
        const modelIdentCode = $('#modelIdentCode').val().trim();

        // Проверяем заполненность обязательных полей
        if (systemCode && systemDiffCode && modelIdentCode) {
            try {
                // Получаем все документы (с кешированием)
                const docs = await this.getDMdocs(systemCode, systemDiffCode, modelIdentCode);
                this.allSuggestions = docs || [];
                
                // Фильтруем по всем заполненным полям
                this.filterSuggestions();
                
            } catch (error) {
                console.error('Ошибка получения документов:', error);
                this.hideSuggestions();
            }
        } else {
            this.hideSuggestions();
        }
    }

    /**
     * Фильтрация предложений по всем заполненным полям
     */
    filterSuggestions() {
        const currentValues = this.collectDmCodeFromFields();
        
        // Фильтруем документы по совпадению заполненных полей
        this.filteredSuggestions = this.allSuggestions.filter(doc => {
            return Object.keys(currentValues).every(key => {
                const inputValue = currentValues[key];
                const docValue = doc.dmCode[key];
                
                // Если поле не заполнено - пропускаем проверку
                if (!inputValue) return true;
                
                // Сравниваем значения (case-insensitive)
                return docValue && 
                       docValue.toString().toLowerCase() === inputValue.toLowerCase();
            });
        });

        // Сбрасываем на первую страницу
        this.currentPage = 1;
        
        if (this.filteredSuggestions.length > 0) {
            this.renderSuggestions();
            $('#dmSuggestionsContainer').slideDown();
        } else if (this.allSuggestions.length > 0) {
            // Есть документы, но не подходят под фильтр
            this.renderNoMatchMessage();
            $('#dmSuggestionsContainer').slideDown();
        } else {
            this.hideSuggestions();
        }
    }

    /**
     * Отрисовка предложений с пагинацией
     */
    renderSuggestions() {
        const list = $('#dmSuggestionsList');
        const totalCount = $('#totalDocsCount');
        
        list.empty();
        totalCount.text(this.filteredSuggestions.length);

        // Вычисляем диапазон для текущей страницы
        const startIdx = (this.currentPage - 1) * this.itemsPerPage;
        const endIdx = Math.min(startIdx + this.itemsPerPage, this.filteredSuggestions.length);
        const pageItems = this.filteredSuggestions.slice(startIdx, endIdx);

        // Отрисовываем элементы
        pageItems.forEach(doc => {
            const formattedCode = this.model.formatDmCodeDisplay(doc.dmCode);
            const item = $(`
                <div class="dm-suggestion-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="dm-suggestion-code">
                                <code>${formattedCode}</code>
                            </div>
                            <div class="dm-suggestion-title">${doc.title || 'Без названия'}</div>
                        </div>
                        <div class="dm-suggestion-date">
                            <small class="text-muted">${doc.issueDate || ''}</small>
                        </div>
                    </div>
                </div>
            `);
            
            item.data('dmcode', doc.dmCode);
            list.append(item);
        });

        // Отрисовываем пагинацию
        this.renderPagination();
    }

    /**
     * Отрисовка пагинации
     */
    renderPagination() {
        const pagination = $('#dmPagination');
        pagination.empty();

        const totalPages = Math.ceil(this.filteredSuggestions.length / this.itemsPerPage);
        
        if (totalPages <= 1) return;

        const paginationHTML = $('<div class="btn-group btn-group-sm"></div>');

        // Кнопка "Назад"
        if (this.currentPage > 1) {
            paginationHTML.append(`
                <button class="btn btn-outline-secondary dm-page-btn" data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </button>
            `);
        }

        // Номера страниц
        for (let i = 1; i <= totalPages; i++) {
            // Показываем только несколько страниц вокруг текущей
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                const isActive = i === this.currentPage ? 'active' : '';
                paginationHTML.append(`
                    <button class="btn btn-outline-secondary dm-page-btn ${isActive}" data-page="${i}">
                        ${i}
                    </button>
                `);
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                paginationHTML.append('<span class="btn btn-outline-secondary disabled">...</span>');
            }
        }

        // Кнопка "Вперёд"
        if (this.currentPage < totalPages) {
            paginationHTML.append(`
                <button class="btn btn-outline-secondary dm-page-btn" data-page="${this.currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `);
        }

        pagination.append(paginationHTML);
    }

    /**
     * Сообщение об отсутствии совпадений
     */
    renderNoMatchMessage() {
        const list = $('#dmSuggestionsList');
        const totalCount = $('#totalDocsCount');
        
        list.empty();
        totalCount.text(this.allSuggestions.length);
        
        list.append(`
            <div class="alert alert-info mb-0">
                <i class="fas fa-info-circle"></i>
                Найдено ${this.allSuggestions.length} документов, но ни один не соответствует заполненным полям.
                Измените значения для уточнения поиска.
            </div>
        `);
        
        $('#dmPagination').empty();
    }

    /**
     * Проверка существования документа по введенному коду
     */
    async checkDocumentExistence() {
        const dmCodeString = $('#dmCodePreviewInput').val().trim();
        const resultElement = $('#docCheckResult');
        const checkBtn = $('#checkDocBtn');
        
        if (!dmCodeString) {
            resultElement
                .html('<i class="fas fa-exclamation-circle"></i> Введите DM Code для проверки')
                .removeClass('text-success text-danger')
                .addClass('text-warning');
            return;
        }
    
        // Показываем индикатор загрузки
        checkBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Проверка...');
        resultElement
            .html('<i class="fas fa-spinner fa-pulse"></i> Проверяем наличие документа в системе...')
            .removeClass('text-success text-danger text-warning')
            .addClass('text-info');
    
        try {
            const exists = await this.isDocExist(dmCodeString);
            
            if (exists) {
                resultElement
                    .html('<i class="fas fa-check-circle"></i> <strong>Документ найден</strong> - можно сохранить')
                    .removeClass('text-danger text-warning text-info')
                    .addClass('text-success');
            } else {
                resultElement
                    .html('<i class="fas fa-times-circle"></i> <strong>Документ не найден</strong> - сохранение невозможно')
                    .removeClass('text-success text-warning text-info')
                    .addClass('text-danger');
            }
        } catch (error) {
            console.error('Ошибка проверки документа:', error);
            resultElement
                .html('<i class="fas fa-exclamation-triangle"></i> Ошибка проверки: ' + error.message)
                .removeClass('text-success text-warning text-info')
                .addClass('text-danger');
        } finally {
            checkBtn.prop('disabled', false).html('<i class="fas fa-search"></i> Проверить');
        }
    }

    /**
     * Метод-заглушка для проверки существования документа
     * TODO: Заменить на реальный API запрос
     * 
     * @param {string} dmCodeString - строковое представление DM Code
     * @returns {Promise<boolean>} true если документ существует
     */
    async isDocExist(dmCodeString) {
        console.log('Проверка существования документа:', dmCodeString);
        
        // Симуляция запроса к серверу
        await new Promise(resolve => setTimeout(resolve, 800));

        // ЗАГЛУШКА: случайный результат
        // TODO: Реализовать реальную проверку через API
        const exists = Math.random() > 0.3; // 70% вероятность что документ существует
        
        console.log('Результат проверки:', exists);
        return exists;
    }

    /**
     * Метод-заглушка для получения существующих документов
     * TODO: Заменить на реальный API запрос с кешированием
     */
    async getDMdocs(system, codes, idCodeModel) {
        const cacheKey = `${idCodeModel}-${codes}-${system}`;
        
        if (this.suggestionsCache.has(cacheKey)) {
            console.log('Загружено из кеша:', cacheKey);
            return this.suggestionsCache.get(cacheKey);
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        // ЗАГЛУШКА: Генерируем тестовые данные (больше вариантов для демонстрации фильтрации)
        const mockDocs = [];
        const variants = ['A01', 'A02', 'B01', 'C01'];
        const infoCodes = ['040', '520', '940', '012', '018'];
        const locations = ['A', 'B', 'C', 'D'];

        variants.forEach(variant => {
            infoCodes.forEach(infoCode => {
                locations.forEach(location => {
                    mockDocs.push({
                        dmCode: {
                            modelIdentCode: idCodeModel,
                            systemDiffCode: codes,
                            systemCode: system,
                            subSystemCode: '0',
                            subSubSystemCode: '0',
                            assyCode: '00',
                            disassyCode: '01',
                            disassyCodeVariant: variant,
                            infoCode: infoCode,
                            infoCodeVariant: 'A',
                            itemLocationCode: location
                        },
                        title: `Документ ${variant}-${infoCode}-${location}`,
                        issueDate: '2025-01-15'
                    });
                });
            });
        });

        // Ограничиваем до 15 документов для демонстрации
        const limitedDocs = mockDocs.slice(0, 15);
        
        this.suggestionsCache.set(cacheKey, limitedDocs);
        console.log(`Найдено ${limitedDocs.length} документов для ${cacheKey}`);
        
        return limitedDocs;
    }

    /**
     * Заполнение полей из выбранного DM Code
     */
    fillFieldsFromDmCode(dmCode) {
        Object.keys(dmCode).forEach(key => {
            $(`#${key}`).val(dmCode[key] || '');
        });
        this.updatePreview();
        this.hideSuggestions();
    }

    /**
     * Обновление превью сформированного кода
     */
    updatePreview() {
        const dmCode = this.collectDmCodeFromFields();
        const input = $('#dmCodePreviewInput');

        if (this.isValidDmCode(dmCode)) {
            const formatted = this.model.formatDmCodeDisplay(dmCode);
            input.val(formatted).removeClass('text-muted').addClass('text-success');
        } else {
            input.val('Заполните обязательные поля (*)').removeClass('text-success').addClass('text-muted');
        }
    }

    /**
     * Сбор данных из полей
     */
    collectDmCodeFromFields() {
        return {
            modelIdentCode: $('#modelIdentCode').val().trim(),
            systemDiffCode: $('#systemDiffCode').val().trim(),
            systemCode: $('#systemCode').val().trim(),
            subSystemCode: $('#subSystemCode').val().trim(),
            subSubSystemCode: $('#subSubSystemCode').val().trim(),
            assyCode: $('#assyCode').val().trim(),
            disassyCode: $('#disassyCode').val().trim(),
            disassyCodeVariant: $('#disassyCodeVariant').val().trim(),
            infoCode: $('#infoCode').val().trim(),
            infoCodeVariant: $('#infoCodeVariant').val().trim(),
            itemLocationCode: $('#itemLocationCode').val().trim()
        };
    }

    /**
     * Проверка валидности DM Code
     */
    isValidDmCode(dmCode) {
        return dmCode.modelIdentCode && 
               dmCode.systemDiffCode && 
               dmCode.systemCode;
    }

    /**
     * Скрытие предложений
     */
    hideSuggestions() {
        $('#dmSuggestionsContainer').slideUp();
        this.filteredSuggestions = [];
        this.allSuggestions = [];
    }

    /**
     * Открытие модального окна
     */
    open(rowIndex, dmRefIndex = null) {
        this.currentRowIndex = rowIndex;
        this.currentDmRefIndex = dmRefIndex;
        this.isEditMode = dmRefIndex !== null;

        if (this.isEditMode) {
            this.loadExistingDmRef();
        }

        this.modal.modal('show');
    }

    /**
     * Загрузка существующего DM Ref для редактирования
     */
    loadExistingDmRef() {
        const tasks = this.model.getFilteredTasks();
        const task = tasks[this.currentRowIndex];
        
        if (task && task.dmRefs && task.dmRefs[this.currentDmRefIndex]) {
            const dmRef = task.dmRefs[this.currentDmRefIndex];
            
            if (dmRef.dmCode) {
                this.fillFieldsFromDmCode(dmRef.dmCode);
            }
            
            this.currentApplicId = dmRef.applicRefId || null;
        }
    }

    /**
     * Сохранение DM Code
     */
    /**
 * Сохранение DM Code с проверкой существования документа
 */
async saveDmCode() {
    const saveBtn = $('#saveDmCodeBtn');
    let dmCodeString;
    let dmCodeData;
    
    // Отключаем кнопку во время проверки
    saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Проверка...');
    
    try {
        // Если был ручной ввод - используем строку напрямую
        if (this.isManuallyEdited) {
            dmCodeString = $('#dmCodePreviewInput').val().trim();
            if (!dmCodeString) {
                alert('Введите DM Code');
                return;
            }
            
            // Проверяем существование документа
            const exists = await this.isDocExist(dmCodeString);
            
            if (!exists) {
                alert('Документ не найден в системе.\n\nНевозможно сохранить несуществующий документ.\nПроверьте правильность введенного кода или выберите документ из предложенных вариантов.');
                return;
            }
            
            // TODO: Когда будет готов парсер строки в dmCode объект
            // dmCodeData = this.parseDmCodeString(dmCodeString);
            // Пока используем временное решение - сохраняем как есть из полей
            dmCodeData = this.collectDmCodeFromFields();
            
        } else {
            // Режим структурированного ввода
            dmCodeData = this.collectDmCodeFromFields();
            
            if (!this.isValidDmCode(dmCodeData)) {
                alert('Заполните обязательные поля:\n- Идентификационный код модели\n- Отличительный код системы\n- Система');
                return;
            }
            
            // Формируем строку для проверки
            dmCodeString = this.model.formatDmCodeDisplay(dmCodeData);
            
            // Проверяем существование документа
            const exists = await this.isDocExist(dmCodeString);
            
            if (!exists) {
                const userConfirm = confirm(
                    'Документ не найден в системе.\n\n' +
                    'DM Code: ' + dmCodeString + '\n\n' +
                    'Возможно, вы ошиблись при вводе.\n' +
                    'Хотите выбрать из существующих документов?'
                );
                
                if (userConfirm) {
                    // Оставляем модальное окно открытым для выбора
                    return;
                } else {
                    // Пользователь настаивает на сохранении несуществующего документа
                    return;
                }
            }
        }

        // Документ существует - сохраняем
        if (this.isEditMode) {
            this.model.updateDmRef(
                this.currentRowIndex,
                this.currentDmRefIndex,
                dmCodeData,
                this.currentApplicId
            );
        } else {
            this.model.addDmRef(
                this.currentRowIndex,
                dmCodeData,
                this.currentApplicId
            );
        }

        // Показываем успешное сообщение
        saveBtn.html('<i class="fas fa-check"></i> Сохранено');
        setTimeout(() => {
            this.modal.modal('hide');
        }, 500);
        
    } catch (error) {
        console.error('Ошибка сохранения DM Code:', error);
        alert('Ошибка сохранения: ' + error.message);
    } finally {
        // Восстанавливаем кнопку
        setTimeout(() => {
            saveBtn.prop('disabled', false).html('Сохранить');
        }, 1000);
    }
}

/**
 * Парсинг строки DM Code в объект
 * TODO: Реализовать полноценный парсер
 * 
 * @param {string} dmCodeString - строка типа "LLM-A-21-0-0-00-01-A01-040-A-A"
 * @returns {object} объект dmCode
 */
parseDmCodeString(dmCodeString) {
    // Временная заглушка - парсим по разделителю "-"
    const parts = dmCodeString.split('-');
    
    if (parts.length < 11) {
        throw new Error('Неверный формат DM Code. Ожидается формат: MODEL-DIFF-SYS-SUB-SUBSUB-ASSY-DISASSY-VAR-INFO-INFOVAR-LOC');
    }
    
    return {
        modelIdentCode: parts[0] || '',
        systemDiffCode: parts[1] || '',
        systemCode: parts[2] || '',
        subSystemCode: parts[3] || '0',
        subSubSystemCode: parts[4] || '0',
        assyCode: parts[5] || '00',
        disassyCode: parts[6] || '01',
        disassyCodeVariant: parts[7] || 'A01',
        infoCode: parts[8] || '000',
        infoCodeVariant: parts[9] || 'A',
        itemLocationCode: parts[10] || 'A'
    };
}
parseDmCodeString(dmCodeString) {
    // Временная заглушка - парсим по разделителю "-"
    const parts = dmCodeString.split('-');
    
    if (parts.length < 11) {
        throw new Error('Неверный формат DM Code. Ожидается формат: MODEL-DIFF-SYS-SUB-SUBSUB-ASSY-DISASSY-VAR-INFO-INFOVAR-LOC');
    }
    
    return {
        modelIdentCode: parts[0] || '',
        systemDiffCode: parts[1] || '',
        systemCode: parts[2] || '',
        subSystemCode: parts[3] || '0',
        subSubSystemCode: parts[4] || '0',
        assyCode: parts[5] || '00',
        disassyCode: parts[6] || '01',
        disassyCodeVariant: parts[7] || 'A01',
        infoCode: parts[8] || '000',
        infoCodeVariant: parts[9] || 'A',
        itemLocationCode: parts[10] || 'A'
    };
}


    /**
     * Сброс модального окна
     */
    resetModal() {
        this.modal.find('input').val('');
        this.hideSuggestions();
        this.updatePreview();
        
        $('#dmCodePreviewInput').prop('readonly', true);
        $('#editPreviewBtn').html('<i class="fas fa-edit"></i>');
        $('#checkDocBtn').hide();
        $('#docCheckResult').text('');
        
        this.currentRowIndex = null;
        this.currentDmRefIndex = null;
        this.isEditMode = false;
        this.currentApplicId = null;
        this.isManuallyEdited = false;
        this.currentPage = 1;
    }

    /**
     * Закрытие модального окна
     */
    close() {
        this.modal.modal('hide');
    }

    /**
     * Очистка кеша предложений
     */
    clearCache() {
        this.suggestionsCache.clear();
        console.log('Кеш предложений документов очищен');
    }
}
