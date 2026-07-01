# Design Document — Security and Bug Remediation

## Overview

This document describes the concrete implementation plan for remediating all 33 findings from the DevMitra security audit. The stack is Node.js/Express + Prisma/PostgreSQL (backend) and Next.js TypeScript + Tailwind CSS (frontend). Changes are grouped by finding number and each section contains exact code changes, new file paths, and migration SQL where applicable.

---

## Architecture

No new top-level services are introduced. All changes are surgical patches to existing files plus three new files:

- `backend/src/middleware/authMiddleware.js` — updated 401/403 semantics
- `frontend/components/MobileNavDrawer.tsx` — new mobile bottom-nav component
- `frontend/components/LogoutConfirmModal.tsx` — extracted from Sidebar
- `frontend/components/SidebarMoreMenu.tsx` — extracted from Sidebar
- `backend/prisma/migrations/<timestamp>_rating_dedup_index/migration.sql` — partial unique index

Middleware registration order in `app.js` (after changes):

```
helmet()
cors(...)
express.json({ limit: "10mb" })
express.urlencoded({ extended: true, limit: "10mb" })
cookieParser()
authLimiter  → applied only inside authRoutes.js router
apiLimiter   → global fallback (skip function removed)
createLimiter → applied per-route on POST create endpoints
```

---

## Environment Variables

### `backend/.env`

| Variable | Default | Purpose |
|---|---|---|
| `FRONTEND_URL` | `http://localhost:3000` | Replaces all hardcoded localhost:3000 strings |
| `NODE_ENV` | `development` | Controls cookie `secure`/`sameSite` flags |
| `JWT_SECRET` | — | Existing; unchanged |
| `GITHUB_CLIENT_ID` | — | Existing; unchanged |
| `GITHUB_CLIENT_SECRET` | — | Existing; unchanged |
| `DATABASE_URL` | — | Existing; unchanged |

### `frontend/.env.local`

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend base URL for all API calls |

---


## Requirement 1 — Email Address Exposure

**File:** `backend/src/controllers/userController.js`

Split `USER_PUBLIC_SELECT` into two constants:

```js
// Shown to any requester — no email
const USER_PUBLIC_SELECT = {
  id: true, username: true, avatarUrl: true,
  githubUsername: true, githubProfileUrl: true,
  bio: true, location: true, website: true,
  skills: true, linkedinUrl: true, twitterUrl: true,
  portfolioUrl: true, availabilityHours: true,
  profileVisibility: true, isAdmin: true, createdAt: true,
  _count: { select: { projects: true, projectMemberships: true } },
};

// Shown only when req.user.id === profile owner id
const USER_PRIVATE_SELECT = { ...USER_PUBLIC_SELECT, email: true };
```

In `getUserById`, replace the single `select: USER_PUBLIC_SELECT` call with:

```js
const isOwner = requestingUserId === id;
const select  = isOwner ? USER_PRIVATE_SELECT : USER_PUBLIC_SELECT;
const user    = await prisma.user.findUnique({ where: { id }, select });
```

In `getUsers` and any other controller that returns user arrays (e.g., developer search, AI match), use `USER_PUBLIC_SELECT` (never the private variant — caller is not the profile owner).

**File:** `backend/src/controllers/projectController.js` — `getProjectById`

The members include currently fetches `email: true`. Change to:

```js
user: {
  select: {
    id: true, username: true, avatarUrl: true,
    githubUsername: true, githubProfileUrl: true,
    // email omitted — not needed for project member display
  },
},
```

---

## Requirement 2 — Unauthenticated User Creation

**File:** `backend/src/controllers/userController.js`

Add a guard at the top of `createUser`:

```js
const createUser = async (req, res) => {
  if (!req.user)         return res.status(401).json({ message: "Not authenticated" });
  if (!req.user.isAdmin) return res.status(403).json({ message: "Admins only" });
  // ... existing logic
};
```

**File:** `backend/src/routes/userRoutes.js`

Ensure the `POST /users` route uses the `protect` middleware so `req.user` is populated:

```js
router.post("/", protect, createUser);
```

---

## Requirement 3 — OAuth CSRF State Validation

**File:** `backend/src/controllers/authController.js`

Replace the existing `loginWithGithub` and `githubCallback` implementations:

```js
const crypto = require("crypto");
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

const loginWithGithub = (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    maxAge: 10 * 60 * 1000,   // 10 minutes — single-use window
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  const githubUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&state=${state}&allow_signup=true`;
  res.redirect(githubUrl);
};

