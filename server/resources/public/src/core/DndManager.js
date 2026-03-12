class DndManager {
  constructor({ model, emitChange }) {
      this.model = model;
      this.emitChange = emitChange;
      this._initialized = false;
      this._handlers = {};
  }

  init() {
      if (this._initialized) return;
      this._initialized = true;

      this._handlers.dragOver = this.onDragOver.bind(this);
      this._handlers.drop = this.onDrop.bind(this);
      this._handlers.dragLeave = this.clearHighlight.bind(this);
      this._handlers.dragEnd = this.clearHighlight.bind(this);

      document.addEventListener('dragover', this._handlers.dragOver);
      document.addEventListener('drop', this._handlers.drop);
      document.addEventListener('dragleave', this._handlers.dragLeave);
      document.addEventListener('dragend', this._handlers.dragEnd);

      // Sidebar handlers
      $(document).on('dragover.sched', '#applic-sidebar', (evt) => {
          evt.preventDefault();
          try { evt.originalEvent.dataTransfer.dropEffect = 'move'; } catch {}
      });

      $(document).on('drop.sched', '#applic-sidebar', (evt) => {
          evt.preventDefault();
          const dt = evt.originalEvent?.dataTransfer;
          if (!dt) return;

          const raw = dt.getData('text/task') || dt.getData('text/plain') || '';
          if (!raw) return;

          this.clearApplicability(raw);
      });
  }

  destroy() {
      if (!this._initialized) return;

      document.removeEventListener('dragover', this._handlers.dragOver);
      document.removeEventListener('drop', this._handlers.drop);
      document.removeEventListener('dragleave', this._handlers.dragLeave);
      document.removeEventListener('dragend', this._handlers.dragEnd);

      $(document).off('dragover.sched');
      $(document).off('drop.sched', '#applic-sidebar');

      this._initialized = false;
  }

  // --- Handlers ---

  onDragOver(e) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;

      const $row = $(el).closest('tr[data-task-index]');
      const $limit = $(el).closest('[data-limit-index]');
      const $personnel = $(el).closest('.personnel-block');

      if ($row.length || $limit.length || $personnel.length) {
          e.preventDefault();
          try { e.dataTransfer.dropEffect = 'copy'; } catch {}

          if (!$limit.length && !$personnel.length) {
              $('.applic-drag-over').not($row).removeClass('applic-drag-over');
              $row.addClass('applic-drag-over');
          } else {
              this.clearHighlight();
          }
      }
  }

  onDrop(e) {
      e.preventDefault();
      this.clearHighlight();

      const applicId = this.readApplicFromDT(e.dataTransfer);
      if (!applicId) return;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;

      const $row = $(el).closest('tr[data-task-index]');
      if (!$row.length) return;

      const rowIndex = parseInt($row.attr('data-task-index'), 10);

      // 1. Limit block
      const $limit = $(el).closest('[data-limit-index]');
      if ($limit.length) {
          const idx = parseInt($limit.attr('data-limit-index'), 10);
          if (!isNaN(idx)) {
              this.model.updateApplicForLimit(rowIndex, idx, applicId);
              return this.emitChange({ type: 'applic:dropped', payload: { rowIndex, limitIndex: idx, applicId } });
          }
      }

      // 2. Personnel block
      const $personnel = $(el).closest('.personnel-block');
      if ($personnel.length) {
          const personnelIndex = parseInt($personnel.attr('data-personnel-index'), 10);
          if (!isNaN(personnelIndex)) {
              this.model.updatePersonnelApplic(rowIndex, personnelIndex, applicId);
              return this.emitChange({ type: 'applic:dropped', payload: { rowIndex, personnelIndex, applicId, target: 'personnel' } });
          }
      }

      // 3. Zone group
      const $zone = $(el).closest('.zone-group');
      if ($zone.length) {
          const zoneIndex = parseInt($zone.attr('data-group-index'), 10);
          if (!isNaN(zoneIndex)) {
              this.model.updateWorkAreaGroupApplic(rowIndex, zoneIndex, applicId);
              return this.emitChange({ type: 'applic:dropped', payload: { rowIndex, zoneIndex, applicId, target: 'zone' } });
          }
      }

      // 4. Access group
      const $access = $(el).closest('.access-group');
      if ($access.length) {
          const accessIndex = parseInt($access.attr('data-group-index'), 10);
          if (!isNaN(accessIndex)) {
              this.model.updateWorkAreaGroupApplic(rowIndex, accessIndex, applicId);
              return this.emitChange({ type: 'applic:dropped', payload: { rowIndex, accessIndex, applicId, target: 'access' } });
          }
      }

      // 5. TaskDuration block
      const $taskDuration = $(el).closest('.task-duration-block');
      if ($taskDuration.length) {
          const durationIndex = parseInt($taskDuration.attr('data-duration-index'), 10);
          if (!isNaN(durationIndex)) {
              this.model.updateTaskDurationApplic(rowIndex, durationIndex, applicId);
              return this.emitChange({ type: 'applic:dropped', payload: { rowIndex, durationIndex, applicId, target: 'taskDuration' } });
          }
      }

      // 6. DmRef block
      const $dmref_block = $(el).closest('.dmref-block');
      if ($dmref_block.length) {
          const dmrefIndex = parseInt($dmref_block.attr('data-dmref-index'), 10);
          if (!isNaN(dmrefIndex)) {
              this.model.updateApplicForDmRef(rowIndex, dmrefIndex, applicId);
              return this.emitChange({ type: 'applic:dropped', payload: { rowIndex, dmrefIndex, applicId, target: 'dmRef' } });
          }
      }

      // 7. Remarks block
      const $remarks = $(el).closest('.remarks-block');
      if ($remarks.length) {
          this.model.updateRemarksApplic(rowIndex, applicId);
          return this.emitChange({ type: 'applic:dropped', payload: { rowIndex, applicId, target: 'remarks' } });
      }

      // 8. Field cell
      const $cell = $(el).closest('td[data-field], td[data-col-key]');
      if ($cell.length) {
          const colKey = $cell.attr('data-field') || $cell.attr('data-col-key');
          if (colKey) {
              if (['taskDescr', 'applicability'].includes(colKey)) {
                  this.model.updateApplicForTask(rowIndex, applicId);
                  return this.emitChange({ type: 'applic:dropped', payload: { rowIndex, colKey, applicId } });
              } else {
                  this.model.updateApplicForField(rowIndex, colKey, applicId);
                  return this.emitChange({ type: 'applic:dropped', payload: { rowIndex, colKey, applicId } });
              }
          }
      }

      // 9. Fallback: whole task
      this.model.updateApplicForTask(rowIndex, applicId);
      this.emitChange({ type: 'applic:dropped', payload: { rowIndex, applicId } });
  }

  clearHighlight() {
      $('.applic-drag-over').removeClass('applic-drag-over');
  }

  clearApplicability(identifier) {
      if (this.model.clearApplicability) {
          this.model.clearApplicability(identifier);
      } else if (this.model.setApplicability) {
          this.model.setApplicability(identifier, null);
      } else {
          const idx = this.model.getTaskIndexByIdentifier?.(identifier) ?? parseInt(identifier, 10);
          if (!isNaN(idx)) this.model.updateApplicForTask?.(idx, null);
      }

      this.emitChange({ type: 'applic:cleared', payload: { identifier } });
  }

  // Helper
  readApplicFromDT(dt) {
      if (!dt) return null;

      const tryTypes = ['text/applic', 'text/applic-id', 'application/json', 'text/plain', 'text'];

      for (const t of tryTypes) {
          const raw = dt.getData(t);
          if (raw) {
              try {
                  const js = JSON.parse(raw);
                  return js.id || js.applicId || raw;
              } catch {
                  return raw;
              }
          }
      }

      return null;
  }
}
