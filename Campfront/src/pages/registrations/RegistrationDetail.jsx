import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registrationApi, qrCodeApi, accommodationApi, attendanceApi } from '../../api';
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
  Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';

export default function RegistrationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin, isCoordinator, isParticipant } = useAuth();
  
  const [registration, setRegistration] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [accommodation, setAccommodation] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    fetchRegistration();
    fetchQRCode();
    fetchAccommodation();
    fetchAttendance();
  }, [id]);

  const fetchRegistration = async () => {
    try {
      setLoading(true);
      const response = await registrationApi.getById(id);
      if (response.data.success) {
        setRegistration(response.data.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch registration details'
      });
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
      console.error('Error fetching QR code:', error);
    }
  };

  const fetchAccommodation = async () => {
    try {
      const response = await accommodationApi.getAssignmentByRegistration(id);
      if (response.data.success) {
        setAccommodation(response.data.data);
      }
    } catch (error) {
      // Accommodation might not be assigned yet - 404 is expected
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
    if (!confirm('Confirm this registration?')) return;

    try {
      await registrationApi.confirm(id);
      setAlert({ type: 'success', message: 'Registration confirmed successfully' });
      fetchRegistration();
      fetchQRCode(); // QR code is generated on confirmation
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
      link.download = `registration-${id}-qrcode.png`;
      link.click();
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: { variant: 'warning', label: 'Pending', icon: Clock },
      PAYMENT_SUBMITTED: { variant: 'info', label: 'Payment Submitted', icon: DollarSign },
      PAYMENT_VERIFIED: { variant: 'success', label: 'Payment Verified', icon: CheckCircle },
      CONFIRMED: { variant: 'success', label: 'Confirmed', icon: CheckCircle },
      CANCELLED: { variant: 'error', label: 'Cancelled', icon: XCircle },
      CHECKED_IN: { variant: 'success', label: 'Checked In', icon: ClipboardCheck },
    };
    const config = variants[status] || { variant: 'default', label: status, icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
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
      VERIFIED: { variant: 'success', label: 'Verified' },
      REJECTED: { variant: 'error', label: 'Rejected' },
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
    return new Date(dateString).toLocaleString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <PageSpinner message="Loading registration details..." />;
  }

  if (!registration) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-800">Registration Not Found</h1>
        <p className="text-gray-600 mt-2">The registration you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/registrations')} className="mt-4">
          Back to Registrations
        </Button>
      </div>
    );
  }

  const canManage = isUnionAdmin || 
    (isCoordinator && registration.event.coordinator?.id === user.userId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/registrations')}
            className="mb-4"
          >
            Back to Registrations
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Registration Details</h1>
          <p className="text-gray-600 mt-1">
            Registration #{registration.id}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(registration.status)}
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
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {registration.participantFirstName} {registration.participantLastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{registration.participantEmail}</p>
                  </div>
                </div>

                {registration.participantPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{registration.participantPhone}</p>
                    </div>
                  </div>
                )}

                {registration.emergencyContactName && (
                  <>
                    <div className="border-t border-gray-200 my-4"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</p>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Name:</span> {registration.emergencyContactName}
                        </p>
                        {registration.emergencyContactPhone && (
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">Phone:</span> {registration.emergencyContactPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {registration.specialRequirements && (
                  <>
                    <div className="border-t border-gray-200 my-4"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Special Requirements</p>
                      <p className="text-sm text-gray-600">{registration.specialRequirements}</p>
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Event Name</p>
                  <p className="text-lg font-semibold text-gray-900">{registration.event.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Dates</p>
                      <p className="font-medium text-gray-900">
                        {new Date(registration.event.startDate).toLocaleDateString()} - {new Date(registration.event.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {registration.event.venue && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Venue</p>
                        <p className="font-medium text-gray-900">{registration.event.venue}</p>
                      </div>
                    </div>
                  )}
                </div>

                {registration.event.registrationFee && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Registration Fee</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(registration.event.registrationFee)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Registration Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(registration.registrationDate)}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardBody>
              {registration.payment ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment Status</span>
                    {getPaymentStatusBadge(registration.payment)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount Paid</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(registration.payment.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment Date</span>
                    <span className="font-medium text-gray-900">
                      {new Date(registration.payment.paymentDate).toLocaleDateString()}
                    </span>
                  </div>

                  {registration.payment.referenceNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reference Number</span>
                      <span className="font-mono text-sm text-gray-900">
                        {registration.payment.referenceNumber}
                      </span>
                    </div>
                  )}

                  {registration.payment.verificationNotes && (
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Verification Notes</p>
                      <p className="text-sm text-gray-600">{registration.payment.verificationNotes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No payment submitted yet</p>
                  {registration.event.registrationFee && (
                    <p className="text-sm text-gray-500 mt-2">
                      Required: {formatCurrency(registration.event.registrationFee)}
                    </p>
                  )}
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
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Building</p>
                      <p className="font-medium text-gray-900">
                        {accommodation.room.accommodation.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Room</p>
                      <p className="font-medium text-gray-900">
                        {accommodation.room.roomNumber} - {accommodation.room.roomType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Check-in Date</span>
                    <span className="font-medium text-gray-900">
                      {new Date(accommodation.checkInDate).toLocaleDateString()}
                    </span>
                  </div>

                  {accommodation.checkOutDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Check-out Date</span>
                      <span className="font-medium text-gray-900">
                        {new Date(accommodation.checkOutDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No accommodation assigned yet</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardBody>
              {attendanceRecords.length > 0 ? (
                <div className="space-y-2">
                  {attendanceRecords.map((record, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{record.session.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(record.session.date).toLocaleDateString()} {record.session.startTime}
                        </p>
                      </div>
                      <Badge variant="success">Present</Badge>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Total Sessions Attended: <span className="font-semibold">{attendanceRecords.length}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No attendance records yet</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* QR Code */}
          {(registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN') && (
            <Card>
              <CardHeader>
                <CardTitle>Check-in QR Code</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="text-center">
                  {qrCodeImage ? (
                    <>
                      <img 
                        src={qrCodeImage} 
                        alt="Registration QR Code" 
                        className="w-full max-w-xs mx-auto border border-gray-200 rounded-lg p-4"
                      />
                      <p className="text-xs text-gray-500 mt-3">
                        Scan this code at the event entrance
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Download className="w-4 h-4" />}
                        onClick={downloadQRCode}
                        className="mt-3"
                      >
                        Download QR Code
                      </Button>
                    </>
                  ) : (
                    <div className="py-8">
                      <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">QR code not available</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Actions */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
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

                  {registration.status === 'CONFIRMED' && (
                    <Button
                      variant="primary"
                      icon={<ClipboardCheck className="w-4 h-4" />}
                      onClick={handleCheckIn}
                      className="w-full"
                    >
                      Check In Participant
                    </Button>
                  )}

                  {registration.status === 'CHECKED_IN' && (
                    <Button
                      variant="secondary"
                      icon={<ClipboardCheck className="w-4 h-4" />}
                      onClick={handleCheckOut}
                      className="w-full"
                    >
                      Check Out Participant
                    </Button>
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
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Registered</p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(registration.registrationDate)}
                    </p>
                  </div>
                </div>

                {registration.payment && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Payment Submitted</p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(registration.payment.paymentDate)}
                      </p>
                    </div>
                  </div>
                )}

                {registration.status === 'PAYMENT_VERIFIED' || 
                 registration.status === 'CONFIRMED' || 
                 registration.status === 'CHECKED_IN' ? (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Payment Verified</p>
                    </div>
                  </div>
                ) : null}

                {(registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN') && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Confirmed</p>
                    </div>
                  </div>
                )}

                {registration.status === 'CHECKED_IN' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Checked In</p>
                    </div>
                  </div>
                )}

                {registration.status === 'CANCELLED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Cancelled</p>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
