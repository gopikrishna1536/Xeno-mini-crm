# Xeno Mini CRM - System Design & Domain Model

Architecture specification for high-throughput customer audience segmentation and messaging delivery.

## Microservice Architecture
- **Web Frontend**: Next.js 14 responsive marketing cockpit.
- **REST Backend**: Express.js microservice managing customer data and audience criteria evaluation.
- **Message Dispatcher**: Rate-limited queue processing transactional message broadcasts.
- **Channel Delivery Stub**: External SMS/Email simulated gateway with delivery receipts and status callbacks.
