# CampCoordAI Deployment Guide

## Overview
This guide will help you deploy your CampCoordAI application with the backend on Render and frontend on Vercel.

---

## 🚀 Backend Deployment (Render)

### Prerequisites
- Render account
- PostgreSQL database (can be created on Render)

### Step 1: Deploy PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Fill in the details:
   - **Name**: `campcoordai-db`
   - **Database**: `camp`
   - **User**: `camp_user` (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Free or Paid (Free has 90 days limit)
4. Click "Create Database"
5. **Save these credentials** from the database dashboard:
   - Internal Database URL
   - External Database URL
   - Username
   - Password

### Step 2: Deploy Spring Boot Backend

1. In Render Dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select the repository containing your backend code
4. Configure the service:
   - **Name**: `campcoordai-backend`
   - **Region**: Same as database
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: Leave blank (or path to backend if in monorepo)
   - **Runtime**: Java
   - **Build Command**: `./mvnw clean package -DskipTests` or `mvn clean package -DskipTests`
   - **Start Command**: `java -jar target/Camp-0.0.1-SNAPSHOT.jar`

5. **Environment Variables** - Add these in Render:

```env
# Database Configuration (from Step 1)
DB_URL=jdbc:postgresql://<your-db-host>/<database-name>
DB_USERNAME=<your-db-username>
DB_PASSWORD=<your-db-password>

# Server Configuration
SERVER_PORT=8080

# JWT Configuration (CHANGE THIS SECRET!)
JWT_SECRET=YourVerySecureRandomSecretKeyForProductionAtLeast256Bits
JWT_EXPIRATION=86400000

# CORS Configuration - Add your Vercel domain
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com

# AI Configuration (Optional)
AI_API_KEY=your-openai-api-key-if-using-ai-features
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini

# Scheduler Configuration
UPCOMING_EVENTS_CRON=0 0 5 * * ?
UPCOMING_EVENTS_ENABLED=true
```

6. Click "Create Web Service"
7. Wait for deployment to complete (may take 5-10 minutes)
8. **Copy your backend URL**: `https://campcoordai-backend.onrender.com`

### Step 3: Verify Backend Deployment

1. Visit: `https://your-backend.onrender.com/api/auth/login` (should return 401 or 400, not 404)
2. Check logs in Render dashboard for any errors
3. Test database connection in logs

---

## 🌐 Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- Backend URL from Step 2

### Step 1: Prepare Frontend

1. Update your local `.env` file for testing:
```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api
VITE_APP_NAME=CampCoordAI
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
```

2. Test locally:
```bash
cd Campfront
npm install
npm run build
npm run preview
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from the Campfront directory:
```bash
cd Campfront
vercel
```

4. Follow the prompts:
   - Link to existing project? **No**
   - Project name? **campcoordai**
   - Directory? **./** (current directory)
   - Override settings? **No**

5. Set environment variables:
```bash
vercel env add VITE_API_BASE_URL
# Enter: https://your-backend.onrender.com/api

vercel env add VITE_APP_NAME
# Enter: CampCoordAI

vercel env add VITE_NODE_ENV
# Enter: production
```

6. Deploy to production:
```bash
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `Campfront`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

5. **Environment Variables** - Add these:
```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api
VITE_APP_NAME=CampCoordAI
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
```

6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. **Copy your frontend URL**: `https://your-app.vercel.app`

### Step 3: Update Backend CORS

1. Go back to Render dashboard
2. Navigate to your backend service
3. Update the `CORS_ALLOWED_ORIGINS` environment variable:
```env
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

4. Click "Save Changes"
5. Backend will auto-redeploy

---

## ✅ Verification & Testing

### Test Backend

1. **Health Check**:
```bash
curl https://your-backend.onrender.com/api/auth/login
```
Should return 400 or 401 (means it's working)

2. **Test Registration** (replace with your backend URL):
```bash
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Test123!",
    "phoneNumber": "+250788000000",
    "organizationUnitId": 1
  }'
