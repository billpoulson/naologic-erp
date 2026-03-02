import { Component, input, Input, output, signal, ViewChild, ElementRef } from '@angular/core';
import type { WorkOrderDocument } from '../../models/work-order';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  template: `
    <div
      class="work-order-bar"
      role="group"
      [attr.aria-label]="getBarAriaLabel()"
      [style.left.px]="left()"
      [style.width.px]="width()"
      [class]="'status-' + workOrder().data.status"
      [class.continues-left]="continuesLeft"
      [class.continues-right]="continuesRight"
      [class.focused]="focused()"
      (click)="onBarClick($event)"
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
          [attr.aria-label]="'Actions for ' + workOrder().data.name"
          [attr.aria-haspopup]="'menu'"
          [attr.aria-expanded]="menuOpen()"
          [class.visible]="barHovered() || menuOpen()"
          (click)="onMenuToggle($event)"
        >
          <span aria-hidden="true">⋯</span>
        </button>
        @if (menuOpen()) {
          <div
            class="bar-dropdown-backdrop"
            (click)="menuOpen.set(false)"
          ></div>
          <div
            class="bar-dropdown"
            role="menu"
            [attr.aria-label]="'Actions for ' + workOrder().data.name"
            [style.top.px]="dropdownTop()"
            [style.left.px]="dropdownLeft()"
          >
            <button type="button" role="menuitem" (click)="edit.emit(workOrder()); menuOpen.set(false)">
              Edit
            </button>
            <button type="button" role="menuitem" (click)="delete.emit(workOrder()); menuOpen.set(false)">
              Delete
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./work-order-bar.component.scss'],
})
export class WorkOrderBarComponent {
  @ViewChild('menuBtn') menuBtnRef?: ElementRef<HTMLButtonElement>;

  workOrder = input.required<WorkOrderDocument>();
  focused = input<boolean>(false);
  left = input<number>(0);
  width = input<number>(100);
  @Input() continuesLeft = false;
  @Input() continuesRight = false;
  edit = output<WorkOrderDocument>();
  delete = output<WorkOrderDocument>();
  focusRequest = output<WorkOrderDocument>();
  menuOpen = signal(false);
  barHovered = signal(false);
  dropdownTop = signal(0);
  dropdownLeft = signal(0);
  nameTooltipVisible = signal(false);
  nameTooltipTop = signal(0);
  nameTooltipLeft = signal(0);
  private nameTooltipTimeout: ReturnType<typeof setTimeout> | null = null;

  onBarClick(event: MouseEvent): void {
    event.stopPropagation();
    this.focusRequest.emit(this.workOrder());
  }

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

  getBarAriaLabel(): string {
    const wo = this.workOrder();
    const status = this.formatStatus(wo.data.status);
    const start = wo.data.startDate;
    const end = wo.data.endDate;
    return `${wo.data.name}, ${status}, from ${start} to ${end}. Use arrow keys to navigate between work orders.`;
  }
}