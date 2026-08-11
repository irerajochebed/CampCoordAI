# Troubleshooting Guide - CampCoordAI Frontend

## 🐛 Common Issues & Solutions

### Issue 1: "An unexpected error occurred" on Proposals Page

**Symptoms:**
- Red error alert at top of page
- Shows "An unexpected error occurred. Please try again later."
- Proposals list is empty

**Possible Causes:**

#### **1. Backend Not Running**
```bash
# Check if backend is running on port 8080
# Open browser and go to: http://localhost:8080/api/proposals

# If you get "connection refused" or "can't reach", backend is not running
```

**Solution:**
```cmd
cd c:\All_Vscode_project\Camp
mvn clean spring-boot:run
```

Wait for: `Started CampApplication in X seconds`

---

#### **2. Database Not Running**
```bash
# Check PostgreSQL status
# Open pgAdmin or connect via psql
```

**Solution:**
```cmd
# Start PostgreSQL service (Windows)
# Search "Services" > Find "postgresql" > Start

# Or via command line
net start postgresql-x64-17
```

---

#### **3. CORS Issues**
**Check backend logs for:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
Check `application.properties`:
```properties
# Ensure this is present
server.port=8080

# CORS should be configured in WebConfig
```

---

#### **4. Wrong API URL**
**Check `.env` file:**
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

**If missing, create `.env` in Campfront directory:**
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

**Then restart frontend:**
```cmd
npm run dev
```

---

### Issue 2: Blank Page When Clicking "Create Proposal"

**Symptoms:**
- Click "Create New Proposal" button
- Page goes completely blank
- No errors visible

**Root Cause:**
Missing import in component causing React to crash

**Solution:**
✅ **Already Fixed** - Added missing `useAuth` import in ProposalForm.jsx

**Verify Fix:**
```javascript
// ProposalForm.jsx should have:
import { useAuth } from '../../contexts/AuthContext';
```

---

### Issue 3: Header/Button Not Visible at Top

**Symptoms:**
- Can't see page title
- "Create New Proposal" button cut off or hidden
- Content appears to be off-screen

**Possible Causes:**

#### **1. CSS/Tailwind Issue**
**Check browser console (F12) for errors:**
```
Failed to load CSS
Tailwind classes not found
```

**Solution:**
```cmd
cd Campfront
npm install
npm run dev
```

---

#### **2. Layout Container Issue**
**Check if content is inside Layout component:**

File: `App.jsx`
```jsx
<Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route path="proposals" element={<ProposalList />} />
</Route>
```

---

#### **3. Z-Index or Overflow Issue**
**Inspect element (F12) and check:**
- `overflow: hidden` on parent
- Negative margins
- Fixed positioning conflicts

**Quick Fix:**
Add to `ProposalList.jsx`:
```jsx
<div className="space-y-6 p-6">
  {/* Content */}
</div>
```

---

### Issue 4: Department Field Shows "Loading..."

**Symptoms:**
- Department field says "Loading department..."
- Never loads actual department name
- Cannot submit form

**Possible Causes:**

#### **1. User Not Assigned as Department Leader**
**Check database:**
```sql
SELECT * FROM departments WHERE leader_id = <user_id>;
```

If no results, user is not assigned to any department.

**Solution:**
```sql
-- Assign user as leader of a department
UPDATE departments 
SET leader_id = <user_id> 
WHERE id = <department_id>;
```

---

#### **2. Backend Endpoint Not Returning Leader Data**
**Test API:**
```bash
curl http://localhost:8080/api/departments
```

**Should return:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Youth Ministries",
      "leader": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

If `leader` is missing or null, check backend DTO mapping.

---

#### **3. Wrong User ID Comparison**
**Check browser console:**
```javascript
console.log('Current user ID:', user.userId);
console.log('Department leaders:', departments.map(d => d.leader?.id));
```

If IDs don't match, check:
- JWT token payload
- User object structure
- AuthContext implementation

---

### Issue 5: Form Submits But No Data Saved

**Symptoms:**
- Form submission succeeds (shows success message)
- But proposal doesn't appear in list
- Or proposal missing department

