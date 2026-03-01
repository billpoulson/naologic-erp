import { Injectable, signal, computed } from '@angular/core';
import {
  TimelineCalculatorService,
  type ZoomLevel,
  type DateRange,
} from './timeline-calculator.service';

/** Chunk size to extend when scrolling near edges (days) */
const EXTEND_CHUNK_DAYS: Record<ZoomLevel, number> = {
  day: 7,
  week: 14,
  month: 30,
};

@Injectable({
  providedIn: 'root',
})
export class TimelineRangeService {
  private readonly rangeStart = signal<Date | null>(null);
  private readonly rangeEnd = signal<Date | null>(null);

  readonly start = this.rangeStart.asReadonly();
  readonly end = this.rangeEnd.asReadonly();

  readonly dateRange = computed<DateRange | null>(() => {
    const s = this.rangeStart();
    const e = this.rangeEnd();
    if (!s || !e) return null;
    return { start: s, end: e };
  });

  constructor(private calculator: TimelineCalculatorService) {}

  initialize(zoomLevel: ZoomLevel): void {
    const range = this.calculator.getVisibleDateRange(zoomLevel);
    this.rangeStart.set(range.start);
    this.rangeEnd.set(range.end);
  }

  extendBackward(zoomLevel: ZoomLevel): number {
    const currentStart = this.rangeStart();
    if (!currentStart) return 0;

    const chunk = EXTEND_CHUNK_DAYS[zoomLevel];
    const newStart = this.calculator.addDays(currentStart, -chunk);
    const oldRange: DateRange = { start: currentStart, end: this.rangeEnd()! };
    const newRange: DateRange = { start: newStart, end: oldRange.end };

    const oldWidth = this.calculator.getTimelineWidth(oldRange, zoomLevel);
    const newWidth = this.calculator.getTimelineWidth(newRange, zoomLevel);
    const addedWidth = newWidth - oldWidth;

    this.rangeStart.set(newStart);
    return addedWidth;
  }

  extendForward(zoomLevel: ZoomLevel): void {
    const currentEnd = this.rangeEnd();
    if (!currentEnd) return;

    const chunk = EXTEND_CHUNK_DAYS[zoomLevel];
    const newEnd = this.calculator.addDays(currentEnd, chunk);
    this.rangeEnd.set(newEnd);
  }

  getExtendChunkDays(zoomLevel: ZoomLevel): number {
    return EXTEND_CHUNK_DAYS[zoomLevel];
  }
}
