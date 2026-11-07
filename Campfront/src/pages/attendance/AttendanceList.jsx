import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
  RefreshCw,
  Printer,
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  UserX,
  Camera,
  ExternalLink,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { useTranslation } from '../../contexts/LanguageContext';
import { eventApi, sessionApi, attendanceApi, registrationApi, getCachedData } from '../../api';

export default function AttendanceList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');
  const sessionIdParam = searchParams.get('sessionId');

  // Instant In-Memory Cache Initialization
  const cachedEvents = useMemo(() => {
    const cached = getCachedData('/events');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const [rosterViewMode, setRosterViewMode] = useState('grid');
  const [sessionsViewMode, setSessionsViewMode] = useState('grid');
  const [events, setEvents] = useState(cachedEvents);
  const [selectedEvent, setSelectedEvent] = useState(eventIdParam || (cachedEvents.length > 0 ? cachedEvents[0].id : ''));
  const [loading, setLoading] = useState(cachedEvents.length === 0);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(sessionIdParam || '');
  
  const [registrations, setRegistrations] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [roster, setRoster] = useState([]);
  const [filteredRoster, setFilteredRoster] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quickQrInput, setQuickQrInput] = useState('');
  const [quickScanning, setQuickScanning] = useState(false);

  // Quick QR Scanner Modal State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [stats, setStats] = useState({
    totalRegistered: 0,
    totalCheckedIn: 0,
    totalAbsent: 0,
    attendanceRate: 0,
    qrCheckIns: 0,
    manualCheckIns: 0,
    averageCheckInTime: ''
  });

  const [sessionStats, setSessionStats] = useState([]);

  // Load events on mount
  useEffect(() => {
    fetchEvents(cachedEvents.length > 0);
  }, []);

  // When selected event changes, load its sessions and registrations
  useEffect(() => {
    if (selectedEvent) {
      fetchSessionsAndRegistrations(selectedEvent);
    } else {
      setSessions([]);
      setSelectedSession('');
      setRegistrations([]);
      setRoster([]);
    }
  }, [selectedEvent]);

  // When selected session changes, load attendance records
  useEffect(() => {
    if (selectedSession && selectedEvent) {
      fetchAttendanceRecords(selectedSession);
    }
  }, [selectedSession, registrations]);

  // Filter roster whenever records, search, or status filter changes
  useEffect(() => {
    filterRoster();
  }, [roster, searchQuery, statusFilter]);

  const fetchEvents = async (isBackground = false) => {
    try {
      if (!isBackground && events.length === 0) setLoading(true);
      setError(null);

      const response = await eventApi.getAll();
      const eventsList = response.data?.data || response.data || [];
      const validEvents = Array.isArray(eventsList) ? eventsList : [];
      setEvents(validEvents);

      if (eventIdParam && validEvents.some(e => e.id.toString() === eventIdParam)) {
        setSelectedEvent(eventIdParam);
      } else if (validEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(validEvents[0].id.toString());
      }
    } catch (err) {
      console.error('Error fetching events in attendance list:', err);
      if (events.length === 0) {
        setError('Failed to load events. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionsAndRegistrations = async (eventId) => {
    try {
      setSessionLoading(true);
      setError(null);

      // Fetch sessions for this event
      const [sessionsRes, regRes] = await Promise.allSettled([
        sessionApi.getByEvent(eventId),
        registrationApi.getByEvent(eventId)
      ]);

      let sessionsList = [];
      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.data?.success) {
        sessionsList = sessionsRes.value.data.data || [];
        setSessions(sessionsList);

        // Auto-select session: if URL has sessionId or select first
        if (sessionIdParam && sessionsList.some(s => s.id.toString() === sessionIdParam)) {
          setSelectedSession(sessionIdParam);
        } else if (sessionsList.length > 0) {
          setSelectedSession(sessionsList[0].id.toString());
        } else {
          setSelectedSession('');
        }

        // Calculate session-level stats
        calculateSessionOverview(sessionsList, eventId);
      }

      let regsList = [];
      if (regRes.status === 'fulfilled' && regRes.value.data?.success) {
        regsList = (regRes.value.data.data || []).filter(r => 
          r.status === 'CONFIRMED' || r.status === 'CHECKED_IN' || r.status === 'PAYMENT_VERIFIED'
        );
        setRegistrations(regsList);
      }
    } catch (err) {
      console.error('Error fetching event sessions and registrations:', err);
      setError('Failed to load sessions or registrations for this event');
    } finally {
      setSessionLoading(false);
    }
  };

  const fetchAttendanceRecords = async (sessionId) => {
    try {
      const response = await attendanceApi.getBySession(sessionId);
      let records = [];
      if (response.data?.success) {
        records = response.data.data || [];
        setAttendanceRecords(records);
      }

      // Build unified roster for every registered participant
      buildRoster(registrations, records);
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      // Still build roster with 0 check-ins
      buildRoster(registrations, []);
    }
  };

  const buildRoster = (regList, attRecords) => {
    const attendanceMap = new Map();
    attRecords.forEach(record => {
      const regId = record.registration?.id || record.registrationId;
      if (regId) {
        attendanceMap.set(regId.toString(), record);
      }
    });

    const unifiedRoster = regList.map(reg => {
      const att = attendanceMap.get(reg.id.toString());
      const participantName = reg.participantFirstName && reg.participantLastName
        ? `${reg.participantFirstName} ${reg.participantLastName}`
        : (reg.participantName || reg.participant?.fullName || `Participant #${reg.id}`);

      return {
        registrationId: reg.id,
        registrationNumber: reg.registrationNumber || `#${reg.id}`,
        qrCode: reg.qrCode || reg.registrationNumber,
        participantName,
        email: reg.participantEmail || reg.participant?.email || '',
        phone: reg.participantPhone || reg.participant?.phone || '',
        church: reg.churchName || reg.participant?.organizationUnit?.name || 'N/A',
        isAttended: !!att,
        attendanceId: att?.id || null,
        checkInTime: att?.checkInTime || null,
        checkInMethod: att?.checkInMethod || (att ? 'MANUAL' : null),
        checkedBy: att?.checkedInBy?.fullName || null
      };
    });

    setRoster(unifiedRoster);
    calculateStats(unifiedRoster);
  };

  const calculateStats = (rosterList) => {
    const totalRegistered = rosterList.length;
    const checkedIn = rosterList.filter(r => r.isAttended).length;
    const absent = totalRegistered - checkedIn;
    const rate = totalRegistered > 0 ? Math.round((checkedIn / totalRegistered) * 100) : 0;
    const qrCount = rosterList.filter(r => r.isAttended && r.checkInMethod === 'QR_SCAN').length;
    const manualCount = checkedIn - qrCount;

    // Calculate average check-in time
    const checkInTimes = rosterList
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
      qrCheckIns: qrCount,
      manualCheckIns: manualCount,
      averageCheckInTime: avgTime
    });
  };

  const calculateSessionOverview = async (sessionsList, eventId) => {
    const statsPromises = sessionsList.map(async (session) => {
      try {
        const response = await attendanceApi.getBySession(session.id);
        const records = response.data?.data || [];
        return {
          sessionId: session.id,
          sessionTitle: session.title,
          sessionType: session.type,
          sessionTime: session.startTime,
          venue: session.venue,
          checkedIn: records.length
        };
      } catch (err) {
        return {
          sessionId: session.id,
          sessionTitle: session.title,
          sessionType: session.type,
          sessionTime: session.startTime,
          venue: session.venue,
          checkedIn: 0
        };
      }
    });

    const results = await Promise.all(statsPromises);
    setSessionStats(results);
  };

  const filterRoster = () => {
    let filtered = [...roster];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.participantName.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.phone.toLowerCase().includes(query) ||
        item.registrationNumber.toLowerCase().includes(query) ||
        item.church.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      if (statusFilter === 'CHECKED_IN') {
        filtered = filtered.filter(r => r.isAttended);
      } else if (statusFilter === 'ABSENT') {
        filtered = filtered.filter(r => !r.isAttended);
      }
    }

    setFilteredRoster(filtered);
  };

  // 1-Click Mark Present
  const handleMarkPresent = async (item) => {
    if (!selectedSession) {
      setError('Please select a session first');
      return;
    }

    setActionLoading(item.registrationId);
    try {
      await attendanceApi.recordManual(selectedSession, item.registrationId);
      setSuccess(`✓ Checked in ${item.participantName}`);
      setTimeout(() => setSuccess(null), 3000);
      fetchAttendanceRecords(selectedSession);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record attendance');
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  // 1-Click Undo / Mark Absent
  const handleUndoAttendance = async (item) => {
    if (!item.attendanceId) return;

    setActionLoading(item.registrationId);
    try {
      await attendanceApi.delete(item.attendanceId);
      setSuccess(`Undone attendance for ${item.participantName}`);
      setTimeout(() => setSuccess(null), 3000);
      fetchAttendanceRecords(selectedSession);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to undo attendance');
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  // Instant Quick QR Check-In Input
  const handleQuickQrSubmit = async (e) => {
    e.preventDefault();
    if (!quickQrInput.trim() || !selectedSession) return;

    setQuickScanning(true);
    const code = quickQrInput.trim();
    try {
      await attendanceApi.recordByQR(selectedSession, code);
      setSuccess(`✓ Successfully recorded QR attendance for ticket ${code}`);
      setQuickQrInput('');
      fetchAttendanceRecords(selectedSession);
    } catch (err) {
      // Fallback: check if code matches registration ID or registrationNumber
      const match = roster.find(r => 
        r.registrationNumber.toLowerCase() === code.toLowerCase() ||
        r.qrCode?.toLowerCase() === code.toLowerCase() ||
        r.registrationId.toString() === code
      );

      if (match) {
        try {
          await attendanceApi.recordManual(selectedSession, match.registrationId);
          setSuccess(`✓ Checked in ${match.participantName}`);
          setQuickQrInput('');
          fetchAttendanceRecords(selectedSession);
        } catch (e2) {
          setError(e2.response?.data?.message || 'Participant already checked in or invalid ticket');
        }
      } else {
        setError(err.response?.data?.message || `No participant found matching ticket "${code}"`);
      }
    } finally {
      setQuickScanning(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 4000);
    }
  };

  // Camera QR Scanner Modal Controls
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn('Camera access not granted or not supported:', e);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleOpenScanner = () => {
    setShowScannerModal(true);
    startCamera();
  };

  const handleCloseScanner = () => {
    stopCamera();
    setShowScannerModal(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (roster.length === 0) {
      setError('No records to export');
      return;
    }

    const currentEventObj = events.find(e => e.id.toString() === selectedEvent);
    const currentSessionObj = sessions.find(s => s.id.toString() === selectedSession);

    const headers = ['Registration No', 'Participant Name', 'Email', 'Phone', 'Church / Org', 'Session', 'Status', 'Check-In Time', 'Method'];
    const rows = roster.map(r => [
      r.registrationNumber,
      `"${r.participantName}"`,
      r.email,
      r.phone,
      `"${r.church}"`,
      `"${currentSessionObj?.title || 'Session'}"`,
      r.isAttended ? 'PRESENT' : 'ABSENT',
      r.checkInTime ? new Date(r.checkInTime).toLocaleString() : '-',
      r.checkInMethod || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${currentEventObj?.name?.replace(/\s+/g, '_')}_${currentSessionObj?.title?.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess('CSV report downloaded successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Print Summary
  const handlePrint = () => {
    window.print();
  };

  // Format dropdown options
  const eventOptions = events.map(ev => ({
    value: ev.id.toString(),
    label: `${ev.name} (${new Date(ev.startDate).toLocaleDateString('en-RW')})`
  }));

  const sessionOptions = sessions.map(s => ({
    value: s.id.toString(),
    label: `${s.title} (${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${s.venue ? ` • ${s.venue}` : ''})`
  }));

  const statusOptions = [
    { value: '', label: t('common.all', 'All Participants') },
    { value: 'CHECKED_IN', label: t('status.CHECKED_IN', 'Checked In (Present)') },
    { value: 'ABSENT', label: t('status.PENDING', 'Absent (Pending Check-In)') }
  ];

  const currentEvent = events.find(e => e.id.toString() === selectedEvent);
  const currentSession = sessions.find(s => s.id.toString() === selectedSession);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-primary-600" />
            {t('attendance.title', 'Attendance Tracking & Reports')}
          </h1>
          <p className="text-gray-600 text-sm mt-0.5">
            {t('attendance.subtitle', 'Track live participant check-ins, scan QR badges, and generate official reports.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<RefreshCw className={`w-4 h-4 ${sessionLoading ? 'animate-spin' : ''}`} />}
            onClick={() => {
              if (selectedSession) fetchAttendanceRecords(selectedSession);
              else if (selectedEvent) fetchSessionsAndRegistrations(selectedEvent);
              else fetchEvents();
            }}
          >
            {t('common.refresh', 'Refresh')}
          </Button>

          <Button
            variant="primary"
            icon={<QrCode className="w-4 h-4" />}
            onClick={handleOpenScanner}
            disabled={!selectedSession}
          >
            {t('attendance.scanQrCode', 'Quick QR Scanner')}
          </Button>
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

      {/* Event & Session Selector Card */}
      <Card className="shadow-sm border-primary-100 bg-gradient-to-br from-white to-gray-50/50">
        <CardBody className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Select
                label="Select Event / Camp"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                options={eventOptions}
                placeholder="Choose an event..."
                disabled={loading}
              />
            </div>

            <div>
              <Select
                label="Select Session / Program"
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                options={sessionOptions}
                placeholder={sessions.length === 0 ? "No sessions created for this event" : "Choose a session..."}
                disabled={!selectedEvent || sessionLoading || sessions.length === 0}
              />
            </div>
          </div>

          {/* Quick info bar below selectors */}
          {selectedEvent && currentEvent && (
            <div className="mt-4 pt-4 border-t border-gray-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-gray-900">
                  <Calendar className="w-3.5 h-3.5 text-primary-600" />
                  {new Date(currentEvent.startDate).toLocaleDateString()} &rarr; {new Date(currentEvent.endDate).toLocaleDateString()}
                </span>
                {currentEvent.venue && (
                  <span>Venue: <strong>{currentEvent.venue}</strong></span>
                )}
                <span>Total Registrations: <strong className="text-primary-700">{registrations.length} confirmed</strong></span>
              </div>

              {sessions.length === 0 && (
                <Link to={`/app/events/${selectedEvent}/sessions`} className="text-primary-600 font-semibold hover:underline flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  Create Sessions for this Event &rarr;
                </Link>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* No Event or Session Empty States */}
      {!selectedEvent ? (
        <Card>
          <CardBody className="py-12">
            <EmptyState
              icon={<Calendar className="w-12 h-12 text-primary-500" />}
              title="Select an Event"
              description="Please select an event from the dropdown above to start tracking attendance."
            />
          </CardBody>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center space-y-4">
            <Clock className="w-12 h-12 text-amber-500 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">No Sessions Found</h3>
              <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
                This event doesn't have any scheduled program sessions yet. Create sessions first to track participant attendance.
              </p>
            </div>
            <Link to={`/app/events/${selectedEvent}/sessions`}>
              <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                Create Sessions Now
              </Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Key Metrics Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Registered */}
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Registered</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRegistered}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Confirmed attendees</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Present / Checked In */}
            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Checked In (Present)</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.totalCheckedIn}</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {stats.qrCheckIns} QR • {stats.manualCheckIns} Manual
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Absent */}
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending / Absent</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{stats.totalAbsent}</p>
                    <p className="text-xs text-amber-600 mt-0.5">Awaiting check-in</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <UserX className="w-5 h-5" />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Attendance Rate */}
            <Card className="border-l-4 border-l-primary-500 shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">Turnout Rate</p>
                    <p className="text-2xl font-bold text-primary-700 mt-1">{stats.attendanceRate}%</p>
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1.5">
                      <div 
                        className="bg-primary-600 h-1.5 rounded-full" 
                        style={{ width: `${stats.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Quick Scanner / Instant Search Bar */}
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <div className="flex flex-col lg:flex-row items-center gap-3">
                {/* Instant QR Check-In Form */}
                <form onSubmit={handleQuickQrSubmit} className="flex items-center gap-2 w-full lg:w-1/2">
                  <div className="relative flex-1">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Scan or type QR Ticket / Reg No & press Enter..."
                      value={quickQrInput}
                      onChange={(e) => setQuickQrInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-primary-50/20"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="sm"
                    loading={quickScanning}
                    disabled={!quickQrInput.trim()}
                  >
                    Check In
                  </Button>
                </form>

                <div className="hidden lg:block w-px h-8 bg-gray-200"></div>

                {/* Filter / Search within roster */}
                <div className="flex items-center gap-3 w-full lg:w-1/2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search participant name, email, phone, church..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="w-44">
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      options={statusOptions}
                      placeholder="Filter Status"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Participant Attendance Roster */}
          <Card className="shadow-sm">
            <CardHeader 
              action={
                <div className="flex items-center gap-2">
                  {/* View Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setRosterViewMode('grid')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        rosterViewMode === 'grid'
                          ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setRosterViewMode('table')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        rosterViewMode === 'table'
                          ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      Table
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={handleExportCSV}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Printer className="w-3.5 h-3.5" />}
                    onClick={handlePrint}
                  >
                    Print Report
                  </Button>
                </div>
              }
            >
              <CardTitle className="flex items-center justify-between w-full">
                <span>
                  Participant Roster &mdash; <strong className="text-primary-800 dark:text-primary-400">{currentSession?.title || 'Session'}</strong>
                </span>
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  Showing {filteredRoster.length} of {roster.length} participants
                </span>
              </CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {sessionLoading ? (
                <div className="py-12 text-center">
                  <PageSpinner message="Loading attendance records..." />
                </div>
              ) : filteredRoster.length === 0 ? (
                <div className="py-10">
                  <EmptyState
                    icon={<Users className="w-10 h-10 text-gray-400" />}
                    title="No Participants Found"
                    description={
                      searchQuery || statusFilter
                        ? 'No participants match your current search criteria.'
                        : 'No confirmed registrations found for this event.'
                    }
                  />
                </div>
              ) : rosterViewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-slate-50/60 dark:bg-slate-900/40">
                  {filteredRoster.map((item) => (
                    <div
                      key={item.registrationId}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="space-y-3.5">
                        {/* Top: Ticket Pill & Attendance Status */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {item.registrationNumber}
                          </span>
                          {item.isAttended ? (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Present
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Absent
                            </Badge>
                          )}
                        </div>

                        {/* Participant Name & Contact */}
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                            {item.participantName}
                          </h4>
                          <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {item.email && (
                              <span className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                <span className="truncate">{item.email}</span>
                              </span>
                            )}
                            {item.phone && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                <span>{item.phone}</span>
                              </span>
                            )}
                            {item.church && (
                              <span className="flex items-center gap-1.5 mt-0.5 font-medium text-slate-600 dark:text-slate-300">
                                <Building className="w-3.5 h-3.5 shrink-0 text-primary-500" />
                                <span className="truncate">{item.church}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Check-In Time & Method if Present */}
                        {item.isAttended && item.checkInTime && (
                          <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 text-xs">
                            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                              <span className="font-semibold">
                                {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[11px] opacity-80">
                                {item.checkInMethod === 'QR_SCAN' ? 'QR Code' : 'Staff Check-In'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action */}
                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
                        {item.isAttended ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800/60"
                            onClick={() => handleUndoAttendance(item)}
                            loading={actionLoading === item.registrationId}
                          >
                            Undo Check-In
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs"
                            icon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => handleMarkPresent(item)}
                            loading={actionLoading === item.registrationId}
                          >
                            Mark Present
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">{t('registrations.participant', 'Participant')}</th>
                        <th className="px-4 py-3">{t('registrations.qrCode', 'Ticket / Reg #')}</th>
                        <th className="px-4 py-3">{t('users.unitHeader', 'Church / Unit')}</th>
                        <th className="px-4 py-3">{t('registrations.checkInStatus', 'Attendance Status')}</th>
                        <th className="px-4 py-3">{t('attendance.recentCheckIns', 'Check-In Time & Method')}</th>
                        <th className="px-5 py-3 text-right">{t('common.actions', 'Quick Action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white text-sm">
                      {filteredRoster.map((item) => (
                        <tr key={item.registrationId} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-semibold text-gray-900">{item.participantName}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                {item.email && <span>{item.email}</span>}
                                {item.phone && <span>• {item.phone}</span>}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-800 border border-gray-200">
                              {item.registrationNumber}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-700">
                            {item.church}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {item.isAttended ? (
                              <Badge variant="success" className="flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Present
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="flex items-center gap-1 w-fit">
                                <Clock className="w-3.5 h-3.5" />
                                Absent
                              </Badge>
                            )}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600">
                            {item.isAttended && item.checkInTime ? (
                              <div>
                                <span className="font-medium text-gray-900">
                                  {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="ml-1.5 text-xs text-gray-500">
                                  ({item.checkInMethod === 'QR_SCAN' ? 'QR Code' : 'Staff Check-In'})
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">&mdash;</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap text-right">
                            {item.isAttended ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-red-600 hover:bg-red-50 border-red-200"
                                onClick={() => handleUndoAttendance(item)}
                                loading={actionLoading === item.registrationId}
                              >
                                Undo Check-In
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                icon={<Check className="w-3.5 h-3.5" />}
                                onClick={() => handleMarkPresent(item)}
                                loading={actionLoading === item.registrationId}
                              >
                                Mark Present
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* All Sessions Overview Matrix */}
          {sessionStats.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader
                action={
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setSessionsViewMode('grid')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        sessionsViewMode === 'grid'
                          ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionsViewMode('table')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        sessionsViewMode === 'table'
                          ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      Table
                    </button>
                  </div>
                }
              >
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                  Event Sessions Attendance Overview
                </CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                {sessionsViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-slate-50/60 dark:bg-slate-900/40">
                    {sessionStats.map((s) => {
                      const isCurrent = s.sessionId.toString() === selectedSession;
                      const sessionRate = registrations.length > 0 
                        ? Math.round((s.checkedIn / registrations.length) * 100) 
                        : 0;

                      return (
                        <div
                          key={s.sessionId}
                          className={`group rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                            isCurrent
                              ? 'bg-primary-50/40 dark:bg-primary-950/20 border-primary-300 dark:border-primary-700/80 ring-1 ring-primary-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {s.sessionType || 'General'}
                              </span>
                              {isCurrent && (
                                <Badge variant="primary" className="text-xs">Active Session</Badge>
                              )}
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                                {s.sessionTitle}
                              </h4>
                              <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                                <p className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{s.sessionTime ? new Date(s.sessionTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'TBD'}</span>
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{s.venue || 'Main Hall'}</span>
                                </p>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="pt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {s.checkedIn} / {registrations.length} Checked In
                                </span>
                                <span className="font-bold text-primary-600 dark:text-primary-400">{sessionRate}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, sessionRate)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
                            {isCurrent ? (
                              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">Currently Selected</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => setSelectedSession(s.sessionId.toString())}
                              >
                                Select & View
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                          <th className="px-5 py-3">Session Title</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Date & Time</th>
                          <th className="px-4 py-3">Venue</th>
                          <th className="px-4 py-3">Attendees</th>
                          <th className="px-5 py-3 text-right">Switch to Session</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {sessionStats.map((s) => {
                          const isCurrent = s.sessionId.toString() === selectedSession;
                          const sessionRate = registrations.length > 0 
                            ? Math.round((s.checkedIn / registrations.length) * 100) 
                            : 0;

                          return (
                            <tr key={s.sessionId} className={isCurrent ? 'bg-primary-50/40 font-semibold' : 'hover:bg-gray-50'}>
                              <td className="px-5 py-3">
                                <span className="text-gray-900">{s.sessionTitle}</span>
                                {isCurrent && <Badge variant="primary" className="ml-2 text-xs">Active</Badge>}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">{s.sessionType || 'General'}</td>
                              <td className="px-4 py-3 text-xs text-gray-600">
                                {s.sessionTime ? new Date(s.sessionTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'TBD'}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">{s.venue || 'Main Hall'}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900">{s.checkedIn}</span>
                                  <span className="text-xs text-gray-500">/ {registrations.length}</span>
                                  <span className="text-xs text-primary-700 font-semibold">({sessionRate}%)</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right">
                                {!isCurrent && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedSession(s.sessionId.toString())}
                                  >
                                    Select & View
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* Quick QR Scanner & Camera Modal */}
      {showScannerModal && (
        <Modal
          isOpen={showScannerModal}
          onClose={handleCloseScanner}
          title={`Quick QR Scanner &mdash; ${currentSession?.title || 'Session'}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Live Camera Feed */}
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center border-2 border-primary-500">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-dashed border-white/60 m-10 rounded-lg pointer-events-none flex items-center justify-center">
                <p className="text-white/80 bg-black/50 px-3 py-1 rounded text-xs">
                  Center QR badge inside frame
                </p>
              </div>
            </div>

            {/* Manual QR Input in Modal */}
            <form onSubmit={handleQuickQrSubmit} className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700">
                Or type / scan barcode ticket number manually:
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ticket or registration number..."
                  value={quickQrInput}
                  onChange={(e) => setQuickQrInput(e.target.value)}
                  autoFocus
                />
                <Button 
                  type="submit" 
                  variant="primary"
                  loading={quickScanning}
                  disabled={!quickQrInput.trim()}
                >
                  Check In
                </Button>
              </div>
            </form>

            <div className="flex justify-between items-center pt-2 text-xs text-gray-500">
              <span>Event: <strong>{currentEvent?.name}</strong></span>
              <span>Session: <strong>{currentSession?.title}</strong></span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
