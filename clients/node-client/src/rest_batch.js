import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { pickImages, timeIt, bytesOf } from './utils.js';

const API = process.env.API_URL || 'http://127.0.0.1:4000';

async function main() {
  const imgs = pickImages().slice(0, 5);
  const form = new FormData();
  for (const img of imgs) {
    form.append('images', fs.createReadStream(img));
  }

  const { out, ms } = await timeIt(async () => {
    const res = await axios.post(`${API}/uploadImages`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    return res.data;
  });

  console.log('REST /uploadImages (5 images in one request)');
  console.log('Images:', imgs);
  console.log('Response:', out);
  console.log('ClientMeasuredMs:', ms);
  console.log('PayloadBytes(JSON):', bytesOf(out));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
