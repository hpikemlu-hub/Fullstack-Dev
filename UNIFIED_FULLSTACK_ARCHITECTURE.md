# 🏗️ Unified Fullstack Architecture Design

## Executive Summary

This document outlines the **unified fullstack architecture** for migrating the workload management app from Next.js + Supabase to a cohesive, self-hosted solution using VPS + Coolify + PostgreSQL.

**CRITICAL DECISION: Next.js Full Stack (Option A)**
- Single codebase with App Router + API routes
- PostgreSQL integration with Prisma ORM
- JWT-based authentication
- WebSocket integration for real-time features
- 100% UI/UX preservation guaranteed

---

## 🎯 Architecture Decision: Next.js Full Stack

### Why Next.js Full Stack (Option A)?

✅ **Advantages:**
- **Single unified codebase** - no frontend/backend separation
- **Preserves existing UI/UX 100%** - components stay exactly the same
- **Leverages existing Next.js expertise** - team already familiar
- **Built-in API routes** - seamless integration between frontend and backend
- **Server-side rendering** - optimal performance
- **Easy deployment** - single Docker container
- **Gradual migration** - can migrate API routes one by one

❌ **Why Not Separate Backend (Option B)?**
- Adds complexity with two codebases
- Requires CORS configuration
- More deployment complexity
- Frontend-backend version sync issues

---

## 🏛️ Unified Architecture Overview

```mermaid
graph TB
    subgraph "VPS + Coolify"
        subgraph "Single Container"
            A[Next.js App Router] --> B[API Routes]
            B --> C[Prisma ORM]
            C --> D[PostgreSQL]
            B --> E[WebSocket Server]
            A --> F[React Components]
            F --> G[Tailwind CSS]
        end
        H[Redis Cache] --> B
        I[File Storage] --> B
    end
    
    J[GitHub] --> K[Coolify Auto-Deploy]
    K --> A
    
    L[Users] --> A
```

---

## 📁 Unified Codebase Structure

```
fullstack-dev/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (preserved)
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles (preserved)
│   │
│   ├── api/                     # Unified API Routes
│   │   ├── auth/
│   │   │   ├── login/route.ts   # JWT authentication
│   │   │   ├── logout/route.ts
│   │   │   └── refresh/route.ts # Token refresh
│   │   ├── employees/
│   │   │   ├── route.ts         # CRUD operations
│   │   │   └── [id]/route.ts
│   │   ├── workload/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── calendar/
│   │   │   ├── events/route.ts
│   │   │   └── realtime/route.ts # WebSocket endpoint
│   │   ├── dashboard/
│   │   │   └── stats/route.ts
│   │   └── upload/route.ts      # File upload
│   │
│   ├── dashboard/               # Pages (preserved UI/UX)
│   ├── employees/
│   ├── workload/
│   ├── calendar/
│   ├── reports/
│   └── auth/
│       └── login/
│
├── components/                   # UI Components (100% preserved)
│   ├── ui/                      # shadcn/ui components
│   ├── dashboard/
│   ├── employees/
│   ├── workload/
│   ├── calendar/
│   └── layout/
│
├── lib/                         # Utilities & Services
│   ├── auth/
│   │   ├── jwt.ts              # JWT utilities
│   │   ├── middleware.ts       # Auth middleware
│   │   └── session.ts          # Session management
│   ├── database/
│   │   ├── prisma.ts           # Prisma client
│   │   ├── migrations/         # Database migrations
│   │   └── seed.ts             # Database seeding
│   ├── realtime/
│   │   ├── websocket.ts        # WebSocket server
│   │   └── events.ts           # Event handling
│   ├── storage/
│   │   └── upload.ts           # File upload handling
│   └── utils.ts                # Utilities (preserved)
│
├── types/                       # TypeScript definitions
│   ├── auth.ts
│   ├── api.ts
│   └── database.ts
│
├── prisma/                      # Database Schema
│   ├── schema.prisma           # Database schema
│   ├── migrations/
│   └── seed.ts
│
├── public/                      # Static files (preserved)
│
├── docker/                      # Deployment
│   ├── Dockerfile
│   ├── docker-compose.yml      # Development environment
│   └── .dockerignore
│
├── scripts/                     # Migration & Utilities
│   ├── migrate-supabase.ts     # Data migration script
│   ├── setup-dev.sh            # Development setup
│   └── deploy.sh               # Deployment script
│
├── .env.example                 # Environment template
├── .env.local                   # Development environment
├── package.json
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind (preserved)
├── tsconfig.json
└── README.md
```

