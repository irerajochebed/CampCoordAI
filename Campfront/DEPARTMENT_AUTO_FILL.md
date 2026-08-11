# Department Auto-Fill Feature - Proposal Form

## ✅ Implementation Summary

Department Leaders should **NOT** manually select a department. The department is **automatically determined** based on which department they lead.

---

## 🔄 How It Works

### **Database Relationship**
```java
@Entity
class Department {
    @ManyToOne
    private User leader;  // The Department Leader
    
    // Other fields...
}
```

### **Frontend Logic**
```javascript
// 1. Fetch all departments
const departments = await departmentApi.getAll();

// 2. Find the department where current user is the leader
const myDepartment = departments.find(
    dept => dept.leader?.id === user.userId
);

// 3. Auto-fill the department field
setFormData({ ...formData, departmentId: myDepartment.id });
```

---

## 🎨 UI Implementation

### **Read-Only Department Field**

```jsx
<div>
  <label>Department *</label>
  <input
    type="text"
    value={userDepartment?.name || 'Loading department...'}
    disabled
    className="bg-gray-50 cursor-not-allowed"
  />
  <p className="text-xs text-gray-500 mt-1">
    This is automatically set based on the department you lead
  </p>
</div>
```

**Visual Appearance:**
- Grayed out background (`bg-gray-50`)
- Cursor shows "not-allowed" icon
- Helper text explains it's auto-filled
- Cannot be clicked or edited

---

## ✅ Benefits

### **1. Data Integrity**
- Department Leaders can only create proposals for their own department
- Prevents unauthorized proposals
- Ensures department accountability

### **2. User Experience**
- No confusion about which department to select
- One less field to fill
- Clear indication of their department

### **3. Business Logic**
- Matches organizational structure
- Enforces proper workflow
- Maintains hierarchical control

---

## 🔒 Security & Validation

### **Frontend Validation**
```javascript
if (!formData.departmentId) {
  errors.departmentId = 'You must be assigned as a department leader.';
}
```

### **User Not Assigned Check**
```javascript
if (!myDepartment) {
  setAlert({
    type: 'warning',
    message: 'You are not assigned as a leader of any department. ' +
             'Please contact the administrator.'
  });
}
```

### **Backend Validation** (Recommended)
```java
@PreAuthorize("hasRole('COORDINATOR')")
public ProposalResponse createProposal(ProposalRequest request) {
    // Verify user is actually the leader of the specified department
    Department dept = departmentRepository.findById(request.getDepartmentId());
    
    if (!dept.getLeader().getId().equals(currentUser.getId())) {
        throw new UnauthorizedException(
            "You can only create proposals for departments you lead"
        );
    }
    
    // Continue with proposal creation...
}
```

---

## 📋 Scenarios

### **Scenario 1: Normal Department Leader**

