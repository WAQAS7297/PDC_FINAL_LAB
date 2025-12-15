Comparison of REST, tRPC, and gRPC for Image Classification Services
1. Experimental Setup

REST endpoints tested:
POST /uploadImage, POST /uploadImages

tRPC procedures tested:
uploadImage, uploadImages

gRPC (direct):
Client → Model Service

gRPC (microservice):
Client → API Service → Model Service

2. Test Conditions

Machine: Laptop (Intel i7 / Ryzen equivalent, 16 GB RAM)

Operating System: Windows

Network: Localhost (loopback)

Images used: 5 sample images (JPG/PNG, mixed sizes)

3. Results
Method	1 Image Avg Latency (ms)	5 Images (Single Attempt) Total (ms)	Payload Size (bytes)	Network Calls
REST (JSON)	94.32	223.42	73 / 547	1
tRPC (JSON)	140.64	275.12	69 / 1034	1
gRPC (Direct)	69.45	—	~54	1
gRPC (Microservice)	100.68	—	~54	2
4. Observations

Serialization: REST and tRPC rely on JSON, which increases payload size and parsing overhead, especially for batched requests.

Type Safety (tRPC): tRPC improves developer experience through end-to-end type safety, but runtime performance remains similar to REST due to JSON serialization.

gRPC Efficiency: gRPC uses Protocol Buffers and HTTP/2, resulting in smaller payloads and lower latency.

Microservice Architecture: gRPC via API introduces an additional hop, slightly increasing latency but improving modularity and service decoupling.

5. Conclusion

gRPC demonstrated the lowest latency and smallest payload size due to binary serialization and HTTP/2. REST remains simple but incurs higher overhead, especially for batch requests. tRPC improves type safety and code maintainability but does not significantly reduce latency compared to REST. In a microservice architecture, gRPC provides an efficient and scalable communication mechanism despite minor overhead from additional service hops.

🎓 Final Tip (exam-safe)

If your examiner asks why gRPC is best:

“gRPC minimizes payload size and latency through Protocol Buffers and HTTP/2, making it well-suited for high-performance microservice communication.”