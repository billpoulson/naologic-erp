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
import { CommonModule } from '@angular/common';
import { TimelineCalculatorService, type ZoomLevel } from '../../services/timeline-calculator.service';
import { TimelineRangeService } from '../../services/timeline-range.service';
import { TimelinePanService } from '../../services/timeline-pan.service';
import { TimelineAnnotationService } from '../../services/timeline-annotation.service';
import type { WorkCenterDocument } from '../../models/work-center';
import type { WorkOrderDocument } from '../../models/work-order';
import { TimelineHeaderComponent } from './timeline-header.component';
import { TimelineRowComponent } from './timeline-row.component';
import { TimelineAnnotationComponent } from './timeline-annotation.component';
import { FormsModule } from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { TimelineWheelZoomDirective } from '../../directives/timeline-wheel-zoom.directive';
import { TimelineDebugTooltipDirective } from '../../directives/timeline-debug-tooltip.directive';

const SCROLL_EXTEND_THRESHOLD = 150;
const DRAG_THRESHOLD_PX = 5;
/** Max work centers to render at a time (sliding window) */
const MAX_WORK_CENTERS = 50;
/** Row height in px */
const ROW_HEIGHT_PX = 48;
/** Header height in px (work center header + annotation spacer) */
const HEADER_HEIGHT_PX = 44;

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [
    CommonModule,
    TimelineHeaderComponent,
    TimelineRowComponent,
    TimelineAnnotationComponent,
    FormsModule,
    NgbDatepickerModule,
    TimelineWheelZoomDirective,
    TimelineDebugTooltipDirective,
  ],
  template: `
    <div class="timeline">
      <div class="timeline-grid">
        <div
          class="timeline-scroll"
          #timelineScroll
          tabindex="0"
          role="region"
          aria-label="Work order timeline. Use arrow keys to navigate between work orders."
          appTimelineWheelZoom
          appTimelineDebugTooltip
          [class.dragging]="isPressed || isDragging"
          (scroll)="onScroll($event)"
          (mousedown)="onMouseDown($event)"
          (keydown)="onKeydown($event)"
        >
          <div
            class="timeline-content"
            [style.min-width.px]="380 + timelineWidth()"
            [style.min-height.px]="HEADER_HEIGHT_PX + (filteredWorkCenters().length + (loading() ? 1 : 0)) * ROW_HEIGHT_PX"
          >
            <div class="timeline-scale-grid" [style.width.px]="timelineWidth()" [style.left.px]="380">
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
            <div class="timeline-header-row">
              <div class="timeline-left-header-wrapper">
                <div class="timeline-left-header">
                  <span>Work Center</span>
                  <button
                    #filterBtn
                    type="button"
                    class="timeline-filter-btn"
                    [class.active]="filterOpen()"
                    [attr.aria-expanded]="filterOpen()"
                    [attr.aria-haspopup]="'dialog'"
                    aria-label="Filter work centers"
                    (click)="toggleFilter()"
                    title="Filter work centers"
                  >
                    <span aria-hidden="true">⋯</span>
                  </button>
                  @if (filterOpen()) {
                    <div
                      class="filter-dropdown-backdrop"
                      (click)="filterOpen.set(false)"
                    ></div>
                    <div
                      class="filter-dropdown"
                      [style.top.px]="filterDropdownTop()"
                      [style.left.px]="filterDropdownLeft()"
                    >
                      <div class="filter-dropdown-row">
                        <label class="filter-date-label">Name</label>
                        <input
                          type="text"
                          class="timeline-filter-input"
                          placeholder="Filter by name..."
                          aria-label="Filter work centers by name"
                          [ngModel]="filterQuery()"
                          (ngModelChange)="filterQuery.set($event)"
                          (click)="$event.stopPropagation()"
                        />
                        <button
                          type="button"
                          class="filter-clear-btn"
                          [class.visible]="filterQuery().length > 0"
                          aria-label="Clear name filter"
                          (click)="filterQuery.set(''); $event.stopPropagation()"
                          title="Clear name filter"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                      <div class="filter-dropdown-row filter-date-row">
                        <label class="filter-date-label">Date range</label>
                        <div class="filter-date-inputs">
                          <input
                            class="timeline-filter-input filter-date-input"
                            placeholder="Start"
                            ngbDatepicker
                            #dpStart="ngbDatepicker"
                            (click)="dpStart.toggle(); $event.stopPropagation()"
                            [ngModel]="filterStartDate()"
                            (ngModelChange)="filterStartDate.set($event)"
                            aria-label="Filter start date"
                          />
                          <span class="filter-date-sep">–</span>
                          <input
                            class="timeline-filter-input filter-date-input"
                            placeholder="End"
                            ngbDatepicker
                            #dpEnd="ngbDatepicker"
                            (click)="dpEnd.toggle(); $event.stopPropagation()"
                            [ngModel]="filterEndDate()"
                            (ngModelChange)="filterEndDate.set($event)"
                            aria-label="Filter end date"
                          />
                        </div>
                        <button
                          type="button"
                          class="filter-clear-btn"
                          [class.visible]="hasDateFilter()"
                          aria-label="Clear date filter"
                          (click)="clearDateFilter(); $event.stopPropagation()"
                          title="Clear date filter"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    </div>
                  }
                </div>
                <div class="timeline-left-annotation-spacer"></div>
              </div>
              <div class="timeline-right-header" [style.width.px]="timelineWidth()">
                <app-timeline-header
                  [labels]="headerLabels()"
                  [width]="timelineWidth()"
                  [cellWidth]="cellWidth()"
                />
                <div class="timeline-annotation-row">
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
              </div>
            </div>
            <div
              class="timeline-rows-container"
              [style.height.px]="(filteredWorkCenters().length + (loading() ? 1 : 0)) * ROW_HEIGHT_PX"
            >
              @for (item of visibleWorkCenters(); track item.workCenter.docId) {
                <div
                  class="timeline-body-row"
                  [class.timeline-body-row-last]="item.rowIndex === filteredWorkCenters().length - 1"
                  [style.top.px]="item.rowIndex * ROW_HEIGHT_PX"
                >
                  <div
                    class="timeline-left-cell"
                    [class.hovered]="hoveredWorkCenterId() === item.workCenter.docId"
                    (mouseenter)="hoveredWorkCenterId.set(item.workCenter.docId)"
                    (mouseleave)="hoveredWorkCenterId.set(null)"
                  ><span>{{ item.workCenter.data.name }}</span></div>
                  <div class="timeline-right-cell" [style.width.px]="timelineWidth()">
                    <app-timeline-row
                      [workCenter]="item.workCenter"
                      [focusedWorkOrderId]="focusedWorkOrderId()"
                      [isHoveredFromCell]="hoveredWorkCenterId() === item.workCenter.docId"
                      [workOrders]="getOrdersForCenter(item.workCenter.docId)"
                      [rangeStart]="dateRange().start"
                      [rangeEnd]="dateRange().end"
                      [timelineWidth]="timelineWidth()"
                      [todayPosition]="todayPosition()"
                      [scaleBoundaryPositions]="scaleBoundaryPositions()"
                      [scrollState]="scrollState()"
                      [zoomLevel]="zoomLevel()"
                      (createRequest)="createRequest.emit($event)"
                      (editRequest)="editRequest.emit($event)"
                      (deleteRequest)="deleteRequest.emit($event)"
                      (focusRequest)="onBarFocus($event)"
                      (hoverChange)="hoveredWorkCenterId.set($event)"
                    />
                  </div>
                </div>
              }
              @if (loading()) {
                <div
                  class="timeline-loading-row"
                  [style.top.px]="filteredWorkCenters().length * ROW_HEIGHT_PX"
                >
                  <div class="timeline-loading-cell">
                    <span class="timeline-loading-spinner"></span>
                    <span class="timeline-loading-text">Loading...</span>
                  </div>
                  <div class="timeline-loading-right" [style.width.px]="timelineWidth()"></div>
                </div>
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

      .timeline-scroll {
        flex: 1;
        min-width: 0;
        overflow: auto;
        position: relative;
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

          .timeline-row,
          .work-order-bar {
            cursor: grabbing;
          }
        }
      }

      .timeline-content {
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .timeline-scale-grid {
        position: absolute;
        top: 0;
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

      .timeline-header-row {
        display: flex;
        flex-shrink: 0;
        position: sticky;
        top: 0;
        z-index: 10;
        background-color: rgba(255, 255, 255, 1);
      }

      .timeline-left-header-wrapper {
        width: 380px;
        min-width: 380px;
        flex-shrink: 0;
        position: sticky;
        left: 0;
        z-index: 11;
        display: flex;
        flex-direction: column;
      }

      .timeline-left-header {
        flex-shrink: 0;
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

      .timeline-left-header {
        gap: 8px;
      }

      .timeline-left-header span {
        width: 86px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }

      .timeline-filter-btn {
        margin-left: auto;
        margin-right: 12px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        font-size: 16px;
        line-height: 1;
        color: rgba(104, 113, 150, 0.7);
        border-radius: 4px;
      }

      .timeline-filter-btn:hover,
      .timeline-filter-btn.active {
        color: rgba(104, 113, 150, 1);
        background: rgba(230, 235, 240, 0.5);
      }

      .filter-dropdown-backdrop {
        position: fixed;
        inset: 0;
        z-index: 999;
      }

      .filter-dropdown {
        position: fixed;
        z-index: 1000;
        padding: 6px;
        min-width: 280px;
        background: rgba(255, 255, 255, 1);
        border: 1px solid rgba(230, 235, 240, 1);
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }

      .filter-dropdown-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .filter-date-row {
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid rgba(230, 235, 240, 1);
      }

      .filter-date-label {
        flex-shrink: 0;
        width: 58px;
        font-size: 11px;
        color: rgba(104, 113, 150, 1);
      }

      .filter-date-inputs {
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 1;
        min-width: 0;
      }

      .filter-date-input {
        flex: 1;
        min-width: 78px;
      }

      .filter-date-sep {
        flex-shrink: 0;
        color: rgba(104, 113, 150, 0.7);
        font-size: 11px;
      }

      .filter-clear-btn {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        padding: 0;
        border: none;
        background: rgba(230, 235, 240, 0.5);
        color: rgba(104, 113, 150, 0.6);
        border-radius: 4px;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
      }

      .filter-clear-btn.visible {
        opacity: 1;
        pointer-events: auto;
      }

      .filter-clear-btn:hover {
        background: rgba(230, 235, 240, 1);
        color: rgba(104, 113, 150, 1);
      }

      .timeline-filter-input {
        flex: 1;
        min-width: 0;
        padding: 5px 8px;
        font-size: 12px;
        border: 1px solid rgba(230, 235, 240, 1);
        border-radius: 6px;
        font-family: inherit;
      }

      .timeline-filter-input:focus {
        outline: none;
        border-color: rgba(104, 113, 150, 0.5);
      }

      .timeline-filter-input::placeholder {
        color: rgba(104, 113, 150, 0.5);
      }

      .timeline-left-annotation-spacer {
        height: 11px;
        min-height: 11px;
        flex-shrink: 0;
        background-color: rgba(255, 255, 255, 1);
        border-right: 1px solid rgba(230, 235, 240, 1);
      }

      .timeline-right-header {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        background-color: rgba(255, 255, 255, 1);
      }

      .timeline-annotation-row {
        height: 11px;
        min-height: 11px;
        flex-shrink: 0;
        position: relative;
        overflow: visible;
        background-color: rgba(247, 249, 252, 1);
      }

      .timeline-rows-container {
        position: relative;
        flex-shrink: 0;
      }

      .timeline-body-row {
        position: absolute;
        left: 0;
        right: 0;
        display: flex;
        flex-shrink: 0;
        height: 48px;
      }

      .timeline-body-row-last {
        margin-bottom: 48px;
      }

      .timeline-loading-row {
        position: absolute;
        left: 0;
        right: 0;
        display: flex;
        height: 48px;
        min-height: 48px;
        background-color: rgba(247, 249, 252, 1);
        border-bottom: 1px solid rgba(230, 235, 240, 1);
      }

      .timeline-loading-cell {
        width: 380px;
        min-width: 380px;
        flex-shrink: 0;
        padding: 0 31px;
        display: flex;
        align-items: center;
        gap: 10px;
        background-color: rgba(255, 255, 255, 1);
        border-right: 1px solid rgba(230, 235, 240, 1);
        color: rgba(104, 113, 150, 1);
        font-family: CircularStd-Regular, 'Circular-Std', sans-serif;
        font-size: 14px;
      }

      .timeline-loading-spinner {
        display: inline-block;
        width: 18px;
        height: 18px;
        border: 2px solid rgba(230, 235, 240, 1);
        border-top-color: rgba(104, 113, 150, 0.6);
        border-radius: 50%;
        animation: timeline-spin 0.7s linear infinite;
      }

      @keyframes timeline-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .timeline-loading-text {
        opacity: 0.85;
      }

      .timeline-loading-right {
        flex-shrink: 0;
        background-color: rgba(247, 249, 252, 1);
      }

      .timeline-left-cell {
        width: 380px;
        min-width: 380px;
        flex-shrink: 0;
        position: sticky;
        left: 0;
        z-index: 2;
        height: 48px;
        min-height: 48px;
        padding: 16px 0 16px 31px;
        display: flex;
        align-items: center;
        background-color: rgba(255, 255, 255, 1);
        transition: background-color 0.15s ease;
        border-right: 1px solid rgba(230, 235, 240, 1);
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

      .timeline-right-cell {
        flex-shrink: 0;
        background-color: rgba(247, 249, 252, 1);
      }
    `,
  ],
})
export class TimelineComponent implements AfterViewInit, OnDestroy {
  workCenters = input.required<WorkCenterDocument[]>();
  workOrders = input.required<WorkOrderDocument[]>();
  loading = input<boolean>(false);
  zoomLevel = input<ZoomLevel>('month');

