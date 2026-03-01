import { Injectable } from '@angular/core';

export type ZoomLevel = 'hours' | 'day' | 'week' | 'month';

export interface DateRange {
  start: Date;
  end: Date;
}

/** Years of range to pre-populate on each side of the current date (configurable) */
export const TIMELINE_RANGE_YEARS = 5;

/** Default window sizes (time units) when viewport is unknown - fills ~2-3 viewport widths */
export const DEFAULT_WINDOW_UNITS: Record<ZoomLevel, number> = {
  hours: 168, // 1 week
  day: 60, // ~2 months
  week: 12, // ~3 months
  month: 12, // 1 year
};

/** Chunk size for sliding window (same units as zoom level) */
export const SLIDE_CHUNK_UNITS: Record<ZoomLevel, number> = {
  hours: 24, // 1 day
  day: 7, // 1 week
  week: 2, // 2 weeks
  month: 1, // 1 month
};

@Injectable({
  providedIn: 'root',
})
export class TimelineCalculatorService {
  private readonly DAY_MS = 24 * 60 * 60 * 1000;
  private readonly HOUR_MS = 60 * 60 * 1000;

  /**
   * Computes how many time units fit in a viewport width.
   * @param viewportPx Viewport width in pixels
   * @param zoomLevel Zoom level
   * @param bufferMultiplier Multiplier for buffer (e.g. 2.5 = 2.5 viewport widths)
   */
  getWindowUnitsForViewport(
    viewportPx: number,
    zoomLevel: ZoomLevel,
    bufferMultiplier = 2.5
  ): number {
    const colWidth = this.getColumnWidth(zoomLevel);
    if (colWidth <= 0) return DEFAULT_WINDOW_UNITS[zoomLevel];
    const units = Math.ceil((viewportPx * bufferMultiplier) / colWidth);
    return Math.max(1, units);
  }

  getChunkSize(zoomLevel: ZoomLevel): number {
    return SLIDE_CHUNK_UNITS[zoomLevel];
  }

  /**
   * Returns a fixed-size sliding window range centered on today.
   * Uses viewport width when provided, otherwise DEFAULT_WINDOW_UNITS.
   */
  getSlidingWindowRange(zoomLevel: ZoomLevel, viewportPx?: number): DateRange {
    const now = new Date();
    const today = this.startOfDay(now);
    const units =
      viewportPx !== undefined && viewportPx > 0
        ? this.getWindowUnitsForViewport(viewportPx, zoomLevel)
        : DEFAULT_WINDOW_UNITS[zoomLevel];
    const halfUnits = Math.floor(units / 2);

    let start: Date;
    let end: Date;

    switch (zoomLevel) {
      case 'hours': {
        start = new Date(now.getTime() - halfUnits * this.HOUR_MS);
        end = new Date(now.getTime() + (units - halfUnits) * this.HOUR_MS);
        break;
      }
      case 'day': {
        start = this.addDays(new Date(today), -halfUnits);
        end = this.addDays(new Date(today), units - halfUnits);
        break;
      }
      case 'week': {
        start = this.addDays(new Date(today), -halfUnits * 7);
        end = this.addDays(new Date(today), (units - halfUnits) * 7);
        break;
      }
      case 'month': {
        start = this.addMonths(new Date(today), -halfUnits);
        end = this.addMonths(new Date(today), units - halfUnits);
        break;
      }
      default: {
        start = this.addMonths(new Date(today), -6);
        end = this.addMonths(new Date(today), 6);
      }
    }

    if (end.getTime() <= start.getTime()) {
      end = this.addDays(new Date(start), 30);
    }
    return { start, end };
  }

