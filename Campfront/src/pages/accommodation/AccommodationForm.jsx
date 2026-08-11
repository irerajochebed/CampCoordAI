import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { accommodationApi, eventApi } from '../../api';
import { 
  ArrowLeft,
  Save,
  Building,
  MapPin,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';

export default function AccommodationForm() {
  const navigate = useNavigate();
  const { id, eventId } = useParams();
  const { user, isAdmin, isCoordinator } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    buildingName: '',
    location: '',
    description: '',
    contactPerson: '',
    contactPhone: ''
  });

  const [errors, setErrors] = useState({});

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const isEditMode = !!id;

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
    if (id) {
      fetchAccommodation();
    }
  }, [id, eventId]);

  const fetchEvent = async () => {
    try {
      const response = await eventApi.getById(eventId);
      if (response.data.success) {
        setEvent(response.data.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to fetch event details'
      });
    }
  };

  const fetchAccommodation = async () => {
    try {
      setLoading(true);
      const response = await accommodationApi.getById(id);
      if (response.data.success) {
        const accommodation = response.data.data;
        setFormData({
          buildingName: accommodation.buildingName || accommodation.name || '',
          location: accommodation.location || '',
          description: accommodation.description || '',
          contactPerson: accommodation.contactPerson || '',
          contactPhone: accommodation.contactPhone || ''
        });
        setEvent(accommodation.event);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch accommodation details'
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.buildingName.trim()) {
      newErrors.buildingName = 'Building name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.contactPhone && !/^[0-9+\-\s()]+$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Invalid phone number format';
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
        name: formData.buildingName.trim(),
        buildingName: formData.buildingName.trim(),
        location: formData.location.trim(),
        description: formData.description.trim() || null,
        contactPerson: formData.contactPerson.trim() || null,
        contactPhone: formData.contactPhone.trim() || null
      };

      let response;
      if (isEditMode) {
        response = await accommodationApi.update(id, payload);
      } else {
        response = await accommodationApi.create(eventId, payload);
      }

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `Accommodation ${isEditMode ? 'updated' : 'created'} successfully`
        });
        
        const accommodationId = isEditMode ? id : response.data.data.id;
        setTimeout(() => navigate(`/accommodation/${accommodationId}`), 1500);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} accommodation`
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

  if (loading) {
    return <PageSpinner message="Loading accommodation details..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(isEditMode ? `/accommodation/${id}` : '/accommodation')}
          className="mb-4"
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Accommodation' : 'Add New Accommodation'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode 
            ? 'Update accommodation building information' 
            : `Add accommodation building for ${event?.name || 'event'}`
          }
        </p>
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
              <div className="space-y-4">
                {/* Event Info (read-only) */}
                {event && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={event.name}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <Input
                  label="Building Name"
                  name="buildingName"
                  value={formData.buildingName}
                  onChange={handleChange}
                  error={errors.buildingName}
                  required
                  placeholder="e.g., Hostel A, Guest House, Main Building"
                  icon={<Building className="w-5 h-5" />}
                />

                <Input
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  error={errors.location}
                  required
                  placeholder="e.g., North Campus, Near Main Gate"
                  icon={<MapPin className="w-5 h-5" />}
                />

                <Textarea
                  label="Description (Optional)"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the building, facilities, or any important information..."
                />
              </div>
            </CardBody>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information (Optional)</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Input
                  label="Contact Person"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Name of building manager or contact person"
                />

                <Input
                  label="Contact Phone"
                  name="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  error={errors.contactPhone}
                  placeholder="+250 XXX XXX XXX"
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Note</p>
                      <p className="text-xs text-blue-700 mt-1">
                        After creating the accommodation, you can add individual rooms with their capacity, 
                        gender restrictions, and amenities. The total capacity will be automatically calculated 
                        from the rooms you add.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(isEditMode ? `/accommodation/${id}` : '/accommodation')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              loading={submitting}
            >
              {isEditMode ? 'Update Accommodation' : 'Create Accommodation'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
