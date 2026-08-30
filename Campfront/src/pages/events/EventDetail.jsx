import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventApi, sessionApi, registrationApi, accommodationApi } from '../../api';
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
  User,
  Lock,
  UserCheck,
  CreditCard,
  Home
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
  const [userRegistration, setUserRegistration] = useState(null);
  const [accommodationAssignment, setAccommodationAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const isParticipant = user?.role === 'PARTICIPANT';
  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const isEventCoordinator = !isParticipant && user && (event?.coordinator?.id === user.id || event?.coordinator?.id === user.userId);
  const canManage = !isParticipant && (isUnionAdmin || isEventCoordinator);

  useEffect(() => {
    fetchEvent();
    fetchSessions();
    if (user) {
      fetchUserRegistration();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventApi.getById(id);
      if (response.data?.success) {
        setEvent(response.data.data);
      } else if (response.data) {
        setEvent(response.data);
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
      if (response.data?.success) {
        setSessions(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchUserRegistration = async () => {
    try {
      const response = await registrationApi.getMyRegistrations();
      const regs = response.data?.data || response.data || [];
      if (Array.isArray(regs)) {
        const match = regs.find(r => 
          (r.event?.id?.toString() === id.toString() || r.eventId?.toString() === id.toString()) && 
          r.status !== 'CANCELLED'
        );
        setUserRegistration(match || null);

        if (match) {
          try {
            const accRes = await accommodationApi.getAssignmentByRegistration(match.id);
            if (accRes.data?.success) {
              setAccommodationAssignment(accRes.data.data);
            } else if (accRes.data) {
              setAccommodationAssignment(accRes.data);
            }
          } catch (accErr) {
            console.log("No specific room assignment record found", accErr);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user registration:', error);
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

      if (response.data?.success) {
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
    if (!status) return <Badge variant="default" size="lg">UNKNOWN</Badge>;
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
    if (amount == null) return 'N/A';
    try {
      return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (e) {
      return `${amount} RWF`;
    }
  };

  const formatDate = (dateStr, options) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', options);
    } catch (e) {
      return 'N/A';
    }
  };

  const calculateDuration = () => {
    if (!event?.startDate || !event?.endDate) return 'N/A';
    try {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return `${days} day${days !== 1 ? 's' : ''}`;
    } catch (e) {
      return 'N/A';
    }
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
          onClick={() => navigate('/app/events')}
        >
          Back to Events
        </Button>
      </div>
    );
  }

  const feeAmount = event.registrationFee ?? event.amountPerPerson ?? 0;
  const isRegistered = !!userRegistration;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/app/events')}
            className="mb-4"
          >
            Back to Events
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{event.name || 'Unnamed Event'}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {getStatusBadge(event.status)}
            <Badge variant="info">{event.type || 'EVENT'}</Badge>
            <Badge variant="default">{event.department?.name || 'N/A'}</Badge>
          </div>
        </div>

        {/* Action Buttons for Participants */}
        {isParticipant && (
          <div className="flex gap-2 flex-wrap items-center">
            {isRegistered ? (
              <>
                <Badge variant="success" size="lg" className="py-2 px-3 text-sm flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-4 h-4" />
                  Registered ({userRegistration.status})
                </Badge>
                <Link to={`/app/registrations/${userRegistration.id}`}>
                  <Button variant="outline">
                    View My Registration
                  </Button>
                </Link>
              </>
            ) : (
              event.status === 'REGISTRATION_OPEN' && (
                <Link to={`/app/registrations/new?eventId=${id}`}>
                  <Button variant="primary" size="lg">
                    Register Now - {formatCurrency(feeAmount)}
                  </Button>
                </Link>
              )
            )}
          </div>
        )}

        {/* Action Buttons for Coordinators/Admins */}
        {canManage && (
          <div className="flex gap-2 flex-wrap">
            {(event.status === 'DRAFT' || event.status === 'PLANNING') && (
              <Link to={`/app/events/${id}/edit`}>
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
                <Link to={`/app/registrations/new?eventId=${id}`}>
                  <Button variant="primary" icon={<UserPlus className="w-4 h-4" />}>
                    Register Participant
                  </Button>
                </Link>
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
                      {formatDate(event.startDate, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-500">
                      to {formatDate(event.endDate, { year: 'numeric', month: 'long', day: 'numeric' })}
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
                    <p className="font-medium text-gray-900">{event.venue || 'N/A'}</p>
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
                      {(event.maxParticipants || event.capacity) && ` / ${event.maxParticipants || event.capacity}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment per Person</p>
                    <p className="font-bold text-lg text-amber-700">
                      {formatCurrency(feeAmount)}
                    </p>
                    {!isParticipant && event.budget != null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Budget: {formatCurrency(event.budget)}
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

          {/* GATING: If Participant is NOT registered, show locked message for Sessions & Accommodation */}
          {isParticipant && !isRegistered ? (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardBody className="text-center py-8">
                <div className="bg-amber-100 p-3 rounded-full w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Sessions Schedule & Accommodation Information Locked</h3>
                <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">
                  You are currently not registered for <strong>{event.name}</strong>. Register now to unlock the complete session schedule and view your accommodation details.
                </p>
                <div className="mt-4 p-3 bg-white inline-block rounded-lg border border-amber-200 text-sm">
                  <span className="text-gray-600">Registration Fee: </span>
                  <span className="font-bold text-gray-900">{formatCurrency(feeAmount)}</span>
                </div>
                {event.status === 'REGISTRATION_OPEN' && (
                  <div className="mt-5">
                    <Link to={`/app/registrations/new?eventId=${id}`}>
                      <Button variant="primary" size="lg">
                        Register Now
                      </Button>
                    </Link>
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            <>
              {/* Accommodation Card for Registered Participant */}
              {isParticipant && isRegistered && (
                <Card className="border-primary-200 bg-primary-50/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-primary-600" />
                      My Accommodation Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    {accommodationAssignment ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Building / Venue</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {accommodationAssignment.room?.accommodation?.name || 'Main Campsite Block'}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Room Number</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            Room {accommodationAssignment.room?.roomNumber || 'Assigned on arrival'}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Bed / Spot</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {accommodationAssignment.bedNumber ? `Bed #${accommodationAssignment.bedNumber}` : 'Standard Spot'}
                          </p>
                        </div>
                      </div>
                    ) : userRegistration.accommodation ? (
                      <div className="p-4 bg-white rounded-lg border border-gray-200 flex items-center gap-3">
                        <Home className="w-5 h-5 text-primary-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{userRegistration.accommodation}</p>
                          <p className="text-xs text-gray-500">Your room and bed assignment</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                        <Home className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-800">Accommodation Assignment Pending</p>
                        <p className="text-xs text-gray-500 mt-1">
                          The event coordinator is finalizing room assignments. Your room details will appear here once assigned.
                        </p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}

              {/* Sessions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Event Sessions ({sessions.length})</CardTitle>
                    {canManage && (
                      <Link to={`/app/events/${id}/sessions`}>
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
                        <Link to={`/app/events/${id}/sessions`}>
                          <Button variant="primary" size="sm" className="mt-3">
                            Create First Session
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <div key={session.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                          <Clock className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{session.title}</p>
                            {session.description && (
                              <p className="text-xs text-gray-600 mt-0.5">{session.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 flex-wrap">
                              <span>{formatDate(session.date)}</span>
                              {session.startTime && <span>{session.startTime} - {session.endTime}</span>}
                              {session.speaker && (
                                <>
                                  <span>•</span>
                                  <span>Speaker: {session.speaker.firstName} {session.speaker.lastName}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge variant="info" size="sm">{session.type || 'SESSION'}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </>
          )}

          {/* Staff Assignments (Coordinators / Admins view) */}
          {canManage && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Event Staff</CardTitle>
                  <Link to={`/app/events/${id}/staff`}>
                    <Button variant="ghost" size="sm" icon={<UserPlus className="w-4 h-4" />}>
                      Manage Staff
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardBody>
                {(!event.staffAssignments || event.staffAssignments.length === 0) ? (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No staff assigned yet</p>
                    <Link to={`/app/events/${id}/staff`}>
                      <Button variant="primary" size="sm" className="mt-3">
                        Assign Staff
                      </Button>
                    </Link>
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
                            {assignment.staff?.firstName} {assignment.staff?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{assignment.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Payment Info Card for Participant */}
          {isParticipant && isRegistered && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  My Registration Details
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registration ID:</span>
                    <span className="font-mono font-medium">#{userRegistration.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee Amount:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(feeAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={userRegistration.status === 'CONFIRMED' ? 'success' : 'warning'}>
                      {userRegistration.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-200 space-y-2">
                  <Link to={`/app/registrations/${userRegistration.id}`} className="block">
                    <Button variant="primary" size="sm" className="w-full">
                      View Ticket & QR Code
                    </Button>
                  </Link>
                  {userRegistration.paymentStatus !== 'PAID' && (
                    <Link to={`/app/payments/new?registrationId=${userRegistration.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        Submit Payment Proof
                      </Button>
                    </Link>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

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
                  <p className="font-medium text-gray-900">{event.department?.name || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Event Type</p>
                  <p className="font-medium text-gray-900">{event.type || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Registration Fee</p>
                  <p className="font-bold text-gray-900">{formatCurrency(feeAmount)}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Stats (for Admins / Coordinators) */}
          {canManage && (
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
                </div>
              </CardBody>
            </Card>
          )}

          {/* Quick Actions (Coordinators / Admins) */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <Link to={`/app/events/${id}/sessions`} className="block">
                    <Button variant="ghost" className="w-full justify-start" icon={<ClipboardList className="w-4 h-4" />}>
                      Manage Sessions
                    </Button>
                  </Link>
                  <Link to={`/app/events/${id}/staff`} className="block">
                    <Button variant="ghost" className="w-full justify-start" icon={<UserPlus className="w-4 h-4" />}>
                      Assign Staff
                    </Button>
                  </Link>
                  <Link to={`/app/registrations?eventId=${id}`} className="block">
                    <Button variant="ghost" className="w-full justify-start" icon={<Users className="w-4 h-4" />}>
                      View Registrations
                    </Button>
                  </Link>
                  <Link to={`/app/accommodation?eventId=${id}`} className="block">
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
