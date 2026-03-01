import { Component, input, output, effect, signal, computed } from '@angular/core';
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

@Component({
  selector: 'app-work-order-panel',
  standalone: true,
  imports: [ReactiveFormsModule, NgbDatepickerModule, NgSelectModule, CommonModule],
  template: `
    @if (visible()) {
      <div class="panel-backdrop" (click)="close.emit()"></div>
      <div class="panel">
        <div class="panel-header">
          <h2>Work Order Details</h2>
          <p class="panel-subtitle">Specify the dates, name and status for this order.</p>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Work Order Name</label>
            <input
              type="text"
              formControlName="name"
              placeholder="Acme Inc."
              class="form-control"
            />
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <span class="error">Required</span>
            }
          </div>
          <div class="form-group">
            <label>Status</label>
            <ng-select
              formControlName="status"
              [items]="statusOptions"
              bindLabel="label"
              bindValue="value"
              placeholder="Select status..."
              class="status-select"
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
            <label>Start Date</label>
            <input
              class="form-control"
              placeholder="yyyy-mm-dd"
              ngbDatepicker
              #dpStart="ngbDatepicker"
              (click)="dpStart.toggle()"
              formControlName="startDate"
            />
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input
              class="form-control"
              placeholder="yyyy-mm-dd"
              ngbDatepicker
              #dpEnd="ngbDatepicker"
              (click)="dpEnd.toggle()"
              formControlName="endDate"
            />
          </div>
          @if (overlapError()) {
            <div class="error-message">Work orders cannot overlap on the same work center.</div>
          }
          <div class="panel-actions">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">
              Cancel
            </button>
            @if (mode() === 'edit') {
              <button type="button" class="btn btn-danger" (click)="onDelete()">
                Delete
              </button>
            }
            <button type="submit" class="btn btn-primary">
              {{ mode() === 'create' ? 'Create' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [
    `
      @use '../../../styles/variables' as *;

      .panel-backdrop {
        position: fixed;
        inset: 0;
        background: $panel-overlay;
        z-index: 1000;
      }

      .panel {
        position: fixed;
        top: 0;
        right: 0;
        width: $layout-panel-width;
        height: 100%;
        background: $color-bg-primary;
        box-shadow: $panel-shadow;
        z-index: 1001;
        padding: 24px;
        overflow-y: auto;
        animation: panelSlideIn 0.2s ease-out;
      }

      @keyframes panelSlideIn {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      .panel-header h2 {
        margin: 0 0 8px 0;
        font-size: 1.25rem;
      }

      .panel-subtitle {
        margin: 0 0 24px 0;
        font-size: 13px;
        color: $color-text-secondary;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        font-weight: 500;
      }

      .form-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid $color-border;
        border-radius: $radius-default;
      }

      .form-control:focus {
        border-color: $color-border-focus;
        outline: none;
        box-shadow: 0 0 0 1px $color-border-focus;
      }

      .status-select ::ng-deep .ng-select .ng-select-container {
        border: 1px solid $color-border;
        border-radius: $radius-default;
      }

      .status-select ::ng-deep .ng-select.ng-select-focused .ng-select-container {
        border-color: $color-border-focus;
        box-shadow: 0 0 0 1px $color-border-focus;
      }

      .status-pill {
        display: inline-block;
        font-size: 12px;
        padding: 2px 8px;
        border-radius: $radius-default;
      }

      .status-pill-open {
        border: 1px solid rgba(206, 251, 255, 1);
        border-radius: 5px;
        background-color: rgba(228, 253, 255, 1);
        color: rgba(0, 176, 191, 1);
        font-family: CircularStd-Regular;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
      }

      .status-pill-in-progress {
        background: $color-status-in-progress-bg;
        color: $color-status-in-progress;
      }

      .status-pill-complete {
        background: $color-status-complete-bg;
        color: $color-status-complete;
      }

      .status-pill-blocked {
        background: $color-status-blocked-bg;
        color: $color-status-blocked;
      }

      .status-option {
        font-size: 14px;
      }

      .status-placeholder {
        color: $color-text-secondary;
      }

      .error {
        color: #f44336;
        font-size: 12px;
      }

      .error-message {
        color: #f44336;
        font-size: 13px;
        margin-bottom: 16px;
      }

      .panel-actions {
        display: flex;
        gap: 8px;
        margin-top: 24px;
      }

      .btn {
        padding: 8px 16px;
        border-radius: $radius-default;
        cursor: pointer;
        font-size: 14px;
      }

      .btn-primary {
        background: $color-accent-primary;
        color: white;
        border: none;
      }

      .btn-secondary {
        background: $color-bg-primary;
        border: 1px solid $color-border;
        color: $color-text-primary;
      }

      .btn-danger {
        background: #f44336;
        color: white;
        border: none;
      }
    `,
  ],
})
export class WorkOrderPanelComponent {
  visible = input<boolean>(false);
  mode = input<'create' | 'edit'>('create');
  workOrder = input<WorkOrderDocument | null>(null);
  initialDate = input<Date | null>(null);
  workCenterId = input<string | null>(null);

  close = output<void>();
  save = output<WorkOrderDocument['data']>();
  delete = output<void>();

  form!: FormGroup;
  statusOptions = STATUS_OPTIONS;
  overlapError = signal(false);

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
        if (this.mode() === 'edit' && this.workOrder()) {
          const wo = this.workOrder()!;
          this.form.patchValue({
            name: wo.data.name,
            status: wo.data.status,
            startDate: dateToNgb(new Date(wo.data.startDate)),
            endDate: dateToNgb(new Date(wo.data.endDate)),
          });
        } else {
          const initDate = this.initialDate() ?? new Date();
          const endDate = new Date(initDate);
          endDate.setDate(endDate.getDate() + 7);
          this.form.patchValue({
            name: '',
            status: 'open',
            startDate: dateToNgb(initDate),
            endDate: dateToNgb(endDate),
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

    const excludeDocId = this.mode() === 'edit' ? this.workOrder()!.docId : undefined;
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
  }

  onDelete(): void {
    this.delete.emit();
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