import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Search,
  Users,
  Clock,
  Calendar,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import { eventApi, sessionApi, attendanceApi } from '../../api';

export default function QRAttendance() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get('sessionId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(sessionIdParam || '');
  
  const [scannerActive, setScannerActive] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [stats, setStats] = useState({
    totalRegistered: 0,
    checkedIn: 0,
    pending: 0,
    checkInRate: 0
  });

  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [checkInModal, setCheckInModal] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    fetchEventData();
    return () => {
      stopScanner();
    };
  }, [eventId]);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionStats();
    }
  }, [selectedSession]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch event details
      const eventRes = await eventApi.getById(eventId);
      if (eventRes.data.success) {
        setEvent(eventRes.data.data);
      }

      // Fetch event sessions
      const sessionsRes = await sessionApi.getByEvent(eventId);
      if (sessionsRes.data.success) {
        const sessionsList = sessionsRes.data.data || [];
        setSessions(sessionsList);
        
        // Auto-select first session if none selected
        if (!selectedSession && sessionsList.length > 0) {
          setSelectedSession(sessionsList[0].id.toString());
        }
      }

    } catch (err) {
      console.error('Error fetching event data:', err);
      setError(err.response?.data?.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionStats = async () => {
    try {
      const sessionId = parseInt(selectedSession);
      
      // Fetch attendance records
      const attendanceRes = await attendanceApi.getBySession(sessionId);
      if (attendanceRes.data.success) {
        const records = attendanceRes.data.data || [];
        const checkedInCount = records.filter(r => r.checkInTime).length;
        
        setStats({
          totalRegistered: records.length,
          checkedIn: checkedInCount,
          pending: records.length - checkedInCount,
          checkInRate: records.length > 0 ? Math.round((checkedInCount / records.length) * 100) : 0
        });

        // Get recent check-ins (last 10)
        const recent = records
          .filter(r => r.checkInTime)
          .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
          .slice(0, 10);
        setRecentCheckIns(recent);
      }
    } catch (err) {
      console.error('Error fetching session stats:', err);
    }
  };

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScannerActive(true);

        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(scanQRCode, 500);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setScannerActive(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // In production, use a QR code library like jsQR
      // For now, simulate QR detection
      // const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      // const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      // Simulated detection - replace with actual QR library
      // if (code) {
      //   handleQRCodeDetected(code.data);
      // }
    }
  };

  const handleQRCodeDetected = async (qrData) => {
    try {
      // Stop scanning temporarily
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }

      // Check in participant
      const response = await attendanceApi.checkIn({
        sessionId: parseInt(selectedSession),
        qrCode: qrData
      });

      if (response.data.success) {
        const attendance = response.data.data;
        setCheckInModal({
          success: true,
          participant: attendance.registration?.participant,
          checkInTime: attendance.checkInTime,
          message: 'Check-in successful!'
        });
        
        // Refresh stats
        fetchSessionStats();
        setSuccess(`Successfully checked in ${attendance.registration?.participant?.fullName}`);
      }

    } catch (err) {
      console.error('Error checking in:', err);
      setCheckInModal({
        success: false,
        message: err.response?.data?.message || 'Check-in failed'
      });
    } finally {
      // Resume scanning after 3 seconds
      setTimeout(() => {
        if (scannerActive) {
          scanIntervalRef.current = setInterval(scanQRCode, 500);
        }
      }, 3000);
    }
  };

  const handleManualSearch = async () => {
    if (!manualSearch.trim() || !selectedSession) return;

    try {
      setError(null);
      
      // Search for participants by name or registration ID
      const response = await attendanceApi.searchParticipant({
        sessionId: parseInt(selectedSession),
        query: manualSearch
      });

      if (response.data.success) {
        setSearchResults(response.data.data || []);
      }
    } catch (err) {
      console.error('Error searching:', err);
      setError(err.response?.data?.message || 'Search failed');
    }
  };

  const handleManualCheckIn = async (registrationId) => {
    try {
      setError(null);
      
      const response = await attendanceApi.checkIn({
        sessionId: parseInt(selectedSession),
        registrationId
      });

      if (response.data.success) {
        const attendance = response.data.data;
        setSuccess(`Successfully checked in ${attendance.registration?.participant?.fullName}`);
        setManualSearch('');
        setSearchResults([]);
        fetchSessionStats();
      }
    } catch (err) {
      console.error('Error checking in:', err);
      setError(err.response?.data?.message || 'Check-in failed');
    }
  };

  const exportAttendance = async () => {
    try {
      // In production, implement CSV/PDF export
      setSuccess('Export functionality will be implemented');
    } catch (err) {
      setError('Export failed');
    }
  };

  if (loading) {
    return <PageSpinner message="Loading attendance scanner..." />;
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Event not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QR Code Attendance Scanner</h1>
            <p className="text-gray-600 mt-1">{event.name}</p>
          </div>
          <Link to={`/events/${eventId}`}>
            <Button variant="outline">Back to Event</Button>
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

      {/* Session Selector */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Session
              </label>
              <Select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
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
            <div className="pt-7">
              <Button
                variant="outline"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={fetchSessionStats}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {!selectedSession ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Please select a session to begin scanning</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.checkedIn}</p>
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
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Check-in Rate</p>
                    <p className="text-2xl font-bold text-primary-600 mt-1">{stats.checkInRate}%</p>
                  </div>
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <QrCode className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scanner Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* QR Scanner */}
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Scanner</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {!scannerActive ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Camera is ready to scan QR codes</p>
                        <Button
                          variant="primary"
                          icon={<Camera className="w-4 h-4" />}
                          onClick={startScanner}
                        >
                          Start Camera
                        </Button>
                        <p className="text-xs text-gray-500 mt-4">
                          Make sure to allow camera access when prompted
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <video
                          ref={videoRef}
                          className="w-full h-96 bg-black rounded-lg object-cover"
                          playsInline
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-64 h-64 border-4 border-primary-500 rounded-lg relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500"></div>
                          </div>
                        </div>

                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                          <Button
                            variant="danger"
                            onClick={stopScanner}
                          >
                            Stop Scanner
                          </Button>
                        </div>

                        {/* Scanning indicator */}
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          Scanning...
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Manual Search */}
              <Card>
                <CardHeader>
                  <CardTitle>Manual Check-In</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by name or registration ID..."
                        value={manualSearch}
                        onChange={(e) => setManualSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                      />
                      <Button
                        variant="primary"
                        icon={<Search className="w-4 h-4" />}
                        onClick={handleManualSearch}
                      >
                        Search
                      </Button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="space-y-2">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {result.registration?.participant?.fullName}
                              </p>
                              <p className="text-sm text-gray-600">
                                ID: {result.registration?.id} | {result.registration?.participant?.email}
                              </p>
                              {result.checkInTime ? (
                                <Badge variant="success" className="mt-1">
                                  Checked in at {new Date(result.checkInTime).toLocaleTimeString('en-RW')}
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="mt-1">Not checked in</Badge>
                              )}
                            </div>
                            {!result.checkInTime && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleManualCheckIn(result.registration?.id)}
                              >
                                Check In
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Recent Check-Ins Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader action={
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={exportAttendance}
                  >
                    Export
                  </Button>
                }>
                  <CardTitle>Recent Check-Ins</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {recentCheckIns.length > 0 ? (
                      recentCheckIns.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">
                                {record.registration?.participant?.fullName}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {new Date(record.checkInTime).toLocaleTimeString('en-RW', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No check-ins yet</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Scanner Instructions</CardTitle>
                </CardHeader>
                <CardBody>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">1.</span>
                      <span>Select the session you want to track attendance for</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">2.</span>
                      <span>Click "Start Camera" to activate the QR scanner</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">3.</span>
                      <span>Have participants show their QR code badge</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">4.</span>
                      <span>Position the QR code within the scanning frame</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">5.</span>
                      <span>The system will automatically check them in</span>
                    </li>
                  </ol>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Use manual search if QR code scanning is unavailable
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Check-In Result Modal */}
      {checkInModal && (
        <Modal
          isOpen={true}
          onClose={() => setCheckInModal(null)}
          title={checkInModal.success ? 'Check-In Successful' : 'Check-In Failed'}
        >
          <div className="text-center py-6">
            {checkInModal.success ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {checkInModal.participant?.fullName}
                </h3>
                <p className="text-gray-600 mb-4">{checkInModal.message}</p>
                <p className="text-sm text-gray-500">
                  Time: {new Date(checkInModal.checkInTime).toLocaleTimeString('en-RW')}
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <p className="text-gray-600">{checkInModal.message}</p>
              </>
            )}
          </div>
          <div className="mt-6">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setCheckInModal(null)}
            >
              Continue Scanning
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
