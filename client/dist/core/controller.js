"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Controller = /*#__PURE__*/function () {
  function Controller() {
    _classCallCheck(this, Controller);
    this.handlerData = new HandlerData();
    this.handlerTeamcenter = new HandlerTeamcenter();
    this.handlerTeamcenter.bindUpdateDataJsonTable(this.updateDataReq.bind(this));
    this.table = new Table(null, this.handlerTeamcenter.getObjectDrop);
    this.table.createTable();
    this.table.bindSendTrakedObject(this.handlerTeamcenter.sendTrakedObject.bind(this.handlerTeamcenter));
    this.table.bindGetDropedObjectFromTeamcenter(this.handlerTeamcenter.getObjectDrop);
    this.table.bindGetSelectedObjectFromTeamcenter(this.handlerTeamcenter.getObjectSelect);
    this.table.bindSendEditMode(this.handlerTeamcenter.setEditMode);
  }
  return _createClass(Controller, [{
    key: "updateTableReq",
    value: function updateTableReq(req) {
      // Обновляет таблицу
      this.table.updateTable(req);
    }
  }, {
    key: "b64DecodeUnicode",
    value: function b64DecodeUnicode(str) {
      // Going backwards: from bytestream, to percent-encoding, to original string.
      return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    }
  }, {
    key: "updateDataReq",
    value: function updateDataReq(json) {
      // обновляет данные в dataTable по JSON
      // this.updateTableReq(this.handlerData.initData(this.b64DecodeUnicode(json))); TODO: изменить когда надо декодировать

      this.updateTableReq(this.handlerData.initData(json));
    }
    // TODO: реализовать тут события какаие-то как слушатели для реазизации MVC, чтобы TeamcenterHandler кидает данные то этот вызывает у таблицы обновление
  }]);
}();