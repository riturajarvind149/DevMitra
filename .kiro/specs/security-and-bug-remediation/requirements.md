# Requirements Document

## Introduction

This document specifies requirements for remediating all 33 security, functional, UI/accessibility, performance, and code-quality findings identified in the DevMitra audit. DevMitra is a collaborative developer platform built on a Node.js/Express backend with Prisma/PostgreSQL and a Next.js TypeScript frontend. The findings are grouped into five categories: Critical/High Security (1–10), Medium Functional Bugs (11–22), UI/Accessibility/Performance (23–29), and Code Cleanup (30–33). All findings are in scope and must be resolved.

---

## Glossary

- **API Server**: The Express.js backend application running in `backend/src/app.js`.
- **Auth Middleware**: The JWT-based authentication middleware that reads the `token` cookie and attaches `req.user`.
- **ContributorRating**: The Prisma model storing owner-to-contributor ratings with fields `giverId`, `receiverId`, `projectId`, `pullRequestId`.
- **FileUploader**: The `frontend/components/FileUploader.tsx` React component that encodes files to base64 and uploads them.
- **Frontend**: The Next.js TypeScript application in the `frontend/` directory.
- **MobileNavDrawer**: A new slide-up navigation drawer component visible only on screens narrower than 640 px.
- **Opportunity**: The Prisma model representing a collaboration posting; `OpportunityApplication` is the related application record.
- **PullRequest**: The Prisma model tracking contributor pull-request submissions scoped to a project.
- **RatingController**: `backend/src/controllers/ratingController.js`, which handles contributor and project ratings.
- **Sidebar**: `frontend/components/Sidebar.tsx`, the collapsible left-navigation component.
- **TopBar**: `frontend/components/TopBar.tsx`, the top navigation bar with search, notifications, and messaging.

---

## Requirements

### Requirement 1 — Email Address Exposure

**User Story:** As a security-conscious platform user, I want my email address kept private in public API responses, so that my contact details cannot be harvested by third parties.

#### Acceptance Criteria

1. THE API Server SHALL omit the `email` field from every public-facing user selection object (`USER_PUBLIC_SELECT` in `userController.js` and any equivalent `select` clause across all controllers).
2. WHEN a request is authenticated and the requesting user ID matches the profile owner ID, THE API Server SHALL include the `email` field in the response.
3. THE API Server SHALL strip the `email` field from member objects returned inside `GET /projects/:id` responses for non-owner requesters.

---

### Requirement 2 — Unauthenticated User Creation

**User Story:** As a platform administrator, I want the `POST /users` endpoint protected so that only authenticated administrators can create user records directly, preventing unauthorised account creation.

#### Acceptance Criteria

1. WHEN a request arrives at `POST /users` without a valid authentication token, THE API Server SHALL return HTTP 401.
2. WHEN an authenticated non-administrator user calls `POST /users`, THE API Server SHALL return HTTP 403.
3. WHERE user creation via `POST /users` is permitted, THE API Server SHALL require `isAdmin: true` on `req.user` before processing the request.

---

### Requirement 3 — OAuth CSRF State Validation

**User Story:** As a user authenticating via GitHub, I want the OAuth flow protected against CSRF attacks, so that a malicious site cannot forge a callback and hijack my session.

#### Acceptance Criteria

1. WHEN `GET /auth/github` is called, THE API Server SHALL generate a cryptographically random `state` value, store it server-side (in a short-lived cookie or server-side session), and append it to the GitHub authorisation URL.
2. WHEN `GET /auth/github/callback` is called, THE API Server SHALL compare the `state` query parameter to the stored value.
3. IF the `state` parameter is absent, empty, or does not match the stored value, THEN THE API Server SHALL reject the callback with HTTP 400 and redirect to `http://localhost:3000?error=oauth_csrf`.
4. THE API Server SHALL invalidate the stored `state` value after a single use.

---

### Requirement 4 — IDOR on Opportunity Applications

**User Story:** As a platform user, I want the opportunity application endpoints to enforce ownership checks, so that I cannot read or manipulate another user's private application data.

#### Acceptance Criteria

