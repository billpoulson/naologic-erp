import {
  Component,
  input,
  output,
  computed,
  effect,
  inject,
  HostListener,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { TimelineCalculatorService, type ZoomLevel } from '../../services/timeline-calculator.service';
import { TimelineRangeService } from '../../services/timeline-range.service';
import { TimelinePanService } from '../../services/timeline-pan.service';
import { TimelineAnnotationService } from '../../services/timeline-annotation.service';
import type { WorkCenterDocument } from '../../models/work-center';
import type { WorkOrderDocument } from '../../models/work-order';
import { TimelineHeaderComponent } from './timeline-header.component';
import { TimelineRowComponent } from './timeline-row.component';
import { TimelineAnnotationComponent } from './timeline-annotation.component';
import { TimelineWheelZoomDirective } from '../../directives/timeline-wheel-zoom.directive';
import { TimelineDebugTooltipDirective } from '../../directives/timeline-debug-tooltip.directive';

const SCROLL_EXTEND_THRESHOLD = 150;
const DRAG_THRESHOLD_PX = 5;

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [
    TimelineHeaderComponent,
    TimelineRowComponent,
    TimelineAnnotationComponent,
    TimelineWheelZoomDirective,
    TimelineDebugTooltipDirective,
  ],
  template: `
    <div class="timeline">
      <div class="timeline-grid">
        <div class="timeline-left">
          <div class="timeline-left-header"><span>Work Center</span></div>
          <div class="timeline-annotation-spacer"></div>
          @for (wc of workCenters(); track wc.docId) {
            <div
              class="timeline-left-cell"
              [class.hovered]="hoveredWorkCenterId() === wc.docId"
              (mouseenter)="hoveredWorkCenterId.set(wc.docId)"
              (mouseleave)="hoveredWorkCenterId.set(null)"
            ><span>{{ wc.data.name }}</span></div>
          }
          <div class="timeline-left-filler"></div>
        </div>
        <div
          class="timeline-right"
          #timelineScroll
          appTimelineWheelZoom
          appTimelineDebugTooltip
          [class.dragging]="isDragging"
          (scroll)="onScroll($event)"
          (mousedown)="onMouseDown($event)"
        >
          <div class="timeline-scroll-content" [style.width.px]="timelineWidth()">
            <div class="timeline-scale-grid" [style.width.px]="timelineWidth()">
              @for (pos of scaleBoundaryPositions(); track pos) {
                <div class="scale-boundary" [style.left.px]="pos"></div>
              }
              @if (currentUnitBoundaryPosition() !== null) {
                <div
                  class="scale-boundary-current"
                  [style.left.px]="currentUnitBoundaryPosition()!"
                ></div>
              }
            </div>
            <app-timeline-header
              [labels]="headerLabels()"
              [width]="timelineWidth()"
              [cellWidth]="cellWidth()"
              [todayPosition]="todayPosition()"
            />
            <div class="timeline-annotation-row" [style.width.px]="timelineWidth()">
              <app-timeline-annotation
                [dateRange]="dateRange()"
                [timelineWidth]="timelineWidth()"
                [cellWidth]="cellWidth()"
              />
              @for (pos of scaleBoundaryPositions(); track pos) {
                <div class="scale-boundary" [style.left.px]="pos"></div>
              }
              @if (currentUnitBoundaryPosition() !== null) {
                <div
                  class="scale-boundary-current"
                  [style.left.px]="currentUnitBoundaryPosition()!"
                ></div>
              }
            </div>
            <div class="timeline-rows" [style.width.px]="timelineWidth()">
            @for (wc of workCenters(); track wc.docId) {
              <app-timeline-row
                [workCenter]="wc"
                [isHoveredFromCell]="hoveredWorkCenterId() === wc.docId"
                [workOrders]="getOrdersForCenter(wc.docId)"
                [rangeStart]="dateRange().start"
                [rangeEnd]="dateRange().end"
                [timelineWidth]="timelineWidth()"
                [scrollState]="scrollState()"
                [zoomLevel]="zoomLevel()"
                (createRequest)="createRequest.emit($event)"
                (editRequest)="editRequest.emit($event)"
                (deleteRequest)="deleteRequest.emit($event)"
                (hoverChange)="hoveredWorkCenterId.set($event)"
              />
            }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use '../../../styles/variables' as *;

      .timeline {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .timeline-grid {
        display: flex;
        flex: 1;
        overflow: hidden;
        border-top: 1px solid rgba(230, 235, 240, 1);
        border-left: 1px solid rgba(230, 235, 240, 1);
      }

      .timeline-left {
        width: 380px;
        flex-shrink: 0;
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
      }

      .timeline-left-filler {
        flex: 1;
        min-height: 0;
        background-color: rgba(255, 255, 255, 1);
        border-right: 1px solid rgba(230, 235, 240, 1);
      }

      .timeline-left-header {
        height: 33px;
        min-height: 33px;
        padding: 8px 0 8px 31px;
        background-color: rgba(255, 255, 255, 1);
        display: flex;
        align-items: center;
        justify-content: flex-start;
        font-family: CircularStd-Regular, 'Circular-Std', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: rgba(104, 113, 150, 1);
        text-align: left;
        border-bottom: 1px solid rgba(230, 235, 240, 1);
        border-right: 1px solid rgba(230, 235, 240, 1);
      }

      .timeline-left-header span {
        width: 86px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }

      .timeline-annotation-spacer {
        height: 11px;
        min-height: 11px;
        flex-shrink: 0;
        border-right: 1px solid rgba(230, 235, 240, 1);
      }

      .timeline-left-cell {
        width: 380px;
        height: 48px;
        min-height: 48px;
        padding: 16px 0 16px 31px;
        display: flex;
        align-items: center;
        background-color: rgba(255, 255, 255, 1);
        transition: background-color 0.15s ease;
        border-right: 1px solid rgba(230, 235, 240, 1);
      }

      .timeline-left-cell {
        border-bottom: 1px solid rgba(230, 235, 240, 1);
      }

      .timeline-left-cell:hover,
      .timeline-left-cell.hovered {
        background-color: rgba(247, 249, 252, 1);
      }

      .timeline-left-cell span {
        height: 16px;
        color: rgba(3, 9, 41, 1);
        font-family: CircularStd-Regular, 'Circular-Std', sans-serif;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
      }

      .timeline-scroll-content {
        position: relative;
        min-width: min-content;
        min-height: 100%;
      }

      .timeline-scale-grid {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        min-height: 100vh;
        pointer-events: none;
        z-index: 0;
      }

      .scale-boundary {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background: rgba(230, 235, 240, 1);
      }

      .scale-boundary-current {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 0;
        border-left: 3px solid rgba(212, 215, 255, 1);
        z-index: 1;
      }

      .timeline-right {
        flex: 1;
        min-width: 0;
        position: relative;
        z-index: 2;
        overflow-x: auto;
        overflow-y: auto;
        background-color: rgba(247, 249, 252, 1);
        cursor: grab;
        scrollbar-width: none;
        -ms-overflow-style: none;

        &::-webkit-scrollbar {
          display: none;
        }

        &.dragging {
          cursor: grabbing;
          user-select: none;
        }
      }

      .timeline-annotation-row {
        height: 11px;
        min-height: 11px;
        flex-shrink: 0;
        position: relative;
        overflow: visible;
        background-color: rgba(247, 249, 252, 1);
      }

      .timeline-rows {
        min-width: min-content;
      }
    `,
  ],
})
export class TimelineComponent implements AfterViewInit, OnDestroy {
  workCenters = input.required<WorkCenterDocument[]>();
  workOrders = input.required<WorkOrderDocument[]>();
  zoomLevel = input<ZoomLevel>('month');

