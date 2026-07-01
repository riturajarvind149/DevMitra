# Implementation Plan: Security and Bug Remediation

## Overview

Surgical patches to the DevMitra Node.js/Express + Prisma backend and Next.js TypeScript frontend to close all 33 findings from the security audit. Tasks are ordered by impact: Critical/High security fixes first, medium functional bugs second, shared utilities third, UI/accessibility/performance fourth, and cleanup/docs/tests last. Each task references the relevant requirement(s) and maps to specific files and code changes described in the design document.

---

## Tasks

### Group 1 — Critical & High Security Fixes

- [x] 1. Strip email from public API responses
  - [x] 1.1 Split `USER_PUBLIC_SELECT` into public and private variants in `userController.js`
    - Add `USER_PRIVATE_SELECT` that extends the public select with `email: true`
    - In `getUserById`, check `req.user?.id === id`; use private select for owner, public for all others
    - In `getUsers`, AI match, and developer-search handlers always use `USER_PUBLIC_SELECT`
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Remove `email` from project member select in `projectController.js` `getProjectById`
    - Change the `user: { select: { ... email: true ... } }` include to omit `email`
    - _Requirements: 1.3_
  - [x] 1.3 Write property test for email exposure (Property 1)
    - **Property 1: Public user responses omit email**
    - **Validates: Requirements 1.1, 1.3**

- [x] 2. Protect `POST /users` from unauthenticated and non-admin callers
  - [x] 2.1 Add `protect` middleware to `POST /users` route in `userRoutes.js`
    - Ensure `req.user` is populated before the `createUser` controller runs
    - _Requirements: 2.1_
  - [x] 2.2 Add `!req.user` → 401 and `!req.user.isAdmin` → 403 guards in `createUser`
    - Return `{ message: "Not authenticated" }` when no user, `{ message: "Admins only" }` when not admin
    - _Requirements: 2.2, 2.3_

- [x] 3. Implement OAuth CSRF state validation
  - [x] 3.1 Generate and store `oauth_state` cookie in `loginWithGithub`
    - Use `crypto.randomBytes(16).toString("hex")` for the state value
    - Set `httpOnly: true`, `maxAge: 600000`, `sameSite: "lax"`, `secure` based on `NODE_ENV`
    - Append `&state=<value>` to the GitHub authorisation URL
    - _Requirements: 3.1_
  - [x] 3.2 Validate and invalidate `oauth_state` in `githubCallback`
    - Call `res.clearCookie("oauth_state")` immediately (single-use enforcement)
    - Compare `req.query.state` to `req.cookies.oauth_state`; on mismatch redirect to `${FRONTEND_URL}?error=oauth_csrf`
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 3.3 Write property test for OAuth state validation (Property 2)
    - **Property 2: OAuth state mismatch always rejects**
    - **Validates: Requirements 3.2, 3.3**

- [x] 4. Fix IDOR on opportunity applications
  - [x] 4.1 Enforce ownership check in `approveApplication` and `rejectApplication`
    - Fetch the opportunity, then return 403 if `opp.ownerId !== req.user.id`
    - _Requirements: 4.2, 4.3, 4.4_
  - [x] 4.2 Verify `getUserApplications` uses `req.user.id` (not URL param) as filter
    - Confirm the `where` clause is `{ applicantId: req.user.id }`, ignoring `:userId` for data access
    - _Requirements: 4.1_
  - [x] 4.3 Write property test for user-applications IDOR (Property 3)
    - **Property 3: User applications endpoint ignores URL parameter**
    - **Validates: Requirement 4.1**

- [x] 5. Hide opportunity application data from non-owners
  - [x] 5.1 Conditionally strip `applications` from `getOpportunityById` response
    - Build the response object; if `req.user?.id !== opp.ownerId` spread `opp` and set `applications: undefined`
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 5.2 Write property test for opportunity applications visibility (Property 4)
    - **Property 4: Opportunity applications hidden from non-owners**
    - **Validates: Requirements 5.1, 5.3**

