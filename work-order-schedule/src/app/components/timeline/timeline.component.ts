import {
  Component,
  input,
  output,
  computed,
  effect,
  inject,
  HostListener,
  signal,
} from '@angular/core';
import { TimelineCalculatorService, type ZoomLevel } from '../../services/timeline-calculator.service';
import { TimelineRangeService } from '../../services/timeline-range.service';
import { TimelinePanService } from '../../services/timeline-pan.service';
import type { WorkCenterDocument } from '../../models/work-center';
import type { WorkOrderDocument } from '../../models/work-order';
import { TimelineHeaderComponent } from './timeline-header.component';
import { TimelineRowComponent } from './timeline-row.component';
import { TimelineWheelZoomDirective } from '../../directives/timeline-wheel-zoom.directive';

const SCROLL_EXTEND_THRESHOLD = 150;
const DRAG_THRESHOLD_PX = 5;

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [TimelineHeaderComponent, TimelineRowComponent, TimelineWheelZoomDirective],
  template: `
    <div class="timeline">
      <div class="timeline-grid">
        <div class="timeline-left">
          <div class="timeline-left-header">Work Center</div>
          @for (wc of workCenters(); track wc.docId) {
            <div class="timeline-left-cell">{{ wc.data.name }}</div>
          }
        </div>
        <div
          class="timeline-right"
          #timelineScroll
          appTimelineWheelZoom
          [class.dragging]="isDragging"
          (scroll)="onScroll($event)"
          (mousedown)="onMouseDown($event)"
        >
          <app-timeline-header
            [labels]="headerLabels()"
            [width]="timelineWidth()"
            [cellWidth]="cellWidth()"
            [todayPosition]="todayPosition()"
          />
          <div class="timeline-rows" [style.width.px]="timelineWidth()">
            @for (wc of workCenters(); track wc.docId) {
              <app-timeline-row
                [workCenter]="wc"
                [workOrders]="getOrdersForCenter(wc.docId)"
                [rangeStart]="dateRange().start"
                [rangeEnd]="dateRange().end"
                [timelineWidth]="timelineWidth()"
                (createRequest)="createRequest.emit($event)"
                (editRequest)="editRequest.emit($event)"
                (deleteRequest)="deleteRequest.emit($event)"
              />
            }
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
      }

      .timeline-left {
        width: $layout-work-center-width;
        flex-shrink: 0;
        border-right: 1px solid $color-border;
        display: flex;
        flex-direction: column;
      }

      .timeline-left-header {
        height: 40px;
        padding: 0 $spacing-md;
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 600;
        color: $color-text-secondary;
        border-bottom: 1px solid $color-border;
      }

      .timeline-left-cell {
        min-height: 44px;
        padding: 0 $spacing-md;
        display: flex;
        align-items: center;
        font-size: 13px;
        border-bottom: 1px solid $color-border-light;
      }

      .timeline-right {
        flex: 1;
        overflow-x: auto;
        overflow-y: auto;
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

      .timeline-rows {
        min-width: min-content;
      }
    `,
  ],
})
export class TimelineComponent {
  workCenters = input.required<WorkCenterDocument[]>();
  workOrders = input.required<WorkOrderDocument[]>();
  zoomLevel = input<ZoomLevel>('month');

  createRequest = output<{ date: Date; workCenterId: string }>();
  editRequest = output<WorkOrderDocument>();
  deleteRequest = output<WorkOrderDocument>();

  dateRange = computed(() => {
    const range = this.rangeService.dateRange();
    if (range) return range;
    return this.calculator.getVisibleDateRange(this.zoomLevel());
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

  private extendingBackward = false;
  private dragStartX: number | null = null;
  private dragStartScrollLeft: number | null = null;
  private scrollContainer: HTMLElement | null = null;
  protected isDragging = false;

  private readonly panService = inject(TimelinePanService);

  constructor(
    private calculator: TimelineCalculatorService,
    private rangeService: TimelineRangeService
  ) {
    this.rangeService.initialize(this.zoomLevel());
    effect(() => {
      const zoom = this.zoomLevel();
      this.rangeService.initialize(zoom);
    });
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
    if (this.isDragging) {
      this.scrollContainer.scrollLeft = (this.dragStartScrollLeft ?? 0) - dx;
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
    if (!el || this.extendingBackward) return;

    const { scrollLeft, clientWidth, scrollWidth } = el;
    const zoom = this.zoomLevel();

    if (scrollLeft < SCROLL_EXTEND_THRESHOLD) {
      this.extendingBackward = true;
      const addedWidth = this.rangeService.extendBackward(zoom);
      const targetScroll = scrollLeft + addedWidth;
      setTimeout(() => {
        el.scrollLeft = targetScroll;
        this.extendingBackward = false;
      }, 0);
    } else if (scrollLeft + clientWidth > scrollWidth - SCROLL_EXTEND_THRESHOLD) {
      this.rangeService.extendForward(zoom);
    }
  }

  getOrdersForCenter(workCenterId: string): WorkOrderDocument[] {
    return this.workOrders().filter((wo) => wo.data.workCenterId === workCenterId);
  }
}