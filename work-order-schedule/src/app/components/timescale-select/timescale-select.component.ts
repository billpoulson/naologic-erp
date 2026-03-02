import { Component, inject, signal } from '@angular/core';
import { ZoomLevelService } from '../../services/zoom-level.service';
import type { ZoomLevel } from '../../services/timeline-calculator.service';

const OPTIONS: { value: ZoomLevel; label: string }[] = [
  { value: 'hours', label: 'Hours' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

@Component({
  selector: 'app-timescale-select',
  standalone: true,
  template: `
    <div class="timescale-control">
      <div class="timescale-label"><span class="timescale-label-text">Timescale</span></div>
      <div class="timescale-dropdown" [class.open]="open()">
        <button
          type="button"
          class="timescale-trigger"
          [attr.aria-expanded]="open()"
          [attr.aria-haspopup]="'listbox'"
          aria-label="Timescale"
          (click)="open.set(!open())"
          (blur)="onBlur()"
        >
          <span class="timescale-text">{{ getLabel(level()) }}</span>
          <span class="chevron" [class.open]="open()" aria-hidden="true">
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
        @if (open()) {
          <div class="timescale-menu" role="listbox" aria-label="Timescale options">
            @for (opt of options; track opt.value) {
              <button
                type="button"
                class="timescale-option"
                role="option"
                [attr.aria-selected]="opt.value === level()"
                [class.selected]="opt.value === level()"
                (mousedown)="select(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./timescale-select.component.scss'],
})
export class TimescaleSelectComponent {
  private readonly zoomService = inject(ZoomLevelService);

  level = this.zoomService.level;
  open = signal(false);

  options = OPTIONS;

  getLabel(value: ZoomLevel): string {
    return OPTIONS.find((o) => o.value === value)?.label ?? 'Month';
  }

  select(value: ZoomLevel): void {
    this.zoomService.setLevel(value);
    this.open.set(false);
  }

  onBlur(): void {
    setTimeout(() => this.open.set(false), 150);
  }
}
