# AI Image Classification System (REST + tRPC + gRPC + Microservices)

This project is built to match the COMSATS PDC Final Lab Exam (Fall 2025) requirements:
- REST API: `POST /uploadImage` (plus a batch endpoint for 5 images in one request)
- tRPC API: `uploadImage(...)` (plus `uploadImages(...)`)
- gRPC unary API with Protobuf
- **Service-to-service gRPC**: API Service (A) -> Model Service (B)
- Node client scripts to upload **1 image** and **5 images** and print **response time + payload size**

## Project Structure
```
proto/                       Protobuf schema
services/model-service/      Microservice B (gRPC model)
services/api-service/        Microservice A (REST + tRPC + gRPC forwarder)
clients/node-client/         Benchmarking client scripts
samples/                     Put 5-10 sample images here (jpg/png/etc)
report/                      1-page report template
```

## Requirements
- Node.js 18+ (recommended Node 20)

## 1) Put your sample images
Copy 5-10 images into:
```
./samples/
```
Example filenames:
```
samples/img1.jpg
samples/img2.png
...
```

## 2) Install dependencies
Open **two terminals** at the project root.

### Terminal A (Model Service)
```
cd services/model-service
npm install
npm run start
```
Expected:
`[model-service] gRPC listening on 0.0.0.0:50051`

### Terminal B (API Service)
```
cd services/api-service
npm install
npm run start
```
Expected:
- REST+tRPC: `http://127.0.0.1:4000`
- API gRPC (forwarder): `0.0.0.0:50052`

## 3) Run benchmark clients
In a **third terminal**:
```
cd clients/node-client
npm install
```

### REST (1 image)
```
npm run rest:1
```
### REST (5 images in one request)
```
npm run rest:5
```

### tRPC (1 image)
```
npm run trpc:1
```
### tRPC (5 images in one call)
```
npm run trpc:5
```

### gRPC direct (client -> model-service)
```
npm run grpc:direct
```

### gRPC microservice chain (client -> api-service -> model-service)
```
npm run grpc:via-api
```

### Run everything (recommended for your screenshots/logs)
```
npm run all
```

## Configuration (optional)
Environment variables you can set:
- `API_URL` (default: `http://127.0.0.1:4000`)
- `MODEL_ADDR` (default: `127.0.0.1:50051`)
- `API_GRPC_ADDR` (default: `127.0.0.1:50052`)
- `IMAGE=...` or `IMAGES=path1,path2,...` (if you don't want to use `./samples`)

Example:
```
IMAGES="C:\\data\\1.jpg,C:\\data\\2.jpg" npm run rest:5
```

## Notes (for your report)
- REST and tRPC return JSON (text serialization), while gRPC uses Protobuf (binary serialization).
- The API-service includes both:
  1) REST+tRPC endpoints (client -> API -> model-service)
  2) a gRPC endpoint that **forwards** to model-service (to benchmark service-to-service gRPC hop)
- This project uses a deterministic **demo classifier** (hash-based) so it works fully offline and is reproducible.

