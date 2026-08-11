# CampCoordAI - Testing Guide

## 🧪 Complete Testing Workflow

This guide walks you through testing all major features of CampCoordAI using real-world scenarios.

---

## Prerequisites

- ✅ Application running on `http://localhost:8080`
- ✅ PostgreSQL database configured
- ✅ Initial data seeded (run application once)
- ✅ Postman, Insomnia, or cURL installed

---

## Test Scenario: Complete Event Lifecycle

### Phase 1: User Authentication

#### Test 1.1: Administrator Login
```bash
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "admin@campcoordai.rw",
  "password": "Admin@2026"
}
```

**Expected Result**:
- Status: 200 OK
- Returns JWT token
- User role: ADMINISTRATOR
- Position: UNION_ADMINISTRATOR

**Save**: Copy the token to use in subsequent requests

#### Test 1.2: Department Leader Login
```bash
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "youth.leader@rum.adventist.org",
  "password": "Youth@2026"
}
```

**Expected Result**:
- Status: 200 OK
- Returns JWT token
- User role: COORDINATOR
- Position: DEPARTMENT_LEADER

#### Test 1.3: Get Current User
```bash
GET http://localhost:8080/api/auth/me
Authorization: Bearer <your_token>
```

**Expected Result**:
- Returns current user details
- Includes organization information

---

### Phase 2: Proposal Creation and Approval

#### Test 2.1: Create Proposal (as Youth Leader)
```bash
POST http://localhost:8080/api/proposals
Authorization: Bearer <youth_leader_token>
Content-Type: application/json

{
  "eventName": "Youth Camp 2026 - Rising Generation",
  "eventType": "CAMP",
  "departmentId": 1,
  "objectives": "To empower young people with spiritual knowledge and leadership skills through interactive workshops, devotional sessions, and team building activities",
  "startDate": "2026-08-01",
  "endDate": "2026-08-05",
  "venue": "Rubavu Lakeside Campsite",
  "expectedParticipants": 250,
  "estimatedBudget": 6250000,
  "requiredResources": "Tents (50), Sound system (2 sets), Projectors (3), Generators (2), Chairs (300), Tables (30), First aid kit, Sports equipment"
}
```

**Expected Result**:
- Status: 200 OK
- Proposal created with status: DRAFT
- proposalId returned (save this)

#### Test 2.2: Get My Proposals
```bash
GET http://localhost:8080/api/proposals/my-proposals
Authorization: Bearer <youth_leader_token>
```

**Expected Result**:
- Returns list with newly created proposal

#### Test 2.3: Submit Proposal
```bash
PATCH http://localhost:8080/api/proposals/1/submit
Authorization: Bearer <youth_leader_token>
```

**Expected Result**:
- Status: 200 OK
- Proposal status changes to: SUBMITTED

#### Test 2.4: Get Pending Proposals (as Admin)
```bash
GET http://localhost:8080/api/proposals/status/SUBMITTED
Authorization: Bearer <admin_token>
```

**Expected Result**:
- Returns submitted proposals awaiting review

#### Test 2.5: Approve Proposal (as Admin)
```bash
PATCH http://localhost:8080/api/proposals/1/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "comments": "Excellent proposal. Budget approved. Proceed with event planning."
}
```

**Expected Result**:
- Status: 200 OK
- Proposal status: APPROVED
- ProposalReview created with status APPROVED

#### Test 2.6 (Alternative): Reject Proposal
```bash
PATCH http://localhost:8080/api/proposals/1/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "comments": "Budget exceeds allocated funds for youth department"
}
```

#### Test 2.7 (Alternative): Request Revision
```bash
PATCH http://localhost:8080/api/proposals/1/request-revision
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "comments": "Please provide detailed accommodation breakdown and list of confirmed speakers"
}
```

---

### Phase 3: Event Creation

#### Test 3.1: Create Event from Approved Proposal
```bash
POST http://localhost:8080/api/events/from-proposal/1?coordinatorId=2
Authorization: Bearer <admin_token>
```

**Expected Result**:
- Status: 200 OK
- Event created with status: PLANNED
- Event code generated (e.g., EVT-20260801-ABC123)
- Coordinator assigned

