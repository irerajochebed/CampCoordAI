# Proposal Management Workflow - CampCoordAI

## ✅ Correct Implementation According to Specification

### **System Roles & Positions**

#### **1. Three Authentication Roles:**
- **ADMINISTRATOR** - System administration
- **COORDINATOR** - Planning and managing events (with specific positions)
- **PARTICIPANT** - Attending events

#### **2. Coordinator Positions:**
- Union Administrator
- **Department Leader** ← Creates Proposals
- Field Leader
- Pastor / Local Church Leader
- Finance Officer
- Camp Director
- Camp Secretary
- Speaker
- PA Team

---

## 📋 Proposal Workflow (Steps 1-2 from Spec)

### **Step 1: Department Leader Creates Proposal**

**Who:** Department Leader (Coordinator with `position: DEPARTMENT_LEADER`)

**Actions:**
1. Logs into the system
2. Navigates to Proposals
3. Clicks "Create New Proposal"
4. Fills in proposal information:
   - Event name
   - Event type (Camp, Conference, Retreat, etc.)
   - Department (auto-selected based on their department)
   - Objectives
   - Start & End dates
   - Venue
   - Expected participants
   - Estimated budget (in RWF)
   - Required resources

5. Saves as DRAFT
6. Reviews the proposal
7. Clicks "Submit for Review"
8. Proposal status changes to SUBMITTED

**Business Logic:**
- Only users with `role: COORDINATOR` AND `position: DEPARTMENT_LEADER` can create proposals
- Department Leaders can only edit their own DRAFT proposals
- Once submitted, proposals cannot be edited by Department Leaders

---

### **Step 2: Union Administrator Reviews**

**Who:** Union Administrator (Either `role: ADMINISTRATOR` OR Coordinator with `position: UNION_ADMINISTRATOR`)

**Actions:**
1. Receives notification of new proposal
2. Views list of SUBMITTED/UNDER_REVIEW proposals
3. Opens proposal details
4. Reviews all information
5. Makes decision:

   **Option A: APPROVE**
   - Enters approval comments
   - Clicks "Approve"
   - Proposal status → APPROVED
   - **Event is automatically created**
   - Department Leader is notified
   - Department Leader becomes Event Coordinator

   **Option B: REJECT**
   - Enters rejection reasons
   - Clicks "Reject"
   - Proposal status → REJECTED
   - Department Leader is notified
   - Proposal archived

   **Option C: REQUEST REVISION**
   - Enters revision requirements
   - Clicks "Request Revision"
   - Proposal status → NEEDS_REVISION
   - Proposal returns to Department Leader
   - Department Leader can edit and resubmit

**Business Logic:**
- Only Union Administrators can approve/reject/request revision
- Once approved, proposal cannot be changed
- Automatic event creation happens on approval

---

## 🔐 Access Control Matrix

| Action | Department Leader | Union Administrator | Other Coordinators | Participants |
|--------|------------------|---------------------|-------------------|--------------|
| **Create Proposal** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **View Own Proposals** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **View All Proposals** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Edit Draft Proposal** | ✅ Own only | ❌ No | ❌ No | ❌ No |
| **Submit Proposal** | ✅ Own only | ❌ No | ❌ No | ❌ No |
| **Approve Proposal** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Reject Proposal** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Request Revision** | ❌ No | ✅ Yes | ❌ No | ❌ No |

---

## 🎨 UI Implementation

### **For Department Leaders:**
- **Dashboard**: "Create New Proposal" button visible
- **Proposal List**: Shows only their proposals
- **Draft Proposals**: Can Edit and Submit
- **Submitted Proposals**: Read-only, shows status
- **Approved/Rejected**: Read-only with comments

### **For Union Administrators:**
- **Dashboard**: "Review Proposals" section showing pending count
- **Proposal List**: Shows ALL proposals with filters
- **Submitted Proposals**: Shows Approve/Reject/Revision buttons
- **Can see**: All proposal details, creator info, department
- **Cannot**: Create new proposals

### **For Other Coordinators:**
- **Proposal List**: Read-only view of all proposals
- **Purpose**: Transparency and coordination
- **Cannot**: Create, edit, or review proposals

---

## 📊 Proposal Status Flow

