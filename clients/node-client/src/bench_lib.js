import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { performance } from 'perf_hooks';
import superjson from 'superjson';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { pickImages, resolveProjectRoot, bytesOf } from './utils.js';
import { sizeImageRequest, sizeImageResponse, sizeImagesRequest, sizeImagesResponse } from './proto_sizes.js';

const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';
const API_GRPC_ADDR = process.env.API_GRPC_ADDR || '127.0.0.1:50052';
const MODEL_ADDR = process.env.MODEL_ADDR || '127.0.0.1:50051';

function loadGrpcClient(address) {
  const rootDir = resolveProjectRoot();
  const protoPath = path.join(rootDir, 'proto', 'image_classifier.proto');
  const packageDef = protoLoader.loadSync(protoPath, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
  const proto = grpc.loadPackageDefinition(packageDef);
  const ClientCtor = proto.imageclassifier.ImageClassifier;
  return new ClientCtor(address, grpc.credentials.createInsecure());
}

export async function restSingle() {
  const [img] = pickImages();
  const form = new FormData();
  form.append('image', fs.createReadStream(img));
  const reqSize = 0; // multipart is hard to calculate precisely; we use JSON payload for response comparisons
  const t0 = performance.now();
  const res = await axios.post(`${API_URL}/uploadImage`, form, { headers: form.getHeaders(), maxBodyLength: Infinity });
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  const out = res.data;
  return { protocol: 'REST', mode: 'single', image: path.basename(img), ms, resBytes: bytesOf(out), reqBytes: reqSize, out };
}

export async function restBatch(n=5) {
  const imgs = pickImages().slice(0, n);
  const form = new FormData();
  for (const img of imgs) form.append('images', fs.createReadStream(img));
  const t0 = performance.now();
  const res = await axios.post(`${API_URL}/uploadImages`, form, { headers: form.getHeaders(), maxBodyLength: Infinity });
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  const out = res.data;
  return { protocol: 'REST', mode: `batch${n}`, count: imgs.length, ms, resBytes: bytesOf(out), reqBytes: 0, out };
}

function trpcClient() {
  return createTRPCProxyClient({
    transformer: superjson,
    links: [httpBatchLink({ url: `${API_URL}/trpc` })],
  });
}

export async function trpcSingle() {
  const [img] = pickImages();
  const buf = fs.readFileSync(img);
  const client = trpcClient();
  const input = { filename: path.basename(img), imageBase64: buf.toString('base64') };
  const t0 = performance.now();
  const out = await client.uploadImage.mutate(input);
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  return { protocol: 'tRPC', mode: 'single', image: path.basename(img), ms, reqBytes: bytesOf(input), resBytes: bytesOf(out), out };
}

export async function trpcBatch(n=5) {
  const imgs = pickImages().slice(0, n);
  const images = imgs.map((img) => ({ filename: path.basename(img), imageBase64: fs.readFileSync(img).toString('base64') }));
  const client = trpcClient();
  const input = { images };
  const t0 = performance.now();
  const out = await client.uploadImages.mutate(input);
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  return { protocol: 'tRPC', mode: `batch${n}`, count: imgs.length, ms, reqBytes: bytesOf(input), resBytes: bytesOf(out), out };
}

async function grpcUnary(address, request) {
  const client = loadGrpcClient(address);
  return await new Promise((resolve, reject) => {
    client.UploadImage(request, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

async function grpcBatchCall(address, request) {
  const client = loadGrpcClient(address);
  return await new Promise((resolve, reject) => {
    client.UploadImages(request, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

export async function grpcDirectSingle() {
  const [img] = pickImages();
  const imageData = fs.readFileSync(img);
  const req = { imageData, filename: path.basename(img) };
  const t0 = performance.now();
  const out = await grpcUnary(MODEL_ADDR, req);
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  return {
    protocol: 'gRPC-direct',
    mode: 'single',
    image: path.basename(img),
    ms,
    reqBytes: await sizeImageRequest(req),
    resBytes: await sizeImageResponse(out),
    out,
  };
}

export async function grpcViaApiSingle() {
  const [img] = pickImages();
  const imageData = fs.readFileSync(img);
  const req = { imageData, filename: path.basename(img) };
  const t0 = performance.now();
  const out = await grpcUnary(API_GRPC_ADDR, req);
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  return {
    protocol: 'gRPC-via-microservice',
    mode: 'single',
    image: path.basename(img),
    ms,
    reqBytes: await sizeImageRequest(req),
    resBytes: await sizeImageResponse(out),
    out,
  };
}

export async function grpcDirectBatch(n=5) {
  const imgs = pickImages().slice(0, n);
  const images = imgs.map((img) => ({ imageData: fs.readFileSync(img), filename: path.basename(img) }));
  const req = { images };
  const t0 = performance.now();
  const out = await grpcBatchCall(MODEL_ADDR, req);
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  return { protocol: 'gRPC-direct', mode: `batch${n}`, count: images.length, ms, reqBytes: await sizeImagesRequest(req), resBytes: await sizeImagesResponse(out), out };
}

export async function grpcViaApiBatch(n=5) {
  const imgs = pickImages().slice(0, n);
  const images = imgs.map((img) => ({ imageData: fs.readFileSync(img), filename: path.basename(img) }));
  const req = { images };
  const t0 = performance.now();
  const out = await grpcBatchCall(API_GRPC_ADDR, req);
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  return { protocol: 'gRPC-via-microservice', mode: `batch${n}`, count: images.length, ms, reqBytes: await sizeImagesRequest(req), resBytes: await sizeImagesResponse(out), out };
}
