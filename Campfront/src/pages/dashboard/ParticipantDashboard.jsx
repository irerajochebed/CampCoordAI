import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  QrCode,
  CheckCircle2,
  Clock,
  Home,
  Bell
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';

export default function ParticipantDashboard() {
  const [loading, setLoading] = useState(false);
  const [registrations, setRegistrations] = useState([
    { 
      id: 1, 
      event: 'Youth Camp 2026', 
      status: 'CONFIRMED', 
      date: '2026-08-01',
      venue: 'Rubavu Campsite',
      accommodation: 'Building A, Room 101, Bed 3',
      qrCode: 'REG-20260801-ABC123'
    },
    { 
      id: 2, 
      event: 'Leadership Training', 
      status: 'PENDING', 
      date: '2026-08-15',
      venue: 'Kigali Conference Center',
      accommodation: 'Not assigned yet',
      qrCode: null
    },
  ]);

  const [upcomingSessions, setUpcomingSessions] = useState([
    { id: 1, title: 'Morning Devotion', time: '07:00 AM', venue: 'Main Hall', date: 'Today' },
    { id: 2, title: 'Youth Leadership Workshop', time: '10:00 AM', venue: 'Workshop Room A', date: 'Today' },
    { id: 3, title: 'Evening Vespers', time: '06:00 PM', venue: 'Main Hall', date: 'Today' },
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Payment Verified', message: 'Your payment for Youth Camp 2026 has been verified', time: '2 hours ago', read: false },
    { id: 2, title: 'Room Assigned', message: 'You have been assigned to Building A, Room 101', time: '5 hours ago', read: false },
    { id: 3, title: 'Schedule Update', message: 'Morning devotion time changed to 7:00 AM', time: '1 day ago', read: true },
  ]);

  const getStatusBadge = (status) => {
    const variants = {
      CONFIRMED: 'success',
      PENDING: 'warning',
      CANCELLED: 'danger',
      CHECKED_IN: 'info',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">View your registrations and event information</p>
        </div>
        <Link to="/events">
          <Button variant="primary">Browse Events</Button>
        </Link>
      </div>

      {/* My Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Registrations */}
          <Card>
            <CardHeader>
              <CardTitle>My Registrations</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {registrations.map((reg) => (
                  <div key={reg.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900">{reg.event}</h4>
                        {getStatusBadge(reg.status)}
                      </div>
                      {reg.qrCode && (
                        <div className="bg-gray-100 p-2 rounded">
                          <QrCode className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{reg.date}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{reg.venue}</span>
                      </div>
                      <div className="flex items-center">
                        <Home className="w-4 h-4 mr-2" />
                        <span>{reg.accommodation}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link to={`/events/${reg.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      {reg.qrCode && (
                        <Link to={`/registrations/${reg.id}/qrcode`} className="flex-1">
                          <Button variant="primary" size="sm" className="w-full">
                            Show QR Code
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}

                {registrations.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No registrations yet</p>
                    <Link to="/events" className="mt-4 inline-block">
                      <Button variant="primary">Browse Events</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm font-medium">
                        {session.time}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{session.title}</p>
                        <p className="text-sm text-gray-600">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {session.venue}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-primary-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
                <p className="text-sm text-gray-600">Registered Events</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {registrations.filter(r => r.status === 'CONFIRMED').length}
                </p>
                <p className="text-sm text-gray-600">Confirmed</p>
              </div>
            </CardBody>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3 rounded-lg border ${notif.read ? 'border-gray-200' : 'border-blue-200 bg-blue-50'}`}
                  >
                    <div className="flex items-start">
                      <Bell className={`w-4 h-4 mr-2 mt-0.5 ${notif.read ? 'text-gray-400' : 'text-blue-600'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <Link to="/notifications" className="block text-center">
                  <Button variant="ghost" size="sm" className="w-full">
                    View All Notifications
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
