import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { paymentApi, eventApi, getCachedData } from '../../api';
import { 
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter,
  TrendingUp,
  AlertCircle,
  Calendar,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

export default function PaymentVerification() {
  const navigate = useNavigate();
  const { user, isAdmin, isCoordinator } = useAuth();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  
  // Instant In-Memory Cache Initialization
  const cachedPayments = useMemo(() => {
    const cached = getCachedData('/payments');
    const list = cached?.data || cached || [];
    if (Array.isArray(list)) {
      return list.filter(p => p.status === 'PENDING');
    }
    return [];
  }, []);

  const cachedEvents = useMemo(() => {
    const cached = getCachedData('/events');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const [pendingPayments, setPendingPayments] = useState(cachedPayments);
  const [events, setEvents] = useState(cachedEvents);
  const [loading, setLoading] = useState(cachedPayments.length === 0);
  const [alert, setAlert] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState(null);
  
  const [filters, setFilters] = useState({
    event: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    fetchEvents();
    fetchPendingPayments(cachedPayments.length > 0);
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

  const fetchPendingPayments = async (isBackground = false) => {
    try {
      if (!isBackground && pendingPayments.length === 0) setLoading(true);
      let list = [];
      if (filters.event) {
        const response = await paymentApi.getPending(filters.event);
        list = response.data?.data || response.data || [];
      } else {
        const response = await paymentApi.getByStatus('PENDING').catch(async () => {
          return await paymentApi.getAll();
        });
        list = response.data?.data || response.data || [];
      }
      
      const pending = Array.isArray(list) ? list.filter(p => p.status === 'PENDING') : [];
      setPendingPayments(pending);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      if (pendingPayments.length === 0) {
        setAlert({
          type: 'error',
          message: 'Failed to fetch pending payments'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPayment = (paymentId) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === filteredPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(filteredPayments.map(p => p.id));
    }
  };

  const handleVerifySingle = (payment) => {
    setCurrentPayment(payment);
    setVerificationNotes('');
    setShowVerifyModal(true);
  };

  const handleRejectSingle = (payment) => {
    setCurrentPayment(payment);
    setVerificationNotes('');
    setShowRejectModal(true);
  };

  const handleBulkVerify = () => {
    if (selectedPayments.length === 0) {
      setAlert({ type: 'error', message: 'Please select payments to verify' });
      return;
    }
    setCurrentPayment(null);
    setVerificationNotes('');
    setShowVerifyModal(true);
  };

  const handleVerify = async () => {
    setSubmitting(true);
    try {
      const paymentsToVerify = currentPayment ? [currentPayment.id] : selectedPayments;
      let successCount = 0;
      let errorCount = 0;

      for (const paymentId of paymentsToVerify) {
        try {
          await paymentApi.verify(paymentId, verificationNotes.trim() || null);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to verify payment ${paymentId}:`, error);
        }
      }

      setAlert({
        type: errorCount === 0 ? 'success' : 'warning',
        message: `Verified ${successCount} payment(s). ${errorCount > 0 ? `${errorCount} failed.` : ''}`
      });

      setShowVerifyModal(false);
      setCurrentPayment(null);
      setVerificationNotes('');
      setSelectedPayments([]);
      fetchPendingPayments();
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to verify payments'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!verificationNotes.trim()) {
      setAlert({ type: 'error', message: 'Please provide a reason for rejection' });
      return;
    }

    setSubmitting(true);
    try {
      await paymentApi.reject(currentPayment.id, verificationNotes.trim());
      
      setAlert({
        type: 'success',
        message: 'Payment rejected successfully'
      });

      setShowRejectModal(false);
      setCurrentPayment(null);
      setVerificationNotes('');
      fetchPendingPayments();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to reject payment'
      });
    } finally {
      setSubmitting(false);
    }
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
  const filteredPayments = pendingPayments.filter(payment => {
    const eventId = payment.registration?.event?.id || payment.eventId;
    if (filters.event && eventId && eventId.toString() !== filters.event) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const participantName = (payment.participantName || `${payment.registration?.participantFirstName || ''} ${payment.registration?.participantLastName || ''}`).toLowerCase();
      const reference = (payment.transactionReference || payment.referenceNumber || '').toLowerCase();
      const eventTitle = (payment.eventName || payment.registration?.event?.name || '').toLowerCase();
      
      if (!participantName.includes(searchLower) && !reference.includes(searchLower) && !eventTitle.includes(searchLower)) {
        return false;
      }
    }
    if (filters.dateFrom) {
      const paymentDate = new Date(payment.paidAt || payment.createdAt);
      if (paymentDate < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const paymentDate = new Date(payment.paidAt || payment.createdAt);
      if (paymentDate > new Date(filters.dateTo)) return false;
    }
    return true;
  });

  const eventOptions = [
    { value: '', label: 'All Events' },
    ...events.map(event => ({ value: event.id.toString(), label: event.name }))
  ];

  // Calculate statistics
  const totalAmount = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/app/payments')}
            className="mb-4"
          >
            Back to Payments
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Payment Verification Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Review and verify pending payment submissions
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

          {selectedPayments.length > 0 && (
            <Button
              variant="primary"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={handleBulkVerify}
            >
              Verify Selected ({selectedPayments.length})
            </Button>
          )}
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{filteredPayments.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-primary-600">{selectedPayments.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-primary-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by participant or reference..."
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

            <Input
              type="date"
              placeholder="From date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />

            <Input
              type="date"
              placeholder="To date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>

          {(filters.event || filters.search || filters.dateFrom || filters.dateTo) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredPayments.length} of {pendingPayments.length} payments
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ event: '', search: '', dateFrom: '', dateTo: '' })}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payments Grid */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<CheckCircle className="w-12 h-12" />}
              title="No pending payments"
              description="All payments have been verified or there are no payments matching your filters"
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
            const eventTitle = payment.eventName || payment.registration?.event?.name || 'Event';
            const email = payment.participantEmail || payment.registration?.participantEmail || '';
            const regId = payment.registrationId || payment.registration?.id;
            const isSelected = selectedPayments.includes(payment.id);
            const initials = participantName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'P';

            return (
              <div
                key={payment.id}
                className={`group bg-white dark:bg-slate-900 rounded-2xl border p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                  isSelected 
                    ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/10' 
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Header: Select Checkbox + Method on Left, Ref on Right */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectPayment(payment.id)}
                        className="w-4 h-4 text-primary-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {payment.paymentMethod?.replace(/_/g, ' ') || 'Payment'}
                      </span>
                    </label>

                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 truncate max-w-[140px]">
                      {payment.transactionReference || payment.referenceNumber || 'N/A'}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="mb-4">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Submitted Amount</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                      {formatCurrency(payment.amount)}
                    </div>
                  </div>

                  {/* Participant & Event */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 via-indigo-600 to-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 ring-1 ring-white dark:ring-slate-700">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {participantName}
                      </p>
                      {email && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata Rows */}
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    {/* Event Name */}
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">{eventTitle}</span>
                    </div>

                    {/* Submitted Date */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-500">Submitted:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {formatDateTime(payment.paidAt || payment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {payment.receiptUrl ? (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setPreviewReceiptUrl(payment.receiptUrl)}
                    >
                      Proof
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No receipt</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="success"
                      size="xs"
                      icon={<CheckCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleVerifySingle(payment)}
                    >
                      Verify
                    </Button>

                    <Button
                      variant="danger"
                      size="xs"
                      icon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleRejectSingle(payment)}
                    >
                      Reject
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
              <table className="w-full">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left">
                      Participant & Event
                    </th>
                    <th className="px-6 py-3 text-left">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left">
                      Transaction Ref
                    </th>
                    <th className="px-6 py-3 text-left">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left">
                      Receipt
                    </th>
                    <th className="px-6 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-transparent">
                  {filteredPayments.map(payment => {
                    const participantName = payment.participantName || 
                      `${payment.registration?.participantFirstName || ''} ${payment.registration?.participantLastName || ''}`.trim() || 'Participant';
                    const eventTitle = payment.eventName || payment.registration?.event?.name || 'Event';
                    const email = payment.participantEmail || payment.registration?.participantEmail || '';
                    const regId = payment.registrationId || payment.registration?.id;

                    return (
                      <tr key={payment.id} className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${selectedPayments.includes(payment.id) ? 'bg-primary-500/10' : ''}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPayments.includes(payment.id)}
                            onChange={() => handleSelectPayment(payment.id)}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{participantName}</p>
                            {email && <p className="text-xs text-slate-500 dark:text-slate-400">{email}</p>}
                            <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mt-1">{eventTitle}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-base font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.paymentMethod?.replace(/_/g, ' ')}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block">
                            {payment.transactionReference || payment.referenceNumber || 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                          {formatDateTime(payment.paidAt || payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {payment.receiptUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Eye className="w-3.5 h-3.5" />}
                              onClick={() => setPreviewReceiptUrl(payment.receiptUrl)}
                            >
                              View Proof
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">No file</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {regId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Eye className="w-4 h-4" />}
                                onClick={() => navigate(`/app/registrations/${regId}`)}
                                title="View registration"
                              />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<CheckCircle className="w-4 h-4 text-green-600" />}
                              onClick={() => handleVerifySingle(payment)}
                              title="Verify & Confirm"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<XCircle className="w-4 h-4 text-red-600" />}
                              onClick={() => handleRejectSingle(payment)}
                              title="Reject"
                            />
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

      {/* Verify Modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setCurrentPayment(null);
          setVerificationNotes('');
        }}
        title={currentPayment ? 'Verify Payment' : `Verify ${selectedPayments.length} Payments`}
        footer={
          <>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowVerifyModal(false);
                setCurrentPayment(null);
                setVerificationNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={handleVerify}
              loading={submitting}
            >
              Verify {currentPayment ? 'Payment' : `${selectedPayments.length} Payments`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {currentPayment ? (
            <p className="text-gray-700">
              Confirm verification of payment <strong>{formatCurrency(currentPayment.amount)}</strong> from <strong>{currentPayment.participantName || `${currentPayment.registration?.participantFirstName || ''} ${currentPayment.registration?.participantLastName || ''}`.trim() || 'Participant'}</strong>.
            </p>
          ) : (
            <p className="text-gray-700">
              Confirm verification of <strong>{selectedPayments.length} selected payments</strong>.
            </p>
          )}

          <Textarea
            label="Verification Notes (Optional)"
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            rows={3}
            placeholder="Add any notes about the verification..."
          />

          <Alert
            type="info"
            message="Once verified, participants' registration statuses will be updated and they will receive confirmation notifications."
          />
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setCurrentPayment(null);
          setVerificationNotes('');
        }}
        title="Reject Payment"
        footer={
          <>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowRejectModal(false);
                setCurrentPayment(null);
                setVerificationNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              icon={<XCircle className="w-4 h-4" />}
              onClick={handleReject}
              loading={submitting}
            >
              Reject Payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert
            type="warning"
            message="Rejecting this payment will notify the participant. Please provide a clear reason."
          />

          {currentPayment && (
            <p className="text-gray-700">
              Payment from <strong>{currentPayment.participantName || `${currentPayment.registration?.participantFirstName || ''} ${currentPayment.registration?.participantLastName || ''}`}</strong> for <strong>{formatCurrency(currentPayment.amount)}</strong>
            </p>
          )}

          <Textarea
            label="Reason for Rejection"
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            rows={4}
            placeholder="Explain why this payment is being rejected..."
            required
          />
        </div>
      </Modal>

      {/* Receipt Image Preview Modal */}
      {previewReceiptUrl && (
        <Modal
          isOpen={!!previewReceiptUrl}
          onClose={() => setPreviewReceiptUrl(null)}
          title="Payment Proof Receipt"
          size="lg"
        >
          <div className="space-y-4">
            <img 
              src={previewReceiptUrl} 
              alt="Receipt Preview" 
              className="w-full max-h-[70vh] object-contain rounded border border-gray-200"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
