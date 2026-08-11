# CampCoordAI Frontend

> A modern React.js frontend for the Adventist Camp and Conference Management System

## 📋 Overview

CampCoordAI Frontend is a comprehensive web application built with React.js, Tailwind CSS, and modern web technologies to provide an intuitive interface for managing Adventist camps and conferences across Rwanda Union Mission.

### Key Features

- 🎨 **Modern UI/UX** - Clean, responsive design with Tailwind CSS
- 🔐 **Secure Authentication** - JWT-based authentication with role-based access
- 📊 **Role-Based Dashboards** - Customized views for Administrators, Coordinators, and Participants
- 📝 **Proposal Management** - Complete workflow from creation to approval
- 📅 **Event Management** - Comprehensive event lifecycle management
- 👥 **User Management** - Advanced user administration
- 🏠 **Accommodation System** - Room and bed assignment
- ✅ **Attendance Tracking** - QR code-based check-in system
- 💰 **Payment Processing** - Payment submission and verification
- 📦 **Resource Management** - Equipment allocation and tracking
- 🔔 **Notifications** - Real-time system notifications
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Backend API running on `http://localhost:8080`

### Installation

```bash
# Clone the repository (if not already done)
git clone <repository-url>

# Navigate to frontend directory
cd Campfront

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will start on `http://localhost:5173`

### Login Credentials

**Administrator**
- Email: `admin@campcoordai.rw`
- Password: `Admin@2026`

**Coordinator**
- Email: `youth.leader@rum.adventist.org`
- Password: `Youth@2026`

**Participant**
- Email: `participant@campcoordai.rw`
- Password: `Part@2026`

---

## 🏗️ Technology Stack

- **React 18** - UI library
- **React Router 6** - Client-side routing
- **Tailwind CSS 3** - Utility-first CSS framework
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Recharts** - Chart library for data visualization
- **Vite** - Build tool and development server

---

## 📁 Project Structure

```
Campfront/
├── public/                      # Static assets
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/
│   │   └── index.js            # API client & all service endpoints
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx      # Top navigation bar
│   │   │   ├── Sidebar.jsx     # Left navigation menu
│   │   │   └── Layout.jsx      # Main layout wrapper
│   │   └── ui/                 # Reusable UI components
│   │       ├── Alert.jsx
│   │       ├── Badge.jsx
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── EmptyState.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       ├── Select.jsx
│   │       ├── Spinner.jsx
│   │       ├── Table.jsx
│   │       ├── Textarea.jsx
│   │       └── index.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx     # Global authentication state
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CoordinatorDashboard.jsx
│   │   │   └── ParticipantDashboard.jsx
│   │   ├── proposals/
│   │   │   ├── ProposalList.jsx
│   │   │   └── ProposalForm.jsx
│   │   ├── events/
│   │   │   └── EventList.jsx
│   │   ├── users/
│   │   │   └── UserList.jsx
│   │   ├── departments/
│   │   │   └── DepartmentList.jsx
│   │   └── organization/
│   │       └── OrganizationTree.jsx
│   ├── App.jsx                 # Main app component with routing
│   ├── main.jsx                # Application entry point
│   └── index.css               # Global styles with Tailwind
├── .env                        # Environment variables
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── README.md
```

---

## 🎨 UI Components Library

### Core Components

#### Button
```jsx
<Button variant="primary" size="md" loading={false}>
  Click Me
</Button>
```
**Variants**: primary, secondary, success, danger, warning, outline, ghost  
**Sizes**: xs, sm, md, lg, xl

#### Card
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Footer</CardFooter>
</Card>
```

#### Form Components
- **Input** - Text inputs with labels, errors, and icons
- **Select** - Dropdown selects with validation
- **Textarea** - Multi-line text inputs

#### Data Display
- **Table** - Responsive data tables
- **Badge** - Status indicators
- **EmptyState** - No data placeholders

#### Feedback
- **Alert** - Success, error, warning, info alerts
- **Spinner** - Loading indicators
- **Modal** - Dialog modals

---

## 🔐 Authentication & Authorization

### Authentication Flow
1. User logs in with email/password
2. Backend returns JWT token
3. Token stored in localStorage
4. Token automatically attached to all API requests
5. User data cached in AuthContext

### Role-Based Access Control

**Administrator**
- Full system access
- User management
- Proposal approval
- Event creation
- Department & organization management

**Coordinator**
- Create and manage proposals
- Manage assigned events
- Registration management
- Accommodation assignment
- Attendance tracking
- Resource allocation

**Participant**
- Browse events
- Register for events
- Submit payments
- View QR codes
- Track attendance
- View personal schedule

---

## 🌐 API Integration

All API endpoints are pre-configured in `src/api/index.js`:

### Available API Services

- **authApi** - Authentication (login, register, change password)
- **userApi** - User management
- **proposalApi** - Proposal CRUD operations
- **eventApi** - Event management
- **sessionApi** - Session management
- **registrationApi** - Registration management
- **paymentApi** - Payment processing
- **accommodationApi** - Accommodation & room management
- **attendanceApi** - Attendance tracking
- **resourceApi** - Resource management
- **notificationApi** - Notifications
- **qrCodeApi** - QR code generation
- **departmentApi** - Department management
- **organizationApi** - Organization hierarchy

### Example Usage

```jsx
import { proposalApi } from './api';

