#!/usr/bin/env node
/**
 * Generates sample data for 1000 work centers.
 * Work orders span 10 years past to 24 months future from today.
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

const NUM_WORK_CENTERS = 1000;
const PAST_YEARS = 10; // Years of past work
const FUTURE_MONTHS = 24; // Months of future work from today
// ~24 orders per center to fill 12-year span (avg 6 months per order)
const ORDERS_PER_CENTER = 25;

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
  const startDate = new Date(now.getFullYear() - PAST_YEARS, now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + FUTURE_MONTHS, 0);

  let woId = 1;
  for (const center of centers) {
    const wcNum = parseInt(center.docId.replace('wc-', ''), 10);
    const seedBase = wcNum * 1000;

    // Sequential orders: each starts after the previous ends (one active job at a time)
    let currentStart = new Date(startDate);

    for (let o = 0; o < ORDERS_PER_CENTER; o++) {
      const seed = seedBase + o;
      const durationMonths = Math.floor(seededRandom(seed + 2) * 8) + 2; // 2–10 months

      const woStart = new Date(currentStart);
      const woEnd = new Date(currentStart.getFullYear(), currentStart.getMonth() + durationMonths, 15);

      if (woEnd.getTime() > endDate.getTime()) break;

      const status =
        woStart.getTime() > now.getTime()
          ? 'open'
          : STATUSES[Math.floor(seededRandom(seed + 3) * STATUSES.length)];

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
          startDate: formatDate(woStart),
          endDate: formatDate(woEnd),
        },
      });

      // Next order starts day after this one ends
      currentStart = new Date(woEnd);
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
