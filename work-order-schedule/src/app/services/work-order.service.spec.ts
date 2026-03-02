import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { take } from 'rxjs';
import type { WorkOrderDocument } from '../models/work-order';
import { WorkOrderService } from './work-order.service';

const STORAGE_KEY = 'work-order-schedule:work-orders';

const MOCK_CENTERS = [
  { docId: 'wc-1', docType: 'workCenter', data: { name: 'Test Center' } },
];

const MOCK_ORDERS: WorkOrderDocument[] = [
  {
    docId: 'wo-1',
    docType: 'workOrder',
    data: {
      name: 'Order 1',
      workCenterId: 'wc-1',
      status: 'open',
      startDate: '2025-06-01',
      endDate: '2025-06-10',
    },
  },
];

describe('WorkOrderService', () => {
  let service: WorkOrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WorkOrderService],
    });
    service = TestBed.inject(WorkOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    flushInitialData();
  });

  function flushInitialData(): void {
    httpMock.expectOne('data/work-centers.json').flush(MOCK_CENTERS);
    httpMock.expectOne('data/work-orders.json').flush(MOCK_ORDERS);
  }

  it('should load work centers', (done) => {
    flushInitialData();
    service.workCenters.pipe(take(1)).subscribe((centers) => {
      expect(centers.length).toBeGreaterThan(0);
      expect(centers[0].docId).toBeDefined();
      expect(centers[0].docType).toBe('workCenter');
      expect(centers[0].data.name).toBeDefined();
      done();
    });
  });

  it('should load work orders', (done) => {
    flushInitialData();
    service.workOrders.pipe(take(1)).subscribe((orders) => {
      expect(orders.length).toBeGreaterThan(0);
      expect(orders[0].docId).toBeDefined();
      expect(orders[0].data.workCenterId).toBeDefined();
      expect(orders[0].data.status).toBeDefined();
      done();
    });
  });

  it('should create work order', (done) => {
    flushInitialData();
    service.workOrders.pipe(take(1)).subscribe((orders) => {
      const initialCount = orders.length;
      service.createWorkOrder({
        name: 'Test Order',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2025-06-15',
        endDate: '2025-06-22',
      });
      const newOrders = service.getWorkOrders();
      expect(newOrders.length).toBe(initialCount + 1);
      expect(newOrders[newOrders.length - 1].data.name).toBe('Test Order');
      done();
    });
  });

  it('should delete work order', (done) => {
    flushInitialData();
    service.workOrders.pipe(take(1)).subscribe((orders) => {
      expect(orders.length).toBeGreaterThan(0);
      const docId = orders[0].docId;
      service.deleteWorkOrder(docId);
      const remaining = service.getWorkOrders();
      expect(remaining.find((o) => o.docId === docId)).toBeUndefined();
      done();
    });
  });

  it('should detect overlap', (done) => {
    httpMock.expectOne('data/work-centers.json').flush(MOCK_CENTERS);
    httpMock.expectOne('data/work-orders.json').flush([]);
    service.workOrders.pipe(take(1)).subscribe(() => {
      service.createWorkOrder({
        name: 'Order 2',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2025-06-01',
        endDate: '2025-06-10',
      });

      const overlap = service.checkOverlap('wc-1', '2025-06-05', '2025-06-15');
      expect(overlap).toBe(true);

      const noOverlap = service.checkOverlap('wc-1', '2025-06-15', '2025-06-20');
      expect(noOverlap).toBe(false);

      // Same-day handoff: new order starts the day existing order ends — allowed
      const sameDayHandoff = service.checkOverlap('wc-1', '2025-06-10', '2025-06-20');
      expect(sameDayHandoff).toBe(false);
      done();
    });
  });

  it('should persist work orders to localStorage on create', (done) => {
    flushInitialData();
    service.workOrders.pipe(take(1)).subscribe((orders) => {
      const initialCount = orders.length;
      service.createWorkOrder({
        name: 'Persisted Order',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2025-06-15',
        endDate: '2025-06-22',
      });
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(initialCount + 1);
      expect(parsed.some((o: { data: { name: string } }) => o.data.name === 'Persisted Order')).toBe(true);
      done();
    });
  });

  it('should persist work orders to localStorage on update', (done) => {
    flushInitialData();
    service.workOrders.pipe(take(1)).subscribe((orders) => {
      const docId = orders[0].docId;
      service.updateWorkOrder(docId, {
        name: 'Updated Name',
        status: 'complete',
        startDate: '2025-06-02',
        endDate: '2025-06-12',
      });
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      const updated = parsed.find((o: { docId: string }) => o.docId === docId);
      expect(updated).toBeTruthy();
      expect(updated.data.name).toBe('Updated Name');
      expect(updated.data.status).toBe('complete');
      done();
    });
  });

  describe('when localStorage has work orders', () => {
    beforeEach(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ORDERS));
      }
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [WorkOrderService],
      });
      service = TestBed.inject(WorkOrderService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('should load work orders from localStorage', (done) => {
      httpMock.expectOne('data/work-centers.json').flush(MOCK_CENTERS);
      service.workOrders.pipe(take(1)).subscribe((orders) => {
        expect(orders).toEqual(MOCK_ORDERS);
        done();
      });
    });
  });

  describe('when ?reset=1 in querystring', () => {
    let originalHref: string;

    beforeEach(() => {
      if (typeof window !== 'undefined') {
        originalHref = window.location.href;
        window.history.replaceState(null, '', window.location.pathname + '?reset=1');
        localStorage.clear();
        localStorage.setItem(STORAGE_KEY, JSON.stringify([{ docId: 'stale', docType: 'workOrder', data: {} }]));
      }
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [WorkOrderService],
      });
      service = TestBed.inject(WorkOrderService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', originalHref);
      }
    });

    it('should clear localStorage and load from JSON', (done) => {
      httpMock.expectOne('data/work-centers.json').flush(MOCK_CENTERS);
      httpMock.expectOne('data/work-orders.json').flush(MOCK_ORDERS);
      service.workOrders.pipe(take(1)).subscribe((orders) => {
        expect(orders).toEqual(MOCK_ORDERS);
        expect(localStorage.getItem(STORAGE_KEY)).toContain('wo-1');
        done();
      });
    });
  });
});
