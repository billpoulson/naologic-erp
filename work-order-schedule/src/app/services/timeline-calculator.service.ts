import { Injectable } from '@angular/core';

export type ZoomLevel = 'day' | 'week' | 'month';

export interface DateRange {
  start: Date;
  end: Date;
}

@Injectable({
  providedIn: 'root',
})
export class TimelineCalculatorService {
  private readonly DAY_MS = 24 * 60 * 60 * 1000;

  getVisibleDateRange(zoomLevel: ZoomLevel): DateRange {
    const today = this.startOfDay(new Date());
    let start: Date;
    let end: Date;

    switch (zoomLevel) {
      case 'day':
        start = this.addDays(new Date(today), -14);
        end = this.addDays(new Date(today), 14);
        break;
      case 'week':
        start = this.addDays(new Date(today), -60);
        end = this.addDays(new Date(today), 60);
        break;
      case 'month':
        start = this.addDays(new Date(today), -180);
        end = this.addDays(new Date(today), 180);
        break;
      default:
        start = this.addDays(new Date(today), -180);
        end = this.addDays(new Date(today), 180);
    }

    if (end.getTime() <= start.getTime()) {
      end = this.addDays(new Date(start), 30);
    }
    return { start, end };
  }

  dateToPosition(
    date: Date,
    rangeStart: Date,
    rangeEnd: Date,
    pixelWidth: number,
    options?: { clamp?: boolean }
  ): number {
    const startMs = rangeStart.getTime();
    const endMs = rangeEnd.getTime();
    const dateMs = date.getTime();
    const totalMs = endMs - startMs;
    if (totalMs <= 0) return 0;
    const ratio = (dateMs - startMs) / totalMs;
    const position = ratio * pixelWidth;
    if (options?.clamp === false) return position;
    return Math.max(0, Math.min(pixelWidth, position));
  }

  positionToDate(
    x: number,
    rangeStart: Date,
    rangeEnd: Date,
    pixelWidth: number
  ): Date {
    if (pixelWidth <= 0) return new Date(rangeStart);
    const ratio = Math.max(0, Math.min(1, x / pixelWidth));
    const startMs = rangeStart.getTime();
    const endMs = rangeEnd.getTime();
    const totalMs = endMs - startMs;
    const dateMs = startMs + ratio * totalMs;
    return new Date(dateMs);
  }

  getColumnWidth(zoomLevel: ZoomLevel): number {
    switch (zoomLevel) {
      case 'day':
        return 60;
      case 'week':
        return 80;
      case 'month':
        return 100;
      default:
        return 100;
    }
  }

  getHeaderLabels(range: DateRange, zoomLevel: ZoomLevel): string[] {
    const labels: string[] = [];
    const start = new Date(range.start);
    const end = new Date(range.end);

    switch (zoomLevel) {
      case 'day': {
        let d = new Date(start);
        while (d <= end) {
          labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          d.setDate(d.getDate() + 1);
        }
        break;
      }
      case 'week': {
        let d = new Date(start);
        while (d <= end) {
          const weekEnd = new Date(d);
          weekEnd.setDate(weekEnd.getDate() + 6);
          labels.push(`${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`);
          d.setDate(d.getDate() + 7);
        }
        break;
      }
      case 'month': {
        let d = new Date(start.getFullYear(), start.getMonth(), 1);
        while (d <= end) {
          labels.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
          d.setMonth(d.getMonth() + 1);
        }
        break;
      }
      default:
        labels.push('Month');
    }
    return labels;
  }

  getTodayPosition(range: DateRange, pixelWidth: number): number {
    const today = this.startOfDay(new Date());
    if (today < range.start || today > range.end) return -1;
    return this.dateToPosition(today, range.start, range.end, pixelWidth);
  }

  private startOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  getTimelineWidth(range: DateRange, zoomLevel: ZoomLevel): number {
    const colWidth = this.getColumnWidth(zoomLevel);
    let cols: number;

    switch (zoomLevel) {
      case 'day':
        cols = Math.ceil((range.end.getTime() - range.start.getTime()) / this.DAY_MS);
        break;
      case 'week':
        cols = Math.ceil((range.end.getTime() - range.start.getTime()) / (7 * this.DAY_MS));
        break;
      case 'month':
        const months =
          (range.end.getFullYear() - range.start.getFullYear()) * 12 +
          (range.end.getMonth() - range.start.getMonth()) +
          1;
        cols = Math.max(1, months);
        break;
      default:
        cols = 12;
    }

    return Math.max(100, cols * colWidth);
  }

  addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  /**
   * Parse ISO date string (YYYY-MM-DD) as local date.
   * Avoids timezone shift from new Date("2025-03-15") which parses as UTC midnight.
   */
  parseLocalDate(isoDateString: string): Date {
    const [y, m, d] = isoDateString.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
}
