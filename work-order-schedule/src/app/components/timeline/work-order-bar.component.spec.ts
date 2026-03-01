import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkOrderBarComponent } from './work-order-bar.component';
import type { WorkOrderDocument } from '../../models/work-order';

const createWorkOrder = (overrides: Partial<WorkOrderDocument> = {}): WorkOrderDocument => ({
  docId: 'wo-1',
  docType: 'workOrder',
  data: {
    name: 'Test Order',
    workCenterId: 'wc-1',
    status: 'open',
    startDate: '2025-02-01',
    endDate: '2025-02-07',
  },
  ...overrides,
});

describe('WorkOrderBarComponent', () => {
  let component: WorkOrderBarComponent;
  let fixture: ComponentFixture<WorkOrderBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkOrderBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkOrderBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('workOrder', createWorkOrder());
    fixture.componentRef.setInput('left', 100);
    fixture.componentRef.setInput('width', 200);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render work order name', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Test Order');
  });

  it('should apply left and width styles', () => {
    const bar = fixture.nativeElement.querySelector('.work-order-bar') as HTMLElement;
    expect(bar.style.left).toBe('100px');
    expect(bar.style.width).toBe('200px');
  });

  it('should apply status class', () => {
    fixture.componentRef.setInput('workOrder', createWorkOrder({ data: { ...createWorkOrder().data, status: 'complete' } }));
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.work-order-bar');
    expect(bar?.classList.contains('status-complete')).toBe(true);
  });

  describe('formatStatus', () => {
    it('should format in-progress as "In Progress"', () => {
      expect(component.formatStatus('in-progress')).toBe('In Progress');
    });

    it('should capitalize other statuses', () => {
      expect(component.formatStatus('open')).toBe('Open');
      expect(component.formatStatus('complete')).toBe('Complete');
      expect(component.formatStatus('blocked')).toBe('Blocked');
    });
  });

  describe('outputs', () => {
    it('should emit edit when Edit is clicked', (done) => {
      const wo = createWorkOrder();
      fixture.componentRef.setInput('workOrder', wo);
      fixture.detectChanges();

      component.edit.subscribe((emitted) => {
        expect(emitted).toBe(wo);
        done();
      });

      component.barHovered.set(true);
      component.menuOpen.set(true);
      fixture.detectChanges();

      const editBtn = fixture.nativeElement.querySelector('.bar-dropdown button');
      editBtn?.click();
    });

    it('should emit delete when Delete is clicked', (done) => {
      const wo = createWorkOrder();
      fixture.componentRef.setInput('workOrder', wo);
      fixture.detectChanges();

      component.delete.subscribe((emitted) => {
        expect(emitted).toBe(wo);
        done();
      });

      component.barHovered.set(true);
      component.menuOpen.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.bar-dropdown button');
      buttons[1]?.click();
    });
  });
});
