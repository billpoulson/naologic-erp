#!/usr/bin/env node
/**
 * Generates 10 years of sample data for 100 work centers.
 * Outputs: public/data/work-centers.json, public/data/work-orders.json
 *
 * Usage: node scripts/generate-sample-data.js
 */

const fs = require('fs');
const path = require('path');

const STATUSES = ['complete', 'in-progress', 'open', 'blocked'];
const STARGATE_NAMES = [
  'Naquadah Refining',
  'Ring Component Fab',
  'Dialing Mechanism',
  'Wormhole Stabilizer',
  'Gate Assembly',
];

const NUM_WORK_CENTERS = 100;
const SPAN_YEARS = 10;
const ORDERS_PER_CENTER = 8; // ~1 order per 1.25 years per center

/** Simple seeded random for reproducible data */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateWorkCenters() {
  const centers = [];
  for (let i = 0; i < NUM_WORK_CENTERS; i++) {
    centers.push({
      docId: `wc-${i + 1}`,
      docType: 'workCenter',
      data: {
        name: i < 5 ? STARGATE_NAMES[i] : `Work Center ${i + 1}`,
      },
    });
  }
  return centers;
}

function generateWorkOrders(centers) {
  const orders = [];
  const now = new Date();
  const startYear = now.getFullYear() - Math.floor(SPAN_YEARS / 2);
  const endYear = startYear + SPAN_YEARS;

  let woId = 1;
  for (const center of centers) {
    const wcNum = parseInt(center.docId.replace('wc-', ''), 10);
    const seedBase = wcNum * 1000;

    // Sequential orders: each starts after the previous ends (one active job at a time)
    let currentStart = new Date(startYear, 0, 1);

    for (let o = 0; o < ORDERS_PER_CENTER; o++) {
      const seed = seedBase + o;
      const durationMonths = Math.floor(seededRandom(seed + 2) * 8) + 2; // 2–10 months

      const startDate = new Date(currentStart);
      const endDate = new Date(currentStart.getFullYear(), currentStart.getMonth() + durationMonths, 15);

      if (endDate.getFullYear() > endYear) break;

      const statusIndex = Math.floor(seededRandom(seed + 3) * STATUSES.length);
      const status = STATUSES[statusIndex];

      const orderTypes = [
        'Production run',
        'Batch',
        'Maintenance',
        'Inspection',
        'Assembly',
        'Fabrication',
        'Testing',
        'Integration',
      ];
      const typeIndex = Math.floor(seededRandom(seed + 4) * orderTypes.length);
      const type = orderTypes[typeIndex];
      const suffix = wcNum <= 5 && o < 2 ? `- ${center.data.name}` : ` WC-${wcNum}`;
      const name = `${type} ${o + 1}${suffix}`;

      orders.push({
        docId: `wo-${woId++}`,
        docType: 'workOrder',
        data: {
          name,
          workCenterId: center.docId,
          status,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
        },
      });

      // Next order starts day after this one ends
      currentStart = new Date(endDate);
      currentStart.setDate(currentStart.getDate() + 1);
    }
  }

  return orders;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const dataDir = path.join(projectRoot, 'public', 'data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const centers = generateWorkCenters();
  const orders = generateWorkOrders(centers);

  const centersPath = path.join(dataDir, 'work-centers.json');
  const ordersPath = path.join(dataDir, 'work-orders.json');

  fs.writeFileSync(centersPath, JSON.stringify(centers, null, 2), 'utf8');
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), 'utf8');

  console.log(`Generated ${centers.length} work centers`);
  console.log(`Generated ${orders.length} work orders`);
  console.log(`Written to ${centersPath}`);
  console.log(`Written to ${ordersPath}`);
}

main();
