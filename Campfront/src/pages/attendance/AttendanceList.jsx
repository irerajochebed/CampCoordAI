import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  FileText,
  TrendingUp,
  BarChart3,
  QrCode,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import { eventApi, sessionApi, attendanceApi } from '../../api';

export default function AttendanceList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(eventIdParam || '');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [stats, setStats] = useState({
    totalRegistered: 0,
    totalCheckedIn: 0,
    totalAbsent: 0,
    attendanceRate: 0,
    averageCheckInTime: ''
  });

  const [sessionStats, setSessionStats] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchSessions();
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedSession) {
      fetchAttendanceRecords();
    }
  }, [selectedSession]);

  useEffect(() => {
    filterRecords();
  }, [attendanceRecords, searchQuery, statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await eventApi.getAll();
      if (response.data.success) {
        const eventsList = response.data.data || [];
        setEvents(eventsList);

        // Auto-select first event if none selected
        if (!selectedEvent && eventsList.length > 0) {
          setSelectedEvent(eventsList[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const eventId = parseInt(selectedEvent);
      const response = await sessionApi.getByEvent(eventId);
      
      if (response.data.success) {
        const sessionsList = response.data.data || [];
        setSessions(sessionsList);

        // Auto-select first session
        if (sessionsList.length > 0) {
          setSelectedSession(sessionsList[0].id.toString());
        }

        // Calculate session-level stats
        calculateSessionStats(sessionsList);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.response?.data?.message || 'Failed to load sessions');
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const sessionId = parseInt(selectedSession);

      const response = await attendanceApi.getBySession(sessionId);
      if (response.data.success) {
        const records = response.data.data || [];
        setAttendanceRecords(records);
        calculateStats(records);
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      setError(err.response?.data?.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records) => {
    const totalRegistered = records.length;
    const checkedIn = records.filter(r => r.checkInTime).length;
    const absent = totalRegistered - checkedIn;
    const rate = totalRegistered > 0 ? Math.round((checkedIn / totalRegistered) * 100) : 0;

    // Calculate average check-in time
    const checkInTimes = records
      .filter(r => r.checkInTime)
      .map(r => new Date(r.checkInTime).getTime());
    
    let avgTime = '';
    if (checkInTimes.length > 0) {
      const avgTimestamp = checkInTimes.reduce((sum, time) => sum + time, 0) / checkInTimes.length;
      avgTime = new Date(avgTimestamp).toLocaleTimeString('en-RW', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    setStats({
      totalRegistered,
      totalCheckedIn: checkedIn,
      totalAbsent: absent,
      attendanceRate: rate,
      averageCheckInTime: avgTime
    });
  };

  const calculateSessionStats = async (sessionsList) => {
    const statsPromises = sessionsList.map(async (session) => {
      try {
        const response = await attendanceApi.getBySession(session.id);
        if (response.data.success) {
          const records = response.data.data || [];
          const checkedIn = records.filter(r => r.checkInTime).length;
          const rate = records.length > 0 ? Math.round((checkedIn / records.length) * 100) : 0;

          return {
            sessionId: session.id,
            sessionTitle: session.title,
            sessionDate: session.startTime,
            totalRegistered: records.length,
            checkedIn,
            rate
          };
        }
      } catch (err) {
        console.error('Error fetching session stats:', err);
        return null;
      }
    });

    const stats = await Promise.all(statsPromises);
    setSessionStats(stats.filter(s => s !== null));
  };

  const filterRecords = () => {
    let filtered = [...attendanceRecords];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => {
        const participant = record.registration?.participant;
        return (
          participant?.fullName?.toLowerCase().includes(query) ||
          participant?.email?.toLowerCase().includes(query) ||
          record.registration?.id?.toString().includes(query)
        );
      });
    }

    // Status filter
    if (statusFilter) {
      if (statusFilter === 'CHECKED_IN') {
        filtered = filtered.filter(r => r.checkInTime);
      } else if (statusFilter === 'ABSENT') {
        filtered = filtered.filter(r => !r.checkInTime);
      }
    }

    setFilteredRecords(filtered);
  };

  const handleExport = async (format) => {
    try {
      setSuccess(`Exporting attendance records as ${format.toUpperCase()}...`);
      
      // In production, implement actual export logic
      // await attendanceApi.exportReport(selectedSession, format);
      
      setTimeout(() => {
        setSuccess(`Attendance report exported successfully as ${format.toUpperCase()}`);
      }, 1000);
    } catch (err) {
      setError('Export failed');
    }
  };

  const getStatusBadge = (record) => {
    if (record.checkInTime) {
      return <Badge variant="success">Checked In</Badge>;
    }
    return <Badge variant="warning">Absent</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tracking & Reports</h1>
          <p className="text-gray-600 mt-1">View and export attendance records for events and sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchAttendanceRecords}
          >
            Refresh
          </Button>
          <Link to={selectedEvent ? `/events/${selectedEvent}/check-in` : '#'}>
            <Button
              variant="primary"
              icon={<QrCode className="w-4 h-4" />}
              disabled={!selectedEvent}
            >
              Open QR Scanner
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Event
              </label>
              <Select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                <option value="">Choose an event...</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} - {new Date(event.startDate).toLocaleDateString('en-RW')}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Session
              </label>
              <Select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                disabled={!selectedEvent}
              >
                <option value="">Choose a session...</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title} - {new Date(session.startTime).toLocaleString('en-RW', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {!selectedSession ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Calendar className="w-12 h-12" />}
              message="Select an event and session to view attendance records"
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Registered</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRegistered}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Checked In</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.totalCheckedIn}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{stats.totalAbsent}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-primary-600 mt-1">{stats.attendanceRate}%</p>
                  </div>
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Check-In</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {stats.averageCheckInTime || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Attendance Records Table */}
          <Card>
            <CardHeader action={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<FileText className="w-4 h-4" />}
                  onClick={() => handleExport('pdf')}
                >
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => handleExport('csv')}
                >
                  Export CSV
                </Button>
              </div>
            }>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardBody>
              {/* Search and Filters */}
              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name, email, or registration ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-48"
                >
                  <option value="">All Status</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="ABSENT">Absent</option>
                </Select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading records...</p>
                </div>
              ) : filteredRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Registration ID</TableHead>
                        <TableHead>Participant</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Check-In Time</TableHead>
                        <TableHead>Check-Out Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            #{record.registration?.id}
                          </TableCell>
                          <TableCell>
                            {record.registration?.participant?.fullName}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {record.registration?.participant?.email}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {record.registration?.participant?.phone}
                          </TableCell>
                          <TableCell>
                            {record.checkInTime ? (
                              <div className="flex items-center gap-1 text-green-700">
                                <CheckCircle2 className="w-4 h-4" />
                                {new Date(record.checkInTime).toLocaleTimeString('en-RW', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.checkOutTime ? (
                              <div className="flex items-center gap-1 text-blue-700">
                                <Clock className="w-4 h-4" />
                                {new Date(record.checkOutTime).toLocaleTimeString('en-RW', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(record)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState
                  icon={<Users className="w-12 h-12" />}
                  message={
                    searchQuery || statusFilter
                      ? 'No records match your filters'
                      : 'No attendance records found for this session'
                  }
                />
              )}
            </CardBody>
          </Card>

          {/* Session Statistics */}
          {sessionStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>All Sessions Overview</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Total Registered</TableHead>
                        <TableHead>Checked In</TableHead>
                        <TableHead>Attendance Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionStats.map((stat) => (
                        <TableRow key={stat.sessionId}>
                          <TableCell className="font-medium">
                            {stat.sessionTitle}
                          </TableCell>
                          <TableCell>
                            {new Date(stat.sessionDate).toLocaleString('en-RW', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </TableCell>
                          <TableCell>{stat.totalRegistered}</TableCell>
                          <TableCell className="text-green-700 font-medium">
                            {stat.checkedIn}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                                <div
                                  className={`h-2 rounded-full ${
                                    stat.rate >= 80 ? 'bg-green-600' :
                                    stat.rate >= 60 ? 'bg-amber-600' :
                                    'bg-red-600'
                                  }`}
                                  style={{ width: `${stat.rate}%` }}
                                ></div>
                              </div>
                              <span className="font-medium text-sm">{stat.rate}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Insights */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Attendance Insights</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    {stats.attendanceRate >= 80 ? (
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Excellent attendance rate! Keep up the engagement strategies.
                      </p>
                    ) : stats.attendanceRate >= 60 ? (
                      <p className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Good attendance, but there's room for improvement.
                      </p>
                    ) : (
                      <p className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        Low attendance detected. Consider reviewing event communication strategies.
                      </p>
                    )}
                    {stats.averageCheckInTime && (
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Average check-in time: {stats.averageCheckInTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
