# AI Content Moderation Platform

**A full-stack AI-powered platform for automated image policy screening, structured appeal workflows, and administrator oversight — built for production.**

## Table of Contents

* [Overview](#overview)
* [Architecture](#architecture)
* [Tech Stack](#tech-stack)
* [Features](#features)
* [Project Structure](#project-structure)
* [Quick Start](#quick-start)
* [Environment Variables](#environment-variables)
* [Key Design Decisions](#key-design-decisions)
* [API Reference](#api-reference)
* [Redis Caching Strategy](#redis-caching-strategy)
* [Logging & Error Identification](#logging--error-identification)

---

## Overview

The AI Content Moderation Platform allows users to submit images for automated policy compliance screening across **6 violation categories**. The system produces structured verdicts, supports a formal **appeal process** for disputed outcomes, and gives administrators **fine-grained control** over moderation policies — all backed by OpenAI's Vision API.

### Moderation Categories

#### `graphic_violence`
Depictions of physical harm, gore, or serious injury.

#### `hate_symbols`
Imagery linked to extremist ideologies or terrorist organizations.

#### `self_harm`
Visual content depicting or glorifying self-inflicted injury.

#### `extremist_propaganda`
Content promoting or recruiting for violent extremist movements.

#### `weapons_contraband`
Illegal weapons, drug manufacturing, or trafficking imagery.

#### `harassment_humiliation`
Content intended to degrade or publicly humiliate an individual.

### User Roles

#### User
Register, submit images, view history, file appeals, track appeal status.

#### Admin
All user capabilities + appeals queue, verdict overrides, policy config, analytics.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             Client (Browser)                             │
│                            Next.js 14 — App Router                       │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │ HTTP / REST
┌────────────────────────────▼─────────────────────────────────────────────┐
│                      Express REST API                                    │
│          Auth · Submissions · Appeals · Policies · Analytics             │
│                                                                          │
│   ┌──────────────┐   ┌────────────────┐   ┌────────────────────────────┐ │
│   │    Winston   │   │    Redis Cache │   │     OpenAI GPT-4o          │ │
│   │    Logger    │   │    (policies,  │   │     Vision API             │ │
│   │              │   │    analytics)  │   │     (AI moderation)        │ │
│   └──────────────┘   └────────────────┘   └────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │ Mongoose ODM
┌────────────────────────────▼─────────────────────────────────────────────┐
│                         MongoDB 7                                        │
│     Users · Submissions · Appeals · Policies · (Verdicts)                │
└──────────────────────────────────────────────────────────────────────────┘

```

The frontend and backend are completely decoupled — the Next.js app communicates **only through the REST API**. No direct database access from the frontend.

---

## Tech Stack

#### Frontend — Next.js 14 (App Router) + TypeScript
File-based routing, SSR/CSR hybrid.

#### UI — Tailwind CSS + shadcn/ui
Accessible, professional components.

#### State — TanStack Query v5 + Zustand
Server state + client state separation.

#### Backend — Express.js + TypeScript
REST API server.

#### Database — MongoDB 7 + Mongoose
Document storage with structured schemas.

#### Cache — Redis 7
Policy config cache, analytics cache.

#### Auth — JWT (access + refresh tokens) + bcrypt
Stateless, secure authentication.

#### AI — OpenAI GPT-4o Vision API
Image classification and reasoning.

#### Validation — Zod
Shared schemas across frontend and backend.

#### Logging — Winston
Structured logging with level-based output.

#### Uploads — Multer
Multipart image handling.

#### Containers — Docker + Docker Compose
Single-command setup.

---

## Features

### For Users

* Submit 1–10 images in a single request — each analyzed independently
* View full submission history filtered by outcome, category, and date
* Per-image verdict: **Approved**, **Flagged for Review**, or **Blocked**
* See AI reasoning and confidence scores per category
* File appeals on flagged or blocked submissions with written justification
* Track appeal status in real time (Pending → Accepted / Rejected)

### For Admins

* **Appeals Queue** — review pending appeals, accept or reject with optional written response. Accepted appeals override the verdict to Approved.
* **Policy Configuration** — per category: enable/disable, set confidence threshold (0–100%), set enforcement behavior (Auto-Block or Flag for Review)
* **Analytics Dashboard**

  * Submission volume over time (7 / 30 / 90 day views)
  * Verdict distribution by outcome and category
  * Appeal resolution rate and outcome breakdown
  * User rankings by submission count and violation count

---

## Project Structure

```
ai-moderation-platform/
├── apps/
│   ├── api/                          # Express backend
│   │   └── src/
│   │       ├── config/               # DB, Redis, env validation
│   │       ├── models/               # Mongoose models
│   │       ├── routes/               # All route handlers
│   │       ├── middleware/           # Auth, admin guard, error handler, upload
│   │       ├── services/
│   │       │   ├── moderationAI.ts   # OpenAI Vision integration
│   │       │   └── cache.ts          # Redis cache helpers
│   │       └── utils/
│   │           ├── logger.ts         # Winston logger
│   │           └── jwt.ts            # Token helpers
│   └── web/                          # Next.js 14 frontend
│       └── src/
│           ├── app/
│           │   ├── (auth)/           # Login, Register
│           │   └── (protected)/      # Dashboard, Submissions, Appeals, Admin
│           ├── features/             # Feature-scoped components + hooks
│           ├── common/               # Shared UI components, API client
│           └── store/                # Zustand auth store
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick Start

This runs everything: MongoDB, Redis, API, and Web in one command.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/ai-moderation-platform.git
cd ai-moderation-platform

# 2. Copy and configure environment variables
cp .env.example .env
# Open .env and add your OPENAI_API_KEY

# 3. Start all services
docker-compose up --build
```

Open **http://localhost:3000** in your browser.

The default admin account is created automatically from your env vars on first boot.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

#### `MONGODB_URI`
MongoDB connection string.

#### `REDIS_URL`
Redis connection URL (e.g. `redis://localhost:6379`).

#### `JWT_SECRET`
Secret for signing access tokens (min 32 chars).

#### `JWT_REFRESH_SECRET`
Secret for signing refresh tokens (min 32 chars).

#### `JWT_EXPIRES_IN`
Access token TTL (e.g. `15m`).

#### `JWT_REFRESH_EXPIRES_IN`
Refresh token TTL (e.g. `7d`).

#### `OPENAI_API_KEY`
OpenAI API key.

#### `PORT`
API server port (default `4000`).

#### `CLIENT_URL`
Frontend origin for CORS (e.g. `http://localhost:3000`).

#### `NODE_ENV`
`development` or `production`.

#### `ADMIN_EMAIL`
Email for the seeded admin account.

#### `ADMIN_PASSWORD`
Password for the seeded admin account (min 8 chars).

#### `NEXT_PUBLIC_API_URL`
API base URL for the frontend (e.g. `http://localhost:4000/api/v1`).

---

## Key Design Decisions

### 1. Monorepo with Turborepo

Both apps live in a single repository so shared logic (types, validation schemas) stays in sync. Turborepo handles parallel builds and caching so CI stays fast.

### 2. JWT with httpOnly Refresh Token Cookie

Access tokens (15 min) are stored in memory on the client. Refresh tokens (7 days) live in an httpOnly cookie — inaccessible to JavaScript, protecting against XSS. The frontend transparently refreshes the access token on 401 responses via an Axios interceptor.

### 3. Verdict Engine Reads Policies Fresh on Every Submission

Policy changes by admins take effect immediately for new submissions. The verdict engine always queries current policy settings (via Redis cache with short TTL) rather than using stale snapshots. Old verdicts are never retroactively changed.

### 4. Policy Priority: `blocked` > `flagged` > `approved`

If any enabled category's AI confidence meets or exceeds its configured threshold, enforcement is applied. `auto_block` categories override `flag_for_review` categories — a submission blocked by one category cannot be merely flagged by another.

### 5. Redis for Hot Data

Policies are read on every submission and rarely change — a perfect cache candidate. Analytics aggregations are expensive MongoDB operations cached with a short TTL to avoid hammering the DB on every dashboard refresh. See [Redis Caching Strategy](#redis-caching-strategy) below.

---

## API Reference

### Auth

#### POST `/api/v1/auth/register`
Auth: None. Register a new user.

#### POST `/api/v1/auth/login`
Auth: None. Login, receive access token + set cookie.

#### POST `/api/v1/auth/refresh`
Auth: Cookie. Refresh access token.

#### POST `/api/v1/auth/logout`
Auth: Cookie. Clear refresh cookie.

### Submissions

#### POST `/api/v1/submissions`
Auth: User. Upload images (multipart, field: `images`).

#### GET `/api/v1/submissions`
Auth: User. List own submissions (`?outcome=`, `?page=`, `?limit=`).

#### GET `/api/v1/submissions/:id`
Auth: User. Get submission + verdict detail.

### Appeals

#### POST `/api/v1/appeals`
Auth: User. File an appeal on a flagged/blocked submission.

#### GET `/api/v1/appeals`
Auth: User. List own appeals.

#### GET `/api/v1/appeals/queue`
Auth: Admin. View all pending appeals.

#### PATCH `/api/v1/appeals/:id/review`
Auth: Admin. Accept or reject an appeal.

### Policies

#### GET `/api/v1/policies`
Auth: Admin. Get all 6 category policies.

#### PATCH `/api/v1/policies/:category`
Auth: Admin. Update a category's settings.

### Analytics

#### GET `/api/v1/analytics/overview`
Auth: Admin. Total submissions, pending appeals, verdict counts.

#### GET `/api/v1/analytics/submissions-over-time`
Auth: Admin. Daily counts (`?period=7|30|90`).

#### GET `/api/v1/analytics/category-breakdown`
Auth: Admin. Detection counts per category.

#### GET `/api/v1/analytics/appeals-summary`
Auth: Admin. Appeal resolution stats.

#### GET `/api/v1/analytics/user-rankings`
Auth: Admin. Top 10 users by submission or violation count.

---

## Redis Caching Strategy

Redis is used to cache two categories of hot data that are expensive to recompute but change infrequently.

### 1. Policy Cache (`policies:all`)

Policies are loaded on **every single image submission** to determine the verdict. Without caching, this is a DB round-trip per image. With Redis:

```
Cache key:  policies:all
TTL:        60 seconds
Invalidated: immediately on any PATCH /policies/:category
```

When an admin updates a policy, the cache key is deleted so the next submission picks up fresh data within 1 second.

### 2. Analytics Cache

Analytics aggregations run expensive MongoDB `$group` and `$lookup` pipelines across the full submissions collection. These are cached with longer TTLs since admins do not need real-time precision:

```
Cache key:  analytics:overview          TTL: 2 minutes
Cache key:  analytics:submissions:30d   TTL: 5 minutes
Cache key:  analytics:category-breakdown TTL: 5 minutes
Cache key:  analytics:appeals-summary   TTL: 2 minutes
Cache key:  analytics:user-rankings     TTL: 5 minutes
```

### Cache Helper Pattern

```ts
// services/cache.ts
export async function getCached<T>(key: string, ttl: number, fallback: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const fresh = await fallback();
  await redis.setex(key, ttl, JSON.stringify(fresh));
  return fresh;
}
```

Usage is one line at the call site:

```ts
const policies = await getCached('policies:all', 60, () => Policy.find({ enabled: true }));
```

---

## Logging & Error Identification

All application logging is handled by **Winston**, providing structured, level-based output that makes errors easy to identify in both development and production.

### Log Levels

#### `error`
Unhandled exceptions, DB connection failures, AI service errors.

#### `warn`
Deprecated usage, failed login attempts, rate limit hits.

#### `info`
Server start, DB connected, admin seeded, request completed.

#### `debug`
AI prompt/response details, cache hit/miss (dev only).

### Output Format

**Development** — human-readable, colorized console output:

```
[2024-01-15 14:32:01] INFO:  MongoDB connected
[2024-01-15 14:32:05] INFO:  POST /api/v1/submissions 201 842ms
[2024-01-15 14:32:05] DEBUG: Cache miss: policies:all — fetching from DB
[2024-01-15 14:32:06] WARN:  Failed login attempt for email: user@example.com
[2024-01-15 14:32:10] ERROR: OpenAI API error: Rate limit exceeded
```

**Production** — structured JSON for log aggregation tools (Datadog, CloudWatch, etc.):

```json
{"level":"error","message":"OpenAI API error: Rate limit exceeded","timestamp":"2024-01-15T14:32:10.000Z","stack":"..."}
```

### Global Error Handler

All unhandled route errors funnel through a single Express error middleware that:

1. Logs the full error (with stack trace in dev, without in prod)
2. Returns a clean JSON response with the appropriate HTTP status
3. Never leaks internal stack traces to the client

```ts
// All async route handlers wrap with asyncHandler()
// which catches thrown errors and passes them to next()
router.post('/submissions', asyncHandler(async (req, res) => {
  // any throw here is caught, logged, and returned as { message: "..." }
}));
```

AI service errors (`moderationAI.ts`) are logged with context before re-throwing, so you always know which submission triggered the failure and why.