#### Test 3.2: Get Event Details
```bash
GET http://localhost:8080/api/events/1
Authorization: Bearer <any_valid_token>
```

**Expected Result**:
- Returns complete event details
- Includes coordinator information
- Status: PLANNED

#### Test 3.3: Assign Camp Director
```bash
POST http://localhost:8080/api/events/1/assign-staff
Authorization: Bearer <coordinator_token>
Content-Type: application/json

{
  "userId": 4,
  "position": "CAMP_DIRECTOR",
  "responsibilities": "Overall camp coordination, schedule management, emergency handling"
}
```

**Expected Result**:
- Staff assigned successfully
- EventAssignment created

#### Test 3.4: Assign Multiple Staff
```bash
# Camp Secretary
POST http://localhost:8080/api/events/1/assign-staff
Authorization: Bearer <coordinator_token>
Content-Type: application/json

{
  "userId": 5,
  "position": "CAMP_SECRETARY",
  "responsibilities": "Attendance tracking, documentation, participant check-in"
}

# Finance Officer
POST http://localhost:8080/api/events/1/assign-staff
Content-Type: application/json

{
  "userId": 6,
  "position": "FINANCE_OFFICER",
  "responsibilities": "Payment verification, financial reporting"
}
```

#### Test 3.5: Get Event Staff
```bash
GET http://localhost:8080/api/events/1/staff
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Returns list of all assigned staff
- Shows positions and responsibilities

---

### Phase 4: Event Setup

#### Test 4.1: Create Sessions
```bash
# Morning Devotion
POST http://localhost:8080/api/sessions/event/1
Authorization: Bearer <coordinator_token>
Content-Type: application/json

{
  "title": "Morning Devotion - Day 1",
  "type": "MORNING_DEVOTION",
  "description": "Opening worship service",
  "startTime": "2026-08-01T07:00:00",
  "endTime": "2026-08-01T08:00:00",
  "venue": "Main Hall",
  "capacity": 250,
  "speakerId": 4
}

# Plenary Session
POST http://localhost:8080/api/sessions/event/1
Content-Type: application/json

{
  "title": "Youth Leadership in the 21st Century",
  "type": "PLENARY",
  "description": "Keynote presentation on modern youth leadership",
  "startTime": "2026-08-01T10:00:00",
  "endTime": "2026-08-01T12:00:00",
  "venue": "Main Hall",
  "capacity": 250,
  "speakerId": 4
}

# Workshop
POST http://localhost:8080/api/sessions/event/1
Content-Type: application/json

{
  "title": "Digital Evangelism Workshop",
  "type": "WORKSHOP",
  "description": "Using social media for ministry",
  "startTime": "2026-08-01T14:00:00",
  "endTime": "2026-08-01T16:00:00",
  "venue": "Workshop Room A",
  "capacity": 50,
  "speakerId": 7
}
```

#### Test 4.2: Get Event Sessions
```bash
GET http://localhost:8080/api/sessions/event/1
Authorization: Bearer <any_valid_token>
```

**Expected Result**:
- Returns all sessions for the event
- Ordered by startTime

#### Test 4.3: Create Accommodation Buildings
```bash
# Building A - Male
POST http://localhost:8080/api/accommodations/event/1
Authorization: Bearer <coordinator_token>
Content-Type: application/json

{
  "buildingName": "Building A - Male Block",
  "buildingCode": "BA-M-001",
  "location": "East Side of Camp",
  "description": "Main male accommodation block with 10 rooms"
}

# Building B - Female
POST http://localhost:8080/api/accommodations/event/1
Content-Type: application/json

{
  "buildingName": "Building B - Female Block",
  "buildingCode": "BB-F-001",
  "location": "West Side of Camp",
  "description": "Main female accommodation block with 10 rooms"
}
```

#### Test 4.4: Add Rooms to Buildings
```bash
# Male Building Rooms (Room 101-105)
POST http://localhost:8080/api/accommodations/1/rooms
Authorization: Bearer <coordinator_token>
Content-Type: application/json

{
  "roomNumber": "101",
  "capacity": 4,
  "genderRestriction": "MALE",
  "floor": 1,
  "amenities": "4 Beds, Fan, Windows, Lockers"
}