1. WHEN `GET /users/:userId/applications` is called, THE API Server SHALL serve only the applications belonging to the authenticated user, regardless of the value of the `:userId` URL parameter.
2. WHEN `PUT /opportunities/:id/applications/:appId/approve` is called, THE API Server SHALL verify that the authenticated user owns the opportunity before updating the application status.
3. WHEN `PUT /opportunities/:id/applications/:appId/reject` is called, THE API Server SHALL verify that the authenticated user owns the opportunity before updating the application status.
4. IF the authenticated user does not own the opportunity, THEN THE API Server SHALL return HTTP 403.

---

### Requirement 5 — Public Opportunity Application Data

**User Story:** As an opportunity applicant, I want detailed application data (applicant list with profiles) hidden from non-owners, so that my application is not visible to other users browsing the platform.

#### Acceptance Criteria

1. WHEN `GET /opportunities/:id` is called by an unauthenticated or non-owner user, THE API Server SHALL return the opportunity details without the `applications` array.
2. WHEN `GET /opportunities/:id` is called by the opportunity owner, THE API Server SHALL include the full `applications` array with applicant profiles.
3. THE API Server SHALL not expose individual applicant profile fields (skills, experience, portfolioUrl) to non-owners in any opportunity response.

---

### Requirement 6 — Private Project Leaks on Secondary Endpoints

**User Story:** As a project owner who set a project to PRIVATE, I want all secondary endpoints to respect that visibility setting, so that private project data is never leaked through indirect API routes.

#### Acceptance Criteria

1. WHEN `GET /users/:id/projects` is called, THE API Server SHALL exclude projects with `visibility = "PRIVATE"` unless the requesting user is the owner of those projects.
2. WHEN `GET /users/:id/memberships` is called, THE API Server SHALL exclude memberships in projects with `visibility = "PRIVATE"` unless the requesting user matches the profile owner.
3. WHEN `GET /projects/:id/stats` is called for a PRIVATE project, THE API Server SHALL return HTTP 403 for requesters who are not the project owner or a project member.
4. WHEN `GET /bug-reports` or `GET /pull-requests` endpoints filter by `projectId` for a PRIVATE project, THE API Server SHALL verify that the requesting user is an owner or member of that project before returning results.

---

### Requirement 7 — Rating Duplication (Contributor Ratings)

**User Story:** As a project owner, I want the system to prevent me from submitting multiple ratings for the same contributor on the same project without a pull request, so that rating scores cannot be gamed.

#### Acceptance Criteria

1. WHEN `POST /ratings` (contributor) is called with a `pullRequestId` of `null` or undefined, THE RatingController SHALL check for an existing `ContributorRating` row with matching `giverId`, `receiverId`, and `projectId` where `pullRequestId IS NULL`.
2. IF such a duplicate row already exists, THEN THE RatingController SHALL return HTTP 409 with message `"You have already rated this contributor for this project"`.
3. THE API Server SHALL apply a Prisma migration that adds a partial unique index on `ContributorRating(giverId, receiverId, projectId)` where `pullRequestId IS NULL` to enforce the constraint at the database level.
4. THE ContributorRating model in `schema.prisma` SHALL retain the existing `@@unique([pullRequestId, giverId])` constraint for PR-linked ratings.

---

### Requirement 8 — Mobile Layout Collapse

**User Story:** As a mobile user, I want the navigation to adapt to small screens, so that the sidebar does not obscure the main content and the application is fully usable on phones and tablets.

#### Acceptance Criteria

1. WHILE the viewport width is less than 1024 px, THE Sidebar SHALL collapse to zero width and SHALL NOT overlay or obscure the main content area.
2. WHILE the viewport width is less than 640 px, THE AppShell SHALL render a MobileNavDrawer instead of the desktop Sidebar.
3. THE MobileNavDrawer SHALL be a slide-up drawer fixed to the bottom of the screen, containing at minimum the primary navigation items (Home, Explore, Notifications, Messages, Profile).
4. THE MobileNavDrawer SHALL include a hamburger or bottom-tab trigger visible at all times on screens narrower than 640 px.
5. WHEN a navigation item in the MobileNavDrawer is activated, THE MobileNavDrawer SHALL close and route to the selected page.
6. THE AppShell SHALL use Tailwind CSS responsive breakpoint classes (`sm:`, `md:`, `lg:`) to manage the sidebar visibility rather than inline pixel comparisons.

