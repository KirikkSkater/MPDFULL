"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Toolbar = /*#__PURE__*/function () {
  function Toolbar(callbackGetDropFromTeamcenter, finishEditing, setEditModeTable, checkRes) {
    var _this = this;
    _classCallCheck(this, Toolbar);
    this.toolbar = document.getElementById('toolbar');
    this.tcNameBox = document.getElementById('tc-name-box-id'); // TODO: переименовать
    this.exitBtn = document.getElementById('exit-btn');
    this.editBtn = document.getElementById('edit-btn');
    this.previewBtn = document.getElementById('preview-btn');
    this.exitBtn.addEventListener('click', function () {
      var userConfirmed = confirm("Вы действительно хотите отметить изменения?");
      if (userConfirmed) {
        _this.editMode = false;
        finishEditing(false);
        setEditModeTable(_this.editMode);
        _this.setEditMode(_this.editMode);
      } else {
        // finishEditing(false);
      }
      _this.setPreviewButton(false);
      // initTableWithCurentObject();
    });
    this.editBtn.addEventListener('click', function () {
      if (_this.editBtn.classList.contains("edit")) {
        _this.editMode = true;
        var buttons = document.querySelectorAll('.action-button-td, .action-button');
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].classList.remove("hidden"); // показываю
        }
      } else {
        var checkStr = checkRes();
        if (checkStr) {
          alert(checkStr);
          return;
        }
        var userConfirmed = confirm("Сохранить результат?");
        // TODO: тут делать проверку на коды МОС и тд, перед saveResult, возможно делать в saveResult и возвращать true
        if (userConfirmed) {
          _this.editMode = false;
          finishEditing(true);
        } else {
          // Если пользователь отменил сохранение, просто продолжаем редактирование
          console.log("сохранение отменено");
          _this.editMode = true;
        }
      }
      setEditModeTable(_this.editMode);
      _this.setEditMode(_this.editMode);
      var icon = document.createElement('span');
      icon.className = 'icon';
      _this.editBtn.insertBefore(icon, _this.editBtn.firstChild);
      _this.setPreviewButton(false);
    });
    this.previewBtn.addEventListener('click', function () {
      var buttons = document.querySelectorAll('.action-button-td, .action-button');
      if (_this.previewBtn.classList.contains("preview")) {
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].classList.remove("hidden"); // показываю
        }
        _this.setPreviewButton(false);
        // TODO убираем предп
        // TODO: меняем картинку
      } else {
        for (var _i = 0; _i < buttons.length; _i++) {
          buttons[_i].classList.add("hidden"); // прячу
        }
        _this.setPreviewButton(true);
      }
    });
    this.initializeDropZone();
    this.awbNameBox = document.getElementById('awb-name-box-id');
    this.callbackGetDropFromTeamcenter = callbackGetDropFromTeamcenter;
  }

  // initTC(nameCompTable, uidCompTable, complTableDesc){
  //     this.tcNameBox.innerHTML = nameCompTable;
  //     this.tcNameBox.title = nameCompTable;
  //     if (complTableDesc.length)
  //         this.tcNameBox.title += " - " + complTableDesc;
  //     this.tcNameBox.setAttribute("uidCompTable", uidCompTable);
  //     this.tcNameBox.classList.remove('notexist');
  // }

  // initAWB(nameAWB, awbDesignation){
  //     this.awbNameBox.innerHTML = nameAWB;
  //     this.awbNameBox.title = nameAWB;
  //     if (awbDesignation.length)
  //         this.awbNameBox.title += " - " + awbDesignation;
  //     // this.awbNameBox.setAttribute("uidCompTable", uidAWB);
  //     this.awbNameBox.classList.remove('notexist');
  // }
  return _createClass(Toolbar, [{
    key: "addCompTable",
    value: function addCompTable(jsonTC) {
      // TODO: пересылать инфу о TC, с Teamcenter. Записывать в trakedObject
    }
  }, {
    key: "getSelectedElementFromCompTable",
    value: function getSelectedElementFromCompTable() {
      // TODO: получаем выбранный элемент
    }
  }, {
    key: "handleDrop",
    value: function handleDrop(event) {
      // event.preventDefault();
      // const dropTarget = event.target;

      // const containerElement = dropTarget;

      // if (containerElement) {
      //     let droppedObjects = this.callbackGetDropFromTeamcenter();
      //     droppedObjects.forEach(droppedObject => {
      //         if (droppedObject.type === "IRM8_ComplTableRevision"){
      //             // const objectField = this.createFieldAddedObject(droppedObject.uid, droppedObject.displayName);
      //             // containerElement.appendChild(objectField)
      //             this.handleInput({ type: 'add', uid: droppedObject.uid, name: droppedObject.displayName})
      //         }
      //     });
      // }
    }
  }, {
    key: "handleInput",
    value: function handleInput(action) {
      // if (action.type === 'add'){
      //     this.tcNameBox.innerHTML = "<font style='color='green''>" + action.name + "</font>";
      //     this.tcNameBox.classList.remove("notexist");
      //     this.tcNameBox.setAttribute("uidCompTable", action.uid);

      //     // this.trackedObject.addDoc(this.tocLine.getAttribute('moc-uid'), action.uid, this.relation_type);
      // }
    }
  }, {
    key: "initializeDropZone",
    value: function initializeDropZone() {
      // this.tcNameBox.addEventListener('dragenter', this.handleDragEnter.bind(this));
      // this.tcNameBox.addEventListener('dragover', this.handleDragOver.bind(this));
      // this.tcNameBox.addEventListener('drop', this.handleDrop.bind(this));
      // this.tcNameBox.classList.add('editable');
    }
  }, {
    key: "handleDragEnter",
    value: function handleDragEnter(event) {
      // event.preventDefault();
    }
  }, {
    key: "handleDragOver",
    value: function handleDragOver(event) {
      // event.preventDefault();
    }
  }, {
    key: "setEditMode",
    value: function setEditMode(editMode) {
      this.editMode = editMode;
      this.tcNameBox.disabled = !editMode;
      if (editMode) {
        this.editBtn.classList.remove('edit');
        this.editBtn.classList.add('save');
        this.editBtn.textContent = 'Сохранить';
        this.previewBtn.disabled = false;
        this.setPreviewButton(false);
      } else {
        this.editBtn.classList.remove('save');
        this.editBtn.classList.add('edit');
        this.editBtn.textContent = 'Редактировать';
        this.previewBtn.disabled = true;
        this.setPreviewButton(true); // TODO: удалить их скорее всего лишние вызовы
      }
    }
  }, {
    key: "setPreviewButton",
    value: function setPreviewButton(flag) {
      var previewIcon = document.getElementById("preview-icon"); // TODO: прееделать на getChild
      var hiddenIcon = document.getElementById("hidden-icon"); // TODO: прееделать на getChild
      if (flag) {
        this.previewBtn.classList.add("preview");
        hiddenIcon.style.display = 'block';
        previewIcon.style.display = 'none';
        // TODO: icon
      } else {
        this.previewBtn.classList.remove("preview");
        previewIcon.style.display = 'block';
        hiddenIcon.style.display = 'none';
        // TODO: icon
      }
    }
  }]);
}();