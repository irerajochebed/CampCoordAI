# User Hierarchy Visibility Guide
## Organizational Scope-Based User Access

## Overview
The CampCoordAI system implements **automatic hierarchical user visibility** based on organizational structure. This means users can only see other users within their jurisdiction.

---

## ✅ Current Implementation Status

### **Already Working Features**
1. ✅ Field Leaders see all users in their Field (Conference)
2. ✅ District Pastors see all users in their District  
3. ✅ Union Leaders/Admins see all users across RUM
4. ✅ Church Leaders see only users in their church
5. ✅ Automatic enforcement - cannot be bypassed
6. ✅ Works on all user listing pages

---

## How It Works

### Organizational Hierarchy
```
Rwanda Union Mission (RUM)
├── Field 1 (East Rwanda)
│   ├── District 1A
│   │   ├── Church 1A1
│   │   ├── Church 1A2
│   │   └── Church 1A3
│   └── District 1B
│       ├── Church 1B1
│       └── Church 1B2
└── Field 2 (West Rwanda)
    ├── District 2A
    └── District 2B
```

### User Visibility Rules

| Position | Can See Users From |
|----------|-------------------|
| **Union Administrator** | All fields, all districts, all churches |
| **Union Leader** | All fields, all districts, all churches |
| **Field Leader** | Their field + all districts + all churches in that field |
| **District Pastor** | Their district + all churches in that district |
| **Pastor** | Their district + all churches in that district |
| **Church Leader** | Only their church |
| **Participant** | Only themselves |

---

## Technical Implementation

### Backend - Automatic Scoping

#### 1. JurisdictionScopeService
Located in: `src/main/java/com/example/Camp/service/impl/JurisdictionScopeServiceImpl.java`

**Method:** `getAccessibleOrganizationUnitIds(User user)`

**Logic:**
```java
// For Field Leaders
if (Position.FIELD_LEADER || orgUnit.level == FIELD) {
    return [fieldId, district1Id, district2Id, ..., church1Id, church2Id, ...];
}

// For District Pastors
if (Position.DISTRICT_PASTOR || Position.PASTOR || orgUnit.level == DISTRICT) {
    return [districtId, church1Id, church2Id, church3Id, ...];
}

// For Church Leaders
if (orgUnit.level == CHURCH || orgUnit.level == LOCAL_CHURCH) {
    return [churchId];
}

// For Union Leaders/Admins
if (UNION_ADMINISTRATOR || UNION_LEADER || orgUnit.level == UNION) {
    return null; // No restrictions - see all users
}
```

#### 2. UserService - Filtered Listing
Located in: `src/main/java/com/example/Camp/service/impl/UserServiceImpl.java`

**Method:** `getAllUsersFiltered(...)`

**How it works:**
1. Gets current logged-in user
2. Calls `getAccessibleOrganizationUnitIds()` to get their scope
3. Filters all users to only include those in accessible organization units
4. Applies additional filters (role, position, keyword, etc.)

```java
List<Long> accessibleOrgUnitIds = jurisdictionScopeService.getAccessibleOrganizationUnitIds(currentUser);

return userRepository.findAll().stream()
    .filter(user -> !user.getDeleted())
    // KEY FILTER: Only users in accessible org units
    .filter(user -> scopedUnitIds == null || 
                    scopedUnitIds.contains(user.getOrganizationUnit().getId()))
    .filter(/* other filters */)
    .collect(Collectors.toList());
```

#### 3. Database Queries
Located in: `src/main/java/com/example/Camp/repository/OrganizationUnitRepository.java`

**Key Methods:**
- `findUnitIdsUnderField(Long fieldId)` - Returns all org unit IDs under a field
- `findUnitIdsUnderDistrict(Long districtId)` - Returns all org unit IDs under a district

These queries traverse the organizational hierarchy to get all child units.

### Frontend - Automatic Enforcement

#### User List Page
Located in: `Campfront/src/pages/users/UserList.jsx`

