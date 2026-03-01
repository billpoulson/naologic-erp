import type { WorkCenterDocument } from '../models/work-center';
import type { WorkOrderDocument } from '../models/work-order';

const STARGATE_NAMES = [
  'Naquadah Refining',
  'Ring Component Fab',
  'Dialing Mechanism',
  'Wormhole Stabilizer',
  'Gate Assembly',
];

/** 100 work centers for production (Stargate-themed first 5, then generic). */
export const FALLBACK_WORK_CENTERS: WorkCenterDocument[] = Array.from(
  { length: 100 },
  (_, i) => ({
    docId: `wc-${i + 1}`,
    docType: 'workCenter' as const,
    data: {
      name: i < 5 ? STARGATE_NAMES[i] : `Work Center ${i + 1}`,
    },
  })
);

const STATUSES = ['complete', 'in-progress', 'open', 'blocked'] as const;

/** Generate work orders for work centers wc-6..wc-100 across the 10-year span. */
function generateWorkOrdersForCenters6To100(): WorkOrderDocument[] {
  const orders: WorkOrderDocument[] = [];
  const baseYear = 2015;
  const spanYears = 20; // 10 years each side of today
  let woId = 17;
  for (let wc = 6; wc <= 100; wc++) {
    const yearOffset = ((wc - 6) * 2) % spanYears;
    const startYear = baseYear + yearOffset;
    const startMonth = ((wc - 6) * 3) % 12;
    const startDate = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-01`;
    const endYear = startYear + 1;
    const endMonth = (startMonth + 6) % 12;
    const endDate = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-15`;
    orders.push({
      docId: `wo-${woId++}`,
      docType: 'workOrder',
      data: {
        name: `Production run WC-${wc}`,
        workCenterId: `wc-${wc}`,
        status: STATUSES[(wc - 6) % STATUSES.length],
        startDate,
        endDate,
      },
    });
  }
  return orders;
}

/**
 * Stargate construction simulation: 10-year project with 100 work centers.
 * First 5 centers have Stargate-themed work orders; wc-6..wc-100 have generated orders.
 */
export const FALLBACK_WORK_ORDERS: WorkOrderDocument[] = [
  // wc-1 Naquadah Refining
  {
    docId: 'wo-1',
    docType: 'workOrder',
    data: {
      name: 'Naquadah ore sourcing & purification',
      workCenterId: 'wc-1',
      status: 'complete',
      startDate: '2023-03-01',
      endDate: '2023-08-31',
    },
  },
  {
    docId: 'wo-2',
    docType: 'workOrder',
    data: {
      name: 'Superconductor alloy development',
      workCenterId: 'wc-1',
      status: 'complete',
      startDate: '2023-09-15',
      endDate: '2024-03-15',
    },
  },
  {
    docId: 'wo-3',
    docType: 'workOrder',
    data: {
      name: 'Naquadah trinium composite',
      workCenterId: 'wc-1',
      status: 'in-progress',
      startDate: '2024-04-01',
      endDate: '2026-02-28',
    },
  },
  // wc-2 Ring Component Fab
  {
    docId: 'wo-4',
    docType: 'workOrder',
    data: {
      name: 'Chevron prototype machining',
      workCenterId: 'wc-2',
      status: 'complete',
      startDate: '2023-04-01',
      endDate: '2023-10-15',
    },
  },
  {
    docId: 'wo-5',
    docType: 'workOrder',
    data: {
      name: 'Inner ring segments (1-9)',
      workCenterId: 'wc-2',
      status: 'complete',
      startDate: '2023-10-30',
      endDate: '2024-05-31',
    },
  },
  {
    docId: 'wo-6',
    docType: 'workOrder',
    data: {
      name: 'Outer ring & chevron assembly',
      workCenterId: 'wc-2',
      status: 'complete',
      startDate: '2024-06-15',
      endDate: '2025-01-31',
    },
  },
  {
    docId: 'wo-7',
    docType: 'workOrder',
    data: {
      name: 'Symbol glyph engraving',
      workCenterId: 'wc-2',
      status: 'open',
      startDate: '2025-02-15',
      endDate: '2026-06-30',
    },
  },
  // wc-3 Dialing Mechanism
  {
    docId: 'wo-8',
    docType: 'workOrder',
    data: {
      name: 'Crystal oscillator R&D',
      workCenterId: 'wc-3',
      status: 'complete',
      startDate: '2023-05-01',
      endDate: '2023-11-30',
    },
  },
  {
    docId: 'wo-9',
    docType: 'workOrder',
    data: {
      name: 'DHD interface prototype',
      workCenterId: 'wc-3',
      status: 'complete',
      startDate: '2023-12-15',
      endDate: '2024-06-30',
    },
  },
  {
    docId: 'wo-10',
    docType: 'workOrder',
    data: {
      name: 'Address dialing logic & firmware',
      workCenterId: 'wc-3',
      status: 'in-progress',
      startDate: '2024-07-15',
      endDate: '2026-04-15',
    },
  },
  // wc-4 Wormhole Stabilizer
  {
    docId: 'wo-11',
    docType: 'workOrder',
    data: {
      name: 'Event horizon containment theory',
      workCenterId: 'wc-4',
      status: 'complete',
      startDate: '2023-06-01',
      endDate: '2023-12-31',
    },
  },
  {
    docId: 'wo-12',
    docType: 'workOrder',
    data: {
      name: 'Kawoosh dampening system',
      workCenterId: 'wc-4',
      status: 'complete',
      startDate: '2024-01-15',
      endDate: '2024-08-15',
    },
  },
  {
    docId: 'wo-13',
    docType: 'workOrder',
    data: {
      name: 'Wormhole stability field generators',
      workCenterId: 'wc-4',
      status: 'open',
      startDate: '2024-09-01',
      endDate: '2026-05-31',
    },
  },
  // wc-5 Gate Assembly
  {
    docId: 'wo-14',
    docType: 'workOrder',
    data: {
      name: 'Sub-assembly integration Phase 1',
      workCenterId: 'wc-5',
      status: 'complete',
      startDate: '2023-07-01',
      endDate: '2024-02-29',
    },
  },
  {
    docId: 'wo-15',
    docType: 'workOrder',
    data: {
      name: 'Ring mounting & alignment',
      workCenterId: 'wc-5',
      status: 'complete',
      startDate: '2024-03-15',
      endDate: '2024-10-31',
    },
  },
  {
    docId: 'wo-16',
    docType: 'workOrder',
    data: {
      name: 'Final integration & power-up',
      workCenterId: 'wc-5',
      status: 'blocked',
      startDate: '2024-11-15',
      endDate: '2026-06-30',
    },
  },
  ...generateWorkOrdersForCenters6To100(),
];
