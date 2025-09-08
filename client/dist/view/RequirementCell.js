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
var RequirementCell = /*#__PURE__*/function (_TableObjectsCell) {
  function RequirementCell(cellElement, docs, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter) {
    _classCallCheck(this, RequirementCell);
    return _callSuper(this, RequirementCell, [cellElement, docs, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter]);
  }
  _inherits(RequirementCell, _TableObjectsCell);
  return _createClass(RequirementCell, [{
    key: "addCodeCell",
    value: function addCodeCell(codeCell) {
      this.codeCell = codeCell;
    }
  }, {
    key: "handleInput",
    value: function handleInput(action) {
      if (action.type === 'delete') {
        this.trackedObject.removeMoc(this.tocLine.getAttribute('moc-uid'), action.uid);
        console.log("\u0423\u0434\u0430\u043B\u044F\u0435\u043C \u043A\u043D\u0438\u0433\u0443 MOC \u0441 ID: ".concat(action.uid));
      } else if (action.type === 'restore') {
        this.trackedObject.restoreMoc(this.tocLine.getAttribute('moc-uid'), action.uid); // TODO: возможно удалять просто запись            console.log(`Объект восстановлен: ${action.uid}`);
      } else if (action.type === 'add') {
        this.trackedObject.addAccordingTo(this.tocLine.getAttribute('moc-uid'), action.uid);
      }
    }
  }, {
    key: "renderElements",
    value: function renderElements(awb) {
      // this.addDragAndDropHandlers();
      this.createAddAccordingButton();
    }
  }, {
    key: "createAddAccordingButton",
    value: function createAddAccordingButton() {
      var addButton = document.createElement('button');
      addButton.innerHTML = "+";
      addButton.classList.add("action-button-td");
      addButton.addEventListener("click", this.addSelectedObjectHandler.bind(this));
      this.cellElement.appendChild(addButton);
    }
  }, {
    key: "addAccordingTo",
    value: function addAccordingTo(uid, displayName) {
      this.codeCell.handleInput({
        displayName: displayName,
        uid: uid,
        type: "add"
      });
    }
  }, {
    key: "addSelectedObjectHandler",
    value: function addSelectedObjectHandler(event) {
      var _this = this;
      event.preventDefault();
      var dropTarget = event.target;
      var addedObjects = this.callbackGetSelectedFromTeamcenter();
      addedObjects.forEach(function (addedObject) {
        if (addedObject.type === _this.type_object) {
          if (TocLine.checkPossibleAddAccording(_this.cellElement.parentElement.getAttribute("data-uid"))) {
            _this.addAccordingTo(addedObject.uid, addedObject.displayName);
          } else {
            alert('Чтобы добавить Таблицу соответсвия у требования может быть только строка ТС без кода МОС или не быть строк ТС');
          }
        } else {
          alert('Можно добавить только объект таблицы соответсвия');
        }
      });
    }
  }, {
    key: "handleDrop",
    value: function handleDrop(event) {
      var _this2 = this;
      event.preventDefault();
      // const containerElement = this.findClosestContainer(dropTarget);

      var droppedObjects = this.callbackGetDropFromTeamcenter();
      droppedObjects.forEach(function (droppedObject) {
        if (droppedObject.type === _this2.type_object && !_this2.checkCollision(droppedObject.uid)) {
          if (TocLine.checkPossibleAddAccording(_this2.cellElement.parentElement.getAttribute("data-uid"))) {
            _this2.addAccordingTo(droppedObject.uid, droppedObject.displayName);
          } else {
            alert('Чтобы добавить Таблицу соответсвия у требования может быть только строка ТС без кода МОС или не быть строк ТС');
          }
        }
      });
    }
  }], [{
    key: "getTypeObject",
    value: function getTypeObject() {
      // return 'IRM8_ComplTableRevision';
      return 'IRM8_ComplTableRevision';
    }
  }]);
}(TableObjectsCell);