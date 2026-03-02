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

    it('should filter by date range (overlap when both dates set)', () => {
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

  describe('filter', () => {
    describe('name filter', () => {
      it('should return empty when no work center matches', () => {
        component.filterQuery.set('xyz');
        fixture.detectChanges();
        expect(component.filteredWorkCenters().length).toBe(0);
      });

      it('should match partial name', () => {
        component.filterQuery.set('alp');
        fixture.detectChanges();
        expect(component.filteredWorkCenters().length).toBe(1);
        expect(component.filteredWorkCenters()[0].data.name).toBe('Alpha');
      });

      it('should trim whitespace from query', () => {
        component.filterQuery.set('  beta  ');
        fixture.detectChanges();
        expect(component.filteredWorkCenters().length).toBe(1);
        expect(component.filteredWorkCenters()[0].data.name).toBe('Beta');
      });
    });

    describe('date filter (overlap)', () => {
      it('should include work order that ends exactly on filter start date', () => {
        component.filterStartDate.set({ year: 2025, month: 2, day: 7 });
        fixture.detectChanges();
        // wo-1: Feb 1–7 ends on Feb 7; wo-2, wo-3 also end on or after Feb 7
        expect(component.filteredWorkCenters().map((c) => c.data.name)).toContain('Alpha');
        expect(component.filteredWorkCenters().length).toBe(3);
      });

      it('should include work order that starts exactly on filter end date', () => {
        component.filterEndDate.set({ year: 2025, month: 2, day: 10 });
        fixture.detectChanges();
        // wo-1: starts Feb 1; wo-2: starts Feb 10; both on or before Feb 10
        expect(component.filteredWorkCenters().map((c) => c.data.name)).toContain('Beta');
        expect(component.filteredWorkCenters().length).toBe(2);
        expect(component.filteredWorkCenters().map((c) => c.data.name)).toEqual(
          jasmine.arrayContaining(['Alpha', 'Beta'])
        );
      });

      it('should include work order fully contained in filter range', () => {
        component.filterStartDate.set({ year: 2025, month: 2, day: 1 });
        component.filterEndDate.set({ year: 2025, month: 2, day: 28 });
        fixture.detectChanges();
        // wo-1 (01–07) and wo-2 (10–15) fully in Feb 1–28; wo-3 in March
        expect(component.filteredWorkCenters().length).toBe(2);
        expect(component.filteredWorkCenters().map((c) => c.data.name)).toEqual(
          jasmine.arrayContaining(['Alpha', 'Beta'])
        );
      });

      it('should include work order that extends beyond filter range', () => {
        component.filterStartDate.set({ year: 2025, month: 2, day: 12 });
        component.filterEndDate.set({ year: 2025, month: 2, day: 14 });
        fixture.detectChanges();
        // wo-2: Feb 10–15 extends beyond 12–14 but overlaps
        expect(component.filteredWorkCenters().length).toBe(1);
        expect(component.filteredWorkCenters()[0].data.name).toBe('Beta');
      });
    });

    describe('getOrdersForCenter with date filter', () => {
      it('should return only orders overlapping date filter for given center', () => {
        component.filterStartDate.set({ year: 2025, month: 2, day: 5 });
        component.filterEndDate.set({ year: 2025, month: 2, day: 12 });
        fixture.detectChanges();

        const alphaOrders = component.getOrdersForCenter('wc-1');
        expect(alphaOrders.length).toBe(1);
        expect(alphaOrders[0].docId).toBe('wo-1');

        const betaOrders = component.getOrdersForCenter('wc-2');
        expect(betaOrders.length).toBe(1);
        expect(betaOrders[0].docId).toBe('wo-2');

        const gammaOrders = component.getOrdersForCenter('wc-3');
        expect(gammaOrders.length).toBe(0);
      });

      it('should respect start-date-only filter in getOrdersForCenter', () => {
        component.filterStartDate.set({ year: 2025, month: 2, day: 10 });
        fixture.detectChanges();

        const alphaOrders = component.getOrdersForCenter('wc-1');
        expect(alphaOrders.length).toBe(0);

        const betaOrders = component.getOrdersForCenter('wc-2');
        expect(betaOrders.length).toBe(1);
      });
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

  describe('clearAllFilters', () => {
    it('should clear name and date filters', () => {
      component.filterQuery.set('alpha');
      component.filterStartDate.set({ year: 2025, month: 2, day: 1 });
      component.filterEndDate.set({ year: 2025, month: 2, day: 28 });
      component.clearAllFilters();
      expect(component.filterQuery()).toBe('');
      expect(component.filterStartDate()).toBeNull();
      expect(component.filterEndDate()).toBeNull();
    });
  });

  describe('keyboard navigation', () => {
    const scrollEl = (): HTMLElement =>
      fixture.nativeElement.querySelector('.timeline-scroll');

    const dispatchKey = (key: string): void => {
      scrollEl().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    };

    describe('Enter key', () => {
      it('should emit editRequest when Enter pressed with focused work order', () => {
        fixture.componentRef.setInput('focusedWorkOrderId', 'wo-1');
        fixture.detectChanges();

        let emitted: WorkOrderDocument | undefined;
        component.editRequest.subscribe((wo) => (emitted = wo));

        dispatchKey('Enter');

        expect(emitted).toBeDefined();
        expect(emitted?.docId).toBe('wo-1');
      });

      it('should not emit editRequest when Enter pressed with no focused work order', () => {
        fixture.componentRef.setInput('focusedWorkOrderId', null);
        fixture.detectChanges();

        let emitted = false;
        component.editRequest.subscribe(() => (emitted = true));

        dispatchKey('Enter');

        expect(emitted).toBe(false);
      });

      it('should emit createRequest when Enter pressed with focused empty slot', () => {
        fixture.componentRef.setInput('focusedWorkOrderId', 'wo-1');
        fixture.detectChanges();
        dispatchKey('ArrowRight');
        fixture.detectChanges();

        let createEmitted: { date: Date; workCenterId: string } | undefined;
        component.createRequest.subscribe((e) => (createEmitted = e));

        dispatchKey('Enter');

        expect(createEmitted).toBeDefined();
        expect(createEmitted?.workCenterId).toBe('wc-1');
        expect(createEmitted?.date).toBeInstanceOf(Date);
      });
    });

    describe('arrow keys', () => {
      it('should emit focusChange(null) when ArrowRight with no bar to the right (empty slot)', () => {
        let emitted: WorkOrderDocument | null | undefined;
        component.focusChange.subscribe((wo) => (emitted = wo));

        fixture.componentRef.setInput('focusedWorkOrderId', 'wo-1');
        fixture.detectChanges();
        dispatchKey('ArrowRight');

        expect(emitted).toBeDefined();
        expect(emitted).toBeNull();
      });

      it('should emit focusChange when ArrowDown moves to bar on next row', () => {
        let emitted: WorkOrderDocument | null | undefined;
        component.focusChange.subscribe((wo) => (emitted = wo));

        fixture.componentRef.setInput('focusedWorkOrderId', 'wo-1');
        fixture.detectChanges();
        dispatchKey('ArrowDown');

        expect(emitted).toBeDefined();
        expect(emitted?.docId).toBe('wo-2');
      });

      it('should set focusedEmptySlot when ArrowRight and no bar to the right', () => {
        fixture.componentRef.setInput('focusedWorkOrderId', 'wo-1');
        fixture.detectChanges();

        dispatchKey('ArrowRight');
        fixture.detectChanges();

        expect(component['focusedEmptySlot']()).not.toBeNull();
        expect(component['focusedEmptySlot']()?.workCenterId).toBe('wc-1');
      });

      it('should clear focusedEmptySlot when ArrowLeft from empty slot moves back to bar', () => {
        fixture.componentRef.setInput('focusedWorkOrderId', 'wo-1');
        fixture.detectChanges();
        dispatchKey('ArrowRight');
        fixture.detectChanges();
        expect(component['focusedEmptySlot']()).not.toBeNull();

        fixture.componentRef.setInput('focusedWorkOrderId', null);
        fixture.detectChanges();
        dispatchKey('ArrowLeft');
        fixture.detectChanges();
        expect(component['focusedEmptySlot']()).toBeNull();
      });

      it('should ignore non-arrow keys', () => {
        let focusEmitted = false;
        component.focusChange.subscribe(() => (focusEmitted = true));

        fixture.componentRef.setInput('focusedWorkOrderId', 'wo-1');
        fixture.detectChanges();
        dispatchKey('Tab');
        dispatchKey('a');

        expect(focusEmitted).toBe(false);
      });
    });

    describe('focusTimeline', () => {
      it('should focus the scroll container when focusTimeline is called', () => {
        fixture.detectChanges();
        const el = scrollEl() as HTMLElement;
        spyOn(el, 'focus');

        component.focusTimeline();

        expect(el.focus).toHaveBeenCalled();
      });
    });
  });
});
