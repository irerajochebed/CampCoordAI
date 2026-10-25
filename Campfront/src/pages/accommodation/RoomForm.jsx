import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { accommodationApi } from '../../api';
import { 
  ArrowLeft,
  Save,
  Home,
  Bed,
  Users,
  DoorOpen,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';

export default function RoomForm() {
  const navigate = useNavigate();
  const { accommodationId, roomId } = useParams();
  const { user, isAdmin, isCoordinator } = useAuth();
  
  const [accommodation, setAccommodation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    capacity: '2',
    genderRestriction: '',
    floor: '',
    amenities: ''
  });

  const [errors, setErrors] = useState({});

  const isEditMode = !!roomId;

  useEffect(() => {
    fetchAccommodation();
    if (roomId) {
      fetchRoom();
    }
  }, [accommodationId, roomId]);

  const fetchAccommodation = async () => {
    try {
      const response = await accommodationApi.getById(accommodationId);
      const acc = response.data?.data || response.data;
      if (acc) {
        setAccommodation(acc);
      }
    } catch (error) {
      console.error('Failed to fetch accommodation:', error);
      setAlert({
        type: 'error',
        message: 'Failed to fetch accommodation details'
      });
    }
  };

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const response = await accommodationApi.getRoomById(roomId);
      const room = response.data?.data || response.data;
      if (room) {
        setFormData({
          roomNumber: room.roomNumber || '',
          capacity: room.capacity?.toString() || '2',
          genderRestriction: room.genderRestriction || '',
          floor: room.floor || '',
          amenities: room.amenities || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch room:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch room details'
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required';
    }

    const capNum = parseInt(formData.capacity);
    if (!formData.capacity || isNaN(capNum) || capNum < 1) {
      newErrors.capacity = 'Capacity must be at least 1 bed';
    } else if (capNum > 100) {
      newErrors.capacity = 'Capacity cannot exceed 100 beds';
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
        roomNumber: formData.roomNumber.trim(),
        capacity: parseInt(formData.capacity),
        genderRestriction: formData.genderRestriction || null,
        floor: formData.floor.trim() || null,
        amenities: formData.amenities.trim() || null
      };

      let response;
      if (isEditMode) {
        response = await accommodationApi.updateRoom(roomId, payload);
      } else {
        response = await accommodationApi.createRoom(accommodationId, payload);
      }

      setAlert({
        type: 'success',
        message: `Room ${isEditMode ? 'updated' : 'created'} successfully!`
      });
      
      setTimeout(() => {
        navigate(`/app/accommodation/${accommodationId}`);
      }, 1000);
    } catch (error) {
      console.error('Failed to save room:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} room`
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

  const genderOptions = [
    { value: '', label: 'No Restriction (Any Gender)' },
    { value: 'MALE', label: 'Male Only' },
    { value: 'FEMALE', label: 'Female Only' },
    { value: 'MIXED', label: 'Mixed / Family' }
  ];

  if (loading) {
    return <PageSpinner message="Loading room details..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
          onClick={() => navigate(`/app/accommodation/${accommodationId}`)}
          className="mb-3 text-xs font-semibold"
        >
          Back to {accommodation?.buildingName || accommodation?.name || 'Accommodation'}
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Room' : 'Add New Room'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isEditMode 
            ? `Update details for Room ${formData.roomNumber}` 
            : `Add a room to ${accommodation?.buildingName || accommodation?.name || 'this building'}`
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
              Room Configuration
            </CardTitle>
          </CardHeader>
          <CardBody className="p-6 space-y-5">
            {/* Building Reference */}
            {accommodation && (
              <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase">Building</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {accommodation.buildingName || accommodation.name}
                  </p>
                </div>
                {accommodation.location && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {accommodation.location}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Room Number / Identifier <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="roomNumber"
                    required
                    placeholder="e.g., 101, A-12, Ground-01"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                {errors.roomNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.roomNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Bed Capacity <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Bed className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    max="100"
                    required
                    placeholder="Number of beds"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                {errors.capacity && (
                  <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Gender Restriction
                </label>
                <Select
                  name="genderRestriction"
                  value={formData.genderRestriction}
                  onChange={handleChange}
                  options={genderOptions}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Floor Level (Optional)
                </label>
                <div className="relative">
                  <DoorOpen className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="floor"
                    placeholder="e.g., Ground Floor, 1st Floor, 2nd Floor"
                    value={formData.floor}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Amenities & Features (Optional)
              </label>
              <textarea
                name="amenities"
                rows={3}
                placeholder="e.g., Attached bathroom, Wi-Fi, Balcony, Electricity outlets, Desk..."
                value={formData.amenities}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`/app/accommodation/${accommodationId}`)}
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
            {isEditMode ? 'Update Room' : 'Save Room'}
          </Button>
        </div>
      </form>
    </div>
  );
}