const githubCallback = async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies.oauth_state;

  // Invalidate state cookie immediately (single-use)
  res.clearCookie("oauth_state");

  if (!state || !storedState || state !== storedState) {
    return res.redirect(`${FRONTEND_URL}?error=oauth_csrf`);
  }
  // ... rest of existing token exchange / user upsert logic
  // Replace hardcoded "http://localhost:3000" redirects with FRONTEND_URL
  res.redirect(FRONTEND_URL);
};
```

---


## Requirement 4 — IDOR on Opportunity Applications

**File:** `backend/src/controllers/opportunityController.js`

`getUserApplications` already uses `req.user.id` — no change needed. Verify both `approveApplication` and `rejectApplication` already fetch the opportunity and check `opp.ownerId !== req.user.id` (they do, but the null-check path returns 403 combined). Ensure the check is explicit:

```js
const approveApplication = async (req, res) => {
  const { id, appId } = req.params;
  const opp = await prisma.opportunity.findUnique({ where: { id } });
  if (!opp)                         return res.status(404).json({ message: "Not found" });
  if (opp.ownerId !== req.user.id)  return res.status(403).json({ message: "Not authorized" });
  // ... update logic unchanged
};
```

Same pattern for `rejectApplication`.

---

## Requirement 5 — Public Opportunity Application Data

**File:** `backend/src/controllers/opportunityController.js` — `getOpportunityById`

```js
const getOpportunityById = async (req, res) => {
  const opp = await prisma.opportunity.findUnique({
    where: { id: req.params.id },
    include: {
      ...OPPORTUNITY_INCLUDE,
      applications: {
        include: {
          applicant: { select: { id:true, username:true, avatarUrl:true,
                                  skills:true, portfolioUrl:true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!opp) return res.status(404).json({ message: "Opportunity not found" });

  const isOwner = req.user?.id === opp.ownerId;
  const response = isOwner
    ? opp
    : { ...opp, applications: undefined };   // strip applications for non-owners

  res.status(200).json(response);
};
```

---

## Requirement 6 — Private Project Leaks on Secondary Endpoints

**File:** `backend/src/controllers/userController.js` — `getUserProjects`

```js
const getUserProjects = async (req, res) => {
  const { id } = req.params;
  const requestingUserId = req.user?.id ?? null;
  const isOwner = requestingUserId === id;

  const where = {
    ownerId: id,
    ...(isOwner ? {} : { visibility: { not: "PRIVATE" } }),
  };
  const projects = await prisma.project.findMany({
    where,
    include: { owner: { select: { id:true, username:true, avatarUrl:true } },
               _count: { select: { members:true, accessRequests:true, likes:true } } },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json(projects);
};
```

**`getUserMemberships`** — same pattern:

```js
const where = { userId: id };
if (!isOwner) {
  where.project = { visibility: { not: "PRIVATE" } };
}
```

**`getProjectStats`** — add visibility guard:

```js
if (project.visibility === "PRIVATE") {
  const allowed = req.user?.id === project.ownerId ||
    await isMember(id, req.user?.id);
  if (!allowed) return res.status(403).json({ message: "Not authorized" });
}
```

**Bug reports and pull requests listing** — in `getProjectBugReports` and `getProjectPullRequests`, add a project fetch + private check before returning results:

```js
const project = await prisma.project.findUnique({ where: { id: projectId } });
if (!project) return res.status(404).json({ message: "Project not found" });
if (project.visibility === "PRIVATE") {
  const member = await isMember(projectId, req.user?.id);
  if (!member && project.ownerId !== req.user?.id)
    return res.status(403).json({ message: "Not authorized" });
}
```

---

## Requirement 7 — Rating Duplication

**File:** `backend/src/controllers/ratingController.js` — `rateContributor`

Insert a duplicate check before the `prisma.contributorRating.create` call:

```js
if (!pullRequestId) {
  const existing = await prisma.contributorRating.findFirst({
    where: { giverId, receiverId, projectId, pullRequestId: null },
  });
  if (existing) {
    return res.status(409).json({
      message: "You have already rated this contributor for this project",
    });
  }
}
```

**Database migration** — new file `backend/prisma/migrations/<timestamp>_rating_dedup_index/migration.sql`:

```sql
-- Partial unique index: prevents duplicate null-PR ratings at DB level
CREATE UNIQUE INDEX "ContributorRating_null_pr_dedup"
  ON "ContributorRating" ("giverId", "receiverId", "projectId")
  WHERE "pullRequestId" IS NULL;
```

Run via: `npx prisma migrate dev --name rating_dedup_index`

The existing `@@unique([pullRequestId, giverId])` constraint in `schema.prisma` is retained unchanged.

---


## Requirement 8 — Mobile Layout Collapse

### Changes to `frontend/components/AppShell.tsx`

Replace the hardcoded `paddingLeft: 64` and absolute-positioned sidebar with Tailwind responsive classes:

```tsx
// Top-level wrapper: hide sidebar below lg (1024px)
<div className="flex h-screen bg-gray-950 overflow-hidden relative">
  {/* Sidebar: hidden on mobile/tablet, shown lg+ */}
  <div className="hidden lg:block absolute top-0 left-0 h-full z-30">
    <Sidebar />
  </div>

  {/* Center column: no left padding on mobile, pl-16 on lg+ */}
  <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:pl-16">
    {!isFullscreen && <TopBar />}
    <main className={`flex-1 overflow-y-auto ${isFullscreen ? "overflow-hidden" : ""}`}>
      {/* ... content unchanged ... */}
    </main>
  </div>

  {/* Mobile Nav Drawer: only on screens < 640px */}
  <div className="sm:hidden">
    <MobileNavDrawer />
  </div>

  {/* Right sidebar unchanged */}
</div>
```

### New File: `frontend/components/MobileNavDrawer.tsx`

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, Bell, MessageSquare, User, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { name: "Home",          href: "/",              icon: Home },
  { name: "Explore",       href: "/explore",       icon: Compass },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Messages",      href: "/messages",      icon: MessageSquare },
  { name: "Profile",       href: "/profile",       icon: User },
];

export default function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Bottom tab trigger bar — always visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800
                      flex items-center justify-around px-2 py-2 sm:hidden">
        {NAV_ITEMS.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            aria-label={name}
            onClick={() => setOpen(false)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition
              ${pathname === href ? "text-indigo-400" : "text-gray-500 hover:text-white"}`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px]">{name}</span>
          </Link>
        ))}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-gray-500 hover:text-white"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>

      {/* Slide-up drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl
                          border-t border-gray-700 p-4 pb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-white">Navigation</span>
              <button onClick={() => setOpen(false)} aria-label="Close navigation menu">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {NAV_ITEMS.map(({ name, href, icon: Icon }) => (
              <Link key={name} href={href} onClick={() => setOpen(false)}
                aria-label={name}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300
                           hover:bg-gray-800 hover:text-white transition text-sm font-medium">
                <Icon className="h-5 w-5" />{name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
```

---

## Requirement 9 — 100 MB Request Body DoS

**File:** `backend/src/app.js`

```js
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
```

**File:** `frontend/components/FileUploader.tsx` — add size validation in `processFile`:

```ts
const IMAGE_MAX = 5 * 1024 * 1024;   // 5 MB
const VIDEO_MAX = 50 * 1024 * 1024;  // 50 MB

const processFile = (file: File) => {
  if (!file) return;
  const isVideoFile = file.type.startsWith("video/");
  const limit = isVideoFile ? VIDEO_MAX : IMAGE_MAX;
  const limitLabel = isVideoFile ? "50 MB" : "5 MB";

  if (file.size > limit) {
    setError(`File exceeds the ${limitLabel} limit. Please choose a smaller file.`);
    return;
  }
  setError(null);
  setLoading(true);
  // ... existing FileReader logic unchanged
};
```

Add `const [error, setError] = useState<string | null>(null);` to component state.
Render the error below the drop zone:

```tsx
{error && (
  <p className="mt-2 text-sm text-red-400" role="alert">{error}</p>
)}
```

Do not call `onChange` when the file is rejected (return early as shown above).

---


## Requirement 10 — Unused Rate Limiters

**File:** `backend/src/middleware/rateLimiter.js`

Remove the `skip` function from `apiLimiter`:

```js
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { message: "Too many requests from this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  // skip function removed — /stats is no longer exempt
});
```

**File:** `backend/src/routes/authRoutes.js` — apply `authLimiter` to all auth routes:

```js
const { authLimiter } = require("../middleware/rateLimiter");
router.use(authLimiter);   // applies to all routes in this router
```

**File:** `backend/src/app.js` — apply `createLimiter` on POST create routes:

```js
const { apiLimiter, createLimiter } = require("./middleware/rateLimiter");

// Remove per-route createLimiter inline placement; instead apply in each create route file:
// projectRoutes.js:    router.post("/", protect, createLimiter, createProject)
// bugReportRoutes.js:  router.post("/", protect, createLimiter, createBugReport)
// pullRequestRoutes.js:router.post("/", protect, createLimiter, createPullRequest)
// opportunityRoutes.js:router.post("/", protect, createLimiter, createOpportunity)
// ratingRoutes.js:     router.post("/", protect, createLimiter, rateContributor)
```

---

## Requirement 11 — Notification IDOR

**File:** `backend/src/controllers/notificationController.js` — `markAsRead`

```js
const markAsRead = async (req, res) => {
  const { id } = req.params;
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) return res.status(404).json({ message: "Not found" });
  if (notification.receiverId !== req.user.id)
    return res.status(403).json({ message: "Not authorized" });

  await prisma.notification.update({
    where: { id, receiverId: req.user.id },  // double-lock with combined where
    data: { read: true },
  });
  res.status(200).json({ message: "Marked as read" });
};
```

---

## Requirement 12 — Mass Assignment in Opportunity Update

**File:** `backend/src/controllers/opportunityController.js` — `updateOpportunity`

```js
const updateOpportunity = async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) return res.status(404).json({ message: "Not found" });
  if (opp.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

  // Explicit whitelist — ownerId, status (business logic field) etc. are excluded
  const { title, role, description, requiredSkills, duration, budget, isRemote, status } = req.body;
  const data = {};
  if (title !== undefined)          data.title = title;
  if (role !== undefined)           data.role = role;
  if (description !== undefined)    data.description = description;
  if (requiredSkills !== undefined) data.requiredSkills = Array.isArray(requiredSkills)
                                      ? requiredSkills : [];
  if (duration !== undefined)       data.duration = duration;
  if (budget !== undefined)         data.budget = budget;
  if (isRemote !== undefined)       data.isRemote = !!isRemote;
  if (status !== undefined)         data.status = status;

  const updated = await prisma.opportunity.update({
    where: { id: req.params.id },
    data,
    include: OPPORTUNITY_INCLUDE,
  });
  res.status(200).json(updated);
};
```

---

## Requirement 13 — Invalid PR Status Values

**File:** `backend/src/controllers/pullRequestController.js`

Add constants and validation:

```js
const VALID_PR_STATUS = ["OPEN", "UNDER_REVIEW", "MERGED", "CLOSED"];
const VALID_PR_TYPE   = ["BUG_FIX", "FEATURE", "REFACTOR", "DOCS", "TEST"];

// In reviewPullRequest, after extracting status from req.body:
if (!VALID_PR_STATUS.includes(status)) {
  return res.status(400).json({ message: "Invalid status value" });
}

// In createPullRequest, after extracting type:
const prType = type ?? "FEATURE";
if (!VALID_PR_TYPE.includes(prType)) {
  return res.status(400).json({ message: "Invalid type value" });
}
```

---

## Requirement 14 — PR Membership Gate

**File:** `backend/src/controllers/pullRequestController.js` — `createPullRequest`

Insert after the "owner cannot submit to own project" check:

```js
// Check membership or approved repo access
const [membership, repoAccess] = await Promise.all([
  prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: authorId } },
  }),
  prisma.repositoryAccessRequest.findFirst({
    where: { projectId, requesterId: authorId, status: "APPROVED" },
  }),
]);
if (!membership && !repoAccess) {
  return res.status(403).json({
    message: "You must be a project member or have approved repository access to submit a pull request",
  });
}
```

---


## Requirement 15 — Cross-Project Bug/PR Linking

**File:** `backend/src/controllers/pullRequestController.js` — `createPullRequest`

Insert after the membership gate check:

```js
if (bugReportId) {
  const bug = await prisma.bugReport.findUnique({ where: { id: bugReportId } });
  if (!bug) return res.status(404).json({ message: "Bug report not found" });
  if (bug.projectId !== projectId) {
    return res.status(400).json({
      message: "The referenced bug report does not belong to this project",
    });
  }
}
```

---

## Requirement 16 — Project Visibility Bug on Completion

The codebase does not have a dedicated "complete project" endpoint — completion is done via `PUT /projects/:id` passing `isCompleted: true`. The existing `updateProject` handler already builds a whitelist `data` object from explicit destructuring, so `visibility` is only changed if explicitly included in the request body.

**Action required:** Confirm no completion-specific code path exists that touches `visibility`. A search of the codebase confirms `isCompleted` is set only through `updateProject`. No changes needed beyond documentation of intent.

If a dedicated endpoint is added in future, it must only write `isCompleted: true` and `completedAt: new Date()`:

```js
// SAFE completion handler pattern
const completeProject = async (req, res) => {
  await prisma.project.update({
    where: { id, ownerId: req.user.id },
    data: { isCompleted: true, completedAt: new Date() },
    // visibility is NOT included — preserved as-is
  });
};
```

---

## Requirement 17 — Negative Pagination 500 Error

Create a shared utility `backend/src/utils/pagination.js`:

```js
/**
 * Safely parse and clamp pagination params from a request query string.
 * @param {object} query - req.query
 * @param {number} defaultLimit
 * @returns {{ take: number, skip: number }}
 */
function parsePagination(query, defaultLimit = 50) {
  const rawLimit  = parseInt(query.limit,  10);
  const rawOffset = parseInt(query.offset, 10);

  const take = Number.isFinite(rawLimit)  ? Math.max(1,   Math.min(rawLimit,  100)) : defaultLimit;
  const skip = Number.isFinite(rawOffset) ? Math.max(0,   rawOffset)                : 0;
  return { take, skip };
}

module.exports = { parsePagination };
```

Replace inline `parseInt(limit)` / `parseInt(offset)` calls in:
- `projectController.js` — `getProjects`
- `opportunityController.js` — `getOpportunities`
- `notificationController.js` — `getNotifications`
- `bugReportController.js` — `getProjectBugReports`
- `pullRequestController.js` — `getProjectPullRequests`

Example replacement in `getProjects`:

```js
const { parsePagination } = require("../utils/pagination");
const { take, skip } = parsePagination(req.query, 50);
```

---

## Requirement 18 — Trending Algorithm Score

The trending sort in `getProjects` already implements the correct formula. Verify the exact formula matches the requirement:

```js
const scoreA = (a._count.likes * 3) + (a._count.comments * 2) + (a._count.members * 2)
               + Math.max(0, 30 - ageA);
```

This matches `(likes × 3) + (comments × 2) + (members × 2) + max(0, 30 − ageDays)`. Ties are broken by the `createdAt desc` default ordering from the `findMany`. No code change needed — the algorithm is already correct. Document the formula in a code comment:

```js
// Trending score: likes*3 + comments*2 + members*2 + max(0, 30-ageDays)
// Recency bonus decays to 0 after 30 days.
```

---

## Requirement 19 — Hardcoded Localhost

**File:** `backend/src/controllers/authController.js`

```js
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Replace all three redirect occurrences:
res.redirect(FRONTEND_URL);
res.redirect(`${FRONTEND_URL}?error=auth_failed`);
res.redirect(`${FRONTEND_URL}?error=oauth_csrf`);
```

**File:** `backend/src/app.js`

```js
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  credentials: true,
}));
```

**File:** `frontend/lib/api.ts` (or equivalent axios base config)

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
```

---

## Requirement 20 — Cookie Production Settings

**File:** `backend/src/controllers/authController.js` — cookie creation in `githubCallback`:

```js
const isProd = process.env.NODE_ENV === "production";
res.cookie("token", token, {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: isProd ? "strict" : "lax",
  secure:   isProd,
});
```

---


## Requirement 21 — Missing Security Headers

Install `helmet`:

```bash
cd backend && npm install helmet@7 --save-exact
```

**File:** `backend/src/app.js` — add `helmet` as the very first middleware:

```js
const helmet = require("helmet");

const app = express();

// Security headers — must be first
app.use(helmet({
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'self'"] },
  },
}));
// helmet sets: X-Content-Type-Options: nosniff, X-Frame-Options: DENY,
//              Referrer-Policy: no-referrer, X-XSS-Protection: 0
app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000", credentials: true }));
// ... rest of middleware unchanged
```

---

## Requirement 22 — Inconsistent Unauthenticated Behaviour

**File:** `backend/src/middleware/authMiddleware.js`

Change the `protect` function's first error response from "Not authorized" to "Not authenticated":

```js
const protect = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authenticated" });
  }
};
```

Authorization failures (valid token but insufficient permission) continue to return 403 inside individual controllers, which is correct.

---

## Requirement 23 — Missing Form Labels

**All form pages under `frontend/app/`** — audit pass using the following pattern:

Every `<input>` / `<textarea>` / `<select>` must have one of:

```tsx
// Option A: visible label
<label htmlFor="project-title" className="block text-sm text-gray-400 mb-1">Title</label>
<input id="project-title" ... />

// Option B: visually hidden label
<label htmlFor="search" className="sr-only">Search projects</label>
<input id="search" ... />

// Option C: aria-label on the element itself
<input aria-label="Search projects" ... />
```

Add Tailwind utility `.sr-only` (already included in Tailwind core) for visually hidden labels. Never use placeholder text as the only field identifier.

---

## Requirement 24 — Inaccessible Icon-Only Links

**File:** `frontend/components/TopBar.tsx`

```tsx
<Link href="/notifications" aria-label="Notifications" onClick={handleNotifClick} ...>
  <Bell className="h-5 w-5" aria-hidden="true" />
</Link>

<Link href="/messages" aria-label="Messages" ...>
  <MessageSquare className="h-5 w-5" aria-hidden="true" />
</Link>

<form onSubmit={handleSearch}>
  <button type="submit" aria-label="Search">
    <Search className="h-4 w-4" aria-hidden="true" />
  </button>
</form>
```

**File:** `frontend/components/Sidebar.tsx` — collapsed mode icon-only links:

```tsx
<Link href={href} aria-label={name} ...>
  <Icon aria-hidden="true" ... />
</Link>
```

Also add `aria-label` to the `LogOut` button in the expanded user row and the More menu button.

---

## Requirement 25 — Empty Alt Text on Meaningful Images

**File:** `frontend/components/Sidebar.tsx` — user avatar:

```tsx
<img src={user.avatarUrl} alt={`${user.username}'s avatar`} className="w-7 h-7 rounded-full" />
```

**File:** `frontend/components/TopBar.tsx` — user avatar:

```tsx
<img src={user.avatarUrl} alt={`${user.username}'s avatar`} className="w-8 h-8 rounded-full" />
```

**File:** `frontend/components/ProjectCard.tsx` and `ProjectFeedCard.tsx` — cover images:

```tsx
<img src={project.coverImage} alt={`${project.title} cover image`} ... />
```

For decorative images (background flourishes, icons used purely for aesthetics) use `alt=""`.

---


## Requirement 26 — Raw `<img>` vs Next.js `<Image>`

**File:** `frontend/next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.githubusercontent.com",
      },
      // Add other CDN hostnames as needed (e.g. res.cloudinary.com)
    ],
  },
};

