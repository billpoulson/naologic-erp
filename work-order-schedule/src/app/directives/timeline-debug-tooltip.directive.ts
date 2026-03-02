import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
} from '@angular/core';
import { TimelineCalculatorService, type ZoomLevel } from '../services/timeline-calculator.service';
import { TimelineRangeService } from '../services/timeline-range.service';
import { ZoomLevelService } from '../services/zoom-level.service';

/** Left offset of the timeline grid (work center column width) - must match timeline.component */
const TIMELINE_LEFT_OFFSET_PX = 380;

/**
 * Debug directive: shows a tooltip with the date/time under the cursor
 * based on the selected timescale. Apply to the timeline scroll container.
 */
@Directive({
  selector: '[appTimelineDebugTooltip]',
  standalone: true,
})
export class TimelineDebugTooltipDirective implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly rangeService = inject(TimelineRangeService);
  private readonly calculator = inject(TimelineCalculatorService);
  private readonly zoomService = inject(ZoomLevelService);

  private tooltipEl: HTMLDivElement | null = null;

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const range = this.rangeService.dateRange();
    if (!range) return;

    const zoom = this.zoomService.level();
    const width = this.calculator.getTimelineWidth(range, zoom);
    if (width <= 0) return;

    const host = this.el.nativeElement;
    const rect = host.getBoundingClientRect();
    const visibleX = event.clientX - rect.left;

    if (visibleX < TIMELINE_LEFT_OFFSET_PX) {
      this.hideTooltip();
      return;
    }

    const contentX = visibleX + host.scrollLeft;
    const timelineX = Math.max(0, Math.min(width, contentX - TIMELINE_LEFT_OFFSET_PX));

    const date = this.calculator.positionToDate(
      timelineX,
      range.start,
      range.end,
      width
    );

    const label = this.formatForZoom(date, zoom);
    this.showTooltip(event.clientX, event.clientY, label);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hideTooltip();
  }

  ngOnDestroy(): void {
    this.hideTooltip();
  }

  private formatForZoom(date: Date, zoom: ZoomLevel): string {
    switch (zoom) {
      case 'hours':
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      case 'day':
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      case 'week':
      case 'month':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      default:
        return date.toLocaleDateString();
    }
  }

  private showTooltip(x: number, y: number, text: string): void {
    if (!this.tooltipEl) {
      this.tooltipEl = document.createElement('div');
      this.tooltipEl.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        padding: 4px 8px;
        font-size: 12px;
        font-family: CircularStd-Regular, 'Circular-Std', sans-serif;
        background: rgba(3, 9, 41, 0.9);
        color: white;
        border-radius: 4px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      document.body.appendChild(this.tooltipEl);
    }

    this.tooltipEl.textContent = text;
    this.tooltipEl.style.left = `${x + 12}px`;
    this.tooltipEl.style.top = `${y + 12}px`;
    this.tooltipEl.style.display = 'block';
  }

  private hideTooltip(): void {
    if (this.tooltipEl) {
      this.tooltipEl.style.display = 'none';
    }
  }
}
