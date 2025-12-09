
class ScheduleView {
  constructor(model, $container) {
    this.model = model; // ScheduleTableModel instance
    this.$container = $container; // jQuery div where table will be rendered
    this.$table = null;

    this.dmCodeModal = new DmCodeModal(model);

    this.editable = false;

    // store last headers (index mapping)
    this.headers = [];

    this.config = model.config;

    this.activeViews = new Map(); // Для управления жизненным циклом

    this.initViewRegistry();

    // Подпишемся на изменения модели (и сохраним функцию отписки)
    if (typeof this.model.onChange === 'function') {
      // сохраним отписку, если понадобится
        this._unsubscribeModel = this.model.onChange((xml, meta) => {
          try {
            if (meta && meta.type === 'rqmtSource:set' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'rqmtSource');
              return;
            } 
            if (meta && meta.type === 'rqmtSource:added' && meta.payload) {
                const { rowIndex } = meta.payload;
                this.updateCell(rowIndex, 'rqmtSource');
                return;
            }
            
            if (meta && meta.type === 'rqmtSource:removed' && meta.payload) {
                const { rowIndex } = meta.payload;
                this.updateCell(rowIndex, 'rqmtSource');
                return;
            }
            
            if (meta && meta.type === 'rqmtSource:changed' && meta.payload) {
                const { rowIndex } = meta.payload;
                this.updateCell(rowIndex, 'rqmtSource');
                return;
            }

            if (meta && meta.type === 'limit:added' && meta.payload) {
              console.log('Limit added event received', meta.payload);
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'limit');
              return;
            }

            if (meta && meta.type === 'limit:intervalAdded' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'limit');
              return;
          }
          
          if (meta && meta.type === 'limit:intervalRemoved' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'limit');
              return;
          }
          
          if (meta && meta.type === 'limit:thresholdAdded' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'limit');
              return;
          }
          
