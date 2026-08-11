# User Management - Bug Fixes

## Issues Fixed

### 1. ❌ **Issue: Delete doesn't remove user from database**
**Root Cause**: The backend uses soft delete - it sets `deleted=true` instead of actually removing the record.

**Fix**: 
- ✅ Updated confirmation message to explain soft delete behavior
- ✅ User is marked as deleted but kept in database for audit purposes
- ✅ Deleted users are filtered out from all lists
- ✅ Message now clearly states this is a "soft delete"

**Backend Implementation**:
```java
@Override
public void deleteUser(Long id) {
    User user = getUserById(id);
    user.setDeleted(true);  // Soft delete
    userRepository.save(user);
    log.info("User soft deleted: {}", user.getEmail());
}
```

---

### 2. ❌ **Issue: Deactivated users disappear and can't be reactivated**
**Root Cause**: The `getAllUsers()` method was only returning active users.

**Fixes Applied**:

#### Backend Fix:
Changed `UserServiceImpl.getAllUsers()` to return ALL users (both active and inactive) but exclude deleted ones:

```java
@Override
@Transactional(readOnly = true)
public List<UserResponse> getAllUsers() {
    return userRepository.findAll().stream()
            .filter(user -> !user.isDeleted()) // Exclude soft-deleted users
            .map(dtoMapper::toUserResponse)
            .collect(Collectors.toList());
}
```

#### Frontend Fixes:

**1. Added Status Filter**:
```javascript
const statusOptions = [
  { value: 'ALL', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active Only' },
  { value: 'INACTIVE', label: 'Inactive Only' },
];
```

**2. Updated Filter Logic**:
```javascript
// Filter by status (active/inactive)
if (statusFilter === 'ACTIVE') {
  filtered = filtered.filter((u) => u.active === true);
} else if (statusFilter === 'INACTIVE') {
  filtered = filtered.filter((u) => u.active === false);
}
// If 'ALL', show both active and inactive
```

**3. Visual Indicators for Inactive Users**:
- Inactive user rows have gray background with reduced opacity
- Clear "Active" or "Inactive" badge in status column
- "Activate" button visible for inactive users
- "Deactivate" button visible for active users

**4. Enhanced UI**:
```javascript
<TableRow 
  className={!user.active ? 'bg-gray-50 opacity-60' : ''}
>
```

---

## Updated User Management Features

### Filter Options (3 Filters)
1. **Search** - By name, email, or phone
2. **Role Filter** - All / Administrator / Coordinator / Participant
3. **Status Filter** - All / Active Only / Inactive Only ✨ NEW

### User Actions
- ✅ **Edit** - Update user details
- ✅ **Activate** - Enable inactive user (visible when user is inactive)
- ✅ **Deactivate** - Disable active user (visible when user is active)
- ✅ **Delete** - Soft delete user (keeps in database for audit)

### Visual Indicators
- 🟢 **Active users**: Normal appearance with green "Active" badge
- 🔴 **Inactive users**: Gray background, reduced opacity, red "Inactive" badge
- 🗑️ **Deleted users**: Not shown in any list (filtered out)

---

## User Status Lifecycle

```
┌─────────────┐
│   ACTIVE    │ ◄──────┐
│ (visible)   │        │
└──────┬──────┘        │
       │               │
       │ Deactivate    │ Activate
       │               │
       ▼               │
┌─────────────┐        │
│  INACTIVE   │────────┘
│ (visible)   │
└──────┬──────┘
       │
       │ Delete (soft)
       │
       ▼
┌─────────────┐
│   DELETED   │
│ (hidden)    │
│ (in DB)     │
└─────────────┘
```

---

## Testing Checklist

### ✅ Deactivate User
1. Go to User Management
2. Find an active user
3. Click "Deactivate"
4. ✅ User stays visible in the list
5. ✅ User row becomes gray with reduced opacity
6. ✅ Status badge changes to "Inactive" (red)
7. ✅ "Deactivate" button changes to "Activate"

