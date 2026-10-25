import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NAV_KEYS, isNavAllowed } from './utils/navigationPermissions';

// Layout
import Layout from './components/layout/Layout';

// Landing Page
import LandingPage from './pages/LandingPage';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import CoordinatorDashboard from './pages/dashboard/CoordinatorDashboard';
import ParticipantDashboard from './pages/dashboard/ParticipantDashboard';
import MediaPADashboard from './pages/dashboard/MediaPADashboard';

// Proposal Pages
import ProposalList from './pages/proposals/ProposalList';
import ProposalForm from './pages/proposals/ProposalForm';
import ProposalDetail from './pages/proposals/ProposalDetail';

// Event Pages
import EventList from './pages/events/EventList';
import EventDetail from './pages/events/EventDetail';
import EventForm from './pages/events/EventForm';
import SessionManagement from './pages/events/SessionManagement';
import StaffAssignment from './pages/events/StaffAssignment';

// Registration Pages
import RegistrationList from './pages/registrations/RegistrationList';
import RegistrationDetail from './pages/registrations/RegistrationDetail';
import RegistrationForm from './pages/registrations/RegistrationForm';
import CheckInManagement from './pages/registrations/CheckInManagement';

// Accommodation Pages
import AccommodationList from './pages/accommodation/AccommodationList';
import AccommodationDetail from './pages/accommodation/AccommodationDetail';
import AccommodationForm from './pages/accommodation/AccommodationForm';
import RoomForm from './pages/accommodation/RoomForm';
import RoomAssignment from './pages/accommodation/RoomAssignment';

// Payment Pages
import PaymentList from './pages/payments/PaymentList';
import PaymentDetail from './pages/payments/PaymentDetail';
import PaymentForm from './pages/payments/PaymentForm';
import PaymentVerification from './pages/payments/PaymentVerification';

// Attendance Pages
import AttendanceList from './pages/attendance/AttendanceList';
import QRAttendance from './pages/attendance/QRAttendance';

// Resource Pages
import ResourceList from './pages/resources/ResourceList';
import ResourceForm from './pages/resources/ResourceForm';

// Organization & Ministry Pages
import OrganizationTree from './pages/organization/OrganizationTree';
import DepartmentList from './pages/departments/DepartmentList';

// Analytics Pages
import AIInsights from './pages/analytics/AIInsights';

// User Pages
import UserList from './pages/users/UserList';

// Notification Pages
import NotificationList from './pages/notifications/NotificationList';

