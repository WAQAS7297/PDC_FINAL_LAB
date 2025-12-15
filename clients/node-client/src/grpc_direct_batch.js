import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { pickImages } from './utils.js';
import { loadClient } from './grpc_common.js';
import { sizeImagesRequest, sizeImagesResponse } from './proto_sizes.js';

const MODEL_ADDR = process.env.MODEL_ADDR || '127.0.0.1:50051';

async function main() {
  const imgs = pickImages().slice(0, 5);
  const images = imgs.map((p) => ({ imageData: fs.readFileSync(p), filename: path.basename(p) }));

  const client = loadClient(MODEL_ADDR);
  const t0 = performance.now();
  const out = await new Promise((resolve, reject) => {
    client.UploadImages({ images }, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
  const ms = Math.round((performance.now() - t0) * 100) / 100;

  console.log('gRPC direct batch (client -> model-service)');
  console.log('Count:', images.length);
  console.log('ClientMeasuredMs:', ms);
  console.log('RequestBytes(Protobuf):', await sizeImagesRequest({ images }));
  console.log('ResponseBytes(Protobuf):', await sizeImagesResponse(out));
  console.log('Response:', out);
}

main().catch((e) => { console.error(e); process.exit(1); });
