import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registrationApi, qrCodeApi, accommodationApi, attendanceApi, getCachedData } from '../../api';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  QrCode,
  Home,
  ClipboardCheck,
  FileText,
  Download,
  ExternalLink,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

export default function RegistrationDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user, isAdmin, isCoordinator, isParticipant } = useAuth();
  
  // Instant initial data from route state or API memory cache
  const initialRegistration = useMemo(() => {
    if (location.state?.registration) return location.state.registration;
    const cached = getCachedData(`/registrations/${id}`);
    if (cached?.data) return cached.data;
    if (cached && !cached.success && cached.id) return cached;
    return null;
  }, [id, location.state]);

  const [registration, setRegistration] = useState(initialRegistration);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [accommodation, setAccommodation] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(!initialRegistration);
  const [alert, setAlert] = useState(null);
  const [previewReceiptModal, setPreviewReceiptModal] = useState(false);

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    if (initialRegistration) {
      setRegistration(initialRegistration);
      setLoading(false);
    }
    fetchRegistration(Boolean(initialRegistration));
    fetchQRCode();
    fetchAccommodation();
    fetchAttendance();
  }, [id]);

  const fetchRegistration = async (isBackground = false) => {
    try {
      if (!isBackground && !registration) {
        setLoading(true);
      }
      const response = await registrationApi.getById(id);
      if (response.data?.success) {
        setRegistration(response.data.data);
      } else if (response.data) {
        setRegistration(response.data);
      }
    } catch (error) {
      if (!registration && !initialRegistration) {
        setAlert({
          type: 'error',
          message: error.response?.data?.message || 'Failed to fetch registration details'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      const response = await qrCodeApi.getRegistrationQRImage(id);
      const imageUrl = URL.createObjectURL(response.data);
      setQrCodeImage(imageUrl);
    } catch (error) {
      console.log('QR Code not yet available or registration not confirmed:', error);
    }
  };

  const fetchAccommodation = async () => {
    try {
      const response = await accommodationApi.getAssignmentByRegistration(id);
      if (response.data.success) {
        setAccommodation(response.data.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching accommodation:', error);
      }
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await attendanceApi.getByRegistration(id);
      if (response.data.success) {
        setAttendanceRecords(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleConfirm = async () => {
    if (!confirm('Confirm this registration and generate QR code?')) return;

    try {
      await registrationApi.confirm(id);
      setAlert({ type: 'success', message: 'Registration confirmed successfully! QR Code generated.' });
      fetchRegistration();
      fetchQRCode();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to confirm registration'
      });
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this registration?')) return;

    try {
      await registrationApi.cancel(id);
      setAlert({ type: 'success', message: 'Registration cancelled successfully' });
      fetchRegistration();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to cancel registration'
      });
    }
  };

  const handleCheckIn = async () => {
    if (isEventPassed) {
      setAlert({ type: 'error', message: 'Check-in is closed: This event has already concluded.' });
      return;
    }
    try {
      await registrationApi.checkIn(id);
      setAlert({ type: 'success', message: 'Participant checked in successfully' });
      fetchRegistration();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to check in participant'
      });
    }
  };

  const handleCheckOut = async () => {
    if (isEventPassed) {
      setAlert({ type: 'error', message: 'Checkout is closed: This event has already concluded.' });
      return;
    }
    if (!confirm('Check out this participant?')) return;

    try {
      await registrationApi.checkOut(id);
      setAlert({ type: 'success', message: 'Participant checked out successfully' });
      fetchRegistration();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to check out participant'
      });
    }
  };

  const downloadQRCode = () => {
    if (qrCodeImage) {
      const link = document.createElement('a');
      link.href = qrCodeImage;
      link.download = `registration-${registration?.registrationNumber || id}-qrcode.png`;
      link.click();
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: { variant: 'warning', label: 'Pending Payment', icon: Clock },
      PAYMENT_SUBMITTED: { variant: 'info', label: 'Payment Under Review', icon: DollarSign },
      PAYMENT_VERIFIED: { variant: 'success', label: 'Payment Verified', icon: CheckCircle },
      CONFIRMED: { variant: 'success', label: 'Confirmed (Ticket Ready)', icon: CheckCircle },
      CANCELLED: { variant: 'error', label: 'Cancelled', icon: XCircle },
      CHECKED_IN: { variant: 'success', label: 'Checked In', icon: ClipboardCheck },
      CHECKED_OUT: { variant: 'default', label: 'Checked Out', icon: CheckCircle },
    };
    const config = variants[status] || { variant: 'default', label: status, icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1.5 py-1 px-3 text-sm">
        <Icon className="w-4 h-4" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (payment) => {
    if (!payment) {
      return <Badge variant="error">No Payment</Badge>;
    }
    const variants = {
      PENDING: { variant: 'warning', label: 'Pending Verification' },
      VERIFIED: { variant: 'success', label: 'Verified & Approved' },
      REJECTED: { variant: 'error', label: 'Rejected / Invalid' },
    };
    const config = variants[payment.status] || { variant: 'default', label: payment.status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !registration) {
    return <PageSpinner message="Loading registration details..." />;
  }

  if (!registration) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-800">Registration Not Found</h1>
        <p className="text-gray-600 mt-2">The registration you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/app/registrations')} className="mt-4">
          Back to Registrations
        </Button>
      </div>
    );
  }

  const eventObj = registration.event || {};
  const eventName = eventObj.name || registration.eventName || 'Event';
  const eventStartDate = eventObj.startDate || registration.eventStartDate;
  const eventEndDate = eventObj.endDate || registration.eventEndDate;
  const eventVenue = eventObj.venue || registration.eventVenue || 'TBD';
  const eventFee = eventObj.registrationFee || registration.eventRegistrationFee || 0;
  const isFreeEvent = !eventFee || Number(eventFee) === 0;

  const payment = registration.payment || (registration.payments && registration.payments[0]) || null;
  const participantFullName = registration.participantFirstName && registration.participantLastName 
    ? `${registration.participantFirstName} ${registration.participantLastName}`
    : (registration.participantName || `${user?.firstName || ''} ${user?.lastName || ''}`);

  const canManage = isUnionAdmin || isCoordinator || 
    (eventObj.coordinator?.id === user?.userId || eventObj.coordinatorId === user?.userId);

  const isEventPassed = (
    eventObj.status === 'COMPLETED' ||
    eventObj.status === 'CANCELLED' ||
    (eventEndDate && new Date(eventEndDate + (eventEndDate.includes('T') ? '' : 'T23:59:59')) < new Date())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/app/registrations')}
            className="mb-2"
          >
            Back to Registrations
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Registration Details</h1>
          <p className="text-gray-600 text-sm mt-0.5">
            Registration Number: <span className="font-mono font-semibold text-primary-700">{registration.registrationNumber || `#${registration.id}`}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(registration.status)}
        </div>
      </div>

      {isEventPassed && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3 text-slate-800 dark:text-slate-200">
          <CheckCircle className="w-5 h-5 text-slate-500 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Event Concluded:</span> This event ended on {eventEndDate ? new Date(eventEndDate).toLocaleDateString() : 'its closing date'}. Check-in and checkout are closed. Registration records remain archived for administrative reference.
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

      {/* Interactive Step-by-Step Progress Bar */}
      <Card className="border-primary-100 bg-gradient-to-r from-white via-primary-50/30 to-white">
        <CardBody className="p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm shadow">
                ✓
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 1</p>
                <p className="text-sm font-semibold text-gray-900">Registered</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow ${
                isFreeEvent || payment || registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN'
                  ? 'bg-green-500 text-white'
                  : 'bg-amber-500 text-white animate-pulse'
              }`}>
                {isFreeEvent || payment || registration.status === 'CONFIRMED' ? '✓' : '2'}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 2</p>
                <p className="text-sm font-semibold text-gray-900">
                  {isFreeEvent ? 'Free Event' : (payment ? 'Proof Submitted' : 'Payment Required')}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow ${
                isFreeEvent || registration.status === 'PAYMENT_VERIFIED' || registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN'
                  ? 'bg-green-500 text-white'
                  : (registration.status === 'PAYMENT_SUBMITTED' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600')
              }`}>
                {isFreeEvent || registration.status === 'PAYMENT_VERIFIED' || registration.status === 'CONFIRMED' ? '✓' : '3'}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 3</p>
                <p className="text-sm font-semibold text-gray-900">
                  {isFreeEvent ? 'Auto-Verified' : (payment?.status === 'VERIFIED' ? 'Verified' : 'Verification')}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow ${
                registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN'
                  ? 'bg-green-600 text-white ring-2 ring-green-200'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN' ? '★' : '4'}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 4</p>
                <p className="text-sm font-semibold text-gray-900">QR Ticket Issued</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Pending Payment Callout Banner */}
      {registration.status === 'PENDING' && !isFreeEvent && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Action Required: Submit Payment Proof</h3>
              <p className="text-sm text-amber-800 mt-0.5">
                Your registration is reserved. Please submit payment of <span className="font-bold">{formatCurrency(eventFee)}</span> to get your official QR ticket.
              </p>
            </div>
          </div>
          <Link to={`/app/payments/new?registrationId=${registration.id}`}>
            <Button variant="primary" icon={<DollarSign className="w-4 h-4" />}>
              Submit Payment Proof Now
            </Button>
          </Link>
        </div>
      )}

      {/* Payment Submitted Callout */}
      {registration.status === 'PAYMENT_SUBMITTED' && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg shadow-sm flex items-start gap-3">
          <Clock className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Payment Submitted & Under Review</h3>
            <p className="text-sm text-blue-800 mt-0.5">
              We received your payment proof with reference <span className="font-mono font-semibold">{payment?.transactionReference || 'N/A'}</span>. The event coordinator will verify it shortly, after which your QR ticket will be issued.
            </p>
          </div>
          {canManage && (
            <Link to="/app/payments/verify">
              <Button size="sm" variant="outline" icon={<ShieldCheck className="w-4 h-4" />}>
                Go to Verification Desk
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Participant Information */}
          <Card>
            <CardHeader>
              <CardTitle>Participant Information</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="font-semibold text-gray-900 text-base">{participantFullName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{registration.participantEmail || user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{registration.participantPhone || user?.phone || user?.phoneNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {registration.churchName && (
                  <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Church / Organization Unit</p>
                      <p className="font-medium text-gray-900">{registration.churchName}</p>
                    </div>
                  </div>
                )}

                {registration.emergencyContactName && (
                  <>
                    <div className="border-t border-gray-200 my-3"></div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Emergency Contact</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <p className="text-gray-900">
                          <span className="text-gray-500">Name:</span> <strong>{registration.emergencyContactName}</strong>
                        </p>
                        {registration.emergencyContactPhone && (
                          <p className="text-gray-900">
                            <span className="text-gray-500">Phone:</span> <strong>{registration.emergencyContactPhone}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {registration.specialRequirements && (
                  <>
                    <div className="border-t border-gray-200 my-3"></div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Special Requirements</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded">{registration.specialRequirements}</p>
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Event Information */}
          <Card>
            <CardHeader action={
              <Link to={`/app/events/${eventObj.id || registration.eventId}`}>
                <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                  View Event Page
                </Button>
              </Link>
            }>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Event Name</p>
                  <p className="text-lg font-bold text-gray-900">{eventName}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Dates</p>
                      <p className="font-medium text-gray-900">
                        {eventStartDate ? new Date(eventStartDate).toLocaleDateString() : 'TBD'} &rarr; {eventEndDate ? new Date(eventEndDate).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Venue</p>
                      <p className="font-medium text-gray-900">{eventVenue}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Registration Fee</p>
                      <p className="text-base font-bold text-gray-900">
                        {isFreeEvent ? 'Free Registration' : formatCurrency(eventFee)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Registration Submitted On</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(registration.registrationDate || registration.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader action={
              registration.status === 'PENDING' && !isFreeEvent && (
                <Link to={`/app/payments/new?registrationId=${registration.id}`}>
                  <Button variant="primary" size="sm" icon={<DollarSign className="w-3.5 h-3.5" />}>
                    Submit Payment
                  </Button>
                </Link>
              )
            }>
              <CardTitle>Payment & Proof of Transaction</CardTitle>
            </CardHeader>
            <CardBody>
              {payment ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment Status</span>
                    {getPaymentStatusBadge(payment)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Amount Paid</p>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <p className="font-medium text-gray-900">{payment.paymentMethod?.replace(/_/g, ' ')}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Transaction Reference</p>
                      <p className="font-mono text-sm font-semibold text-gray-900">
                        {payment.transactionReference || payment.referenceNumber || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Payment Date</p>
                      <p className="font-medium text-gray-900">{formatDateTime(payment.paidAt || payment.paymentDate)}</p>
                    </div>
                  </div>

                  {payment.receiptUrl && (
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Uploaded Payment Receipt</p>
                      <div className="flex items-center gap-3">
                        <img 
                          src={payment.receiptUrl} 
                          alt="Receipt Preview" 
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setPreviewReceiptModal(true)}
                        />
                        <div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setPreviewReceiptModal(true)}
                          >
                            View Receipt Proof
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {payment.verificationNotes && (
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Coordinator Verification Notes</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded">{payment.verificationNotes}</p>
                    </div>
                  )}
                </div>
              ) : isFreeEvent ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Free Event — No Payment Required</p>
                  <p className="text-sm text-gray-500 mt-1">Your spot is automatically confirmed upon registration.</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <DollarSign className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Payment Proof Not Yet Submitted</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Please submit your payment of {formatCurrency(eventFee)} to confirm your registration.
                  </p>
                  <Link to={`/app/payments/new?registrationId=${registration.id}`} className="mt-4 inline-block">
                    <Button variant="primary" icon={<DollarSign className="w-4 h-4" />}>
                      Submit Payment Proof Now
                    </Button>
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Accommodation Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Accommodation</CardTitle>
            </CardHeader>
            <CardBody>
              {accommodation ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Building & Room</p>
                      <p className="font-semibold text-gray-900">
                        {accommodation.room?.accommodation?.buildingName || accommodation.room?.accommodation?.name || 'Building'} &mdash; Room {accommodation.room?.roomNumber}{accommodation.bedNumber ? ` (Bed #${accommodation.bedNumber})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Check-in Date</p>
                      <p className="font-medium text-gray-900">{accommodation.checkInDate ? new Date(accommodation.checkInDate).toLocaleDateString() : 'Event Start'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Check-out Date</p>
                      <p className="font-medium text-gray-900">{accommodation.checkOutDate ? new Date(accommodation.checkOutDate).toLocaleDateString() : 'Event End'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Home className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Accommodation will be assigned by event coordinators prior to the event.</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Session Attendance</CardTitle>
            </CardHeader>
            <CardBody>
              {attendanceRecords.length > 0 ? (
                <div className="space-y-2">
                  {attendanceRecords.map((record, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{record.session?.title || 'Session'}</p>
                        <p className="text-xs text-gray-500">
                          {record.session?.date ? new Date(record.session.date).toLocaleDateString() : ''} {record.session?.startTime || ''}
                        </p>
                      </div>
                      <Badge variant="success">Present</Badge>
                    </div>
                  ))}
                  <div className="pt-2 text-xs text-gray-500 font-medium">
                    Total Sessions Attended: {attendanceRecords.length}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No session attendance recorded yet.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* QR Code Ticket */}
          <Card className="border-primary-200 shadow-sm">
            <CardHeader className="bg-primary-50/50">
              <CardTitle className="text-primary-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary-600" />
                Event Check-In Ticket
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div className="text-center">
                {registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN' ? (
                  qrCodeImage ? (
                    <div className="space-y-3">
                      <div className="bg-white p-3 border-2 border-dashed border-primary-300 rounded-xl inline-block shadow-inner">
                        <img 
                          src={qrCodeImage} 
                          alt="Registration QR Code Ticket" 
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                      <div>
                        <span className="font-mono text-xs text-gray-500 font-semibold block">
                          {registration.qrCode || registration.registrationNumber}
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          Present this QR code at event entry for fast check-in.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Download className="w-4 h-4" />}
                        onClick={downloadQRCode}
                        className="w-full"
                      >
                        Download Ticket QR Code
                      </Button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <PageSpinner message="Generating QR ticket..." />
                    </div>
                  )
                ) : (
                  <div className="py-6 space-y-3 text-center">
                    <QrCode className="w-14 h-14 text-gray-300 mx-auto" />
                    <div>
                      <p className="font-semibold text-gray-700">Ticket Locked</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Your QR check-in ticket will automatically be unlocked once your registration and payment are confirmed.
                      </p>
                    </div>
                    {registration.status === 'PENDING' && !isFreeEvent && (
                      <Link to={`/app/payments/new?registrationId=${registration.id}`}>
                        <Button variant="primary" size="sm" className="w-full mt-2">
                          Submit Payment Proof
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions for Coordinator/Admin */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Management Actions</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {registration.status === 'PAYMENT_SUBMITTED' && (
                    <Button
                      variant="primary"
                      icon={<CheckCircle className="w-4 h-4" />}
                      onClick={handleConfirm}
                      className="w-full"
                    >
                      Approve & Confirm Registration
                    </Button>
                  )}

                  {registration.status === 'PAYMENT_VERIFIED' && (
                    <Button
                      variant="primary"
                      icon={<CheckCircle className="w-4 h-4" />}
                      onClick={handleConfirm}
                      className="w-full"
                    >
                      Confirm Registration
                    </Button>
                  )}

                  {!isEventPassed && registration.status === 'CONFIRMED' && (
                    <Button
                      variant="primary"
                      icon={<ClipboardCheck className="w-4 h-4" />}
                      onClick={handleCheckIn}
                      className="w-full"
                    >
                      Check In Participant
                    </Button>
                  )}

                  {!isEventPassed && registration.status === 'CHECKED_IN' && (
                    <Button
                      variant="secondary"
                      icon={<ClipboardCheck className="w-4 h-4" />}
                      onClick={handleCheckOut}
                      className="w-full"
                    >
                      Check Out Participant
                    </Button>
                  )}

                  {isEventPassed && (registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN') && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs text-gray-500">
                      Event Concluded &bull; Check-in and checkout are closed
                    </div>
                  )}

                  {registration.status !== 'CANCELLED' && registration.status !== 'CHECKED_IN' && (
                    <Button
                      variant="error"
                      icon={<XCircle className="w-4 h-4" />}
                      onClick={handleCancel}
                      className="w-full"
                    >
                      Cancel Registration
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-1.5 shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-900">Registration Submitted</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(registration.registrationDate || registration.createdAt)}
                    </p>
                  </div>
                </div>

                {payment && (
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900">Payment Submitted</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(payment.paidAt || payment.paymentDate)}
                      </p>
                    </div>
                  </div>
                )}

                {(registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN') && (
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-1.5 shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900">Registration Confirmed</p>
                      <p className="text-xs text-green-700 font-medium">QR Ticket Generated</p>
                    </div>
                  </div>
                )}

                {registration.status === 'CHECKED_IN' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full mt-1.5 shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900">Checked In at Event</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(registration.checkedInAt)}
                      </p>
                    </div>
                  </div>
                )}

                {registration.status === 'CANCELLED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1.5 shrink-0"></div>
                    <div>
                      <p className="font-medium text-red-900">Registration Cancelled</p>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Receipt Image Full Preview Modal */}
      {previewReceiptModal && payment?.receiptUrl && (
        <Modal
          isOpen={previewReceiptModal}
          onClose={() => setPreviewReceiptModal(false)}
          title="Payment Receipt Proof"
          size="lg"
        >
          <div className="space-y-4">
            <img 
              src={payment.receiptUrl} 
              alt="Payment Receipt Proof" 
              className="w-full max-h-[70vh] object-contain rounded border border-gray-200"
            />
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span><strong>Reference:</strong> {payment.transactionReference || payment.referenceNumber}</span>
              <span><strong>Amount:</strong> {formatCurrency(payment.amount)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