          if (meta && meta.type === 'limit:thresholdRemoved' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'limit');
              return;
          }
          
          if (meta && meta.type === 'limit:intervalChanged' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'limit');
              return;
          }
          
          if (meta && meta.type === 'limit:thresholdChanged' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'limit');
              return;
          }
          
          if (meta && meta.type === 'limit:mainChanged' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'limit');
              return;
          }

            if (meta && meta.type === 'section:titleChanged' && meta.payload) {
              const { oldTitle, newTitle } = meta.payload;
              this.handleSectionTitleChange(oldTitle, newTitle);
              return;
            }
            if (meta && meta.type === 'taskDuration:added' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'taskDuration');
              return;
          }
          
          if (meta && meta.type === 'taskDuration:changed' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'taskDuration');
              return;
          }
          
          if (meta && meta.type === 'taskDuration:removed' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'taskDuration');
              return;
          }
          


            if (meta && meta.type === 'applicability:changed' && meta.payload) {
              const p = meta.payload;

              console.log('granular event payload:', meta);
              if (p.field === 'limit') {
                this.forceRenderCell(p.rowIndex, 'limit');
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

            if (meta && meta.type === 'remarks:changed' && meta.payload) {
              const p = meta.payload;
              console.log('Remarks changed event:', p);
              
              // Обновляем соответствующий элемент с использованием прямых данных
              if (p.target === 'limit') {
                this.updateLimitInRow(p.rowIndex, p.limitIndex);
              } else if (p.target === 'workArea') {
                if (this.model.isZoneGroup(p.rowIndex, p.groupIndex)) {
                  this.updateZoneCell(p.rowIndex);
                } else {
                  this.updateAccessPointCell(p.rowIndex);
                }
              } else if (p.target === 'task') {
                this.updateCell(p.rowIndex, 'taskDescr');
              }
              
              return;
            }

            if (meta && meta.type === 'remarks:added' && meta.payload) {
              const p = meta.payload;
              console.log('Remarks added event:', p);
              
              // Немедленно обновляем соответствующий элемент
              if (p.targetType === 'limit') {
                this.updateLimitInRow(p.rowIndex, p.index);
              } else if (p.targetType === 'workArea') {
                if (this.model.isZoneGroup(p.rowIndex, p.index)) {
                  this.updateZoneCell(p.rowIndex);
                } else {
                  this.updateAccessPointCell(p.rowIndex);
                }
              } else if (p.targetType === 'task') {
                this.updateCell(p.rowIndex, 'taskDescr');
              }
              
              // Фокусируемся на поле примечания через небольшую задержку
              setTimeout(() => {
                this.focusRemarksField(p.rowIndex, p.targetType, p.index);
              }, 100);
              
              return;
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

  initViewRegistry() {
    ViewRegistry.register('taskDuration', TaskDurationView);
    ViewRegistry.register('limit', LimitView);
    ViewRegistry.register('rqmtSource', RqmtSourceView);
    // Позже добавим другие представления здесь
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
    this.activeViews.forEach(view => view.destroy());
    this.activeViews.clear();
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
          .append($('<td>', { 
              colspan: headers.length, 
              class: 'common-info-cell text-center' 
          }).append(
              $('<div>').addClass('d-flex align-items-center justify-content-center position-relative')
                  .append(
                      $('<span>')
                          .addClass('section-title editable-section-title')
                          .text(title)
                          .attr('data-original-title', title),
                      
                      // Создаем кнопку добавления
                      (() => {
                          const $addButton = $('<button>', { 
                              class: 'btn btn-sm btn-outline-primary btn-icon btn-add btn-square edit-mode-btn',
                              style: 'right: 10px;' 
                          })
                          .text('+')
                          .on('click', () => this.model.addNewSection());
                          
                          // Управляем видимостью в зависимости от режима редактирования
                          if (!this.editable) {
                              $addButton.hide();
                          } else {
                              $addButton.show();
                          }
                          
                          return $addButton;
                      })()
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
                        class: 'btn btn-sm ml-2 btn-outline-primary btn-add btn-icon btn-square edit-mode-btn',
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
          // Используем ViewRegistry для создания представления
          const view = ViewRegistry.create(h.key, this.model, rowIndex, this.editable);
          
          // Сохраняем представление для последующего обновления
          const viewKey = `${rowIndex}-${h.key}`;
          this.activeViews.set(viewKey, view);
          
          // Рендерим и добавляем в ячейку
          $cell.append(view.render());
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
          // Используем ViewRegistry для создания представления
          const view = ViewRegistry.create(h.key, this.model, rowIndex, this.editable);
          
          // Сохраняем представление для последующего обновления
          const viewKey = `${rowIndex}-${h.key}`;
          this.activeViews.set(viewKey, view);
          
          // Рендерим и добавляем в ячейку
          $cell.append(view.render());
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
        

          if (task.remarks != undefined) {
            const $remarksBlock = this.renderRemarksField(task.remarks, rowIndex, 'task');
            if ($remarksBlock) {
              $contentContainer.append($remarksBlock);
            }
          }
          
          // Добавляем режим контроля, если есть TODO убрать мб
          if (task.supervisorLevelCode != undefined) {
            const $supervisorBlock = $('<div>').addClass('supervisor-block');
            
            // $supervisorBlock.append(
            //     $('<div>').addClass('supervisor-label').text('Режим контроля:')
            // );
            
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

        if (h.key === 'rqmtSource') {
          // Используем ViewRegistry для создания представления
          const view = ViewRegistry.create(h.key, this.model, rowIndex, this.editable);
          
          // Сохраняем представление для последующего обновления
          const viewKey = `${rowIndex}-${h.key}`;
          this.activeViews.set(viewKey, view);
          
          // Рендерим и добавляем в ячейку
          $cell.append(view.render());
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

  // Обновляем обычные редактируемые ячейки
  this.$table.find('td.editable-cell div.editable-text')
    .attr('contenteditable', editable);

  // Обновляем поля примечаний
  const $remarksTexts = this.$table.find('.remarks-text');
  $remarksTexts.attr('contenteditable', editable);

  this.activeViews.forEach((view, key) => {
    view.editable = editable;
    // Принудительно обновляем отображение
    const [rowIndex, colKey] = key.split('-');
    this.forceRenderCell(parseInt(rowIndex), colKey);
  });

  // Показываем/скрываем кнопки редактирования
  const $editButtons = $(document).find('.edit-mode-btn');
  if (editable) {
    $editButtons.show();
    // Показываем все блоки примечаний в режиме редактирования
    this.$table.find('.remarks-block').show();
  } else {
    $editButtons.hide();
    // Скрываем пустые примечания в режиме просмотра
    this.$table.find('.remarks-block').each(function() {
      const $block = $(this);
      const $text = $block.find('.remarks-text');
      if (!$text.text().trim()) {
        $block.hide();
      }
    });
  }
}

  updateView(isEditMode) {
    this.editable = isEditMode;
    this.render();
    this.setEditable(isEditMode);
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
          .addClass('btn-outline-danger btn-remove btn-icon btn-square delete-applic edit-mode-btn')
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
        .addClass('btn btn-sm btn-outline-danger btn-remove edit-mode-btn')
        // .html('&times;')
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
      .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
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
        .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
        .text('Добавить зоны').attr("title", "Добавить блок зон")
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
        .addClass('btn btn-xs btn-outline-danger btn-remove edit-mode-btn')
        // .html('&times;')
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
        .addClass('btn btn-xs btn-outline-danger btn-remove edit-mode-btn')
        // .html('&times;')
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
        .addClass('btn btn-sm btn-outline-danger btn-remove edit-mode-btn')
        // .html('&times;')
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
            .addClass('btn btn-sm btn-outline-secondary btn-add edit-mode-btn')
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
            .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
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
        .addClass('btn btn-xs btn-outline-danger btn-remove edit-mode-btn')
        // .html('&times;')
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
      .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
      .text('Добавить точки доступа').attr("title", "Добавить блок точек доступа")
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
      .addClass('btn btn-sm btn-outline-danger btn-remove edit-mode-btn')
      // .html('&times;')
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
      .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
      .text('+').attr("title", "Добавить точку доступа")
      .on('click', () => {
          this.model.addAccessPointToGroup(rowIndex, groupIndex);
      });
  
  if (!this.editable) $addAccessButton.hide();
  $accessContainer.append($('<div>').attr('style', 'text-align: center; margin-top: 5px;').append($addAccessButton));
  $content.append($accessContainer);

  $groupBlock.append($content);
  const workAreaRemarks = group.remarks ? group.remarks.text : undefined;

  if (workAreaRemarks != undefined) {
    const $remarksBlock = this.renderRemarksField(workAreaRemarks, rowIndex, 'workArea', groupIndex);
    if ($remarksBlock) {
      $groupBlock.append($remarksBlock);
    }
}
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
      .addClass('btn btn-xs btn-outline-danger btn-remove edit-mode-btn')
      // .html('&times;')
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
          .addClass('btn btn-sm btn-outline-danger btn-remove edit-mode-btn')
          // .html('&times;')
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
        .addClass('btn btn-sm btn-outline-danger btn-remove edit-mode-btn')
        // .html('&times;')
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
      .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn')
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
      .addClass('btn btn-xs btn-outline-danger btn-remove edit-mode-btn')
      // .html('&times;')
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


/**
* Рендерит один блок трудоёмкости
*/


renderRemarksField(remarks, rowIndex, targetType, targetIndex = null) {
  console.log('Rendering remarks field:', { remarks, rowIndex, targetType, targetIndex, editable: this.editable });
  
  // ВАЖНОЕ ИЗМЕНЕНИЕ: всегда показываем блок если в XML есть remarks (даже пустой)
  // или если мы в режиме редактирования
  const shouldShow = remarks !== undefined && remarks !== null;
  
  if (!shouldShow && !this.editable) {
    return null;
  }

  const $container = $('<div>').addClass('remarks-block');
  
  // Заголовок "Примечание:"
  const $label = $('<div>').addClass('remarks-label').text('Примечание:');
  $container.append($label);
  
  // Поле для текста
  const displayText = remarks || '';
  const $textField = $('<div>')
    .addClass('remarks-text')
    .text(displayText)
    .attr('data-row-index', rowIndex)
    .attr('data-target-type', targetType);
  
  if (targetIndex !== null) {
    $textField.attr('data-target-index', targetIndex);
  }
  
  // Если в режиме редактирования - делаем редактируемым
  if (this.editable) {
    $textField.attr('contenteditable', 'true');
    
    // Обработчик сохранения при потере фокуса
    $textField.on('blur', () => {
      const newText = $textField.text().trim();
      console.log('Remarks field blurred, saving:', newText);
      this.saveRemarks(rowIndex, targetType, targetIndex, newText);
    });
    
    // Обработчики клавиш
    $textField.on('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        $textField.blur();
      } else if (e.key === 'Escape') {
        $textField.text(displayText).blur();
      }
    });
  }
  
  $container.append($textField);
  console.log('Remarks field rendered');
  return $container;
}


removeRemarks(rowIndex, targetType, targetIndex = null) {
  // Просто сохраняем пустую строку - это удалит примечание
  this.saveRemarks(rowIndex, targetType, targetIndex, '');
}

/**
 * Начинает редактирование примечания (когда кликаем на плейсхолдер)
 */
startRemarksEditing(rowIndex, targetType, targetIndex = null) {
  const currentRemarks = this.model.getRemarks(targetType, rowIndex, targetIndex);
  
  // Находим соответствующий контейнер примечания
  let $container = null;
  
  switch (targetType) {
    case 'task':
      $container = $(`tr[data-task-index="${rowIndex}"] .remarks-field-container`);
      break;
    case 'limit':
      $container = $(`tr[data-task-index="${rowIndex}"] .limit-block[data-limit-index="${targetIndex}"] .remarks-field-container`);
      break;
    case 'workArea':
      $container = $(`tr[data-task-index="${rowIndex}"] .work-area-group-block[data-group-index="${targetIndex}"] .remarks-field-container`);
      break;
  }
  
  if ($container.length > 0) {
    const $inputField = $container.find('.remarks-input');
    if ($inputField.length > 0) {
      $inputField.focus();
      this.selectAllText($inputField[0]);
    }
  } else {
    // Если контейнера нет (примечание еще не создано), создаем его
    this.model.addRemarksQuick(targetType, rowIndex, targetIndex);
    
    // Ждем обновления DOM и фокусируемся
    setTimeout(() => {
      this.startRemarksEditing(rowIndex, targetType, targetIndex);
    }, 100);
  }
}

selectAllText(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Сохраняет примечание
 */
saveRemarks(rowIndex, targetType, targetIndex, remarks) {
  console.log('Saving remarks:', { rowIndex, targetType, targetIndex, remarks });
  
  // Если текст пустой, удаляем примечание (но оставляем поле в данных)
  if (!remarks || remarks.trim().length === 0) {
    remarks = '';
  }

  switch (targetType) {
    case 'limit':
      this.model.updateLimitRemarks(rowIndex, targetIndex, remarks);
      break;
    case 'workArea':
      this.model.updateWorkAreaRemarks(rowIndex, targetIndex, remarks);
      break;
    case 'task':
      this.model.updateTaskRemarks(rowIndex, remarks);
      break;
  }
}

showTaskContextMenu(event, rowIndex, task) {
  // Определяем тип элемента по тому, на что кликнули
  const targetElement = $(event.target);
  let context = this.determineContext(targetElement, rowIndex, task);

  
  
  const $menu = $('<div>').addClass('context-menu task-context-menu');
  if (context) {
    const hasRemarks = this.model.hasRemarks(context.type, rowIndex, context.index);
    const $remarksOption = $('<div>').addClass('menu-option')
      .append($('<span>').text(hasRemarks ? 'Редактировать примечание' : 'Добавить примечание'))
      .on('click', () => {
        if (hasRemarks) {
          // Фокусируемся на существующем примечании
          this.focusRemarksField(rowIndex, context.type, context.index);
        } else {
          // Добавляем пустое примечание
          this.model.addRemarksQuick(context.type, rowIndex, context.index);
        }
        $menu.remove();
      });
    
    $menu.append($remarksOption);
  }
  // Основные пункты меню
  const $deleteOption = $('<div>').addClass('menu-option')
    .append($('<span>').text('Удалить задачу'))
    .on('click', () => {
      if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        this.model.deleteTask(rowIndex);
      }
      $menu.remove();
    });

  const $changeSectionOption = $('<div>').addClass('menu-option')
    .append($('<span>').text('Изменить раздел'))
    .on('click', () => {
      this.changeTaskSection(rowIndex, task);
      $menu.remove();
    });

  $menu.append($deleteOption, $changeSectionOption);

  // Пункт для добавления примечания в текущий контекст
  if (context) {
    const hasRemarks = this.model.hasRemarks(context.type, rowIndex, context.index);
    const $remarksOption = $('<div>').addClass('menu-option')
      .append($('<span>').text(hasRemarks ? 'Редактировать примечание' : 'Добавить примечание'))
      .on('click', () => {
        if (hasRemarks) {
          this.focusRemarksField(rowIndex, context.type, context.index);
        } else {
          this.model.addRemarksQuick(context.type, rowIndex, context.index);
        }
        $menu.remove();
      });
    
    $menu.append($remarksOption);
  }

  // ВЕРНЁМ ПУНКТ ДЛЯ ПРИМЕНИМОСТИ ЗАДАЧИ
  const $applicOption = $('<div>').addClass('menu-option with-submenu')
    .append($('<span>').text('Применимость задачи →'));

  // Создаем подменю с применимостями
  const $submenu = $('<div>').addClass('submenu applicability-submenu');
  
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
  
  $menu.append($applicOption, $submenu);

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

  // Позиционируем меню
  $menu.css({
    position: 'absolute',
    top: event.pageY,
    left: event.pageX,
    zIndex: 1000
  });

  $('body').append($menu);

  // Закрытие меню
  $(document).on('mousedown', (e) => {
    if (!$menu.is(e.target) && $menu.has(e.target).length === 0) {
      $menu.remove();
      $(document).off('mousedown');
    }
  });

  $(document).on('keydown', (e) => {
    if (e.key === 'Escape') {
      $menu.remove();
      $(document).off('keydown');
    }
  });
}
  /**
   * Определяет контекст клика - на каком элементе было вызвано меню
   */
  determineContext($target, rowIndex, task) {
    // Проверяем limit блоки
    const $limitBlock = $target.closest('.limit-block');
    if ($limitBlock.length) {
      const limitIndex = $limitBlock.data('limit-index');
      return { type: 'limit', index: limitIndex };
    }

    // Проверяем workArea группы
    const $workAreaGroup = $target.closest('.work-area-group-block');
    if ($workAreaGroup.length) {
      const groupIndex = $workAreaGroup.data('group-index');
      return { type: 'workArea', index: groupIndex };
    }

    // Проверяем ячейку описания задачи
    const $taskDescrCell = $target.closest('td[data-field="taskDescr"]');
    if ($taskDescrCell.length) {
      return { type: 'task', index: null };
    }

    // Если клик был на другой ячейке строки - считаем что это контекст задачи
    const $taskRow = $target.closest('tr[data-task-index]');
    if ($taskRow.length) {
      return { type: 'task', index: null };
    }

    return null;
  }

  /**
   * Фокусируется на поле примечания
   */
  focusRemarksField(rowIndex, targetType, targetIndex = null) {
    console.log('Focusing remarks field:', { rowIndex, targetType, targetIndex });
    
    let selector = '';
    
    switch (targetType) {
      case 'task':
        selector = `tr[data-task-index="${rowIndex}"] .remarks-text`;
        break;
      case 'limit':
        selector = `tr[data-task-index="${rowIndex}"] .limit-block[data-limit-index="${targetIndex}"] .remarks-text`;
        break;
      case 'workArea':
        selector = `tr[data-task-index="${rowIndex}"] .work-area-group-block[data-group-index="${targetIndex}"] .remarks-text`;
        break;
    }
    
    const $field = $(selector);
    console.log('Found field:', $field.length, $field);
    
    if ($field.length > 0) {
      // Убедимся, что поле редактируемое
      $field.attr('contenteditable', 'true');
      
      // Фокусируемся
      $field.focus();
      
      // Помещаем курсор в конец текста
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents($field[0]);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      
      console.log('Field focused successfully');
    } else {
      console.warn('Remarks field not found with selector:', selector);
    }
  }

  /**
   * Выделяет текст в contenteditable элементе
   */
  selectText(element, start, end) {
    if (document.createRange && window.getSelection) {
      const range = document.createRange();
      range.selectNodeContents(element);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Устанавливаем курсор в конец
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  updateTaskDurationCell(rowIndex) {
    const tasks = this.model.getFilteredTasks();
    if (rowIndex < 0 || rowIndex >= tasks.length) return;
    
    const $table = $('table.schedule-table');
    const $row = $table.find(`tbody tr[data-task-index="${rowIndex}"]`);
    if (!$row.length) return;
    
    const headers = this.model.getHeaders();
    const durationColIndex = headers.findIndex(h => h.key === 'taskDuration');
    if (durationColIndex === -1) return;
    
    const $cell = $row.find('td').eq(durationColIndex);
    $cell.empty();
    
    const taskDurationView = new TaskDurationView(this.model, rowIndex, this.editable);
    $cell.append(taskDurationView.render());
}

updateCell(rowIndex, colKey) {
  const viewKey = `${rowIndex}-${colKey}`;
  let view = this.activeViews.get(viewKey);
  
  if (view) {
      // Обновляем свойство editable на актуальное
      view.editable = this.editable;
      const $newContent = view.update();
      
      const $table = $('table.schedule-table');
      const $row = $table.find(`tbody tr[data-task-index="${rowIndex}"]`);
      const colIndex = this.model.getHeaders().findIndex(h => h.key === colKey);
      const $cell = $row.find('td').eq(colIndex);
      
      $cell.empty().append($newContent);
  } else {
      // Если view нет в activeViews, создаем новый
      this.forceRenderCell(rowIndex, colKey);
  }
}

// Новый метод для принудительного рендеринга ячейки
forceRenderCell(rowIndex, colKey) {
  const $table = $('table.schedule-table');
  const $row = $table.find(`tbody tr[data-task-index="${rowIndex}"]`);
  const colIndex = this.model.getHeaders().findIndex(h => h.key === colKey);
  const $cell = $row.find('td').eq(colIndex);
  
  if ($cell.length) {
      $cell.empty();
      
      const view = ViewRegistry.create(colKey, this.model, rowIndex, this.editable);
      if (view) {
          const viewKey = `${rowIndex}-${colKey}`;
          this.activeViews.set(viewKey, view);
          $cell.append(view.render());
      }
  }
}

removeRowViews(rowIndex) {
  // Удаляем все представления для этой строки
  for (const [key, view] of this.activeViews.entries()) {
      if (key.startsWith(`${rowIndex}-`)) {
          view.destroy();
          this.activeViews.delete(key);
      }
  }
}


/* удалиени таблицы*/


clearContext() {
  console.log('Clearing ScheduleView context...');
  
  // 1. Удаляем все активные представления
  this.activeViews.forEach(view => {
      try {
          if (view && typeof view.destroy === 'function') {
              view.destroy();
          }
      } catch (err) {
          console.error('Error destroying view:', err);
      }
  });
  this.activeViews.clear();
  
  // 2. Удаляем таблицу из DOM
  if (this.$table) {
      this.$table.remove();
      this.$table = null;
  }
  
  // 3. Очищаем обработчики событий (кроме основных, зарегистрированных в конструкторе)
  // Удаляем все обработчики, привязанные к контейнеру, кроме базовых
  this.$container.off('.scheduleview');
  
  // 4. Очищаем кешированные данные
  this.headers = [];
  
  // 5. Закрываем открытые модальные окна
  this.closeAllModals();
  
  // 6. Очищаем временные данные
  this.cleanupTemporaryData();
  
  console.log('ScheduleView context cleared');
}

/**
* Закрывает все открытые модальные окна
*/
closeAllModals() {
  // Закрываем Bootstrap модальные окна
  $('.modal').modal('hide');
  
  // Удаляем модальные окна, созданные нашим кодом
  $('.modal-backdrop').remove();
  $('body').removeClass('modal-open');
  
  // Удаляем кастомные модальные окна
  $('.custom-modal, .context-menu, .task-context-menu').remove();
  
  // Закрываем DmCodeModal если он открыт
  if (this.dmCodeModal && typeof this.dmCodeModal.close === 'function') {
      this.dmCodeModal.close();
  }
}

/**
* Очищает временные данные
*/
cleanupTemporaryData() {
  // Очищаем временные переменные
  this.dragSourceRow = null;
  this.dragTargetRow = null;
  
  // Сбрасываем состояние редактирования
  this.editingElement = null;
  
  // Очищаем выбранные элементы
  $('.selected-task, .selected-row').removeClass('selected-task selected-row');
  
  // Удаляем временные элементы
  $('.temp-highlight, .drag-placeholder, .drop-indicator').remove();
}

/**
* Сбрасывает состояние при переключении режимов редактирования
*/
resetViewState() {
  // Сбрасываем все интерактивные состояния
  this.isDragging = false;
  this.isEditing = false;
  this.isSelecting = false;
  
  // Удаляем выделение текста
  if (window.getSelection) {
      window.getSelection().removeAllRanges();
  }
  
  // Скрываем контекстные меню
  $('.context-menu, .submenu').remove();
  
  // Сбрасываем фокус
  $(document.activeElement).blur();
}

// // Обновляем метод renderTaskTable, чтобы он начинался с очистки контекста:
// renderTaskTable() {
//   // Очищаем контекст перед рендерингом новой таблицы
//   this.clearContext();
  
//   console.log('Full render with clean context');
  
//   // Создаем новую таблицу
//   this.$table = $('<table>', { class: 'table table-bordered schedule-table' });
  
//   // ... остальной существующий код метода renderTaskTable ...
// }

// Обновляем метод updateView, чтобы очищал контекст при смене режима:
updateView(isEditMode) {
  // Очищаем контекст перед сменой режима
  this.clearContext();
  
  this.editable = isEditMode;
  this.render();
  this.setEditable(isEditMode);
}

// Добавляем метод для ручной очистки (может вызываться извне):
destroy() {
  console.log('Destroying ScheduleView...');
  
  // 1. Отписываемся от изменений модели
  if (typeof this._unsubscribeModel === 'function') {
      this._unsubscribeModel();
      this._unsubscribeModel = null;
  }
  
  // 2. Полностью очищаем контекст
  this.clearContext();
  
  // 3. Удаляем все обработчики событий
  this.$container.off();
  
  // 4. Очищаем ссылки
  this.model = null;
  this.$container = null;
  this.dmCodeModal = null;
  
  // 5. Удаляем все дочерние элементы из контейнера
  this.$container.empty();
  
  console.log('ScheduleView destroyed');
}


  /**
 * Фокусируется на поле примечания
 */

}
