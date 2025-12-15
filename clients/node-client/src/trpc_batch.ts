import fs from 'fs';
import superjson from 'superjson';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { pickImages, timeIt, bytesOf } from './utils.js';

const API = process.env.API_URL || 'http://127.0.0.1:4000';

type AppRouter = any;

async function main() {
  const imgs = pickImages().slice(0, 5);
  const images = imgs.map((p) => ({ filename: p, imageBase64: fs.readFileSync(p).toString('base64') }));

  const client = createTRPCProxyClient<AppRouter>({
    transformer: superjson,
    links: [httpBatchLink({ url: `${API}/trpc` })],
  });

  const { out, ms } = await timeIt(async () => {
    // @ts-ignore
    return await client.uploadImages.mutate({ images });
  });

  console.log('tRPC uploadImages (5 images in one call)');
  console.log('Images:', imgs);
  console.log('Response:', out);
  console.log('ClientMeasuredMs:', ms);
  console.log('PayloadBytes(JSON):', bytesOf(out));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
