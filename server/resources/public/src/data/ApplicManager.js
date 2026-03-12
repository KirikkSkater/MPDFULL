/**
 * ApplicManager - управление применимостями (applicability)
 * Поддерживает два типа:
 * 1. referencedApplicGroup - локальные применимости
 * 2. referencedApplicGroupRef - ссылки на CIR
 */
class ApplicManager {
    constructor() {
        this.applicMap = {}; // { id: { id, displayText, asserts, displayValue, source } }
        this.applicType = null; // null | 'local' | 'cir'
        this.nextId = 1;
        this.cirCache = null; // Кеш commonRepository из CIR
        this.cirLoaded = false;
        this.xmlDoc = null; // ✅ Сохраняем ссылку на XML документ
    }

    /**
     * Инициализация - парсинг применимостей из XML
     */
    init($xml) {
        // ✅ ПРАВИЛЬНОЕ получение XML документа
        const firstElement = $xml[0] || $xml.get(0);
        
        // Если это документ - используем его
        if (firstElement.nodeType === 9) { // Node.DOCUMENT_NODE
            this.xmlDoc = firstElement;
        } else {
            // Если это элемент - получаем ownerDocument
            this.xmlDoc = firstElement.ownerDocument;
        }
    
        // console.log('XML Document:', this.xmlDoc); // Для отладки
    
        this.applicType = this.detectApplicType($xml);
        if (this.applicType === 'local') {
            this.parseLocalApplics($xml);
        } else if (this.applicType === 'cir') {
            this.parseCirReferences($xml);
        }
    }

    /**
     * Определяет тип применимостей в документе
     */
    detectApplicType($xml) {
        const hasLocal = $xml.find('referencedApplicGroup').length > 0;
        const hasCir = $xml.find('referencedApplicGroupRef').length > 0;
        if (hasLocal) return 'local';
        if (hasCir) return 'cir';
        return null;
    }

    /**
     * Парсинг локальных применимостей (referencedApplicGroup)
     */
    parseLocalApplics($xml) {
        this.applicMap = {};
        this.nextId = 1;

        $xml.find('referencedApplicGroup > applic').each((i, el) => {
            const $el = $(el);
            const newId = this.generateNewId();

            const displayText = $el.find('displayText > simplePara').text().trim();

            // Получаем значения из assert'ов
            const asserts = {};
            $el.find('evaluate > assert').each((j, assert) => {
                const $assert = $(assert);
                const ident = $assert.attr('applicPropertyIdent');
                const values = $assert.attr('applicPropertyValues') || '';
                asserts[ident] = values;
            });

            // Формируем текст применимости по приоритету
            let applicText = '';
            if (displayText) {
                applicText = displayText;
            } else {
                if (asserts.serialno) {
                    applicText = `Серийный номер: ${asserts.serialno}`;
                } else if (asserts.model) {
                    applicText = `Модель: ${asserts.model}`;
                } else if (asserts.type) {
                    applicText = `Тип: ${asserts.type}`;
                } else {
                    applicText = newId;
                }
            }

            this.applicMap[newId] = {
                id: newId,
                displayText: displayText,
                asserts: asserts,
                displayValue: applicText,
                source: 'local'
            };
        });
    }

    /**
     * Парсинг ссылок на CIR (referencedApplicGroupRef)
     */
    parseCirReferences($xml) {
        this.applicMap = {};
        this.nextId = 1;

        $xml.find('referencedApplicGroupRef > applicRef').each((i, el) => {
            const $el = $(el);
            const applicIdentValue = $el.attr('applicIdentValue');
            const newId = this.generateNewId();

            this.applicMap[newId] = {
                id: newId,
                applicIdentValue: applicIdentValue,
                displayValue: applicIdentValue,
                source: 'cir',
                loaded: false
            };
        });
    }

    /**
     * Загрузка CIR из внешней системы
     */
    async pullCIR() {
        if (this.cirLoaded && this.cirCache) {
            return this.cirCache;
        }

        try {
            const xmlText = await tcHandler.getDataset("6oRxQZdqh326oC");
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");
            const $xml = $(xmlDoc);

            // Парсим commonRepository > applicRepository
            this.cirCache = {};
            $xml.find('commonRepository > applicRepository > applicSpec').each((i, spec) => {
                const $spec = $(spec);
                const applicMapRefId = $spec.attr('applicMapRefId');
                const applicIdentValue = $spec.find('applicSpecIdent').attr('applicIdentValue');

                if (applicIdentValue) {
                    this.cirCache[applicIdentValue] = {
                        applicMapRefId: applicMapRefId,
                        applicIdentValue: applicIdentValue
                    };
                }
            });

            this.cirLoaded = true;
            return this.cirCache;
        } catch (error) {
            console.error('Failed to load CIR:', error);
            throw error;
        }
    }

