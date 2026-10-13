# Environment Configuration Guide

## Overview
DevMitra uses **two separate GitHub OAuth applications**:
- One for **localhost development** (http://localhost:3000)
- One for **production deployment** (https://dev-mitra.vercel.app)

This is necessary because GitHub OAuth apps can only have ONE callback URL per application.

## File Structure

### `.env` - LOCAL DEVELOPMENT (DO NOT COMMIT)
Used when running `npm run dev` locally.
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- GitHub OAuth App: `Ov23liKtNfDv2kXiG3LL` (localhost callback)

### `.env.production` - PRODUCTION REFERENCE (DO NOT COMMIT)
Reference file for your Render/Vercel environment variables.
- Frontend: `https://dev-mitra.vercel.app`
- Backend: `https://devmitra-backend.onrender.com`
- GitHub OAuth App: `Ov23lieBUvcq06Jbgm04` (production callback)

### `.env.example` - PUBLIC TEMPLATE (CAN COMMIT)
Template showing required environment variables (no secrets).

## How It Works

### Local Development
1. Run `npm run dev` in backend directory
2. Backend reads `.env` file
3. Uses localhost GitHub OAuth app (`Ov23liKtNfDv2kXiG3LL`)
4. Redirects to `http://localhost:5000/auth/github/callback`

### Production (Render)
1. Deploy to Render
2. Render uses environment variables from dashboard (NOT from `.env`)
3. Uses production GitHub OAuth app (`Ov23lieBUvcq06Jbgm04`)
4. Redirects to `https://devmitra-backend.onrender.com/auth/github/callback`

## Important Notes

⚠️ **NEVER commit `.env` or `.env.production` files!**
They contain secrets and database credentials.

✅ **For production:** 
Manually set environment variables in your Render dashboard using values from `.env.production`

✅ **For localhost:**
Keep `.env` in your backend folder (already gitignored)

## Switching Between Environments

### Working locally?
Just run `npm run dev` - it will automatically use `.env`

### Deploying to production?
Copy values from `.env.production` to your Render environment variables dashboard

## Troubleshooting

**Problem:** GitHub OAuth redirects to wrong URL
**Solution:** Check which `GITHUB_CLIENT_ID` is being used. Local should use `Ov23liKtNfDv2kXiG3LL`, production should use `Ov23lieBUvcq06Jbgm04`

**Problem:** Database connection error
**Solution:** Verify `DATABASE_URL` is correct in your active environment

**Problem:** "Route /auth/github not found"
**Solution:** Make sure backend server is running and `GITHUB_CALLBACK_URL` points to backend, not frontend
