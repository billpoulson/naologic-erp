import { Component, input, output, effect, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import type { WorkOrderDocument } from '../../models/work-order';
import type { WorkOrderStatus } from '../../models/work-order';
import { WorkOrderService } from '../../services/work-order.service';

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'blocked', label: 'Blocked' },
];

function dateToNgb(date: Date): NgbDateStruct {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function ngbToDate(ngb: NgbDateStruct): Date {
  return new Date(ngb.year, ngb.month - 1, ngb.day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

@Component({
  selector: 'app-work-order-panel',
  standalone: true,
  imports: [ReactiveFormsModule, NgbDatepickerModule, NgSelectModule, CommonModule],
  template: `
    @if (visible() || isClosing()) {
      <div class="panel-backdrop" [class.closing]="isClosing()" (click)="requestClose()" aria-hidden="true"></div>
      <div
        class="panel"
        [class.closing]="isClosing()"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        aria-describedby="panel-desc"
        (keydown)="onPanelKeydown($event)"
        #panelEl
      >
        <div class="panel-header">
          <div class="panel-header-content">
            <h2 id="panel-title">Work Order Details</h2>
            <p id="panel-desc" class="panel-subtitle">Specify the dates, name and status for this order.</p>
          </div>
          <div class="panel-header-actions">
            <button type="button" class="btn btn-cancel" (click)="requestClose()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" form="panel-form" [disabled]="form.invalid">
              {{ mode() === 'create' ? 'Create' : 'Save' }}
            </button>
          </div>
        </div>
        <div class="panel-header-border"></div>
        <form id="panel-form" [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="panel-name">Work Order Name</label>
            <input
              id="panel-name"
              type="text"
              formControlName="name"
              placeholder="Acme Inc."
              class="form-control"
              [attr.aria-invalid]="form.get('name')?.invalid && form.get('name')?.touched"
              [attr.aria-describedby]="(form.get('name')?.invalid && form.get('name')?.touched) ? 'panel-name-error' : null"
            />
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <span id="panel-name-error" class="error" role="alert">Required</span>
            }
          </div>
          <div class="form-group">
            <label for="panel-status">Status</label>
            <ng-select
              id="panel-status"
              formControlName="status"
              [items]="statusOptions"
              bindLabel="label"
              bindValue="value"
              [clearable]="false"
              [searchable]="false"
              placeholder=""
              class="status-select"
              aria-label="Status"
            >
              <ng-template ng-label-tmp let-item="item">
                @if (item) {
                  <span class="status-pill" [class]="'status-pill-' + item.value">
                    {{ item.label }}
                  </span>
                } @else {
                  <span class="status-placeholder">Select status...</span>
                }
              </ng-template>
              <ng-template ng-option-tmp let-item="item">
                <span class="status-option">{{ item.label }}</span>
              </ng-template>
            </ng-select>
          </div>
          <div class="form-group">
            <label for="panel-start-date">Start Date</label>
            <input
              id="panel-start-date"
              class="form-control"
              placeholder="MM.DD.YYYY"
              ngbDatepicker
              #dpStart="ngbDatepicker"
              (click)="dpStart.toggle()"
              formControlName="startDate"
              aria-label="Start date"
            />
          </div>
          <div class="form-group">
            <label for="panel-end-date">End Date</label>
            <input
              id="panel-end-date"
              class="form-control"
              placeholder="MM.DD.YYYY"
              ngbDatepicker
              #dpEnd="ngbDatepicker"
              (click)="dpEnd.toggle()"
              formControlName="endDate"
              aria-label="End date"
            />
          </div>
          @if (overlapError()) {
            <div class="error-message" role="alert" aria-live="polite">Work orders cannot overlap on the same work center.</div>
          }
        </form>
      </div>
    }
  `,
  styleUrls: ['./work-order-panel.component.scss'],
})
export class WorkOrderPanelComponent implements AfterViewChecked {
  @ViewChild('panelEl') panelEl?: ElementRef<HTMLElement>;

  visible = input<boolean>(false);
  mode = input<'create' | 'edit'>('create');
  workOrder = input<WorkOrderDocument | null>(null);
  initialDate = input<Date | null>(null);
  workCenterId = input<string | null>(null);

  close = output<void>();
  save = output<WorkOrderDocument['data']>();

  form!: FormGroup;
  statusOptions = STATUS_OPTIONS;
  overlapError = signal(false);
  isClosing = signal(false);
  private focusPending = false;

  constructor(
    private fb: FormBuilder,
    private workOrderService: WorkOrderService
  ) {
    this.form = this.fb.group(
      {
        name: ['', Validators.required],
        status: ['open', Validators.required],
        startDate: [null as NgbDateStruct | null, Validators.required],
        endDate: [null as NgbDateStruct | null, Validators.required],
      },
      { validators: (c) => this.dateRangeValidator(c) }
    );

    effect(() => {
      if (this.visible()) {
        this.overlapError.set(false);
        this.focusPending = true;
        if (this.mode() === 'edit' && this.workOrder()) {
          const wo = this.workOrder()!;
          this.form.patchValue({
            name: wo.data.name,
            status: wo.data.status,
            startDate: dateToNgb(new Date(wo.data.startDate)),
            endDate: dateToNgb(new Date(wo.data.endDate)),
          });
        } else {
          const initDate = this.initialDate();
          const start = initDate ? dateToNgb(initDate) : null;
          const end = initDate ? dateToNgb(addDays(initDate, 7)) : null;
          this.form.patchValue({
            name: '',
            status: 'open',
            startDate: start,
            endDate: end,
          });
        }
      }
    });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const start = ngbToDate(this.form.value.startDate);
    const end = ngbToDate(this.form.value.endDate);
    if (end <= start) {
      return;
    }

    const workCenterId = this.mode() === 'edit'
      ? this.workOrder()!.data.workCenterId
      : this.workCenterId()!;

    // When editing, exclude the record being edited so it never collides with itself
    // (whether changing dates, status, name, or any combination)
    const excludeDocId = this.mode() === 'edit' ? this.workOrder()?.docId : undefined;
    const overlap = this.workOrderService.checkOverlap(
      workCenterId,
      start.toISOString().slice(0, 10),
      end.toISOString().slice(0, 10),
      excludeDocId
    );

    if (overlap) {
      this.overlapError.set(true);
      return;
    }

    this.save.emit({
      name: this.form.value.name,
      workCenterId,
      status: this.form.value.status,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });
    this.requestClose();
  }

  ngAfterViewChecked(): void {
    if (this.focusPending && this.visible() && this.panelEl) {
      this.focusPending = false;
      const firstInput = this.panelEl.nativeElement.querySelector<HTMLInputElement>('#panel-name');
      firstInput?.focus();
    }
  }

  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestClose();
    }
  }

  requestClose(): void {
    if (this.isClosing()) return;
    this.isClosing.set(true);
    setTimeout(() => {
      this.close.emit();
      this.isClosing.set(false);
    }, 200);
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startDate')?.value as NgbDateStruct | null;
    const end = control.get('endDate')?.value as NgbDateStruct | null;
    if (!start || !end) return null;
    const startDate = ngbToDate(start);
    const endDate = ngbToDate(end);
    return endDate > startDate ? null : { dateRange: true };
  }
}