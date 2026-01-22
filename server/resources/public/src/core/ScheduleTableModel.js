
class ScheduleTableModel {
    constructor(xmlDoc) {
        this.$xml = $(xmlDoc);
        this.taskNodes = [];
        this.tasks = [];
        this.title = '';
        
        // Извлекаем infoCode из XML
        const dmCode = this.$xml.find('dmCode');
        this.infoCode = dmCode.attr('infoCode') || '0B2';
        
        // Получаем конфигурацию на основе infoCode
        this.handlerInfoCode = new HandlerInfoCode();
        this.config = this.handlerInfoCode.getConfig(this.infoCode);
        this.desiredHeaders = this.config.headers;

        this.changeListeners = [];
        this.parseXML();
        this.buildHeaders();
    }

    

    renderAll() {
        this._emitChange({ type: 'render:all' });
    }

    onChange(callback) {
        if (typeof callback === 'function') {
            this.changeListeners.push(callback);
        }
    }


    nodeToTask(node) {
        const task = {};
        this.headers.forEach(h => {
            let cursor = node;
            let value = '';
            if (h.path) {
                for (let step of h.path) {
                    if (step.startsWith('@')) {
                        value = cursor.getAttribute(step.slice(1)) || '';
                        break;
                    } else {
                        cursor = cursor.querySelector(step);
                        if (!cursor) { value = ''; break; }
                    }
                }
                if (!h.path.some(p => p.startsWith('@'))) {
                    value = cursor ? cursor.textContent : '';
                }
            }
            task[h.key] = value;
        });
        return task;
    }
    


    parseXML() {
        const self = this;

        const $content = this.$xml.find('content');
        const $maintPlanning = $content.find('maintPlanning');

        const $commonInfo = $maintPlanning.find('commonInfo');
        this.title = this.$xml.find('dmAddressItems > dmTitle > techName').text().trim();
        // this.title = $commonInfo.find('title').text().trim();

        const $taskDefs = $maintPlanning.find('taskDefinitionAlts > taskDefinition, > taskDefinition');
        
        this.applicMap = {};
        this.$xml.find('referencedApplicGroup > applic').each((i, el) => {
            const $el = $(el);
            const id = $el.attr('id');
            const displayText = $el.find('displayText > simplePara').text().trim();
            
            // Получаем значения из assert'ов
            const asserts = {};
            $el.find('evaluate > assert').each((i, assert) => {
                const $assert = $(assert);
                const ident = $assert.attr('applicPropertyIdent');
                const values = $assert.attr('applicPropertyValues') || '';
                asserts[ident] = values;
            });
            
            // Формируем текст применимости по приоритету
            let applicText = '';
            if (displayText) {
                // Если есть displayText - используем его
                applicText = displayText;
            } else {
                // Определяем приоритет: serialno > model > type
                if (asserts.serialno) {
                    applicText = `Серийный номер: ${asserts.serialno}`;
                } else if (asserts.model) {
                    applicText = `Модель: ${asserts.model}`;
                } else if (asserts.type) {
                    applicText = `Тип: ${asserts.type}`;
                } else {
                    // Если ничего нет - используем ID
                    applicText = id;
                }
            }
            
            // Сохраняем полные данные для фильтрации
            this.applicMap[id] = {
                id,
                displayText,
                asserts,
                displayValue: applicText
            };
        });


        $taskDefs.each((i, el) => {
            const $node = $(el);
            const task = {};
            task.fieldApplicabilities = {}; // Объект для хранения applicRefId по полям

            self.desiredHeaders.forEach(col => {
                if (col.key === 'limit' || col.key === "rqmtSource" || col.key == "personnel" || col.key == "zoneNumber" || col.key == "accessPoint") return;
                

                let cursor = $node;
                let value = '';
                let applicElement = null; // Элемент, от которого будем брать applicRefId

                if (!col.path) {
                // Для простых атрибутов берем значение и applicRefId из самого элемента
                value = $node.attr(col.key) || '';
                if (col.allowApplic) {
                    const applicRefId = $node.attr('applicRefId');
                    if (applicRefId) {
                    task.fieldApplicabilities[col.key] = applicRefId;
                    }
                }
                } else {
                // Для сложных путей проходим по всем шагам
                for (let step of col.path) {
                    if (step.startsWith('@')) {
                    // Дошли до атрибута - берем значение
                    value = cursor.attr(step.slice(1)) || '';
                    break;
                    } else {
                    // Переходим к следующему элементу
                    cursor = cursor.find(step).first();
                    if (!cursor.length) {
                        cursor = null;
                        break;
                    }
                    // Сохраняем элемент для возможного извлечения applicRefId
                    applicElement = cursor;
                    value = cursor.text().trim();
                    }
                }

                // Извлекаем applicRefId для полей с allowApplic
                if (col.allowApplic && applicElement) {
                    const applicRefId = applicElement.attr('applicRefId');
                    if (applicRefId) {
                    task.fieldApplicabilities[col.key] = applicRefId;
                    }
                }
                }

                task[col.key] = value;
            });

            task.taskTitle = $node.find('task > taskTitle').text().trim();
            task.changeType = $node.attr('changeType') || '';
            const $remarks = $node.find('taskDefinition > remarks simplePara');
            if ($remarks.length) {
                task.remarks = $remarks.text().trim();
            } else {
                task.remarks = '';
            }

            task.supervisorLevelCode = undefined;

            // Для applicability берем applicRefId из корневого элемента taskDefinition
            if ($node.attr('applicRefId')) {
                task.fieldApplicabilities['applicabilityTask'] = $node.attr('applicRefId');
            }

            task.workAreaLocationGroups = [];
            $node.find('productionMaintData workAreaLocationGroup').each((i, group) => {
                const $group = $(group);
                const groupData = {
                    applicRefId: $group.attr('applicRefId') || null,
                    zones: [],
                    accessPoints: []
                };
    
                // Определяем тип группы по содержимому
                const hasZones = $group.find('zoneRef').length > 0;
                const hasAccessPoints = $group.find('accessPointRef').length > 0;
                
                // Если есть и то, и другое - считаем смешанной, но лучше разделить
                if (hasZones && hasAccessPoints) {
                    // Это смешанная группа, разделяем на две логические группы
                    // Но в XML это одна группа, так что пока оставляем как есть
                    console.warn('Mixed zone/access group found at row', i);
                }
                
                // По умолчанию определяем по первому найденному элементу
                groupData.type = hasZones ? 'zone' : 'access';
    
                // Парсим зоны
                $group.find('zoneRef').each((j, zone) => {
                    const $zone = $(zone);
                    groupData.zones.push({
                        zoneNumber: $zone.attr('zoneNumber') || ''
                    });
                });
    
                // Парсим точки доступа (без accessPointTypeValue)
                $group.find('accessPointRef').each((j, access) => {
                    const $access = $(access);
                    groupData.accessPoints.push({
                        accessPointNumber: $access.attr('accessPointNumber') || ''
                        // Убрали accessPointTypeValue
                    });
                });
    
                // Парсим примечания (workArea внутри workLocation)
                const $workLocation = $group.find('workLocation');
                if ($workLocation.length) {
                    const $workArea = $workLocation.find('workArea');
                    if ($workArea.length) {
                        if (!groupData.remarks) groupData.remarks = {};
                        groupData.remarks.text = $workArea.text().trim();
                    }
                }
    
                task.workAreaLocationGroups.push(groupData);
            });


            // Блоки limit
            task.limits = [];
            $node.find('limit').each((i, lim) => {
                const $lim = $(lim);
                const block = {};
                
                // Основные атрибуты
                block.applicRefId = $lim.attr('applicRefId') || null;
                block.limitType = $lim.attr('limitTypeValue') || '';
                block.limitCond = $lim.attr('limitCond') || '';
                
                // Интервалы (thresholdType="interval")
                block.intervals = [];
                $lim.find('threshold[thresholdType="interval"]').each((j, interval) => {
                    const $interval = $(interval);
                    block.intervals.push({
                        value: $interval.find('thresholdValue').text().trim(),
                        unit: $interval.attr('thresholdUnitOfMeasure') || ''
                    });
                });
                
                // Пороги (thresholdType="threshold")
                block.thresholds = [];
                $lim.find('threshold[thresholdType="threshold"]').each((j, threshold) => {
                    const $threshold = $(threshold);
                    block.thresholds.push({
                        value: $threshold.find('thresholdValue').text().trim(),
                        unit: $threshold.attr('thresholdUnitOfMeasure') || ''
                    });
                });

                const $limitRemarks = $lim.find('remarks simplePara');
                if ($limitRemarks.length) {
                    if (!block.remarks) block.remarks = {};
                    block.remarks.text = $limitRemarks.text().trim();
                }
                
                task.limits.push(block);
            });

            task.rqmtSources = [];
            $node.find('rqmtSource').each((i, src) => {
                const $src = $(src);
                const sourceData = {
                    sourceOfRqmt: $src.attr('sourceOfRqmt') || '',
                    sourceCriticality: []  // МАССИВ вместо строки!
                };
                
                // Собираем ВСЕ sourceCriticality
                $src.find('sourceType').each((j, st) => {
                    const criticality = $(st).attr('sourceCriticality');
                    if (criticality) {
                        sourceData.sourceCriticality.push(criticality);
                    }
                });
                task.rqmtSources.push(sourceData);
            });

            task.personnel = [];

            const $preliminaryRqmts = $node.find('preliminaryRqmts');

            task.dmRefs = [];
                $node.find('refs dmRef').each((i, dmRefEl) => {
                    const $dmRef = $(dmRefEl);
                    const $dmCode = $dmRef.find('dmRefIdent dmCode');
                    
                    if ($dmCode.length) {
                        const dmRefData = {
                            applicRefId: $dmRef.attr('applicRefId') || null,
                            dmCode: {
                                modelIdentCode: $dmCode.attr('modelIdentCode') || '',
                                systemDiffCode: $dmCode.attr('systemDiffCode') || '',
                                systemCode: $dmCode.attr('systemCode') || '',
                                subSystemCode: $dmCode.attr('subSystemCode') || '',
                                subSubSystemCode: $dmCode.attr('subSubSystemCode') || '',
                                assyCode: $dmCode.attr('assyCode') || '',
                                disassyCode: $dmCode.attr('disassyCode') || '',
                                disassyCodeVariant: $dmCode.attr('disassyCodeVariant') || '',
                                infoCode: $dmCode.attr('infoCode') || '',
                                infoCodeVariant: $dmCode.attr('infoCodeVariant') || '',
                                itemLocationCode: $dmCode.attr('itemLocationCode') || ''
                            }
                        };
                        task.dmRefs.push(dmRefData);
                    }
                });

                task.taskDurations = [];
    $node.find('productionMaintData').each((i, pmd) => {
        const $pmd = $(pmd);
        
        // Исключаем productionMaintData, которые содержат workAreaLocationGroup
        if ($pmd.find('workAreaLocationGroup').length > 0) return;
        
        // Парсим только productionMaintData с taskDuration
        $pmd.find('taskDuration').each((j, dur) => {
            const $dur = $(dur);
            const durationBlock = {};
            
            durationBlock.procedureDuration = $dur.attr('procedureDuration') || '';
            durationBlock.startupDuration = $dur.attr('startupDuration') || '';
            durationBlock.applicRefId = $pmd.attr('applicRefId') || null;
            
            task.taskDurations.push(durationBlock);
        });
    });

// Обрабатываем все reqPersons внутри preliminaryRqmts
            $preliminaryRqmts.find('reqPersons').each((j, reqEl) => {
                const $req = $(reqEl);
                const applicRefId = $req.attr('applicRefId') || null;
                
                // Обрабатываем все personnel внутри reqPersons
                $req.find('personnel').each((k, persEl) => {
                    const $pers = $(persEl);
                    const personnel = {
                        numRequired: $pers.attr('numRequired') || '',
                        personCategoryCode: $pers.find('personCategory').attr('personCategoryCode') || '',
                        applicRefId: applicRefId
                    };
                    task.personnel.push(personnel);
                });
            });

            self.taskNodes.push($node[0]);
            self.tasks.push(task);
            });
    }

    buildHeaders() {
        this.headers = this.desiredHeaders.map(col => ({
            key:      col.key,
            label:    col.label,
            editable: col.editable,
            allowApplic: col.allowApplic || false,
            path: col.path || [col.key] 
        }));
    }

    getHeaders() {
        return this.headers;
    }

    getFilteredTasks() {
        return this.tasks;
    }

    getTitle() {
        return this.title;
    }

    updateLimitField(rowIndex, limitIndex, field, value) {
        const $taskNode = $(this.taskNodes[rowIndex]);
        const $limits = $taskNode.find('limit');
        if (limitIndex < 0 || limitIndex >= $limits.length) return;

        const $lim = $($limits.get(limitIndex));

        switch (field) {
            case 'limitType':
                $lim.attr('limitTypeValue', value);
                this.tasks[rowIndex].limits[limitIndex].limitType = value;
                break;
            case 'limitCond':
                $lim.attr('limitCond', value);
                this.tasks[rowIndex].limits[limitIndex].limitCond = value;
                break;
            case 'intervalValue':
                $lim.find('> threshold[thresholdType="interval"] > thresholdValue').text(value);
                this.tasks[rowIndex].limits[limitIndex].intervalValue = value;
                break;
            case 'intervalUnit':
                $lim.find('> threshold[thresholdType="interval"]').attr('thresholdUnitOfMeasure', value);
                this.tasks[rowIndex].limits[limitIndex].intervalUnit = value;
                break;
            case 'thresholdValue':
                $lim.find('> trigger > threshold[thresholdType="threshold"] > thresholdValue').text(value);
                this.tasks[rowIndex].limits[limitIndex].thresholdValue = value;
                break;
            case 'thresholdUnit':
                $lim.find('> trigger > threshold[thresholdType="threshold"]').attr('thresholdUnitOfMeasure', value);
                this.tasks[rowIndex].limits[limitIndex].thresholdUnit = value;
                break;
        }

        this._emitChange({
            type: 'limit:changed',
            payload: { rowIndex, limitIndex, field, value }
        });
    }

