import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventApi } from '../../api';
import { Save, ArrowLeft, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';

export default function EventForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: '',
    capacity: '',
    registrationFee: '',
    budget: '',
    requirements: ''
  });

  const [originalEvent, setOriginalEvent] = useState(null);
  const [errors, setErrors] = useState({});

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    if (id) {
      fetchEvent();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventApi.getById(id);
      if (response.data.success) {
        const event = response.data.data;
        setOriginalEvent(event);
        
        // Check permission
        const isEventCoordinator = event.coordinator?.id === user.userId;
        if (!isUnionAdmin && !isEventCoordinator) {
          setAlert({
            type: 'error',
            message: 'You do not have permission to edit this event'
          });
          setTimeout(() => navigate(`/events/${id}`), 2000);
          return;
        }

        setFormData({
          name: event.name || '',
          type: event.type || '',
          description: event.description || '',
          startDate: event.startDate || '',
          endDate: event.endDate || '',
          venue: event.venue || '',
          capacity: event.capacity || '',
          registrationFee: event.registrationFee || '',
          budget: event.budget || '',
          requirements: event.requirements || ''
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch event details'
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Event type is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }

    if (formData.capacity && formData.capacity < 0) {
      newErrors.capacity = 'Capacity must be a positive number';
    }

    if (formData.registrationFee && formData.registrationFee < 0) {
      newErrors.registrationFee = 'Registration fee must be a positive number';
    }

    if (formData.budget && formData.budget < 0) {
      newErrors.budget = 'Budget must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      setAlert({ type: 'error', message: 'Please fill in all required fields correctly' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        venue: formData.venue.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        requirements: formData.requirements.trim() || null
      };

      const response = await eventApi.update(id, payload);

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: 'Event updated successfully'
        });
        setTimeout(() => navigate(`/events/${id}`), 1500);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update event'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const eventTypeOptions = [
    { value: '', label: 'Select Event Type' },
    { value: 'CAMP', label: 'Camp' },
    { value: 'CONFERENCE', label: 'Conference' },
    { value: 'RETREAT', label: 'Retreat' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'WORKSHOP', label: 'Workshop' },
    { value: 'SEMINAR', label: 'Seminar' },
  ];

  if (loading) {
    return <PageSpinner message="Loading event details..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600 mt-1">
            Update event details and configuration
          </p>
        </div>
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(`/events/${id}`)}
        >
          Back to Event
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Event Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                    placeholder="Enter event name"
                  />

                  <Select
                    label="Event Type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    options={eventTypeOptions}
                    error={errors.type}
                    required
                  />
                </div>

                {/* Department - Read-only */}
                {originalEvent?.department && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={originalEvent.department.name}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Department cannot be changed after event creation
                      </p>
                    </div>
                  </div>
                )}

                {/* Event Coordinator - Read-only */}
                {originalEvent?.coordinator && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Coordinator
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={`${originalEvent.coordinator.firstName} ${originalEvent.coordinator.lastName}`}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {originalEvent.coordinator.email}
                      </p>
                    </div>
                  </div>
                )}

                <Textarea
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the event purpose and activities..."
                />
              </div>
            </CardBody>
          </Card>

          {/* Date & Location */}
          <Card>
            <CardHeader>
              <CardTitle>Date & Location</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    error={errors.startDate}
                    required
                  />

                  <Input
                    label="End Date"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    error={errors.endDate}
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
                  placeholder="Enter event venue/location"
                />
              </div>
            </CardBody>
          </Card>

          {/* Capacity & Financial */}
          <Card>
            <CardHeader>
              <CardTitle>Capacity & Financial Details</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Capacity"
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleChange}
                    error={errors.capacity}
                    placeholder="Maximum participants"
                    min="0"
                  />

                  <Input
                    label="Registration Fee (RWF)"
                    name="registrationFee"
                    type="number"
                    value={formData.registrationFee}
                    onChange={handleChange}
                    error={errors.registrationFee}
                    placeholder="Fee per participant"
                    min="0"
                    step="1000"
                  />

                  <Input
                    label="Total Budget (RWF)"
                    name="budget"
                    type="number"
                    value={formData.budget}
                    onChange={handleChange}
                    error={errors.budget}
                    placeholder="Overall event budget"
                    min="0"
                    step="1000"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Financial Information</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Registration fee is charged per participant. The total budget includes all event expenses.
                        Both amounts are in Rwandan Francs (RWF).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Textarea
                label="Special Requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={4}
                placeholder="List any special requirements, equipment needs, or important notes..."
              />
            </CardBody>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/events/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              loading={submitting}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
