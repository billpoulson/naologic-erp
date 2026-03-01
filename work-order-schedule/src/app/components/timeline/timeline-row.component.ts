import { Component, input, output, computed, signal, inject } from '@angular/core';
import {
  TimelineCalculatorService,
  type ZoomLevel,
} from '../../services/timeline-calculator.service';
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
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
      (mousemove)="onMouseMove($event)"
      [class.hovered]="hovered() || isHoveredFromCell()"
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
            [continuesLeft]="bar.continuesLeft"
            [continuesRight]="bar.continuesRight"
            (edit)="editRequest.emit($event)"
            (delete)="deleteRequest.emit($event)"
          />
        }
        @if ((hovered() || isHoveredFromCell()) && showClickHint()) {
          <div
            class="click-hint-bar"
            [style.left.px]="clickHintLeft()"
            [style.width.px]="clickHintWidth"
          >
            <span class="click-hint-tooltip">Click to add dates</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      @use '../../../styles/variables' as *;

      .timeline-row {
        display: flex;
        height: 48px;
        min-height: 48px;
        cursor: pointer;
        background-color: rgba(247, 249, 252, 1);
        transition: background-color 0.15s ease;
      }

      .timeline-row:hover,
      .timeline-row.hovered {
        background-color: rgba(238, 240, 255, 1);
      }

      .timeline-row-content {
        position: relative;
        flex: 0 0 auto;
        min-height: 48px;
        margin: 0;
        padding: 0;
        overflow: visible;
      }

      .click-hint-bar {
        position: absolute;
        top: 4px;
        bottom: 4px;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        box-shadow: 0 0 0 1px rgba(222, 224, 255, 1);
        border-radius: 8px;
        background-color: rgba(237, 238, 255, 1);
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .click-hint-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: 4px;
        padding: 4px 8px;
        font-size: 12px;
        color: $color-text-secondary;
        background: $color-bg-primary;
        border: 1px solid $color-border;
        border-radius: $radius-default;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class TimelineRowComponent {
  workCenter = input.required<WorkCenterDocument>();
  isHoveredFromCell = input<boolean>(false);
  workOrders = input<WorkOrderDocument[]>([]);
  rangeStart = input.required<Date>();
  rangeEnd = input.required<Date>();
  timelineWidth = input.required<number>();
  zoomLevel = input<ZoomLevel>('month');

  createRequest = output<{ date: Date; workCenterId: string }>();
  editRequest = output<WorkOrderDocument>();
  deleteRequest = output<WorkOrderDocument>();
  hoverChange = output<string | null>();

  hovered = signal(false);
  hoverX = signal<number | null>(null);
  readonly clickHintWidth = 113;

  showClickHint = computed(() => {
    const x = this.hoverX();
    if (x === null) return false;
    return !this.isPositionOverWorkOrder(x);
  });

  clickHintLeft = computed(() => {
    const x = this.hoverX();
    const width = this.timelineWidth();
    const bars = this.barPositions();
    if (x === null) return 0;

    let left = x - this.clickHintWidth / 2;
    left = Math.max(0, Math.min(width - this.clickHintWidth, left));

    for (const bar of bars) {
      const barRight = bar.left + bar.width;
      if (barRight <= x) {
        left = Math.max(left, barRight);
      }
      if (bar.left >= x) {
        left = Math.min(left, bar.left - this.clickHintWidth);
      }
    }

    return Math.max(0, Math.min(width - this.clickHintWidth, left));
  });

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
      return orders.map((wo) => ({
        workOrder: wo,
        left: 0,
        width: 40,
        continuesLeft: false,
        continuesRight: false,
      }));
    }

    return orders.map((wo) => {
      const woStart = this.calculator.parseLocalDate(wo.data.startDate);
      const woEnd = this.calculator.parseLocalDate(wo.data.endDate);
      const woEndExclusive = new Date(woEnd);
      woEndExclusive.setDate(woEndExclusive.getDate() + 1);
      const unclamped = { clamp: false } as const;
      const left = this.calculator.dateToPosition(woStart, start, end, width, unclamped);
      const right = this.calculator.dateToPosition(woEndExclusive, start, end, width, unclamped);
      const visibleLeft = Math.max(0, left);
      const visibleRight = Math.min(width, right);
      const barWidth = Math.max(40, Math.round(visibleRight - visibleLeft));
      return {
        workOrder: wo,
        left: Math.round(visibleLeft),
        width: barWidth,
        continuesLeft: left < 0,
        continuesRight: right > width,
      };
    });
  });

  onMouseEnter(): void {
    this.hovered.set(true);
    this.hoverChange.emit(this.workCenter().docId);
  }

  onMouseLeave(): void {
    this.hovered.set(false);
    this.hoverX.set(null);
    this.hoverChange.emit(null);
  }

  onMouseMove(event: MouseEvent): void {
    const row = event.currentTarget as HTMLElement;
    const content = row.querySelector('.timeline-row-content') as HTMLElement;
    if (!content) return;
    const rect = content.getBoundingClientRect();
    const x = event.clientX - rect.left;
    this.hoverX.set(x);
  }

  private isPositionOverWorkOrder(x: number): boolean {
    const bars = this.barPositions();
    return bars.some((bar) => x >= bar.left && x <= bar.left + bar.width);
  }

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