    parseApplicability($node) {
        const applicId = $node.attr('applicRefId');
        if (applicId && this.applicMap[applicId]) {
            return [this.applicMap[applicId]];
        }
        return [];
    }

    checkRemarksAndSupervisorLevel(rowIndex, key, value){
        if (key === 'remarks' || key === 'supervisorLevel') {
            const node = this.taskNodes[rowIndex];
            const elementName = key === 'remarks' ? 'remarks' : 'supervisorLevel';
            
            // Используем нативные DOM-методы для сохранения регистра
            let element = node.getElementsByTagName(elementName)[0];
            if (!element) {
            // Создаем элемент с правильным регистром
            element = node.ownerDocument.createElement(elementName);
            node.appendChild(element);
            }
            
            // Обновляем значение
            element.textContent = value;
            
            // Обновляем модель данных
            this.tasks[rowIndex][key] = value;
        }
        this.changeListeners.forEach(fn => fn(this.getXML())); // TODO: сделать чтобы не переобновлялась вся таблица. Добавть поля
    }
    

    updateSupervisorLevelCode(rowIndex, supervisorLevelCode) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        
        const node = this.taskNodes[rowIndex];
        let supervisorLevel = node.getElementsByTagName('supervisorLevel')[0];
        
        // Если элемента нет, создаем его
        if (!supervisorLevel) {
            const doc = node.ownerDocument;
            supervisorLevel = doc.createElement('supervisorLevel');
            this.insertElementInCorrectOrder(node, supervisorLevel, 'supervisorLevel');
        }
        
        // Устанавливаем атрибут supervisorLevelCode
        if (supervisorLevelCode) {
            supervisorLevel.setAttribute('supervisorLevelCode', supervisorLevelCode);
        } else {
            supervisorLevel.removeAttribute('supervisorLevelCode');
            supervisorLevel.textContent = '';
        }
        
        // Обновляем модель данных
        this.tasks[rowIndex].supervisorLevelCode = supervisorLevelCode;
        
        this.changeListeners.forEach(fn => fn(this.getXML()));
    }

    updateTaskField(rowIndex, key, value) {
        if (!this.tasks[rowIndex]) return;
        this.tasks[rowIndex][key] = value;

        const node = this.taskNodes[rowIndex];

        if (key === 'remarks') { // TODO: может вынести в теги как-то
            this.checkRemarksAndSupervisorLevel(rowIndex, key, value);
        }

        const header = this.headers.find(h => h.key === key);
        
        if (!header || !header.path) return;

        let currentNativeNode = node;
        let applicElement = null;

        const path = header.path;
        for (let i = 0; i < path.length; i++) {
            const step = path[i];
            
            if (step.startsWith('@')) {
                // Обработка атрибута
                const attrName = step.slice(1);
                currentNativeNode.setAttribute(attrName, value);
                break;
            } else {
                // Поиск элемента с учетом регистра
                let found = null;
                const childNodes = currentNativeNode.childNodes;
                
                // Ищем элемент с нужным именем (с учетом регистра)
                for (let j = 0; j < childNodes.length; j++) {
                    if (childNodes[j].nodeType === 1 && childNodes[j].nodeName === step) {
                        found = childNodes[j];
                        break;
                    }
                }
                
                // Если элемент не найден, создаем новый с правильным регистром
                if (!found) {
                    found = currentNativeNode.ownerDocument.createElement(step);
                    currentNativeNode.appendChild(found);
                }
                
                // Если это последний шаг, устанавливаем текст
                if (i === path.length - 1) {
                    found.textContent = value;
                }
                
                // Переходим к найденному/созданному элементу
                currentNativeNode = found;
                applicElement = found;
            }
        }

        // Обновляем applicRefId если поле имеет allowApplic
        if (header.allowApplic && applicElement) {
            const applicRefId = this.tasks[rowIndex].fieldApplicabilities 
                ? this.tasks[rowIndex].fieldApplicabilities[key] 
                : null;
            
            if (applicRefId) {
                applicElement.setAttribute('applicRefId', applicRefId);
            } else {
                applicElement.removeAttribute('applicRefId');
            }
        }

        this.changeListeners.forEach(fn => fn(this.getXML()));
    }

    addTaskNode($node) {
        this.taskNodes.push($node[0]);
        const task = {};
        task.fieldApplicabilities = {};
        this.headers.forEach(col => {
            if (!col.path) {
                task[col.key] = $node.attr(col.key) || '';
            } else {
                let cursor = $node;
                let value = '';
                for (let step of col.path) {
                    if (!cursor || !cursor.length) {
                        cursor = null;
                        break;
                    }
                    if (step.startsWith('@')) {
                        value = cursor.attr(step.slice(1)) || '';
                    } else {
                        cursor = cursor.find(step).first();
                        if (!cursor.length) {
                            cursor = null;
                            break;
                        }
                        value = cursor.text().trim();
                    }
                }
                task[col.key] = value;
            }
        });

        // Добавляем в DOM
        const $root = this.$xml.find('maintPlanning');
        $root.append($node);
        this.tasks.push(task); // TODO: посмотреть куда это пушится.

        // Триггерим хук на обновление
        this.changeListeners.forEach(fn => fn(this.getXML()));
    }

    // addTaskToSection(taskCode, taskTitle) {
    //     const $taskDef = $('<taskDefinition>', {
    //         taskIdent: 'new-task-' + Date.now(),
    //         taskCode: taskCode
    //     });
    //     const $task = $('<task>').append($('<taskTitle>').text(taskTitle));
    //     $taskDef.append($task);
    //     this.$xml.find('maintPlanning > taskDefinitionAlts').append($taskDef);
    //     this.taskNodes.push($taskDef[0]);

    //     const task = {};
    //     this.headers.forEach(h => {
    //         task[h.key] = (h.key === 'taskCode') ? taskCode : (h.key === 'taskTitle') ? taskTitle : '';
    //     });
    //     this.tasks.push(task);
    //     this.changeListeners.forEach(fn => fn(this.getXML()));
    // }

    addTaskToSection(taskTitle) {
        const doc = this.$xml[0]; // сам XML-документ
    
        // Создаём <taskDefinition>
        const taskDef = doc.createElement("taskDefinition");
        taskDef.setAttribute("taskIdent", "new-task-" + Date.now());
    
        // 1. task (первый элемент согласно порядку)
        const task = doc.createElement("task");
        const taskTitleNode = doc.createElement("taskTitle");
        taskTitleNode.textContent = taskTitle;
        task.appendChild(taskTitleNode);
        taskDef.appendChild(task);
    
        // 2. preliminaryRqmts (второй элемент согласно порядку)
        const preliminaryRqmts = doc.createElement("preliminaryRqmts");
    
        const reqCondGroup = doc.createElement("reqCondGroup");
        const reqCondNoRef = doc.createElement("reqCondNoRef");
        reqCondNoRef.appendChild(doc.createElement("reqCond"));
        reqCondGroup.appendChild(reqCondNoRef);
        preliminaryRqmts.appendChild(reqCondGroup);
        
        const reqSupportEquips = doc.createElement("reqSupportEquips");
        reqSupportEquips.appendChild(doc.createElement("noSupportEquips"));
        preliminaryRqmts.appendChild(reqSupportEquips);
        
        const reqSupplies = doc.createElement("reqSupplies");
        reqSupplies.appendChild(doc.createElement("noSupplies"));
        preliminaryRqmts.appendChild(reqSupplies);
        
        const reqSpares = doc.createElement("reqSpares");
        reqSpares.appendChild(doc.createElement("noSpares"));
        preliminaryRqmts.appendChild(reqSpares);
        
        const reqSafety = doc.createElement("reqSafety");
        reqSafety.appendChild(doc.createElement("noSafety"));
        preliminaryRqmts.appendChild(reqSafety);
        
        taskDef.appendChild(preliminaryRqmts);
    
        // Найти индекс вставки по taskTitle
        let insertIndex = this.taskNodes.findIndex(n => {
            const title = n.querySelector("taskTitle");
            return title && title.textContent === taskTitle;
        });
    
        const taskObj = {};
        taskObj.fieldApplicabilities = {};
        taskObj.taskTitle = taskTitle;
        taskObj.personnel = [];
        // taskObj.supervisorLevelCode = '';
        taskObj.remarks = "";
        taskObj.rqmtSources = []; // Инициализируем пустой массив

        
        // Заполняем остальные поля
        this.headers.forEach(h => {
            if (h.key === "taskTitle") {
                taskObj[h.key] = taskTitle;
            } else {
                taskObj[h.key] = "";
            }
        });
    
        // ИСПРАВЛЕНИЕ: Находим контейнер для задач
        let container = this.$xml.find("maintPlanning > taskDefinitionAlts")[0];
        
        // Если контейнер не найден, создаем его
        if (!container) {
            const maintPlanning = this.$xml.find("maintPlanning")[0];
            if (maintPlanning) {
                container = doc.createElement("taskDefinitionAlts");
                maintPlanning.appendChild(container);
            } else {
                console.error("Не найден элемент maintPlanning");
                return;
            }
        }
    
        if (insertIndex !== -1) {
            // Вставка после последнего с таким taskTitle
            let lastIndex = insertIndex;
            while (
                lastIndex + 1 < this.taskNodes.length &&
                this.taskNodes[lastIndex + 1].querySelector("taskTitle") &&
                this.taskNodes[lastIndex + 1].querySelector("taskTitle").textContent === taskTitle
            ) {
                lastIndex++;
            }
    
            const refNode = this.taskNodes[lastIndex];
            refNode.parentNode.insertBefore(taskDef, refNode.nextSibling);
    
            this.taskNodes.splice(lastIndex + 1, 0, taskDef);
            this.tasks.splice(lastIndex + 1, 0, taskObj);
        } else {
            // В конец taskDefinitionAlts
            container.appendChild(taskDef);
            this.taskNodes.push(taskDef);
            this.tasks.push(taskObj);
        }
    
        // Оповещение слушателей
        this.changeListeners.forEach(fn => fn(this.getXML()));
    }

    removeApplicForField(idx, key) {
        if (typeof idx !== 'number' || idx < 0 || idx >= this.taskNodes.length) return false;
        const header = this.headers.find(h => h.key === key);
        const $node = $(this.taskNodes[idx]);
        if (!$node.length) return false;

        // ✅ КОСТЫЛЬ: если это применимость всей задачи
        if (key === 'applicabilityTask') {
            // 1. Удаляем атрибут applicRefId из корневого элемента taskDefinition
            $node.removeAttr('applicRefId');
            
            // 3. Чистим модель данных
            if (this.tasks[idx].fieldApplicabilities) {
                delete this.tasks[idx].fieldApplicabilities['applicabilityTask'];
            }
            this.tasks[idx].applicabilities = [];
            
            // 4. Эмитим событие
            this._emitChange({
                type: 'applicability:removed',
                payload: { rowIndex: idx, key: 'applicabilityTask' }
            });
            
            return true;
        }
        if (!header || !header.path || !$node.length) return false;

        // Находим нужный узел
        let cursor = $node;
        for (let step of header.path) {
            if (step.startsWith('@')) break;
            cursor = cursor.find(step).first();
            if (!cursor.length) return false;
        }

        // 1. Удаляем атрибут
        cursor.removeAttr('applicRefId');

        // 2. Если внутри есть <applicRef> – удаляем его
        cursor.find('applicRef').remove();

        // 3. Чистим модель
        this.tasks[idx][key] = this.tasks[idx][key] || '';
        this.tasks[idx].applicabilities = [];

        // Эмитим событие
        this._emitChange({
            type: 'applicability:removed',
            payload: { rowIndex: idx, key }
        });

        return true;
    }


    updateApplicForTask(idx, applicId) {
        if (typeof idx !== 'number' || idx < 0 || idx >= this.taskNodes.length) return false;
        const $el = $(this.taskNodes[idx]);
        if (!$el || !$el.length) return false;

        // ставим атрибут на taskDefinition
        if (applicId) $el.attr('applicRefId', applicId);
        else $el.removeAttr('applicRefId');

        // Обновляем модельные данные (у тебя в tasks хранится applicabilities)
        this.tasks[idx] = this.tasks[idx] || {};
        // сохраняем как массив с объектом (можно сохранить id — адаптируй под view)
        // this.tasks[idx].fieldApplicabilities["applicabilityTask"] = applicId ? [ this.applicMap && this.applicMap[applicId] ? this.applicMap[applicId] : { id: applicId } ] : [];
        this.tasks[idx].fieldApplicabilities["applicabilityTask"] = applicId;
        // Эмитим granular change — view может обновить только соответствующую строку/ячейку
        this._emitChange({
            type: 'applicability:changed',
            payload: { level: 'taskTempBroke', rowIndex: idx, applicId }
        });

        return true;
    }

    deleteTask(idx) {
        if (idx < 0 || idx >= this.taskNodes.length) return;
        const node = this.taskNodes.splice(idx, 1)[0];
        this.tasks.splice(idx, 1);
        $(node).remove();
        this.changeListeners.forEach(fn => fn(this.getXML()));

        // Специальное событие для удаления задачи
        // this._emitChange({
        //     type: 'task:deleted',
        //     payload: { rowIndex }
        // });
    }

    updateApplicForField(idx, key, applicId) {
        if (typeof idx !== 'number' || idx < 0 || idx >= this.taskNodes.length) return false;
        const header = this.headers.find(h => h.key === key);
        const $node = $(this.taskNodes[idx]);
        if (!header || !header.path || !$node.length) return false;

        // найти соответствующий узел по пути и установить атрибут applicRefId
        let cursor = $node;
        for (let step of header.path) {
            if (step.startsWith('@')) break;
            cursor = cursor.find(step).first();
            if (!cursor.length) return false;
        }

        if (applicId) cursor.attr('applicRefId', applicId);
        else cursor.removeAttr('applicRefId');

        // обновляем модельную репрезентацию
        this.tasks[idx] = this.tasks[idx] || {};
        // записать id (упростим — ключ applicabilities)
        this.tasks[idx].applicabilities = this.tasks[idx].applicabilities || [];
        // (опционально) — пометим, что field был обновлён
        // в реальной модели можно хранить per-field применимости

        // Эмитим granular change с info по колонке
        this._emitChange({
            type: 'applicability:changed',
            payload: { level: 'field', rowIndex: idx, field: key, applicId }
        });

        return true;
        }

    getTaskIndexByIdentifier(taskIdent) {
        return this.tasks.findIndex(task => task.taskIdent === taskIdent);
    }

    addTaskSection(title) {
        this.addTaskToSection(title);
    }

    getTaskCount() {
        return this.tasks.length; 
    }

    getTaskNode(index) {
        return this.taskNodes[index] || null;
    }


    getXML() {
        return this.$xml;
    }

    /**
     * Возвращает строковое представление применимости по ID: displayText + applicPropertyValues
     */
    getApplicDisplayValue(id, currentFilter = null) {
        if (!id || !this.applicMap[id]) return '';
        const applic = this.applicMap[id];
        
        // Если есть displayText - используем его
        if (applic.displayText) {
            return applic.displayText;
        }
        
        // Проверяем соответствие фильтру
        if (currentFilter) {
            const matches = this.checkApplicFilter(applic, currentFilter);
            if (!matches) return ''; // Не отображаем если не соответствует фильтру
        }
        
        // Возвращаем значение по приоритету
        return applic.displayValue;
    }

    checkApplicFilter(applic, filter) {
        // Фильтр должен содержать { type, model, serialno }
        const { asserts } = applic;
        
        // Проверка типа
        if (asserts.type && filter.type) {
            const typePattern = new RegExp(asserts.type.replace(/\*/g, '.*'));
            if (!typePattern.test(filter.type)) return false;
        }
        
        // Проверка модели
        if (asserts.model && filter.model) {
            const modelPattern = new RegExp(asserts.model.replace(/\|/g, '|').replace(/\*/g, '.*'));
            if (!modelPattern.test(filter.model)) return false;
        }
        
        // Проверка серийного номера (самая сложная)
        if (asserts.serialno && filter.serialno) {
            const serialPatterns = asserts.serialno.split('|');
            const serialNumber = parseInt(filter.serialno);
            
            let matches = false;
            for (const pattern of serialPatterns) {
                if (pattern.includes('~')) {
                    // Диапазон: 9007~9574
                    const [start, end] = pattern.split('~').map(Number);
                    if (serialNumber >= start && serialNumber <= end) {
                        matches = true;
                        break;
                    }
                } else {
                    // Конкретное значение
                    if (parseInt(pattern) === serialNumber) {
                        matches = true;
                        break;
                    }
                }
            }
            
            if (!matches) return false;
        }
        
        return true;
    }

    updateApplicForLimit(rowIndex, limitIndex, applicId) {
        if (typeof rowIndex !== 'number' || rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
        const $taskNode = $(this.taskNodes[rowIndex]);
        const $limits = $taskNode.find('limit');
        if (limitIndex < 0 || limitIndex >= $limits.length) {
            console.warn('limit index out of range', limitIndex);
            return false;
        }
    
        const $lim = $($limits.get(limitIndex));
        if (applicId) {
            $lim.attr('applicRefId', applicId);
        } else {
            $lim.removeAttr('applicRefId');
        }
    
        // Обновляем модельную структуру
        if (!this.tasks[rowIndex].limits) this.tasks[rowIndex].limits = [];
        this.tasks[rowIndex].limits[limitIndex] = this.tasks[rowIndex].limits[limitIndex] || {};
        this.tasks[rowIndex].limits[limitIndex].applicRefId = applicId || null;
    
        this._emitChange({ 
            type: 'applicability:changed', 
            payload: { rowIndex, limitIndex, applicId, field: 'limit' } 
        });
        return true;
    }


    addLimitToTask(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    
        // Создаем новый пустой объект limit с ТОЛЬКО интервалом
        const newLimit = {
            limitType: 'po',
            limitCond: '',
            applicRefId: null,
            intervals: [{ value: '', unit: '' }], // Один пустой интервал по умолчанию
            thresholds: []  // Пустой массив порогов
        };
    
        // Добавляем в модель данных
        if (!this.tasks[rowIndex].limits) {
            this.tasks[rowIndex].limits = [];
        }
        this.tasks[rowIndex].limits.push(newLimit);
    
        // Получаем taskNode
        const taskNode = this.taskNodes[rowIndex];
        const doc = taskNode.ownerDocument;
    
        // Создаем элементы через DOM API - ТОЛЬКО интервал
        const limitElement = doc.createElement('limit');
        limitElement.setAttribute('limitTypeValue', 'po');
        
        // Создаем только интервал (без trigger и порога)
        const thresholdInterval = doc.createElement('threshold');
        thresholdInterval.setAttribute('thresholdType', 'interval');
        thresholdInterval.setAttribute('thresholdUnitOfMeasure', '');
        const thresholdValueInterval = doc.createElement('thresholdValue');
        thresholdInterval.appendChild(thresholdValueInterval);
        limitElement.appendChild(thresholdInterval);
    
        // Вставляем limit в правильное место
        this.insertElementInCorrectOrder(taskNode, limitElement, 'limit');
    
        // Уведомляем об изменении
        this._emitChange({
            type: 'limit:added',
            payload: { 
                rowIndex, 
                limitIndex: this.tasks[rowIndex].limits.length - 1 
            }
        });
    }

    removeLimitFromTask(rowIndex, limitIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        if (!this.tasks[rowIndex].limits || limitIndex < 0 || limitIndex >= this.tasks[rowIndex].limits.length) return;

        // Удаляем из модели данных
        this.tasks[rowIndex].limits.splice(limitIndex, 1);

        // Удаляем из XML
        const $taskNode = $(this.taskNodes[rowIndex]);
        const $limits = $taskNode.find('limit');
        if (limitIndex < $limits.length) {
            $($limits[limitIndex]).remove();
        }

        // Уведомляем об изменении
        this._emitChange({
            type: 'limit:removed',
            payload: { 
                rowIndex, 
                limitIndex 
            }
        });
    }

    /**
 * Добавляет интервал к лимиту
 */
    addIntervalToLimit(rowIndex, limitIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        if (!this.tasks[rowIndex].limits || limitIndex < 0 || limitIndex >= this.tasks[rowIndex].limits.length) return;
    
        // Добавляем в модель
        this.tasks[rowIndex].limits[limitIndex].intervals.push({
            value: '',
            unit: ''
        });
    
        // Добавляем в XML
        const taskNode = this.taskNodes[rowIndex];
        const limits = taskNode.getElementsByTagName('limit');
        if (limitIndex < limits.length) {
            const limit = limits[limitIndex];
            const doc = taskNode.ownerDocument;
    
            const threshold = doc.createElement('threshold');
            threshold.setAttribute('thresholdType', 'interval');
            threshold.setAttribute('thresholdUnitOfMeasure', '');
            
            const thresholdValue = doc.createElement('thresholdValue');
            threshold.appendChild(thresholdValue);
    
            // Находим trigger (если есть) чтобы вставить интервал ПЕРЕД ним
            const trigger = limit.getElementsByTagName('trigger')[0];
            if (trigger) {
                // Вставляем перед trigger
                limit.insertBefore(threshold, trigger);
            } else {
                // Если trigger нет, добавляем в конец
                limit.appendChild(threshold);
            }
        }
    
        this._emitChange({
            type: 'limit:intervalAdded',
            payload: { rowIndex, limitIndex }
        });
    }

/**
 * Удаляет интервал из лимита
 */
removeIntervalFromLimit(rowIndex, limitIndex, intervalIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].limits || limitIndex < 0 || limitIndex >= this.tasks[rowIndex].limits.length) return;
    if (intervalIndex < 0 || intervalIndex >= this.tasks[rowIndex].limits[limitIndex].intervals.length) return;

    // ПРОВЕРКА: не позволяем удалить последний интервал
    if (this.tasks[rowIndex].limits[limitIndex].intervals.length <= 1) {
        alert('Ошибка: Должен оставаться хотя бы один интервал!');
        return;
    }

    // Удаляем из модели
    this.tasks[rowIndex].limits[limitIndex].intervals.splice(intervalIndex, 1);

    // Удаляем из XML
    const taskNode = this.taskNodes[rowIndex];
    const limits = taskNode.getElementsByTagName('limit');
    if (limitIndex < limits.length) {
        const limit = limits[limitIndex];
        const intervals = limit.querySelectorAll('threshold[thresholdType="interval"]');
        if (intervalIndex < intervals.length) {
            limit.removeChild(intervals[intervalIndex]);
        }
    }

    this._emitChange({
        type: 'limit:intervalRemoved',
        payload: { rowIndex, limitIndex }
    });
}

