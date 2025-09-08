"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var TableObjectsCell = /*#__PURE__*/function () {
  function TableObjectsCell(cellElement, elements, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter) {
    _classCallCheck(this, TableObjectsCell);
    this.onChangeCallback = null;
    this.initialize(cellElement, elements, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter);
  }
  return _createClass(TableObjectsCell, [{
    key: "getCodeMoc",
    value: function getCodeMoc() {
      var parentTr = this.cellElement.parentElement;
      var codeMoc = false;
      if (parentTr.cells[2]) {
        codeMoc = parentTr.cells[2].getAttribute("old-value");
      }
      if (!codeMoc && parentTr.cells[0]) {
        codeMoc = parentTr.cells[0].getAttribute("old-value");
      }
      return codeMoc;
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
      var buttonContainer = document.createElement('div');
      buttonContainer.classList.add("button-container");
      this.createButtons(buttonContainer);
      this.cellElement.appendChild(elementsContainer);
      this.cellElement.appendChild(buttonContainer);
    }
  }, {
    key: "createButtons",
    value: function createButtons(buttonContainer) {
      var addButton = document.createElement('button');
      addButton.innerHTML = "+";
      addButton.classList.add("action-button-td");
      addButton.addEventListener("click", this.addSelectedObjectHandler.bind(this));
      buttonContainer.appendChild(addButton);
    }
  }, {
    key: "addSelectedObjectHandler",
    value: function addSelectedObjectHandler(event) {
      var _this2 = this;
      event.preventDefault();
      var dropTarget = event.target;
      var containerElement = this.findClosestContainer(dropTarget);
      if (containerElement) {
        var addedObjects = this.callbackGetDropFromTeamcenter();
        addedObjects.forEach(function (addedObject) {
          if (addedObject.type === _this2.type_object && !_this2.checkCollision(addedObject.uid)) {
            var objectField = _this2.createFieldAddedObject(addedObject.uid, addedObject.displayName);
            containerElement.appendChild(objectField);
            _this2.handleInput({
              type: 'add',
              uid: addedObject.uid
            });
          }
        });
      }
    }
  }, {
    key: "createFieldObject",
    value: function createFieldObject(uidObject, name) {
      var elementDOM = document.createElement('p');
      var spanName = document.createElement('span');
      spanName.innerHTML = name;
      spanName.style.marginRight = '30px';
      elementDOM.appendChild(spanName);
      elementDOM.classList.add("click_style");
      spanName.style.pointerEvents = 'auto';
      elementDOM.style.position = 'relative';
      elementDOM.style.cursor = 'pointer';
      var deleteButton = this.createDeleteButton(uidObject, elementDOM);
      elementDOM.appendChild(deleteButton);
      elementDOM.addEventListener('mouseenter', function () {
        deleteButton.style.display = 'inline-block';
      });
      elementDOM.addEventListener('mouseleave', function () {
        deleteButton.style.display = 'none';
      });
      elementDOM.setAttribute('data-uid', uidObject);
      this.addClickHandler(spanName);
      return elementDOM;
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
      deleteButton.addEventListener('click', function () {
        if (deleteButton.classList.contains("revert")) {
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
    key: "addClickHandler",
    value: function addClickHandler(elementDOM) {
      elementDOM.addEventListener("click", function (event) {
        clickToObjectToTeamcenter(elementDOM.parentNode.getAttribute("data-uid")); // Должна быть определена в Teamcenter
      });
    }
  }, {
    key: "initialize",
    value: function initialize(cellElement, elements, trackedObject, callbackGetDropFromTeamcenter, callbackGetSelectedFromTeamcenter) {
      this.cellElement = cellElement;
      this.cellElement.classList.add('editable');
      this.type_object = this.constructor.getTypeObject();
      if (elements == null) {
        this.elements = new Array();
      } else {
        this.elements = elements;
      }
      this.callbackGetDropFromTeamcenter = callbackGetDropFromTeamcenter;
      this.callbackGetSelectedFromTeamcenter = callbackGetSelectedFromTeamcenter;
      this.trackedObject = trackedObject;
      this.tocLine = cellElement.parentElement;
      if (this.getCodeMoc() !== "0" && this.getCodeMoc() !== "-") {
        this.renderElements();
        this.addDragAndDropHandlers();
      }
    }
  }, {
    key: "handleInput",
    value: function handleInput(newValue) {
      // Implement in subclasses
      // TODO: 
    }
  }, {
    key: "handleDrop",
    value: function handleDrop(event) {
      var _this4 = this;
      event.preventDefault();
      var dropTarget = event.target;
      var containerElement = this.findClosestContainer(dropTarget);
      if (containerElement) {
        var droppedObjects = this.callbackGetDropFromTeamcenter();
        droppedObjects.forEach(function (droppedObject) {
          if (droppedObject.type === _this4.type_object && !_this4.checkCollision(droppedObject.uid)) {
            var objectField = _this4.createFieldAddedObject(droppedObject.uid, droppedObject.displayName);
            containerElement.appendChild(objectField);
            _this4.handleInput({
              type: 'add',
              uid: droppedObject.uid
            });
          }
        });
      }
    }
  }, {
    key: "checkCollision",
    value: function checkCollision(newUid) {
      if (this.cellElement.getElementsByClassName("elements-container")[0]) {
        var elements = this.cellElement.getElementsByClassName("elements-container")[0].childNodes;
        for (var i = 0; i < elements.length; i++) {
          if (elements[i].getAttribute("data-uid") === newUid) {
            return true;
          }
        }
      }
      return false;
    }
  }, {
    key: "findClosestContainer",
    value: function findClosestContainer(element) {
      while (element && element.nodeName !== 'TD') {
        element = element.parentElement;
      }
      return element.querySelector('.elements-container');
    }
  }, {
    key: "createFieldAddedObject",
    value: function createFieldAddedObject(uidObject, name) {
      var _this5 = this;
      var objectElement = document.createElement('p');
      var spanName = document.createElement('span');
      spanName.innerHTML = name;
      objectElement.appendChild(spanName);
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
        _this5.handleInput({
          type: 'delete',
          uid: uidObject
        });
      });
      objectElement.setAttribute('data-uid', uidObject);
      this.addClickHandler(spanName);
      return objectElement;
    }
  }, {
    key: "addDragAndDropHandlers",
    value: function addDragAndDropHandlers() {
      this.cellElement.addEventListener('dragenter', this.handleDragEnter.bind(this));
      this.cellElement.addEventListener('dragover', this.handleDragOver.bind(this));
      this.cellElement.addEventListener('drop', this.handleDrop.bind(this));
    }
  }, {
    key: "handleDragEnter",
    value: function handleDragEnter(event) {
      event.preventDefault();
    }
  }, {
    key: "handleDragOver",
    value: function handleDragOver(event) {
      event.preventDefault();
    }
  }], [{
    key: "getTypeObject",
    value: function getTypeObject() {
      return 'base';
    }
  }]);
}();