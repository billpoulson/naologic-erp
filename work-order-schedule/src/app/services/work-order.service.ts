import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import type { WorkCenterDocument } from '../models/work-center';
import type { WorkOrderDocument } from '../models/work-order';
import { FALLBACK_WORK_CENTERS, FALLBACK_WORK_ORDERS } from '../data/sample-data';

const STORAGE_KEY = 'work-order-schedule:work-orders';

@Injectable({
  providedIn: 'root',
})
export class WorkOrderService {
  private workCentersSubject = new BehaviorSubject<WorkCenterDocument[]>([]);
  private workOrdersSubject = new BehaviorSubject<WorkOrderDocument[]>([]);

  workCenters = this.workCentersSubject.asObservable();
  workOrders = this.workOrdersSubject.asObservable();

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
        tap((centers) => this.workCentersSubject.next(centers))
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
        })
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

  checkOverlap(
    workCenterId: string,
    startDate: string,
    endDate: string,
    excludeDocId?: string
  ): boolean {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const overlapping = this.workOrdersSubject.value.some((wo) => {
      if (wo.data.workCenterId !== workCenterId) return false;
      if (excludeDocId && wo.docId === excludeDocId) return false;

      const woStart = new Date(wo.data.startDate).getTime();
      const woEnd = new Date(wo.data.endDate).getTime();

      return start < woEnd && end > woStart;
    });

    return overlapping;
  }

}
