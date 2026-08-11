import { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
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
    capacity: '',
    genderRestriction: '',
    floor: '',
    amenities: ''
  });

  const [errors, setErrors] = useState({});

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
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
      if (response.data.success) {
        setAccommodation(response.data.data);
      }
    } catch (error) {
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
      if (response.data.success) {
        const room = response.data.data;
        setFormData({
          roomNumber: room.roomNumber || '',
          capacity: room.capacity?.toString() || '',
          genderRestriction: room.genderRestriction || '',
          floor: room.floor || '',
          amenities: room.amenities || ''
        });
      }
    } catch (error) {
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

    if (!formData.capacity) {
      newErrors.capacity = 'Capacity is required';
    } else if (parseInt(formData.capacity) < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    } else if (parseInt(formData.capacity) > 50) {
      newErrors.capacity = 'Capacity cannot exceed 50 beds';
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

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `Room ${isEditMode ? 'updated' : 'created'} successfully`
        });
        
        setTimeout(() => navigate(`/accommodation/${accommodationId}`), 1500);
      }
    } catch (error) {
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
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const genderOptions = [
    { value: '', label: 'No Restriction' },
    { value: 'MALE', label: 'Male Only' },
    { value: 'FEMALE', label: 'Female Only' },
    { value: 'MIXED', label: 'Mixed (Families)' }
  ];

  if (loading) {
    return <PageSpinner message="Loading room details..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(`/accommodation/${accommodationId}`)}
          className="mb-4"
        >
          Back to {accommodation?.buildingName || 'Accommodation'}
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Room' : 'Add New Room'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode 
            ? 'Update room information and settings' 
            : `Add a room to ${accommodation?.buildingName || accommodation?.name || 'accommodation'}`
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
          {/* Room Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Room Information</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {/* Accommodation Info (read-only) */}
                {accommodation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accommodation Building
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={accommodation.buildingName || accommodation.name}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                      {accommodation.location && (
                        <p className="text-xs text-gray-500 mt-1">
                          {accommodation.location}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Room Number"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    error={errors.roomNumber}
                    required
                    placeholder="e.g., 101, A1, Ground-1"
                    icon={<Home className="w-5 h-5" />}
                  />

                  <Input
                    label="Capacity (Number of Beds)"
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleChange}
                    error={errors.capacity}
                    required
                    placeholder="Number of beds in this room"
                    min="1"
                    max="50"
                    icon={<Bed className="w-5 h-5" />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Gender Restriction"
                    name="genderRestriction"
                    value={formData.genderRestriction}
                    onChange={handleChange}
                    options={genderOptions}
                    icon={<Users className="w-5 h-5" />}
                  />

                  <Input
                    label="Floor (Optional)"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    placeholder="e.g., Ground, 1st, 2nd"
                    icon={<DoorOpen className="w-5 h-5" />}
                  />
                </div>

                <Textarea
                  label="Amenities (Optional)"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleChange}
                  rows={3}
                  placeholder="List amenities: e.g., Air conditioning, Private bathroom, Wi-Fi, TV, etc."
                />
              </div>
            </CardBody>
          </Card>

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Room Guidelines</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Room Number</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Choose a unique room number that's easy to identify. This will help participants 
                      find their assigned rooms easily.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Bed className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Capacity</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Specify the total number of beds in this room. Each bed can be assigned to one participant. 
                      The system will track occupancy automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Gender Restriction</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Set gender restrictions to ensure appropriate room assignments. "Mixed" is typically 
                      used for family rooms. The system will validate assignments based on this setting.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DoorOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Floor & Amenities</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Specify the floor and amenities to help participants understand what to expect. 
                      This information is displayed when assigning rooms.
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Preview */}
          {formData.roomNumber && formData.capacity && (
            <Card>
              <CardHeader>
                <CardTitle>Room Preview</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Room {formData.roomNumber}</h3>
                      {formData.floor && (
                        <p className="text-sm text-gray-500">Floor {formData.floor}</p>
                      )}
                    </div>
                    {formData.genderRestriction && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        formData.genderRestriction === 'MALE' ? 'bg-blue-100 text-blue-700' :
                        formData.genderRestriction === 'FEMALE' ? 'bg-pink-100 text-pink-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {genderOptions.find(opt => opt.value === formData.genderRestriction)?.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Bed className="w-4 h-4" />
                    <span>Capacity: {formData.capacity} beds</span>
                  </div>

                  {formData.amenities && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">Amenities:</p>
                      <p>{formData.amenities}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/accommodation/${accommodationId}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              loading={submitting}
            >
              {isEditMode ? 'Update Room' : 'Create Room'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