---

## 🔧 Tech Stack Components

### Core Framework
- **Next.js 15+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** (preserved exactly)
- **shadcn/ui** components (preserved)

### Database & ORM
- **PostgreSQL** (via Coolify)
- **Prisma ORM** for database operations
- **Database migrations** for schema versioning

### Authentication
- **JWT tokens** with refresh mechanism
- **bcrypt** for password hashing
- **Middleware-based** route protection

### Real-time Features
- **WebSocket server** (ws library)
- **Server-Sent Events** (fallback)
- **Event-driven architecture**

### Caching & Storage
- **Redis** for session/cache (optional)
- **Local file storage** with volume mounts
- **Image optimization** with Next.js

### Development & Deployment
- **Docker** for containerization
- **Coolify** for deployment orchestration
- **GitHub Actions** for CI/CD

---

## 🔄 Migration Strategy

### Phase 1: Foundation Setup (Week 1)

1. **Create fullstack-dev folder**
   ```bash
   mkdir fullstack-dev
   cd fullstack-dev
   npx create-next-app@latest . --typescript --tailwind --app
   ```

2. **Copy existing UI components** (100% preservation)
   ```bash
   cp -r ../src/components ./components
   cp -r ../src/app/(pages) ./app/
   cp ../src/app/globals.css ./app/
   cp ../tailwind.config.js ./
   ```

3. **Setup Prisma & PostgreSQL**
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   ```

4. **Configure development environment**
   ```bash
   docker-compose up -d postgres redis
   ```

### Phase 2: API Migration (Week 2)

1. **Migrate authentication system**
   - Replace Supabase Auth with JWT
   - Implement login/logout API routes
   - Add middleware for route protection

2. **Migrate CRUD API routes**
   - `/api/employees` → Prisma operations
   - `/api/workload` → Prisma operations  
   - `/api/calendar` → Prisma operations
   - `/api/dashboard` → Prisma operations

3. **Implement WebSocket server**
   - Real-time calendar updates
   - Live dashboard statistics
   - Team collaboration features

### Phase 3: Data Migration (Week 3)

1. **Create migration scripts**
   ```typescript
   // scripts/migrate-supabase.ts
   import { supabase } from '../lib/supabase'
   import { prisma } from '../lib/database/prisma'

   async function migrateData() {
     // Migrate users
     const { data: users } = await supabase.from('users').select('*')
     await prisma.user.createMany({ data: users })
     
     // Migrate workload
     // Migrate calendar events
     // etc.
   }
   ```

2. **Test data integrity**
   - Verify all records migrated
   - Test relationships
   - Validate constraints

### Phase 4: Deployment Setup (Week 4)

1. **Docker configuration**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Coolify integration**
   - GitHub repository connection
   - Environment variables setup
   - Auto-deployment pipeline

---

## 🔐 Authentication Architecture

### JWT-based Authentication

```typescript
// lib/auth/jwt.ts
import jwt from 'jsonwebtoken'

interface TokenPayload {
  userId: string
  email: string
  role: 'admin' | 'user'
}

export function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m'
  })
  
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d'
  })
  
  return { accessToken, refreshToken }
}
```

### Session Management

```typescript
// lib/auth/session.ts
import { cookies } from 'next/headers'

export async function setSession(tokens: Tokens) {
  const cookieStore = cookies()
  
  cookieStore.set('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000 // 15 minutes
  })
  
  cookieStore.set('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
}
```

---

## 🌐 Real-time Architecture

### WebSocket Integration

```typescript
// lib/realtime/websocket.ts
import { WebSocketServer } from 'ws'
import { createServer } from 'http'

const server = createServer()
const wss = new WebSocketServer({ server })

export function initializeWebSocket() {
  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString())
      
      switch (message.type) {
        case 'calendar_update':
          broadcastToRoom(`calendar_${message.eventId}`, message.data)
          break
        case 'dashboard_refresh':
          broadcastToAll({ type: 'dashboard_stats', data: message.data })
          break
      }
    })
  })
}

