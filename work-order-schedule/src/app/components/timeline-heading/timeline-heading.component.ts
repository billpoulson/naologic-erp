import { Component } from '@angular/core';
import { TimescaleSelectComponent } from '../timescale-select/timescale-select.component';

@Component({
  selector: 'app-timeline-heading',
  standalone: true,
  imports: [TimescaleSelectComponent],
  template: `
    <h1 class="timeline-heading-title">Work Orders</h1>
    <app-timescale-select class="timeline-heading-timescale" />
  `,
  styles: [
    `
      @use '../../../styles/variables' as *;

      :host {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .timeline-heading-title {
        margin: 0;
        width: 142px;
        height: 34px;
        color: rgba(3, 9, 41, 1);
        font-family: 'CircularStd-Medium', 'Circular-Std', sans-serif;
        font-size: 24px;
        font-weight: 500;
      }

      .timeline-heading-timescale {
        margin-top: $spacing-md;
      }
    `,
  ],
})
export class TimelineHeadingComponent {}