---

### Requirement 9 — 100 MB Request Body DoS

**User Story:** As a platform operator, I want incoming request body sizes capped at reasonable limits, so that an attacker cannot exhaust server memory by sending oversized payloads.

#### Acceptance Criteria

1. THE API Server SHALL set the `express.json` body-parser limit to `"10mb"`.
2. THE API Server SHALL set the `express.urlencoded` body-parser limit to `"10mb"`.
3. WHERE file upload payloads are expected (cover images, project images), THE FileUploader SHALL validate that image files do not exceed 5 MB before encoding to base64.
4. WHERE file upload payloads are expected (project resources), THE FileUploader SHALL validate that video files do not exceed 50 MB before encoding to base64.
5. IF a selected file exceeds the applicable size limit, THEN THE FileUploader SHALL display an inline error message stating the limit and SHALL NOT call `onChange` with the oversized data.

---

### Requirement 10 — Unused Rate Limiters

**User Story:** As a platform operator, I want rate-limiting middleware applied consistently to sensitive endpoints, so that brute-force and spam attacks are mitigated across all entry points.

#### Acceptance Criteria

1. THE API Server SHALL apply `authLimiter` to all routes under `/auth`.
2. THE API Server SHALL apply `createLimiter` to all `POST` routes that create resources (projects, bug reports, pull requests, opportunities, ratings).
3. THE `apiLimiter` SHALL remain as the global fallback on all other routes.
4. THE `skip` function on `apiLimiter` SHALL be removed or updated so it no longer exempts the `/stats` endpoint from rate limiting.

---

### Requirement 11 — Notification IDOR

**User Story:** As a user, I want the notification mark-as-read endpoints to verify ownership, so that I cannot silently clear another user's notifications.

#### Acceptance Criteria

1. WHEN `PUT /notifications/:id/read` is called, THE API Server SHALL verify that the notification identified by `:id` belongs to the authenticated user before updating.
2. IF the notification does not belong to the authenticated user, THEN THE API Server SHALL return HTTP 403.
3. THE `markAsRead` function in `notificationController.js` SHALL add an ownership check via a `where` clause combining `id` and `receiverId: req.user.id` in the Prisma `update` call.

---

### Requirement 12 — Mass Assignment in Opportunity Update

**User Story:** As a platform operator, I want the opportunity update endpoint to accept only permitted fields, so that users cannot overwrite protected fields like `ownerId` or `status` by passing arbitrary body properties.

#### Acceptance Criteria

1. THE `updateOpportunity` handler SHALL explicitly destructure and whitelist the following fields from `req.body`: `title`, `role`, `description`, `requiredSkills`, `duration`, `budget`, `isRemote`, `status`.
2. THE `updateOpportunity` handler SHALL not pass the raw `req.body` object directly to `prisma.opportunity.update`.
3. WHEN a caller includes `ownerId` in the request body, THE API Server SHALL ignore that field and keep the existing `ownerId` unchanged.

---

### Requirement 13 — Invalid PR Status Values

**User Story:** As a developer, I want pull-request status transitions to be validated against a known enumeration, so that invalid status strings cannot be persisted to the database.

#### Acceptance Criteria

1. THE `reviewPullRequest` handler SHALL validate that the `status` field in `req.body` is one of `["OPEN", "UNDER_REVIEW", "MERGED", "CLOSED"]`.
2. IF `status` is not in the allowed enumeration, THEN THE API Server SHALL return HTTP 400 with message `"Invalid status value"`.
3. THE `createPullRequest` handler SHALL validate that the `type` field, when provided, is one of `["BUG_FIX", "FEATURE", "REFACTOR", "DOCS", "TEST"]`.

---

### Requirement 14 — PR Membership Gate

**User Story:** As a project owner, I want to restrict pull-request submissions to users who are project members or have an approved repository-access request, so that arbitrary users cannot submit PRs to projects they have no relationship with.

#### Acceptance Criteria

1. WHEN `POST /pull-requests` is called, THE API Server SHALL verify that the authenticated user has an active `ProjectMember` record or an `APPROVED` `RepositoryAccessRequest` for the target project.
2. IF the user is neither a member nor has approved repo access, THEN THE API Server SHALL return HTTP 403 with message `"You must be a project member or have approved repository access to submit a pull request"`.

