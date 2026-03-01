import { Directive, ElementRef, inject, OnInit, OnDestroy } from '@angular/core';
import { ZoomLevelService } from '../services/zoom-level.service';
import type { ZoomLevel } from '../services/timeline-calculator.service';

const ZOOM_ORDER: ZoomLevel[] = ['month', 'week', 'day', 'hours'];

/**
 * Handles wheel events for timeline zoom. Uses addEventListener with passive: false
 * so preventDefault works.
 * See ADR-004.
 */
@Directive({
  selector: '[appTimelineWheelZoom]',
  standalone: true,
})
export class TimelineWheelZoomDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly zoomService = inject(ZoomLevelService);
  private boundHandler: (e: WheelEvent) => void;

  constructor() {
    this.boundHandler = (e: WheelEvent) => this.onWheel(e);
  }

  ngOnInit(): void {
    this.el.nativeElement.addEventListener('wheel', this.boundHandler, {
      passive: false,
    });
  }

  ngOnDestroy(): void {
    this.el.nativeElement.removeEventListener('wheel', this.boundHandler);
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY;
    const current = this.zoomService.level();
    const idx = ZOOM_ORDER.indexOf(current);
    if (delta < 0 && idx > 0) {
      this.zoomService.setLevel(ZOOM_ORDER[idx - 1]);
    } else if (delta > 0 && idx < ZOOM_ORDER.length - 1) {
      this.zoomService.setLevel(ZOOM_ORDER[idx + 1]);
    }
  }
}
