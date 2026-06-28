# OrbitDesk — Claude Code Instructions

## Quick Commands

```bash
npm run dev          # Next.js dev server (port 3000)
npm run dev:socket   # Socket.IO server (port 3001)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Jest unit + API tests
npm run test:e2e     # Playwright E2E tests
npm run db:migrate   # Prisma migrate dev
npm run db:seed      # Seed test data
npm run db:studio    # Prisma Studio GUI
```

## Architecture

- **Next.js 16** app router with TypeScript
- **Prisma** ORM with PostgreSQL (schema in `prisma/schema.prisma`, generated client in `app/generated/prisma/`)
- **Socket.IO** standalone server in `server/index.ts` for real-time card sync and presence
- **Auth.js v5** (NextAuth) with credentials provider in `lib/auth.ts`
- **Zustand** for board state (`store/boardStore.ts`)
- **Tailwind CSS v4** with dark mode via `.dark` class on `<html>`

## Project Structure

```
app/
  (auth)/          — login, register, forgot-password, reset-password
  (protected)/     — dashboard, workspace, board (auth required)
  api/             — all REST API routes
components/
  auth/            — LoginForm, RegisterForm
  board/           — BoardView, BoardColumn, CardItem, CardModal, CommentSection, LabelPicker, SearchFilter, etc.
  dashboard/       — WorkspaceCard, CreateWorkspaceModal, JoinWorkspaceModal
  layout/          — Navbar, Footer
  providers/       — SessionProvider, ThemeProvider
  ui/              — Button, Input, ErrorBoundary, EmptyState, LoadingSpinner
  workspace/       — AnalyticsDashboard, CreateBoardWithTemplate
lib/               — auth, prisma, permissions, utils, validations, ai
store/             — boardStore (Zustand)
server/            — Socket.IO server
tests/
  unit/            — lib tests
  api/             — API route tests (mocked Prisma + auth)
  components/      — component tests
  e2e/             — Playwright tests
```

## Testing

Tests use Jest with mocked Prisma (`tests/__mocks__/prisma.ts`) and mocked auth (`tests/__mocks__/auth.ts`). The `jest.config.ts` maps `@/lib/prisma` and `@/lib/auth` to mocks. API tests also need Web API polyfills (`tests/api-setup.ts`).

## Conventions

- API routes return `NextResponse.json()` with appropriate HTTP status codes
- Server-side authorization via `lib/permissions.ts` — always check membership before data access
- Optimistic UI updates with rollback on API failure in board operations
- Socket.IO events broadcast to room `board:{boardId}` for live sync
- Dark mode: use `dark:` prefix on Tailwind classes, theme stored in localStorage
