import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineRowComponent } from './timeline-row.component';
import { TimelineCalculatorService } from '../../services/timeline-calculator.service';
import type { WorkCenterDocument } from '../../models/work-center';
import type { WorkOrderDocument } from '../../models/work-order';

const createWorkCenter = (): WorkCenterDocument => ({
  docId: 'wc-1',
  docType: 'workCenter',
  data: { name: 'Test Center' },
});

const createWorkOrder = (
  dataOverrides: Partial<WorkOrderDocument['data']> = {},
  docOverrides: Partial<Pick<WorkOrderDocument, 'docId'>> = {}
): WorkOrderDocument => ({
  docId: 'wo-1',
  docType: 'workOrder',
  ...docOverrides,
  data: {
    name: 'Test Order',
    workCenterId: 'wc-1',
    status: 'open',
    startDate: '2025-02-01',
    endDate: '2025-02-07',
    ...dataOverrides,
  },
});

describe('TimelineRowComponent', () => {
  let component: TimelineRowComponent;
  let fixture: ComponentFixture<TimelineRowComponent>;
  let calculator: TimelineCalculatorService;

  const rangeStart = new Date(2025, 0, 1); // Jan 1, 2025
  const rangeEnd = new Date(2025, 2, 31); // Mar 31, 2025
  const timelineWidth = 900;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineRowComponent],
      providers: [TimelineCalculatorService],
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineRowComponent);
    component = fixture.componentInstance;
    calculator = TestBed.inject(TimelineCalculatorService);

    fixture.componentRef.setInput('workCenter', createWorkCenter());
    fixture.componentRef.setInput('rangeStart', rangeStart);
    fixture.componentRef.setInput('rangeEnd', rangeEnd);
    fixture.componentRef.setInput('timelineWidth', timelineWidth);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render no bars when workOrders is empty', () => {
    fixture.componentRef.setInput('workOrders', []);
    fixture.detectChanges();
    const bars = fixture.nativeElement.querySelectorAll('app-work-order-bar');
    expect(bars.length).toBe(0);
  });

  describe('barPositions', () => {
    it('should position bar correctly for order within range', () => {
      const orders = [createWorkOrder({ startDate: '2025-02-01', endDate: '2025-02-07' })];
      fixture.componentRef.setInput('workOrders', orders);
      fixture.detectChanges();

      const barHost = fixture.nativeElement.querySelector('app-work-order-bar');
      const bar = barHost?.querySelector('.work-order-bar') as HTMLElement;
      expect(bar).toBeTruthy();
      const left = parseInt(bar.style.left || '0', 10);
      const width = parseInt(bar.style.width || '0', 10);

      const woStart = calculator.parseLocalDate('2025-02-01');
      const woEnd = calculator.parseLocalDate('2025-02-07');
      const woEndExclusive = new Date(woEnd);
      woEndExclusive.setDate(woEndExclusive.getDate() + 1);
      const expectedLeft = calculator.dateToPosition(
        woStart,
        rangeStart,
        rangeEnd,
        timelineWidth
      );
      const expectedRight = calculator.dateToPosition(
        woEndExclusive,
        rangeStart,
        rangeEnd,
        timelineWidth
      );
      const expectedWidth = Math.max(40, Math.round(expectedRight - expectedLeft));

      expect(Math.abs(left - expectedLeft)).toBeLessThan(2);
      expect(Math.abs(width - expectedWidth)).toBeLessThan(2);
      expect(width).toBeGreaterThanOrEqual(40);
    });

    it('should use parseLocalDate for correct positioning (avoid timezone shift)', () => {
      const orders = [createWorkOrder({ startDate: '2025-03-15', endDate: '2025-03-22' })];
      fixture.componentRef.setInput('workOrders', orders);
      fixture.detectChanges();

      const barHost = fixture.nativeElement.querySelector('app-work-order-bar');
      const bar = barHost?.querySelector('.work-order-bar') as HTMLElement;
      const left = parseInt(bar.style.left || '0', 10);
      const width = parseInt(bar.style.width || '0', 10);

      const woStart = calculator.parseLocalDate('2025-03-15');
      const woEnd = calculator.parseLocalDate('2025-03-22');
      const woEndExclusive = new Date(woEnd);
      woEndExclusive.setDate(woEndExclusive.getDate() + 1);
      expect(woStart.getDate()).toBe(15);
      expect(woEnd.getDate()).toBe(22);

      const expectedLeft = calculator.dateToPosition(woStart, rangeStart, rangeEnd, timelineWidth);
      const expectedRight = calculator.dateToPosition(
        woEndExclusive,
        rangeStart,
        rangeEnd,
        timelineWidth
      );
      expect(Math.abs(left - expectedLeft)).toBeLessThan(2);
      expect(Math.abs(width - Math.max(40, Math.round(expectedRight - expectedLeft)))).toBeLessThan(
        2
      );
    });

    it('should position multiple bars correctly', () => {
      const orders = [
        createWorkOrder({ startDate: '2025-01-10', endDate: '2025-01-15' }, { docId: 'wo-1' }),
        createWorkOrder({ startDate: '2025-02-10', endDate: '2025-02-17' }, { docId: 'wo-2' }),
      ];
      fixture.componentRef.setInput('workOrders', orders);
      fixture.detectChanges();

      const bars = fixture.nativeElement.querySelectorAll('app-work-order-bar');
      expect(bars.length).toBe(2);

      const bar1 = bars[0].querySelector('.work-order-bar') as HTMLElement;
      const bar2 = bars[1].querySelector('.work-order-bar') as HTMLElement;
      const left1 = parseInt(bar1.style.left || '0', 10);
      const left2 = parseInt(bar2.style.left || '0', 10);
      expect(left2).toBeGreaterThan(left1);
    });

    it('should enforce minimum width of 40px', () => {
      const orders = [createWorkOrder({ startDate: '2025-02-01', endDate: '2025-02-02' })];
      fixture.componentRef.setInput('workOrders', orders);
      fixture.detectChanges();

      const barHost = fixture.nativeElement.querySelector('app-work-order-bar');
      const bar = barHost?.querySelector('.work-order-bar') as HTMLElement;
      const width = parseInt(bar.style.width || '0', 10);
      expect(width).toBeGreaterThanOrEqual(40);
    });
  });
});