    /**
     * Генерация нового ID
     */
    generateNewId() {
        const id = `app-${String(this.nextId).padStart(4, '0')}`;
        this.nextId++;
        return id;
    }

    /**
     * Добавление новой применимости
     */
    addApplic(applic) {
        const newId = this.generateNewId();
        this.applicMap[newId] = {
            id: newId,
            displayText: applic.displayText || '',
            asserts: applic.asserts || {},
            displayValue: applic.displayValue || newId,
            source: applic.source || this.applicType || 'local'
        };
        return newId;
    }

    /**
     * Обновление применимости
     */
    updateApplic(id, data) {
        if (!this.applicMap[id]) {
            console.warn(`Applicability ${id} not found`);
            return false;
        }

        if (data.displayText !== undefined) {
            this.applicMap[id].displayText = data.displayText;
        }

        if (data.asserts !== undefined) {
            this.applicMap[id].asserts = data.asserts;
        }

        // Пересчитываем displayValue
        this.applicMap[id].displayValue = this.calculateDisplayValue(this.applicMap[id]);
        return true;
    }

    /**
     * Вычисление displayValue
     */
    calculateDisplayValue(applic) {
        if (applic.source === 'cir') {
            return applic.applicIdentValue || applic.id;
        }

        // Для local
        if (applic.displayText) {
            return applic.displayText;
        }

        const asserts = applic.asserts || {};
        if (asserts.serialno) {
            return `Серийный номер: ${asserts.serialno}`;
        } else if (asserts.model) {
            return `Модель: ${asserts.model}`;
        } else if (asserts.type) {
            return `Тип: ${asserts.type}`;
        }

        return applic.id;
    }

    /**
     * Удаление применимости
     */
    removeApplic(id) {
        if (this.applicMap[id]) {
            delete this.applicMap[id];
            return true;
        }
        return false;
    }

    /**
     * Получение применимости по ID
     */
    getApplic(id) {
        return this.applicMap[id] || null;
    }

    /**
     * Получение всех применимостей
     */
    getAllApplics() {
        return Object.values(this.applicMap);
    }

    /**
     * ✅ ИСПРАВЛЕНО: Создание referencedApplicGroup или referencedApplicGroupRef в XML
     * Использует нативный DOM API вместо jQuery
     */
    createApplicContainer($xml, type) {
        // Находим элемент content
        const contentElement = $xml.find('content')[0];
        if (!contentElement) {
            console.error('No <content> element found');
            return null;
        }

        // Удаляем старый контейнер если есть
        const oldLocal = contentElement.querySelector('referencedApplicGroup');
        const oldCir = contentElement.querySelector('referencedApplicGroupRef');
        if (oldLocal) oldLocal.remove();
        if (oldCir) oldCir.remove();

        // Создаем новый контейнер через нативный DOM
        let container;
        if (type === 'local') {
            container = this.xmlDoc.createElement('referencedApplicGroup');
            this.applicType = 'local';
        } else if (type === 'cir') {
            container = this.xmlDoc.createElement('referencedApplicGroupRef');
            this.applicType = 'cir';
        } else {
            console.error('Invalid type:', type);
            return null;
        }

        // Вставляем в начало content (перед maintPlanning)
        const maintPlanning = contentElement.querySelector('maintPlanning');
        if (maintPlanning) {
            contentElement.insertBefore(container, maintPlanning);
        } else {
            contentElement.insertBefore(container, contentElement.firstChild);
        }

        return container;
    }