- [x] 6. Enforce private-project visibility on secondary endpoints
  - [x] 6.1 Filter private projects from `getUserProjects` in `userController.js`
    - Add `...(isOwner ? {} : { visibility: { not: "PRIVATE" } })` to the `where` clause
    - _Requirements: 6.1_
  - [x] 6.2 Filter private project memberships from `getUserMemberships`
    - Add `project: { visibility: { not: "PRIVATE" } }` to `where` when requester ≠ profile owner
    - _Requirements: 6.2_
  - [x] 6.3 Add private-project guard to `getProjectStats`
    - Fetch the project; if `visibility === "PRIVATE"` and requester is not owner or member return 403
    - Implement a shared `isMember(projectId, userId)` helper for reuse across controllers
    - _Requirements: 6.3_
  - [x] 6.4 Add private-project guard to `getProjectBugReports` and `getProjectPullRequests`
    - Fetch project, check visibility, return 403 for non-owner/non-member on PRIVATE projects
    - _Requirements: 6.4_
  - [x] 6.5 Write property test for private project exclusion (Property 5)
    - **Property 5: Private projects excluded from secondary listings**
    - **Validates: Requirements 6.1, 6.2**

- [x] 7. Prevent duplicate null-PR contributor ratings
  - [x] 7.1 Add application-level duplicate check in `rateContributor`
    - Before `create`, call `prisma.contributorRating.findFirst({ where: { giverId, receiverId, projectId, pullRequestId: null } })`
    - Return 409 with `"You have already rated this contributor for this project"` if found
    - _Requirements: 7.1, 7.2_
  - [x] 7.2 Create Prisma migration for partial unique index on `ContributorRating`
    - New migration file with `CREATE UNIQUE INDEX "ContributorRating_null_pr_dedup" ON "ContributorRating" ("giverId", "receiverId", "projectId") WHERE "pullRequestId" IS NULL;`
    - Run `npx prisma migrate dev --name rating_dedup_index` to apply
    - _Requirements: 7.3, 7.4_
  - [x] 7.3 Write property test for rating duplication (Property 6)
    - **Property 6: Duplicate null-PR contributor ratings rejected**
    - **Validates: Requirements 7.1, 7.2**

- [x] 8. Cap request body size and validate file upload limits
  - [x] 8.1 Set body-parser limits to `"10mb"` in `app.js`
    - Change `express.json()` and `express.urlencoded()` to pass `{ limit: "10mb" }`
    - _Requirements: 9.1, 9.2_
  - [x] 8.2 Add file size validation to `FileUploader.tsx`
    - Define `IMAGE_MAX = 5MB` and `VIDEO_MAX = 50MB` constants
    - In `processFile`, check `file.size > limit`; if over limit call `setError(...)` and `return` without calling `onChange`
    - Add `const [error, setError] = useState<string | null>(null)` to component state
    - Render `<p role="alert">` below drop zone when `error` is non-null
    - _Requirements: 9.3, 9.4, 9.5_
  - [x] 8.3 Write property test for FileUploader file size rejection (Property 7)
    - **Property 7: FileUploader rejects oversized files**
    - **Validates: Requirements 9.3, 9.4, 9.5**

- [x] 9. Apply rate limiters consistently
  - [x] 9.1 Apply `authLimiter` to all routes in `authRoutes.js`
    - Add `router.use(authLimiter)` at the top of the auth router file
    - _Requirements: 10.1_
  - [x] 9.2 Apply `createLimiter` to POST create routes in each resource router
    - Add `createLimiter` middleware to `POST /` in `projectRoutes.js`, `bugReportRoutes.js`, `pullRequestRoutes.js`, `opportunityRoutes.js`, and `ratingRoutes.js`
    - _Requirements: 10.2_
  - [x] 9.3 Remove the `skip` function from `apiLimiter` in `rateLimiter.js`
    - Delete or comment out the `skip: (req) => req.path.startsWith("/stats")` option
    - _Requirements: 10.3, 10.4_

