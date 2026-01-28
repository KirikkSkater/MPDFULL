/**
 * ZoneDataManager - управление данными о зонах с кешированием
 * Парсит XML, строит иерархию, сжимает и кеширует в LocalStorage
 */
class ZoneDataManager {
    constructor() {
        this.CACHE_VERSION = 'zones_v1';
        this.CACHE_KEY = 'aircraft_zones_cache';
        this.zones = new Map(); // Map<zoneNumber, {number, description, children}>
        this.zonesArray = []; // [[zoneNumber, description], ...]
        this.isLoaded = false;
    }

    /**
     * Инициализация - загружает из кеша или парсит XML
     * @returns {Promise<boolean>} успешность загрузки
     */
    async init() {
        console.log('[ZoneDataManager] Инициализация...');
        
        // Пытаемся загрузить из кеша
        if (this.loadFromCache()) {
            console.log('[ZoneDataManager] Загружено из кеша:', this.zonesArray.length, 'зон');
            this.isLoaded = true;
            return true;
        }

        // Кеш не найден - загружаем из XML
        console.log('[ZoneDataManager] Кеш не найден, загружаем XML...');
        try {
            const xmlDoc = await this.loadZonesXML();
            this.parseZonesXML(xmlDoc);
            this.buildZonesArray();
            this.saveToCache();
            this.isLoaded = true;
            console.log('[ZoneDataManager] Парсинг завершен:', this.zonesArray.length, 'зон');
            return true;
        } catch (error) {
            console.error('[ZoneDataManager] Ошибка инициализации:', error);
            return false;
        }
    }

