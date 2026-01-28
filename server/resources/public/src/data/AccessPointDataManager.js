/**
 * AccessPointDataManager - управление данными о точках доступа с кешированием
 * Парсит XML, строит индекс и кеширует в LocalStorage
 */
class AccessPointDataManager {
    constructor() {
        this.CACHE_VERSION = 'accessPoints_v1';
        this.CACHE_KEY = 'aircraft_access_points_cache';
        this.accessPoints = new Map(); // Map<accessPointNumber, {number, name, type, zone}>
        this.accessPointsArray = []; // [[accessPointNumber, name], ...]
        this.searchIndex = {}; // Индекс по первым символам
        this.isLoaded = false;
        this.isLoading = false;
    }

    /**
     * Инициализация - загружает из кеша или парсит XML
     * @returns {Promise<boolean>} успешность загрузки
     */
    async init() {
        if (this.isLoading) {
            console.warn('[AccessPointDataManager] Инициализация уже выполняется');
            return false;
        }

        if (this.isLoaded) {
            console.log('[AccessPointDataManager] Уже инициализирован');
            return true;
        }

        this.isLoading = true;
        console.log('[AccessPointDataManager] Инициализация...');
        
        try {
            // Пытаемся загрузить из кеша
            if (this.loadFromCache()) {
                console.log('[AccessPointDataManager] Загружено из кеша:', this.accessPointsArray.length, 'точек доступа');
                this.isLoaded = true;
                this.isLoading = false;
                return true;
            }

            // Кеш не найден - загружаем из XML
            console.log('[AccessPointDataManager] Кеш не найден, загружаем XML...');
            
            const xmlDoc = await this.loadAccessPointsXML();
            this.parseAccessPointsXML(xmlDoc);
            this.buildAccessPointsArray();
            this.buildSearchIndex();
            this.saveToCache();
            
            this.isLoaded = true;
            this.isLoading = false;
            
            console.log('[AccessPointDataManager] Парсинг завершен:', this.accessPointsArray.length, 'точек доступа');
            return true;
            
        } catch (error) {
            console.error('[AccessPointDataManager] Ошибка инициализации:', error);
            this.isLoading = false;
            return false;
        }
    }

