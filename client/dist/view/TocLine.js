"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Этот клаас будет обрабатывать работу с строками ТС. Пока что умеет только гененрировать ID.
var TocLine = /*#__PURE__*/function () {
  function TocLine() {
    _classCallCheck(this, TocLine);
    this.uid;
  }
  return _createClass(TocLine, null, [{
    key: "generateNewUid",
    value: function generateNewUid() {
      this.countNewLine++;
      return "newUidTOC_" + this.countNewLine;
    }
  }, {
    key: "clearCodesMoc",
    value: function clearCodesMoc() {
      this.mapCodeMoc = new Map();
    }
  }, {
    key: "changeCodeMoc",
    value: function changeCodeMoc(uidAWB, oldMoc, newMoc) {
      if (!this.mapCodeMoc.get(uidAWB)) {
        this.mapCodeMoc.set(uidAWB, new Array());
      }
      if (oldMoc) {
        this.mapCodeMoc.set(uidAWB, this.mapCodeMoc.get(uidAWB).filter(function (item) {
          return item != oldMoc;
        }));
      }
      if (newMoc) this.mapCodeMoc.get(uidAWB).push(newMoc);
    }
  }, {
    key: "addCodeMoc",
    value: function addCodeMoc(uidAWB, codeMoc) {
      if (!this.mapCodeMoc.get(uidAWB)) {
        this.mapCodeMoc.set(uidAWB, new Array());
      }
      this.mapCodeMoc.get(uidAWB).push(codeMoc);
    }
  }, {
    key: "getCodeMocToDisable",
    value: function getCodeMocToDisable(uidAWB) {
      if (this.mapCodeMoc.get(uidAWB).length > 1 || this.mapCodeMoc.get(uidAWB).length == 1 && this.mapCodeMoc.get(uidAWB)[0] === "-") {
        return ['-'].concat(this.mapCodeMoc.get(uidAWB));
      }
      return this.mapCodeMoc.get(uidAWB);
    }
  }, {
    key: "getCountToCLine",
    value: function getCountToCLine(uidAWB) {
      return this.mapCodeMoc.get(uidAWB).length;
    }
  }, {
    key: "checkPossibleAddAccording",
    value: function checkPossibleAddAccording(uidAWB) {
      if (this.mapCodeMoc.get(uidAWB).length > 1) return false;
      if (this.mapCodeMoc.get(uidAWB).length == 1 && (this.mapCodeMoc.get(uidAWB)[0] === "" || this.mapCodeMoc.get(uidAWB)[0] === "-")) return true;
      return false;
    }
  }]);
}();
_defineProperty(TocLine, "countNewLine", 0);
_defineProperty(TocLine, "mapCodeMoc", new Map());