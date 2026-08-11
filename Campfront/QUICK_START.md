# CampCoordAI Frontend - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Backend API running on `http://localhost:8080`
- PostgreSQL database configured

### Installation

```bash
# Navigate to frontend directory
cd Campfront

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

---

## 🔑 Test Credentials

### Administrator
- **Email**: `admin@campcoordai.rw`
- **Password**: `Admin@2026`
- **Access**: Full system access

### Coordinator (Youth Leader)
- **Email**: `youth.leader@rum.adventist.org`
- **Password**: `Youth@2026`
- **Access**: Create proposals, manage events

### Participant
- **Email**: `participant@campcoordai.rw`
- **Password**: `Part@2026`
- **Access**: Register for events, view schedule

---

## 📁 Project Structure

```
Campfront/
├── src/
│   ├── api/
│   │   └── index.js              # API configuration & services
│   ├── components/
│   │   ├── layout/               # Layout components
│   │   └── ui/                   # Reusable UI components
│   ├── contexts/
│   │   └── AuthContext.jsx       # Authentication state
│   ├── pages/
│   │   ├── auth/                 # Login, Register
│   │   ├── dashboard/            # Role-based dashboards
│   │   ├── proposals/            # Proposal management
│   │   ├── events/               # Event management
│   │   └── ...                   # Other modules
│   ├── App.jsx                   # Main app with routing
│   └── main.jsx                  # Entry point
├── tailwind.config.js
└── vite.config.js
```

---

## 🎨 Component Usage

### Button
```jsx
import Button from './components/ui/Button';

<Button variant="primary" size="md" loading={loading}>
  Submit
</Button>

// Variants: primary, secondary, success, danger, warning, outline, ghost
// Sizes: xs, sm, md, lg, xl
```

### Card
```jsx
import { Card, CardHeader, CardTitle, CardBody } from './components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Title Here</CardTitle>
  </CardHeader>
  <CardBody>
    Content here
  </CardBody>
</Card>
```

### Form Inputs
```jsx
import Input from './components/ui/Input';
import Select from './components/ui/Select';
import Textarea from './components/ui/Textarea';

<Input
  label="Email"
  type="email"
  value={email}
  onChange={handleChange}
  error={errors.email}
  required
/>

<Select
  label="Role"
  value={role}
  onChange={handleChange}
  options={roleOptions}
  required
/>

<Textarea
  label="Description"
  value={description}
  onChange={handleChange}
  rows={4}
/>
```

### Modal
```jsx
import Modal from './components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  footer={<Button onClick={handleSave}>Save</Button>}
>
  Modal content here
</Modal>
```

### Table
```jsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './components/ui/Table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Alerts & Badges
```jsx
import Alert from './components/ui/Alert';
import Badge from './components/ui/Badge';

<Alert type="success" message="Operation successful!" />
// Types: success, error, warning, info

<Badge variant="success">Active</Badge>
// Variants: default, primary, success, warning, danger, info
```

---

## 🔌 API Integration

### Making API Calls
```jsx
import { proposalApi, eventApi, authApi } from './api';

// Get all proposals
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

// Create proposal
const createProposal = async (data) => {
  try {
    const response = await proposalApi.create(data);
    if (response.data.success) {
      alert('Proposal created successfully');
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Error creating proposal');
  }
};
```

### Authentication
```jsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isAdmin, isCoordinator } = useAuth();

  const handleLogin = async () => {
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div>
      {user && <p>Welcome, {user.firstName}</p>}
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

---

## 🎯 Feature Workflow Examples

### 1. Proposal Workflow

#### Creating a Proposal (Coordinator)
```
1. Navigate to /proposals
2. Click "New Proposal"
3. Fill in the form:
   - Event Name
   - Department
   - Event Type
   - Dates
   - Budget
   - Expected Participants
   - Objectives
   - Required Resources
4. Save as Draft or Submit for Review
```

#### Reviewing a Proposal (Admin)
```
1. Navigate to /proposals
2. Filter by "Submitted" or "Under Review"
3. Click "View" on a proposal
4. Review details
5. Click "Approve", "Reject", or "Request Revision"
6. Provide comments
7. Submit decision
```

### 2. Event Registration Workflow

#### Participant Registration
```
1. Navigate to /events
2. Browse available events
3. Click "Register" on desired event
4. Fill registration form
5. Submit payment details
6. Receive QR code after payment verification
```

#### Check-in at Event
```
1. Show QR code at registration desk
2. Coordinator scans QR code
3. Participant checked in automatically
4. Accommodation details displayed
```

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🌐 Environment Configuration

Create `.env` file in the Campfront directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=CampCoordAI
```

---

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

All components are fully responsive and tested across different screen sizes.

---

## 🎨 Tailwind Utilities

### Custom Classes
```css
.form-input        /* Styled input fields */
.form-label        /* Form labels */
.form-error        /* Error messages */
.card             /* Card container */
.card-header      /* Card header */
.card-body        /* Card body */
.badge            /* Status badges */
.badge-success    /* Success badge */
.badge-warning    /* Warning badge */
.badge-danger     /* Danger badge */
```

---

## 🔐 Protected Routes

Routes are automatically protected based on user roles:

### Public Routes
- `/login`
- `/register`
- `/forgot-password`

### Protected Routes (All Authenticated Users)
- `/dashboard`
- `/proposals`
- `/events`

### Admin Only Routes
- `/users`
- `/departments`
- `/organization`

### Coordinator/Admin Routes
- `/proposals/new`
- `/events/new`
- `/accommodation`
- `/attendance`
- `/resources`

---

## 🐛 Troubleshooting

### CORS Errors
If you get CORS errors, make sure your backend has CORS configured:
```java
// SecurityConfig.java
configuration.setAllowedOriginPatterns(List.of("*"));
```

### API Connection Issues
1. Check backend is running on `http://localhost:8080`
2. Verify `.env` file has correct API URL
3. Check browser console for detailed errors

### 404 Errors
1. Ensure React Router is properly configured
2. Check route paths match exactly
3. Verify protected routes have proper authentication

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)
- [Lucide Icons](https://lucide.dev/)
- [Recharts Documentation](https://recharts.org/)

---

## 🎉 What's Included

✅ Complete authentication system
✅ Role-based dashboards
✅ Proposal management (create, list, review, approve)
✅ Comprehensive UI component library
✅ Responsive design
✅ Form validation
✅ Error handling
✅ Loading states
✅ API integration
✅ Protected routing

---

## 🚧 Next Steps

To complete the full implementation:

1. **Event Module** - Event creation, session management, staff assignment
2. **Registration Module** - Participant registration, payment, QR codes
3. **Accommodation Module** - Building/room management, bed assignment
4. **Attendance Module** - QR scanner, check-in interface
5. **Resource Module** - Resource catalog, allocation tracking
6. **User Management** - Admin user CRUD operations
7. **Reports** - Generate PDF/Excel reports
8. **Notifications** - Real-time notification system

---

## 💬 Support

For questions or issues:
1. Check the documentation
2. Review the code examples
3. Check browser console for errors
4. Verify backend API is running

---

**Happy Coding! 🚀**
