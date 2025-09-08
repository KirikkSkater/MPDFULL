"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// eslint-disable-next-line no-unused-vars
var DModuleFactory = /*#__PURE__*/function () {
  function DModuleFactory() {
    _classCallCheck(this, DModuleFactory);
    this.$content = null;
  }

  /**
   * Установить ссылку на <content>
   * @param {jQuery} $content 
   */
  return _createClass(DModuleFactory, [{
    key: "setContent",
    value: function setContent($content) {
      this.$content = $content;
    }

    /**
     * Получить ApplicGroup — список <applic>
     * @returns {ApplicGroup}
     */
  }, {
    key: "createApplicGroup",
    value: function createApplicGroup() {
      var applics = this.$content.find('referencedApplicGroup > applic').map(function (i, node) {
        return new Applic($(node));
      }).get();
      return new ApplicGroup(applics);
    }

    /**
     * Получить список TaskDefinition (альтернатив)
     * @returns {TaskDefinition[]}
     */
  }, {
    key: "createTaskDefinitions",
    value: function createTaskDefinitions() {
      return this.$content.find('maintPlanning > taskDefinition').map(function (i, node) {
        return new TaskDefinition($(node));
      }).get();
    }

    /**
     * Получить объект MaintPlanning, включающий commonInfo и все taskDefinitions
     * @returns {MaintPlanning}
     */
  }, {
    key: "createMaintPlanning",
    value: function createMaintPlanning() {
      var $commonInfo = this.$content.find('maintPlanning > commonInfo');
      var taskDefs = this.createTaskDefinitions();
      return new MaintPlanning($commonInfo, taskDefs);
    }

    /**
     * Получить список всех rqmtSource (например, источники MRBR, MRKК и т.д.)
     * @returns {RqmtSource[]}
     */
  }, {
    key: "createRqmtSources",
    value: function createRqmtSources() {
      return this.$content.find('taskDefinition rqmtSource').map(function (i, node) {
        return new RqmtSource($(node));
      }).get();
    }

    /**
     * Получить все Task (taskTitle, taskDescr) из taskDefinition
     * @returns {Task[]}
     */
  }, {
    key: "createTasks",
    value: function createTasks() {
      return this.$content.find('taskDefinition > task').map(function (i, node) {
        return new Task($(node));
      }).get();
    }

    /**
     * Получить все Limit (пороговые значения)
     * @returns {Limit[]}
     */
  }, {
    key: "createLimits",
    value: function createLimits() {
      return this.$content.find('taskDefinition > limit').map(function (i, node) {
        return new Limit($(node));
      }).get();
    }

    /**
     * Получить все PreliminaryRqmts — предварительные требования
     * @returns {PreliminaryRqmts[]}
     */
  }, {
    key: "createPreliminaryRqmts",
    value: function createPreliminaryRqmts() {
      return this.$content.find('taskDefinition > preliminaryRqmts').map(function (i, node) {
        return new PreliminaryRqmts($(node));
      }).get();
    }

    /**
     * Получить список всех Ref (dmRef внутри <refs>)
     * @returns {DmRef[]}
     */
  }, {
    key: "createRefs",
    value: function createRefs() {
      return this.$content.find('taskDefinition > refs > dmRef').map(function (i, node) {
        return new DmRef($(node));
      }).get();
    }
  }]);
}();
/**
 * ApplicGroup и Applic
 */
var ApplicGroup = /*#__PURE__*/_createClass(function ApplicGroup(applics) {
  _classCallCheck(this, ApplicGroup);
  this.applics = applics;
});
var Applic = /*#__PURE__*/_createClass(function Applic($node) {
  _classCallCheck(this, Applic);
  this.id = $node.attr('id');
  this.text = $node.find('displayText simplePara').text() || null;
  this.asserts = $node.find('assert').map(function (i, a) {
    return {
      ident: $(a).attr('applicPropertyIdent'),
      type: $(a).attr('applicPropertyType'),
      values: $(a).attr('applicPropertyValues')
    };
  }).get();
});
/**
 * MaintPlanning и TaskDefinition
 */
