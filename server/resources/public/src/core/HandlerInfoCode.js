class HandlerInfoCode {
  constructor() {
    this.configs = {
      '0B2': this.get0B2Config(),
      '0B3': this.get0B3Config(),
      // Добавьте другие конфигурации по мере необходимости
    };
  }

  getConfig(infoCode) {
    return this.configs[infoCode] || this.configs['0B2']; // По умолчанию используем 0B2
  }

  get0B2Config() {
    return {
      headers: [
        { key: 'changeType', label: 'КОД ИЗМЕНЕНИЯ', editable: false },
        { key: 'taskIdent', label: 'НОМЕР ЗАДАЧИ ИДПТО', editable: true, path: ['@taskIdent'] },
        { key: 'rqmtSource', label: 'ДОКУМЕНТ ИСХОДНЫЙ', editable: true,
          path: ['rqmtSource','externalPubRef','externalPubRefIdent','externalPubTitle'] },
        { key: 'zoneNumber', label: 'ЗОНА', editable: true,
          path: ['preliminaryRqmts','productionMaintData','workAreaLocationGroup','zoneRef','@zoneNumber'] },
        { key: 'accessPoint', label: 'ДОСТУП', editable: true,
          path: ['preliminaryRqmts','productionMaintData','workAreaLocationGroup','accessPointRef','@accessPointNumber'] },
        { key: 'taskCode', label: 'КОД ЗАДАЧИ', editable: true, path: ['@taskCode'] },
        { key: 'taskDescr', label: 'ОПИСАНИЕ ЗАДАЧИ', editable: true, allowApplic: false,
          path: ['task','taskDescr', 'simplePara'] },
        { 
          key: 'limit',
          label: 'РАБОТ ПОРОГ / ИНТЕРВАЛ',
          editable: true,
          path: ['limit']
        },
        { key: 'amtoss', label: 'AMTOSS', editable: true, allowApplic: true, customRenderer: true},
        {
          key: 'personnel',
          label: 'КОЛ‑ВО ЧЕЛОВЕК / СПЕЦИАЛИЗАЦИЯ',
          editable: true,
          allowApplic: true,
          customRenderer: true
        },
        { key: 'taskDuration', label: 'Трудоёмкость', editable: true, allowApplic: true }
      ],
      createHeader: function() {
        const $thead = $('<thead>').addClass('table-header');
        const $headerRow = $('<tr>').addClass('header-row');
        $headerRow.append(`
          <th class="rotated-header" rowspan="2" style="width: 2%"><div class="rotated-content">КОД ИЗМЕНЕНИЯ</div></th>
          <th class="normal-header" rowspan="2" style="width: 4%"><div class="normal-content">НОМЕР ЗАДАЧИ ИДПТО</div></th>
          <th class="rotated-header" rowspan="2" style="width: 6%"><div class="rotated-content">ДОКУМЕНТ ИСХОДНЫЙ</div></th>
          <th class="rotated-header" rowspan="2" style="width: 5%"><div class="rotated-content">ЗОНА</div></th>
          <th class="rotated-header" rowspan="2" style="width: 6%"><div class="rotated-content">ДОСТУП</div></th>
          <th class="rotated-header" rowspan="2" style="width: 3%"><div class="rotated-content">КОД ЗАДАЧИ</div></th>
          <th class="normal-header" rowspan="2" style="width: 10%"><div class="normal-content">ОПИСАНИЕ ЗАДАЧИ</div></th>
          <th class="normal-header" rowspan="2" style="width: 10%"><div class="normal-content">Порог начала/Переодичность</div></th>
          <th class="rotated-header" rowspan="2" style="width: 8%"><div class="rotated-content">AMTOSS</div></th>
          <th class="rotated-header" style="width: 7%">
          <div class="rotated-content">КОЛ-ВО ЧЕЛОВЕК<br>/ Специализация</div>
          </th>
          <th class="rotated-header" style="width: 5%"><div class="rotated-content">Трудоёмкость</div></th>
        `);
        $thead.append($headerRow);

        // const $subHeaderRow = $('<tr>').addClass('sub-header-row');
        // $subHeaderRow.append(`
          
        // `);
        // $thead.append($subHeaderRow);
        return $thead;
      }
    };
  }

  get0B3Config() {
    // Пример другой конфигурации для infoCode 0B3
    return {
      headers: [
        { key: 'changeCode', label: 'КОД ИЗМЕНЕНИЯ', editable: false },
        { key: 'taskIdent', label: 'НОМЕР ЗАДАЧИ', editable: true, path: ['@taskIdent'] },
        { key: 'taskCode', label: 'КОД ЗАДАЧИ', editable: true, path: ['@taskCode'] },
        { key: 'taskDescr', label: 'ОПИСАНИЕ ЗАДАЧИ', editable: true, allowApplic: false,
          path: ['task','taskDescr', 'simplePara'] },
        // Другие поля, специфичные для 0B3
      ],
      createHeader: function() {
        const $thead = $('<thead>').addClass('table-header');
        const $headerRow = $('<tr>').addClass('header-row');
        $headerRow.append(`
          <th class="rotated-header" rowspan="2" style="width: 10%"><div class="rotated-content">КОД ИЗМЕНЕНИЯ</div></th>
          <th class="normal-header" rowspan="2" style="width: 15%"><div class="normal-content">НОМЕР ЗАДАЧИ</div></th>
          <th class="rotated-header" rowspan="2" style="width: 15%"><div class="rotated-content">КОД ЗАДАЧИ</div></th>
          <th class="normal-header" rowspan="2" style="width: 60%"><div class="normal-content">ОПИСАНИЕ ЗАДАЧИ</div></th>
        `);
        $thead.append($headerRow);
        return $thead;
      }
    };
  }
}