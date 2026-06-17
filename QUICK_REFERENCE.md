# DevMitra - Quick Reference Guide

## 🚀 Quick Start

### Start the Application
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Login**: Click "Get Started with GitHub" on homepage

---

## 📋 Key Features Checklist

### ✅ Implemented & Working
- [x] GitHub OAuth Login
- [x] Create/Edit/Delete Projects
- [x] Browse All Projects
- [x] Search & Filter Projects
- [x] Request Access to Projects
- [x] Approve/Reject Requests
- [x] Team Membership Management
- [x] Activity Tracking
- [x] User Profiles
- [x] Platform Statistics
- [x] Dark Theme UI
- [x] Three-Column Layout
- [x] Top Navigation Bar
- [x] Trending Projects Sidebar

### ⏳ UI Only (Not Functional Yet)
- [ ] Notification System (badge shown but static)
- [ ] Message System (icon shown but static)
- [ ] Real-time Updates

---

## 🎨 UI Layout

```
┌──────────────────────────────────────────────────────────┐
│               Top Bar (Search, Notifs, Profile)          │
├──────────┬────────────────────────────────┬──────────────┤
│          │                                │              │
│  Left    │        Main Content            │    Right     │
│ Sidebar  │      (Dynamic Pages)           │   Sidebar    │
│ (256px)  │                                │   (320px)    │
│          │                                │              │
│  - Logo  │  - Dashboard Stats             │  - Trending  │
│  - Nav   │  - Projects Grid               │  - Top       │
│  - User  │  - Forms                       │    Contributors│
│          │  - Details                     │  - Stats     │
│          │                                │              │
└──────────┴────────────────────────────────┴──────────────┘
```

---

## 🔑 Main User Flows

### 1. Getting Started
1. Open http://localhost:3000
2. Click "Get Started with GitHub"
3. Authorize on GitHub
4. You're logged in! 🎉

### 2. Creating a Project
1. Click "New Project" (sidebar or dashboard)
2. Fill form:
   - Title
   - Description
   - Deployed URL
   - Tags (comma-separated)
3. Submit
4. You're automatically the OWNER

### 3. Requesting Access
1. Browse "Projects"
2. Click on a project (not yours)
3. Click "Request Access"
4. Fill reason & contribution
5. Submit
6. Wait for owner to approve

### 4. Managing Requests (As Owner)
1. Go to "Requests" page
2. Click "Received" tab
3. Review request details
4. Click "Approve" → User becomes CONTRIBUTOR
5. Or "Reject" → Request declined

---

## 📁 Project Structure

```
DevMitra/
├── backend/               ← Node.js + Express + PostgreSQL
│   ├── prisma/           ← Database schema & migrations
│   ├── src/
│   │   ├── controllers/  ← Business logic
│   │   ├── routes/       ← API endpoints
│   │   └── middleware/   ← Auth, errors, rate limiting
│   └── server.js         ← Entry point
│
└── frontend/             ← Next.js + TypeScript + Tailwind
    ├── app/              ← Pages (App Router)
    │   ├── layout.tsx    ← Root layout (3-column)
    │   ├── page.tsx      ← Homepage/Dashboard
    │   ├── projects/     ← Projects pages
    │   ├── requests/     ← Requests page
    │   └── profile/      ← Profile page
    └── components/       ← Reusable components
        ├── Sidebar.tsx
        ├── TopBar.tsx
        └── RightSidebar.tsx
```

---

## 🗄️ Database Models

```
User ──┬─→ Project (owned projects)
       ├─→ ProjectMember (memberships)
       └─→ ProjectAccessRequest (requests)

Project ──┬─→ ProjectMember (team)
          ├─→ ProjectAccessRequest (pending requests)
          ├─→ ProjectTag (tech stack)
          └─→ ActivityLog (activities)
```

---

## 🔐 Authentication

**Method**: GitHub OAuth → JWT in HTTP-only Cookie

**Flow**:
1. User clicks "Login with GitHub"
2. Redirects to GitHub OAuth
3. GitHub returns with code
4. Backend exchanges code for token
5. Backend creates/updates user
6. Backend generates JWT
7. Backend sets HTTP-only cookie
8. Backend redirects to frontend
9. Frontend reads cookie automatically