# Repeat for rooms 102-105 (change roomNumber)

# Female Building Rooms
POST http://localhost:8080/api/accommodations/2/rooms
Content-Type: application/json

{
  "roomNumber": "201",
  "capacity": 4,
  "genderRestriction": "FEMALE",
  "floor": 2,
  "amenities": "4 Beds, Fan, Windows, Lockers"
}
```

#### Test 4.5: Create Resources
```bash
POST http://localhost:8080/api/resources
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "High-Resolution Projector",
  "type": "PROJECTOR",
  "code": "PROJ-001",
  "description": "Epson 5000 lumens projector",
  "quantity": 3,
  "condition": "Excellent"
}

POST http://localhost:8080/api/resources
Content-Type: application/json

{
  "name": "Wireless Microphone Set",
  "type": "MICROPHONE",
  "code": "MIC-001",
  "description": "Shure wireless microphone system with 4 handhelds",
  "quantity": 2,
  "condition": "Good"
}

POST http://localhost:8080/api/resources
Content-Type: application/json

{
  "name": "Generator 10KVA",
  "type": "GENERATOR",
  "code": "GEN-001",
  "description": "Honda 10KVA diesel generator",
  "quantity": 2,
  "condition": "Good"
}
```

#### Test 4.6: Allocate Resources to Event
```bash
POST http://localhost:8080/api/resources/allocate
Authorization: Bearer <coordinator_token>
Content-Type: application/json

{
  "resourceId": 1,
  "eventId": 1,
  "quantity": 2,
  "allocatedFrom": "2026-08-01T08:00:00",
  "allocatedTo": "2026-08-05T18:00:00",
  "purpose": "Main hall and workshop presentations"
}

POST http://localhost:8080/api/resources/allocate
Content-Type: application/json

{
  "resourceId": 2,
  "eventId": 1,
  "quantity": 1,
  "allocatedFrom": "2026-08-01T08:00:00",
  "allocatedTo": "2026-08-05T18:00:00",
  "purpose": "Main hall sound system"
}
```

#### Test 4.7: Open Registration
```bash
PATCH http://localhost:8080/api/events/1/open-registration
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Event status changes to: REGISTRATION_OPEN
- Participants can now register

---

### Phase 5: Participant Registration

#### Test 5.1: Register Participant
```bash
POST http://localhost:8080/api/registrations
Authorization: Bearer <participant_token>
Content-Type: application/json

{
  "eventId": 1,
  "participantId": 5,
  "emergencyContactName": "Grace Uwera Parent",
  "emergencyContactPhone": "+250788555666",
  "emergencyContactRelationship": "Mother",
  "specialRequirements": "Vegetarian meals",
  "medicalInfo": "No known allergies"
}
```

**Expected Result**:
- Status: 200 OK
- Registration created with status: PENDING
- Registration number generated (REG-yyyyMMdd-XXXXXX)

#### Test 5.2: Register Multiple Participants (Pastor registering members)
```bash
POST http://localhost:8080/api/registrations
Authorization: Bearer <pastor_token>
Content-Type: application/json

{
  "eventId": 1,
  "participantId": 8,
  "emergencyContactName": "John Parent",
  "emergencyContactPhone": "+250788777888",
  "emergencyContactRelationship": "Father"
}
```

#### Test 5.3: Get Event Registrations
```bash
GET http://localhost:8080/api/registrations/event/1
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Returns all registrations for event
- Shows status, participant info

#### Test 5.4: Get Pending Registrations
```bash
GET http://localhost:8080/api/registrations/event/1/status/PENDING
Authorization: Bearer <coordinator_token>
```

---

### Phase 6: Payment Processing

#### Test 6.1: Submit Payment
```bash
POST http://localhost:8080/api/payments
Authorization: Bearer <participant_token>
Content-Type: application/json

{
  "registrationId": 1,
  "amount": 25000,
  "paymentMethod": "MOBILE_MONEY",
  "transactionReference": "MTN-20260715-ABC123456",
  "paidBy": "Grace Uwera",
  "notes": "Paid via MTN Mobile Money"
}
```

**Expected Result**:
- Payment created with status: PENDING
- PaymentId returned

#### Test 6.2: Get Pending Payments
```bash
GET http://localhost:8080/api/payments/event/1/pending
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Returns payments awaiting verification