  getVisibleDateRange(zoomLevel: ZoomLevel): DateRange {
    const now = new Date();
    const today = this.startOfDay(now);
    const years = TIMELINE_RANGE_YEARS;
    let start: Date;
    let end: Date;

    switch (zoomLevel) {
      case 'hours': {
        const hoursEachSide = years * 365 * 24;
        start = new Date(now.getTime() - hoursEachSide * this.HOUR_MS);
        end = new Date(now.getTime() + hoursEachSide * this.HOUR_MS);
        break;
      }
      case 'day': {
        const daysEachSide = years * 365;
        start = this.addDays(new Date(today), -daysEachSide);
        end = this.addDays(new Date(today), daysEachSide);
        break;
      }
      case 'week': {
        const weeksEachSide = years * 52;
        start = this.addDays(new Date(today), -weeksEachSide * 7);
        end = this.addDays(new Date(today), weeksEachSide * 7);
        break;
      }
      case 'month': {
        const monthsEachSide = years * 12;
        start = this.addMonths(new Date(today), -monthsEachSide);
        end = this.addMonths(new Date(today), monthsEachSide);
        break;
      }
      default: {
        const monthsEachSide = years * 12;
        start = this.addMonths(new Date(today), -monthsEachSide);
        end = this.addMonths(new Date(today), monthsEachSide);
      }
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

  /** Pixel width for one week given the timeline range and width. */
  getPixelsPerWeek(rangeStart: Date, rangeEnd: Date, pixelWidth: number): number {
    const totalMs = rangeEnd.getTime() - rangeStart.getTime();
    if (totalMs <= 0) return 80;
    const weekMs = 7 * this.DAY_MS;
    return (pixelWidth * weekMs) / totalMs;
  }

  /** Pixel width for one day given the timeline range and width. */
  getPixelsPerDay(rangeStart: Date, rangeEnd: Date, pixelWidth: number): number {
    const totalMs = rangeEnd.getTime() - rangeStart.getTime();
    if (totalMs <= 0) return 60;
    return (pixelWidth * this.DAY_MS) / totalMs;
  }

  /** Pixel width for one hour given the timeline range and width. */
  getPixelsPerHour(rangeStart: Date, rangeEnd: Date, pixelWidth: number): number {
    const totalMs = rangeEnd.getTime() - rangeStart.getTime();
    if (totalMs <= 0) return 40;
    return (pixelWidth * this.HOUR_MS) / totalMs;
  }

  getColumnWidth(zoomLevel: ZoomLevel): number {
    switch (zoomLevel) {
      case 'hours':
        return 40;
      case 'day':
        return 60;
      case 'week':
        return 80;
      case 'month':
        return 113;
      default:
        return 113;
    }
  }

  getHeaderLabels(range: DateRange, zoomLevel: ZoomLevel): string[] {
    const labels: string[] = [];
    const start = new Date(range.start);
    const end = new Date(range.end);

    switch (zoomLevel) {
      case 'hours': {
        let d = new Date(start);
        const endMs = end.getTime();
        while (d.getTime() < endMs) {
          labels.push(d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }));
          d = new Date(d.getTime() + this.HOUR_MS);
        }
        break;
      }
      case 'day': {
        let d = new Date(start);
        const endMs = end.getTime();
        while (d.getTime() < endMs) {
          labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          d = this.addDays(d, 1);
        }
        break;
      }
      case 'week': {
        let d = new Date(start);
        const endMs = end.getTime();
        while (d.getTime() < endMs) {
          labels.push(`${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`);
          d = this.addDays(d, 7);
        }
        break;
      }
      case 'month': {
        let year = start.getFullYear();
        let month = start.getMonth();
        const endYear = end.getFullYear();
        const endMonth = end.getMonth();
        while (year < endYear || (year === endYear && month < endMonth)) {
          const d = new Date(year, month, 1);
          labels.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
          month += 1;
          if (month > 11) {
            month = 0;
            year += 1;
          }
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
    const labels = this.getHeaderLabels(range, zoomLevel);
    const cols = labels.length;
    return Math.max(100, cols * colWidth);
  }

  addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  addMonths(d: Date, months: number): Date {
    const copy = new Date(d);
    copy.setMonth(copy.getMonth() + months);
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
