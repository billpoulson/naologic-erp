import { Component, input } from '@angular/core';
import type { ZoomLevel } from '../../services/timeline-calculator.service';

@Component({
  selector: 'app-timeline-header',
  standalone: true,
  template: `
    <div class="timeline-header" [style.width.px]="width()">
      @for (label of labels(); track $index) {
        <div class="timeline-header-cell" [style.width.px]="cellWidth()">
          {{ label }}
        </div>
      }
      @if (todayPosition() >= 0) {
        <div
          class="timeline-header-today"
          [style.left.px]="todayPosition()"
        ></div>
      }
    </div>
  `,
  styles: [
    `
      @use '../../../styles/variables' as *;

      .timeline-header {
        display: flex;
        flex-shrink: 0;
        height: 40px;
        border-bottom: 1px solid $color-border;
        position: relative;
      }

      .timeline-header-cell {
        flex-shrink: 0;
        padding: 0 8px;
        display: flex;
        align-items: center;
        font-size: 12px;
        color: $color-text-secondary;
      }

      .timeline-header-today {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: $color-status-open;
        pointer-events: none;
      }
    `,
  ],
})
export class TimelineHeaderComponent {
  labels = input<string[]>([]);
  width = input<number>(0);
  cellWidth = input<number>(100);
  todayPosition = input<number>(-1);
}
