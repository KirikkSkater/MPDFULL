"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var TrackedObject = /*#__PURE__*/function () {
  function TrackedObject() {
    _classCallCheck(this, TrackedObject);
    // TODO: добавить что-то по добавлению или изменению CompTable
    this.trackedObjectsDataAWB = new Array();
    this.trackedObjectsDataTocLine = new Array();
  }
  return _createClass(TrackedObject, [{
    key: "addTocLine",
    value: function addTocLine(parentUid, uidTOC) {
      this.trackedObjectsDataAWB.push(new TrackedObjectDataAWB(parentUid, '+', uidTOC));
    }
  }, {
    key: "deleteToCLine",
    value: function deleteToCLine(parentUid, uidToc) {
      var baseLenght = this.trackedObjectsDataAWB.length;
      this.trackedObjectsDataAWB = this.trackedObjectsDataAWB.filter(function (item) {
        if (item.uid == parentUid && item.uidToc == uidToc && item.action == "+") {
          return false;
        }
        return true;
      });
      if (this.trackedObjectsDataAWB.length == baseLenght) {
        this.trackedObjectsDataAWB.push(new TrackedObjectDataAWB(parentUid, '-', uidToc));
      }
    }
  }, {
    key: "restoreToCLine",
    value: function restoreToCLine(parentUid, uidToc) {
      this.trackedObjectsDataAWB = this.trackedObjectsDataAWB.filter(function (item) {
        if (item.uid == parentUid && item.uidToc == uidToc && item.action == "-") {
          return false;
        }
        return true;
      });
    }
  }, {
    key: "changeMoc",
    value: function changeMoc(uidToc, oldMoc, newMoc) {
      if (this.startsWithMy(uidToc, "newUidTOC_")) {
        this.trackedObjectsDataAWB.forEach(function (item) {
          if (item.uidToc === uidToc) {
            item.codeMoc = newMoc;
          }
        });
      }
      this.trackedObjectsDataTocLine.push(new TrackedObjectDataTocLine(uidToc, 'change', oldMoc, newMoc, null));
    }
  }, {
    key: "startsWithMy",
    value: function startsWithMy(str, word) {
      return str.lastIndexOf(word, 0) === 0;
    }
  }, {
    key: "addDoc",
    value: function addDoc(uidToc, uidDoc, relation_type) {
      this.trackedObjectsDataTocLine.push(new TrackedObjectDataTocLine(uidToc, '+ doc', relation_type, uidDoc));
    }
  }, {
    key: "addAccordingTo",
    value: function addAccordingTo(uidToc, uidTc) {
      this.trackedObjectsDataTocLine.push(new TrackedObjectDataTocLine(uidToc, '+ tc', null, uidTc));
    }
  }, {
    key: "removeAccordingTo",
    value: function removeAccordingTo(uidToc, uidTc) {
      var baseLenght = this.trackedObjectsDataTocLine.length;
      this.trackedObjectsDataTocLine = this.trackedObjectsDataTocLine.filter(function (item) {
        if (item.uidToc == uidToc && item.uidObject == uidTc && item.action == "+ tc") {
          return false;
        }
        return true;
      });
      if (this.trackedObjectsDataTocLine.length == baseLenght) {
        this.trackedObjectsDataTocLine.push(new TrackedObjectDataTocLine(uidToc, '- tc', null, uidTc));
      }
    }
  }, {
    key: "restoreAccordingTo",
    value: function restoreAccordingTo(uidToc, uidTC) {
      this.trackedObjectsDataTocLine = this.trackedObjectsDataTocLine.filter(function (item) {
        if (item.uidToc == uidToc && item.uid == uidTC && item.action == "- tc") {
          return false;
        }
        return true;
      });
    }
  }, {
    key: "removeDoc",
    value: function removeDoc(uidToc, uidDoc, relation_type) {
      var baseLenght = this.trackedObjectsDataTocLine.length;
      this.trackedObjectsDataTocLine = this.trackedObjectsDataTocLine.filter(function (item) {
        if (item.uidToc == uidToc && item.uidDoc == uidDoc && item.action == "+ doc") {
          return false;
        }
        return true;
      });
      if (this.trackedObjectsDataTocLine.length == baseLenght) {
        this.trackedObjectsDataTocLine.push(new TrackedObjectDataTocLine(uidToc, '- doc', relation_type, uidDoc));
      }
    }
  }, {
    key: "removeAllTrakedElement",
    value: function removeAllTrakedElement(uidToc) {
      this.trackedObjectsDataTocLine = this.trackedObjectsDataTocLine.filter(function (item) {
        return item.uidToc !== uidToc;
      });
    }
  }, {
    key: "restoreDoc",
    value: function restoreDoc(uidToc, uidDoc) {
      this.trackedObjectsDataTocLine = this.trackedObjectsDataTocLine.filter(function (item) {
        if (item.uidToc == uidToc && item.uid == uidDoc && item.action == "- doc") {
          return false;
        }
        return true;
      });
    }
  }, {
    key: "addMoc",
    value: function addMoc(uidToc, uidDoc, relation_type) {
      this.trackedObjectsDataTocLine.push(new TrackedObjectDataTocLine(uidToc, '+ moc', relation_type, uidDoc));
    }
  }, {
    key: "removeMoc",
    value: function removeMoc(uidToc, uidDoc, relation_type) {
      var baseLenght = this.trackedObjectsDataTocLine.length;
      this.trackedObjectsDataTocLine = this.trackedObjectsDataTocLine.filter(function (item) {
        if (item.uidToc == uidToc && item.uidDoc == uidDoc && item.action == "+ moc") {
          return false;
        }
        return true;
      });
      if (this.trackedObjectsDataTocLine.length == baseLenght) {
        this.trackedObjectsDataTocLine.push(new TrackedObjectDataTocLine(uidToc, '- moc', relation_type, uidDoc));
      }
    }
  }, {
    key: "restoreMoc",
    value: function restoreMoc(uidToc, uidDoc) {
      this.trackedObjectsDataTocLine = this.trackedObjectsDataTocLine.filter(function (item) {
        if (item.uidToc == uidToc && item.uid == uidDoc && item.action == "- moc") {
          return false;
        }
        return true;
      });
    }
  }, {
    key: "restoreProgram",
    value: function restoreProgram(uidToc, uidDoc) {
      this.trackedObjectsDataTocLine = this.trackedObjectsDataTocLine.filter(function (item) {
        if (item.uidToc == uidToc && item.uid == uidDoc && item.action == "- prog") {
          return false;
        }
        return true;
      });
    }
  }, {
    key: "removeProgram",
    value: function removeProgram(uidToc, uidDoc) {
      var baseLenght = this.trackedObjectsDataTocLine.length;
      this.trackedObjectsDataTocLine = this.trackedObjectsDataTocLine.filter(function (item) {
        if (item.uidToc == uidToc && item.uidDoc == uidDoc && item.action == "+ prog") {
          return false;
        }
        return true;
      });
      if (this.trackedObjectsDataTocLine.length == baseLenght) {
        this.trackedObjectsDataTocLine.push(new TrackedObjectDataTocLine(uidToc, '- prog', null, uidDoc)); // TODO: другой объект делать
      }
    }
  }, {
    key: "addProgram",
    value: function addProgram(uidToc, uidBook) {
      this.trackedObjectsDataTocLine.push(new TrackedObjectDataTocLine(uidToc, '+ prog', null, uidBook));
    }

    // TODO: как-то унифицировать эти методы без + doc - Doc + moc
  }, {
    key: "addMocBook",
    value: function addMocBook(uidToc, uidBook) {
      this.trackedObjectsDataTocLine.push(new TrackedObjectDataTocLine(uidToc, '+ moc', uidBook));
    }
  }, {
    key: "removeBook",
    value: function removeBook(uidToc, uidDoc) {
      var baseLenght = this.trackedObjectsDataTocLine.length;
      this.trackedObjectsDataTocLine = this.trackedObjectsDataTocLine.filter(function (item) {
        if (item.uidToc == uidToc && item.uidDoc == uidDoc && item.action == "+ moc") {
          return false;
        }
        return true;
      });
      if (this.trackedObjectsDataTocLine.length == baseLenght) {
        this.trackedObjectsDataTocLine.push(new TrackedObjectDataAWB(uidDoc, '- moc', uidToc)); // TODO: другой объект делать
      }
    }
  }, {
    key: "restoreBook",
    value: function restoreBook(uidToc, uidDoc) {
      this.trackedObjectsDataTocLine = this.trackedObjectsDataTocLine.filter(function (item) {
        if (item.uidToc == uidToc && item.uidObject == uidDoc && item.action == "- moc") {
          return false;
        }
        return true;
      });
    }
  }, {
    key: "addCompTable",
    value: function addCompTable(uidTable, uidAWB) {
      // UID awb можно не делать, так как оно по идее и так должно быть в Teamcenter опнятно для каждой таблицы
    }
    // Add methods and properties here
  }, {
    key: "check",
    value: function check() {
      var strErrorCodeMoc = null; // TODO: потом другие ошибки могут быть добавлены
      for (var i = 0; i < this.trackedObjectsDataAWB.length; i++) {
        if (this.trackedObjectsDataAWB[i].action === "+" && (this.trackedObjectsDataAWB[i].codeMoc === "" || !this.trackedObjectsDataAWB[i].codeMoc)) {
          strErrorCodeMoc = "Не выбран код МОС\n";
        }
      }
      return strErrorCodeMoc;
    }
  }]);
}();
var TrackedObjectDataAWB = /*#__PURE__*/_createClass(function TrackedObjectDataAWB(uid, action) {
  var uidToc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  _classCallCheck(this, TrackedObjectDataAWB);
  this.uid = uid;
  this.action = action; // + -
  this.uidToc = uidToc;
  this.codeMoc;
});
var TrackedObjectDataTocLine = /*#__PURE__*/_createClass(function TrackedObjectDataTocLine(uidToc, action, relation) {
  var objectUid = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  var old = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
  var newMoc = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
  _classCallCheck(this, TrackedObjectDataTocLine);
  this.uidToc = uidToc;
  this.oldMoc = old;
  this.newMoc = newMoc;
  this.action = action; // + - change
  this.relation = relation; // IRM8_RecieveMaterials, IRM8_Correspondence, IRM8_TestRel, IRM8_MOCRel
  this.uidObject = objectUid;
}); //Если строка создаётся, то для неё задаётся какой-то uid временный, который будет
// в jave читаться так чтобы строка типа уже была, и потом он в наборе том изменяется на uid созданного.
// Для БЛГ:
/*
    + tocLine
    - tocLine

*/
// Для tocLine
/*
    change Moc
    + doc
    + doc 2
    + программа испытаний
    + стенд автоматический к программе если есть

    - doc
    - doc 2
    - программа испытаний
    - стенд автоматический к программе если есть
*/