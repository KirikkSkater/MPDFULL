
// eslint-disable-next-line no-unused-vars
class DModuleFactory {
  constructor() {
    this.$content = null;
  }

  /**
   * Установить ссылку на <content>
   * @param {jQuery} $content 
   */
  setContent($content) {
    this.$content = $content;
  }

  /**
   * Получить ApplicGroup — список <applic>
   * @returns {ApplicGroup}
   */
  createApplicGroup() {
    const applics = this.$content.find('referencedApplicGroup > applic').map((i, node) => {
      return new Applic($(node));
    }).get();
    return new ApplicGroup(applics);
  }

  /**
   * Получить список TaskDefinition (альтернатив)
   * @returns {TaskDefinition[]}
   */
  createTaskDefinitions() {
    return this.$content.find('maintPlanning > taskDefinition').map((i, node) => {
      return new TaskDefinition($(node));
    }).get();
  }

  /**
   * Получить объект MaintPlanning, включающий commonInfo и все taskDefinitions
   * @returns {MaintPlanning}
   */
  createMaintPlanning() {
    const $commonInfo = this.$content.find('maintPlanning > commonInfo');
    const taskDefs = this.createTaskDefinitions();
    return new MaintPlanning($commonInfo, taskDefs);
  }

  /**
   * Получить список всех rqmtSource (например, источники MRBR, MRKК и т.д.)
   * @returns {RqmtSource[]}
   */
  createRqmtSources() {
    return this.$content.find('taskDefinition rqmtSource').map((i, node) => {
      return new RqmtSource($(node));
    }).get();
  }

  /**
   * Получить все Task (taskTitle, taskDescr) из taskDefinition
   * @returns {Task[]}
   */
  createTasks() {
    return this.$content.find('taskDefinition > task').map((i, node) => {
      return new Task($(node));
    }).get();
  }

  /**
   * Получить все Limit (пороговые значения)
   * @returns {Limit[]}
   */
  createLimits() {
    return this.$content.find('taskDefinition > limit').map((i, node) => {
      return new Limit($(node));
    }).get();
  }

  /**
   * Получить все PreliminaryRqmts — предварительные требования
   * @returns {PreliminaryRqmts[]}
   */
  createPreliminaryRqmts() {
    return this.$content.find('taskDefinition > preliminaryRqmts').map((i, node) => {
      return new PreliminaryRqmts($(node));
    }).get();
  }

  /**
   * Получить список всех Ref (dmRef внутри <refs>)
   * @returns {DmRef[]}
   */
  createRefs() {
    return this.$content.find('taskDefinition > refs > dmRef').map((i, node) => {
      return new DmRef($(node));
    }).get();
  }
}

/**
 * ApplicGroup и Applic
 */
class ApplicGroup {
  constructor(applics) {
    this.applics = applics;
  }
}

class Applic {
  constructor($node) {
    this.id = $node.attr('id');
    this.text = $node.find('displayText simplePara').text() || null;
    this.asserts = $node.find('assert').map((i, a) => ({
      ident: $(a).attr('applicPropertyIdent'),
      type: $(a).attr('applicPropertyType'),
      values: $(a).attr('applicPropertyValues')
    })).get();
  }
}

/**
 * MaintPlanning и TaskDefinition
 */
class MaintPlanning {
  constructor($commonInfo, taskDefs) {
    this.title = $commonInfo.find('title').text();
    this.description = $commonInfo.find('para').text();
    this.taskDefs = taskDefs;
  }
}

class TaskDefinition {
  constructor($node) {
    this.applicRefId = $node.attr('applicRefId');
    this.taskIdent = $node.attr('taskIdent');
    this.taskCode = $node.attr('taskCode');
    this.task = new Task($node.find('task'));
    this.sources = $node.find('rqmtSource').map((i, s) => new RqmtSource($(s))).get();
    this.prelim = new PreliminaryRqmts($node.find('preliminaryRqmts'));
    this.refs = $node.find('refs > dmRef').map((i, r) => new DmRef($(r))).get();
    this.limits = $node.find('limit').map((i, l) => new Limit($(l))).get();
  }
}

class Task {
  constructor($node) {
    this.title = $node.find('taskTitle').text();
    this.descr = $node.find('taskDescr simplePara').text();
  }
}

class RqmtSource {
  constructor($node) {
    this.source = $node.attr('sourceOfRqmt');
    this.pubRef = $node.find('externalPubRefIdent > externalPubTitle').text();
  }
}

/**
 * PreliminaryRqmts и его вложенные классы
 */
class PreliminaryRqmts {
  constructor($node) {
    this.prodMaint = $node.find('productionMaintData').map((i, pd) => new ProductionMaintData($(pd))).get();
    this.reqConds = new ReqCondGroup($node.find('reqCondGroup'));
    this.reqPersons = $node.find('reqPersons').map((i, p) => new ReqPersons($(p))).get();
    this.reqTechs = $node.find('reqTechInfoGroup > reqTechInfo').map((i, t) => new ReqTechInfo($(t))).get();
  }
}

class ProductionMaintData {
  constructor($node) {
    this.zoneRefs = $node.find('workAreaLocationGroup > zoneRef').map((i, z) => $(z).attr('zoneNumber')).get();
    this.accessPointRefs = $node.find('accessPointRef').map((i, a) => $(a).attr('accessPointNumber')).get();
    this.duration = {
      startup: parseFloat($node.find('taskDuration').attr('startupDuration')) || 0,
      procedure: parseFloat($node.find('taskDuration').attr('procedureDuration')) || 0,
      closeup: parseFloat($node.find('taskDuration').attr('closeupDuration')) || 0,
      unit: $node.find('taskDuration').attr('unitOfMeasure') || ''
    };
  }
}

class ReqCondGroup {
  constructor($node) {
    this.categories = $node.find('reqCond').map((i, rc) => $(rc).attr('reqCondCategory')).get();
  }
}

class ReqPersons {
  constructor($node) {
    this.applicRefId = $node.attr('applicRefId');
    this.numRequired = parseInt($node.find('personnel').attr('numRequired'), 10) || 0;
    this.categories = $node.find('personCategory').map((i, pc) => $(pc).attr('personCategoryCode')).get();
  }
}

class ReqTechInfo {
  constructor($node) {
    const dm = $node.find('dmRefIdent > dmCode');
    this.dmRef = {
      infoCode: dm.attr('infoCode'),
      infoCodeVariant: dm.attr('infoCodeVariant'),
      itemLocationCode: dm.attr('itemLocationCode'),
      systemCode: dm.attr('systemCode'),
      disassyCode: dm.attr('disassyCode'),
      modelIdentCode: dm.attr('modelIdentCode')
    };
  }
}

class DmRef {
  constructor($node) {
    const dm = $node.find('dmCode');
    this.infoCode = dm.attr('infoCode');
    this.modelIdentCode = dm.attr('modelIdentCode');
    // можно добавить остальные атрибуты
  }
}

class Limit {
  constructor($node) {
    this.type = $node.attr('limitTypeValue');
    this.cond = $node.attr('limitCond');
    this.thresholds = $node.find('threshold').map((i, t) => ({
      type: $(t).attr('thresholdType'),
      unit: $(t).attr('thresholdUnitOfMeasure'),
      value: parseFloat($(t).find('thresholdValue').text())
    })).get();
  }
}
