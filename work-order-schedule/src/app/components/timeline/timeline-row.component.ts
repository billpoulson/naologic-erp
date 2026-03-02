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
        @for (pos of scaleBoundaryPositions(); track pos) {
          <div class="scale-boundary" [style.left.px]="pos"></div>
        }
        @if (todayPosition() >= 0) {
          <div
            class="timeline-row-today"
            [style.left.px]="todayPosition()"
          ></div>
        }
        @for (bar of barPositions(); track bar.workOrder.docId) {
          <app-work-order-bar
            [workOrder]="bar.workOrder"
            [focused]="focusedWorkOrderId() === bar.workOrder.docId"
            [left]="bar.left"
            [width]="bar.width"
            [continuesLeft]="bar.continuesLeft"
            [continuesRight]="bar.continuesRight"
            (edit)="editRequest.emit($event)"
            (delete)="deleteRequest.emit($event)"
            (focusRequest)="focusRequest.emit($event)"
          />
        }
        @if ((hovered() || isHoveredFromCell()) && showClickHint()) {
          <div
            class="click-hint-bar"
            [style.left.px]="clickHintLeft()"
            [style.width.px]="clickHintWidth"
            aria-hidden="true"
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
        cursor: grab;
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

      .scale-boundary {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background: rgba(230, 235, 240, 1);
        z-index: 0;
        pointer-events: none;
      }

      .timeline-row-today {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 0;
        border-left: 3px solid rgba(212, 215, 255, 1);
        z-index: 0;
        pointer-events: none;
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
        color: rgba(249, 250, 255, 1);
        font-family: CircularStd-Book;
        font-size: 14px;
        font-weight: 400;
        font-style: normal;
        background-color: rgba(104, 113, 150, 1);
        border-radius: 8px;
        white-space: nowrap;
        box-shadow: 0 2px 4px -2px rgba(200, 207, 233, 1), 0 0 16px -8px rgba(230, 235, 240, 1);
      }

      .timeline-row-offscreen-labels {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        pointer-events: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 2;
      }

      .timeline-row-offscreen-label {
        position: sticky;
        top: 0;
        height: 40px;
        margin: 4px;
        padding: 0 8px;
        display: flex;
        align-items: center;
        font-family: CircularStd-Book;
        font-size: 14px;
        font-weight: 400;
        font-style: normal;
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: opacity 0.15s ease;
      }

      .timeline-row-offscreen-label.status-open {
        color: $color-status-open;
      }

      .timeline-row-offscreen-label.status-in-progress {
        color: $color-status-in-progress;
      }

      .timeline-row-offscreen-label.status-complete {
        color: $color-status-complete;
      }

      .timeline-row-offscreen-label.status-blocked {
        color: $color-status-blocked;
      }

      .timeline-row-offscreen-label-left {
        left: 0;
      }

      .timeline-row-offscreen-label-right {
        right: 0;
        margin-left: auto;
      }
    `,
  ],
})
export class TimelineRowComponent {
  workCenter = input.required<WorkCenterDocument>();
  focusedWorkOrderId = input<string | null>(null);
  isHoveredFromCell = input<boolean>(false);
  workOrders = input<WorkOrderDocument[]>([]);
  rangeStart = input.required<Date>();
  rangeEnd = input.required<Date>();
  timelineWidth = input.required<number>();
  todayPosition = input<number>(-1);
  scaleBoundaryPositions = input<number[]>([]);
  scrollState = input<{ scrollLeft: number; viewportWidth: number }>({
    scrollLeft: 0,
    viewportWidth: 0,
  });
  zoomLevel = input<ZoomLevel>('month');

  createRequest = output<{ date: Date; workCenterId: string }>();
  editRequest = output<WorkOrderDocument>();
  deleteRequest = output<WorkOrderDocument>();
  focusRequest = output<WorkOrderDocument>();
  hoverChange = output<string | null>();

  hovered = signal(false);
  hoverX = signal<number | null>(null);
  readonly clickHintWidth = 113;
  /** Min pixels the bar must be off-screen before showing the label (avoids overlap) */
  private readonly offScreenLabelMinGap = 60;
  /** Pixels of scroll distance over which the off-screen label fades out */
  private readonly offScreenLabelFadeZone = 120;

  showClickHint = computed(() => {
    const x = this.hoverX();
    if (x === null) return false;
    return !this.isPositionOverWorkOrder(x);
  });

  /** Work order for bar whose name is off-screen to the left (closest to visible area) */
  offScreenLeftLabel = computed(() => {
    const { scrollLeft, viewportWidth } = this.scrollState();
    const bars = this.barPositions();
    if (viewportWidth <= 0) return null;
    const nameOffScreenLeft = bars.filter((b) => b.left < scrollLeft);
    const closest = nameOffScreenLeft.length > 0
      ? nameOffScreenLeft.reduce((a, b) => (b.left + b.width > a.left + a.width ? b : a))
      : null;
    if (!closest) return null;
    const distanceFromVisible = scrollLeft - closest.left;
    const opacity = Math.min(
      1,
      Math.max(0, (distanceFromVisible - this.offScreenLabelMinGap) / this.offScreenLabelFadeZone)
    );
    return {
      name: closest.workOrder.data.name,
      status: closest.workOrder.data.status,
      opacity,
    };
  });

  /** Work order for bar whose name is off-screen to the right (closest to visible area) */
  offScreenRightLabel = computed(() => {
    const { scrollLeft, viewportWidth } = this.scrollState();
    const bars = this.barPositions();
    if (viewportWidth <= 0) return null;
    const viewportRight = scrollLeft + viewportWidth;
    const barLeftMin = viewportRight + this.offScreenLabelMinGap;
    const nameOffScreenRight = bars.filter((b) => b.left >= barLeftMin);
    const closest = nameOffScreenRight.length > 0
      ? nameOffScreenRight.reduce((a, b) => (b.left < a.left ? b : a))
      : null;
    if (!closest) return null;
    const distanceFromVisible = closest.left - viewportRight;
    const opacity = Math.min(
      1,
      Math.max(0, (distanceFromVisible - this.offScreenLabelMinGap) / this.offScreenLabelFadeZone)
    );
    return {
      name: closest.workOrder.data.name,
      status: closest.workOrder.data.status,
      opacity,
    };
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
      const gapInset = 4;
      const minBarWidth = 32;
      return {
        workOrder: wo,
        left: Math.round(visibleLeft) + gapInset,
        width: Math.max(minBarWidth, barWidth - 2 * gapInset),
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
    const { scrollLeft } = this.scrollState();
    const x = event.clientX - rect.left + scrollLeft;
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
    const { scrollLeft } = this.scrollState();
    const x = event.clientX - rect.left + scrollLeft;
    const date = this.calculator.positionToDate(
      x,
      this.rangeStart(),
      this.rangeEnd(),
      this.timelineWidth()
    );
    this.createRequest.emit({ date, workCenterId: this.workCenter().docId });
  }
}