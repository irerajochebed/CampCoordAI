import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registrationApi, eventApi } from '../../api';
import { 
  ArrowLeft,
  Search,
  QrCode,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  Home,
  AlertCircle,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function CheckInManagement() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { user, isAdmin, isCoordinator } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('CONFIRMED');
  const [filterAccommodation, setFilterAccommodation] = useState('');

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchRegistrations();
    }
  }, [eventId, filterStatus]);

  const fetchEvent = async () => {
    try {
      const response = await eventApi.getById(eventId);
      if (response.data.success) {
        const eventData = response.data.data;
        setEvent(eventData);
        
        // Check permission
        const isEventCoordinator = eventData.coordinator?.id === user.userId;
        if (!isUnionAdmin && !isEventCoordinator) {
          setAlert({
            type: 'error',
            message: 'You do not have permission to manage check-ins for this event'
          });
        }
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch event details'
      });
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      let response;
      
      if (filterStatus) {
        response = await registrationApi.getByStatus(eventId, filterStatus);
      } else {
        response = await registrationApi.getByEvent(eventId);
      }

      if (response.data.success) {
        setRegistrations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setAlert({
        type: 'error',
        message: 'Failed to fetch registrations'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (registrationId) => {
    try {
      await registrationApi.checkIn(registrationId);
      setAlert({ 
        type: 'success', 
        message: 'Participant checked in successfully' 
      });
      fetchRegistrations();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to check in participant'
      });
    }
  };

  const handleQRScan = async (e) => {
    e.preventDefault();
    
    if (!qrCodeInput.trim()) {
      setAlert({ type: 'error', message: 'Please enter a QR code' });
      return;
    }

    try {
      // Check in by QR code
      const response = await registrationApi.checkInByQR(qrCodeInput.trim());
      
      if (response.data.success) {
        setAlert({ 
          type: 'success', 
          message: `${response.data.data.participantFirstName} ${response.data.data.participantLastName} checked in successfully` 
        });
        setQrCodeInput('');
        fetchRegistrations();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to check in participant. Invalid QR code or already checked in.'
      });
    }
  };

  const handleBulkCheckIn = async () => {
    const confirmedRegistrations = filteredRegistrations.filter(
      r => r.status === 'CONFIRMED'
    );

    if (confirmedRegistrations.length === 0) {
      setAlert({ type: 'error', message: 'No confirmed registrations to check in' });
      return;
    }

    if (!confirm(`Check in all ${confirmedRegistrations.length} confirmed participants?`)) {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const registration of confirmedRegistrations) {
      try {
        await registrationApi.checkIn(registration.id);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to check in ${registration.id}:`, error);
      }
    }

    setAlert({
      type: errorCount === 0 ? 'success' : 'warning',
      message: `Checked in ${successCount} participants. ${errorCount > 0 ? `${errorCount} failed.` : ''}`
    });

    fetchRegistrations();
  };

  const getStatusBadge = (status) => {
    const variants = {
      CONFIRMED: { variant: 'success', label: 'Ready to Check In' },
      CHECKED_IN: { variant: 'info', label: 'Checked In' },
      PENDING: { variant: 'warning', label: 'Pending' },
      CANCELLED: { variant: 'error', label: 'Cancelled' },
    };
    const config = variants[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Apply filters
  const filteredRegistrations = registrations.filter(reg => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const participantName = `${reg.participantFirstName} ${reg.participantLastName}`.toLowerCase();
      const email = reg.participantEmail.toLowerCase();
      const phone = (reg.participantPhone || '').toLowerCase();
      
      if (!participantName.includes(searchLower) && 
          !email.includes(searchLower) && 
          !phone.includes(searchLower) &&
          !reg.id.toString().includes(searchLower)) {
        return false;
      }
    }

    // Accommodation filter
    if (filterAccommodation && reg.accommodation) {
      if (reg.accommodation.room.accommodation.id.toString() !== filterAccommodation) {
        return false;
      }
    }

    return true;
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'CONFIRMED', label: 'Confirmed (Ready)' },
    { value: 'CHECKED_IN', label: 'Checked In' },
    { value: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
  ];

  // Get unique accommodations for filter
  const uniqueAccommodations = [...new Set(
    registrations
      .filter(r => r.accommodation)
      .map(r => r.accommodation.room.accommodation)
  )];

  const accommodationOptions = [
    { value: '', label: 'All Accommodations' },
    ...uniqueAccommodations.map(acc => ({
      value: acc.id.toString(),
      label: acc.name
    }))
  ];

  // Statistics
  const stats = {
    total: registrations.length,
    checkedIn: registrations.filter(r => r.status === 'CHECKED_IN').length,
    readyToCheckIn: registrations.filter(r => r.status === 'CONFIRMED').length,
    pending: registrations.filter(r => r.status !== 'CONFIRMED' && r.status !== 'CHECKED_IN' && r.status !== 'CANCELLED').length
  };

  if (loading) {
    return <PageSpinner message="Loading check-in data..." />;
  }

  const canManage = isUnionAdmin || event?.coordinator?.id === user.userId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(`/events/${eventId}`)}
            className="mb-4"
          >
            Back to Event
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Check-In Management</h1>
          <p className="text-gray-600 mt-1">{event?.name}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <User className="w-8 h-8 text-gray-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checked In</p>
                <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready to Check In</p>
                <p className="text-2xl font-bold text-primary-600">{stats.readyToCheckIn}</p>
              </div>
              <QrCode className="w-8 h-8 text-primary-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* QR Code Scanner */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Check-In by QR Code</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleQRScan} className="flex gap-3">
              <div className="flex-1 relative">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Scan or enter QR code..."
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                icon={<CheckCircle className="w-4 h-4" />}
              >
                Check In
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Use a QR scanner or type the code manually to quickly check in participants
            </p>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, phone, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={statusOptions}
            />

            <Select
              value={filterAccommodation}
              onChange={(e) => setFilterAccommodation(e.target.value)}
              options={accommodationOptions}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredRegistrations.length} of {registrations.length} participants
            </p>
            <div className="flex gap-2">
              {canManage && stats.readyToCheckIn > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBulkCheckIn}
                >
                  Bulk Check In All Confirmed
                </Button>
              )}
              {(searchQuery || filterAccommodation) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterAccommodation('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Participants List */}
      {filteredRegistrations.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<User className="w-12 h-12" />}
              title="No participants found"
              description="No participants match your filters"
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
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accommodation
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
                  {filteredRegistrations.map(registration => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">#{registration.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                            {registration.participantFirstName[0]}{registration.participantLastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {registration.participantFirstName} {registration.participantLastName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3" />
                            {registration.participantEmail}
                          </div>
                          {registration.participantPhone && (
                            <div className="flex items-center gap-1 text-gray-600 mt-1">
                              <Phone className="w-3 h-3" />
                              {registration.participantPhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {registration.accommodation ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-1 text-gray-900">
                              <Home className="w-3 h-3" />
                              {registration.accommodation.room.accommodation.name}
                            </div>
                            <p className="text-gray-500">
                              Room {registration.accommodation.room.roomNumber}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(registration.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {canManage && registration.status === 'CONFIRMED' && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<CheckCircle className="w-4 h-4" />}
                              onClick={() => handleCheckIn(registration.id)}
                            >
                              Check In
                            </Button>
                          )}
                          
                          {registration.status === 'CHECKED_IN' && (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Checked In
                            </Badge>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/registrations/${registration.id}`)}
                          >
                            View
                          </Button>
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
    </div>
  );
}
