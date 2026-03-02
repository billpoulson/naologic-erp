import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of, tap, finalize, combineLatest, map } from 'rxjs';
import type { WorkCenterDocument } from '../models/work-center';
import type { WorkOrderDocument } from '../models/work-order';
import { FALLBACK_WORK_CENTERS, FALLBACK_WORK_ORDERS } from '../data/sample-data';
import { TimelineCalculatorService } from './timeline-calculator.service';

const STORAGE_KEY = 'work-order-schedule:work-orders';

@Injectable({
  providedIn: 'root',
})
export class WorkOrderService {
  private workCentersSubject = new BehaviorSubject<WorkCenterDocument[]>([]);
  private workOrdersSubject = new BehaviorSubject<WorkOrderDocument[]>([]);
  private loadingWorkCentersSubject = new BehaviorSubject<boolean>(true);
  private loadingWorkOrdersSubject = new BehaviorSubject<boolean>(true);
  private readonly calculator = inject(TimelineCalculatorService);

  workCenters = this.workCentersSubject.asObservable();
  workOrders = this.workOrdersSubject.asObservable();
  loadingWorkCenters = this.loadingWorkCentersSubject.asObservable();
  loadingWorkOrders = this.loadingWorkOrdersSubject.asObservable();
  /** True when loading work centers or work orders */
  loading = combineLatest([
    this.loadingWorkCentersSubject,
    this.loadingWorkOrdersSubject,
  ]).pipe(map(([lc, lo]) => lc || lo));

  constructor(private http: HttpClient) {
    this.loadData();
  }

  private get canUseStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private shouldResetFromQuery(): boolean {
    if (!this.canUseStorage) return false;
    return new URLSearchParams(window.location.search).get('reset') === '1';
  }

  private loadData(): void {
    this.http
      .get<WorkCenterDocument[]>('data/work-centers.json')
      .pipe(
        catchError(() => of(FALLBACK_WORK_CENTERS)),
        tap((centers) => this.workCentersSubject.next(centers)),
        finalize(() => this.loadingWorkCentersSubject.next(false))
      )
      .subscribe();

    if (this.shouldResetFromQuery()) {
      if (this.canUseStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      this.loadWorkOrdersFromJson();
      return;
    }

    const stored = this.canUseStorage ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WorkOrderDocument[];
        if (Array.isArray(parsed)) {
          this.workOrdersSubject.next(parsed);
          this.loadingWorkOrdersSubject.next(false);
          return;
        }
      } catch {
        if (this.canUseStorage) {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    }

    this.loadWorkOrdersFromJson();
  }

  private loadWorkOrdersFromJson(): void {
    this.http
      .get<WorkOrderDocument[]>('data/work-orders.json')
      .pipe(
        catchError(() => of(FALLBACK_WORK_ORDERS)),
        tap((orders) => {
          this.workOrdersSubject.next(orders);
          this.persistWorkOrders(orders);
        }),
        finalize(() => this.loadingWorkOrdersSubject.next(false))
      )
      .subscribe();
  }

  private persistWorkOrders(orders: WorkOrderDocument[]): void {
    if (!this.canUseStorage) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, work orders not persisted');
      }
    }
  }

  getWorkCenters(): WorkCenterDocument[] {
    return this.workCentersSubject.value;
  }

  getWorkOrders(): WorkOrderDocument[] {
    return this.workOrdersSubject.value;
  }

  getWorkOrdersByCenter(workCenterId: string): WorkOrderDocument[] {
    return this.workOrdersSubject.value.filter(
      (wo) => wo.data.workCenterId === workCenterId
    );
  }

  /**
   * Returns work orders that overlap the given date range.
   * Use when loading data for the timeline to avoid passing orders outside the visible window.
   */
  getWorkOrdersInRange(rangeStart: Date, rangeEnd: Date): WorkOrderDocument[] {
    const startMs = rangeStart.getTime();
    const endMs = rangeEnd.getTime();
    return this.workOrdersSubject.value.filter((wo) => {
      const woStart = this.calculator.parseLocalDate(wo.data.startDate).getTime();
      const woEnd = this.calculator.parseLocalDate(wo.data.endDate).getTime();
      return woStart < endMs && woEnd > startMs;
    });
  }

  createWorkOrder(order: WorkOrderDocument['data']): WorkOrderDocument {
    const doc: WorkOrderDocument = {
      docId: `wo-${Date.now()}`,
      docType: 'workOrder',
      data: order,
    };
    const newOrders = [...this.workOrdersSubject.value, doc];
    this.workOrdersSubject.next(newOrders);
    this.persistWorkOrders(newOrders);
    return doc;
  }

  updateWorkOrder(docId: string, data: Partial<WorkOrderDocument['data']>): void {
    const orders = this.workOrdersSubject.value.map((wo) =>
      wo.docId === docId
        ? { ...wo, data: { ...wo.data, ...data } }
        : wo
    );
    this.workOrdersSubject.next(orders);
    this.persistWorkOrders(orders);
  }

  deleteWorkOrder(docId: string): void {
    const orders = this.workOrdersSubject.value.filter((wo) => wo.docId !== docId);
    this.workOrdersSubject.next(orders);
    this.persistWorkOrders(orders);
  }

  /**
   * Returns true if the given date range overlaps another work order at the same work center.
   * Same-day handoff is allowed: a work order may start on the day another finishes.
   */
  checkOverlap(
    workCenterId: string,
    startDate: string,
    endDate: string,
    excludeDocId?: string
  ): boolean {
    const start = this.calculator.parseLocalDate(startDate).getTime();
    const endExclusive = this.calculator.parseLocalDate(endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const end = endExclusive.getTime();

    const overlapping = this.workOrdersSubject.value.some((wo) => {
      if (wo.data.workCenterId !== workCenterId) return false;
      if (excludeDocId && wo.docId === excludeDocId) return false;

      // Same-day handoff: new order starts the day existing order ends — allowed
      if (startDate === wo.data.endDate) return false;

      const woStart = this.calculator.parseLocalDate(wo.data.startDate).getTime();
      const woEndDate = this.calculator.parseLocalDate(wo.data.endDate);
      woEndDate.setDate(woEndDate.getDate() + 1);
      const woEnd = woEndDate.getTime();

      return start < woEnd && end > woStart;
    });

    return overlapping;
  }

}
