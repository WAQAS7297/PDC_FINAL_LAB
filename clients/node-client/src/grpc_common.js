import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

export function loadClient(address) {
  const protoPath = path.join(process.cwd(), '..', '..', 'proto', 'image_classifier.proto');
  const packageDef = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDef);
  const ClientCtor = proto.imageclassifier.ImageClassifier;
  return new ClientCtor(address, grpc.credentials.createInsecure());
}
