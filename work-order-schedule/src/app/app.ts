import { Component } from '@angular/core';
import { WorkOrderScheduleComponent } from './components/work-order-schedule/work-order-schedule.component';
import { TimelineHeadingComponent } from './components/timeline-heading/timeline-heading.component';

@Component({
  selector: 'app-root',
  imports: [WorkOrderScheduleComponent, TimelineHeadingComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
