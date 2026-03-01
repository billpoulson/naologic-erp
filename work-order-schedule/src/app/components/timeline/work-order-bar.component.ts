import { Component, input, Input, output, signal, ViewChild, ElementRef } from '@angular/core';
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
      [class.continues-left]="continuesLeft"
      [class.continues-right]="continuesRight"
      (click)="$event.stopPropagation()"
      (mouseenter)="onBarMouseEnter($event)"
      (mouseleave)="onBarMouseLeave()"
      (mousemove)="onBarMouseMove($event)"
    >
      @if (nameTooltipVisible()) {
        <div
          class="bar-name-tooltip"
          [style.top.px]="nameTooltipTop()"
          [style.left.px]="nameTooltipLeft()"
        >
          {{ workOrder().data.name }}
        </div>
      }
      <span class="bar-name">{{ workOrder().data.name }}</span>
      <span class="bar-status-pill">{{ formatStatus(workOrder().data.status) }}</span>
      <div class="bar-actions" (click)="$event.stopPropagation()">
        <button
          #menuBtn
          type="button"
          class="bar-menu-btn"
          [class.visible]="barHovered() || menuOpen()"
          (click)="onMenuToggle($event)"
        >
          ⋯
        </button>
        @if (menuOpen()) {
          <div
            class="bar-dropdown-backdrop"
            (click)="menuOpen.set(false)"
          ></div>
          <div
            class="bar-dropdown"
            [style.top.px]="dropdownTop()"
            [style.left.px]="dropdownLeft()"
          >
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
        max-height: 38px;
        box-sizing: border-box;
        border-radius: $radius-default;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 8px;
        cursor: default;
        overflow: hidden;
      }

      .work-order-bar.status-open {
        border: 1px solid rgba(206, 251, 255, 1);
        border-radius: 8px;
        background: $color-status-open-bg;
        color: $color-status-open;
      }

      .work-order-bar.status-in-progress {
        box-shadow: 0 0 0 1px rgba(222, 224, 255, 1);
        border-radius: 8px;
        background-color: rgba(237, 238, 255, 1);
        color: $color-status-in-progress;
      }

      .work-order-bar.status-complete {
        box-shadow: 0 0 0 1px rgba(209, 250, 179, 1);
        border-radius: 8px;
        background-color: rgba(248, 255, 243, 1);
        color: $color-status-complete;
      }

      .work-order-bar.status-blocked {
        box-shadow: 0 0 0 1px rgba(255, 245, 207, 1);
        border-radius: 8px;
        background-color: rgba(255, 252, 241, 1);
        color: $color-status-blocked;
      }

      .bar-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: rgba(3, 9, 41, 1);
        font-family: CircularStd-Book;
        font-size: 14px;
        font-weight: 400;
        font-style: normal;
      }

      .bar-status-pill {
        flex-shrink: 0;
        padding: 2px 6px;
        border-radius: 5px;
        font-family: CircularStd-Book;
        font-size: 14px;
        font-weight: 400;
      }

      .work-order-bar.status-complete .bar-status-pill {
        background-color: rgba(225, 255, 204, 1);
        color: rgba(8, 162, 104, 1);
        font-family: CircularStd-Book;
        font-size: 14px;
        font-weight: 400;
        font-style: normal;
      }

      .work-order-bar.status-in-progress .bar-status-pill {
        background-color: rgba(214, 216, 255, 1);
        color: rgba(62, 64, 219, 1);
      }

      .work-order-bar.status-blocked .bar-status-pill {
        border-radius: 5px;
        background-color: rgba(252, 238, 181, 1);
        margin: 2px 8px;
        padding: 2px 8px;
        color: rgba(177, 54, 0, 1);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .work-order-bar.status-open .bar-status-pill {
        border: 1px solid rgba(206, 251, 255, 1);
        border-radius: 5px;
        background-color: rgba(228, 253, 255, 1);
        color: rgba(0, 176, 191, 1);
        font-family: CircularStd-Regular;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
      }

      .work-order-bar.continues-left::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 8px;
        background: linear-gradient(to right, rgba(0, 0, 0, 0.2), transparent);
        border-radius: 8px 0 0 8px;
        pointer-events: none;
      }

      .work-order-bar.continues-right::after {
        content: '';
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 8px;
        background: linear-gradient(to left, rgba(0, 0, 0, 0.2), transparent);
        border-radius: 0 8px 8px 0;
        pointer-events: none;
      }

      .bar-actions {
        position: relative;
        flex-shrink: 0;
      }

      .bar-menu-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        font-size: 14px;
        min-width: 12px;
        opacity: 0;
        pointer-events: none;
      }

      .bar-menu-btn.visible {
        opacity: 1;
        pointer-events: auto;
      }

      .bar-dropdown-backdrop {
        position: fixed;
        inset: 0;
        background: $panel-overlay;
        z-index: 999;
      }

      .bar-dropdown {
        position: fixed;
        margin-top: 4px;
        background: $color-bg-primary;
        border: 1px solid $color-border;
        border-radius: $radius-default;
        box-shadow: $dropdown-shadow;
        z-index: 1000;
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

      .bar-name-tooltip {
        position: fixed;
        z-index: 1001;
        padding: 6px 10px;
        font-size: 12px;
        color: $color-text-secondary;
        background: $color-bg-primary;
        border: 1px solid $color-border;
        border-radius: $radius-default;
        white-space: normal;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        pointer-events: none;
        max-width: 320px;
        word-break: break-word;
      }
    `,
  ],
})
export class WorkOrderBarComponent {
  @ViewChild('menuBtn') menuBtnRef?: ElementRef<HTMLButtonElement>;

  workOrder = input.required<WorkOrderDocument>();
  left = input<number>(0);
  width = input<number>(100);
  @Input() continuesLeft = false;
  @Input() continuesRight = false;
  edit = output<WorkOrderDocument>();
  delete = output<WorkOrderDocument>();
  menuOpen = signal(false);
  barHovered = signal(false);
  dropdownTop = signal(0);
  dropdownLeft = signal(0);
  nameTooltipVisible = signal(false);
  nameTooltipTop = signal(0);
  nameTooltipLeft = signal(0);
  private nameTooltipTimeout: ReturnType<typeof setTimeout> | null = null;

  onBarMouseEnter(event: MouseEvent): void {
    this.barHovered.set(true);
    this.nameTooltipTimeout = setTimeout(() => {
      this.nameTooltipVisible.set(true);
      this.updateNameTooltipPosition(event);
    }, 400);
  }

  onBarMouseLeave(): void {
    this.barHovered.set(false);
    if (this.nameTooltipTimeout) {
      clearTimeout(this.nameTooltipTimeout);
      this.nameTooltipTimeout = null;
    }
    this.nameTooltipVisible.set(false);
  }

  onBarMouseMove(event: MouseEvent): void {
    if (this.nameTooltipVisible()) {
      this.updateNameTooltipPosition(event);
    }
  }

  private updateNameTooltipPosition(event: MouseEvent): void {
    const offset = 12;
    const tooltipHeight = 32;
    const tooltipMaxWidth = 320;
    const spaceAbove = event.clientY;
    const spaceBelow = window.innerHeight - event.clientY;
    const showAbove = spaceAbove >= tooltipHeight + offset || spaceBelow < spaceAbove;
    this.nameTooltipTop.set(
      showAbove ? event.clientY - tooltipHeight - offset : event.clientY + offset
    );
    const left = Math.max(8, Math.min(event.clientX + 12, window.innerWidth - tooltipMaxWidth - 16));
    this.nameTooltipLeft.set(left);
  }

  onMenuToggle(event: Event): void {
    event.stopPropagation();
    const willOpen = !this.menuOpen();
    this.menuOpen.set(willOpen);
    if (willOpen) {
      this.nameTooltipVisible.set(false);
      if (this.nameTooltipTimeout) {
        clearTimeout(this.nameTooltipTimeout);
        this.nameTooltipTimeout = null;
      }
      this.updateDropdownPosition();
    }
  }

  private updateDropdownPosition(): void {
    setTimeout(() => {
      const btn = this.menuBtnRef?.nativeElement;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const dropdownHeight = 80;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const openDown = spaceBelow >= dropdownHeight || spaceBelow >= rect.top;
      this.dropdownTop.set(
        openDown ? rect.bottom + 4 : rect.top - dropdownHeight - 4
      );
      this.dropdownLeft.set(Math.max(8, rect.right - 80));
    }, 0);
  }

  formatStatus(status: string): string {
    return status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
  }
}