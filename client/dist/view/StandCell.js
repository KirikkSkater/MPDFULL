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
var StandCell = /*#__PURE__*/function (_TableObjectsCell) {
  function StandCell(cellElement, programs, trackedObject, callbackGetDropFromTeamcenter) {
    _classCallCheck(this, StandCell);
    return _callSuper(this, StandCell, [cellElement, programs, trackedObject, callbackGetDropFromTeamcenter]);
  }
  _inherits(StandCell, _TableObjectsCell);
  return _createClass(StandCell, [{
    key: "initialize",
    value: function initialize(cellElement, programs, trackedObject, callbackGetDropFromTeamcenter) {
      if (!cellElement) {
        return;
      }
      this.cellElement = cellElement;
      if (programs == null) {
        this.programs = new Array();
      } else {
        this.programs = programs;
      }
      this.cellElement.classList.add('editable');
      this.type_object = this.constructor.getTypeObject();
      if (programs == null) {
        this.elements = new Array();
      } else {
        this.elements = this.getStandsFromPrograms(this.programs);
      }
      this.callbackGetDropFromTeamcenter = callbackGetDropFromTeamcenter;
      this.trackedObject = trackedObject;
      this.tocLine = this.cellElement.parentElement;
      if (this.getCodeMoc() !== "-" && this.getCodeMoc() != "0") {
        this.renderElements();
        this.addDragAndDropHandlers();
      }
    }
  }, {
    key: "renderElements",
    value: function renderElements() {
      var _this = this;
      this.cellElement.innerHTML = '';
      var elementsContainer = document.createElement('div');
      elementsContainer.classList.add('elements-container');
      this.elements.forEach(function (element) {
        var elementDOM = _this.createFieldObject(element.uid, element.displayName);
        elementsContainer.appendChild(elementDOM);
      });
      this.cellElement.appendChild(elementsContainer);
    }
    // TODO: There should be no add button in the Stand
  }, {
    key: "createFieldObject",
    value: function createFieldObject(uidStand, name) {
      var _this2 = this;
      var elementDOM = document.createElement('p');
      elementDOM.textContent = name;
      elementDOM.style.position = 'relative';
      elementDOM.style.cursor = 'pointer';
      elementDOM.classList.add("click_style");
      var deleteButton = document.createElement('button');
      deleteButton.innerHTML = '<span">&mdash;</span>';
      deleteButton.style.display = 'none';
      deleteButton.style.position = 'absolute';
      deleteButton.style.top = '0';
      deleteButton.style.right = '0';
      deleteButton.classList.add('action-button');
      deleteButton.display = 'none';
      elementDOM.appendChild(deleteButton);
      elementDOM.addEventListener('mouseenter', function () {
        deleteButton.style.display = 'inline-block';
      });
      elementDOM.addEventListener('mouseleave', function () {
        deleteButton.style.display = 'none';
      });
      deleteButton.addEventListener('click', function () {
        if (deleteButton.classList.contains("revert")) {
          // TODO: проверку не через это делать
          elementDOM.style.color = '';
          elementDOM.style.textDecoration = '';
          deleteButton.innerHTML = '<span">&mdash;</span>';
          _this2.handleInput({
            type: 'restore',
            uid: uidObject
          });
          deleteButton.classList.remove("revert");
        } else {
          elementDOM.style.color = 'red';
          elementDOM.style.textDecoration = 'line-through';
          deleteButton.innerHTML = "<span>&#10558;</span>";
          _this2.handleInput({
            type: 'delete',
            uid: uidObject
          });
          deleteButton.classList.add("revert");
        }
      });
      elementDOM.setAttribute('data-uid', uidStand);
      this.addClickHandler(elementDOM);
      return elementDOM;
    }
  }, {
    key: "getStandsFromPrograms",
    value: function getStandsFromPrograms(programs) {
      var stands = new Array();
      programs.forEach(function (program) {
        if (program.stand) stands.push(program.stand);
      });
      return stands;
    }
  }, {
    key: "handleInput",
    value: function handleInput(action) {
      if (action.type === 'delete') {
        this.trackedObject.removeDoc(action.uidProgram, action.uidStand);
        console.log("\u0423\u0434\u0430\u043B\u044F\u0435\u043C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0441 ID: ".concat(action.uidStand));
      } else if (action.type === 'restore') {
        this.trackedObject.restoreDoc(this.tocLine.getAttribute('moc-uid'), action.uid);
        console.log("\u041E\u0431\u044A\u0435\u043A\u0442 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D: ".concat(action.uid));
      }
      // } else if (action.type === 'add') {
      //     this.trackedObject.addDoc(this.tocLine.getAttribute('moc-uid'), action.uid);
      // }
    }
  }, {
    key: "addDragAndDropHandlers",
    value: function addDragAndDropHandlers() {
      // without DND 
    }
  }, {
    key: "createFieldAddedObject",
    value: function createFieldAddedObject(uidObject, name) {
      var _this3 = this;
      var objectElement = document.createElement('p');
      objectElement.textContent = name;
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
      deleteButton.appendChild(iconMinus);
      deleteButton.style.display = 'none';
      deleteButton.style.position = 'absolute';
      deleteButton.style.top = '0';
      deleteButton.style.right = '0';
      deleteButton.classList.add('action-button');
      // deleteButton.style.color = 'initial'; // устанавливаем начальный цвет для кнопки

      objectElement.appendChild(deleteButton);
      objectElement.addEventListener('mouseenter', function () {
        deleteButton.style.display = 'inline-block';
      });
      objectElement.addEventListener('mouseleave', function () {
        deleteButton.style.display = 'none';
      });
      deleteButton.addEventListener('click', function () {
        objectElement.parentNode.removeChild(objectElement);
        _this3.handleInput({
          type: 'delete',
          uid: uidObject
        });
      });
      deleteButton.display = 'none';
      objectElement.setAttribute('data-uid', uidObject);
      this.addClickHandler(objectElement);
      return objectElement;
    }
  }], [{
    key: "getTypeObject",
    value: function getTypeObject() {
      return 'IRM8_StandRevision';
    }
  }]);
}(TableObjectsCell);