# 🚨 Quick Fix for Deployment Issues

## Immediate Actions to Fix Login Issue

### 1️⃣ Fix Vercel Environment Variables

**Go to Vercel Dashboard:**
1. Open https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add or update these variables:

```env
VITE_API_BASE_URL=https://YOUR-BACKEND-NAME.onrender.com/api
```

**⚠️ Replace `YOUR-BACKEND-NAME` with your actual Render backend URL**

5. Click **Save**
6. Go to **Deployments** tab
7. Click on the latest deployment → **"..."** menu → **"Redeploy"**

---

### 2️⃣ Fix Render CORS Configuration

**Go to Render Dashboard:**
1. Open https://dashboard.render.com/
2. Click on your backend service
3. Go to **Environment** tab
4. Add this variable:

```env
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

**⚠️ Replace `your-app.vercel.app` with your actual Vercel domain**

If you have multiple domains (e.g., custom domain), use comma-separated:
```env
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com
```

5. Click **Save Changes**
6. Backend will automatically redeploy (takes 2-5 minutes)

---

### 3️⃣ Verify Backend is Running

1. Open your browser
2. Go to: `https://YOUR-BACKEND-NAME.onrender.com/api/auth/login`
3. You should see an error message (NOT a "Cannot GET" or blank page)
   - ✅ Good: `{"message": "..."}` or `401 Unauthorized`
   - ❌ Bad: Blank page, "Cannot GET", or connection refused

---

### 4️⃣ Test the Diagnostic Tool

1. Open the diagnostic tool we created:
   - If running locally: Open `Campfront/check-deployment.html` in browser
   - Or create a test at https://your-app.vercel.app

2. Enter your backend URL
3. Click "Run Diagnostic Tests"
4. Fix any issues shown in red ❌

---

## Common Issues & Instant Fixes

### Issue: "Network Error" when trying to login

**Cause**: Frontend can't reach backend

**Fix**:
1. Check Vercel env vars have correct backend URL
2. Check backend is running on Render
3. Open browser console (F12) and look for CORS errors

---

### Issue: CORS Error in Browser Console

**Error looks like**:
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Fix**:
1. Add your Vercel domain to `CORS_ALLOWED_ORIGINS` in Render
2. Make sure the domain matches exactly (including https://)
3. Redeploy backend

---

### Issue: "Failed to fetch" or connection timeout

**Cause**: Backend is not responding or wrong URL

**Fix**:
1. Check backend logs in Render dashboard
2. Verify backend URL in Vercel env vars
3. Try accessing backend directly in browser

---

### Issue: 401 immediately after login

**Cause**: Token not being saved or sent

**Fix**:
1. Check browser localStorage (F12 → Application → Local Storage)
2. Should see `token` after login
3. Check network requests have Authorization header

---

## Quick Checklist ✅

Before deployment works, verify all these:

- [ ] Backend is deployed and running on Render
- [ ] Database is connected (check Render logs)
- [ ] `VITE_API_BASE_URL` is set in Vercel (NOT localhost)
- [ ] `CORS_ALLOWED_ORIGINS` includes your Vercel domain in Render
- [ ] Backend URL ends with `/api` in Vercel env var
- [ ] Both frontend and backend redeployed after changes
- [ ] Can access backend URL directly in browser
- [ ] No CORS errors in browser console (F12)

---

## Step-by-Step First Time Setup

### On Render (Backend):

1. Deploy PostgreSQL database
2. Deploy Spring Boot backend
3. Set these environment variables:
   ```
   DB_URL=<from database>
   DB_USERNAME=<from database>
   DB_PASSWORD=<from database>
   JWT_SECRET=<generate random 256-bit string>
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
4. Wait for deployment
5. Copy backend URL: `https://your-backend.onrender.com`

### On Vercel (Frontend):

1. Connect GitHub repository
2. Set Root Directory to `Campfront`
3. Set environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com/api
   ```
4. Deploy
5. Copy Vercel URL: `https://your-app.vercel.app`

### Update Backend CORS:

1. Go back to Render
2. Add Vercel URL to `CORS_ALLOWED_ORIGINS`
3. Save and redeploy

### Test:

1. Visit your Vercel URL
2. Try to register a new account
3. Try to login

---

## Debugging Commands

### Test Backend from Terminal:

```bash
# Test if backend is reachable
curl https://your-backend.onrender.com/api/auth/login

# Test registration
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@test.com","password":"Test123!","phoneNumber":"+250788000000","organizationUnitId":1}'
```

### Check Environment Variables:

**Vercel:**
```bash
vercel env ls
```

**Render:**
- Go to Dashboard → Your Service → Environment

---

## Still Not Working?

### Check These Logs:

1. **Render Backend Logs:**
   - Render Dashboard → Your Service → Logs
   - Look for errors or startup failures

2. **Vercel Deployment Logs:**
   - Vercel Dashboard → Your Project → Deployments → Latest → View Build Logs

3. **Browser Console:**
   - Open your app → Press F12 → Console tab
   - Look for red errors

### Get Your URLs:

**Backend URL** (from Render):
```
https://YOUR-SERVICE-NAME.onrender.com
```

**Frontend URL** (from Vercel):
```
https://YOUR-PROJECT-NAME.vercel.app
```

Make sure:
- Backend URL does NOT end with `/api` in Render
- Frontend env var DOES end with `/api`

---

## Need Help?

Check the full deployment guide: `DEPLOYMENT_GUIDE.md`

1. Review environment variables match the guide
2. Check backend logs for database connection issues
3. Verify CORS is configured for your exact domain
4. Test API endpoints directly using curl or Postman

---

**Last Updated**: November 2026
