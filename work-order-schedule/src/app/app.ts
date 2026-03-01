import { Component } from '@angular/core';
import { WorkOrderScheduleComponent } from './components/work-order-schedule/work-order-schedule.component';
import { TimescaleSelectComponent } from './components/timescale-select/timescale-select.component';

@Component({
  selector: 'app-root',
  imports: [WorkOrderScheduleComponent, TimescaleSelectComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
