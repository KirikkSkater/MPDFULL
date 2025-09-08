const UNITS = [
  { key: 'th01', label: 'th01 - Flight hours'   },
  { key: 'th02', label: 'th02 - Flight cycles'  },
  { key: 'th03', label: 'th03 - Months'         },
  { key: 'th04', label: 'th04 - Weeks'          },
  { key: 'th05', label: 'th05 - Years'          },
  { key: 'th06', label: 'th06 - Days'           },
  { key: 'th08', label: 'th08 - Pressure cycles'},
  { key: 'th09', label: 'th09 - Engine cycles'  },
  { key: 'th10', label: 'th10 - Engine change'  },
  { key: 'th11', label: 'th11 - Shop visits'    }
];

class ScheduleView {
  constructor(model, $container) {
    this.model = model; // ScheduleTableModel instance
    this.$container = $container; // jQuery div where table will be rendered
    this.$table = null;

    // store last headers (index mapping)
    this.headers = [];

    // Подпишемся на изменения модели (и сохраним функцию отписки)
    if (typeof this.model.onChange === 'function') {
      // сохраним отписку, если понадобится
        this._unsubscribeModel = this.model.onChange((xml, meta) => {
          try {
            if (meta && meta.type === 'applicability:changed' && meta.payload) {
              const p = meta.payload;

              console.log('granular event payload:', meta);
              if (p.field === 'limit' || p.limitIndex !== undefined) {
                this.updateLimitInRow(p.rowIndex, p.limitIndex);
                return;
              }
              // можно добавить другие обработчики granular events: field, cell, row
              if (p.field) {
                this.updateCell(p.rowIndex, p.field);
                return;
              }

              if (p.level === 'task' && p.rowIndex !== undefined) {
                // this.updateCell(p.rowIndex, 'taskDescr');
                
                this.updateApplicInRow(p.rowIndex);
                return;
              }
            }
          } catch (err) {
            console.error('handle model change error', err);
          }
          // fallback — полная перерисовка (если нет meta или не распознали)
          this.render();
        });
      }

      // делегация клика на удаление применимости (если нужно)
      this.$container.off('click.scheduleview', '.delete-applic')
        .on('click.scheduleview', '.delete-applic', e => {
          // ...
        });


    // Делегированные клики для кнопки удаления применимости (удаляет применимость из модели)
    // Используем делегацию на контейнере, чтобы обработчики сохранялись при перерендерах
    this.$container.off('click.scheduleview', '.delete-applic');
    this.$container.on('click.scheduleview', '.delete-applic', (e) => {
      e.preventDefault();
      const $btn = $(e.currentTarget);
      const applicId = $btn.data('applic-id');
      // Ищем ближайшую строку (task row)
      const $row = $btn.closest('tr[data-task-index], tr[data-task-id]');
      let identifier = null;
      if ($row.length) {
        identifier = $row.data('task-id') ?? $row.attr('data-task-id') ?? $row.data('task-index');
      }
      try {
        if (identifier !== undefined && identifier !== null) {
          // Если модель поддерживает clearApplicability — вызываем
          if (typeof this.model.clearApplicability === 'function') {
            this.model.clearApplicability(identifier);
          } else if (typeof this.model.setApplicability === 'function') {
            this.model.setApplicability(identifier, null);
          } else {
            // fallback: найти индекс и вызвать updateApplicForTask
            const idx = this.model.getTaskIndexByIdentifier
              ? this.model.getTaskIndexByIdentifier(identifier)
              : parseInt(identifier, 10);
            if (!isNaN(idx)) this.model.updateApplicForTask(idx, null);
          }
        }
      } catch (err) {
        console.error('Failed to clear applicability from view:', err);
      }
    });
  }

