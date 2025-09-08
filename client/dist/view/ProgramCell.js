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
// Думаю их с DocCell пронаследовать от одного класса, что у нас будет отличаться так это trakedObject по разному будет дёргаться
// и при добавлении программы испытаний будет добавлятся стенд возможно.

var programCodeMoc = ['4', '5', '6', '7'];
var ProgramCell = /*#__PURE__*/function (_TableObjectsCell) {
  function ProgramCell(cellElement, docs, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter, codeMoc) {
    var _this;
    _classCallCheck(this, ProgramCell);
    _this = _callSuper(this, ProgramCell, [cellElement, docs, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter]);
    _this.codeMoc = codeMoc;
    if (_this.codeMoc !== "0" && _this.codeMoc != "-") _this.createButtonsForProgram();
    return _this;
  }
  _inherits(ProgramCell, _TableObjectsCell);
  return _createClass(ProgramCell, [{
    key: "createButtonsForProgram",
    value: function createButtonsForProgram() {
      console.log(programCodeMoc.indexOf(this.codeMoc));

      // if (programCodeMoc.indexOf(this.getCodeMoc()) !== -1){
      var buttonContainer = document.createElement('div');
      buttonContainer.classList.add("button-container");
      this.createButtons(buttonContainer);
      this.cellElement.appendChild(buttonContainer);
      // }
    }
  }, {
    key: "renderElements",
    value: function renderElements() {
      var _this2 = this;
      // TODO: унифицировать этот метод чтобы одинаковые части были в базовом а в классах только то что отличается
      this.cellElement.innerHTML = '';
      var elementsContainer = document.createElement('div');
      elementsContainer.classList.add('elements-container');
      this.elements.forEach(function (element) {
        var elementDOM = _this2.createFieldObject(element.uid, element.displayName);
        elementsContainer.appendChild(elementDOM);
      });
      this.cellElement.appendChild(elementsContainer);
    }
  }, {
    key: "handleInput",
    value: function handleInput(action) {
      if (action.type === 'delete') {
        this.trackedObject.removeProgram(this.tocLine.getAttribute('moc-uid'), action.uid);
        console.log("\u0423\u0434\u0430\u043B\u044F\u0435\u043C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0441 ID: ".concat(action.uid));
      } else if (action.type === 'restore') {
        this.trackedObject.restoreProgram(this.tocLine.getAttribute('moc-uid'), action.uid); // TODO: возможно удалять просто запись            console.log(`Объект восстановлен: ${action.uid}`);
      } else if (action.type === 'add') {
        this.trackedObject.addProgram(this.tocLine.getAttribute('moc-uid'), action.uid);
      }
    }
  }, {
    key: "handleDrop",
    value: function handleDrop(event) {
      var _this3 = this;
      event.preventDefault();
      if (programCodeMoc.indexOf(this.getCodeMoc()) === -1) {
        alert('Программу испытаний можно добавить только к строке ТС с кодами МОС "4,5,6,7"');
        return;
      }
      var dropTarget = event.target;
      var containerElement = this.findClosestContainer(dropTarget);
      if (containerElement) {
        var droppedObjects = this.callbackGetDropFromTeamcenter();
        var programs = new Array();
        droppedObjects.forEach(function (droppedObject) {
          if (droppedObject.type === _this3.type_object && !_this3.checkCollision(droppedObject.uid)) {
            // TODO: возможно вынести это условие в то место где эта шняга инициализируется, либо выкидывать окно предлупреждающее 
            var objectField = _this3.createFieldAddedObject(droppedObject.uid, droppedObject.displayName);
            containerElement.appendChild(objectField);
            _this3.handleInput({
              type: 'add',
              uid: droppedObject.uid
            });
            programs.push(droppedObject);
          }
        }); // TODO: добавить обработку стендов 
        this.createStandField(programs);
      }
    }
  }, {
    key: "addSelectedObjectHandler",
    value: function addSelectedObjectHandler(event) {
      var _this4 = this;
      event.preventDefault();
      if (programCodeMoc.indexOf(this.getCodeMoc()) === -1) {
        alert('Программу испытаний можно добавить только к строке ТС с кодами МОС "4,5,6,7"');
        return;
      }
      var dropTarget = event.target;
      var containerElement = this.findClosestContainer(dropTarget);
      if (containerElement) {
        var addedObjects = this.callbackGetDropFromTeamcenter();
        var programs = new Array();
        addedObjects.forEach(function (addedObject) {
          if (addedObject.type === _this4.type_object && !_this4.checkCollision(addedObject.uid)) {
            var objectField = _this4.createFieldAddedObject(addedObject.uid, addedObject.displayName);
            containerElement.appendChild(objectField);
            _this4.handleInput({
              type: 'add',
              uid: addedObject.uid
            });
            programs.push(addedObject);
          }
        });
        this.createStandField(programs);
      }
    }
  }, {
    key: "createStandField",
    value: function createStandField(programs) {
      var _this5 = this;
      var cellIndex = this.cellElement.cellIndex;
      var row = this.cellElement.parentElement;
      var standCell = row.cells[cellIndex + 1];
      var standObject = new StandCell(null, null, this.trackedObject, this.callbackGetDropFromTeamcenter);
      var flag = true;
      programs.forEach(function (program) {
        if (program.stand != null) if (_this5.getCodeMoc() !== '4') {
          if (flag) alert('Стенд может быть добавлен только к строке ТС с кодом МОС "4"');
          flag = false;
        } else {
          if (standCell.getElementsByClassName("elements-container")[0]) standCell.getElementsByClassName("elements-container")[0].appendChild(standObject.createFieldAddedObject(program.stand.uid, program.stand.displayName));
        }
      });
    }
  }], [{
    key: "getTypeObject",
    value: function getTypeObject() {
      return 'IRM8_DocProgrammRevision';
    }
  }]);
}(TableObjectsCell);