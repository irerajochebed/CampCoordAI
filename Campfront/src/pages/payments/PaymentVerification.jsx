import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { paymentApi, eventApi } from '../../api';
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
  Calendar
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
  
  const [pendingPayments, setPendingPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [filters, setFilters] = useState({
    event: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    fetchEvents();
    fetchPendingPayments();
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

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      // Fetch pending payments - adjust based on your API
      const response = filters.event 
        ? await paymentApi.getPending(filters.event)
        : await paymentApi.getAll?.() || { data: { success: true, data: [] } };
      
      if (response.data.success) {
        // Filter for PENDING status
        const pending = (response.data.data || []).filter(p => p.status === 'PENDING');
        setPendingPayments(pending);
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      setAlert({
        type: 'error',
        message: 'Failed to fetch pending payments'
      });
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
    if (filters.event && payment.registration.event.id.toString() !== filters.event) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const participantName = `${payment.registration.participantFirstName} ${payment.registration.participantLastName}`.toLowerCase();
      const reference = (payment.transactionReference || '').toLowerCase();
      
      if (!participantName.includes(searchLower) && !reference.includes(searchLower)) {
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

  if (loading) {
    return <PageSpinner message="Loading pending payments..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/payments')}
            className="mb-4"
          >
            Back to Payments
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Payment Verification Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Review and verify pending payment submissions
          </p>
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
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Participant & Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Transaction Ref
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Receipt
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map(payment => (
                    <tr key={payment.id} className={`hover:bg-gray-50 ${selectedPayments.includes(payment.id) ? 'bg-primary-50' : ''}`}>
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
                          <p className="font-medium text-gray-900">
                            {payment.registration.participantFirstName} {payment.registration.participantLastName}
                          </p>
                          <p className="text-sm text-gray-500">{payment.registration.participantEmail}</p>
                          <p className="text-sm text-gray-600 mt-1">{payment.registration.event.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.paymentMethod?.replace(/_/g, ' ')}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-mono text-sm text-gray-900">
                          {payment.transactionReference}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(payment.paidAt || payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.receiptUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => window.open(payment.receiptUrl, '_blank')}
                          >
                            View
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-400">No receipt</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => navigate(`/payments/${payment.id}`)}
                            title="View details"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<CheckCircle className="w-4 h-4 text-green-600" />}
                            onClick={() => handleVerifySingle(payment)}
                            title="Verify"
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
                  ))}
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
              Confirm verification of payment <strong>{formatCurrency(currentPayment.amount)}</strong> from <strong>{currentPayment.registration.participantFirstName} {currentPayment.registration.participantLastName}</strong>.
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
              Payment from <strong>{currentPayment.registration.participantFirstName} {currentPayment.registration.participantLastName}</strong> for <strong>{formatCurrency(currentPayment.amount)}</strong>
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
    </div>
  );
}
