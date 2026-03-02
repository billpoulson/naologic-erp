import { Component, signal, computed, inject, ViewChild } from '@angular/core';
import { WorkOrderService } from '../../services/work-order.service';
import { ZoomLevelService } from '../../services/zoom-level.service';
import { TimelineRangeService } from '../../services/timeline-range.service';
import { TimelineCalculatorService } from '../../services/timeline-calculator.service';
import { TimelineComponent } from '../timeline/timeline.component';
import { WorkOrderPanelComponent } from '../work-order-panel/work-order-panel.component';
import type { WorkCenterDocument } from '../../models/work-center';
import type { WorkOrderDocument } from '../../models/work-order';

@Component({
  selector: 'app-work-order-schedule',
  standalone: true,
  imports: [TimelineComponent, WorkOrderPanelComponent],
  template: `
    <div class="work-order-schedule">
      <div
        class="timeline-fade-wrapper"
        [class.loaded]="dataLoaded()"
        [class.loading]="loading()"
      >
        <app-timeline
          #timelineRef
          [workCenters]="workCenters()"
          [workOrders]="workOrdersInRange()"
          [loading]="loading()"
          [zoomLevel]="zoomService.level()"
          [focusedWorkOrderId]="focusedWorkOrderId()"
          (createRequest)="onCreateRequest($event)"
          (editRequest)="onEditRequest($event)"
          (deleteRequest)="onDeleteRequest($event)"
          (focusChange)="onTimelineFocusChange($event)"
        />
      </div>
      <app-work-order-panel
        [visible]="panelVisible()"
        [mode]="panelMode()"
        [workOrder]="selectedWorkOrder()"
        [initialDate]="clickContext()?.date ?? null"
        [workCenterId]="clickContext()?.workCenterId ?? null"
        (close)="onPanelClose()"
        (save)="onPanelSave($event)"
      />
    </div>
  `,
  styleUrls: ['./work-order-schedule.component.scss'],
})
export class WorkOrderScheduleComponent {
  @ViewChild('timelineRef') timelineRef?: TimelineComponent;

  zoomService = inject(ZoomLevelService);
  rangeService = inject(TimelineRangeService);
  calculator = inject(TimelineCalculatorService);
  workCenters = signal<WorkCenterDocument[]>([]);
  workOrders = signal<WorkOrderDocument[]>([]);
  loading = signal(false);

  /** True when work centers (and thus timeline structure) have loaded */
  dataLoaded = computed(() => this.workCenters().length > 0);

  /** Work orders that overlap the current timeline window - only these are passed to the timeline */
  workOrdersInRange = computed(() => {
    const orders = this.workOrders();
    const range =
      this.rangeService.dateRange() ??
      this.calculator.getSlidingWindowRange(this.zoomService.level());
    const startMs = range.start.getTime();
    const endMs = range.end.getTime();
    return orders.filter((wo) => {
      const woStart = this.calculator.parseLocalDate(wo.data.startDate).getTime();
      const woEnd = this.calculator.parseLocalDate(wo.data.endDate).getTime();
      return woStart < endMs && woEnd > startMs;
    });
  });

  panelVisible = signal(false);
  panelMode = signal<'create' | 'edit'>('create');
  selectedWorkOrder = signal<WorkOrderDocument | null>(null);
  clickContext = signal<{ date: Date; workCenterId: string } | null>(null);
  focusedWorkOrderId = signal<string | null>(null);

  constructor(private workOrderService: WorkOrderService) {
    this.workOrderService.workCenters.subscribe((c) => this.workCenters.set(c));
    this.workOrderService.workOrders.subscribe((o) => this.workOrders.set(o));
    this.workOrderService.loading.subscribe((loading) => this.loading.set(loading));
  }

  onCreateRequest(event: { date: Date; workCenterId: string }): void {
    this.clickContext.set(event);
    this.selectedWorkOrder.set(null);
    this.panelMode.set('create');
    this.panelVisible.set(true);
  }

  onEditRequest(workOrder: WorkOrderDocument): void {
    this.clickContext.set(null);
    this.selectedWorkOrder.set(workOrder);
    this.panelMode.set('edit');
    this.panelVisible.set(true);
  }

  onDeleteRequest(workOrder: WorkOrderDocument): void {
    this.workOrderService.deleteWorkOrder(workOrder.docId);
  }

  onTimelineFocusChange(workOrder: WorkOrderDocument | null): void {
    this.focusedWorkOrderId.set(workOrder?.docId ?? null);
  }

  onPanelClose(): void {
    this.panelVisible.set(false);
    this.selectedWorkOrder.set(null);
    this.clickContext.set(null);
    // Resume keyboard control on timeline after panel close animation completes
    setTimeout(() => this.timelineRef?.focusTimeline(), 250);
  }

  onPanelSave(data: WorkOrderDocument['data']): void {
    if (this.panelMode() === 'create') {
      const created = this.workOrderService.createWorkOrder(data);
      this.rangeService.extendToIncludeDate(new Date(created.data.startDate));
      this.rangeService.extendToIncludeDate(new Date(created.data.endDate));
      this.focusedWorkOrderId.set(created.docId);
    } else {
      const wo = this.selectedWorkOrder();
      if (wo) {
        this.workOrderService.updateWorkOrder(wo.docId, data);
      }
    }
    // Panel closes via requestClose() animation; don't call onPanelClose here
  }
}