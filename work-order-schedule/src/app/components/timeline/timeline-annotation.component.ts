import { Component, input, computed, inject } from '@angular/core';
import { TimelineAnnotationService } from '../../services/timeline-annotation.service';
import { ZoomLevelService } from '../../services/zoom-level.service';
import type { DateRange } from '../../services/timeline-calculator.service';
import type { ZoomLevel } from '../../services/timeline-calculator.service';

@Component({
  selector: 'app-timeline-annotation',
  standalone: true,
  template: `
    @if (annotationBounds(); as ann) {
      <div
        class="current-unit-annotation"
        [style.left.px]="ann.left"
        [style.width.px]="ann.width"
      >
        {{ labelText() }}
      </div>
    }
  `,
  styles: [
    `
      @use '../../../styles/variables' as *;

      :host {
        display: block;
        position: relative;
        height: 100%;
      }

      .current-unit-annotation {
        position: absolute;
        top: 0;
        height: 22px;
        box-shadow: 0 0 0 1px rgba(222, 224, 255, 1);
        border-radius: 0 8px 8px 8px;
        background-color: rgba(214, 216, 255, 1);
        color: rgba(62, 64, 219, 1);
        pointer-events: none;
        z-index: 10;
        display: flex;
        align-items: center;
        padding: 0 8px;
        font-size: 12px;
        font-family: CircularStd-Book, 'Circular-Std', sans-serif;
        white-space: nowrap;
        min-width: fit-content;
      }
    `,
  ],
})
export class TimelineAnnotationComponent {
  private readonly annotationService = inject(TimelineAnnotationService);
  private readonly zoomService = inject(ZoomLevelService);

  dateRange = input.required<DateRange>();
  timelineWidth = input.required<number>();
  cellWidth = input<number>();

  annotationBounds = computed(() => {
    const range = this.dateRange();
    const width = this.timelineWidth();
    const zoom = this.zoomService.level();
    const cw = this.cellWidth();
    return this.annotationService.getAnnotationBounds(zoom, range, width, cw);
  });

  labelText = computed(() => {
    const zoom = this.zoomService.level();
    return this.getLabelForZoom(zoom);
  });

  private getLabelForZoom(zoom: ZoomLevel): string {
    switch (zoom) {
      case 'month':
        return 'Current month';
      case 'week':
        return 'Current week';
      case 'day':
        return 'Current day';
      case 'hours':
        return 'Current hour';
      default:
        return 'Current month';
    }
  }
}
