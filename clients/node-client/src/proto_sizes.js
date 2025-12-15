import path from 'path';
import protobuf from 'protobufjs';
import { resolveProjectRoot } from './utils.js';

let _typesPromise = null;

async function loadTypes() {
  const rootDir = resolveProjectRoot();
  const protoPath = path.join(rootDir, 'proto', 'image_classifier.proto');
  const pbRoot = await protobuf.load(protoPath);
  const ImageRequest = pbRoot.lookupType('imageclassifier.ImageRequest');
  const ImageResponse = pbRoot.lookupType('imageclassifier.ImageResponse');
  const ImagesRequest = pbRoot.lookupType('imageclassifier.ImagesRequest');
  const ImagesResponse = pbRoot.lookupType('imageclassifier.ImagesResponse');
  return { ImageRequest, ImageResponse, ImagesRequest, ImagesResponse };
}

export async function getTypes() {
  if (!_typesPromise) _typesPromise = loadTypes();
  return _typesPromise;
}

export async function sizeImageRequest(msg) {
  const { ImageRequest } = await getTypes();
  return ImageRequest.encode(ImageRequest.create(msg)).finish().length;
}

export async function sizeImageResponse(msg) {
  const { ImageResponse } = await getTypes();
  return ImageResponse.encode(ImageResponse.create(msg)).finish().length;
}

export async function sizeImagesRequest(msg) {
  const { ImagesRequest } = await getTypes();
  return ImagesRequest.encode(ImagesRequest.create(msg)).finish().length;
}

export async function sizeImagesResponse(msg) {
  const { ImagesResponse } = await getTypes();
  return ImagesResponse.encode(ImagesResponse.create(msg)).finish().length;
}