#### Test 6.3: Verify Payment
```bash
PATCH http://localhost:8080/api/payments/1/verify
Authorization: Bearer <coordinator_token>
Content-Type: application/json

{
  "notes": "Payment confirmed in MTN account"
}
```

**Expected Result**:
- Payment status: VERIFIED
- Registration status automatically updates to CONFIRMED

#### Test 6.4: Get Financial Totals
```bash
GET http://localhost:8080/api/payments/event/1/total
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
```json
{
  "success": true,
  "data": 25000
}
```

---

### Phase 7: Accommodation Assignment

#### Test 7.1: Get Available Rooms
```bash
GET http://localhost:8080/api/accommodations/1/rooms/available
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Returns rooms with available capacity

#### Test 7.2: Assign Room to Participant
```bash
POST http://localhost:8080/api/accommodations/assign
Authorization: Bearer <coordinator_token>
Content-Type: application/json

{
  "roomId": 1,
  "registrationId": 1,
  "bedNumber": "1",
  "checkInDate": "2026-08-01",
  "checkOutDate": "2026-08-05",
  "notes": "Near exit door as requested"
}
```

**Expected Result**:
- Room assigned successfully
- Bed marked as occupied
- Participant can view accommodation

#### Test 7.3: Get Participant's Accommodation
```bash
GET http://localhost:8080/api/accommodations/assignments/registration/1
Authorization: Bearer <participant_token>
```

**Expected Result**:
- Returns room details
- Building, room number, bed number

#### Test 7.4: Get Room Occupancy
```bash
GET http://localhost:8080/api/accommodations/rooms/1/assignments
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Shows all participants in the room
- Bed assignments

#### Test 7.5: Get Event Capacity Status
```bash
GET http://localhost:8080/api/accommodations/event/1/capacity
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "totalCapacity": 40,
    "occupied": 1,
    "available": 39
  }
}
```

---

### Phase 8: QR Code Generation

#### Test 8.1: Get Registration QR Code (Base64)
```bash
GET http://localhost:8080/api/qrcode/registration/1/base64
Authorization: Bearer <any_valid_token>
```

**Expected Result**:
- Returns Base64 encoded QR code string
- Can be embedded in HTML/Email

#### Test 8.2: Get Registration QR Code (Image)
```bash
GET http://localhost:8080/api/qrcode/registration/1/image
Authorization: Bearer <any_valid_token>
```

**Expected Result**:
- Returns PNG image
- Content-Type: image/png
- Can be downloaded or displayed

---

### Phase 9: Event Execution - Check-in

#### Test 9.1: Manual Check-in
```bash
POST http://localhost:8080/api/registrations/1/check-in
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Registration status: CHECKED_IN
- Check-in timestamp recorded

#### Test 9.2: QR Code Check-in
```bash
POST http://localhost:8080/api/registrations/check-in/qr/REG-20260801-ABC123
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Participant checked in via QR scan
- Registration status: CHECKED_IN

#### Test 9.3: Get Checked-in Participants
```bash
GET http://localhost:8080/api/registrations/event/1/status/CHECKED_IN
Authorization: Bearer <coordinator_token>
```

---

### Phase 10: Attendance Tracking

#### Test 10.1: Record Session Attendance (Manual)
```bash
POST http://localhost:8080/api/attendance/session/1/registration/1
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Attendance recorded
- Check-in method: MANUAL
- Timestamp recorded

#### Test 10.2: Record Attendance via QR Scan
```bash
POST http://localhost:8080/api/attendance/session/1/qr-scan?qrCode=REG-20260801-ABC123
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Attendance recorded
- Check-in method: QR_SCAN
- Timestamp recorded

#### Test 10.3: Get Session Attendance List
```bash
GET http://localhost:8080/api/attendance/session/1
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Returns all attendees for session
- Shows check-in time and method