  createRequest = output<{ date: Date; workCenterId: string }>();
  editRequest = output<WorkOrderDocument>();
  deleteRequest = output<WorkOrderDocument>();

  dateRange = computed(() => {
    const range = this.rangeService.dateRange();
    if (range) return range;
    return this.calculator.getSlidingWindowRange(this.zoomLevel());
  });
  headerLabels = computed(() =>
    this.calculator.getHeaderLabels(this.dateRange(), this.zoomLevel())
  );
  timelineWidth = computed(() =>
    this.calculator.getTimelineWidth(this.dateRange(), this.zoomLevel())
  );
  cellWidth = computed(() =>
    this.calculator.getColumnWidth(this.zoomLevel())
  );
  todayPosition = computed(() =>
    this.calculator.getTodayPosition(
      this.dateRange(),
      this.timelineWidth()
    )
  );
  scaleBoundaryPositions = computed(() => {
    const labels = this.headerLabels();
    const cw = this.cellWidth();
    const positions: number[] = [];
    for (let i = 0; i < labels.length; i++) {
      positions.push(i * cw);
    }
    return positions;
  });

  currentUnitBoundaryPosition = computed<number | null>(() => {
    const range = this.dateRange();
    const width = this.timelineWidth();
    const zoom = this.zoomLevel();
    const cw = this.cellWidth();
    if (!range || width <= 0) return null;

    const unit = this.annotationService.getCurrentUnitRange(zoom);

    if (zoom === 'month' && cw > 0) {
      const columnIndex = this.annotationService.getMonthColumnIndex(
        unit.start,
        range.start
      );
      const pos = columnIndex * cw;
      if (pos < 0 || pos > width) return null;
      return pos;
    }

    const pos = this.calculator.dateToPosition(
      unit.start,
      range.start,
      range.end,
      width,
      { clamp: false }
    );
    if (pos < 0 || pos > width) return null;
    return Math.round(pos);
  });

