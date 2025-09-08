

class XMLParser {
    parse(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

        // Проверка на ошибки парсинга
        const parseError = xmlDoc.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
            throw new Error('Ошибка при разборе XML: ' + parseError[0].textContent);
        }

        return xmlDoc;
    }
}
