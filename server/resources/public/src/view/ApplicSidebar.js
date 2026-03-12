class ApplicSidebar {
  constructor(applicManager, $container, rerender = () => {}, model = null) {
      this.applicManager = applicManager; // Изменено: теперь принимаем ApplicManager
      this.$container = $container;
      this.rerender = typeof rerender === 'function' ? rerender : () => {};
      this.model = model;
      this.expandedId = null;
  }

  render() {
      this.$container.empty();

      const applicType = this.applicManager.applicType;

      // Если нет применимостей - показываем кнопки выбора типа
      if (!applicType) {
          this.renderTypeSelection();
          return;
      }

      const $list = $('<div></div>').addClass('applic-list');

      // Сортируем по ID
      const sortedApplics = this.applicManager.getAllApplics().sort((a, b) => {
          const numA = parseInt(a.id.replace('app-', ''), 10);
          const numB = parseInt(b.id.replace('app-', ''), 10);
          return numA - numB;
      });

      sortedApplics.forEach(applic => {
          const item = this.renderApplicItem(applic);
          $list.append(item);

          if (applic.id === this.expandedId) {
              $list.append(this.renderApplicEditor(applic));
          }
      });

      // Кнопки действий в зависимости от типа
      const $buttonHeader = $('<div></div>').addClass('button-header');

      if (applicType === 'local') {
          const $addBtn = $('<button></button>')
              .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn add-applic-btn')
              .text('Добавить')
              .on('click', () => this.createApplic());
          $buttonHeader.append($addBtn);
      } else if (applicType === 'cir') {
          const $addFromCirBtn = $('<button></button>')
              .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn add-from-cir-btn edit-mode-btn')
              .text('Получить из CIR')
              .on('click', () => this.openCirModal());
          $buttonHeader.append($addFromCirBtn);
      }

      this.$container.append($buttonHeader, $list);
  }

  renderTypeSelection() {
      const $container = $('<div></div>')
          .addClass('applic-type-selection text-center p-4');

      $container.append(
          $('<p></p>').addClass('mb-3').text('Выберите тип применимостей:')
      );

      const $localBtn = $('<button></button>')
          .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn  btn-block mb-2')
          .text('Создать локальную применимость')
          .on('click', () => this.createApplicType('local'));

      const $cirBtn = $('<button></button>')
          .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn  btn-block')
          .text('Создать ссылочную применимость')
          .on('click', () => this.createApplicType('cir'));

      $container.append($localBtn, $cirBtn);
      this.$container.append($container);
  }

  createApplicType(type) {
      if (!this.model) {
          console.error('Model not available');
          return;
      }

      // Создаем контейнер в XML
      this.applicManager.createApplicContainer(this.model.$xml, type);
      
      this.render();
      this.rerender();
  }

  renderApplicItem(applic) {
      const $item = $('<div></div>')
          .addClass('applic-item')
          .attr('draggable', true)
          .data('applic-id', applic.id)
          .append(
              $('<div></div>').addClass('applic-item-header').append(
                  $('<div></div>').addClass('applic-title').text(`${applic.displayValue} (${applic.id})`),
                  $('<div></div>').addClass('applic-toggle').text('⚙')
              )
          );

      // Клик для раскрытия редактора (только для local)
      if (applic.source === 'local') {
          $item.on('click', (e) => {
              if ($(e.target).closest('.applic-editor, .delete-btn, .save-applic-btn, .assert-editor').length) {
                  return;
              }
              this.expandedId = this.expandedId === applic.id ? null : applic.id;
              this.render();
          });
      }

      // DnD
      $item.on('dragstart', (event) => {
          const ev = event.originalEvent || event;
          try {
              const payloadObj = { id: applic.id, displayValue: applic.displayValue };
              try { ev.dataTransfer.setData('text/applic', JSON.stringify(payloadObj)); } catch(e) {}
              try { ev.dataTransfer.setData('text/applic-id', String(applic.id)); } catch(e) {}
              try { ev.dataTransfer.setData('text/plain', String(applic.id)); } catch(e) {}
              try { ev.dataTransfer.setData('application/json', JSON.stringify(payloadObj)); } catch(e) {}
              ev.dataTransfer.effectAllowed = 'copy';
          } catch(err) {
              console.error('dragstart error in ApplicSidebar', err);
          }
          $item.addClass('dragging');
      });

      $item.on('dragend', () => {
          $item.removeClass('dragging');
      });

      return $item;
  }

  renderApplicEditor(applic) {
      const $editor = $('<div></div>').addClass('applic-editor p-2');

      // displayText
      $editor.append(
          $('<div></div>').addClass('form-group mb-2').append(
              $('<label></label>').addClass('small').text('Отображаемый текст'),
              $('<textarea></textarea>')
                  .addClass('form-control form-control-sm applic-display-text')
                  .val(applic.displayText)
                  .attr('rows', 2)
          )
      );

      // Asserts
      const $assertsContainer = $('<div></div>').addClass('mb-2 asserts-container');
      $editor.append(
          $('<label></label>').addClass('small').text('Свойства'),
          $assertsContainer
      );

      Object.entries(applic.asserts).forEach(([key, value]) => {
          $assertsContainer.append(this.renderAssertEditor(key, value));
      });

      // Кнопка добавления assert
      $editor.append(
          $('<button></button>')
              .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn mb-2 add-assert-btn')
              .text('Добавить свойство')
              .on('click', () => {
                  $assertsContainer.append(this.renderAssertEditor('', ''));
              })
      );

      $editor.append(this.renderEditorActions(applic));

      return $editor;
  }

  renderAssertEditor(propertyType = 'type', value = '') {
      const $editor = $('<div></div>').addClass('assert-editor d-flex align-items-center mb-1');

      const $select = $('<select></select>')
          .addClass('form-control form-control-sm assert-property mr-2')
          .css('width', '120px')
          .append(
              $('<option></option>').val('type').text('Тип'),
              $('<option></option>').val('model').text('Модель'),
              $('<option></option>').val('serialno').text('Серийный №')
          )
          .val(propertyType);

      const $input = $('<input>')
          .addClass('form-control form-control-sm assert-value mr-2')
          .attr('type', 'text')
          .val(value);

      const $del = $('<button></button>')
          .addClass('btn btn-xs btn-outline-danger btn-remove edit-mode-btn')
        //   .html('<i class="fas fa-times"></i>')
          .on('click', (e) => {
              e.preventDefault();
              $editor.remove();
          });

      $editor.append($select, $input, $del);
      return $editor;
  }

  renderEditorActions(applic) {
      return $('<div></div>').addClass('editor-actions').append(
          $('<button></button>')
              .addClass('btn btn-sm btn-outline-danger btn-cancel delete-btn')
              .html('<i class="fas fa-trash-alt"></i>')
              .attr('title', 'Удалить')
              .on('click', () => {
                  if (confirm('Удалить применимость?')) {
                      this.deleteApplic(applic.id);
                  }
              }),
          $('<button></button>')
              .addClass('btn btn-sm btn-outline-primary btn-add edit-mode-btn  save-applic-btn')
              .html('<i class="fas fa-save"></i>')
              .on('click', () => this.saveApplic(applic))
      );
  }

  createApplic() {
      if (!this.model) {
          console.error('Model not available for creating applicability');
          return;
      }

      try {
          const newApplic = {
              displayText: '',
              asserts: {},
              displayValue: '',
              source: 'local'
          };

          const newId = this.model.addNewApplicability(newApplic);
          this.expandedId = newId;
          this.render();
          this.rerender();
      } catch (error) {
          console.error('Error creating applicability:', error);
          alert(error.message);
      }
  }

  saveApplic(applic) {
      if (!this.model) {
          console.error('Model not available for saving applicability');
          return;
      }

      const $editor = this.$container.find('.applic-editor').first();
      if (!$editor.length) return;

      const displayText = $editor.find('.applic-display-text').val();

      const asserts = {};
      $editor.find('.assert-editor').each(function() {
          const prop = $(this).find('.assert-property').val();
          const val = $(this).find('.assert-value').val();
          if (prop && val) {
              asserts[prop] = val;
          }
      });

      this.model.updateApplicability(applic.id, {
          displayText: displayText,
          asserts: asserts
      });

      this.expandedId = null;
      this.render();
      this.rerender();
  }

  deleteApplic(applicId) {
      if (!this.model) {
          console.error('Model not available for deleting applicability');
          return;
      }

      this.model.removeApplicability(applicId);
      this.expandedId = null;
      this.render();
      this.rerender();
  }

  async openCirModal() {
      // Будет реализовано в следующем блоке
      alert('Модальное окно CIR будет реализовано в следующем блоке');
  }

  addRerender(rerender) {
      if (typeof rerender === 'function') {
          this.rerender = rerender;
      }
  }

  setModel(model) {
      this.model = model;
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

async openCirModal() {
  if (!this.model) {
      console.error('Model not available');
      return;
  }

  const modal = new CirModal(
      this.applicManager,
      (newId) => {
          // Callback при выборе применимости
          this.model.syncApplicToXML();
          this.render();
          this.rerender();
      }
  );

  await modal.open();
}


}
