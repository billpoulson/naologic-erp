import { TestBed } from '@angular/core/testing';
import { TimelineCalculatorService, type ZoomLevel } from './timeline-calculator.service';

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
    it('should return today ± 2 weeks for day zoom', () => {
      const range = service.getVisibleDateRange('day');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expectedStart = new Date(today);
      expectedStart.setDate(expectedStart.getDate() - 14);
      const expectedEnd = new Date(today);
      expectedEnd.setDate(expectedEnd.getDate() + 14);

      expect(range.start.getTime()).toBe(expectedStart.getTime());
      expect(range.end.getTime()).toBe(expectedEnd.getTime());
    });

    it('should return today ± 60 days for week zoom', () => {
      const range = service.getVisibleDateRange('week');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expectedStart = new Date(today);
      expectedStart.setDate(expectedStart.getDate() - 60);
      const expectedEnd = new Date(today);
      expectedEnd.setDate(expectedEnd.getDate() + 60);

      expect(range.start.getTime()).toBe(expectedStart.getTime());
      expect(range.end.getTime()).toBe(expectedEnd.getTime());
    });

    it('should return today ± 180 days for month zoom', () => {
      const range = service.getVisibleDateRange('month');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expectedStart = new Date(today);
      expectedStart.setDate(expectedStart.getDate() - 180);
      const expectedEnd = new Date(today);
      expectedEnd.setDate(expectedEnd.getDate() + 180);

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
    it('should return 100 for month', () => expect(service.getColumnWidth('month')).toBe(100));
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
