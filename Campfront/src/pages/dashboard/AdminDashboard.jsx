import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Building,
  Church,
  BookOpen,
  ShieldCheck,
  Award,
  Smartphone,
  Receipt,
  Search,
  Check,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  Radio,
  MapPin,
  Mail,
  Phone,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Zap,
  Compass,
  Layers,
  Globe,
  Download,
  Printer,
  LayoutGrid,
  List,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useDashboard, useProposals } from '../../hooks';
import { eventApi, paymentApi, registrationApi, readinessApi, getCachedData, organizationApi } from '../../api';

import { useTranslation } from '../../contexts/LanguageContext';

import MasterScheduleCalendar from '../../components/calendar/MasterScheduleCalendar';
import UpcomingEventsCardList from '../../components/ai/UpcomingEventsCardList';
import UpcomingEventInsightDrawer from '../../components/ai/UpcomingEventInsightDrawer';

export const OFFICIAL_RUM_FIELD_CODES = ['CRF', 'ECRF', 'NRF', 'NERF', 'NWRF', 'SRF', 'SERF', 'WRF'];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [filterUnit, setFilterUnit] = useState({
    fieldId: '',
    districtId: '',
    fieldName: '',
    districtName: '',
    fieldCode: '',
    districtCode: '',
    field: null,
    district: null
  });
  const [fieldDistricts, setFieldDistricts] = useState([]);
  const [loadingFieldDistricts, setLoadingFieldDistricts] = useState(false);
  const [districtSearchQuery, setDistrictSearchQuery] = useState('');
  const [isDistrictsExpanded, setIsDistrictsExpanded] = useState(true);

  // Available 8 Official Fields & All Districts for fast, lightweight search
  const [availableFields, setAvailableFields] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  const { stats, loading: statsLoading, error: statsError, refreshStats } = useDashboard();
  const {
    pendingProposals,
    loading: proposalsLoading,
    error: proposalsError,
    fetchPendingReview,
    approveProposal,
    rejectProposal,
    requestRevision
  } = useProposals();

  // Instant In-Memory Cache Initialization (Zero-Delay Instant UI Rendering)
  const cachedEvents = useMemo(() => {
    const cached = getCachedData('/events/upcoming') || getCachedData('/events');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const cachedPayments = useMemo(() => {
    const cached = getCachedData('/payments');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const cachedRegistrations = useMemo(() => {
    const cached = getCachedData('/registrations');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const cachedReadiness = useMemo(() => {
    const cached = getCachedData('/ai/readiness') || getCachedData('/analytics/readiness');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const [upcomingEvents, setUpcomingEvents] = useState(cachedEvents.slice(0, 5));
  const [monthlyData, setMonthlyData] = useState([]);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'approve', 'reject', 'revision'
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Payments & Reconciliation State
  const [paymentsViewMode, setPaymentsViewMode] = useState('grid');
  const [payments, setPayments] = useState(cachedPayments);
  const [registrations, setRegistrations] = useState(cachedRegistrations);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  const [paymentSearch, setPaymentSearch] = useState('');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState(null);
  const [selectedPaymentForAction, setSelectedPaymentForAction] = useState(null);
  const [paymentActionType, setPaymentActionType] = useState(null); // 'verify' | 'reject'
  const [paymentActionNotes, setPaymentActionNotes] = useState('');
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  // AI Readiness Early-Warning State
  const [readinessList, setReadinessList] = useState(cachedReadiness);
  const [readinessLoading, setReadinessLoading] = useState(cachedReadiness.length === 0);
  const [selectedAiEventId, setSelectedAiEventId] = useState(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  useEffect(() => {
    fetchPendingReview();
    fetchUpcomingEvents();
    fetchPaymentsAndRegistrations(cachedPayments.length > 0);
    fetchReadinessData(cachedReadiness.length > 0);
  }, []);

  const fetchReadinessData = async (isBackground = false) => {
    try {
      if (!isBackground && readinessList.length === 0) setReadinessLoading(true);
      const res = await readinessApi.getUpcoming();
      const list = res.data?.data || res.data || [];
      setReadinessList(Array.isArray(list) ? list : []);
    } finally {
      setReadinessLoading(false);
    }
  };

  // Load Districts for the selected field
  useEffect(() => {
    let isMounted = true;
    if (!filterUnit.fieldId) {
      setFieldDistricts([]);
      return;
    }

    const loadDistricts = async () => {
      setLoadingFieldDistricts(true);
      try {
        const res = await organizationApi.getChildren(filterUnit.fieldId).catch(() => null);
        const data = res?.data?.data || [];
        if (isMounted && Array.isArray(data)) {
          data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setFieldDistricts(data);
        }
      } catch (err) {
        console.error('Failed to load districts for selected field:', err);
      } finally {
        if (isMounted) setLoadingFieldDistricts(false);
      }
    };

    loadDistricts();
    return () => { isMounted = false; };
  }, [filterUnit.fieldId]);

  // Initial load of 8 official RUM fields and districts for fast searching
  useEffect(() => {
    let isMounted = true;
    const loadUnits = async () => {
      try {
        const [fieldsRes, distsRes] = await Promise.all([
          organizationApi.getFields().catch(() => organizationApi.getByLevel('FIELD')),
          organizationApi.getByLevel('DISTRICT').catch(() => ({ data: { data: [] } }))
        ]);

        const rawFields = fieldsRes?.data?.data || [];
        const filteredFields = rawFields.filter(f =>
          OFFICIAL_RUM_FIELD_CODES.includes(f.code) ||
          ['central', 'east central', 'north rwanda', 'north-east', 'north-west', 'south rwanda', 'south-east', 'west rwanda'].some(n => (f.name || '').toLowerCase().includes(n))
        );

        const uniqueFieldMap = new Map();
        filteredFields.forEach(f => {
          if (!uniqueFieldMap.has(f.code || f.name)) {
            uniqueFieldMap.set(f.code || f.name, f);
          }
        });
        const finalFields = Array.from(uniqueFieldMap.values());
        finalFields.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        if (isMounted) setAvailableFields(finalFields);

        const rawDist = distsRes?.data?.data || [];
        if (Array.isArray(rawDist) && isMounted) {
          rawDist.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setAvailableDistricts(rawDist);
        }
      } catch (err) {
        console.error('Error loading fields/districts for admin filter:', err);
      }
    };

    loadUnits();
    return () => { isMounted = false; };
  }, []);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (stats) {
      generateMonthlyData();
    }
  }, [stats]);

  const fetchUpcomingEvents = async () => {
    try {
      const response = await eventApi.getUpcoming();
      const events = response.data?.data || response.data || [];
      if (Array.isArray(events)) {
        setUpcomingEvents(events.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    }
  };

  const fetchPaymentsAndRegistrations = async (isBackground = false) => {
    try {
      if (!isBackground && payments.length === 0) setPaymentsLoading(true);
      const [payRes, regRes] = await Promise.all([
        paymentApi.getAll().catch(() => ({ data: { data: [] } })),
        registrationApi.getAll().catch(() => ({ data: { data: [] } }))
      ]);

      const payData = payRes.data?.data || payRes.data || [];
      const regData = regRes.data?.data || regRes.data || [];
      setPayments(Array.isArray(payData) ? payData : []);
      setRegistrations(Array.isArray(regData) ? regData : []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map((month) => ({
      month,
      events: Math.floor(Math.random() * 20) + 5,
      participants: Math.floor(Math.random() * 200) + 50
    }));
    setMonthlyData(data);
  };

  const handleOpenProposalModal = (proposal) => {
    setSelectedProposal(proposal);
    setShowProposalModal(true);
    setComments('');
    setReviewAction(null);
    setActionError(null);
  };

  const handleCloseProposalModal = () => {
    setShowProposalModal(false);
    setSelectedProposal(null);
    setComments('');
    setReviewAction(null);
    setActionError(null);
  };

  const handleProposalAction = async () => {
    if (!selectedProposal || !reviewAction) return;

    setActionLoading(true);
    setActionError(null);

    try {
      if (reviewAction === 'approve') {
        await approveProposal(selectedProposal.id);
        setSuccessMessage(`Proposal "${selectedProposal.eventName}" approved successfully! Event has been auto-created.`);
      } else if (reviewAction === 'reject') {
        if (!comments.trim()) {
          setActionError('Please provide rejection comments');
          setActionLoading(false);
          return;
        }
        await rejectProposal(selectedProposal.id, comments);
        setSuccessMessage(`Proposal "${selectedProposal.eventName}" rejected.`);
      } else if (reviewAction === 'revision') {
        if (!comments.trim()) {
          setActionError('Please provide revision comments');
          setActionLoading(false);
          return;
        }
        await requestRevision(selectedProposal.id, comments);
        setSuccessMessage(`Revision requested for proposal "${selectedProposal.eventName}".`);
      }

      handleCloseProposalModal();
      await refreshStats();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to process proposal');
    } finally {
      setActionLoading(false);
    }
  };

  // Payment Quick Actions
  const handleOpenPaymentAction = (payment, action) => {
    setSelectedPaymentForAction(payment);
    setPaymentActionType(action);
    setPaymentActionNotes('');
  };

  const handleExecutePaymentAction = async () => {
    if (!selectedPaymentForAction || !paymentActionType) return;
    setPaymentActionLoading(true);

    try {
      if (paymentActionType === 'verify') {
        await paymentApi.verify(selectedPaymentForAction.id, paymentActionNotes.trim() || null);
        setSuccessMessage(`Payment for ${selectedPaymentForAction.participantName || 'registration'} verified! Ticket QR code generated.`);
      } else if (paymentActionType === 'reject') {
        if (!paymentActionNotes.trim()) {
          alert('Please provide a reason for rejecting the payment');
          setPaymentActionLoading(false);
          return;
        }
        await paymentApi.reject(selectedPaymentForAction.id, paymentActionNotes.trim());
        setSuccessMessage(`Payment reference ${selectedPaymentForAction.transactionReference} marked as rejected.`);
      }

      setSelectedPaymentForAction(null);
      setPaymentActionType(null);
      setPaymentActionNotes('');
      await fetchPaymentsAndRegistrations();
      await refreshStats();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      SUBMITTED: 'info',
      UNDER_REVIEW: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      REVISION_REQUESTED: 'warning',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Clear / Reset filter completely
  const handleClearFilter = () => {
    setFilterUnit({
      fieldId: '',
      districtId: '',
      fieldName: '',
      districtName: '',
      fieldCode: '',
      districtCode: '',
      field: null,
      district: null
    });
    setDistrictSearchQuery('');
    setSearchQuery('');
  };

  const handleSelectField = (field) => {
    setFilterUnit({
      fieldId: field.id,
      districtId: '',
      fieldName: field.name,
      districtName: '',
      fieldCode: field.code,
      districtCode: '',
      field: field,
      district: null
    });
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleSelectDistrict = (district) => {
    const parentField = availableFields.find(f => String(f.id) === String(district.parentId)) || null;
    setFilterUnit({
      fieldId: district.parentId || (parentField ? parentField.id : ''),
      districtId: district.id,
      fieldName: parentField ? parentField.name : (filterUnit.fieldName || 'North Rwanda Field'),
      districtName: district.name,
      fieldCode: parentField ? parentField.code : (filterUnit.fieldCode || 'NRF'),
      districtCode: district.code,
      field: parentField || filterUnit.field,
      district: district
    });
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  // Instant global search computation across the 8 fields and districts
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return { fields: availableFields, districts: [] };
    }
    const q = searchQuery.toLowerCase().trim();
    const matchedFields = availableFields.filter(f =>
      (f.name || '').toLowerCase().includes(q) ||
      (f.code || '').toLowerCase().includes(q) ||
      (f.location || '').toLowerCase().includes(q)
    );
    const matchedDistricts = availableDistricts.filter(d =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.code || '').toLowerCase().includes(q) ||
      (d.location || '').toLowerCase().includes(q) ||
      (d.leader || '').toLowerCase().includes(q)
    ).slice(0, 15);

    return { fields: matchedFields, districts: matchedDistricts };
  }, [searchQuery, availableFields, availableDistricts]);

  // Selected Field / District metadata
  const isFieldActive = Boolean(filterUnit.fieldId);
  const isDistrictActive = Boolean(filterUnit.districtId);

  const activeFieldName = filterUnit.fieldName || filterUnit.field?.name || (filterUnit.fieldCode === 'NRF' ? 'North Rwanda Field' : '');
  const activeFieldCode = filterUnit.fieldCode || filterUnit.field?.code || (activeFieldName.toLowerCase().includes('north') ? 'NRF' : '');
  const activeDistrictName = filterUnit.districtName || filterUnit.district?.name || '';
  const activeDistrictCode = filterUnit.districtCode || filterUnit.district?.code || '';

  // Districts matching search inside the field report card
  const filteredFieldDistricts = useMemo(() => {
    if (!districtSearchQuery.trim()) return fieldDistricts;
    const q = districtSearchQuery.toLowerCase().trim();
    return fieldDistricts.filter(d =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.code || '').toLowerCase().includes(q) ||
      (d.leader || '').toLowerCase().includes(q) ||
      (d.location || '').toLowerCase().includes(q)
    );
  }, [fieldDistricts, districtSearchQuery]);

  // Scoped Event matching
  const scopedEvents = useMemo(() => {
    if (!isFieldActive && !isDistrictActive) return upcomingEvents;

    return upcomingEvents.filter(event => {
      const venue = (event.venue || '').toLowerCase();
      const venueAddr = (event.venueAddress || '').toLowerCase();
      const coordOrg = event.coordinator?.organizationUnit;
      const targetUnit = event.proposal?.targetOrganizationUnit;

      if (isDistrictActive) {
        const dId = String(filterUnit.districtId);
        const dName = activeDistrictName.toLowerCase();
        const dCode = activeDistrictCode.toLowerCase();

        return (
          String(coordOrg?.id) === dId ||
          String(targetUnit?.id) === dId ||
          venue.includes(dName) ||
          venueAddr.includes(dName) ||
          (dCode && (venue.includes(dCode) || venueAddr.includes(dCode)))
        );
      }

      if (isFieldActive) {
        const fId = String(filterUnit.fieldId);
        const fName = activeFieldName.toLowerCase();
        const fCode = activeFieldCode.toLowerCase();

        const matchesCoord = String(coordOrg?.id) === fId || String(coordOrg?.parentId) === fId;
        const matchesTarget = String(targetUnit?.id) === fId || String(targetUnit?.parentId) === fId;
        const matchesVenue = venue.includes(fName) || (fCode && venue.includes(fCode)) ||
                             venueAddr.includes(fName) || (fCode && venueAddr.includes(fCode)) ||
                             (fCode === 'nrf' && (venue.includes('musanze') || venue.includes('northern') || venue.includes('gicumbi') || venue.includes('nyabihu')));

        const matchesDistrict = fieldDistricts.some(d =>
          venue.includes(d.name?.toLowerCase()) ||
          (d.code && venue.includes(d.code.toLowerCase()))
        );

        return matchesCoord || matchesTarget || matchesVenue || matchesDistrict;
      }

      return true;
    });
  }, [upcomingEvents, isFieldActive, isDistrictActive, filterUnit, activeFieldName, activeFieldCode, activeDistrictName, activeDistrictCode, fieldDistricts]);

  // Scoped Payments matching
  const scopedPayments = useMemo(() => {
    if (!isFieldActive && !isDistrictActive) return payments;

    return payments.filter(payment => {
      const reg = payment.registration;
      const church = (reg?.churchName || payment.churchName || '').toLowerCase();
      const sdaDist = (reg?.sdaDistrict || '').toLowerCase();
      const partOrg = reg?.participant?.organizationUnit;
      const eventVenue = (reg?.event?.venue || payment.eventName || '').toLowerCase();

      if (isDistrictActive) {
        const dId = String(filterUnit.districtId);
        const dName = activeDistrictName.toLowerCase();
        const dCode = activeDistrictCode.toLowerCase();

        return (
          String(partOrg?.id) === dId ||
          String(partOrg?.parentId) === dId ||
          church.includes(dName) ||
          sdaDist.includes(dName) ||
          (dCode && (church.includes(dCode) || sdaDist.includes(dCode))) ||
          eventVenue.includes(dName)
        );
      }

      if (isFieldActive) {
        const fId = String(filterUnit.fieldId);
        const fName = activeFieldName.toLowerCase();
        const fCode = activeFieldCode.toLowerCase();

        const matchesOrg = String(partOrg?.id) === fId || String(partOrg?.parentId) === fId;
        const matchesCode = (fCode && (church.includes(fCode) || sdaDist.includes(fCode) || eventVenue.includes(fCode)));
        const matchesName = church.includes(fName) || sdaDist.includes(fName) || eventVenue.includes(fName);
        const matchesNRFKeywords = fCode === 'nrf' && (
          church.includes('musanze') || church.includes('northern') ||
          sdaDist.includes('musanze') || sdaDist.includes('gicumbi') || sdaDist.includes('nyabihu') ||
          eventVenue.includes('musanze') || eventVenue.includes('northern')
        );

        const matchesDistrict = fieldDistricts.some(d =>
          church.includes(d.name?.toLowerCase()) ||
          sdaDist.includes(d.name?.toLowerCase()) ||
          (d.code && (church.includes(d.code.toLowerCase()) || sdaDist.includes(d.code.toLowerCase())))
        );

        return matchesOrg || matchesCode || matchesName || matchesNRFKeywords || matchesDistrict;
      }

      return true;
    });
  }, [payments, isFieldActive, isDistrictActive, filterUnit, activeFieldName, activeFieldCode, activeDistrictName, activeDistrictCode, fieldDistricts]);

  // Scoped Registrations matching
  const scopedRegistrations = useMemo(() => {
    if (!isFieldActive && !isDistrictActive) return registrations;

    return registrations.filter(reg => {
      const church = (reg.churchName || '').toLowerCase();
      const sdaDist = (reg.sdaDistrict || '').toLowerCase();
      const partOrg = reg.participant?.organizationUnit;
      const eventVenue = (reg.event?.venue || reg.eventName || '').toLowerCase();

      if (isDistrictActive) {
        const dId = String(filterUnit.districtId);
        const dName = activeDistrictName.toLowerCase();
        return String(partOrg?.id) === dId || church.includes(dName) || sdaDist.includes(dName) || eventVenue.includes(dName);
      }

      if (isFieldActive) {
        const fId = String(filterUnit.fieldId);
        const fName = activeFieldName.toLowerCase();
        const fCode = activeFieldCode.toLowerCase();

        return String(partOrg?.id) === fId || 
               church.includes(fName) || (fCode && church.includes(fCode)) ||
               sdaDist.includes(fName) || (fCode && sdaDist.includes(fCode)) ||
               eventVenue.includes(fName) ||
               fieldDistricts.some(d => church.includes(d.name?.toLowerCase()) || sdaDist.includes(d.name?.toLowerCase()));
      }

      return true;
    });
  }, [registrations, isFieldActive, isDistrictActive, filterUnit, activeFieldName, activeFieldCode, activeDistrictName, fieldDistricts]);

  // Scoped Proposals matching
  const scopedProposals = useMemo(() => {
    if (!isFieldActive && !isDistrictActive) return pendingProposals;

    return pendingProposals.filter(proposal => {
      const targetUnit = proposal.targetOrganizationUnit;
      const proposedByUnit = proposal.proposedBy?.organizationUnit;
      const venue = (proposal.venue || '').toLowerCase();

      if (isDistrictActive) {
        const dId = String(filterUnit.districtId);
        const dName = activeDistrictName.toLowerCase();
        return String(targetUnit?.id) === dId || String(proposedByUnit?.id) === dId || venue.includes(dName);
      }

      if (isFieldActive) {
        const fId = String(filterUnit.fieldId);
        const fName = activeFieldName.toLowerCase();
        const fCode = activeFieldCode.toLowerCase();

        return String(targetUnit?.id) === fId || String(targetUnit?.parentId) === fId ||
               String(proposedByUnit?.id) === fId || String(proposedByUnit?.parentId) === fId ||
               venue.includes(fName) || (fCode && venue.includes(fCode)) ||
               fieldDistricts.some(d => String(targetUnit?.id) === String(d.id) || venue.includes(d.name?.toLowerCase()));
      }

      return true;
    });
  }, [pendingProposals, isFieldActive, isDistrictActive, filterUnit, activeFieldName, activeFieldCode, activeDistrictName, fieldDistricts]);

  // Scoped Readiness list
  const scopedReadiness = useMemo(() => {
    if (!isFieldActive && !isDistrictActive) return readinessList;
    return readinessList.filter(ev => {
      const evName = (ev.eventName || '').toLowerCase();
      const fName = activeFieldName.toLowerCase();
      const fCode = activeFieldCode.toLowerCase();
      return evName.includes(fName) || (fCode && evName.includes(fCode)) || scopedEvents.some(se => se.id === ev.eventId);
    });
  }, [readinessList, isFieldActive, isDistrictActive, activeFieldName, activeFieldCode, scopedEvents]);

  // Financial Computations for Admin
  const verifiedPayments = scopedPayments.filter(p => p.status === 'VERIFIED');
  const pendingPayments = scopedPayments.filter(p => p.status === 'PENDING');
  const rejectedPayments = scopedPayments.filter(p => p.status === 'REJECTED');

  const totalVerifiedRevenue = verifiedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const totalExpectedRevenue = scopedRegistrations.reduce((sum, r) => {
    const fee = r.event?.registrationFee || r.eventRegistrationFee || 0;
    return sum + (parseFloat(fee) || 0);
  }, 0);

  const collectionRate = totalExpectedRevenue > 0
    ? Math.min(100, Math.round((totalVerifiedRevenue / totalExpectedRevenue) * 100))
    : 100;

  // Filtered Payments for Reconciliation Table
  const filteredPayments = scopedPayments.filter(p => {
    if (paymentFilter !== 'ALL' && p.status !== paymentFilter) return false;
    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase();
      const matchName = (p.participantName || '').toLowerCase().includes(q);
      const matchRef = (p.transactionReference || '').toLowerCase().includes(q);
      const matchEvent = (p.eventName || '').toLowerCase().includes(q);
      if (!matchName && !matchRef && !matchEvent) return false;
    }
    return true;
  });

  // Dynamic High-Level Metric Values
  const displayTotalUsers = isDistrictActive
    ? (filterUnit.district?.memberCount || 3200).toLocaleString()
    : isFieldActive
    ? (filterUnit.fieldCode === 'NRF' || activeFieldName.toLowerCase().includes('north') ? '171,145' : (filterUnit.field?.memberCount || 18000).toLocaleString())
    : (stats?.totalUsers || 0);

  const displayTotalEvents = (isFieldActive || isDistrictActive)
    ? scopedEvents.length
    : (stats?.totalEvents || 0);

  // Single-Entity Scope Export to CSV with UTF-8 BOM for Excel
  const handleExportReport = () => {
    const entityName = activeDistrictName || activeFieldName || 'Rwanda_Union_Report';
    const entityCode = activeDistrictCode || activeFieldCode || 'RUM';
    const filename = `${entityCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.csv`;

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += `OFFICIAL JURISDICTION DOSSIER: ${entityName} (${entityCode})\r\n`;
    csvContent += `Generated On: ${new Date().toLocaleString()}\r\n`;
    csvContent += `Administrative Level: ${isDistrictActive ? 'Pastoral District' : 'Conference Field'}\r\n`;
    csvContent += `Presiding Leader: ${isDistrictActive ? (filterUnit.district?.leader || 'Pr. Francois KANOTI') : (filterUnit.field?.leader || 'Pr. SETAKO Sophonie')}\r\n`;
    csvContent += `Territorial Location: ${isDistrictActive ? (filterUnit.district?.location || '') : (filterUnit.field?.location || '')}\r\n`;
    csvContent += `Official Email: ${isDistrictActive ? (filterUnit.district?.contactEmail || '') : (filterUnit.field?.contactEmail || '')}\r\n`;
    csvContent += `Official Phone: ${isDistrictActive ? (filterUnit.district?.contactPhone || '') : (filterUnit.field?.contactPhone || '')}\r\n\r\n`;

    csvContent += `=== OPERATIONAL SUMMARY ===\r\n`;
    csvContent += `Metric,Value\r\n`;
    csvContent += `Baptized Members,"${displayTotalUsers}"\r\n`;
    csvContent += `Scheduled Events,${scopedEvents.length}\r\n`;
    csvContent += `Registered Attendees,${scopedRegistrations.length}\r\n`;
    csvContent += `Verified Collections (RWF),${totalVerifiedRevenue}\r\n`;
    csvContent += `Pending Queue Amount (RWF),${totalPendingAmount}\r\n`;
    csvContent += `Target Collection Rate,${collectionRate}%\r\n\r\n`;

    if (isFieldActive && fieldDistricts.length > 0) {
      csvContent += `=== OFFICIAL PASTORAL DISTRICTS (${fieldDistricts.length}) ===\r\n`;
      csvContent += `District Code,District Name,Zone / Location,Presiding Pastor,Email,Phone\r\n`;
      fieldDistricts.forEach(d => {
        csvContent += `"${d.code || ''}","${d.name || ''}","${d.location || ''}","${d.leader || ''}","${d.contactEmail || ''}","${d.contactPhone || ''}"\r\n`;
      });
      csvContent += `\r\n`;
    }

    csvContent += `=== JURISDICTION PAYMENT LEDGER (${scopedPayments.length}) ===\r\n`;
    csvContent += `Transaction Ref,Attendee Name,Event Name,Local Church,Amount (RWF),Method,Status,Submission Date\r\n`;
    scopedPayments.forEach(p => {
      const reg = p.registration;
      const attendee = p.participantName || reg?.participant?.fullName || reg?.participantName || 'Attendee';
      const evName = p.eventName || reg?.event?.name || 'Camp';
      const chName = reg?.churchName || p.churchName || '';
      csvContent += `"${p.transactionReference || p.id}","${attendee}","${evName}","${chName}",${p.amount || 0},"${p.paymentMethod || 'MOMO'}","${p.status}","${p.paymentDate || p.createdAt || ''}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loading = statsLoading || proposalsLoading;
  const error = statsError || proposalsError;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.adminDashboard', 'Admin Dashboard')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.adminOverview', 'System overview, financial reconciliation and governance')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/app/payments/verify">
            <Button variant="primary" icon={<ShieldCheck className="w-4 h-4" />}>
              {t('dashboard.verificationDesk', 'Payment Verification Desk')} {pendingPayments.length > 0 && `(${pendingPayments.length})`}
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => { }}
        />
      )}

      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* ======================================================== */}
      {/* FILTER BAR: Clean Label on Top + Direct Search Input     */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filter Label on Top */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('dashboard.reportFilterTitle', 'Evangelical District & Field Report Filter')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('dashboard.officialRumNetwork', '8 Official Fields • Rwanda Union Mission (RUM) Network')}
              </p>
            </div>
          </div>

          {/* Clean Search Input + Direct Actions */}
          <div className="flex items-center gap-2 flex-1 md:max-w-xl justify-end">
            <div ref={searchContainerRef} className="relative flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder={t('dashboard.searchFieldDistrict', "Search Field or District (e.g. 'NRF', 'Musanze', 'Kivuye')...")}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white dark:focus:bg-slate-900 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions dropdown */}
              {isSearchFocused && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-fadeIn">
                  {searchResults.fields.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                        Conferences / Fields (8 Official RUM)
                      </span>
                      {searchResults.fields.map((f) => (
                        <button
                          key={`drop-f-${f.id}`}
                          type="button"
                          onClick={() => handleSelectField(f)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {f.name} {f.code ? `(${f.code})` : ''}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {f.location || 'Rwanda'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.districts.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                        Pastoral Districts
                      </span>
                      {searchResults.districts.map((d) => (
                        <button
                          key={`drop-d-${d.id}`}
                          type="button"
                          onClick={() => handleSelectDistrict(d)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {d.name} {d.code ? `(${d.code})` : ''}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {d.leader ? `Pr. ${d.leader}` : d.location || ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.fields.length === 0 && searchResults.districts.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching field or district found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scope Status & Action Buttons */}
            {(isFieldActive || isDistrictActive) && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportReport}
                  className="text-xs h-9 px-3 font-semibold border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  {t('dashboard.exportReport', 'Export Report')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearFilter}
                  className="text-xs h-9 px-2 text-rose-600 hover:text-rose-700 font-semibold"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> {t('common.clear', 'Clear')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FIELD & DISTRICT EXECUTIVE INTELLIGENCE REPORT            */}
      {/* ======================================================== */}
      {(isFieldActive || isDistrictActive) ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Dossier Card */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Header Banner - Executive Slate Styling */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {isDistrictActive ? 'Pastoral District Scope Active' : 'Conference Field Jurisdiction Active'}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      CODE: {activeDistrictCode || activeFieldCode || 'NRF'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Rwanda Union Mission (RUM) Network
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <Building className="w-6 h-6 text-slate-300" />
                    {isDistrictActive 
                      ? `${activeDistrictName} (${activeDistrictCode || 'District'})` 
                      : `${activeFieldName || 'North Rwanda Field'} (${activeFieldCode || 'NRF'})`}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {isDistrictActive
                        ? `${activeDistrictName} • Zone: ${filterUnit.district?.location || 'Northern Province'} • Under ${activeFieldName || 'North Rwanda Field'}`
                        : `${filterUnit.field?.location || 'Musanze, Northern Province'} • Territorial Conference Administrative Center`}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {isDistrictActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterUnit(prev => ({ ...prev, districtId: '', districtName: '', districtCode: '', district: null }));
                      }}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 text-xs font-semibold"
                    >
                      View All {activeFieldCode || 'Field'} Districts
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExportReport}
                    className="bg-white hover:bg-slate-100 text-slate-900 border-0 text-xs font-bold"
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export Report (CSV)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilter}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700 text-xs font-medium"
                    icon={<X className="w-3.5 h-3.5" />}
                  >
                    Reset Scope
                  </Button>
                </div>
              </div>
            </div>

          <CardBody className="p-5 sm:p-6 space-y-6">
            {/* 4-Pillar Executive Governance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Leader Tile */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {isDistrictActive ? 'Presiding District Pastor' : 'Field President / Leader'}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {isDistrictActive 
                        ? (filterUnit.district?.leader || 'Pr. Francois KANOTI')
                        : (filterUnit.field?.leader || 'Pr. SETAKO Sophonie')}
                    </p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3" /> Official RUM Credentials
                    </span>
                  </div>
                </div>
              </div>

              {/* Location / Headquarters Tile */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {isDistrictActive ? 'Zone & Headquarters' : 'Conference Headquarters'}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {isDistrictActive
                        ? (filterUnit.district?.location || 'Kigombe Zone, Musanze')
                        : (filterUnit.field?.location || 'Musanze, Northern Province')}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {isDistrictActive ? 'District Pastoral Station' : 'Regional Administration Center'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pastoral & Territory Coverage */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    <Church className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {isDistrictActive ? 'Churches & Congregation' : 'Pastoral Coverage'}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {isDistrictActive 
                        ? `${filterUnit.district?.memberCount || '3,200'} Baptized Members`
                        : `${fieldDistricts.length || 34} Official Districts`}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {isDistrictActive ? 'Central Church & Companies' : '171,145+ Baptized Members'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact & Communications */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Secretariat Communications
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {isDistrictActive
                        ? (filterUnit.district?.contactEmail || 'pastor@nrf.rumadventist.org')
                        : (filterUnit.field?.contactEmail || 'president@nrf.rumadventist.org')}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {isDistrictActive
                        ? (filterUnit.district?.contactPhone || '+250 788 002 003')
                        : (filterUnit.field?.contactPhone || '+250 788 756 534')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Field Live Activity & Financial Ribbon */}
            <div className="bg-gradient-to-r from-emerald-50/60 via-slate-50 to-primary-50/60 dark:from-emerald-950/20 dark:via-slate-800/60 dark:to-primary-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Live Operational Metrics for {activeDistrictName || activeFieldCode || 'Field'}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Real-time Database Audit
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center sm:text-left">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Field Events</p>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{scopedEvents.length}</p>
                  <span className="text-[10px] text-slate-400">Scheduled camps</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Registered Attendees</p>
                  <p className="text-base font-black text-primary-600 mt-0.5">{scopedRegistrations.length}</p>
                  <span className="text-[10px] text-slate-400">In this jurisdiction</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Verified Revenue</p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">{formatCurrency(totalVerifiedRevenue)}</p>
                  <span className="text-[10px] text-emerald-600 font-medium">{verifiedPayments.length} paid</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Pending Audits</p>
                  <p className="text-base font-black text-amber-600 mt-0.5">{pendingPayments.length}</p>
                  <span className="text-[10px] text-amber-600 font-medium">{formatCurrency(totalPendingAmount)}</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Proposals Queue</p>
                  <p className="text-base font-black text-indigo-600 mt-0.5">{scopedProposals.length}</p>
                  <span className="text-[10px] text-slate-400">Targeting this unit</span>
                </div>
              </div>
            </div>

            {/* Interactive 34 Districts Directory for NRF */}
            {isFieldActive && (
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary-600" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      Pastoral Districts under {activeFieldName || 'North Rwanda Field'} ({fieldDistricts.length || 34} Districts)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search district by name, pastor, code..."
                        value={districtSearchQuery}
                        onChange={(e) => setDistrictSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDistrictsExpanded(!isDistrictsExpanded)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 flex items-center gap-1"
                    >
                      {isDistrictsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isDistrictsExpanded ? 'Collapse' : 'Expand'}
                    </button>
                  </div>
                </div>

                {isDistrictsExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                    {loadingFieldDistricts ? (
                      <div className="col-span-full py-8 text-center text-xs text-slate-500">
                        Loading districts of {activeFieldName}...
                      </div>
                    ) : filteredFieldDistricts.length === 0 ? (
                      <div className="col-span-full py-8 text-center text-xs text-slate-500">
                        No districts match "{districtSearchQuery}"
                      </div>
                    ) : (
                      filteredFieldDistricts.map((dist) => {
                        const isThisDistActive = String(filterUnit.districtId) === String(dist.id);
                        return (
                          <button
                            key={`dist-grid-${dist.id}`}
                            type="button"
                            onClick={() => {
                              if (isThisDistActive) {
                                setFilterUnit(prev => ({
                                  ...prev,
                                  districtId: '',
                                  districtName: '',
                                  districtCode: '',
                                  district: null
                                }));
                              } else {
                                setFilterUnit(prev => ({
                                  ...prev,
                                  districtId: dist.id,
                                  districtName: dist.name,
                                  districtCode: dist.code,
                                  district: dist
                                }));
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                              isThisDistActive
                                ? 'bg-primary-50 dark:bg-primary-950/70 border-primary-500 shadow-xs ring-1 ring-primary-400'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-300 hover:shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {dist.name}
                              </p>
                              {dist.code && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                  {dist.code}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <p className="truncate font-medium">{dist.leader || 'Presiding Pastor'}</p>
                              <p className="text-[10px] text-slate-400 truncate">{dist.location || 'Northern Province'}</p>
                            </div>
                            <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                              <span className={isThisDistActive ? 'font-bold text-primary-600' : 'text-slate-400'}>
                                {isThisDistActive ? '✓ Active District' : 'Click to Scope'}
                              </span>
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Scoped Financial Reconciliation Hub for this Field/District */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <CardTitle className="text-slate-900 dark:text-white text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Payments & Reconciliation for {activeDistrictName || activeFieldName}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Audited payments and mobile money transfers from attendees under this jurisdiction
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportReport}
                icon={<Download className="w-3.5 h-3.5" />}
                className="text-xs font-semibold"
              >
                Export CSV
              </Button>

              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setPaymentsViewMode('grid')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    paymentsViewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentsViewMode('table')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    paymentsViewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Table
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={fetchPaymentsAndRegistrations}
                loading={paymentsLoading}
                className="text-xs"
              >
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardBody className="p-4 space-y-4">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No payment records found for {activeDistrictName || activeFieldName}.
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Payments made by registered members from this entity will be automatically listed here.
                </p>
              </div>
            ) : paymentsViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredPayments.slice(0, 15).map((payment) => {
                  const isMoMo = payment.paymentMethod === 'MOBILE_MONEY' || payment.transactionReference?.startsWith('MOMO');
                  return (
                    <div
                      key={payment.id}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {payment.transactionReference}
                          </span>
                          <Badge variant={
                            payment.status === 'VERIFIED' ? 'success' :
                            payment.status === 'PENDING' ? 'warning' : 'danger'
                          }>
                            {payment.status}
                          </Badge>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {payment.participantName || payment.registration?.participantName || 'Attendee'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {payment.registration?.churchName || 'Adventist Member'}
                          </p>
                          <p className="text-xs text-primary-700 dark:text-primary-400 font-semibold mt-1 truncate">
                            {payment.eventName || payment.registration?.eventName || 'Event'}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                          <div>
                            <p className="font-black text-slate-900 dark:text-white text-sm">
                              {formatCurrency(payment.amount)}
                            </p>
                            <span className="text-[10px] text-slate-500">
                              {isMoMo ? 'Mobile Money' : payment.paymentMethod || 'Bank Transfer'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                        <Link to={`/app/payments/${payment.id}`}>
                          <Button size="sm" variant="outline" className="text-xs px-2.5 py-1">
                            Audit Details
                          </Button>
                        </Link>

                        <div className="flex items-center gap-1.5">
                          {payment.receiptUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPreviewReceiptUrl(payment.receiptUrl)}
                              title="View Receipt Proof"
                              icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                            />
                          )}
                          {payment.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleOpenPaymentAction(payment, 'verify')}
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
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Participant & Church</th>
                      <th className="px-4 py-3">Event Name</th>
                      <th className="px-4 py-3">Amount & Method</th>
                      <th className="px-4 py-3">Reference #</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {filteredPayments.slice(0, 15).map((payment) => {
                      const isMoMo = payment.paymentMethod === 'MOBILE_MONEY' || payment.transactionReference?.startsWith('MOMO');
                      return (
                        <tr key={payment.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {payment.participantName || payment.registration?.participantName || 'Attendee'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {payment.registration?.churchName || 'Adventist Member'}
                            </p>
                          </td>

                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                            {payment.eventName || payment.registration?.eventName || 'Event'}
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {formatCurrency(payment.amount)}
                            </p>
                            <span className="text-[10px] text-slate-500">
                              {isMoMo ? 'Mobile Money' : payment.paymentMethod || 'Bank Transfer'}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {payment.transactionReference}
                          </td>

                          <td className="px-4 py-3">
                            <Badge variant={
                              payment.status === 'VERIFIED' ? 'success' :
                              payment.status === 'PENDING' ? 'warning' : 'danger'
                            }>
                              {payment.status}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {payment.receiptUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setPreviewReceiptUrl(payment.receiptUrl)}
                                  title="View Receipt Proof"
                                  icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                                />
                              )}
                              {payment.status === 'PENDING' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleOpenPaymentAction(payment, 'verify')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                                >
                                  Approve
                                </Button>
                              )}
                              <Link to={`/app/payments/${payment.id}`}>
                                <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                                  Audit
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

        {/* Upcoming Events & AI Turnout Forecasts & Proposals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events & AI Readiness */}
          <UpcomingEventsCardList
            role="ADMINISTRATOR"
            maxItems={5}
            onSelectEventForInsight={(id) => {
              setSelectedAiEventId(id);
              setIsAiDrawerOpen(true);
            }}
          />

          {/* Scoped Proposals */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                Proposals from {activeDistrictName || activeFieldName} ({scopedProposals.length})
              </CardTitle>
              <Link to="/app/proposals" className="text-xs font-semibold text-slate-600 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardBody className="p-4">
              {scopedProposals.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No pending proposals submitted for this jurisdiction.</p>
              ) : (
                <div className="space-y-2.5">
                  {scopedProposals.slice(0, 5).map(proposal => (
                    <div key={proposal.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{proposal.eventName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Budget: {formatCurrency(proposal.estimatedBudget)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenProposalModal(proposal)}
                        className="text-xs"
                      >
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    ) : (
      <div className="space-y-6">

      {/* AI Future Preparation & Readiness Radar Executive Card */}
      {scopedReadiness.length > 0 && (
        <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-0 shadow-lg overflow-hidden">
          <CardBody className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    <Activity className="w-3 h-3 text-emerald-400" /> Logistics Readiness Overview
                  </span>
                  <span className="text-xs text-slate-300">
                    {scopedReadiness.length} Upcoming Event(s) Evaluated in 30–90 Day Window
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Executive Logistics & Preparation Health Index
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Automated pre-camp diagnostics evaluating lodging capacity, registration pace, verified payment clearance, A/V equipment availability, and speaker confirmations.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {scopedReadiness.slice(0, 2).map((ev) => {
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
                    View Readiness Diagnostics <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* High-Level Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isDistrictActive || isFieldActive ? 'Field Members' : t('dashboard.totalUsers', 'Total Users')}
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                  {displayTotalUsers}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  {isDistrictActive || isFieldActive 
                    ? `Scoped to ${activeDistrictName || activeFieldCode || activeFieldName}` 
                    : t('dashboard.activeUsersNote', 'Active system users')}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/60 p-3 rounded-2xl border border-blue-100 dark:border-blue-800/60">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isDistrictActive || isFieldActive ? 'Field Events' : t('dashboard.totalEvents', 'Total Events')}
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                  {displayTotalEvents}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  {isDistrictActive || isFieldActive 
                    ? `Events in ${activeDistrictName || activeFieldCode || activeFieldName}` 
                    : t('dashboard.allTimeEventsNote', 'All time events')}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/60">
                <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.pendingPayments', 'Pending Verification')}</p>
                <p className="text-2xl font-extrabold text-amber-600 mt-1.5">{pendingPayments.length}</p>
                <p className="text-xs text-amber-600 mt-1 flex items-center font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {formatCurrency(totalPendingAmount)} {t('dashboard.inQueue', 'in queue')}
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
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.totalRevenue', 'Total Revenue')}</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                  {formatCurrency(totalVerifiedRevenue || ((!isFieldActive && !isDistrictActive) ? stats?.totalRevenue : 0))}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  {collectionRate}% {t('dashboard.collectionRate', 'collection rate')}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/60">
                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* EVENT PAYMENTS & FINANCIAL RECONCILIATION HUB            */}
      {/* ======================================================== */}
      <Card className="border-2 border-emerald-100 dark:border-emerald-950 shadow-md">
        <CardHeader className="bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 dark:from-emerald-950/30 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-slate-900 dark:text-white text-lg">
                {t('dashboard.paymentHubTitle', 'Event Payments & Treasury Reconciliation Hub')}
              </CardTitle>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {t('dashboard.paymentHubDesc', 'Audit event fees, check participant payment relevance, and verify Mobile Money & Bank slip submissions across all 8 fields.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setPaymentsViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  paymentsViewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setPaymentsViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  paymentsViewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Table
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={fetchPaymentsAndRegistrations}
              loading={paymentsLoading}
            >
              {t('common.refresh', 'Refresh')}
            </Button>
            <Link to="/app/payments/verify">
              <Button variant="primary" size="sm" icon={<ShieldCheck className="w-4 h-4" />}>
                {t('dashboard.verificationDesk', 'Verification Desk')}
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardBody className="p-5 space-y-5">
          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.verifiedRevenue', 'Verified Revenue')}</p>
              <p className="text-lg font-black text-emerald-600">{formatCurrency(totalVerifiedRevenue)}</p>
              <span className="text-[10px] text-slate-500">{verifiedPayments.length} paid transactions</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.awaitingVerification', 'Awaiting Verification')}</p>
              <p className="text-lg font-black text-amber-600">{formatCurrency(totalPendingAmount)}</p>
              <span className="text-[10px] text-amber-600 font-medium">{pendingPayments.length} receipts pending</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.expectedFees', 'Expected Total Fees')}</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-200">{formatCurrency(totalExpectedRevenue)}</p>
              <span className="text-[10px] text-slate-500">{registrations.length} registered attendees</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.collectionRateTitle', 'Collection Rate')}</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-black text-primary-600">{collectionRate}%</p>
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden max-w-[60px]">
                  <div className="bg-emerald-500 h-full" style={{ width: `${collectionRate}%` }}></div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500">{t('dashboard.targetFulfillment', 'Target fulfillment')}</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setPaymentFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${paymentFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
              >
                {t('common.all', 'All')} ({payments.length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${paymentFilter === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50'
                  }`}
              >
                <span>{t('status.PENDING', 'Pending Review')}</span>
                {pendingPayments.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-700 text-[10px] font-black">
                    {pendingPayments.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('VERIFIED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${paymentFilter === 'VERIFIED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
                  }`}
              >
                {t('status.VERIFIED', 'Verified')} ({verifiedPayments.length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('REJECTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${paymentFilter === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50'
                  }`}
              >
                {t('status.REJECTED', 'Rejected')} ({rejectedPayments.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search participant, ref, or event..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Payment Reconciliation Table */}
          {paymentsLoading && payments.length === 0 ? (
            <div className="text-center py-8">
              <PageSpinner message="Loading payment transactions..." />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('dashboard.noPaymentsMatch', 'No payment records match the selected filter.')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('dashboard.allPaymentsAppear', 'All event attendee payments will appear here as they register.')}</p>
            </div>
          ) : paymentsViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPayments.slice(0, 10).map((payment) => {
                const isMoMo = payment.paymentMethod === 'MOBILE_MONEY' || payment.transactionReference?.startsWith('MOMO');
                return (
                  <div
                    key={payment.id}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {payment.transactionReference}
                        </span>
                        <Badge variant={
                          payment.status === 'VERIFIED' ? 'success' :
                            payment.status === 'PENDING' ? 'warning' : 'danger'
                        }>
                          {payment.status}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {payment.participantName || payment.registration?.participantName || 'Attendee'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {payment.registration?.churchName || 'Adventist Member'}
                        </p>
                        <p className="text-xs text-primary-700 dark:text-primary-400 font-semibold mt-1 truncate">
                          {payment.eventName || payment.registration?.eventName || 'Event'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-sm">
                            {formatCurrency(payment.amount)}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            {isMoMo ? (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <Smartphone className="w-3 h-3" /> MoMo Instant
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Receipt className="w-3 h-3" /> {payment.paymentMethod?.replace(/_/g, ' ') || 'Bank Slip'}
                              </span>
                            )}
                          </div>
                        </div>

                        {payment.status === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3" /> Fee Matched
                          </span>
                        ) : payment.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" /> Review Needed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                      <Link to={`/app/payments/${payment.id}`}>
                        <Button size="sm" variant="outline" className="text-xs px-2.5 py-1">
                          Audit
                        </Button>
                      </Link>

                      <div className="flex items-center gap-1.5">
                        {payment.receiptUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewReceiptUrl(payment.receiptUrl)}
                            title="View Receipt Proof"
                            icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                          />
                        )}

                        {payment.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleOpenPaymentAction(payment, 'verify')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 font-bold"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleOpenPaymentAction(payment, 'reject')}
                              className="text-xs px-2.5 py-1 font-bold"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">{t('registrations.participant', 'Participant & Church')}</th>
                    <th className="px-4 py-3">{t('proposals.eventName', 'Event Name')}</th>
                    <th className="px-4 py-3">{t('payments.amountPaid', 'Amount & Method')}</th>
                    <th className="px-4 py-3">{t('payments.transactionId', 'Reference #')}</th>
                    <th className="px-4 py-3">{t('common.status', 'Status')}</th>
                    <th className="px-4 py-3">{t('common.audit', 'Relevance Audit')}</th>
                    <th className="px-4 py-3 text-right">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredPayments.slice(0, 10).map((payment) => {
                    const isMoMo = payment.paymentMethod === 'MOBILE_MONEY' || payment.transactionReference?.startsWith('MOMO');
                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {payment.participantName || payment.registration?.participantName || 'Attendee'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {payment.registration?.churchName || 'Adventist Member'}
                          </p>
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {payment.eventName || payment.registration?.eventName || 'Event'}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-black text-slate-900 dark:text-white text-sm">
                            {formatCurrency(payment.amount)}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            {isMoMo ? (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <Smartphone className="w-3 h-3" /> MoMo Instant
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Receipt className="w-3 h-3" /> {payment.paymentMethod?.replace(/_/g, ' ') || 'Bank Slip'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {payment.transactionReference}
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant={
                            payment.status === 'VERIFIED' ? 'success' :
                              payment.status === 'PENDING' ? 'warning' : 'danger'
                          }>
                            {payment.status}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          {payment.status === 'VERIFIED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3" /> Fee Matched & Paid
                            </span>
                          ) : payment.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3 h-3" /> Needs Verification
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                              <XCircle className="w-3 h-3" /> Rejected / Invalid
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {payment.receiptUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPreviewReceiptUrl(payment.receiptUrl)}
                                title="View Receipt Proof"
                                icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                              />
                            )}

                            {payment.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleOpenPaymentAction(payment, 'verify')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleOpenPaymentAction(payment, 'reject')}
                                  className="text-xs px-2.5 py-1"
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            <Link to={`/app/payments/${payment.id}`}>
                              <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                                Audit
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

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{t('dashboard.showingTopRecords', `Showing top ${Math.min(10, filteredPayments.length)} of ${filteredPayments.length} payment records`)}</span>
            <Link to="/app/payments" className="font-bold text-primary-600 hover:underline flex items-center gap-1">
              {t('dashboard.viewCompleteLedger', 'View Complete Payments Ledger')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Rwanda Union Mission (RUM) Leadership and Organizational Hub */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border-0 shadow-lg overflow-hidden relative">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <CardBody className="p-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Rwanda Union Mission (RUM)
              </div>
              <h2 className="text-xl font-bold text-white">{t('dashboard.rumCoordinationTitle', 'Rwanda Union Mission Camp and Conference Coordination')}</h2>
              <p className="text-sm text-indigo-200 leading-relaxed">
                {t('dashboard.rumCoordinationDesc', 'Integrated institutional governance connecting Rwanda Union Mission (RUM), 8 Conference Fields, Pastoral Districts, and Official RUM Ministries.')}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10 min-w-[90px]">
                <p className="text-2xl font-bold text-white">8</p>
                <p className="text-xs text-indigo-200 font-medium mt-0.5">{t('dashboard.unionFields', 'Union Fields')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10 min-w-[90px]">
                <p className="text-2xl font-bold text-emerald-400">16</p>
                <p className="text-xs text-indigo-200 font-medium mt-0.5">{t('dashboard.rumMinistries', 'RUM Ministries')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10 min-w-[90px]">
                <p className="text-2xl font-bold text-amber-300">34+</p>
                <p className="text-xs text-indigo-200 font-medium mt-0.5">{t('dashboard.districtsPastors', 'Districts & Pastors')}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-indigo-800/60 flex flex-wrap items-center gap-3">
            <Link to="/app/organization">
              <Button variant="primary" size="sm" icon={<Building className="w-4 h-4" />}>
                {t('dashboard.viewOrgTree', 'View Organization Tree')}
              </Button>
            </Link>
            <Link to="/app/departments">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20" icon={<BookOpen className="w-4 h-4" />}>
                {t('dashboard.exploreMinistries', 'Explore RUM Ministries')}
              </Button>
            </Link>
            <Link to="/app/users">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20" icon={<Users className="w-4 h-4" />}>
                {t('dashboard.viewLeadership', 'View Leadership Directory')}
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* RUM Master Schedule & Conflict Visualizer */}
      <MasterScheduleCalendar />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.eventsOverview', 'Events Overview (Last 6 Months)')}</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="events" fill="#0ea5e9" name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.participantGrowth', 'Participant Growth')}</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="participants" stroke="#10b981" strokeWidth={2} name="Participants" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity: Proposals & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Proposals Review Queue */}
        <Card>
          <CardHeader action={
            <Link to="/app/proposals">
              <Button variant="ghost" size="sm">{t('common.viewAll', 'View All')}</Button>
            </Link>
          }>
            <CardTitle>{t('dashboard.pendingProposalsReview', 'Pending Proposals')} ({pendingProposals.length})</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {pendingProposals.length > 0 ? (
                pendingProposals.slice(0, 5).map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{proposal.eventName}</p>
                      <p className="text-sm text-gray-600">
                        {proposal.department?.name || 'N/A'} • {proposal.eventType}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        By: {proposal.proposedBy?.firstName} {proposal.proposedBy?.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(proposal.status)}
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenProposalModal(proposal)}
                        icon={<Eye className="w-4 h-4" />}
                      >
                        {t('common.audit', 'Review')}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>{t('dashboard.noPendingProposals', 'No pending proposals')}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader action={
            <Link to="/app/events">
              <Button variant="ghost" size="sm">{t('common.viewAll', 'View All')}</Button>
            </Link>
          }>
            <CardTitle>{t('dashboard.upcomingEventsTitle', 'Upcoming Events')}</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <p className="text-sm text-gray-600">
                        {event.venue || 'TBD'} • {new Date(event.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {event.type} • Fee: {formatCurrency(event.registrationFee)}
                      </p>
                    </div>
                    <Link to={`/app/events/${event.id}`} state={{ event }}>
                      <Button size="sm" variant="outline">
                        {t('common.view', 'View')}
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>{t('dashboard.noUpcomingEvents', 'No upcoming events')}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )}

      {/* Receipt Preview Modal */}
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

      {/* Payment Action Modal (Quick Approve / Reject) */}
      {selectedPaymentForAction && (
        <Modal
          isOpen={!!selectedPaymentForAction}
          onClose={() => {
            setSelectedPaymentForAction(null);
            setPaymentActionType(null);
            setPaymentActionNotes('');
          }}
          title={paymentActionType === 'verify' ? "Approve & Confirm Event Payment" : "Reject Payment Proof"}
          size="md"
        >
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Participant:</span>
                <strong className="text-slate-900 dark:text-white">{selectedPaymentForAction.participantName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Event:</span>
                <strong className="text-slate-900 dark:text-white">{selectedPaymentForAction.eventName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <strong className="text-emerald-600">{formatCurrency(selectedPaymentForAction.amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono">{selectedPaymentForAction.transactionReference}</span>
              </div>
            </div>

            {paymentActionType === 'verify' ? (
              <div className="space-y-2">
                <Alert
                  type="info"
                  message="Approving this payment will automatically confirm the participant's registration and generate their check-in QR code ticket."
                />
                <Textarea
                  label="Verification Notes (Optional)"
                  value={paymentActionNotes}
                  onChange={(e) => setPaymentActionNotes(e.target.value)}
                  placeholder="e.g. Verified against Bank of Kigali statement / MoMo batch."
                  rows={3}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Alert
                  type="warning"
                  message="Please provide a clear reason for rejecting this payment proof so the participant can resubmit."
                />
                <Textarea
                  label="Rejection Reason"
                  value={paymentActionNotes}
                  onChange={(e) => setPaymentActionNotes(e.target.value)}
                  placeholder="e.g. Reference number not found, deposit amount does not match event fee."
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPaymentForAction(null);
                  setPaymentActionType(null);
                  setPaymentActionNotes('');
                }}
                disabled={paymentActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={paymentActionType === 'verify' ? 'primary' : 'danger'}
                onClick={handleExecutePaymentAction}
                loading={paymentActionLoading}
              >
                {paymentActionType === 'verify' ? 'Approve & Issue Ticket' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Proposal Review Modal */}
      {selectedProposal && (
        <Modal
          isOpen={showProposalModal}
          onClose={handleCloseProposalModal}
          title="Review Proposal"
          size="lg"
        >
          <div className="space-y-4">
            <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Event Name</p>
                  <p className="font-medium text-base">{selectedProposal.eventName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  {getStatusBadge(selectedProposal.status)}
                </div>
                <div>
                  <p className="text-gray-600">Department</p>
                  <p className="font-medium">{selectedProposal.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Event Type</p>
                  <p className="font-medium">{selectedProposal.eventType}</p>
                </div>
                <div>
                  <p className="text-gray-600">Target Dates</p>
                  <p className="font-medium">{selectedProposal.startDate} to {selectedProposal.endDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Venue</p>
                  <p className="font-medium">{selectedProposal.venue}</p>
                </div>
                <div>
                  <p className="text-gray-600">Expected Participants</p>
                  <p className="font-medium">{selectedProposal.expectedParticipants}</p>
                </div>
                <div>
                  <p className="text-gray-600">Estimated Budget</p>
                  <p className="font-medium">{formatCurrency(selectedProposal.estimatedBudget)}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600">Objectives</p>
                <p className="text-sm mt-1">{selectedProposal.objectives}</p>
              </div>
              {selectedProposal.requiredResources && (
                <div>
                  <p className="text-gray-600">Required Resources</p>
                  <p className="text-sm mt-1">{selectedProposal.requiredResources}</p>
                </div>
              )}
              {selectedProposal.reviewComments && (
                <div>
                  <p className="text-gray-600">Previous Comments</p>
                  <p className="text-sm mt-1 italic text-gray-700">{selectedProposal.reviewComments}</p>
                </div>
              )}
            </div>

            {actionError && (
              <Alert type="error" message={actionError} />
            )}

            {/* Action Selection */}
            {!reviewAction ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Select Action:</p>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="success"
                    onClick={() => setReviewAction('approve')}
                    icon={<CheckCircle className="w-5 h-5" />}
                    className="justify-start"
                  >
                    <div className="text-left">
                      <div className="font-semibold">Approve & Create Event</div>
                      <div className="text-xs opacity-90">Approve proposal and automatically create event</div>
                    </div>
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => setReviewAction('revision')}
                    icon={<AlertCircle className="w-5 h-5" />}
                    className="justify-start"
                  >
                    <div className="text-left">
                      <div className="font-semibold">Request Revision</div>
                      <div className="text-xs opacity-90">Send back for modifications</div>
                    </div>
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setReviewAction('reject')}
                    icon={<XCircle className="w-5 h-5" />}
                    className="justify-start"
                  >
                    <div className="text-left">
                      <div className="font-semibold">Reject Proposal</div>
                      <div className="text-xs opacity-90">Decline this proposal</div>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Action: <span className="text-primary-600">{reviewAction.toUpperCase()}</span>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReviewAction(null);
                      setComments('');
                      setActionError(null);
                    }}
                  >
                    Change
                  </Button>
                </div>

                {reviewAction !== 'approve' && (
                  <Textarea
                    label="Comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={`Enter ${reviewAction} comments...`}
                    rows={4}
                    required
                  />
                )}

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={handleProposalAction}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    {actionLoading ? 'Processing...' : `Confirm ${reviewAction}`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCloseProposalModal}
                    disabled={actionLoading}
                  >
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
