import { Component, inject, signal } from '@angular/core';
import { ZoomLevelService } from '../../services/zoom-level.service';
import type { ZoomLevel } from '../../services/timeline-calculator.service';

const OPTIONS: { value: ZoomLevel; label: string }[] = [
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

      .timescale-dropdown.open .timescale-trigger {
        outline: 1px solid $color-border-focus;
        outline-offset: -1px;
      }

      .timescale-text {
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
        color: $dropdown-text-color;
        transition: transform 0.2s ease;
      }

      .chevron.open {
        transform: rotate(180deg);
      }

      .timescale-menu {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 4px;
        min-width: 100%;
        background: $color-bg-primary;
        border: 1px solid $color-border;
        border-radius: $radius-dropdown;
        box-shadow: $dropdown-shadow;
        z-index: 100;
        display: flex;
        flex-direction: column;
      }

      .timescale-option {
        padding: 8px 12px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 13px;
        font-family: inherit;
        color: $color-text-primary;
      }

      .timescale-option:hover {
        background: $color-bg-hover;
      }

      .timescale-option.selected {
        color: $dropdown-text-color;
        font-weight: 500;
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
