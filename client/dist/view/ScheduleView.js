"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var ScheduleView = /*#__PURE__*/function () {
  function ScheduleView(model, $container) {
    _classCallCheck(this, ScheduleView);
    this.model = model; // ScheduleTableModel instance
    this.$container = $container; // jQuery div where table will be rendered
    this.$table = null;
  }
  return _createClass(ScheduleView, [{
    key: "render",
    value: function render() {
      // this.createTable();
      // this.createHeaderTabel();
      this.renderTaskTable(this.model.taskDefs);
    }
  }, {
    key: "createTable",
    value: function createTable() {
      // TODO: переделать на стиль jQuery
      this.$table = $('<table>', {
        id: 'mytable',
        class: 'table data-table table-bordered fixtable disable'
      });
      this.$container.append(this.$table);
    }
  }, {
    key: "createHeaderTabel",
    value: function createHeaderTabel() {
      // TODO: переделать на создание по infoCode
      // Создаем заголовок таблицы
      var $thead = $('<thead>').addClass('table-header');
      this.$table.append($thead);

      // Создаем строку для заголовков
      var $headerRow = $('<tr>').addClass('header-row');
      $thead.append($headerRow);
      $headerRow.append("\n            <th class=\"rotated-header\" rowspan=\"2\" style=\"width: 3%\"><div class=\"rotated-content\">\u041A\u041E\u0414 \u0418\u0417\u041C\u0415\u041D\u0415\u041D\u0418\u042F</div></th>\n            <th class=\"normal-header\" rowspan=\"2\" style=\"width: 8%\"><div class=\"normal-content\">\u041D\u041E\u041C\u0415\u0420 \u0417\u0410\u0414\u0410\u0427\u0418 \u0418\u0414\u041F\u0422\u041E</div></th>\n            <th class=\"rotated-header\" rowspan=\"2\" style=\"width: 3%\"><div class=\"rotated-content\">\u0414\u041E\u041A\u0423\u041C\u0415\u041D\u0422 \u0418\u0421\u0425\u041E\u0414\u041D\u042B\u0419</div></th>\n            <th class=\"rotated-header\" rowspan=\"2\" style=\"width: 3%\"><div class=\"rotated-content\">\u0417\u041E\u041D\u0410</div></th>\n            <th class=\"rotated-header\" rowspan=\"2\" style=\"width: 3%\"><div class=\"rotated-content\">\u0414\u041E\u0421\u0422\u0423\u041F</div></th>\n            <th class=\"rotated-header\" rowspan=\"2\" style=\"width: 3%\"><div class=\"rotated-content\">\u041A\u041E\u0414 \u0417\u0410\u0414\u0410\u0427\u0418</div></th>\n            <th class=\"normal-header\" rowspan=\"2\" style=\"width: 15%\"><div class=\"normal-content\">\u041E\u041F\u0418\u0421\u0410\u041D\u0418\u0415 \u0417\u0410\u0414\u0410\u0427\u0418</div></th>\n            <th class=\"rotated-header\" rowspan=\"2\" style=\"width: 3%\"><div class=\"rotated-content\">\u0420\u0410\u0411\u041E\u0422 \u041F\u041E\u0420\u041E\u0413 \u041D\u0410\u0427\u0410\u041B\u0410</div></th>\n            <th class=\"rotated-header\" rowspan=\"2\" style=\"width: 3%\"><div class=\"rotated-content\">\u0418\u041D\u0422\u0415\u0420\u0412\u0410\u041B</div></th>\n            <th class=\"rotated-header\" rowspan=\"2\" style=\"width: 3%\"><div class=\"rotated-content\">AMTOSS</div></th>\n            <th class=\"thin-header\" colspan=\"2\" style=\"width: 6%\"><div class=\"thin-content\">\u0418\u0421\u041F.</div></th>\n            <th class=\"thin-header\" colspan=\"2\" style=\"width: 6%\"><div class=\"thin-content\">\u0427\u0415\u041B.-\u0427.</div></th>\n            <th class=\"rotated-header\" rowspan=\"2\" style=\"width: 3%\"><div class=\"rotated-content\">\u041F\u0420\u0418\u041C\u0415\u041D\u0418\u041C\u041E\u0421\u0422\u042C</div></th>\n        ");
      var $subHeaderRow = $('<tr>').addClass('sub-header-row');
      $thead.append($subHeaderRow);
      $subHeaderRow.append("\n            <th class=\"rotated-header\" style=\"width: 3%\"><div class=\"rotated-content\">\u041A\u041E\u041B-\u0412\u041E \u0427\u0415\u041B\u041E\u0412\u0415\u041A</div></th>\n            <th class=\"rotated-header\" style=\"width: 3%\"><div class=\"rotated-content\">\u0421\u041F\u0415\u0426\u0418\u0410\u041B\u0418\u0417\u0410\u0426\u0418\u042F</div></th>\n            <th class=\"rotated-header\" style=\"width: 3%\"><div class=\"rotated-content\">\u0420\u0410\u0411\u041E\u0422\u042B \u041F\u041E\u0414\u0413\u041E\u0422\u041E\u0412\u0418\u0422\u0415\u041B\u042C\u041D\u042B\u0415</div></th>\n            <th class=\"rotated-header\" style=\"width: 3%\"><div class=\"rotated-content\">\u0417\u0410\u0414\u0410\u0427\u0410</div></th>\n        ");
    }
  }, {
    key: "renderTaskTable",
    value: function renderTaskTable() {
      var _this = this;
      if (this.$table) this.$table.remove();
      this.$table = $('<table>', {
        class: 'table table-bordered schedule-table'
      });
      var tasks = this.model.getFilteredTasks();
      var headers = this.model.getHeaders();
      var title = this.model.getTitle();

      // Генерация заголовка через существующий метод
      this.createHeaderTabel();

      // Добавление общего заголовка
      if (title) {
        var $titleRow = $('<tr>').append($('<td>', {
          colspan: headers.length,
          class: 'common-info-cell text-center'
        }).append($('<span>').text(title)).append($('<button>', {
          class: 'btn btn-sm btn-outline-primary float-right ml-2 add-section-btn add-button-row edit-mode-btn'
        }).text('+').on('click', function () {
          return _this.model.addTaskSection();
        })));
        this.$table.append($('<thead>').append($titleRow));
      }
      var $tbody = $('<tbody>');
      var lastTaskTitle = null;
      tasks.forEach(function (task, rowIndex) {
        // Группировка по taskTitle
        if (lastTaskTitle === null || task.taskTitle !== lastTaskTitle) {
          var subtitleText = task.taskTitle;
          var $subRow = $('<tr>').append($('<td>', {
            colspan: headers.length,
            class: 'task-group-subtitle text-left'
          }).append($('<span>').text(subtitleText)).append($('<button>', {
            class: 'btn btn-sm btn-outline-secondary float-right ml-2 add-task-btn add-button-row edit-mode-btn',
            'data-task-code': task.taskCode,
            'data-task-title': task.taskTitle
          }).text('+').on('click', function (e) {
            var code = $(e.target).data('task-code');
            var titleText = $(e.target).data('task-title');
            _this.model.addTaskToSection(code, titleText);
            _this.updateView(true);
          })));
          $subRow.attr('draggable', true).on('dragstart', function (e) {
            var xmlNode = _this.model.getTaskNode(rowIndex);
            var xmlString = new XMLSerializer().serializeToString(xmlNode);
            e.originalEvent.dataTransfer.setData('application/xml', xmlString);
            e.originalEvent.dataTransfer.effectAllowed = 'copy';
          });
          $tbody.append($subRow);
          lastTaskTitle = task.taskTitle;
        }

        // Строка задачи
        var $row = $('<tr>').attr('data-task-index', rowIndex);
        headers.forEach(function (h) {
          var value = task[h.key] || '';
          var $cell = $('<td>', {
            contenteditable: h.editable,
            class: h.editable ? 'editable-cell' : ''
          }).text(value);

          // Отобразить существующую применимость
          var appKey = "".concat(h.key, "Applic");
          if (task[appKey]) {
            $cell.append($('<div>').addClass('applic-text mt-1').text(task[appKey]));
          }

          // Обработчики drag/drop для применимости
          if (h.allowApplic) {
            $cell.on('dragover', function (e) {
              return e.preventDefault();
            }).on('drop', function (e) {
              e.preventDefault();
              var applicId = e.originalEvent.dataTransfer.getData('text/applic-id');
              if (!applicId) return;
              // Если это ячейка описания задачи (taskDefinition) по названию ключа description
              if (h.key === 'description') {
                _this.model.updateApplicForTask(rowIndex, applicId);
              } else {
                _this.model.updateApplicForField(rowIndex, h.key, applicId);
              }
              _this.updateView(true);
            });
          }

          // Сохранение после редактирования
          if (h.editable) {
            $cell.on('blur', function (e) {
              var newVal = $(e.target).text();
              _this.model.updateTaskField(rowIndex, h.key, newVal);
            });
          }
          $row.append($cell);
        });

        // Drag для строки задачи (экспорт XML)
        $row.attr('draggable', true).on('dragstart', function (e) {
          var xmlNode = _this.model.getTaskNode(rowIndex);
          var xmlString = new XMLSerializer().serializeToString(xmlNode);
          e.originalEvent.dataTransfer.setData('application/xml', xmlString);
          e.originalEvent.dataTransfer.effectAllowed = 'copy';
        }).on('contextmenu', function (e) {
          e.preventDefault();
          // удаляем старое меню, если есть
          $('.task-row-menu').remove();

          // строим своё ul
          var $menu = $('<ul>').addClass('task-row-menu dropdown-menu show').css({
            top: e.pageY,
            left: e.pageX,
            position: 'absolute'
          }).appendTo('body');
          $('<li>').append($('<a>').addClass('dropdown-item').text('Удалить').on('click', function () {
            if (confirm('Удалить эту задачу?')) {
              _this.model.deleteTask(rowIndex);
              _this.updateView(true);
            }
          })).appendTo($menu);

          // при клике вне — скрыть меню
          $(document).one('click', function () {
            return $menu.remove();
          });
        });
        $tbody.append($row);
      });

      // Добавление задач по XML-drag на таблицу
      this.$table.on('dragover', function (e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'copy';
      }).on('drop', function (e) {
        e.preventDefault();
        var xmlString = e.originalEvent.dataTransfer.getData('application/xml');
        if (!xmlString) return;
        try {
          var doc = new DOMParser().parseFromString(xmlString, 'application/xml');
          _this.model.addTaskNode($(doc.documentElement));
          _this.updateView(true);
        } catch (err) {
          alert('Ошибка при вставке задачи: ' + err.message);
        }
      });

      // Финальное отображение
      this.$table.append($tbody);
      this.$container.append(this.$table);
    }
  }, {
    key: "setEditable",
    value: function setEditable(editable) {
      // TODO: перенести на this.table.bindSendEditMode(this.handlerTeamcenter.setEditMode); чтобы показывать Teamcetru что таблица в режиме редактирования и нельзя ничего трогать
      if (!this.$table) return;
      this.$table.toggleClass("disable", !editable);
      this.$table.find('td.editable-cell').attr('contenteditable', editable);
      var $editButtons = $(document).find('.edit-mode-btn');
      if (editable) {
        $editButtons.show();
      } else {
        $editButtons.hide();
      }
    }
  }, {
    key: "updateView",
    value: function updateView(isEditMode) {
      this.render();
      this.setEditable(isEditMode);
    }
  }]);
}();