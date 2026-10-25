import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { accommodationApi, eventApi } from '../../api';
import { 
  ArrowLeft,
  Save,
  Building,
  MapPin,
  FileText,
  Calendar,
  Hash
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';

export default function AccommodationForm() {
  const navigate = useNavigate();
  const { id, eventId } = useParams();
  const { user, isAdmin, isCoordinator } = useAuth();

  const validEventId = eventId && eventId !== 'undefined' ? eventId : null;
  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const isAccommodationOfficer = user?.position === 'ACCOMMODATION_OFFICER';
  const canManage = isUnionAdmin || isCoordinator || isAccommodationOfficer;
  
  const [event, setEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(validEventId || '');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    buildingName: '',
    buildingCode: '',
    location: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  const isEditMode = !!id;

  const formatEventDate = (d) => {
    if (!d) return 'TBD';
    if (Array.isArray(d)) {
      const [y, m, day] = d;
      return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    try {
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? String(d) : parsed.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  useEffect(() => {
    if (validEventId) {
      setSelectedEventId(validEventId);
      fetchEvent(validEventId);
    } else {
      fetchAllEvents();
    }

    if (id) {
      fetchAccommodation();
    }
  }, [id, validEventId]);

  const fetchAllEvents = async () => {
    try {
      const res = await eventApi.getAll();
      const list = res.data?.data || res.data || [];
      const safeList = Array.isArray(list) ? list : [];
      setEvents(safeList);
      if (safeList.length > 0 && !selectedEventId && !validEventId) {
        setSelectedEventId(safeList[0].id.toString());
        setEvent(safeList[0]);
      }
    } catch (e) {
      console.error('Failed to fetch events:', e);
    }
  };

  const fetchEvent = async (evId) => {
    try {
      const response = await eventApi.getById(evId);
      const ev = response.data?.data || response.data;
      if (ev) {
        setEvent(ev);
        setSelectedEventId(ev.id.toString());
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    }
  };

  const fetchAccommodation = async () => {
    try {
      setLoading(true);
      const response = await accommodationApi.getById(id);
      const acc = response.data?.data || response.data;
      if (acc) {
        setFormData({
          buildingName: acc.buildingName || acc.name || '',
          buildingCode: acc.buildingCode || '',
          location: acc.location || '',
          description: acc.description || ''
        });
        if (acc.event) {
          setEvent(acc.event);
          setSelectedEventId(acc.event.id?.toString() || '');
        }
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

    if (!selectedEventId && !isEditMode) {
      newErrors.event = 'Please select an event for this accommodation';
    }

    if (!formData.buildingName.trim()) {
      newErrors.buildingName = 'Building name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
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
    setAlert(null);

    try {
      const payload = {
        buildingName: formData.buildingName.trim(),
        buildingCode: formData.buildingCode.trim() || null,
        location: formData.location.trim(),
        description: formData.description.trim() || null
      };

      let response;
      if (isEditMode) {
        response = await accommodationApi.update(id, payload);
      } else {
        response = await accommodationApi.create(selectedEventId, payload);
      }

      const savedData = response.data?.data || response.data;
      const accommodationId = isEditMode ? id : (savedData?.id || savedData?.accommodationId);

      setAlert({
        type: 'success',
        message: `Accommodation ${isEditMode ? 'updated' : 'created'} successfully!`
      });
      
      setTimeout(() => {
        if (accommodationId && accommodationId !== 'undefined') {
          navigate(`/app/accommodation/${accommodationId}`);
        } else {
          navigate('/app/accommodation');
        }
      }, 700);
    } catch (error) {
      console.error('Error saving accommodation:', error);
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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (loading) {
    return <PageSpinner message="Loading accommodation details..." />;
  }

  const eventOptions = (Array.isArray(events) ? events : [])
    .filter(e => e && e.id != null)
    .map(e => ({
      value: e.id.toString(),
      label: `${e.name || 'Event'} (${formatEventDate(e.startDate)})`
    }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
          onClick={() => navigate(isEditMode ? `/app/accommodation/${id}` : '/app/accommodation')}
          className="mb-4 text-xs font-semibold"
        >
          Back to Accommodations
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Accommodation' : 'Add New Accommodation'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isEditMode 
            ? 'Update accommodation building information' 
            : `Add accommodation building for ${event?.name || 'an event'}`
          }
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          dismissible
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
              Building Details
            </CardTitle>
          </CardHeader>
          <CardBody className="p-6 space-y-5">
            {/* Event Info */}
            {isEditMode || validEventId ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Assigned Event
                </label>
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {event?.name || 'Selected Event'}
                  </p>
                  {event?.startDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatEventDate(event.startDate)} - {formatEventDate(event.endDate)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Event <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    const ev = events.find(x => x.id?.toString() === e.target.value);
                    setEvent(ev || null);
                  }}
                  options={eventOptions}
                  error={errors.event}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Building / Block Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="buildingName"
                    required
                    placeholder="e.g., Block A, Main Hostel, Guest House"
                    value={formData.buildingName}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                {errors.buildingName && (
                  <p className="text-xs text-red-500 mt-1">{errors.buildingName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Building Code (Optional)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="buildingCode"
                    placeholder="e.g., BLD-A, HST-01"
                    value={formData.buildingCode}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Location / Campus Zone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="e.g., North Wing, Near Cafeteria, East Camp Zone"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              {errors.location && (
                <p className="text-xs text-red-500 mt-1">{errors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Description & Facilities (Optional)
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Describe facilities, accessibility notes, hot water, electricity, etc."
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div className="p-3.5 bg-blue-50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-lg flex items-start gap-3">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-900 dark:text-blue-300">
                After creating this building, you can add individual rooms with custom bed capacities and assign participants directly.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(isEditMode ? `/app/accommodation/${id}` : '/app/accommodation')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Save className="w-4 h-4 mr-1.5" />}
            loading={submitting}
          >
            {isEditMode ? 'Update Accommodation' : 'Save Accommodation'}
          </Button>
        </div>
      </form>
    </div>
  );
}
