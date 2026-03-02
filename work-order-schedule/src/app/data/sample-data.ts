import type { WorkCenterDocument } from '../models/work-center';
import type { WorkOrderDocument } from '../models/work-order';

/** First 5 work centers: realistic manufacturing names. */
const WORK_CENTER_NAMES_FIRST_5 = [
  'Extrusion Line A',
  'CNC Machine 1',
  'Assembly Station',
  'Quality Control',
  'Packaging Line',
];

/** Base names for work centers 6+ (cycled with numbers). */
const WORK_CENTER_BASE_NAMES = [
  'Extrusion Line',
  'CNC Machine',
  'Assembly Station',
  'Injection Molding',
  'Welding Station',
  'Paint Booth',
  'Quality Control',
  'Packaging Line',
  'Stamping Press',
  'Drill Press',
  'Lathe',
  'Mill',
  'Deburring',
  'Heat Treat',
  'Plating Line',
];

function getWorkCenterName(index: number): string {
  if (index < 5) return WORK_CENTER_NAMES_FIRST_5[index];
  const baseIndex = (index - 5) % WORK_CENTER_BASE_NAMES.length;
  const repeat = Math.floor((index - 5) / WORK_CENTER_BASE_NAMES.length) + 2;
  return `${WORK_CENTER_BASE_NAMES[baseIndex]} ${repeat}`;
}

/** 1000 work centers with realistic manufacturing names. */
export const FALLBACK_WORK_CENTERS: WorkCenterDocument[] = Array.from(
  { length: 1000 },
  (_, i) => ({
    docId: `wc-${i + 1}`,
    docType: 'workCenter' as const,
    data: {
      name: getWorkCenterName(i),
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

/** Work order names for first 5 work centers (realistic manufacturing). */
const WORK_ORDER_NAMES_BY_CENTER: Record<number, string[]> = {
  1: [
    'Extrusion run – profile set A',
    'Material changeover & calibration',
    'Extrusion run – profile set B',
    'Die maintenance & cleaning',
    'Capacity run – standard specs',
    'Trial run – new material',
  ],
  2: [
    'CNC program – part family 100',
    'Fixture setup & first article',
    'Production run – part family 100',
    'Tool change & offset update',
    'CNC program – part family 200',
    'Final inspection run',
  ],
  3: [
    'Assembly – subassembly A',
    'Subassembly B & integration',
    'Final assembly – product line 1',
    'Rework & touch-up',
    'Assembly – product line 2',
  ],
  4: [
    'Incoming inspection – lot 1',
    'In-process inspection – stage 2',
    'Final QA sign-off',
    'Calibration & gauge R&R',
    'Audit prep & documentation',
  ],
  5: [
    'Pack-out – order #1',
    'Labeling & kitting',
    'Ship prep – palletizing',
    'Inventory cycle count',
    'Documentation & COA',
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
    const names = WORK_ORDER_NAMES_BY_CENTER[wc] ?? [`Production run WC-${wc}`];
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
 * Sample data: 10 years back to 24 months forward, 1000 work centers.
 * All work centers have sequential work orders spanning the full 12-year sample range.
 */
const orders1To5 = generateWorkOrdersForCenters1To5();
export const FALLBACK_WORK_ORDERS: WorkOrderDocument[] = [
  ...orders1To5,
  ...generateWorkOrdersForCenters6To1000(orders1To5.length + 1),
];