// Profile Page
import UserProfile from './pages/profile/UserProfile';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles, requirePosition, requiredNav }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check navigation permission based on SDA RUM hierarchy matrix
  if (requiredNav && !isNavAllowed(user, requiredNav)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (!requiredNav || !isNavAllowed(user, requiredNav)) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  // Check for specific position requirement
  if (requirePosition && user.position !== requirePosition) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        
        {/* Dashboard Routes */}
        <Route path="dashboard" element={<ProtectedRoute requiredNav={NAV_KEYS.DASHBOARD}><Dashboard /></ProtectedRoute>} />
        <Route path="dashboard/participant" element={<ProtectedRoute requiredNav={NAV_KEYS.DASHBOARD} allowedRoles={['PARTICIPANT', 'COORDINATOR', 'ADMINISTRATOR']}><ParticipantDashboard /></ProtectedRoute>} />
        <Route path="dashboard/coordinator" element={<ProtectedRoute requiredNav={NAV_KEYS.DASHBOARD} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}><CoordinatorDashboard /></ProtectedRoute>} />
        <Route path="dashboard/media-pa" element={<ProtectedRoute requiredNav={NAV_KEYS.DASHBOARD} allowedRoles={['PARTICIPANT', 'COORDINATOR', 'ADMINISTRATOR']}><MediaPADashboard /></ProtectedRoute>} />
        <Route path="dashboard/admin" element={<ProtectedRoute requiredNav={NAV_KEYS.DASHBOARD} allowedRoles={['ADMINISTRATOR']}><AdminDashboard /></ProtectedRoute>} />
        
        {/* User Directory (UNION_ADMINISTRATOR / Administrator) */}
        <Route path="users" element={<ProtectedRoute requiredNav={NAV_KEYS.USERS}><UserList /></ProtectedRoute>} />
        
        {/* Proposal Routes */}
        <Route path="proposals" element={
          <ProtectedRoute requiredNav={NAV_KEYS.PROPOSALS}>
            <ProposalList />
          </ProtectedRoute>
        } />
        <Route path="proposals/new" element={
          <ProtectedRoute requiredNav={NAV_KEYS.PROPOSALS}>
            <ProposalForm />
          </ProtectedRoute>
        } />
        <Route path="proposals/:id" element={
          <ProtectedRoute requiredNav={NAV_KEYS.PROPOSALS}>
            <ProposalDetail />
          </ProtectedRoute>
        } />
        <Route path="proposals/:id/edit" element={
          <ProtectedRoute requiredNav={NAV_KEYS.PROPOSALS}>
            <ProposalForm />
          </ProtectedRoute>
        } />
        
        {/* Event Routes */}
        <Route path="events" element={<ProtectedRoute requiredNav={NAV_KEYS.EVENTS}><EventList /></ProtectedRoute>} />
        <Route path="events/new" element={
          <ProtectedRoute requiredNav={NAV_KEYS.EVENTS} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <EventForm />
          </ProtectedRoute>
        } />
        <Route path="events/:id" element={<ProtectedRoute requiredNav={NAV_KEYS.EVENTS}><EventDetail /></ProtectedRoute>} />
        <Route path="events/:id/edit" element={
          <ProtectedRoute requiredNav={NAV_KEYS.EVENTS} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <EventForm />
          </ProtectedRoute>
        } />
        <Route path="events/:id/sessions" element={
          <ProtectedRoute requiredNav={NAV_KEYS.EVENTS} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <SessionManagement />
          </ProtectedRoute>
        } />
        <Route path="events/:id/staff" element={
          <ProtectedRoute requiredNav={NAV_KEYS.EVENTS} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <StaffAssignment />
          </ProtectedRoute>
        } />
        
        {/* Registration Routes */}
        <Route path="registrations" element={<ProtectedRoute requiredNav={NAV_KEYS.REGISTRATIONS}><RegistrationList /></ProtectedRoute>} />
        <Route path="registrations/new" element={
          <ProtectedRoute requiredNav={NAV_KEYS.REGISTRATIONS}>
            <RegistrationForm />
          </ProtectedRoute>
        } />
        <Route path="registrations/:id" element={<ProtectedRoute requiredNav={NAV_KEYS.REGISTRATIONS}><RegistrationDetail /></ProtectedRoute>} />
        <Route path="events/:eventId/check-in" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ATTENDANCE}>
            <CheckInManagement />
          </ProtectedRoute>
        } />
        
        {/* Accommodation Routes */}
        <Route path="accommodation" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ACCOMMODATION}>
            <AccommodationList />
          </ProtectedRoute>
        } />
        <Route path="accommodation/new" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ACCOMMODATION} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <AccommodationForm />
          </ProtectedRoute>
        } />
        <Route path="accommodation/new/:eventId" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ACCOMMODATION} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <AccommodationForm />
          </ProtectedRoute>
        } />
        <Route path="accommodation/:id" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ACCOMMODATION}>
            <AccommodationDetail />
          </ProtectedRoute>
        } />
        <Route path="accommodation/:id/edit" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ACCOMMODATION} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <AccommodationForm />
          </ProtectedRoute>
        } />
        <Route path="accommodation/:accommodationId/rooms/new" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ACCOMMODATION} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <RoomForm />
          </ProtectedRoute>
        } />
        <Route path="accommodation/:accommodationId/rooms/:roomId/edit" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ACCOMMODATION} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <RoomForm />
          </ProtectedRoute>
        } />
        <Route path="accommodation/:id/assign" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ACCOMMODATION} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <RoomAssignment />
          </ProtectedRoute>
        } />
        
        {/* Payment Routes */}
        <Route path="payments" element={
          <ProtectedRoute requiredNav={NAV_KEYS.PAYMENTS}>
            <PaymentList />
          </ProtectedRoute>
        } />
        <Route path="payments/new" element={
          <ProtectedRoute requiredNav={NAV_KEYS.PAYMENTS}>
            <PaymentForm />
          </ProtectedRoute>
        } />
        <Route path="payments/verify" element={
          <ProtectedRoute requiredNav={NAV_KEYS.PAYMENTS} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <PaymentVerification />
          </ProtectedRoute>
        } />
        <Route path="payments/:id" element={
          <ProtectedRoute requiredNav={NAV_KEYS.PAYMENTS}>
            <PaymentDetail />
          </ProtectedRoute>
        } />
        
        {/* Attendance Routes */}
        <Route path="attendance" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ATTENDANCE}>
            <AttendanceList />
          </ProtectedRoute>
        } />
        <Route path="attendance/qr-scan/:eventId" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ATTENDANCE}>
            <QRAttendance />
          </ProtectedRoute>
        } />
        
        {/* Resource Routes */}
        <Route path="resources" element={
          <ProtectedRoute requiredNav={NAV_KEYS.RESOURCES}>
            <ResourceList />
          </ProtectedRoute>
        } />
        <Route path="resources/new" element={
          <ProtectedRoute requiredNav={NAV_KEYS.RESOURCES} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <ResourceForm />
          </ProtectedRoute>
        } />
        <Route path="resources/:id/edit" element={
          <ProtectedRoute requiredNav={NAV_KEYS.RESOURCES} allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <ResourceForm />
          </ProtectedRoute>
        } />
        
        {/* Organization & Ministries Routes */}
        <Route path="organization" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ORGANIZATION}>
            <OrganizationTree />
          </ProtectedRoute>
        } />
        <Route path="departments" element={
          <ProtectedRoute requiredNav={NAV_KEYS.DEPARTMENTS}>
            <DepartmentList />
          </ProtectedRoute>
        } />
        
        {/* Analytics Routes */}
        <Route path="analytics" element={
          <ProtectedRoute requiredNav={NAV_KEYS.ANALYTICS}>
            <AIInsights />
          </ProtectedRoute>
        } />
        
        {/* Communication & Notification Hub */}
        <Route path="communication" element={<ProtectedRoute requiredNav={NAV_KEYS.COMMUNICATION}><NotificationList /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute requiredNav={NAV_KEYS.COMMUNICATION}><NotificationList /></ProtectedRoute>} />
        
        {/* Profile Route */}
        <Route path="profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        
        {/* Catch all - 404 */}
        <Route path="*" element={
          <div className="text-center py-16">
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">404 - Page Not Found</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">The page you're looking for doesn't exist.</p>
          </div>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