var MaintPlanning = /*#__PURE__*/_createClass(function MaintPlanning($commonInfo, taskDefs) {
  _classCallCheck(this, MaintPlanning);
  this.title = $commonInfo.find('title').text();
  this.description = $commonInfo.find('para').text();
  this.taskDefs = taskDefs;
});
var TaskDefinition = /*#__PURE__*/_createClass(function TaskDefinition($node) {
  _classCallCheck(this, TaskDefinition);
  this.applicRefId = $node.attr('applicRefId');
  this.taskIdent = $node.attr('taskIdent');
  this.taskCode = $node.attr('taskCode');
  this.task = new Task($node.find('task'));
  this.sources = $node.find('rqmtSource').map(function (i, s) {
    return new RqmtSource($(s));
  }).get();
  this.prelim = new PreliminaryRqmts($node.find('preliminaryRqmts'));
  this.refs = $node.find('refs > dmRef').map(function (i, r) {
    return new DmRef($(r));
  }).get();
  this.limits = $node.find('limit').map(function (i, l) {
    return new Limit($(l));
  }).get();
});
var Task = /*#__PURE__*/_createClass(function Task($node) {
  _classCallCheck(this, Task);
  this.title = $node.find('taskTitle').text();
  this.descr = $node.find('taskDescr simplePara').text();
});
var RqmtSource = /*#__PURE__*/_createClass(function RqmtSource($node) {
  _classCallCheck(this, RqmtSource);
  this.source = $node.attr('sourceOfRqmt');
  this.pubRef = $node.find('externalPubRefIdent > externalPubTitle').text();
});
/**
 * PreliminaryRqmts и его вложенные классы
 */
var PreliminaryRqmts = /*#__PURE__*/_createClass(function PreliminaryRqmts($node) {
  _classCallCheck(this, PreliminaryRqmts);
  this.prodMaint = $node.find('productionMaintData').map(function (i, pd) {
    return new ProductionMaintData($(pd));
  }).get();
  this.reqConds = new ReqCondGroup($node.find('reqCondGroup'));
  this.reqPersons = $node.find('reqPersons').map(function (i, p) {
    return new ReqPersons($(p));
  }).get();
  this.reqTechs = $node.find('reqTechInfoGroup > reqTechInfo').map(function (i, t) {
    return new ReqTechInfo($(t));
  }).get();
});
var ProductionMaintData = /*#__PURE__*/_createClass(function ProductionMaintData($node) {
  _classCallCheck(this, ProductionMaintData);
  this.zoneRefs = $node.find('workAreaLocationGroup > zoneRef').map(function (i, z) {
    return $(z).attr('zoneNumber');
  }).get();
  this.accessPointRefs = $node.find('accessPointRef').map(function (i, a) {
    return $(a).attr('accessPointNumber');
  }).get();
  this.duration = {
    startup: parseFloat($node.find('taskDuration').attr('startupDuration')) || 0,
    procedure: parseFloat($node.find('taskDuration').attr('procedureDuration')) || 0,
    closeup: parseFloat($node.find('taskDuration').attr('closeupDuration')) || 0,
    unit: $node.find('taskDuration').attr('unitOfMeasure') || ''
  };
});
var ReqCondGroup = /*#__PURE__*/_createClass(function ReqCondGroup($node) {
  _classCallCheck(this, ReqCondGroup);
  this.categories = $node.find('reqCond').map(function (i, rc) {
    return $(rc).attr('reqCondCategory');
  }).get();
});
var ReqPersons = /*#__PURE__*/_createClass(function ReqPersons($node) {
  _classCallCheck(this, ReqPersons);
  this.applicRefId = $node.attr('applicRefId');
  this.numRequired = parseInt($node.find('personnel').attr('numRequired'), 10) || 0;
  this.categories = $node.find('personCategory').map(function (i, pc) {
    return $(pc).attr('personCategoryCode');
  }).get();
});
var ReqTechInfo = /*#__PURE__*/_createClass(function ReqTechInfo($node) {
  _classCallCheck(this, ReqTechInfo);
  var dm = $node.find('dmRefIdent > dmCode');
  this.dmRef = {
    infoCode: dm.attr('infoCode'),
    infoCodeVariant: dm.attr('infoCodeVariant'),
    itemLocationCode: dm.attr('itemLocationCode'),
    systemCode: dm.attr('systemCode'),
    disassyCode: dm.attr('disassyCode'),
    modelIdentCode: dm.attr('modelIdentCode')
  };
});
var DmRef = /*#__PURE__*/_createClass(function DmRef($node) {
  _classCallCheck(this, DmRef);
  var dm = $node.find('dmCode');
  this.infoCode = dm.attr('infoCode');
  this.modelIdentCode = dm.attr('modelIdentCode');
  // можно добавить остальные атрибуты
});
var Limit = /*#__PURE__*/_createClass(function Limit($node) {
  _classCallCheck(this, Limit);
  this.type = $node.attr('limitTypeValue');
  this.cond = $node.attr('limitCond');
  this.thresholds = $node.find('threshold').map(function (i, t) {
    return {
      type: $(t).attr('thresholdType'),
      unit: $(t).attr('thresholdUnitOfMeasure'),
      value: parseFloat($(t).find('thresholdValue').text())
    };
  }).get();
});