import fs from 'fs';
import { performance } from 'perf_hooks';
import { pickImages, bytesOf } from './utils.js';
import { loadClient } from './grpc_common.js';

const MODEL_ADDR = process.env.MODEL_ADDR || '127.0.0.1:50051';

async function main() {
  const [img] = pickImages();
  const imageData = fs.readFileSync(img);

  const client = loadClient(MODEL_ADDR);

  const t0 = performance.now();
  const out = await new Promise((resolve, reject) => {
    client.UploadImage({ imageData, filename: img }, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
  const ms = Math.round((performance.now() - t0) * 100) / 100;

  console.log('gRPC direct (client -> model-service)');
  console.log('Image:', img);
  console.log('Response:', out);
  console.log('ClientMeasuredMs:', ms);
  console.log('PayloadBytes(approx JSON):', bytesOf(out));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
