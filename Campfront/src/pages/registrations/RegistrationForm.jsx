import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registrationApi, eventApi } from '../../api';
import { 
  ArrowLeft,
  Save,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function RegistrationForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [availableEvents, setAvailableEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    eventId: '',
    participantFirstName: user?.firstName || '',
    participantLastName: user?.lastName || '',
    participantEmail: user?.email || '',
    participantPhone: user?.phone || '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    specialRequirements: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAvailableEvents();
  }, []);

  const fetchAvailableEvents = async () => {
    try {
      setLoading(true);
      // Fetch events with REGISTRATION_OPEN status
      const response = await eventApi.getByStatus('REGISTRATION_OPEN');
      if (response.data.success) {
        setAvailableEvents(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setAlert({
        type: 'error',
        message: 'Failed to fetch available events'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    setFormData(prev => ({ ...prev, eventId }));
    
    // Find and set selected event details
    const event = availableEvents.find(ev => ev.id.toString() === eventId);
    setSelectedEvent(event || null);
    
    // Clear event error
    if (errors.eventId) {
      setErrors(prev => ({ ...prev, eventId: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.eventId) {
      newErrors.eventId = 'Please select an event';
    }

    if (!formData.participantFirstName.trim()) {
      newErrors.participantFirstName = 'First name is required';
    }

    if (!formData.participantLastName.trim()) {
      newErrors.participantLastName = 'Last name is required';
    }

    if (!formData.participantEmail.trim()) {
      newErrors.participantEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.participantEmail)) {
      newErrors.participantEmail = 'Invalid email format';
    }

    if (formData.participantPhone && !/^[0-9+\-\s()]+$/.test(formData.participantPhone)) {
      newErrors.participantPhone = 'Invalid phone number format';
    }

    if (formData.emergencyContactPhone && !/^[0-9+\-\s()]+$/.test(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = 'Invalid phone number format';
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
        eventId: parseInt(formData.eventId),
        participantFirstName: formData.participantFirstName.trim(),
        participantLastName: formData.participantLastName.trim(),
        participantEmail: formData.participantEmail.trim(),
        participantPhone: formData.participantPhone.trim() || null,
        emergencyContactName: formData.emergencyContactName.trim() || null,
        emergencyContactPhone: formData.emergencyContactPhone.trim() || null,
        specialRequirements: formData.specialRequirements.trim() || null
      };

      const response = await registrationApi.create(payload);

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: 'Registration submitted successfully! You will receive confirmation once payment is verified.'
        });
        
        // Redirect to registration detail after 2 seconds
        setTimeout(() => {
          navigate(`/registrations/${response.data.data.id}`);
        }, 2000);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit registration'
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getCapacityStatus = (event) => {
    if (!event.capacity) return null;
    
    const registeredCount = event.registeredCount || 0;
    const percentage = (registeredCount / event.capacity) * 100;
    
    if (percentage >= 100) {
      return { label: 'Full', variant: 'error' };
    } else if (percentage >= 80) {
      return { label: `${event.capacity - registeredCount} spots left`, variant: 'warning' };
    } else {
      return { label: `${event.capacity - registeredCount} spots available`, variant: 'success' };
    }
  };

  if (loading) {
    return <PageSpinner message="Loading available events..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/registrations')}
          className="mb-4"
        >
          Back to Registrations
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Register for Event</h1>
        <p className="text-gray-600 mt-1">
          Select an event and fill in your information to register
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* No Available Events */}
      {availableEvents.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Calendar className="w-12 h-12" />}
              title="No events available"
              description="There are no events currently open for registration. Please check back later."
              action={
                <Button
                  variant="primary"
                  onClick={() => navigate('/events')}
                >
                  View All Events
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Event</CardTitle>
                </CardHeader>
                <CardBody>
                  <Select
                    label="Event"
                    name="eventId"
                    value={formData.eventId}
                    onChange={handleEventChange}
                    options={[
                      { value: '', label: 'Select an event...' },
                      ...availableEvents.map(event => ({
                        value: event.id.toString(),
                        label: event.name
                      }))
                    ]}
                    error={errors.eventId}
                    required
                  />

                  {selectedEvent && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedEvent.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{selectedEvent.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-gray-600">Dates</p>
                            <p className="font-medium text-gray-900">
                              {new Date(selectedEvent.startDate).toLocaleDateString()} - {new Date(selectedEvent.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {selectedEvent.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-600">Venue</p>
                              <p className="font-medium text-gray-900">{selectedEvent.venue}</p>
                            </div>
                          </div>
                        )}

                        {selectedEvent.registrationFee && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-600">Registration Fee</p>
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(selectedEvent.registrationFee)}
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedEvent.capacity && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-600">Capacity</p>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{selectedEvent.registeredCount || 0} / {selectedEvent.capacity}</p>
                                {getCapacityStatus(selectedEvent) && (
                                  <Badge variant={getCapacityStatus(selectedEvent).variant} size="sm">
                                    {getCapacityStatus(selectedEvent).label}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Participant Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Participant Information</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        name="participantFirstName"
                        value={formData.participantFirstName}
                        onChange={handleChange}
                        error={errors.participantFirstName}
                        required
                        placeholder="Enter first name"
                      />

                      <Input
                        label="Last Name"
                        name="participantLastName"
                        value={formData.participantLastName}
                        onChange={handleChange}
                        error={errors.participantLastName}
                        required
                        placeholder="Enter last name"
                      />
                    </div>

                    <Input
                      label="Email"
                      name="participantEmail"
                      type="email"
                      value={formData.participantEmail}
                      onChange={handleChange}
                      error={errors.participantEmail}
                      required
                      placeholder="Enter email address"
                    />

                    <Input
                      label="Phone Number (Optional)"
                      name="participantPhone"
                      type="tel"
                      value={formData.participantPhone}
                      onChange={handleChange}
                      error={errors.participantPhone}
                      placeholder="+250 XXX XXX XXX"
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact (Optional)</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <Input
                      label="Contact Name"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                      placeholder="Full name of emergency contact"
                    />

                    <Input
                      label="Contact Phone"
                      name="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                      error={errors.emergencyContactPhone}
                      placeholder="+250 XXX XXX XXX"
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Special Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Special Requirements (Optional)</CardTitle>
                </CardHeader>
                <CardBody>
                  <Textarea
                    label="Special Requirements or Notes"
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Dietary restrictions, accessibility needs, medical conditions, etc."
                  />
                </CardBody>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/registrations')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  loading={submitting}
                  disabled={!formData.eventId}
                >
                  Submit Registration
                </Button>
              </div>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Registration Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Registration Process</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Submit Registration</p>
                        <p className="text-sm text-gray-600">Fill in your details and submit</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Submit Payment</p>
                        <p className="text-sm text-gray-600">Pay the registration fee and upload proof</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Payment Verification</p>
                        <p className="text-sm text-gray-600">Wait for organizers to verify payment</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Confirmation</p>
                        <p className="text-sm text-gray-600">Receive confirmation and QR code</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Important Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Important Notes</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Registration is not complete until payment is verified
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        You will receive a QR code after confirmation for event check-in
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Provide accurate emergency contact information for safety purposes
                      </p>
                    </div>

                    {selectedEvent?.capacity && (
                      <div className="flex items-start gap-2">
                        <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">
                          This event has limited capacity. Register early to secure your spot
                        </p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Payment Information */}
              {selectedEvent?.registrationFee && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Registration Fee</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(selectedEvent.registrationFee)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Payment details will be provided after registration submission
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
