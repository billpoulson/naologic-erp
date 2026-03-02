import { TestBed } from '@angular/core/testing';
import { NgbDateDotFormatter } from './ngb-date-dot-formatter';

describe('NgbDateDotFormatter', () => {
  let formatter: NgbDateDotFormatter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NgbDateDotFormatter] });
    formatter = TestBed.inject(NgbDateDotFormatter);
  });

  describe('parse', () => {
    it('should parse MM.DD.YYYY (month, day, year)', () => {
      expect(formatter.parse('02.01.2025')).toEqual({ year: 2025, month: 2, day: 1 });
      expect(formatter.parse('12.15.2024')).toEqual({ year: 2024, month: 12, day: 15 });
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
    it('should format to MM.DD.YYYY (month, day, year)', () => {
      expect(formatter.format({ year: 2025, month: 2, day: 1 })).toBe('02.01.2025');
      expect(formatter.format({ year: 2024, month: 12, day: 15 })).toBe('12.15.2024');
    });

    it('should pad single-digit month and day', () => {
      expect(formatter.format({ year: 2025, month: 1, day: 5 })).toBe('01.05.2025');
    });

    it('should return empty string for null', () => {
      expect(formatter.format(null)).toBe('');
    });
  });
});