- [x] 10. Checkpoint — Verify critical security fixes
  - Ensure all tests pass, ask the user if questions arise.

---

### Group 2 — Medium Functional Bug Fixes

- [x] 11. Fix notification IDOR in `markAsRead`
  - [x] 11.1 Add ownership check in `notificationController.js` `markAsRead`
    - Fetch the notification by `id`, verify `notification.receiverId === req.user.id`; return 403 if not
    - Use combined `where: { id, receiverId: req.user.id }` in the `update` call
    - _Requirements: 11.1, 11.2, 11.3_
  - [x] 11.2 Write property test for notification ownership (Property 8)
    - **Property 8: Notification ownership prevents cross-user reads**
    - **Validates: Requirement 11.1**

- [x] 12. Fix mass assignment in `updateOpportunity`
  - [x] 12.1 Whitelist accepted fields in `opportunityController.js` `updateOpportunity`
    - Explicitly destructure `title, role, description, requiredSkills, duration, budget, isRemote, status` from `req.body`
    - Build a `data` object with only defined fields; pass `data` (not `req.body`) to `prisma.opportunity.update`
    - _Requirements: 12.1, 12.2, 12.3_
  - [x] 12.2 Write property test for mass assignment guard (Property 9)
    - **Property 9: Opportunity update ignores ownerId in body**
    - **Validates: Requirements 12.1, 12.3**

- [x] 13. Validate PR status and type enum values
  - [x] 13.1 Add enum validation in `pullRequestController.js`
    - Define `VALID_PR_STATUS` and `VALID_PR_TYPE` constants at the top of the file
    - In `reviewPullRequest`, return 400 `"Invalid status value"` if status not in `VALID_PR_STATUS`
    - In `createPullRequest`, return 400 `"Invalid type value"` if type not in `VALID_PR_TYPE`
    - _Requirements: 13.1, 13.2, 13.3_
  - [x] 13.2 Write property test for enum validation (Property 10)
    - **Property 10: PR status and type values are validated against enums**
    - **Validates: Requirements 13.1, 13.3**

- [x] 14. Gate PR submission to project members and approved repo-access holders
  - [x] 14.1 Add membership/repo-access check in `createPullRequest`
    - After the owner-cannot-submit check, `Promise.all` a `ProjectMember` lookup and a `RepositoryAccessRequest` lookup
    - Return 403 with the specified message if neither record exists
    - _Requirements: 14.1, 14.2_
  - [x] 14.2 Write property test for PR membership gate (Property 11)
    - **Property 11: PR submission requires project membership**
    - **Validates: Requirement 14.1**

- [x] 15. Prevent cross-project bug/PR linking
  - [x] 15.1 Validate `bugReportId` belongs to the same project in `createPullRequest`
    - If `bugReportId` is provided, fetch the bug and compare `bug.projectId !== projectId`; return 400 with message `"The referenced bug report does not belong to this project"`
    - _Requirements: 15.1, 15.2_
  - [x] 15.2 Write property test for cross-project bug linking (Property 12)
    - **Property 12: Cross-project bug linking is rejected**
    - **Validates: Requirement 15.1**

- [x] 16. Confirm project completion preserves visibility field
  - [x] 16.1 Audit `updateProject` handler to ensure `visibility` is only written when present in request body
    - Verify the destructuring/whitelist pattern excludes `visibility` from the completion flow
    - If a dedicated `completeProject` endpoint exists or is added, restrict its `data` object to `{ isCompleted: true, completedAt: new Date() }`
    - _Requirements: 16.1, 16.2_
  - [x] 16.2 Write property test for completion visibility preservation (Property 13)
    - **Property 13: Project completion preserves visibility**
    - **Validates: Requirements 16.1, 16.2**

- [x] 17. Fix project visibility bug on completion and harden related endpoint guards
  - [x] 17.1 Add trending formula inline comment to `getProjects`
    - Add the comment `// Trending score: likes*3 + comments*2 + members*2 + max(0, 30-ageDays)` directly above the sort comparator
    - Verify the implemented formula matches Requirement 18 exactly; adjust if discrepancy found
    - _Requirements: 18.1, 18.2, 18.3_

