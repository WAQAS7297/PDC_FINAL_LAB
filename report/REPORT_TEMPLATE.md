# Comparison of REST, tRPC, and gRPC for Image Classification Services (Updated)

---

## 1. Experimental Setup (As Implemented)

### Services running (from terminals)

- **Model Service (Microservice B):**  
  gRPC server listening on `0.0.0.0:50051`

- **API Service (Microservice A):**
  - REST + tRPC on `http://127.0.0.1:4000`
  - tRPC endpoint: `http://127.0.0.1:4000/trpc`
  - gRPC server on `0.0.0.0:50052`, forwarding to Model Service at `127.0.0.1:50051`

---

### Methods tested

#### REST (JSON)
- `POST /uploadImage` (single)
- `POST /uploadImages` (batch of 5 in one request)

#### tRPC (JSON)
- `uploadImage` (single)
- `uploadImages` (batch of 5 in one call)

#### gRPC Direct (Unary RPC)
- Client → Model Service (`UploadImage`)

#### gRPC Microservice (Unary RPC)
- Client → API Service (gRPC) → Model Service (`UploadImage` forwarded)

---

## 2. Test Conditions

- **Machine:** Laptop (Intel i7 14th Gen, 16 GB RAM)
- **OS:** Windows
- **Network:** Localhost / loopback
- **Images:** 5 sample JPG/PNG (mixed sizes)

---

## 3. Results (From Client Output)

| Method              | 1 Image Avg Client Latency (ms) | 5 Images (Single Attempt) Total (ms) | Payload Size (bytes) | Network Calls |
|---------------------|----------------------------------|--------------------------------------|----------------------|---------------|
| REST (JSON)         | 94.32                            | 223.42                               | 73 / 547             | 1             |
| tRPC (JSON)         | 140.64                           | 275.12                               | 69 / 1034            | 1             |
| gRPC (Direct)       | 69.45                            | N/A                                  | ~54                  | 1             |
| gRPC (Microservice) | 100.68                           | N/A                                  | ~54                  | 2             |

---

### Extra timing details (from responses)

- **REST single:** `modelLatencyMs = 38`, `apiTotalMs = 59.25`
- **REST batch:** `apiTotalMs = 186.87`
- **tRPC single:** `modelLatencyMs = 26`, `totalMs = 46.7`
- **tRPC batch:** `totalMs = 197.79`
- **gRPC direct:** `modelLatencyMs = 23`
- **gRPC via API:** `modelLatencyMs = 38`

---

### Explanation for N/A (gRPC “5 images in one attempt”)

In this implementation, gRPC follows the assignment requirement of **Unary RPC**:

```proto
rpc UploadImage(ImageRequest) returns (ImageResponse);
Therefore, the client can only send one image per request. Since no batch RPC (e.g., UploadImages) or streaming RPC was implemented, there is no valid “5 images in a single attempt” measurement for gRPC.

Reporting this value as N/A is correct and keeps the comparison technically fair.

4. Observations (Based on Measured Output)
Serialization overhead (REST/tRPC):
Both REST and tRPC use JSON, which increases payload size and parsing cost, especially visible in batch requests:

REST batch payload: 547 bytes

tRPC batch payload: 1034 bytes (larger due to procedure structure and metadata)

tRPC type safety:
End-to-end TypeScript typing improves correctness and development speed, but runtime performance remains limited by JSON serialization.

gRPC efficiency:
gRPC achieves the lowest single-image latency (69.45 ms) with the smallest payload (~54 bytes) due to Protocol Buffers and HTTP/2.

Microservice hop overhead:
gRPC via the API service is slower (100.68 ms) than direct gRPC (69.45 ms) because it introduces an additional service-to-service network hop
(Client → API → Model).
However, this design improves modularity and scalability.

5. Conclusion (Exam-ready)
Based on the measured results, gRPC (Direct) provides the best performance for single-image classification, achieving the lowest latency (69.45 ms) and smallest payload size (~54 bytes). REST and tRPC are easier to integrate but incur higher overhead due to JSON serialization, particularly for batched requests. The gRPC microservice approach introduces slightly higher latency due to the additional hop but offers better separation of concerns and scalability.

🎓 Exam-Safe Key Statement
“gRPC performed best because it uses Protocol Buffers (binary serialization) over HTTP/2, reducing payload size and parsing overhead, which results in lower latency and makes it well-suited for high-performance microservice communication.”