function broadcastToRoom(room: string, data: any) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data))
    }
  })
}
```

### Server-Sent Events (Fallback)

```typescript
// app/api/realtime/events/route.ts
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      const sendEvent = (data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        )
      }
      
      // Send periodic updates
      const interval = setInterval(() => {
        sendEvent({ type: 'heartbeat', timestamp: Date.now() })
      }, 30000)
      
      return () => clearInterval(interval)
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

---

## 💾 Database Integration

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(cuid())
  namaLengkap String   @map("nama_lengkap")
  nip         String?  @unique
  golongan    String?
  jabatan     String?
  username    String   @unique
  email       String?  @unique
  password    String
  role        Role     @default(USER)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  workloads       Workload[]
  calendarEvents  CalendarEvent[]
  auditLogs       AuditLog[]
  
  @@map("users")
}

model Workload {
  id          String      @id @default(cuid())
  userId      String      @map("user_id")
  nama        String
  type        String
  deskripsi   String?
  status      WorkloadStatus @default(PENDING)
  tglDiterima DateTime?   @map("tgl_diterima")
  fungsi      String?
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("workload")
}

model CalendarEvent {
  id           String    @id @default(cuid())
  creatorId    String    @map("creator_id")
  title        String
  description  String?
  participants String[]
  location     String?
  dipa         String?
  startDate    DateTime  @map("start_date")
  endDate      DateTime  @map("end_date")
  color        String    @default("#0d6efd")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  
  creator User @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  
  @@map("calendar_events")
}

enum Role {
  ADMIN
  USER
}

enum WorkloadStatus {
  DONE
  ON_PROGRESS
  PENDING
}
```

### Database Operations

```typescript
// lib/database/operations.ts
import { prisma } from './prisma'