const fetchProposals = async () => {
  try {
    const response = await proposalApi.getAll();
    if (response.data.success) {
      setProposals(response.data.data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 📊 Dashboard Features

### Admin Dashboard
- System statistics (users, events, proposals, revenue)
- Event overview chart (Bar chart)
- Participant growth chart (Line chart)
- Recent proposals list
- Upcoming events
- Quick actions (review proposals, add users, create events)

### Coordinator Dashboard
- My events overview
- Proposal tracking
- Pending tasks list
- Participant statistics
- Quick actions (create proposal, manage registrations, assign rooms, track attendance)

### Participant Dashboard
- My registrations
- Event details with QR codes
- Today's schedule
- Accommodation information
- Recent notifications
- Quick stats

---

## 🎯 Key Workflows

### 1. Proposal Creation & Approval
1. Coordinator creates proposal
2. Fills in event details, budget, objectives
3. Submits for review
4. Admin reviews and approves/rejects/requests revision
5. Upon approval, event is automatically created

### 2. Event Registration
1. Participant browses available events
2. Clicks register
3. Fills registration form
4. Submits payment
5. Finance officer verifies payment
6. QR code generated upon confirmation

### 3. Accommodation Assignment
1. Coordinator creates buildings and rooms
2. Assigns participants to rooms
3. Participants view accommodation details
4. Check-in using QR code

### 4. Attendance Tracking
1. Participant shows QR code
2. Coordinator scans QR code
3. Attendance automatically recorded
4. Real-time attendance reports

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=CampCoordAI
```

---

## 🎨 Design System

### Colors
- **Primary**: #0ea5e9 (Sky Blue)
- **Adventist Blue**: #003DA5
- **Adventist Gold**: #F5A623
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Amber)
- **Danger**: #ef4444 (Red)

### Typography
- **Font**: Inter, system-ui, sans-serif
- **Heading Sizes**: 2xl, xl, lg
- **Body Sizes**: base, sm, xs

### Spacing
- **Base Unit**: 0.25rem (4px)
- **Common Gaps**: gap-4 (1rem), gap-6 (1.5rem)

---

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

All components adapt seamlessly across devices.

---

## ✅ Implementation Status

### Completed ✅
- ✅ Project setup with Vite + React
- ✅ Tailwind CSS configuration
- ✅ Complete UI component library (11 components)
- ✅ Authentication system (Login, Register, Forgot Password)
- ✅ Layout components (Header, Sidebar)
- ✅ Role-based dashboards (Admin, Coordinator, Participant)
- ✅ Complete API integration layer
- ✅ Proposal module (List, Create, Review, Approve)
- ✅ Protected routing system
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states

### In Progress 🚧
- 🚧 Event module (List, Create, Manage, Sessions)
- 🚧 Registration module (Register, Payment, QR Code)
- 🚧 User management (CRUD operations)
- 🚧 Department management
- 🚧 Organization tree view

### Planned 📋
- 📋 Accommodation module
- 📋 Attendance tracking with QR scanner
- 📋 Resource management
- 📋 Notification system
- 📋 Reports and analytics
- 📋 Export functionality (PDF, Excel)
- 📋 Email integration
- 📋 SMS notifications

---

## 🐛 Known Issues

None currently. Please report issues as they are discovered.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

© 2026 Rwanda Union Mission. All rights reserved.

---

## 📞 Support

For questions or support:
- Check the documentation
- Review code examples in `QUICK_START.md`
- Review full implementation details in `FRONTEND_IMPLEMENTATION_COMPLETE.md`

---

## 🎉 Acknowledgments

Built with ❤️ for the Seventh-day Adventist Church Rwanda Union Mission

**Version**: 1.0.0  
**Last Updated**: July 12, 2026