```

### Test Frontend

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Check browser console (F12) for errors
3. Try to register a new account
4. Try to login

### Common Issues & Solutions

#### Issue: "Network Error" on Frontend

**Cause**: Backend URL not set or CORS issue

**Solution**:
1. Check Vercel environment variables are set correctly
2. Verify backend CORS includes your Vercel domain
3. Check browser console for exact error

#### Issue: "401 Unauthorized" immediately after login

**Cause**: JWT token not being saved or sent

**Solution**:
1. Check browser localStorage has the token
2. Verify API requests include Authorization header
3. Check backend JWT_SECRET is set

#### Issue: Render backend keeps sleeping (Free tier)

**Cause**: Render free tier sleeps after 15 min inactivity

**Solution**:
1. Upgrade to paid plan ($7/month)
2. Or use a cron job to ping your backend every 10 minutes

#### Issue: Database connection timeout

**Cause**: Database URL incorrect or database sleeping

**Solution**:
1. Verify DB_URL in Render environment variables
2. Use Internal Database URL (faster)
3. Check database is running in Render dashboard

#### Issue: Vercel deployment succeeds but shows blank page

**Cause**: Environment variables not set or API calls failing

**Solution**:
1. Check Vercel deployment logs
2. Verify VITE_API_BASE_URL is set
3. Check browser console for errors
4. Ensure backend is accessible

---

## 🔒 Security Checklist

Before going to production:

- [ ] Change JWT_SECRET to a strong random string (at least 256 bits)
- [ ] Set strong database password
- [ ] Update CORS to only allow your domain (remove wildcards)
- [ ] Enable HTTPS (both Render and Vercel do this automatically)
- [ ] Set up database backups (Render has daily backups)
- [ ] Configure rate limiting on backend
- [ ] Review and secure all environment variables
- [ ] Test all authentication flows
- [ ] Test file uploads with production limits

---

## 📊 Monitoring & Maintenance

### Render Monitoring

1. Check logs: Render Dashboard → Your Service → Logs
2. Monitor metrics: CPU, Memory, Request count
3. Set up alerts for service downtime

### Vercel Monitoring

1. Check deployment logs: Vercel Dashboard → Project → Deployments
2. Monitor analytics: Vercel Analytics (if enabled)
3. Check function logs for errors

### Database Maintenance

1. Monitor connection pool usage
2. Set up automatic backups
3. Monitor disk usage
4. Plan for scaling when needed

---

## 🚀 Quick Deployment Commands

### Push Updates to Production

**Backend** (auto-deploys when you push to GitHub):
```bash
git add .
git commit -m "Update backend"
git push origin main
```

**Frontend** (auto-deploys when you push to GitHub):
```bash
cd Campfront
git add .
git commit -m "Update frontend"
git push origin main
```

Or using Vercel CLI for immediate deployment:
```bash
cd Campfront
vercel --prod
```

---

## 📝 Environment Variables Reference

### Backend (Render)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DB_URL` | Yes | `jdbc:postgresql://host/db` | PostgreSQL connection URL |
| `DB_USERNAME` | Yes | `camp_user` | Database username |
| `DB_PASSWORD` | Yes | `secure_password` | Database password |
| `SERVER_PORT` | No | `8080` | Server port (default: 8080) |
| `JWT_SECRET` | Yes | `your-256-bit-secret` | JWT signing secret |
| `JWT_EXPIRATION` | No | `86400000` | Token expiry (24h in ms) |
| `CORS_ALLOWED_ORIGINS` | Yes | `https://app.vercel.app` | Allowed frontend URLs |
| `AI_API_KEY` | No | `sk-...` | OpenAI API key |

### Frontend (Vercel)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | `https://backend.onrender.com/api` | Backend API URL |
| `VITE_APP_NAME` | No | `CampCoordAI` | Application name |
| `VITE_NODE_ENV` | No | `production` | Environment |

---

## 🆘 Getting Help

If you encounter issues:

1. Check Render logs for backend errors
2. Check Vercel deployment logs
3. Check browser console (F12) for frontend errors
4. Verify all environment variables are set correctly
5. Test API endpoints directly using curl or Postman

### Useful URLs

- **Backend API Docs**: `https://your-backend.onrender.com/swagger-ui.html` (if configured)
- **Render Status**: https://status.render.com/
- **Vercel Status**: https://www.vercel-status.com/

---

## 🎉 Success!

Once everything is deployed and working:

1. ✅ Backend is live on Render
2. ✅ Database is connected and seeded
3. ✅ Frontend is live on Vercel
4. ✅ CORS is configured correctly
5. ✅ You can register and login
6. ✅ All features work as expected

You're now running CampCoordAI in production! 🚀

---

**Last Updated**: November 2026  
**Version**: 1.0.0
