import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { paymentApi, eventApi, getCachedData } from '../../api';
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
  Receipt, 
  Smartphone, 
  ShieldCheck, 
  RefreshCw, 
  ArrowLeft,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function PaymentList() {
  const navigate = useNavigate();
  const { user, isAdmin, isCoordinator } = useAuth();
  
  const cachedPayments = useMemo(() => {
    const cached = getCachedData('/payments');
    if (cached?.data && Array.isArray(cached.data)) return cached.data;
    if (Array.isArray(cached)) return cached;
    return [];
  }, []);

  const [payments, setPayments] = useState(cachedPayments);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(cachedPayments.length === 0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [alert, setAlert] = useState(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState(null);
  
  const [filters, setFilters] = useState({
    event: '',
    status: '',
    search: ''
  });

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  const jurisdictionInfo = (() => {
    if (user?.role === 'ADMINISTRATOR' || user?.position === 'UNION_ADMINISTRATOR' || user?.position === 'UNION_LEADER' || user?.organizationLevel === 'UNION') {
      return {
        scope: 'Union-Wide Treasury Ledger',
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
    fetchPayments(cachedPayments.length > 0);
  }, []);

  const fetchEvents = async () => {
    try {
      const response = isCoordinator && !isUnionAdmin
        ? await eventApi.getMyEvents()
        : await eventApi.getAll();
      
      const list = response.data?.data || response.data || [];
      setEvents(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchPayments = async (isBackground = false) => {
    try {
      if (!isBackground && payments.length === 0) {
        setLoading(true);
      }
      const response = await paymentApi.getAll();
      const list = response.data?.data || response.data || [];
      setPayments(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      if (payments.length === 0) {
        setAlert({
          type: 'error',
          message: error.response?.data?.message || 'Failed to fetch payments'
        });
      }
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
    const config = variants[status] || { variant: 'default', label: status || 'PENDING', icon: Clock };
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

  // Safe filter logic
  const filteredPayments = payments.filter(payment => {
    // Event filter
    if (filters.event) {
      const matchEventId = (payment.eventId?.toString() === filters.event) || 
                           (payment.registration?.event?.id?.toString() === filters.event) ||
                           (payment.eventName === filters.event);
      if (!matchEventId) return false;
    }

    // Status filter
    if (filters.status && payment.status !== filters.status) return false;

    // Search query
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      const participantName = (payment.participantName || `${payment.registration?.participantFirstName || ''} ${payment.registration?.participantLastName || ''}`).toLowerCase();
      const reference = (payment.transactionReference || '').toLowerCase();
      const eventName = (payment.eventName || payment.registration?.event?.name || '').toLowerCase();
      
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
  ];

  const eventOptions = [
    { value: '', label: 'All Events' },
    ...events.map(event => ({ value: event.id.toString(), label: event.name }))
  ];

  // Calculate financial statistics safely
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
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments & Treasury Ledger</h1>
            {jurisdictionInfo && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="font-bold">{jurisdictionInfo.scope}:</span> {jurisdictionInfo.unit}
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
            Track, audit and verify event registration fee payments
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchPayments}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<ShieldCheck className="w-4 h-4" />}
            onClick={() => navigate('/app/payments/verify')}
          >
            Verification Desk {stats.pendingCount > 0 && `(${stats.pendingCount})`}
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

      {/* Financial Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Payments</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalPayments}</p>
                <p className="text-xs text-slate-500 mt-1">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <Receipt className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Revenue</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.verifiedCount}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">{formatCurrency(stats.verifiedAmount)}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingCount}</p>
                <p className="text-xs text-amber-600 font-medium mt-1">{formatCurrency(stats.pendingAmount)}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Rate</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">
                  {stats.totalPayments > 0 
                    ? Math.round((stats.verifiedCount / stats.totalPayments) * 100) 
                    : 100}%
                </p>
                <p className="text-xs text-slate-500 mt-1">of processed payments</p>
              </div>
              <div className="p-3 bg-primary-50 dark:bg-primary-950/60 rounded-xl">
                <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search participant, reference, or event..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9 text-xs"
              />
            </div>

            <Select
              value={filters.event}
              onChange={(e) => setFilters(prev => ({ ...prev, event: e.target.value }))}
              options={eventOptions}
              className="text-xs"
            />

            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={statusOptions}
              className="text-xs"
            />
          </div>

          {(filters.event || filters.status || filters.search) && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
              <p>
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
            <PageSpinner message="Fetching payments ledger..." />
          </CardBody>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<DollarSign className="w-12 h-12 text-slate-400" />}
              title="No payments found"
              description="No payments match the current filter criteria."
            />
          </CardBody>
        </Card>
      ) : viewMode === 'grid' ? (
        /* =========================================================================
           CARD GRID VIEW (Matching modern Cards design)
           ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPayments.map((payment) => {
            const participantName = payment.participantName || 
              `${payment.registration?.participantFirstName || ''} ${payment.registration?.participantLastName || ''}`.trim() || 'Participant';
            const eventName = payment.eventName || payment.registration?.event?.name || 'Event';
            const isMoMo = payment.paymentMethod === 'MOBILE_MONEY' || payment.transactionReference?.startsWith('MOMO');
            const initials = participantName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'P';

            return (
              <div
                key={payment.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Payment Method on Left, Status Badge on Right */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {isMoMo ? <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> : <Receipt className="w-3.5 h-3.5 text-blue-600" />}
                      <span>{payment.paymentMethod?.replace(/_/g, ' ') || 'Payment'}</span>
                    </span>
                    <div>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>

                  {/* Amount Display */}
                  <div className="mb-4">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Amount Paid</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="font-mono text-xs text-slate-500 dark:text-slate-400 font-bold mt-1 truncate">
                      Ref: {payment.transactionReference}
                    </div>
                  </div>

                  {/* Participant Info */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-primary-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 ring-1 ring-white dark:ring-slate-700">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {participantName}
                      </p>
                      {(payment.churchName || payment.registration?.churchName) && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {payment.churchName || payment.registration?.churchName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata Rows */}
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    {/* Event Name */}
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">{eventName}</span>
                    </div>

                    {/* Date Paid */}
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate font-mono text-slate-500 dark:text-slate-400">
                        {formatDateTime(payment.paidAt || payment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {payment.receiptUrl ? (
                    <button
                      onClick={() => setPreviewReceiptUrl(payment.receiptUrl)}
                      className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No receipt attached</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    {payment.status === 'PENDING' && (
                      <Button
                        variant="primary"
                        size="xs"
                        icon={<CheckCircle className="w-3.5 h-3.5" />}
                        onClick={() => handleQuickVerify(payment.id)}
                      >
                        Verify
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="xs"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => navigate(`/app/payments/${payment.id}`, { state: { payment } })}
                    >
                      Audit
                    </Button>
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
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Transaction Ref</th>
                    <th className="px-6 py-3.5">Participant</th>
                    <th className="px-6 py-3.5">Event</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Date Paid</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-transparent">
                  {filteredPayments.map(payment => {
                    const participantName = payment.participantName || 
                      `${payment.registration?.participantFirstName || ''} ${payment.registration?.participantLastName || ''}`.trim() || 'Participant';
                    const eventName = payment.eventName || payment.registration?.event?.name || 'Event';
                    const isMoMo = payment.paymentMethod === 'MOBILE_MONEY' || payment.transactionReference?.startsWith('MOMO');

                    return (
                      <tr key={payment.id} className="transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              {payment.transactionReference}
                            </p>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              {isMoMo ? <Smartphone className="w-3 h-3 text-emerald-600" /> : <Receipt className="w-3 h-3 text-blue-600" />}
                              {payment.paymentMethod?.replace(/_/g, ' ') || 'Payment'}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {participantName}
                            </p>
                            {(payment.churchName || payment.registration?.churchName) && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {payment.churchName || payment.registration?.churchName}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 dark:text-white">{eventName}</p>
                          {(payment.registrationNumber || payment.registration?.registrationNumber) && (
                            <p className="text-[11px] font-mono text-primary-600 dark:text-primary-400 font-bold">
                              {payment.registrationNumber || payment.registration?.registrationNumber}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {formatCurrency(payment.amount)}
                          </p>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDateTime(payment.paidAt || payment.createdAt)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {payment.receiptUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                                onClick={() => setPreviewReceiptUrl(payment.receiptUrl)}
                                title="View Receipt Proof"
                              />
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/app/payments/${payment.id}`, { state: { payment } })}
                            >
                              Audit
                            </Button>
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

      {/* Receipt Image Modal */}
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
    </div>
  );
}
