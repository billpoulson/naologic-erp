import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { WorkOrderPanelComponent } from './work-order-panel.component';
import { WorkOrderService } from '../../services/work-order.service';
import type { WorkOrderDocument } from '../../models/work-order';

const createWorkOrder = (overrides: Partial<WorkOrderDocument> = {}): WorkOrderDocument => ({
  docId: 'wo-1',
  docType: 'workOrder',
  data: {
    name: 'Test Order',
    workCenterId: 'wc-1',
    status: 'open',
    startDate: '2025-06-01',
    endDate: '2025-06-10',
  },
  ...overrides,
});

function ngb(year: number, month: number, day: number): NgbDateStruct {
  return { year, month, day };
}

describe('WorkOrderPanelComponent', () => {
  let component: WorkOrderPanelComponent;
  let fixture: ComponentFixture<WorkOrderPanelComponent>;
  let workOrderService: jasmine.SpyObj<WorkOrderService>;

  beforeEach(async () => {
    workOrderService = jasmine.createSpyObj('WorkOrderService', ['checkOverlap']);
    workOrderService.checkOverlap.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [
        WorkOrderPanelComponent,
        ReactiveFormsModule,
        NgbDatepickerModule,
        NgSelectModule,
      ],
      providers: [{ provide: WorkOrderService, useValue: workOrderService }],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkOrderPanelComponent);
    component = fixture.componentInstance;
  });

  describe('create mode', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('visible', true);
      fixture.componentRef.setInput('mode', 'create');
      fixture.componentRef.setInput('workCenterId', 'wc-1');
      fixture.componentRef.setInput('initialDate', new Date(2025, 5, 15)); // June 15, 2025
      fixture.detectChanges();
    });

    it('should show Create button', () => {
      const btn = fixture.nativeElement.querySelector('.btn-primary');
      expect(btn?.textContent?.trim()).toBe('Create');
    });

    it('should prefill dates from initialDate', () => {
      expect(component.form.get('startDate')?.value).toEqual(ngb(2025, 6, 15));
      expect(component.form.get('endDate')?.value).toEqual(ngb(2025, 6, 22));
    });

    it('should prefill empty name and open status', () => {
      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('status')?.value).toBe('open');
    });

    it('should emit save with form data on submit', (done) => {
      component.form.patchValue({
        name: 'New Order',
        status: 'in-progress',
        startDate: ngb(2025, 6, 20),
        endDate: ngb(2025, 6, 27),
      });
      component.save.subscribe((data) => {
        expect(data).toEqual({
          name: 'New Order',
          workCenterId: 'wc-1',
          status: 'in-progress',
          startDate: '2025-06-20',
          endDate: '2025-06-27',
        });
        done();
      });
      component.onSubmit();
    });

    it('should not emit save when form invalid', () => {
      component.form.patchValue({ name: '', startDate: null, endDate: null });
      let emitted = false;
      component.save.subscribe(() => (emitted = true));
      component.onSubmit();
      expect(emitted).toBe(false);
    });

    it('should not emit save when end date before start date', () => {
      component.form.patchValue({
        name: 'Bad Dates',
        startDate: ngb(2025, 6, 20),
        endDate: ngb(2025, 6, 15),
      });
      let emitted = false;
      component.save.subscribe(() => (emitted = true));
      component.onSubmit();
      expect(emitted).toBe(false);
    });

    it('should show overlap error and not emit when overlap detected', () => {
      workOrderService.checkOverlap.and.returnValue(true);
      component.form.patchValue({
        name: 'Overlap Order',
        startDate: ngb(2025, 6, 1),
        endDate: ngb(2025, 6, 10),
      });
      let emitted = false;
      component.save.subscribe(() => (emitted = true));
      component.onSubmit();
      expect(emitted).toBe(false);
      expect(component.overlapError()).toBe(true);
    });
  });

  describe('edit mode', () => {
    const existingOrder = createWorkOrder({
      data: {
        name: 'Existing Order',
        workCenterId: 'wc-1',
        status: 'in-progress',
        startDate: '2025-06-01',
        endDate: '2025-06-15',
      },
    });

    beforeEach(() => {
      fixture.componentRef.setInput('visible', true);
      fixture.componentRef.setInput('mode', 'edit');
      fixture.componentRef.setInput('workOrder', existingOrder);
      fixture.detectChanges();
    });

    it('should show Save button', () => {
      const btn = fixture.nativeElement.querySelector('.btn-primary');
      expect(btn?.textContent?.trim()).toBe('Save');
    });

    it('should prefill form with work order data', () => {
      expect(component.form.get('name')?.value).toBe('Existing Order');
      expect(component.form.get('status')?.value).toBe('in-progress');
      const start = component.form.get('startDate')?.value as NgbDateStruct;
      const end = component.form.get('endDate')?.value as NgbDateStruct;
      expect(start?.year).toBe(2025);
      expect(end?.year).toBe(2025);
      expect(start?.month).toBeGreaterThanOrEqual(5);
      expect(start?.month).toBeLessThanOrEqual(6);
      expect(end?.month).toBeGreaterThanOrEqual(5);
      expect(end?.month).toBeLessThanOrEqual(6);
    });

    it('should emit save with updated data on submit', (done) => {
      component.form.patchValue({
        name: 'Updated Name',
        status: 'complete',
        startDate: ngb(2025, 6, 2),
        endDate: ngb(2025, 6, 12),
      });
      component.save.subscribe((data) => {
        expect(data).toEqual({
          name: 'Updated Name',
          workCenterId: 'wc-1',
          status: 'complete',
          startDate: '2025-06-02',
          endDate: '2025-06-12',
        });
        done();
      });
      component.onSubmit();
    });

    it('should exclude current docId when checking overlap', () => {
      component.form.patchValue({
        name: 'Same Order',
        startDate: ngb(2025, 6, 1),
        endDate: ngb(2025, 6, 15),
      });
      component.onSubmit();
      expect(workOrderService.checkOverlap).toHaveBeenCalledWith(
        'wc-1',
        '2025-06-01',
        '2025-06-15',
        'wo-1'
      );
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('visible', true);
      fixture.componentRef.setInput('mode', 'create');
      fixture.componentRef.setInput('workCenterId', 'wc-1');
      fixture.componentRef.setInput('initialDate', new Date(2025, 5, 15));
      fixture.detectChanges();
    });

    it('should disable submit when name empty', () => {
      component.form.patchValue({
        name: '',
        startDate: ngb(2025, 6, 15),
        endDate: ngb(2025, 6, 22),
      });
      component.form.markAllAsTouched();
      expect(component.form.invalid).toBe(true);
    });

    it('should show Required error when name touched and empty', () => {
      component.form.get('name')?.setValue('');
      component.form.get('name')?.markAsTouched();
      fixture.detectChanges();
      const errorEl = fixture.nativeElement.querySelector('#panel-name-error');
      expect(errorEl?.textContent?.trim()).toBe('Required');
    });
  });

  describe('close behavior', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('visible', true);
      fixture.componentRef.setInput('mode', 'create');
      fixture.componentRef.setInput('workCenterId', 'wc-1');
      fixture.detectChanges();
    });

    it('should emit close on Cancel click', fakeAsync(() => {
      let emitted = false;
      component.close.subscribe(() => (emitted = true));
      const cancelBtn = fixture.nativeElement.querySelector('.btn-cancel');
      cancelBtn?.click();
      tick(250);
      expect(emitted).toBe(true);
    }));

    it('should emit close on Escape key', fakeAsync(() => {
      let emitted = false;
      component.close.subscribe(() => (emitted = true));
      const panel = fixture.nativeElement.querySelector('.panel');
      panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      tick(250);
      expect(emitted).toBe(true);
    }));
  });

  describe('when not visible', () => {
    it('should not render panel', () => {
      fixture.componentRef.setInput('visible', false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.panel')).toBeNull();
    });
  });
});
