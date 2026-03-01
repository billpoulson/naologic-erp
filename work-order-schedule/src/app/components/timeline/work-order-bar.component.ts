import { Component, input, output, signal } from '@angular/core';
import type { WorkOrderDocument } from '../../models/work-order';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  template: `
    <div
      class="work-order-bar"
      [style.left.px]="left()"
      [style.width.px]="width()"
      [class]="'status-' + workOrder().data.status"
      (click)="$event.stopPropagation()"
      (mouseenter)="barHovered.set(true)"
      (mouseleave)="barHovered.set(false)"
    >
      <span class="bar-name">{{ workOrder().data.name }}</span>
      <span class="bar-status-pill">{{ formatStatus(workOrder().data.status) }}</span>
      <div class="bar-actions" (click)="$event.stopPropagation()">
        @if (barHovered()) {
          <button
            type="button"
            class="bar-menu-btn"
            (click)="menuOpen.set(!menuOpen()); $event.stopPropagation()"
          >
            ⋮
          </button>
        }
        @if (menuOpen()) {
          <div class="bar-dropdown">
            <button type="button" (click)="edit.emit(workOrder()); menuOpen.set(false)">
              Edit
            </button>
            <button type="button" (click)="delete.emit(workOrder()); menuOpen.set(false)">
              Delete
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      @use '../../../styles/variables' as *;

      .work-order-bar {
        position: absolute;
        top: 4px;
        bottom: 4px;
        min-width: 40px;
        box-sizing: border-box;
        border-radius: $radius-default;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 8px;
        cursor: default;
      }

      .work-order-bar.status-open {
        background: $color-status-open-bg;
        color: $color-status-open;
      }

      .work-order-bar.status-in-progress {
        background: $color-status-in-progress-bg;
        color: $color-status-in-progress;
      }

      .work-order-bar.status-complete {
        background: $color-status-complete-bg;
        color: $color-status-complete;
      }

      .work-order-bar.status-blocked {
        background: $color-status-blocked-bg;
        color: $color-status-blocked;
      }

      .bar-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
      }

      .bar-status-pill {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: $radius-default;
        background: rgba(0, 0, 0, 0.1);
      }

      .bar-actions {
        position: relative;
      }

      .bar-menu-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        font-size: 14px;
      }

      .bar-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 4px;
        background: $color-bg-primary;
        border: 1px solid $color-border;
        border-radius: $radius-default;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 10;
        display: flex;
        flex-direction: column;
        min-width: 80px;
      }

      .bar-dropdown button {
        padding: 8px 12px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 12px;
      }

      .bar-dropdown button:hover {
        background: $color-bg-secondary;
      }
    `,
  ],
})
export class WorkOrderBarComponent {
  workOrder = input.required<WorkOrderDocument>();
  left = input<number>(0);
  width = input<number>(100);
  edit = output<WorkOrderDocument>();
  delete = output<WorkOrderDocument>();
  menuOpen = signal(false);
  barHovered = signal(false);

  formatStatus(status: string): string {
    return status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
  }
}