  createRequest = output<{ date: Date; workCenterId: string }>();
  editRequest = output<WorkOrderDocument>();
  deleteRequest = output<WorkOrderDocument>();

  protected readonly HEADER_HEIGHT_PX = HEADER_HEIGHT_PX;
  protected readonly ROW_HEIGHT_PX = ROW_HEIGHT_PX;

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

  filterQuery = signal('');
  filterStartDate = signal<NgbDateStruct | null>(null);
  filterEndDate = signal<NgbDateStruct | null>(null);

  hasDateFilter = computed(() => {
    const start = this.filterStartDate();
    const end = this.filterEndDate();
    return start !== null && end !== null;
  });

  /** Work centers after applying text and date filters */
  filteredWorkCenters = computed(() => {
    const centers = this.workCenters();
    const orders = this.workOrders();
    const query = this.filterQuery().trim().toLowerCase();
    const startNgb = this.filterStartDate();
    const endNgb = this.filterEndDate();

    let result = centers;
    if (query) {
      result = result.filter((wc) => wc.data.name.toLowerCase().includes(query));
    }
    if (startNgb && endNgb) {
      const filterStartMs = new Date(startNgb.year, startNgb.month - 1, startNgb.day).getTime();
      const filterEndMs = new Date(endNgb.year, endNgb.month - 1, endNgb.day, 23, 59, 59, 999).getTime();
      result = result.filter((wc) =>
        orders.some((wo) => {
          if (wo.data.workCenterId !== wc.docId) return false;
          const woStart = this.calculator.parseLocalDate(wo.data.startDate).getTime();
          const woEnd = this.calculator.parseLocalDate(wo.data.endDate).getTime();
          return woStart <= filterEndMs && woEnd >= filterStartMs;
        })
      );
    }
    return result;
  });

