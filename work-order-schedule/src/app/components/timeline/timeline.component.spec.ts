import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineComponent } from './timeline.component';
import { TimelineCalculatorService } from '../../services/timeline-calculator.service';
import { TimelineRangeService } from '../../services/timeline-range.service';
import { TimelineAnnotationService } from '../../services/timeline-annotation.service';
import { TimelinePanService } from '../../services/timeline-pan.service';
import type { WorkCenterDocument } from '../../models/work-center';
import type { WorkOrderDocument } from '../../models/work-order';
const createWorkCenter = (id: string, name: string): WorkCenterDocument => ({
  docId: id,
  docType: 'workCenter',
  data: { name },
});

const createWorkOrder = (
  id: string,
  workCenterId: string,
  startDate: string,
  endDate: string
): WorkOrderDocument => ({
  docId: id,
  docType: 'workOrder',
  data: {
    name: `Order ${id}`,
    workCenterId,
    status: 'open',
    startDate,
    endDate,
  },
});

describe('TimelineComponent', () => {
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;

  const workCenters: WorkCenterDocument[] = [
    createWorkCenter('wc-1', 'Alpha'),
    createWorkCenter('wc-2', 'Beta'),
    createWorkCenter('wc-3', 'Gamma'),
  ];

  const workOrders: WorkOrderDocument[] = [
    createWorkOrder('wo-1', 'wc-1', '2025-02-01', '2025-02-07'),
    createWorkOrder('wo-2', 'wc-2', '2025-02-10', '2025-02-15'),
    createWorkOrder('wo-3', 'wc-3', '2025-03-01', '2025-03-10'),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineComponent],
      providers: [
        TimelineCalculatorService,
        TimelineRangeService,
        TimelineAnnotationService,
        TimelinePanService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('workCenters', workCenters);
    fixture.componentRef.setInput('workOrders', workOrders);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filteredWorkCenters', () => {
    it('should return all centers when no filters applied', () => {
      expect(component.filteredWorkCenters().length).toBe(3);
      expect(component.filteredWorkCenters().map((c) => c.data.name)).toEqual([
        'Alpha',
        'Beta',
        'Gamma',
      ]);
    });

    it('should filter by name (case-insensitive)', () => {
      component.filterQuery.set('alpha');
      fixture.detectChanges();
      expect(component.filteredWorkCenters().length).toBe(1);
      expect(component.filteredWorkCenters()[0].data.name).toBe('Alpha');

      component.filterQuery.set('BETA');
      fixture.detectChanges();
      expect(component.filteredWorkCenters().length).toBe(1);
      expect(component.filteredWorkCenters()[0].data.name).toBe('Beta');
    });

    it('should filter by date range (overlap)', () => {
      component.filterStartDate.set({ year: 2025, month: 2, day: 5 });
      component.filterEndDate.set({ year: 2025, month: 2, day: 12 });
      fixture.detectChanges();
      // wo-1: 01–07 overlaps 05–12; wo-2: 10–15 overlaps 05–12; wo-3: 03–10 does not
      expect(component.filteredWorkCenters().length).toBe(2);
      expect(component.filteredWorkCenters().map((c) => c.data.name)).toEqual(
        jasmine.arrayContaining(['Alpha', 'Beta'])
      );
    });

    it('should filter by start date only (order ends on or after start)', () => {
      component.filterStartDate.set({ year: 2025, month: 2, day: 10 });
      fixture.detectChanges();
      // wo-1: 01–07 ends before 10; wo-2: 10–15 overlaps; wo-3: 03–10 ends on 10
      expect(component.filteredWorkCenters().length).toBe(2);
      expect(component.filteredWorkCenters().map((c) => c.data.name)).toEqual(
        jasmine.arrayContaining(['Beta', 'Gamma'])
      );
    });

    it('should filter by end date only (order starts on or before end)', () => {
      component.filterEndDate.set({ year: 2025, month: 2, day: 5 });
      fixture.detectChanges();
      // wo-1: Feb 1–7 starts before Feb 5; wo-2: Feb 10–15 starts after Feb 5; wo-3: Mar 1–10 starts after Feb 5
      expect(component.filteredWorkCenters().length).toBe(1);
      expect(component.filteredWorkCenters()[0].data.name).toBe('Alpha');
    });

    it('should exclude centers with no overlapping orders when date filter applied', () => {
      component.filterStartDate.set({ year: 2025, month: 4, day: 1 });
      component.filterEndDate.set({ year: 2025, month: 4, day: 30 });
      fixture.detectChanges();
      expect(component.filteredWorkCenters().length).toBe(0);
    });

    it('should apply both name and date filters', () => {
      component.filterQuery.set('alpha');
      component.filterStartDate.set({ year: 2025, month: 2, day: 1 });
      component.filterEndDate.set({ year: 2025, month: 2, day: 28 });
      fixture.detectChanges();
      expect(component.filteredWorkCenters().length).toBe(1);
      expect(component.filteredWorkCenters()[0].data.name).toBe('Alpha');
    });
  });

  describe('hasDateFilter', () => {
    it('should be false when no date filter', () => {
      expect(component.hasDateFilter()).toBe(false);
    });

    it('should be true when only start date', () => {
      component.filterStartDate.set({ year: 2025, month: 2, day: 1 });
      fixture.detectChanges();
      expect(component.hasDateFilter()).toBe(true);
    });

    it('should be true when only end date', () => {
      component.filterEndDate.set({ year: 2025, month: 2, day: 28 });
      fixture.detectChanges();
      expect(component.hasDateFilter()).toBe(true);
    });

    it('should be true when both start and end dates set', () => {
      component.filterStartDate.set({ year: 2025, month: 2, day: 1 });
      component.filterEndDate.set({ year: 2025, month: 2, day: 28 });
      fixture.detectChanges();
      expect(component.hasDateFilter()).toBe(true);
    });
  });

  describe('clearDateFilter', () => {
    it('should clear both date filters', () => {
      component.filterStartDate.set({ year: 2025, month: 2, day: 1 });
      component.filterEndDate.set({ year: 2025, month: 2, day: 28 });
      component.clearDateFilter();
      expect(component.filterStartDate()).toBeNull();
      expect(component.filterEndDate()).toBeNull();
    });
  });
});
