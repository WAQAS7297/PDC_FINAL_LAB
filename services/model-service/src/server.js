const path = require('path');
const crypto = require('crypto');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, '../../../proto/image_classifier.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef).imageclassifier;

const LABELS = ['cat', 'dog', 'car', 'airplane', 'flower', 'xray', 'digit', 'unknown'];

function classify(imageBuffer) {
  // Deterministic "fake model" for exam/demo purposes:
  // hash(image) -> label; confidence derived from hash.
  const hash = crypto.createHash('sha256').update(imageBuffer).digest();
  const idx = hash[0] % LABELS.length;
  const confidence = Math.round((0.55 + (hash[1] / 255) * 0.44) * 100) / 100; // 0.55..0.99
  return { label: LABELS[idx], confidence };
}

function UploadImage(call, callback) {
  const started = Date.now();
  const imageData = call.request?.imageData;
  if (!imageData || imageData.length === 0) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: 'imageData is required'
    });
  }

  // Simulate compute latency (10-30ms) to make benchmarking meaningful.
  const jitter = 10 + (imageData[0] % 21);

  setTimeout(() => {
    const { label, confidence } = classify(imageData);
    const modelLatencyMs = Date.now() - started;

    callback(null, {
      label,
      confidence,
      modelLatencyMs
    });
  }, jitter);
}

function main() {
  const server = new grpc.Server();
  server.addService(proto.ImageClassifier.service, { UploadImage });

  const host = process.env.MODEL_HOST || '0.0.0.0';
  const port = process.env.MODEL_PORT || '50051';
  const addr = `${host}:${port}`;

  server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      console.error('Failed to bind model-service:', err);
      process.exit(1);
    }
    console.log(`[model-service] gRPC listening on ${addr}`);
    server.start();
  });
}

main();
