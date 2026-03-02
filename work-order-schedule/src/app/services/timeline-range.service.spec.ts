import { TestBed } from '@angular/core/testing';
import { TimelineRangeService } from './timeline-range.service';
import { TimelineCalculatorService } from './timeline-calculator.service';

describe('TimelineRangeService', () => {
  let service: TimelineRangeService;
  let calculator: TimelineCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelineRangeService);
    calculator = TestBed.inject(TimelineCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialize', () => {
    it('should set sliding window range for month zoom', () => {
      service.initialize('month');
      const range = service.dateRange();
      expect(range).not.toBeNull();
      expect(range!.start.getTime()).toBeLessThan(range!.end.getTime());
    });

    it('should use viewport when set', () => {
      service.setViewportWidth(1200);
      service.initialize('month');
      const range = service.dateRange();
      expect(range).not.toBeNull();
    });
  });

  describe('extendBackward', () => {
    it('should extend range backward by chunk and return added width', () => {
      service.initialize('month');
      const before = service.dateRange()!;
      const beforeStart = before.start.getTime();

      const addedWidth = service.extendBackward('month');
      const after = service.dateRange()!;
      const afterStart = after.start.getTime();

      expect(afterStart).toBeLessThan(beforeStart);
      expect(addedWidth).toBeGreaterThan(0);
    });

    it('should return 0 when range is null', () => {
      const result = service.extendBackward('month');
      expect(result).toBe(0);
    });
  });

  describe('extendForward', () => {
    it('should extend range forward by chunk', () => {
      service.initialize('month');
      const before = service.dateRange()!;
      const beforeEnd = before.end.getTime();

      service.extendForward('month');
      const after = service.dateRange()!;
      const afterEnd = after.end.getTime();

      expect(afterEnd).toBeGreaterThan(beforeEnd);
    });

    it('should extend by pre-allocation amount (24 months for month zoom)', () => {
      service.initialize('month');
      const before = service.dateRange()!;
      const beforeEnd = before.end.getTime();

      service.extendForward('month');
      const after = service.dateRange()!;

      expect(after.end.getTime()).toBeGreaterThan(beforeEnd);
      const addedMs = after.end.getTime() - beforeEnd;
      expect(addedMs).toBeGreaterThan(20 * 30 * 24 * 60 * 60 * 1000); // ~20+ months
    });
  });

  describe('extendToIncludeDate', () => {
    it('should extend end when date is beyond range', () => {
      service.initialize('month');
      const before = service.dateRange()!;
      const beyond = new Date(before.end);
      beyond.setDate(beyond.getDate() + 30);

      service.extendToIncludeDate(beyond);
      const after = service.dateRange()!;

      expect(after.end.getTime()).toBe(beyond.getTime());
    });

    it('should extend start when date is before range', () => {
      service.initialize('month');
      const before = service.dateRange()!;
      const earlier = new Date(before.start);
      earlier.setDate(earlier.getDate() - 30);

      service.extendToIncludeDate(earlier);
      const after = service.dateRange()!;

      expect(after.start.getTime()).toBe(earlier.getTime());
    });

    it('should not change range when date is within range', () => {
      service.initialize('month');
      const before = service.dateRange()!;
      const mid = new Date(
        (before.start.getTime() + before.end.getTime()) / 2
      );

      service.extendToIncludeDate(mid);
      const after = service.dateRange()!;

      expect(after.start.getTime()).toBe(before.start.getTime());
      expect(after.end.getTime()).toBe(before.end.getTime());
    });
  });

  describe('getExtendChunkDays', () => {
    it('should return pre-allocation amount as approximate days', () => {
      expect(service.getExtendChunkDays('month')).toBe(720); // 24 months × 30 days
      expect(service.getExtendChunkDays('day')).toBe(90);
      expect(service.getExtendChunkDays('hours')).toBe(2); // 48 hours
    });
  });
});
