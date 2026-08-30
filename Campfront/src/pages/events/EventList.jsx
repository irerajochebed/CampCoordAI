import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventApi, departmentApi, registrationApi } from '../../api';
import { 
  Calendar, 
  Search, 
  Eye, 
  Edit, 
  Users, 
  PlayCircle,
  StopCircle,
  CheckCircle2,
  XCircle,
  UserPlus,
  ClipboardList,
  Plus,
  DollarSign,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import { useTranslation } from '../../contexts/LanguageContext';

export default function EventList() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [alert, setAlert] = useState(null);

  // Check user role
  const isParticipant = user?.role === 'PARTICIPANT';
  const isEventCoordinator = user?.position === 'DEPARTMENT_LEADER' || user?.role === 'COORDINATOR';
  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    fetchDepartments();
    fetchEvents();
    fetchMyRegistrations();
  }, []);

  const fetchMyRegistrations = async () => {
    try {
      const response = await registrationApi.getMyRegistrations();
      const regs = response.data?.data || response.data || [];
      if (Array.isArray(regs)) {
        setMyRegistrations(regs);
      }
    } catch (error) {
      console.error('Error fetching my registrations:', error);
    }
  };

  useEffect(() => {
    filterEvents();
  }, [searchTerm, statusFilter, departmentFilter, events]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll();
      if (response.data?.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setAlert(null);
      let response;
      
      if (isUnionAdmin) {
        response = await eventApi.getAll();
      } else if (isEventCoordinator) {
        try {
          response = await eventApi.getMyEvents();
          const list = response.data?.data || response.data || [];
          if (Array.isArray(list) && list.length === 0) {
            response = await eventApi.getAll();
          }
        } catch (e) {
          response = await eventApi.getAll();
        }
      } else {
        response = await eventApi.getAll();
      }
      
      if (response.data?.success) {
        setEvents(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      
      let errorMessage = 'An unexpected error occurred while fetching events';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Redirecting to login...';
        } else {
          errorMessage = error.response.data?.message || 'Failed to fetch events';
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      }
      
      setAlert({ type: 'error', message: errorMessage });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Filter by department
    if (departmentFilter !== 'ALL') {
      filtered = filtered.filter((e) => e.department?.id === parseInt(departmentFilter));
    }

    setFilteredEvents(filtered);
  };

  const handleStatusChange = async (eventId, action) => {
    const confirmMessages = {
      'openRegistration': 'Open registration for this event?',
      'closeRegistration': 'Close registration for this event?',
      'start': 'Mark this event as started?',
      'complete': 'Mark this event as completed?',
      'cancel': 'Cancel this event? This action cannot be undone.'
    };

    if (!confirm(confirmMessages[action])) return;

    try {
      let response;
      switch(action) {
        case 'openRegistration':
          response = await eventApi.openRegistration(eventId);
          break;
        case 'closeRegistration':
          response = await eventApi.closeRegistration(eventId);
          break;
        case 'start':
          response = await eventApi.start(eventId);
          break;
        case 'complete':
          response = await eventApi.complete(eventId);
          break;
        case 'cancel':
          response = await eventApi.cancel(eventId);
          break;
      }

      if (response.data?.success) {
        setAlert({ type: 'success', message: 'Event status updated successfully' });
        fetchEvents();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update event status'
      });
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <Badge variant="default">UNKNOWN</Badge>;
    const variants = {
      DRAFT: 'default',
      PLANNING: 'info',
      REGISTRATION_OPEN: 'success',
      REGISTRATION_CLOSED: 'warning',
      IN_PROGRESS: 'info',
      COMPLETED: 'success',
      CANCELLED: 'danger',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    if (amount == null) return 'N/A';
    try {
      return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (e) {
      return `${amount} RWF`;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  const statusOptions = [
    { value: 'ALL', label: t('proposals.allStatuses', 'All Statuses') },
    { value: 'DRAFT', label: t('status.DRAFT', 'Draft') },
    { value: 'PLANNING', label: t('status.UNDER_REVIEW', 'Planning') },
    { value: 'REGISTRATION_OPEN', label: t('status.REGISTRATION_OPEN', 'Registration Open') },
    { value: 'REGISTRATION_CLOSED', label: t('status.REGISTRATION_CLOSED', 'Registration Closed') },
    { value: 'IN_PROGRESS', label: t('status.IN_PROGRESS', 'In Progress') },
    { value: 'COMPLETED', label: t('status.COMPLETED', 'Completed') },
    { value: 'CANCELLED', label: t('status.CANCELLED', 'Cancelled') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('events.title', 'Events & Camps')}</h1>
          <p className="text-gray-600 mt-1">
            {t('events.subtitle', 'Manage all camps, retreats, and conferences across the union')}
          </p>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder={t('proposals.searchPlaceholder', 'Search by event name, venue, or ministry...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
            />
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              options={[
                { value: 'ALL', label: t('events.allMinistries', 'All Ministries / Departments') },
                ...departments.map(dept => ({ value: dept.id, label: t(`ministries.${dept.type}`, dept.name) }))
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events.title', 'Events')} ({filteredEvents.length})</CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>{t('common.loading', 'Fetching events...')}</span>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-12 h-12 text-gray-400" />}
              title={t('events.noEventsFound', 'No events found')}
              message={t('events.noEventsFound', 'No active events found in the system.')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('proposals.eventName', 'Event Name')}</TableHead>
                  <TableHead>{t('proposals.hostingMinistry', 'Ministry / Department')}</TableHead>
                  <TableHead>{t('proposals.eventType', 'Type')}</TableHead>
                  <TableHead>{t('proposals.startDate', 'Dates')}</TableHead>
                  <TableHead>{t('proposals.venue', 'Venue')}</TableHead>
                  <TableHead>{t('registrations.title', 'Registrations')}</TableHead>
                  <TableHead>{isParticipant ? 'Amount to Pay' : t('proposals.estimatedBudget', 'Budget')}</TableHead>
                  <TableHead>{t('common.status', 'Status')}</TableHead>
                  <TableHead>{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const coordinatorName = event.coordinator 
                    ? `${event.coordinator.firstName || ''} ${event.coordinator.lastName || ''}`.trim()
                    : 'System User';

                  const canUserEdit = !isParticipant && (isUnionAdmin || (user && (event.coordinator?.id === user.id || event.coordinator?.id === user.userId)));
                  
                  const isRegistered = myRegistrations.some(
                    r => (r.event?.id === event.id || r.eventId === event.id) && r.status !== 'CANCELLED'
                  );
                  const feeAmount = event.registrationFee ?? event.amountPerPerson ?? 0;

                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">{event.name || t('events.unnamedEvent', 'Unnamed Event')}</p>
                          <p className="text-xs text-gray-500">{t('events.coordinator', 'Coordinator')}: {coordinatorName}</p>
                        </div>
                      </TableCell>
                      <TableCell>{t(`ministries.${event.department?.type}`, event.department?.name || 'N/A')}</TableCell>
                      <TableCell>
                        <Badge variant="info">{event.type || 'EVENT'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(event.startDate)}</p>
                          <p className="text-gray-500 text-xs">to {formatDate(event.endDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{event.venue || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{event.registrationCount || 0}</span>
                          {event.maxParticipants && (
                            <span className="text-gray-500 text-xs">/ {event.maxParticipants}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {isParticipant ? formatCurrency(feeAmount) : formatCurrency(event.budget)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          {isRegistered ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="success" className="py-1 px-2">
                                <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                                Registered
                              </Badge>
                              <Link to={`/app/events/${event.id}`}>
                                <Button variant="outline" size="sm">
                                  {t('common.viewDetails', 'View Event')}
                                </Button>
                              </Link>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {event.status === 'REGISTRATION_OPEN' && (
                                <Link to={`/app/registrations/new?eventId=${event.id}`}>
                                  <Button variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />}>
                                    {isParticipant ? 'Register Now' : 'Register Participant'}
                                  </Button>
                                </Link>
                              )}
                              <Link to={`/app/events/${event.id}`}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  icon={<Eye className="w-4 h-4" />}
                                >
                                  {t('common.view', 'View')}
                                </Button>
                              </Link>
                            </div>
                          )}
                          
                          {canUserEdit && (
                            <>
                              {(event.status === 'DRAFT' || event.status === 'PLANNING') && (
                                <Link to={`/app/events/${event.id}/edit`}>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    icon={<Edit className="w-4 h-4" />}
                                    title="Edit event"
                                  >
                                    Edit
                                  </Button>
                                </Link>
                              )}

                              {event.status === 'PLANNING' && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  icon={<PlayCircle className="w-4 h-4" />}
                                  onClick={() => handleStatusChange(event.id, 'openRegistration')}
                                  title="Open registration"
                                >
                                  Open Reg.
                                </Button>
                              )}

                              {event.status === 'REGISTRATION_OPEN' && (
                                <>
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    icon={<StopCircle className="w-4 h-4" />}
                                    onClick={() => handleStatusChange(event.id, 'closeRegistration')}
                                    title="Close registration"
                                  >
                                    Close Reg.
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    icon={<PlayCircle className="w-4 h-4" />}
                                    onClick={() => handleStatusChange(event.id, 'start')}
                                    title="Start event"
                                  >
                                    Start
                                  </Button>
                                </>
                              )}

                              {(event.status === 'REGISTRATION_CLOSED' || event.status === 'IN_PROGRESS') && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={<CheckCircle2 className="w-4 h-4" />}
                                  onClick={() => handleStatusChange(event.id, event.status === 'REGISTRATION_CLOSED' ? 'start' : 'complete')}
                                  title={event.status === 'REGISTRATION_CLOSED' ? 'Start event' : 'Complete event'}
                                >
                                  {event.status === 'REGISTRATION_CLOSED' ? 'Start' : 'Complete'}
                                </Button>
                              )}

                              <Link to={`/app/events/${event.id}/sessions`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<ClipboardList className="w-4 h-4" />}
                                  title="Manage sessions"
                                >
                                  Sessions
                                </Button>
                              </Link>

                              <Link to={`/app/events/${event.id}/staff`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<UserPlus className="w-4 h-4" />}
                                  title="Assign staff"
                                >
                                  Staff
                                </Button>
                              </Link>

                              {(event.status === 'DRAFT' || event.status === 'PLANNING') && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={<XCircle className="w-4 h-4" />}
                                  onClick={() => handleStatusChange(event.id, 'cancel')}
                                  title="Cancel event"
                                >
                                  Cancel
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
