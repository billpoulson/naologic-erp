import { TestBed } from '@angular/core/testing';
import { TimelineAnnotationService } from './timeline-annotation.service';
import { TimelineCalculatorService } from './timeline-calculator.service';
import type { ZoomLevel } from './timeline-calculator.service';

describe('TimelineAnnotationService', () => {
  let service: TimelineAnnotationService;

  // Monday March 10, 2025 at 10:00 AM
  const fixedDate = new Date(2025, 2, 10, 10, 0, 0, 0);

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(fixedDate);
    TestBed.configureTestingModule({
      providers: [TimelineAnnotationService, TimelineCalculatorService],
    });
    service = TestBed.inject(TimelineAnnotationService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentUnitRange', () => {
    it('should return 1st of month to 1st of next month for month zoom', () => {
      const { start, end } = service.getCurrentUnitRange('month');
      expect(start.getFullYear()).toBe(2025);
      expect(start.getMonth()).toBe(2); // March
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);

      expect(end.getFullYear()).toBe(2025);
      expect(end.getMonth()).toBe(3); // April
      expect(end.getDate()).toBe(1);
      expect(end.getHours()).toBe(0);
    });

    it('should return Monday to next Monday for week zoom (ISO)', () => {
      const { start, end } = service.getCurrentUnitRange('week');
      expect(start.getDay()).toBe(1); // Monday
      expect(start.getFullYear()).toBe(2025);
      expect(start.getMonth()).toBe(2);
      expect(start.getDate()).toBe(10);
      expect(start.getHours()).toBe(0);

      expect(end.getDay()).toBe(1); // Next Monday
      expect(end.getDate()).toBe(17);
      expect(end.getHours()).toBe(0);
    });

    it('should return today 00:00 to tomorrow 00:00 for day zoom', () => {
      const { start, end } = service.getCurrentUnitRange('day');
      expect(start.getFullYear()).toBe(2025);
      expect(start.getMonth()).toBe(2);
      expect(start.getDate()).toBe(10);
      expect(start.getHours()).toBe(0);

      expect(end.getDate()).toBe(11);
      expect(end.getHours()).toBe(0);
    });

    it('should return current hour start to next hour for hours zoom', () => {
      const { start, end } = service.getCurrentUnitRange('hours');
      expect(start.getFullYear()).toBe(2025);
      expect(start.getMonth()).toBe(2);
      expect(start.getDate()).toBe(10);
      expect(start.getHours()).toBe(10);
      expect(start.getMinutes()).toBe(0);

      expect(end.getHours()).toBe(11);
      expect(end.getMinutes()).toBe(0);
    });
  });

  describe('getAnnotationBounds', () => {
    it('should return bounds when unit is inside visible range', () => {
      const dateRange = {
        start: new Date(2025, 2, 1),
        end: new Date(2025, 2, 31),
      };
      const bounds = service.getAnnotationBounds('month', dateRange, 1000);
      expect(bounds).not.toBeNull();
      expect(bounds!.left).toBeGreaterThanOrEqual(0);
      expect(bounds!.width).toBeGreaterThan(0);
      expect(bounds!.left + bounds!.width).toBeLessThanOrEqual(1000);
    });

    it('should return null when unit is fully outside range (before)', () => {
      const dateRange = {
        start: new Date(2020, 0, 1),
        end: new Date(2020, 0, 31),
      };
      const bounds = service.getAnnotationBounds('month', dateRange, 1000);
      expect(bounds).toBeNull();
    });

    it('should return null when unit is fully outside range (after)', () => {
      const dateRange = {
        start: new Date(2030, 0, 1),
        end: new Date(2030, 0, 31),
      };
      const bounds = service.getAnnotationBounds('month', dateRange, 1000);
      expect(bounds).toBeNull();
    });

    it('should return clamped bounds when unit partially overlaps start', () => {
      const dateRange = {
        start: new Date(2025, 2, 15), // March 15 - current month (March 1-31) overlaps
        end: new Date(2025, 3, 15),
      };
      const bounds = service.getAnnotationBounds('month', dateRange, 1000);
      expect(bounds).not.toBeNull();
      expect(bounds!.left).toBe(0); // Clamped to start
      expect(bounds!.width).toBeGreaterThan(0);
    });

    it('should return null when pixelWidth is 0', () => {
      const dateRange = {
        start: new Date(2025, 2, 1),
        end: new Date(2025, 2, 31),
      };
      const bounds = service.getAnnotationBounds('month', dateRange, 0);
      expect(bounds).toBeNull();
    });
  });
});
