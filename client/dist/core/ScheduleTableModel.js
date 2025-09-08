"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var ScheduleTableModel = /*#__PURE__*/function () {
  function ScheduleTableModel(xmlDoc) {
    _classCallCheck(this, ScheduleTableModel);
    this.$xml = $(xmlDoc);
    this.taskNodes = [];
    this.tasks = [];
    this.title = '';
    this.desiredHeaders = [{
      key: 'changeCode',
      label: 'КОД ИЗМЕНЕНИЯ',
      editable: false
    }, {
      key: 'taskIdent',
      label: 'НОМЕР ЗАДАЧИ ИДПТО',
      editable: false
    }, {
      key: 'rqmtSource',
      label: 'ДОКУМЕНТ ИСХОДНЫЙ',
      editable: true,
      path: ['rqmtSource', 'externalPubRef', 'externalPubRefIdent', 'externalPubTitle']
    }, {
      key: 'zoneNumber',
      label: 'ЗОНА',
      editable: true,
      path: ['preliminaryRqmts', 'productionMaintData', 'workAreaLocationGroup', 'zoneRef', "@zoneNumber"]
    }, {
      key: 'accessPoint',
      label: 'ДОСТУП',
      editable: true,
      path: ['preliminaryRqmts', 'productionMaintData', 'workAreaLocationGroup', 'accessPointRef', '@accessPointNumber']
    }, {
      key: 'taskCode',
      label: 'КОД ЗАДАЧИ',
      editable: false
    }, {
      key: 'taskDescr',
      label: 'ОПИСАНИЕ ЗАДАЧИ',
      editable: true,
      allowApplic: true,
      path: ['task', 'taskDescr', 'simplePara']
    }, {
      key: 'startupDur',
      label: 'РАБОТ ПОРОГ НАЧАЛА',
      editable: true,
      path: ['preliminaryRqmts', 'productionMaintData', 'taskDuration', '@startupDuration']
    }, {
      key: 'procDur',
      label: 'ИНТЕРВАЛ',
      editable: true,
      path: ['preliminaryRqmts', 'productionMaintData', 'taskDuration', '@procedureDuration']
    }, {
      key: 'closeupDur',
      label: 'AMTOSS',
      editable: true,
      allowApplic: true,
      path: ['preliminaryRqmts', 'productionMaintData', 'taskDuration', '@closeupDuration']
    }, {
      key: 'numRequired',
      label: 'КОЛ‑ВО ЧЕЛОВЕК',
      editable: true,
      allowApplic: true,
      path: ['reqPersons', 'personnel', '@numRequired']
    }, {
      key: 'personCat',
      label: 'СПЕЦИАЛИЗАЦИЯ',
      editable: true,
      path: ['reqPersons', 'personnel', 'personCategory', '@personCategoryCode']
    }, {
      key: 'pass1',
      label: 'РАБОТЫ ПОДГОТОВИТЕЛЬНЫЕ',
      editable: true
    }, {
      key: 'pass2',
      label: 'ЗАДАЧА',
      editable: true
    }, {
      key: 'applicability',
      label: 'ПРИМЕНИМОСТЬ',
      editable: false,
      allowApplic: true
    }];
    // this.desiredHeaders = [
    //     { key: 'changeCode', label: 'КОД ИЗМЕНЕНИЯ', editable: false },
    //     { key: 'taskIdent',  label: 'НОМЕР ЗАДАЧИ ИДПТО', editable: false },
    //     { key: 'taskCode',   label: 'КОД ЗАДАЧИ', editable: false },
    //     {
    //         key:  'rqmtSource',
    //         label:'ДОКУМЕНТ ИСХОДНЫЙ',
    //         editable: true,
    //         // deep path: ищем текст в <rqmtSource>…<externalPubTitle>
    //         path: ['rqmtSource','externalPubRef','externalPubRefIdent','externalPubTitle']
    //     },
    //     {
    //         key:  'zoneNumber',
    //         label:'ЗОНА',
    //         editable: true,
    //         path: ['preliminaryRqmts','productionMaintData','workAreaLocationGroup','zoneRef','@zoneNumber']
    //     },
    //     {
    //         key:  'accessPoint',
    //         label:'ДОСТУП',
    //         editable: true,
    //         path: ['preliminaryRqmts','productionMaintData','workAreaLocationGroup','accessPointRef','@accessPointNumber']
    //     },
    //     {
    //         key: 'taskTitle',
    //         label:'ОПИСАНИЕ ЗАДАЧИ',
    //         editable: true,
    //         allowApplic: true,
    //         path: ['task','taskTitle']
    //     },
    //     {
    //         key: 'startupDur',
    //         label:'РАБОТ ПОРОГ НАЧАЛА',
    //         editable: true,
    //         path: ['preliminaryRqmts','productionMaintData','taskDuration','@startupDuration']
    //     },
    //     {
    //         key: 'procDur',
    //         label:'ИНТЕРВАЛ',
    //         editable: true,
    //         path: ['preliminaryRqmts','productionMaintData','taskDuration','@procedureDuration']
    //     },
    //     {
    //         key: 'closeupDur',
    //         label:'AMTOSS',
    //         editable: true,
    //         allowApplic: true,
    //         path: ['preliminaryRqmts','productionMaintData','taskDuration','@closeupDuration']
    //     },
    //     {
    //         key: 'numRequired',
    //         label:'КОЛ‑ВО ЧЕЛОВЕК',
    //         editable: true,
    //         allowApplic: true,
    //         path: ['reqPersons','personnel','@numRequired']
    //     },
    //     {
    //         key: 'personCat',
    //         label:'СПЕЦИАЛИЗАЦИЯ',
    //         editable: true,
    //         path: ['reqPersons','personnel','personCategory','@personCategoryCode']
    //     },
    //     {
    //         key: 'pass',
    //         label:'pass',
    //         editable: true,
    //         // path: ['reqPersons','personnel','personCategory','@personCategoryCode']
    //     },
    //     {
    //         key: 'pass',
    //         label:'pass',
    //         editable: true,
    //         // path: ['reqPersons','personnel','personCategory','@personCategoryCode']
    //     },
    //     // …можете добавить ещё поля‑заглушки
    //     {
    //         key: 'applicability',
    //         label: 'ПРИМЕНИМОСТЬ',
    //         editable: false,
    //         allowApplic: true
    //     }
    // ];

    this.changeListeners = [];
    this.parseXML();
    this.buildHeaders();
  }
  return _createClass(ScheduleTableModel, [{
    key: "onChange",
    value: function onChange(callback) {
      if (typeof callback === 'function') {
        this.changeListeners.push(callback);
      }
    }
  }, {
    key: "parseXML",
    value: function parseXML() {
      var self = this;
      var $content = this.$xml.find('content');
      var $maintPlanning = $content.find('maintPlanning');
      var $commonInfo = $maintPlanning.find('commonInfo');
      this.title = $commonInfo.find('title').text().trim();
      var $taskDefs = $maintPlanning.find('taskDefinitionAlts > taskDefinition, > taskDefinition');
      $taskDefs.each(function () {
        var $node = $(this);
        var task = {};
        self.desiredHeaders.forEach(function (col) {
          if (!col.path) {
            task[col.key] = $node.attr(col.key) || '';
          } else {
            var cursor = $node;
            var value = '';
            var _iterator = _createForOfIteratorHelper(col.path),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var step = _step.value;
                if (!cursor || !cursor.length) {
                  cursor = null;
                  break;
                }
                if (step.startsWith('@')) {
                  value = cursor.attr(step.slice(1)) || '';
                  break;
                } else {
                  cursor = cursor.find(step).first();
                  if (!cursor.length) {
                    cursor = null;
                    break;
                  }
                  value = cursor.text().trim();
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            task[col.key] = value;
          }
        });
        task["taskTitle"] = $node.find('task > taskTitle').text().trim();
        self.taskNodes.push(this);
        self.tasks.push(task);
      });
    }
  }, {
    key: "buildHeaders",
    value: function buildHeaders() {
      this.headers = this.desiredHeaders.map(function (col) {
        return {
          key: col.key,
          label: col.label,
          editable: col.editable,
          allowApplic: col.allowApplic || false,
          path: col.path || [col.key]
        };
      });
    }
  }, {
    key: "getHeaders",
    value: function getHeaders() {
      return this.headers;
    }
  }, {
    key: "getFilteredTasks",
    value: function getFilteredTasks() {
      return this.tasks;
    }
  }, {
    key: "getTitle",
    value: function getTitle() {
      return this.title;
    }
  }, {
    key: "updateTaskField",
    value: function updateTaskField(rowIndex, key, value) {
      var _this = this;
      if (!this.tasks[rowIndex]) return;
      this.tasks[rowIndex][key] = value;
      var node = this.taskNodes[rowIndex];
      var $node = $(node);
      var header = this.headers.find(function (h) {
        return h.key === key;
      });
      if (!header || !header.path) return;
      var cursor = $node;
      var path = header.path;
      for (var i = 0; i < path.length; i++) {
        var step = path[i];
        if (step.startsWith('@')) {
          var attrName = step.slice(1);
          cursor.attr(attrName, value);
          break;
        } else {
          var found = cursor.find(step).first();
          if (!found.length) {
            // Создаём узел, если его нет
            var newEl = $('<' + step + '>');
            cursor.append(newEl);
            found = newEl;
          }
          if (i === path.length - 1) {
            found.text(value);
          }
          cursor = found;
        }
      }

      // notify listeners
      this.changeListeners.forEach(function (fn) {
        return fn(_this.getXML());
      });
    }
  }, {
    key: "addTaskNode",
    value: function addTaskNode($node) {
      var _this2 = this;
      this.taskNodes.push($node[0]);
      var task = {};
      this.headers.forEach(function (col) {
        if (!col.path) {
          task[col.key] = $node.attr(col.key) || '';
        } else {
          var cursor = $node;
          var value = '';
          var _iterator2 = _createForOfIteratorHelper(col.path),
            _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var step = _step2.value;
              if (!cursor || !cursor.length) {
                cursor = null;
                break;
              }
              if (step.startsWith('@')) {
                value = cursor.attr(step.slice(1)) || '';
              } else {
                cursor = cursor.find(step).first();
                if (!cursor.length) {
                  cursor = null;
                  break;
                }
                value = cursor.text().trim();
              }
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
          task[col.key] = value;
        }
      });

      // Добавляем в DOM
      var $root = this.$xml.find('maintPlanning');
      $root.append($node);
      this.tasks.push(task); // TODO: посмотреть куда это пушится.

      // Триггерим хук на обновление
      this.changeListeners.forEach(function (fn) {
        return fn(_this2.getXML());
      });
    }

    // addTaskToSection(taskCode, taskTitle) {
    //     const $taskDef = $('<taskDefinition>', {
    //         taskIdent: 'new-task-' + Date.now(),
    //         taskCode: taskCode
    //     });
    //     const $task = $('<task>').append($('<taskTitle>').text(taskTitle));
    //     $taskDef.append($task);
    //     this.$xml.find('maintPlanning > taskDefinitionAlts').append($taskDef);
    //     this.taskNodes.push($taskDef[0]);

    //     const task = {};
    //     this.headers.forEach(h => {
    //         task[h.key] = (h.key === 'taskCode') ? taskCode : (h.key === 'taskTitle') ? taskTitle : '';
    //     });
    //     this.tasks.push(task);
    //     this.changeListeners.forEach(fn => fn(this.getXML()));
    // }
  }, {
    key: "addTaskToSection",
    value: function addTaskToSection(taskCode, taskTitle) {
      var _this3 = this;
      var $taskDef = $('<taskDefinition>', {
        taskIdent: 'new-task-' + Date.now(),
        taskCode: taskCode
      });
      var $task = $('<task>').append($('<taskTitle>').text(taskTitle));
      $taskDef.append($task);

      // Найти индекс, куда вставлять новую задачу
      var insertIndex = this.taskNodes.findIndex(function (n) {
        var code = $(n).attr('taskCode');
        return code === taskCode;
      });
      var task = {};
      this.headers.forEach(function (h) {
        task[h.key] = h.key === 'taskCode' ? taskCode : h.key === 'taskTitle' ? taskTitle : '';
      });
      var $container = this.$xml.find('maintPlanning > taskDefinitionAlts');
      if (insertIndex !== -1) {
        // Вставка в XML после последнего найденного узла с этим taskCode
        var lastIndex = insertIndex;
        while (lastIndex + 1 < this.taskNodes.length && $(this.taskNodes[lastIndex + 1]).attr('taskCode') === taskCode) {
          lastIndex++;
        }
        $(this.taskNodes[lastIndex]).after($taskDef); // XML вставка
        this.taskNodes.splice(lastIndex + 1, 0, $taskDef[0]); // модель
        this.tasks.splice(lastIndex + 1, 0, task); // данные
      } else {
        // taskCode ещё нет — вставим в конец taskDefinitionAlts
        $container.append($taskDef);
        this.taskNodes.push($taskDef[0]);
        this.tasks.push(task);
      }

      // Оповещаем слушателей (например, ScheduleView)
      this.changeListeners.forEach(function (fn) {
        return fn(_this3.getXML());
      });
    }
  }, {
    key: "updateApplicForTask",
    value: function updateApplicForTask(idx, id) {
      var _this4 = this;
      var $el = $(this.taskNodes[idx]);
      // основной атрибут на taskDefinition
      $el.attr('applicRefId', id);
      this.tasks[idx].applicability = id;
      this.changeListeners.forEach(function (fn) {
        return fn(_this4.getXML());
      });
    }

    /**
     * Привязать applic к полю примечаний (<remarks>)
     */
  }, {
    key: "updateRemarkApplic",
    value: function updateRemarkApplic(idx, id) {
      var _this5 = this;
      var $el = $(this.taskNodes[idx]);
      // находим или создаём элемент <remarks>
      var $remarks = $el.children('remarks').first();
      if (!$remarks.length) {
        $remarks = $('<remarks>').appendTo($el);
      }
      // сохраняем и в XML, и в модель
      $remarks.attr('applicRefId', id).text(id);
      this.tasks[idx].remarks = id;
      this.changeListeners.forEach(function (fn) {
        return fn(_this5.getXML());
      });
    }
  }, {
    key: "deleteTask",
    value: function deleteTask(idx) {
      var _this6 = this;
      var node = this.taskNodes.splice(idx, 1)[0];
      this.tasks.splice(idx, 1);
      $(node).remove();
      this.changeListeners.forEach(function (fn) {
        return fn(_this6.getXML());
      });
    }
  }, {
    key: "updateApplicForField",
    value: function updateApplicForField(idx, key, id) {
      var _this7 = this;
      var header = this.headers.find(function (h) {
        return h.key === key;
      });
      var $node = $(this.taskNodes[idx]);
      if (header && header.path) {
        // найти соответствующий узел по пути
        var cursor = $node;
        var _iterator3 = _createForOfIteratorHelper(header.path),
          _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var step = _step3.value;
            if (step.startsWith('@')) break;
            cursor = cursor.find(step).first();
            if (!cursor.length) return;
          }
          // привязать атрибут applicRefId
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
        cursor.attr('applicRefId', id);
        // сохранить в модели
        this.tasks[idx][key + 'Applic'] = id;
        this.changeListeners.forEach(function (fn) {
          return fn(_this7.getXML());
        });
      }
    }
  }, {
    key: "addTaskSection",
    value: function addTaskSection() {
      var taskCode = 'taskcd-' + Date.now();
      var title = 'Новая задача';
      this.addTaskToSection(taskCode, title);
    }
  }, {
    key: "getTaskCount",
    value: function getTaskCount() {
      return this.tasks.length;
    }
  }, {
    key: "getTaskNode",
    value: function getTaskNode(index) {
      return this.taskNodes[index] || null;
    }
  }, {
    key: "getXML",
    value: function getXML() {
      return this.$xml;
    }
  }]);
}(); // taskTitle 
/*

Там где <taskDefinition applicRefId="app-07" этот applicRefId сходится с id в 

<applic id="app-02">
				<displayText>
					<simplePara>C УСТАНОВЛЕННОЙ ОПЦИЕЙ 2128-101</simplePara>
				</displayText>
			</applic>

      ТО этот текст из simplePara добавляется над строчкой с этой задачей во всю длинну


  <commonInfo> -- текст из этого тега идёт перед задачами во всю строку с форматированием по центру
				<title>СИСТЕМА КОНДИЦИОНИРОВАНИЯ ВОЗДУХА</title>
				<para/>
			</commonInfo>    


  <taskDefinition taskIdent="MT-212100-01" taskCode="taskcd02">
				<task>
					<taskTitle>MSI 21-31-00: СИСТЕМА АВТОМАТИЧЕСКОГО РЕГУЛИРОВАНИЯ ДАВЛЕНИЯ</taskTitle>
					<taskDescr>
						<simplePara>КОНТРОЛЬ ИСПРАВНОСТИ ВЫПУСКНОГО И НАЗЕМНОГО КЛАПАНОВ ПРИ ПОМОЩИ КНОПКИ-ТАБЛО «DITCHING» НА ПУЛЬТЕ УПРАВЛЕНИЯ CAB PRESSURE С ЦЕЛЬЮ УБЕДИТЬСЯ В КОРРЕКТНОМ (И СВОЕВРЕМЕННОМ) ОТКРЫТИИ И ЗАКРЫТИИ КЛАПАНОВ ПРИ ВЫПОЛНЕНИИ ЦИКЛА ПРИВОДНЕНИЯ</simplePara>
					</taskDescr>
				</task>
    эта штука показывает <taskTitle> под какой сплощшной горизонтальной линией писать - 

    taskCode="taskcd02" -- видимо показывает именно код который показывает под какой штукой что писать - его выводить не надо


    taskIdent="343434-07" -- это "Номер задачи ИДПТО"

    taskDefinitionAlts - понять что за taskDefinitionAlts - чем от обычного отличается в ней тоже свои taskCode="taskcd09"

    

*/