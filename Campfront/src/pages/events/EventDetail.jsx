import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventApi, sessionApi } from '../../api';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Edit,
  PlayCircle,
  StopCircle,
  CheckCircle2,
  XCircle,
  UserPlus,
  ClipboardList,
  Building2,
  Clock,
  User
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';

export default function EventDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const isEventCoordinator = event?.coordinator?.id === user.userId;

  useEffect(() => {
    fetchEvent();
    fetchSessions();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventApi.getById(id);
      if (response.data.success) {
        setEvent(response.data.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch event details'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await sessionApi.getByEvent(id);
      if (response.data.success) {
        setSessions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleStatusChange = async (action) => {
    const confirmMessages = {
      'openRegistration': 'Open registration for this event?',
      'closeRegistration': 'Close registration for this event?',
      'start': 'Mark this event as started?',
      'complete': 'Mark this event as completed?',
      'cancel': 'Cancel this event? This action cannot be undone.'
    };

    if (!confirm(confirmMessages[action])) return;

    try {
      let response;
      switch(action) {
        case 'openRegistration':
          response = await eventApi.openRegistration(id);
          break;
        case 'closeRegistration':
          response = await eventApi.closeRegistration(id);
          break;
        case 'start':
          response = await eventApi.start(id);
          break;
        case 'complete':
          response = await eventApi.complete(id);
          break;
        case 'cancel':
          response = await eventApi.cancel(id);
          break;
      }

      if (response.data.success) {
        setAlert({ type: 'success', message: 'Event status updated successfully' });
        fetchEvent();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update event status'
      });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      DRAFT: 'default',
      PLANNING: 'info',
      REGISTRATION_OPEN: 'success',
      REGISTRATION_CLOSED: 'warning',
      IN_PROGRESS: 'info',
      COMPLETED: 'success',
      CANCELLED: 'danger',
    };
    return (
      <Badge variant={variants[status] || 'default'} size="lg">
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateDuration = () => {
    if (!event?.startDate || !event?.endDate) return 'N/A';
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return <PageSpinner message="Loading event details..." />;
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Event not found</h2>
        <p className="text-gray-600 mt-2">The event you're looking for doesn't exist.</p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => navigate('/events')}
        >
          Back to Events
        </Button>
      </div>
    );
  }

  const canManage = isUnionAdmin || isEventCoordinator;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/events')}
            className="mb-4"
          >
            Back to Events
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {getStatusBadge(event.status)}
            <Badge variant="info">{event.type}</Badge>
            <Badge variant="default">{event.department?.name}</Badge>
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2 flex-wrap">
            {(event.status === 'DRAFT' || event.status === 'PLANNING') && (
              <Link to={`/events/${id}/edit`}>
                <Button variant="ghost" icon={<Edit className="w-4 h-4" />}>
                  Edit
                </Button>
              </Link>
            )}
            
            {event.status === 'PLANNING' && (
              <Button
                variant="success"
                icon={<PlayCircle className="w-4 h-4" />}
                onClick={() => handleStatusChange('openRegistration')}
              >
                Open Registration
              </Button>
            )}

            {event.status === 'REGISTRATION_OPEN' && (
              <>
                <Button
                  variant="warning"
                  icon={<StopCircle className="w-4 h-4" />}
                  onClick={() => handleStatusChange('closeRegistration')}
                >
                  Close Registration
                </Button>
                <Button
                  variant="primary"
                  icon={<PlayCircle className="w-4 h-4" />}
                  onClick={() => handleStatusChange('start')}
                >
                  Start Event
                </Button>
              </>
            )}

            {(event.status === 'REGISTRATION_CLOSED' || event.status === 'IN_PROGRESS') && (
              <Button
                variant="primary"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => handleStatusChange(event.status === 'REGISTRATION_CLOSED' ? 'start' : 'complete')}
              >
                {event.status === 'REGISTRATION_CLOSED' ? 'Start Event' : 'Complete Event'}
              </Button>
            )}

            {(event.status === 'DRAFT' || event.status === 'PLANNING') && (
              <Button
                variant="danger"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => handleStatusChange('cancel')}
              >
                Cancel Event
              </Button>
            )}
          </div>
        )}
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Event Overview</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Event Dates</p>
                    <p className="font-medium text-gray-900">
                      {new Date(event.startDate).toLocaleDateString('en-RW', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      to {new Date(event.endDate).toLocaleDateString('en-RW', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Duration: {calculateDuration()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Venue</p>
                    <p className="font-medium text-gray-900">{event.venue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Registration</p>
                    <p className="font-medium text-gray-900">
                      {event.registrationCount || 0}
                      {event.capacity && ` / ${event.capacity}`}
                    </p>
                    {event.capacity && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((event.registrationCount / event.capacity) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Budget & Fees</p>
                    {event.budget && (
                      <p className="font-medium text-gray-900">
                        Budget: {formatCurrency(event.budget)}
                      </p>
                    )}
                    {event.registrationFee && (
                      <p className="text-sm text-gray-600">
                        Reg. Fee: {formatCurrency(event.registrationFee)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Description */}
          {event.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </CardBody>
            </Card>
          )}

          {/* Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sessions ({sessions.length})</CardTitle>
                {canManage && (
                  <Link to={`/events/${id}/sessions`}>
                    <Button variant="ghost" size="sm" icon={<ClipboardList className="w-4 h-4" />}>
                      Manage Sessions
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No sessions scheduled yet</p>
                  {canManage && (
                    <Link to={`/events/${id}/sessions`}>
                      <Button variant="primary" size="sm" className="mt-3">
                        Create First Session
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{session.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <span>{new Date(session.date).toLocaleDateString('en-RW')}</span>
                          <span>{session.startTime} - {session.endTime}</span>
                          {session.speaker && (
                            <>
                              <span>•</span>
                              <span>Speaker: {session.speaker.firstName} {session.speaker.lastName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="info" size="sm">{session.type}</Badge>
                    </div>
                  ))}
                  {sessions.length > 5 && (
                    <Link to={`/events/${id}/sessions`}>
                      <Button variant="ghost" size="sm" className="w-full">
                        View all {sessions.length} sessions
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Staff Assignments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Event Staff</CardTitle>
                {canManage && (
                  <Link to={`/events/${id}/staff`}>
                    <Button variant="ghost" size="sm" icon={<UserPlus className="w-4 h-4" />}>
                      Manage Staff
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {(!event.staffAssignments || event.staffAssignments.length === 0) ? (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No staff assigned yet</p>
                  {canManage && (
                    <Link to={`/events/${id}/staff`}>
                      <Button variant="primary" size="sm" className="mt-3">
                        Assign Staff
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {event.staffAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {assignment.staff.firstName} {assignment.staff.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{assignment.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Event Coordinator</p>
                  <p className="font-medium text-gray-900">
                    {event.coordinator?.firstName} {event.coordinator?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{event.coordinator?.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{event.department?.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Event Type</p>
                  <p className="font-medium text-gray-900">{event.type}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(event.createdAt).toLocaleDateString('en-RW')}
                  </p>
                </div>

                {event.updatedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {new Date(event.updatedAt).toLocaleDateString('en-RW')}
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Registrations</span>
                  <span className="font-semibold text-gray-900">{event.registrationCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confirmed</span>
                  <span className="font-semibold text-green-600">{event.confirmedCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-semibold text-amber-600">{event.pendingCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sessions</span>
                  <span className="font-semibold text-gray-900">{sessions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Staff Assigned</span>
                  <span className="font-semibold text-gray-900">
                    {event.staffAssignments?.length || 0}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Event Progress</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    event.status !== 'DRAFT' ? 'bg-green-500' : 'bg-gray-200'
                  }`}>
                    {event.status !== 'DRAFT' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Planning</p>
                    <p className="text-xs text-gray-500">Event created & configured</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED'].includes(event.status)
                      ? 'bg-green-500'
                      : event.status === 'PLANNING'
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }`}>
                    {['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED'].includes(event.status) && (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Registration</p>
                    <p className="text-xs text-gray-500">Open for participants</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    ['IN_PROGRESS', 'COMPLETED'].includes(event.status)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}>
                    {['IN_PROGRESS', 'COMPLETED'].includes(event.status) && (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">In Progress</p>
                    <p className="text-xs text-gray-500">Event is running</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    event.status === 'COMPLETED'
                      ? 'bg-green-500'
                      : event.status === 'CANCELLED'
                      ? 'bg-red-500'
                      : 'bg-gray-200'
                  }`}>
                    {event.status === 'COMPLETED' && <CheckCircle2 className="w-5 h-5 text-white" />}
                    {event.status === 'CANCELLED' && <XCircle className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {event.status === 'COMPLETED' ? 'Completed' : 
                       event.status === 'CANCELLED' ? 'Cancelled' : 'Completion'}
                    </p>
                    <p className="text-xs text-gray-500">Final status</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <Link to={`/events/${id}/sessions`} className="block">
                    <Button variant="ghost" className="w-full justify-start" icon={<ClipboardList className="w-4 h-4" />}>
                      Manage Sessions
                    </Button>
                  </Link>
                  <Link to={`/events/${id}/staff`} className="block">
                    <Button variant="ghost" className="w-full justify-start" icon={<UserPlus className="w-4 h-4" />}>
                      Assign Staff
                    </Button>
                  </Link>
                  <Link to={`/registrations?eventId=${id}`} className="block">
                    <Button variant="ghost" className="w-full justify-start" icon={<Users className="w-4 h-4" />}>
                      View Registrations
                    </Button>
                  </Link>
                  <Link to={`/accommodation?eventId=${id}`} className="block">
                    <Button variant="ghost" className="w-full justify-start" icon={<Building2 className="w-4 h-4" />}>
                      Manage Accommodation
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
