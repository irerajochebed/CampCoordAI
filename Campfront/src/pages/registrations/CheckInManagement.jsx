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
  Filter,
  LayoutGrid,
  List
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
  
  const [viewMode, setViewMode] = useState('grid');
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

  const isEventPassed = event ? (
    event.status === 'COMPLETED' ||
    event.status === 'CANCELLED' ||
    (event.endDate && new Date(event.endDate + (event.endDate.includes('T') ? '' : 'T23:59:59')) < new Date())
  ) : false;

  const handleCheckIn = async (registrationId) => {
    if (isEventPassed) {
      setAlert({
        type: 'error',
        message: 'Check-in is closed: This event has already concluded.'
      });
      return;
    }

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
    
    if (isEventPassed) {
      setAlert({
        type: 'error',
        message: 'Check-in is closed: This event has already concluded.'
      });
      return;
    }

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
    if (isEventPassed) {
      setAlert({
        type: 'error',
        message: 'Check-in is closed: This event has already concluded.'
      });
      return;
    }

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

  const canManage = isUnionAdmin || event?.coordinator?.id === user?.userId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(`/app/events/${eventId}`)}
            className="mb-2"
          >
            Back to Event
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check-In Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{event?.name}</p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            Table
          </button>
        </div>
      </div>

      {isEventPassed && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl p-4 flex items-center gap-3 text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Event Concluded & Check-In Closed</h4>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              This event ended on {event?.endDate ? new Date(event.endDate).toLocaleDateString() : 'its closing date'}. Participant check-in and checkout are strictly closed.
            </p>
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
            {isEventPassed ? (
              <p className="text-sm text-gray-500 italic">
                QR check-in is disabled because this event has concluded.
              </p>
            ) : (
              <>
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
              </>
            )}
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
              {canManage && !isEventPassed && stats.readyToCheckIn > 0 && (
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
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRegistrations.map((registration) => (
            <div
              key={registration.id}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Top Bar: ID Pill & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    #{registration.id}
                  </span>
                  {getStatusBadge(registration.status)}
                </div>

                {/* Participant Header */}
                <div className="flex items-start gap-3.5 pt-1">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {registration.participantFirstName?.[0]}{registration.participantLastName?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug truncate">
                      {registration.participantFirstName} {registration.participantLastName}
                    </h3>
                    <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{registration.participantEmail}</span>
                      </span>
                      {registration.participantPhone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>{registration.participantPhone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Accommodation badge / box */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <Home className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                    {registration.accommodation ? (
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {registration.accommodation.room.accommodation.name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">
                          (Room {registration.accommodation.room.roomNumber})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">No room assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  onClick={() => navigate(`/app/registrations/${registration.id}`)}
                >
                  View Details
                </Button>

                <div className="flex items-center gap-2">
                  {canManage && !isEventPassed && registration.status === 'CONFIRMED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<CheckCircle className="w-4 h-4" />}
                      onClick={() => handleCheckIn(registration.id)}
                    >
                      Check In
                    </Button>
                  )}

                  {isEventPassed && registration.status === 'CONFIRMED' && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">Event Ended</span>
                  )}
                  
                  {registration.status === 'CHECKED_IN' && (
                    <Badge variant="success" className="flex items-center gap-1 py-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Checked In
                    </Badge>
                  )}

                  {registration.status === 'CHECKED_OUT' && (
                    <Badge variant="default" className="flex items-center gap-1 py-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Checked Out
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left">
                      Participant
                    </th>
                    <th className="px-6 py-3 text-left">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left">
                      Accommodation
                    </th>
                    <th className="px-6 py-3 text-left">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-transparent">
                  {filteredRegistrations.map(registration => (
                    <tr key={registration.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
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
                          {canManage && !isEventPassed && registration.status === 'CONFIRMED' && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<CheckCircle className="w-4 h-4" />}
                              onClick={() => handleCheckIn(registration.id)}
                            >
                              Check In
                            </Button>
                          )}

                          {isEventPassed && registration.status === 'CONFIRMED' && (
                            <span className="text-xs text-gray-400 italic">Event Ended</span>
                          )}
                          
                          {registration.status === 'CHECKED_IN' && (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Checked In
                            </Badge>
                          )}

                          {registration.status === 'CHECKED_OUT' && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Checked Out
                            </Badge>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/registrations/${registration.id}`)}
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
