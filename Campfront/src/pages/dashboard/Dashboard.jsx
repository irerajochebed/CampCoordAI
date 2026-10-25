import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import CoordinatorDashboard from './CoordinatorDashboard';
import ParticipantDashboard from './ParticipantDashboard';
import MediaPADashboard from './MediaPADashboard';

export default function Dashboard() {
  const { user } = useAuth();

  const isMediaPA = 
    user?.position === 'PA_TEAM' || 
    user?.position === 'MEDIA_TEAM' || 
    user?.departmentName?.toLowerCase().includes('communication') ||
    user?.departmentName?.toLowerCase().includes('media') ||
    user?.department?.type === 'COMMUNICATION';

  // If user is designated as PA or Media Team, route directly to the dedicated Media & PA Command Center
  if (isMediaPA && user?.role !== 'ADMINISTRATOR') {
    return <MediaPADashboard />;
  }

  // Route to appropriate dashboard based on role
  switch (user?.role) {
    case 'ADMINISTRATOR':
      return <AdminDashboard />;
    case 'COORDINATOR':
      return <CoordinatorDashboard />;
    case 'PARTICIPANT':
      return <ParticipantDashboard />;
    default:
      return <ParticipantDashboard />;
  }
}