---

### Requirement 15 — Cross-Project Bug/PR Linking

**User Story:** As a platform operator, I want bug reports and pull requests to be constrained to their owning project, so that a contributor cannot link a bug from Project A to a PR submitted against Project B.

#### Acceptance Criteria

1. WHEN `POST /pull-requests` is called with a `bugReportId`, THE API Server SHALL verify that the referenced `BugReport` belongs to the same `projectId` as the pull request being created.
2. IF the `bugReportId` references a bug report from a different project, THEN THE API Server SHALL return HTTP 400 with message `"The referenced bug report does not belong to this project"`.

---

### Requirement 16 — Project Visibility Bug on Completion

**User Story:** As a project owner, I want completing a project to preserve its current visibility setting, so that PRIVATE or UNLISTED projects do not become publicly visible upon completion.

#### Acceptance Criteria

1. WHEN a project is marked as completed, THE API Server SHALL not alter the project's `visibility` field.
2. THE project completion endpoint SHALL only update `isCompleted` and `completedAt` fields, leaving all other project fields unchanged unless explicitly included in the request body.

---

### Requirement 17 — Negative Pagination 500 Error

**User Story:** As an API consumer, I want negative or non-numeric pagination parameters to be handled gracefully, so that invalid query strings do not cause server crashes.

#### Acceptance Criteria

1. WHEN a `limit` or `offset` query parameter is negative, THE API Server SHALL clamp the value to `0` (offset) or `1` (limit) rather than passing the negative value to Prisma.
2. WHEN a `limit` or `offset` query parameter is non-numeric or absent, THE API Server SHALL use the documented default value (`50` for limit, `0` for offset).
3. THE API Server SHALL apply this validation in all controllers that accept `limit` and `offset` query parameters: `projectController`, `opportunityController`, `notificationController`, `bugReportController`, and `pullRequestController`.

---

### Requirement 18 — Trending Algorithm Score

**User Story:** As a developer browsing projects, I want the trending sort to weigh recent engagement more heavily than raw totals, so that consistently active new projects surface above dormant projects with accumulated likes.

#### Acceptance Criteria

1. WHEN `GET /projects?sort=trending` is called, THE API Server SHALL compute a trending score using: `(likes × 3) + (comments × 2) + (members × 2) + max(0, 30 − ageDays)`.
2. THE trending score computation SHALL use `ageDays` calculated as `(currentTimeMs − createdAtMs) / 86400000`.
3. THE API Server SHALL sort results in descending order of trending score, with ties broken by `createdAt` descending.

---

### Requirement 19 — Hardcoded Localhost

**User Story:** As a DevOps engineer deploying DevMitra, I want all URLs read from environment variables, so that the application works correctly across development, staging, and production environments.

#### Acceptance Criteria

1. THE API Server SHALL read the frontend base URL from `process.env.FRONTEND_URL`, defaulting to `"http://localhost:3000"` if the variable is absent.
2. THE `authController.js` SHALL replace all hardcoded `"http://localhost:3000"` strings with `process.env.FRONTEND_URL`.
3. THE Frontend SHALL read the backend API base URL from `process.env.NEXT_PUBLIC_API_URL`, defaulting to `"http://localhost:5000"` if absent.
4. THE API Server CORS configuration SHALL read the allowed origin from `process.env.FRONTEND_URL`.

---

### Requirement 20 — Cookie Production Settings

**User Story:** As a security engineer, I want the session cookie configured for production, so that the token cannot be transmitted over plain HTTP or read by JavaScript in a cross-site context.

#### Acceptance Criteria

1. WHEN `NODE_ENV` is `"production"`, THE API Server SHALL set the `secure` attribute on the `token` cookie to `true`.
2. WHEN `NODE_ENV` is `"production"`, THE API Server SHALL set the `sameSite` attribute on the `token` cookie to `"strict"`.
3. WHILE `NODE_ENV` is not `"production"`, THE API Server SHALL retain `secure: false` and `sameSite: "lax"` to allow development over HTTP.

---

