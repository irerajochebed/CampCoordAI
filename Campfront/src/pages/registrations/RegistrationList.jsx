import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registrationApi, eventApi, getCachedData } from '../../api';
import { 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  QrCode,
  DollarSign,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  Church,
  User as UserIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useTranslation } from '../../contexts/LanguageContext';

export default function RegistrationList() {
  const navigate = useNavigate();
  const { user, isAdmin, isCoordinator, isParticipant } = useAuth();
  const { t } = useTranslation();
  
  const cachedRegs = useMemo(() => {
    const cached = getCachedData('/registrations');
    if (cached?.data && Array.isArray(cached.data)) return cached.data;
    if (Array.isArray(cached)) return cached;
    return [];
  }, []);

  const [registrations, setRegistrations] = useState(cachedRegs);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(cachedRegs.length === 0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [alert, setAlert] = useState(null);
  
  const [filters, setFilters] = useState({
    event: '',
    status: '',
    search: ''
  });

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  const jurisdictionInfo = (() => {
    if (user?.role === 'ADMINISTRATOR' || user?.position === 'UNION_ADMINISTRATOR' || user?.position === 'UNION_LEADER' || user?.organizationLevel === 'UNION') {
      return {
        scope: 'Union-Wide Audit',
        unit: user?.organizationUnitName || 'Rwanda Union Mission (All 8 Fields)',
      };
    }
    if (user?.position === 'FIELD_LEADER' || user?.organizationLevel === 'FIELD') {
      return {
        scope: 'Field Scope',
        unit: `${user?.organizationUnitName || 'Field'} (All Districts & Churches)`,
      };
    }
    if (user?.position === 'DISTRICT_PASTOR' || user?.position === 'PASTOR' || user?.organizationLevel === 'DISTRICT') {
      return {
        scope: 'District Jurisdiction',
        unit: `${user?.organizationUnitName || user?.sdaDistrict || 'District'} (District & Churches)`,
      };
    }
    if (user?.organizationLevel === 'CHURCH' || user?.organizationLevel === 'LOCAL_CHURCH') {
      return {
        scope: 'Local Church Scope',
        unit: user?.organizationUnitName || 'Local Church',
      };
    }
    return null;
  })();

  useEffect(() => {
    fetchEvents();
    fetchRegistrations(cachedRegs.length > 0);
  }, []);

  const fetchEvents = async () => {
    try {
      const response = isCoordinator && !isUnionAdmin
        ? await eventApi.getMyEvents()
        : await eventApi.getAll();
      
      if (response.data?.success) {
        setEvents(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchRegistrations = async (isBackground = false) => {
    try {
      if (!isBackground && registrations.length === 0) {
        setLoading(true);
      }
      const response = isParticipant 
        ? await registrationApi.getMyRegistrations()
        : await registrationApi.getAll();

      const list = response.data?.data || response.data || [];
      setRegistrations(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      if (registrations.length === 0) {
        setAlert({
          type: 'error',
          message: error.response?.data?.message || t('common.error', 'Failed to fetch registrations')
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckIn = async (registrationId) => {
    try {
      await registrationApi.checkIn(registrationId);
      setAlert({ type: 'success', message: t('common.success', 'Participant checked in successfully') });
      fetchRegistrations();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || t('common.error', 'Failed to check in participant')
      });
    }
  };

  const handleConfirm = async (registrationId) => {
    if (!confirm(t('common.confirm', 'Confirm this registration?'))) return;

    try {
      await registrationApi.confirm(registrationId);
      setAlert({ type: 'success', message: t('common.success', 'Registration confirmed successfully') });
      fetchRegistrations();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || t('common.error', 'Failed to confirm registration')
      });
    }
  };

  const handleCancel = async (registrationId) => {
    if (!confirm(t('common.confirm', 'Are you sure you want to cancel this registration?'))) return;

    try {
      await registrationApi.cancel(registrationId);
      setAlert({ type: 'success', message: t('common.success', 'Registration cancelled successfully') });
      fetchRegistrations();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || t('common.error', 'Failed to cancel registration')
      });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: { variant: 'warning', label: t('status.PENDING', 'Pending') },
      PAYMENT_SUBMITTED: { variant: 'info', label: t('status.PAYMENT_SUBMITTED', 'Payment Submitted') },
      PAYMENT_VERIFIED: { variant: 'success', label: t('status.PAYMENT_VERIFIED', 'Payment Verified') },
      CONFIRMED: { variant: 'success', label: t('status.CONFIRMED', 'Confirmed') },
      CANCELLED: { variant: 'error', label: t('status.CANCELLED', 'Cancelled') },
      CHECKED_IN: { variant: 'success', label: t('status.CHECKED_IN', 'Checked In') },
    };
    const config = variants[status] || { variant: 'default', label: t(`status.${status}`, status) };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (payment) => {
    if (!payment) {
      return <Badge variant="error">{t('common.error', 'No Payment')}</Badge>;
    }
    const variants = {
      PENDING: { variant: 'warning', label: t('status.PENDING', 'Pending') },
      VERIFIED: { variant: 'success', label: t('status.CONFIRMED', 'Verified') },
      REJECTED: { variant: 'error', label: t('status.REJECTED', 'Rejected') },
    };
    const config = variants[payment.status] || { variant: 'default', label: t(`status.${payment.status}`, payment.status) };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Apply filters
  const filteredRegistrations = registrations.filter(reg => {
    const eventId = reg.event?.id || reg.eventId;
    if (filters.event && eventId && eventId.toString() !== filters.event) return false;
    if (filters.status && reg.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const participantName = (reg.participantName || `${reg.participantFirstName || ''} ${reg.participantLastName || ''}`).toLowerCase();
      const eventName = (reg.event?.name || reg.eventName || '').toLowerCase();
      const regNum = (reg.registrationNumber || '').toLowerCase();
      if (!participantName.includes(searchLower) && !eventName.includes(searchLower) && !regNum.includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  const statusOptions = [
    { value: '', label: t('proposals.allStatuses', 'All Statuses') },
    { value: 'PENDING', label: t('status.PENDING', 'Pending') },
    { value: 'PAYMENT_SUBMITTED', label: t('status.PAYMENT_SUBMITTED', 'Payment Submitted') },
    { value: 'PAYMENT_VERIFIED', label: t('status.PAYMENT_VERIFIED', 'Payment Verified') },
    { value: 'CONFIRMED', label: t('status.CONFIRMED', 'Confirmed') },
    { value: 'CANCELLED', label: t('status.CANCELLED', 'Cancelled') },
    { value: 'CHECKED_IN', label: t('status.CHECKED_IN', 'Checked In') },
  ];

  const eventOptions = [
    { value: '', label: t('registrations.allEvents', 'All Events') },
    ...events.map(event => ({ value: event.id.toString(), label: event.name }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('registrations.title', 'Registrations')}</h1>
            {!isParticipant && jurisdictionInfo && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span className="font-bold">{jurisdictionInfo.scope}:</span> {jurisdictionInfo.unit}
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
            {isParticipant 
              ? t('registrations.mySubtitle', 'Your event registrations') 
              : t('registrations.subtitle', 'Manage event registrations and participant information')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/app/registrations/new')}
          >
            {isParticipant 
              ? t('registrations.registerForEvent', 'Register for Event') 
              : t('registrations.registerParticipant', 'Register Participant')}
          </Button>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder={t('registrations.searchPlaceholder', 'Search by participant or event...')}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.event}
              onChange={(e) => setFilters(prev => ({ ...prev, event: e.target.value }))}
              options={eventOptions}
            />

            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={statusOptions}
            />
          </div>

          {(filters.event || filters.status || filters.search) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredRegistrations.length} of {registrations.length} {t('registrations.title', 'registrations')}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ event: '', status: '', search: '' })}
              >
                {t('registrations.clearFilters', 'Clear Filters')}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Registrations Table */}
      {loading ? (
        <Card>
          <CardBody>
            <div className="text-center py-8 text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>{t('common.loading', 'Fetching registrations...')}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : filteredRegistrations.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Calendar className="w-12 h-12" />}
              title={t('registrations.noRegistrationsFound', 'No registrations found')}
              description={
                isParticipant
                  ? t('registrations.noRegistrationsYet', "You haven't registered for any events yet")
                  : t('registrations.noRegistrationsMatchFilters', "No registrations match your filters")
              }
              action={
                isParticipant && (
                  <Button
                    variant="primary"
                    onClick={() => navigate('/app/registrations/new')}
                  >
                    {t('registrations.registerForEvent', 'Register for Event')}
                  </Button>
                )
              }
            />
          </CardBody>
        </Card>
      ) : viewMode === 'grid' ? (
        /* =========================================================================
           CARD GRID VIEW (Matching modern Cards design)
           ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRegistrations.map((registration) => {
            const participantName = registration.participantName || 
              `${registration.participantFirstName || ''} ${registration.participantLastName || ''}`.trim() || 'Participant';
            const eventTitle = registration.event?.name || registration.eventName || 'Event';
            const startDate = registration.event?.startDate || registration.eventStartDate;
            const endDate = registration.event?.endDate || registration.eventEndDate;
            const venue = registration.event?.venue || registration.eventVenue;
            const regFee = registration.event?.registrationFee || registration.eventRegistrationFee;
            const isFree = !regFee || Number(regFee) === 0;
            const initials = participantName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'P';

            return (
              <div
                key={registration.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Registration Code on Left, Status Badge on Right */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="font-mono px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {registration.registrationNumber || `REG-#${registration.id}`}
                    </span>
                    <div>
                      {getStatusBadge(registration.status)}
                    </div>
                  </div>

                  {/* Event Title */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {eventTitle}
                  </h3>

                  {/* Participant Info */}
                  <div className="flex items-center gap-3 mt-3 mb-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 via-indigo-600 to-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 ring-1 ring-white dark:ring-slate-700">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {participantName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {registration.participantEmail || registration.participantPhone || 'Registered Participant'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Rows */}
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    {/* Event Dates */}
                    {startDate && (
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                          {new Date(startDate).toLocaleDateString()} {endDate ? `– ${new Date(endDate).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                    )}

                    {/* Venue */}
                    {venue && (
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{venue}</span>
                      </div>
                    )}

                    {/* Church */}
                    {registration.churchName && (
                      <div className="flex items-center gap-2.5">
                        <Church className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{registration.churchName}</span>
                      </div>
                    )}

                    {/* Fee & Payment */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 text-[11px] font-medium">Payment Status:</span>
                      <div className="flex items-center gap-2">
                        {isFree ? (
                          <Badge variant="success" size="sm">Free Event</Badge>
                        ) : (
                          <>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatCurrency(regFee)}
                            </span>
                            {getPaymentStatusBadge(registration.payment)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    icon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => navigate(`/app/registrations/${registration.id}`, { state: { registration } })}
                  >
                    {t('common.details', 'Details')}
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {isParticipant && registration.status === 'PENDING' && !isFree && (
                      <Button
                        variant="primary"
                        size="xs"
                        icon={<DollarSign className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/app/payments/new?registrationId=${registration.id}`)}
                      >
                        Pay Fee
                      </Button>
                    )}

                    {isParticipant && (registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN') && (
                      <Button
                        variant="primary"
                        size="xs"
                        icon={<QrCode className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/app/registrations/${registration.id}`, { state: { registration } })}
                      >
                        Ticket
                      </Button>
                    )}

                    {!isParticipant && registration.status === 'CONFIRMED' && registration.status !== 'CHECKED_IN' && (
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={<QrCode className="w-3.5 h-3.5 text-primary-600" />}
                        onClick={() => handleQuickCheckIn(registration.id)}
                        title="Quick check-in"
                      >
                        Check In
                      </Button>
                    )}

                    {!isParticipant && (registration.status === 'PAYMENT_VERIFIED' || registration.status === 'PAYMENT_SUBMITTED') && (
                      <button
                        onClick={() => handleConfirm(registration.id)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                        title="Confirm registration"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}

                    {registration.status !== 'CANCELLED' && registration.status !== 'CHECKED_IN' && (
                      <button
                        onClick={() => handleCancel(registration.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Cancel registration"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {t('registrations.participant', 'Participant')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {t('registrations.event', 'Event')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {t('registrations.registrationDate', 'Registration Date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {t('common.status', 'Status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {t('registrations.payment', 'Payment')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {t('common.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-transparent">
                  {filteredRegistrations.map(registration => {
                    const participantName = registration.participantName || 
                      `${registration.participantFirstName || ''} ${registration.participantLastName || ''}`.trim() || 'Participant';
                    const eventTitle = registration.event?.name || registration.eventName || 'Event';
                    const startDate = registration.event?.startDate || registration.eventStartDate;
                    const endDate = registration.event?.endDate || registration.eventEndDate;
                    const venue = registration.event?.venue || registration.eventVenue;
                    const regFee = registration.event?.registrationFee || registration.eventRegistrationFee;
                    const isFree = !regFee || Number(regFee) === 0;

                    return (
                      <tr key={registration.id} className="transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{participantName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{registration.participantEmail || registration.participantPhone}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {registration.registrationNumber && (
                                <span className="font-mono text-[11px] text-primary-600 dark:text-primary-400 font-bold">
                                  {registration.registrationNumber}
                                </span>
                              )}
                              {registration.churchName && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium border border-slate-200 dark:border-slate-700">
                                  {registration.churchName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{eventTitle}</p>
                            {startDate && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(startDate).toLocaleDateString()} {endDate ? `- ${new Date(endDate).toLocaleDateString()}` : ''}
                              </p>
                            )}
                            {venue && (
                              <p className="text-xs text-slate-400 dark:text-slate-500">{venue}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
                          {new Date(registration.registrationDate || registration.createdAt).toLocaleDateString('en-RW', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(registration.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {isFree ? (
                              <Badge variant="success">Free Event</Badge>
                            ) : (
                              <>
                                {getPaymentStatusBadge(registration.payment)}
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {formatCurrency(regFee)}
                                </p>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {/* Participant quick actions */}
                            {isParticipant && registration.status === 'PENDING' && !isFree && (
                              <Button
                                variant="primary"
                                size="sm"
                                icon={<DollarSign className="w-3.5 h-3.5" />}
                                onClick={() => navigate(`/app/payments/new?registrationId=${registration.id}`)}
                              >
                                Pay Fee
                              </Button>
                            )}

                            {isParticipant && (registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN') && (
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<QrCode className="w-3.5 h-3.5 text-primary-600" />}
                                onClick={() => navigate(`/app/registrations/${registration.id}`, { state: { registration } })}
                              >
                                Ticket
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Eye className="w-4 h-4" />}
                              onClick={() => navigate(`/app/registrations/${registration.id}`, { state: { registration } })}
                              title="View details"
                            />

                            {!isParticipant && registration.status === 'CONFIRMED' && registration.status !== 'CHECKED_IN' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<QrCode className="w-4 h-4 text-primary-600" />}
                                onClick={() => handleQuickCheckIn(registration.id)}
                                title="Quick check-in"
                              />
                            )}

                            {!isParticipant && (registration.status === 'PAYMENT_VERIFIED' || registration.status === 'PAYMENT_SUBMITTED') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<CheckCircle className="w-4 h-4 text-green-600" />}
                                onClick={() => handleConfirm(registration.id)}
                                title="Confirm registration"
                              />
                            )}

                            {registration.status !== 'CANCELLED' && registration.status !== 'CHECKED_IN' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<XCircle className="w-4 h-4 text-red-600" />}
                                onClick={() => handleCancel(registration.id)}
                                title="Cancel registration"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Summary Stats */}
      {!isParticipant && filteredRegistrations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('common.all', 'Total')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredRegistrations.length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('status.CONFIRMED', 'Confirmed')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredRegistrations.filter(r => r.status === 'CONFIRMED').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('status.CHECKED_IN', 'Checked In')}</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {filteredRegistrations.filter(r => r.status === 'CHECKED_IN').length}
                  </p>
                </div>
                <QrCode className="w-8 h-8 text-primary-400" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('status.PENDING', 'Pending')}</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {filteredRegistrations.filter(r => r.status === 'PENDING' || r.status === 'PAYMENT_SUBMITTED').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
