import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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

// Organization Pages
import OrganizationTree from './pages/organization/OrganizationTree';

// Analytics Pages
import AIInsights from './pages/analytics/AIInsights';

// User Pages
import UserList from './pages/users/UserList';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles, requirePosition }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
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
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dashboard/participant" element={<ProtectedRoute allowedRoles={['PARTICIPANT', 'COORDINATOR', 'ADMINISTRATOR']}><ParticipantDashboard /></ProtectedRoute>} />
        <Route path="dashboard/coordinator" element={<ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}><CoordinatorDashboard /></ProtectedRoute>} />
        <Route path="dashboard/admin" element={<ProtectedRoute allowedRoles={['ADMINISTRATOR']}><AdminDashboard /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="users" element={<ProtectedRoute allowedRoles={['ADMINISTRATOR']}><UserList /></ProtectedRoute>} />
        
        {/* Proposal Routes */}
        <Route path="proposals" element={<ProposalList />} />
        <Route path="proposals/new" element={
          <ProtectedRoute allowedRoles={['COORDINATOR']} requirePosition="DEPARTMENT_LEADER">
            <ProposalForm />
          </ProtectedRoute>
        } />
        <Route path="proposals/:id" element={<ProposalDetail />} />
        <Route path="proposals/:id/edit" element={
          <ProtectedRoute allowedRoles={['COORDINATOR']} requirePosition="DEPARTMENT_LEADER">
            <ProposalForm />
          </ProtectedRoute>
        } />
        
        {/* Event Routes */}
        <Route path="events" element={<EventList />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="events/:id/edit" element={<EventForm />} />
        <Route path="events/:id/sessions" element={<SessionManagement />} />
        <Route path="events/:id/staff" element={<StaffAssignment />} />
        
        {/* Registration Routes */}
        <Route path="registrations" element={<RegistrationList />} />
        <Route path="registrations/new" element={
          <ProtectedRoute allowedRoles={['PARTICIPANT', 'COORDINATOR', 'ADMINISTRATOR']}>
            <RegistrationForm />
          </ProtectedRoute>
        } />
        <Route path="registrations/:id" element={<RegistrationDetail />} />
        <Route path="events/:eventId/check-in" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <CheckInManagement />
          </ProtectedRoute>
        } />
        
        {/* Accommodation Routes */}
        <Route path="accommodation" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <AccommodationList />
          </ProtectedRoute>
        } />
        <Route path="accommodation/new/:eventId" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <AccommodationForm />
          </ProtectedRoute>
        } />
        <Route path="accommodation/:id" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <AccommodationDetail />
          </ProtectedRoute>
        } />
        <Route path="accommodation/:id/edit" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <AccommodationForm />
          </ProtectedRoute>
        } />
        <Route path="accommodation/:accommodationId/rooms/new" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <RoomForm />
          </ProtectedRoute>
        } />
        <Route path="accommodation/:accommodationId/rooms/:roomId/edit" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <RoomForm />
          </ProtectedRoute>
        } />
        <Route path="accommodation/:id/assign" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <RoomAssignment />
          </ProtectedRoute>
        } />
        
        {/* Payment Routes */}
        <Route path="payments" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <PaymentList />
          </ProtectedRoute>
        } />
        <Route path="payments/new" element={
          <ProtectedRoute allowedRoles={['PARTICIPANT', 'COORDINATOR', 'ADMINISTRATOR']}>
            <PaymentForm />
          </ProtectedRoute>
        } />
        <Route path="payments/verify" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <PaymentVerification />
          </ProtectedRoute>
        } />
        <Route path="payments/:id" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <PaymentDetail />
          </ProtectedRoute>
        } />
        
        {/* Attendance Routes */}
        <Route path="attendance" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <AttendanceList />
          </ProtectedRoute>
        } />
        <Route path="attendance/qr-scan/:eventId" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <QRAttendance />
          </ProtectedRoute>
        } />
        
        {/* Resource Routes */}
        <Route path="resources" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <ResourceList />
          </ProtectedRoute>
        } />
        <Route path="resources/new" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <ResourceForm />
          </ProtectedRoute>
        } />
        <Route path="resources/:id/edit" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <ResourceForm />
          </ProtectedRoute>
        } />
        
        {/* Organization Routes */}
        <Route path="organization" element={
          <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
            <OrganizationTree />
          </ProtectedRoute>
        } />
        
        {/* Analytics Routes */}
        <Route path="analytics" element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMINISTRATOR']}>
            <AIInsights />
          </ProtectedRoute>
        } />
        
        {/* Catch all - 404 */}
        <Route path="*" element={
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800">404 - Page Not Found</h1>
            <p className="text-gray-600 mt-2">The page you're looking for doesn't exist.</p>
          </div>
        } />
      </Route>
    </Routes>
  );
}

import { LanguageProvider } from './contexts/LanguageContext';

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
