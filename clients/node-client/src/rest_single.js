import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { pickImages, timeIt, bytesOf } from './utils.js';

const API = process.env.API_URL || 'http://127.0.0.1:4000';

async function main() {
  const [img] = pickImages();
  const form = new FormData();
  form.append('image', fs.createReadStream(img));

  const { out, ms } = await timeIt(async () => {
    const res = await axios.post(`${API}/uploadImage`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    return res.data;
  });

  console.log('REST /uploadImage');
  console.log('Image:', img);
  console.log('Response:', out);
  console.log('ClientMeasuredMs:', ms);
  console.log('PayloadBytes(JSON):', bytesOf(out));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
