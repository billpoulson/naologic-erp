import { Injectable, signal, computed } from '@angular/core';
import {
  TimelineCalculatorService,
  type ZoomLevel,
  type DateRange,
} from './timeline-calculator.service';

@Injectable({
  providedIn: 'root',
})
export class TimelineRangeService {
  private readonly rangeStart = signal<Date | null>(null);
  private readonly rangeEnd = signal<Date | null>(null);
  private viewportWidth = 0;

  readonly start = this.rangeStart.asReadonly();
  readonly end = this.rangeEnd.asReadonly();

  readonly dateRange = computed<DateRange | null>(() => {
    const s = this.rangeStart();
    const e = this.rangeEnd();
    if (!s || !e) return null;
    return { start: s, end: e };
  });

  constructor(private calculator: TimelineCalculatorService) {}

  setViewportWidth(px: number): void {
    this.viewportWidth = px;
  }

  initialize(zoomLevel: ZoomLevel): void {
    const range = this.calculator.getSlidingWindowRange(
      zoomLevel,
      this.viewportWidth > 0 ? this.viewportWidth : undefined
    );
    this.rangeStart.set(range.start);
    this.rangeEnd.set(range.end);
  }

  /**
   * Extends the range to include the given date if it falls outside.
   * Use when work orders extend beyond the current range so headers cover them.
   */
  extendToIncludeDate(date: Date): void {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    if (!start || !end) return;

    const t = date.getTime();
    if (t < start.getTime()) {
      this.rangeStart.set(new Date(date));
    }
    if (t > end.getTime()) {
      this.rangeEnd.set(new Date(date));
    }
  }

  /**
   * Extends the range backward (earlier in time) when user scrolls near left edge.
   * Returns the added width in pixels so scroll position can be preserved.
   */
  extendBackward(zoomLevel: ZoomLevel): number {
    const currentStart = this.rangeStart();
    if (!currentStart) return 0;

    const chunk = this.calculator.getChunkSize(zoomLevel);
    const newStart =
      zoomLevel === 'month'
        ? this.calculator.addMonths(currentStart, -chunk)
        : zoomLevel === 'hours'
          ? new Date(currentStart.getTime() - chunk * 60 * 60 * 1000)
          : zoomLevel === 'week'
            ? this.calculator.addDays(currentStart, -chunk * 7)
            : this.calculator.addDays(currentStart, -chunk);
    const oldRange: DateRange = { start: currentStart, end: this.rangeEnd()! };
    const newRange: DateRange = { start: newStart, end: oldRange.end };

    const oldWidth = this.calculator.getTimelineWidth(oldRange, zoomLevel);
    const newWidth = this.calculator.getTimelineWidth(newRange, zoomLevel);
    const addedWidth = newWidth - oldWidth;

    this.rangeStart.set(newStart);
    return addedWidth;
  }

  /**
   * Extends the range forward (later in time) when user scrolls near right edge.
   * If minEndDate is provided and is beyond the chunk extension, extends to include it
   * so work orders in the future are visible without excessive scrolling.
   */
  extendForward(zoomLevel: ZoomLevel, minEndDate?: Date): void {
    const currentEnd = this.rangeEnd();
    if (!currentEnd) return;

    const chunk = this.calculator.getChunkSize(zoomLevel);
    let newEnd =
      zoomLevel === 'month'
        ? this.calculator.addMonths(currentEnd, chunk)
        : zoomLevel === 'hours'
          ? new Date(currentEnd.getTime() + chunk * 60 * 60 * 1000)
          : zoomLevel === 'week'
            ? this.calculator.addDays(currentEnd, chunk * 7)
            : this.calculator.addDays(currentEnd, chunk);

    if (minEndDate && minEndDate.getTime() > newEnd.getTime()) {
      newEnd = minEndDate;
    }

    this.rangeEnd.set(newEnd);
  }

  getExtendChunkDays(zoomLevel: ZoomLevel): number {
    return this.calculator.getChunkSize(zoomLevel);
  }
}
