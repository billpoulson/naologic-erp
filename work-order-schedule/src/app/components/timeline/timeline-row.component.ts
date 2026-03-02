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
  styleUrls: ['./timeline-row.component.scss'],
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