
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

    this.applicView = new ApplicView(model.applicManager, model);

    this.initViewRegistry();

    this.initPreviewListeners();

  this.setupModeListeners();

  

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
              const viewKey = `${rowIndex}-rqmtSource`;
              const view = this.activeViews.get(viewKey);
              
              // if (view && typeof view.addSourceBlock === 'function') {
              //     view.addSourceBlock();
              // } else {
                  this.updateCell(rowIndex, 'rqmtSource');
              // }
              return;
            }
          
            
            if (meta && meta.type === 'rqmtSource:removed' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateCell(rowIndex, 'rqmtSource');
              return;
          }
            
          if (meta && meta.type === 'rqmtSource:changed' && meta.payload) {
            const { rowIndex, sourceIndex } = meta.payload;
            const viewKey = `${rowIndex}-rqmtSource`;
            const view = this.activeViews.get(viewKey);
            
            // if (view && typeof view.updateSourceBlock === 'function') {
            //     view.updateSourceBlock(sourceIndex);
            // } else {
                this.updateCell(rowIndex, 'rqmtSource');
            // }
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
              const viewKey = `${rowIndex}-taskDuration`;
              const view = this.activeViews.get(viewKey);
              
              if (view && typeof view.addDurationBlock === 'function') {
                  // Гранулярное обновление - добавляем только новый блок
                  view.addDurationBlock();
              } else {
                  // Если view нет, обновляем всю ячейку
                  this.updateCell(rowIndex, 'taskDuration');
              }
              return;
          }
          
          if (meta && meta.type === 'taskDuration:changed' && meta.payload) {
              const { rowIndex, durationIndex, field } = meta.payload;
              const viewKey = `${rowIndex}-taskDuration`;
              const view = this.activeViews.get(viewKey);
              
              if (view && typeof view.updateDurationBlock === 'function') {
                  // Гранулярное обновление - обновляем только измененный блок
                  view.updateDurationBlock(durationIndex);
              } else {
                  this.updateCell(rowIndex, 'taskDuration');
              }
              return;
          }
          
          if (meta && meta.type === 'taskDuration:removed' && meta.payload) {
              const { rowIndex } = meta.payload;
              // При удалении нужно полностью перерисовать, так как индексы сдвигаются
              this.updateCell(rowIndex, 'taskDuration');
              return;
          }
          
          if (meta && meta.type === 'personnel:added' && meta.payload) {
            const { rowIndex } = meta.payload;
            const viewKey = `${rowIndex}-personnel`;
            const view = this.activeViews.get(viewKey);
            
            if (view && typeof view.addPersonnelBlock === 'function') {
                view.addPersonnelBlock();
            } else {
                this.updateCell(rowIndex, 'personnel');
            }
            return;
        }
        
        if (meta && meta.type === 'personnel:changed' && meta.payload) {
            const { rowIndex, personnelIndex } = meta.payload;
            const viewKey = `${rowIndex}-personnel`;
            const view = this.activeViews.get(viewKey);
            
            if (view && typeof view.updatePersonnelBlock === 'function') {
                view.updatePersonnelBlock(personnelIndex);
            } else {
                this.updateCell(rowIndex, 'personnel');
            }
            return;
        }
        
        if (meta && meta.type === 'personnel:removed' && meta.payload) {
            const { rowIndex } = meta.payload;
            this.updateCell(rowIndex, 'personnel');
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
            
            // На новые (используем методы модели):
            if (p.field === 'workAreaGroup' && this.model.isZoneGroup(p.rowIndex, p.groupIndex)) {
                this.updateCell(p.rowIndex, 'zoneNumber');
                return;
            }
            
            if (p.field === 'workAreaGroup' && this.model.isAccessGroup(p.rowIndex, p.groupIndex)) {
                this.updateCell(p.rowIndex, 'accessPoint');
                return;
            }

            if (p.field === 'personnel') {
              const viewKey = `${p.rowIndex}-personnel`;
              const view = this.activeViews.get(viewKey);
              
              if (view && typeof view.updatePersonnelBlock === 'function' && p.personnelIndex !== undefined) {
                  view.updatePersonnelBlock(p.personnelIndex);
              } else {
                  this.updateCell(p.rowIndex, 'personnel');
              }
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

            if (meta?.type === 'remarksItem:added' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateTaskDescrRemarks(rowIndex);
              setTimeout(() => this.focusLastRemarksItem(rowIndex), 50);
              return;
          }
          if (meta?.type === 'remarksItem:removed' && meta.payload) {
              const { rowIndex } = meta.payload;
              this.updateTaskDescrRemarks(rowIndex);
              return;
          }

            if (meta && meta.type === 'remarks:changed' && meta.payload) {
              const p = meta.payload;
              console.log('Remarks changed event:', p);
              
              // Обновляем соответствующий элемент с использованием прямых данных
              if (p.target === 'limit') {
                // БЫЛО: this.updateLimitInRow(p.rowIndex, p.limitIndex);
                this.forceRenderCell(p.rowIndex, 'limit');
                return;
            } else if (p.target === 'workArea') {
                // Определяем тип группы через модель
                if (this.model.isZoneGroup(p.rowIndex, p.groupIndex)) {
                    this.updateCell(p.rowIndex, 'zoneNumber'); // TODO: убрать примечания из зоны
                } else {
                    this.updateCell(p.rowIndex, 'accessPoint');
                }
                return;
            } else if (p.target === 'task') {
              this.updateTaskDescrRemarks(p.rowIndex);  // ← НОВЫЙ МЕТОД
            }
            return;
          }

            if (meta && meta.type === 'remarks:added' && meta.payload) {
              const p = meta.payload;
              console.log('Remarks added event:', p);
              
              // Немедленно обновляем соответствующий элемент
              if (p.targetType === 'limit') {
                // БЫЛО: this.updateLimitInRow(p.rowIndex, p.index);
                this.forceRenderCell(p.rowIndex, 'limit');
                setTimeout(() => this.focusRemarksField(p.rowIndex, p.targetType, p.index), 100);
                return;
            }
             else if (p.targetType === 'workArea') {
                // Определяем тип группы через модель
                if (this.model.isZoneGroup(p.rowIndex, p.index)) {
                    this.updateCell(p.rowIndex, 'zoneNumber');
                } else {
                    this.updateCell(p.rowIndex, 'accessPoint');
                }
                
                // Фокусируемся на поле примечания через небольшую задержку
                setTimeout(() => {
                    this.focusRemarksField(p.rowIndex, p.targetType, p.index);
                }, 100);
                
                return;
            } else if (p.targetType === 'task') {
                this.updateTaskDescrRemarks(p.rowIndex, 'taskDescr');
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


    this.setEditMode = (editable) => {
      this.editable = editable;
      this.updateEditMode();
  };
  
  this.setPreviewMode = (previewMode) => {
      this.previewMode = previewMode;
      this.updatePreviewMode();
  };
    
  }


  setupModeListeners() {
    // Можно слушать изменения классов на body
    // или события от контроллера
    document.addEventListener('DOMContentLoaded', () => {
        this.updateFromGlobalState();
    });
}

focusLastRemarksItem(rowIndex) {
  const fields = $(`tr[data-task-index="${rowIndex}"] .remarks-multi-container .remarks-text`);
  if (!fields.length) return;
  const last = fields.last();
  last.attr('contenteditable', true).focus();
  const range = document.createRange();
  const sel   = window.getSelection();
  range.selectNodeContents(last[0]);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}


updateFromGlobalState() {
  const newPreviewMode = document.body.classList.contains('preview-mode');
  const newEditMode = document.body.classList.contains('edit-mode');
  
  if (newPreviewMode !== this.previewMode) {
      this.previewMode = newPreviewMode;
      this.updatePreviewMode();
  }
  
  if (newEditMode !== this.editable) {
      this.editable = newEditMode;
      this.updateEditMode();
  }
}

setEditMode(editable) {
  this.editable = editable;
  this.updateEditMode();
  this.setEditable(editable);
}

// Устанавливаем режим предпросмотра (вызывается контроллером)
setPreviewMode(previewMode) {
  this.previewMode = previewMode;
  this.updatePreviewMode();
}

updateEditMode() {
  // Обновляем все активные представления
  this.activeViews.forEach((view, key) => {
      if (view.updateEditMode) {
          view.updateEditMode(this.editable && !this.previewMode);
      }
  });
  this.setEditable(this.editable);
  // Важно: обновляем ТОЛЬКО ячейки, которые должны быть редактируемыми
  // Раньше редактировались не все ячейки, а только определенные
  this.updateEditableCells(this.editable);
  
  // Обновляем видимость action buttons
  this.updateActionButtons();
}

  handlePreviewModeChange(previewMode) {
    // Обновляем все активные представления
    this.activeViews.forEach((view, key) => {
        if (view.setPreviewMode) {
            view.setPreviewMode(previewMode);
        }
    });
    
    // Обновляем видимость кнопок
    this.updateButtonsVisibility();
}



updateButtonsVisibility() {
  const isPreviewMode = document.body.classList.contains('preview-mode');
  
  // Показываем/скрываем кнопки действий
  if (isPreviewMode) {
      this.$container.find('.action-button, .action-button-td').addClass('preview-hidden');
  } else if (this.editable) {
      this.$container.find('.action-button, .action-button-td').removeClass('preview-hidden');
  }
}

  initPreviewListeners() {
    document.addEventListener('previewModeChanged', (event) => {
        this.previewMode = event.detail.previewMode;
        this.updatePreviewMode();
    });
  }

  updatePreviewMode() {
    if (this.previewMode) {
        // В режиме предпросмотра отключаем редактирование всех ячеек
        this.$container.find('[contenteditable="true"]').prop('contenteditable', false);
    } else if (this.editable) {
        // Если выключили предпросмотр и включено редактирование
        // Восстанавливаем редактируемость ТОЛЬКО для разрешенных ячеек
        this.disablePreviewMode()
        this.updateEditableCells(this.editable);
    }
    
    // Обновляем все активные представления
    this.activeViews.forEach((view, key) => {
        if (view.setPreviewMode) {
            view.setPreviewMode(this.previewMode);
        }
    });
    
    // Обновляем видимость action buttons
    this.updateActionButtons();
}

updateActionButtons() {
  if (this.previewMode || !this.editable) {
      this.$container.find('.action-button, .action-button-td').addClass('hidden');
  } else {
      this.$container.find('.action-button, .action-button-td').removeClass('hidden');
  }
}

enablePreviewMode() {
  // Добавляем класс предпросмотра к таблице
  this.$container.addClass('preview-mode');
  
  // Отключаем редактирование ячеек
  // this.$container.find('.editable-cell[contenteditable="true"]')
  //     .each((index, cell) => {
  //         const $cell = $(cell);
  //         $cell.attr('data-was-editable', 'true');
  //         $cell.prop('contenteditable', false);
  //     });
  
  // Обновляем все активные представления
  this.activeViews.forEach((view, key) => {
      if (view.updatePreviewMode) {
          view.updatePreviewMode(true);
      }
  });
  
  // Обновляем видимость кнопок в заголовках разделов
  this.$container.find('.section-header .btn').addClass('preview-hidden');
}

// Выключение режима предпросмотра
disablePreviewMode() {
  // Убираем класс предпросмотра
  this.$container.removeClass('preview-mode');
  
  // Восстанавливаем редактирование ячеек (только если включен режим редактирования)
  if (this.editable) {
      this.$container.find('.editable-cell[data-was-editable="true"]')
          .each((index, cell) => {
              $(cell).prop('contenteditable', true);
          });
  }
  
  // Обновляем все активные представления
  this.activeViews.forEach((view, key) => {
      if (view.updatePreviewMode) {
          view.updatePreviewMode(false);
      }
  });
  
  // Восстанавливаем кнопки в заголовках разделов (только если включен режим редактирования)
  if (this.editable) {
      this.$container.find('.section-header .btn').removeClass('preview-hidden');
  }
}

  initViewRegistry() {
    ViewRegistry.register('taskDuration', TaskDurationView);
    ViewRegistry.register('limit', LimitView);
    ViewRegistry.register('rqmtSource', RqmtSourceView);
    ViewRegistry.register('zoneNumber', ZoneView);
    ViewRegistry.register('accessPoint', AccessPointView);
    ViewRegistry.register('personnel', PersonnelView);
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
                        class: 'btn btn-sm ml-2 btn-outline-primary btn-add btn-icon btn-square edit-mode edit-mode-btn',
                        'data-task-title': task.taskTitle
                    })
                    .text('+')
                    .on('click', e => {
                        const titleText = $(e.target).data('task-title');
                        this.model.addTaskToSection(titleText);
                    })
                ));
        $subRow.on('contextmenu', (e) => {
                  e.preventDefault();
                  this.showSectionContextMenu(e, task.taskTitle);
        });
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
      
      if (task.isAlternative) $row.addClass('row-alternative');
      
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
          const view = ViewRegistry.create(h.key, this.model, rowIndex, this.editable);
          
          // Сохраняем представление для последующего обновления
          const viewKey = `${rowIndex}-${h.key}`;
          this.activeViews.set(viewKey, view);
          
          // Рендерим и добавляем в ячейку
          $cell.append(view.render());
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
          const applicBlock = this.applicView.renderApplicBlock(applicId, rowIndex, 'field', h.key);
          if (applicBlock) {
              cell.append(applicBlock);
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

            $descrContent.attr('data-placeholder', 'Введите описание');
          }
          
          $contentContainer.append($descrContent);
        

          if (task.remarks != undefined) {
            const $remarksBlock = this.renderTaskRemarksBlocks(task, rowIndex);
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
        // Используем ViewRegistry
        const view = ViewRegistry.create(h.key, this.model, rowIndex, this.editable);
        const viewKey = `${rowIndex}-${h.key}`;
        this.activeViews.set(viewKey, view);
        $cell.append(view.render());
        $row.append($cell);
        return;
    }
  
    // Заменяем старую логику accessPoint
    if (h.key === 'accessPoint') {
        // Используем ViewRegistry
        const view = ViewRegistry.create(h.key, this.model, rowIndex, this.editable);
        const viewKey = `${rowIndex}-${h.key}`;
        this.activeViews.set(viewKey, view);
        $cell.append(view.render());
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
          if (h.key === 'taskIdent') {
            // Специальный контент для taskIdent
            $content = $('<div>', {
              class: 'editable-text',
              contenteditable: true,
              text: cellValue
            })
              .attr('data-placeholder', 'Введите код задачи')
              .on('input', e => {
                const $t = $(e.target);
                const text = $t.text();
        
                // Разрешаем только латинские буквы, цифры, дефис и точку
                const cleaned = text.replace(/[^A-Za-z0-9.-]/g, '');
        
                if (cleaned !== text) {
                  $t.text(cleaned);
        
                  const range = document.createRange();
                  const sel = window.getSelection();
                  range.selectNodeContents($t[0]);
                  range.collapse(false);
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
              })
              .on('blur', e => {
                const newValue = $(e.target).text();
                this.model.updateTaskField(rowIndex, h.key, newValue);
              });
        
          } else {
            // Общий контент для остальных editable полей
            $content = $('<div>', {
              class: 'editable-text',
              contenteditable: true,
              text: cellValue
            }).on('blur', e => {
              const newValue = $(e.target).text();
              this.model.updateTaskField(rowIndex, h.key, newValue);
            });
          }
        }

        $cell.append($content);

        // IMPORTANT: removed per-cell drag/drop handlers here.
        // DnD is handled centrally by ScheduledController to avoid duplicate updates.

        $row.append($cell);
      });
      

      if (task.fieldApplicabilities && task.fieldApplicabilities['applicabilityTask']) {
        const applicId = task.fieldApplicabilities['applicabilityTask'];
        const applicBlock = this.applicView.renderApplicBlock(applicId, rowIndex, 'task', null);
        if (applicBlock) {
            const applicRow = $('<tr></tr>').addClass('task-applicability-row');
            const applicCell = $('<td></td>').attr('colspan', headers.length);
            applicCell.append(applicBlock);
            applicRow.append(applicCell);
            $tbody.append(applicRow);
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

updateEditableCells(editable) {
  if (!this.$table) return;
  


  this.activeViews.forEach((view, key) => {
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
    return this.applicView.renderApplicList(applicabilities);
}

  renderApplicTag(applic, withDelete = true, rowIndex = null, targetType = null, targetIndex = null) {
    return this.applicView.renderApplicTag(applic, withDelete, rowIndex, targetType, targetIndex);
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
    
    // ✅ Используем ApplicView
    $cell.empty().append(this.applicView.renderApplicList(task.fieldApplicabilities, rowIndex));
    this.render();
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
    const applicBlock = this.applicView.renderApplicBlock(
        dmRef.applicRefId,
        rowIndex,
        'dmRef',
        dmRefIndex
    );
    if (applicBlock) {
      $block.append(applicBlock);
    }
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

renderTaskRemarksBlocks(task, rowIndex) {
  const items = task.remarksItems?.length
      ? task.remarksItems
      : (task.remarks ? [task.remarks] : []);

  if (!this.editable && items.length === 0) return null;

  const outerBlock = $('<div>').addClass('remarks-block remarks-multi-block');
  const label = $('<div>').addClass('remarks-label').text('Примечание');
  outerBlock.append(label);

  const renderItem = (text, itemIndex) => {
      const wrap = $('<div>').addClass('remarks-item-wrap').attr('data-item-index', itemIndex);

      const textField = $('<div>')
          .addClass('remarks-text')
          .text(text)
          .attr('data-row-index', rowIndex)
          .attr('data-target-type', 'task')
          .attr('data-item-index', itemIndex)
          .attr('data-placeholder', 'Введите примечание');

      if (this.editable) {
          textField.attr('contenteditable', true);
          textField.on('blur', () => {
              this.model.updateTaskRemarksItem(rowIndex, itemIndex, textField.text().trim());
          });
          textField.on('keydown', (e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); textField.blur(); }
          });

          const removeBtn = $('<button>')
              .addClass('remarks-remove-btn edit-mode-btn')
              .html('&times;')
              .attr('title', 'Удалить')
              .on('click', () => this.model.removeTaskRemarksItem(rowIndex, itemIndex));

          wrap.append(textField, removeBtn);
      } else {
          wrap.append(textField);
      }

      return wrap;
  };

  if (items.length === 0) {
      // Нет примечаний — только кнопка добавить
      if (this.editable) {
          outerBlock.append(
              $('<button>')
                  .addClass('remarks-add-btn edit-mode-btn')
                  .text('+ Примечание')
                  .on('click', () => this.model.addTaskRemarksItem(rowIndex))
          );
      }
  } else {
      // Рендерим элементы с разделителями между ними
      items.forEach((text, i) => {
          if (i > 0) {
              outerBlock.append($('<div>').addClass('remarks-divider-line'));
          }
          outerBlock.append(renderItem(text, i));
      });

      // Кнопка "+" только в конце, внутри того же блока
      if (true) {
          outerBlock
              .append($('<div>').addClass('remarks-divider-line'))
              .append(
                  $('<button>')
                      .addClass('remarks-add-btn edit-mode-btn')
                      .text('+ Примечание')
                      .on('click', () => this.model.addTaskRemarksItem(rowIndex))
              );
      }
  }

  return outerBlock;
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
  $('.task-context-menu').remove();

  const targetElement = event.target;
  let context = this.determineContext(targetElement, rowIndex, task);
  const menu = $('<div>').addClass('context-menu task-context-menu');

  // ─── Создание задач ───────────────────────────────────────────────
  const addAboveOption = $('<div>').addClass('menu-option menu-option-create')
      .append($('<span>').text('Создать задачу выше'))
      .on('click', () => { this.model.addTaskAbove(rowIndex); menu.remove(); });

  const addBelowOption = $('<div>').addClass('menu-option menu-option-create')
      .append($('<span>').text('Создать задачу ниже'))
      .on('click', () => { this.model.addTaskBelow(rowIndex); menu.remove(); });

  const addSectionOption = $('<div>').addClass('menu-option menu-option-create')
      .append($('<span>').text('Создать раздел'))
      .on('click', () => { this.model.addSectionAfterCurrentGroup(rowIndex); menu.remove(); });

  const addAltOption = $('<div>').addClass('menu-option menu-option-create')
      .append($('<span>').text('Создать альтернативную задачу'))
      .on('click', () => { this.model.addAlternativeTask(rowIndex); menu.remove(); });

  menu.append(addAboveOption, addBelowOption, addSectionOption, addAltOption);
  menu.append($('<div>').addClass('menu-divider'));

  // Примечание — только для limit, workArea (access), task
  const remarksAllowed = ['limit', 'workArea', 'task'];
  if (context && remarksAllowed.includes(context.type)) {
      const hasRemarks = this.model.hasRemarks(context.type, rowIndex, context.index);
      const remarksOption = $('<div>').addClass('menu-option')
          .append($('<span>').text(hasRemarks ? 'Перейти к примечанию' : 'Добавить примечание'))
          .on('click', () => {
              if (hasRemarks) {
                  this.focusRemarksField(rowIndex, context.type, context.index);
              } else {
                  this.model.addRemarksQuick(context.type, rowIndex, context.index);
              }
              menu.remove();
          });
      menu.append(remarksOption);
  }

  // Удалить задачу и сменить раздел — всегда
  const deleteOption = $('<div>').addClass('menu-option')
      .append($('<span>').text('Удалить задачу'))
      .on('click', () => {
          if (confirm('Удалить задачу?')) this.model.deleteTask(rowIndex);
          menu.remove();
      });

  const changeSectionOption = $('<div>').addClass('menu-option')
      .append($('<span>').text('Сменить раздел'))
      .on('click', () => {
          this.changeTaskSection(rowIndex, task);
          menu.remove();
      });

  menu.append(deleteOption, changeSectionOption);

  // Применимость
  const applicOption = $('<div>').addClass('menu-option with-submenu')
      .append($('<span>').text('Применимость'));
  const submenu = $('<div>').addClass('submenu applicability-submenu');
  submenu.append(
      $('<div>').addClass('submenu-option').text('Без применимости')
          .on('click', () => { this.model.updateApplicForTask(rowIndex, null); menu.remove(); })
  );
  submenu.append($('<div>').addClass('submenu-divider'));
  Object.values(this.model.applicManager.applicMap).forEach(applic => {
    submenu.append(
        $('<div>').addClass('submenu-option')
            .text(applic.displayValue || applic.id)
            .on('click', () => { this.model.updateApplicForTask(rowIndex, applic.id); menu.remove(); })
    );
});
  menu.append(applicOption, submenu);
  applicOption.on('mouseenter', () => submenu.css({ top: applicOption.position().top, left: applicOption.outerWidth() }).show());
  applicOption.on('mouseleave', () => setTimeout(() => { if (!submenu.is(':hover')) submenu.hide(); }, 100));
  submenu.on('mouseleave', () => submenu.hide());

  menu.css({ position: 'absolute', top: event.pageY, left: event.pageX, zIndex: 1000 });
  $('body').append(menu);

  $(document).on('mousedown.ctxmenu', e => {
      if (!menu.is(e.target) && menu.has(e.target).length === 0) {
          menu.remove();
          $(document).off('mousedown.ctxmenu keydown.ctxmenu');
      }
  });
  $(document).on('keydown.ctxmenu', e => {
      if (e.key === 'Escape') {
          menu.remove();
          $(document).off('mousedown.ctxmenu keydown.ctxmenu');
      }
  });
}


  /**
   * Определяет контекст клика - на каком элементе было вызвано меню
   */
  determineContext(target, rowIndex, task) {
    // Limit-блок
    const limitBlock = $(target).closest('.limit-block');
    if (limitBlock.length) {
        return { type: 'limit', index: parseInt(limitBlock.data('limit-index')) };
    }

    // work-area-group — только access-group, не zone
    const workAreaGroup = $(target).closest('.work-area-group-block');
    if (workAreaGroup.length) {
        const groupIndex = parseInt(workAreaGroup.data('group-index'));
        if (this.model.isAccessGroup(rowIndex, groupIndex)) {
            return { type: 'workArea', index: groupIndex };
        }
        return { type: 'zoneOnly', index: groupIndex }; // зоны — без примечаний
    }

    // Ячейка описания задачи
    const taskDescrCell = $(target).closest('td[data-field="taskDescr"]');
    if (taskDescrCell.length) {
        return { type: 'task', index: null };
    }

    // Всё остальное — нет контекста для примечаний
    return { type: 'rowOnly', index: null };
}


renderTaskRemarksField(remarks, rowIndex) {
  const $container = $('<div>').addClass('remarks-block');

  const $header = $('<div>').addClass('remarks-header d-flex align-items-center justify-content-between');
  $header.append($('<div>').addClass('remarks-label').text('Примечание'));

  if (this.editable) {
      const $deleteBtn = $('<button>')
          .addClass('btn btn-xs btn-outline-danger btn-remove edit-mode-btn')
          .html('&times;')
          .attr('title', 'Удалить примечание')
          .on('click', () => {
              this.model.updateTaskRemarks(rowIndex, null);
              $container.remove();
          });
      $header.append($deleteBtn);
  }

  $container.append($header);

  const $textField = $('<div>')
      .addClass('remarks-text')
      .text(remarks ?? '')
      .attr('data-row-index', rowIndex)
      .attr('data-target-type', 'task')
      .attr('contenteditable', this.editable);

  if (this.editable) {
      $textField.on('blur', () => {
          this.model.updateTaskRemarks(rowIndex, $textField.text().trim());
      });
      $textField.on('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              $textField.trigger('blur');
          } else if (e.key === 'Escape') {
              $textField.text(remarks ?? '').trigger('blur');
          }
      });
  }

  $container.append($textField);
  return $container;
}


updateTaskDescrRemarks(rowIndex) {
  const task = this.model.getFilteredTasks()[rowIndex];
  if (!task) return;

  const row = $('table.schedule-table tbody').find(`tr[data-task-index="${rowIndex}"]`);
  if (!row.length) return;

  const container = row.find('td[data-field="taskDescr"] .task-description-container');
  if (!container.length) return;

  container.find('.remarks-block').remove();

  // БЫЛО: this.renderTaskRemarksField(task.remarks, rowIndex)
  // СТАЛО: используем правильный метод
  const remarksBlock = this.renderTaskRemarksBlocks(task, rowIndex);
  if (remarksBlock) {
      const supervisorBlock = container.find('.supervisor-block');
      if (supervisorBlock.length) {
          supervisorBlock.before(remarksBlock);
      } else {
          container.append(remarksBlock);
      }
  }
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
  // this.$container.off('.scheduleview');
  
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

// Обновляем метод updateView, чтобы очищал контекст при смене режима:
updateView(isEditMode) {
  // Очищаем контекст перед сменой режима
  this.clearContext();
  
  this.editable = isEditMode;
  this.render();
  this.setEditable(isEditMode);
}

showSectionContextMenu(event, taskTitle) {
  $('.task-context-menu').remove();

  const sections = this.model._getSectionOrder();
  const idx = sections.findIndex(s => s.title === taskTitle);
  const isFirst = idx <= 0;
  const isLast  = idx >= sections.length - 1;

  const menu = $('<div>').addClass('context-menu task-context-menu');

  const moveUpOption = $('<div>')
      .addClass('menu-option' + (isFirst ? ' menu-option-disabled' : ''))
      .append($('<span>').text('⬆ Переместить вверх'))
      .on('click', () => {
          if (!isFirst) this.model.moveSectionUp(taskTitle);
          menu.remove();
      });

  const moveDownOption = $('<div>')
      .addClass('menu-option' + (isLast ? ' menu-option-disabled' : ''))
      .append($('<span>').text('⬇ Переместить вниз'))
      .on('click', () => {
          if (!isLast) this.model.moveSectionDown(taskTitle);
          menu.remove();
      });

  menu.append(moveUpOption, moveDownOption);

  menu.css({ position: 'fixed', top: event.clientY, left: event.clientX, zIndex: 1000 });
  $('body').append(menu);

  // Коррекция выхода за края экрана
  const r = menu[0].getBoundingClientRect();
  if (r.right  > window.innerWidth)  menu.css('left', event.clientX - r.width);
  if (r.bottom > window.innerHeight) menu.css('top',  event.clientY - r.height);

  $(document)
      .on('mousedown.ctxmenu', (e) => {
          if (!menu.is(e.target) && menu.has(e.target).length === 0) {
              menu.remove();
              $(document).off('mousedown.ctxmenu keydown.ctxmenu');
          }
      })
      .on('keydown.ctxmenu', (e) => {
          if (e.key === 'Escape') {
              menu.remove();
              $(document).off('mousedown.ctxmenu keydown.ctxmenu');
          }
      });
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
  // this.$container.off();
  
  // 4. Очищаем ссылки
  this.model = null;
  this.$container = null;
  this.dmCodeModal = null;
  
  // 5. Удаляем все дочерние элементы из контейнера
  // this.$container && this.$container.empty();
  
  console.log('ScheduleView destroyed');
}


  /**
 * Фокусируется на поле примечания
 */

}
