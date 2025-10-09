class DictionariesTC {
    static #data = {};   // приватное хранилище данных

    // Загружает словари по uid
    static load(jsonDictionariesTC) {
        this.#data = JSON.parse(jsonDictionariesTC);
    }

    // Получить весь словарь по имени
    static getDictionary(name) {
        return this.#data[name] || [];
    }

    // Получить все названия словарей
    static getAllNames() {
        return Object.keys(this.#data);
    }
}