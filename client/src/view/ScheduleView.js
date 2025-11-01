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
    this.model = model; // ScheduleTableModel instance  //
    this.$container = $container; // jQuery div where table will be rendered
    this.$table = null;

    this.dmCodeModal = new DmCodeModal(model);

    this.editable = false;

    // store last headers (index mapping)
    this.headers = [];

    this.config = model.config;

    // Подпишемся на изменения модели (и сохраним функцию отписки)
    if (typeof this.model.onChange === 'function') {
      // сохраним отписку, если понадобится
        this._unsubscribeModel = this.model.onChange((xml, meta) => {
          try {

            if (meta && meta.type === 'limit:added' && meta.payload) {
              // // Обработка добавления нового limit
              // const { rowIndex } = meta.payload;
              // this.updateLimitCell(rowIndex);
              return;
            }

            if (meta && meta.type === 'section:titleChanged' && meta.payload) {
              const { oldTitle, newTitle } = meta.payload;
              this.handleSectionTitleChange(oldTitle, newTitle);
              return;
            }
            if (meta && meta.type === 'taskDuration:added' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateTaskDurationCell(rowIndex);
              return;
          }
  
          if (meta && meta.type === 'taskDuration:changed' && meta.payload) {
              const { rowIndex, durationIndex } = meta.payload;
              this.updateTaskDurationInRow(rowIndex, durationIndex);
              return;
          }
  
          if (meta && meta.type === 'taskDuration:removed' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateTaskDurationCell(rowIndex);
              return;
          }
          


            if (meta && meta.type === 'applicability:changed' && meta.payload) {
              const p = meta.payload;

              console.log('granular event payload:', meta);
              if (p.field === 'limit' || p.limitIndex !== undefined) {
                this.updateLimitInRow(p.rowIndex, p.limitIndex);
                return;
              }

              if (p.field === 'taskDuration') {
                this.updateTaskDurationInRow(p.rowIndex, p.durationIndex);
                return;
              }

              if (p.field === 'workAreaGroup' && this.isZoneGroup(p.rowIndex, p.groupIndex)) {
                this.updateZoneCell(p.rowIndex);
                return;
                
            }
            
            // Обработка workAreaGroup для доступа
              if (p.field === 'workAreaGroup' && this.isAccessGroup(p.rowIndex, p.groupIndex)) {
                  this.updateAccessPointCell(p.rowIndex);
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

            if (meta && meta.type === 'applicability:removed' && meta.payload) {
              const p = meta.payload;
              
              if (p.target === 'taskDuration') {
                this.updateTaskDurationInRow(p.rowIndex, p.durationIndex);
                return;
              }
              
              // ... остальная логика ...
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

  handleSectionTitleChange(oldTitle, newTitle) {
    // Обновляем все элементы с старым названием
    this.$container.find(`.editable-section-title:contains("${oldTitle}")`).each(function() {
        const $el = $(this);
        if ($el.text() === oldTitle) {
            $el.text(newTitle).attr('data-original-title', newTitle);
        }
    });
    
    // Обновляем кнопки добавления задач
    this.$container.find(`.add-task-btn[data-task-title="${oldTitle}"]`).attr('data-task-title', newTitle);
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
    // Используем функцию создания заголовка из конфигурации
    return this.config.createHeader();
  }

  renderTaskTable() {
    if (this.$table) this.$table.remove();
    this.$table = $('<table>', { class: 'table table-bordered schedule-table' });

    const tasks = this.model.getFilteredTasks();
    const headers = this.model.getHeaders();
    this.headers = headers; // сохраним локально для granular updates
    const title = this.model.getTitle();

    const $infoCodeDiv = $("#infoCodeId");  
    $infoCodeDiv.text(this.model.infoCode);
    // Генерация заголовка через существующий метод
    this.$table.append(this.createHeaderTabel());

    // Добавление общего заголовка
    // В методе renderTaskTable замените блок с title:
    if (title) {
      const $titleRow = $('<tr>')
          .append($('<td>', { colspan: headers.length, class: 'common-info-cell text-center' })
              .append(
                  $('<div>').addClass('d-flex align-items-center justify-content-center position-relative')
                      .append(
                          $('<span>')
                              .addClass('section-title editable-section-title')
                              .text(title)
                              .attr('data-original-title', title),
                              // .on('dblclick', (e) => {
                              //     this.editSectionTitle($(e.target), title);
                              // }),
                          $('<button>', { 
                              class: 'btn btn-sm btn-outline-primary ml-2 add-section-btn add-button-row edit-mode-btn',
                              style: 'right: 10px;' 
                          })
                              .text('+')
                              .on('click', () => this.model.addNewSection())
                      )
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
                .append(
                    $('<span>')
                        .addClass('subtitle-text editable-section-title')
                        .text(subtitleText)
                        .attr('data-original-title', subtitleText)
                        .on('dblclick', (e) => {
                            this.editSectionTitle($(e.target), subtitleText);
                        }),
                    $('<button>', {
                        class: 'btn btn-sm ml-2 btn-outline-primary add-task-btn add-section-btns edit-mode-btn',
                        'data-task-title': task.taskTitle
                    })
                    .text('+')
                    .on('click', e => {
                        const titleText = $(e.target).data('task-title');
                        this.model.addTaskToSection(titleText);
                    })
                ));
        
        // Оставляем dragstart
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
        .attr('data-task-id', taskIdValue)
        .on('contextmenu', (e) => {
            e.preventDefault();
            this.showTaskContextMenu(e, rowIndex, task);
        });

      headers.forEach((h, colIndex) => {

        const $cell = $('<td>', { class: h.editable ? 'editable-cell' : '', 'data-field': h.key });


        const cellValue = task[h.key] || '';

        if (h.key === 'changeType') {
            this.renderChangeTypeCell($cell, task, rowIndex);
            $row.append($cell);
            return;
        }

        if (h.key === 'limit') {
          this.renderLimitCell($cell, task.limits || [], rowIndex);
          $row.append($cell);
          return;
        }

        if (h.key === 'personnel') {
          this.renderPersonnelCell($cell, task, rowIndex);
          $row.append($cell);
          return;
        }

        if (h.key === 'amtoss') {
          this.renderAmtossCell($cell, task, rowIndex);
          $row.append($cell);
          return;
        }

        if (h.key === 'taskDuration') {
          this.renderTaskDurationCell($cell, task, rowIndex);
          $row.append($cell);
          return;
        }

        // Добавляем применимости (если есть)
        // Добавляем применимости для полей с allowApplic
        if (h.allowApplic && task.fieldApplicabilities && task.fieldApplicabilities[h.key]) {
          const applicId = task.fieldApplicabilities[h.key];
          const applicData = this.model.applicMap[applicId];
          if (applicData) {
            const $applicTag = this.renderApplicTag(applicData, true, rowIndex,"field", h.key);
            $cell.append($applicTag);
          }
        }

        // TODO: млжеь вынести в отдельный блок
        if (h.key === 'taskDescr') {
          const $contentContainer = $('<div>').addClass('task-description-container');
          
          // Основное описание задачи
          let $descrContent = $('<div>').addClass('cell-content').text(cellValue);
          
          if (h.editable) {
            $descrContent = $('<div>', {
              class: 'editable-text',
              contenteditable: true,
              text: cellValue
            }).on('blur', e => {
              const newValue = $(e.target).text();
              this.model.updateTaskField(rowIndex, h.key, newValue);
            });
          }
          
          $contentContainer.append($descrContent);
          
          // Добавляем примечание, если есть
          if (task.remarks != undefined) {
            const $remarksBlock = $('<div>').addClass('remarks-block');

            if (task.fieldApplicabilities['remarks']){
              $remarksBlock.append(this.renderApplicTag(task.fieldApplicabilities['remarks'], true, rowIndex, 'remarks'))
            }
            $remarksBlock.append(
              $('<div>').addClass('remarks-label').text('Примечание:'),
              $('<div>').addClass('remarks-text').text(task.remarks)
            );
            $contentContainer.append($remarksBlock);

            if (h.editable) {
              $remarksBlock.on('dblclick', () => {
                const newText = prompt('Редактировать примечание:', task.remarks);
                if (newText !== null) {
                  this.model.updateTaskField(rowIndex, 'remarks', newText);
                }
              }).css('cursor', 'pointer');
            }
          }
          
          // Добавляем режим контроля, если есть
          if (task.supervisorLevelCode != undefined) {
            const $supervisorBlock = $('<div>').addClass('supervisor-block');
            
            $supervisorBlock.append(
                $('<div>').addClass('supervisor-label').text('Режим контроля:')
            );
            
            // Выпадающий список для режима контроля
            const $supervisorSelect = $('<select>').addClass('supervisor-level-select e');
            
            // Получаем справочник
            const dict = DictionariesTC.getDictionary("supervisorLevelDict");
            
            // Добавляем пустую опцию
            $supervisorSelect.append($('<option>').val('').text('-- Не выбран --'));
            
            // Добавляем опции из справочника
            Object.entries(dict).forEach(([code, value]) => {
                $supervisorSelect.append($('<option>').val(code).text(value));
            });
            
            // Устанавливаем текущее значение
            $supervisorSelect.val(task.supervisorLevelCode || '');
            
            // Обработчик изменения
            $supervisorSelect.on('change', () => {
                this.model.updateSupervisorLevelCode(rowIndex, $supervisorSelect.val());
            });
            
            // Если не в режиме редактирования, делаем select недоступным
            // if (!this.editable) {
            //     $supervisorSelect.prop('disabled', true);
            // }
            
            $supervisorBlock.append($supervisorSelect);
            $contentContainer.append($supervisorBlock);
        }
          
          $cell.append($contentContainer);
          $row.append($cell);
          return;
        }

        if (h.key === 'rqmtSource'){ // TODO: как-то это исправить
          this.renderRqmtSourceCell($cell, task, rowIndex);
          $row.append($cell);
          return;
        }

        
        if (h.key === 'zoneNumber') {
          this.renderZoneCell($cell, task, rowIndex);
          $row.append($cell);
          return;
        }
      
        if (h.key === 'accessPoint') {
            this.renderAccessPointCell($cell, task, rowIndex);
            $row.append($cell);
            return;
        }

        if (h.key === 'taskCode') { // TODO: где-то добавить обновление в модели. Написать в тот чат где знает что за модель. и приплесть то что снизу написано про h.editble
          const dict = DictionariesTC.getDictionary("taskCodeDict");

          const $select = $('<select>')
          .addClass('task-code-select')
          .append(
            Object.entries(dict).map(([key, value]) =>
              `<option value="${key}">${value[1]}</option>`
            )
          )
          .val(cellValue) // выставляем текущее значение по ключу
          .on('change', e => {
            this.model.updateTaskField(rowIndex, h.key, e.target.value);
          });

          $cell.append($select);
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
      

      if (task.fieldApplicabilities && task.fieldApplicabilities['applicabilityTask']) {
        const applicId = task.fieldApplicabilities['applicabilityTask'];
        const applicData = this.model.applicMap[applicId];
        
        if (applicData) {
          const $applicRow = $('<tr>').addClass('task-applicability-row');
          
          const $applicCell = $('<td>').attr('colspan', headers.length);
          const $applicTag = this.renderApplicTag(applicData, true, rowIndex, "field", 'applicabilityTask');
          
          $applicCell.append($applicTag);
          $applicRow.append($applicCell);
          $tbody.append($applicRow);
        }
      }

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
    this.editable = editable;
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
    this.editable = isEditMode;
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
    
    const $addButton = $('<button>')
      .addClass('btn btn-sm btn-outline-primary add-limit-btn edit-mode-btn')
      .text('Добавить предел')
      .on('click', () => {
        this.model.addLimitToTask(rowIndex);
        // После добавления перерисовываем ячейку limit
        this.renderLimitCell($cell, this.model.getFilteredTasks()[rowIndex].limits, rowIndex);
      });
    
    if (!this.editable){
      $addButton.hide();
    }else{
      $addButton.show();
    }
    const $divButton = $('<div>').attr('style', 'display: flex; justify-content: center; margin-top: 5px;');
    $divButton.append($addButton);
    $limitContainer.append($divButton);
    
  }

  renderSingleLimitBlock(block, blockIndex, rowIndex) {
    const $block = $('<div>')
      .addClass('limit-block')
      .attr('data-limit-index', blockIndex)
      .attr('data-task-index', rowIndex);

    const $applicTag = this.renderLimitApplic(block, rowIndex, blockIndex);
    if ($applicTag) {
        $block.append($applicTag);
    }

    const $header = $('<div>').addClass('limit-header');

    const $typeSelect = $('<select>').addClass('limit-type-select')
      .append('<option value="po">po</option>')
      .append('<option value="pe">pe</option>')
      .append('<option value="oc">oc</option>')
      .val(block.limitType)
      .on('change', e => {
        this.model.updateLimitField(rowIndex, blockIndex, 'limitType', e.target.value);
        $(e.target).closest('.limit-block').find('.limit-condition-input').toggle(e.target.value === 'oc');
      });

    const $conditionInput = $('<input type="text">').addClass('limit-condition-input')
      .val(block.limitCond || '')
      .toggle(block.limitType === 'oc')
      .on('blur', e => {
        this.model.updateLimitField(rowIndex, blockIndex, 'limitCond', e.target.value);
      });

    $header.append($typeSelect, $conditionInput);
    $block.append($header);

    const $deleteButton = $('<button>')
      .addClass('btn btn-sm btn-outline-danger remove-limit-btn edit-mode-btn')
      .html('&times;')
      .attr('title', 'Удалить предел')
      .on('click', () => {
        if (confirm('Удалить этот предел?')) {
          this.model.removeLimitFromTask(rowIndex, blockIndex);
        }
      });
    $header.append($deleteButton);

    if (!this.editable) {
      $deleteButton.hide();
    } else {
      $deleteButton.show();
    }

    const $intervalRow = $('<div>').addClass('limit-row');
    $intervalRow.append($('<div>').addClass('limit-label').text('Интервал:'));

    const $intervalValue = $('<input type="text">').addClass('limit-value-input')
      .val(block.intervalValue)
      .on('blur', e => {
        this.model.updateLimitField(rowIndex, blockIndex, 'intervalValue', e.target.value);
      });

    const $intervalUnit = $('<select>').addClass('limit-unit-select')
      .append(UNITS.map(u => `<option value="${u.key}">${u.label}</option>`))
      .val(block.intervalUnit)
      .on('change', e => {
        this.model.updateLimitField(rowIndex, blockIndex, 'intervalUnit', e.target.value);
      });

    $intervalRow.append($intervalValue, $intervalUnit);
    $block.append($intervalRow);

    const $thresholdRow = $('<div>').addClass('limit-row');
    $thresholdRow.append($('<div>').addClass('limit-label').text('Порог:'));

    const $thresholdValue = $('<input type="text">').addClass('limit-value-input')
      .val(block.thresholdValue)
      .on('blur', e => {
        this.model.updateLimitField(rowIndex, blockIndex, 'thresholdValue', e.target.value);
      });

    const $thresholdUnit = $('<select>').addClass('limit-unit-select')
      .append(UNITS.map(u => `<option value="${u.key}">${u.label}</option>`))
      .val(block.thresholdUnit)
      .on('change', e => {
        this.model.updateLimitField(rowIndex, blockIndex, 'thresholdUnit', e.target.value);
      });

    $thresholdRow.append($thresholdValue, $thresholdUnit);
    $block.append($thresholdRow);

    return $block;
  }


  renderLimitApplic(block, rowIndex, blockIndex) {
    if (!block.applicRefId) return null;
    return this.renderApplicTag(
      {
        id: block.applicRefId,
        displayValue: this.model.getApplicDisplayValue(block.applicRefId)
      },
      true,
      rowIndex,
      "limit",
      blockIndex  
    ).addClass('limit-applic-tag');
  }
  

  // ---- applic

  renderApplicList(applicabilities) {
    const $container = $('<div>').addClass('applic-container');
    (applicabilities || []).forEach(applic => {
      const displayValue = this.model.getApplicDisplayValue(applic.id);
      if (displayValue) {
        $container.append(this.renderApplicTag({ id: applic.id, displayValue }));
      }
    });
    return $container;
  }

  renderApplicTag(applic, withDelete = true, rowIndex = null, targetType = null, targetIndex = null) {

    const applicId = typeof applic === 'string' ? applic : applic.id;
    const displayValue = typeof applic === 'string'
      ? this.model.getApplicDisplayValue(applic)
      : applic.displayValue;

    const $tag = $('<div>').addClass('applic-tag');
    $tag.append($('<span>').addClass('applic-text').text(displayValue || applicId));

    if (withDelete && rowIndex !== null && targetType !== null) {
      $tag.append(
        $('<button>')
          .addClass('btn btn-xs delete-applic edit-mode-btn')
          .html('&times')
          .attr('title', 'Удалить применимость')
          .data('applic-id', applicId)
          .on('click', () => {
            if (targetType === 'field') {
              this.model.removeApplicForField(rowIndex, targetIndex);
            } else if (targetType === 'limit') {
              this.model.removeApplicForLimit(rowIndex, targetIndex);
            } else if (targetType === 'personnel') {
              this.model.removeApplicForPersonnel(rowIndex, targetIndex);
            } else if (targetType === 'task') {
              this.model.removeApplicForTask(rowIndex);
            } else if (targetType === 'remarks'){
              this.model.removeApplicForRemarks(rowIndex);
            }else if (targetType === 'workAreaGroup') {
              this.model.removeApplicForWorkAreaGroup(rowIndex, targetIndex);
            }else if (targetType === 'dmRef') {
              this.model.removeApplicForDmRef(rowIndex, targetIndex);
            } if (targetType === 'taskDuration'){
              this.model.removeApplicForTaskDuration(rowIndex, targetIndex);
            }
          })
      );
    }

    return $tag;
  }

  renderRqmtSourceCell($cell, task, rowIndex) {
    $cell.empty();
    const $container = $('<div>').addClass('rqmt-source-container');
    
    // Получаем текущие значения из задачи
    const sourceOfRqmt = task.rqmtSourceOfRqmt || '';
    const sourceCriticality = task.rqmtSourceCriticality || '';
    
    // Первый выпадающий список для sourceOfRqmt
    const $sourceOfRqmtContainer = $('<div>').addClass('rqmt-source-select-container');
    // $sourceOfRqmtContainer.append($('<label>').text('Источник требования:'));
    
    const $sourceOfRqmtSelect = $('<select>').addClass('source-criticality-select');
    const sourceOfRqmtDict = DictionariesTC.getDictionary("sourceOfRqmtDict");
    Object.entries(sourceOfRqmtDict).forEach(([key, value]) => {
      $sourceOfRqmtSelect.append($('<option>').val(key).text(value[1]));
    });
    $sourceOfRqmtSelect.val(sourceOfRqmt);
    
    $sourceOfRqmtContainer.append($sourceOfRqmtSelect);
    $container.append($sourceOfRqmtContainer);
    
    // Второй выпадающий список для sourceCriticality
    const $sourceCriticalityContainer = $('<div>').addClass('rqmt-source-select-container ');
    // $sourceCriticalityContainer.append($('<label>').text('Критичность:'));
    
    const $sourceCriticalitySelect = $('<select>').addClass('source-criticality-select');
    const sourceCriticalityDict = DictionariesTC.getDictionary("sourceCriticalityDict");
    Object.entries(sourceCriticalityDict).forEach(([key, value]) => {
      $sourceCriticalitySelect.append($('<option>').val(key).text(value[1]));
    });
    $sourceCriticalitySelect.val(sourceCriticality);
    
    $sourceCriticalityContainer.append($sourceCriticalitySelect);
    $container.append($sourceCriticalityContainer);
    
    // Обработчики изменений
    $sourceOfRqmtSelect.on('change', () => {
      this.model.updateRqmtSourceField(rowIndex, 'sourceOfRqmt', $sourceOfRqmtSelect.val());
    });
    
    $sourceCriticalitySelect.on('change', () => {
      this.model.updateRqmtSourceField(rowIndex, 'sourceCriticality', $sourceCriticalitySelect.val());
    });
    
    $cell.append($container);
  }

  updateApplicInRow(rowIndex) {
    const $table = $('table.schedule-table');
    const $row = $table.find(`tbody tr[data-task-index="${rowIndex}"]`);
    if (!$row.length) return;

    const task = this.model.getFilteredTasks()[rowIndex];
    const header = this.model.getHeaders().find(h => h.allowApplic);
    if (!header) return;

    const colIndex = this.model.getHeaders().indexOf(header);
    const $cell = $row.find('td').eq(colIndex);
    $cell.empty().append(this.renderApplicList(task.applicabilities));
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

  renderPersonnelCell($cell, task, rowIndex) {
    $cell.empty();
    const $container = $('<div>').addClass('personnel-container');
    
    // Обрабатываем каждый personnel
    (task.personnel || []).forEach((person, index) => {
      const $personBlock = $('<div>')
        .addClass('personnel-block')
        .attr('data-row-index', rowIndex)
        .attr('data-personnel-index', index);

        
      const $header = $('<div>').addClass('personnel-header');

      if (person.applicRefId) {
        const applicData = this.model.applicMap[person.applicRefId];
        if (applicData) {
          const $applicTag = this.renderApplicTag(applicData, true, rowIndex,"personnel", index);
          $header.append($applicTag);
        }
      }  
      
      
      // Заголовок блока с кнопкой удаления
      
      // Кнопка удаления
      const $deleteButton = $('<button>')
        .addClass('btn btn-sm btn-outline-danger remove-personnel-btn edit-mode-btn')
        .html('&times;')
        .attr('title', 'Удалить блок')
        .on('click', () => {
          if (confirm('Удалить этот блок?')) {
            this.model.removePersonnel(rowIndex, index);
          }
        });

      const $divDeleteBtn = $('<div>').attr('style', 'display: flex; justify-content: center;');
      $divDeleteBtn.append($deleteButton);
      $header.append($divDeleteBtn);
      
      $personBlock.append($header);
      
      // Поле для ввода количества человек
      const $numContainer = $('<div>').addClass('personnel-input-container');
      $numContainer.append($('<label>').text('Кол-во:'));
      
      const $numInput = $('<input>')
        .attr('type', 'number')
        .addClass('personnel-num-input')
        .val(person.numRequired)
        .on('change', () => {
          this.model.updatePersonnelField(rowIndex, index, 'numRequired', $numInput.val());
        });
      
      $numContainer.append($numInput);
      $personBlock.append($numContainer)
      
      // Выпадающий список для специализации
      const $catContainer = $('<div>').addClass('personnel-input-container-spec');
      $catContainer.append($('<label>').text('Специализация:'));
      
      const $catSelect = $('<select>').addClass('personnel-cat-select');
      // Заполняем значениями из справочника
      const personCatDict = DictionariesTC.getDictionary("personCatDict");
      Object.entries(personCatDict).forEach(([key, value]) => {
        $catSelect.append($('<option>').val(key).text(value));
      });
      $catSelect.val(person.personCategoryCode);
      
      $catSelect.on('change', () => {
        this.model.updatePersonnelField(rowIndex, index, 'personCategoryCode', $catSelect.val());
      });
      
      $catContainer.append($catSelect);
      $personBlock.append($catContainer);
      
      // Добавляем применимость, если есть
      
      
      $container.append($personBlock);
    });
    
    const $addButton = $('<button>')
      .addClass('btn btn-sm btn-outline-primary add-personnel-btn edit-mode-btn')
      .text('+ Добавить блок')
      .on('click', () => {
        this.model.addPersonnel(rowIndex);
      });
      
    const $divButton = $('<div>').attr('style', 'display: flex; justify-content: center; margin-top: 5px;');
    $divButton.append($addButton);

    $container.append($divButton);

    if (!this.editable){
      $addButton.hide();
    }else{
      $addButton.show();
    }
    
    $cell.append($container);
  }


  renderZoneCell($cell, task, rowIndex) {
    $cell.empty();
    const $container = $('<div>').addClass('work-area-groups-container');
    $cell.append($container);
    
    // Фильтруем группы, содержащие зоны
    const zoneGroups = (task.workAreaLocationGroups || []).filter(group => 
        group.type === 'zone' || group.zones.length > 0
    );
    
    // Рендерим группы с зонами
    zoneGroups.forEach((group, index) => {
        // Находим оригинальный индекс группы в общем массиве
        const originalGroupIndex = task.workAreaLocationGroups.indexOf(group);
        $container.append(this.renderZoneGroup(group, originalGroupIndex, rowIndex));
    });
    
    // Кнопка добавления группы зон
    const $addButton = $('<button>')
        .addClass('btn btn-sm btn-outline-primary add-zone-group-btn edit-mode-btn')
        .text('+').attr("title", "Добавить блок зон")
        .on('click', () => {
            this.model.addWorkAreaLocationGroup(rowIndex, 'zone');
        });
    
    if (!this.editable) $addButton.hide();
    
    const $buttonContainer = $('<div>').attr('style', 'text-align: center; margin-top: 10px;');
    $buttonContainer.append($addButton);
    $container.append($buttonContainer);
}

  renderZoneInGroup(zone, rowIndex, groupIndex, zoneIndex) {
    const $zoneBlock = $('<div>').addClass('zone-in-group');
    
    const $zoneSelect = $('<select>').addClass('zone-number-select');
    const zoneNumberDict = DictionariesTC.getDictionary("zoneNumber");
    Object.entries(zoneNumberDict).forEach(([key, value]) => {
        $zoneSelect.append($('<option>').val(key).text(value));
    });
    $zoneSelect.val(zone.zoneNumber);
    
    $zoneSelect.on('change', e => {
        this.model.updateZoneField(rowIndex, groupIndex, zoneIndex, 'zoneNumber', e.target.value);
    });
    
    const $deleteButton = $('<button>')
        .addClass('btn btn-xs btn-outline-danger remove-zone-btn edit-mode-btn')
        .html('&times;')
        .attr('title', 'Удалить зону')
        .on('click', () => {
            if (confirm('Удалить эту зону?')) {
                this.model.removeZoneFromGroup(rowIndex, groupIndex, zoneIndex);
            }
        });
    
    if (!this.editable) $deleteButton.hide();
    
    $zoneBlock.append($zoneSelect, $deleteButton);
    return $zoneBlock;
  }

  renderZoneInGroup(zone, rowIndex, groupIndex, zoneIndex) {
    const $zoneBlock = $('<div>').addClass('zone-in-group');
    
    const $zoneSelect = $('<select>').addClass('zone-number-select');
    const zoneNumberDict = DictionariesTC.getDictionary("zoneNumber");
    Object.entries(zoneNumberDict).forEach(([key, value]) => {
        $zoneSelect.append($('<option>').val(key).text(value));
    });
    $zoneSelect.val(zone.zoneNumber);
    
    $zoneSelect.on('change', e => {
        this.model.updateZoneField(rowIndex, groupIndex, zoneIndex, 'zoneNumber', e.target.value);
    });
    
    const $deleteButton = $('<button>')
        .addClass('btn btn-xs btn-outline-danger remove-zone-btn edit-mode-btn')
        .html('&times;')
        .attr('title', 'Удалить зону')
        .on('click', () => {
            if (confirm('Удалить эту зону?')) {
                this.model.removeZoneFromGroup(rowIndex, groupIndex, zoneIndex);
            }
        });
    
    if (!this.editable) $deleteButton.hide();
    
    $zoneBlock.append($zoneSelect, $deleteButton);
    return $zoneBlock;
  }

renderWorkAreaLocationGroup(group, groupIndex, rowIndex) {
    const $groupBlock = $('<div>')
        .addClass('work-area-group-block')
        .attr('data-group-index', groupIndex)
        .attr('data-task-index', rowIndex);

    // Заголовок блока с применимостью и кнопкой удаления
    const $header = $('<div>').addClass('work-area-group-header');
    
    // Применимость группы
    if (group.applicRefId) {
        const $applicTag = this.renderApplicTag(
            {
                id: group.applicRefId,
                displayValue: this.model.getApplicDisplayValue(group.applicRefId)
            },
            true,
            rowIndex,
            "workAreaGroup",
            groupIndex
        );
        $header.append($applicTag);
    }
    
    // Кнопка удаления группы
    const $deleteButton = $('<button>')
        .addClass('btn btn-sm btn-outline-danger remove-group-btn edit-mode-btn')
        .html('&times;')
        .attr('title', 'Удалить блок')
        .attr("style", "margin-top: 4px; margin-left: 4px;")
        .on('click', () => {
            if (confirm('Удалить этот блок?')) {
                this.model.removeWorkAreaLocationGroup(rowIndex, groupIndex);
            }
        });
    
    if (!this.editable) $deleteButton.hide();
    $header.append($deleteButton);
    $groupBlock.append($header);

    // Содержимое группы - зоны или точки доступа
    const $content = $('<div>').addClass('work-area-group-content');
    
    // Рендерим зоны
    if (group.zones && group.zones.length > 0) {
        const $zonesContainer = $('<div>').addClass('zones-container');
        group.zones.forEach((zone, zoneIndex) => {
            $zonesContainer.append(this.renderZoneInGroup(zone, rowIndex, groupIndex, zoneIndex));
        });
        
        // Кнопка добавления зоны
        const $addZoneButton = $('<button>')
            .addClass('btn btn-sm btn-outline-secondary add-zone-btn edit-mode-btn')
            .text('+').attr("title", "Добавить зону")
            .on('click', () => {
                this.model.addZoneToGroup(rowIndex, groupIndex);
            });
        
        if (!this.editable) $addZoneButton.hide();
        $zonesContainer.append($('<div>').attr('style', 'text-align: center; margin-top: 5px;').append($addZoneButton));
        $content.append($zonesContainer);
    }
    
    // Рендерим точки доступа
    if (group.accessPoints && group.accessPoints.length > 0) {
        const $accessContainer = $('<div>').addClass('access-points-container');
        group.accessPoints.forEach((access, accessIndex) => {
            $accessContainer.append(this.renderAccessPointInGroup(access, rowIndex, groupIndex, accessIndex));
        });
        
        // Кнопка добавления точки доступа
        const $addAccessButton = $('<button>')
            .addClass('btn btn-sm btn-outline-secondary add-access-btn edit-mode-btn')
            .text('+ Добавить доступ')
            .on('click', () => {
                this.model.addAccessPointToGroup(rowIndex, groupIndex);
            });
        
        if (!this.editable) $addAccessButton.hide();
        $accessContainer.append($('<div>').attr('style', 'text-align: center; margin-top: 5px;').append($addAccessButton));
        $content.append($accessContainer);
    }
    
    $groupBlock.append($content);
    return $groupBlock;
}

renderZoneInGroup(zone, rowIndex, groupIndex, zoneIndex) {
    const $zoneBlock = $('<div>').addClass('zone-in-group');
    
    const $zoneSelect = $('<select>').addClass('zone-number-select');
    const zoneNumberDict = DictionariesTC.getDictionary("zoneNumber");
    Object.entries(zoneNumberDict).forEach(([key, value]) => {
        $zoneSelect.append($('<option>').val(key).text(value));
    });
    $zoneSelect.val(zone.zoneNumber);
    
    $zoneSelect.on('change', e => {
        this.model.updateZoneField(rowIndex, groupIndex, zoneIndex, 'zoneNumber', e.target.value);
    });
    
    const $deleteButton = $('<button>')
        .addClass('btn btn-xs btn-outline-danger remove-zone-btn edit-mode-btn')
        .html('&times;')
        .attr('title', 'Удалить зону')
        .on('click', () => {
            if (confirm('Удалить эту зону?')) {
                this.model.removeZoneFromGroup(rowIndex, groupIndex, zoneIndex);
            }
        });
    
    if (!this.editable) $deleteButton.hide();
    
    $zoneBlock.append($zoneSelect, $deleteButton);
    return $zoneBlock;
}

renderAccessPointCell($cell, task, rowIndex) {
  $cell.empty();
  const $container = $('<div>').addClass('work-area-groups-container');
  $cell.append($container);
  
  // Фильтруем группы, содержащие точки доступа
  const accessGroups = (task.workAreaLocationGroups || []).filter(group => 
      group.type === 'access' || group.accessPoints.length > 0
  );
  
  // Рендерим группы с доступом
  accessGroups.forEach((group, index) => {
      // Находим оригинальный индекс группы в общем массиве
      const originalGroupIndex = task.workAreaLocationGroups.indexOf(group);
      $container.append(this.renderAccessGroup(group, originalGroupIndex, rowIndex));
  });
  
  // Кнопка добавления группы доступа
  const $addButton = $('<button>')
      .addClass('btn btn-sm btn-outline-primary add-access-group-btn edit-mode-btn')
      .text('+').attr("title", "Добавить блок точек доступа")
      .on('click', () => {
          this.model.addWorkAreaLocationGroup(rowIndex, 'access');
      });
  
  if (!this.editable) $addButton.hide();
  
  const $buttonContainer = $('<div>').attr('style', 'text-align: center; margin-top: 10px;');
  $buttonContainer.append($addButton);
  $container.append($buttonContainer);
}

renderAccessGroup(group, groupIndex, rowIndex) {
  const $groupBlock = $('<div>')
      .addClass('work-area-group-block access-group')
      .attr('data-group-index', groupIndex)
      .attr('data-task-index', rowIndex);

  // Заголовок блока с применимостью
  const $header = $('<div>').addClass('work-area-group-header');
  
  // Применимость группы
  if (group.applicRefId) {
      const $applicTag = this.renderApplicTag(
          {
              id: group.applicRefId,
              displayValue: this.model.getApplicDisplayValue(group.applicRefId)
          },
          true,
          rowIndex,
          "workAreaGroup",
          groupIndex
      );
      $header.append($applicTag);
  }
  
  // Кнопка удаления группы
  const $deleteButton = $('<button>')
      .addClass('btn btn-sm btn-outline-danger remove-group-btn edit-mode-btn')
      .html('&times;')
      .attr('title', 'Удалить блок')
      .attr("style", "margin-top: 4px; margin-left: 4px;")
      .on('click', () => {
          if (confirm('Удалить этот блок?')) {
              this.model.removeWorkAreaLocationGroup(rowIndex, groupIndex);
          }
      });
  
  if (!this.editable) $deleteButton.hide();
  $header.append($deleteButton);
  $groupBlock.append($header);

  // Содержимое группы - точки доступа
  const $content = $('<div>').addClass('work-area-group-content');
  
  const $accessContainer = $('<div>').addClass('access-points-container');
  group.accessPoints.forEach((access, accessIndex) => {
      $accessContainer.append(this.renderAccessPointInGroup(access, rowIndex, groupIndex, accessIndex));
  });
  
  // Кнопка добавления точки доступа
  const $addAccessButton = $('<button>')
      .addClass('btn btn-sm btn-outline-secondary add-access-btn edit-mode-btn')
      .text('+').attr("title", "Добавить точку доступа")
      .on('click', () => {
          this.model.addAccessPointToGroup(rowIndex, groupIndex);
      });
  
  if (!this.editable) $addAccessButton.hide();
  $accessContainer.append($('<div>').attr('style', 'text-align: center; margin-top: 5px;').append($addAccessButton));
  $content.append($accessContainer);
  
  $groupBlock.append($content);
  return $groupBlock;
}

renderAccessPointInGroup(access, rowIndex, groupIndex, accessIndex) {
  const $accessBlock = $('<div>').addClass('access-point-in-group');
  
  // Выбор номера точки доступа
  const $numberSelect = $('<select>').addClass('access-point-number-select');
  const accessPointDict = DictionariesTC.getDictionary("accessPointNumber");
  Object.entries(accessPointDict || {}).forEach(([key, value]) => {
      $numberSelect.append($('<option>').val(key).text(value));
  });
  $numberSelect.val(access.accessPointNumber);
  
  $numberSelect.on('change', e => {
      this.model.updateAccessPointField(rowIndex, groupIndex, accessIndex, 'accessPointNumber', e.target.value);
  });
  
  // Выбор типа точки доступа
  const $typeSelect = $('<select>').addClass('access-point-type-select');
  const accessTypeDict = DictionariesTC.getDictionary("accessPointType");
  Object.entries(accessTypeDict || {}).forEach(([key, value]) => {
      $typeSelect.append($('<option>').val(key).text(value));
  });
  $typeSelect.val(access.accessPointTypeValue);
  
  $typeSelect.on('change', e => {
      this.model.updateAccessPointField(rowIndex, groupIndex, accessIndex, 'accessPointTypeValue', e.target.value);
  });
  
  const $deleteButton = $('<button>')
      .addClass('btn btn-xs btn-outline-danger remove-access-btn edit-mode-btn')
      .html('&times;')
      .attr('title', 'Удалить точку доступа')
      .on('click', () => {
          if (confirm('Удалить эту точку доступа?')) {
              this.model.removeAccessPointFromGroup(rowIndex, groupIndex, accessIndex);
          }
      });
  
  if (!this.editable) $deleteButton.hide();
  
  $accessBlock.append($numberSelect, $typeSelect, $deleteButton);
  return $accessBlock;
}

  renderSingleZoneBlock(zone, zoneIndex, rowIndex) {
      const $block = $('<div>')
          .addClass('zone-block')
          .attr('data-zone-index', zoneIndex)
          .attr('data-task-index', rowIndex);

      // Применимость зоны
      const $applicTag = this.renderZoneApplic(zone, rowIndex, zoneIndex);
      if ($applicTag) {
          $block.append($applicTag);
      }

      const $header = $('<div>').addClass('zone-header');

      // Выпадающий список для номера зоны
      const $zoneSelect = $('<select>').addClass('zone-number-select');
      const zoneNumberDict = DictionariesTC.getDictionary("zoneNumber");
      Object.entries(zoneNumberDict).forEach(([key, value]) => {
          $zoneSelect.append($('<option>').val(key).text(value));
      });
      $zoneSelect.val(zone.zoneNumber);
      
      $zoneSelect.on('change', e => {
          this.model.updateZoneField(rowIndex, zoneIndex, 'zoneNumber', e.target.value);
      });

      $header.append($zoneSelect);

      // Кнопка удаления зоны
      const $deleteButton = $('<button>')
          .addClass('btn btn-sm btn-outline-danger remove-zone-btn edit-mode-btn')
          .html('&times;')
          .attr('title', 'Удалить зону')
          .on('click', () => {
              if (confirm('Удалить эту зону?')) {
                  this.model.removeZoneFromTask(rowIndex, zoneIndex);
              }
          });

      if (!this.editable) {
          $deleteButton.hide();
      } else {
          $deleteButton.show();
      }

      $header.append($deleteButton);
      $block.append($header);

      return $block;
  }

  renderZoneApplic(zone, rowIndex, zoneIndex) {
      if (!zone.applicRefId) return null;
      return this.renderApplicTag(
          {
              id: zone.applicRefId,
              displayValue: this.model.getApplicDisplayValue(zone.applicRefId)
          },
          true,
          rowIndex,
          "zone",  // targetType
          zoneIndex  
      ).addClass('zone-applic-tag');
  }

  updateZoneInRow(rowIndex, zoneIndex) {
      console.log('updateZoneInRow: rowIndex=', rowIndex, 'zoneIndex=', zoneIndex);
      try {
          const tasks = this.model.getFilteredTasks();
          if (!tasks || rowIndex < 0 || rowIndex >= tasks.length) return;
          const task = tasks[rowIndex];
          const zones = task.zoneNumbers || [];
          const zone = zones[zoneIndex];
          if (!zone) return;

          if (!this.$table) return;
          let $row = this.$table.find(`tr[data-task-index="${rowIndex}"]`);
          if (!$row.length) {
              const idVal = task.taskIdent || task.taskCode;
              if (idVal) $row = this.$table.find(`tr[data-task-id="${idVal}"]`);
          }
          if (!$row.length) return;

          const $zoneContainer = $row.find('.zone-container').first();
          if (!$zoneContainer.length) return;

          let $existingBlock = $zoneContainer.find(`.zone-block[data-zone-index="${zoneIndex}"]`);
          if (!$existingBlock.length) {
              $existingBlock = $zoneContainer.find('.zone-block').eq(zoneIndex);
          }

          const $newBlock = this.renderSingleZoneBlock(zone, zoneIndex, rowIndex);
          $newBlock.attr('data-zone-index', zoneIndex);

          if ($existingBlock.length) {
              $existingBlock.replaceWith($newBlock);
          } else {
              $zoneContainer.append($newBlock);
          }
      } catch (err) {
          console.error('updateZoneInRow error', err);
          this.render();
      }
  }

  renderZoneGroup(group, groupIndex, rowIndex) {
    const $groupBlock = $('<div>')
        .addClass('work-area-group-block zone-group')
        .attr('data-group-index', groupIndex)
        .attr('data-task-index', rowIndex);

    // Заголовок блока с применимостью
    const $header = $('<div>').addClass('work-area-group-header');
    
    // Применимость группы
    if (group.applicRefId) {
        const $applicTag = this.renderApplicTag(
            {
                id: group.applicRefId,
                displayValue: this.model.getApplicDisplayValue(group.applicRefId)
            },
            true,
            rowIndex,
            "workAreaGroup",
            groupIndex
        );
        $header.append($applicTag);
    }
    
    // Кнопка удаления группы
    const $deleteButton = $('<button>')
        .addClass('btn btn-sm btn-outline-danger remove-group-btn edit-mode-btn')
        .html('&times;')
        .attr('title', 'Удалить блок')
        .attr("style", "margin-top: 4px; margin-left: 4px;")
        .on('click', () => {
            if (confirm('Удалить этот блок?')) {
                this.model.removeWorkAreaLocationGroup(rowIndex, groupIndex);
            }
        });
    
    if (!this.editable) $deleteButton.hide();
    $header.append($deleteButton);
    $groupBlock.append($header);

    // Содержимое группы - зоны
    const $content = $('<div>').addClass('work-area-group-content');
    
    const $zonesContainer = $('<div>').addClass('zones-container');
    group.zones.forEach((zone, zoneIndex) => {
        $zonesContainer.append(this.renderZoneInGroup(zone, rowIndex, groupIndex, zoneIndex));
    });
    
    // Кнопка добавления зоны
    const $addZoneButton = $('<button>')
        .addClass('btn btn-sm btn-outline-secondary add-zone-btn edit-mode-btn')
        .text('+').attr("title", "Добавить зону")
        .on('click', () => {
            this.model.addZoneToGroup(rowIndex, groupIndex);
        });
    
    if (!this.editable) $addZoneButton.hide();
    $zonesContainer.append($('<div>').attr('style', 'text-align: center; margin-top: 5px; margin-bottom: 5px').append($addZoneButton));
    $content.append($zonesContainer);
    
    $groupBlock.append($content);
    return $groupBlock;
}
  
  updateZoneCell(rowIndex) {
    const tasks = this.model.getFilteredTasks();
    if (rowIndex < 0 || rowIndex >= tasks.length) return;
    
    const task = tasks[rowIndex];
    const $table = $('table.schedule-table');
    const $row = $table.find(`tbody tr[data-task-index="${rowIndex}"]`);
    if (!$row.length) return;
    
    // Находим индекс колонки zoneNumber
    const headers = this.model.getHeaders();
    const zoneColIndex = headers.findIndex(h => h.key === 'zoneNumber');
    if (zoneColIndex === -1) return;
    
    const $cell = $row.find('td').eq(zoneColIndex);
    this.renderZoneCell($cell, task, rowIndex);
  }

  updateAccessPointCell(rowIndex) {
    const tasks = this.model.getFilteredTasks();
    if (rowIndex < 0 || rowIndex >= tasks.length) return;
    
    const task = tasks[rowIndex];
    const $table = $('table.schedule-table');
    const $row = $table.find(`tbody tr[data-task-index="${rowIndex}"]`);
    if (!$row.length) return;
    
    // Находим индекс колонки accessPoint
    const headers = this.model.getHeaders();
    const accessColIndex = headers.findIndex(h => h.key === 'accessPoint');
    if (accessColIndex === -1) return;
    
    const $cell = $row.find('td').eq(accessColIndex);
    this.renderAccessPointCell($cell, task, rowIndex);
  }

  // Вспомогательные методы для определения типа группы
isZoneGroup(rowIndex, groupIndex) {
    const task = this.model.getFilteredTasks()[rowIndex];
    if (!task || !task.workAreaLocationGroups || groupIndex >= task.workAreaLocationGroups.length) return false;
    const group = task.workAreaLocationGroups[groupIndex];
    return group.zones && group.zones.length > 0;
}

isAccessGroup(rowIndex, groupIndex) {
    const task = this.model.getFilteredTasks()[rowIndex];
    if (!task || !task.workAreaLocationGroups || groupIndex >= task.workAreaLocationGroups.length) return false;
    const group = task.workAreaLocationGroups[groupIndex];
    return group.accessPoints && group.accessPoints.length > 0;
}

renderAmtossCell($cell, task, rowIndex) {
  $cell.empty();
  const $container = $('<div>').addClass('amtoss-container');
  $cell.append($container);
  
  // Рендерим каждый dmRef
  (task.dmRefs || []).forEach((dmRef, index) => {
      $container.append(this.renderDmRefBlock(dmRef, rowIndex, index));
  });
  
  // Кнопка добавления MD
  const $addButton = $('<button>')
      .addClass('btn btn-sm btn-outline-primary add-md-btn edit-mode-btn')
      .text('Добавить MD')
      .on('click', () => {
          if (this.dmCodeModal) {
              this.dmCodeModal.open(rowIndex);
          }
      });
  
  if (!this.editable) $addButton.hide();
  
  const $buttonContainer = $('<div>').attr('style', 'text-align: center; margin-top: 10px;');
  $buttonContainer.append($addButton);
  $container.append($buttonContainer);
}

renderDmRefBlock(dmRef, rowIndex, dmRefIndex) {
  const $block = $('<div>')
      .addClass('dmref-block')
      .attr('data-dmref-index', dmRefIndex)
      .attr('data-task-index', rowIndex);

  // Применимость
  if (dmRef.applicRefId) {
      const $applicTag = this.renderApplicTag(
          {
              id: dmRef.applicRefId,
              displayValue: this.model.getApplicDisplayValue(dmRef.applicRefId)
          },
          true,
          rowIndex,
          "dmRef",
          dmRefIndex
      );
      $block.append($applicTag);
  }

  // Отформатированное отображение dmCode
  const formattedCode = this.model.formatDmCodeDisplay(dmRef.dmCode);
  const $codeDisplay = $('<div>')
      .addClass('dmref-code-display')
      .text(formattedCode);

  // Кнопки управления
  const $controls = $('<div>').addClass('dmref-controls');
  
  const $editButton = $('<button>')
      .addClass('btn btn-xs btn-outline-primary edit-md-btn edit-mode-btn')
      .text('Ред.')
      .on('click', () => {
          if (this.dmCodeModal) {
              this.dmCodeModal.open(rowIndex, dmRefIndex);
          }
      });
  
  const $deleteButton = $('<button>')
      .addClass('btn btn-xs btn-outline-danger delete-md-btn edit-mode-btn')
      .html('&times;')
      .attr('title', 'Удалить MD')
      .on('click', () => {
          if (confirm('Удалить этот код модуля данных?')) {
              this.model.removeDmRef(rowIndex, dmRefIndex);
          }
      });

  if (!this.editable) {
      $editButton.hide();
      $deleteButton.hide();
  }

  $controls.append($editButton, $deleteButton);
  $block.append($codeDisplay, $controls);

  return $block;
}

renderChangeTypeCell($cell, task, rowIndex) {
  $cell.empty();
  const $container = $('<div>').addClass('change-type-container');
  
  const $select = $('<select>').addClass('change-type-select');
  
  // Компактные опции только с символами
  const dict = DictionariesTC.getDictionary("changeTypeDict");
            
            // Добавляем пустую опцию
            $select.append($('<option>').val('').text('---'));
            
            // Добавляем опции из справочника
            Object.entries(dict).forEach(([code, value]) => {
                $select.append($('<option>').val(code).text(value));
            });
  
  $select.val(task.changeType || '');
  
  $select.on('change', () => {
      this.model.updateChangeType(rowIndex, $select.val());
  });
  
  $container.append($select);
  $cell.append($container);
}

editSectionTitle($titleElement, currentTitle) {
  if (!this.editable) return;
  
  const $input = $('<input>')
      .addClass('section-title-input form-control')
      .val(currentTitle)
      .css({
          'font-size': 'inherit',
          'font-weight': 'inherit',
          'display': 'inline-block',
          'width': '80%'
      });
  
  // Заменяем текст на input
  $titleElement.hide().after($input);
  $input.focus().select();
  
  const saveTitle = () => {
      const newTitle = $input.val().trim();
      if (newTitle && newTitle !== currentTitle) {
          this.model.updateSectionTitle(currentTitle, newTitle);
      }
      $input.remove();
      $titleElement.show();
  };
  
  const cancelEdit = () => {
      $input.remove();
      $titleElement.show();
  };
  
  // Сохраняем по Enter или потере фокуса
  $input.on('keydown', (e) => {
      if (e.key === 'Enter') {
          saveTitle();
      } else if (e.key === 'Escape') {
          cancelEdit();
      }
  });
  
  $input.on('blur', () => {
      saveTitle();
  });
}

changeTaskSection(rowIndex, task) {
  const currentSection = task.taskTitle;
  const allSections = [...new Set(this.model.tasks.map(t => t.taskTitle))];
  
  // Создаем диалог с datalist для автодополнения
  const dialogHTML = `
      <div class="modal fade" id="changeSectionModal" tabindex="-1">
          <div class="modal-dialog">
              <div class="modal-content">
                  <div class="modal-header">
                      <h5 class="modal-title">Изменить раздел задачи</h5>
                      <button type="button" class="close" data-dismiss="modal">&times;</button>
                  </div>
                  <div class="modal-body">
                      <div class="form-group">
                          <label for="sectionCombo">Выберите или введите раздел:</label>
                          <input type="text" class="form-control" id="sectionCombo" 
                                 list="sectionOptions" value="${currentSection}" 
                                 placeholder="Введите название раздела">
                          <datalist id="sectionOptions">
                              ${allSections.map(section => 
                                  `<option value="${section}">${section}</option>`
                              ).join('')}
                          </datalist>
                      </div>
                      <div class="mt-2">
                          <small class="text-muted">
                              Существующие разделы: ${allSections.join(', ')}
                          </small>
                      </div>
                  </div>
                  <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-dismiss="modal">Отмена</button>
                      <button type="button" class="btn btn-primary" id="applySectionChange">Изменить</button>
                  </div>
              </div>
          </div>
      </div>
  `;

  $('#changeSectionModal').remove();
  $('body').append(dialogHTML);
  const $modal = $('#changeSectionModal');
  
  $('#applySectionChange').on('click', () => {
      const newSection = $('#sectionCombo').val().trim();
      if (newSection && newSection !== currentSection) {
          this.model.updateTaskSection(rowIndex, newSection);
          $modal.modal('hide');
      } else if (!newSection) {
          alert('Пожалуйста, введите название раздела');
      }
  });
  
  // Поддержка Enter для сохранения
  $('#sectionCombo').on('keypress', (e) => {
      if (e.which === 13) { // Enter
          $('#applySectionChange').click();
      }
  });
  
  $modal.on('hidden.bs.modal', () => {
      $modal.remove();
  });
  
  $modal.modal('show');
  setTimeout(() => {
      $('#sectionCombo').select();
  }, 500);
}

renderTaskDurationCell($cell, task, rowIndex) {
  $cell.empty();
  const $container = $('<div>').addClass('task-duration-container');
  $cell.append($container);
  
  // Рендерим каждый блок taskDuration
  (task.taskDurations || []).forEach((duration, index) => {
      $container.append(this.renderSingleTaskDurationBlock(duration, index, rowIndex));
  });
  
  // Кнопка добавления нового блока
  const $addButton = $('<button>')
      .addClass('btn btn-sm btn-outline-primary add-task-duration-btn edit-mode-btn')
      .text('+')
      .attr('title', 'Добавить трудоёмкость')
      .on('click', () => {
          this.model.addTaskDuration(rowIndex);
      });
  
  if (!this.editable)
    $addButton.hide();
  else
    $addButton.show();
  const $buttonContainer = $('<div>').attr('style', 'text-align: center; margin-top: 10px;');
  $buttonContainer.append($addButton);
  $container.append($buttonContainer);
}

/**
* Рендерит один блок трудоёмкости
*/
renderSingleTaskDurationBlock(duration, index, rowIndex) {
  const $block = $('<div>')
      .addClass('task-duration-block')
      .attr('data-duration-index', index)
      .attr('data-task-index', rowIndex);

  // Применимость (только для productionMaintData с taskDuration)
  if (duration.applicRefId) {
      const $applicTag = this.renderApplicTag(
          {
              id: duration.applicRefId,
              displayValue: this.model.getApplicDisplayValue(duration.applicRefId)
          },
          true,
          rowIndex,
          "taskDuration",
          index
      );
      $block.append($applicTag);
  }

  const $header = $('<div>').addClass('task-duration-header');

  // Кнопка удаления
  const $deleteButton = $('<button>')
      .addClass('btn btn-sm btn-outline-danger remove-task-duration-btn edit-mode-btn')
      .html('&times;')
      .attr('title', 'Удалить трудоёмкость')
      .on('click', () => {
          if (confirm('Удалить эту трудоёмкость?')) {
              this.model.removeTaskDuration(rowIndex, index);
          }
      });

  if (!this.editable)
    $deleteButton.hide();
  else
    $deleteButton.show();

  $header.append($deleteButton);
  $block.append($header);

  // Поля ввода для длительностей (только нужные)
  const fields = [
      { key: 'procedureDuration', label: 'Длительность:' },
      { key: 'startupDuration', label: 'Подготовка:' }
  ];

  fields.forEach(field => {
      const $row = $('<div>').addClass('task-duration-row');
      $row.append($('<div>').addClass('task-duration-label').text(field.label));

      const $input = $('<input type="text">')
          .addClass('task-duration-input')
          .val(duration[field.key])
          .on('blur', e => {
              this.model.updateTaskDurationField(rowIndex, index, field.key, e.target.value);
          });

      $row.append($input);
      $block.append($row);
  });

  return $block;
}

updateTaskDurationCell(rowIndex) {
  const tasks = this.model.getFilteredTasks();
  if (rowIndex < 0 || rowIndex >= tasks.length) return;
  
  const task = tasks[rowIndex];
  const $table = $('table.schedule-table');
  const $row = $table.find(`tbody tr[data-task-index="${rowIndex}"]`);
  if (!$row.length) return;
  
  // Находим индекс колонки taskDuration
  const headers = this.model.getHeaders();
  const durationColIndex = headers.findIndex(h => h.key === 'taskDuration');
  if (durationColIndex === -1) return;
  
  const $cell = $row.find('td').eq(durationColIndex);
  this.renderTaskDurationCell($cell, task, rowIndex);
}

/**
* Обновляет конкретный блок трудоёмкости в строке
*/
updateTaskDurationInRow(rowIndex, durationIndex) {
  // Для простоты перерисовываем всю ячейку
  // Можно оптимизировать, чтобы обновлять только конкретный блок
  this.updateTaskDurationCell(rowIndex);
}

  showTaskContextMenu(event, rowIndex, task) {
    // Создаем контекстное меню
    const $menu = $('<div>').addClass('context-menu task-context-menu');
    
    // Пункт "Удалить задачу"
    const $deleteOption = $('<div>').addClass('menu-option')
      .append($('<span>').text('Удалить задачу'))
      .on('click', () => {
        if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
          this.model.deleteTask(rowIndex);
        }
        $menu.remove();
      });
    
    $menu.append($deleteOption);
    
    const $changeSectionOption = $('<div>').addClass('menu-option')
    .append($('<span>').text('Изменить раздел'))
    .on('click', () => {
        this.changeTaskSection(rowIndex, task);
        $menu.remove();
    });

    // Пункт "Добавить применимость к строке" с выпадающим списком
    const $applicOption = $('<div>').addClass('menu-option with-submenu')
      .append($('<span>').text('Добавить применимость к строке →'));
      
      // Создаем подменю с применимостями
    const $submenu = $('<div>').addClass('submenu applicability-submenu');
      
    $menu.append($deleteOption, $changeSectionOption, $applicOption, $submenu);


    // Добавляем опцию "Без применимости"
    $submenu.append(
      $('<div>').addClass('submenu-option')
        .text('Без применимости')
        .on('click', () => {
          this.model.updateApplicForTask(rowIndex, null);
          $menu.remove();
        })
    );
    
    // Добавляем разделитель
    $submenu.append($('<div>').addClass('submenu-divider'));
    
    // Добавляем все доступные применимости
    Object.values(this.model.applicMap).forEach(applic => {
      $submenu.append(
        $('<div>').addClass('submenu-option')
          .text(applic.displayValue || applic.id)
          .on('click', () => {
            this.model.updateApplicForTask(rowIndex, applic.id);
            $menu.remove();
          })
      );
    });
    
    // Показываем подменю при наведении
    $applicOption.on('mouseenter', () => {
      $submenu.css({
        top: $applicOption.position().top,
        left: $applicOption.outerWidth()
      }).show();
    });
    
    $applicOption.on('mouseleave', () => {
      setTimeout(() => {
        if (!$submenu.is(':hover')) {
          $submenu.hide();
        }
      }, 100);
    });
    
    $submenu.on('mouseleave', () => {
      $submenu.hide();
    });
    
    $menu.append($applicOption);
    $menu.append($submenu);
    
    // Позиционируем меню рядом с курсором
    $menu.css({
      position: 'absolute',
      top: event.pageY,
      left: event.pageX,
      zIndex: 1000
    });
    
    // Добавляем меню на страницу
    $('body').append($menu);
    
    // Закрываем меню при клике вне его
    $(document).on('mousedown', (e) => {
      if (!$menu.is(e.target) && $menu.has(e.target).length === 0) {
        $menu.remove();
        $(document).off('mousedown');
      }
    });
    
    // Закрываем меню при нажатии ESC
    $(document).on('keydown', (e) => {
      if (e.key === 'Escape') {
        $menu.remove();
        $(document).off('keydown');
      }
    });
  }
}