  // Обработчик обновлений модели: если мета сообщает, что изменился только applicability — обновим конкретную строку,
  // иначе — полный рендер (fallback).
  handleModelChange(xml, meta) {
    try {
      if (meta && meta.type === 'applicability:changed' && meta.payload) {
        // Попытка обновить по rowIndex
        const rowIndex = meta.payload.rowIndex;
        const taskIdent = meta.payload.taskIdent;
        if (typeof rowIndex === 'number' && rowIndex >= 0) {
          this.updateApplicInRow(rowIndex);
          return;
        }
        if (taskIdent) {
          // Найдем индекс задачи по идентификатору и обновим
          const idx = this.model.getTaskIndexByIdentifier ? this.model.getTaskIndexByIdentifier(taskIdent) : -1;
          if (idx >= 0) {
            this.updateApplicInRow(idx);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Error in handleModelChange (granular update):', err);
    }
    // fallback — полный рендер
    this.render();
  }

  render() {
    console.log('full render');
    this.renderTaskTable();
  }

  createTable(){
    this.$table = $('<table>', {
      id: 'mytable',
      class: 'table data-table table-bordered fixtable disable'
    });
    this.$container.append(this.$table);
  }

  createHeaderTabel() {
    // Создаём header (упрощённо — оставляем вашу текущую разметку)
    const $thead = $('<thead>').addClass('table-header');

    const $headerRow = $('<tr>').addClass('header-row');
    $headerRow.append(`
        <th class="rotated-header" rowspan="2" style="width: 3%"><div class="rotated-content">КОД ИЗМЕНЕНИЯ</div></th>
        <th class="normal-header" rowspan="2" style="width: 6%"><div class="normal-content">НОМЕР ЗАДАЧИ ИДПТО</div></th>
        <th class="rotated-header" rowspan="2" style="width: 3%"><div class="rotated-content">ДОКУМЕНТ ИСХОДНЫЙ</div></th>
        <th class="rotated-header" rowspan="2" style="width: 2%"><div class="rotated-content">ЗОНА</div></th>
        <th class="rotated-header" rowspan="2" style="width: 3%"><div class="rotated-content">ДОСТУП</div></th>
        <th class="rotated-header" rowspan="2" style="width: 3%"><div class="rotated-content">КОД ЗАДАЧИ</div></th>
        <th class="normal-header" rowspan="2" style="width: 14%"><div class="normal-content">ОПИСАНИЕ ЗАДАЧИ</div></th>
        <th class="normal-header" rowspan="2" style="width: 14%"><div class="normal-content">Порог начала/Переодичность</div></th>
        <th class="rotated-header" rowspan="2" style="width: 3%"><div class="rotated-content">AMTOSS</div></th>
        <th class="thin-header" colspan="2" style="width: 6%"><div class="thin-content">ИСП.</div></th>
        <th class="thin-header" colspan="2" style="width: 6%"><div class="thin-content">ЧЕЛ.-Ч.</div></th>
        <th class="rotated-header" rowspan="2" style="width: 3%"><div class="rotated-content">ПРИМЕНИМОСТЬ</div></th>
    `);
    $thead.append($headerRow);

    const $subHeaderRow = $('<tr>').addClass('sub-header-row');
    $subHeaderRow.append(`
        <th class="rotated-header" style="width: 3%"><div class="rotated-content">КОЛ-ВО ЧЕЛОВЕК</div></th>
        <th class="rotated-header" style="width: 3%"><div class="rotated-content">СПЕЦИАЛИЗАЦИЯ</div></th>
        <th class="rotated-header" style="width: 3%"><div class="rotated-content">РАБОТЫ ПОДГОТОВИТЕЛЬНЫЕ</div></th>
        <th class="rotated-header" style="width: 3%"><div class="rotated-content">ЗАДАЧА</div></th>
    `);
    $thead.append($subHeaderRow);
    this.$table.append($thead);
  }

  renderTaskTable() {
    if (this.$table) this.$table.remove();
    this.$table = $('<table>', { class: 'table table-bordered schedule-table' });

    const tasks = this.model.getFilteredTasks();
    const headers = this.model.getHeaders();
    this.headers = headers; // сохраним локально для granular updates
    const title = this.model.getTitle();

    // Генерация заголовка через существующий метод
    this.createHeaderTabel();

    // Добавление общего заголовка
    if (title) {
      const $titleRow = $('<tr>')
        .append($('<td>', { colspan: headers.length, class: 'common-info-cell text-center' })
          .append($('<span>').text(title))
          .append(
            $('<button>', { class: 'btn btn-sm btn-outline-primary float-right ml-2 add-section-btn add-button-row edit-mode-btn' })
              .text('+')
              .on('click', () => this.model.addTaskSection())
          ));
      this.$table.append($('<thead>').append($titleRow));
    }

    const $tbody = $('<tbody>');
    let lastTaskTitle = null;

    tasks.forEach((task, rowIndex) => {
      // Группировка по taskTitle
      if (lastTaskTitle === null || task.taskTitle !== lastTaskTitle) {
        const subtitleText = task.taskTitle;
        const $subRow = $('<tr>')
          .append($('<td>', { colspan: headers.length, class: 'task-group-subtitle text-left' })
            .append($('<span>').text(subtitleText))
            .append(
              $('<button>', {
                class: 'btn btn-sm btn-outline-secondary float-right ml-2 add-task-btn add-button-row edit-mode-btn',
                'data-task-code': task.taskCode,
                'data-task-title': task.taskTitle
              })
              .text('+')
              .on('click', e => {
                const code = $(e.target).data('task-code');
                const titleText = $(e.target).data('task-title');
                this.model.addTaskToSection(code, titleText);
                this.updateView(true);
              })
            ));
        // Оставляем dragstart для возможности перетаскивать XML-узлы групп (как раньше)
        $subRow.attr('draggable', true)
          .on('dragstart', e => {
            const xmlNode = this.model.getTaskNode(rowIndex);
            const xmlString = new XMLSerializer().serializeToString(xmlNode);
            e.originalEvent.dataTransfer.setData('application/xml', xmlString);
            e.originalEvent.dataTransfer.effectAllowed = 'copy';
          });
        $tbody.append($subRow);
        lastTaskTitle = task.taskTitle;
      }

      // Строка задачи — теперь ставим data-task-index и data-task-id (taskIdent or taskCode)
      const taskIdValue = task.taskIdent || task.taskCode || rowIndex;
      const $row = $('<tr>')
        .attr('data-task-index', rowIndex)
        .attr('data-task-id', taskIdValue);

      headers.forEach((h, colIndex) => {
        const $cell = $('<td>', { class: h.editable ? 'editable-cell' : '', 'data-field': h.key });


        // Добавляем применимости (если есть)
        if (h.allowApplic && Array.isArray(task.applicabilities)) {
          task.applicabilities.forEach(applic => {
            const displayValue = this.model.getApplicDisplayValue(applic.id);
            if (!displayValue) return;
            const $tag = this.renderApplicTag({
              id: applic.id,
              displayValue: displayValue
            });
            $cell.append($tag);
          });
        }

        const cellValue = task[h.key] || '';

        if (h.key === 'limit') {
          this.renderLimitCell($cell, task.limits || [], rowIndex);
          $row.append($cell);
          return;
        }

        let $content = $('<div>').addClass('cell-content').text(cellValue);

        if (h.editable) {
          $content = $('<div>', {
            class: 'editable-text',
            contenteditable: true,
            text: cellValue
          }).on('blur', e => {
            const newValue = $(e.target).text();
            this.model.updateTaskField(rowIndex, h.key, newValue);
          });
        }

        $cell.append($content);

        // IMPORTANT: removed per-cell drag/drop handlers here.
        // DnD is handled centrally by ScheduledController to avoid duplicate updates.

        $row.append($cell);
      });

      $tbody.append($row);
    });

    // Добавление задач по XML-drag на таблицу (оставляем — добавление новой задачи)
    // this.$table
    //   .on('dragover', e => { e.preventDefault(); e.originalEvent.dataTransfer.dropEffect = 'copy'; })
    //   .on('drop', e => {
    //     e.preventDefault();
    //     const xmlString = e.originalEvent.dataTransfer.getData('application/xml');
    //     if (!xmlString) return;
    //     try {
    //       const doc = new DOMParser().parseFromString(xmlString, 'application/xml');
    //       this.model.addTaskNode($(doc.documentElement));
    //       this.updateView(true);
    //     } catch (err) {
    //       alert('Ошибка при вставке задачи: ' + err.message);
    //     }
    //   });

    // Финальное отображение
    this.$table.append($tbody);
    this.$container.append(this.$table);
  }

  updateCell(rowIndex, colKey) {
    console.log('updateCell: rowIndex=', rowIndex, 'colKey=', colKey);
    const task = this.model.getFilteredTasks()[rowIndex];
    const header = this.model.getHeaders().find(h => h.key === colKey);
    if (!task || !header) return;

    // Найти ячейку в DOM таблицы:
    const $table = $('table.schedule-table')
    const $row = $table.find('tbody tr').eq(rowIndex);
    if (!$row.length) return;

    const colIndex = this.model.getHeaders().indexOf(header);
    const $cell = $row.find('td').eq(colIndex);
    if (!$cell.length) return;

    // Обновить текст ячейки (для примера, просто текст):
    let value = task[colKey] || '';

    // Для применимости может быть специальное отображение:
    if (header.allowApplic) {
        // Получаем отображение применимости через метод модели
        value = this.model.getApplicDisplayValue(task.applicabilities);
    }

    $cell.text(value);
}

  setEditable(editable) {
    if (!this.$table) return;
    this.$table.toggleClass("disable", !editable);

    this.$table.find('td.editable-cell div.editable-text')
      .attr('contenteditable', editable);

    const $editButtons = $(document).find('.edit-mode-btn');
    if (editable) {
      $editButtons.show();
    } else {
      $editButtons.hide();
    }
  }

  updateView(isEditMode) {
    this.render();
    this.setEditable(isEditMode);
  }

  renderLimitCell($cell, limits, rowIndex) {
    $cell.empty();
    const $limitContainer = $('<div>').addClass('limit-container');
    $cell.append($limitContainer);
    limits.forEach((block, bi) => {
      $limitContainer.append(this.renderSingleLimitBlock(block, bi, rowIndex));
    });
  }

  renderSingleLimitBlock(block, blockIndex, rowIndex) {
    const $block = $('<div>')
        .addClass('limit-block')
        .attr('data-limit-index', blockIndex); // <-- важно

    // Если нужно — можно также пометить data-task-index на уровне блока:
    $block.attr('data-task-index', rowIndex);

    if (block.applicRefId) {
        const $applicTag = this.renderApplicTag(
            { id: block.applicRefId, displayValue: this.model.getApplicDisplayValue(block.applicRefId) },
            true
        ).addClass('limit-applic-tag');
        $block.append($applicTag);
    }
    const $header = $('<div>').addClass('limit-header');

    const $typeSelect = $('<select>').addClass('limit-type-select')
      .append('<option value="po">po</option>')
      .append('<option value="pe">pe</option>')
      .append('<option value="oc">oc</option>')
      .val(block.limitType)
      .on('change', e => {
        this.model.updateTaskField(rowIndex, `limits[${blockIndex}].limitType`, e.target.value);
        $(e.target).closest('.limit-block').find('.limit-condition-input').toggle(e.target.value === 'oc');
      });

    const $conditionInput = $('<input type="text">').addClass('limit-condition-input')
      .val(block.limitCond || '')
      .toggle(block.limitType === 'oc')
      .on('blur', e => {
        this.model.updateTaskField(rowIndex, `limits[${blockIndex}].limitCond`, e.target.value);
      });

    $header.append($typeSelect, $conditionInput);
    $block.append($header);

    const $intervalRow = $('<div>').addClass('limit-row');
    $intervalRow.append($('<div>').addClass('limit-label').text('Интервал:'));

    const $intervalValue = $('<input type="text">').addClass('limit-value-input')
      .val(block.intervalValue)
      .on('blur', e => {
        this.model.updateTaskField(rowIndex, `limits[${blockIndex}].intervalValue`, e.target.value);
      });

    const $intervalUnit = $('<select>').addClass('limit-unit-select')
      .append(UNITS.map(u => `<option value="${u.key}">${u.label}</option>`))
      .val(block.intervalUnit)
      .on('change', e => {
        this.model.updateTaskField(rowIndex, `limits[${blockIndex}].intervalUnit`, e.target.value);
      });

    $intervalRow.append($intervalValue, $intervalUnit);
    $block.append($intervalRow);

    const $thresholdRow = $('<div>').addClass('limit-row');
    $thresholdRow.append($('<div>').addClass('limit-label').text('Порог:'));

    const $thresholdValue = $('<input type="text">').addClass('limit-value-input')
      .val(block.thresholdValue)
      .on('blur', e => {
        this.model.updateTaskField(rowIndex, `limits[${blockIndex}].thresholdValue`, e.target.value);
      });

    const $thresholdUnit = $('<select>').addClass('limit-unit-select')
      .append(UNITS.map(u => `<option value="${u.key}">${u.label}</option>`))
      .val(block.thresholdUnit)
      .on('change', e => {
        this.model.updateTaskField(rowIndex, `limits[${blockIndex}].thresholdUnit`, e.target.value);
      });

    $thresholdRow.append($thresholdValue, $thresholdUnit);
    $block.append($thresholdRow);

    return $block;
  }

  renderApplicTag(applic, withDelete = true) {
    const applicId = typeof applic === 'string' ? applic : applic.id;
    const displayValue = typeof applic === 'string'
      ? this.model.getApplicDisplayValue(applic)
      : applic.displayValue;

    const $tag = $('<div>').addClass('applic-tag');
    $tag.append($('<span>').addClass('applic-text').text(displayValue || applicId));

    if (withDelete) {
      $tag.append(
        $('<button>')
          .addClass('btn btn-xs delete-applic')
          .text('-')
          .attr('title', 'Удалить применимость')
          .data('applic-id', applicId)
      );
    }

    return $tag;
  }

  /**
   * Гранулярное обновление применимостей в одной строке
   */
  updateApplicInRow(rowIndex) {
    console.log('updateApplicInRow: ', rowIndex);
    try {
      const tasks = this.model.getFilteredTasks();
      if (!tasks || rowIndex < 0 || rowIndex >= tasks.length) return;
      const task = tasks[rowIndex];

      // Найдём строку по data-task-index (или по taskIdent/taskCode)
      let $row = this.$table && this.$table.find(`tr[data-task-index="${rowIndex}"]`);
      if (!$row || !$row.length) {
        // Попробуем найти по taskIdent или taskCode
        const idVal = task.taskIdent || task.taskCode;
        if (idVal) {
          $row = this.$table.find(`tr[data-task-id="${idVal}"]`);
        }
      }
      if (!$row || !$row.length) return;

      // Обновляем ячейки с allowApplic (и limit)
      this.headers.forEach((h, colIndex) => {
        if (!h) return;
        const $cell = $row.find('td').eq(colIndex);
        if (!$cell || !$cell.length) return;

        // Если это поле limit — перерисуем целиком limit cell
        if (h.key === 'limit') {
          $cell.empty();
          this.renderLimitCell($cell, task.limits || [], rowIndex);
          return;
        }

        if (h.allowApplic) {
          // очистим все теги применимости и положим актуальные
          $cell.find('.applic-tag').remove();
          if (Array.isArray(task.applicabilities)) {
            task.applicabilities.forEach(applic => {
              const displayValue = this.model.getApplicDisplayValue(applic.id);
              if (!displayValue) return;
              const $tag = this.renderApplicTag({ id: applic.id, displayValue }, true);
              $cell.prepend($tag); // prepend чтобы кнопка удаления ближе к левому краю (по вкусу)
            });
          }
        }
      });
    } catch (err) {
      console.error('updateApplicInRow error', err);
      // fallback
      this.render();
    }
  }

  updateLimitInRow(rowIndex, limitIndex) {
    console.log('updateLimitInRow: rowIndex=', rowIndex, 'limitIndex=', limitIndex);
    try {
      // Найдём задачу в модели
      const tasks = this.model.getFilteredTasks();
      if (!tasks || rowIndex < 0 || rowIndex >= tasks.length) return;
      const task = tasks[rowIndex];
      const limits = task.limits || [];
      const block = limits[limitIndex];
      if (!block) return;

      // Найдём строку в текущей таблице
      if (!this.$table) return;
      let $row = this.$table.find(`tr[data-task-index="${rowIndex}"]`);
      if (!$row.length) {
        const idVal = task.taskIdent || task.taskCode;
        if (idVal) $row = this.$table.find(`tr[data-task-id="${idVal}"]`);
      }
      if (!$row.length) return;

      // Найдём контейнер limit и соответствующий блок
      const $limitContainer = $row.find('.limit-container').first();
      if (!$limitContainer.length) return;

      // Если есть конкретный .limit-block с data-limit-index, заменим его; иначе заменим по порядку
      let $existingBlock = $limitContainer.find(`.limit-block[data-limit-index="${limitIndex}"]`);
      if (!$existingBlock.length) {
        // fallback: по порядку
        $existingBlock = $limitContainer.find('.limit-block').eq(limitIndex);
      }

      // Создаём новый блок через существующий рендерер
      const $newBlock = this.renderSingleLimitBlock(block, limitIndex, rowIndex);
      // Установим data-limit-index на новом блоке для дальнейших операций
      $newBlock.attr('data-limit-index', limitIndex);

      if ($existingBlock.length) {
        $existingBlock.replaceWith($newBlock);
      } else {
        // если нет — append
        $limitContainer.append($newBlock);
      }
    } catch (err) {
      console.error('updateLimitInRow error', err);
      // fallback
      this.render();
    }
  }
}
