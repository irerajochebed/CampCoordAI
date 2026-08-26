import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventApi, departmentApi } from '../../api';
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
  ClipboardList
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function EventList() {
  const { user, isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [alert, setAlert] = useState(null);

  // Check if user is Event Coordinator
  const isEventCoordinator = user?.position === 'DEPARTMENT_LEADER' || user?.role === 'COORDINATOR';
  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    fetchDepartments();
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchTerm, statusFilter, departmentFilter, events]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll();
      if (response.data.success) {
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
        // Union Admin sees all events
        response = await eventApi.getAll();
      } else if (isEventCoordinator) {
        // Coordinators see events they're managing
        response = await eventApi.getMyEvents();
      } else {
        // Participants see all events (for registration)
        response = await eventApi.getAll();
      }
      
      if (response.data.success) {
        setEvents(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      
      let errorMessage = 'An unexpected error occurred';
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

      if (response.data.success) {
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
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PLANNING', label: 'Planning' },
    { value: 'REGISTRATION_OPEN', label: 'Registration Open' },
    { value: 'REGISTRATION_CLOSED', label: 'Registration Closed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">
            {isUnionAdmin 
              ? 'Manage all camps and conferences' 
              : isEventCoordinator
              ? 'Manage your events and coordinate activities'
              : 'View upcoming camps and conferences'}
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
                placeholder="Search by event name, venue, or ministry / department..."
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
                { value: 'ALL', label: 'All Ministries / Departments' },
                ...departments.map(dept => ({ value: dept.id, label: dept.name }))
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Events ({filteredEvents.length})</CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching events...</span>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-12 h-12" />}
              title="No events found"
              message={
                searchTerm || statusFilter !== 'ALL' || departmentFilter !== 'ALL'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No active events found'
              }
              action={
                (isEventCoordinator || isAdmin) && (
                  <Link to="/events/new">
                    <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                      Create Event
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Ministry / Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{event.name}</p>
                        <p className="text-xs text-gray-500">
                          Coordinator: {event.coordinator?.firstName} {event.coordinator?.lastName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{event.department?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="info">{event.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(event.startDate).toLocaleDateString('en-RW')}</p>
                        <p className="text-gray-500">to {new Date(event.endDate).toLocaleDateString('en-RW')}</p>
                      </div>
                    </TableCell>
                    <TableCell>{event.venue}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{event.registrationCount || 0}</span>
                        {event.capacity && (
                          <span className="text-gray-500">/ {event.capacity}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.budget ? formatCurrency(event.budget) : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(event.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/events/${event.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<Eye className="w-4 h-4" />}
                            title="View details"
                          >
                            View
                          </Button>
                        </Link>
                        
                        {(isUnionAdmin || event.coordinator?.id === user.userId) && (
                          <>
                            {(event.status === 'DRAFT' || event.status === 'PLANNING') && (
                              <Link to={`/events/${event.id}/edit`}>
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

                            <Link to={`/events/${event.id}/sessions`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<ClipboardList className="w-4 h-4" />}
                                title="Manage sessions"
                              >
                                Sessions
                              </Button>
                            </Link>

                            <Link to={`/events/${event.id}/staff`}>
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
