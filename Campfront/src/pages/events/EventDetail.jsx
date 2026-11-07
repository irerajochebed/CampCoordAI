import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { eventApi, sessionApi, registrationApi, accommodationApi, paymentApi, getCachedData } from '../../api';
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
  Home, 
  ShieldCheck,
  Smartphone,
  Receipt,
  Check,
  Eye,
  RefreshCw,
  QrCode,
  LayoutGrid,
  List
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { getMinistryAgeRule, getEventAgeDisplay, getEventGenderRule } from '../../utils/ageRangeHelper';

export default function EventDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [attendeeViewMode, setAttendeeViewMode] = useState('grid');
  const { user, isAdmin } = useAuth();
  
  // Instant initial data from route state or API memory cache
  const initialEvent = useMemo(() => {
    if (location.state?.event) return location.state.event;
    const cached = getCachedData(`/events/${id}`);
    if (cached?.data) return cached.data;
    if (cached && !cached.success && cached.id) return cached;
    return null;
  }, [id, location.state]);

  const [event, setEvent] = useState(initialEvent);
  const [sessions, setSessions] = useState([]);
  const [userRegistration, setUserRegistration] = useState(null);
  const [accommodationAssignment, setAccommodationAssignment] = useState(null);
  const [loading, setLoading] = useState(!initialEvent);
  const [alert, setAlert] = useState(null);

  // Financial & Attendee Payment Audit State
  const [eventAttendees, setEventAttendees] = useState([]);
  const [eventPayments, setEventPayments] = useState([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeFilter, setFinanceFilter] = useState('ALL'); // 'ALL' | 'PENDING_REVIEW' | 'PAID' | 'UNPAID'
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState(null);
  const [verifyModalAttendee, setVerifyModalAttendee] = useState(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const isParticipant = user?.role === 'PARTICIPANT';
  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const isEventCoordinator = !isParticipant && user && (event?.coordinator?.id === user.id || event?.coordinator?.id === user.userId);
  const canManage = !isParticipant && (isUnionAdmin || isEventCoordinator);

  useEffect(() => {
    if (initialEvent) {
      setEvent(initialEvent);
      setLoading(false);
    }
    fetchEvent(Boolean(initialEvent));
    fetchSessions();
    if (user) {
      fetchUserRegistration();
    }
  }, [id, user]);

  useEffect(() => {
    if (canManage && id) {
      fetchFinanceData();
    }
  }, [canManage, id]);

  const fetchEvent = async (isBackground = false) => {
    try {
      if (!isBackground && !event) {
        setLoading(true);
      }
      const response = await eventApi.getById(id);
      if (response.data?.success) {
        setEvent(response.data.data);
      } else if (response.data) {
        setEvent(response.data);
      }
    } catch (error) {
      if (!event && !initialEvent) {
        setAlert({
          type: 'error',
          message: error.response?.data?.message || 'Failed to fetch event details'
        });
      }
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

  const fetchFinanceData = async () => {
    try {
      setFinanceLoading(true);
      const [regsRes, paysRes] = await Promise.all([
        registrationApi.getByEvent(id).catch(() => ({ data: { data: [] } })),
        paymentApi.getByEvent(id).catch(() => ({ data: { data: [] } }))
      ]);

      const regs = regsRes.data?.data || regsRes.data || [];
      const pays = paysRes.data?.data || paysRes.data || [];

      setEventAttendees(Array.isArray(regs) ? regs : []);
      setEventPayments(Array.isArray(pays) ? pays : []);
    } catch (e) {
      console.error('Error fetching event financial data:', e);
    } finally {
      setFinanceLoading(false);
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
        setAlert({
          type: 'success',
          message: `Event status updated successfully`
        });
        fetchEvent();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update event status'
      });
    }
  };

  // Quick Payment Approval
  const handleExecutePaymentApproval = async () => {
    if (!verifyModalAttendee) return;
    setVerifyLoading(true);

    try {
      const payment = verifyModalAttendee.payment || (verifyModalAttendee.payments && verifyModalAttendee.payments[0]);
      if (payment && payment.id) {
        await paymentApi.verify(payment.id, verifyNotes.trim() || null);
      } else {
        await registrationApi.confirm(verifyModalAttendee.id);
      }

      setAlert({
        type: 'success',
        message: `Payment verified and registration confirmed for ${verifyModalAttendee.participantName || 'attendee'}! QR Ticket issued.`
      });

      setVerifyModalAttendee(null);
      setVerifyNotes('');
      fetchFinanceData();
      fetchEvent();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to approve payment.'
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isEventPassed = event ? (
    event.status === 'COMPLETED' ||
    (event.endDate && new Date(event.endDate + (event.endDate.includes('T') ? '' : 'T23:59:59')) < new Date())
  ) : false;

  const isRegClosed = event ? (
    isEventPassed ||
    event.status === 'REGISTRATION_CLOSED' ||
    (event.registrationEndDate && new Date(event.registrationEndDate + (event.registrationEndDate.includes('T') ? '' : 'T23:59:59')) < new Date())
  ) : false;

  const getStatusBadge = (status) => {
    if (isEventPassed && status !== 'CANCELLED') {
      return <Badge variant="default">Completed</Badge>;
    }
    const variants = {
      PLANNED: { variant: 'info', label: 'Planned' },
      REGISTRATION_OPEN: { variant: 'success', label: 'Registration Open' },
      REGISTRATION_CLOSED: { variant: 'warning', label: 'Registration Closed' },
      ONGOING: { variant: 'success', label: 'Ongoing' },
      COMPLETED: { variant: 'default', label: 'Completed' },
      CANCELLED: { variant: 'error', label: 'Cancelled' }
    };
    const config = variants[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading && !event) {
    return <PageSpinner message="Loading event details..." />;
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-800">Event Not Found</h1>
        <p className="text-gray-600 mt-2">The event you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/app/events')} className="mt-4">
          Back to Events
        </Button>
      </div>
    );
  }

  const isRegistered = !!userRegistration;
  const feeAmount = event.registrationFee ?? event.amountPerPerson ?? 0;
  const isFree = Number(feeAmount) === 0;

  // Financial Computations
  const confirmedAttendeesList = eventAttendees.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN');
  const pendingReviewList = eventAttendees.filter(r => r.status === 'PAYMENT_SUBMITTED');
  const unpaidList = eventAttendees.filter(r => r.status === 'PENDING');

  const totalCollectedRevenue = eventPayments
    .filter(p => p.status === 'VERIFIED')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const totalTargetRevenue = eventAttendees.length * (parseFloat(feeAmount) || 0);

  // Filtered Attendees for Table
  const filteredEventAttendees = eventAttendees.filter(reg => {
    if (financeFilter === 'PENDING_REVIEW' && reg.status !== 'PAYMENT_SUBMITTED') return false;
    if (financeFilter === 'PAID' && reg.status !== 'CONFIRMED' && reg.status !== 'CHECKED_IN') return false;
    if (financeFilter === 'UNPAID' && reg.status !== 'PENDING') return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/app/events')}
            className="mb-2"
          >
            Back to Events
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            {getStatusBadge(event.status)}
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Event Code: <span className="font-mono font-semibold text-primary-700">{event.eventCode || `#${event.id}`}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <>
              <Link to={`/app/events/${id}/edit`}>
                <Button variant="outline" size="sm" icon={<Edit className="w-4 h-4" />}>
                  Edit
                </Button>
              </Link>

              {!isEventPassed && event.status === 'PLANNED' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlayCircle className="w-4 h-4" />}
                  onClick={() => handleStatusChange('openRegistration')}
                >
                  Open Registration
                </Button>
              )}

              {!isEventPassed && event.status === 'REGISTRATION_OPEN' && (
                <Button
                  variant="warning"
                  size="sm"
                  icon={<StopCircle className="w-4 h-4" />}
                  onClick={() => handleStatusChange('closeRegistration')}
                >
                  Close Registration
                </Button>
              )}

              {!isEventPassed && event.status === 'REGISTRATION_CLOSED' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlayCircle className="w-4 h-4" />}
                  onClick={() => handleStatusChange('start')}
                >
                  Start Event
                </Button>
              )}

              {!isEventPassed && event.status === 'ONGOING' && (
                <Button
                  variant="success"
                  size="sm"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => handleStatusChange('complete')}
                >
                  Complete Event
                </Button>
              )}

              {event.status !== 'COMPLETED' && !isEventPassed && event.status !== 'CANCELLED' && (
                <Button
                  variant="error"
                  size="sm"
                  icon={<XCircle className="w-4 h-4" />}
                  onClick={() => handleStatusChange('cancel')}
                >
                  Cancel Event
                </Button>
              )}
            </>
          )}

          {isParticipant && !isRegistered && (
            isEventPassed ? (
              <Badge variant="default" className="py-2 px-3 text-sm">
                Event Concluded
              </Badge>
            ) : isRegClosed ? (
              <Badge variant="warning" className="py-2 px-3 text-sm">
                Registration Closed
              </Badge>
            ) : event.status === 'REGISTRATION_OPEN' ? (
              <Link to={`/app/registrations/new?eventId=${id}`}>
                <Button variant="primary" icon={<UserPlus className="w-4 h-4" />}>
                  Register Now
                </Button>
              </Link>
            ) : null
          )}

          {isParticipant && isRegistered && (
            <Link to={`/app/registrations/${userRegistration.id}`}>
              <Button variant="primary" icon={<CheckCircle2 className="w-4 h-4" />}>
                My Registration Ticket
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isEventPassed && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3 text-slate-800 dark:text-slate-200">
          <CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Event Concluded:</span> This event ended on {formatDate(event.endDate)}. Registration, check-in, and checkout operations are closed. All event and registration records remain archived for administrative history.
          </div>
        </div>
      )}

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Event Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Event Overview</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Event Dates</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {formatDate(event.startDate)} &rarr; {formatDate(event.endDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Venue & Location</p>
                    <p className="font-semibold text-gray-900 text-sm">{event.venue || 'TBD'}</p>
                    {event.venueAddress && (
                      <p className="text-xs text-gray-500">{event.venueAddress}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Registration Fee</p>
                    <p className="font-bold text-gray-900 text-sm">
                      {isFree ? 'Free Registration' : formatCurrency(feeAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Demographic & Capacity Eligibility</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      Age: {getEventAgeDisplay(event)} &bull; Gender: {getEventGenderRule(event).label} &bull; Max: {event.maxParticipants || 'Unlimited'}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* ======================================================== */}
          {/* FINANCIALS & ATTENDEE PAYMENT RECONCILIATION CARD         */}
          {/* ======================================================== */}
          {canManage && (
            <Card className="border-2 border-emerald-100 dark:border-emerald-950 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50/60 via-white to-emerald-50/30 dark:from-slate-800 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      Event Financials & Attendee Payment Audit
                    </CardTitle>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Track fee collection relevance for <strong>{event.name}</strong> and approve submitted receipts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RefreshCw className="w-3 h-3" />}
                    onClick={fetchFinanceData}
                    loading={financeLoading}
                  >
                    Refresh
                  </Button>
                </div>
              </CardHeader>

              <CardBody className="p-4 space-y-4">
                {/* Financial KPI Stats Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Revenue Collected</p>
                    <p className="text-base font-black text-emerald-600">{formatCurrency(totalCollectedRevenue)}</p>
                    <span className="text-[10px] text-slate-500">{confirmedAttendeesList.length} paid attendees</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Target Revenue</p>
                    <p className="text-base font-black text-slate-800 dark:text-slate-200">{formatCurrency(totalTargetRevenue)}</p>
                    <span className="text-[10px] text-slate-500">Fee: {formatCurrency(feeAmount)} / person</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Pending Review</p>
                    <p className="text-base font-black text-amber-600">{pendingReviewList.length}</p>
                    <span className="text-[10px] text-amber-600 font-medium">Receipts to verify</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Unpaid / Reserved</p>
                    <p className="text-base font-black text-slate-600 dark:text-slate-400">{unpaidList.length}</p>
                    <span className="text-[10px] text-slate-500">Awaiting payment</span>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit text-xs">
                  <button
                    type="button"
                    onClick={() => setFinanceFilter('ALL')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      financeFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All Attendees ({eventAttendees.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceFilter('PENDING_REVIEW')}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                      financeFilter === 'PENDING_REVIEW'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    <span>Pending Review</span>
                    {pendingReviewList.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-700 text-[9px] font-black">
                        {pendingReviewList.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceFilter('PAID')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      financeFilter === 'PAID'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    Paid ({confirmedAttendeesList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceFilter('UNPAID')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      financeFilter === 'UNPAID'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Unpaid ({unpaidList.length})
                  </button>

                  {/* View Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60 ml-auto">
                    <button
                      type="button"
                      onClick={() => setAttendeeViewMode('grid')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        attendeeViewMode === 'grid'
                          ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendeeViewMode('table')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        attendeeViewMode === 'table'
                          ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      Table
                    </button>
                  </div>
                </div>

                {/* Attendee Content */}
                {filteredEventAttendees.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium">No attendees found for the selected filter.</p>
                  </div>
                ) : attendeeViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredEventAttendees.map((reg) => {
                      const payment = reg.payment || (reg.payments && reg.payments[0]) || null;
                      const isConfirmed = reg.status === 'CONFIRMED' || reg.status === 'CHECKED_IN';
                      const isSubmitted = reg.status === 'PAYMENT_SUBMITTED';
                      const isMoMo = payment?.paymentMethod === 'MOBILE_MONEY' || payment?.transactionReference?.startsWith('MOMO');

                      return (
                        <div
                          key={reg.id}
                          className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                #{reg.id}
                              </span>
                              {isConfirmed ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <Check className="w-3 h-3" /> Paid & Confirmed
                                </span>
                              ) : isSubmitted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                                  <Clock className="w-3 h-3" /> Pending Review
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                  Pending Payment
                                </span>
                              )}
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                {reg.participantFirstName && reg.participantLastName
                                  ? `${reg.participantFirstName} ${reg.participantLastName}`
                                  : (reg.participantName || 'Participant')}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {reg.participantPhone || reg.participantEmail || 'No contact'}
                              </p>
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">
                                {reg.churchName || 'Church Unit'}
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                              {payment ? (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                      {isMoMo ? <Smartphone className="w-3 h-3 text-emerald-600" /> : <Receipt className="w-3 h-3 text-blue-600" />}
                                      {payment.paymentMethod?.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  {payment.transactionReference && (
                                    <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                                      {payment.transactionReference}
                                    </span>
                                  )}
                                </div>
                              ) : isFree ? (
                                <span className="text-emerald-600 font-semibold">Free Event Registration</span>
                              ) : (
                                <span className="text-slate-400 italic">Awaiting payment submission</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                            <Link to={`/app/registrations/${reg.id}`}>
                              <Button size="sm" variant="outline" className="text-xs px-2.5 py-1">
                                Details
                              </Button>
                            </Link>

                            <div className="flex items-center gap-1.5">
                              {payment?.receiptUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setPreviewReceiptUrl(payment.receiptUrl)}
                                  title="View Receipt"
                                  icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                                />
                              )}

                              {isSubmitted && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => setVerifyModalAttendee(reg)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 font-bold"
                                >
                                  Approve
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-3.5 py-2.5">Participant</th>
                          <th className="px-3.5 py-2.5">Church</th>
                          <th className="px-3.5 py-2.5">Amount & Method</th>
                          <th className="px-3.5 py-2.5">Status</th>
                          <th className="px-3.5 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {filteredEventAttendees.map((reg) => {
                          const payment = reg.payment || (reg.payments && reg.payments[0]) || null;
                          const isConfirmed = reg.status === 'CONFIRMED' || reg.status === 'CHECKED_IN';
                          const isSubmitted = reg.status === 'PAYMENT_SUBMITTED';
                          const isMoMo = payment?.paymentMethod === 'MOBILE_MONEY' || payment?.transactionReference?.startsWith('MOMO');

                          return (
                            <tr key={reg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                              <td className="px-3.5 py-2.5">
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {reg.participantFirstName && reg.participantLastName
                                    ? `${reg.participantFirstName} ${reg.participantLastName}`
                                    : (reg.participantName || 'Participant')}
                                </p>
                                <p className="text-[10px] text-slate-500">{reg.participantPhone || reg.participantEmail || 'No phone'}</p>
                              </td>

                              <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                                {reg.churchName || 'Church Unit'}
                              </td>

                              <td className="px-3.5 py-2.5">
                                {payment ? (
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                      {isMoMo ? <Smartphone className="w-3 h-3 text-emerald-600" /> : <Receipt className="w-3 h-3 text-blue-600" />}
                                      {payment.paymentMethod?.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                ) : isFree ? (
                                  <span className="text-emerald-600 font-semibold">Free</span>
                                ) : (
                                  <span className="text-slate-400 italic">Unpaid</span>
                                )}
                              </td>

                              <td className="px-3.5 py-2.5">
                                {isConfirmed ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <Check className="w-3 h-3" /> Paid & Confirmed
                                  </span>
                                ) : isSubmitted ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                                    <Clock className="w-3 h-3" /> Pending Review
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                    Pending Payment
                                  </span>
                                )}
                              </td>

                              <td className="px-3.5 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {payment?.receiptUrl && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setPreviewReceiptUrl(payment.receiptUrl)}
                                      title="View Receipt"
                                      icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                                    />
                                  )}

                                  {isSubmitted && (
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => setVerifyModalAttendee(reg)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                                    >
                                      Approve
                                    </Button>
                                  )}

                                  <Link to={`/app/registrations/${reg.id}`}>
                                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                                      Details
                                    </Button>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

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

          {/* GATING: If Participant is NOT registered */}
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
                            {accommodationAssignment.room?.accommodation?.buildingName || accommodationAssignment.room?.accommodation?.name || 'Main Campsite Block'}
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
                    ) : (userRegistration?.roomDetails || userRegistration?.accommodation) ? (
                      <div className="p-4 bg-white rounded-lg border border-gray-200 flex items-center gap-3">
                        <Home className="w-5 h-5 text-primary-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{userRegistration.roomDetails || userRegistration.accommodation}</p>
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

          {/* Staff Assignments */}
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

          {/* Quick Stats */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Registrations</span>
                    <span className="font-semibold text-gray-900">{eventAttendees.length || event.registrationCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Paid & Confirmed</span>
                    <span className="font-semibold text-green-600">{confirmedAttendeesList.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Review</span>
                    <span className="font-semibold text-amber-600">{pendingReviewList.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Revenue</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(totalCollectedRevenue)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Quick Actions */}
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
                  <Link to={`/app/payments/verify`} className="block">
                    <Button variant="ghost" className="w-full justify-start" icon={<DollarSign className="w-4 h-4" />}>
                      Verification Desk
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

      {/* Receipt Image Preview Modal */}
      {previewReceiptUrl && (
        <Modal
          isOpen={!!previewReceiptUrl}
          onClose={() => setPreviewReceiptUrl(null)}
          title="Attendee Payment Receipt"
          size="lg"
        >
          <div className="space-y-4">
            <img 
              src={previewReceiptUrl} 
              alt="Payment Receipt" 
              className="w-full max-h-[70vh] object-contain rounded border border-gray-200"
            />
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setPreviewReceiptUrl(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Approval Modal */}
      {verifyModalAttendee && (
        <Modal
          isOpen={!!verifyModalAttendee}
          onClose={() => {
            setVerifyModalAttendee(null);
            setVerifyNotes('');
          }}
          title="Confirm Attendee Payment & Issue Ticket"
          size="md"
        >
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Attendee:</span>
                <strong className="text-slate-900 dark:text-white">
                  {verifyModalAttendee.participantFirstName} {verifyModalAttendee.participantLastName || verifyModalAttendee.participantName}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Required Fee:</span>
                <strong className="text-emerald-600">{formatCurrency(feeAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reg #:</span>
                <span className="font-mono font-semibold">{verifyModalAttendee.registrationNumber || `#${verifyModalAttendee.id}`}</span>
              </div>
            </div>

            <Textarea
              label="Verification Notes (Optional)"
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              placeholder="e.g. Verified against bank statement / MoMo batch."
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setVerifyModalAttendee(null);
                  setVerifyNotes('');
                }}
                disabled={verifyLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleExecutePaymentApproval}
                loading={verifyLoading}
                icon={<QrCode className="w-4 h-4" />}
              >
                Confirm & Issue QR Ticket
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
