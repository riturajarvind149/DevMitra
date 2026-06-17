# DevMitra - Testing Guide

## How to Test the Application

### Prerequisites
- Backend running on http://localhost:5000
- Frontend running on http://localhost:3000
- GitHub OAuth configured

## Test Scenarios

### 1. Authentication Flow ✅

**Test Steps:**
1. Open http://localhost:3000
2. You should see the landing page with "Welcome to DevMitra"
3. Click "Get Started with GitHub" button
4. You'll be redirected to GitHub OAuth
5. Authorize the application
6. You should be redirected back and logged in
7. Check browser console - you should see user data logged
8. You should now see the Dashboard with statistics

**Expected Results:**
- ✅ Smooth OAuth flow
- ✅ Cookie set in browser (check DevTools → Application → Cookies)
- ✅ User data displayed in TopBar and Sidebar
- ✅ Platform statistics showing

---

### 2. Create a Project ✅

**Test Steps:**
1. Click "New Project" button (in sidebar or dashboard)
2. Fill in the form:
   - Title: "My Awesome Project"
   - Description: "A revolutionary developer tool"
   - Deployed URL: "https://myproject.com"
   - GitHub URL: "https://github.com/username/repo" (optional)
   - Tags: "React, Node.js, PostgreSQL"
3. Click "Create Project"
4. You should be redirected to the project detail page

**Expected Results:**
- ✅ Project created successfully
- ✅ You see project details page
- ✅ Your user is shown as OWNER
- ✅ Team members section shows you as OWNER
- ✅ Tags are displayed correctly
- ✅ Activity log shows "Project created"

**Check Console:**
- Should see: "Project created: {project data}"

---

### 3. Browse All Projects ✅

**Test Steps:**
1. Click "Projects" in sidebar
2. You should see all projects including yours
3. Try the search box - type part of a project title
4. Try the owner filter - type your username

**Expected Results:**
- ✅ All projects displayed in grid
- ✅ Search filters projects correctly
- ✅ Owner filter works
- ✅ Project cards show title, description, tags, metadata
- ✅ Dark theme styling consistent

---

### 4. View My Projects ✅

**Test Steps:**
1. Click "My Projects" in sidebar
2. You should see only your owned projects
3. Click on one of your projects
4. You should see the detail page with "Owner" badge

**Expected Results:**
- ✅ Only your projects shown
- ✅ Empty state if no projects
- ✅ Create project CTA visible

---

### 5. Request Access to a Project ✅

**Important:** You need a second GitHub account or ask someone else to test this, OR you can test with another project if available.

**Test Steps (as non-owner):**
1. Go to "Projects" page
2. Click on a project you don't own
3. You should see "Request Access" button
4. Click "Request Access"
5. Fill in the modal:
   - Why you want to join: "I'm experienced with React and would love to contribute"
   - How you can contribute: "I can help with frontend development and UI/UX"
6. Click "Submit Request"
7. Go to "Requests" page → "Sent" tab
8. You should see your request with "Pending" status

**Expected Results:**
- ✅ Request modal opens
- ✅ Form validation works
- ✅ Request submitted successfully
- ✅ Shows in "Sent" requests
- ✅ Status badge shows "Pending"

**Check Console:**
- Should see: "Access request created successfully"

---

### 6. Approve/Reject Access Request ✅

**Test Steps (as project owner):**
1. Go to "Requests" page
2. Click "Received" tab
3. You should see incoming requests for your projects
4. Review the request details (reason, suggestion)
5. Click "Approve" button
6. Request status should change to "Approved"
7. Go to the project detail page
8. Check Team Members - the requester should now be listed as CONTRIBUTOR

**Alternative: Reject**
- Click "Reject" instead of "Approve"
- Status changes to "Rejected"
- User does NOT become a member

**Expected Results:**
- ✅ Received requests displayed
- ✅ Approve button works
- ✅ Status updates to "Approved"
- ✅ User automatically added as CONTRIBUTOR
- ✅ Activity log shows "New member joined"
- ✅ Reject button works and doesn't create membership

**Check Console:**
- Should see: "Request approved successfully" or "Request rejected"

---

### 7. Duplicate Request Prevention ✅

**Test Steps:**
1. Request access to a project
2. Try to request access again to the same project
3. You should get an error

**Expected Results:**
- ✅ Error message: "You already have a pending request for this project"
- ✅ Cannot create duplicate requests

---

### 8. View Profile ✅

**Test Steps:**
1. Click "Profile" in sidebar
2. You should see:
   - Your avatar (from GitHub)
   - Your username and email
   - GitHub profile link
   - Join date
   - Statistics (owned projects count, memberships count)
   - List of owned projects
   - List of projects you're contributing to

**Expected Results:**
- ✅ Profile information displays correctly
- ✅ GitHub link opens in new tab
- ✅ Statistics match actual data
- ✅ Project lists display correctly

---

### 9. UI/UX Testing ✅

**Test the Layout:**
1. Check that you see three columns:
   - Left: Fixed sidebar (256px) with navigation
   - Center: Main content area
   - Right: Fixed right sidebar (320px) with trending data
2. Check the top bar:
   - Search input
   - Notification bell (with red badge)
   - Messages icon (with count badge "3")
   - User profile with avatar and username

**Test Dark Theme:**
- All pages should have dark background (gray-950)
- Cards should be gray-900 with gray-800 borders
- Text should be white or gray-400
- Buttons should have indigo/purple colors
- Hover states should work

**Test Responsiveness:**
- Resize browser window
- Check that layout adapts
- Sidebar should collapse on mobile (if implemented)