/**
 * Добавляет порог к лимиту
 */
addThresholdToLimit(rowIndex, limitIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].limits || limitIndex < 0 || limitIndex >= this.tasks[rowIndex].limits.length) return;

    // Добавляем в модель
    this.tasks[rowIndex].limits[limitIndex].thresholds.push({
        value: '',
        unit: ''
    });

    // Добавляем в XML
    const taskNode = this.taskNodes[rowIndex];
    const limits = taskNode.getElementsByTagName('limit');
    if (limitIndex < limits.length) {
        const limit = limits[limitIndex];
        const doc = taskNode.ownerDocument;

        // Создаем trigger если его нет
        let trigger = limit.getElementsByTagName('trigger')[0];
        if (!trigger) {
            trigger = doc.createElement('trigger');
            // Trigger должен быть ПОСЛЕ всех интервалов
            limit.appendChild(trigger);
        }

        const threshold = doc.createElement('threshold');
        threshold.setAttribute('thresholdType', 'threshold');
        threshold.setAttribute('thresholdUnitOfMeasure', '');
        
        const thresholdValue = doc.createElement('thresholdValue');
        threshold.appendChild(thresholdValue);

        trigger.appendChild(threshold);
    }

    this._emitChange({
        type: 'limit:thresholdAdded',
        payload: { rowIndex, limitIndex }
    });
}

/**
 * Удаляет порог из лимита
 */
removeThresholdFromLimit(rowIndex, limitIndex, thresholdIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].limits || limitIndex < 0 || limitIndex >= this.tasks[rowIndex].limits.length) return;
    if (thresholdIndex < 0 || thresholdIndex >= this.tasks[rowIndex].limits[limitIndex].thresholds.length) return;

    // Удаляем из модели
    this.tasks[rowIndex].limits[limitIndex].thresholds.splice(thresholdIndex, 1);

    // Удаляем из XML
    const taskNode = this.taskNodes[rowIndex];
    const limits = taskNode.getElementsByTagName('limit');
    if (limitIndex < limits.length) {
        const limit = limits[limitIndex];
        const trigger = limit.getElementsByTagName('trigger')[0];
        if (trigger) {
            const thresholds = trigger.querySelectorAll('threshold[thresholdType="threshold"]');
            if (thresholdIndex < thresholds.length) {
                trigger.removeChild(thresholds[thresholdIndex]);
            }
            
            // Удаляем trigger если он пустой
            if (trigger.children.length === 0) {
                limit.removeChild(trigger);
            }
        }
    }

    this._emitChange({
        type: 'limit:thresholdRemoved',
        payload: { rowIndex, limitIndex }
    });
}

/**
 * Обновляет поле интервала
 */
updateIntervalField(rowIndex, limitIndex, intervalIndex, field, value) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].limits || limitIndex < 0 || limitIndex >= this.tasks[rowIndex].limits.length) return;
    if (intervalIndex < 0 || intervalIndex >= this.tasks[rowIndex].limits[limitIndex].intervals.length) return;

    // Обновляем модель
    const interval = this.tasks[rowIndex].limits[limitIndex].intervals[intervalIndex];
    if (field === 'value') {
        interval.value = value;
    } else if (field === 'unit') {
        interval.unit = value;
    }

    // Обновляем XML
    const taskNode = this.taskNodes[rowIndex];
    const limits = taskNode.getElementsByTagName('limit');
    if (limitIndex < limits.length) {
        const limit = limits[limitIndex];
        const intervals = limit.querySelectorAll('threshold[thresholdType="interval"]');
        if (intervalIndex < intervals.length) {
            const intervalNode = intervals[intervalIndex];
            if (field === 'value') {
                const valueNode = intervalNode.getElementsByTagName('thresholdValue')[0];
                if (valueNode) {
                    valueNode.textContent = value;
                }
            } else if (field === 'unit') {
                intervalNode.setAttribute('thresholdUnitOfMeasure', value);
            }
        }
    }

    this._emitChange({
        type: 'limit:intervalChanged',
        payload: { rowIndex, limitIndex, intervalIndex, field, value }
    });
}

/**
 * Обновляет поле порога
 */
updateThresholdField(rowIndex, limitIndex, thresholdIndex, field, value) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].limits || limitIndex < 0 || limitIndex >= this.tasks[rowIndex].limits.length) return;
    if (thresholdIndex < 0 || thresholdIndex >= this.tasks[rowIndex].limits[limitIndex].thresholds.length) return;

    // Обновляем модель
    const threshold = this.tasks[rowIndex].limits[limitIndex].thresholds[thresholdIndex];
    if (field === 'value') {
        threshold.value = value;
    } else if (field === 'unit') {
        threshold.unit = value;
    }

    // Обновляем XML
    const taskNode = this.taskNodes[rowIndex];
    const limits = taskNode.getElementsByTagName('limit');
    if (limitIndex < limits.length) {
        const limit = limits[limitIndex];
        const trigger = limit.getElementsByTagName('trigger')[0];
        if (trigger) {
            const thresholds = trigger.querySelectorAll('threshold[thresholdType="threshold"]');
            if (thresholdIndex < thresholds.length) {
                const thresholdNode = thresholds[thresholdIndex];
                if (field === 'value') {
                    const valueNode = thresholdNode.getElementsByTagName('thresholdValue')[0];
                    if (valueNode) {
                        valueNode.textContent = value;
                    }
                } else if (field === 'unit') {
                    thresholdNode.setAttribute('thresholdUnitOfMeasure', value);
                }
            }
        }
    }

    this._emitChange({
        type: 'limit:thresholdChanged',
        payload: { rowIndex, limitIndex, thresholdIndex, field, value }
    });
}