  /** Visible work centers (max 50) based on scroll position - sliding window */
  visibleWorkCenters = computed(() => {
    const { scrollTop, viewportHeight } = this.scrollState();
    const centers = this.filteredWorkCenters();
    if (centers.length === 0) return [];

    const firstRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT_PX) - 2);
    const count = Math.min(MAX_WORK_CENTERS, centers.length - firstRow);
    return centers.slice(firstRow, firstRow + count).map((wc, i) => ({
      workCenter: wc,
      rowIndex: firstRow + i,
    }));
  });

  @ViewChild('timelineScroll') scrollContainerRef?: ElementRef<HTMLElement>;
  @ViewChild('filterBtn') filterBtnRef?: ElementRef<HTMLButtonElement>;

  protected hoveredWorkCenterId = signal<string | null>(null);
  focusedWorkOrderId = signal<string | null>(null);
  filterOpen = signal(false);
  filterDropdownTop = signal(0);
  filterDropdownLeft = signal(0);
  /** Scroll state: horizontal for bar detection, vertical for work order windowing */
  scrollState = signal<{
    scrollLeft: number;
    viewportWidth: number;
    scrollTop: number;
    viewportHeight: number;
  }>({
    scrollLeft: 0,
    viewportWidth: 0,
    scrollTop: 0,
    viewportHeight: 0,
  });
  private extendingBackward = false;
  private extendingForward = false;
  private dragStartX: number | null = null;
  private dragStartScrollLeft: number | null = null;
  private scrollContainer: HTMLElement | null = null;
  protected isDragging = false;
  protected isPressed = false;
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
    effect(() => {
      const id = this.focusedWorkOrderId();
      if (!id) return;
      const exists = this.workOrders().some((wo) => wo.docId === id);
      if (!exists) this.focusedWorkOrderId.set(null);
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
    const viewportHeight = scrollEl.clientHeight;
    this.scrollState.set({
      scrollLeft: scrollEl.scrollLeft,
      viewportWidth,
      scrollTop: scrollEl.scrollTop,
      viewportHeight,
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
    this.isPressed = true;
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
        scrollTop: this.scrollContainer.scrollTop,
        viewportHeight: this.scrollContainer.clientHeight,
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
    this.isPressed = false;
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el) return;
    this.scrollState.set({
      scrollLeft: el.scrollLeft,
      viewportWidth: el.clientWidth,
      scrollTop: el.scrollTop,
      viewportHeight: el.clientHeight,
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

  toggleFilter(): void {
    const willOpen = !this.filterOpen();
    this.filterOpen.set(willOpen);
    if (willOpen) {
      setTimeout(() => {
        const btn = this.filterBtnRef?.nativeElement;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        this.filterDropdownTop.set(rect.bottom + 4);
        this.filterDropdownLeft.set(rect.right - 280);
      }, 0);
    }
  }

  getOrdersForCenter(workCenterId: string): WorkOrderDocument[] {
    const range = this.dateRange();
    const orders = this.workOrders();
    const startNgb = this.filterStartDate();
    const endNgb = this.filterEndDate();

    let result = orders.filter((wo) => wo.data.workCenterId === workCenterId);

    if (range) {
      const rangeStartMs = range.start.getTime();
      const rangeEndMs = range.end.getTime();
      result = result.filter((wo) => {
        const woStart = this.calculator.parseLocalDate(wo.data.startDate).getTime();
        const woEnd = this.calculator.parseLocalDate(wo.data.endDate).getTime();
        return woStart < rangeEndMs && woEnd > rangeStartMs;
      });
    }

    if (startNgb && endNgb) {
      const filterStartMs = new Date(startNgb.year, startNgb.month - 1, startNgb.day).getTime();
      const filterEndMs = new Date(endNgb.year, endNgb.month - 1, endNgb.day, 23, 59, 59, 999).getTime();
      result = result.filter((wo) => {
        const woStart = this.calculator.parseLocalDate(wo.data.startDate).getTime();
        const woEnd = this.calculator.parseLocalDate(wo.data.endDate).getTime();
        return woStart <= filterEndMs && woEnd >= filterStartMs;
      });
    }

    return result;
  }

  clearDateFilter(): void {
    this.filterStartDate.set(null);
    this.filterEndDate.set(null);
  }

  onBarFocus(workOrder: WorkOrderDocument): void {
    this.focusedWorkOrderId.set(workOrder.docId);
    this.scrollContainerRef?.nativeElement?.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp' && key !== 'ArrowDown') {
      return;
    }
    event.preventDefault();

    const items = this.buildNavItems();
    if (items.length === 0) return;

    const currentId = this.focusedWorkOrderId();
    const current = currentId ? items.find((x) => x.docId === currentId) : null;

    let next: (typeof items)[0] | null = null;

    if (key === 'ArrowLeft') {
      if (current) {
        const onSameRow = items.filter((x) => x.rowIndex === current.rowIndex && x.centerMs < current.centerMs);
        next = onSameRow.length > 0 ? onSameRow.reduce((a, b) => (b.centerMs > a.centerMs ? b : a)) : null;
      } else {
        next = items.reduce((a, b) => (a.centerMs < b.centerMs ? a : b));
      }
    } else if (key === 'ArrowRight') {
      if (current) {
        const onSameRow = items.filter((x) => x.rowIndex === current.rowIndex && x.centerMs > current.centerMs);
        next = onSameRow.length > 0 ? onSameRow.reduce((a, b) => (a.centerMs < b.centerMs ? a : b)) : null;
      } else {
        next = items.reduce((a, b) => (a.centerMs > b.centerMs ? a : b));
      }
    } else if (key === 'ArrowUp') {
      if (current) {
        const above = items.filter((x) => x.rowIndex === current.rowIndex - 1);
        next = above.length > 0 ? above.reduce((a, b) => (Math.abs(b.centerMs - current.centerMs) < Math.abs(a.centerMs - current.centerMs) ? b : a)) : null;
      } else {
        next = items.reduce((a, b) => (a.rowIndex < b.rowIndex ? a : b));
      }
    } else if (key === 'ArrowDown') {
      if (current) {
        const below = items.filter((x) => x.rowIndex === current.rowIndex + 1);
        next = below.length > 0 ? below.reduce((a, b) => (Math.abs(b.centerMs - current.centerMs) < Math.abs(a.centerMs - current.centerMs) ? b : a)) : null;
      } else {
        next = items.reduce((a, b) => (a.rowIndex > b.rowIndex ? a : b));
      }
    }

    if (next) {
      this.focusedWorkOrderId.set(next.docId);
      this.scrollFocusedBarIntoView(next.rowIndex);
    }
  }

  private buildNavItems(): Array<{ docId: string; workCenterId: string; rowIndex: number; centerMs: number }> {
    const centers = this.filteredWorkCenters();
    const orders = this.workOrders();
    const range = this.dateRange();
    if (!range || centers.length === 0) return [];

    const rangeStartMs = range.start.getTime();
    const rangeEndMs = range.end.getTime();
    const items: Array<{ docId: string; workCenterId: string; rowIndex: number; centerMs: number }> = [];

    for (let i = 0; i < centers.length; i++) {
      const wcId = centers[i].docId;
      const woList = orders.filter((wo) => {
        if (wo.data.workCenterId !== wcId) return false;
        const woStart = this.calculator.parseLocalDate(wo.data.startDate).getTime();
        const woEnd = this.calculator.parseLocalDate(wo.data.endDate).getTime();
        return woStart < rangeEndMs && woEnd > rangeStartMs;
      });
      for (const wo of woList) {
        const woStart = this.calculator.parseLocalDate(wo.data.startDate).getTime();
        const woEnd = this.calculator.parseLocalDate(wo.data.endDate).getTime();
        const centerMs = (woStart + woEnd) / 2;
        items.push({ docId: wo.docId, workCenterId: wcId, rowIndex: i, centerMs });
      }
    }
    return items;
  }

  private scrollFocusedBarIntoView(rowIndex: number): void {
    const el = this.scrollContainerRef?.nativeElement;
    if (!el) return;
    const rowTop = rowIndex * ROW_HEIGHT_PX;
    const rowBottom = rowTop + ROW_HEIGHT_PX;
    const viewTop = el.scrollTop;
    const viewBottom = el.scrollTop + el.clientHeight;

    if (rowTop < viewTop) {
      el.scrollTop = Math.max(0, rowTop - 24);
    } else if (rowBottom > viewBottom) {
      el.scrollTop = Math.min(el.scrollHeight - el.clientHeight, rowBottom - el.clientHeight + 24);
    }
  }

}