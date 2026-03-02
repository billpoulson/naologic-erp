import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WorkOrderScheduleComponent } from './work-order-schedule.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { WorkOrderService } from '../../services/work-order.service';
import { ZoomLevelService } from '../../services/zoom-level.service';
import { TimelineRangeService } from '../../services/timeline-range.service';
import { TimelineCalculatorService } from '../../services/timeline-calculator.service';
import type { WorkCenterDocument } from '../../models/work-center';
import type { WorkOrderDocument } from '../../models/work-order';

const MOCK_CENTERS: WorkCenterDocument[] = [
  { docId: 'wc-1', docType: 'workCenter', data: { name: 'Alpha' } },
  { docId: 'wc-2', docType: 'workCenter', data: { name: 'Beta' } },
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

describe('WorkOrderScheduleComponent', () => {
  let component: WorkOrderScheduleComponent;
  let fixture: ComponentFixture<WorkOrderScheduleComponent>;
  let workOrderService: WorkOrderService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    await TestBed.configureTestingModule({
      imports: [WorkOrderScheduleComponent, HttpClientTestingModule],
      providers: [
        WorkOrderService,
        ZoomLevelService,
        TimelineRangeService,
        TimelineCalculatorService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkOrderScheduleComponent);
    component = fixture.componentInstance;
    workOrderService = TestBed.inject(WorkOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushInitialData(): void {
    httpMock.expectOne('data/work-centers.json').flush(MOCK_CENTERS);
    httpMock.expectOne('data/work-orders.json').flush(MOCK_ORDERS);
  }

  it('should create', () => {
    flushInitialData();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('onCreateRequest', () => {
    beforeEach(() => {
      flushInitialData();
      fixture.detectChanges();
    });

    it('should open panel in create mode', () => {
      component.onCreateRequest({ date: new Date(2025, 5, 15), workCenterId: 'wc-1' });
      expect(component.panelVisible()).toBe(true);
      expect(component.panelMode()).toBe('create');
      expect(component.selectedWorkOrder()).toBeNull();
      expect(component.clickContext()?.workCenterId).toBe('wc-1');
    });
  });

  describe('onEditRequest', () => {
    beforeEach(() => {
      flushInitialData();
      fixture.detectChanges();
    });

    it('should open panel in edit mode with selected work order', () => {
      const wo = MOCK_ORDERS[0];
      component.onEditRequest(wo);
      expect(component.panelVisible()).toBe(true);
      expect(component.panelMode()).toBe('edit');
      expect(component.selectedWorkOrder()).toBe(wo);
      expect(component.clickContext()).toBeNull();
    });
  });

  describe('onPanelSave', () => {
    beforeEach(() => {
      flushInitialData();
      fixture.detectChanges();
    });

    it('should call createWorkOrder when in create mode', () => {
      const created: WorkOrderDocument = {
        docId: 'wo-new',
        docType: 'workOrder',
        data: {
          name: 'New Order',
          workCenterId: 'wc-1',
          status: 'open',
          startDate: '2025-06-15',
          endDate: '2025-06-22',
        },
      };
      spyOn(workOrderService, 'createWorkOrder').and.returnValue(created);
      component.panelMode.set('create');
      component.onPanelSave({
        name: 'New Order',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2025-06-15',
        endDate: '2025-06-22',
      });
      expect(workOrderService.createWorkOrder).toHaveBeenCalledWith({
        name: 'New Order',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2025-06-15',
        endDate: '2025-06-22',
      });
    });

    it('should focus the created work order in the timeline', () => {
      const created: WorkOrderDocument = {
        docId: 'wo-new',
        docType: 'workOrder',
        data: {
          name: 'New Order',
          workCenterId: 'wc-1',
          status: 'open',
          startDate: '2025-06-15',
          endDate: '2025-06-22',
        },
      };
      spyOn(workOrderService, 'createWorkOrder').and.returnValue(created);
      component.panelMode.set('create');
      component.onPanelSave({
        name: 'New Order',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2025-06-15',
        endDate: '2025-06-22',
      });
      expect(component.focusedWorkOrderId()).toBe('wo-new');
    });

    it('should call updateWorkOrder when in edit mode', () => {
      spyOn(workOrderService, 'updateWorkOrder');
      component.panelMode.set('edit');
      component.selectedWorkOrder.set(MOCK_ORDERS[0]);
      component.onPanelSave({
        name: 'Updated Order',
        workCenterId: 'wc-1',
        status: 'complete',
        startDate: '2025-06-02',
        endDate: '2025-06-12',
      });
      expect(workOrderService.updateWorkOrder).toHaveBeenCalledWith('wo-1', {
        name: 'Updated Order',
        workCenterId: 'wc-1',
        status: 'complete',
        startDate: '2025-06-02',
        endDate: '2025-06-12',
      });
    });
  });

  describe('onDeleteRequest', () => {
    beforeEach(() => {
      flushInitialData();
      fixture.detectChanges();
    });

    it('should call deleteWorkOrder on service', () => {
      spyOn(workOrderService, 'deleteWorkOrder');
      component.onDeleteRequest(MOCK_ORDERS[0]);
      expect(workOrderService.deleteWorkOrder).toHaveBeenCalledWith('wo-1');
    });
  });

  describe('onPanelClose', () => {
    beforeEach(() => {
      flushInitialData();
      fixture.detectChanges();
    });

    it('should hide panel and clear state', () => {
      component.panelVisible.set(true);
      component.selectedWorkOrder.set(MOCK_ORDERS[0]);
      component.clickContext.set({ date: new Date(), workCenterId: 'wc-1' });
      component.onPanelClose();
      expect(component.panelVisible()).toBe(false);
      expect(component.selectedWorkOrder()).toBeNull();
      expect(component.clickContext()).toBeNull();
    });
  });

  describe('keyboard navigation', () => {
    beforeEach(() => {
      flushInitialData();
      fixture.detectChanges();
    });

    it('should focus timeline on panel close to resume keyboard control', fakeAsync(() => {
      const timeline = fixture.debugElement.query(
        (p) => p.componentInstance instanceof TimelineComponent
      )?.componentInstance as TimelineComponent;
      spyOn(timeline, 'focusTimeline');

      component.onPanelClose();

      tick(250);
      expect(timeline.focusTimeline).toHaveBeenCalled();
    }));
  });
});
