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
  styleUrls: ['./timeline-heading.component.scss'],
})
export class TimelineHeadingComponent {}