**Setup:**
- User: John Doe
- Position: DEPARTMENT_LEADER
- Assigned Department: Youth Ministries (leader_id = John's ID)

**Flow:**
1. John clicks "Create New Proposal"
2. Form loads
3. System queries all departments
4. Finds Youth Ministries where `leader.id === John.userId`
5. Auto-fills: "Youth Ministries"
6. Field is disabled/read-only
7. John fills other fields
8. Submits proposal for Youth Ministries

---

### **Scenario 2: User Not Assigned as Leader**

**Setup:**
- User: Jane Smith
- Position: DEPARTMENT_LEADER
- No department has `leader_id === Jane's ID`

**Flow:**
1. Jane clicks "Create New Proposal"
2. Form loads
3. System queries all departments
4. **No department found** where Jane is leader
5. Warning alert shown: "You are not assigned as a leader of any department"
6. Department field shows: "Loading department..." or empty
7. Cannot submit form (validation fails)
8. Jane must contact administrator

---

### **Scenario 3: Multiple Departments (Edge Case)**

**Setup:**
- User: Bob Johnson
- Assigned as leader of multiple departments (shouldn't happen but...)

**Current Behavior:**
- Uses `find()` → Returns first match only

**Recommended Fix:**
```javascript
const myDepartments = departments.filter(
    dept => dept.leader?.id === user.userId
);

if (myDepartments.length > 1) {
    // Show dropdown to select which department
    // Or show warning and contact admin
}
```

---

## 🎯 Form Behavior

### **On Load (New Proposal)**
```
1. Component mounts
2. fetchUserDepartment() called
3. GET /api/departments
4. Filter departments by leader
5. Set formData.departmentId
6. Display department.name (read-only)
```

### **On Load (Edit Proposal)**
```
1. Component mounts
2. fetchUserDepartment() called (for display)
3. fetchProposal(id) called
4. Populate all fields including departmentId
5. Department field shows proposal.department.name
6. Still read-only (cannot change department of existing proposal)
```

### **On Submit**
```
1. validate() checks departmentId exists
2. If not: Error shown
3. If yes: Submit with auto-filled departmentId
4. Backend receives departmentId in request
5. Backend verifies user is leader
6. Proposal created
```

---

## 🚫 What Department Leaders CANNOT Do

- ❌ Select a different department
- ❌ Create proposals for other departments
- ❌ Change department after submission
- ❌ Create proposals without being assigned as leader

---

## ✅ What Department Leaders CAN Do

- ✅ See their department automatically filled
- ✅ Create proposals only for their department
- ✅ Edit their DRAFT proposals (department stays same)
- ✅ Submit proposals for review

---

## 🔧 API Integration

### **Fetch Departments**
```javascript
GET /api/departments

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Youth Ministries",
      "type": "YOUTH_MINISTRIES",
      "leader": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    // ... more departments
  ]
}
```

### **Create Proposal**
```javascript
POST /api/proposals

Request:
{
  "eventName": "Youth Leadership Camp",
  "eventType": "CAMP",
  "departmentId": 1,  // Auto-filled from user's department
  "objectives": "...",
  "startDate": "2026-08-01",
  "endDate": "2026-08-07",
  "venue": "Gisenyi Camp",
  "expectedParticipants": 200,
  "estimatedBudget": 5000000
}
```

---

## 📊 Department Assignment Process

### **How to Assign a User as Department Leader:**

**Option 1: Database Direct**
```sql
UPDATE departments 
SET leader_id = 123 
WHERE id = 1;
```

**Option 2: Admin UI (Recommended)**
- Go to Department Management
- Select Department (e.g., Youth Ministries)
- Click "Assign Leader"
- Search for user
- Select user with COORDINATOR role and DEPARTMENT_LEADER position
- Save

**Option 3: API Endpoint**
```java
PATCH /api/departments/{id}/assign-leader
{
  "leaderId": 123
}
```

---

## 🐛 Troubleshooting

### **Problem: Department field shows "Loading..."**

**Cause:** No department has current user as leader

**Solution:**
1. Check user position: Must be DEPARTMENT_LEADER
2. Check departments table: `leader_id` must match user's ID
3. Assign user as leader of a department

---

### **Problem: Validation fails on submit**

**Cause:** `departmentId` is null or empty

**Solution:**
1. Ensure user is assigned as leader
2. Check network tab: departments API should return data
3. Check browser console for errors
4. Verify `user.userId` matches `department.leader.id`

---

### **Problem: User assigned but wrong department shows**

**Cause:** Multiple departments with same leader

**Solution:**
1. Review department assignments
2. User should lead only ONE department
3. Update database to correct assignment

---

## ✅ Testing Checklist

- [ ] User assigned as leader sees department auto-filled
- [ ] Department field is disabled/read-only
- [ ] Helper text is visible
- [ ] User not assigned sees warning
- [ ] Validation prevents submission without department
- [ ] Edit mode shows correct department
- [ ] Cannot change department in edit mode
- [ ] Backend validates user is actual leader
- [ ] Proposal saves with correct department ID

---

## 📚 Related Documentation

- `PROPOSAL_WORKFLOW.md` - Complete workflow
- `User.java` - User entity
- `Department.java` - Department entity with leader relationship
- `ProposalForm.jsx` - Frontend implementation

---

**Status**: ✅ Implemented  
**Last Updated**: July 12, 2026  
**Version**: 2.1.0
