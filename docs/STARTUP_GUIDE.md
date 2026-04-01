# Vertex Master Startup Guide

Follow these steps to initialize the Vertex social network for testing or production.

## 1. Environment Setup
- Fill in `.env` from `.env.example`.
- Ensure `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD` are correct.

## 2. Database Initialization
```bash
# Run the wipe script (to clear legacy data)
node scripts/wipe-db.js

# Run the final seed script (for 8 Airtight personas)
node scripts/seed-vertex.js
```

## 3. Account Testing
Access the **[docs/ACCOUNTS.txt](file:///c:/Users/Arnav/OneDrive/Desktop/social-network-app-v2/docs/ACCOUNTS.txt)** for a full list of admin, adult, and teen test personas.

---
**Vertex — Connect with Airtight Integrity.**