**API Call:**
```javascript
const fetchUsers = async () => {
  const response = await userApi.getAll(); // GET /api/users
  setUsers(response.data.data || []); // Backend already filtered
};
```

**Key Point:** Frontend doesn't need to filter - backend automatically returns only users within the current user's jurisdiction!

---

## Example Scenarios

### Scenario 1: Field Leader Viewing Users

**User:** Jean (Field Leader, East Rwanda Field)

**What Jean sees when viewing Users page:**
- ✅ All Field Leaders in East Rwanda
- ✅ All District Pastors in East Rwanda districts
- ✅ All Church Leaders in East Rwanda churches
- ✅ All Participants registered in East Rwanda
- ❌ Cannot see users from West Rwanda Field
- ❌ Cannot see users from other Fields

**SQL Behind the Scenes:**
```sql
-- Get all organization units under East Rwanda Field
SELECT id FROM organization_units 
WHERE id = 2 -- East Rwanda Field
   OR parent_id = 2 -- Districts in East Rwanda
   OR parent_id IN (SELECT id FROM organization_units WHERE parent_id = 2) -- Churches

-- Returns: [2, 5, 6, 15, 16, 17, 18, 19, 20, ...]

-- Get users in those units
SELECT * FROM users 
WHERE organization_unit_id IN (2, 5, 6, 15, 16, 17, 18, 19, 20, ...)
  AND deleted = FALSE;
```

### Scenario 2: District Pastor Viewing Users

**User:** Pastor Paul (District Pastor, Kigali Central District)

**What Pastor Paul sees:**
- ✅ All Pastors in Kigali Central District
- ✅ All Church Leaders in churches under Kigali Central
- ✅ All Participants registered in those churches
- ❌ Cannot see users from other districts
- ❌ Cannot see users from other fields

**SQL Behind the Scenes:**
```sql
-- Get district and child churches
SELECT id FROM organization_units 
WHERE id = 5 -- Kigali Central District
   OR parent_id = 5; -- Churches in Kigali Central

-- Returns: [5, 15, 16, 17, ...]

-- Get users in those units
SELECT * FROM users 
WHERE organization_unit_id IN (5, 15, 16, 17, ...)
  AND deleted = FALSE;
```

### Scenario 3: Union Leader Viewing Users

**User:** Pastor David (Union Leader, RUM)

**What Pastor David sees:**
- ✅ ALL users across all fields
- ✅ ALL users across all districts
- ✅ ALL users across all churches
- ✅ Complete visibility for union-wide management

**SQL Behind the Scenes:**
```sql
-- No filtering - see everyone
SELECT * FROM users WHERE deleted = FALSE;
```

---

## API Endpoints

### Get All Users (Scoped)
```
GET /api/users
Authorization: Bearer {token}
```

**Optional Query Parameters:**
- `role` - Filter by role (ADMINISTRATOR, COORDINATOR, PARTICIPANT)
- `position` - Filter by position (FIELD_LEADER, DISTRICT_PASTOR, etc.)
- `organizationUnitId` - Filter by specific organization unit
- `active` - Filter by active status (true/false)
- `keyword` - Search by name, email, or phone