- [x] 18. Standardise auth middleware 401/403 semantics
  - [x] 18.1 Update `authMiddleware.js` to return 401 `"Not authenticated"` for missing/invalid tokens
    - Change the no-token path from returning "Not authorized"/403 to `{ message: "Not authenticated" }` with status 401
    - Ensure the expired/invalid-token catch block also returns 401
    - _Requirements: 22.1, 22.2, 22.3_
  - [x] 18.2 Write property test for unauthenticated route behavior (Property 16)
    - **Property 16: Unauthenticated requests to protected routes return 401**
    - **Validates: Requirements 22.1, 22.2**

- [x] 19. Replace hardcoded localhost URLs with environment variables
  - [x] 19.1 Add `FRONTEND_URL` constant in `authController.js`
    - Replace all three `"http://localhost:3000"` occurrences with `process.env.FRONTEND_URL ?? "http://localhost:3000"`
    - _Requirements: 19.1, 19.2_
  - [x] 19.2 Update CORS configuration in `app.js` to use `process.env.FRONTEND_URL`
    - Change `cors({ origin: "http://localhost:3000" })` to use the env var
    - _Requirements: 19.4_
  - [x] 19.3 Update frontend API base URL to use `NEXT_PUBLIC_API_URL`
    - In `frontend/lib/api.ts` (or equivalent), set `const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"`
    - _Requirements: 19.3_

- [x] 20. Harden cookie settings for production
  - [x] 20.1 Set `secure` and `sameSite` on the `token` cookie based on `NODE_ENV`
    - In `githubCallback`, compute `const isProd = process.env.NODE_ENV === "production"`
    - Pass `secure: isProd, sameSite: isProd ? "strict" : "lax"` to `res.cookie`
    - _Requirements: 20.1, 20.2, 20.3_

- [x] 21. Add `helmet` security headers middleware
  - [x] 21.1 Install `helmet@7` and register it as the first middleware in `app.js`
    - Run `cd backend && npm install helmet@7 --save-exact`
    - Add `app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } } }))` before all other middleware
    - _Requirements: 21.1, 21.2, 21.3_

- [x] 22. Checkpoint — Verify medium bug fixes
  - Ensure all tests pass, ask the user if questions arise.

---

### Group 3 — Shared Backend Utilities

- [x] 23. Create `parsePagination` utility and apply across controllers
  - [x] 23.1 Create `backend/src/utils/pagination.js` with the `parsePagination` function
    - Implement clamping: `take = max(1, min(rawLimit, 100))`, `skip = max(0, rawOffset)`, with defaults for non-numeric input
    - Export `{ parsePagination }`
    - _Requirements: 17.1, 17.2_
  - [x] 23.2 Replace inline `parseInt(limit)` / `parseInt(offset)` calls in five controllers
    - Update `getProjects` in `projectController.js`
    - Update `getOpportunities` in `opportunityController.js`
    - Update `getNotifications` in `notificationController.js`
    - Update `getProjectBugReports` in `bugReportController.js`
    - Update `getProjectPullRequests` in `pullRequestController.js`
    - _Requirements: 17.3_
  - [x] 23.3 Write property test for pagination clamping (Property 14)
    - **Property 14: Pagination parameters are clamped to safe ranges**
    - **Validates: Requirements 17.1, 17.2**

- [x] 24. Create `ratingUtils.js` helper for duplicate-check logic
  - [x] 24.1 Create `backend/src/utils/ratingUtils.js` and extract `checkDuplicateRating`
    - Export `checkDuplicateRating(existing) => boolean` (returns `true` when `existing` is non-null)
    - Update `rateContributor` in `ratingController.js` to call this helper
    - _Requirements: 7.1_