/**
 * Обновляет основное поле лимита (limitType, limitCond)
 */
updateLimitMainField(rowIndex, limitIndex, field, value) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].limits || limitIndex < 0 || limitIndex >= this.tasks[rowIndex].limits.length) return;

    const $taskNode = $(this.taskNodes[rowIndex]);
    const $limits = $taskNode.find('limit');
    if (limitIndex < 0 || limitIndex >= $limits.length) return;

    const $lim = $($limits.get(limitIndex));

    switch (field) {
        case 'limitType':
            $lim.attr('limitTypeValue', value);
            this.tasks[rowIndex].limits[limitIndex].limitType = value;
            break;
        case 'limitCond':
            $lim.attr('limitCond', value);
            this.tasks[rowIndex].limits[limitIndex].limitCond = value;
            break;
    }

    this._emitChange({
        type: 'limit:mainChanged',
        payload: { rowIndex, limitIndex, field, value }
    });
}

/**
 * Проверяет валидность лимита (интервалы должны быть заполнены)
 */
validateLimit(rowIndex, limitIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
    if (!this.tasks[rowIndex].limits || limitIndex < 0 || limitIndex >= this.tasks[rowIndex].limits.length) return false;

    const limit = this.tasks[rowIndex].limits[limitIndex];
    
    // Проверяем интервалы - они должны быть заполнены
    for (const interval of limit.intervals) {
        if (!interval.value || interval.value.trim() === '') {
            return false;
        }
    }
    
    return true;
}

addRqmtSource(rowIndex, sourceData = { sourceOfRqmt: '', sourceCriticality: [] }) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    
    if (!this.tasks[rowIndex].rqmtSources) {
        this.tasks[rowIndex].rqmtSources = [];
    }
    
    this.tasks[rowIndex].rqmtSources.push({...sourceData});
    
    // Добавляем в XML
    const taskNode = this.taskNodes[rowIndex];
    const doc = taskNode.ownerDocument;
    
    const rqmtSourceElement = doc.createElement('rqmtSource');
    if (sourceData.sourceOfRqmt) {
        rqmtSourceElement.setAttribute('sourceOfRqmt', sourceData.sourceOfRqmt);
    }
    
    // Добавляем все sourceCriticality как отдельные sourceType элементы
    sourceData.sourceCriticality.forEach(criticality => {
        if (criticality) {
            const sourceTypeElement = doc.createElement('sourceType');
            sourceTypeElement.setAttribute('sourceCriticality', criticality);
            rqmtSourceElement.appendChild(sourceTypeElement);
        }
    });
    
    // Вставляем в правильное место (после task, перед preliminaryRqmts)
    this.insertElementInCorrectOrder(taskNode, rqmtSourceElement, 'rqmtSource');
    
    this._emitChange({
        type: 'rqmtSource:added',
        payload: { 
            rowIndex, 
            sourceIndex: this.tasks[rowIndex].rqmtSources.length - 1 
        }
    });
}

removeRqmtSource(rowIndex, sourceIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].rqmtSources || sourceIndex < 0 || 
        sourceIndex >= this.tasks[rowIndex].rqmtSources.length) return;
    
    // Удаляем из модели
    this.tasks[rowIndex].rqmtSources.splice(sourceIndex, 1);
    
    // Удаляем из XML
    const taskNode = this.taskNodes[rowIndex];
    const rqmtSources = taskNode.getElementsByTagName('rqmtSource');
    
    if (sourceIndex < rqmtSources.length) {
        taskNode.removeChild(rqmtSources[sourceIndex]);
    }
    
    this._emitChange({
        type: 'rqmtSource:removed',
        payload: { rowIndex, sourceIndex }
    });
}

setRqmtSources(rowIndex, sources) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    
    const taskNode = this.taskNodes[rowIndex];
    
    // Удаляем все существующие rqmtSource из XML
    const existingSources = taskNode.getElementsByTagName('rqmtSource');
    while (existingSources.length > 0) {
        taskNode.removeChild(existingSources[0]);
    }
    
    // Обновляем модель
    this.tasks[rowIndex].rqmtSources = [];
    
    // Добавляем новые источники
    const doc = taskNode.ownerDocument;
    sources.forEach(source => {
        // Добавляем в модель
        this.tasks[rowIndex].rqmtSources.push({...source});
        
        // Создаем XML элемент
        const rqmtSourceElement = doc.createElement('rqmtSource');
        if (source.sourceOfRqmt) {
            rqmtSourceElement.setAttribute('sourceOfRqmt', source.sourceOfRqmt);
        }
        
        if (source.sourceCriticality) {
            const sourceTypeElement = doc.createElement('sourceType');
            sourceTypeElement.setAttribute('sourceCriticality', source.sourceCriticality);
            rqmtSourceElement.appendChild(sourceTypeElement);
        }
        
        // Вставляем в правильное место
        this.insertElementInCorrectOrder(taskNode, rqmtSourceElement, 'rqmtSource');
    });
    
    this._emitChange({
        type: 'rqmtSource:set',
        payload: { rowIndex, sources }
    });
}

updateRqmtSourceField(rowIndex, sourceIndex, field, value) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].rqmtSources || sourceIndex < 0 || 
        sourceIndex >= this.tasks[rowIndex].rqmtSources.length) return;
    
    // Обновляем модель
    if (field === 'sourceOfRqmt') {
        this.tasks[rowIndex].rqmtSources[sourceIndex].sourceOfRqmt = value;
    } else if (field === 'sourceCriticality') {
        // value должен быть массивом для sourceCriticality
        this.tasks[rowIndex].rqmtSources[sourceIndex].sourceCriticality = value;
    }
    
    // Обновляем XML
    const taskNode = this.taskNodes[rowIndex];
    const rqmtSources = taskNode.getElementsByTagName('rqmtSource');
    
    if (sourceIndex < rqmtSources.length) {
        const rqmtSource = rqmtSources[sourceIndex];
        
        if (field === 'sourceOfRqmt') {
            if (value) {
                rqmtSource.setAttribute('sourceOfRqmt', value);
            } else {
                rqmtSource.removeAttribute('sourceOfRqmt');
            }
        } else if (field === 'sourceCriticality') {
            // Удаляем все существующие sourceType
            while (rqmtSource.firstChild) {
                rqmtSource.removeChild(rqmtSource.firstChild);
            }
            
            // Добавляем новые sourceType элементы
            value.forEach(criticality => {
                if (criticality) {
                    const sourceType = taskNode.ownerDocument.createElement('sourceType');
                    sourceType.setAttribute('sourceCriticality', criticality);
                    rqmtSource.appendChild(sourceType);
                }
            });
            
            // Если нет sourceOfRqmt и нет sourceCriticality, удаляем элемент
            if (!rqmtSource.hasAttribute('sourceOfRqmt') && value.length === 0) {
                this.removeRqmtSource(rowIndex, sourceIndex);
                return;
            }
        }
    }
    
    this._emitChange({
        type: 'rqmtSource:changed',
        payload: { rowIndex, sourceIndex, field, value }
    });
}

