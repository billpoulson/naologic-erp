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
    </div>
  `,
  styles: [
    `
      @use '../../../styles/variables' as *;

      .timeline-header {
        display: flex;
        flex-shrink: 0;
        height: 33px;
        border-bottom: 1px solid rgba(230, 235, 240, 1);
        position: relative;
        background-color: rgba(255, 255, 255, 1);
      }

      .timeline-header-cell {
        flex-shrink: 0;
        padding: 0 8px;
        background-color: rgba(255, 255, 255, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(104, 113, 150, 1);
        font-family: CircularStd-Regular, 'Circular-Std', sans-serif;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
      }

    `,
  ],
})
export class TimelineHeaderComponent {
  labels = input<string[]>([]);
  width = input<number>(0);
  cellWidth = input<number>(100);
}