### ✅ Activate User
1. Filter by "Inactive Only"
2. Find an inactive user
3. Click "Activate"
4. ✅ User row returns to normal appearance
5. ✅ Status badge changes to "Active" (green)
6. ✅ "Activate" button changes to "Deactivate"

### ✅ Delete User (Soft Delete)
1. Find any user
2. Click "Delete"
3. Read confirmation message (explains soft delete)
4. Confirm deletion
5. ✅ User disappears from list immediately
6. ✅ User still exists in database with `deleted=true`
7. ✅ User cannot be reactivated from UI (only DB admin)

### ✅ Status Filter
1. Select "Active Only"
   - ✅ Shows only users with active=true
2. Select "Inactive Only"
   - ✅ Shows only users with active=false
3. Select "All Status"
   - ✅ Shows both active and inactive users
   - ✅ Does NOT show deleted users

---

## Database Schema

### User Table Relevant Fields
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    active BOOLEAN DEFAULT TRUE,    -- For deactivation
    deleted BOOLEAN DEFAULT FALSE,  -- For soft delete
    ...
);
```

### States
- `active=true, deleted=false` → **Active** (shown in list)
- `active=false, deleted=false` → **Inactive** (shown in list with gray style)
- `active=false, deleted=true` → **Deleted** (hidden from list, kept in DB)

---

## API Endpoints Used

### GET `/api/users`
Returns all non-deleted users (both active and inactive)

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "active": true,
      "role": "ADMINISTRATOR"
    },
    {
      "id": 2,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "active": false,  // Inactive but visible
      "role": "COORDINATOR"
    }
  ]
}
```

### PATCH `/api/users/{id}/deactivate`
Sets `active=false`

### PATCH `/api/users/{id}/activate`
Sets `active=true`

### DELETE `/api/users/{id}`
Sets `deleted=true` (soft delete)

---

## Key Improvements

### Before
- ❌ Deactivated users disappeared from UI
- ❌ No way to reactivate users from UI
- ❌ Delete behavior unclear
- ❌ Only active users shown

### After
- ✅ Deactivated users stay visible (with visual indication)
- ✅ "Activate" button available for inactive users
- ✅ Clear confirmation message explaining soft delete
- ✅ Filter to show active, inactive, or all users
- ✅ Visual distinction between active and inactive users
- ✅ Proper lifecycle management

---

## User Experience Flow

### Scenario 1: Temporary Deactivation
*Example: User on vacation or temporary leave*

1. Admin clicks "Deactivate"
2. User status changes to inactive
3. User appears in list with gray background
4. When user returns, admin clicks "Activate"
5. User back to normal status

### Scenario 2: Permanent Removal
*Example: User left organization*

1. Admin clicks "Delete"
2. Confirmation explains soft delete
3. User removed from all lists
4. User record kept in database for audit
5. Historical data (registrations, payments) preserved

---

## Benefits

### Data Integrity
- ✅ No orphaned references (foreign keys preserved)
- ✅ Complete audit trail
- ✅ Historical data intact

### Flexibility
- ✅ Easy to reactivate users
- ✅ Can see all user states
- ✅ Filter by status

### Compliance
- ✅ Audit requirements met
- ✅ Data retention policy supported
- ✅ User lifecycle documented

---

## Future Enhancements (Optional)

1. **Batch Operations**
   - Activate multiple users at once
   - Deactivate multiple users at once

2. **Activity Log**
   - Track who activated/deactivated users
   - Track when status changes occurred

3. **Automatic Reactivation**
   - Schedule reactivation date
   - Email notification on reactivation

4. **Delete Reasons**
   - Require reason for deletion
   - Store deletion reason in audit log

5. **Restore Deleted Users**
   - Admin panel to view deleted users
   - Option to restore soft-deleted users

---

**Status**: ✅ Fixed and Tested  
**Date**: July 12, 2026  
**Version**: 1.1.0
