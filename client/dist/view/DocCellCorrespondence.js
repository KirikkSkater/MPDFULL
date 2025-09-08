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
var DocCellCorrespondence = /*#__PURE__*/function (_DocCell) {
  function DocCellCorrespondence(cellElement, docs, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter, relation_type) {
    _classCallCheck(this, DocCellCorrespondence);
    return _callSuper(this, DocCellCorrespondence, [cellElement, docs, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter]); // this.isAccordinCor = false;
  }
  _inherits(DocCellCorrespondence, _DocCell);
  return _createClass(DocCellCorrespondence, [{
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
      if (this.elements.length == 1 && this.elements[0].type == "IRM8_ComplTableRevision") this.isAccordinCor = true;
      var buttonContainer = document.createElement('div');
      buttonContainer.classList.add("button-container");
      this.createButtons(buttonContainer);
      this.cellElement.appendChild(elementsContainer);
      this.cellElement.appendChild(buttonContainer);
    }
  }, {
    key: "handleInput",
    value: function handleInput(action) {
      if (action.type === 'delete') {
        if (this.isAccordinCor) this.isAccordinCor = false;
        this.trackedObject.removeDoc(this.tocLine.getAttribute('moc-uid'), action.uid, this.relation_type);
        console.log("\u0423\u0434\u0430\u043B\u044F\u0435\u043C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0441 ID: ".concat(action.uid));
      } else if (action.type === 'restore') {
        this.trackedObject.restoreDoc(this.tocLine.getAttribute('moc-uid'), action.uid); // TODO: возможно удалять просто запись            console.log(`Объект восстановлен: ${action.uid}`);
      } else if (action.type === 'add') {
        this.trackedObject.addDoc(this.tocLine.getAttribute('moc-uid'), action.uid, this.relation_type);
      }
    }
  }, {
    key: "checkNonRed",
    value: function checkNonRed() {
      var container = this.cellElement.querySelector('div.elements-container');
      var count = 0;
      if (container) {
        var paragraphs = container.querySelectorAll('p');
        if (paragraphs) {
          for (var i = 0; i < paragraphs.length; i++) {
            var color = paragraphs[i].style.color;
            if (color !== 'red') {
              count++;
            }
          }
        }
      }
      return count == 0;
    }
  }, {
    key: "handleDrop",
    value: function handleDrop(event) {
      var _this2 = this;
      event.preventDefault();
      var dropTarget = event.target;
      var containerElement = this.findClosestContainer(dropTarget);
      if (containerElement) {
        var droppedObjects = this.callbackGetDropFromTeamcenter();
        droppedObjects.forEach(function (droppedObject) {
          if ((droppedObject.type === _this2.type_object || droppedObject.type === "IRM8_ComplTableRevision") && !_this2.checkCollision(droppedObject.uid) && !_this2.isAccordinCor) {
            if (droppedObject.type === "IRM8_ComplTableRevision") if (_this2.checkNonRed()) _this2.isAccordinCor = true;else {
              return;
            }
            var objectField = _this2.createFieldAddedObject(droppedObject.uid, droppedObject.displayName);
            containerElement.appendChild(objectField);
            _this2.handleInput({
              type: 'add',
              uid: droppedObject.uid
            });
          }
        });
      }
    }
  }, {
    key: "createDeleteButton",
    value: function createDeleteButton(uidObject, elementDOM) {
      var _this3 = this;
      var deleteButton = document.createElement('button');
      var iconMinus = document.createElement('img');
      iconMinus.src = 'images/minus.png';
      iconMinus.alt = 'Minus Icon';
      iconMinus.className = 'icon';
      iconMinus.classList.add('icon-delete');
      var iconArrow = document.createElement('img');
      iconArrow.src = 'images/undo.png';
      iconArrow.alt = 'Arrow Icon';
      iconArrow.className = 'icon';
      iconArrow.classList.add('icon-delete');
      iconArrow.style.display = 'none';

      // Добавляем иконки в кнопку
      deleteButton.appendChild(iconMinus);
      deleteButton.appendChild(iconArrow);

      // deleteButton.innerHTML = '<span">&mdash;</span>';
      deleteButton.style.display = 'none';
      deleteButton.style.position = 'absolute';
      deleteButton.style.top = '0';
      deleteButton.style.right = '0';
      deleteButton.classList.add('action-button');
      iconMinus.style.display = 'block';
      elementDOM.setAttribute('isAccording', this.isAccordinCor);
      deleteButton.addEventListener('click', function () {
        if (deleteButton.classList.contains("revert")) {
          if (elementDOM.getAttribute("isAccording")) {
            if (!_this3.checkNonRed()) return;
            _this3.isAccordinCor = true;
          }
          elementDOM.style.color = '';
          elementDOM.style.textDecoration = '';
          _this3.handleInput({
            type: 'restore',
            uid: uidObject
          });
          iconMinus.style.display = 'block';
          iconArrow.style.display = 'none';
          deleteButton.classList.remove("revert");
        } else {
          elementDOM.style.color = 'red';
          elementDOM.style.textDecoration = 'line-through';
          _this3.handleInput({
            type: 'delete',
            uid: uidObject
          });
          deleteButton.classList.add("revert");
          iconMinus.style.display = 'none';
          iconArrow.style.display = 'block';
        }
      });
      return deleteButton;
    }
  }, {
    key: "addSelectedObjectHandler",
    value: function addSelectedObjectHandler(event) {
      var _this4 = this;
      event.preventDefault();
      var dropTarget = event.target;
      var containerElement = this.findClosestContainer(dropTarget);
      if (containerElement) {
        var addedObjects = this.callbackGetSelectedFromTeamcenter();
        addedObjects.forEach(function (addedObject) {
          if ((addedObject.type === _this4.type_object || addedObject.type === "IRM8_ComplTableRevision") && !_this4.checkCollision(addedObject.uid) && !_this4.isAccordinCor) {
            if (addedObject.type === "IRM8_ComplTableRevision") if (_this4.checkNonRed()) _this4.isAccordinCor = true;else {
              return;
            }
            var objectField = _this4.createFieldAddedObject(addedObject.uid, addedObject.displayName);
            containerElement.appendChild(objectField);
            _this4.handleInput({
              type: 'add',
              uid: addedObject.uid
            });
          }
        });
      }
    }
  }]);
}(DocCell);