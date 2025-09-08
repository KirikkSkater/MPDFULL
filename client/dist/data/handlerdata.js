"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var HandlerData = /*#__PURE__*/function () {
  function HandlerData() {
    _classCallCheck(this, HandlerData);
    this.awbData = null;
    this.cbData = null;
  }
  return _createClass(HandlerData, [{
    key: "initData",
    value: function initData(jsonString) {
      var jsonReqs = JSON.parse(jsonString);
      return jsonReqs;
    }
  }]);
}();
var AWB = /*#__PURE__*/function () {
  // TODO: зачем в это парсить в ручную если это надо делать не в ручную...
  function AWB(json) {
    _classCallCheck(this, AWB);
    this.nameAWB = null;
    this.textAWB = null;
    this.tocLines = new Array();
    this.initData(json);
    this.isCharacteristic = null;
  }
  return _createClass(AWB, [{
    key: "initData",
    value: function initData(jsonObj) {
      var _this = this;
      this.nameAWB = jsonObj.awbname;
      this.textAWB = jsonObj.text;
      this.isCharacteristic = this.checkIsCharactiristic(this.nameAWB, jsonObj.awbType);
      jsonObj.lineMOC.forEach(function (line) {
        var tocLine = new TocLine();
        tocLine.codeMoc = line.codeMoc;
        tocLine.docs = line.docsarray;
        _this.tocLines.push(tocLine);
      });
    }
  }, {
    key: "checkIsCharactiristic",
    value: function checkIsCharactiristic(awbName, awbType) {
      if (awbType === 'Характеристика' && awbName.indexOf('0D') == -1) {
        return true;
      }
      return false;
    }
  }]);
}();
var TocLine = /*#__PURE__*/_createClass(function TocLine() {
  _classCallCheck(this, TocLine);
  this.codeMoc = null;
  this.moc = null;
  this.docs = new Array();
});