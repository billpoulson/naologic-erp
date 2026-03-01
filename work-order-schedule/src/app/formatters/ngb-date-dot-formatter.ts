import { Injectable } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

function padNumber(value: number | null): string {
  if (value !== null && !isNaN(value)) {
    return `0${value}`.slice(-2);
  }
  return '';
}

/**
 * Custom NgbDateParserFormatter for DD.MM.YYYY format.
 * Provided at app level so all datepickers use dots instead of hyphens.
 */
@Injectable()
export class NgbDateDotFormatter extends NgbDateParserFormatter {
  parse(value: string): NgbDateStruct | null {
    if (!value?.trim()) return null;
    const parts = value.trim().split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return { year, month, day };
  }

  format(date: NgbDateStruct | null): string {
    if (!date) return '';
    return `${padNumber(date.day)}.${padNumber(date.month)}.${date.year}`;
  }
}
