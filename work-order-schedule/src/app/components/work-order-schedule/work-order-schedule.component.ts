import { Component, signal, computed, inject } from '@angular/core';
import { WorkOrderService } from '../../services/work-order.service';
import { ZoomLevelService } from '../../services/zoom-level.service';
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
      <app-timeline
        [workCenters]="displayedWorkCenters()"
        [workOrders]="workOrders()"
        [zoomLevel]="zoomService.level()"
        (createRequest)="onCreateRequest($event)"
        (editRequest)="onEditRequest($event)"
        (deleteRequest)="onDeleteRequest($event)"
      />
      <app-work-order-panel
        [visible]="panelVisible()"
        [mode]="panelMode()"
        [workOrder]="selectedWorkOrder()"
        [initialDate]="clickContext()?.date ?? null"
        [workCenterId]="clickContext()?.workCenterId ?? null"
        (close)="onPanelClose()"
        (save)="onPanelSave($event)"
        (delete)="onPanelDelete()"
      />
    </div>
  `,
  styles: [
    `
      .work-order-schedule {
        height: 100%;
        overflow: hidden;
      }
    `,
  ],
})
export class WorkOrderScheduleComponent {
  zoomService = inject(ZoomLevelService);
  workCenters = signal<WorkCenterDocument[]>([]);
  displayedWorkCenters = computed(() => this.workCenters().slice(0, 6));
  workOrders = signal<WorkOrderDocument[]>([]);
  panelVisible = signal(false);
  panelMode = signal<'create' | 'edit'>('create');
  selectedWorkOrder = signal<WorkOrderDocument | null>(null);
  clickContext = signal<{ date: Date; workCenterId: string } | null>(null);

  constructor(private workOrderService: WorkOrderService) {
    this.workOrderService.workCenters.subscribe((c) => this.workCenters.set(c));
    this.workOrderService.workOrders.subscribe((o) => this.workOrders.set(o));
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

  onPanelClose(): void {
    this.panelVisible.set(false);
    this.selectedWorkOrder.set(null);
    this.clickContext.set(null);
  }

  onPanelSave(data: WorkOrderDocument['data']): void {
    if (this.panelMode() === 'create') {
      this.workOrderService.createWorkOrder(data);
    } else {
      const wo = this.selectedWorkOrder();
      if (wo) {
        this.workOrderService.updateWorkOrder(wo.docId, data);
      }
    }
    this.onPanelClose();
  }

  onPanelDelete(): void {
    const wo = this.selectedWorkOrder();
    if (wo) {
      this.workOrderService.deleteWorkOrder(wo.docId);
    }
    this.onPanelClose();
  }
}