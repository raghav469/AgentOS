<div align="center">

# 🤖 AgentOS

### Autonomous AI Agent Platform for the Enterprise

**Build, deploy, and monitor multi-step AI agents that plan, reason, and act — autonomously.**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000?style=flat-square&logo=fastify&logoColor=white)](https://fastify.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](#license)

[Overview](#-overview) • [Architecture](#-system-architecture) • [Features](#-key-capabilities) • [Schema](#-database-schema) • [Quick Start](#-quick-start) • [Structure](#-project-structure)

</div>

---

## 📖 Overview

**AgentOS** is a full-stack, enterprise-grade **Autonomous AI Agent SaaS Platform**. It lets users create, configure, and run multi-step AI agents that autonomously plan tasks, select the right tools, gather external data, and execute work in the background — with full real-time visibility into every step, token, and dollar spent.

Built for teams that need production-grade agent infrastructure, not a prototype.

| | |
|---|---|
| 🧠 **Multi-LLM** | Gemini, OpenAI, and local Ollama models behind one unified interface |
| ⚙️ **ReAct Reasoning Loop** | Agents think, act, observe, and self-correct until the task is done |
| 📡 **Real-Time Streaming** | Live step-by-step progress over WebSockets — tokens, latency, cost |
| 🏢 **Multi-Tenant by Design** | Strict database-level isolation between users and their agents |
| 🚀 **Async at Scale** | BullMQ + Redis job queue keeps the API thread free under load |
| 🔐 **Production Security** | JWT auth, salted/hashed credentials, rate limiting out of the box |

---

## 🏗️ System Architecture

```
                        ┌────────────────────────────────────┐
                        │           Next.js 15 Frontend       │
                        │      (React · Framer Motion)        │
                        └──────────────────┬───────────────────┘
                                            │  HTTP / WebSockets
                                            ▼
                        ┌────────────────────────────────────┐
                        │        Fastify 5 REST API           │
                        │   @fastify/jwt · @fastify/rate-limit│
                        └───────────┬──────────────┬───────────┘
                                    │              │
                    ┌───────────────▼──┐      ┌────▼────────────────┐
                    │  PostgreSQL       │      │  Redis Queue/Cache  │
                    │  + pgvector       │      │  (BullMQ Engine)    │
                    └───────────────────┘      └────────┬─────────────┘
                                                          │
                                             ┌────────────▼─────────────┐
                                             │   Async Worker Process    │
                                             │   (LLM Execution Engine)  │
                                             └────────────┬─────────────┘
                                                          │
                                        Gemini · OpenAI · Ollama
```

**Request lifecycle:** the frontend talks to Fastify over HTTP/WebSocket → the API authenticates and enqueues the job in Redis via BullMQ → a dedicated worker process runs the agent's reasoning loop against the chosen LLM → progress and results stream back to the UI in real time while everything is persisted to Postgres.

---

## ⚡ Key Capabilities

### 1. Multi-LLM Engine
Unified LLM client (`BaseLLMClient.ts`) abstracts over:
- **Google Gemini** (`gemini-1.5-flash`)
- **OpenAI** (`gpt-4o`)
- **Ollama** (local models)

### 2. ReAct Reasoning Loop
Every agent run walks through a disciplined execution cycle:

```
Analyze Task → Thought → Tool Selection → Execution → Self-Correct → Complete
```

1. **Analyze** — evaluate the prompt against conversation history
2. **Think** — decide whether external tools are needed
3. **Select** — choose the right tool (`search_web`, `read_url_content`, `run_memory`)
4. **Execute** — run the tool safely and inspect its output
5. **Correct & Complete** — loop until the goal is satisfied, then return the final answer

### 3. Asynchronous Background Processing
Heavy agent work never blocks the API thread — it's queued via **BullMQ** on Redis and processed by a dedicated worker (`src/worker.ts`).

### 4. Real-Time WebSocket Streaming
Step-by-step progress, token usage, latency, and cost stream live to the UI (`src/routes/ws.ts`).

### 5. Enterprise Authentication & Multi-Tenancy
- Password salting/hashing via `bcryptjs`
- Signed session tokens via `@fastify/jwt`
- Strict per-user data isolation at the database level

### 6. Production Security
- Rate limiting: 100 req/min per IP via `@fastify/rate-limit`
- Secure HTTP-only cookie forwarding through the Next.js API proxy (`app/api/[...path]/route.ts`)

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `users` | Credentials, profiles, subscription state |
| `agents` | Agent definitions — name, system prompt, allowed tools, model, owner |
| `runs` | Execution instances — task, status, total tokens, total cost (USD) |
| `steps` | Individual reasoning steps — phase, model output, tool I/O, cost, latency |
| `run_memory` | `pgvector` (`VECTOR(1536)`) store for RAG and long-term agent memory |
| `tasks` | User-assigned tasks and todo items |

---

## 🚀 Quick Start

### Option A — Local Development

```bash
# 1. Start the Fastify backend (http://localhost:3001)
npm run dev

# 2. Start the Next.js frontend (http://localhost:3000)
cd frontend
npm run dev
```

### Option B — Dockerized Cluster (Production)

Spin up the full stack — Postgres, Redis, API, Worker, and Frontend — with one command:

```bash
docker compose up --build
```

---

## 📁 Project Structure

```
├── src/                      # Fastify Backend
│   ├── llm/                  # Unified Gemini / OpenAI / Ollama clients
│   ├── routes/                # API endpoints (agents, runs, users, tasks, billing, ws)
│   ├── tools/                  # Agent tool definitions (web search, scraper, memory)
│   ├── queue.ts               # BullMQ Redis queue setup
│   ├── server.ts               # Fastify application entry point
│   └── worker.ts               # Background execution worker
├── frontend/                  # Next.js 15 Frontend
│   └── src/
│       ├── app/                # App Router pages (Agents, Runs, Tasks, Settings, Auth)
│       ├── components/         # UI components (Sidebar, Header, Cards)
│       ├── lib/                # Helpers (getUserProfile, etc.)
│       └── middleware.ts       # Route protection middleware
├── migrations/                # DB migrations (node-pg-migrate)
└── docker-compose.yml         # Multi-container orchestration
```

---

## 🧭 Roadmap

- [ ] Agent marketplace / template gallery
- [ ] Fine-grained tool permissions per agent
- [ ] Usage-based billing dashboard
- [ ] Slack / Discord agent triggers

---

<div align="center">

**Built for teams that need agents that actually ship.**

</div>