getRqmtSources(rowIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return [];
    return this.tasks[rowIndex].rqmtSources || [];
}
    addPersonnel(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        
        const node = this.taskNodes[rowIndex];
        const doc = node.ownerDocument;
        
        // Находим или создаем preliminaryRqmts
        let preliminaryRqmts = node.getElementsByTagName('preliminaryRqmts')[0];
        if (!preliminaryRqmts) {
            preliminaryRqmts = doc.createElement('preliminaryRqmts');
            this.insertElementInCorrectOrder(node, preliminaryRqmts, "preliminaryRqmts");
        }
        
        // Создаем новый reqPersons
        const reqPerson = doc.createElement('reqPersons');
        const personnel = doc.createElement('personnel');
        personnel.setAttribute('numRequired', '1');
        
        const personCategory = doc.createElement('personCategory');
        personCategory.setAttribute('personCategoryCode', '');
        
        personnel.appendChild(personCategory);
        reqPerson.appendChild(personnel);
        
        const reqCondGroup = preliminaryRqmts.getElementsByTagName("reqCondGroup")[0];
        // Добавляем reqPersons в начало preliminaryRqmts
        if (reqCondGroup) {
            reqCondGroup.insertAdjacentElement("afterend", reqPerson);
        } else {
            preliminaryRqmts.appendChild(reqPerson);
        }
        
        // Обновляем модель данных
        if (!this.tasks[rowIndex].personnel) {
            this.tasks[rowIndex].personnel = [];
        }
        
        this.tasks[rowIndex].personnel.unshift({ // unshift добавляет в начало массива
            numRequired: '1',
            personCategoryCode: '',
            applicRefId: null
        });
        
        this.changeListeners.forEach(fn => fn(this.getXML()));
    }

    updatePersonnelField(rowIndex, personnelIndex, field, value) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        
        const node = this.taskNodes[rowIndex];
        const preliminaryRqmts = node.getElementsByTagName('preliminaryRqmts')[0];
        if (!preliminaryRqmts) return;
        
        const reqPersons = preliminaryRqmts.getElementsByTagName('reqPersons');
        
        if (personnelIndex >= reqPersons.length) return;
        
        const reqPerson = reqPersons[personnelIndex];
        const personnel = reqPerson.getElementsByTagName('personnel')[0];
        
        if (field === 'numRequired') {
            personnel.setAttribute('numRequired', value);
            this.tasks[rowIndex].personnel[personnelIndex].numRequired = value;
        } else if (field === 'personCategoryCode') {
            let personCategory = personnel.getElementsByTagName('personCategory')[0];
            if (!personCategory) {
                personCategory = node.ownerDocument.createElement('personCategory');
                personnel.appendChild(personCategory);
            }
            personCategory.setAttribute('personCategoryCode', value);
            this.tasks[rowIndex].personnel[personnelIndex].personCategoryCode = value;
        }
    
        this.changeListeners.forEach(fn => fn(this.getXML()));
    }

    updatePersonnelApplic(rowIndex, personnelIndex, applicId) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        if (!this.tasks[rowIndex].personnel || personnelIndex < 0 || personnelIndex >= this.tasks[rowIndex].personnel.length) return;
    
        const node = this.taskNodes[rowIndex];
        const preliminaryRqmts = node.getElementsByTagName('preliminaryRqmts')[0];
        if (!preliminaryRqmts) return;
        
        const reqPersons = preliminaryRqmts.getElementsByTagName('reqPersons');
        
        if (personnelIndex >= reqPersons.length) return;
        
        const reqPerson = reqPersons[personnelIndex];
        
        if (applicId) {
            reqPerson.setAttribute('applicRefId', applicId);
        } else {
            reqPerson.removeAttribute('applicRefId');
        }
        
        this.tasks[rowIndex].personnel[personnelIndex].applicRefId = applicId;
        this.changeListeners.forEach(fn => fn(this.getXML()));
    }

    removePersonnel(rowIndex, personnelIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        if (!this.tasks[rowIndex].personnel || personnelIndex < 0 || personnelIndex >= this.tasks[rowIndex].personnel.length) return;
    
        const node = this.taskNodes[rowIndex];
        const preliminaryRqmts = node.getElementsByTagName('preliminaryRqmts')[0];
        if (!preliminaryRqmts) return;
        
        const reqPersons = preliminaryRqmts.getElementsByTagName('reqPersons');
        
        if (personnelIndex < reqPersons.length) {
            reqPersons[personnelIndex].remove();
        }
        
        // Удаляем из модели данных
        this.tasks[rowIndex].personnel.splice(personnelIndex, 1);
        
        // Уведомляем об изменении
        this.changeListeners.forEach(fn => fn(this.getXML()));
    }

    removeApplicForLimit(rowIndex, limitIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
        if (!this.tasks[rowIndex].limits || limitIndex < 0 || limitIndex >= this.tasks[rowIndex].limits.length) return false;

        const node = this.taskNodes[rowIndex];
        const limits = node.getElementsByTagName('limit');
        
        if (limitIndex < limits.length) {
            const limit = limits[limitIndex];
            limit.removeAttribute('applicRefId');
            this.tasks[rowIndex].limits[limitIndex].applicRefId = null;
        }

        this._emitChange({
            type: 'applicability:removed',
            payload: { rowIndex, limitIndex, target: 'limit' }
        });

        return true;
        }

    removeApplicForPersonnel(rowIndex, personnelIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
        if (!this.tasks[rowIndex].personnel || personnelIndex < 0 || personnelIndex >= this.tasks[rowIndex].personnel.length) return false;

        const node = this.taskNodes[rowIndex];
        const reqPersons = node.getElementsByTagName('reqPersons');
        
        if (personnelIndex < reqPersons.length) {
            const reqPerson = reqPersons[personnelIndex];
            reqPerson.removeAttribute('applicRefId');
            this.tasks[rowIndex].personnel[personnelIndex].applicRefId = null;
        }

        this._emitChange({
            type: 'applicability:removed',
            payload: { rowIndex, personnelIndex, target: 'personnel' }
        });

        return true;
        }

    removeApplicForRemarks(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
        if (!this.tasks[rowIndex].remarks) return false;

        const node = this.taskNodes[rowIndex];
        const remarks = node.getElementsByTagName('remarks')[0];

        remarks.removeAttribute('applicRefId');
        this.tasks[rowIndex].fieldApplicabilities['remarks'] = null;

        this._emitChange({
            type: 'applicability:removed',
            payload: { rowIndex, target: 'remarks' }
        });

        return true;
    }

    /**
     * Находит или создает productionMaintData для workAreaLocationGroup
     */
    getWorkAreaProductionMaintData(taskNode) {
        const doc = taskNode.ownerDocument;
        let preliminaryRqmts = Array.from(taskNode.getElementsByTagName('preliminaryRqmts'))[0];
        
        if (!preliminaryRqmts) {
            preliminaryRqmts = doc.createElement('preliminaryRqmts');
            this.insertElementInCorrectOrder(taskNode, preliminaryRqmts, 'preliminaryRqmts');
        }

        // Ищем productionMaintData с workAreaLocationGroup
        const allPmds = preliminaryRqmts.getElementsByTagName('productionMaintData');
        for (let pmd of allPmds) {
            if (pmd.getElementsByTagName('workAreaLocationGroup').length > 0) {
                return pmd;
            }
        }

        // Если не нашли, создаем новый
        const workAreaPmd = doc.createElement('productionMaintData');
        if (preliminaryRqmts.firstChild) {
            preliminaryRqmts.insertBefore(workAreaPmd, preliminaryRqmts.firstChild);
        } else {
            preliminaryRqmts.appendChild(workAreaPmd);
        }
        
        return workAreaPmd;
    }


    addZoneToTask(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    
        // Создаем новый пустой объект зоны
        const newZone = {
            zoneNumber: '',
            applicRefId: null
        };
    
        // Добавляем в модель данных
        if (!this.tasks[rowIndex].zoneNumbers) {
            this.tasks[rowIndex].zoneNumbers = [];
        }
        this.tasks[rowIndex].zoneNumbers.push(newZone);
    
        // Создаем XML-структуру
        const xmlString = `<zoneRef></zoneRef>`;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        const zoneElement = xmlDoc.documentElement;
    
        // Импортируем элемент в текущий документ
        const importedZone = document.importNode(zoneElement, true);
        
        // Добавляем в XML (в workAreaLocationGroup)
        const $taskNode = $(this.taskNodes[rowIndex]);
        let $workAreaGroup = $taskNode.find('workAreaLocationGroup');
        
        // Если workAreaLocationGroup нет, создаем его
        if (!$workAreaGroup.length) {
            $workAreaGroup = $('<workAreaLocationGroup>');
            $taskNode.append($workAreaGroup);
        }
        
        $workAreaGroup.append(importedZone);
    
        // Уведомляем об изменении
        this._emitChange({
            type: 'zone:added',
            payload: { 
                rowIndex, 
                zoneIndex: this.tasks[rowIndex].zoneNumbers.length - 1 
            }
        });
    }
    
    removeZoneFromTask(rowIndex, zoneIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        if (!this.tasks[rowIndex].zoneNumbers || zoneIndex < 0 || zoneIndex >= this.tasks[rowIndex].zoneNumbers.length) return;
    
        // Удаляем из модели данных
        this.tasks[rowIndex].zoneNumbers.splice(zoneIndex, 1);
    
        // Удаляем из XML
        const $taskNode = $(this.taskNodes[rowIndex]);
        const $zones = $taskNode.find('zoneRef');
        if (zoneIndex < $zones.length) {
            $($zones[zoneIndex]).remove();
        }
    
        // Уведомляем об изменении
        this._emitChange({
            type: 'zone:removed',
            payload: { 
                rowIndex, 
                zoneIndex 
            }
        });
    }
    
    updateZoneField(rowIndex, zoneIndex, field, value) {
        const $taskNode = $(this.taskNodes[rowIndex]);
        const $zones = $taskNode.find('zoneRef');
        if (zoneIndex < 0 || zoneIndex >= $zones.length) return;
    
        const $zone = $($zones.get(zoneIndex));
    
        switch (field) {
            case 'zoneNumber':
                $zone.attr("zoneNumber", value);
                this.tasks[rowIndex].zoneNumbers[zoneIndex].zoneNumber = value;
                break;
        }
    
        this._emitChange({
            type: 'zone:changed',
            payload: { rowIndex, zoneIndex, field, value }
        });
    }
    
    updateZoneApplic(rowIndex, zoneIndex, applicId) {
        if (typeof rowIndex !== 'number' || rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
        const $taskNode = $(this.taskNodes[rowIndex]);
        const $zones = $taskNode.find('zoneRef');
        if (zoneIndex < 0 || zoneIndex >= $zones.length) {
            console.warn('zone index out of range', zoneIndex);
            return false;
        }
    
        const $zone = $($zones.get(zoneIndex));
        
        if (applicId) {
            $zone.attr('applicRefId', applicId);
        } else {
            $zone.removeAttr('applicRefId');
        }
    
        // Обновляем модельную структуру
        if (!this.tasks[rowIndex].zoneNumbers) this.tasks[rowIndex].zoneNumbers = [];
        this.tasks[rowIndex].zoneNumbers[zoneIndex] = this.tasks[rowIndex].zoneNumbers[zoneIndex] || {};
        this.tasks[rowIndex].zoneNumbers[zoneIndex].applicRefId = applicId || null;
    
        this._emitChange({ 
            type: 'applicability:changed', 
            payload: { rowIndex, zoneIndex, applicId, field: 'zone' } 
        });
        return true;
    }

    ///-------------------------
    addWorkAreaLocationGroup(rowIndex, type) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;

        const taskNode = this.taskNodes[rowIndex];
        const workAreaPmd = this.getWorkAreaProductionMaintData(taskNode);
        const doc = taskNode.ownerDocument;

        // Создаем workAreaLocationGroup
        const workAreaLocationGroup = doc.createElement('workAreaLocationGroup');
        
        if (type === 'zone') {
            const zoneRef = doc.createElement('zoneRef');
            zoneRef.setAttribute('zoneNumber', '');
            workAreaLocationGroup.appendChild(zoneRef);
        } else {
            const accessPointRef = doc.createElement('accessPointRef');
            accessPointRef.setAttribute('accessPointNumber', '');
            workAreaLocationGroup.appendChild(accessPointRef);
        }

        // Добавляем в конец productionMaintData
        workAreaPmd.appendChild(workAreaLocationGroup);

        // Обновляем модель данных
        const newGroup = {
            applicRefId: null,
            type: type,
            zones: type === 'zone' ? [{ zoneNumber: '' }] : [],
            accessPoints: type === 'access' ? [{ accessPointNumber: '' }] : []
        };

        if (!this.tasks[rowIndex].workAreaLocationGroups) {
            this.tasks[rowIndex].workAreaLocationGroups = [];
        }
        this.tasks[rowIndex].workAreaLocationGroups.push(newGroup);

        this._emitChange({
            type: 'workAreaGroup:added',
            payload: { 
                rowIndex, 
                groupIndex: this.tasks[rowIndex].workAreaLocationGroups.length - 1,
                type 
            }
        });
    }

    /**
 * Находит productionMaintData предназначенный для workAreaLocationGroup
 */
findWorkAreaProductionMaintData(preliminaryRqmts) {
    const allPmds = preliminaryRqmts.getElementsByTagName('productionMaintData');
    
    for (let pmd of allPmds) {
        // Ищем productionMaintData, который содержит workAreaLocationGroup
        if (pmd.getElementsByTagName('workAreaLocationGroup').length > 0) {
            return pmd;
        }
    }
    
    // Если не нашли, возвращаем первый productionMaintData (если он есть)
    // или null если productionMaintData нет вообще
    return allPmds.length > 0 ? allPmds[0] : null;
}

removeWorkAreaLocationGroup(rowIndex, groupIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].workAreaLocationGroups || groupIndex < 0 || 
        groupIndex >= this.tasks[rowIndex].workAreaLocationGroups.length) return;

    // Удаляем из модели
    this.tasks[rowIndex].workAreaLocationGroups.splice(groupIndex, 1);

    // Удаляем из XML
    const taskNode = this.taskNodes[rowIndex];
    const workAreaPmd = this.getWorkAreaProductionMaintData(taskNode);
    const groups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
    
    if (groupIndex < groups.length) {
        workAreaPmd.removeChild(groups[groupIndex]);
    }

    this._emitChange({
        type: 'workAreaGroup:removed',
        payload: { rowIndex, groupIndex }
    });
}

addZoneToGroup(rowIndex, groupIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].workAreaLocationGroups || groupIndex < 0 || 
        groupIndex >= this.tasks[rowIndex].workAreaLocationGroups.length) return;

    const taskNode = this.taskNodes[rowIndex];
    const workAreaPmd = this.getWorkAreaProductionMaintData(taskNode);
    const groups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
    
    if (groupIndex >= groups.length) return;

    const group = groups[groupIndex];
    const doc = taskNode.ownerDocument;
    const zoneRef = doc.createElement('zoneRef');
    zoneRef.setAttribute('zoneNumber', '');
    group.appendChild(zoneRef);

    // Обновляем модель
    this.tasks[rowIndex].workAreaLocationGroups[groupIndex].zones.push({ zoneNumber: '' });

    this._emitChange({
        type: 'zone:added',
        payload: { 
            rowIndex, 
            groupIndex, 
            zoneIndex: this.tasks[rowIndex].workAreaLocationGroups[groupIndex].zones.length - 1 
        }
    });
}


removeZoneFromGroup(rowIndex, groupIndex, zoneIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].workAreaLocationGroups || groupIndex < 0 || 
        groupIndex >= this.tasks[rowIndex].workAreaLocationGroups.length) return;
    if (zoneIndex < 0 || zoneIndex >= this.tasks[rowIndex].workAreaLocationGroups[groupIndex].zones.length) return;

    const taskNode = this.taskNodes[rowIndex];
    const workAreaPmd = this.getWorkAreaProductionMaintData(taskNode);
    const groups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
    
    if (groupIndex >= groups.length) return;

    const group = groups[groupIndex];
    const zones = group.getElementsByTagName('zoneRef');
    
    if (zoneIndex < zones.length) {
        group.removeChild(zones[zoneIndex]);
    }

    // Обновляем модель
    this.tasks[rowIndex].workAreaLocationGroups[groupIndex].zones.splice(zoneIndex, 1);

    this._emitChange({
        type: 'zone:removed',
        payload: { rowIndex, groupIndex, zoneIndex }
    });
}

removeAccessPointFromGroup(rowIndex, groupIndex, accessIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].workAreaLocationGroups || groupIndex < 0 || 
        groupIndex >= this.tasks[rowIndex].workAreaLocationGroups.length) return;
    if (accessIndex < 0 || accessIndex >= this.tasks[rowIndex].workAreaLocationGroups[groupIndex].accessPoints.length) return;

    const taskNode = this.taskNodes[rowIndex];
    const workAreaPmd = this.getWorkAreaProductionMaintData(taskNode);
    const groups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
    
    if (groupIndex >= groups.length) return;

    const group = groups[groupIndex];
    const accessPoints = group.getElementsByTagName('accessPointRef');
    
    if (accessIndex < accessPoints.length) {
        group.removeChild(accessPoints[accessIndex]);
    }

    // Обновляем модель
    this.tasks[rowIndex].workAreaLocationGroups[groupIndex].accessPoints.splice(accessIndex, 1);

    this._emitChange({
        type: 'accessPoint:removed',
        payload: { rowIndex, groupIndex, accessIndex }
    });
}

updateWorkAreaGroupApplic(rowIndex, groupIndex, applicId) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
    if (!this.tasks[rowIndex].workAreaLocationGroups || groupIndex < 0 || 
        groupIndex >= this.tasks[rowIndex].workAreaLocationGroups.length) return false;

    const taskNode = this.taskNodes[rowIndex];
    const workAreaPmd = this.getWorkAreaProductionMaintData(taskNode);
    const groups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
    
    if (groupIndex >= groups.length) return false;

    const group = groups[groupIndex];
    if (applicId) {
        group.setAttribute('applicRefId', applicId);
    } else {
        group.removeAttribute('applicRefId');
    }

    // Обновляем модель
    this.tasks[rowIndex].workAreaLocationGroups[groupIndex].applicRefId = applicId;

    this._emitChange({
        type: 'applicability:changed',
        payload: { rowIndex, groupIndex, applicId, field: 'workAreaGroup' }
    });

    return true;
}

/**
 * Обновляет поле зоны
 */
updateZoneField(rowIndex, groupIndex, zoneIndex, field, value) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].workAreaLocationGroups || groupIndex < 0 || 
        groupIndex >= this.tasks[rowIndex].workAreaLocationGroups.length) return;
    if (zoneIndex < 0 || zoneIndex >= this.tasks[rowIndex].workAreaLocationGroups[groupIndex].zones.length) return;

    const taskNode = this.taskNodes[rowIndex];
    const workAreaPmd = this.getWorkAreaProductionMaintData(taskNode);
    const groups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
    
    if (groupIndex >= groups.length) return;

    const group = groups[groupIndex];
    const zones = group.getElementsByTagName('zoneRef');
    
    if (zoneIndex < zones.length) {
        const zone = zones[zoneIndex];
        zone.setAttribute('zoneNumber', value);
    }

    // Обновляем модель
    this.tasks[rowIndex].workAreaLocationGroups[groupIndex].zones[zoneIndex].zoneNumber = value;

    this._emitChange({
        type: 'zone:changed',
        payload: { rowIndex, groupIndex, zoneIndex, field, value }
    });
}


updateAccessPointField(rowIndex, groupIndex, accessIndex, field, value) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].workAreaLocationGroups || groupIndex < 0 || 
        groupIndex >= this.tasks[rowIndex].workAreaLocationGroups.length) return;
    if (accessIndex < 0 || accessIndex >= this.tasks[rowIndex].workAreaLocationGroups[groupIndex].accessPoints.length) return;

    // Используем нативные DOM-методы
    const taskNode = this.taskNodes[rowIndex];
    const preliminaryRqmts = taskNode.getElementsByTagName('preliminaryRqmts')[0];
    if (!preliminaryRqmts) return;

    const workAreaPmd = this.findWorkAreaProductionMaintData(preliminaryRqmts);
    if (!workAreaPmd) return;

    const workAreaGroups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
    if (groupIndex >= workAreaGroups.length) return;

    const workAreaGroup = workAreaGroups[groupIndex];
    const accessPointRefs = workAreaGroup.getElementsByTagName('accessPointRef');
    if (accessIndex >= accessPointRefs.length) return;

    const accessPointRef = accessPointRefs[accessIndex];
    accessPointRef.setAttribute(field, value);
    
    this.tasks[rowIndex].workAreaLocationGroups[groupIndex].accessPoints[accessIndex][field] = value;

    this._emitChange({
        type: 'accessPoint:changed',
        payload: { rowIndex, groupIndex, accessIndex, field, value }
    });
}

