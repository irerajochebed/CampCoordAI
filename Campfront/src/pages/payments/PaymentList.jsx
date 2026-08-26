import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { paymentApi, eventApi } from '../../api';
import { 
  Search, 
  Filter,
  Eye,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  Receipt
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function PaymentList() {
  const navigate = useNavigate();
  const { user, isAdmin, isCoordinator } = useAuth();
  
  const [payments, setPayments] = useState([]);
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
    fetchPayments();
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

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Fetch all payments - backend should filter by coordinator's events
      const response = await paymentApi.getAll?.() || await paymentApi.getByEvent(filters.event);
      
      if (response.data.success) {
        setPayments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch payments'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: { variant: 'warning', label: 'Pending Verification', icon: Clock },
      VERIFIED: { variant: 'success', label: 'Verified', icon: CheckCircle },
      REJECTED: { variant: 'error', label: 'Rejected', icon: XCircle },
      REFUNDED: { variant: 'default', label: 'Refunded', icon: DollarSign },
    };
    const config = variants[status] || { variant: 'default', label: status, icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Apply filters
  const filteredPayments = payments.filter(payment => {
    if (filters.event && payment.registration.event.id.toString() !== filters.event) return false;
    if (filters.status && payment.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const participantName = `${payment.registration.participantFirstName} ${payment.registration.participantLastName}`.toLowerCase();
      const reference = (payment.transactionReference || '').toLowerCase();
      const eventName = payment.registration.event.name.toLowerCase();
      
      if (!participantName.includes(searchLower) && 
          !reference.includes(searchLower) &&
          !eventName.includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending Verification' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'REFUNDED', label: 'Refunded' },
  ];

  const eventOptions = [
    { value: '', label: 'All Events' },
    ...events.map(event => ({ value: event.id.toString(), label: event.name }))
  ];

  // Calculate financial statistics
  const stats = {
    totalPayments: filteredPayments.length,
    totalAmount: filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    verifiedAmount: filteredPayments
      .filter(p => p.status === 'VERIFIED')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    pendingAmount: filteredPayments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    verifiedCount: filteredPayments.filter(p => p.status === 'VERIFIED').length,
    pendingCount: filteredPayments.filter(p => p.status === 'PENDING').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">
            Track and verify event registration payments
          </p>
        </div>

        <Button
          variant="primary"
          icon={<TrendingUp className="w-4 h-4" />}
          onClick={() => navigate('/payments/verify')}
        >
          Verification Dashboard
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Financial Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <Receipt className="w-8 h-8 text-gray-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-600">{stats.verifiedCount}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.verifiedAmount)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.pendingAmount)}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verification Rate</p>
                <p className="text-2xl font-bold text-primary-600">
                  {stats.totalPayments > 0 
                    ? Math.round((stats.verifiedCount / stats.totalPayments) * 100) 
                    : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">of total payments</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by participant, reference, or event..."
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
                Showing {filteredPayments.length} of {payments.length} payments
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ event: '', status: '', search: '' })}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payments Table */}
      {loading ? (
        <Card>
          <CardBody>
            <div className="text-center py-8 text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching payments...</span>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<DollarSign className="w-12 h-12" />}
              title="No payments found"
              description="No payments match your filters"
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
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-mono text-sm font-medium text-gray-900">
                            {payment.transactionReference}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.paymentMethod?.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.registration.participantFirstName} {payment.registration.participantLastName}
                          </p>
                          <p className="text-sm text-gray-500">{payment.registration.participantEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{payment.registration.event.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(payment.registration.event.startDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(payment.paidAt || payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => navigate(`/payments/${payment.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
