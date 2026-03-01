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
          <div class="timescale-menu">
            @for (opt of options; track opt.value) {
              <button
                type="button"
                class="timescale-option"
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
  styles: [
    `
      @use '../../../styles/variables' as *;

      .timescale-control {
        display: flex;
        align-items: stretch;
        border-radius: 5px;
        box-shadow: 2px 4px 8px 0 rgba(0, 0, 0, 0.1);
      }

      .timescale-label {
        width: 75px;
        height: 25px;
        border-radius: 5px 0 0 5px;
        background-color: rgba(241, 243, 248, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .timescale-label-text {
        width: 59px;
        height: 16px;
        color: rgba(104, 113, 150, 1);
        font-family: CircularStd-Book, 'Circular-Std', sans-serif;
        font-size: 13px;
        font-weight: 400;
        font-style: normal;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .timescale-dropdown {
        position: relative;
        width: 71px;
        height: 25px;
        border-radius: 0 5px 5px 0;
      }

      .timescale-trigger {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px 5px 8px;
        border: none;
        outline: none;
        border-radius: 0 5px 5px 0;
        background: #ffffff;
        color: $dropdown-text-color;
        cursor: pointer;
        font-family: inherit;
        box-sizing: border-box;
      }

      .timescale-trigger:hover {
        background: rgba(250, 251, 253, 1);
      }

      .timescale-trigger:focus {
        outline: none;
      }

      .timescale-dropdown.open .timescale-trigger {
        outline: none;
      }

      .timescale-text {
        color: rgba(62, 64, 219, 1);
        font-family: CircularStd-Medium, 'Circular-Std', sans-serif;
        font-size: 13px;
        font-weight: 500;
        font-style: normal;
        width: 40px;
        height: 16px;
        display: flex;
        align-items: center;
      }

      .chevron {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #687196;
      }

      .chevron.open {
        color: #5659FF;
      }

      .timescale-menu {
        position: absolute;
        top: 100%;
        left: -75px;
        margin-top: 5px;
        min-width: 200px;
        box-shadow: 0 0 0 1px rgba(104, 113, 150, 0.1), 0 2.5px 3px -1.5px rgba(200, 207, 233, 1), 0 4.5px 5px -1px rgba(216, 220, 235, 1);
        border-radius: 5px;
        background-color: rgba(255, 255, 255, 1);
        z-index: 100;
        display: flex;
        flex-direction: column;
        padding: 12px 0;
      }

      .timescale-option {
        padding: 5px 0 5px 12px;
        margin: 0;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-family: CircularStd-Book, 'Circular-Std', sans-serif;
        font-size: 14px;
        font-weight: 400;
        font-style: normal;
        color: rgba(47, 48, 89, 1);
      }

      .timescale-option:hover {
        background: $color-bg-hover;
      }

      .timescale-option.selected {
        color: rgba(62, 64, 219, 1);
      }
    `,
  ],
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
