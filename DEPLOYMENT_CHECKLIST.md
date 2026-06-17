# DevMitra Deployment Checklist

## ✅ Current Status

### Backend (Complete)
- [x] 30+ RESTful API endpoints
- [x] GitHub OAuth authentication
- [x] JWT with HTTP-only cookies
- [x] Full project CRUD
- [x] Access request workflow
- [x] Member management
- [x] Activity logging system
- [x] Search, filter, pagination
- [x] Rate limiting
- [x] Error handling
- [x] CORS configured

### Frontend (Complete)
- [x] Homepage with platform stats
- [x] Project listing with search/filter
- [x] Project detail page
- [x] Create project form
- [x] My Projects page
- [x] Requests management (sent/received)
- [x] Approve/reject workflow
- [x] User profile page
- [x] Responsive design
- [x] Console logging for debugging
- [x] Authentication flow

### Database (Complete)
- [x] User model with GitHub integration
- [x] Project model with tags
- [x] ProjectMember with roles
- [x] ProjectAccessRequest with status
- [x] ActivityLog for tracking
- [x] All migrations applied

---

## 🧪 Testing Status

Before deployment, verify all features work:

### Core Features to Test
- [ ] Homepage loads with stats
- [ ] GitHub login works
- [ ] Create project works
- [ ] View project details
- [ ] Request access (using second account)
- [ ] Approve/reject requests
- [ ] Member added after approval
- [ ] Activity logs work
- [ ] Search projects works
- [ ] Filter by owner works
- [ ] My Projects page shows correct data
- [ ] Profile page displays correctly
- [ ] Logout works

### Browser Console Checks
- [ ] All API calls return 200/201 status
- [ ] Data is logged correctly
- [ ] No CORS errors
- [ ] Cookies are set properly
- [ ] No authentication errors

---

## 📝 Pre-Deployment Configuration

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/devmitra"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"
PORT=5000
NODE_ENV=production
```

**Frontend (.env.local → .env.production):**
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

### GitHub OAuth App Settings

**For Production:**
1. Create a NEW GitHub OAuth App (or update existing)
2. **Homepage URL:** https://your-frontend-domain.com
3. **Authorization callback URL:** https://your-backend-domain.com/auth/github/callback
4. Update backend authController.js redirect URL

---

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend + DB)

**Backend & Database on Railway:**
1. Push code to GitHub
2. Create Railway account
3. New Project → Deploy from GitHub
4. Add PostgreSQL service
5. Set environment variables in Railway
6. Deploy backend service
7. Note the backend URL

**Frontend on Vercel:**
1. Push code to GitHub
2. Import project to Vercel
3. Set `NEXT_PUBLIC_API_URL` to Railway backend URL
4. Deploy

**Update Backend CORS:**
```javascript
app.use(cors({
  origin: "https://your-vercel-domain.vercel.app",
  credentials: true,
}));
```

**Update Backend Redirect:**
```javascript
res.redirect("https://your-vercel-domain.vercel.app");
```

---

### Option 2: Render (All-in-One)

**Database:**
1. Create PostgreSQL instance on Render
2. Copy connection string

**Backend:**
1. Create Web Service
2. Connect GitHub repo
3. Root directory: `backend`
4. Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
5. Start command: `npm start`
6. Add environment variables

**Frontend:**
1. Create Static Site
2. Connect GitHub repo
3. Root directory: `frontend`
4. Build command: `npm install && npm run build`
5. Publish directory: `out` (if using static export)
6. Add environment variables

---

### Option 3: Self-Hosted (VPS)

**Requirements:**
- Ubuntu 20.04+ VPS
- Domain name
- SSL certificate (Let's Encrypt)

**Backend Setup:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Clone repo
git clone https://github.com/yourusername/DevMitra.git
cd DevMitra/backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with production values

# Run migrations
npx prisma migrate deploy

# Install PM2
npm install -g pm2

# Start backend
pm2 start npm --name "devmitra-backend" -- start
pm2 save
pm2 startup
```

**Frontend Setup:**
```bash
cd ../frontend
npm install
npm run build

# Serve with nginx or use PM2
pm2 start npm --name "devmitra-frontend" -- start
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Change JWT_SECRET to a strong random value
- [ ] Update CORS origin to production domain
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS only
- [ ] Set secure cookie flags in production
- [ ] Review rate limits (may need adjustment for production)
- [ ] Add logging service (e.g., LogRocket, Sentry)
- [ ] Set up database backups
- [ ] Add monitoring (e.g., UptimeRobot)
- [ ] Review GitHub OAuth app settings
- [ ] Test with production URLs

### Production Cookie Settings
```javascript
res.cookie("token", token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: "none", // Cross-domain if needed
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

---

## 📊 Monitoring Setup

### What to Monitor
- API response times
- Error rates
- Database connection pool
- Memory usage
- CPU usage
- Active users
- Request volume

### Recommended Tools
- **Uptime:** UptimeRobot, Pingdom
- **Errors:** Sentry, LogRocket
- **Analytics:** Google Analytics, Plausible
- **Performance:** Vercel Analytics, Railway Metrics

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example

**.github/workflows/deploy.yml:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          # Railway deployment commands

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          # Vercel deployment commands
```

---

## 📋 Post-Deployment Tasks

After deployment:

1. **Test Production:**
   - [ ] Visit production URL
   - [ ] Test GitHub login
   - [ ] Create a test project
   - [ ] Test all major features

2. **Update Documentation:**
   - [ ] Update README with production URLs
   - [ ] Document any deployment-specific changes
   - [ ] Add deployment date to CHANGELOG

3. **Set Up Monitoring:**
   - [ ] Configure uptime monitoring
   - [ ] Set up error tracking
   - [ ] Enable analytics

4. **Backup Strategy:**
   - [ ] Configure daily database backups
   - [ ] Test restore process
   - [ ] Document backup locations

5. **Communication:**
   - [ ] Share production URL with team
   - [ ] Update GitHub repo description
   - [ ] Add live demo link to README

---

## 🆘 Rollback Plan

If something goes wrong:

1. **Immediate Issues:**
   - Revert to previous GitHub commit
   - Redeploy previous version
   - Check error logs

2. **Database Issues:**
   - Restore from backup
   - Roll back migrations if needed
   - Verify data integrity

3. **Authentication Issues:**
   - Verify GitHub OAuth callback URL
   - Check environment variables
   - Clear cookies and test again

---

## 📈 Future Enhancements

After successful deployment, consider:

- [ ] Email notifications for access requests
- [ ] Real-time updates with WebSockets
- [ ] Project activity feed
- [ ] User notifications center
- [ ] Project categories/tags filtering
- [ ] Advanced search with Elasticsearch
- [ ] GitHub integration (sync repos, commits)
- [ ] Team chat/discussions
- [ ] Task management
- [ ] Code review features
- [ ] Analytics dashboard
- [ ] Admin panel

---

## 📞 Support

**Documentation:**
- [API Documentation](./API_DOCUMENTATION.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [README](./README.md)

**Helpful Resources:**
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs
- Express Docs: https://expressjs.com
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs

---

## ✅ Ready to Deploy?

Once all items above are checked and tested locally, you're ready to deploy to production!

**Recommended First Deployment:**
1. Deploy database (Railway PostgreSQL)
2. Deploy backend (Railway Web Service)
3. Test backend endpoints
4. Deploy frontend (Vercel)
5. Test full application flow
6. Monitor for 24 hours
7. Announce to users!

---

**Last Updated:** 2026-06-17  
**Version:** 1.0.0  
**Status:** Ready for Production