```
DRAFT (Department Leader working on it)
  ↓
  [Submit for Review]
  ↓
SUBMITTED (Waiting for Union Admin review)
  ↓
  [Union Admin reviews]
  ↓
  ├─→ APPROVED → Event Created Automatically
  ├─→ REJECTED → Archived
  └─→ NEEDS_REVISION → Back to Department Leader → DRAFT
```

---

## 🔄 After Approval (Step 3 from Spec)

Once proposal is APPROVED:

1. **Event is automatically created** with proposal details
2. **Department Leader becomes Event Coordinator**
3. Event Coordinator can now:
   - Create sessions
   - Build daily program
   - Assign speakers
   - Set registration fees
   - Allocate resources
   - Assign event staff (Camp Director, Secretary, Finance, etc.)

---

## 💡 Key Points

### ✅ Correct Implementation:
- **Department Leaders CREATE** proposals
- **Union Administrators REVIEW** proposals
- **Automatic event creation** on approval
- **Role + Position** based access control
- **Clear separation** of responsibilities

### ❌ Previous Incorrect Assumption:
- ~~Admins create proposals~~ → NO
- ~~All coordinators can create proposals~~ → NO
- ~~Manual event creation~~ → NO (automatic on approval)

---

## 🎯 Frontend Components

### **1. ProposalList.jsx**
- Shows proposals based on user role/position
- "Create" button only for Department Leaders
- Review buttons only for Union Administrators
- Filters and search for all

### **2. ProposalForm.jsx**
- Create/Edit form
- Protected route: Only Department Leaders
- Department auto-selected from user profile
- Validation and error handling

### **3. ProposalDetail.jsx**
- View full proposal details
- Status timeline visualization
- Review actions (for Union Admin)
- Comments history
- Creator information

---

## 🔧 Backend API Endpoints

### Department Leaders:
```
POST   /api/proposals              - Create proposal
GET    /api/proposals/my-proposals - Get own proposals
PUT    /api/proposals/{id}         - Update draft proposal
PATCH  /api/proposals/{id}/submit  - Submit for review
```

### Union Administrators:
```
GET    /api/proposals              - Get all proposals
PATCH  /api/proposals/{id}/approve - Approve (creates event)
PATCH  /api/proposals/{id}/reject  - Reject
PATCH  /api/proposals/{id}/request-revision - Request changes
```

---

## 📱 Notifications

### Department Leader Receives:
- Proposal submitted confirmation
- Proposal approved (with event link)
- Proposal rejected (with reasons)
- Revision requested (with requirements)

### Union Administrator Receives:
- New proposal submitted
- Proposal resubmitted after revision

---

## 🎓 User Scenarios

### **Scenario 1: Youth Camp Proposal**

1. **John Doe** (Youth Ministries Department Leader)
   - Creates proposal for "Youth Leadership Camp 2026"
   - Budget: RWF 5,000,000
   - Expected: 200 participants
   - Submits for review

2. **Mary Smith** (Union Administrator)
   - Receives notification
   - Reviews proposal
   - Approves with comments
   - Event automatically created

3. **John Doe** (now Event Coordinator)
   - Receives approval notification
   - Starts event planning
   - Creates sessions, assigns staff

### **Scenario 2: Revision Request**

1. **Department Leader** submits proposal
2. **Union Admin** reviews
3. **Issues found**: Budget unclear, venue not confirmed
4. **Union Admin** requests revision with specific comments
5. **Department Leader** updates proposal
6. **Department Leader** resubmits
7. **Union Admin** reviews again
8. **Union Admin** approves

---

## ✅ Testing Checklist

### Department Leader Flow:
- [ ] Can create new proposal
- [ ] Can save as draft
- [ ] Can edit draft proposal
- [ ] Can submit proposal for review
- [ ] Cannot edit submitted proposal
- [ ] Can see own proposals only
- [ ] Receives approval notification

### Union Administrator Flow:
- [ ] Can view all proposals
- [ ] Can filter by status
- [ ] Can approve proposal
- [ ] Can reject proposal
- [ ] Can request revision
- [ ] Event created on approval
- [ ] Comments saved properly

### Access Control:
- [ ] Other coordinators cannot create proposals
- [ ] Participants cannot access proposal pages
- [ ] Routes protected properly
- [ ] Position check working

---

**Status**: ✅ Correctly Implemented  
**Last Updated**: July 12, 2026  
**Version**: 2.0.0 (Corrected)