**Response (Field Leader Example):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 15,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "COORDINATOR",
      "position": "DISTRICT_PASTOR",
      "organizationUnitId": 5,
      "organizationUnitName": "Kigali Central District",
      "active": true
    },
    // ... only users from Field Leader's jurisdiction
  ]
}
```

### Get Users by Organization
```
GET /api/users/organization/{organizationUnitId}
Authorization: Bearer {token}
```

**Note:** Still respects jurisdiction - you can only query organization units within your scope!

### Search Users
```
GET /api/users/search?keyword={keyword}
Authorization: Bearer {token}
```

**Note:** Searches only within your jurisdictional scope.

---

## Security Features

### 1. Automatic Enforcement
✅ **Cannot be bypassed** - enforced at service layer before data reaches controller
✅ **Applies to ALL endpoints** - any user listing endpoint respects scope
✅ **Works for filtering** - even when filtering by role/position, still scoped

### 2. Fallback Mechanisms
✅ **District matching by name** - if user's `sdaDistrict` field is set, system matches by code or name
✅ **Default to assigned unit** - if position doesn't match any rule, defaults to user's own organization unit

### 3. Audit Trail
✅ **Logs scope resolution** - system logs which units are accessible for debugging
✅ **Logs access attempts** - unauthorized access attempts are logged

---

## Testing Guide

### Test as Field Leader

**Setup:**
1. Create a user with:
   - Position: `FIELD_LEADER`
   - Organization Unit: "East Rwanda Field"
   - Role: `COORDINATOR`

2. Login as this user
3. Navigate to Users page (`/app/users`)

**Expected Results:**
- ✅ See users from East Rwanda Field
- ✅ See users from districts under East Rwanda (e.g., Kigali Central, Nyarugenge)
- ✅ See users from churches under those districts
- ❌ Should NOT see users from West Rwanda Field
- ❌ Should NOT see users from other fields

**Test Filters:**
- Filter by Position → "District Pastor" → Should see only district pastors in your field
- Search by name → Should search only within your field
- Filter by Organization Unit → Can only select units within your field

### Test as District Pastor

**Setup:**
1. Create a user with:
   - Position: `DISTRICT_PASTOR`
   - Organization Unit: "Kigali Central District"
   - Role: `COORDINATOR`

2. Login as this user
3. Navigate to Users page

**Expected Results:**
- ✅ See users from Kigali Central District
- ✅ See users from churches under Kigali Central
- ✅ See participants registered in those churches
- ❌ Should NOT see users from other districts
- ❌ Should NOT see users from other fields

### Test as Union Leader

**Setup:**
1. Create a user with:
   - Position: `UNION_LEADER`
   - Organization Unit: "Rwanda Union Mission (RUM)"
   - Role: `ADMINISTRATOR`

2. Login as this user
3. Navigate to Users page

**Expected Results:**
- ✅ See ALL users from all fields
- ✅ See ALL users from all districts
- ✅ See ALL users from all churches
- ✅ Complete unrestricted visibility

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- ADMINISTRATOR, COORDINATOR, PARTICIPANT
    position VARCHAR(50), -- FIELD_LEADER, DISTRICT_PASTOR, etc.
    organization_unit_id BIGINT NOT NULL REFERENCES organization_units(id),
    department_id BIGINT REFERENCES departments(id),
    sda_district VARCHAR(255),
    government_district VARCHAR(255),
    custom_church_name VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Organization Units Table
```sql
CREATE TABLE organization_units (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL, -- UNION, FIELD, DISTRICT, CHURCH
    parent_id BIGINT REFERENCES organization_units(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Relationship:**
- `users.organization_unit_id` → `organization_units.id`
- `organization_units.parent_id` → `organization_units.id` (self-referencing for hierarchy)

---

## Troubleshooting

### Issue: Field Leader Sees Users from Other Fields

**Possible Causes:**
1. User's `organization_unit_id` is set to Union level instead of Field level
2. User's `position` is set to `UNION_LEADER` instead of `FIELD_LEADER`
3. User's `role` is `ADMINISTRATOR` (which bypasses all restrictions)

**Solution:**
1. Check user's organization unit: `SELECT organization_unit_id FROM users WHERE id = {userId};`
2. Check organization unit level: `SELECT level FROM organization_units WHERE id = {orgUnitId};`
3. Update user's organization unit to correct Field:
   ```sql
   UPDATE users 
   SET organization_unit_id = {correctFieldId} 
   WHERE id = {userId};
   ```

### Issue: District Pastor Doesn't See Any Users

**Possible Causes:**
1. No users registered under their district
2. District has no child churches
3. User's `sdaDistrict` field doesn't match any organization unit

**Solution:**
1. Check if district has child units:
   ```sql
   SELECT * FROM organization_units WHERE parent_id = {districtId};
   ```
2. Check if users exist in those units:
   ```sql
   SELECT * FROM users WHERE organization_unit_id IN (
       SELECT id FROM organization_units WHERE parent_id = {districtId}
   );
   ```
3. Verify district assignment:
   ```sql
   SELECT u.*, ou.name, ou.level 
   FROM users u 
   JOIN organization_units ou ON u.organization_unit_id = ou.id 
   WHERE u.id = {userId};
   ```

### Issue: Jurisdiction Scope Not Updating

**Possible Causes:**
1. Cached authentication token
2. User needs to log out and log back in
3. Organization unit relationships not properly set

**Solution:**
1. Clear browser cache and cookies
2. Log out and log back in to refresh JWT token
3. Verify organization hierarchy:
   ```sql
   WITH RECURSIVE org_tree AS (
       SELECT id, code, name, level, parent_id, 1 as depth
       FROM organization_units WHERE id = {orgUnitId}
       UNION ALL
       SELECT ou.id, ou.code, ou.name, ou.level, ou.parent_id, ot.depth + 1
       FROM organization_units ou
       JOIN org_tree ot ON ou.parent_id = ot.id
   )
   SELECT * FROM org_tree ORDER BY depth;
   ```

---

## Future Enhancements

### Potential Improvements
1. **Database Query Optimization**
   - Replace `findAll()` + stream filter with direct SQL query
   - Add pagination for large user lists
   - Create database indexes on `organization_unit_id`

2. **Performance Caching**
   - Cache `getAccessibleOrganizationUnitIds()` results per user
   - Clear cache when organization structure changes
   - Implement Redis caching for frequently accessed data

3. **UI Enhancements**
   - Show organizational hierarchy tree in UI
   - Display current user's scope explicitly
   - Add breadcrumb showing current filter level

4. **Reporting Features**
   - Export user lists (CSV/Excel) respecting scope
   - Generate statistics per field/district
   - User growth reports by region

---

## Frequently Asked Questions

### Q: Can a Field Leader see users from another Field?
**A:** No. Field Leaders can only see users within their own Field and its child Districts and Churches.

### Q: Can a District Pastor promote someone to Field Leader?
**A:** No. Only Union Administrators and Union Leaders can assign Field Leader positions, as they have union-wide scope.

### Q: What if a user belongs to multiple organizations?
**A:** Currently, a user can only be assigned to ONE organization unit. The system uses this single assignment for scope determination.

### Q: Can a participant see other participants?
**A:** No. Participants can only see themselves. They don't have access to the Users page.

### Q: How do I test if scoping is working correctly?
**A:** 
1. Create 2 Fields with different users
2. Create a Field Leader for Field 1
3. Login as Field 1 Leader
4. Check Users page - should only see Field 1 users
5. Login as Union Admin - should see all users

### Q: What happens if a user's organization unit is deleted?
**A:** Users cannot be deleted if they belong to an organization unit. The organization unit must be empty before deletion. The system enforces referential integrity.

---

## Summary

### ✅ What's Already Working
1. **Field Leaders** → See all users in their Field (+ Districts + Churches)
2. **District Pastors** → See all users in their District (+ Churches)
3. **Union Leaders/Admins** → See all users across RUM
4. **Church Leaders** → See only users in their church
5. **Automatic enforcement** at service layer
6. **Cannot be bypassed** by API calls or URL manipulation

### 🎯 Current Status
**Status:** ✅ FULLY IMPLEMENTED AND WORKING

The hierarchical user visibility you requested is already built into the system and working correctly. No additional development is needed!

### 📝 How to Verify
1. Login as a Field Leader → Check Users page
2. Should only see users from their Field
3. Login as a District Pastor → Check Users page
4. Should only see users from their District
5. Login as Union Admin → Check Users page
6. Should see all users

---

## Support
For questions or issues, contact:
- Technical Support: [Your Email]
- System Administrator: [Admin Email]
