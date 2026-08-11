import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventApi, sessionApi, userApi } from '../../api';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  User,
  MapPin,
  Save,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function SessionManagement() {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const { user, isAdmin } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: 'GENERAL',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    speakerId: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    fetchEvent();
    fetchSessions();
    fetchSpeakers();
  }, [eventId]);

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
            message: 'You do not have permission to manage sessions for this event'
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

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionApi.getByEvent(eventId);
      if (response.data.success) {
        setSessions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setAlert({
        type: 'error',
        message: 'Failed to fetch sessions'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSpeakers = async () => {
    try {
      // Fetch users who can be speakers (COORDINATOR role with SPEAKER position)
      const response = await userApi.getByRole('COORDINATOR');
      if (response.data.success) {
        setSpeakers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching speakers:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'GENERAL',
      date: '',
      startTime: '',
      endTime: '',
      venue: '',
      speakerId: '',
      description: ''
    });
    setErrors({});
    setEditingSession(null);
  };

  const handleCreate = () => {
    resetForm();
    // Pre-fill date with event start date
    if (event?.startDate) {
      setFormData(prev => ({ ...prev, date: event.startDate }));
    }
    setShowModal(true);
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setFormData({
      title: session.title || '',
      type: session.type || 'GENERAL',
      date: session.date || '',
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      venue: session.venue || '',
      speakerId: session.speaker?.id || '',
      description: session.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await sessionApi.delete(sessionId);
      setAlert({ type: 'success', message: 'Session deleted successfully' });
      fetchSessions();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete session'
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Session title is required';
    }

    if (!formData.type) {
      newErrors.type = 'Session type is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      // Check if date is within event dates
      const sessionDate = new Date(formData.date);
      const eventStart = new Date(event?.startDate);
      const eventEnd = new Date(event?.endDate);
      
      if (sessionDate < eventStart || sessionDate > eventEnd) {
        newErrors.date = `Date must be between ${eventStart.toLocaleDateString()} and ${eventEnd.toLocaleDateString()}`;
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        venue: formData.venue.trim(),
        speakerId: formData.speakerId ? parseInt(formData.speakerId) : null,
        description: formData.description.trim() || null
      };

      let response;
      if (editingSession) {
        response = await sessionApi.update(editingSession.id, payload);
      } else {
        response = await sessionApi.create(eventId, payload);
      }

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `Session ${editingSession ? 'updated' : 'created'} successfully`
        });
        setShowModal(false);
        resetForm();
        fetchSessions();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || `Failed to ${editingSession ? 'update' : 'create'} session`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const sessionTypeOptions = [
    { value: 'GENERAL', label: 'General Session' },
    { value: 'WORSHIP', label: 'Worship' },
    { value: 'SEMINAR', label: 'Seminar' },
    { value: 'WORKSHOP', label: 'Workshop' },
    { value: 'BREAK', label: 'Break/Meal' },
    { value: 'RECREATION', label: 'Recreation' },
    { value: 'PRAYER', label: 'Prayer Session' },
  ];

  const getSessionTypeBadge = (type) => {
    const variants = {
      GENERAL: 'default',
      WORSHIP: 'info',
      SEMINAR: 'success',
      WORKSHOP: 'warning',
      BREAK: 'default',
      RECREATION: 'info',
      PRAYER: 'success',
    };
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>;
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    const date = session.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedSessions).sort((a, b) => new Date(a) - new Date(b));

  if (loading) {
    return <PageSpinner message="Loading sessions..." />;
  }

  const canManage = isUnionAdmin || event?.coordinator?.id === user.userId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(`/events/${eventId}`)}
            className="mb-4"
          >
            Back to Event
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600 mt-1">{event?.name}</p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleCreate}
          >
            Create Session
          </Button>
        )}
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Clock className="w-12 h-12" />}
              title="No sessions scheduled"
              description="Create your first session to build the event schedule"
              action={
                canManage && (
                  <Button variant="primary" onClick={handleCreate}>
                    Create First Session
                  </Button>
                )
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <Card key={date}>
              <CardHeader>
                <CardTitle>
                  {new Date(date).toLocaleDateString('en-RW', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {groupedSessions[date]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map(session => (
                      <div 
                        key={session.id} 
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0 w-24 text-center">
                          <div className="bg-primary-600 text-white px-3 py-1 rounded-lg">
                            <p className="text-sm font-medium">{session.startTime}</p>
                            <p className="text-xs">{session.endTime}</p>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{session.title}</h3>
                              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                                {getSessionTypeBadge(session.type)}
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {session.venue}
                                </span>
                                {session.speaker && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {session.speaker.firstName} {session.speaker.lastName}
                                  </span>
                                )}
                              </div>
                              {session.description && (
                                <p className="text-sm text-gray-600 mt-2">{session.description}</p>
                              )}
                            </div>

                            {canManage && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<Edit className="w-4 h-4" />}
                                  onClick={() => handleEdit(session)}
                                  title="Edit session"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<Trash2 className="w-4 h-4 text-red-600" />}
                                  onClick={() => handleDelete(session.id)}
                                  title="Delete session"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Session Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingSession ? 'Edit Session' : 'Create New Session'}
        size="lg"
        footer={
          <>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSubmit}
              loading={submitting}
            >
              {editingSession ? 'Update Session' : 'Create Session'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Session Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            required
            placeholder="e.g., Morning Worship, Youth Seminar"
          />

          <Select
            label="Session Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={sessionTypeOptions}
            error={errors.type}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              error={errors.date}
              required
              min={event?.startDate}
              max={event?.endDate}
            />

            <Input
              label="Start Time"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              error={errors.startTime}
              required
            />

            <Input
              label="End Time"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
              error={errors.endTime}
              required
            />
          </div>

          <Input
            label="Venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            error={errors.venue}
            required
            placeholder="e.g., Main Hall, Conference Room A"
          />

          <Select
            label="Speaker (Optional)"
            name="speakerId"
            value={formData.speakerId}
            onChange={handleChange}
            options={[
              { value: '', label: 'No speaker assigned' },
              ...speakers.map(speaker => ({ 
                value: speaker.id, 
                label: `${speaker.firstName} ${speaker.lastName}` 
              }))
            ]}
          />

          <Textarea
            label="Description (Optional)"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Session description or additional notes..."
          />
        </form>
      </Modal>
    </div>
  );
}
