import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { accommodationApi } from '../../api';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Home,
  Users,
  MapPin,
  Building,
  Bed,
  User,
  Mail,
  Phone,
  DoorOpen
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

export default function AccommodationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin, isCoordinator } = useAuth();
  
  const [accommodation, setAccommodation] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(null);

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const canManage = isUnionAdmin || isCoordinator;

  useEffect(() => {
    fetchAccommodation();
    fetchRooms();
  }, [id]);

  const fetchAccommodation = async () => {
    try {
      setLoading(true);
      const response = await accommodationApi.getById(id);
      if (response.data.success) {
        setAccommodation(response.data.data);
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

  const fetchRooms = async () => {
    try {
      const response = await accommodationApi.getRoomsByAccommodation(id);
      if (response.data.success) {
        setRooms(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Don't show error for empty rooms (404)
      if (error.response?.status !== 404) {
        setAlert({
          type: 'error',
          message: 'Failed to fetch rooms'
        });
      }
    }
  };

  const handleDeleteAccommodation = async () => {
    if (!confirm('Are you sure you want to delete this accommodation? This will also delete all associated rooms.')) {
      return;
    }

    try {
      await accommodationApi.delete(id);
      setAlert({ type: 'success', message: 'Accommodation deleted successfully' });
      setTimeout(() => navigate('/accommodation'), 1500);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete accommodation'
      });
    }
  };

  const handleDeleteRoom = async () => {
    if (!deletingRoom) return;

    try {
      await accommodationApi.deleteRoom(deletingRoom.id);
      setAlert({ type: 'success', message: 'Room deleted successfully' });
      setShowDeleteModal(false);
      setDeletingRoom(null);
      fetchRooms();
      fetchAccommodation(); // Refresh capacity stats
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete room. It may have active assignments.'
      });
    }
  };

  const getRoomOccupancy = (room) => {
    const assignmentCount = room.assignments?.filter(a => !a.released).length || 0;
    return {
      occupied: assignmentCount,
      available: (room.capacity || 0) - assignmentCount,
      percentage: room.capacity ? Math.round((assignmentCount / room.capacity) * 100) : 0
    };
  };

  const getGenderBadge = (gender) => {
    const variants = {
      MALE: { variant: 'info', label: 'Male Only' },
      FEMALE: { variant: 'error', label: 'Female Only' },
      MIXED: { variant: 'default', label: 'Mixed' },
    };
    const config = variants[gender] || { variant: 'default', label: 'No Restriction' };
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  if (loading) {
    return <PageSpinner message="Loading accommodation details..." />;
  }

  if (!accommodation) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-800">Accommodation Not Found</h1>
        <p className="text-gray-600 mt-2">The accommodation you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/accommodation')} className="mt-4">
          Back to Accommodations
        </Button>
      </div>
    );
  }

  // Calculate statistics
  const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
  const totalOccupied = rooms.reduce((sum, room) => {
    const occupancy = getRoomOccupancy(room);
    return sum + occupancy.occupied;
  }, 0);
  const totalAvailable = totalCapacity - totalOccupied;
  const occupancyPercentage = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/accommodation')}
            className="mb-4"
          >
            Back to Accommodations
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {accommodation.buildingName || accommodation.name}
          </h1>
          {accommodation.location && (
            <p className="text-gray-600 mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {accommodation.location}
            </p>
          )}
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => navigate(`/accommodation/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="error"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDeleteAccommodation}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
              </div>
              <Home className="w-8 h-8 text-gray-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Capacity</p>
                <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
              </div>
              <Bed className="w-8 h-8 text-gray-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Occupied</p>
                <p className="text-2xl font-bold text-primary-600">{totalOccupied}</p>
              </div>
              <Users className="w-8 h-8 text-primary-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{totalAvailable}</p>
              </div>
              <DoorOpen className="w-8 h-8 text-green-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Building Information */}
      <Card>
        <CardHeader>
          <CardTitle>Building Information</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Building Name</p>
              <p className="font-medium text-gray-900 mt-1">
                {accommodation.buildingName || accommodation.name}
              </p>
            </div>

            {accommodation.location && (
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium text-gray-900 mt-1">{accommodation.location}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600">Event</p>
              <p className="font-medium text-gray-900 mt-1">{accommodation.event?.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <div className="mt-1">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        occupancyPercentage >= 100 ? 'bg-red-500' :
                        occupancyPercentage >= 80 ? 'bg-yellow-500' :
                        occupancyPercentage >= 50 ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{occupancyPercentage}%</span>
                </div>
              </div>
            </div>

            {accommodation.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-900 mt-1">{accommodation.description}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Rooms List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rooms ({rooms.length})</CardTitle>
            {canManage && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => navigate(`/accommodation/${id}/rooms/new`)}
              >
                Add Room
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {rooms.length === 0 ? (
            <EmptyState
              icon={<Home className="w-12 h-12" />}
              title="No rooms added"
              description="Add rooms to this accommodation to start assigning participants"
              action={
                canManage && (
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/accommodation/${id}/rooms/new`)}
                  >
                    Add First Room
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map(room => {
                const occupancy = getRoomOccupancy(room);

                return (
                  <div 
                    key={room.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="space-y-3">
                      {/* Room Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">Room {room.roomNumber}</h3>
                          {room.floor && (
                            <p className="text-sm text-gray-500">Floor {room.floor}</p>
                          )}
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit className="w-3 h-3" />}
                              onClick={() => navigate(`/accommodation/${id}/rooms/${room.id}/edit`)}
                              title="Edit room"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 className="w-3 h-3 text-red-600" />}
                              onClick={() => {
                                setDeletingRoom(room);
                                setShowDeleteModal(true);
                              }}
                              title="Delete room"
                            />
                          </div>
                        )}
                      </div>

                      {/* Capacity */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Capacity</span>
                          <span className="font-medium text-gray-900">
                            {occupancy.occupied} / {room.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all ${
                              occupancy.percentage >= 100 ? 'bg-red-500' :
                              occupancy.percentage >= 80 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(occupancy.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Gender Restriction */}
                      {room.genderRestriction && (
                        <div>
                          {getGenderBadge(room.genderRestriction)}
                        </div>
                      )}

                      {/* Amenities */}
                      {room.amenities && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Amenities</p>
                          <p className="text-sm text-gray-900 line-clamp-2">{room.amenities}</p>
                        </div>
                      )}

                      {/* Assignments */}
                      {room.assignments && room.assignments.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-2">Current Occupants</p>
                          <div className="space-y-2">
                            {room.assignments
                              .filter(a => !a.released)
                              .slice(0, 2)
                              .map((assignment, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-semibold">
                                    {assignment.bedNumber}
                                  </div>
                                  <span className="text-gray-900 truncate">
                                    {assignment.registration?.participantFirstName} {assignment.registration?.participantLastName}
                                  </span>
                                </div>
                              ))}
                            {room.assignments.filter(a => !a.released).length > 2 && (
                              <p className="text-xs text-gray-500">
                                +{room.assignments.filter(a => !a.released).length - 2} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete Room Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingRoom(null);
        }}
        title="Delete Room"
        footer={
          <>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingRoom(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDeleteRoom}
            >
              Delete Room
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>Room {deletingRoom?.roomNumber}</strong>?
          </p>
          {deletingRoom?.assignments?.filter(a => !a.released).length > 0 && (
            <Alert
              type="warning"
              message={`This room has ${deletingRoom.assignments.filter(a => !a.released).length} active assignment(s). You must release all assignments before deleting.`}
            />
          )}
          <p className="text-sm text-gray-600">
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