**Expected Results:**
- ✅ Three-column layout visible
- ✅ Top bar with all elements
- ✅ Right sidebar shows trending projects, contributors, stats
- ✅ Consistent dark theme across all pages
- ✅ Smooth animations and transitions

---

### 10. Search and Filters ✅

**Test Search:**
1. Go to "Projects" page
2. Type in search box
3. Results should filter in real-time

**Test Owner Filter:**
1. Type a username in owner filter
2. Only projects by that owner should show

**Expected Results:**
- ✅ Search works instantly
- ✅ Filter works correctly
- ✅ Empty state shows if no matches

---

### 11. Activity Tracking ✅

**Test Activity Logs:**
1. Create a project → Check activity log shows "Project created"
2. Approve a request → Check activity log shows "New member joined"
3. Go to project detail page
4. Check "Recent Activity" section in right column

**Expected Results:**
- ✅ Activities logged automatically
- ✅ Activities display with timestamps
- ✅ Activities show relative time (e.g., "2 minutes ago")

---

### 12. Statistics ✅

**Test Platform Stats:**
1. Check dashboard stats cards
2. Check right sidebar stats
3. Numbers should be accurate

**Expected Results:**
- ✅ Total users count
- ✅ Total projects count
- ✅ Access requests count (with pending count)
- ✅ Activities count
- ✅ Memberships count

---

### 13. Navigation ✅

**Test All Links:**
1. Click each sidebar link (Dashboard, Projects, My Projects, Requests, Profile)
2. All should navigate correctly
3. Active link should be highlighted

**Test External Links:**
1. On project detail page, click "Visit Live Site"
2. Should open in new tab
3. Click GitHub repo link (if public)
4. Should open in new tab

**Expected Results:**
- ✅ All internal navigation works
- ✅ Active states show correctly
- ✅ External links open in new tabs

---

### 14. Error Handling ✅

**Test Form Validation:**
1. Try to create project with empty fields → Should show validation
2. Try to submit access request with empty fields → Should show validation

**Test Authorization:**
1. Try to approve request for project you don't own → Should fail
2. Try to edit/delete project you don't own → Should fail

**Test Edge Cases:**
1. Navigate to non-existent project ID
2. Should show error message

**Expected Results:**
- ✅ Form validation prevents submission
- ✅ Authorization errors handled
- ✅ 404 errors handled gracefully

---

### 15. Logout ✅

**Test Steps:**
1. Click logout button (in sidebar footer)
2. Should be logged out
3. Cookie should be cleared
4. Should redirect to landing page

**Expected Results:**
- ✅ Successfully logged out
- ✅ Cookie removed from browser
- ✅ Redirected to landing page
- ✅ Cannot access protected pages

---

## Console Logging

Throughout testing, check the browser console. You should see:
- API responses logged
- User data logged
- Project data logged
- Request status updates
- Error messages (if any)

## Common Issues & Solutions

### Issue: OAuth fails
**Solution:** 
- Check GitHub OAuth app settings
- Ensure callback URL is correct: `http://localhost:5000/api/auth/github/callback`
- Check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env

### Issue: 404 on API calls
**Solution:**
- Ensure backend is running on port 5000
- Check NEXT_PUBLIC_API_URL in frontend/.env.local

### Issue: Cookie not set
**Solution:**
- Check CORS configuration in backend
- Ensure `withCredentials: true` in frontend API client
- Check cookie settings in browser

### Issue: Database errors
**Solution:**
- Run migrations: `npx prisma migrate dev`
- Check DATABASE_URL in backend/.env
- Ensure PostgreSQL is running

## Test Completion Checklist

- [ ] GitHub OAuth login works
- [ ] Create project works
- [ ] View all projects works
- [ ] View my projects works
- [ ] Request access works
- [ ] Approve request works (creates membership)
- [ ] Reject request works
- [ ] Duplicate request prevention works
- [ ] Profile page displays correctly
- [ ] Activity logs work
- [ ] Statistics are accurate
- [ ] Three-column layout displays correctly
- [ ] Top bar with search/notifications shows
- [ ] Right sidebar with trending data shows
- [ ] Dark theme consistent across all pages
- [ ] Navigation works (all links)
- [ ] Search and filters work
- [ ] External links open in new tabs
- [ ] Form validation works
- [ ] Authorization checks work
- [ ] Error handling works
- [ ] Logout works

## Performance Testing

### Check Load Times:
- Dashboard should load in < 2 seconds
- Project listings should load in < 1 second
- Search should be instant (< 100ms)
- Navigation should be instant

### Check for Memory Leaks:
- Open DevTools → Performance
- Record while navigating between pages
- Check memory usage doesn't continuously increase

## Security Testing

### Check Cookies:
- JWT should be in HTTP-only cookie
- Cannot access via JavaScript: `document.cookie`
- Cookie should have `sameSite: lax`

### Check Authorization:
- Cannot approve requests for others' projects
- Cannot edit others' projects
- Cannot delete others' projects
- API returns 403 for unauthorized actions

## Browser Compatibility

Test in:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

## Ready for Production?

After completing all tests:
- ✅ All features work as expected
- ✅ No console errors
- ✅ UI looks good and matches Figma
- ✅ Performance is acceptable
- ✅ Security checks pass

**If YES → Proceed with deployment**
**If NO → Document issues and fix them**

---

## Next Steps After Testing

1. Fix any bugs found during testing
2. Add any missing features from requirements
3. Optimize performance if needed
4. Set up production environment
5. Deploy to production
6. Monitor for issues
7. Gather user feedback
