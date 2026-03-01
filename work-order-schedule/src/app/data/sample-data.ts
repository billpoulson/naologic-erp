import type { WorkCenterDocument } from '../models/work-center';
import type { WorkOrderDocument } from '../models/work-order';

export const FALLBACK_WORK_CENTERS: WorkCenterDocument[] = [
  { docId: 'wc-1', docType: 'workCenter', data: { name: 'Extrusion Line A' } },
  { docId: 'wc-2', docType: 'workCenter', data: { name: 'CNC Machine 1' } },
  { docId: 'wc-3', docType: 'workCenter', data: { name: 'Assembly Station' } },
  { docId: 'wc-4', docType: 'workCenter', data: { name: 'Quality Control' } },
  { docId: 'wc-5', docType: 'workCenter', data: { name: 'Packaging Line' } },
];

export const FALLBACK_WORK_ORDERS: WorkOrderDocument[] = [
  {
    docId: 'wo-1',
    docType: 'workOrder',
    data: {
      name: 'Batch A',
      workCenterId: 'wc-1',
      status: 'complete',
      startDate: '2026-02-01',
      endDate: '2026-02-07',
    },
  },
  {
    docId: 'wo-2',
    docType: 'workOrder',
    data: {
      name: 'Batch B',
      workCenterId: 'wc-1',
      status: 'in-progress',
      startDate: '2026-02-15',
      endDate: '2026-02-22',
    },
  },
];
