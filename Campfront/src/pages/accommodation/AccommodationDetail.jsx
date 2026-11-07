import React, { useState, useEffect } from 'react';
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
  DoorOpen,
  UserCheck,
  Calendar,
  Layers
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
  
  // Room delete modal
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [deletingRoomLoading, setDeletingRoomLoading] = useState(false);

  // Accommodation delete modal
  const [showDeleteAccModal, setShowDeleteAccModal] = useState(false);
  const [deletingAccLoading, setDeletingAccLoading] = useState(false);

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const isAccommodationOfficer = user?.position === 'ACCOMMODATION_OFFICER';
  const canManage = isUnionAdmin || isCoordinator || isAccommodationOfficer;

  useEffect(() => {
    if (user?.role === 'PARTICIPANT') {
      navigate('/app/accommodation', { replace: true });
      return;
    }
    fetchAccommodationData();
  }, [id, user]);

  const fetchAccommodationData = async () => {
    if (!id || id === 'undefined') {
      navigate('/app/accommodation');
      return;
    }
    try {
      setLoading(true);
      const [accRes, roomsRes] = await Promise.all([
        accommodationApi.getById(id),
        accommodationApi.getRoomsByAccommodation(id)
      ]);

      const accData = accRes.data?.data || accRes.data;
      const roomsData = roomsRes.data?.data || roomsRes.data || [];

      if (accData) {
        setAccommodation(accData);
        setRooms(Array.isArray(roomsData) ? roomsData : []);
      }
    } catch (error) {
      console.error('Failed to load accommodation:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch accommodation details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccommodation = async () => {
    try {
      setDeletingAccLoading(true);
      await accommodationApi.delete(id);
      setAlert({ type: 'success', message: 'Accommodation deleted successfully' });
      setShowDeleteAccModal(false);
      setTimeout(() => navigate('/app/accommodation'), 1000);
    } catch (error) {
      console.error('Failed to delete accommodation:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete accommodation. Make sure all occupants are checked out.'
      });
      setShowDeleteAccModal(false);
    } finally {
      setDeletingAccLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deletingRoom) return;
    try {
      setDeletingRoomLoading(true);
      await accommodationApi.deleteRoom(deletingRoom.id);
      setAlert({ type: 'success', message: `Room ${deletingRoom.roomNumber} deleted successfully` });
      setShowDeleteRoomModal(false);
      setDeletingRoom(null);
      fetchAccommodationData();
    } catch (error) {
      console.error('Failed to delete room:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete room. It may have active assignments.'
      });
      setShowDeleteRoomModal(false);
    } finally {
      setDeletingRoomLoading(false);
    }
  };

  const getGenderBadge = (gender) => {
    if (gender === 'MALE') return <Badge variant="info" size="sm">Male Only</Badge>;
    if (gender === 'FEMALE') return <Badge variant="danger" size="sm">Female Only</Badge>;
    if (gender === 'MIXED') return <Badge variant="default" size="sm">Mixed</Badge>;
    return <Badge variant="default" size="sm">Any Gender</Badge>;
  };

  if (loading) {
    return <PageSpinner message="Loading accommodation details..." />;
  }

  if (!accommodation) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Accommodation Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">The accommodation you are looking for does not exist.</p>
        <Button onClick={() => navigate('/app/accommodation')} className="mt-4">
          Back to Accommodations
        </Button>
      </div>
    );
  }

  // Calculate statistics
  const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0) || accommodation.totalCapacity || 0;
  const totalOccupied = rooms.reduce((sum, room) => {
    const activeAssignments = (room.assignments || []).filter(a => a.active !== false);
    return sum + activeAssignments.length;
  }, 0) || accommodation.occupiedCount || 0;
  const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
  const occupancyPercentage = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
            onClick={() => navigate('/app/accommodation')}
            className="mb-2 text-xs font-semibold"
          >
            Back to Accommodations
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {accommodation.buildingName || accommodation.name}
            </h1>
            {accommodation.buildingCode && (
              <Badge variant="info" size="sm">
                {accommodation.buildingCode}
              </Badge>
            )}
          </div>
          {accommodation.location && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{accommodation.location}</span>
            </p>
          )}
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              icon={<UserCheck className="w-4 h-4 mr-1.5" />}
              onClick={() => navigate(`/app/accommodation/${id}/assign`)}
            >
              Assign Rooms
            </Button>
            <Button
              variant="default"
              icon={<Plus className="w-4 h-4 mr-1.5" />}
              onClick={() => navigate(`/app/accommodation/${id}/rooms/new`)}
            >
              Add Room
            </Button>
            <Button
              variant="ghost"
              icon={<Edit className="w-4 h-4 mr-1.5" />}
              onClick={() => navigate(`/app/accommodation/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              icon={<Trash2 className="w-4 h-4 text-red-500" />}
              onClick={() => setShowDeleteAccModal(true)}
              className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
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
          dismissible
        />
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{rooms.length}</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
              <Home className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalCapacity}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Bed className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Occupied Beds</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totalOccupied}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Available Beds</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalAvailable}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DoorOpen className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Building Summary Card */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
            Building Details & Occupancy
          </CardTitle>
        </CardHeader>
        <CardBody className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Event</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                {accommodation.event?.name || 'Assigned Event'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Location Zone</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                {accommodation.location || 'Not Specified'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Overall Occupancy</p>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${
                      occupancyPercentage >= 100 ? 'bg-red-500' :
                      occupancyPercentage >= 75 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{occupancyPercentage}%</span>
              </div>
            </div>
          </div>

          {accommodation.description && (
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-gray-400 uppercase">Description</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{accommodation.description}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Rooms List */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
          <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
            Rooms in this Building ({rooms.length})
          </CardTitle>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4 mr-1" />}
              onClick={() => navigate(`/app/accommodation/${id}/rooms/new`)}
            >
              Add Room
            </Button>
          )}
        </CardHeader>
        <CardBody className="p-5">
          {rooms.length === 0 ? (
            <EmptyState
              icon={<Home className="w-12 h-12 text-gray-400" />}
              title="No rooms added yet"
              description="Start by adding rooms and their bed capacities to this accommodation building."
              action={
                canManage && (
                  <Button
                    variant="primary"
                    icon={<Plus className="w-4 h-4 mr-1.5" />}
                    onClick={() => navigate(`/app/accommodation/${id}/rooms/new`)}
                  >
                    Add First Room
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const activeAssignments = (room.assignments || []).filter(a => a.active !== false);
                const occupied = activeAssignments.length;
                const capacity = room.capacity || 0;
                const available = Math.max(0, capacity - occupied);
                const percent = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

                return (
                  <div 
                    key={room.id}
                    className="p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700/60 space-y-3 hover:border-blue-300 dark:hover:border-slate-600 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          Room {room.roomNumber}
                        </h3>
                        {room.floor && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">Floor: {room.floor}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {getGenderBadge(room.genderRestriction)}
                        {canManage && (
                          <>
                            <button
                              onClick={() => navigate(`/app/accommodation/${id}/rooms/${room.id}/edit`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                              title="Edit Room"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingRoom(room);
                                setShowDeleteRoomModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                              title="Delete Room"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Capacity Indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                        <span>Capacity</span>
                        <span className="font-bold">{occupied} / {capacity} Beds</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            percent >= 100 ? 'bg-red-500' :
                            percent >= 75 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {room.amenities && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {room.amenities}
                      </p>
                    )}

                    {/* Current Occupants */}
                    <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Occupants ({activeAssignments.length})
                      </p>
                      {activeAssignments.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No participants assigned</p>
                      ) : (
                        <div className="space-y-1">
                          {activeAssignments.slice(0, 3).map((a, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                              <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {a.bedNumber || i + 1}
                              </span>
                              <span className="truncate">
                                {a.registration?.participantFirstName 
                                  ? `${a.registration.participantFirstName} ${a.registration.participantLastName || ''}`
                                  : a.registration?.participant?.firstName
                                  ? `${a.registration.participant.firstName} ${a.registration.participant.lastName || ''}`
                                  : `Registration #${a.registration?.id || a.id}`}
                              </span>
                            </div>
                          ))}
                          {activeAssignments.length > 3 && (
                            <p className="text-[10px] text-gray-400 font-medium">
                              +{activeAssignments.length - 3} more
                            </p>
                          )}
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
        isOpen={showDeleteRoomModal}
        onClose={() => {
          setShowDeleteRoomModal(false);
          setDeletingRoom(null);
        }}
        title="Delete Room"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteRoomModal(false);
                setDeletingRoom(null);
              }}
              disabled={deletingRoomLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="w-4 h-4 mr-1.5" />}
              onClick={handleDeleteRoom}
              loading={deletingRoomLoading}
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete <strong>Room {deletingRoom?.roomNumber}</strong>?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            This will permanently remove this room and any historical assignments in it.
          </p>
        </div>
      </Modal>

      {/* Delete Accommodation Modal */}
      <Modal
        isOpen={showDeleteAccModal}
        onClose={() => setShowDeleteAccModal(false)}
        title="Delete Accommodation Building"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteAccModal(false)}
              disabled={deletingAccLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="w-4 h-4 mr-1.5" />}
              onClick={handleDeleteAccommodation}
              loading={deletingAccLoading}
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete accommodation <strong>{accommodation?.buildingName || accommodation?.name}</strong>?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            This will delete all rooms and assignments associated with this building.
          </p>
        </div>
      </Modal>
    </div>
  );
}
