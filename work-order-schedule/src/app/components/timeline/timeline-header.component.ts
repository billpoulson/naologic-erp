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
  styleUrls: ['./timeline-header.component.scss'],
})
export class TimelineHeaderComponent {
  labels = input<string[]>([]);
  width = input<number>(0);
  cellWidth = input<number>(100);
}
