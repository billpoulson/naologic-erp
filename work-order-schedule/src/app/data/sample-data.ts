import type { WorkCenterDocument } from '../models/work-center';
import type { WorkOrderDocument } from '../models/work-order';

const STARGATE_NAMES = [
  'Naquadah Refining',
  'Ring Component Fab',
  'Dialing Mechanism',
  'Wormhole Stabilizer',
  'Gate Assembly',
];

/** 1000 work centers for production (Stargate-themed first 5, then generic). */
export const FALLBACK_WORK_CENTERS: WorkCenterDocument[] = Array.from(
  { length: 1000 },
  (_, i) => ({
    docId: `wc-${i + 1}`,
    docType: 'workCenter' as const,
    data: {
      name: i < 5 ? STARGATE_NAMES[i] : `Work Center ${i + 1}`,
    },
  })
);

const STATUSES = ['complete', 'in-progress', 'open', 'blocked'] as const;

/** Generate sequential work orders for wc-6..wc-1000 spanning the full 12-year sample range. */
function generateWorkOrdersForCenters6To1000(startWoId: number): WorkOrderDocument[] {
  const orders: WorkOrderDocument[] = [];
  const now = new Date();
  const baseYear = now.getFullYear() - 10;
  const rangeStart = new Date(baseYear, now.getMonth(), 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 24, 0);
  let woId = startWoId;
  for (let wc = 6; wc <= 1000; wc++) {
    const seedBase = wc * 1000;
    let currentStart = new Date(rangeStart);
    let orderIndex = 0;
    while (currentStart.getTime() < rangeEnd.getTime()) {
      const seed = seedBase + orderIndex;
      const durationMonths = (seed % 9) + 2; // 2–10 months, deterministic
      const woEnd = new Date(currentStart.getFullYear(), currentStart.getMonth() + durationMonths, 15);
      if (woEnd.getTime() > rangeEnd.getTime()) break;
      const startDate = formatIsoDate(currentStart);
      const endDate = formatIsoDate(woEnd);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const status =
        currentStart.getTime() > todayStart.getTime()
          ? 'open'
          : STATUSES[(wc + orderIndex) % STATUSES.length];
      orders.push({
        docId: `wo-${woId++}`,
        docType: 'workOrder',
        data: {
          name: `Production run WC-${wc}`,
          workCenterId: `wc-${wc}`,
          status,
          startDate,
          endDate,
        },
      });
      currentStart = new Date(woEnd);
      currentStart.setDate(currentStart.getDate() + 1);
      orderIndex++;
    }
  }
  return orders;
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const STARGATE_ORDER_NAMES: Record<number, string[]> = {
  1: [
    'Naquadah ore sourcing & purification',
    'Superconductor alloy development',
    'Naquadah trinium composite',
    'Refining capacity expansion',
    'Quality control Phase 2',
    'Storage facility upgrade',
  ],
  2: [
    'Chevron prototype machining',
    'Inner ring segments (1-9)',
    'Outer ring & chevron assembly',
    'Symbol glyph engraving',
    'Calibration run',
    'Final inspection',
  ],
  3: [
    'Crystal oscillator R&D',
    'DHD interface prototype',
    'Address dialing logic & firmware',
    'Power distribution upgrade',
    'Diagnostic suite',
  ],
  4: [
    'Event horizon containment theory',
    'Kawoosh dampening system',
    'Wormhole stability field generators',
    'Field calibration',
    'Safety interlocks',
  ],
  5: [
    'Sub-assembly integration Phase 1',
    'Ring mounting & alignment',
    'Final integration & power-up',
    'Acceptance testing',
    'Documentation',
  ],
};

/** Generate work orders for work centers wc-1..wc-5 spanning the full 12-year range. */
function generateWorkOrdersForCenters1To5(): WorkOrderDocument[] {
  const orders: WorkOrderDocument[] = [];
  const now = new Date();
  const baseYear = now.getFullYear() - 10;
  const rangeStart = new Date(baseYear, now.getMonth(), 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 24, 0);
  let woId = 1;
  for (let wc = 1; wc <= 5; wc++) {
    const names = STARGATE_ORDER_NAMES[wc] ?? [`Work ${wc}`];
    const seedBase = wc * 1000;
    let currentStart = new Date(rangeStart);
    let orderIndex = 0;
    while (currentStart.getTime() < rangeEnd.getTime()) {
      const seed = seedBase + orderIndex;
      const durationMonths = (seed % 9) + 2;
      const woEnd = new Date(currentStart.getFullYear(), currentStart.getMonth() + durationMonths, 15);
      if (woEnd.getTime() > rangeEnd.getTime()) break;
      const name = names[orderIndex % names.length] ?? `Production run WC-${wc}`;
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const status =
        currentStart.getTime() > todayStart.getTime()
          ? 'open'
          : STATUSES[(wc + orderIndex) % STATUSES.length];
      orders.push({
        docId: `wo-${woId++}`,
        docType: 'workOrder',
        data: {
          name,
          workCenterId: `wc-${wc}`,
          status,
          startDate: formatIsoDate(currentStart),
          endDate: formatIsoDate(woEnd),
        },
      });
      currentStart = new Date(woEnd);
      currentStart.setDate(currentStart.getDate() + 1);
      orderIndex++;
    }
  }
  return orders;
}

/**
 * Stargate construction simulation: 10 years back to 24 months forward, 1000 work centers.
 * All work centers have sequential work orders spanning the full 12-year sample range.
 */
const orders1To5 = generateWorkOrdersForCenters1To5();
export const FALLBACK_WORK_ORDERS: WorkOrderDocument[] = [
  ...orders1To5,
  ...generateWorkOrdersForCenters6To1000(orders1To5.length + 1),
];