**Possible Causes:**

#### **1. Department ID Not Being Sent**
**Check network tab (F12 > Network > POST /proposals):**

**Request payload should have:**
```json
{
  "eventName": "Youth Camp",
  "departmentId": 1,  // Must be present!
  "eventType": "CAMP",
  ...
}
```

If `departmentId` is null or missing, check:
```javascript
// ProposalForm.jsx
const payload = {
  ...formData,
  departmentId: parseInt(formData.departmentId), // Must convert to number
};
```

---

#### **2. Backend Validation Failing**
**Check backend logs for:**
```
ConstraintViolationException
Department ID is required
```

**Solution:**
Ensure `departmentId` is:
- Not null
- Valid department exists
- User is actually the leader

---

### Issue 6: "Create New Proposal" Button Not Showing

**Symptoms:**
- Button is missing completely
- Only see search and filters
- User is a Department Leader

**Check:**

#### **1. User Position**
```javascript
console.log('User position:', user?.position);
// Should be: "DEPARTMENT_LEADER"
```

If not, check database:
```sql
SELECT position FROM users WHERE id = <user_id>;
```

**Should be:**
```
DEPARTMENT_LEADER
```

**Fix:**
```sql
UPDATE users 
SET position = 'DEPARTMENT_LEADER' 
WHERE id = <user_id>;
```

---

#### **2. Role Check**
```javascript
console.log('User role:', user?.role);
// Should be: "COORDINATOR"
```

User must have:
- `role: COORDINATOR`
- `position: DEPARTMENT_LEADER`

Both are required!

---

### Issue 7: Backend Compilation Errors

**Symptoms:**
```
BUILD FAILURE
Compilation errors
```

**Solutions:**

#### **1. Lombok Not Working**
```cmd
cd c:\All_Vscode_project\Camp
mvn clean compile
```

If still fails:
```cmd
# Delete target folder
rmdir /s /q target

# Recompile
mvn clean install
```

---

#### **2. Missing Dependencies**
```cmd
mvn dependency:resolve
```

---

#### **3. Java Version Mismatch**
```cmd
java -version
# Should be: Java 17
```

If different:
- Download JDK 17
- Set JAVA_HOME environment variable
- Restart terminal

---

## 🔍 Debugging Checklist

### Frontend Issues:
- [ ] `npm run dev` running without errors?
- [ ] Browser console (F12) shows no errors?
- [ ] Network tab shows successful API calls?
- [ ] `.env` file exists with correct API URL?
- [ ] User object has `userId`, `position`, `role`?

### Backend Issues:
- [ ] `mvn spring-boot:run` started successfully?
- [ ] Logs show "Started CampApplication"?
- [ ] Database connection successful?
- [ ] Port 8080 not in use by another app?
- [ ] CORS configured properly?

### Database Issues:
- [ ] PostgreSQL service running?
- [ ] Database `camp` exists?
- [ ] Tables created (users, departments, proposals)?
- [ ] Sample data exists?
- [ ] Department has leader_id set?

---

## 🛠️ Quick Fixes

### Reset Everything:
```cmd
# Stop everything
# Ctrl+C in both frontend and backend terminals

# Backend
cd c:\All_Vscode_project\Camp
mvn clean
mvn spring-boot:run

# Frontend (new terminal)
cd c:\All_Vscode_project\Camp\Campfront
npm install
npm run dev
```

---

### Clear Browser Cache:
```
1. Press F12
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

---

### Check All Services:
```cmd
# PostgreSQL
net start postgresql-x64-17

# Check if port 8080 is free
netstat -ano | findstr :8080

# Check if port 5174 is free
netstat -ano | findstr :5174
```

---

## 📞 Getting Help

If issues persist:

1. **Check browser console** (F12 > Console)
2. **Check backend logs** (terminal running mvn)
3. **Check network tab** (F12 > Network)
4. **Provide error messages** when asking for help

Include:
- Error message (exact text)
- Stack trace (if available)
- What you were trying to do
- Browser being used
- Screenshots if helpful

---

**Last Updated:** July 12, 2026
