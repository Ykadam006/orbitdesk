# OrbitDesk — Real-Time Collaborative Workspace

A full-stack real-time project management app built with Next.js, TypeScript, PostgreSQL, Prisma, Socket.IO, Docker, and AI integration.

## Features

- **Real-time Kanban board** — drag-and-drop cards with live sync via WebSockets
- **Workspace collaboration** — create teams, invite members with codes
- **Role-based access control** — Owner, Admin, Member with server-side authorization
- **Live presence indicators** — see who is viewing the board
- **Activity logs** — track card created, moved, updated, deleted events
- **AI project summary** — generate progress reports with Anthropic Claude
- **Analytics dashboard** — charts for status, priority, and member workload
- **Card comments** — discussions on individual cards with real-time updates
- **Card labels/tags** — color-coded labels for categorizing cards
- **Search & filter** — filter cards by title, assignee, priority, or due date
- **Board templates** — pre-built templates (Sprint, Bug Tracker, Features) when creating boards
- **Dark mode** — system-aware theme toggle with localStorage persistence
- **Password reset** — forgot password flow with token-based reset
- **Mobile responsive** — touch-friendly kanban with swipeable columns and slide-out panels
- **Error handling** — error boundaries, loading states, empty states, and 404 page
- **Dockerized setup** — Docker Compose for local development
- **CI/CD pipeline** — GitHub Actions for lint, build, and test

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| State | Zustand, React Hook Form, Zod |
| Backend | Next.js API Routes |
| Database | PostgreSQL, Prisma ORM |
| Auth | Auth.js (NextAuth v5) |
| Real-time | Socket.IO |
| Drag & Drop | dnd-kit |
| Charts | Recharts |
| AI | Anthropic Claude API |
| DevOps | Docker, GitHub Actions |

## Architecture

```
Browser ──► Next.js App (API Routes + React) ──► PostgreSQL
   │                                                 ▲
   └──► Socket.IO Server ◄──────────────────────────┘
         (real-time events)
```

**Card update flow:**
1. User drags card → UI updates optimistically
2. API route validates permission and updates database
3. Client emits Socket.IO event
4. Server broadcasts to all users in the board room
5. Other users see the card move live

## RBAC Model

| Role | Workspace | Board | Cards | Members |
|------|-----------|-------|-------|---------|
| Owner | Delete, Edit | Create, Edit, Delete | Full access | Manage roles, Remove |
| Admin | Edit | Create, Edit, Delete | Full access | — |
| Member | View | View | Create, Edit, Move | — |

## Local Setup

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL) or a local PostgreSQL instance

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
docker compose up db -d

# 3. Run migrations and seed
npx prisma migrate dev --name init
npx prisma db seed

# 4. Start the app (two terminals)
npm run dev          # Next.js on port 3000
npm run dev:socket   # Socket.IO on port 3001
```

### Docker Compose (full stack)

```bash
docker compose up --build
```

### Test Credentials

| User | Email | Password |
|------|-------|----------|
| Yogesh Kadam | yogesh@orbitdesk.dev | password123 |
| Alex Johnson | alex@orbitdesk.dev | password123 |

## Database Schema

```
User ──┬── Membership ──── Workspace ──── Board ──── Card
       │                       │
       └── ActivityLog ────────┘
```

6 models: User, Workspace, Membership, Board, Card, ActivityLog

## Environment Variables

```bash
DATABASE_URL          # PostgreSQL connection string
AUTH_SECRET           # NextAuth secret key
AUTH_URL              # App URL (http://localhost:3000)
NEXT_PUBLIC_SOCKET_URL # Socket server URL (http://localhost:3001)
ANTHROPIC_API_KEY     # Optional — for AI summary feature
```

## API Routes

```
Auth:       POST /api/auth/register, [...nextauth]
Reset:      POST /api/auth/forgot-password, POST /api/auth/reset-password
Spaces:     GET|POST /api/workspaces, GET|PATCH|DELETE /api/workspaces/:id
Join:       POST /api/workspaces/join
Members:    GET /api/workspaces/:id/members, PATCH .../role, DELETE
Boards:     GET|POST /api/workspaces/:id/boards, GET|PATCH|DELETE /api/boards/:id
Cards:      GET|POST /api/boards/:id/cards, PATCH|DELETE /api/cards/:id
Move:       PATCH /api/cards/:id/move
Comments:   GET|POST /api/cards/:id/comments
Labels:     GET|POST /api/labels
Activity:   GET /api/workspaces/:id/activity
Analytics:  GET /api/workspaces/:id/analytics
AI:         POST /api/boards/:id/summary
```

## Socket.IO Events

```
board:join / board:leave
card:created / card:updated / card:moved / card:deleted
activity:created
presence:updated
```
