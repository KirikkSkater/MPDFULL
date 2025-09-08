class ApplicSidebar {
  /**
   * applicMap: объект { id -> { id, displayText, asserts, displayValue } }
   * $container: jQuery element
   * rerender: optional callback, вызывается при изменениях, чтобы внешние компоненты перерендерили view/model
   */
  constructor(applicMap = {}, $container, rerender = () => {}) {
    this.applicMap = applicMap || {};
    this.$container = $container;
    this.rerender = typeof rerender === 'function' ? rerender : () => {};
    this.expandedId = null;
  }

  render() {
    this.$container.empty();

    const $list = $('<div>').addClass('applic-list');

    Object.values(this.applicMap).forEach(applic => {
      const $item = this.renderApplicItem(applic);
      $list.append($item);

      if (applic.id === this.expandedId) {
        $list.append(this.renderApplicEditor(applic));
      }
    });

    const $addBtn = $('<button>')
      .addClass('btn btn-sm btn-outline-success add-applic-btn')
      .text('Добавить применимость')
      .on('click', () => this.createApplic());

    const $buttonheader = $('<div>').addClass('buttun-header');
    $buttonheader.append($addBtn);
    this.$container.append($buttonheader, $list);
  }

  renderApplicItem(applic) {
    const $item = $('<div>')
      .addClass('applic-item')
      .attr('draggable', true)
      .data('applic-id', applic.id)
      .append(
        $('<div>').addClass('applic-item-header').append(
          $('<div>').addClass('applic-title').text(applic.displayValue || applic.id),
          $('<div>').addClass('applic-toggle').text('▼')
        )
      );

    // toggle editor
    $item.on('click', (e) => {
      // avoid toggling when clicking drag handle or buttons inside
      if ($(e.target).closest('.applic-editor, .delete-btn, .save-applic-btn, .assert-editor').length) return;
      this.expandedId = (this.expandedId === applic.id) ? null : applic.id;
      this.render();
    });

    // DnD: кладём несколько типов (JSON + simple id + text/plain) для совместимости
    $item.on('dragstart', (event) => {
      const ev = event.originalEvent || event;
      try {
        const payloadObj = { id: applic.id, displayValue: applic.displayValue || null };
        try { ev.dataTransfer.setData('text/applic', JSON.stringify(payloadObj)); } catch(e) {}
        try { ev.dataTransfer.setData('text/applic-id', String(applic.id)); } catch(e) {}
        try { ev.dataTransfer.setData('text/plain', String(applic.id)); } catch(e) {}
        // дополнительный тип для возможности перемещать строки в sidebar
        try { ev.dataTransfer.setData('application/json', JSON.stringify(payloadObj)); } catch(e) {}
        ev.dataTransfer.effectAllowed = 'copy';
      } catch (err) {
        console.error('dragstart error in ApplicSidebar:', err);
      }

      console.log('dragstart (handler): types=', Array.from(ev.dataTransfer.types || []));
    try {
      console.log('get text/applic (immediate):', ev.dataTransfer.getData('text/applic'));
    } catch (err) {
      console.log('getData не сработал (нормально в некоторых браузерах):', err.message);
    }

      $item.addClass('dragging');
    });

    $item.on('dragend', () => $item.removeClass('dragging'));


    

    return $item;
  }

  renderApplicEditor(applic) {
    const $editor = $('<div>').addClass('applic-editor p-2');

    $editor.append(
      $('<div>').addClass('form-group mb-2').append(
        $('<label>').addClass('small').text('Отображаемый текст:'),
        $('<textarea>').addClass('form-control form-control-sm applic-display-text')
          .val(applic.displayText || '')
          .attr('rows', 2)
      )
    );

    const $assertsContainer = $('<div>').addClass('mb-2 asserts-container');
    $editor.append($('<label>').addClass('small').text('Применимости:'), $assertsContainer);

    Object.entries(applic.asserts || {}).forEach(([key, value]) => {
      $assertsContainer.append(this.renderAssertEditor(key, value));
    });

    $editor.append(
      $('<button>').addClass('btn btn-sm btn-outline-secondary btn-block mb-2 add-assert-btn')
        .text('+ Добавить применимость')
        .on('click', () => $assertsContainer.append(this.renderAssertEditor()))
    );

    $editor.append(this.renderEditorActions(applic));

    return $editor;
  }

  renderAssertEditor(property = 'type', value = '') {
    const $editor = $('<div>').addClass('assert-editor d-flex align-items-center mb-1');

    const $select = $('<select>').addClass('form-control form-control-sm assert-property mr-2')
      .css('width', '120px')
      .append(
        $('<option>').val('type').text('Тип ВС'),
        $('<option>').val('model').text('Модель ВС'),
        $('<option>').val('serialno').text('Серийный №')
      ).val(property || 'type');

    const $input = $('<input>').addClass('form-control form-control-sm assert-value mr-2')
      .attr('type', 'text')
      .val(value || '');

    const $del = $('<button>').addClass('icon-btn delete-btn')
                .html('<i class="fas fa-times"></i>')
      .on('click', (e) => { e.preventDefault(); $editor.remove(); });

    $editor.append($select, $input, $del);
    return $editor;
  }

  renderEditorActions(applic) {
    return $('<div>').addClass('editor-actions').append(
        $('<button>').addClass('btn btn-sm btn-outline-danger delete-btn')
          .html('<i class="fas fa-trash-alt"></i>')
          .attr('title', 'Удалить')
          .on('click', () => {
            if (confirm('Удалить эту применимость?')) {
              delete this.applicMap[applic.id];
              this.expandedId = null;
              this.render();
              try { this.rerender(); } catch (e) { console.error(e); }
            }
          })
      ).append(
        $('<button>').addClass('btn btn-sm btn-outline-primary save-applic-btn')
          .html('<i class="fas fa-save"></i> Сохранить')
          .on('click', () => this.saveApplic(applic))
      )
  }

  saveApplic(applic) {
    // собираем значения из DOM: ищем editor, который открыт для this.expandedId
    const $editor = this.$container.find('.applic-editor').first();
    if (!$editor.length) return;

    const displayText = $editor.find('.applic-display-text').val();
    applic.displayText = displayText;

    // asserts
    const asserts = {};
    $editor.find('.assert-editor').each(function () {
      const prop = $(this).find('.assert-property').val();
      const val = $(this).find('.assert-value').val();
      if (prop && val) asserts[prop] = val;
    });
    applic.asserts = asserts;

    // пересчитать displayValue
    if (applic.displayText) {
      applic.displayValue = applic.displayText;
    } else {
      if (applic.asserts.serialno) {
        applic.displayValue = `Серийный номер: ${applic.asserts.serialno}`;
      } else if (applic.asserts.model) {
        applic.displayValue = `Модель: ${applic.asserts.model}`;
      } else if (applic.asserts.type) {
        applic.displayValue = `Тип: ${applic.asserts.type}`;
      } else {
        applic.displayValue = applic.id;
      }
    }

    // Обновляем карту и реберендим
    this.applicMap[applic.id] = applic;
    this.render();
    try { this.rerender(); } catch (e) { console.error(e); }
  }

  createApplic() {
    const id = 'app-' + Date.now().toString().slice(-6);
    this.applicMap[id] = {
      id,
      displayText: '',
      asserts: {},
      displayValue: 'Новая применимость'
    };
    this.expandedId = id;
    this.render();
  }

  addRerender(rerender) {
    if (typeof rerender === 'function') this.rerender = rerender;
  }
}