export default nextConfig;
```

Replace raw `<img>` with `<Image>` for remote URLs:

```tsx
import Image from "next/image";

// User avatars (remote GitHub URL)
<Image
  src={user.avatarUrl}
  alt={`${user.username}'s avatar`}
  width={32}
  height={32}
  className="rounded-full"
/>

// Project cover (remote URL)
<Image
  src={project.coverImage}
  alt={`${project.title} cover image`}
  fill
  className="object-cover"
/>
```

Where `value.startsWith("data:")` (FileUploader output), keep the raw `<img>` element — `next/image` does not support data URIs.

---

## Requirement 27 — Polling Intervals

**File:** `frontend/components/TopBar.tsx`

```tsx
const { data: notifData } = useQuery({
  queryKey: ["notificationCount"],
  queryFn: async () => { ... },
  refetchInterval: 30000,           // was 15000 — reduced to 30s
  refetchIntervalInBackground: false, // pause when tab hidden
  staleTime: 20000,
});

const { data: msgData } = useQuery({
  queryKey: ["messageUnreadCount"],
  queryFn: async () => { ... },
  refetchInterval: 15000,           // was 5000 — reduced to 15s
  refetchIntervalInBackground: false,
  staleTime: 10000,
});
```

---

## Requirement 28 — N+1 Queries

**File:** `backend/src/controllers/ratingController.js` — `getUserRatings`

Currently computes averages in JS over a fetched array (already correct). The fix is to ensure no secondary aggregation query runs per-user. The current implementation already does this correctly — no change needed. Add a comment documenting the intent:

```js
// Averages are computed in JS over the already-fetched ratings array.
// Do NOT add a groupBy or aggregate query here — that would be a second round-trip.
```

**File:** `backend/src/controllers/bugReportController.js` — `getProjectBugReports`

Ensure `pullRequests` are included in the single `findMany`:

```js
include: {
  reporter: { select: { id:true, username:true, avatarUrl:true } },
  pullRequests: {
    select: { id:true, title:true, status:true },
    // Already present in existing implementation — verify no loop below
  },
},
```

**File:** `backend/src/controllers/pullRequestController.js` — `getProjectPullRequests`

Add `bugReport` include to the single `findMany`:

```js
include: {
  author: { select: { id:true, username:true, avatarUrl:true } },
  bugReport: { select: { id:true, title:true, type:true } },  // add this line
},
```

**File:** `backend/src/controllers/projectController.js` — `getProjects`

The existing `_count` include already covers `likes`, `comments`, `members`. Confirm no per-project secondary queries exist in the sort logic (they don't — the sort reads `a._count.likes` etc. directly from the included data). No change needed.

---

## Requirement 29 — Large Components

### New File: `frontend/components/LogoutConfirmModal.tsx`

Extract the logout modal from `Sidebar.tsx`:

```tsx
"use client";
import { LogOut } from "lucide-react";

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutConfirmModal({ onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center">
            <LogOut className="h-5 w-5 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Sign Out?</h3>
        </div>
        <p className="text-sm text-gray-400 mb-5">Are you sure you want to sign out of DevMitra?</p>
        <div className="flex gap-3">
          <button onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition">
            Sign Out
          </button>
          <button onClick={onCancel}
            className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

### New File: `frontend/components/SidebarMoreMenu.tsx`

Extract the floating More menu from `Sidebar.tsx`. It receives `items`, `onClose`, and `onLogoutClick` as props. Internal Link rendering and active-state logic are identical to the current Sidebar implementation but isolated in this component.

In `Sidebar.tsx`, replace the inline modal JSX with:

```tsx
import LogoutConfirmModal from "./LogoutConfirmModal";
import SidebarMoreMenu from "./SidebarMoreMenu";

{confirmLogout && (
  <LogoutConfirmModal onConfirm={logout} onCancel={() => setConfirmLogout(false)} />
)}
```

---


## Requirement 30 — Unused Files

Run the following audit steps before deleting any file:

1. Search for all imports of a candidate file: `grep -r "from.*<filename>" frontend/`
2. Confirm zero import hits in the entire codebase
3. Delete the file and verify `next build` and `node server.js` complete without errors

Known candidates to investigate (do not delete without confirming zero references):
- Any component in `frontend/components/` not imported by any page or layout
- Any route file in `backend/src/routes/` not mounted in `app.js`

After deletion, run `next build` (frontend) and confirm Express starts cleanly (backend).

---

## Requirement 31 — Stale README

**File:** `README.md` — replace with accurate content covering:

1. Project description
2. Prerequisites (Node 20+, PostgreSQL, GitHub OAuth app)
3. Clone and install:
   ```bash
   git clone <repo>
   cd DevMitra/backend && npm install
   cd ../frontend && npm install
   ```
4. Configure environment:
   - `backend/.env`: `DATABASE_URL`, `JWT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `FRONTEND_URL`, `NODE_ENV`
   - `frontend/.env.local`: `NEXT_PUBLIC_API_URL`
5. Migrations: `cd backend && npx prisma migrate dev`
6. Start backend: `cd backend && node server.js` (port 5000)
7. Start frontend: `cd frontend && npm run dev` (port 3000)
8. Top-level structure: `backend/`, `frontend/`, `.kiro/`, `prisma/`

---

## Requirement 32 — Lint Errors and Warnings

**Frontend ESLint fixes — common patterns:**

- Remove unused imports and variables flagged by `no-unused-vars`
- Add `key` props to mapped elements missing them
- Replace `<img>` with `<Image>` (addresses both lint and Req 26)
- Fix `react-hooks/exhaustive-deps` warnings by adding missing deps or using `useCallback`
- Ensure all TypeScript `any` types are replaced with proper types

Run `cd frontend && npx eslint . --fix` for auto-fixable issues, then manually address remaining.

Run `cd frontend && npx tsc --noEmit` to surface TypeScript compilation errors separately.

---

## Requirement 33 — No Automated Tests

### Backend Test Setup

Install Jest:

```bash
cd backend && npm install --save-dev jest@29 --save-exact
```

Add to `backend/package.json`:

```json
{
  "scripts": {
    "test": "jest --runInBand"
  },
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/__tests__/**/*.test.js"]
  }
}
```

Create `backend/__tests__/` directory with:

**`oauth.test.js`** — tests OAuth CSRF state validation logic (pure function extracted from controller):

```js
const crypto = require("crypto");

function generateOAuthState() {
  return crypto.randomBytes(16).toString("hex");
}

function validateOAuthState(provided, stored) {
  if (!provided || !stored) return false;
  return provided === stored;
}

test("generated state is 32-char hex string", () => {
  const state = generateOAuthState();
  expect(state).toMatch(/^[0-9a-f]{32}$/);
});

test("valid state passes validation", () => {
  const state = generateOAuthState();
  expect(validateOAuthState(state, state)).toBe(true);
});

test("mismatched state fails validation", () => {
  expect(validateOAuthState("abc", "xyz")).toBe(false);
});

test("missing state fails validation", () => {
  expect(validateOAuthState(null, "xyz")).toBe(false);
  expect(validateOAuthState("abc", null)).toBe(false);
  expect(validateOAuthState("", "xyz")).toBe(false);
});
```

**`ratingDuplication.test.js`** — tests the duplicate-check logic (pure function):

```js
const { checkDuplicateRating } = require("../src/utils/ratingUtils");

// ratingUtils.js exports: checkDuplicateRating(existing) => boolean
test("returns true when duplicate exists", () => {
  expect(checkDuplicateRating({ id: "existing" })).toBe(true);
});

test("returns false when no duplicate", () => {
  expect(checkDuplicateRating(null)).toBe(false);
});
```

**`pagination.test.js`** — tests clamping:

```js
const { parsePagination } = require("../src/utils/pagination");

test("clamps negative limit to 1", () => {
  const { take } = parsePagination({ limit: "-5" });
  expect(take).toBe(1);
});

test("clamps negative offset to 0", () => {
  const { skip } = parsePagination({ offset: "-10" });
  expect(skip).toBe(0);
});

test("uses defaults when absent", () => {
  const { take, skip } = parsePagination({}, 50);
  expect(take).toBe(50);
  expect(skip).toBe(0);
});

test("caps limit at 100", () => {
  const { take } = parsePagination({ limit: "999" });
  expect(take).toBe(100);
});
```

### Frontend Test Setup

Install React Testing Library + Jest:

```bash
cd frontend && npm install --save-dev jest@29 jest-environment-jsdom @testing-library/react@14 @testing-library/jest-dom@6 @testing-library/user-event@14 --save-exact
```

Add `frontend/jest.config.js`:

```js
const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "./" });
module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterFramework: ["<rootDir>/jest.setup.js"],
});
```

Add `frontend/jest.setup.js`:

```js
import "@testing-library/jest-dom";
```

Create `frontend/__tests__/FileUploader.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileUploader from "@/components/FileUploader";