    /**
     * Загрузка XML с зонами через Teamcenter
     * @returns {Promise<Document>} XML документ
     */
    async loadZonesXML() {
        try {
            console.log('[ZoneDataManager] Загрузка dataset "zoneuid"...');
            
            // ИСПРАВЛЕНО: await для получения результата Promise
            const xmlText = await tcHandler.getDataset("1iXl0qHWh326oC");
            
            if (!xmlText) {
                throw new Error('Dataset "zoneuid" вернул пустой результат');
            }
    
            console.log('[ZoneDataManager] Dataset загружен, размер:', this.formatBytes(xmlText.length));
    
            // Парсим XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");
            
            // Проверяем на ошибки парсинга
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                console.error('[ZoneDataManager] XML содержимое:', xmlText.substring(0, 500));
                throw new Error('Ошибка парсинга XML: ' + parserError.textContent);
            }
    
            console.log('[ZoneDataManager] XML успешно распарсен');
            return xmlDoc;
            
        } catch (error) {
            console.error('[ZoneDataManager] Ошибка загрузки XML:', error);
            throw error;
        }
    }

    /**
     * Парсинг XML с зонами и построение иерархии
     * @param {Document} xmlDoc - XML документ
     */
    parseZonesXML(xmlDoc) {
        console.log('[ZoneDataManager] Парсинг XML...');
        
        const zoneSpecs = xmlDoc.querySelectorAll('zoneSpec');
        console.log('[ZoneDataManager] Найдено zoneSpec элементов:', zoneSpecs.length);

        // Шаг 1: Собираем все зоны с их описаниями
        zoneSpecs.forEach(spec => {
            const zoneIdent = spec.querySelector('zoneIdent');
            if (!zoneIdent) return;

            const zoneNumber = zoneIdent.getAttribute('zoneNumber');
            if (!zoneNumber) return;

            // Ищем описание в zoneAlts
            let description = '';
            const zoneAlts = spec.querySelector('zoneAlts');
            if (zoneAlts) {
                const zone = zoneAlts.querySelector(`zone[altNumber="${zoneNumber}"]`);
                if (zone) {
                    const itemDescr = zone.querySelector('itemDescr');
                    if (itemDescr) {
                        description = itemDescr.textContent.trim();
                    }
                }
            }

            // Собираем дочерние зоны
            const children = [];
            const zoneRefGroup = spec.querySelector('zoneRefGroup[zoneRefType="contains"]');
            if (zoneRefGroup) {
                const zoneRefs = zoneRefGroup.querySelectorAll('zoneRef');
                zoneRefs.forEach(ref => {
                    const childNumber = ref.getAttribute('zoneNumber');
                    if (childNumber) {
                        children.push(childNumber);
                    }
                });
            }

            this.zones.set(zoneNumber, {
                number: zoneNumber,
                description: description,
                children: children,
                parent: null // будет заполнено на шаге 2
            });
        });

        console.log('[ZoneDataManager] Собрано зон:', this.zones.size);

        // Шаг 2: Устанавливаем связи родитель-ребенок и наследуем описания
        this.zones.forEach((zone, zoneNumber) => {
            zone.children.forEach(childNumber => {
                const childZone = this.zones.get(childNumber);
                if (childZone) {
                    childZone.parent = zoneNumber;
                    
                    // ВАЖНО: Наследование описания от родителя
                    if (!childZone.description && zone.description) {
                        childZone.description = zone.description;
                        console.log(`[ZoneDataManager] Зона ${childNumber} наследует описание от ${zoneNumber}`);
                    }
                }
            });
        });

        console.log('[ZoneDataManager] Иерархия построена');
    }

    /**
     * Построение компактного массива для быстрого доступа
     */
    buildZonesArray() {
        this.zonesArray = [];
        
        this.zones.forEach(zone => {
            this.zonesArray.push([
                zone.number,
                zone.description || '' // пустая строка если описание отсутствует
            ]);
        });

        // Сортируем по номеру зоны для бинарного поиска
        this.zonesArray.sort((a, b) => {
            const numA = parseInt(a[0]) || 0;
            const numB = parseInt(b[0]) || 0;
            return numA - numB;
        });

        console.log('[ZoneDataManager] Массив построен:', this.zonesArray.length, 'элементов');
    }

    /**
     * Сохранение в LocalStorage с сжатием LZ-String
     */
    saveToCache() {
        try {
            const data = {
                version: this.CACHE_VERSION,
                timestamp: new Date().toISOString(),
                zones: this.zonesArray
            };

            const jsonString = JSON.stringify(data);
            console.log('[ZoneDataManager] Размер до сжатия:', this.formatBytes(jsonString.length));

            // Сжатие через LZ-String
            const compressed = LZString.compressToUTF16(jsonString);
            console.log('[ZoneDataManager] Размер после сжатия:', this.formatBytes(compressed.length * 2));
            console.log('[ZoneDataManager] Коэффициент сжатия:', (jsonString.length / (compressed.length * 2)).toFixed(2) + 'x');

            localStorage.setItem(this.CACHE_KEY, compressed);
            console.log('[ZoneDataManager] Сохранено в LocalStorage');
            
            return true;
        } catch (error) {
            console.error('[ZoneDataManager] Ошибка сохранения в кеш:', error);
            // Возможно переполнение LocalStorage
            if (error.name === 'QuotaExceededError') {
                console.warn('[ZoneDataManager] LocalStorage переполнен, очищаем старые данные...');
                this.clearOldCache();
            }
            return false;
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
                console.log('[ZoneDataManager] Кеш не найден');
                return false;
            }

            // Распаковка
            const jsonString = LZString.decompressFromUTF16(compressed);
            if (!jsonString) {
                console.warn('[ZoneDataManager] Ошибка распаковки кеша');
                return false;
            }

            const data = JSON.parse(jsonString);

            // Проверка версии
            if (data.version !== this.CACHE_VERSION) {
                console.warn('[ZoneDataManager] Устаревшая версия кеша:', data.version, '!==', this.CACHE_VERSION);
                return false;
            }

            this.zonesArray = data.zones;
            
            // Восстанавливаем Map для быстрого поиска
            this.zones.clear();
            this.zonesArray.forEach(([number, description]) => {
                this.zones.set(number, {
                    number: number,
                    description: description,
                    children: [],
                    parent: null
                });
            });

            console.log('[ZoneDataManager] Кеш загружен:', {
                version: data.version,
                timestamp: data.timestamp,
                zones: this.zonesArray.length
            });

            return true;
        } catch (error) {
            console.error('[ZoneDataManager] Ошибка загрузки из кеша:', error);
            return false;
        }
    }

    /**
     * Получение описания зоны по номеру
     * @param {string} zoneNumber - номер зоны
     * @returns {string} описание зоны или пустая строка
     */
    getZoneDescription(zoneNumber) {
        if (!zoneNumber) return '';
        
        const zone = this.zones.get(zoneNumber.toString());
        return zone ? zone.description : '';
    }

    /**
     * Получение информации о зоне
     * @param {string} zoneNumber - номер зоны
     * @returns {object|null} объект зоны или null
     */
    getZone(zoneNumber) {
        if (!zoneNumber) return null;
        return this.zones.get(zoneNumber.toString()) || null;
    }

    /**
     * Поиск зон по описанию (для автокомплита)
     * @param {string} query - поисковый запрос
     * @param {number} limit - максимум результатов
     * @returns {Array} массив [zoneNumber, description]
     */
    searchZones(query, limit = 10) {
        if (!query || query.length < 1) return [];

        const queryLower = query.toLowerCase();
        const results = [];

        for (const [number, description] of this.zonesArray) {
            if (results.length >= limit) break;

            if (number.includes(query) || 
                description.toLowerCase().includes(queryLower)) {
                results.push([number, description]);
            }
        }

        return results;
    }

    /**
     * Получение всех зон в виде массива
     * @returns {Array} массив [zoneNumber, description]
     */
    getAllZones() {
        return this.zonesArray;
    }

    /**
     * Проверка существования зоны
     * @param {string} zoneNumber - номер зоны
     * @returns {boolean}
     */
    hasZone(zoneNumber) {
        return this.zones.has(zoneNumber.toString());
    }

    /**
     * Очистка кеша
     */
    clearCache() {
        localStorage.removeItem(this.CACHE_KEY);
        console.log('[ZoneDataManager] Кеш очищен');
    }

    /**
     * Очистка старых версий кеша
     */
    clearOldCache() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('aircraft_zones_cache') && key !== this.CACHE_KEY) {
                localStorage.removeItem(key);
                console.log('[ZoneDataManager] Удален старый кеш:', key);
            }
        });
    }

    /**
     * Форсированная перезагрузка из XML
     * @returns {Promise<boolean>}
     */
    async reload() {
        console.log('[ZoneDataManager] Принудительная перезагрузка...');
        this.clearCache();
        this.zones.clear();
        this.zonesArray = [];
        this.isLoaded = false;
        return await this.init();
    }

    /**
     * Форматирование размера в байтах
     * @param {number} bytes
     * @returns {string}
     */
    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    /**
     * Получение статистики
     * @returns {object}
     */
    getStats() {
        const cacheSize = localStorage.getItem(this.CACHE_KEY)?.length * 2 || 0;
        
        return {
            totalZones: this.zones.size,
            isLoaded: this.isLoaded,
            cacheSize: this.formatBytes(cacheSize),
            version: this.CACHE_VERSION,
            zonesWithDescription: this.zonesArray.filter(z => z[1]).length,
            zonesWithoutDescription: this.zonesArray.filter(z => !z[1]).length
        };
    }
}

// Глобальный синглтон
window.zoneDataManager = window.zoneDataManager || new ZoneDataManager();