- [x] 25. Fix N+1 queries in listing controllers
  - [x] 25.1 Add `pullRequests` include to `getProjectBugReports` single `findMany`
    - Add `pullRequests: { select: { id:true, title:true, status:true } }` to the existing `include` object
    - _Requirements: 28.2_
  - [x] 25.2 Add `bugReport` include to `getProjectPullRequests` single `findMany`
    - Add `bugReport: { select: { id:true, title:true, type:true } }` to the existing `include` object
    - _Requirements: 28.3_
  - [x] 25.3 Add inline comment to `getUserRatings` documenting no secondary aggregation
    - Add the comment `// Averages are computed in JS over the already-fetched ratings array.`
    - _Requirements: 28.1_

- [x] 26. Checkpoint — Verify backend utilities and N+1 fixes
  - Ensure all tests pass, ask the user if questions arise.

---

### Group 4 — UI, Accessibility & Performance Fixes

- [x] 27. Fix mobile layout collapse with responsive Tailwind classes
  - [x] 27.1 Update `AppShell.tsx` to hide sidebar below `lg` breakpoint
    - Replace `paddingLeft: 64` and absolute-position logic with `hidden lg:block` on the sidebar wrapper
    - Add `lg:pl-16` to the main content column; remove inline pixel comparisons
    - _Requirements: 8.1, 8.6_
  - [x] 27.2 Create `frontend/components/MobileNavDrawer.tsx`
    - Implement the bottom tab bar (always visible on `<640px`) with links for Home, Explore, Notifications, Messages, Profile
    - Implement the slide-up drawer overlay with a More button trigger and close button
    - Add `aria-label` to all nav items, More button, and close button
    - Close the drawer on nav item click via `setOpen(false)` and route navigation
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  - [x] 27.3 Render `<MobileNavDrawer>` inside `AppShell.tsx` wrapped with `<div className="sm:hidden">`
    - _Requirements: 8.2_

- [x] 28. Add accessible labels to icon-only interactive elements
  - [x] 28.1 Add `aria-label` to icon-only links and buttons in `TopBar.tsx`
    - Add `aria-label="Notifications"` to Bell link, `aria-label="Messages"` to MessageSquare link, `aria-label="Search"` to search submit button
    - Add `aria-hidden="true"` to all icon components inside these elements
    - _Requirements: 24.1_
  - [x] 28.2 Add `aria-label` to collapsed Sidebar icon-only navigation items
    - For each nav item in collapsed (64px) mode, add `aria-label={name}` to the `<Link>` wrapper
    - Add `aria-label` to the LogOut button and More menu button in Sidebar
    - _Requirements: 24.2, 24.3_

- [x] 29. Fix empty or missing alt text on meaningful images
  - [x] 29.1 Set descriptive `alt` on user avatar `<img>` elements in `Sidebar.tsx` and `TopBar.tsx`
    - Change `alt=""` or missing alt to `alt={\`${user.username}'s avatar\`}`
    - _Requirements: 25.1_
  - [x] 29.2 Set descriptive `alt` on project cover images in `ProjectCard.tsx` and `ProjectFeedCard.tsx`
    - Change to `alt={\`${project.title} cover image\`}`
    - _Requirements: 25.2_

- [x] 30. Replace raw `<img>` with Next.js `<Image>` for remote URLs
  - [x] 30.1 Configure `remotePatterns` in `frontend/next.config.ts`
    - Add entries for `avatars.githubusercontent.com` and `*.githubusercontent.com`
    - _Requirements: 26.2_
  - [x] 30.2 Replace raw `<img>` with `<Image>` in avatar and cover image usages (remote URLs only)
    - Update `Sidebar.tsx`, `TopBar.tsx`, `ProjectCard.tsx`, `ProjectFeedCard.tsx`, and any other component with remote-URL `<img>` elements
    - Retain raw `<img>` where `src` starts with `"data:"` (FileUploader base64 output)
    - _Requirements: 26.1, 26.3_