removeApplicForWorkAreaGroup(rowIndex, groupIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
    if (!this.tasks[rowIndex].workAreaLocationGroups || groupIndex < 0 || 
        groupIndex >= this.tasks[rowIndex].workAreaLocationGroups.length) return false;

    const taskNode = this.taskNodes[rowIndex];
    const workAreaPmd = this.getWorkAreaProductionMaintData(taskNode);
    const groups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
    
    if (groupIndex < groups.length) {
        const group = groups[groupIndex];
        group.removeAttribute('applicRefId');
    }

    // Обновляем модель
    this.tasks[rowIndex].workAreaLocationGroups[groupIndex].applicRefId = null;

    this._emitChange({
        type: 'applicability:removed',
        payload: { rowIndex, groupIndex, target: 'workAreaGroup' }
    });

    return true;
}
  //--------------------------
    
    removeApplicForZone(rowIndex, zoneIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
        if (!this.tasks[rowIndex].zoneNumbers || zoneIndex < 0 || zoneIndex >= this.tasks[rowIndex].zoneNumbers.length) return false;
    
        const node = this.taskNodes[rowIndex];
        const zones = node.getElementsByTagName('zoneRef');
        
        if (zoneIndex < zones.length) {
            const zone = zones[zoneIndex];
            zone.removeAttribute('applicRefId');
            this.tasks[rowIndex].zoneNumbers[zoneIndex].applicRefId = null;
        }
    
        this._emitChange({
            type: 'applicability:removed',
            payload: { rowIndex, zoneIndex, target: 'zone' }
        });
    
        return true;
    }

    addDmRef(rowIndex, dmCodeData, applicRefId = null) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    
        const newDmRef = {
            applicRefId: applicRefId,
            dmCode: dmCodeData
        };
    
        if (!this.tasks[rowIndex].dmRefs) {
            this.tasks[rowIndex].dmRefs = [];
        }
        this.tasks[rowIndex].dmRefs.push(newDmRef);
    
        // Создаем XML структуру с правильным регистром
        const taskNode = this.taskNodes[rowIndex];
        const doc = taskNode.ownerDocument;
    
        // Находим или создаем refs
        let refs = Array.from(taskNode.getElementsByTagName('refs'))[0];
        if (!refs) {
            refs = doc.createElement('refs');
            // taskNode.appendChild(refs);
            this.insertElementInCorrectOrder(taskNode, refs, "refs")
        }
    
        // Создаем dmRef
        const dmRef = doc.createElement('dmRef');
        if (applicRefId) {
            dmRef.setAttribute('applicRefId', applicRefId);
        }
    
        // Создаем dmRefIdent и dmCode
        const dmRefIdent = doc.createElement('dmRefIdent');
        const dmCode = doc.createElement('dmCode');
        
        // Устанавливаем атрибуты dmCode
        Object.entries(dmCodeData).forEach(([key, value]) => {
            if (value) {
                dmCode.setAttribute(key, value);
            }
        });
    
        dmRefIdent.appendChild(dmCode);
        dmRef.appendChild(dmRefIdent);
        refs.appendChild(dmRef);
    
        this._emitChange({
            type: 'dmRef:added',
            payload: { rowIndex, dmRefIndex: this.tasks[rowIndex].dmRefs.length - 1 }
        });
    }
    
    updateDmRef(rowIndex, dmRefIndex, dmCodeData, applicRefId = null) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        if (!this.tasks[rowIndex].dmRefs || dmRefIndex < 0 || 
            dmRefIndex >= this.tasks[rowIndex].dmRefs.length) return;
    
        // Обновляем модель
        this.tasks[rowIndex].dmRefs[dmRefIndex].applicRefId = applicRefId;
        this.tasks[rowIndex].dmRefs[dmRefIndex].dmCode = { ...dmCodeData };
    
        // Обновляем XML
        const taskNode = this.taskNodes[rowIndex];
        const dmRefs = taskNode.getElementsByTagName('dmRef');
        if (dmRefIndex < dmRefs.length) {
            const dmRef = dmRefs[dmRefIndex];
            
            // Обновляем applicRefId
            if (applicRefId) {
                dmRef.setAttribute('applicRefId', applicRefId);
            } else {
                dmRef.removeAttribute('applicRefId');
            }
    
            // Обновляем dmCode атрибуты
            const dmCode = dmRef.getElementsByTagName('dmCode')[0];
            if (dmCode) {
                Object.entries(dmCodeData).forEach(([key, value]) => {
                    if (value) {
                        dmCode.setAttribute(key, value);
                    } else {
                        dmCode.removeAttribute(key);
                    }
                });
            }
        }
    
        this._emitChange({
            type: 'dmRef:changed',
            payload: { rowIndex, dmRefIndex }
        });
    }
    
    removeDmRef(rowIndex, dmRefIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        if (!this.tasks[rowIndex].dmRefs || dmRefIndex < 0 || 
            dmRefIndex >= this.tasks[rowIndex].dmRefs.length) return;
    
        this.tasks[rowIndex].dmRefs.splice(dmRefIndex, 1);
    
        // Удаляем из XML
        const taskNode = this.taskNodes[rowIndex];
        const dmRefs = taskNode.getElementsByTagName('dmRef');
        if (dmRefIndex < dmRefs.length) {
            const dmRef = dmRefs[dmRefIndex];
            dmRef.parentNode.removeChild(dmRef);
        }
    
        this._emitChange({
            type: 'dmRef:removed',
            payload: { rowIndex, dmRefIndex }
        });
    }
    
    updateApplicForDmRef(rowIndex, dmRefIndex, applicRefId) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
        if (!this.tasks[rowIndex].dmRefs || dmRefIndex < 0 || 
            dmRefIndex >= this.tasks[rowIndex].dmRefs.length) return false;
    
        const taskNode = this.taskNodes[rowIndex];
        const dmRefs = taskNode.getElementsByTagName('dmRef');

        this.tasks[rowIndex].dmRefs[dmRefIndex].applicRefId = applicRefId;
        if (dmRefIndex < dmRefs.length) {
            const dmRef = dmRefs[dmRefIndex];
            if (applicRefId) {
                dmRef.setAttribute('applicRefId', applicRefId);
            } else {
                dmRef.removeAttribute('applicRefId');
            }
        }
    
        this._emitChange({
            type: 'applicability:changed',
            payload: { rowIndex, dmRefIndex, target: 'dmRef' }
        });
    
        return true;
    }

    removeApplicForDmRef(rowIndex, dmRefIndex) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
        if (!this.tasks[rowIndex].dmRefs || dmRefIndex < 0 || 
            dmRefIndex >= this.tasks[rowIndex].dmRefs.length) return false;
    
        const taskNode = this.taskNodes[rowIndex];
        const dmRefs = taskNode.getElementsByTagName('dmRef');
        
        if (dmRefIndex < dmRefs.length) {
            const dmRef = dmRefs[dmRefIndex];
            dmRef.removeAttribute('applicRefId');
            this.tasks[rowIndex].dmRefs[dmRefIndex].applicRefId = null;
        }
    
        this._emitChange({
            type: 'applicability:removed',
            payload: { rowIndex, dmRefIndex, target: 'dmRef' }
        });
    
        return true;
    }
    
    // Метод для форматирования отображения dmCode
    formatDmCodeDisplay(dmCode) {
        if (!dmCode) return '';
        
        const parts = [
            dmCode.modelIdentCode,
            dmCode.systemDiffCode,
            dmCode.systemCode,
            dmCode.subSystemCode,
            dmCode.subSubSystemCode,
            dmCode.assyCode,
            dmCode.disassyCode,
            dmCode.disassyCodeVariant,
            dmCode.infoCode,
            dmCode.infoCodeVariant,
            dmCode.itemLocationCode
        ].filter(part => part && part !== '');
        
        return parts.join('-');
    }


    generateNewApplicId() {
        // Собираем все существующие числовые ID из applicMap
        const usedNumbers = [];
        
        Object.keys(this.applicMap).forEach(id => {
            const match = id.match(/^app-(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num >= 1 && num <= 999) {
                    usedNumbers.push(num);
                }
            }
        });
        
        // Сортируем по возрастанию
        usedNumbers.sort((a, b) => a - b);
        
        console.log('Used applic numbers:', usedNumbers);
        
        // Ищем первое свободное число
        let newNumber = 1;
        for (let i = 0; i < usedNumbers.length; i++) {
            if (usedNumbers[i] > newNumber) {
                // Нашли пробел - используем это число
                break;
            }
            newNumber = usedNumbers[i] + 1;
        }
        
        // Проверяем пределы
        if (newNumber > 999) {
            // Если достигли предела, ищем любой пробел
            newNumber = 1;
            while (usedNumbers.includes(newNumber) && newNumber <= 999) {
                newNumber++;
            }
            if (newNumber > 999) {
                throw new Error("Достигнут предел количества применимостей (app-999)");
            }
        }
        
        const newId = `app-${newNumber.toString().padStart(3, '0')}`;
        console.log('Generated new applic ID:', newId);
        return newId;
    }

    /**
     * Добавляет новую применимость в модель и XML
     */
    addNewApplicability(applicData) {
        const newId = this.generateNewApplicId();
        
        // Создаем объект применимости
        const newApplic = {
            id: newId,
            displayText: applicData.displayText || '',
            asserts: applicData.asserts || {},
            displayValue: applicData.displayText || this.generateDisplayValueFromAsserts(applicData.asserts)
        };
        
        // Добавляем в модель
        this.applicMap[newId] = newApplic;
        
        // Добавляем в XML
        this.addApplicToXML(newId, applicData);
        
        // Уведомляем об изменении
        this._emitChange({
            type: 'applic:added',
            payload: { applicId: newId }
        });
        
        return newId;
    }

    /**
     * Обновляет существующую применимость
     */
    updateApplicability(applicId, applicData) {
        if (!this.applicMap[applicId]) {
            throw new Error(`Применимость с ID ${applicId} не найдена`);
        }

        // Обновляем объект применимости
        this.applicMap[applicId].displayText = applicData.displayText || '';
        this.applicMap[applicId].asserts = applicData.asserts || {};
        this.applicMap[applicId].displayValue = applicData.displayText || 
            this.generateDisplayValueFromAsserts(applicData.asserts);

        // Обновляем XML
        this.updateApplicInXML(applicId, applicData);
        
        // Уведомляем об изменении
        this._emitChange({
            type: 'applic:updated',
            payload: { applicId: applicId }
        });
    }

    /**
     * Удаляет применимость
     */
    removeApplicability(applicId) {
        if (!this.applicMap[applicId]) {
            throw new Error(`Применимость с ID ${applicId} не найдена`);
        }

        // Удаляем из модели
        delete this.applicMap[applicId];
        
        // Удаляем из XML
        this.removeApplicFromXML(applicId);
        
        // Уведомляем об изменении
        this._emitChange({
            type: 'applic:removed',
            payload: { applicId: applicId }
        });
    }

    /**
     * Генерирует отображаемое значение из asserts
     */
    generateDisplayValueFromAsserts(asserts) {
        if (!asserts) return 'Новая применимость';
        
        if (asserts.serialno) {
            return `Серийный номер: ${asserts.serialno}`;
        } else if (asserts.model) {
            return `Модель: ${asserts.model}`;
        } else if (asserts.type) {
            return `Тип: ${asserts.type}`;
        } else {
            return 'Новая применимость';
        }
    }

    /**
     * Добавляет применимость в XML структуру
     */
    addApplicToXML(applicId, applicData) {
        // Получаем корневой элемент XML
        const xmlRoot = this.$xml[0];
        if (!xmlRoot) {
            console.error('XML root element not found');
            return;
        }

        // Получаем документ из корневого элемента
        const doc = xmlRoot.ownerDocument || xmlRoot;
        if (!doc) {
            console.error('Could not get document from XML root');
            return;
        }

        // Находим или создаем referencedApplicGroup
        let referencedApplicGroup = this.$xml.find('referencedApplicGroup')[0];
        if (!referencedApplicGroup) {
            referencedApplicGroup = doc.createElement('referencedApplicGroup');
            
            // Находим content для добавления
            const content = this.$xml.find('content')[0];
            if (content) {
                content.appendChild(referencedApplicGroup);
            } else {
                console.error('Content element not found in XML');
                return;
            }
        }

        // Создаем элемент applic
        const applicElement = doc.createElement('applic');
        applicElement.setAttribute('id', applicId);

        // Добавляем displayText если есть
        if (applicData.displayText) {
            const displayTextElement = doc.createElement('displayText');
            const simpleParaElement = doc.createElement('simplePara');
            simpleParaElement.textContent = applicData.displayText;
            displayTextElement.appendChild(simpleParaElement);
            applicElement.appendChild(displayTextElement);
        }

        // Добавляем assert'ы если есть
        if (applicData.asserts && Object.keys(applicData.asserts).length > 0) {
            const evaluateElement = doc.createElement('evaluate');

            Object.entries(applicData.asserts).forEach(([ident, values]) => {
                if (values) {
                    const assertElement = doc.createElement('assert');
                    assertElement.setAttribute('applicPropertyIdent', ident);
                    assertElement.setAttribute('applicPropertyValues', values);
                    evaluateElement.appendChild(assertElement);
                }
            });

            if (evaluateElement.children.length > 0) {
                applicElement.appendChild(evaluateElement);
            }
        }

        referencedApplicGroup.appendChild(applicElement);
    }

    /**
     * Обновляет применимость в XML
     */
    updateApplicInXML(applicId, applicData) {
        // Находим существующий элемент
        const applicElement = this.$xml.find(`applic[id="${applicId}"]`)[0];
        if (!applicElement) {
            // Если не найден, создаем новый
            this.addApplicToXML(applicId, applicData);
            return;
        }

        // Очищаем существующий элемент
        while (applicElement.firstChild) {
            applicElement.removeChild(applicElement.firstChild);
        }

        // Получаем документ
        const doc = applicElement.ownerDocument;

        // Добавляем displayText если есть
        if (applicData.displayText) {
            const displayTextElement = doc.createElement('displayText');
            const simpleParaElement = doc.createElement('simplePara');
            simpleParaElement.textContent = applicData.displayText;
            displayTextElement.appendChild(simpleParaElement);
            applicElement.appendChild(displayTextElement);
        }

        // Добавляем assert'ы если есть
        if (applicData.asserts && Object.keys(applicData.asserts).length > 0) {
            const evaluateElement = doc.createElement('evaluate');

            Object.entries(applicData.asserts).forEach(([ident, values]) => {
                if (values) {
                    const assertElement = doc.createElement('assert');
                    assertElement.setAttribute('applicPropertyIdent', ident);
                    assertElement.setAttribute('applicPropertyValues', values);
                    evaluateElement.appendChild(assertElement);
                }
            });

            if (evaluateElement.children.length > 0) {
                applicElement.appendChild(evaluateElement);
            }
        }
    }

    /**
     * Удаляет применимость из XML
     */
    removeApplicFromXML(applicId) {
        const applicElement = this.$xml.find(`applic[id="${applicId}"]`)[0];
        if (applicElement && applicElement.parentNode) {
            applicElement.parentNode.removeChild(applicElement);
        }

        // Если referencedApplicGroup пуст, удаляем его тоже
        const referencedApplicGroup = this.$xml.find('referencedApplicGroup')[0];
        if (referencedApplicGroup && referencedApplicGroup.children.length === 0) {
            if (referencedApplicGroup.parentNode) {
                referencedApplicGroup.parentNode.removeChild(referencedApplicGroup);
            }
        }
    }

    updateChangeType(rowIndex, changeType) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        
        const node = this.taskNodes[rowIndex];
        
        // Устанавливаем или удаляем атрибут changeType
        if (changeType) {
            node.setAttribute('changeType', changeType);
        } else {
            node.removeAttribute('changeType');
        }
        
        // Обновляем модель данных
        this.tasks[rowIndex].changeType = changeType;
        
        this.changeListeners.forEach(fn => fn(this.getXML()));
    }

    updateSectionTitle(oldTitle, newTitle) {
        if (!oldTitle || !newTitle || oldTitle === newTitle) return;
        
        let hasChanges = false;
        
        // Обновляем taskTitle во всех задачах этого раздела
        this.tasks.forEach((task, index) => {
            if (task.taskTitle === oldTitle) {
                // Обновляем модель
                task.taskTitle = newTitle;
                
                // Обновляем XML
                const taskNode = this.taskNodes[index];
                const taskTitleElement = taskNode.getElementsByTagName('taskTitle')[0];
                if (taskTitleElement) {
                    taskTitleElement.textContent = newTitle;
                    hasChanges = true;
                }
            }
        });
        
        if (hasChanges) {
            this._emitChange({
                type: 'section:titleChanged',
                payload: { oldTitle, newTitle }
            });
        }
    }

    addNewSection() {
        try {
            const defaultTitle = "Новый раздел";
            
            // Создаем задачу с новым разделом
            this.addTaskToSection(defaultTitle);
            
            // Находим индекс только что созданной задачи
            const newTaskIndex = this.tasks.findIndex(task => task.taskTitle === defaultTitle);
            
            if (newTaskIndex !== -1) {
                this._emitChange({
                    type: 'section:added',
                    payload: { sectionTitle: defaultTitle, taskIndex: newTaskIndex }
                });
            }
            
            return defaultTitle;
        } catch (error) {
            console.error("Ошибка при создании нового раздела:", error);
            return null;
        }
    }

    /**
 * Изменяет раздел для конкретной задачи
 */
