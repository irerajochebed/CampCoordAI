# Participant Self-Cancellation & Event Type 'OTHER' Support

## Overview
Two major features have been implemented:
1. **Participant Self-Cancellation** - Participants can now cancel their own registrations with automatic refund handling
2. **Event Type 'OTHER' Support** - Users can now select "Other" as an event type and specify custom event types

---

## 1. Participant Self-Cancellation Feature

### What Was Added

#### Backend Changes
- **New Endpoint**: `POST /api/registrations/{id}/cancel-own`
  - No role restrictions - any authenticated participant can use it
  - Validates that the user owns the registration
  - Prevents cancellation after:
    - Check-in
    - Checkout
    - Event has started

#### Automatic Payment Refund Handling
When a participant cancels a paid registration:

**For VERIFIED Payments:**
- Payment status automatically updated to `REFUNDED`
- Refund note added with amount and payment method
- Notifications sent to:
  - Event Coordinator
  - Union Finance Officer
  - Field Finance Officers
- Notification includes:
  - Participant name and contact info
  - Payment amount and reference
  - Event details

**For PENDING Payments:**
- Payment status automatically updated to `REJECTED`
- Note: "Registration cancelled before payment verification"

#### Frontend Changes
- **Participant Dashboard**: 
  - Cancel button appears for eligible registrations
  - Shows only when:
    - Status is PENDING, PAYMENT_SUBMITTED, PAYMENT_VERIFIED, or CONFIRMED
    - Event hasn't started
    - Not already checked in/out or cancelled
  - Confirmation dialog before cancellation
  - Proper error handling with user-friendly messages

- **Registration Detail Page**:
  - Uses `cancelOwn` API for participants
  - Uses regular `cancel` API for coordinators/admins

### How It Works

#### Cancellation Flow
```
1. Participant clicks "Cancel Registration" button
2. Confirmation dialog: "Are you sure you want to cancel your registration for '[Event Name]'?"
3. If confirmed:
   a. Registration status → CANCELLED
   b. If payment exists:
      - VERIFIED payment → REFUNDED (notifications sent)
      - PENDING payment → REJECTED
   c. Dashboard refreshes automatically
4. Success message shown
```

#### Refund Notification Content
```
REFUND REQUIRED: [Participant Name] cancelled registration for '[Event Name]'.
Payment of [Amount] RWF (Ref: [Transaction Reference]) needs to be refunded.
Contact participant at [email] or [phone]
```

### API Examples

#### Cancel Own Registration
```bash
POST /api/registrations/123/cancel-own
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration cancelled successfully",
  "data": {
    "id": 123,
    "status": "CANCELLED",
    "participant": {...},
    "event": {...}
  }
}
```

**Error Responses:**
```json
// Not your registration
{
  "success": false,
  "message": "You can only cancel your own registrations"
}

// Already checked in
{
  "success": false,
  "message": "Cannot cancel registration after check-in"
}

// Event has started
{
  "success": false,
  "message": "Cannot cancel registration after event has started"
}
```

### Testing Scenarios

1. **✅ Successful Cancellation (No Payment)**
   - Register for a free event
   - Cancel before event starts
   - Status changes to CANCELLED

2. **✅ Successful Cancellation (Pending Payment)**
   - Register for paid event
   - Submit payment (status: PENDING)
   - Cancel before verification
   - Registration: CANCELLED
   - Payment: REJECTED

3. **✅ Successful Cancellation (Verified Payment)**
   - Register for paid event
   - Payment verified (status: VERIFIED)
   - Cancel before event starts
   - Registration: CANCELLED
   - Payment: REFUNDED
   - Coordinator receives refund notification
   - Finance officers receive refund notification

4. **❌ Cannot Cancel After Check-in**
   - Register and pay
   - Coordinator checks you in
   - Try to cancel → Error: "Cannot cancel registration after check-in"

5. **❌ Cannot Cancel After Event Starts**
   - Register for event starting tomorrow
   - Wait until tomorrow (event starts)
   - Try to cancel → Error: "Cannot cancel registration after event has started"

6. **❌ Cannot Cancel Someone Else's Registration**
   - Try to cancel another participant's registration
   - Error: "You can only cancel your own registrations"

---

## 2. Event Type 'OTHER' Support

### What Was Fixed

