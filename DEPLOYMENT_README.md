# 🚀 CampCoordAI Deployment - READ THIS FIRST!

## ⚠️ Your Deployment is Currently Broken Because...

Your `.env` file points to `localhost:8080` which doesn't work on Vercel!

---

## 🔧 Quick Fix (5 Minutes)

### Step 1: Get Your Backend URL from Render

1. Go to https://dashboard.render.com/
2. Find your backend service
3. Copy the URL (looks like `https://campcoordai-backend.onrender.com`)

### Step 2: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Click your project → **Settings** → **Environment Variables**
3. Add this variable:

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://YOUR-BACKEND.onrender.com/api` |

**⚠️ IMPORTANT:** Replace `YOUR-BACKEND.onrender.com` with your actual backend URL!

4. Click **Save**
5. Go to **Deployments** → Click latest → **Redeploy**

### Step 3: Update Backend CORS

1. Go back to Render Dashboard
2. Click your backend service → **Environment** tab
3. Add this variable:

| Name | Value |
|------|-------|
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` |

**⚠️ IMPORTANT:** Replace with your actual Vercel URL!

4. Click **Save** (backend will auto-redeploy)

### Step 4: Test!

Wait 2-3 minutes for both to redeploy, then:

1. Visit your Vercel URL
2. Try to login/register
3. It should work! ✅

---

## 📚 Full Documentation

For complete step-by-step deployment:
- **Quick Fix**: See `QUICK_FIX_DEPLOYMENT.md`
- **Complete Guide**: See `DEPLOYMENT_GUIDE.md`
- **Test Tool**: Open `Campfront/check-deployment.html` in browser

---

## 🆘 Still Having Issues?

### Check These First:

1. **Backend is running?**
   - Visit: `https://your-backend.onrender.com/api/auth/login`
   - Should see an error message (not blank page)

2. **Environment variables set?**
   - Vercel: Check Settings → Environment Variables
   - Render: Check Environment tab

3. **CORS error in console?**
   - Press F12 in browser
   - Check Console tab for red errors
   - If you see CORS error, your backend CORS doesn't include your Vercel domain

---

## ✅ What We Fixed

### Backend Changes:

1. **SecurityConfig.java**: Now reads CORS origins from environment variable
2. **application.yml**: Added CORS configuration with env var support
3. Both allow you to set allowed origins via `CORS_ALLOWED_ORIGINS` in Render

### Frontend Changes:

1. Created deployment diagnostic tool (`check-deployment.html`)
2. Added production environment example (`.env.production.example`)
3. Updated `.env.example` with production notes

### Documentation:

1. **DEPLOYMENT_GUIDE.md**: Complete step-by-step guide
2. **QUICK_FIX_DEPLOYMENT.md**: Fast troubleshooting guide
3. **This file**: Quick start instructions

---

## 📋 Required Environment Variables

### Backend (Render):

```env
# Database
DB_URL=<from Render PostgreSQL>
DB_USERNAME=<from Render PostgreSQL>
DB_PASSWORD=<from Render PostgreSQL>

# JWT
JWT_SECRET=<generate strong random string>

# CORS - ADD YOUR VERCEL URL!
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app

# Optional
SERVER_PORT=8080
JWT_EXPIRATION=86400000
```

### Frontend (Vercel):

```env
# Backend URL - MUST END WITH /api
VITE_API_BASE_URL=https://your-backend.onrender.com/api

# App Info
VITE_APP_NAME=CampCoordAI
VITE_NODE_ENV=production
```

---

## 🚀 After Fixing

Once everything is working:

1. Test all features (login, register, dashboard)
2. Check browser console (F12) for errors
3. Monitor Render logs for backend errors
4. Set up custom domain if needed

---

## 💡 Pro Tips

1. **Render Free Tier Sleeps**: Backend goes to sleep after 15 min of inactivity
   - First request after sleep takes ~30 seconds
   - Upgrade to paid ($7/month) for always-on

2. **Update .env.local**: Keep a local `.env.local` with production URLs for testing

3. **Vercel Auto-Deploys**: Every push to `main` triggers Vercel deployment

4. **Render Auto-Deploys**: Every push to `main` triggers Render deployment (if connected to GitHub)

5. **Check Logs Often**: 
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Project → Deployments → Build Logs

---

## 🔐 Security Reminder

Before production:

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Use strong database password
- [ ] Update CORS to only your domains (remove wildcards)
- [ ] Enable database backups
- [ ] Set up monitoring alerts

---

## 📞 Quick Reference

| What | Where |
|------|-------|
| Backend Logs | Render Dashboard → Your Service → Logs |
| Frontend Logs | Vercel Dashboard → Deployments → Build Logs |
| Browser Errors | Press F12 → Console Tab |
| Backend URL | `https://<service-name>.onrender.com` |
| Frontend URL | `https://<project-name>.vercel.app` |
| Test Tool | Open `Campfront/check-deployment.html` |

---

**Need More Help?** 

Read the full guides in this repository or check the logs for specific error messages.

**Last Updated**: November 2026