export class DatabaseOperations {
  // Users
  async getUsers(filters?: UserFilters) {
    return await prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        namaLengkap: true,
        nip: true,
        golongan: true,
        jabatan: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { namaLengkap: 'asc' }
    })
  }
  
  // Workload
  async getWorkloads(userId?: string) {
    return await prisma.workload.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: {
          select: { namaLengkap: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
  
  // Calendar Events
  async getCalendarEvents(start: Date, end: Date) {
    return await prisma.calendarEvent.findMany({
      where: {
        OR: [
          { startDate: { gte: start, lte: end } },
          { endDate: { gte: start, lte: end } },
          { AND: [
            { startDate: { lte: start } },
            { endDate: { gte: end } }
          ]}
        ]
      },
      include: {
        creator: {
          select: { namaLengkap: true }
        }
      }
    })
  }
}
```

---

## 🚀 Deployment Configuration

### Docker Setup

```dockerfile
# docker/Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Coolify Configuration

```yaml
# coolify-config.yml
services:
  app:
    image: workload-app
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - postgres
    volumes:
      - uploads:/app/uploads
      
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=workload_db
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
  uploads:
```

---

## 🔄 API Route Migration Map

### Current Supabase → New Prisma Routes

| Current Route | Current Function | New Route | New Implementation |
|---------------|------------------|-----------|-------------------|
| `/api/employees` | Supabase query | `/api/employees` | Prisma operations |
| `/api/employees/[id]` | Supabase CRUD | `/api/employees/[id]` | Prisma CRUD |
| `/api/workload` | Supabase query | `/api/workload` | Prisma operations |
| `/api/calendar/events` | Supabase query | `/api/calendar/events` | Prisma + WebSocket |
| `/api/dashboard/stats` | Supabase aggregation | `/api/dashboard/stats` | Prisma aggregation |
| `/api/auth/resolve-username` | Supabase auth | `/api/auth/login` | JWT authentication |

### Authentication Flow Migration

```typescript
// Before (Supabase)
const { data, error } = await supabase.auth.signInWithPassword({
  email: username,
  password: password
})

// After (JWT)
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
})
```

---

## 📊 Performance & Scalability

### Caching Strategy

```typescript
// lib/cache/redis.ts
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export class CacheManager {
  async set(key: string, value: any, ttl: number = 3600) {
    await redis.setex(key, ttl, JSON.stringify(value))
  }
  
  async get(key: string) {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  }
  
  async invalidate(pattern: string) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}

// Usage in API routes
export async function GET() {
  const cacheKey = 'dashboard:stats'
  const cached = await cache.get(cacheKey)
  
  if (cached) return NextResponse.json(cached)
  
  const stats = await getDashboardStats()
  await cache.set(cacheKey, stats, 300) // 5 minutes
  
  return NextResponse.json(stats)
}
```

### Database Optimization

```typescript
// Indexed queries
const workloads = await prisma.workload.findMany({
  where: { status: 'pending' }, // Index on status
  include: {
    user: { select: { namaLengkap: true } }
  },
  orderBy: { tglDiterima: 'desc' } // Index on tgl_diterima
})
```

---

## 🔧 Development Workflow

### Local Development Setup

```bash
# 1. Clone and setup
git clone <repo> fullstack-dev
cd fullstack-dev
npm install

# 2. Setup database
docker-compose up -d postgres redis
npx prisma migrate dev
npx prisma db seed

# 3. Start development
npm run dev
```

### Environment Variables

```env
# .env.local
DATABASE_URL="postgresql://user:pass@localhost:5432/workload_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
UPLOAD_PATH="/uploads"
```

### Testing Strategy

```typescript
// tests/api/employees.test.ts
import { testApiHandler } from 'next-test-api-route-handler'
import handler from '@/app/api/employees/route'

describe('/api/employees', () => {
  it('GET returns employee list', async () => {
    await testApiHandler({
      appHandler: handler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' })
        const data = await res.json()
        
        expect(res.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      }
    })
  })
})
```

---

## 🎯 Success Metrics

### Migration Success Criteria

✅ **Functional Parity**
- [ ] All current features work identically
- [ ] Real-time updates functional
- [ ] User authentication seamless
- [ ] Data integrity maintained

✅ **Performance Benchmarks**
- [ ] Page load time ≤ current performance
- [ ] API response time ≤ 500ms
- [ ] Real-time updates ≤ 100ms latency
- [ ] Database queries optimized

✅ **User Experience**
- [ ] Zero UI/UX changes
- [ ] Same navigation flow
- [ ] Identical feature behavior
- [ ] No learning curve for users

✅ **Technical Requirements**
- [ ] Single codebase deployment
- [ ] Automatic GitHub integration
- [ ] Rollback capability
- [ ] 99.9% uptime target

---

## 📋 Implementation Checklist

### Week 1: Foundation
- [ ] Create fullstack-dev folder structure
- [ ] Copy UI components (100% preservation)
- [ ] Setup Prisma with PostgreSQL
- [ ] Configure Docker development environment
- [ ] Migrate basic pages and layouts

### Week 2: API & Authentication
- [ ] Implement JWT authentication system
- [ ] Migrate all API routes to Prisma
- [ ] Setup WebSocket server
- [ ] Test API functionality
- [ ] Implement middleware protection

### Week 3: Data Migration
- [ ] Create Supabase → Prisma migration scripts
- [ ] Test data migration locally
- [ ] Validate data integrity
- [ ] Setup database indexes
- [ ] Performance testing

### Week 4: Deployment
- [ ] Configure Dockerfile
- [ ] Setup Coolify deployment
- [ ] Configure GitHub Actions
- [ ] Production testing
- [ ] Go-live preparation

---

## 🚨 Risk Mitigation

### Technical Risks

**Risk**: Real-time features not working
**Mitigation**: WebSocket + SSE fallback, extensive testing

**Risk**: Data migration issues  
**Mitigation**: Comprehensive migration scripts, data validation, rollback plan

**Risk**: Performance degradation
**Mitigation**: Caching strategy, database optimization, load testing

### Business Risks

**Risk**: Downtime during migration
**Mitigation**: Blue-green deployment, parallel systems, quick rollback

**Risk**: User training needed
**Mitigation**: Zero UI changes guarantee, identical user experience

**Risk**: Feature regression
**Mitigation**: Comprehensive testing, feature parity checklist

---

This unified fullstack architecture ensures a seamless migration while maintaining 100% UI/UX preservation and providing a scalable, maintainable solution for the VPS + Coolify + PostgreSQL environment.