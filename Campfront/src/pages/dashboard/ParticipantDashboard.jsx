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
import UpcomingEventsCardList from '../../components/ai/UpcomingEventsCardList';

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

  // Filter out events the user is already registered for, or events that have passed/closed
  const now = new Date();
  const unregisteredOpenEvents = availableEvents.filter(ev => {
    // If user already registered, excluded from available
    if (registrations.some(r => r.event?.id === ev.id || r.eventId === ev.id)) return false;
    // If event is completed or cancelled, excluded
    if (ev.status === 'COMPLETED' || ev.status === 'CANCELLED') return false;
    // If event date has passed, excluded
    if (ev.endDate) {
      const end = new Date(ev.endDate + (ev.endDate.includes('T') ? '' : 'T23:59:59'));
      if (end < now) return false;
    }
    // If registration deadline has passed, excluded
    if (ev.registrationEndDate) {
      const regEnd = new Date(ev.registrationEndDate + (ev.registrationEndDate.includes('T') ? '' : 'T23:59:59'));
      if (regEnd < now) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('participant.dashboardTitle', 'My Dashboard')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 font-medium">{t('participant.dashboardSubtitle', 'View your registered events, accommodation, and open events')}</p>
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
                  const accommodationStr = reg.roomDetails || 
                    (reg.roomAssignment ? `Room ${reg.roomAssignment.room?.roomNumber || ''} - Bed ${reg.roomAssignment.bedNumber || ''}` : null) || 
                    reg.accommodation || 
                    null;
                  const isEventConcluded = eventObj.status === 'COMPLETED' || 
                    (eventObj.endDate && new Date(eventObj.endDate + (eventObj.endDate.includes('T') ? '' : 'T23:59:59')) < now);

                  return (
                    <div key={reg.id} className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white">{eventTitle}</h4>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            {getStatusBadge(reg.status)}
                            {isEventConcluded && (
                              <Badge variant="default" size="sm">Concluded</Badge>
                            )}
                          </div>
                        </div>
                        {reg.qrCode && (
                          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                            <QrCode className="w-8 h-8 text-slate-700 dark:text-slate-300 mx-auto" />
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono mt-0.5">QR Ready</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                          <span>{eventDate}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                          <span>{eventVenue}</span>
                        </div>
                        <div className="flex items-center text-xs font-semibold p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50">
                          <Home className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{accommodationStr ? `${t('accommodation.roomNumber', 'Room')}: ${accommodationStr}` : `${t('accommodation.title', 'Accommodation')}: ${t('status.PENDING', 'Pending')}`}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link to={`/app/events/${eventId}`} className="flex-1 min-w-[140px]">
                          <Button variant="outline" size="sm" className="w-full">
                            {t('events.viewDetails', 'Event Details')}
                          </Button>
                        </Link>
                        {reg.status === 'PENDING' ? (
                          <Link to={`/app/payments/new?registrationId=${reg.id}`} className="flex-1 min-w-[140px]">
                            <Button variant="primary" size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold" icon={<DollarSign className="w-3.5 h-3.5" />}>
                              {t('events.fee', 'Pay Fee Now')}
                            </Button>
                          </Link>
                        ) : (
                          <Link to={`/app/registrations/${reg.id}`} state={{ registration: reg }} className="flex-1 min-w-[140px]">
                            <Button variant="primary" size="sm" className="w-full" icon={<QrCode className="w-3.5 h-3.5" />}>
                              {t('registrations.qrCode', 'Ticket & QR Badge')}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}

                {registrations.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">{t('participant.noRegistrations', 'You have not registered for any events yet.')}</p>
                    <Link to="/app/events" className="mt-4 inline-block">
                      <Button variant="primary">{t('participant.browseEvents', 'Browse Available Events')}</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Upcoming Events Open for Registration */}
          <UpcomingEventsCardList
            role="PARTICIPANT"
            title="Upcoming Events Open for Registration"
            maxItems={5}
          />
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
                  <p className="text-xs text-gray-500 text-center py-3">{t('header.noNotifications', 'No notifications yet.')}</p>
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
