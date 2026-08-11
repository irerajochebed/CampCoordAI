# CampCoordAI - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- ✅ Java 17 or higher installed
- ✅ PostgreSQL 12 or higher installed
- ✅ Maven 3.6 or higher installed
- ✅ IDE (IntelliJ IDEA, Eclipse, or VS Code with Java extensions)

---

## Step 1: Database Setup

### Create Database
```sql
-- Open PostgreSQL command line or pgAdmin
CREATE DATABASE campcoordai;
```

### Configure Database Connection
Open `src/main/resources/application.properties` and update:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/campcoordai
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

---

## Step 2: Build the Project

```bash
# Navigate to project directory
cd c:\All_Vscode_project\Camp

# Clean and build
mvn clean install
```

---

## Step 3: Run the Application

```bash
mvn spring-boot:run
```

Or run `CampApplication.java` from your IDE.

The application will start on **http://localhost:8080**

---

## Step 4: Verify Initial Data

On first run, the system automatically seeds initial data. Check console for:

```
=== DEFAULT LOGIN CREDENTIALS ===
Administrator - Email: admin@campcoordai.rw, Password: Admin@2026
Youth Leader - Email: youth.leader@rum.adventist.org, Password: Youth@2026
Field Leader - Email: kigali.field@rum.adventist.org, Password: Field@2026
Pastor - Email: pastor.remera@rum.adventist.org, Password: Pastor@2026
Participant - Email: grace.uwera@example.com, Password: Grace@2026
================================
```

---

## Step 5: Test the API

### Using cURL

#### 1. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@campcoordai.rw\",\"password\":\"Admin@2026\"}"
```

Response:
```json
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

#### 2. Get Current User (use token from login)
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 3. Get All Events
```bash
curl -X GET http://localhost:8080/api/events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. **Import Collection**: Create a new collection named "CampCoordAI"
2. **Set Base URL**: `http://localhost:8080`
3. **Login Request**:
   - Method: POST
   - URL: `{{baseUrl}}/api/auth/login`
   - Body (raw JSON):
   ```json
   {
     "email": "admin@campcoordai.rw",
     "password": "Admin@2026"
   }
   ```
