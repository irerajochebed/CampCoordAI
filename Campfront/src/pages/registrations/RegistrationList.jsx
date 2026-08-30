import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registrationApi, eventApi } from '../../api';
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
  Calendar
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
  
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  
  const [filters, setFilters] = useState({
    event: '',
    status: '',
    search: ''
  });

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = isCoordinator && !isUnionAdmin
        ? await eventApi.getMyEvents()
        : await eventApi.getAll();
      
      if (response.data.success) {
        setEvents(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      let response;
      
      if (isParticipant) {
        // Participants see only their own registrations
        response = await registrationApi.getMyRegistrations();
      } else if (isCoordinator && !isUnionAdmin) {
        // Coordinators see registrations for their events
        response = await registrationApi.getAll(); // Backend should filter by coordinator's events
      } else {
        // Union Admin sees all registrations
        response = await registrationApi.getAll();
      }

      if (response.data.success) {
        setRegistrations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || t('common.error', 'Failed to fetch registrations')
      });
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
    if (filters.event && reg.event.id.toString() !== filters.event) return false;
    if (filters.status && reg.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const participantName = `${reg.participantFirstName} ${reg.participantLastName}`.toLowerCase();
      const eventName = reg.event.name.toLowerCase();
      if (!participantName.includes(searchLower) && !eventName.includes(searchLower)) {
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
          <h1 className="text-2xl font-bold text-gray-900">{t('registrations.title', 'Registrations')}</h1>
          <p className="text-gray-600 mt-1">
            {isParticipant 
              ? t('registrations.mySubtitle', 'Your event registrations') 
              : t('registrations.subtitle', 'Manage event registrations and participant information')}
          </p>
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
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('registrations.participant', 'Participant')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('registrations.event', 'Event')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('registrations.registrationDate', 'Registration Date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('common.status', 'Status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('registrations.payment', 'Payment')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('common.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.map(registration => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">
                            {registration.participantFirstName} {registration.participantLastName}
                          </p>
                          <p className="text-sm text-gray-500">{registration.participantEmail}</p>
                          {registration.participantPhone && (
                            <p className="text-sm text-gray-500">{registration.participantPhone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{registration.event.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(registration.event.startDate).toLocaleDateString()} - {new Date(registration.event.endDate).toLocaleDateString()}
                          </p>
                          {registration.event.venue && (
                            <p className="text-sm text-gray-500">{registration.event.venue}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(registration.registrationDate).toLocaleDateString('en-RW', {
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
                          {getPaymentStatusBadge(registration.payment)}
                          {registration.event.registrationFee && (
                            <p className="text-sm text-gray-500">
                              {formatCurrency(registration.event.registrationFee)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => navigate(`/app/registrations/${registration.id}`)}
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

                          {!isParticipant && registration.status === 'PAYMENT_VERIFIED' && (
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
                  ))}
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