- [x] 31. Add accessible labels to form inputs
  - [x] 31.1 Audit all `<input>`, `<textarea>`, and `<select>` elements in `frontend/app/` pages
    - Add `<label htmlFor="...">` or `aria-label` to every field that lacks one
    - Use Tailwind's `sr-only` class for visually-hidden labels where needed
    - Remove any field that relies solely on `placeholder` for identification
    - _Requirements: 23.1, 23.2, 23.3_

- [x] 32. Reduce polling intervals in `TopBar.tsx`
  - [x] 32.1 Change notification poll interval from 15 000 ms to 30 000 ms
    - Set `refetchInterval: 30000` and `refetchIntervalInBackground: false` on the notifications query
    - _Requirements: 27.1, 27.3_
  - [x] 32.2 Change message unread-count poll interval from 5 000 ms to 15 000 ms
    - Set `refetchInterval: 15000` and `refetchIntervalInBackground: false` on the message count query
    - _Requirements: 27.2, 27.3_

- [x] 33. Checkpoint — Verify UI, accessibility, and performance fixes
  - Ensure all tests pass, ask the user if questions arise.

---

### Group 5 — Component Refactoring

- [x] 34. Extract Sidebar sub-components
  - [x] 34.1 Create `frontend/components/LogoutConfirmModal.tsx`
    - Implement the modal with `onConfirm` and `onCancel` props as specified in the design
    - _Requirements: 29.1_
  - [x] 34.2 Create `frontend/components/SidebarMoreMenu.tsx`
    - Implement the floating More menu with `items`, `onClose`, and `onLogoutClick` props
    - _Requirements: 29.2_
  - [x] 34.3 Replace inline modal and More-menu JSX in `Sidebar.tsx` with the new components
    - Import and render `<LogoutConfirmModal>` and `<SidebarMoreMenu>` in place of the extracted JSX
    - _Requirements: 29.1, 29.2_

---

### Group 6 — Cleanup, Documentation & Tests

- [x] 35. Remove confirmed-unused files
  - [x] 35.1 Audit frontend components for zero-import files and delete them
    - For each candidate: search `grep -r "from.*<filename>" frontend/`, confirm zero hits, then delete
    - Run `next build` after each deletion to confirm no breakage
    - _Requirements: 30.1, 30.2, 30.3_
  - [x] 35.2 Audit backend route files for unmounted routes and delete them
    - Check `app.js` mount list; delete route files not referenced, confirm Express starts cleanly
    - _Requirements: 30.1, 30.2, 30.3_

- [x] 36. Update root README
  - [x] 36.1 Rewrite `README.md` with accurate setup instructions
    - Cover: clone, `npm install` (backend), `npm install` (frontend), env var configuration, `prisma migrate dev`, start commands for both services
    - List all required env vars for `backend/.env` and `frontend/.env.local`
    - Add a top-level project structure section (`backend/`, `frontend/`, `.kiro/`, `prisma/`)
    - _Requirements: 31.1, 31.2, 31.3_

- [x] 37. Fix ESLint errors and TypeScript compilation errors
  - [x] 37.1 Run `npx eslint . --fix` in `frontend/` and resolve remaining manual errors
    - Fix `no-unused-vars`, missing `key` props, `react-hooks/exhaustive-deps` warnings, and `any` type usages
    - _Requirements: 32.1, 32.2_
  - [x] 37.2 Run `npx tsc --noEmit` in `frontend/` and fix all TypeScript errors
    - _Requirements: 32.4_
  - [x] 37.3 Configure and run a linter on the backend; fix all errors
    - Add ESLint config to `backend/` if absent; resolve all errors
    - _Requirements: 32.3_