updateTaskSection(rowIndex, newSectionTitle) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    
    const taskNode = this.taskNodes[rowIndex];
    const taskTitleElement = taskNode.getElementsByTagName('taskTitle')[0];
    
    if (!taskTitleElement) {
        console.error('Элемент taskTitle не найден в задаче');
        return;
    }
    
    // Обновляем XML
    taskTitleElement.textContent = newSectionTitle;
    
    // Обновляем модель данных
    this.tasks[rowIndex].taskTitle = newSectionTitle;
    
    // Уведомляем об изменении - нужна полная перерисовка, так как изменилась структура разделов
    this._emitChange({
        type: 'task:sectionChanged',
        payload: { rowIndex, newSectionTitle }
    });
    
    this.changeListeners.forEach(fn => fn(this.getXML()));
}

/**
 * Вставляет элемент в правильную позицию согласно порядку S1000D
 */
insertElementInCorrectOrder(parentNode, newElement, elementType) {
    try {
  
      // Проверяем валидность параметров
      if (!parentNode || !newElement) {
        console.error('Invalid parameters for insertElementInCorrectOrder');
        return;
      }
  
      // Проверяем, что newElement не уже является потомком parentNode
      if (newElement.parentNode === parentNode) {
        console.warn('Element is already a child of parentNode');
        return;
      }
  
      const order = [
        'task',
        'rqmtSource', 
        'preliminaryRqmts',
        'refs',
        'supervisorLevel',
        'limit',
        'remarks',
        'relatedTask'
      ];
      
      const currentIndex = order.indexOf(elementType);
      if (currentIndex === -1) {
        console.log('Element type not in order, appending to the end');
        parentNode.appendChild(newElement);
        return;
      }
      
      // Получаем ТОЛЬКО ПРЯМЫЕ потомки-элементы
      const children = [];
      for (let i = 0; i < parentNode.childNodes.length; i++) {
        const child = parentNode.childNodes[i];
        if (child.nodeType === Node.ELEMENT_NODE) {
          children.push(child);
        }
      }
  
      console.log('Direct children of parentNode:', children.map(c => c.nodeName));
  
      // Ищем следующий элемент в порядке среди ПРЯМЫХ потомков
      for (let i = currentIndex + 1; i < order.length; i++) {
        const nextElementType = order[i];
        console.log('Looking for next element type:', nextElementType);
        
        const nextElement = children.find(child => 
          child.nodeName.toLowerCase() === nextElementType.toLowerCase()
        );
        
        if (nextElement && nextElement.parentNode === parentNode) {
          console.log('Found next element:', nextElement);
          parentNode.insertBefore(newElement, nextElement);
          console.log('Successfully inserted new element before', nextElementType);
          return;
        }
      }
      
      // Если следующих элементов нет, добавляем в конец
      console.log('No next element found, appending to the end');
      parentNode.appendChild(newElement);
      
    } catch (error) {
      console.error('Error in insertElementInCorrectOrder:', error);
      // Fallback: добавляем в конец
      if (parentNode && newElement) {
        try {
          parentNode.appendChild(newElement);
        } catch (fallbackError) {
          console.error('Even fallback failed:', fallbackError);
        }
      }
    }
  }

addTaskDuration(rowIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;

    const newDuration = {
        procedureDuration: '0',
        startupDuration: '0', 
        applicRefId: null
    };

    if (!this.tasks[rowIndex].taskDurations) {
        this.tasks[rowIndex].taskDurations = [];
    }
    this.tasks[rowIndex].taskDurations.push(newDuration);

    // Создаем XML структуру
    const taskNode = this.taskNodes[rowIndex];
    const doc = taskNode.ownerDocument;

    // Находим preliminaryRqmts
    let preliminaryRqmts = Array.from(taskNode.getElementsByTagName('preliminaryRqmts'))[0];
    if (!preliminaryRqmts) {
        preliminaryRqmts = doc.createElement('preliminaryRqmts');
        this.insertElementInCorrectOrder(taskNode, preliminaryRqmts, 'preliminaryRqmts');
    }

    // Создаем новый productionMaintData для этого taskDuration
    const taskDurationPmd = doc.createElement('productionMaintData');
    
    // Создаем taskDuration
    const taskDuration = doc.createElement('taskDuration');
    taskDuration.setAttribute('procedureDuration', newDuration.procedureDuration);
    taskDuration.setAttribute('startupDuration', newDuration.startupDuration);
    taskDurationPmd.appendChild(taskDuration);

    // Находим все productionMaintData элементы
    const allProductionMaintData = preliminaryRqmts.getElementsByTagName('productionMaintData');
    
    if (allProductionMaintData.length > 0) {
        // Есть существующие productionMaintData - вставляем после последнего
        const lastProductionMaintData = allProductionMaintData[allProductionMaintData.length - 1];
        lastProductionMaintData.parentNode.insertBefore(taskDurationPmd, lastProductionMaintData.nextSibling);
    } else {
        // Нет productionMaintData - ищем reqCondGroup для вставки перед ним
        const reqCondGroup = preliminaryRqmts.getElementsByTagName('reqCondGroup')[0];
        if (reqCondGroup) {
            // Вставляем перед reqCondGroup
            reqCondGroup.parentNode.insertBefore(taskDurationPmd, reqCondGroup);
        } else {
            // Если reqCondGroup тоже нет, вставляем в конец preliminaryRqmts
            preliminaryRqmts.appendChild(taskDurationPmd);
        }
    }

    this._emitChange({
        type: 'taskDuration:added',
        payload: { 
            rowIndex, 
            durationIndex: this.tasks[rowIndex].taskDurations.length - 1 
        }
    });
}

/**
 * Находит productionMaintData предназначенный для taskDuration
 */
findTaskDurationProductionMaintData(preliminaryRqmts) {
    const allPmds = preliminaryRqmts.getElementsByTagName('productionMaintData');
    
    for (let pmd of allPmds) {
        // Если в productionMaintData есть taskDuration - это наш
        if (pmd.getElementsByTagName('taskDuration').length > 0) {
            return pmd;
        }
    }
    
    // Если нет productionMaintData с taskDuration, но есть несколько productionMaintData,
    // берем второй (первый - для workAreaLocationGroup)
    if (allPmds.length >= 2) {
        return allPmds[1];
    }
    
    return null;
}

/**
 * Обновляет поле блока трудоёмкости
 */
updateTaskDurationField(rowIndex, durationIndex, field, value) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].taskDurations || durationIndex < 0 || 
        durationIndex >= this.tasks[rowIndex].taskDurations.length) return;

    // Обновляем модель
    this.tasks[rowIndex].taskDurations[durationIndex][field] = value;

    // Обновляем XML
    const taskNode = this.taskNodes[rowIndex];
    const preliminaryRqmts = taskNode.getElementsByTagName('preliminaryRqmts')[0];
    if (!preliminaryRqmts) return;

    // Находим productionMaintData с taskDuration по индексу (исключая те, что содержат workAreaLocationGroup)
    const taskDurationPmds = this.getTaskDurationProductionMaintData(preliminaryRqmts);
    if (durationIndex < taskDurationPmds.length) {
        const taskDurationPmd = taskDurationPmds[durationIndex];
        const taskDuration = taskDurationPmd.getElementsByTagName('taskDuration')[0];
        if (taskDuration) {
            taskDuration.setAttribute(field, value);
        }
    }

    this._emitChange({
        type: 'taskDuration:changed',
        payload: { rowIndex, durationIndex, field, value }
    });
}

/**
 * Удаляет блок трудоёмкости
 */
removeTaskDuration(rowIndex, durationIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].taskDurations || durationIndex < 0 || 
        durationIndex >= this.tasks[rowIndex].taskDurations.length) return;

    // Удаляем из модели
    this.tasks[rowIndex].taskDurations.splice(durationIndex, 1);

    // Удаляем из XML
    const taskNode = this.taskNodes[rowIndex];
    const preliminaryRqmts = taskNode.getElementsByTagName('preliminaryRqmts')[0];
    if (!preliminaryRqmts) return;

    // Находим productionMaintData с taskDuration по индексу
    const taskDurationPmds = this.getTaskDurationProductionMaintData(preliminaryRqmts);
    if (durationIndex < taskDurationPmds.length) {
        const taskDurationPmd = taskDurationPmds[durationIndex];
        taskDurationPmd.parentNode.removeChild(taskDurationPmd);
    }

    this._emitChange({
        type: 'taskDuration:removed',
        payload: { rowIndex, durationIndex }
    });
}

/**
 * Обновляет применимость для productionMaintData с taskDuration
 */
updateTaskDurationApplic(rowIndex, durationIndex, applicId) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
    if (!this.tasks[rowIndex].taskDurations || durationIndex < 0 || 
        durationIndex >= this.tasks[rowIndex].taskDurations.length) return false;

    const taskNode = this.taskNodes[rowIndex];
    const preliminaryRqmts = taskNode.getElementsByTagName('preliminaryRqmts')[0];
    if (!preliminaryRqmts) return false;

    // Находим productionMaintData с taskDuration по индексу
    const taskDurationPmds = this.getTaskDurationProductionMaintData(preliminaryRqmts);
    if (durationIndex < taskDurationPmds.length) {
        const taskDurationPmd = taskDurationPmds[durationIndex];
        
        // Устанавливаем applicRefId на productionMaintData
        if (applicId) {
            taskDurationPmd.setAttribute('applicRefId', applicId);
        } else {
            taskDurationPmd.removeAttribute('applicRefId');
        }
    }

    this.tasks[rowIndex].taskDurations[durationIndex].applicRefId = applicId;

    this._emitChange({
        type: 'applicability:changed',
        payload: { rowIndex, durationIndex, applicId, field: 'taskDuration' }
    });

    return true;
}

