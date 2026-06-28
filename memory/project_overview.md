---
name: project-overview
description: OrbitDesk — full-stack real-time collaborative workspace with kanban boards, RBAC, AI, dark mode, comments, labels, search, templates
metadata:
  type: project
---

OrbitDesk is a real-time project management app. Tech stack: Next.js 16, TypeScript, Tailwind v4, PostgreSQL, Prisma, Socket.IO, Auth.js v5, Zustand, dnd-kit, Recharts, Claude API.

**Why:** Portfolio project showcasing full-stack capabilities including real-time collaboration, RBAC, AI integration, and production-grade DevOps.

**How to apply:** When working on this project, respect the existing patterns — optimistic UI with rollback, server-side permission checks, Zustand for board state, and Socket.IO for live sync.

**Key models:** User, Workspace, Membership, Board, Card, Comment, Label, ActivityLog, PasswordReset

**Features built:** Auth (credentials + password reset), RBAC, kanban board with drag-drop, real-time sync, presence, activity feed, AI summary, analytics, comments on cards, color-coded labels, search/filter, board templates, dark mode, error/loading/empty states, mobile responsive, Docker, CI/CD, 80 tests (unit + API + component).
