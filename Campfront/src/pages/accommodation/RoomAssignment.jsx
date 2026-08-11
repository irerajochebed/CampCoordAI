import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { accommodationApi, registrationApi } from '../../api';
import { 
  ArrowLeft,
  Search,
  UserPlus,
  Home,
  Bed,
  Users,
  User,
  Mail,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

export default function RoomAssignment() {
  const navigate = useNavigate();
  const { id: accommodationId } = useParams();
  const { user, isAdmin, isCoordinator } = useAuth();
  
  const [accommodation, setAccommodation] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [unassignedRegistrations, setUnassignedRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [bedNumber, setBedNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    fetchAccommodation();
    fetchRooms();
    fetchUnassignedRegistrations();
  }, [accommodationId]);

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

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await accommodationApi.getRoomsByAccommodation(accommodationId);
      if (response.data.success) {
        setRooms(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedRegistrations = async () => {
    try {
      if (!accommodation?.event?.id) return;
      
      // Fetch confirmed registrations for the event
      const response = await registrationApi.getByStatus(accommodation.event.id, 'CONFIRMED');
      if (response.data.success) {
        // Filter out those who already have accommodation
        const unassigned = (response.data.data || []).filter(reg => !reg.accommodation);
        setUnassignedRegistrations(unassigned);
      }
    } catch (error) {
      console.error('Error fetching unassigned registrations:', error);
    }
  };

  const handleOpenAssignModal = (room) => {
    setSelectedRoom(room);
    setSelectedRegistration(null);
    setBedNumber('');
    setShowAssignModal(true);
  };

  const handleAssignRoom = async () => {
    if (!selectedRegistration || !bedNumber) {
      setAlert({ type: 'error', message: 'Please select a participant and bed number' });
      return;
    }

    // Validate bed number
    const bedNum = parseInt(bedNumber);
    if (isNaN(bedNum) || bedNum < 1 || bedNum > selectedRoom.capacity) {
      setAlert({ 
        type: 'error', 
        message: `Bed number must be between 1 and ${selectedRoom.capacity}` 
      });
      return;
    }

    // Check if bed is already occupied
    const bedOccupied = selectedRoom.assignments?.some(
      a => !a.released && a.bedNumber === bedNum
    );
    if (bedOccupied) {
      setAlert({ type: 'error', message: `Bed ${bedNum} is already occupied` });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        registrationId: selectedRegistration.id,
        roomId: selectedRoom.id,
        bedNumber: bedNum
      };

      const response = await accommodationApi.assignRoom(payload);

      if (response.data.success) {
        setAlert({ 
          type: 'success', 
          message: 'Room assigned successfully' 
        });
        setShowAssignModal(false);
        fetchRooms();
        fetchUnassignedRegistrations();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to assign room'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseAssignment = async (assignmentId) => {
    if (!confirm('Release this room assignment?')) return;

    try {
      await accommodationApi.releaseAssignment(assignmentId);
      setAlert({ type: 'success', message: 'Assignment released successfully' });
      fetchRooms();
      fetchUnassignedRegistrations();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to release assignment'
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

  const getAvailableBeds = (room) => {
    const occupiedBeds = room.assignments
      ?.filter(a => !a.released)
      .map(a => a.bedNumber) || [];
    
    const allBeds = Array.from({ length: room.capacity || 0 }, (_, i) => i + 1);
    return allBeds.filter(bed => !occupiedBeds.includes(bed));
  };

  // Filter registrations
  const filteredRegistrations = unassignedRegistrations.filter(reg => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const name = `${reg.participantFirstName} ${reg.participantLastName}`.toLowerCase();
      if (!name.includes(searchLower) && !reg.participantEmail.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Gender filter (if room has restriction)
    if (genderFilter && selectedRoom?.genderRestriction) {
      // For now, we don't have gender in registration
      // This would need to be added to the backend
    }

    return true;
  });

  const genderOptions = [
    { value: '', label: 'All Genders' },
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' }
  ];

  if (loading) {
    return <PageSpinner message="Loading room assignment..." />;
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
        <h1 className="text-2xl font-bold text-gray-900">Room Assignment</h1>
        <p className="text-gray-600 mt-1">
          Assign participants to rooms in {accommodation?.buildingName || accommodation?.name}
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unassigned Participants</p>
                <p className="text-2xl font-bold text-orange-600">{unassignedRegistrations.length}</p>
              </div>
              <Users className="w-8 h-8 text-orange-400" />
            </div>
          </CardBody>
        </Card>

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
                <p className="text-sm text-gray-600">Available Beds</p>
                <p className="text-2xl font-bold text-green-600">
                  {rooms.reduce((sum, room) => sum + getRoomOccupancy(room).available, 0)}
                </p>
              </div>
              <Bed className="w-8 h-8 text-green-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Home className="w-12 h-12" />}
              title="No rooms available"
              description="Add rooms to this accommodation before assigning participants"
              action={
                <Button
                  variant="primary"
                  onClick={() => navigate(`/accommodation/${accommodationId}/rooms/new`)}
                >
                  Add Rooms
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rooms.map(room => {
            const occupancy = getRoomOccupancy(room);
            const availableBeds = getAvailableBeds(room);

            return (
              <Card key={room.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Room {room.roomNumber}</CardTitle>
                      {room.floor && (
                        <p className="text-sm text-gray-500">Floor {room.floor}</p>
                      )}
                    </div>
                    {room.genderRestriction && (
                      <Badge 
                        variant={
                          room.genderRestriction === 'MALE' ? 'info' :
                          room.genderRestriction === 'FEMALE' ? 'error' :
                          'default'
                        }
                      >
                        {room.genderRestriction}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {/* Capacity Bar */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Occupancy</span>
                        <span className="font-medium text-gray-900">
                          {occupancy.occupied} / {room.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            occupancy.percentage >= 100 ? 'bg-red-500' :
                            occupancy.percentage >= 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(occupancy.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {occupancy.available} beds available
                      </p>
                    </div>

                    {/* Current Assignments */}
                    {room.assignments && room.assignments.filter(a => !a.released).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Current Occupants</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {room.assignments
                            .filter(a => !a.released)
                            .map((assignment, index) => (
                              <div 
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                    {assignment.bedNumber}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-gray-900 truncate">
                                      {assignment.registration?.participantFirstName} {assignment.registration?.participantLastName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {assignment.registration?.participantEmail}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<X className="w-3 h-3 text-red-600" />}
                                  onClick={() => handleReleaseAssignment(assignment.id)}
                                  title="Release assignment"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Assign Button */}
                    {occupancy.available > 0 && (
                      <Button
                        variant="primary"
                        icon={<UserPlus className="w-4 h-4" />}
                        onClick={() => handleOpenAssignModal(room)}
                        className="w-full"
                      >
                        Assign Participant
                      </Button>
                    )}

                    {occupancy.available === 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <p className="text-sm text-red-700 font-medium">Room Full</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedRoom(null);
          setSelectedRegistration(null);
          setBedNumber('');
        }}
        title={`Assign to Room ${selectedRoom?.roomNumber}`}
        size="lg"
        footer={
          <>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowAssignModal(false);
                setSelectedRoom(null);
                setSelectedRegistration(null);
                setBedNumber('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={handleAssignRoom}
              loading={submitting}
              disabled={!selectedRegistration || !bedNumber}
            >
              Assign Room
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Room Info */}
          {selectedRoom && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">Room {selectedRoom.roomNumber}</p>
                {selectedRoom.genderRestriction && (
                  <Badge variant="info">{selectedRoom.genderRestriction} Only</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Capacity: {getRoomOccupancy(selectedRoom).occupied} / {selectedRoom.capacity} beds occupied
              </p>
              {selectedRoom.amenities && (
                <p className="text-xs text-gray-500 mt-1">{selectedRoom.amenities}</p>
              )}
            </div>
          )}

          {/* Bed Number Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bed Number <span className="text-red-500">*</span>
            </label>
            <Select
              value={bedNumber}
              onChange={(e) => setBedNumber(e.target.value)}
              options={[
                { value: '', label: 'Select bed number...' },
                ...getAvailableBeds(selectedRoom || {}).map(bed => ({
                  value: bed.toString(),
                  label: `Bed ${bed}`
                }))
              ]}
            />
            {selectedRoom && getAvailableBeds(selectedRoom).length === 0 && (
              <p className="text-sm text-red-600 mt-1">No beds available in this room</p>
            )}
          </div>

          {/* Participant Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Participant <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Participant List */}
            <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
              {filteredRegistrations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {unassignedRegistrations.length === 0 
                    ? 'All participants have been assigned rooms'
                    : 'No participants found matching your search'
                  }
                </div>
              ) : (
                filteredRegistrations.map(reg => (
                  <div
                    key={reg.id}
                    onClick={() => setSelectedRegistration(reg)}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 ${
                      selectedRegistration?.id === reg.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="participant"
                      checked={selectedRegistration?.id === reg.id}
                      onChange={() => {}}
                      className="w-4 h-4 text-primary-600"
                    />
                    <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {reg.participantFirstName[0]}{reg.participantLastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {reg.participantFirstName} {reg.participantLastName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{reg.participantEmail}</p>
                      {reg.participantPhone && (
                        <p className="text-xs text-gray-500">{reg.participantPhone}</p>
                      )}
                    </div>
                    <Badge variant="success">Confirmed</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Gender Warning */}
          {selectedRoom?.genderRestriction && selectedRoom.genderRestriction !== 'MIXED' && (
            <Alert
              type="warning"
              message={`This room is restricted to ${selectedRoom.genderRestriction.toLowerCase()} participants only. Please ensure the selected participant meets this requirement.`}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
