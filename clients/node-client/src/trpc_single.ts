import fs from 'fs';
import superjson from 'superjson';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { pickImages, timeIt, bytesOf } from './utils.js';

const API = process.env.API_URL || 'http://127.0.0.1:4000';

type AppRouter = any; // keep client portable for exam

async function main() {
  const [img] = pickImages();
  const imageBase64 = fs.readFileSync(img).toString('base64');

  const client = createTRPCProxyClient<AppRouter>({
    transformer: superjson,
    links: [
      httpBatchLink({ url: `${API}/trpc` }),
    ],
  });

  const { out, ms } = await timeIt(async () => {
    // @ts-ignore
    return await client.uploadImage.mutate({ filename: img, imageBase64 });
  });

  console.log('tRPC uploadImage');
  console.log('Image:', img);
  console.log('Response:', out);
  console.log('ClientMeasuredMs:', ms);
  console.log('PayloadBytes(JSON):', bytesOf(out));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