  @ViewChild('timelineScroll') scrollContainerRef?: ElementRef<HTMLElement>;

  protected hoveredWorkCenterId = signal<string | null>(null);
  /** Scroll state for off-screen bar detection: { scrollLeft, viewportWidth } */
  scrollState = signal<{ scrollLeft: number; viewportWidth: number }>({
    scrollLeft: 0,
    viewportWidth: 0,
  });
  private extendingBackward = false;
  private extendingForward = false;
  private dragStartX: number | null = null;
  private dragStartScrollLeft: number | null = null;
  private scrollContainer: HTMLElement | null = null;
  protected isDragging = false;
  private initialScrollSet = false;

  private readonly panService = inject(TimelinePanService);

  private readonly zone = inject(NgZone);

  constructor(
    private calculator: TimelineCalculatorService,
    private rangeService: TimelineRangeService,
    private annotationService: TimelineAnnotationService
  ) {
    this.rangeService.initialize(this.zoomLevel());
    effect(() => {
      const zoom = this.zoomLevel();
      this.rangeService.initialize(zoom);
    });
    effect(() => {
      const zoom = this.zoomLevel();
      if (zoom !== 'day' && zoom !== 'hours') return;
      setTimeout(() => this.scrollToShowNow(), 0);
    });
  }

  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.updateViewportAndRange();
    this.scheduleInitialScroll();
    const zoom = this.zoomLevel();
    if (zoom === 'day' || zoom === 'hours') {
      setTimeout(() => this.scrollToShowNow(), 0);
    }
    this.observeViewportResize();
    // Delayed re-check: layout may not be ready on first paint (fonts, tab visibility, etc.)
    setTimeout(() => this.updateViewportAndRange(), 100);
  }

  private hasInitializedWithViewport = false;

  private updateViewportAndRange(): void {
    const scrollEl = this.scrollContainerRef?.nativeElement;
    if (!scrollEl) return;
    const viewportWidth = scrollEl.clientWidth;
    this.scrollState.set({
      scrollLeft: scrollEl.scrollLeft,
      viewportWidth,
    });
    if (viewportWidth > 0) {
      this.rangeService.setViewportWidth(viewportWidth);
      if (!this.hasInitializedWithViewport) {
        this.hasInitializedWithViewport = true;
        this.rangeService.initialize(this.zoomLevel());
      }
    }
  }

  private observeViewportResize(): void {
    const scrollEl = this.scrollContainerRef?.nativeElement;
    if (!scrollEl || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() =>
      this.zone.run(() => this.updateViewportAndRange())
    );
    this.resizeObserver.observe(scrollEl);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private scheduleInitialScroll(): void {
    const setScroll = (): void => {
      if (this.initialScrollSet) return;
      if (this.zoomLevel() !== 'month') return;
      const range = this.dateRange();
      const width = this.timelineWidth();
      if (!range || width <= 0) return;

      const scrollEl = this.scrollContainerRef?.nativeElement;
      if (!scrollEl || scrollEl.scrollWidth <= 0) return;

      const now = new Date();
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const targetScroll = this.calculator.dateToPosition(
        prevMonthStart,
        range.start,
        range.end,
        width,
        { clamp: false }
      );
      scrollEl.scrollLeft = Math.max(0, Math.min(targetScroll, scrollEl.scrollWidth - scrollEl.clientWidth));
      this.initialScrollSet = true;
    };

    const tryScroll = (attempt = 0): void => {
      if (attempt >= 20) return;
      setScroll();
      if (!this.initialScrollSet) {
        setTimeout(() => tryScroll(attempt + 1), 100);
      }
    };

    // ViewChild is ready; defer to allow layout and override browser scroll restoration
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => tryScroll(), 0);
      });
    });
  }

  /** Scroll so current time (now) is centered in view when in day or hour mode. */
  private scrollToShowNow(): void {
    const scrollEl = this.scrollContainerRef?.nativeElement;
    const range = this.dateRange();
    const width = this.timelineWidth();
    if (!scrollEl || !range || width <= 0 || scrollEl.scrollWidth <= 0) return;

    const now = new Date();
    const nowPosition = this.calculator.dateToPosition(
      now,
      range.start,
      range.end,
      width,
      { clamp: false }
    );
    const targetScroll = nowPosition - scrollEl.clientWidth / 2;
    scrollEl.scrollLeft = Math.max(
      0,
      Math.min(targetScroll, scrollEl.scrollWidth - scrollEl.clientWidth)
    );
  }

  onMouseDown(event: MouseEvent): void {
    this.scrollContainer = event.currentTarget as HTMLElement;
    this.dragStartX = event.clientX;
    this.dragStartScrollLeft = this.scrollContainer.scrollLeft;
    this.isDragging = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    if (this.dragStartX === null || !this.scrollContainer) return;
    const dx = event.clientX - this.dragStartX;
    if (!this.isDragging && Math.abs(dx) > DRAG_THRESHOLD_PX) {
      this.isDragging = true;
      this.panService.setPanningOccurred();
    }
    if (this.isDragging && this.scrollContainer) {
      this.scrollContainer.scrollLeft = (this.dragStartScrollLeft ?? 0) - dx;
      this.scrollState.set({
        scrollLeft: this.scrollContainer.scrollLeft,
        viewportWidth: this.scrollContainer.clientWidth,
      });
      this.checkExtendAtEdges(this.scrollContainer, event);
    }
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    this.dragStartX = null;
    this.dragStartScrollLeft = null;
    this.scrollContainer = null;
    this.isDragging = false;
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el) return;
    this.scrollState.set({
      scrollLeft: el.scrollLeft,
      viewportWidth: el.clientWidth,
    });
    if (this.extendingBackward || this.extendingForward) return;
    if (this.dragStartX !== null) return;

    this.checkExtendAtEdges(el);
  }

  private checkExtendAtEdges(el: HTMLElement, dragEvent?: MouseEvent): void {
    if (this.extendingBackward || this.extendingForward) return;

    const { scrollLeft, clientWidth, scrollWidth } = el;
    const zoom = this.zoomLevel();
    const range = this.dateRange();
    const width = this.timelineWidth();
    if (!range || width <= 0) return;

    if (scrollLeft < SCROLL_EXTEND_THRESHOLD) {
      this.extendingBackward = true;
      const visibleStartDate = this.calculator.positionToDate(
        scrollLeft,
        range.start,
        range.end,
        width
      );
      this.rangeService.extendBackward(zoom);
      setTimeout(() => {
        const newRange = this.dateRange();
        const newWidth = this.timelineWidth();
        if (newRange && newWidth > 0) {
          const targetScroll = this.calculator.dateToPosition(
            visibleStartDate,
            newRange.start,
            newRange.end,
            newWidth,
            { clamp: false }
          );
          el.scrollLeft = Math.max(0, targetScroll);
          if (this.dragStartScrollLeft !== null) {
            this.dragStartScrollLeft = Math.max(0, targetScroll);
          }
          if (dragEvent) {
            this.dragStartX = dragEvent.clientX;
          }
        }
        this.extendingBackward = false;
      }, 0);
    } else if (scrollLeft + clientWidth > scrollWidth - SCROLL_EXTEND_THRESHOLD) {
      this.extendingForward = true;
      this.extendForwardIteration = 0;
      const visibleEndDate = this.calculator.positionToDate(
        scrollLeft + clientWidth,
        range.start,
        range.end,
        width
      );
      this.rangeService.extendForward(zoom);
      this.scheduleExtendForwardCallback(el, visibleEndDate, dragEvent);
    }
  }

  private static readonly MAX_EXTEND_FORWARD_ITERATIONS = 10;
  private extendForwardIteration = 0;

  private scheduleExtendForwardCallback(
    el: HTMLElement,
    visibleEndDate: Date,
    dragEvent?: MouseEvent
  ): void {
    setTimeout(() => {
      const newRange = this.dateRange();
      const newWidth = this.timelineWidth();
      if (newRange && newWidth > 0) {
        const targetScroll =
          this.calculator.dateToPosition(
            visibleEndDate,
            newRange.start,
            newRange.end,
            newWidth,
            { clamp: false }
          ) - el.clientWidth;
        el.scrollLeft = Math.max(
          0,
          Math.min(targetScroll, el.scrollWidth - el.clientWidth)
        );
        if (dragEvent) {
          this.dragStartX = dragEvent.clientX;
          this.dragStartScrollLeft = el.scrollLeft;
        }
      }
      const { scrollLeft, clientWidth, scrollWidth } = el;
      const stillAtEdge =
        scrollLeft + clientWidth > scrollWidth - SCROLL_EXTEND_THRESHOLD;
      const canExtendMore =
        this.extendForwardIteration < TimelineComponent.MAX_EXTEND_FORWARD_ITERATIONS;

      if (stillAtEdge && canExtendMore && this.rangeService.dateRange()) {
        this.extendForwardIteration++;
        const range = this.dateRange()!;
        const width = this.timelineWidth();
        const visibleEnd = this.calculator.positionToDate(
          scrollLeft + clientWidth,
          range.start,
          range.end,
          width
        );
        this.rangeService.extendForward(this.zoomLevel());
        this.scheduleExtendForwardCallback(el, visibleEnd, dragEvent);
      } else {
        this.extendForwardIteration = 0;
        this.extendingForward = false;
      }
    }, 0);
  }

  getOrdersForCenter(workCenterId: string): WorkOrderDocument[] {
    const range = this.dateRange();
    if (!range) {
      return this.workOrders().filter((wo) => wo.data.workCenterId === workCenterId);
    }
    const rangeStartMs = range.start.getTime();
    const rangeEndMs = range.end.getTime();
    return this.workOrders().filter((wo) => {
      if (wo.data.workCenterId !== workCenterId) return false;
      const woStart = this.calculator.parseLocalDate(wo.data.startDate).getTime();
      const woEnd = this.calculator.parseLocalDate(wo.data.endDate).getTime();
      return woStart < rangeEndMs && woEnd > rangeStartMs;
    });
  }

}