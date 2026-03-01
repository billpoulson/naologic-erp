import { Injectable, signal, computed } from '@angular/core';
import type { ZoomLevel } from './timeline-calculator.service';

@Injectable({
  providedIn: 'root',
})
export class ZoomLevelService {
  private readonly zoomLevel = signal<ZoomLevel>('month');

  readonly level = this.zoomLevel.asReadonly();

  setLevel(level: ZoomLevel): void {
    this.zoomLevel.set(level);
  }
}