getTaskDurationProductionMaintData(preliminaryRqmts) {
    const allPmds = preliminaryRqmts.getElementsByTagName('productionMaintData');
    const taskDurationPmds = [];
    
    for (let pmd of allPmds) {
        // Исключаем productionMaintData, которые содержат workAreaLocationGroup
        if (pmd.getElementsByTagName('workAreaLocationGroup').length === 0) {
            // Включаем только те, что содержат taskDuration
            if (pmd.getElementsByTagName('taskDuration').length > 0) {
                taskDurationPmds.push(pmd);
            }
        }
    }
    
    return taskDurationPmds;
}

/**
 * Удаляет применимость с productionMaintData для taskDuration
 */
removeApplicForTaskDuration(rowIndex, durationIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return false;
    if (!this.tasks[rowIndex].taskDurations || durationIndex < 0 || 
        durationIndex >= this.tasks[rowIndex].taskDurations.length) return false;

    const taskNode = this.taskNodes[rowIndex];
    const preliminaryRqmts = taskNode.getElementsByTagName('preliminaryRqmts')[0];
    if (!preliminaryRqmts) return false;

    // Находим productionMaintData с taskDuration по индексу
    const taskDurationPmds = this.getTaskDurationProductionMaintData(preliminaryRqmts);
    if (durationIndex < taskDurationPmds.length) {
        const taskDurationPmd = taskDurationPmds[durationIndex];
        taskDurationPmd.removeAttribute('applicRefId');
    }

    this.tasks[rowIndex].taskDurations[durationIndex].applicRefId = null;

    this._emitChange({
        type: 'applicability:removed',
        payload: { rowIndex, durationIndex, target: 'taskDuration' }
    });

    return true;
}

  

  


    _emitChange(meta = {}) {
        const xml = this.getXML ? this.getXML() : this.$xml;
        // shallow copy listeners to avoid mutation during iteration
        const listeners = Array.isArray(this.changeListeners) ? this.changeListeners.slice() : [];
        listeners.forEach(fn => {
            try {
            // устойчивая сигнатура: fn(xml, meta) если fn принимает 2 аргумента,
            // но многие слушатели могут принимать только (xml) — вызываем оба
            fn(xml, meta);
            } catch (err) {
            console.error('ScheduleTableModel changeListener error', err);
            }
        });
    }

    /* REMARKS */

    updateLimitRemarks(rowIndex, limitIndex, remarks) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        if (!this.tasks[rowIndex].limits || limitIndex < 0 || limitIndex >= this.tasks[rowIndex].limits.length) return;
      
        const taskNode = this.taskNodes[rowIndex];
        const limits = taskNode.getElementsByTagName('limit');
        if (limitIndex >= limits.length) return;
      
        const limit = limits[limitIndex];
        
        // Находим или создаем структуру remarks/simplePara
        let remarksElement = limit.getElementsByTagName('remarks')[0];
        if (!remarksElement) {
          remarksElement = taskNode.ownerDocument.createElement('remarks');
          // Вставляем remarks ПОСЛЕДНИМ в limit
          limit.appendChild(remarksElement);
        }
        
        let simplePara = remarksElement.getElementsByTagName('simplePara')[0];
        if (!simplePara) {
          simplePara = taskNode.ownerDocument.createElement('simplePara');
          remarksElement.appendChild(simplePara);
        }
        
        simplePara.textContent = remarks;
      
        // Обновляем модель данных
        if (!this.tasks[rowIndex].limits[limitIndex].remarks) {
          this.tasks[rowIndex].limits[limitIndex].remarks = {};
        }
        this.tasks[rowIndex].limits[limitIndex].remarks.text = remarks;
      
        this._emitChange({
          type: 'remarks:changed',
          payload: { rowIndex, limitIndex, target: 'limit', remarks }
        });
      }

      updateWorkAreaRemarks(rowIndex, groupIndex, remarks) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
        if (!this.tasks[rowIndex].workAreaLocationGroups || groupIndex < 0 || 
            groupIndex >= this.tasks[rowIndex].workAreaLocationGroups.length) return;
      
        const taskNode = this.taskNodes[rowIndex];
        const workAreaPmd = this.getWorkAreaProductionMaintData(taskNode);
        const groups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
        
        if (groupIndex >= groups.length) return;
      
        const group = groups[groupIndex];
        
        // Находим или создаем workLocation
        let workLocation = group.getElementsByTagName('workLocation')[0];
        if (!workLocation) {
          workLocation = taskNode.ownerDocument.createElement('workLocation');
          // Вставляем workLocation ПЕРВЫМ в группу
          if (group.firstChild) {
            group.insertBefore(workLocation, group.firstChild);
          } else {
            group.appendChild(workLocation);
          }
        }
        
        // Находим или создаем workArea
        let workArea = workLocation.getElementsByTagName('workArea')[0];
        if (!workArea) {
          workArea = taskNode.ownerDocument.createElement('workArea');
          // Вставляем workArea ПЕРВЫМ в workLocation
          if (workLocation.firstChild) {
            workLocation.insertBefore(workArea, workLocation.firstChild);
          } else {
            workLocation.appendChild(workArea);
          }
        }
        
        workArea.textContent = remarks;
      
        // Обновляем модель данных
        if (!this.tasks[rowIndex].workAreaLocationGroups[groupIndex].remarks) {
          this.tasks[rowIndex].workAreaLocationGroups[groupIndex].remarks = {};
        }
        this.tasks[rowIndex].workAreaLocationGroups[groupIndex].remarks.text = remarks;
      
        this._emitChange({
          type: 'remarks:changed',
          payload: { rowIndex, groupIndex, target: 'workArea', remarks }
        });
      }

      updateTaskRemarks(rowIndex, remarks) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
      
        const node = this.taskNodes[rowIndex];
        
        // Находим или создаем структуру remarks/simplePara
        let remarksElement = node.getElementsByTagName('remarks')[0];
        if (!remarksElement) {
          remarksElement = node.ownerDocument.createElement('remarks');
          this.insertElementInCorrectOrder(node, remarksElement, 'remarks');
        }
        
        let simplePara = remarksElement.getElementsByTagName('simplePara')[0];
        if (!simplePara) {
          simplePara = node.ownerDocument.createElement('simplePara');
          remarksElement.appendChild(simplePara);
        }
        
        simplePara.textContent = remarks;
      
        // Обновляем модель данных
        this.tasks[rowIndex].remarks = remarks;
      
        this._emitChange({
          type: 'remarks:changed',
          payload: { rowIndex, target: 'task', remarks }
        });
      }

      getRemarks(targetType, rowIndex, index = null) {
        if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return '';
        
        const taskNode = this.taskNodes[rowIndex];
        
        switch (targetType) {
          case 'limit':
            if (!this.tasks[rowIndex].limits || index < 0 || index >= this.tasks[rowIndex].limits.length) return undefined;
            
            const limits = taskNode.getElementsByTagName('limit');
            if (index >= limits.length) return undefined;
            
            const limit = limits[index];
            const limitRemarks = limit.getElementsByTagName('remarks')[0];
            if (limitRemarks) {
              const simplePara = limitRemarks.getElementsByTagName('simplePara')[0];
              return simplePara ? simplePara.textContent : undefined;
            }
            return undefined;
          
          case 'workArea':
            if (!this.tasks[rowIndex].workAreaLocationGroups || index < 0 || 
                index >= this.tasks[rowIndex].workAreaLocationGroups.length) return undefined;
            
            const workAreaPmd = this.getWorkAreaProductionMaintData(taskNode);
            const groups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
            if (index >= groups.length) return undefined;
            
            const group = groups[index];
            const workLocation = group.getElementsByTagName('workLocation')[0];
            if (workLocation) {
              const workArea = workLocation.getElementsByTagName('workArea')[0];
              return workArea ? workArea.textContent : undefined;
            }
            return undefined;
          
          case 'task':
            const taskRemarks = taskNode.getElementsByTagName('remarks')[0];
            if (taskRemarks) {
              const simplePara = taskRemarks.getElementsByTagName('simplePara')[0];
              return simplePara ? simplePara.textContent : undefined;
            }
            return undefined;
          
          default:
            return undefined;
        }
      }

      /**
 * Проверяет есть ли примечание у элемента
 */
      hasRemarks(targetType, rowIndex, index = null) {
        // Используем this.tasks вместо this.model.tasks, так как мы уже в модели
        if (rowIndex < 0 || rowIndex >= this.tasks.length) return false;
        
        const task = this.tasks[rowIndex];
        if (!task) return false;
        
        switch (targetType) {
          case 'limit':
            if (!task.limits || index < 0 || index >= task.limits.length) return false;
            const limit = task.limits[index];
            return limit.remarks && limit.remarks.text && limit.remarks.text.length > 0;
          
          case 'workArea':
            if (!task.workAreaLocationGroups || index < 0 || index >= task.workAreaLocationGroups.length) return false;
            const group = task.workAreaLocationGroups[index];
            return group.remarks && group.remarks.text && group.remarks.text.length > 0;
          
          case 'task':
            return task.remarks && task.remarks.length > 0;
          
          default:
            return false;
        }
      }

/**
 * Быстро добавляет пустое примечание к элементу
 */
addRemarksQuick(targetType, rowIndex, index = null) {
    // Создаем пустое примечание
    const defaultText = "";
    
    let result = false;
    switch (targetType) {
      case 'limit':
        result = this.updateLimitRemarks(rowIndex, index, defaultText);
        break;
      case 'workArea':
        result = this.updateWorkAreaRemarks(rowIndex, index, defaultText);
        break;
      case 'task':
        result = this.updateTaskRemarks(rowIndex, defaultText);
        break;
      default:
        return false;
    }
    
    // Принудительно обновляем интерфейс после добавления
    if (result) {
      this._emitChange({
        type: 'remarks:added',
        payload: { rowIndex, targetType, index, remarks: defaultText }
      });
    }
    
    return result;
  }
  

    /* REMARKS END*/



    /* ZONE */

    getZoneGroups(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.tasks.length) return [];
        const task = this.tasks[rowIndex];
        return (task.workAreaLocationGroups || []).filter(group => 
            group.type === 'zone' || group.zones.length > 0
        );
    }

        /**
     * Получает только группы с точками доступа
     */
    getAccessPointGroups(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.tasks.length) return [];
        const task = this.tasks[rowIndex];
        return (task.workAreaLocationGroups || []).filter(group => 
            group.type === 'access' || group.accessPoints.length > 0
        );
    }

    /**
 * Определяет, является ли группа зональной
 */
isZoneGroup(rowIndex, groupIndex) {
    const task = this.tasks[rowIndex];
    if (!task || !task.workAreaLocationGroups || groupIndex >= task.workAreaLocationGroups.length) return false;
    const group = task.workAreaLocationGroups[groupIndex];
    return group.zones && group.zones.length > 0;
}

/**
 * Определяет, является ли группой доступа
 */
isAccessGroup(rowIndex, groupIndex) {
    const task = this.tasks[rowIndex];
    if (!task || !task.workAreaLocationGroups || groupIndex >= task.workAreaLocationGroups.length) return false;
    const group = task.workAreaLocationGroups[groupIndex];
    return group.accessPoints && group.accessPoints.length > 0;
}

addAccessPointToGroup(rowIndex, groupIndex) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].workAreaLocationGroups || groupIndex < 0 || 
        groupIndex >= this.tasks[rowIndex].workAreaLocationGroups.length) return;

    const taskNode = this.taskNodes[rowIndex];
    const workAreaPmd = this.getWorkAreaProductionMaintData(taskNode);
    const groups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
    
    if (groupIndex >= groups.length) return;

    const group = groups[groupIndex];
    const doc = taskNode.ownerDocument;
    const accessPointRef = doc.createElement('accessPointRef');
    accessPointRef.setAttribute('accessPointNumber', '');
    // Не добавляем accessPointTypeValue
    group.appendChild(accessPointRef);

    // Обновляем модель
    this.tasks[rowIndex].workAreaLocationGroups[groupIndex].accessPoints.push({ 
        accessPointNumber: ''
    });

    this._emitChange({
        type: 'accessPoint:added',
        payload: { 
            rowIndex, 
            groupIndex, 
            accessIndex: this.tasks[rowIndex].workAreaLocationGroups[groupIndex].accessPoints.length - 1 
        }
    });
}

updateAccessPointField(rowIndex, groupIndex, accessIndex, field, value) {
    if (rowIndex < 0 || rowIndex >= this.taskNodes.length) return;
    if (!this.tasks[rowIndex].workAreaLocationGroups || groupIndex < 0 || 
        groupIndex >= this.tasks[rowIndex].workAreaLocationGroups.length) return;
    if (accessIndex < 0 || accessIndex >= this.tasks[rowIndex].workAreaLocationGroups[groupIndex].accessPoints.length) return;

    // Обновляем модель
    this.tasks[rowIndex].workAreaLocationGroups[groupIndex].accessPoints[accessIndex][field] = value;

    // Обновляем XML (без accessPointTypeValue)
    const taskNode = this.taskNodes[rowIndex];
    const preliminaryRqmts = taskNode.getElementsByTagName('preliminaryRqmts')[0];
    if (!preliminaryRqmts) return;

    const workAreaPmd = this.findWorkAreaProductionMaintData(preliminaryRqmts);
    if (!workAreaPmd) return;

    const workAreaGroups = workAreaPmd.getElementsByTagName('workAreaLocationGroup');
    if (groupIndex >= workAreaGroups.length) return;

    const workAreaGroup = workAreaGroups[groupIndex];
    const accessPointRefs = workAreaGroup.getElementsByTagName('accessPointRef');
    if (accessIndex >= accessPointRefs.length) return;

    const accessPointRef = accessPointRefs[accessIndex];
    accessPointRef.setAttribute(field, value);
    
    this._emitChange({
        type: 'accessPoint:changed',
        payload: { rowIndex, groupIndex, accessIndex, field, value }
    });
}

    /* ZONE END */
}

