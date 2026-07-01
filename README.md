# DevMitra

A collaborative developer platform where developers can showcase projects, find contributors, submit bug reports, open opportunities, and connect with other developers.

## Tech Stack

- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Auth**: GitHub OAuth (JWT cookie)

## Prerequisites

- Node.js 20+
- PostgreSQL database
- GitHub OAuth App ([create one](https://github.com/settings/developers))

## Setup

### 1. Clone

```bash
git clone <repo-url>
cd DevMitra
```

### 2. Backend

```bash
cd backend
npm install
```

**Required environment variables** — create `backend/.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string e.g. `postgresql://user:pass@localhost:5432/devmitra` |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `FRONTEND_URL` | Frontend base URL (default: `http://localhost:3000`) |
| `NODE_ENV` | `development` or `production` |

Run migrations:

```bash
npx prisma migrate dev
```

Start the backend:

```bash
npm run dev   # development with nodemon
# or
node server.js
```

Backend runs on **port 5000**.

### 3. Frontend

```bash
cd frontend
npm install
```

**Required environment variables** — create `frontend/.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:5000`) |

Start the frontend:

```bash
npm run dev
```

Frontend runs on **port 3000**.

### 4. GitHub OAuth App

Create an OAuth App at [github.com/settings/developers](https://github.com/settings/developers):
- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:5000/auth/github/callback`

Copy the Client ID and Client Secret into `backend/.env`.

## Project Structure

```
DevMitra/
├── backend/                # Express + Prisma API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, rate limiting, error handling
│   │   ├── routes/         # Express routers
│   │   └── utils/          # Shared utilities (pagination, ratingUtils, etc.)
│   ├── prisma/             # Schema and migrations
│   ├── __tests__/          # Backend unit tests
│   └── server.js
├── frontend/               # Next.js app
│   ├── app/                # App Router pages
│   ├── components/         # Shared React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # API client and utilities
│   └── __tests__/          # Frontend component tests
└── .kiro/                  # Kiro spec files
```

## Running Tests

```bash
# Backend (Jest)
cd backend && npm test

# Frontend (Jest + React Testing Library)
cd frontend && npm test
```

## Key Features

- GitHub OAuth login with CSRF state validation
- Project creation with visibility (Public / Unlisted / Private)
- Contributor access requests and membership management
- Bug report tracking with severity levels
- Pull request submission with contributor tier system
- Opportunity postings for open roles
- Developer profiles with connection system
- Notifications, messaging, and activity feeds
- Contributor rating system with tier progression
- Stories (24-hour ephemeral posts)
- Admin analytics dashboard
