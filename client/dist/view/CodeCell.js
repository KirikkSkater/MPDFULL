"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var CodeCell = /*#__PURE__*/function (_TableObjectsCell) {
  function CodeCell(cellElement, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter) {
    var _this;
    var isAccordingTo = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var initialValue = arguments.length > 5 ? arguments[5] : undefined;
    var onChangeCallback = arguments.length > 6 ? arguments[6] : undefined;
    var tcEl = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : null;
    _classCallCheck(this, CodeCell);
    _this = _callSuper(this, CodeCell, [cellElement, null, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter]);
    _this.onChangeCallback = onChangeCallback;
    _this.selectElement = null; // DOM элемент <select>
    _this.trackedObject = trackedObject;
    _this.relation_type = "IRM8_AccordingTo";
    _this.callbackGetDropFromTeamcenter = callbackGetDropFromTeamcenter;
    _this.callbackGetSelectedFromTeamcenter = callbackGetSelectedFromTeamcenter;
    // this.initialize(cellElement, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter)
    _this.cellElement = cellElement;
    _this.isAccordingTo = isAccordingTo;
    TocLine.addCodeMoc(_this.parent.getAttribute("data-uid"), initialValue);
    _this.initialValue = initialValue; // Начальное выбранное значение
    if (isAccordingTo && tcEl) {
      _this.createAccordingColOnStart(tcEl.displayName, tcEl.uid);
      return _possibleConstructorReturn(_this);
    }
    // Колбэк при изменении значения

    _this.createDropdown(); // Метод для создания dropdown. вынесен сюда так как нужен onChangCallBack
    _this.createDeleteButton();
    return _this;
  }
  _inherits(CodeCell, _TableObjectsCell);
  return _createClass(CodeCell, [{
    key: "initialize",
    value: function initialize(cellElement, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter) {
      this.cellElement = cellElement;
      // this.cellElement.classList.add('editable');

      this.type_object = this.constructor.getTypeObject();
      this.callbackGetDropFromTeamcenter = callbackGetDropFromTeamcenter;
      this.callbackGetSelectedFromTeamcenter = callbackGetSelectedFromTeamcenter;
      this.trackedObject = trackedObject;
      this.tocLine = cellElement.parentElement;
      if (!this.isAccordingTo) this.renderElements();
      // this.addDragAndDropHandlers();
    }
  }, {
    key: "renderElements",
    value: function renderElements() {
      this.parent = this.cellElement.parentElement; // DOM элемент, где будет размещен dropdown
      this.options = ["", "-", '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']; // Опции для <select>

      this.container = document.createElement('div');
      this.container.style.display = 'flex';
      this.container.style.flexDirection = 'row';
      this.container.style.justifyContent = 'center';
      this.cellElement.appendChild(this.container);
    }
  }, {
    key: "createDropdown",
    value: function createDropdown() {
      var _this2 = this;
      this.selectElement = document.createElement('select');

      // Заполнение <select> элементами <option>
      this.options.forEach(function (optionValue) {
        var option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        _this2.selectElement.appendChild(option);
      });
      if (this.initialValue) {
        this.selectElement.value = this.initialValue; // Установка начального значения
      }
      this.selectElement.style.marginRight = "10px";
      // Назначение обработчика события при изменении значения
      if (this.onChangeCallback) {
        this.selectElement.addEventListener('change', this.onChangeCallback);
      } else {
        this.selectElement.disabled = true;
      }
      this.selectElement.addEventListener('focus', this.disableOptions.bind(this));
      // Добавление <select> в родительский элемент
      this.container.appendChild(this.selectElement);
    }
  }, {
    key: "createDeleteButtonAccording",
    value: function createDeleteButtonAccording(uidObject) {
      var _this3 = this;
      this.deleteButton = document.createElement('button');
      this.deleteButton.classList.add('action-button');
      // this.deleteButton.classList.add('cell-btn');

      // this.deleteButton.style.position = 'absolute';
      this.deleteButton.style.top = '0';
      this.deleteButton.style.right = '0';
      var iconMinus = document.createElement('img');
      iconMinus.src = 'images/minus.png';
      iconMinus.alt = 'Minus Icon';
      iconMinus.className = 'icon';
      iconMinus.classList.add('icon-delete-codecell');
      var iconArrow = document.createElement('img');
      iconArrow.src = 'images/undo.png';
      iconArrow.alt = 'Arrow Icon';
      iconArrow.className = 'icon';
      iconArrow.classList.add('icon-delete-codecell');
      iconArrow.style.display = 'none';

      // Добавляем иконки в кнопку
      this.deleteButton.appendChild(iconMinus);
      this.deleteButton.appendChild(iconArrow);
      iconMinus.style.display = 'block';
      iconArrow.style.display = 'none';
      this.deleteButton.addEventListener("click", function (event) {
        var line = _this3.cellElement.parentElement;
        var class_btn;
        var cells = line.getElementsByTagName('td');
        if (_this3.deleteButton.classList.contains("revert")) {
          for (var i = 2; i < cells.length; i++) {
            cells[i].classList.remove("deleted");
          }
          _this3.deleteButton.classList.remove("revert");
          iconMinus.style.display = 'block';
          iconArrow.style.display = 'none';
          _this3.trackedObject.restoreAccordingTo(line.getAttribute("moc-uid"), uidObject);
        } else {
          _this3.deleteButton.classList.add("revert");
          for (var _i = 2; _i < cells.length; _i++) {
            cells[_i].classList.add("deleted");
          }
          iconMinus.style.display = 'none';
          iconArrow.style.display = 'block';
          _this3.trackedObject.removeAccordingTo(line.getAttribute("moc-uid"), uidObject);
        }
        _this3.deleteButton.style.pointerEvents = "auto";
        _this3.deleteButton.style.opacity = '1';
      });
      return this.deleteButton;
    }
  }, {
    key: "createDeleteButton",
    value: function createDeleteButton() {
      var _this4 = this;
      this.deleteButton = document.createElement('button');
      this.deleteButton.classList.add('action-button');
      // this.deleteButton.classList.add('cell-btn');

      // this.deleteButton.style.position = 'absolute';
      this.deleteButton.style.top = '0';
      this.deleteButton.style.right = '0';
      var iconMinus = document.createElement('img');
      iconMinus.src = 'images/minus.png';
      iconMinus.alt = 'Minus Icon';
      iconMinus.className = 'icon';
      iconMinus.classList.add('icon-delete-codecell');
      var iconArrow = document.createElement('img');
      iconArrow.src = 'images/undo.png';
      iconArrow.alt = 'Arrow Icon';
      iconArrow.className = 'icon';
      iconArrow.classList.add('icon-delete-codecell');
      iconArrow.style.display = 'none';

      // Добавляем иконки в кнопку
      this.deleteButton.appendChild(iconMinus);
      this.deleteButton.appendChild(iconArrow);
      iconMinus.style.display = 'block';
      iconArrow.style.display = 'none';
      this.deleteButton.addEventListener("click", function (event) {
        var line = _this4.cellElement.parentElement;
        var class_btn;
        var cells = line.getElementsByTagName('td');
        if (_this4.deleteButton.classList.contains("revert")) {
          if (cells.length == 8) {
            for (var i = 2; i < cells.length; i++) {
              cells[i].classList.remove("deleted");
            }
          } else {
            for (var _i2 = 0; _i2 < cells.length; _i2++) {
              cells[_i2].classList.remove("deleted");
            }
          }
          _this4.deleteButton.classList.remove("revert");
          iconMinus.style.display = 'block';
          iconArrow.style.display = 'none';
          _this4.trackedObject.restoreToCLine(line.getAttribute("data-uid"), line.getAttribute("moc-uid"));
        } else {
          _this4.deleteButton.classList.add("revert");
          if (cells.length == 8) {
            for (var _i3 = 2; _i3 < cells.length; _i3++) {
              cells[_i3].classList.add("deleted");
            }
          } else {
            for (var _i4 = 0; _i4 < cells.length; _i4++) {
              cells[_i4].classList.add("deleted");
            }
          }
          iconMinus.style.display = 'none';
          iconArrow.style.display = 'block';
          _this4.trackedObject.deleteToCLine(line.getAttribute("data-uid"), line.getAttribute("moc-uid"));
        }
        _this4.deleteButton.style.pointerEvents = "auto";
        _this4.deleteButton.style.opacity = '1';
      });
      this.container.appendChild(this.deleteButton);
    }
  }, {
    key: "disableOptions",
    value: function disableOptions(event) {
      event.preventDefault();
      var optionsToDisable = TocLine.getCodeMocToDisable(this.parent.getAttribute("data-uid"));
      for (var i = 0; i < this.selectElement.options.length; i++) {
        var vlaue = this.selectElement.options[i].value;
        if (optionsToDisable.indexOf(this.selectElement.options[i].value) != -1) {
          this.selectElement.options[i].disabled = true;
        } else {
          this.selectElement.options[i].disabled = false;
        }
      }
    }
  }, {
    key: "getValue",
    value: function getValue() {
      // Получение текущего выбранного значения
      return this.selectElement.value;
    }
  }, {
    key: "setValue",
    value: function setValue(value) {
      // Установка значения
      this.selectElement.value = value;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      // Удаление элемента select и очистка всех связей
      this.selectElement.parentNode.removeChild(this.selectElement);
      this.selectElement = null;
    }
  }, {
    key: "handleInput",
    value: function handleInput(action) {
      if (action.type === 'delete') {
        // this.splitColums();
        this.isAccordingTo = false;
        this.showElForAccording();
        this.trackedObject.removeAccordingTo(this.tocLine.getAttribute('moc-uid'), action.uid, this.relation_type);
        console.log("\u0423\u0434\u0430\u043B\u044F\u0435\u043C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0441 ID: ".concat(action.uid));
      } else if (action.type === 'restore') {
        this.trackedObject.restoreAccordingTo(this.tocLine.getAttribute('moc-uid'), action.uid);
      } else if (action.type === 'add') {
        this.hideElForAccording();
        this.addColOn(action.displayName, action.uid);
        this.trackedObject.changeMoc(this.tocLine.getAttribute('moc-uid'), "", "-");
        this.trackedObject.addAccordingTo(this.tocLine.getAttribute('moc-uid'), action.uid);
        this.isAccordingTo = true;
      }
    }
  }, {
    key: "handleDrop",
    value: function handleDrop(event) {
      var _this5 = this;
      event.preventDefault();
      var dropTarget = event.target;

      // const containerElement = this.findClosestContainer(dropTarget);

      var droppedObjects = this.callbackGetDropFromTeamcenter();
      droppedObjects.forEach(function (droppedObject) {
        if (droppedObject.type === _this5.type_object && !_this5.checkCollision(droppedObject.uid)) {
          // const objectField = this.createFieldAddedObject(droppedObject.uid, droppedObject.displayName);
          // containerElement.appendChild(objectField)
          _this5.handleInput({
            type: 'add',
            uid: droppedObject.uid,
            displayName: droppedObject.displayName
          });
        }
      });
    }
  }, {
    key: "splitColums",
    value: function splitColums() {
      // TODO: подумать как быть с кодам мос, какой выбрать
      this.cellElement.colSpan = 1;
      this.cellElement.innerHTML = "";
      var dataRow = this.cellElement.parentElement;
      this.initialValue = "-";
      this.renderElements();

      // TODO: если что передавать все данные для восстановления
      // const mocCell = dataRow.insertCell();
      // new MOCCell(mocCell, tocLine.mocs, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter);

      // const docsCell = dataRow.insertCell();
      // new DocCell(docsCell, tocLine.receivingMaterialsDocs, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, "IRM8_RecieveMaterials");

      // const docsCell2 = dataRow.insertCell();
      // new DocCell(docsCell2, tocLine.confirmationComplianceDocs, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, "IRM8_Correspondence");

      // const programCell = dataRow.insertCell();
      // new ProgramCell(programCell, tocLine.programs, this.trakedObject, this.getDropedObjectFromTeamcenter, this.getSelectedObjectFromTeamcenter, tocLine.codeMoc);

      // const standCell = dataRow.insertCell();
      // new StandCell(standCell, tocLine.programs, this.trakedObject, this.getDropedObjectFromTeamcenter);
    }
  }, {
    key: "hideElForAccording",
    value: function hideElForAccording() {
      var row = this.cellElement.parentElement;
      var index = row.cells.length - 1;
      for (var i = 0; i < 6; i++) {
        row.cells[index].style.display = "none";
        index--;
      }
    }
  }, {
    key: "showElForAccording",
    value: function showElForAccording() {
      var row = this.cellElement.parentElement;
      this.cellElement.colSpan = 1;
      var index = row.cells.length - 1;
      for (var i = 0; i < 6; i++) {
        row.cells[index].style.display = "table-cell";
        index--;
      }
      this.cellElement.parentElement.removeChild(this.cellElement);
      this.cellElement = this.tempCellElement;
    }
  }, {
    key: "createAccordingColOnStart",
    value: function createAccordingColOnStart(name, uidObject) {
      this.cellElement.colSpan = 6;
      this.cellElement.style.verticalAlign = "middle";
      this.cellElement.style.textAlign = "center";
      this.cellElement.style.alignContent = "center";
      this.cellElement.innerHTML = "";
      var objectElement = document.createElement('p');
      this.createDeleteButtonAccording(uidObject);
      objectElement.appendChild(this.deleteButton);
      var spanName = document.createElement('span');
      spanName.innerHTML = name;
      objectElement.appendChild(spanName);
      objectElement.style.position = 'relative';
      objectElement.style.color = '#2e7fd6';
      objectElement.style.cursor = 'pointer';
      objectElement.classList.add("click_style");
      objectElement.setAttribute('data-uid', uidObject);
      this.addClickHandler(spanName);
      this.cellElement.appendChild(objectElement);
    }
  }, {
    key: "addColOn",
    value: function addColOn(name, uidObject) {
      var _this6 = this;
      this.tempCellElement = this.cellElement;
      this.cellElement = this.cellElement.parentElement.insertCell(2);
      this.cellElement.colSpan = 6;
      this.cellElement.style.verticalAlign = "middle";
      this.cellElement.style.textAlign = "center";
      this.cellElement.style.alignContent = "center";
      this.cellElement.innerHTML = "";
      var objectElement = document.createElement('p');
      var spanName = document.createElement('span');
      spanName.innerHTML = name;
      objectElement.style.position = 'relative';
      objectElement.style.color = 'green';
      objectElement.style.cursor = 'pointer';
      objectElement.classList.add("click_style");
      var deleteButton = document.createElement('button');
      var iconMinus = document.createElement('img');
      iconMinus.src = 'images/minus.png';
      iconMinus.alt = 'Minus Icon';
      iconMinus.className = 'icon';
      iconMinus.classList.add('icon-delete');
      iconMinus.style.transform = 'translate(-9px, -9px)';
      deleteButton.appendChild(iconMinus);
      // deleteButton.style.display = 'none';
      deleteButton.style.position = 'absolute';
      deleteButton.style.top = '0';
      deleteButton.style.left = '0';
      deleteButton.classList.add('action-button');
      // deleteButton.style.color = 'initial'; // устанавливаем начальный цвет для кнопки

      objectElement.appendChild(deleteButton);
      objectElement.appendChild(spanName);

      // objectElement.addEventListener('mouseenter', () => {
      //     deleteButton.style.display = 'inline-block';
      // });

      // objectElement.addEventListener('mouseleave', () => {
      //     deleteButton.style.display = 'none';
      // });

      deleteButton.addEventListener('click', function () {
        // objectElement.parentNode.removeChild(objectElement);
        _this6.handleInput({
          type: 'delete',
          uid: uidObject
        });
      });
      objectElement.setAttribute('data-uid', uidObject);
      this.addClickHandler(spanName);
      this.cellElement.appendChild(objectElement);
    }
  }], [{
    key: "getTypeObject",
    value: function getTypeObject() {
      return 'IRM8_DocEvidenceRevision';
    }
  }]);
}(TableObjectsCell);