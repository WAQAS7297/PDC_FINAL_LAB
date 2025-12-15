Comparison of REST, tRPC, and gRPC for Image Classification Services (Updated)
1. Experimental Setup (As Implemented)

Services running (from terminals):

Model Service (Microservice B): gRPC server listening on 0.0.0.0:50051

API Service (Microservice A):

REST + tRPC on http://127.0.0.1:4000

tRPC endpoint: http://127.0.0.1:4000/trpc

gRPC server on 0.0.0.0:50052, forwarding to Model Service at 127.0.0.1:50051

Methods tested:

REST (JSON)

POST /uploadImage (single)

POST /uploadImages (batch of 5 in one request)

tRPC (JSON)

uploadImage (single)

uploadImages (batch of 5 in one call)

gRPC Direct (Unary RPC)

Client → Model Service (UploadImage)

gRPC Microservice (Unary RPC)

Client → API Service (gRPC) → Model Service (UploadImage forwarded)

2. Test Conditions

Machine: Laptop (Intel i7 14th Gen, 16 GB RAM)

OS: Windows

Network: Localhost/loopback

Images: 5 sample JPG/PNG (mixed sizes)

3. Results (From Client Output)
Method	1 Image Avg Client Latency (ms)	5 Images (Single Attempt) Total (ms)	Payload Size (bytes)	Network Calls
REST (JSON)	94.32	223.42	73 / 547	1
tRPC (JSON)	140.64	275.12	69 / 1034	1
gRPC (Direct)	69.45	N/A	~54	1
gRPC (Microservice)	100.68	N/A	~54	2

Extra timing details (from responses):

REST single: modelLatencyMs=38, apiTotalMs=59.25

REST batch: apiTotalMs=186.87

tRPC single: modelLatencyMs=26, totalMs=46.7

tRPC batch: totalMs=197.79

gRPC direct: modelLatencyMs=23

gRPC via API: modelLatencyMs=38

Explanation for N/A (gRPC “5 images in one attempt”)

In your implementation, gRPC follows the assignment requirement of Unary RPC:

rpc UploadImage(ImageRequest) returns (ImageResponse);


So the client can only send one image per request. Since you did not implement a batch RPC (e.g., UploadImages) or streaming RPC, there is no valid “5 images in a single attempt” measurement for gRPC. Reporting it as N/A is correct and keeps the comparison technically fair.

4. Observations (Based on Your Measured Output)

Serialization overhead (REST/tRPC): Both REST and tRPC use JSON, which increases payload sizes and parsing cost—especially visible in batching:

REST batch payload: 547 bytes

tRPC batch payload: 1034 bytes (bigger due to procedure structure + metadata)

tRPC type safety: Strong TypeScript end-to-end typing improves correctness and dev speed, but runtime is still JSON-based, so it doesn’t beat REST in performance.

gRPC efficiency: Lowest single-image latency (69.45 ms) with the smallest payload (~54 bytes) due to Protobuf + HTTP/2.

Microservice hop overhead: gRPC via API-service is slower (100.68 ms) than direct gRPC (69.45 ms) because it adds one extra service-to-service network call (Client→API and API→Model). Still, it improves modular design and scaling.

5. Conclusion (Exam-ready)

Based on the measured output, gRPC (Direct) achieved the best latency (69.45 ms) and smallest payload (~54 bytes) for single-image classification. REST and tRPC are easier to integrate but have higher overhead due to JSON, especially for batched requests. The microservice gRPC approach slightly increases latency due to the additional hop, but it provides better separation of concerns and scalability.

🎓 Exam-Safe Key Statement

“gRPC performed best because it uses Protocol Buffers (binary serialization) over HTTP/2, which reduces payload size and parsing overhead, resulting in lower latency—especially suitable for high-performance microservice communication.”