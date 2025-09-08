"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Table = /*#__PURE__*/function () {
  function Table(consoleNew, getObjectDrop) {
    var _this = this;
    _classCallCheck(this, Table);
    _defineProperty(this, "setEditMode", function (editMode) {
      if (editMode) _this.table.classList.remove('disable');else _this.table.classList.add('disable');
      _this.editMode = editMode;
      _this.sendEditMode(_this.editMode);
    });
    this.toolbar = new Toolbar(getObjectDrop, this.finishEditing.bind(this), this.setEditMode, this.checkRes.bind(this));
    this.table = null; // TODO: сделать Singelton
    this.consoleNew = consoleNew;
    this.hiddenRows = new Set();
    this.editMode = false;
    this.trakedObject = new TrackedObject();
  }
  return _createClass(Table, [{
    key: "hello",
    value: function hello() {
      consoleNew.log("test hello presenter");
      return "hello world!";
    }
  }, {
    key: "createTable",
    value: function createTable() {
      var tableContainer = document.getElementById('table-container');
      this.table = document.createElement('table');
      this.table.setAttribute('id', 'mytable');
      this.table.classList.add('table');
      this.table.classList.add('data-table');
      this.table.classList.add('table-bordered');
      this.table.classList.add('table', 'table-bordered', 'data-table');
      this.table.classList.toggle('disable');
      this.table.classList.add("fixtable");
      tableContainer.appendChild(this.table);
    }
  }, {
    key: "updateTable",
    value: function updateTable(reqObj) {
      if (!this.table) {
        return;
      }
      this.trakedObject = new TrackedObject();
      // this.table.parentNode.removeChild(this.table);
      // const tableContainer = document.getElementById('table-container');
      var $table = $('#mytable');
      $table.remove();
      // document.getElementsByTagName("table")[0].remove();
      this.createTable();
      TocLine.clearCodesMoc();
      // const old_thobody = this.table.getElementsByTagName('tbody');
      // const new_tbody = document.createElement('tbody');
      // old_tbody.parentNode.replaceChild(new_tbody, old_tbody)

      this.createHeaderTabel2();

      // TODO: добавить проверку на ТС

      // if (reqObj.awbName)
      //     this.toolbar.initAWB(reqObj.awbName, reqObj.awbDesignation);

      // if (reqObj.complTableUid)
      //     this.toolbar.initTC(reqObj.complTableName, reqObj.complTableUid, reqObj.complTableDesc);

      // if(reqObj.awbObjects)
      //     for (const awb of reqObj.awbObjects) {
      //         this.createAWBLineInTable(awb)
      //     }

      // let buttons = document.querySelectorAll('.action-button-td, .action-button');
      // for(let i =0; i < buttons.length; i++){
      //     buttons[i].classList.add("hidden"); // прячу
      // }
    }
  }, {
    key: "createHeaderTabel",
    value: function createHeaderTabel() {
      // Создание строки для заголовка таблицы
      var thead = this.table.createTHead();
      var headerRow = thead.insertRow();

      // Создание основных заголовков
      var nameAWBHeader = document.createElement('th');
      nameAWBHeader.rowSpan = 2; // Объединение по строкам
      nameAWBHeader.textContent = 'Требование';
      nameAWBHeader.style.width = '10%';
      nameAWBHeader.style.minWidth = '100px';
      headerRow.appendChild(nameAWBHeader);
      var textAWBHeader = document.createElement('th');
      textAWBHeader.rowSpan = 2; // Объединение по строкам
      textAWBHeader.textContent = 'Текст требования';
      textAWBHeader.style.width = '26%';
      textAWBHeader.style.minWidth = '260px';
      headerRow.appendChild(textAWBHeader);
      var codeMocHeader = document.createElement('th');
      codeMocHeader.rowSpan = 2; // Объединение по строкам
      codeMocHeader.textContent = 'Код МОС';
      codeMocHeader.style.width = '10%';
      headerRow.appendChild(codeMocHeader);
      var mocHeader = document.createElement('th');
      mocHeader.rowSpan = 2; // Объединение по строкам
      mocHeader.textContent = 'MOC';
      mocHeader.style.width = '10%';
      headerRow.appendChild(mocHeader);

      // Создание объединенной ячейки для заголовка docs
      var docsHeader = document.createElement('th');
      docsHeader.colSpan = 2; // Объединение двух ячеек
      docsHeader.textContent = 'Доказательные документы';
      headerRow.appendChild(docsHeader);

      // Создание строки для подзаголовков
      var subHeaderRow = thead.insertRow();

      // Добавление подзаголовков для docs
      var docs1 = document.createElement('th');
      var docs2 = document.createElement('th');
      subHeaderRow.appendChild(docs1);
      subHeaderRow.appendChild(docs2);
      docs1.style.width = '12%';
      docs2.style.width = '12%';
      docs1.textContent = 'Получение материалов';
      docs2.textContent = 'Подтверждение соответствия';
      var programCellHeader = document.createElement('th');
      programCellHeader.rowSpan = 2; // Объединение по строкам
      programCellHeader.textContent = 'Программа испытаний';
      programCellHeader.style.width = '10%';
      headerRow.appendChild(programCellHeader);
      var standCellHeader = document.createElement('th');
      standCellHeader.rowSpan = 2; // Объединение по строкам
      standCellHeader.textContent = 'Стенд';
      standCellHeader.style.width = '10%';
      headerRow.appendChild(standCellHeader);
      var headers = document.querySelectorAll('th');
      for (var i = 0; i < headers.length; i++) {
        headers[i].classList.add('bold-header');
      }
    }
  }, {
    key: "createHeaderTabel2",
    value: function createHeaderTabel2() {
      // Создаем заголовок таблицы
      var thead = this.table.createTHead();
      var $thead = $(thead).addClass('table-header');

      // Создаем строку для заголовков
      var $headerRow = $('<tr>').addClass('header-row');
      $thead.append($headerRow);

      // Добавляем ячейки заголовка
      $headerRow.append("\n        <th class=\"col-header\" rowspan=\"2\" data-rotate=\"1\" data-col=\"quarten-code\"><div>\u041A\u041E\u0414 \u0418\u0417\u041C\u0415\u041D\u0415\u041D\u0418\u042F</div></th>\n        <th class=\"col-header\" rowspan=\"2\" data-col=\"task-type\"><div>\u041D\u041E\u041C\u0415\u0420 \u0417\u0410\u0414\u0410\u0427\u0418 \u0418\u0414\u041F\u0422\u041E</div></th>\n        <th class=\"col-header\" rowspan=\"2\" data-rotate=\"1\" data-col=\"source-document\"><div>\u0414\u041E\u041A\u0423\u041C\u0415\u041D\u0422 \u0418\u0421\u0425\u041E\u0414\u041D\u042B\u0419</div></th>\n        <th class=\"col-header\" rowspan=\"2\" data-rotate=\"1\" data-col=\"zone\"><div>\u0417\u041E\u041D\u0410</div></th>\n        <th class=\"col-header\" rowspan=\"2\" data-rotate=\"1\" data-col=\"access\"><div>\u0414\u041E\u0421\u0422\u0423\u041F</div></th>\n        <th class=\"col-header\" rowspan=\"2\" data-rotate=\"1\" data-col=\"task-code\"><div>\u041A\u041E\u0414 \u0417\u0410\u0414\u0410\u0427\u0418</div></th>\n        <th class=\"col-header\" rowspan=\"2\" data-col=\"description\"><div>\u041E\u041F\u0418\u0421\u0410\u041D\u0418\u0415 \u0417\u0410\u0414\u0410\u0427\u0418</div></th>\n        <th class=\"col-header\" rowspan=\"2\" data-rotate=\"1\" data-col=\"threshold\"><div>\u0420\u0410\u0411\u041E\u0422 \u041F\u041E\u0420\u041E\u0413 \u041D\u0410\u0427\u0410\u041B\u0410</div></th>\n        <th class=\"col-header\" rowspan=\"2\" data-rotate=\"1\" data-col=\"interval\"><div>\u0418\u041D\u0422\u0415\u0420\u0412\u0410\u041B</div></th>\n        <th class=\"col-header\" rowspan=\"2\" data-col=\"labor-costs\"><div>AMTOSS</div></th>\n        <th class=\"col-header\" colspan=\"2\"><div>\u0418\u0421\u041F.</div></th>\n        <th class=\"col-header\" colspan=\"2\"><div>\u0427\u0415\u041B.-\u0427.</div></th>\n        <th class=\"col-header\" rowspan=\"2\" data-rotate=\"1\" data-col=\"applicability\"><div>\u041F\u0420\u0418\u041C\u0415\u041D\u0418\u041C\u041E\u0421\u0422\u042C</div></th>\n    ");

      // Создаем строку для подзаголовков (если нужно)
      var $subHeaderRow = $('<tr>').addClass('sub-header-row');
      $thead.append($subHeaderRow);

      // Добавляем подзаголовки для "ТРУДОЗАТРАТЫ"
      $subHeaderRow.append("\n        <th class=\"col-subheader\" data-rotate=\"1\" data-col=\"amtoss\"><div>\u041A\u041E\u041B-\u0412\u041E \u0427\u0415\u041B\u041E\u0412\u0415\u041A</div></th>\n        <th class=\"col-subheader\" data-rotate=\"1\" data-col=\"implementation\"><div>\u0421\u041F\u0415\u0426\u0418\u0410\u041B\u0418\u0417\u0410\u0426\u0418\u042F</div></th>\n        <th class=\"col-subheader\" data-rotate=\"1\" data-col=\"non-labor-cost\"><div>\u0420\u0410\u0411\u041E\u0422\u042B \u041F\u041E\u0414\u0413\u041E\u0422\u041E\u0412\u0418\u0422\u0415\u041B\u042C\u041D\u042B\u0415</div></th>\n        <th class=\"col-subheader\" data-rotate=\"1\" data-col=\"personnel-specialization\"><div>\u0417\u0410\u0414\u0410\u0427\u0410</div></th>\n    ");
    }
  }, {
    key: "createAWBLineInTable",
    value: function createAWBLineInTable(awb) {
      var tbody = this.table.tBodies[0] || this.table.createTBody();
      var nameAWBCell = null;
      var textAWBCell = null;
      if (awb.tocLines.length == 0) {
        this.createLineWithoutTOCLine(awb);
        return;
      }
      var _iterator = _createForOfIteratorHelper(awb.tocLines),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var tocLine = _step.value;
          var dataRow = tbody.insertRow();
          dataRow.setAttribute("data-uid", awb.uid);
          dataRow.setAttribute("moc-uid", tocLine.uid);
          if (tocLine.accordingTo != null) {
            this.generateAccordingLine(dataRow, awb, tocLine);
            continue;
          }
          var reqCell = null;
          // Создаем или обновляем ячейку для nameAWB с rowspan
          if (!nameAWBCell) {
            nameAWBCell = dataRow.insertCell();
            nameAWBCell.textContent = awb.nameAWB;
            nameAWBCell.rowSpan = awb.tocLines.length;
            nameAWBCell.classList.add("requirement-cell");
            reqCell = new RequirementCell(nameAWBCell, awb, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter);

            // Создание кнопки для скрытия строк
            // const hideButton = document.createElement('button');
            // hideButton.classList.add('dropdown-button');
            // hideButton.classList.add('shown');
            // hideButton.innerHTML = '<span class="arrow open">▼</span>'; // Используем символ стрелки

            // hideButton.addEventListener('click', () => this.toggleRowVisibility(hideButton));

            // // Добавление кнопки в ячейку
            // nameAWBCell.appendChild(hideButton);
          } else {}

          // Создаем или обновляем ячейку для textAWB с rowspan
          if (!textAWBCell) {
            textAWBCell = dataRow.insertCell();
            var divEl = document.createElement("div");
            divEl.classList.add("cell-content");
            var spanText = document.createElement("span");
            spanText.classList.add("cell-text");
            spanText.innerHTML = awb.textAWB;
            textAWBCell.rowSpan = awb.tocLines.length;
            textAWBCell.classList.add("requirement-cell");
            divEl.appendChild(spanText);
            divEl.appendChild(this.createBtnAddMoc(awb, textAWBCell, nameAWBCell));
            textAWBCell.appendChild(divEl);
          }
          var codeMocCell = dataRow.insertCell();
          codeMocCell.setAttribute("old-value", tocLine.codeMoc); // TODO: вынести в функцию всё
          // Добавляем ячейку для codeMoc
          //TODO: возмможно делаем абстрактуную фабрику создания ячеек для документов программ испытании и тд
          // new CodeCell(codeMocCell, this.trakedObject, tocLine.codeMoc, (newValue)=>{
          //     this.trakedObject.changeMoc(tocLine.uid, tocLine.codeMoc, newValue.target.value);
          //     let oldValue = codeMocCell.getAttribute("old-value")
          //     codeMocCell.setAttribute("old-value", newValue.target.value)
          //     TocLine.changeCodeMoc(awb.uid, oldValue, newValue.target.value)
          // });

          var codeCell = new CodeCell(codeMocCell, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, false, tocLine.codeMoc, null);
          if (reqCell) reqCell.addCodeCell(codeCell);
          var mocCell = dataRow.insertCell();
          new MOCCell(mocCell, tocLine.mocs, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter);
          var docsCell = dataRow.insertCell();
          new DocCell(docsCell, tocLine.receivingMaterialsDocs, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, "IRM8_RecieveMaterials");
          var docsCell2 = dataRow.insertCell();
          new DocCellCorrespondence(docsCell2, tocLine.confirmationComplianceDocs, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, "IRM8_Correspondence");
          var programCell = dataRow.insertCell();
          new ProgramCell(programCell, tocLine.programs, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, tocLine.codeMoc);
          var standCell = dataRow.insertCell();
          new StandCell(standCell, tocLine.programs, this.trakedObject, this.getDropedObjectFromTeamcenter);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }, {
    key: "createBtnAddMoc",
    value: function createBtnAddMoc(awb, textAWBCell, nameAWBCell) {
      var _this2 = this;
      var addButton = document.createElement('button');
      // addButton.textContent = 'Add MOC';
      addButton.innerHTML = '<span">+</span>';
      addButton.classList.add('action-button');
      addButton.classList.add('cell-btn');
      addButton.classList.add('add-moc-btn');
      addButton.title = "Добавить строку МОС";
      addButton.addEventListener('click', function () {
        return _this2.addMocEntry(awb, textAWBCell, nameAWBCell);
      });
      return addButton;
    }
  }, {
    key: "showRecommendations",
    value: function showRecommendations() {
      var recommendationModal = document.getElementById('recommendationModal');
      var recommendationList = document.getElementById('recommendationList');
      recommendationList.innerHTML = '';
      var recommendations = ['sdfsdfsdf', 'sdfsdfsdfsdf', 'sdfsdfsdfsdfsdfsdf'];
      recommendations.forEach(function (doc) {
        var listItem = document.createElement('li');
        listItem.textContent = doc;
        recommendationList.appendChild(listItem);
      });
      recommendationModal.style.display = 'block';
      var closeButton = document.getElementsByClassName('close')[0];
      closeButton.onclick = function () {
        recommendationModal.style.display = 'none';
      };
      window.onclick = function (event) {
        if (event.target === recommendationModal) {
          recommendationModal.style.display = 'none';
        }
      };
    }
  }, {
    key: "toggleRowVisibility",
    value: function toggleRowVisibility(button) {
      // const mainRow = button.closest('tr');
      // const table = mainRow.closest('table');

      var mainRow = button;
      while (mainRow && mainRow.tagName !== 'TR') {
        mainRow = mainRow.parentElement;
      }
      var table = mainRow;
      while (table && table.tagName !== 'TABLE') {
        table = table.parentElement;
      }
      if (!table || !mainRow) {
        return;
      }
      var rows = [];
      for (var i = 0; i < table.rows.length; i++) {
        rows.push(table.rows[i]);
      }
      var mainRowIndex = rows.indexOf(mainRow);
      var hiddenRows = new Array(); // TODO: можно так не запоминать а сделать просто счётчик
      for (var _i = mainRowIndex + 1; _i < rows.length; _i++) {
        var row = rows[_i];
        var requirementCell = row.querySelector('.requirement-cell');
        if (requirementCell) break;
        hiddenRows.push(row);
        row.classList.toggle('hidden-row');
      }
      var rowspan;
      if (button.classList.contains('shown')) {
        button.classList.remove('shown');
        button.classList.add('hiddenb');
        button.innerHTML = '<span class="arrow">▼</span>';
        rowspan = 1;
      } else {
        button.classList.remove('hiddenb');
        button.classList.add('shown');
        button.innerHTML = '<span class="arrow open">▼</span>';
        rowspan = hiddenRows.length + 1;
      }
      var requirementCells = mainRow.querySelectorAll('.requirement-cell');
      for (var _i2 = 0; _i2 < requirementCells.length; _i2++) {
        var cell = requirementCells[_i2];
        cell.classList.toggle('compressed');
        cell.setAttribute('rowspan', rowspan);
      }

      // for (let i = 0; i < rowSpan; i++) {
      //     const currentRow = this.table.rows[row.rowIndex + i];
      //     if (this.hiddenRows.has(currentRow)) {
      //         currentRow.style.display = '';
      //         this.hiddenRows.delete(currentRow);
      //     } else {
      //         currentRow.style.display = 'none';
      //         this.hiddenRows.add(currentRow);
      //     }
      // }
    }

    // Добавялет новую строку МОС
    // Сделать сущность строка MOC, чтобы везде одинакого добавлялось всё.
  }, {
    key: "addMocEntry",
    value: function addMocEntry(awb, textAWBCell, nameAWBCell) {
      var _this3 = this;
      var tbody = this.table.tBodies[0] || this.table.createTBody();
      if (textAWBCell.rowSpan >= 10) {
        alert("Превышено максимальное кол-во строк ТС для данного требования");
        return;
      }
      var newMoc = {
        codeMoc: 'New MOC',
        docs: []
      };
      var uidNewToc = TocLine.generateNewUid();
      awb.tocLines.push(newMoc);
      textAWBCell.rowSpan += 1;
      nameAWBCell.rowSpan += 1;
      var currentRow = textAWBCell.parentNode;
      var currentRowIndex = currentRow.rowIndex - 2;
      var newRow = tbody.insertRow(currentRowIndex + textAWBCell.rowSpan - 1);
      newRow.setAttribute('data-uid', awb.uid);
      newRow.setAttribute('moc-uid', uidNewToc);
      var codeMocCell = newRow.insertCell();
      codeMocCell.setAttribute("old-value", ""); // TODO: вынести в функцию всё
      new CodeCell(codeMocCell, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, false, "", function (newValue) {
        _this3.trakedObject.changeMoc(uidNewToc, "", newValue.target.value); // Надо придумать как делать новый uid так чтобы учитывать то что объект новый создаётся и редактируется.
        var oldValue = codeMocCell.getAttribute("old-value");
        codeMocCell.setAttribute("old-value", newValue.target.value);
        TocLine.changeCodeMoc(awb.uid, oldValue, newValue.target.value);
        if (oldValue !== "-" && oldValue !== "0" && (newValue.target.value === "0" || newValue.target.value === "-")) {
          var cells = codeMocCell.parentNode.getElementsByClassName("editable");
          for (var i = 0; i < cells.length; i++) {
            cells[i].setAttribute("disabled", "true");
            if (cells[i].getElementsByClassName("button-container")[0]) cells[i].getElementsByClassName("button-container")[0].style.display = "none";
            if (cells[i].getElementsByClassName("elements-container")[0]) {
              cells[i].getElementsByClassName("elements-container")[0].innerHTML = '';
              _this3.trakedObject.removeAllTrakedElement(uidNewToc);
            }
          }
        } else if ((oldValue === "-" || oldValue === "0") && newValue.target.value !== "0" && newValue.target.value !== "-") {
          var _cells = codeMocCell.parentNode.getElementsByClassName("editable");
          for (var _i3 = 0; _i3 < _cells.length; _i3++) {
            _cells[_i3].removeAttribute("disabled");
            if (_cells[_i3].getElementsByClassName("button-container")[0]) _cells[_i3].getElementsByClassName("button-container")[0].style.display = "flex";
          } // TODO: прятать кнопку в каждой клетке. TODO: подумать как
        }
      });
      var mocCell = newRow.insertCell();
      new MOCCell(mocCell, null, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter);
      var docsCell = newRow.insertCell();
      new DocCell(docsCell, null, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, "IRM8_RecieveMaterials");
      var docsCell2 = newRow.insertCell();
      new DocCellCorrespondence(docsCell2, null, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, "IRM8_Correspondence");
      var programCell = newRow.insertCell();
      new ProgramCell(programCell, null, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, null);
      var standCell = newRow.insertCell();
      new StandCell(standCell, null, this.trakedObject, this.getDropedObjectFromTeamcenter);
      this.trakedObject.addTocLine(awb.uid, uidNewToc); // TODO: генерить одинаковый uid, так чтобы искать соответсвие с редактируемыми строками.
    }
  }, {
    key: "changeEditMode",
    value: function changeEditMode(button) {
      this.table.classList.toggle('disable');
      if (button.classList.contains("edit")) {
        button.classList.remove('edit');
        button.classList.add('save');
        button.textContent = 'Сохранить';
        this.editMode = true;
      } else {
        var userConfirmed = confirm("Вы действительно хотите сохранить результаты?");
        if (userConfirmed) {
          finishEditing(true);
          this.trakedObject = new TrackedObject();
          console.log("сохранение результатов"); // TODO: initTable.
          this.editMode = false;
          button.classList.remove('save');
          button.classList.add('edit');
          button.textContent = 'Редактировать';
        } else {
          // Если пользователь отменил сохранение, просто продолжаем редактирование
          console.log("сохранение отменено");
          this.editMode = true;
        }
      }
      this.sendEditMode(this.editMode);
      this.toolbar.setEditMode(this.editMode);
      var icon = document.createElement('span');
      icon.className = 'icon';
      button.insertBefore(icon, button.firstChild);
    }
  }, {
    key: "finishEditing",
    value: function finishEditing(isSave) {
      if (!isSave) {
        this.trakedObject = new TrackedObject();
      }
      this.sendTrakedObject(this.trakedObject);
      // this.trakedObject = new TrackedObject();
      // this.setCurrentObjectFromTemacenter();
    }
  }, {
    key: "generateAccordingLine",
    value: function generateAccordingLine(dataRow, awb, tocLine) {
      var nameAWBCell = dataRow.insertCell();
      nameAWBCell.textContent = awb.nameAWB;
      // nameAWBCell.rowSpan = awb.tocLines.length;
      nameAWBCell.classList.add("requirement-cell");
      new RequirementCell(nameAWBCell, awb, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter);
      var textAWBCell = dataRow.insertCell();
      var divEl = document.createElement("div");
      divEl.classList.add("cell-content");
      var spanText = document.createElement("span");
      spanText.classList.add("cell-text");
      spanText.innerHTML = awb.textAWB;

      // textAWBCell.rowSpan = awb.tocLines.length;

      textAWBCell.classList.add("requirement-cell");
      divEl.appendChild(spanText);
      divEl.appendChild(this.createBtnAddMoc(awb, textAWBCell, nameAWBCell));
      textAWBCell.appendChild(divEl);
      var codeMocCell = dataRow.insertCell();
      new CodeCell(codeMocCell, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, true, tocLine.codeMoc, null, tocLine.accordingTo);
      // TODO: добавить фукнцию
    }
  }, {
    key: "createLineWithoutTOCLine",
    value: function createLineWithoutTOCLine(awb) {
      var _this4 = this;
      var tbody = this.table.tBodies[0] || this.table.createTBody();
      var dataRow = tbody.insertRow();
      dataRow.setAttribute("data-uid", awb.uid);
      // dataRow.setAttribute("moc-uid", tocLine.uid) TODO: обознаение что новая tocline
      var nameAWBCell = dataRow.insertCell();
      nameAWBCell.textContent = awb.nameAWB;
      nameAWBCell.classList.add("requirement-cell");
      var reqCell = new RequirementCell(nameAWBCell, awb, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter);
      var uidNewToc = TocLine.generateNewUid();
      dataRow.setAttribute('moc-uid', uidNewToc);
      // ------
      var textAWBCell = dataRow.insertCell();
      textAWBCell.classList.add("requirement-cell");
      var divEl = document.createElement("div");
      divEl.classList.add("cell-content");
      var spanText = document.createElement("span");
      spanText.classList.add("cell-text");
      spanText.innerHTML = awb.textAWB;
      // '<font style="color: red">Нет строк ТС</>'; TODO: где-то написать
      textAWBCell.classList.add("requirement-cell");
      divEl.appendChild(spanText);
      divEl.appendChild(this.createBtnAddMoc(awb, textAWBCell, nameAWBCell));
      textAWBCell.appendChild(divEl);
      var codeMocCell = dataRow.insertCell();
      codeMocCell.setAttribute("old-value", ""); // TODO: вынести в функцию всё
      // Добавляем ячейку для codeMoc
      //TODO: возмможно делаем абстрактуную фабрику создания ячеек для документов программ испытании и тд
      var codeCell = new CodeCell(codeMocCell, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, false, "", function (newValue) {
        _this4.trakedObject.changeMoc(uidNewToc, "", newValue.target.value); // Надо придумать как делать новый uid так чтобы учитывать то что объект новый создаётся и редактируется.
        var oldValue = codeMocCell.getAttribute("old-value");
        codeMocCell.setAttribute("old-value", newValue.target.value);
        TocLine.changeCodeMoc(awb.uid, oldValue, newValue.target.value);
        if (oldValue !== "-" && oldValue !== "0" && (newValue.target.value === "0" || newValue.target.value === "-")) {
          var cells = codeMocCell.parentNode.getElementsByClassName("editable");
          for (var i = 0; i < cells.length; i++) {
            cells[i].setAttribute("disabled", "true");
            if (cells[i].getElementsByClassName("button-container")[0]) cells[i].getElementsByClassName("button-container")[0].style.display = "none";
            if (cells[i].getElementsByClassName("elements-container")[0]) {
              cells[i].getElementsByClassName("elements-container")[0].innerHTML = '';
              _this4.trakedObject.removeAllTrakedElement(uidNewToc);
            }
          }
          if (newValue.target.value === "-") {
            var btns = codeMocCell.parentNode.getElementsByClassName("add-moc-btn");
            if (btns && btns[0]) {
              btns[0].setAttribute("disabled", "true");
              btns[0].setAttribute("title", "\"Без Кода МОС\"");
            }
          }
        } else if ((oldValue === "-" || oldValue === "0") && newValue.target.value !== "0" && newValue.target.value !== "-") {
          var _cells2 = codeMocCell.parentNode.getElementsByClassName("editable");
          for (var _i4 = 0; _i4 < _cells2.length; _i4++) {
            _cells2[_i4].removeAttribute("disabled");
            if (_cells2[_i4].getElementsByClassName("button-container")[0]) _cells2[_i4].getElementsByClassName("button-container")[0].style.display = "flex";
          }
        }
        if (oldValue === "-") {
          var _btns = codeMocCell.parentNode.getElementsByClassName("add-moc-btn");
          if (_btns && _btns[0]) {
            _btns[0].removeAttribute("disabled");
            _btns[0].setAttribute("title", "Добавить строку МОС");
          }
        }
      });
      codeCell.deleteButton.style.display = 'none';
      reqCell.addCodeCell(codeCell);
      var mocCell = dataRow.insertCell();
      new MOCCell(mocCell, null, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter);
      var docsCell = dataRow.insertCell();
      new DocCell(docsCell, null, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, "IRM8_RecieveMaterials");
      var docsCell2 = dataRow.insertCell();
      new DocCellCorrespondence(docsCell2, null, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, "IRM8_Correspondence");
      var programCell = dataRow.insertCell();
      new ProgramCell(programCell, null, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, "1");
      var standCell = dataRow.insertCell();
      new StandCell(standCell, null, this.trakedObject, this.getDropedObjectFromTeamcenter);
      this.trakedObject.addTocLine(awb.uid, uidNewToc);
      return;
    }
  }, {
    key: "checkRes",
    value: function checkRes() {
      return this.trakedObject.check();
    }
  }, {
    key: "bindSendTrakedObject",
    value: function bindSendTrakedObject(sendTrakedObject) {
      this.sendTrakedObject = sendTrakedObject;
    }
  }, {
    key: "bindGetDropedObjectFromTeamcenter",
    value: function bindGetDropedObjectFromTeamcenter(getDropedObjectFromTeamcenter) {
      this.getDropedObjectFromTeamcenter = getDropedObjectFromTeamcenter;
    }
  }, {
    key: "bindGetSelectedObjectFromTeamcenter",
    value: function bindGetSelectedObjectFromTeamcenter(getSelectedObjectFromTeamcenter) {
      this.getSelectedObjectFromTeamcenter = getSelectedObjectFromTeamcenter;
    }
  }, {
    key: "bindSendEditMode",
    value: function bindSendEditMode(sendEditMode) {
      this.sendEditMode = sendEditMode;
    }
  }]);
}();