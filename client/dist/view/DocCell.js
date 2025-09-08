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
var DocCell = /*#__PURE__*/function (_TableObjectsCell) {
  function DocCell(cellElement, docs, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter, relation_type) {
    var _this;
    _classCallCheck(this, DocCell);
    _this = _callSuper(this, DocCell, [cellElement, docs, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter]);
    _this.relation_type = relation_type;
    return _this;
  }
  _inherits(DocCell, _TableObjectsCell);
  return _createClass(DocCell, [{
    key: "handleInput",
    value: function handleInput(action) {
      if (action.type === 'delete') {
        this.trackedObject.removeDoc(this.tocLine.getAttribute('moc-uid'), action.uid, this.relation_type);
        console.log("\u0423\u0434\u0430\u043B\u044F\u0435\u043C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0441 ID: ".concat(action.uid));
      } else if (action.type === 'restore') {
        this.trackedObject.restoreDoc(this.tocLine.getAttribute('moc-uid'), action.uid); // TODO: возможно удалять просто запись            console.log(`Объект восстановлен: ${action.uid}`);
      } else if (action.type === 'add') {
        this.trackedObject.addDoc(this.tocLine.getAttribute('moc-uid'), action.uid, this.relation_type);
      }
    }
  }, {
    key: "createButtons",
    value: function createButtons(buttonContainer) {
      var addButton = document.createElement('button');
      var predictButton = document.createElement('button');
      var iconMagic = document.createElement('img');
      iconMagic.src = 'images/magic.png';
      iconMagic.alt = 'Minus Icon';
      iconMagic.className = 'icon';
      // iconMagic.classList.add('icon-delete-codecell');

      addButton.innerHTML = "+";
      predictButton.appendChild(iconMagic);
      addButton.classList.add("action-button-td");
      predictButton.classList.add("action-button-td");
      predictButton.classList.add("magic");
      this.createContextMenuPredict(predictButton);
      addButton.addEventListener("click", this.addSelectedObjectHandler.bind(this));
      buttonContainer.appendChild(addButton);
      // buttonContainer.appendChild(predictButton);
    }
  }, {
    key: "createContextMenuPredict",
    value: function createContextMenuPredict(button) {
      var _this2 = this;
      var contextMenu = document.getElementById("contextMenu");
      document.addEventListener("click", function (event) {
        // contextMenu.style.display = 'none';
        if (contextMenu.style.display === "none") {
          return;
        }
        var boo1l = contextMenu.contains(event.target);
        var bool2 = event.target !== button;
        if (!boo1l && bool2) {
          contextMenu.style.display = 'none';
        }
      });
      button.addEventListener("click", function (event) {
        event.preventDefault();
        var x = event.clientX;
        var y = event.clientY;
        var menuWidth = contextMenu.offsetWidth;
        var menuHeight = contextMenu.offsetHeight;
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
        if (x + menuWidth > windowWidth) {
          contextMenu.style.left = "".concat(windowWidth - menuWidth, "px");
        } else {
          contextMenu.style.left = "".concat(x, "px");
        }
        if (y + menuHeight > windowHeight) {
          contextMenu.style.top = "".concat(windowHeight - menuHeight, "px");
        } else {
          contextMenu.style.top = "".concat(y, "px");
        }
        _this2.initContextMenu(event.target.parentElement.querySelector('.elements-container'));
        // contextMenu.style.left = "${event.pageX}px"

        // contextMenu.style.right = "${event.pageY}px"
        contextMenu.style.display = 'block';
        event.stopPropagation();
      });
    }
  }, {
    key: "initContextMenu",
    value: function initContextMenu(elementsContainer) {
      var _this3 = this;
      var taskItems = document.querySelectorAll(".context-menu-item");
      if (!taskItems) return;
      for (var i = 0; i < taskItems.length; i++) {
        taskItems[i].addEventListener("click", function (event) {
          event.preventDefault();
          var contextMenuItem = _this3.findParentDivContextMenu(event.target);
          var addedObject = _this3.createFieldAddedObject(contextMenuItem.getAttribute("uid"), contextMenuItem.getAttribute("displayName"));
          elementsContainer.appendChild(addedObject);
          _this3.handleInput({
            type: 'add',
            uid: contextMenuItem.getAttribute("uid")
          });
        });
      }
    }
  }, {
    key: "findParentDivContextMenu",
    value: function findParentDivContextMenu(element) {
      while (element && !element.classList.contains("context-menu-item")) {
        element = element.parentElement;
      }
      return element;
    }
  }], [{
    key: "getTypeObject",
    value: function getTypeObject() {
      return 'IRM8_DocEvidenceRevision';
    }
  }]);
}(TableObjectsCell);