**Security**:
- JWT in HTTP-only cookie (can't access via JS)
- sameSite: "lax"
- CORS with credentials
- Rate limiting

---

## 🌐 API Endpoints Summary

### Auth
- `GET /api/auth/github` - Start OAuth
- `GET /api/auth/github/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Projects
- `POST /api/projects` - Create
- `GET /api/projects` - List all (search, filter)
- `GET /api/projects/:id` - Get one
- `PUT /api/projects/:id` - Update (owner only)
- `DELETE /api/projects/:id` - Delete (owner only)

### Access Requests
- `POST /api/access-requests` - Create request
- `GET /api/access-requests/mine` - My sent requests
- `GET /api/access-requests/incoming` - Received requests
- `POST /api/access-requests/:id/approve` - Approve
- `POST /api/access-requests/:id/reject` - Reject

---

## 🎯 Pages & Routes

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Login page (if not auth) |
| Dashboard | `/` | Stats & recent projects (if auth) |
| Projects | `/projects` | Browse all projects |
| My Projects | `/my-projects` | Your owned projects |
| Project Detail | `/projects/:id` | Single project view |
| New Project | `/projects/new` | Create project form |
| Requests | `/requests` | Manage access requests |
| Profile | `/profile` | Your profile & stats |

---

## 🔍 Testing Quick Guide

### Test Authentication
1. Login with GitHub ✓
2. Check cookie in DevTools ✓
3. Refresh page (should stay logged in) ✓
4. Logout ✓

### Test Projects
1. Create project ✓
2. View in "My Projects" ✓
3. Edit project ✓
4. View in "All Projects" ✓
5. Search for project ✓

### Test Access Requests
1. Request access (as non-owner) ✓
2. View in "Sent" requests ✓
3. Approve (as owner) ✓
4. Check user is now member ✓

### Test UI
1. Check three columns visible ✓
2. Check top bar present ✓
3. Check dark theme consistent ✓
4. Check all navigation links ✓

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL is running
# Check .env file exists
# Check DATABASE_URL is correct
cd backend
npx prisma migrate dev
node server.js
```

### Frontend won't start
```bash
# Check .env.local exists
# Check NEXT_PUBLIC_API_URL is correct
cd frontend
npm install
npm run dev
```

### OAuth fails
- Check GitHub OAuth app settings
- Callback URL must be: `http://localhost:5000/api/auth/github/callback`
- Check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env

### Cookie not set
- Check CORS settings in backend
- Check withCredentials: true in frontend API client
- Check browser allows cookies

### Database errors
```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

---

## 📊 Stats to Check

After creating some data, verify:
- Total users count
- Total projects count
- Access requests count (with pending)
- Activities count
- Memberships count

All displayed on:
- Dashboard stats cards
- Right sidebar "Platform Stats"
- Profile page stats

---

## 🎨 Color Palette

```css
/* Dark Theme */
Background: gray-950 (#030712)
Cards: gray-900 (#111827)
Borders: gray-800 (#1f2937)
Text Primary: white (#ffffff)
Text Secondary: gray-400 (#9ca3af)
Accent: indigo-600 (#4f46e5)
Success: green-600 (#16a34a)
Warning: yellow-600 (#ca8a04)
Error: red-600 (#dc2626)
```

---

## 📚 Documentation Files

- `API_DOCUMENTATION.md` - Complete API reference
- `DEPLOYMENT_CHECKLIST.md` - Deploy to production
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `TESTING_GUIDE.md` - Step-by-step testing
- `PROJECT_STATUS.md` - Current status
- `QUICK_REFERENCE.md` - This file!

---

## ⚡ Quick Commands

```bash
# Start Backend
cd backend && node server.js

# Start Frontend
cd frontend && npm run dev

# Build Frontend
cd frontend && npm run build

# Database Migrate
cd backend && npx prisma migrate dev

# Database Reset
cd backend && npx prisma migrate reset

# Generate Prisma Client
cd backend && npx prisma generate

# View Database
cd backend && npx prisma studio
```

---

## 🎉 Success Indicators

You know it's working when:
- ✅ Both servers running without errors
- ✅ You can login with GitHub
- ✅ Dashboard shows your username
- ✅ You can create a project
- ✅ You can request access to projects
- ✅ You can approve/reject requests
- ✅ UI has dark theme with three columns
- ✅ No console errors

---

## 🚀 Next Steps

1. **Test Everything** - Use TESTING_GUIDE.md
2. **Fix Bugs** - Document and fix any issues
3. **Deploy** - Follow DEPLOYMENT_CHECKLIST.md
4. **Enhance** - Add remaining features
5. **Monitor** - Set up error tracking & monitoring

---

## 💡 Pro Tips

- Keep browser DevTools open to see console logs
- Check "Network" tab to see API calls
- Check "Application" tab to see cookies
- Use Prisma Studio to view database: `npx prisma studio`
- Use Thunder Client / Postman to test API directly

---

## 🆘 Need Help?

1. Check console logs (browser & terminal)
2. Check TESTING_GUIDE.md
3. Check API_DOCUMENTATION.md
4. Check environment variables (.env files)
5. Check database with Prisma Studio
6. Review error messages carefully

---

**Remember**: Both servers must be running for the app to work!

**Quick Test**: Open http://localhost:3000 and try logging in 🚀
