"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var ScheduledController = /*#__PURE__*/function () {
  function ScheduledController(_ref) {
    var parser = _ref.parser,
      modelClass = _ref.modelClass,
      viewClass = _ref.viewClass,
      $container = _ref.$container;
    _classCallCheck(this, ScheduledController);
    this.parser = parser;
    this.modelClass = modelClass;
    this.viewClass = viewClass;
    this.$container = $container; // TODO: на время хардкожу
    this.$container = $('#table-container');
    this.model = null;
    this.view = null;
    this.originalXml = null;
    this.changeListeners = [];
    this.editMode = false;
    this.sidebar = null;
  }
  return _createClass(ScheduledController, [{
    key: "onChange",
    value: function onChange(callback) {
      if (typeof callback === 'function') this.changeListeners.push(callback);
    }
  }, {
    key: "init",
    value: function init(xmlString) {
      var _this = this;
      this.originalXml = xmlString;
      var xmlDoc = this.parser.parse(xmlString);
      this.model = new this.modelClass(xmlDoc);

      // Sidebar инициализация после создания модели
      this.sidebar = new ApplicSidebar(this.model, $('#applic-sidebar'));
      this.sidebar.render();

      // Listen model changes for sidebar
      this.model.onChange(function () {
        return _this.sidebar.render();
      });

      // View
      this.view = new this.viewClass(this.model, this.$container);
      this.view.render();
      this.view.setEditable(false);
      this.bindToolbar();
      this.bindSidebarToggle();
      // Sidebar инициализация

      // this.model.onChange(() => this.sidebar.render());
    }
  }, {
    key: "bindToolbar",
    value: function bindToolbar() {
      var ctrl = this;
      $('#edit-btn').prop('disabled', false).off('click').on('click', function () {
        if ($(this).hasClass('edit')) {
          ctrl.editMode = true;
          $('.action-button-td, .action-button').removeClass('hidden');
        } else {
          var _window$checkRes, _window;
          var checkStr = (_window$checkRes = (_window = window).checkRes) === null || _window$checkRes === void 0 ? void 0 : _window$checkRes.call(_window);
          if (checkStr) {
            alert(checkStr);
            return;
          }
          var userConfirmed = confirm("Сохранить результат?");
          if (userConfirmed) {
            var _window$finishEditing, _window2;
            ctrl.editMode = false;
            (_window$finishEditing = (_window2 = window).finishEditing) === null || _window$finishEditing === void 0 || _window$finishEditing.call(_window2, true);
          } else {
            console.log("сохранение отменено");
            ctrl.editMode = true;
          }
        }
        ctrl.setEditMode(ctrl.editMode);
        ctrl.setPreviewButton(false);
        $(this).prepend($('<span class="icon">'));
      });
      $('#exit-btn').off('click').on('click', function () {
        var userConfirmed = confirm("Вы действительно хотите отметить изменения?");
        if (userConfirmed) {
          var _window$finishEditing2, _window3;
          ctrl.editMode = false;
          (_window$finishEditing2 = (_window3 = window).finishEditing) === null || _window$finishEditing2 === void 0 || _window$finishEditing2.call(_window3, false);
          ctrl.setEditMode(ctrl.editMode);
        }
        ctrl.setPreviewButton(false);
      });
      $('#preview-btn').off('click').on('click', function () {
        var buttons = $('.action-button-td, .action-button');
        if ($(this).hasClass('preview')) {
          buttons.removeClass('hidden');
          ctrl.setPreviewButton(false);
        } else {
          buttons.addClass('hidden');
          ctrl.setPreviewButton(true);
        }
      });
    }
  }, {
    key: "bindSidebarToggle",
    value: function bindSidebarToggle() {
      var sidebar = $('#applic-sidebar');
      var tableWrapper = $('#table-container');
      $('#toggle-sidebar-btn').off('click').on('click', function () {
        sidebar.toggleClass('hidden');
      });
    }
  }, {
    key: "setEditMode",
    value: function setEditMode(isEdit) {
      this.editMode = isEdit;

      // tcNameBox переключается только если он есть
      var $tcNameBox = $('#tc-name-box-id');
      if ($tcNameBox.length) {
        $tcNameBox.prop('disabled', !isEdit);
      }
      var $editBtn = $('#edit-btn');
      var $previewBtn = $('#preview-btn');
      if (isEdit) {
        $editBtn.removeClass('edit').addClass('save').text('Сохранить');
        $previewBtn.prop('disabled', false);
        this.setPreviewButton(false);
      } else {
        $editBtn.removeClass('save').addClass('edit').text('Редактировать');
        $previewBtn.prop('disabled', true);
        this.setPreviewButton(true);
      }
      this.view.setEditable(isEdit);
    }
  }, {
    key: "setPreviewButton",
    value: function setPreviewButton(isPreview) {
      // логика переключения preview-режима (если нужно менять иконки — сюда)
      $('#preview-btn').toggleClass('preview', isPreview);
    }
  }, {
    key: "exportXML",
    value: function exportXML() {
      return new XMLSerializer().serializeToString(this.model.getXML()[0]);
    }
  }]);
}(); // Скорее всего он понадобиться когда надо будет с нуля генерировать таблицу. Там надо будет использовать DModuleFactory
// // ScheduledController.js
// class ScheduledController {
//   /**
//    * @param {object} deps
//    * @param {XMLParser} deps.parser
//    * @param {DModuleFactory} deps.factory
//    * @param {typeof ScheduleTableModel} deps.modelClass
//    * @param {typeof ScheduleView} deps.viewClass
//    * @param {jQuery} deps.$container
//    * @param {string} deps.infoCode
//    */
//   constructor({ parser, factory, modelClass, viewClass, $container, infoCode }) {
//     this.parser     = parser;
//     this.factory    = factory;
//     this.ModelClass = modelClass;
//     this.ViewClass  = viewClass;
//     this.$container = $container;
//     this.infoCode   = infoCode;
//   }
//   /**
//    * Инициализация контроллера:
//    * - загрузка и парсинг XML
//    * - фабрика создаёт TaskDefinition[]
//    * - строится модель и view
//    * @param {string} xmlString
//    */
//   init(xmlString) {
//     this.parser.load(xmlString);
//     this.factory.setContent(this.parser.getContent());
//     const taskDefs = this.factory.createTaskDefinitions();
//     this.model = new this.ModelClass(this.parser.getContent(), this.infoCode);
//     this.view  = new this.ViewClass(this.model, this.$container);
//     this.view.render();
//   }
//   /**
//    * Позволяет переключить инфокод и перерисовать таблицу
//    * @param {string} newCode
//    */
//   changeInfoCode(newCode) {
//     this.infoCode = newCode;
//     this.init(this.parser.$xml.toString());
//   }
// }