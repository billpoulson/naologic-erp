import { Component, input, output, computed, signal, inject } from '@angular/core';
import { TimelineCalculatorService } from '../../services/timeline-calculator.service';
import { TimelinePanService } from '../../services/timeline-pan.service';
import type { WorkCenterDocument } from '../../models/work-center';
import type { WorkOrderDocument } from '../../models/work-order';
import { WorkOrderBarComponent } from './work-order-bar.component';

@Component({
  selector: 'app-timeline-row',
  standalone: true,
  imports: [WorkOrderBarComponent],
  template: `
    <div
      class="timeline-row"
      (click)="onRowClick($event)"
      (mouseenter)="hovered.set(true)"
      (mouseleave)="hovered.set(false)"
      [class.hovered]="hovered()"
    >
      <div
        class="timeline-row-content"
        [style.width.px]="timelineWidth()"
        [style.min-width.px]="timelineWidth()"
      >
        @for (bar of barPositions(); track bar.workOrder.docId) {
          <app-work-order-bar
            [workOrder]="bar.workOrder"
            [left]="bar.left"
            [width]="bar.width"
            (edit)="editRequest.emit($event)"
            (delete)="deleteRequest.emit($event)"
          />
        }
        @if (hovered() && showClickHint()) {
          <div class="click-hint">Click to add dates</div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      @use '../../../styles/variables' as *;

      .timeline-row {
        display: flex;
        min-height: 44px;
        border-bottom: 1px solid $color-border-light;
        cursor: pointer;
      }

      .timeline-row:hover,
      .timeline-row.hovered {
        background: $color-bg-hover;
      }

      .timeline-row-content {
        position: relative;
        flex: 0 0 auto;
        min-height: 44px;
      }

      .click-hint {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
        color: $color-text-secondary;
        pointer-events: none;
      }
    `,
  ],
})
export class TimelineRowComponent {
  workCenter = input.required<WorkCenterDocument>();
  workOrders = input<WorkOrderDocument[]>([]);
  rangeStart = input.required<Date>();
  rangeEnd = input.required<Date>();
  timelineWidth = input.required<number>();

  createRequest = output<{ date: Date; workCenterId: string }>();
  editRequest = output<WorkOrderDocument>();
  deleteRequest = output<WorkOrderDocument>();

  hovered = signal(false);
  showClickHint = signal(true);

  constructor(
    private calculator: TimelineCalculatorService,
    private panService: TimelinePanService
  ) {}

  barPositions = computed(() => {
    const orders = this.workOrders();
    const start = this.rangeStart();
    const end = this.rangeEnd();
    const width = this.timelineWidth();

    if (!start || !end || width <= 0) {
      return orders.map((wo) => ({ workOrder: wo, left: 0, width: 40 }));
    }

    return orders.map((wo) => {
      const woStart = this.calculator.parseLocalDate(wo.data.startDate);
      const woEnd = this.calculator.parseLocalDate(wo.data.endDate);
      const woEndExclusive = new Date(woEnd);
      woEndExclusive.setDate(woEndExclusive.getDate() + 1);
      const unclamped = { clamp: false } as const;
      const left = this.calculator.dateToPosition(woStart, start, end, width, unclamped);
      const right = this.calculator.dateToPosition(woEndExclusive, start, end, width, unclamped);
      const barWidth = Math.max(40, Math.round(right - left));
      return {
        workOrder: wo,
        left: Math.round(left),
        width: barWidth,
      };
    });
  });

  onRowClick(event: MouseEvent): void {
    if (this.panService.consumeAndReset()) return;

    const target = event.currentTarget as HTMLElement;
    const content = target.querySelector('.timeline-row-content') as HTMLElement;
    if (!content) return;

    const rect = content.getBoundingClientRect();
    const x = event.clientX - rect.left + content.scrollLeft;
    const date = this.calculator.positionToDate(
      x,
      this.rangeStart(),
      this.rangeEnd(),
      this.timelineWidth()
    );
    this.createRequest.emit({ date, workCenterId: this.workCenter().docId });
  }
}