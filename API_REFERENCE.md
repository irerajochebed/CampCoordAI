# CampCoordAI - Complete API Reference

## Base URL
```
http://localhost:8080/api
```

## Authentication
All endpoints (except `/auth/login` and `/auth/register`) require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Module

### Login
**POST** `/auth/login`
```json
Request:
{
  "email": "admin@campcoordai.rw",
  "password": "Admin@2026"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "type": "Bearer",
    "userId": 1,
    "email": "admin@campcoordai.rw",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "ADMINISTRATOR",
    "position": "UNION_ADMINISTRATOR",
    "organizationUnitId": 1,
    "organizationUnitName": "Rwanda Union Mission"
  }
}
```

### Register
**POST** `/auth/register`
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+250788123456",
  "role": "PARTICIPANT",
  "organizationUnitId": 5,
  "gender": "MALE"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": { ... }
}
```

### Get Current User
**GET** `/auth/me`

### Change Password
**POST** `/auth/change-password`
```json
Request:
{
  "oldPassword": "OldPass@123",
  "newPassword": "NewPass@456"
}
```

---

## 👥 User Management

### Get All Users
**GET** `/users`
- **Access**: ADMINISTRATOR

### Get User by ID
**GET** `/users/{id}`

### Get Users by Role
**GET** `/users/role/{role}`
- Roles: ADMINISTRATOR, COORDINATOR, PARTICIPANT

### Get Users by Organization
**GET** `/users/organization/{organizationId}`

### Search Users
**GET** `/users/search?keyword=john`

### Update User
**PUT** `/users/{id}`
- **Access**: ADMINISTRATOR
```json
Request:
{
  "firstName": "John",
  "lastName": "Updated",
  "phone": "+250788999888",
  "position": "DEPARTMENT_LEADER"
}
```

### Activate User
**PATCH** `/users/{id}/activate`
- **Access**: ADMINISTRATOR

### Deactivate User
**PATCH** `/users/{id}/deactivate`
- **Access**: ADMINISTRATOR

### Delete User
**DELETE** `/users/{id}`
- **Access**: ADMINISTRATOR

---

## 📝 Proposal Management

### Create Proposal
**POST** `/proposals`
- **Access**: COORDINATOR
```json
Request:
{
  "eventName": "Youth Camp 2026",
  "eventType": "CAMP",
  "departmentId": 1,
  "objectives": "Spiritual growth and fellowship for young people",
  "startDate": "2026-08-01",
  "endDate": "2026-08-05",
  "venue": "Rubavu Campsite",
  "expectedParticipants": 200,
  "estimatedBudget": 5000000,
  "requiredResources": "Tents, Sound system, Projector, Generator"
}
```

### Update Proposal
**PUT** `/proposals/{id}`
- **Access**: COORDINATOR (creator only)

### Get Proposal by ID
**GET** `/proposals/{id}`

### Get All Proposals
**GET** `/proposals`

### Get Proposals by Department
**GET** `/proposals/department/{departmentId}`

### Get My Proposals
**GET** `/proposals/my-proposals`
- **Access**: COORDINATOR

### Get Proposals by Status
**GET** `/proposals/status/{status}`
- Status: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, NEEDS_REVISION

### Submit Proposal
**PATCH** `/proposals/{id}/submit`
- **Access**: COORDINATOR (creator only)

### Approve Proposal
**PATCH** `/proposals/{id}/approve`
- **Access**: ADMINISTRATOR
```json
Request:
{
  "comments": "Approved for Youth Department"
}
```

### Reject Proposal
**PATCH** `/proposals/{id}/reject`
- **Access**: ADMINISTRATOR
```json
Request:
{
  "comments": "Budget exceeds limits"
}
```

### Request Revision
**PATCH** `/proposals/{id}/request-revision`
- **Access**: ADMINISTRATOR
```json
Request:
{
  "comments": "Please provide more details on accommodation"
}
```

### Delete Proposal
**DELETE** `/proposals/{id}`
- **Access**: ADMINISTRATOR

---

## 🎪 Event Management

### Create Event
**POST** `/events`
- **Access**: ADMINISTRATOR
```json
Request:
{
  "name": "Youth Camp 2026",
  "type": "CAMP",
  "departmentId": 1,
  "description": "Annual youth spiritual retreat",
  "startDate": "2026-08-01T08:00:00",
  "endDate": "2026-08-05T16:00:00",
  "venue": "Rubavu Campsite",
  "capacity": 200,
  "registrationFee": 25000,
  "coordinatorId": 2
}
```

### Create Event from Proposal
**POST** `/events/from-proposal/{proposalId}?coordinatorId={userId}`
- **Access**: ADMINISTRATOR

### Update Event
**PUT** `/events/{id}`
- **Access**: COORDINATOR, ADMINISTRATOR

### Get Event by ID
**GET** `/events/{id}`

### Get All Events
**GET** `/events`

### Get Events by Department
**GET** `/events/department/{departmentId}`

### Get Events by Status
**GET** `/events/status/{status}`
- Status: PLANNED, REGISTRATION_OPEN, REGISTRATION_CLOSED, ONGOING, COMPLETED, CANCELLED, POSTPONED

### Get Upcoming Events
**GET** `/events/upcoming`

### Get My Events
**GET** `/events/my-events`
- **Access**: COORDINATOR

### Open Registration
**PATCH** `/events/{id}/open-registration`
- **Access**: COORDINATOR, ADMINISTRATOR

### Close Registration
**PATCH** `/events/{id}/close-registration`
- **Access**: COORDINATOR, ADMINISTRATOR

### Start Event
**PATCH** `/events/{id}/start`
- **Access**: COORDINATOR, ADMINISTRATOR

### Complete Event
**PATCH** `/events/{id}/complete`
- **Access**: COORDINATOR, ADMINISTRATOR

### Cancel Event
**PATCH** `/events/{id}/cancel`
- **Access**: ADMINISTRATOR

### Assign Staff
**POST** `/events/{eventId}/assign-staff`
- **Access**: COORDINATOR, ADMINISTRATOR
```json
Request:
{
  "userId": 3,
  "position": "CAMP_DIRECTOR",
  "responsibilities": "Overall camp coordination"
}
```

### Get Event Staff
**GET** `/events/{eventId}/staff`

### Remove Staff Assignment
**DELETE** `/events/staff/{assignmentId}`
- **Access**: COORDINATOR, ADMINISTRATOR

### Delete Event
**DELETE** `/events/{id}`
- **Access**: ADMINISTRATOR

---

## 📅 Session Management

### Create Session
**POST** `/sessions/event/{eventId}`
- **Access**: COORDINATOR, ADMINISTRATOR
```json
Request:
{
  "title": "Morning Devotion",
  "type": "MORNING_DEVOTION",
  "description": "Daily morning worship",
  "startTime": "2026-08-01T07:00:00",
  "endTime": "2026-08-01T08:00:00",
  "venue": "Main Hall",
  "capacity": 200,
  "speakerId": 4
}
```

### Update Session
**PUT** `/sessions/{id}`
- **Access**: COORDINATOR, ADMINISTRATOR

### Get Session by ID
**GET** `/sessions/{id}`

### Get Sessions by Event
**GET** `/sessions/event/{eventId}`

### Get Sessions by Speaker
**GET** `/sessions/speaker/{speakerId}`

### Delete Session
**DELETE** `/sessions/{id}`
- **Access**: COORDINATOR, ADMINISTRATOR

---

## 📋 Registration Management

### Register Participant
**POST** `/registrations`
```json
Request:
{
  "eventId": 1,
  "participantId": 5,
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "+250788999999",
  "emergencyContactRelationship": "Father",
  "specialRequirements": "Vegetarian meals",
  "medicalInfo": "No allergies"
}
```

### Update Registration
**PUT** `/registrations/{id}`

### Get Registration by ID
**GET** `/registrations/{id}`

### Get Registrations by Event
**GET** `/registrations/event/{eventId}`

### Get Registrations by Participant
**GET** `/registrations/participant/{participantId}`

### Get My Registrations
**GET** `/registrations/my-registrations`

### Get Registrations by Status
**GET** `/registrations/event/{eventId}/status/{status}`
- Status: PENDING, CONFIRMED, CANCELLED, CHECKED_IN, CHECKED_OUT, NO_SHOW

### Confirm Registration
**PATCH** `/registrations/{id}/confirm`
- **Access**: COORDINATOR, ADMINISTRATOR

### Cancel Registration
**PATCH** `/registrations/{id}/cancel`

### Check-in Participant (Manual)
**POST** `/registrations/{id}/check-in`
- **Access**: COORDINATOR

### Check-in via QR Code
**POST** `/registrations/check-in/qr/{qrCode}`
- **Access**: COORDINATOR

### Check-out Participant
**POST** `/registrations/{id}/check-out`
- **Access**: COORDINATOR

### Delete Registration
**DELETE** `/registrations/{id}`
- **Access**: ADMINISTRATOR

---

## 💰 Payment Management

### Submit Payment
**POST** `/payments`
```json
Request:
{
  "registrationId": 1,
  "amount": 25000,
  "paymentMethod": "MOBILE_MONEY",
  "transactionReference": "MTN-202608-123456",
  "paidBy": "John Doe",
  "notes": "Paid via MTN Mobile Money"
}
```
- Payment Methods: CASH, MOBILE_MONEY, BANK_TRANSFER, CHURCH_COLLECTION

### Get Payment by ID
**GET** `/payments/{id}`

### Get Payments by Registration
**GET** `/payments/registration/{registrationId}`

### Get Payments by Event
**GET** `/payments/event/{eventId}`

### Get Pending Payments
**GET** `/payments/event/{eventId}/pending`
- **Access**: COORDINATOR, ADMINISTRATOR

### Verify Payment
**PATCH** `/payments/{id}/verify`
- **Access**: COORDINATOR, ADMINISTRATOR
```json
Request:
{
  "notes": "Payment confirmed in bank account"
}
```

### Reject Payment
**PATCH** `/payments/{id}/reject`
- **Access**: COORDINATOR, ADMINISTRATOR
```json
Request:
{
  "reason": "Invalid transaction reference"
}
```

### Get Total Payments
**GET** `/payments/event/{eventId}/total`

### Get Total Verified Payments
**GET** `/payments/event/{eventId}/verified-total`

### Delete Payment
**DELETE** `/payments/{id}`
- **Access**: ADMINISTRATOR

---

## 🏠 Accommodation Management

### Create Accommodation (Building)
**POST** `/accommodations/event/{eventId}`
- **Access**: COORDINATOR, ADMINISTRATOR
```json
Request:
{
  "buildingName": "Building A",
  "buildingCode": "BA-001",
  "location": "Main Camp Area",
  "description": "Main accommodation block"
}
```

### Update Accommodation
**PUT** `/accommodations/{id}`
- **Access**: COORDINATOR, ADMINISTRATOR

### Get Accommodation by ID
**GET** `/accommodations/{id}`

### Get Accommodations by Event
**GET** `/accommodations/event/{eventId}`

### Delete Accommodation
**DELETE** `/accommodations/{id}`
- **Access**: COORDINATOR, ADMINISTRATOR

### Create Room
**POST** `/accommodations/{accommodationId}/rooms`
- **Access**: COORDINATOR, ADMINISTRATOR
```json
Request:
{
  "roomNumber": "101",
  "capacity": 4,
  "genderRestriction": "MALE",
  "floor": 1,
  "amenities": "Beds, Fan, Windows"
}
```

### Update Room
**PUT** `/accommodations/rooms/{id}`
- **Access**: COORDINATOR, ADMINISTRATOR

### Get Room by ID
**GET** `/accommodations/rooms/{id}`

### Get Rooms by Accommodation
**GET** `/accommodations/{accommodationId}/rooms`

### Get Available Rooms
**GET** `/accommodations/{accommodationId}/rooms/available`

### Delete Room
**DELETE** `/accommodations/rooms/{id}`
- **Access**: COORDINATOR, ADMINISTRATOR

### Assign Room to Participant
**POST** `/accommodations/assign`
- **Access**: COORDINATOR, ADMINISTRATOR
```json
Request:
{
  "roomId": 1,
  "registrationId": 1,
  "bedNumber": "1",
  "checkInDate": "2026-08-01",
  "checkOutDate": "2026-08-05",
  "notes": "Near exit for easy access"
}
```

### Get Room Assignment by ID
**GET** `/accommodations/assignments/{id}`

### Get Assignment by Registration
**GET** `/accommodations/assignments/registration/{registrationId}`

### Get Assignments by Room
**GET** `/accommodations/rooms/{roomId}/assignments`

### Release Room Assignment
**PATCH** `/accommodations/assignments/{id}/release`
- **Access**: COORDINATOR, ADMINISTRATOR

### Get Event Capacity
**GET** `/accommodations/event/{eventId}/capacity`
```json
Response:
{
  "success": true,
  "data": {
    "totalCapacity": 100,
    "occupied": 45,
    "available": 55
  }
}
```

---

## ✅ Attendance Management

### Record Attendance (Manual)
**POST** `/attendance/session/{sessionId}/registration/{registrationId}`
- **Access**: COORDINATOR, ADMINISTRATOR

### Record Attendance via QR Scan
**POST** `/attendance/session/{sessionId}/qr-scan?qrCode={qrCode}`
- **Access**: COORDINATOR, ADMINISTRATOR

### Get Attendance by ID
**GET** `/attendance/{id}`

### Get Attendance by Session
**GET** `/attendance/session/{sessionId}`

### Get Attendance by Registration
**GET** `/attendance/registration/{registrationId}`

### Get Attendance by Event
**GET** `/attendance/event/{eventId}`

### Get Session Attendance Count
**GET** `/attendance/session/{sessionId}/count`

### Get Event Attendance Count for Participant
**GET** `/attendance/event/{eventId}/registration/{registrationId}/count`

### Check if Attended
**GET** `/attendance/session/{sessionId}/registration/{registrationId}/check`

### Delete Attendance
**DELETE** `/attendance/{id}`
- **Access**: ADMINISTRATOR

---

## 🛠️ Resource Management

### Create Resource
**POST** `/resources`
- **Access**: ADMINISTRATOR
```json
Request:
{
  "name": "Projector",
  "type": "PROJECTOR",
  "code": "PROJ-001",
  "description": "High-resolution projector",
  "quantity": 3,
  "condition": "Good"
}
```
- Resource Types: PROJECTOR, MICROPHONE, GENERATOR, VEHICLE, TENT, CHAIR, TABLE, SOUND_SYSTEM, SPEAKER, LAPTOP, OTHER

### Update Resource
**PUT** `/resources/{id}`
- **Access**: ADMINISTRATOR, COORDINATOR

### Get Resource by ID
**GET** `/resources/{id}`

### Get All Resources
**GET** `/resources`

### Get Resources by Type
**GET** `/resources/type/{type}`

### Get Available Resources
**GET** `/resources/available`

### Get Available Resources by Type
**GET** `/resources/available/type/{type}`

### Search Resources
**GET** `/resources/search?keyword=projector`

### Delete Resource
**DELETE** `/resources/{id}`
- **Access**: ADMINISTRATOR

### Allocate Resource to Event
**POST** `/resources/allocate`
- **Access**: COORDINATOR, ADMINISTRATOR
```json
Request:
{
  "resourceId": 1,
  "eventId": 1,
  "quantity": 2,
  "allocatedFrom": "2026-08-01T08:00:00",
  "allocatedTo": "2026-08-05T18:00:00",
  "purpose": "Main hall presentations"
}
```

### Get Allocation by ID
**GET** `/resources/allocations/{id}`

### Get Allocations by Resource
**GET** `/resources/{resourceId}/allocations`

### Get Allocations by Event
**GET** `/resources/allocations/event/{eventId}`

### Get Unreturned Allocations
**GET** `/resources/allocations/event/{eventId}/unreturned`
- **Access**: COORDINATOR, ADMINISTRATOR

### Return Resource
**PATCH** `/resources/allocations/{allocationId}/return`
- **Access**: COORDINATOR, ADMINISTRATOR

### Cancel Allocation
**DELETE** `/resources/allocations/{allocationId}`
- **Access**: COORDINATOR, ADMINISTRATOR

---

## 🔔 Notification Management

### Create Notification
**POST** `/notifications`
- **Access**: COORDINATOR, ADMINISTRATOR
```json
Request:
{
  "userId": 5,
  "type": "ANNOUNCEMENT",
  "title": "Camp Schedule Update",
  "message": "Morning devotion time changed to 7:00 AM",
  "eventId": 1
}
```
- Types: ANNOUNCEMENT, SCHEDULE_UPDATE, VENUE_CHANGE, EMERGENCY, ACCOMMODATION_NOTICE, PAYMENT_REMINDER, REGISTRATION_CONFIRMED, RESOURCE_ALLOCATED, GENERAL

### Send Bulk Notification
**POST** `/notifications/bulk`
- **Access**: COORDINATOR, ADMINISTRATOR
```json
Request:
{
  "userIds": [5, 6, 7, 8],
  "type": "ANNOUNCEMENT",
  "title": "Important Notice",
  "message": "All participants must check in by 5 PM",
  "eventId": 1
}
```

### Get Notification by ID
**GET** `/notifications/{id}`

### Get My Notifications
**GET** `/notifications/my-notifications`

### Get Unread Notifications
**GET** `/notifications/unread`

### Get Unread Count
**GET** `/notifications/unread/count`

### Get Notifications by Event
**GET** `/notifications/event/{eventId}`

### Mark as Read
**PATCH** `/notifications/{id}/read`

### Mark All as Read
**PATCH** `/notifications/mark-all-read`

### Delete Notification
**DELETE** `/notifications/{id}`
- **Access**: ADMINISTRATOR

---

## 📱 QR Code Management

### Get Registration QR Code (Image)
**GET** `/qrcode/registration/{registrationId}/image`
- Returns: PNG image

### Get Registration QR Code (Base64)
**GET** `/qrcode/registration/{registrationId}/base64`
```json
Response:
{
  "success": true,
  "data": "iVBORw0KGgoAAAANSUhEUg..."
}
```

### Generate Generic QR Code
**POST** `/qrcode/generate`
```json
Request:
{
  "content": "https://campcoordai.rw/event/1",
  "width": 300,
  "height": 300
}

