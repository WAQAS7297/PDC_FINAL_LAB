import fs from 'fs';
import path from 'path';
import {
  restSingle, restBatch,
  trpcSingle, trpcBatch,
  grpcDirectSingle, grpcViaApiSingle,
  grpcDirectBatch, grpcViaApiBatch,
} from './bench_lib.js';

async function main() {
  const results = [];
  results.push(await restSingle());
  results.push(await restBatch(5));
  results.push(await trpcSingle());
  results.push(await trpcBatch(5));
  results.push(await grpcDirectSingle());
  results.push(await grpcDirectBatch(5));
  results.push(await grpcViaApiSingle());
  results.push(await grpcViaApiBatch(5));

  const outPath = process.env.BENCH_OUT || path.join(process.cwd(), 'benchmarks.json');
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2), 'utf8');

  console.log('Saved:', outPath);
  for (const r of results) {
    console.log(`${r.protocol} ${r.mode} -> ms=${r.ms} reqBytes=${r.reqBytes} resBytes=${r.resBytes}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