- [x] 38. Set up backend test suite with Jest
  - [x] 38.1 Install Jest and configure `backend/package.json` test script
    - Run `npm install --save-dev jest@29 --save-exact`
    - Add `"test": "jest --runInBand"` and jest config pointing to `**/__tests__/**/*.test.js`
    - _Requirements: 33.1_
  - [x] 38.2 Create `backend/src/utils/ratingUtils.js` `checkDuplicateRating` export (if not done in task 24.1)
    - Needed by the rating duplication test
    - _Requirements: 33.2_
  - [x] 38.3 Create `backend/__tests__/oauth.test.js`
    - Extract `generateOAuthState()` and `validateOAuthState()` as pure functions; write four tests covering happy path, mismatch, and missing values
    - _Requirements: 33.2_
  - [x] 38.4 Create `backend/__tests__/ratingDuplication.test.js`
    - Test `checkDuplicateRating` with a non-null existing record (returns `true`) and null (returns `false`)
    - _Requirements: 33.2_
  - [x] 38.5 Create `backend/__tests__/pagination.test.js`
    - Test negative limit → 1, negative offset → 0, absent params → defaults, limit > 100 → 100
    - _Requirements: 33.2_

- [x] 39. Set up frontend test suite with React Testing Library
  - [x] 39.1 Install Jest + RTL dependencies and create `frontend/jest.config.js` and `frontend/jest.setup.js`
    - Run `npm install --save-dev jest@29 jest-environment-jsdom @testing-library/react@14 @testing-library/jest-dom@6 @testing-library/user-event@14 --save-exact`
    - Configure `nextJest` wrapper; set up `setupFilesAfterFramework` pointing to `jest.setup.js`
    - _Requirements: 33.3_
  - [x] 39.2 Create `frontend/__tests__/FileUploader.test.tsx`
    - Write two tests: oversized image (>5MB) → `onChange` not called, `role="alert"` contains "5 MB"; valid image (<5MB) → no error
    - _Requirements: 33.4_

- [x] 40. Final checkpoint — Ensure full test suite passes
  - Run `npm test` in `backend/` and `npm test` in `frontend/`; both must exit with code 0
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP pass
- Priority ordering: Group 1 (Critical/High Security) → Group 2 (Medium Functional) → Group 3 (Shared Utilities) → Group 4 (UI/A11y/Perf) → Group 5 (Refactoring) → Group 6 (Cleanup/Docs/Tests)
- The partial unique index in task 7.2 requires running a Prisma migration; coordinate with database access
- Task 16.1 (project completion visibility) is a code-audit confirmation task — only write code if a discrepancy is found
- Task 18.1 (trending formula) is also a verify-and-document task; no code change expected unless the formula diverges
- All backend changes are in `backend/src/`; all frontend changes are in `frontend/`
- The `isMember` helper created in task 6.3 should be placed in `backend/src/utils/memberUtils.js` for reuse
- Property tests (tasks 1.3, 3.3, 4.3, etc.) use Jest with the `fast-check` library; install with `npm install --save-dev fast-check@3 --save-exact` in `backend/`

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "2.1", "3.1", "8.1", "9.3", "18.1", "19.1", "19.2", "19.3", "20.1", "23.1", "38.1"]
    },
    {
      "id": 1,
      "tasks": ["1.2", "2.2", "3.2", "4.1", "4.2", "5.1", "6.1", "6.2", "9.1", "9.2", "11.1", "12.1", "13.1", "16.1", "17.1", "21.1", "23.2", "24.1", "25.3"]
    },
    {
      "id": 2,
      "tasks": ["6.3", "6.4", "7.1", "8.2", "14.1", "15.1", "25.1", "25.2", "27.1", "28.1", "28.2", "29.1", "29.2", "30.1", "31.1", "32.1", "32.2"]
    },
    {
      "id": 3,
      "tasks": ["7.2", "27.2", "30.2", "34.1", "34.2", "38.2", "38.3", "38.4", "38.5", "39.1"]
    },
    {
      "id": 4,
      "tasks": ["1.3", "3.3", "4.3", "5.2", "6.5", "7.3", "8.3", "11.2", "12.2", "13.2", "14.2", "15.2", "16.2", "18.2", "23.3", "27.3", "34.3", "35.1", "35.2", "36.1", "37.1", "37.2", "37.3", "39.2"]
    }
  ]
}
```
