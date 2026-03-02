import { TestBed } from '@angular/core/testing';
import { NgbDateDotFormatter } from './ngb-date-dot-formatter';

describe('NgbDateDotFormatter', () => {
  let formatter: NgbDateDotFormatter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NgbDateDotFormatter] });
    formatter = TestBed.inject(NgbDateDotFormatter);
  });

  describe('parse', () => {
    it('should parse DD.MM.YYYY', () => {
      expect(formatter.parse('01.02.2025')).toEqual({ year: 2025, month: 2, day: 1 });
      expect(formatter.parse('15.12.2024')).toEqual({ year: 2024, month: 12, day: 15 });
    });

    it('should return null for empty or whitespace', () => {
      expect(formatter.parse('')).toBeNull();
      expect(formatter.parse('   ')).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(formatter.parse('2025-02-01')).toBeNull();
      expect(formatter.parse('01/02/2025')).toBeNull();
      expect(formatter.parse('abc')).toBeNull();
    });
  });

  describe('format', () => {
    it('should format to DD.MM.YYYY', () => {
      expect(formatter.format({ year: 2025, month: 2, day: 1 })).toBe('01.02.2025');
      expect(formatter.format({ year: 2024, month: 12, day: 15 })).toBe('15.12.2024');
    });

    it('should pad single-digit day and month', () => {
      expect(formatter.format({ year: 2025, month: 1, day: 5 })).toBe('05.01.2025');
    });

    it('should return empty string for null', () => {
      expect(formatter.format(null)).toBe('');
    });
  });
});