    /**
     * Загрузка XML с точками доступа через Teamcenter
     * @returns {Promise<Document>} XML документ
     */
    async loadAccessPointsXML() {
        try {
            console.log('[AccessPointDataManager] Загрузка dataset "accessuid"...');
            
            if (typeof tcHandler === 'undefined' || !tcHandler.getDataset) {
                throw new Error('tcHandler не определен или метод getDataset недоступен');
            }
            
            const xmlText = await tcHandler.getDataset("GRZl0qHWh326oC");
            
            if (!xmlText) {
                throw new Error('Dataset "accessuid" вернул пустой результат');
            }

            if (typeof xmlText !== 'string') {
                console.error('[AccessPointDataManager] Получен не строковый результат:', typeof xmlText);
                throw new Error('Dataset вернул некорректный тип данных: ' + typeof xmlText);
            }

            console.log('[AccessPointDataManager] Dataset загружен, размер:', this.formatBytes(xmlText.length));

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");
            
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                console.error('[AccessPointDataManager] Ошибка парсинга. XML:', xmlText.substring(0, 500));
                throw new Error('Ошибка парсинга XML: ' + parserError.textContent);
            }

            if (!xmlDoc.documentElement) {
                throw new Error('XML не содержит корневого элемента');
            }

            console.log('[AccessPointDataManager] XML успешно распарсен. Корневой элемент:', xmlDoc.documentElement.nodeName);
            return xmlDoc;
            
        } catch (error) {
            console.error('[AccessPointDataManager] Ошибка загрузки XML:', error);
            throw error;
        }
    }

    /**
     * Парсинг XML с точками доступа
     * @param {Document} xmlDoc - XML документ
     */
    parseAccessPointsXML(xmlDoc) {
        console.log('[AccessPointDataManager] Парсинг XML...');
        
        const accessPointSpecs = xmlDoc.querySelectorAll('accessPointSpec');
        console.log('[AccessPointDataManager] Найдено accessPointSpec элементов:', accessPointSpecs.length);

        if (accessPointSpecs.length === 0) {
            console.warn('[AccessPointDataManager] В XML не найдено элементов accessPointSpec');
            console.log('[AccessPointDataManager] Структура XML:', xmlDoc.documentElement.outerHTML.substring(0, 500));
        }

        accessPointSpecs.forEach((spec, index) => {
            const accessPointIdent = spec.querySelector('accessPointIdent');
            if (!accessPointIdent) {
                console.warn(`[AccessPointDataManager] accessPointSpec ${index} не содержит accessPointIdent`);
                return;
            }

            const accessPointNumber = accessPointIdent.getAttribute('accessPointNumber');
            if (!accessPointNumber) {
                console.warn(`[AccessPointDataManager] accessPointSpec ${index} не содержит атрибут accessPointNumber`);
                return;
            }

            // Ищем название в accessPointAlts
            let name = '';
            let type = '';
            let zone = '';
            
            const accessPointAlts = spec.querySelector('accessPointAlts');
            if (accessPointAlts) {
                const accessPoint = accessPointAlts.querySelector(`accessPoint[altNumber="${accessPointNumber}"]`);
                if (accessPoint) {
                    const nameElement = accessPoint.querySelector('name');
                    if (nameElement) {
                        name = nameElement.textContent.trim();
                    }

                    const typeElement = accessPoint.querySelector('accessPointType');
                    if (typeElement) {
                        type = typeElement.getAttribute('accessPointTypeValue') || '';
                    }

                    const zoneRef = accessPoint.querySelector('zoneRef');
                    if (zoneRef) {
                        zone = zoneRef.getAttribute('zoneNumber') || '';
                    }
                }
            }

            this.accessPoints.set(accessPointNumber, {
                number: accessPointNumber,
                name: name,
                type: type,
                zone: zone
            });
        });

        console.log('[AccessPointDataManager] Собрано точек доступа:', this.accessPoints.size);
    }

    /**
     * Построение компактного массива для быстрого доступа
     */
    buildAccessPointsArray() {
        this.accessPointsArray = [];
        
        this.accessPoints.forEach(ap => {
            this.accessPointsArray.push([
                ap.number,
                ap.name || ''
            ]);
        });

        // Сортируем по номеру точки доступа
        this.accessPointsArray.sort((a, b) => {
            return a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' });
        });

        console.log('[AccessPointDataManager] Массив построен:', this.accessPointsArray.length, 'записей');
    }

    /**
     * Построение индекса для быстрого поиска
     */
    buildSearchIndex() {
        this.searchIndex = {};
        
        this.accessPointsArray.forEach(([number, name]) => {
            // Индексируем по первым 1-3 символам
            for (let i = 1; i <= Math.min(3, number.length); i++) {
                const prefix = number.substring(0, i).toUpperCase();
                
                if (!this.searchIndex[prefix]) {
                    this.searchIndex[prefix] = [];
                }
                
                this.searchIndex[prefix].push([number, name]);
            }
        });

        console.log('[AccessPointDataManager] Индекс построен. Префиксов:', Object.keys(this.searchIndex).length);
    }

    /**
     * Поиск точек доступа по запросу
     * @param {string} query - поисковый запрос
     * @param {number} limit - максимум результатов (по умолчанию 10)
     * @returns {Array<[string, string]>} массив [number, name]
     */
    searchAccessPoints(query, limit = 10) {
        if (!query || query.length === 0) {
            return this.accessPointsArray.slice(0, limit);
        }

        const upperQuery = query.toUpperCase();
        const queryLen = upperQuery.length;
        
        // Используем индекс для первых символов
        let candidates = [];
        
        if (queryLen <= 3 && this.searchIndex[upperQuery]) {
            candidates = this.searchIndex[upperQuery];
        } else {
            // Для длинных запросов используем индекс первых 3 символов
            const prefix = upperQuery.substring(0, 3);
            candidates = this.searchIndex[prefix] || this.accessPointsArray;
        }

        // Фильтруем кандидатов
        const results = [];
        
        for (let i = 0; i < candidates.length && results.length < limit; i++) {
            const [number, name] = candidates[i];
            const upperNumber = number.toUpperCase();
            
            // Поиск по началу номера или названию
            if (upperNumber.startsWith(upperQuery) || 
                (name && name.toUpperCase().includes(upperQuery))) {
                results.push([number, name]);
            }
        }

        return results;
    }

    /**
     * Получение названия точки доступа по номеру
     * @param {string} accessPointNumber - номер точки доступа
     * @returns {string} название или пустая строка
     */
    getAccessPointName(accessPointNumber) {
        if (!accessPointNumber) return '';
        
        const ap = this.accessPoints.get(accessPointNumber);
        return ap ? ap.name : '';
    }

    /**
     * Получение всех точек доступа
     * @returns {Array<[string, string]>} массив [number, name]
     */
    getAllAccessPoints() {
        return this.accessPointsArray;
    }

    /**
     * Сохранение в LocalStorage с сжатием
     */
    saveToCache() {
        try {
            console.log('[AccessPointDataManager] Сохранение в кеш...');
            
            const data = {
                version: this.CACHE_VERSION,
                timestamp: Date.now(),
                accessPointsArray: this.accessPointsArray,
                searchIndex: this.searchIndex
            };

            const jsonString = JSON.stringify(data);
            console.log('[AccessPointDataManager] Размер до сжатия:', this.formatBytes(jsonString.length));

            // Сжатие через LZ-String (если доступно)
            let compressed;
            if (typeof LZString !== 'undefined') {
                compressed = LZString.compress(jsonString);
                console.log('[AccessPointDataManager] Размер после сжатия:', this.formatBytes(compressed.length));
            } else {
                compressed = jsonString;
                console.warn('[AccessPointDataManager] LZ-String недоступен, сохранение без сжатия');
            }

            localStorage.setItem(this.CACHE_KEY, compressed);
            console.log('[AccessPointDataManager] Данные сохранены в LocalStorage');
            
        } catch (error) {
            console.error('[AccessPointDataManager] Ошибка сохранения в кеш:', error);
        }
    }

    /**
     * Загрузка из LocalStorage с распаковкой
     * @returns {boolean} успешность загрузки
     */
    loadFromCache() {
        try {
            const compressed = localStorage.getItem(this.CACHE_KEY);
            if (!compressed) {
                console.log('[AccessPointDataManager] Кеш не найден');
                return false;
            }

            console.log('[AccessPointDataManager] Загрузка из кеша...');

            // Распаковка
            let jsonString;
            if (typeof LZString !== 'undefined') {
                jsonString = LZString.decompress(compressed);
            } else {
                jsonString = compressed;
            }

            const data = JSON.parse(jsonString);

            // Проверка версии
            if (data.version !== this.CACHE_VERSION) {
                console.warn('[AccessPointDataManager] Несовпадение версии кеша:', data.version, '!=', this.CACHE_VERSION);
                return false;
            }

            // Восстанавливаем данные
            this.accessPointsArray = data.accessPointsArray;
            this.searchIndex = data.searchIndex;

            // Восстанавливаем Map
            this.accessPoints = new Map();
            this.accessPointsArray.forEach(([number, name]) => {
                this.accessPoints.set(number, { number, name, type: '', zone: '' });
            });

            console.log('[AccessPointDataManager] Кеш загружен. Записей:', this.accessPointsArray.length);
            console.log('[AccessPointDataManager] Время кеша:', new Date(data.timestamp).toLocaleString());

            return true;

        } catch (error) {
            console.error('[AccessPointDataManager] Ошибка загрузки из кеша:', error);
            return false;
        }
    }

    /**
     * Очистка кеша
     */
    clearCache() {
        localStorage.removeItem(this.CACHE_KEY);
        console.log('[AccessPointDataManager] Кеш очищен');
    }

    /**
     * Форматирование размера в байтах
     */
    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

// Создаем глобальный экземпляр
window.accessPointDataManager = new AccessPointDataManager();
