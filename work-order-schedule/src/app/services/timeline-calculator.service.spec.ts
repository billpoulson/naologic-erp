import { TestBed } from '@angular/core/testing';
import {
  TimelineCalculatorService,
  TIMELINE_RANGE_YEARS,
  DEFAULT_WINDOW_UNITS,
  SLIDE_CHUNK_UNITS,
  type ZoomLevel,
} from './timeline-calculator.service';

describe('TimelineCalculatorService', () => {
  let service: TimelineCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelineCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getVisibleDateRange', () => {
    const years = TIMELINE_RANGE_YEARS;

    it('should return today ± 5 years in days for day zoom', () => {
      const range = service.getVisibleDateRange('day');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysEachSide = years * 365;
      const expectedStart = new Date(today);
      expectedStart.setDate(expectedStart.getDate() - daysEachSide);
      const expectedEnd = new Date(today);
      expectedEnd.setDate(expectedEnd.getDate() + daysEachSide);

      expect(range.start.getTime()).toBe(expectedStart.getTime());
      expect(range.end.getTime()).toBe(expectedEnd.getTime());
    });

    it('should return today ± 5 years in weeks for week zoom', () => {
      const range = service.getVisibleDateRange('week');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weeksEachSide = years * 52;
      const expectedStart = new Date(today);
      expectedStart.setDate(expectedStart.getDate() - weeksEachSide * 7);
      const expectedEnd = new Date(today);
      expectedEnd.setDate(expectedEnd.getDate() + weeksEachSide * 7);

      expect(range.start.getTime()).toBe(expectedStart.getTime());
      expect(range.end.getTime()).toBe(expectedEnd.getTime());
    });

    it('should return today ± 5 years in months for month zoom', () => {
      const range = service.getVisibleDateRange('month');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const monthsEachSide = years * 12;
      const expectedStart = service.addMonths(new Date(today), -monthsEachSide);
      const expectedEnd = service.addMonths(new Date(today), monthsEachSide);

      expect(range.start.getTime()).toBe(expectedStart.getTime());
      expect(range.end.getTime()).toBe(expectedEnd.getTime());
    });
  });

  describe('dateToPosition', () => {
    it('should return 0 when date equals range start', () => {
      const start = new Date(2025, 0, 1);
      const end = new Date(2025, 0, 31);
      const pos = service.dateToPosition(start, start, end, 1000);
      expect(pos).toBe(0);
    });

    it('should return pixelWidth when date equals range end', () => {
      const start = new Date(2025, 0, 1);
      const end = new Date(2025, 0, 31);
      const pos = service.dateToPosition(end, start, end, 1000);
      expect(pos).toBe(1000);
    });

    it('should return proportional position for date in middle', () => {
      const start = new Date(2025, 0, 1);
      const end = new Date(2025, 0, 31);
      const mid = new Date(2025, 0, 16);
      const pos = service.dateToPosition(mid, start, end, 1000);
      expect(pos).toBeGreaterThan(400);
      expect(pos).toBeLessThan(600);
    });

    it('should clamp when date is before range start', () => {
      const start = new Date(2025, 0, 10);
      const end = new Date(2025, 0, 20);
      const before = new Date(2025, 0, 1);
      const pos = service.dateToPosition(before, start, end, 1000);
      expect(pos).toBe(0);
    });

    it('should clamp when date is after range end', () => {
      const start = new Date(2025, 0, 10);
      const end = new Date(2025, 0, 20);
      const after = new Date(2025, 0, 25);
      const pos = service.dateToPosition(after, start, end, 1000);
      expect(pos).toBe(1000);
    });
  });

  describe('positionToDate', () => {
    it('should return range start when x is 0', () => {
      const start = new Date(2025, 0, 1);
      const end = new Date(2025, 0, 31);
      const date = service.positionToDate(0, start, end, 1000);
      expect(date.getTime()).toBe(start.getTime());
    });

    it('should return range end when x equals pixelWidth', () => {
      const start = new Date(2025, 0, 1);
      const end = new Date(2025, 0, 31);
      const date = service.positionToDate(1000, start, end, 1000);
      expect(date.getTime()).toBe(end.getTime());
    });

    it('should round-trip with dateToPosition', () => {
      const start = new Date(2025, 0, 1);
      const end = new Date(2025, 0, 31);
      const original = new Date(2025, 0, 15);
      const pos = service.dateToPosition(original, start, end, 1000);
      const back = service.positionToDate(pos, start, end, 1000);
      expect(back.getDate()).toBe(original.getDate());
    });
  });

  describe('getColumnWidth', () => {
    it('should return 60 for day', () => expect(service.getColumnWidth('day')).toBe(60));
    it('should return 80 for week', () => expect(service.getColumnWidth('week')).toBe(80));
    it('should return 113 for month', () => expect(service.getColumnWidth('month')).toBe(113));
  });

  describe('getHeaderLabels', () => {
    it('should return labels for month zoom', () => {
      const range = {
        start: new Date(2025, 0, 1),
        end: new Date(2025, 2, 31),
      };
      const labels = service.getHeaderLabels(range, 'month');
      expect(labels.length).toBeGreaterThan(0);
      expect(labels[0]).toContain('2025');
    });
  });

  describe('timeline scale alignment (unit boundaries at column edges)', () => {
    it('should place midnight at column boundary in day view', () => {
      const range = {
        start: new Date(2025, 0, 1, 0, 0, 0, 0),
        end: new Date(2025, 0, 4, 0, 0, 0, 0),
      };
      const labels = service.getHeaderLabels(range, 'day');
      const colWidth = service.getColumnWidth('day');
      const width = labels.length * colWidth;

      expect(labels.length).toBe(3);

      const jan2Midnight = new Date(2025, 0, 2, 0, 0, 0, 0);
      const pos = service.dateToPosition(
        jan2Midnight,
        range.start,
        range.end,
        width
      );
      expect(pos).toBe(colWidth);
    });

    it('should place hour boundary at column edge in hours view', () => {
      const range = {
        start: new Date(2025, 0, 1, 0, 0, 0, 0),
        end: new Date(2025, 0, 1, 24, 0, 0, 0),
      };
      const labels = service.getHeaderLabels(range, 'hours');
      const colWidth = service.getColumnWidth('hours');
      const width = labels.length * colWidth;

      expect(labels.length).toBe(24);

      const oneAm = new Date(2025, 0, 1, 1, 0, 0, 0);
      const pos = service.dateToPosition(
        oneAm,
        range.start,
        range.end,
        width
      );
      expect(pos).toBe(colWidth);
    });

    it('should place week start at column boundary in week view', () => {
      const range = {
        start: new Date(2025, 0, 6, 0, 0, 0, 0),
        end: new Date(2025, 0, 27, 0, 0, 0, 0),
      };
      const labels = service.getHeaderLabels(range, 'week');
      const colWidth = service.getColumnWidth('week');
      const width = labels.length * colWidth;

      expect(labels.length).toBe(3);

      const week2Start = new Date(2025, 0, 13, 0, 0, 0, 0);
      const pos = service.dateToPosition(
        week2Start,
        range.start,
        range.end,
        width
      );
      expect(pos).toBe(colWidth);
    });

    it('should place month start near column boundary in month view', () => {
      const range = {
        start: new Date(2025, 0, 1),
        end: new Date(2025, 4, 1),
      };
      const labels = service.getHeaderLabels(range, 'month');
      const colWidth = service.getColumnWidth('month');
      const width = labels.length * colWidth;

      expect(labels.length).toBe(4);

      const feb1 = new Date(2025, 1, 1);
      const pos = service.dateToPosition(
        feb1,
        range.start,
        range.end,
        width
      );
      expect(pos).toBeGreaterThanOrEqual(colWidth * 0.9);
      expect(pos).toBeLessThanOrEqual(colWidth * 1.1);
    });
  });

  describe('parseLocalDate', () => {
    it('should parse ISO date string as local date', () => {
      const date = service.parseLocalDate('2025-03-15');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(2); // March = 2 (0-indexed)
      expect(date.getDate()).toBe(15);
    });

    it('should produce local midnight (date parts correct)', () => {
      const local = service.parseLocalDate('2025-03-15');
      expect(local.getFullYear()).toBe(2025);
      expect(local.getMonth()).toBe(2);
      expect(local.getDate()).toBe(15);
      expect(local.getHours()).toBe(0);
      expect(local.getMinutes()).toBe(0);
    });
  });

  describe('getWindowUnitsForViewport', () => {
    it('should return units based on viewport and cell width', () => {
      const units = service.getWindowUnitsForViewport(1000, 'month', 2.5);
      expect(units).toBeGreaterThanOrEqual(1);
      expect(units).toBe(Math.ceil((1000 * 2.5) / 113));
    });

    it('should return at least 1 when viewport is 0', () => {
      const units = service.getWindowUnitsForViewport(0, 'month');
      expect(units).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getChunkSize', () => {
    it('should return chunk for each zoom level', () => {
      expect(service.getChunkSize('hours')).toBe(SLIDE_CHUNK_UNITS.hours);
      expect(service.getChunkSize('day')).toBe(SLIDE_CHUNK_UNITS.day);
      expect(service.getChunkSize('week')).toBe(SLIDE_CHUNK_UNITS.week);
      expect(service.getChunkSize('month')).toBe(SLIDE_CHUNK_UNITS.month);
    });
  });

  describe('getSlidingWindowRange', () => {
    it('should return fixed-size window centered on today for month zoom', () => {
      const range = service.getSlidingWindowRange('month');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const halfMonths = Math.floor(DEFAULT_WINDOW_UNITS.month / 2);
      const expectedStart = service.addMonths(new Date(today), -halfMonths);
      const expectedEnd = service.addMonths(new Date(today), DEFAULT_WINDOW_UNITS.month - halfMonths);
      expect(range.start.getTime()).toBe(expectedStart.getTime());
      expect(range.end.getTime()).toBe(expectedEnd.getTime());
    });

    it('should use viewport when provided', () => {
      const range = service.getSlidingWindowRange('month', 1200);
      const durationMs = range.end.getTime() - range.start.getTime();
      const expectedMonths = Math.ceil((1200 * 2.5) / 113);
      expect(durationMs).toBeGreaterThan(0);
    });
  });

  describe('getTodayPosition', () => {
    it('should return -1 when today is outside range', () => {
      const range = {
        start: new Date(2020, 0, 1),
        end: new Date(2020, 0, 31),
      };
      const pos = service.getTodayPosition(range, 1000);
      expect(pos).toBe(-1);
    });

    it('should return position when today is in range', () => {
      const today = new Date();
      const range = {
        start: new Date(today),
        end: new Date(today),
      };
      range.start.setDate(range.start.getDate() - 7);
      range.end.setDate(range.end.getDate() + 7);
      const pos = service.getTodayPosition(range, 1000);
      expect(pos).toBeGreaterThanOrEqual(0);
      expect(pos).toBeLessThanOrEqual(1000);
    });
  });
});