The EventType enum already included `CAMPOREE` and `OTHER` values, but:
- ❌ Frontend dropdown didn't include "OTHER" option
- ❌ No input field for custom event type
- ❌ Backend wasn't saving customEventType

### What Was Added

#### Frontend Changes
- **Event Type Dropdown**: Now includes all 8 options:
  1. Camp
  2. Camporee
  3. Conference
  4. Retreat
  5. Training
  6. Workshop
  7. Seminar
  8. **Other (Specify below)** ← NEW

- **Custom Event Type Field**:
  - Shows when "OTHER" is selected
  - Required field with validation
  - Placeholder: "E.g., Youth Festival, Leadership Summit, etc."
  - Error message: "Please specify the custom event type"

#### Backend Changes
- **ProposalRequest DTO**: Added `customEventType` field
- **ProposalResponse DTO**: Added `customEventType` field
- **ProposalServiceImpl**: 
  - `createProposal()` now saves customEventType
  - `updateProposal()` now saves customEventType

### How It Works

#### User Flow
```
1. User selects "Other (Specify below)" from Event Type dropdown
2. Custom Event Type text input appears below
3. User enters custom type (e.g., "Youth Festival", "Ministerial Retreat")
4. Form validates that custom type is not empty
5. Proposal is created/updated with:
   - eventType: OTHER
   - customEventType: "Youth Festival"
```

#### Data Storage
```java
// Proposal Entity
{
  eventType: EventType.OTHER,
  customEventType: "Youth Festival"
}

// When eventType is OTHER, customEventType contains the actual type
// When eventType is CAMP, SEMINAR, etc., customEventType is null
```

### UI Example

**Before (Error):**
```
Event Type: [Camporee ▼]
❌ JSON parse error: Cannot deserialize value of type 'EventType' 
   from String "CAMPOREE": not one of the values accepted...
```

**After (Working):**
```
Event Type: [Other (Specify below) ▼]
Custom Event Type: [Youth Festival________________] *

✅ Proposal created successfully
```

### API Examples

#### Create Proposal with Custom Event Type
```json
POST /api/proposals
{
  "eventName": "National Youth Festival 2025",
  "eventType": "OTHER",
  "customEventType": "Youth Festival",
  "departmentId": 1,
  "scope": "UNION",
  "objectives": "...",
  "startDate": "2025-03-15",
  "endDate": "2025-03-17",
  "venue": "Kigali Convention Centre",
  "estimatedBudget": 5000000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "data": {
    "id": 45,
    "eventName": "National Youth Festival 2025",
    "eventType": "OTHER",
    "customEventType": "Youth Festival",
    ...
  }
}
```

### Testing Scenarios

1. **✅ Standard Event Type (No Custom Field)**
   - Select "Camp" from dropdown
   - Custom field doesn't appear
   - Create proposal → Success

2. **✅ Custom Event Type**
   - Select "Other (Specify below)"
   - Custom field appears
   - Enter "Youth Festival"
   - Create proposal → Success
   - Backend stores: eventType=OTHER, customEventType="Youth Festival"

3. **❌ Other Without Custom Type**
   - Select "Other (Specify below)"
   - Leave custom field empty
   - Try to create → Error: "Please specify the custom event type"

4. **✅ Edit Proposal with Custom Type**
   - Open existing proposal with eventType=OTHER
   - Custom field auto-populates with saved value
   - Can update custom type
   - Save → Success

---

## Database Impact

### No Migration Required
Both features use existing database columns:

```sql
-- Proposals table (already exists)
ALTER TABLE proposals 
  ADD COLUMN custom_event_type VARCHAR(255);

-- Events table (already exists)
ALTER TABLE events 
  ADD COLUMN custom_event_type VARCHAR(255);

-- Payments table (already has status enum)
-- REFUNDED was already in PaymentStatus enum but unused
```

---

## Files Modified

### Registration Cancellation
**Backend:**
- `RegistrationController.java` - Added cancelOwnRegistration endpoint
- `RegistrationService.java` - Added cancelOwnRegistration method signature
- `RegistrationServiceImpl.java` - Implemented cancellation with refund handling

**Frontend:**
- `api/index.js` - Added cancelOwn() method
- `ParticipantDashboard.jsx` - Added cancel button and handler
- `RegistrationDetail.jsx` - Updated to use cancelOwn for participants

