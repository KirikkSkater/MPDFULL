class DmCodeModal {
    constructor(model) {
        this.model = model;
        this.currentRowIndex = null;
        this.currentDmRefIndex = null;
        this.isEditMode = false;
        
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        this.modalHTML = `
            <div id="dmCodeModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Код модуля данных</h5>
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="dmCodeForm">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label for="modelIdentCode">Идентификационный код модели *</label>
                                            <input type="text" class="form-control" id="modelIdentCode" 
                                                   maxlength="5" pattern="[A-Za-z0-9]{0,5}" required>
                                            <small class="form-text text-muted">5 знаков (буквы и цифры)</small>
                                        </div>
                                        <div class="form-group">
                                            <label for="systemDiffCode">Отличительный код системы *</label>
                                            <input type="text" class="form-control" id="systemDiffCode" 
                                                   maxlength="1" pattern="[A-Z]" required>
                                            <small class="form-text text-muted">1 буква в верхнем регистре</small>
                                        </div>
                                        <div class="form-group">
                                            <label for="systemCode">Система *</label>
                                            <input type="text" class="form-control" id="systemCode" 
                                                   maxlength="2" pattern="[0-9]{2}" required>
                                            <small class="form-text text-muted">2 цифры</small>
                                        </div>
                                        <div class="form-group">
                                            <label for="subSystemCode">Подсистема *</label>
                                            <input type="text" class="form-control" id="subSystemCode" 
                                                   maxlength="1" pattern="[0-9]{1}" required>
                                            <small class="form-text text-muted">1 цифра</small>
                                        </div>
                                        <div class="form-group">
                                            <label for="subSubSystemCode">Подподсистема *</label>
                                            <input type="text" class="form-control" id="subSubSystemCode" 
                                                   maxlength="1" pattern="[0-9]{1}" required>
                                            <small class="form-text text-muted">1 цифра</small>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label for="assyCode">Узел или сборочная единица *</label>
                                            <input type="text" class="form-control" id="assyCode" 
                                                   maxlength="2" pattern="[0-9]{2}" required>
                                            <small class="form-text text-muted">2 цифры</small>
                                        </div>
                                        <div class="form-group">
                                            <label for="disassyCode">Код демонтажа *</label>
                                            <input type="text" class="form-control" id="disassyCode" 
                                                   maxlength="2" pattern="[0-9]{2}" required>
                                            <small class="form-text text-muted">2 цифры</small>
                                        </div>
                                        <div class="form-group">
                                            <label for="disassyCodeVariant">Вариант кода демонтажа *</label>
                                            <input type="text" class="form-control" id="disassyCodeVariant" 
                                                   maxlength="3" pattern="[A-Z0-9]{1,3}" required>
                                            <small class="form-text text-muted">3 знака (буквы в верхнем регистре и цифры)</small>
                                        </div>
                                        <div class="form-group">
                                            <label for="infoCode">Информационный код *</label>
                                            <input type="text" class="form-control" id="infoCode" 
                                                   maxlength="3" pattern="[A-Za-z0-9]{3}" required>
                                            <small class="form-text text-muted">3 знака (буквы и цифры)</small>
                                        </div>
                                        <div class="form-group">
                                            <label for="infoCodeVariant">Вариант информационного кода *</label>
                                            <input type="text" class="form-control" id="infoCodeVariant" 
                                                   maxlength="1" pattern="[A-Z]" required>
                                            <small class="form-text text-muted">1 буква в верхнем регистре</small>
                                        </div>
                                        <div class="form-group">
                                            <label for="itemLocationCode">Код расположения изделия *</label>
                                            <input type="text" class="form-control" id="itemLocationCode" 
                                                   maxlength="1" pattern="[A-Z]" required>
                                            <small class="form-text text-muted">1 буква в верхнем регистре</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="dmRefApplicRefId">Применимость</label>
                                    <select class="form-control" id="dmRefApplicRefId">
                                        <option value="">Без применимости</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Отмена</button>
                            <button type="button" class="btn btn-primary" id="saveDmCodeBtn">Сохранить</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('body').append(this.modalHTML);
        this.$modal = $('#dmCodeModal');
        this.$form = $('#dmCodeForm');
        this.$saveBtn = $('#saveDmCodeBtn');
        
        this.setupValidation();
        this.populateApplicabilityOptions();
    }

    bindEvents() {
        const self = this;
        
        this.$saveBtn.on('click', () => this.saveDmCode());
        
        // Обработка событий модального окна
        this.$modal.on('shown.bs.modal', function () {
            // Фокусируемся на первом поле после открытия
            setTimeout(() => {
                self.$form.find('input')[0]?.focus();
            }, 100);
        });
        
        this.$modal.on('hidden.bs.modal', function () {
            // Очищаем форму при закрытии
            self.$form[0].reset();
            self.$saveBtn.prop('disabled', true);
        });
    
        // Более надежная валидация при любом изменении
        this.$form.find('input').on('input change propertychange', function() {
            console.log('Input changed:', this.id, this.value);
            self.validateForm();
        });
        
        // Для select также добавляем валидацию
        $('#dmRefApplicRefId').on('change', () => {
            this.validateForm();
        });
        
        // Принудительное приведение к верхнему регистру для буквенных полей
        this.$form.find('input[pattern*="[A-Z]"]').on('input', function() {
            this.value = this.value.toUpperCase();
            self.validateForm(); // повторная валидация после изменения регистра
        });
    
        // Валидация при потере фокуса
        this.$form.find('input').on('blur', function() {
            self.validateForm();
        });
    }

    setupValidation() {
        // Добавляем кастомные сообщения валидации
        this.$form.find('input').each((index, input) => {
            input.addEventListener('invalid', () => {
                this.showCustomValidity(input);
            });
        });
    }

    showCustomValidity(input) {
        const patterns = {
            modelIdentCode: '5 знаков (буквы и цифры)',
            systemDiffCode: '1 буква в верхнем регистре',
            systemCode: '2 цифры',
            subSystemCode: '1 цифра',
            subSubSystemCode: '1 цифра',
            assyCode: '2 цифры',
            disassyCode: '2 цифры',
            disassyCodeVariant: '1 буква в верхнем регистре',
            infoCode: '3 знака (буквы и цифры)',
            infoCodeVariant: '1 буква в верхнем регистре',
            itemLocationCode: '1 буква в верхнем регистре'
        };

        const fieldName = input.id;
        if (patterns[fieldName]) {
            input.setCustomValidity(`Пожалуйста, введите корректное значение: ${patterns[fieldName]}`);
        }
    }

    populateApplicabilityOptions() {
        const $select = $('#dmRefApplicRefId');
        $select.find('option:not(:first)').remove();
        
        Object.values(this.model.applicMap).forEach(applic => {
            $select.append($('<option>').val(applic.id).text(applic.displayValue));
        });
    }

    open(rowIndex, dmRefIndex = null) {
        this.currentRowIndex = rowIndex;
        this.currentDmRefIndex = dmRefIndex;
        this.isEditMode = dmRefIndex !== null;
    
        this.populateApplicabilityOptions();
    
        if (this.isEditMode) {
            // Режим редактирования
            const dmRef = this.model.tasks[rowIndex].dmRefs[dmRefIndex];
            this.fillForm(dmRef);
            this.$modal.find('.modal-title').text('Редактирование кода модуля данных');
            
            // ВАЖНО: Вызываем валидацию после заполнения формы
            setTimeout(() => {
                this.validateForm();
            }, 100);
        } else {
            // Режим добавления
            this.$form[0].reset();
            this.$modal.find('.modal-title').text('Добавление кода модуля данных');
            
            // В режиме добавления кнопка изначально неактивна
            this.$saveBtn.prop('disabled', true);
        }
    
        this.$modal.modal('show');
    }

    fillForm(dmRef) {
        const dmCode = dmRef.dmCode;
        
        $('#modelIdentCode').val(dmCode.modelIdentCode || '');
        $('#systemDiffCode').val(dmCode.systemDiffCode || '');
        $('#systemCode').val(dmCode.systemCode || '');
        $('#subSystemCode').val(dmCode.subSystemCode || '');
        $('#subSubSystemCode').val(dmCode.subSubSystemCode || '');
        $('#assyCode').val(dmCode.assyCode || '');
        $('#disassyCode').val(dmCode.disassyCode || '');
        $('#disassyCodeVariant').val(dmCode.disassyCodeVariant || '');
        $('#infoCode').val(dmCode.infoCode || '');
        $('#infoCodeVariant').val(dmCode.infoCodeVariant || '');
        $('#itemLocationCode').val(dmCode.itemLocationCode || '');
        $('#dmRefApplicRefId').val(dmRef.applicRefId || '');
    }

    validateForm() {
        const inputs = this.$form.find('input[required]');
        let isValid = true;
    
        // Сбрасываем все сообщения об ошибках
        inputs.each((index, input) => {
            input.setCustomValidity('');
        });
    
        // Проверяем каждое поле
        inputs.each((index, input) => {
            // Проверяем на заполненность
            if (!input.value.trim()) {
                isValid = false;
                return false; // break the loop
            }
            
            // Проверяем паттерн, если он задан
            const pattern = input.getAttribute('pattern');
            if (pattern) {
                const regex = new RegExp(pattern);
                if (!regex.test(input.value)) {
                    isValid = false;
                    this.showCustomValidity(input);
                    return false; // break the loop
                }
            }
        });
    
        console.log('Form validation result:', isValid, 'for inputs:', inputs.map((i, el) => ({id: el.id, value: el.value, valid: el.checkValidity()})));
        
        this.$saveBtn.prop('disabled', !isValid);
        return isValid;
    }

    getFormData() {
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

    saveDmCode() {
        if (!this.validateForm()) {
            return;
        }

        const dmCodeData = this.getFormData();
        const applicRefId = $('#dmRefApplicRefId').val() || null;

        if (this.isEditMode) {
            this.model.updateDmRef(this.currentRowIndex, this.currentDmRefIndex, dmCodeData, applicRefId);
        } else {
            this.model.addDmRef(this.currentRowIndex, dmCodeData, applicRefId);
        }

        this.$modal.modal('hide');
    }

    destroy() {
        this.$modal.remove();
    }
}