### Requirement 21 — Missing Security Headers

**User Story:** As a security engineer, I want standard HTTP security headers applied to all API responses, so that browsers are protected against common web vulnerabilities.

#### Acceptance Criteria

1. THE API Server SHALL include the `helmet` middleware (or equivalent manual header middleware) to set the following headers on all responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `X-XSS-Protection: 0`.
2. THE API Server SHALL set `Content-Security-Policy: default-src 'self'` on all API responses.
3. THE `helmet` middleware SHALL be registered before all route handlers in `app.js`.

---

### Requirement 22 — Inconsistent Unauthenticated Behaviour

**User Story:** As an API consumer building integrations, I want consistent authentication enforcement so that all protected endpoints return HTTP 401 for unauthenticated requests rather than a mix of 401 and 403 errors.

#### Acceptance Criteria

1. THE Auth Middleware SHALL return HTTP 401 with message `"Not authenticated"` when no valid JWT token is present.
2. THE Auth Middleware SHALL return HTTP 403 with message `"Not authorized"` only when a valid token is present but the user lacks the required permission for the resource.
3. THE API Server SHALL apply this distinction uniformly across all protected routes.

---

### Requirement 23 — Missing Form Labels

**User Story:** As a screen-reader user, I want every form input to have an associated label, so that assistive technology can identify each field.

#### Acceptance Criteria

1. THE Frontend SHALL ensure every `<input>`, `<textarea>`, and `<select>` element has either an associated `<label>` element linked via `htmlFor` / `id` or an `aria-label` attribute.
2. THE Frontend SHALL not use placeholder text as the sole means of identifying a form field.
3. WHEN a label is visually hidden for design reasons, THE Frontend SHALL use a visually-hidden CSS utility class so the label remains accessible to screen readers.

---

### Requirement 24 — Inaccessible Icon-Only Links

**User Story:** As a screen-reader user, I want icon-only buttons and links to provide accessible text, so that I understand the purpose of each interactive element.

#### Acceptance Criteria

1. THE Frontend SHALL add an `aria-label` attribute to every `<Link>` or `<button>` element that contains only an icon with no visible text (e.g., Bell, MessageSquare, Search in TopBar; LogOut icon buttons in Sidebar).
2. THE Frontend SHALL add `aria-label` to icon-only navigation items in the collapsed Sidebar (64 px icon-only mode).
3. THE Frontend SHALL not use the `title` attribute as the sole accessibility text for interactive elements; `aria-label` SHALL be present.

---

### Requirement 25 — Empty Alt Text on Meaningful Images

**User Story:** As a screen-reader user, I want user avatar images and project cover images to have descriptive alt text, so that meaningful visual content is communicated to me.

#### Acceptance Criteria

1. THE Frontend SHALL set `alt` to a non-empty descriptive string (e.g., `"{username}'s avatar"`) on every user avatar `<img>` element.
2. THE Frontend SHALL set `alt` to a non-empty descriptive string (e.g., `"{title} cover image"`) on every project cover `<img>` element.
3. WHERE an image is purely decorative, THE Frontend SHALL set `alt=""` explicitly.

---

### Requirement 26 — Raw `<img>` vs Next.js `<Image>`

**User Story:** As a performance-conscious developer, I want project and avatar images served through Next.js Image Optimization, so that images are automatically resized, lazy-loaded, and served in modern formats.

#### Acceptance Criteria

1. THE Frontend SHALL replace raw `<img>` elements with the Next.js `<Image>` component for all user avatar and project cover images that use remote URLs.
2. THE Frontend SHALL configure `next.config.js` with the appropriate `images.remotePatterns` or `images.domains` entries for GitHub avatar CDN and any other external image hosts.
3. WHERE a base64-encoded data URI is used (FileUploader output), THE Frontend MAY retain a raw `<img>` element, as `next/image` does not support data URIs.

---

### Requirement 27 — Polling Intervals

**User Story:** As a platform operator, I want polling intervals to be configurable and conservative by default, so that the application does not generate excessive API traffic when many users are online simultaneously.

#### Acceptance Criteria