#### Test 10.4: Get Session Attendance Count
```bash
GET http://localhost:8080/api/attendance/session/1/count
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
```json
{
  "success": true,
  "data": 1
}
```

#### Test 10.5: Get Participant's Event Attendance
```bash
GET http://localhost:8080/api/attendance/registration/1
Authorization: Bearer <participant_token>
```

**Expected Result**:
- Returns all sessions attended by participant

---

### Phase 11: Notifications

#### Test 11.1: Send Single Notification
```bash
POST http://localhost:8080/api/notifications
Authorization: Bearer <coordinator_token>
Content-Type: application/json

{
  "userId": 5,
  "type": "SCHEDULE_UPDATE",
  "title": "Schedule Change",
  "message": "Workshop session moved from Room A to Main Hall",
  "eventId": 1
}
```

#### Test 11.2: Send Bulk Notification to All Participants
```bash
POST http://localhost:8080/api/notifications/bulk
Authorization: Bearer <coordinator_token>
Content-Type: application/json

{
  "userIds": [5, 8, 9, 10],
  "type": "ANNOUNCEMENT",
  "title": "Important: Weather Alert",
  "message": "Heavy rain expected this evening. All outdoor activities moved indoors.",
  "eventId": 1
}
```

#### Test 11.3: Get My Notifications
```bash
GET http://localhost:8080/api/notifications/my-notifications
Authorization: Bearer <participant_token>
```

**Expected Result**:
- Returns all notifications for user
- Ordered by most recent

#### Test 11.4: Get Unread Notifications
```bash
GET http://localhost:8080/api/notifications/unread
Authorization: Bearer <participant_token>
```

#### Test 11.5: Get Unread Count
```bash
GET http://localhost:8080/api/notifications/unread/count
Authorization: Bearer <participant_token>
```

**Expected Result**:
```json
{
  "success": true,
  "data": 2
}
```

#### Test 11.6: Mark Notification as Read
```bash
PATCH http://localhost:8080/api/notifications/1/read
Authorization: Bearer <participant_token>
```

---

### Phase 12: Event Completion

#### Test 12.1: Close Registration
```bash
PATCH http://localhost:8080/api/events/1/close-registration
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Event status: REGISTRATION_CLOSED
- No new registrations allowed

#### Test 12.2: Start Event
```bash
PATCH http://localhost:8080/api/events/1/start
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Event status: ONGOING

#### Test 12.3: Complete Event
```bash
PATCH http://localhost:8080/api/events/1/complete
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Event status: COMPLETED

#### Test 12.4: Return Resources
```bash
PATCH http://localhost:8080/api/resources/allocations/1/return
Authorization: Bearer <coordinator_token>
```

**Expected Result**:
- Resource marked as returned
- Available quantity updated

---

## 🎯 Test Results Checklist

### ✅ Expected Outcomes

- [ ] Admin can login successfully
- [ ] Department leader can create proposals
- [ ] Proposals can be submitted and approved
- [ ] Events are created from approved proposals
- [ ] Event staff can be assigned
- [ ] Sessions can be created for events
- [ ] Buildings and rooms can be set up
- [ ] Resources can be allocated to events
- [ ] Registration opens successfully
- [ ] Participants can register
- [ ] Payments can be submitted and verified
- [ ] Rooms can be assigned to participants
- [ ] QR codes are generated for confirmed registrations
- [ ] Check-in works (manual and QR)
- [ ] Session attendance can be recorded
- [ ] Notifications can be sent to participants
- [ ] Event can be completed
- [ ] Resources can be returned

---

## 🐛 Common Issues and Solutions

### Issue: JWT Token Expired
**Solution**: Login again to get new token

### Issue: Resource Not Found
**Solution**: Verify IDs exist in database

### Issue: Unauthorized Access
**Solution**: Check user role and permissions

### Issue: Validation Error
**Solution**: Check required fields and data formats

### Issue: Business Rule Violation
**Solution**: Check prerequisites (e.g., proposal must be approved before creating event)

---

## 📊 Performance Testing

### Load Test Scenarios

1. **Concurrent Registrations**: 50 simultaneous registrations
2. **QR Code Generation**: Generate 100 QR codes
3. **Bulk Notifications**: Send to 500 participants
4. **Attendance Recording**: 200 QR scans in 5 minutes

---

## 🎉 Testing Complete!

If all tests pass, your CampCoordAI backend is fully functional and ready for production deployment!
