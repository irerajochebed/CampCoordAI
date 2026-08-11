# CampCoordAI - Rwanda Union Mission Camp Management System

A comprehensive digital platform for managing Adventist camps and conferences within the Rwanda Union Mission (RUM).

## 🌟 Features

### Core Functionality
- **Proposal Management**: Department leaders submit, track, and manage event proposals
- **Event Coordination**: Complete event lifecycle management from planning to completion
- **Registration System**: Participant registration with QR code generation
- **Payment Processing**: Payment submission, verification, and tracking
- **Accommodation Management**: Building, room, and bed assignment system
- **Session Management**: Event schedule and speaker coordination
- **Attendance Tracking**: QR code-based check-in system
- **Notifications**: Real-time notifications for event updates
- **Reporting**: Comprehensive reports for attendance, payments, and registrations

### User Roles
- **Administrator**: System administration and proposal approval
- **Coordinator**: Event planning and management
- **Participant**: Event registration and attendance

### Positions
- Union Administrator
- Department Leader
- Field Leader
- Pastor/Local Church Leader
- Finance Officer
- Camp Director
- Camp Secretary
- Speaker
- PA Team
- Accommodation Officer

## 🏗️ Architecture

### Technology Stack
- **Backend**: Spring Boot 4.1.0
- **Language**: Java 17
- **Database**: PostgreSQL
- **Security**: Spring Security with JWT
- **ORM**: JPA/Hibernate
- **QR Code**: ZXing
- **Build Tool**: Maven

### Project Structure
```
src/main/java/com/example/Camp/
├── config/          # Configuration classes
├── controller/      # REST API endpoints
├── dto/             # Data Transfer Objects
├── entity/          # JPA entities
├── enums/           # Enumeration types
├── exception/       # Custom exceptions
├── repository/      # Data access layer
├── security/        # Security configuration
├── service/         # Business logic
└── util/            # Utility classes
```

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- PostgreSQL 12 or higher
- Maven 3.6 or higher

### Database Setup
1. Create PostgreSQL database:
```sql
CREATE DATABASE campcoordai;
```

2. Update `application.properties` with your database credentials:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/campcoordai
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### Running the Application

1. Clone the repository
2. Navigate to project directory
3. Build the project:
```bash
mvn clean install
```

4. Run the application:
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

### Initial Login Credentials

After the first run, the system will seed initial data with these credentials:

- **Administrator**
  - Email: `admin@campcoordai.rw`
  - Password: `Admin@2026`

- **Youth Leader**
  - Email: `youth.leader@rum.adventist.org`
  - Password: `Youth@2026`

- **Field Leader**
  - Email: `kigali.field@rum.adventist.org`
  - Password: `Field@2026`

- **Pastor**
  - Email: `pastor.remera@rum.adventist.org`
  - Password: `Pastor@2026`

- **Participant**
  - Email: `grace.uwera@example.com`
  - Password: `Grace@2026`

## 📡 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Proposal Endpoints
- `POST /api/proposals` - Create proposal
- `GET /api/proposals/{id}` - Get proposal by ID
- `PUT /api/proposals/{id}` - Update proposal
- `PATCH /api/proposals/{id}/submit` - Submit proposal
- `POST /api/proposals/{id}/review` - Review proposal
- `PATCH /api/proposals/{id}/approve` - Approve proposal

### Event Endpoints
- `POST /api/events` - Create event
- `GET /api/events/{id}` - Get event by ID
- `PUT /api/events/{id}` - Update event
- `GET /api/events/upcoming` - Get upcoming events
- `PATCH /api/events/{id}/open-registration` - Open registration
- `POST /api/events/{eventId}/assign-staff` - Assign staff

### Registration Endpoints
- `POST /api/registrations` - Register participant
- `GET /api/registrations/{id}` - Get registration
- `PATCH /api/registrations/{id}/confirm` - Confirm registration
- `POST /api/registrations/{id}/check-in` - Check-in participant
- `POST /api/registrations/check-in/qr/{qrCode}` - QR code check-in

### Payment Endpoints
- `POST /api/payments` - Submit payment
- `GET /api/payments/{id}` - Get payment
- `PATCH /api/payments/{id}/verify` - Verify payment
- `GET /api/payments/event/{eventId}/total` - Get total payments

### QR Code Endpoints
- `GET /api/qrcode/registration/{id}/image` - Get QR code image
- `GET /api/qrcode/registration/{id}/base64` - Get QR code as Base64
- `POST /api/qrcode/generate/image` - Generate QR code from text

### Session Endpoints
- `POST /api/sessions/event/{eventId}` - Create session
- `GET /api/sessions/{id}` - Get session
- `GET /api/sessions/event/{eventId}` - Get event sessions

### Notification Endpoints
- `POST /api/notifications` - Create notification
- `GET /api/notifications/my-notifications` - Get my notifications
- `GET /api/notifications/unread` - Get unread notifications
- `PATCH /api/notifications/{id}/read` - Mark as read

## 🔒 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password encryption with BCrypt
- CORS configuration for frontend integration
- Method-level security with @PreAuthorize

## 📊 Organization Structure

```
Rwanda Union Mission
├── North Rwanda Field
│   ├── Musanze District
│   │   └── Churches (Musanze Central, Ruhengeri)
│   └── Rubavu District
│       └── Churches (Gisenyi)
├── East Rwanda Field
│   ├── Rwamagana District
│   └── Kayonza District
├── South Rwanda Field
│   ├── Huye District
│   └── Nyamagabe District
└── Kigali Field
    ├── Gasabo District
    │   └── Churches (Remera, Kimironko, Nyamirambo)
    └── Kicukiro District
        └── Churches (Kicukiro, Gikondo)
```

## 📋 Workflow

1. **Proposal Stage**
   - Department Leader creates proposal
   - Union Administrator reviews
   - Approve/Reject/Request Revision

2. **Event Creation**
   - Approved proposal becomes event
   - Coordinator sets up sessions, schedule, and resources
   - Staff assignments

3. **Registration**
   - Participants register (self or via pastor)
   - Payment submission
   - Finance verification
   - Registration confirmation with QR code

4. **Event Execution**
   - QR code check-in
   - Session attendance tracking
   - Real-time notifications

5. **Post-Event**
   - Attendance reports
   - Financial reports
   - Event completion

## 🛠️ Development

### Build Commands
```bash
# Clean and build
mvn clean install

# Run tests
mvn test

# Skip tests
mvn clean install -DskipTests

# Generate package
mvn package
```

### Code Structure
- **Entities**: JPA entities with Lombok annotations
- **DTOs**: Request/Response objects with validation
- **Services**: Business logic with @Transactional
- **Controllers**: REST endpoints with security
- **Repositories**: JPA repositories with custom queries

## 📝 License

Copyright © 2026 Rwanda Union Mission. All rights reserved.

## 👥 Contact

For support or inquiries:
- Email: info@rum.adventist.org
- Phone: +250788000000

## 🙏 Acknowledgments

Built for the Seventh-day Adventist Church - Rwanda Union Mission to digitize and streamline camp and conference management.
