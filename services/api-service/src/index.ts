import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { performance } from "perf_hooks";
import superjson from "superjson";
import { z } from "zod";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";

const HTTP_PORT = Number(process.env.API_PORT || 4000);
const GRPC_PORT = Number(process.env.API_GRPC_PORT || 50052); // gRPC endpoint exposed by API-service
const MODEL_ADDR = process.env.MODEL_ADDR || "127.0.0.1:50051";

const PROTO_PATH = path.join(process.cwd(), "..", "..", "proto", "image_classifier.proto");

// ---- gRPC client to model-service ----
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef) as any;
const ModelClient = proto.imageclassifier.ImageClassifier;

function createModelClient() {
  return new ModelClient(MODEL_ADDR, grpc.credentials.createInsecure());
}

async function grpcClassifyOne(imageData: Buffer, filename?: string) {
  const client = createModelClient();
  const started = performance.now();

  const res: any = await new Promise((resolve, reject) => {
    client.UploadImage(
      { imageData, filename: filename || "unknown" },
      (err: any, response: any) => {
        if (err) return reject(err);
        resolve(response);
      }
    );
  });

  const totalMs = Math.round((performance.now() - started) * 100) / 100;
  return { ...res, totalMs };
}

// ---- Express REST ----
const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api-service", modelAddr: MODEL_ADDR });
});

app.post("/uploadImage", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Missing field: image" });

    const started = performance.now();
    const out = await grpcClassifyOne(file.buffer, file.originalname);

    res.json({
      label: out.label,
      confidence: out.confidence,
      modelLatencyMs: out.modelLatencyMs,
      apiTotalMs: Math.round((performance.now() - started) * 100) / 100,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

app.post("/uploadImages", upload.array("images", 10), async (req, res) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return res.status(400).json({ error: "Missing field: images" });

    const started = performance.now();
    const results = [] as any[];
    for (const f of files) {
      const out = await grpcClassifyOne(f.buffer, f.originalname);
      results.push({ filename: f.originalname, label: out.label, confidence: out.confidence, modelLatencyMs: out.modelLatencyMs, totalMs: out.totalMs });
    }

    res.json({
      count: results.length,
      results,
      apiTotalMs: Math.round((performance.now() - started) * 100) / 100,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// ---- tRPC ----
const t = initTRPC.create({
  transformer: superjson,
});

const router = t.router({
  uploadImage: t.procedure
    .input(
      z.object({
        filename: z.string().optional(),
        imageBase64: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const buf = Buffer.from(input.imageBase64, "base64");
      const out = await grpcClassifyOne(buf, input.filename);
      return {
        label: out.label as string,
        confidence: out.confidence as number,
        modelLatencyMs: out.modelLatencyMs as number,
        totalMs: out.totalMs as number,
      };
    }),

  uploadImages: t.procedure
    .input(
      z.object({
        images: z.array(
          z.object({
            filename: z.string().optional(),
            imageBase64: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const results = [] as any[];
      const started = performance.now();
      for (const img of input.images) {
        const buf = Buffer.from(img.imageBase64, "base64");
        const out = await grpcClassifyOne(buf, img.filename);
        results.push({ filename: img.filename ?? "unknown", label: out.label, confidence: out.confidence, modelLatencyMs: out.modelLatencyMs, totalMs: out.totalMs });
      }
      return {
        count: results.length,
        results,
        totalMs: Math.round((performance.now() - started) * 100) / 100,
      };
    }),
});

type AppRouter = typeof router;

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router,
    createContext: () => ({}),
  })
);

// ---- API-service exposes its own gRPC endpoint (so you can benchmark direct vs. service-to-service) ----
function startApiGrpcServer() {
  const server = new grpc.Server();

  // This handler forwards to model-service via gRPC (A -> B)
  const ImageClassifierService = proto.imageclassifier.ImageClassifier.service;
  server.addService(ImageClassifierService, {
    UploadImage: async (call: any, callback: any) => {
      try {
        const imageData: Buffer = call.request?.imageData;
        const filename: string | undefined = call.request?.filename;
        const out = await grpcClassifyOne(imageData, filename);

        callback(null, {
          label: out.label,
          confidence: out.confidence,
          modelLatencyMs: out.modelLatencyMs,
        });
      } catch (e: any) {
        callback({
          code: grpc.status.INTERNAL,
          message: e?.message || String(e),
        });
      }
    },
  });

  const addr = `0.0.0.0:${GRPC_PORT}`;
  server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      console.error("[api-service] Failed to bind gRPC:", err);
      process.exit(1);
    }
    console.log(`[api-service] gRPC listening on ${addr} (forwards to model at ${MODEL_ADDR})`);
    server.start();
  });
}

app.listen(HTTP_PORT, () => {
  console.log(`[api-service] REST+tRPC listening on http://127.0.0.1:${HTTP_PORT}`);
  console.log(`[api-service] tRPC endpoint: http://127.0.0.1:${HTTP_PORT}/trpc`);
  startApiGrpcServer();
});

export type { AppRouter };
