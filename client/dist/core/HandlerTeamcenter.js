"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// function getDropObjectFromTeamcenter(){
//     // TODO: заглушка;
//     let doc = [{
//         type: "IRM8_DocEvidence",
//         uid: "sdfsdfsfd",
//         name: "перетащенный документик"
//       },
//     {
//         type: "IRM8_DocEvidence",
//         uid: "fsdf344",
//         name: "перетащенный документик2" 
//     }];
//     return JSON.stringify(doc);
// }
// Temacente
// sendTrakedObjectToTeamcenter();
// getDropObjectFromTeamcenter()
var HandlerTeamcenter = /*#__PURE__*/function () {
  function HandlerTeamcenter() {
    _classCallCheck(this, HandlerTeamcenter);
  } // Initialize the HandlerTeamcenter object
  return _createClass(HandlerTeamcenter, [{
    key: "updateDataTable",
    value: function updateDataTable(json) {
      if (!this.updateDataJsonTable) {
        console.log("updateDataJsonTable is null");
        return;
      }
      this.updateDataJsonTable(json);
    }
  }, {
    key: "bindUpdateDataJsonTable",
    value: function bindUpdateDataJsonTable(callback) {
      this.updateDataJsonTable = callback; // меотд который обновляет json в HandlerData
    }
  }, {
    key: "sendTrakedObject",
    value: function sendTrakedObject(trackedObjects) {
      if (trackedObjects) {
        var jsonTraked = JSON.stringify(trackedObjects);
        console.log(jsonTraked);
        var json = sendTrakedObjectToTeamcenter(jsonTraked); // TODO: должна быть определена в teamcenter
        this.updateDataTable(json);
      }
    }
  }, {
    key: "getObjectDrop",
    value: function getObjectDrop() {
      var jsonObject = JSON.parse(getDropObjectFromTeamcenter()); // TODO: должна быть определена в Teamcenter
      console.log(jsonObject);
      return jsonObject;
    }
  }, {
    key: "getObjectSelect",
    value: function getObjectSelect() {
      var jsonObject = JSON.parse(getSelectObjectFromTeamcenter()); // TODO: должна быть определена в Teamcenter
      console.log(jsonObject);
      return jsonObject;
    }
  }, {
    key: "setEditMode",
    value: function setEditMode(flag) {
      changeEditMode(flag);
    }
  }]);
}();