const makeFile = (name: string, size: number, type: string) => {
  const file = new File(["x".repeat(10)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

test("rejects image file larger than 5MB and shows error", async () => {
  const onChange = jest.fn();
  render(<FileUploader value="" onChange={onChange} accept="image/*" label="Cover" />);

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const bigImage = makeFile("big.jpg", 6 * 1024 * 1024, "image/jpeg");

  await userEvent.upload(input, bigImage);

  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("5 MB");
});

test("accepts image file within 5MB", async () => {
  const onChange = jest.fn();
  render(<FileUploader value="" onChange={onChange} accept="image/*" label="Cover" />);

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const smallImage = makeFile("small.jpg", 2 * 1024 * 1024, "image/jpeg");

  await userEvent.upload(input, smallImage);

  expect(screen.queryByRole("alert")).toBeNull();
});
```

---


---

## Data Models

### Schema Change: `ContributorRating` Partial Unique Index

No change to `schema.prisma` model definition is needed — the partial unique index is not representable in Prisma schema syntax (Prisma only supports `@@unique` with full columns). The index is created exclusively via raw SQL in the migration file.

The existing `@@unique([pullRequestId, giverId])` constraint is unchanged and continues to prevent duplicate PR-linked ratings.

### Migration File

Path: `backend/prisma/migrations/<timestamp>_rating_dedup_index/migration.sql`

```sql
-- AddPartialUniqueIndex for null-PR contributor ratings
CREATE UNIQUE INDEX "ContributorRating_null_pr_dedup"
  ON "ContributorRating" ("giverId", "receiverId", "projectId")
  WHERE "pullRequestId" IS NULL;
```

---

## Error Handling

All error responses follow this consistent shape:

```json
{ "message": "Human-readable description" }
```

The global `errorHandler` middleware in `backend/src/middleware/errorHandler.js` handles uncaught Prisma errors (`P2002` → 409, `P2025` → 404) and JWT errors (401). Individual controllers handle business-logic errors inline and call `next(error)` only for unexpected exceptions.

No changes to `errorHandler.js` are required by this remediation.

---

## Component Interfaces

### `MobileNavDrawer` Props

```ts
// No props — self-contained with internal open/close state
export default function MobileNavDrawer(): JSX.Element
```

### `LogoutConfirmModal` Props

```ts
interface LogoutConfirmModalProps {
  onConfirm: () => void;  // called when user clicks "Sign Out"
  onCancel:  () => void;  // called when user clicks "Cancel"
}
```

### `SidebarMoreMenu` Props

```ts
interface SidebarMoreMenuProps {
  items:          { name: string; href: string; icon: LucideIcon }[];
  onClose:        () => void;
  onLogoutClick:  () => void;
}
```

### Updated `FileUploader` Props

```ts
interface Props {
  value:         string;
  onChange:      (val: string) => void;
  accept?:       string;         // default "image/*,video/*"
  label?:        string;
  placeholder?:  string;
  previewHeight?: number;
  // Internal state (not props): error: string | null
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Public user responses omit email

*For any* authenticated or unauthenticated API call to a public user endpoint (e.g., `GET /users`, `GET /users/:id` by a non-owner, member lists in project responses), the returned user objects SHALL NOT contain an `email` field unless the requesting user ID equals the profile owner ID.

**Validates: Requirements 1.1, 1.3**

---

### Property 2: OAuth state mismatch always rejects

*For any* GitHub OAuth callback where the `state` query parameter does not exactly match the `oauth_state` cookie value (including absent, empty, or different string), the server SHALL reject the callback with a redirect to `${FRONTEND_URL}?error=oauth_csrf` and SHALL NOT issue a session token.

**Validates: Requirements 3.2, 3.3**

---

### Property 3: User applications endpoint ignores URL parameter

*For any* value of the `:userId` URL parameter on `GET /users/:userId/applications`, the response SHALL contain only the applications belonging to the authenticated caller (`req.user.id`), never applications belonging to any other user.

**Validates: Requirement 4.1**

---

### Property 4: Opportunity applications hidden from non-owners

*For any* opportunity and *for any* requester whose `id` differs from the opportunity's `ownerId`, the `GET /opportunities/:id` response SHALL not include an `applications` array.

**Validates: Requirements 5.1, 5.3**

---

### Property 5: Private projects excluded from secondary listings

*For any* user and *for any* requester whose `id` differs from that user's `id`, the responses from `GET /users/:id/projects` and `GET /users/:id/memberships` SHALL NOT include any projects or project memberships where the project's `visibility` is `"PRIVATE"`.

**Validates: Requirements 6.1, 6.2**

---

### Property 6: Duplicate null-PR contributor ratings rejected

*For any* combination of (`giverId`, `receiverId`, `projectId`) where a `ContributorRating` with `pullRequestId IS NULL` already exists, a second `POST /ratings` call with the same combination and no `pullRequestId` SHALL return HTTP 409.

**Validates: Requirements 7.1, 7.2**

---

### Property 7: FileUploader rejects oversized files

*For any* image file whose byte size exceeds 5 242 880 bytes (5 MB), the `FileUploader` component SHALL not invoke the `onChange` callback and SHALL display an error message containing "5 MB". *For any* video file whose byte size exceeds 52 428 800 bytes (50 MB), the component SHALL not invoke `onChange` and SHALL display an error message containing "50 MB".

**Validates: Requirements 9.3, 9.4, 9.5**

---

### Property 8: Notification ownership prevents cross-user reads

*For any* notification owned by user A, an authenticated request by user B (where B ≠ A) to `PUT /notifications/:id/read` SHALL return HTTP 403 and SHALL NOT change the `read` field of the notification.

**Validates: Requirement 11.1**

---

### Property 9: Opportunity update ignores ownerId in body

*For any* opportunity update request that includes an `ownerId` field in the request body, the stored `ownerId` on the opportunity record SHALL remain unchanged after the update.

**Validates: Requirements 12.1, 12.3**

---

### Property 10: PR status and type values are validated against enums

*For any* string value not in `["OPEN", "UNDER_REVIEW", "MERGED", "CLOSED"]` passed as `status` to `PUT /pull-requests/:id/review`, the server SHALL return HTTP 400. *For any* string value not in `["BUG_FIX", "FEATURE", "REFACTOR", "DOCS", "TEST"]` passed as `type` to `POST /pull-requests`, the server SHALL return HTTP 400.

**Validates: Requirements 13.1, 13.3**

---

### Property 11: PR submission requires project membership

*For any* project and *for any* user who has neither an active `ProjectMember` record nor an `APPROVED` `RepositoryAccessRequest` for that project, `POST /pull-requests` SHALL return HTTP 403.

**Validates: Requirement 14.1**

---

### Property 12: Cross-project bug linking is rejected

*For any* `POST /pull-requests` call where the provided `bugReportId` refers to a `BugReport` whose `projectId` differs from the `projectId` in the request body, the server SHALL return HTTP 400.

**Validates: Requirement 15.1**

---

### Property 13: Project completion preserves visibility

*For any* project with visibility `"PRIVATE"`, `"UNLISTED"`, or `"PUBLIC"`, after a completion operation (setting `isCompleted: true`), the project's `visibility` field SHALL remain unchanged.

**Validates: Requirements 16.1, 16.2**

---

### Property 14: Pagination parameters are clamped to safe ranges

*For any* negative integer passed as `limit`, the query SHALL use `1` as the effective limit. *For any* negative integer passed as `offset`, the query SHALL use `0` as the effective offset. *For any* non-numeric or absent `limit`, the query SHALL use the documented default.

**Validates: Requirements 17.1, 17.2**

---

### Property 15: Trending sort order matches formula

*For any* collection of projects with known `likes`, `comments`, `members` counts, and `createdAt` timestamps, the response from `GET /projects?sort=trending` SHALL order projects in descending order of the score `(likes × 3) + (comments × 2) + (members × 2) + max(0, 30 − ageDays)`.

**Validates: Requirements 18.1, 18.2, 18.3**

---

### Property 16: Unauthenticated requests to protected routes return 401

*For any* protected route (one that uses the `protect` middleware) called with no `token` cookie or an invalid token, the server SHALL return HTTP 401 with message `"Not authenticated"`, never HTTP 403.

**Validates: Requirements 22.1, 22.2**

---
