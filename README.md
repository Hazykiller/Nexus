# Vertex — Premium Airtight Social Network

Vertex is a production-ready, highly secure social network built with **Next.js**, **Neo4j**, and **Pusher**. Designed with a privacy-first philosophy, it features military-grade encryption and a "real-life" collaborative algorithmic feed.

## 💎 Core Features

### 🛡️ Airtight Security Architecture
- **At-Rest Encryption**: Sensitive user metadata (Emails, Login info) is cryptographically secured before database persistence.
- **Session Fingerprinting**: Sessions are bound to **IP/Device User-Agents** to neutralize session hijacking.
- **Global Middleware Guard**: Every mutation is intercepted and blocked for unverified or unauthenticated users.
- **Argon2/BCrypt Hashing**: Standard-setting hashing for all authentication credentials.

### 🔐 Multi-Layer Privacy
- **E2EE Messaging**: Full End-to-End Encryption for personal DMs and Group chats (including shared pictures and posts).
- **Public/Private Profiles**: Granular visibility controls for user profiles and content.
- **Close Friends Tier**: Post visibility limited to exclusive "Close Friend" circles.

### 🧠 Collaborative Algorithmic Feed
- **"Real-Life" Discovery**: Explore feed recommends content based on Shared Interests and Network Proximity (Friends of Friends).
- **Trending Intelligence**: Automatic fallback to global trending posts for new users.

## 🚀 Quick Start

### 1. Prerequisites
- **Neo4j AuraDB** (or a local Neo4j instance)
- **Cloudinary** (for secure media storage)
- **Pusher** (for real-time messaging)

### 2. Environment Variables
Rename `.env.example` to `.env` and fill in your airtight credentials.

### 3. Install & Run
```bash
npm install
npm run dev
```

---

## 🏗️ Architecture & Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Lucide Icons.
- **Backend**: Next.js API Routes, Neo4j (Cypher Query Language).
- **Security**: AES-256-GCM, Web Crypto API.
- **Infrastructure**: Vercel (Deployment), Cloudinary (Media).

---
**Vertex — Connect with Airtight Integrity.**
