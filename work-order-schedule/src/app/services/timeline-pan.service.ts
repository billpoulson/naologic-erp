import { Injectable, signal } from '@angular/core';

/**
 * Tracks whether a pan/drag occurred so row click handlers can suppress create-on-click.
 * See ADR-004: drag-to-pan uses movement threshold; we must not create when user was panning.
 */
@Injectable({
  providedIn: 'root',
})
export class TimelinePanService {
  private readonly panningOccurred = signal(false);

  /** True if the user just panned (drag); row should not emit createRequest. */
  readonly didPan = this.panningOccurred.asReadonly();

  setPanningOccurred(): void {
    this.panningOccurred.set(true);
  }

  consumeAndReset(): boolean {
    const value = this.panningOccurred();
    this.panningOccurred.set(false);
    return value;
  }
}
