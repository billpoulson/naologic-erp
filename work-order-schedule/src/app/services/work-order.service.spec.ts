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
      const created = service.createWorkOrder({
        name: 'Test Order',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2025-06-15',
        endDate: '2025-06-22',
      });
      const newOrders = service.getWorkOrders();
      expect(newOrders.length).toBe(initialCount + 1);
      expect(newOrders[newOrders.length - 1].data.name).toBe('Test Order');
      expect(created.docType).toBe('workOrder');
      expect(created.docId).toMatch(/^wo-\d+$/);
      expect(created.data).toEqual({
        name: 'Test Order',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2025-06-15',
        endDate: '2025-06-22',
      });
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
      const created = service.createWorkOrder({
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

      // Edit scenario: same date range as existing order, exclude that order — no overlap
      const editSameDates = service.checkOverlap(
        'wc-1',
        '2025-06-01',
        '2025-06-10',
        created.docId
      );
      expect(editSameDates).toBe(false);
      done();
    });
  });

  describe('checkOverlap excludeDocId (edit: do not check overlap with self)', () => {
    const ORDERS_TWO_ON_WC1: WorkOrderDocument[] = [
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
      {
        docId: 'wo-2',
        docType: 'workOrder',
        data: {
          name: 'Order 2',
          workCenterId: 'wc-1',
          status: 'open',
          startDate: '2025-06-15',
          endDate: '2025-06-22',
        },
      },
    ];

    beforeEach(() => {
      httpMock.expectOne('data/work-centers.json').flush(MOCK_CENTERS);
      httpMock.expectOne('data/work-orders.json').flush(ORDERS_TWO_ON_WC1);
    });

    it('should not overlap with self when editing same dates', (done) => {
      service.workOrders.pipe(take(1)).subscribe(() => {
        const overlap = service.checkOverlap('wc-1', '2025-06-01', '2025-06-10', 'wo-1');
        expect(overlap).toBe(false);
        done();
      });
    });

    it('should not overlap with self when editing and changing dates within gap', (done) => {
      service.workOrders.pipe(take(1)).subscribe(() => {
        const overlap = service.checkOverlap('wc-1', '2025-06-11', '2025-06-14', 'wo-1');
        expect(overlap).toBe(false);
        done();
      });
    });

    it('should detect overlap with other order when editing wo-1 to overlap wo-2', (done) => {
      service.workOrders.pipe(take(1)).subscribe(() => {
        const overlap = service.checkOverlap('wc-1', '2025-06-05', '2025-06-20', 'wo-1');
        expect(overlap).toBe(true);
        done();
      });
    });

    it('should not overlap with self when only status changed (same dates)', (done) => {
      service.workOrders.pipe(take(1)).subscribe(() => {
        const overlap = service.checkOverlap('wc-1', '2025-06-01', '2025-06-10', 'wo-1');
        expect(overlap).toBe(false);
        done();
      });
    });

    it('should overlap when create mode (no excludeDocId) with same dates as existing', (done) => {
      service.workOrders.pipe(take(1)).subscribe(() => {
        const overlap = service.checkOverlap('wc-1', '2025-06-01', '2025-06-10');
        expect(overlap).toBe(true);
        done();
      });
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

  it('should update work order with partial data', (done) => {
    flushInitialData();
    service.workOrders.pipe(take(1)).subscribe((orders) => {
      const docId = orders[0].docId;
      const original = orders[0];
      service.updateWorkOrder(docId, { name: 'Only Name Changed' });
      const updated = service.getWorkOrders().find((o) => o.docId === docId)!;
      expect(updated.data.name).toBe('Only Name Changed');
      expect(updated.data.workCenterId).toBe(original.data.workCenterId);
      expect(updated.data.status).toBe(original.data.status);
      expect(updated.data.startDate).toBe(original.data.startDate);
      expect(updated.data.endDate).toBe(original.data.endDate);
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

  describe('when ?empty=1 in querystring', () => {
    let originalHref: string;

    beforeEach(() => {
      if (typeof window !== 'undefined') {
        originalHref = window.location.href;
        window.history.replaceState(null, '', window.location.pathname + '?empty=1');
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

    it('should clear localStorage and load empty work orders', (done) => {
      httpMock.expectOne('data/work-centers.json').flush(MOCK_CENTERS);
      service.workOrders.pipe(take(1)).subscribe((orders) => {
        expect(orders).toEqual([]);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        done();
      });
    });
  });

  describe('when ?empty in querystring (no value)', () => {
    let originalHref: string;

    beforeEach(() => {
      if (typeof window !== 'undefined') {
        originalHref = window.location.href;
        window.history.replaceState(null, '', window.location.pathname + '?empty');
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

    it('should clear localStorage and load empty work orders', (done) => {
      httpMock.expectOne('data/work-centers.json').flush(MOCK_CENTERS);
      service.workOrders.pipe(take(1)).subscribe((orders) => {
        expect(orders).toEqual([]);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        done();
      });
    });
  });
});