Response:
{
  "success": true,
  "data": "iVBORw0KGgoAAAANSUhEUg..."
}
```

---

## 📊 Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": "Field-specific error"
  },
  "timestamp": "2026-07-11T10:30:00"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  },
  "timestamp": "2026-07-11T10:30:00"
}
```

---

## 🔒 Authorization Matrix

| Endpoint | ADMINISTRATOR | COORDINATOR | PARTICIPANT |
|----------|--------------|-------------|-------------|
| Create Proposal | ✅ | ✅ | ❌ |
| Approve Proposal | ✅ | ❌ | ❌ |
| Create Event | ✅ | ❌ | ❌ |
| Manage Event | ✅ | ✅ (own) | ❌ |
| Register | ✅ | ✅ | ✅ |
| Verify Payment | ✅ | ✅ | ❌ |
| Assign Accommodation | ✅ | ✅ | ❌ |
| Record Attendance | ✅ | ✅ | ❌ |
| Allocate Resources | ✅ | ✅ | ❌ |
| Send Notifications | ✅ | ✅ | ❌ |
| View Own Data | ✅ | ✅ | ✅ |

---

## 📝 Notes

1. All timestamps are in ISO 8601 format
2. Dates are in format: YYYY-MM-DD
3. DateTimes are in format: YYYY-MM-DDTHH:mm:ss
4. All monetary amounts are in RWF (Rwandan Francs)
5. Phone numbers should include country code (+250)
6. QR codes are generated automatically on registration confirmation
7. Soft delete is used - deleted items are not permanently removed

---

**API Version**: 1.0  
**Last Updated**: July 11, 2026
