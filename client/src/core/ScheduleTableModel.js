
class ScheduleTableModel {
    constructor(xmlDoc) {
        this.$xml = $(xmlDoc);
        this.taskNodes = [];
        this.tasks = [];
        this.title = '';
        this.desiredHeaders = [
            { key: 'changeCode', label: 'КОД ИЗМЕНЕНИЯ', editable: false },
            { key: 'taskIdent',  label: 'НОМЕР ЗАДАЧИ ИДПТО', editable: false, path: ['@taskIdent'] },
            { key: 'rqmtSource', label: 'ДОКУМЕНТ ИСХОДНЫЙ', editable: true,
              path: ['rqmtSource','externalPubRef','externalPubRefIdent','externalPubTitle'] },
            { key: 'zoneNumber', label: 'ЗОНА', editable: true,
              path: ['preliminaryRqmts','productionMaintData','workAreaLocationGroup','zoneRef','@zoneNumber'] },
            { key: 'accessPoint', label: 'ДОСТУП', editable: true,
              path: ['preliminaryRqmts','productionMaintData','workAreaLocationGroup','accessPointRef','@accessPointNumber'] },
            { key: 'taskCode',  label: 'КОД ЗАДАЧИ', editable: false },
            { key: 'taskDescr', label: 'ОПИСАНИЕ ЗАДАЧИ', editable: true, allowApplic: true,
              path: ['task','taskDescr', 'simplePara'] },
            { 
                key: 'limit',
                label: 'РАБОТ ПОРОГ / ИНТЕРВАЛ',
                editable: true,
                path: ['limit']       // мы не будем использовать стандартный слежущий путь,
                                        // а самостоятельно парсить содержимое <limit>…
            },
            { key: 'closeupDur', label: 'AMTOSS', editable: true, allowApplic: true,
              path: ['preliminaryRqmts','productionMaintData','taskDuration','@closeupDuration'] },
            { key: 'numRequired', label: 'КОЛ‑ВО ЧЕЛОВЕК', editable: true, allowApplic: true,
              path: ['reqPersons','personnel','@numRequired'] },
            { key: 'personCat', label: 'СПЕЦИАЛИЗАЦИЯ', editable: true,
              path: ['reqPersons','personnel','personCategory','@personCategoryCode'] },
            { key: 'pass1', label: 'РАБОТЫ ПОДГОТОВИТЕЛЬНЫЕ', editable: true },
            { key: 'pass2', label: 'ЗАДАЧА', editable: true },
            { key: 'applicability', label: 'ПРИМЕНИМОСТЬ', editable: false, allowApplic: true }
        ];
        // this.desiredHeaders = [
        //     { key: 'changeCode', label: 'КОД ИЗМЕНЕНИЯ', editable: false },
        //     { key: 'taskIdent',  label: 'НОМЕР ЗАДАЧИ ИДПТО', editable: false },
        //     { key: 'taskCode',   label: 'КОД ЗАДАЧИ', editable: false },
        //     {
        //         key:  'rqmtSource',
        //         label:'ДОКУМЕНТ ИСХОДНЫЙ',
        //         editable: true,
        //         // deep path: ищем текст в <rqmtSource>…<externalPubTitle>
        //         path: ['rqmtSource','externalPubRef','externalPubRefIdent','externalPubTitle']
        //     },
        //     {
        //         key:  'zoneNumber',
        //         label:'ЗОНА',
        //         editable: true,
        //         path: ['preliminaryRqmts','productionMaintData','workAreaLocationGroup','zoneRef','@zoneNumber']
        //     },
        //     {
        //         key:  'accessPoint',
        //         label:'ДОСТУП',
        //         editable: true,
        //         path: ['preliminaryRqmts','productionMaintData','workAreaLocationGroup','accessPointRef','@accessPointNumber']
        //     },
        //     {
        //         key: 'taskTitle',
        //         label:'ОПИСАНИЕ ЗАДАЧИ',
        //         editable: true,
        //         allowApplic: true,
        //         path: ['task','taskTitle']
        //     },
        //     {
        //         key: 'startupDur',
        //         label:'РАБОТ ПОРОГ НАЧАЛА',
        //         editable: true,
        //         path: ['preliminaryRqmts','productionMaintData','taskDuration','@startupDuration']
        //     },
        //     {
        //         key: 'procDur',
        //         label:'ИНТЕРВАЛ',
        //         editable: true,
        //         path: ['preliminaryRqmts','productionMaintData','taskDuration','@procedureDuration']
        //     },
        //     {
        //         key: 'closeupDur',
        //         label:'AMTOSS',
        //         editable: true,
        //         allowApplic: true,
        //         path: ['preliminaryRqmts','productionMaintData','taskDuration','@closeupDuration']
        //     },
        //     {
        //         key: 'numRequired',
        //         label:'КОЛ‑ВО ЧЕЛОВЕК',
        //         editable: true,
        //         allowApplic: true,
        //         path: ['reqPersons','personnel','@numRequired']
        //     },
        //     {
        //         key: 'personCat',
        //         label:'СПЕЦИАЛИЗАЦИЯ',
        //         editable: true,
        //         path: ['reqPersons','personnel','personCategory','@personCategoryCode']
        //     },
        //     {
        //         key: 'pass',
        //         label:'pass',
        //         editable: true,
        //         // path: ['reqPersons','personnel','personCategory','@personCategoryCode']
        //     },
        //     {
        //         key: 'pass',
        //         label:'pass',
        //         editable: true,
        //         // path: ['reqPersons','personnel','personCategory','@personCategoryCode']
        //     },
        //     // …можете добавить ещё поля‑заглушки
        //     {
        //         key: 'applicability',
        //         label: 'ПРИМЕНИМОСТЬ',
        //         editable: false,
        //         allowApplic: true
        //     }
        // ];


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
        this.title = $commonInfo.find('title').text().trim();

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

            self.desiredHeaders.forEach(col => {
                if (col.key === 'limit') return; // limit обработаем отдельно
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
                            break;
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

            task.taskTitle = $node.find('task > taskTitle').text().trim();

            const applicId = $node.attr('applicRefId'); // todo: передалть под все теги 
            if (applicId && this.applicMap[applicId]) {
                task.applicabilities = [this.applicMap[applicId]];
            }

            // Блоки limit
            task.limits = [];
            $node.find('limit').each((i, lim) => {
                const $lim = $(lim);
                const block = {};
                // Тип выполнения
                block.applicRefId = $lim.attr('applicRefId') || null;

                // Тип выполнения
                block.limitType = $lim.attr('limitTypeValue') || '';
                // Условие
                if (block.limitType === 'oc') {
                    block.limitCond = $lim.attr('limitCond') || '';
                }
                // Интервал
                const $interval = $lim.children('threshold[thresholdType="interval"]').first();
                block.intervalValue = $interval.find('> thresholdValue').text().trim();
                block.intervalUnit  = $interval.attr('thresholdUnitOfMeasure') || '';
                // Порог
                const $thr = $lim.children('trigger').children('threshold[thresholdType="threshold"]').first();
                block.thresholdValue = $thr.find('> thresholdValue').text().trim();
                block.thresholdUnit  = $thr.attr('thresholdUnitOfMeasure') || '';
                task.limits.push(block);
            });

            self.taskNodes.push($node[0]); // или simply: self.taskNodes.push(el);
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

    updateTaskField(rowIndex, key, value) {
        if (!this.tasks[rowIndex]) return;
        this.tasks[rowIndex][key] = value;

        const node = this.taskNodes[rowIndex];
        const $node = $(node);

        const header = this.headers.find(h => h.key === key);
        if (!header || !header.path) return;

        let cursor = $node;
        const path = header.path;
        for (let i = 0; i < path.length; i++) {
            const step = path[i];
            if (step.startsWith('@')) {
                const attrName = step.slice(1);
                cursor.attr(attrName, value);
                break;
            } else {
                let found = cursor.find(step).first();
                if (!found.length) {
                    // Создаём узел, если его нет
                    const newEl = $('<' + step + '>');
                    cursor.append(newEl);
                    found = newEl;
                }
                if (i === path.length - 1) {
                    found.text(value);
                }
                cursor = found;
            }
        }

        // notify listeners
        this.changeListeners.forEach(fn => fn(this.getXML()));
    }

    addTaskNode($node) {
        this.taskNodes.push($node[0]);
        const task = {};
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

    addTaskToSection(taskCode, taskTitle) {
        const $taskDef = $('<taskDefinition>', {
            taskIdent: 'new-task-' + Date.now(),
            taskCode: taskCode
        });

        const $task = $('<task>').append($('<taskTitle>').text(taskTitle));
        $taskDef.append($task);

        // Найти индекс, куда вставлять новую задачу
        let insertIndex = this.taskNodes.findIndex(n => {
            const code = $(n).attr('taskCode');
            return code === taskCode;
        });

        const task = {};
        this.headers.forEach(h => {
            task[h.key] = (h.key === 'taskCode') ? taskCode :
                        (h.key === 'taskTitle') ? taskTitle : '';
        });

        const $container = this.$xml.find('maintPlanning > taskDefinitionAlts');

        if (insertIndex !== -1) {
            // Вставка в XML после последнего найденного узла с этим taskCode
            let lastIndex = insertIndex;
            while (
                lastIndex + 1 < this.taskNodes.length &&
                $(this.taskNodes[lastIndex + 1]).attr('taskCode') === taskCode
            ) {
                lastIndex++;
            }

            $(this.taskNodes[lastIndex]).after($taskDef);               // XML вставка
            this.taskNodes.splice(lastIndex + 1, 0, $taskDef[0]);       // модель
            this.tasks.splice(lastIndex + 1, 0, task);                  // данные
        } else {
            // taskCode ещё нет — вставим в конец taskDefinitionAlts
            $container.append($taskDef);
            this.taskNodes.push($taskDef[0]);
            this.tasks.push(task);
        }

        // Оповещаем слушателей (например, ScheduleView)
        this.changeListeners.forEach(fn => fn(this.getXML()));
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
        this.tasks[idx].applicabilities = applicId ? [ this.applicMap && this.applicMap[applicId] ? this.applicMap[applicId] : { id: applicId } ] : [];

        // Эмитим granular change — view может обновить только соответствующую строку/ячейку
        this._emitChange({
            type: 'applicability:changed',
            payload: { level: 'task', rowIndex: idx, applicId }
        });

        return true;
    }

    deleteTask(idx) {
        const node = this.taskNodes.splice(idx, 1)[0];
        this.tasks.splice(idx, 1);
        $(node).remove();
        this.changeListeners.forEach(fn => fn(this.getXML()));
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

    addTaskSection() {
        const taskCode = 'taskcd-' + Date.now();
        const title = 'Новая задача';
        this.addTaskToSection(taskCode, title);
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
        // Устанавливаем атрибут applicRefId на конкретный <limit>
        if (applicId) {
            $lim.attr('applicRefId', applicId);
        } else {
            $lim.removeAttr('applicRefId');
        }

        // Обновляем модельную структуру
        if (!this.tasks[rowIndex].limits) this.tasks[rowIndex].limits = [];
        this.tasks[rowIndex].limits[limitIndex] = this.tasks[rowIndex].limits[limitIndex] || {};
        this.tasks[rowIndex].limits[limitIndex].applicRefId = applicId || null;

        // Emit granular change: meta содержит rowIndex и limitIndex
        if (typeof this._emitChange === 'function') {
            // если у тебя реализован _emitChange(meta) — используй его
            this._emitChange({ type: 'applicability:changed', payload: { rowIndex, limitIndex, applicId, field: 'limit' } });
        } else {
            // fallback — вызвать старые слушатели полностью
            this.changeListeners.forEach(fn => {
                try { fn(this.getXML(), { type: 'applicability:changed', payload: { rowIndex, limitIndex, applicId } }); }
                catch (e) { console.error(e); }
            });
        }
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

    
}


// taskTitle 


/*

Там где <taskDefinition applicRefId="app-07" этот applicRefId сходится с id в 

<applic id="app-02">
				<displayText>
					<simplePara>C УСТАНОВЛЕННОЙ ОПЦИЕЙ 2128-101</simplePara>
				</displayText>
			</applic>

      ТО этот текст из simplePara добавляется над строчкой с этой задачей во всю длинну


  <commonInfo> -- текст из этого тега идёт перед задачами во всю строку с форматированием по центру
				<title>СИСТЕМА КОНДИЦИОНИРОВАНИЯ ВОЗДУХА</title>
				<para/>
			</commonInfo>    


  <taskDefinition taskIdent="MT-212100-01" taskCode="taskcd02">
				<task>
					<taskTitle>MSI 21-31-00: СИСТЕМА АВТОМАТИЧЕСКОГО РЕГУЛИРОВАНИЯ ДАВЛЕНИЯ</taskTitle>
					<taskDescr>
						<simplePara>КОНТРОЛЬ ИСПРАВНОСТИ ВЫПУСКНОГО И НАЗЕМНОГО КЛАПАНОВ ПРИ ПОМОЩИ КНОПКИ-ТАБЛО «DITCHING» НА ПУЛЬТЕ УПРАВЛЕНИЯ CAB PRESSURE С ЦЕЛЬЮ УБЕДИТЬСЯ В КОРРЕКТНОМ (И СВОЕВРЕМЕННОМ) ОТКРЫТИИ И ЗАКРЫТИИ КЛАПАНОВ ПРИ ВЫПОЛНЕНИИ ЦИКЛА ПРИВОДНЕНИЯ</simplePara>
					</taskDescr>
				</task>
    эта штука показывает <taskTitle> под какой сплощшной горизонтальной линией писать - 

    taskCode="taskcd02" -- видимо показывает именно код который показывает под какой штукой что писать - его выводить не надо


    taskIdent="343434-07" -- это "Номер задачи ИДПТО"

    taskDefinitionAlts - понять что за taskDefinitionAlts - чем от обычного отличается в ней тоже свои taskCode="taskcd09"

    

*/
