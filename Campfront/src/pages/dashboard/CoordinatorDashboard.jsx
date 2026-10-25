import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, FileText, Users, CheckCircle2,
  Clock, AlertCircle, PlusCircle, Eye,
  CheckCircle, XCircle, ArrowRight, DollarSign,
  Smartphone, Receipt, ShieldCheck, Check,
  Search, Filter, RefreshCw, QrCode, Sparkles, ShieldAlert
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../hooks';
import { eventApi, proposalApi, paymentApi, registrationApi, readinessApi, getCachedData } from '../../api';
import { useTranslation } from '../../contexts/LanguageContext';
import MasterScheduleCalendar from '../../components/calendar/MasterScheduleCalendar';
import UpcomingEventsCardList from '../../components/ai/UpcomingEventsCardList';
import UpcomingEventInsightDrawer from '../../components/ai/UpcomingEventInsightDrawer';

export default function CoordinatorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    pendingProposals,
    pendingCount,
    loading: proposalsLoading,
    fetchPendingReview,
    fetchPendingCount,
    endorseProposal,
    fieldReviewProposal,
    requestRevision,
  } = useProposals();

  // Instant In-Memory Cache Initialization (Zero-Delay Instant UI Rendering)
  const cachedEvents = useMemo(() => {
    const cached = getCachedData('/events/my-events') || getCachedData('/events');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const cachedProposals = useMemo(() => {
    const cached = getCachedData('/proposals/my') || getCachedData('/proposals');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const cachedReadiness = useMemo(() => {
    const cached = getCachedData('/ai/readiness') || getCachedData('/analytics/readiness');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const cachedRegs = useMemo(() => {
    const cached = getCachedData('/registrations');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const cachedPays = useMemo(() => {
    const cached = getCachedData('/payments');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const initialMyRegs = useMemo(() => {
    if (cachedEvents.length === 0) return [];
    const eventIds = new Set(cachedEvents.map(e => e.id));
    return cachedRegs.filter(r => eventIds.has(r.event?.id || r.eventId));
  }, [cachedEvents, cachedRegs]);

  const initialMyPays = useMemo(() => {
    if (cachedEvents.length === 0) return [];
    const eventIds = new Set(cachedEvents.map(e => e.id));
    return cachedPays.filter(p => eventIds.has(p.registration?.event?.id || p.eventId));
  }, [cachedEvents, cachedPays]);

  const [myEvents, setMyEvents] = useState(cachedEvents);
  const [myProposals, setMyProposals] = useState(cachedProposals.slice(0, 5));
  const [stats, setStats] = useState({
    myEvents: cachedEvents.length,
    myProposals: cachedProposals.length,
    pendingReviews: pendingCount
  });
  const [loading, setLoading] = useState(cachedEvents.length === 0 && cachedProposals.length === 0);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Review modal state
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'endorse' | 'field-approve' | 'field-reject' | 'revision'
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // AI Readiness Drawer State
  const [selectedAiEventId, setSelectedAiEventId] = useState(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Event Payments & Attendee Reconciliation State
  const [eventRegistrations, setEventRegistrations] = useState(initialMyRegs);
  const [eventPayments, setEventPayments] = useState(initialMyPays);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING_REVIEW' | 'PAID' | 'UNPAID'
  const [paymentSearch, setPaymentSearch] = useState('');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState(null);
  const [quickPaymentModal, setQuickPaymentModal] = useState(null); // { registration, payment, action: 'verify'|'reject' }
  const [quickNotes, setQuickNotes] = useState('');
  const [quickActionLoading, setQuickActionLoading] = useState(false);

  // AI Readiness Early-Warning State
  const [readinessList, setReadinessList] = useState(cachedReadiness);
  const [readinessLoading, setReadinessLoading] = useState(cachedReadiness.length === 0);

  const isFieldLeader = user?.position === 'FIELD_LEADER';
  const isDistrictPastor = user?.position === 'DISTRICT_PASTOR';
  const isDeptLeader = user?.position === 'DEPARTMENT_LEADER';
  const isUnionLeader = user?.position === 'UNION_LEADER' || user?.position === 'UNION_ADMINISTRATOR';
  const isReviewer = isFieldLeader || isDistrictPastor || isUnionLeader;

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent && myEvents.length === 0 && myProposals.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      // Parallelize all requests in a single round trip
      const [eventsRes, proposalsRes, readinessRes, regsRes, paysRes] = await Promise.all([
        eventApi.getMyEvents().catch(() => ({ data: { data: [] } })),
        proposalApi.getMyProposals().catch(() => ({ data: { data: [] } })),
        readinessApi.getUpcoming().catch(() => ({ data: { data: [] } })),
        registrationApi.getAll().catch(() => ({ data: { data: [] } })),
        paymentApi.getAll().catch(() => ({ data: { data: [] } }))
      ]);

      const events = eventsRes.data?.data || eventsRes.data || [];
      const proposals = proposalsRes.data?.data || proposalsRes.data || [];
      const readinessData = readinessRes.data?.data || readinessRes.data || [];
      const allRegs = regsRes.data?.data || regsRes.data || [];
      const allPays = paysRes.data?.data || paysRes.data || [];

      setMyEvents(Array.isArray(events) ? events : []);
      setMyProposals(Array.isArray(proposals) ? proposals.slice(0, 5) : []);
      setReadinessList(Array.isArray(readinessData) ? readinessData : []);
      setStats({
        myEvents: events.length,
        myProposals: proposals.length,
        pendingReviews: pendingCount,
      });

      const eventIds = new Set(events.map(e => e.id));
      const myRegs = allRegs.filter(r => eventIds.has(r.event?.id || r.eventId));
      const myPays = allPays.filter(p => eventIds.has(p.registration?.event?.id || p.eventId));

      setEventRegistrations(myRegs);
      setEventPayments(myPays);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setPaymentsLoading(false);
      setReadinessLoading(false);
    }
  }, [user, pendingCount, myEvents.length, myProposals.length]);

  const fetchEventReconciliationData = async (eventsList = myEvents) => {
    try {
      setPaymentsLoading(true);
      const [regsRes, paysRes] = await Promise.all([
        registrationApi.getAll().catch(() => ({ data: { data: [] } })),
        paymentApi.getAll().catch(() => ({ data: { data: [] } }))
      ]);

      const allRegs = regsRes.data?.data || regsRes.data || [];
      const allPays = paysRes.data?.data || paysRes.data || [];

      const eventIds = new Set(eventsList.map(e => e.id));
      const myRegs = allRegs.filter(r => eventIds.has(r.event?.id || r.eventId));
      const myPays = allPays.filter(p => eventIds.has(p.registration?.event?.id || p.eventId));

      setEventRegistrations(myRegs);
      setEventPayments(myPays);
    } catch (e) {
      console.error('Error fetching coordinator payment data:', e);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReview();
    fetchPendingCount();
    fetchDashboardData(true);
  }, []);

  // Keep stats.pendingReviews in sync with pendingCount
  useEffect(() => {
    setStats(prev => ({ ...prev, pendingReviews: pendingCount }));
  }, [pendingCount]);

  const openReviewModal = (proposal, defaultAction = null) => {
    setSelectedProposal(proposal);
    setReviewAction(defaultAction);
    setComments('');
    setActionError(null);
  };

  const closeReviewModal = () => {
    setSelectedProposal(null);
    setReviewAction(null);
    setComments('');
    setActionError(null);
  };

  const handleAction = async () => {
    if (!selectedProposal || !reviewAction) return;
    if (reviewAction !== 'approve' && reviewAction !== 'endorse' && !comments.trim()) {
      setActionError('Please provide comments');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      if (reviewAction === 'endorse') {
        await endorseProposal(selectedProposal.id, comments || 'Endorsed');
        setSuccessMessage(`Proposal "${selectedProposal.eventName}" endorsed and escalated to Union Admin.`);
      } else if (reviewAction === 'approve' || reviewAction === 'field-approve') {
        await fieldReviewProposal(selectedProposal.id, 'APPROVED', comments);
        setSuccessMessage(`Proposal "${selectedProposal.eventName}" approved. Event auto-created.`);
      } else if (reviewAction === 'reject' || reviewAction === 'field-reject') {
        await fieldReviewProposal(selectedProposal.id, 'REJECTED', comments);
        setSuccessMessage(`Proposal "${selectedProposal.eventName}" rejected.`);
      } else if (reviewAction === 'revision') {
        await requestRevision(selectedProposal.id, comments);
        setSuccessMessage(`Revision requested for "${selectedProposal.eventName}".`);
      }
      closeReviewModal();
      await fetchDashboardData();
      await fetchPendingReview();
      await fetchPendingCount();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Payment Verification by Coordinator
  const handleExecuteQuickPaymentAction = async () => {
    if (!quickPaymentModal) return;
    const { payment, registration, action } = quickPaymentModal;
    setQuickActionLoading(true);

    try {
      if (action === 'verify') {
        if (payment && payment.id) {
          await paymentApi.verify(payment.id, quickNotes.trim() || null);
        } else {
          await registrationApi.confirm(registration.id);
        }
        setSuccessMessage(`Payment approved and registration confirmed for ${registration.participantName || 'attendee'}! QR Ticket issued.`);
      } else if (action === 'reject') {
        if (!quickNotes.trim()) {
          alert('Please enter a rejection reason');
          setQuickActionLoading(false);
          return;
        }
        if (payment && payment.id) {
          await paymentApi.reject(payment.id, quickNotes.trim());
        } else {
          await registrationApi.cancel(registration.id);
        }
        setSuccessMessage(`Payment for ${registration.participantName || 'attendee'} was marked as rejected.`);
      }

      setQuickPaymentModal(null);
      setQuickNotes('');
      await fetchDashboardData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payment status.');
    } finally {
      setQuickActionLoading(false);
    }
  };

  const getScopeBadge = (scope) => {
    const colors = {
      UNION: 'bg-purple-100 text-purple-700 border-purple-200',
      FIELD: 'bg-blue-100 text-blue-700 border-blue-200',
      DISTRICT: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    return (
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${colors[scope] || 'bg-gray-100 text-gray-700'}`}>
        {scope}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      PLANNED: 'info', REGISTRATION_OPEN: 'success', ONGOING: 'warning',
      COMPLETED: 'default', SUBMITTED: 'info', UNDER_REVIEW: 'warning',
      APPROVED: 'success', REJECTED: 'danger', REVISION_REQUESTED: 'warning', DRAFT: 'default',
    };
    return <Badge variant={map[status] || 'default'}>{status?.replace(/_/g, ' ')}</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Financial Computations for Coordinator's Events
  const totalRegistrationsCount = eventRegistrations.length;
  const confirmedAttendees = eventRegistrations.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN');
  const pendingReviewAttendees = eventRegistrations.filter(r => r.status === 'PAYMENT_SUBMITTED');
  const unpaidAttendees = eventRegistrations.filter(r => r.status === 'PENDING');

  const totalCollectedRevenue = eventPayments
    .filter(p => p.status === 'VERIFIED')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const totalPendingAmount = eventPayments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const totalExpectedRevenue = eventRegistrations.reduce((sum, r) => {
    const fee = r.event?.registrationFee || r.eventRegistrationFee || 0;
    return sum + (parseFloat(fee) || 0);
  }, 0);

  // Filtered Attendees for Reconciliation Table
  const filteredAttendees = eventRegistrations.filter(reg => {
    // Event filter
    if (selectedEventId !== 'ALL' && (reg.event?.id?.toString() !== selectedEventId && reg.eventId?.toString() !== selectedEventId)) {
      return false;
    }
    // Payment Status filter
    if (paymentStatusFilter === 'PENDING_REVIEW' && reg.status !== 'PAYMENT_SUBMITTED') return false;
    if (paymentStatusFilter === 'PAID' && reg.status !== 'CONFIRMED' && reg.status !== 'CHECKED_IN') return false;
    if (paymentStatusFilter === 'UNPAID' && reg.status !== 'PENDING') return false;

    // Search query
    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase();
      const matchName = (reg.participantName || `${reg.participantFirstName} ${reg.participantLastName}`).toLowerCase().includes(q);
      const matchChurch = (reg.churchName || '').toLowerCase().includes(q);
      const matchEvent = (reg.event?.name || reg.eventName || '').toLowerCase().includes(q);
      const matchPhone = (reg.participantPhone || '').includes(q);
      if (!matchName && !matchChurch && !matchEvent && !matchPhone) return false;
    }
    return true;
  });

  const getAvailableActions = (proposal) => {
    if ((isFieldLeader && proposal.scope === 'FIELD') || (isDistrictPastor && proposal.scope === 'DISTRICT')) {
      return [
        { key: 'approve', label: 'Approve & Create Event', icon: <CheckCircle className="w-4 h-4" />, variant: 'success' },
        { key: 'reject', label: 'Reject Proposal', icon: <XCircle className="w-4 h-4" />, variant: 'danger' },
        { key: 'revision', label: 'Request Changes', icon: <AlertCircle className="w-4 h-4" />, variant: 'warning' },
      ];
    }
    if (isDeptLeader && proposal.scope === 'UNION' && !proposal.deptLeaderEndorsed) {
      return [
        { key: 'endorse', label: 'Endorse & Escalate', icon: <ArrowRight className="w-4 h-4" />, variant: 'primary' },
        { key: 'revision', label: 'Request Changes', icon: <AlertCircle className="w-4 h-4" />, variant: 'warning' },
      ];
    }
    return [];
  };

  const pendingLabel = isDistrictPastor
    ? 'District Proposals Pending Your Review'
    : isFieldLeader
    ? 'Field Proposals Pending Your Review'
    : isDeptLeader
    ? 'Union Proposals Pending Your Endorsement'
    : 'Pending Reviews';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('dashboard.coordinatorDashboard', 'Coordinator Dashboard')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 font-medium">
            {t(`positions.${user?.position}`, user?.position?.replace(/_/g, ' '))} &mdash; {user?.organizationUnitName || t('header.unionName', 'Rwanda Union Mission')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/app/payments/verify">
            <Button variant="outline" icon={<ShieldCheck className="w-4 h-4" />}>
              {t('dashboard.verificationDesk', 'Verification Desk')} {pendingReviewAttendees.length > 0 && `(${pendingReviewAttendees.length})`}
            </Button>
          </Link>
          <Link to="/app/proposals/new">
            <Button variant="primary" icon={<PlusCircle className="w-4 h-4" />}>
              {t('dashboard.createProposal', 'New Proposal')}
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}

      {/* AI Future Preparation & Readiness Radar Executive Card */}
      {readinessList.length > 0 && (
        <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-0 shadow-lg overflow-hidden">
          <CardBody className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" /> AI Early-Warning Telemetry
                  </span>
                  <span className="text-xs text-slate-300">
                    {readinessList.length} Managed / Field Event(s) Evaluated
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Event Preparation Readiness & Bottleneck Detector
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Automated detection of lodging bed deficits, registration velocity lag, unverified MoMo payments, sound PA shortages, and speaker confirmation gaps.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {readinessList.slice(0, 2).map((ev) => {
                  const score = ev.overallReadinessScore;
                  const scoreBg = score >= 85 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : score >= 65 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                  return (
                    <div key={ev.eventId} className={`p-3 rounded-xl border ${scoreBg} flex items-center gap-3 bg-slate-900/60`}>
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-[140px]">{ev.eventName}</p>
                        <p className="text-[10px] text-slate-400">T-{ev.daysUntilStart} Days • {ev.warnings?.length || 0} Alert(s)</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black">{score}</span>
                        <span className="text-[10px] block opacity-80">/100</span>
                      </div>
                    </div>
                  );
                })}

                <Link to="/app/analytics">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-4 shadow-sm"
                  >
                    Open Readiness Radar <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.activeEvents', 'My Events')}</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">{myEvents.length}</p>
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1" />{t('dashboard.activeUsersNote', 'Active & upcoming')}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/60 p-3 rounded-2xl border border-blue-100 dark:border-blue-800/60">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('registrations.title', 'Event Attendees')}</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">{totalRegistrationsCount}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center font-medium">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />{confirmedAttendees.length} {t('participant.confirmed', 'confirmed')}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/60">
                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.pendingPayments', 'Pending Review')}</p>
                <p className="text-2xl font-extrabold text-amber-600 mt-1.5">{pendingReviewAttendees.length}</p>
                <p className="text-xs text-amber-600 mt-1 flex items-center font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1" />{t('dashboard.inQueue', 'Awaiting coordinator review')}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/60 p-3 rounded-2xl border border-amber-100 dark:border-amber-800/60">
                <Receipt className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.totalRevenue', 'Fees Collected')}</p>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1.5">
                  {formatCurrency(totalCollectedRevenue)}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {t('dashboard.targetFulfillment', 'Target')}: {formatCurrency(totalExpectedRevenue)}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/60">
                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Upcoming Events & AI Turnout Forecasts for Coordinator */}
      <UpcomingEventsCardList
        role="COORDINATOR"
        title="My Upcoming Events & AI Readiness Alerts"
        onSelectEventForInsight={(id) => {
          setSelectedAiEventId(id);
          setIsAiDrawerOpen(true);
        }}
      />

      {/* ======================================================== */}
      {/* CAMP EVENT ATTENDEE PAYMENT & RECONCILIATION DESK         */}
      {/* ======================================================== */}
      <Card className="border-2 border-primary-100 dark:border-primary-950 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary-50/70 via-white to-primary-50/30 dark:from-slate-800 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-slate-900 dark:text-white text-lg">
                Camp Event Attendee Payment & Reconciliation Desk
              </CardTitle>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Verify attendee payments for your events, review uploaded bank deposit slips and Mobile Money proofs, and issue check-in QR tickets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => fetchEventReconciliationData()}
              loading={paymentsLoading}
            >
              Refresh
            </Button>
            <Link to="/app/payments/verify">
              <Button variant="primary" size="sm" icon={<ShieldCheck className="w-4 h-4" />}>
                Go to Verification Desk
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardBody className="p-5 space-y-5">
          {/* Controls: Select Event + Status Filters + Search */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Event Dropdown Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Filter by Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="ALL">All My Events ({myEvents.length})</option>
                {myEvents.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({formatCurrency(e.registrationFee)})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Tabs */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Payment Status
              </label>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentStatusFilter('ALL')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition text-center ${
                    paymentStatusFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All ({eventRegistrations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatusFilter('PENDING_REVIEW')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition text-center flex items-center justify-center gap-1 ${
                    paymentStatusFilter === 'PENDING_REVIEW'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50'
                  }`}
                >
                  <span>Review</span>
                  {pendingReviewAttendees.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-700 text-[9px] font-black">
                      {pendingReviewAttendees.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatusFilter('PAID')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition text-center ${
                    paymentStatusFilter === 'PAID'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  Paid ({confirmedAttendees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatusFilter('UNPAID')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition text-center ${
                    paymentStatusFilter === 'UNPAID'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Unpaid ({unpaidAttendees.length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Search Attendee
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, phone, or church..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Attendee Payment Relevance Table */}
          {paymentsLoading && eventRegistrations.length === 0 && myEvents.length > 0 ? (
            <div className="text-center py-8">
              <PageSpinner message="Loading attendee payment records..." />
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No attendees match your filter.</p>
              <p className="text-xs text-slate-500 mt-0.5">Attendee registrations for your camp events will be displayed here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Attendee & Contact</th>
                    <th className="px-4 py-3">Event & Fee</th>
                    <th className="px-4 py-3">Payment Info</th>
                    <th className="px-4 py-3">Relevance & Status</th>
                    <th className="px-4 py-3 text-right">Verification Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredAttendees.map((reg) => {
                    const eventFee = reg.event?.registrationFee || reg.eventRegistrationFee || 0;
                    const payment = reg.payment || (reg.payments && reg.payments[0]) || null;
                    const isFreeEvent = !eventFee || Number(eventFee) === 0;
                    const isConfirmed = reg.status === 'CONFIRMED' || reg.status === 'CHECKED_IN';
                    const isSubmitted = reg.status === 'PAYMENT_SUBMITTED';
                    const isMoMo = payment?.paymentMethod === 'MOBILE_MONEY' || payment?.transactionReference?.startsWith('MOMO');

                    return (
                      <tr key={reg.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {reg.participantFirstName && reg.participantLastName
                              ? `${reg.participantFirstName} ${reg.participantLastName}`
                              : (reg.participantName || 'Attendee')}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {reg.participantPhone || reg.participantEmail || 'No phone'} &bull; {reg.churchName || 'Church Unit'}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {reg.event?.name || reg.eventName}
                          </p>
                          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            {isFreeEvent ? 'Free Event' : formatCurrency(eventFee)}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          {payment ? (
                            <div className="space-y-0.5">
                              <p className="font-black text-slate-900 dark:text-white">
                                {formatCurrency(payment.amount)}
                              </p>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                {isMoMo ? (
                                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <Smartphone className="w-3 h-3" /> MoMo Instant
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                                    <Receipt className="w-3 h-3" /> {payment.paymentMethod?.replace(/_/g, ' ') || 'Bank Slip'}
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-[10px] text-slate-400">
                                Ref: {payment.transactionReference}
                              </p>
                            </div>
                          ) : isFreeEvent ? (
                            <span className="text-emerald-600 font-medium text-xs">No fee required</span>
                          ) : (
                            <span className="text-amber-600 font-medium text-xs">Awaiting fee submission</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {isConfirmed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3" /> Paid & Confirmed
                            </span>
                          ) : isSubmitted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                              <Clock className="w-3 h-3" /> Receipt Submitted (Action Required)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                              <Clock className="w-3 h-3" /> Pending Payment
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {payment?.receiptUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPreviewReceiptUrl(payment.receiptUrl)}
                                title="View Receipt Proof"
                                icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                              />
                            )}

                            {isSubmitted && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => setQuickPaymentModal({ registration: reg, payment, action: 'verify' })}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 font-bold"
                                icon={<Check className="w-3.5 h-3.5" />}
                              >
                                Approve & Issue Ticket
                              </Button>
                            )}

                            <Link to={`/app/registrations/${reg.id}`}>
                              <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                                View Details
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scope-aware pending proposals to review */}
        {(isFieldLeader || isDistrictPastor || isDeptLeader || isUnionLeader) && (
          <Card className="lg:col-span-2 border-l-4 border-l-primary-500 shadow-sm">
            <CardHeader action={
              <Link to="/app/proposals">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            }>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary-600" />
                <CardTitle>{pendingLabel} ({pendingProposals.length})</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              {proposalsLoading ? (
                <p className="text-sm text-gray-500 text-center py-6">Loading...</p>
              ) : pendingProposals.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No proposals currently pending your review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingProposals.slice(0, 5).map(proposal => (
                    <div key={proposal.id} className="p-4 border border-gray-200 rounded-xl hover:border-primary-200 hover:bg-primary-50/20 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-base">{proposal.eventName}</p>
                            {getScopeBadge(proposal.scope)}
                            {getStatusBadge(proposal.status)}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            <strong>Proposed By:</strong> {proposal.proposedByName} &bull; <strong>Dept:</strong> {proposal.departmentName} &bull; <strong>Target Unit:</strong> {proposal.targetOrganizationUnitName || 'Union'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            <strong>Dates:</strong> {proposal.startDate} to {proposal.endDate} &bull; <strong>Venue:</strong> {proposal.venue}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          {(isFieldLeader || isDistrictPastor) && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                icon={<CheckCircle className="w-4 h-4" />}
                                onClick={() => openReviewModal(proposal, 'approve')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                icon={<XCircle className="w-4 h-4" />}
                                onClick={() => openReviewModal(proposal, 'reject')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {isDeptLeader && proposal.scope === 'UNION' && (
                            <Button
                              size="sm"
                              variant="primary"
                              icon={<ArrowRight className="w-4 h-4" />}
                              onClick={() => openReviewModal(proposal, 'endorse')}
                            >
                              Endorse
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => openReviewModal(proposal)}
                          >
                            Review / Changes
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* RUM Master Schedule & Conflict Visualizer */}
        <MasterScheduleCalendar />

        {/* Main Content Grid: My Events */}
        <Card>
          <CardHeader action={
            <Link to="/app/events">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          }>
            <CardTitle>My Events ({myEvents.length})</CardTitle>
          </CardHeader>
          <CardBody>
            {myEvents.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No events assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myEvents.map(event => (
                  <div key={event.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{event.name}</p>
                          {getStatusBadge(event.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(event.startDate).toLocaleDateString('en-RW')}
                          &nbsp;&bull;&nbsp;
                          <DollarSign className="w-3 h-3 inline mr-1 text-emerald-600" />
                          Fee: {formatCurrency(event.registrationFee)}
                        </p>
                      </div>
                      <Link to={`/app/events/${event.id}`} state={{ event }}>
                        <Button variant="outline" size="sm">Manage Event</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* My recent proposals */}
        <Card>
          <CardHeader action={
            <Link to="/app/proposals">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          }>
            <CardTitle>My Proposals</CardTitle>
          </CardHeader>
          <CardBody>
            {myProposals.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No proposals yet</p>
                <Link to="/app/proposals/new">
                  <Button variant="primary" size="sm" className="mt-3">Create First Proposal</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myProposals.map(proposal => (
                  <div key={proposal.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm truncate">{proposal.eventName}</p>
                          {getScopeBadge(proposal.scope)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(proposal.status)}
                          {proposal.scope === 'UNION' && proposal.deptLeaderEndorsed && (
                            <span className="text-xs text-green-600 font-medium">&#10003; Endorsed</span>
                          )}
                        </div>
                      </div>
                      <Link to={`/app/proposals/${proposal.id}`} state={{ proposal }}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/app/proposals/new">
              <Button variant="outline" className="w-full" icon={<FileText className="w-4 h-4" />}>
                Create Proposal
              </Button>
            </Link>
            <Link to="/app/registrations">
              <Button variant="outline" className="w-full" icon={<Users className="w-4 h-4" />}>
                Registrations
              </Button>
            </Link>
            <Link to="/app/payments/verify">
              <Button variant="outline" className="w-full" icon={<DollarSign className="w-4 h-4" />}>
                Verify Payments
              </Button>
            </Link>
            <Link to="/app/attendance">
              <Button variant="outline" className="w-full" icon={<CheckCircle2 className="w-4 h-4" />}>
                Attendance Check-In
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Receipt Image Preview Modal */}
      {previewReceiptUrl && (
        <Modal
          isOpen={!!previewReceiptUrl}
          onClose={() => setPreviewReceiptUrl(null)}
          title="Payment Receipt Proof"
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

      {/* Quick Payment Approval Modal */}
      {quickPaymentModal && (
        <Modal
          isOpen={!!quickPaymentModal}
          onClose={() => {
            setQuickPaymentModal(null);
            setQuickNotes('');
          }}
          title={quickPaymentModal.action === 'verify' ? "Approve Event Attendee Payment" : "Reject Payment Proof"}
          size="md"
        >
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Attendee:</span>
                <strong className="text-slate-900 dark:text-white">
                  {quickPaymentModal.registration?.participantFirstName} {quickPaymentModal.registration?.participantLastName || quickPaymentModal.registration?.participantName}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Event:</span>
                <strong className="text-slate-900 dark:text-white">{quickPaymentModal.registration?.event?.name || quickPaymentModal.registration?.eventName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee Amount:</span>
                <strong className="text-emerald-600">
                  {formatCurrency(quickPaymentModal.payment?.amount || quickPaymentModal.registration?.event?.registrationFee || quickPaymentModal.registration?.eventRegistrationFee)}
                </strong>
              </div>
              {quickPaymentModal.payment?.transactionReference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference:</span>
                  <span className="font-mono">{quickPaymentModal.payment.transactionReference}</span>
                </div>
              )}
            </div>

            {quickPaymentModal.action === 'verify' ? (
              <div className="space-y-2">
                <Alert
                  type="info"
                  message="Confirming this payment will immediately update the participant's status to CONFIRMED and issue their entry QR Ticket badge."
                />
                <Textarea
                  label="Coordinator Notes (Optional)"
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  placeholder="e.g. Verified against church deposit batch / MoMo statement."
                  rows={3}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Alert
                  type="warning"
                  message="Please provide a clear reason for rejection."
                />
                <Textarea
                  label="Rejection Reason"
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  placeholder="e.g. Deposit slip illegible, incorrect amount."
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setQuickPaymentModal(null);
                  setQuickNotes('');
                }}
                disabled={quickActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={quickPaymentModal.action === 'verify' ? 'primary' : 'danger'}
                onClick={handleExecuteQuickPaymentAction}
                loading={quickActionLoading}
              >
                {quickPaymentModal.action === 'verify' ? 'Approve & Issue Ticket' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      {selectedProposal && (
        <Modal
          isOpen={!!selectedProposal}
          onClose={closeReviewModal}
          title="Review Proposal"
          size="lg"
        >
          <div className="space-y-4">
            {/* Proposal summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-base">{selectedProposal.eventName}</h3>
                {getScopeBadge(selectedProposal.scope)}
                {getStatusBadge(selectedProposal.status)}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-gray-600">
                <span><strong>Type:</strong> {selectedProposal.eventType}</span>
                <span><strong>Dept:</strong> {selectedProposal.departmentName}</span>
                <span><strong>By:</strong> {selectedProposal.proposedByName}</span>
                <span><strong>Target:</strong> {selectedProposal.targetOrganizationUnitName}</span>
                <span><strong>Dates:</strong> {selectedProposal.startDate} &rarr; {selectedProposal.endDate}</span>
                <span><strong>Venue:</strong> {selectedProposal.venue}</span>
              </div>
              <div>
                <strong className="text-gray-700">Objectives:</strong>
                <p className="mt-1 text-gray-600">{selectedProposal.objectives}</p>
              </div>
              {selectedProposal.reviewComments && (
                <div>
                  <strong className="text-gray-700">Previous Comments:</strong>
                  <p className="mt-1 italic text-gray-500">{selectedProposal.reviewComments}</p>
                </div>
              )}
            </div>

            {actionError && <Alert type="error" message={actionError} />}

            {/* Action buttons */}
            {!reviewAction ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Select action:</p>
                {getAvailableActions(selectedProposal).map(action => (
                  <Button
                    key={action.key}
                    variant={action.variant}
                    icon={action.icon}
                    className="w-full justify-start"
                    onClick={() => setReviewAction(action.key)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Action: <span className="text-primary-600 uppercase">{reviewAction.replace('-', ' ')}</span>
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => { setReviewAction(null); setComments(''); setActionError(null); }}>
                    Change
                  </Button>
                </div>

                {reviewAction !== 'field-approve' && (
                  <Textarea
                    label="Comments"
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    placeholder="Enter your comments..."
                    rows={3}
                    required={reviewAction !== 'endorse'}
                  />
                )}

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    loading={actionLoading}
                    onClick={handleAction}
                  >
                    Confirm
                  </Button>
                  <Button variant="outline" onClick={closeReviewModal} disabled={actionLoading}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* AI Readiness Insight Drawer */}
      <UpcomingEventInsightDrawer
        eventId={selectedAiEventId}
        isOpen={isAiDrawerOpen}
        onClose={() => {
          setIsAiDrawerOpen(false);
          setSelectedAiEventId(null);
        }}
        onRefreshSuccess={() => {}}
      />
    </div>
  );
}
