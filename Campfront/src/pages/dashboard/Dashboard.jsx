import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import CoordinatorDashboard from './CoordinatorDashboard';
import ParticipantDashboard from './ParticipantDashboard';

export default function Dashboard() {
  const { user } = useAuth();

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
