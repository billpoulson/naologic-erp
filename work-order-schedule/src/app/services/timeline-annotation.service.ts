import { Injectable } from '@angular/core';
import {
  TimelineCalculatorService,
  type ZoomLevel,
  type DateRange,
} from './timeline-calculator.service';

@Injectable({
  providedIn: 'root',
})
export class TimelineAnnotationService {
  private readonly HOUR_MS = 60 * 60 * 1000;

  constructor(private calculator: TimelineCalculatorService) {}

  getCurrentUnitRange(zoomLevel: ZoomLevel): { start: Date; end: Date } {
    const now = new Date();

    switch (zoomLevel) {
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = this.calculator.addMonths(new Date(start), 1);
        return { start, end };
      }
      case 'week': {
        const today = this.startOfDay(now);
        const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const start = this.calculator.addDays(new Date(today), -daysToMonday);
        const end = this.calculator.addDays(new Date(start), 7);
        return { start, end };
      }
      case 'day': {
        const start = this.startOfDay(now);
        const end = this.calculator.addDays(new Date(start), 1);
        return { start, end };
      }
      case 'hours': {
        const start = new Date(now);
        start.setMinutes(0, 0, 0);
        const end = new Date(start.getTime() + this.HOUR_MS);
        return { start, end };
      }
      default:
        return this.getCurrentUnitRange('month');
    }
  }

  getAnnotationBounds(
    zoomLevel: ZoomLevel,
    dateRange: DateRange,
    pixelWidth: number,
    cellWidth?: number
  ): { left: number; width: number } | null {
    if (pixelWidth <= 0) return null;

    const unit = this.getCurrentUnitRange(zoomLevel);
    const rangeStart = dateRange.start;
    const rangeEnd = dateRange.end;

    if (zoomLevel === 'month' && cellWidth && cellWidth > 0) {
      const columnIndex = this.getMonthColumnIndex(unit.start, rangeStart);
      const left = columnIndex * cellWidth;
      const width = cellWidth;
      if (left >= pixelWidth || left + width <= 0) return null;
      return {
        left: Math.max(0, left),
        width: Math.min(width, pixelWidth - Math.max(0, left)),
      };
    }

    const leftPx = this.calculator.dateToPosition(
      unit.start,
      rangeStart,
      rangeEnd,
      pixelWidth,
      { clamp: false }
    );
    const rightPx = this.calculator.dateToPosition(
      unit.end,
      rangeStart,
      rangeEnd,
      pixelWidth,
      { clamp: false }
    );

    if (leftPx >= pixelWidth || rightPx <= 0) return null;

    const left = Math.max(0, leftPx);
    const right = Math.min(pixelWidth, rightPx);
    const width = right - left;

    if (width <= 0) return null;

    return { left, width };
  }

  /** Column index for a date in month view (0 = first month in range). */
  getMonthColumnIndex(date: Date, rangeStart: Date): number {
    return (
      (date.getFullYear() - rangeStart.getFullYear()) * 12 +
      (date.getMonth() - rangeStart.getMonth())
    );
  }

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }
}