1. THE TopBar notification poll interval SHALL be reduced from 15 000 ms to 30 000 ms.
2. THE TopBar message unread-count poll interval SHALL be reduced from 5 000 ms to 15 000 ms.
3. WHILE the browser tab is not visible (`document.visibilityState === "hidden"`), THE Frontend SHALL pause all polling queries using `react-query`'s `refetchIntervalInBackground: false` option.

---

### Requirement 28 — N+1 Queries

**User Story:** As a platform operator, I want database queries to use batch-loading patterns, so that listing endpoints do not issue one query per row.

#### Acceptance Criteria

1. THE `getUserRatings` handler SHALL compute rating averages in the application layer over the already-fetched `ratings` array, rather than issuing a separate aggregation query per user.
2. THE `getProjectBugReports` handler SHALL include the `pullRequests` relation in a single `findMany` query using Prisma `include`, not via a subsequent loop of individual fetches.
3. THE `getProjectPullRequests` handler SHALL include the `bugReport` relation in a single `findMany` query using Prisma `include`.
4. THE `getProjects` handler SHALL include `_count` for likes, comments, and members in the single `findMany` call already present, without issuing additional per-project queries.

---

### Requirement 29 — Large Components

**User Story:** As a frontend developer, I want large monolithic components split into focused sub-components, so that the codebase is easier to test, maintain, and reason about.

#### Acceptance Criteria

1. THE Frontend SHALL extract the logout confirmation modal from `Sidebar.tsx` into a dedicated `LogoutConfirmModal` component.
2. THE Frontend SHALL extract the "More" flyout menu from `Sidebar.tsx` into a dedicated `SidebarMoreMenu` component.
3. THE Frontend SHALL split any page component exceeding 500 lines of TSX into sub-components, each in its own file under the relevant `components/` subdirectory.

---

### Requirement 30 — Unused Files

**User Story:** As a developer maintaining the codebase, I want unused files removed, so that the repository is not cluttered with dead code that confuses contributors.

#### Acceptance Criteria

1. THE repository SHALL contain no source files that are not imported or otherwise referenced by any active entry point.
2. THE cleanup task SHALL identify and delete unused components, utility files, and route files confirmed to have no importers.
3. WHEN a file is removed, THE API Server and Frontend builds SHALL continue to compile without errors.

---

### Requirement 31 — Stale README

**User Story:** As a new contributor, I want the README to reflect the current project structure and setup steps, so that I can get the project running without relying on outdated instructions.

#### Acceptance Criteria

1. THE root `README.md` SHALL include accurate local setup instructions covering: cloning the repository, installing backend dependencies, installing frontend dependencies, configuring environment variables, running Prisma migrations, and starting both services.
2. THE README SHALL list all required environment variables for both `backend/.env` and `frontend/.env.local`.
3. THE README SHALL describe the project structure at the top level (backend, frontend, .kiro, prisma).

---

### Requirement 32 — Lint Errors and Warnings

**User Story:** As a developer, I want the codebase to pass lint validation cleanly, so that real issues are not hidden in a sea of pre-existing lint noise.

#### Acceptance Criteria

1. THE Frontend build SHALL produce zero ESLint errors when run via `eslint` in the `frontend/` directory.
2. THE Frontend build SHALL produce fewer than 10 ESLint warnings after remediation.
3. THE API Server SHALL produce zero lint errors when checked with a configured linter.
4. WHEN `next build` is executed in the `frontend/` directory, THE build SHALL complete without TypeScript compilation errors.

---

### Requirement 33 — No Automated Tests

**User Story:** As a developer, I want a baseline test suite in place, so that regressions in critical paths are caught automatically before deployment.

#### Acceptance Criteria

1. THE repository SHALL include a testing framework configured for the backend (Jest or Vitest) with at least one passing test file.
2. THE backend test suite SHALL include unit tests for: the OAuth CSRF state validation logic, the rating duplication check in `ratingController.js`, and the pagination clamping utility.
3. THE repository SHALL include a testing framework configured for the frontend (Jest with React Testing Library or Vitest) with at least one passing component test.
4. THE frontend test suite SHALL include a render test verifying that `FileUploader` rejects files exceeding the 5 MB image limit and displays the correct error message.
5. WHEN `npm test` is executed in either the `backend/` or `frontend/` directory, THE test runner SHALL exit with code `0`.
