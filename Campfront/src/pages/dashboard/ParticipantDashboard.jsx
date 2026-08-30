import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  QrCode,
  CheckCircle2,
  Clock,
  Home,
  Bell,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { useTranslation } from '../../contexts/LanguageContext';
import { registrationApi, eventApi, notificationApi } from '../../api';

export default function ParticipantDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch my registrations
      try {
        const regRes = await registrationApi.getMyRegistrations();
        const regData = regRes.data?.data || regRes.data || [];
        setRegistrations(Array.isArray(regData) ? regData : []);
      } catch (e) {
        console.error('Error fetching registrations:', e);
      }

      // Fetch open events
      try {
        const openEventsRes = await eventApi.getByStatus('REGISTRATION_OPEN');
        const eventsData = openEventsRes.data?.data || openEventsRes.data || [];
        setAvailableEvents(Array.isArray(eventsData) ? eventsData : []);
      } catch (e) {
        console.error('Error fetching open events:', e);
      }

      // Fetch notifications
      try {
        const notifRes = await notificationApi.getMyNotifications();
        const notifData = notifRes.data?.data || notifRes.data || [];
        setNotifications(Array.isArray(notifData) ? notifData : []);
      } catch (e) {
        console.error('Error fetching notifications:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      CONFIRMED: 'success',
      PENDING: 'warning',
      CANCELLED: 'danger',
      CHECKED_IN: 'info',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {t(`status.${status}`, status || 'PENDING')}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    if (amount == null) return '0 RWF';
    try {
      return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0
      }).format(amount);
    } catch (e) {
      return `${amount} RWF`;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return <PageSpinner message="Loading participant dashboard..." />;
  }

  // Filter out events the user is already registered for
  const unregisteredOpenEvents = availableEvents.filter(
    ev => !registrations.some(r => r.event?.id === ev.id || r.eventId === ev.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('participant.dashboardTitle', 'My Dashboard')}</h1>
          <p className="text-gray-600 mt-1">{t('participant.dashboardSubtitle', 'View your registered events, accommodation, and open events')}</p>
        </div>
        <Link to="/app/events">
          <Button variant="primary">{t('participant.browseEvents', 'Browse All Events')}</Button>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Registered Events */}
          <Card>
            <CardHeader>
              <CardTitle>{t('participant.myRegistrations', 'My Registered Events')}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {registrations.map((reg) => {
                  const eventObj = reg.event || {};
                  const eventId = eventObj.id || reg.eventId;
                  const eventTitle = eventObj.name || reg.eventName || 'Registered Event';
                  const eventVenue = eventObj.venue || reg.venue || 'Venue TBD';
                  const eventDate = eventObj.startDate ? `${formatDate(eventObj.startDate)} - ${formatDate(eventObj.endDate)}` : (reg.date || 'Dates TBD');
                  const accommodationStr = reg.accommodation || 'Room assignment unlocked in event detail';

                  return (
                    <div key={reg.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900">{eventTitle}</h4>
                          <div className="mt-1">{getStatusBadge(reg.status)}</div>
                        </div>
                        {reg.qrCode && (
                          <div className="bg-gray-100 p-2 rounded text-center">
                            <QrCode className="w-8 h-8 text-gray-600 mx-auto" />
                            <span className="text-[10px] text-gray-500 block font-mono mt-0.5">QR Ready</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{eventDate}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{eventVenue}</span>
                        </div>
                        <div className="flex items-center">
                          <Home className="w-4 h-4 mr-2 text-primary-600" />
                          <span className="font-medium text-gray-800">{accommodationStr}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link to={`/app/events/${eventId}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View Event, Sessions & Room
                          </Button>
                        </Link>
                        {reg.id && (
                          <Link to={`/app/registrations/${reg.id}`} className="flex-1">
                            <Button variant="primary" size="sm" className="w-full">
                              Ticket & QR Code
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}

                {registrations.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">{t('participant.noRegistrations', 'You have not registered for any events yet.')}</p>
                    <Link to="/app/events" className="mt-4 inline-block">
                      <Button variant="primary">{t('participant.browseEvents', 'Browse Available Events')}</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Available Open Events with Amount to Pay & Register Button */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Available Events Open for Registration</CardTitle>
              <Link to="/app/events" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardBody>
              {unregisteredOpenEvents.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No additional events available for registration at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unregisteredOpenEvents.slice(0, 3).map((event) => {
                    const fee = event.registrationFee ?? event.amountPerPerson ?? 0;
                    return (
                      <div key={event.id} className="p-4 border border-blue-100 bg-blue-50/30 rounded-lg hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-gray-900">{event.name}</h4>
                          <p className="text-xs text-gray-600">{event.venue || 'Venue TBD'} • {formatDate(event.startDate)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="info" size="sm">{event.type || 'EVENT'}</Badge>
                            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              Fee: {formatCurrency(fee)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:flex-col sm:items-end">
                          <Link to={`/app/registrations/new?eventId=${event.id}`}>
                            <Button variant="primary" size="sm">
                              Register Now
                            </Button>
                          </Link>
                          <Link to={`/app/events/${event.id}`}>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="bg-primary-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-7 h-7 text-primary-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
                <p className="text-sm text-gray-600">{t('participant.registeredEvents', 'Registered Events')}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {registrations.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN').length}
                </p>
                <p className="text-sm text-gray-600">{t('participant.confirmed', 'Confirmed Registrations')}</p>
              </div>
            </CardBody>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>{t('participant.recentNotifications', 'Notifications')}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-3">No notifications yet.</p>
                ) : (
                  notifications.slice(0, 3).map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 rounded-lg border ${notif.read ? 'border-gray-200' : 'border-blue-200 bg-blue-50'}`}
                    >
                      <div className="flex items-start">
                        <Bell className={`w-4 h-4 mr-2 mt-0.5 ${notif.read ? 'text-gray-400' : 'text-blue-600'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time || formatDate(notif.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