### Event Type Fix
**Backend:**
- `ProposalRequest.java` - Added customEventType field
- `ProposalResponse.java` - Added customEventType field
- `ProposalServiceImpl.java` - Save customEventType on create/update

**Frontend:**
- `ProposalForm.jsx` - Added OTHER option and custom type input

---

## Security Considerations

### Cancellation Security
✅ **Participant can only cancel own registrations** - Validated by user ID check
✅ **Prevents post-event cancellations** - Date validation
✅ **Prevents fraudulent refunds** - Only VERIFIED payments marked for refund
✅ **Audit trail maintained** - All status changes logged

### Authorization Matrix
| Action | Participant | Coordinator | Admin |
|--------|-------------|-------------|-------|
| Cancel own registration | ✅ Yes | ✅ Yes | ✅ Yes |
| Cancel any registration | ❌ No | ✅ Yes | ✅ Yes |
| Process refund | ❌ No | ❌ No | ✅ Yes (via notification) |

---

## Deployment Instructions

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Automatic Deployment
- **Frontend**: Vercel auto-deploys from main branch
- **Backend**: Render auto-deploys from main branch

### 3. Database (No Action Needed)
- Both `custom_event_type` columns already exist
- `REFUNDED` status already in enum

### 4. Verify Deployment
```bash
# Check frontend
curl https://camp-coord-ai-3dhr.vercel.app

# Check backend
curl https://campcoordai-backend.onrender.com/api/auth/login
```

---

## User Documentation

### For Participants

**How to Cancel Your Registration:**
1. Log in to CampCoordAI
2. Go to Dashboard
3. Find the event you want to cancel
4. Click "Cancel Registration" button
5. Confirm cancellation in the dialog
6. Your registration will be cancelled
7. If you paid, the coordinator will process your refund

**When You Cannot Cancel:**
- ❌ After you've checked in at the event
- ❌ After the event has started
- ❌ After you've checked out

**What Happens to Your Payment:**
- If payment was verified: Marked for refund, coordinator notified
- If payment was pending: Automatically rejected
- Coordinator will contact you to process the refund

### For Coordinators

**When a Participant Cancels:**
1. You receive a notification titled "REFUND REQUIRED"
2. Notification includes:
   - Participant name and contact
   - Amount to refund
   - Payment reference
3. Contact participant to arrange refund
4. Process refund through your payment method
5. Update payment status if needed

**Where to Find Refund Requests:**
- Notifications panel (bell icon)
- Payments page - filter by "REFUNDED" status
- Email notification (if configured)

---

## Known Limitations

### Cancellation
1. **No automatic refund processing** - Manual refund required
   - Reason: Payment methods (MoMo, bank transfer) require manual intervention
   - Solution: Coordinator receives notification and processes manually

2. **Cannot re-register after cancellation** - Would need to create new registration
   - Reason: QR codes and payment records tied to original registration
   - Solution: Participant creates new registration if they change their mind

### Event Type
1. **No validation of custom type format** - Free text allowed
   - Reason: Flexibility for various event types
   - Consideration: Could add suggested types in future

---

## Support & Troubleshooting

### Common Issues

**Issue**: "Failed to cancel registration"
- **Cause**: Event has started or already checked in
- **Solution**: Contact coordinator for assistance

**Issue**: "Payment not marked for refund"
- **Cause**: Payment was still PENDING when cancelled
- **Solution**: No refund needed for unverified payments

**Issue**: "Other option not appearing"
- **Cause**: Browser cache
- **Solution**: Hard refresh (Ctrl+Shift+R) or clear cache

---

## Future Enhancements

### Potential Improvements
1. **Automated refund processing** via payment gateway APIs
2. **Cancellation deadline** (e.g., must cancel 7 days before)
3. **Partial refund** based on cancellation timing
4. **Cancellation reason** field for analytics
5. **Suggested custom event types** dropdown
6. **Event type categories** (e.g., Youth, Women, Ministerial)

---

## Change Log

**Version 1.0.0** - January 8, 2025
- ✅ Added participant self-cancellation feature
- ✅ Added automatic refund handling for cancelled registrations
- ✅ Fixed event type "OTHER" support with custom type input
- ✅ Added refund notifications to coordinators and finance officers

---

## Contact

For questions or issues, contact:
- Technical Support: [Your Email]
- System Administrator: [Admin Email]
