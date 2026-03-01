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
    @if (visible() || isClosing()) {
      <div class="panel-backdrop" [class.closing]="isClosing()" (click)="requestClose()"></div>
      <div class="panel" [class.closing]="isClosing()">
        <div class="panel-header">
          <div class="panel-header-content">
            <h2>Work Order Details</h2>
            <p class="panel-subtitle">Specify the dates, name and status for this order.</p>
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
              [clearable]="false"
              [searchable]="false"
              placeholder=""
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
              placeholder="DD.MM.YYYY"
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
              placeholder="DD.MM.YYYY"
              ngbDatepicker
              #dpEnd="ngbDatepicker"
              (click)="dpEnd.toggle()"
              formControlName="endDate"
            />
          </div>
          @if (overlapError()) {
            <div class="error-message">Work orders cannot overlap on the same work center.</div>
          }
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
        background-color: rgba(247, 249, 252, 0.5);
        z-index: 1000;
      }

      .panel-backdrop.closing {
        animation: backdropFadeOut 0.2s ease-in forwards;
      }

      @keyframes backdropFadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }

      .panel {
        position: fixed;
        top: 0;
        right: 0;
        width: $layout-panel-width;
        height: 100%;
        background-color: rgba(255, 255, 255, 1);
        box-shadow: 0 5px 15px 0 rgba(216, 220, 235, 1), 0 2.5px 3px -1.5px rgba(200, 207, 233, 1), 0 4.5px 5px -1px rgba(216, 220, 235, 1);
        border-radius: 12px 0 0 12px;
        z-index: 1001;
        padding: 0 24px 24px 24px;
        overflow-y: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        animation: panelSlideIn 0.2s ease-out;
      }

      .panel::-webkit-scrollbar {
        display: none;
      }

      .panel.closing {
        animation: panelSlideOut 0.2s ease-in forwards;
      }

      @keyframes panelSlideOut {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(100%);
        }
      }

      @keyframes panelSlideIn {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        padding-top: 16px;
      }

      .panel-header-content {
        flex: 1;
        min-width: 0;
      }

      .panel-header h2 {
        margin: 0 0 5px 0;
        color: rgba(47, 48, 89, 1);
        font-family: CircularStd-Medium, 'Circular-Std', sans-serif;
        font-size: 20px;
        font-weight: 500;
        font-style: normal;
      }

      .panel-subtitle {
        margin: 0 0 16px 0;
        color: rgba(104, 113, 150, 1);
        font-family: CircularStd-Book, 'Circular-Std', sans-serif;
        font-size: 16px;
        font-weight: 400;
        font-style: normal;
      }

      .panel-header-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
        margin-top: 10px;
      }

      .panel-header-border {
        width: calc(100% + 48px);
        margin-left: -24px;
        margin-right: -24px;
        height: 0;
        border-top: 1px solid rgba(230, 235, 240, 1);
      }

      #panel-form {
        padding-top: 24px;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        margin-bottom: 0;
        color: rgba(104, 113, 150, 1);
        font-family: CircularStd-Regular;
        font-size: 14px;
        font-weight: 500;
      }

      .form-group label + * {
        margin-top: 8px;
      }

      .form-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid $color-border;
        border-radius: 5px;
      }

      .form-control::placeholder {
        color: rgba(164, 170, 192, 1);
        font-family: CircularStd-Regular;
        font-size: 14px;
        font-weight: 500;
      }

      .form-control:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(170, 175, 255, 1);
        border-radius: 5px;
        background-color: rgba(255, 255, 255, 1);
      }

      .status-select ::ng-deep .ng-select .ng-select-container {
        border: 1px solid rgba(224, 224, 224, 1) !important;
        border-radius: 5px;
        overflow: hidden;
        background-color: rgba(255, 255, 255, 1);
        min-height: 38px;
      }

      .status-select ::ng-deep .ng-select.ng-has-value .ng-placeholder {
        display: none;
      }

      .status-select ::ng-deep .ng-select.ng-select-focused .ng-select-container,
      .status-select ::ng-deep .ng-select.ng-select-opened .ng-select-container {
        outline: none;
        box-shadow: 0 0 0 2px rgba(170, 175, 255, 1);
        border-radius: 5px;
        background-color: rgba(255, 255, 255, 1);
      }


      .status-select ::ng-deep .ng-dropdown-panel {
        width: 100%;
        min-width: 100%;
        box-shadow: 0 0 0 1px rgba(104, 113, 150, 0.1), 0 2.5px 3px -1.5px rgba(200, 207, 233, 1), 0 4.5px 5px -1px rgba(216, 220, 235, 1);
        border-radius: 5px;
        background-color: rgba(255, 255, 255, 1);
        padding: 12px 0;
        margin-top: 4px;
        border: none;
      }

      .status-select ::ng-deep .ng-option {
        padding: 5px 0 5px 12px;
        margin: 0;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        color: rgba(47, 48, 89, 1);
        font-family: CircularStd-Book, 'Circular-Std', sans-serif;
        font-size: 14px;
        font-weight: 400;
        font-style: normal;
      }

      .status-select ::ng-deep .ng-option:hover {
        background: $color-bg-hover;
      }

      .status-select ::ng-deep .ng-option.ng-option-selected {
        color: rgba(62, 64, 219, 1);
        font-family: CircularStd-Book, 'Circular-Std', sans-serif;
        font-size: 14px;
        font-weight: 400;
        font-style: normal;
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
        border-radius: 5px;
        background-color: rgba(214, 216, 255, 1);
        color: rgba(62, 64, 219, 1);
        font-family: CircularStd-Book;
        font-size: 14px;
        font-weight: 400;
      }

      .status-pill-complete {
        border-radius: 5px;
        background-color: rgba(225, 255, 204, 1);
        color: rgba(8, 162, 104, 1);
        font-family: CircularStd-Book;
        font-size: 14px;
        font-weight: 400;
      }

      .status-pill-blocked {
        border-radius: 5px;
        background-color: rgba(252, 238, 181, 1);
        margin: 2px 8px;
        padding: 2px 8px;
        color: rgba(177, 54, 0, 1);
        font-family: CircularStd-Book;
        font-size: 14px;
        font-weight: 400;
        display: inline-flex;
        align-items: center;
        justify-content: center;
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

      .btn {
        cursor: pointer;
        border: none;
        font-family: CircularStd-Book, 'Circular-Std', sans-serif;
        font-size: 15px;
        font-weight: 400;
        font-style: normal;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .btn-cancel {
        min-width: 66px;
        height: 32px;
        padding: 0 12px;
        box-shadow: 2px 4px 8px 0 rgba(0, 0, 0, 0.1);
        border-radius: 7px;
        background-color: rgba(255, 255, 255, 1);
        color: rgba(47, 48, 89, 1);
        letter-spacing: 0.33px;
      }

      .btn-primary {
        min-width: 66px;
        height: 32px;
        padding: 0 12px;
        box-shadow: 2px 4px 8px 0 rgba(0, 0, 0, 0.1);
        border-radius: 7px;
        background-color: rgba(86, 89, 255, 1);
        color: rgba(255, 255, 255, 1);
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

  form!: FormGroup;
  statusOptions = STATUS_OPTIONS;
  overlapError = signal(false);
  isClosing = signal(false);

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
          this.form.patchValue({
            name: '',
            status: 'open',
            startDate: null,
            endDate: null,
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
    this.requestClose();
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