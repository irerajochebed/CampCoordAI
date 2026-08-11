import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { paymentApi } from '../../api';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Receipt,
  User,
  Mail,
  Phone,
  FileText,
  Download,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

export default function PaymentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin, isCoordinator } = useAuth();
  
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const canManage = isUnionAdmin || isCoordinator;

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getById(id);
      if (response.data.success) {
        setPayment(response.data.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch payment details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setSubmitting(true);
    try {
      const response = await paymentApi.verify(id, verificationNotes.trim() || null);
      
      if (response.data.success) {
        setAlert({
          type: 'success',
          message: 'Payment verified successfully'
        });
        setShowVerifyModal(false);
        setVerificationNotes('');
        fetchPayment();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to verify payment'
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
      const response = await paymentApi.reject(id, verificationNotes.trim());
      
      if (response.data.success) {
        setAlert({
          type: 'success',
          message: 'Payment rejected'
        });
        setShowRejectModal(false);
        setVerificationNotes('');
        fetchPayment();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to reject payment'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: { variant: 'warning', label: 'Pending Verification', icon: AlertCircle },
      VERIFIED: { variant: 'success', label: 'Verified', icon: CheckCircle },
      REJECTED: { variant: 'error', label: 'Rejected', icon: XCircle },
      REFUNDED: { variant: 'default', label: 'Refunded', icon: DollarSign },
    };
    const config = variants[status] || { variant: 'default', label: status, icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 text-base px-3 py-1">
        <Icon className="w-4 h-4" />
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <PageSpinner message="Loading payment details..." />;
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-800">Payment Not Found</h1>
        <p className="text-gray-600 mt-2">The payment you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/payments')} className="mt-4">
          Back to Payments
        </Button>
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
          <p className="text-gray-600 mt-1">
            Transaction Reference: <span className="font-mono font-semibold">{payment.transactionReference}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(payment.status)}
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Amount Paid</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Transaction Reference</p>
                    <p className="font-mono font-medium text-gray-900 mt-1">
                      {payment.transactionReference}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {payment.paymentMethod?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Payment Date</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {formatDateTime(payment.paidAt || payment.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                </div>

                {payment.notes && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Payment Notes</p>
                    <p className="text-gray-900">{payment.notes}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Participant & Registration Information */}
          <Card>
            <CardHeader>
              <CardTitle>Participant Information</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {payment.registration.participantFirstName} {payment.registration.participantLastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{payment.registration.participantEmail}</p>
                  </div>
                </div>

                {payment.registration.participantPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{payment.registration.participantPhone}</p>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Event</p>
                  <div>
                    <p className="font-semibold text-gray-900">{payment.registration.event.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(payment.registration.event.startDate).toLocaleDateString()} - {new Date(payment.registration.event.endDate).toLocaleDateString()}
                    </p>
                    {payment.registration.event.venue && (
                      <p className="text-sm text-gray-600">{payment.registration.event.venue}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Registration Fee</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(payment.registration.event.registrationFee)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Verification Information */}
          {(payment.status === 'VERIFIED' || payment.status === 'REJECTED') && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Information</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {payment.verifiedBy && (
                    <div>
                      <p className="text-sm text-gray-600">Verified By</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {payment.verifiedBy.firstName} {payment.verifiedBy.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{payment.verifiedBy.email}</p>
                    </div>
                  )}

                  {payment.verifiedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Verification Date</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {formatDateTime(payment.verifiedAt)}
                      </p>
                    </div>
                  )}

                  {payment.verificationNotes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Verification Notes</p>
                      <div className={`p-3 rounded-lg ${
                        payment.status === 'VERIFIED' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}>
                        <p className="text-sm text-gray-900">{payment.verificationNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Receipt */}
          {payment.receiptUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Receipt</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={payment.receiptUrl} 
                      alt="Payment Receipt" 
                      className="w-full h-auto"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden flex-col items-center justify-center p-8 bg-gray-50">
                      <Receipt className="w-12 h-12 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Receipt image unavailable</p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    icon={<Download className="w-4 h-4" />}
                    onClick={() => window.open(payment.receiptUrl, '_blank')}
                    className="w-full"
                  >
                    Download Receipt
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Actions */}
          {canManage && payment.status === 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Actions</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    icon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => setShowVerifyModal(true)}
                    className="w-full"
                  >
                    Verify Payment
                  </Button>

                  <Button
                    variant="error"
                    icon={<XCircle className="w-4 h-4" />}
                    onClick={() => setShowRejectModal(true)}
                    className="w-full"
                  >
                    Reject Payment
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Payment Submitted</p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(payment.createdAt)}
                    </p>
                  </div>
                </div>

                {payment.status === 'VERIFIED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Payment Verified</p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(payment.verifiedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {payment.status === 'REJECTED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Payment Rejected</p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(payment.verifiedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {payment.status === 'PENDING' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 animate-pulse"></div>
                    <div>
                      <p className="font-medium text-gray-900">Awaiting Verification</p>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Verify Modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setVerificationNotes('');
        }}
        title="Verify Payment"
        footer={
          <>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowVerifyModal(false);
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
              Verify Payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Confirm that you have verified this payment of <strong>{formatCurrency(payment.amount)}</strong> from <strong>{payment.registration.participantFirstName} {payment.registration.participantLastName}</strong>.
          </p>

          <Textarea
            label="Verification Notes (Optional)"
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            rows={3}
            placeholder="Add any notes about the verification..."
          />

          <Alert
            type="info"
            message="Once verified, the participant's registration status will be updated and they will receive a confirmation notification."
          />
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setVerificationNotes('');
        }}
        title="Reject Payment"
        footer={
          <>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowRejectModal(false);
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
            message="Rejecting this payment will notify the participant. Please provide a clear reason for rejection."
          />

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