    /**
     * ✅ ИСПРАВЛЕНО: Синхронизация локальных применимостей в XML
     * Использует нативный DOM API
     */
    syncLocalApplicToXML($xml) {
        let container = $xml.find('referencedApplicGroup')[0];

        if (!container) {
            container = this.createApplicContainer($xml, 'local');
        }

        // Очищаем контейнер
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const applics = this.getAllApplics();
        applics.forEach(applic => {
            if (applic.source !== 'local') return;

            // Создаем <applic id="...">
            const applicElement = this.xmlDoc.createElement('applic');
            applicElement.setAttribute('id', applic.id);

            // Добавляем displayText если есть
            if (applic.displayText) {
                const displayText = this.xmlDoc.createElement('displayText');
                const simplePara = this.xmlDoc.createElement('simplePara');
                simplePara.textContent = applic.displayText;
                displayText.appendChild(simplePara);
                applicElement.appendChild(displayText);
            }

            // Добавляем asserts если есть
            if (applic.asserts && Object.keys(applic.asserts).length > 0) {
                const evaluate = this.xmlDoc.createElement('evaluate');

                Object.entries(applic.asserts).forEach(([ident, values]) => {
                    const assert = this.xmlDoc.createElement('assert');
                    assert.setAttribute('applicPropertyIdent', ident);
                    assert.setAttribute('applicPropertyType', 'prodattr');
                    assert.setAttribute('applicPropertyValues', values);
                    evaluate.appendChild(assert);
                });

                applicElement.appendChild(evaluate);
            }

            container.appendChild(applicElement);
        });
    }

    /**
     * ✅ ИСПРАВЛЕНО: Синхронизация CIR применимостей в XML
     * Использует нативный DOM API
     */
    syncCirApplicToXML($xml) {
        let container = $xml.find('referencedApplicGroupRef')[0];

        if (!container) {
            container = this.createApplicContainer($xml, 'cir');
        }

        // Очищаем контейнер
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const applics = this.getAllApplics();
        applics.forEach(applic => {
            if (applic.source !== 'cir') return;

            // Создаем <applicRef applicIdentValue="..." id="...">
            const applicRef = this.xmlDoc.createElement('applicRef');
            applicRef.setAttribute('applicIdentValue', applic.applicIdentValue);
            applicRef.setAttribute('id', applic.id);

            container.appendChild(applicRef);
        });
    }

    /**
     * Добавление применимости из CIR
     */
    async addApplicFromCir(applicIdentValue) {
        if (!this.cirCache) {
            await this.pullCIR();
        }

        const cirData = this.cirCache[applicIdentValue];
        if (!cirData) {
            throw new Error(`Применимость ${applicIdentValue} не найдена в CIR`);
        }

        // Проверяем, не добавлена ли уже эта применимость
        const existing = Object.values(this.applicMap).find(
            a => a.source === 'cir' && a.applicIdentValue === applicIdentValue
        );

        if (existing) {
            console.warn(`Применимость ${applicIdentValue} уже добавлена`);
            return existing.id;
        }

        const newId = this.generateNewId();
        this.applicMap[newId] = {
            id: newId,
            applicIdentValue: applicIdentValue,
            displayValue: applicIdentValue,
            source: 'cir',
            loaded: true,
            cirData: cirData
        };

        return newId;
    }

    /**
     * Получение всех применимостей из CIR (для модального окна)
     */
    async getCirApplics() {
        if (!this.cirCache) {
            await this.pullCIR();
        }
        return Object.values(this.cirCache);
    }

    /**
     * Поиск по applicIdentValue в CIR
     */
    searchInCir(query) {
        if (!this.cirCache) {
            return [];
        }

        const lowerQuery = query.toLowerCase();
        return Object.values(this.cirCache).filter(item =>
            item.applicIdentValue.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Установка применимости на элемент XML
     * @param {Element} xmlElement - нативный DOM элемент
     * @param {string} applicId - ID применимости или null для удаления
     */
    setApplicOnElement(xmlElement, applicId) {
        if (!xmlElement) return false;

        if (applicId) {
            xmlElement.setAttribute('applicRefId', applicId);
        } else {
            xmlElement.removeAttribute('applicRefId');
        }

        return true;
    }

    /**
     * Получение применимости с элемента XML
     * @param {Element} xmlElement - нативный DOM элемент
     * @returns {string|null}
     */
    getApplicFromElement(xmlElement) {
        if (!xmlElement) return null;
        return xmlElement.getAttribute('applicRefId') || null;
    }

    /**
     * Проверка существования применимости
     */
    hasApplic(applicId) {
        return !!this.applicMap[applicId];
    }

    /**
     * Получение количества применимостей
     */
    getApplicCount() {
        return Object.keys(this.applicMap).length;
    }
}
