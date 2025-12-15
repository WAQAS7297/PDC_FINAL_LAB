Comparison of REST, tRPC, and gRPC for Image Classification Services
1. Experimental Setup

REST endpoints tested:
POST /uploadImage, POST /uploadImages

tRPC procedures tested:
uploadImage, uploadImages

gRPC (Direct):
Client → Model Service (Unary RPC)

gRPC (Microservice):
Client → API Service → Model Service (Unary RPC)

2. Test Conditions

Machine: Laptop (Intel i7 14th Generation, 16 GB RAM)

Operating System: Windows

Network: Localhost (loopback)

Images Used: 5 sample images (JPG/PNG, mixed sizes)

3. Results
Method	1 Image Avg Latency (ms)	5 Images (Single Attempt) Total (ms)	Payload Size (bytes)	Network Calls
REST (JSON)	94.32	223.42	73 / 547	1
tRPC (JSON)	140.64	275.12	69 / 1034	1
gRPC (Direct)	69.45	N/A	~54	1
gRPC (Microservice)	100.68	N/A	~54	2

Explanation for N/A:
The gRPC implementation follows the assignment specification of unary RPC (UploadImage) for single-image classification. Since batched gRPC requests or streaming RPCs were not implemented, a valid measurement for “5 images in a single attempt” does not exist. Therefore, reporting this value as N/A ensures a fair and technically accurate comparison.

4. Observations

Serialization: REST and tRPC rely on JSON, which increases payload size and parsing overhead, particularly for batched requests.

Type Safety (tRPC): tRPC improves developer productivity and reliability through end-to-end TypeScript type safety; however, runtime performance remains similar to REST due to JSON serialization.

gRPC Efficiency: gRPC uses Protocol Buffers with HTTP/2, resulting in smaller payload sizes and lower latency compared to JSON-based approaches.

Microservice Architecture: gRPC via the API service introduces an additional network hop, slightly increasing latency while improving modularity, scalability, and service decoupling.

5. Conclusion

gRPC demonstrated the lowest latency and smallest payload size due to its binary Protobuf serialization and HTTP/2 transport. REST remains simple to implement but incurs higher overhead, especially for batched requests. tRPC enhances type safety and maintainability but does not significantly improve runtime performance over REST. In a microservice architecture, gRPC provides an efficient and scalable communication mechanism despite minor overhead from additional service-to-service hops.

🎓 Exam-Safe Key Statement

If asked why gRPC performed best:

“gRPC minimizes payload size and latency through Protocol Buffers and HTTP/2, making it well-suited for high-performance microservice communication.”