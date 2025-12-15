import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

export function resolveProjectRoot() {
  // .../clients/node-client/src -> project root
  return path.join(process.cwd(), '..', '..');
}

export function defaultSamples() {
  const root = resolveProjectRoot();
  const samplesDir = path.join(root, 'samples');
  if (!fs.existsSync(samplesDir)) return [];
  const files = fs
    .readdirSync(samplesDir)
    .filter((f) => !f.startsWith('.') && !fs.statSync(path.join(samplesDir, f)).isDirectory())
    .map((f) => path.join(samplesDir, f));
  return files;
}

export function pickImages() {
  // You can pass IMAGES="path1,path2,..." or IMAGE="path".
  const envImages = process.env.IMAGES;
  const envImage = process.env.IMAGE;

  if (envImages) return envImages.split(',').map((s) => s.trim()).filter(Boolean);
  if (envImage) return [envImage];

  const samples = defaultSamples();
  if (samples.length > 0) return samples;

  throw new Error(
    'No images provided. Put a few files in ./samples OR run with IMAGE=... or IMAGES=...'
  );
}

export async function timeIt(fn) {
  const t0 = performance.now();
  const out = await fn();
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  return { out, ms };
}

export function bytesOf(obj) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}