4. **Save Token**: Copy the token from response
5. **Set Authorization**: For subsequent requests, add header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN_HERE`

---

## 📚 Key API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Proposals
- `POST /api/proposals` - Create proposal (COORDINATOR)
- `GET /api/proposals` - Get all proposals
- `PATCH /api/proposals/{id}/submit` - Submit proposal
- `PATCH /api/proposals/{id}/approve` - Approve proposal (ADMIN)

### Events
- `POST /api/events` - Create event
- `GET /api/events/upcoming` - Get upcoming events
- `PATCH /api/events/{id}/open-registration` - Open registration
- `POST /api/events/{eventId}/assign-staff` - Assign staff

### Registrations
- `POST /api/registrations` - Register participant
- `PATCH /api/registrations/{id}/confirm` - Confirm registration
- `POST /api/registrations/{id}/check-in` - Check-in participant
- `POST /api/registrations/check-in/qr/{qrCode}` - QR check-in

### Payments
- `POST /api/payments` - Submit payment
- `PATCH /api/payments/{id}/verify` - Verify payment (COORDINATOR/ADMIN)

### Accommodation
- `POST /api/accommodations/event/{eventId}` - Create accommodation
- `POST /api/accommodations/{accommodationId}/rooms` - Add room
- `POST /api/accommodations/assign` - Assign room to participant

### Attendance
- `POST /api/attendance/session/{sessionId}/registration/{registrationId}` - Record attendance
- `POST /api/attendance/session/{sessionId}/qr-scan?qrCode=XXX` - QR scan check-in

### Resources
- `POST /api/resources` - Create resource (ADMIN)
- `POST /api/resources/allocate` - Allocate resource to event
- `PATCH /api/resources/allocations/{id}/return` - Return resource

### Notifications
- `POST /api/notifications` - Create notification
- `GET /api/notifications/my-notifications` - Get my notifications
- `GET /api/notifications/unread` - Get unread notifications

### QR Codes
- `GET /api/qrcode/registration/{id}/image` - Get QR image
- `GET /api/qrcode/registration/{id}/base64` - Get QR as Base64

---

## 🧪 Testing Workflow

### Complete Event Flow Test

1. **Login as Admin**
```json
POST /api/auth/login
{
  "email": "admin@campcoordai.rw",
  "password": "Admin@2026"
}
```

2. **Login as Department Leader** (Youth Leader)
```json
POST /api/auth/login
{
  "email": "youth.leader@rum.adventist.org",
  "password": "Youth@2026"
}
```

3. **Create Proposal** (as Youth Leader)
```json
POST /api/proposals
{
  "eventName": "Youth Camp 2026",
  "eventType": "CAMP",
  "departmentId": 1,
  "objectives": "Spiritual growth and fellowship",
  "startDate": "2026-08-01",
  "endDate": "2026-08-05",
  "venue": "Rubavu Campsite",
  "expectedParticipants": 200,
  "estimatedBudget": 5000000,
  "requiredResources": "Tents, Sound system, Projector"
}
```

4. **Submit Proposal** (as Youth Leader)
```json
PATCH /api/proposals/1/submit
```

5. **Approve Proposal** (as Admin)
```json
PATCH /api/proposals/1/approve
```

6. **Create Event from Proposal** (as Admin)
```json
POST /api/events/from-proposal/1?coordinatorId=2
```

7. **Open Registration** (as Coordinator)
```json
PATCH /api/events/1/open-registration
```

8. **Register Participant** (as Pastor)
```json
POST /api/registrations
{
  "eventId": 1,
  "participantId": 5,
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "+250788999999"
}
```

9. **Submit Payment** (as Participant)
```json
POST /api/payments
{
  "registrationId": 1,
  "amount": 25000,
  "paymentMethod": "MOBILE_MONEY",
  "transactionReference": "MTN-202608-123456"
}
```

10. **Verify Payment** (as Finance Officer/Coordinator)
```json
PATCH /api/payments/1/verify
```

11. **Confirm Registration** (as Coordinator)
```json
PATCH /api/registrations/1/confirm
```

12. **Create Accommodation** (as Coordinator)
```json
POST /api/accommodations/event/1
{
  "buildingName": "Building A",
  "buildingCode": "BA-001",
  "location": "Main Camp Area"
}
```

13. **Add Rooms** (as Coordinator)
```json
POST /api/accommodations/1/rooms
{
  "roomNumber": "101",
  "capacity": 4,
  "genderRestriction": "MALE"
}
```

14. **Assign Room** (as Coordinator)
```json
POST /api/accommodations/assign
{
  "roomId": 1,
  "registrationId": 1,
  "bedNumber": "1",
  "checkInDate": "2026-08-01"
}
```

15. **Create Session** (as Coordinator)
```json
POST /api/sessions/event/1
{
  "title": "Morning Devotion",
  "type": "MORNING_DEVOTION",
  "startTime": "2026-08-01T07:00:00",
  "endTime": "2026-08-01T08:00:00",
  "venue": "Main Hall"
}
```

16. **Record Attendance via QR** (as Camp Secretary)
```json
POST /api/attendance/session/1/qr-scan?qrCode=REG-20260801-ABC123
```

---

## 🔑 User Roles and Permissions

### Administrator
- Full system access
- Approve/reject proposals
- Create events from proposals
- Manage users
- View all reports

### Coordinator (Department Leaders, Field Leaders, Pastors)
- Create proposals
- Manage assigned events
- Verify payments
- Assign accommodation
- Assign staff
- Record attendance

### Participant
- View events
- Register for events
- View own registrations
- View own notifications

---

## 📊 Sample Data

The system includes:
- **1 Union**: Rwanda Union Mission
- **4 Fields**: North, East, South, Kigali
- **8 Districts**: 2 per field
- **12 Churches**: Sample churches
- **10 Departments**: All church departments
- **5 Users**: Admin, Youth Leader, Field Leader, Pastor, Participant

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Connection refused
```
**Solution**: Ensure PostgreSQL is running and credentials are correct

### Port Already in Use
```
Error: Port 8080 is already in use
```
**Solution**: Stop other applications or change port in `application.properties`:
```properties
server.port=8081
```

### JWT Token Expired
```
Error: Unauthorized
```
**Solution**: Login again to get a new token

### Maven Build Failed
```
Error: BUILD FAILURE
```
**Solution**: Run `mvn clean install` to download dependencies

---

## 📞 Support

For issues or questions:
- Check the logs in console
- Review `application.properties` configuration
- Verify database is running
- Ensure all Maven dependencies are downloaded

---

## ✅ Success Indicators

You know it's working when:
- ✅ Application starts without errors
- ✅ Console shows "Started CampApplication"
- ✅ Login returns JWT token
- ✅ Initial data is seeded (check console)
- ✅ API endpoints respond correctly

---

**You're all set! Start building amazing camp management experiences! 🎉**
