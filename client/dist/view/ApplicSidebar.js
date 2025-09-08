"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var ApplicSidebar = /*#__PURE__*/function () {
  function ApplicSidebar(model, $container) {
    _classCallCheck(this, ApplicSidebar);
    this.model = model;
    this.$container = $container;
  }
  return _createClass(ApplicSidebar, [{
    key: "render",
    value: function render() {
      var _this = this;
      this.$container.empty();
      var $list = $('<div>').addClass('applic-list');
      this.model.getXML().find('referencedApplicGroup > applic').each(function (i, el) {
        var $app = $(el);
        var applicId = $app.attr('id');
        var text = $app.find('displayText simplePara').text().trim();
        var vals = $app.find('assert').attr('applicPropertyValues') || '';
        var $item = $('<div>').addClass('applic-item').attr('draggable', true).append($('<strong>').text(applicId)).append($('<div>').text(text)).append($('<div>').text(vals));

        // dragstart
        $item.on('dragstart', function (event) {
          var ev = event.originalEvent || event;
          if (ev.dataTransfer) {
            ev.dataTransfer.setData('text/applic-id', applicId);
            ev.dataTransfer.effectAllowed = 'copy';
          }
        });

        // double-click edit
        $item.on('dblclick', function () {
          return _this.editApplic(applicId);
        });
        $list.append($item);
      });
      var $addBtn = $('<button>').addClass('btn btn-sm btn-outline-success mb-2 add-task-btn add-button-row edit-mode-btn').text('Добавить применимость').on('click', function () {
        return _this.createApplic();
      });
      this.$container.append($addBtn, $list);
    }
  }, {
    key: "editApplic",
    value: function editApplic(id) {
      var _this2 = this;
      var $app = this.model.$xml.find("referencedApplicGroup > applic[id=\"".concat(id, "\"]"));
      var oldText = $app.find('displayText simplePara').text().trim();
      var oldVals = $app.find('assert').attr('applicPropertyValues') || '';
      var newText = prompt('Текст применимости:', oldText) || oldText;
      var newVals = prompt('Значения serialno:', oldVals) || oldVals;
      $app.find('displayText simplePara').text(newText);
      $app.find('assert').attr('applicPropertyValues', newVals);
      this.model.changeListeners.forEach(function (fn) {
        return fn(_this2.model.getXML());
      });
    }
  }, {
    key: "createApplic",
    value: function createApplic() {
      var _this3 = this;
      var id = 'app-' + Math.floor(Math.random() * 1000);
      var text = prompt('Текст применимости:');
      var vals = prompt('Значения serialno:');
      var $app = $('<applic>', {
        id: id
      }).append($('<displayText>').append($('<simplePara>').text(text))).append($('<assert>', {
        applicPropertyIdent: 'serialno',
        applicPropertyType: 'prodattr',
        applicPropertyValues: vals
      }));
      this.model.$xml.find('referencedApplicGroup').append($app);
      this.model.changeListeners.forEach(function (fn) {
        return fn(_this3.model.getXML());
      });
      this.render();
    }
  }]);
}();