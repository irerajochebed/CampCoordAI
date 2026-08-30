import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventApi, userApi } from '../../api';
import { 
  ArrowLeft, 
  Plus, 
  Search,
  UserPlus,
  UserMinus,
  Mail,
  Phone,
  Shield
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function StaffAssignment() {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const { user, isAdmin } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [staffAssignments, setStaffAssignments] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [errors, setErrors] = useState({});

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  // Staff positions available for assignment
  const staffPositions = [
    { value: '', label: 'Select Position' },
    { value: 'CAMP_DIRECTOR', label: 'Camp Director' },
    { value: 'CAMP_SECRETARY', label: 'Camp Secretary' },
    { value: 'FINANCE_OFFICER', label: 'Finance Officer' },
    { value: 'SPEAKER', label: 'Speaker' },
    { value: 'PA_TEAM', label: 'PA Team Member' },
    { value: 'WORSHIP_LEADER', label: 'Worship Leader' },
    { value: 'REGISTRATION_DESK', label: 'Registration Desk' },
    { value: 'ACCOMMODATION_MANAGER', label: 'Accommodation Manager' },
    { value: 'RESOURCE_MANAGER', label: 'Resource Manager' },
  ];

  useEffect(() => {
    fetchEvent();
    fetchStaffAssignments();
    fetchAvailableUsers();
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
            message: 'You do not have permission to manage staff for this event'
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

  const fetchStaffAssignments = async () => {
    try {
      setLoading(true);
      const response = await eventApi.getStaff(eventId);
      if (response.data.success) {
        setStaffAssignments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching staff assignments:', error);
      // Don't show error alert if it's just empty (404)
      if (error.response?.status !== 404) {
        setAlert({
          type: 'error',
          message: 'Failed to fetch staff assignments'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Fetch all coordinators who can be assigned as staff
      const response = await userApi.getByRole('COORDINATOR');
      if (response.data.success) {
        setAvailableUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleAddStaff = () => {
    setSelectedPosition('');
    setSelectedUserId('');
    setErrors({});
    setShowModal(true);
  };

  const handleAssignStaff = async () => {
    // Validate
    const newErrors = {};
    if (!selectedPosition) {
      newErrors.position = 'Please select a position';
    }
    if (!selectedUserId) {
      newErrors.userId = 'Please select a staff member';
    }

    // Check if user is already assigned to this position
    const existingAssignment = staffAssignments.find(
      s => s.position === selectedPosition && s.user.id === parseInt(selectedUserId)
    );
    if (existingAssignment) {
      newErrors.userId = 'This user is already assigned to this position';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await eventApi.assignStaff(eventId, {
        userId: parseInt(selectedUserId),
        position: selectedPosition
      });

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: 'Staff member assigned successfully'
        });
        setShowModal(false);
        fetchStaffAssignments();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to assign staff member'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStaff = async (assignmentId, staffName, position) => {
    if (!confirm(`Remove ${staffName} from ${position.replace(/_/g, ' ')}?`)) return;

    try {
      await eventApi.removeStaffAssignment(assignmentId);
      setAlert({ 
        type: 'success', 
        message: 'Staff assignment removed successfully' 
      });
      fetchStaffAssignments();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to remove staff assignment'
      });
    }
  };

  // Group staff by position
  const groupedStaff = staffAssignments.reduce((acc, assignment) => {
    const position = assignment.position;
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(assignment);
    return acc;
  }, {});

  // Filter available users based on search
  const filteredUsers = availableUsers.filter(u => 
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPositionLabel = (position) => {
    const found = staffPositions.find(p => p.value === position);
    return found ? found.label : position.replace(/_/g, ' ');
  };

  const getPositionBadgeVariant = (position) => {
    const variants = {
      CAMP_DIRECTOR: 'error',
      CAMP_SECRETARY: 'warning',
      FINANCE_OFFICER: 'success',
      SPEAKER: 'info',
      PA_TEAM: 'default',
      WORSHIP_LEADER: 'info',
      REGISTRATION_DESK: 'default',
      ACCOMMODATION_MANAGER: 'warning',
      RESOURCE_MANAGER: 'success',
    };
    return variants[position] || 'default';
  };

  const canManage = isUnionAdmin || event?.coordinator?.id === user?.userId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(`/app/events/${eventId}`)}
            className="mb-4"
          >
            Back to Event
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Staff Assignment</h1>
          <p className="text-gray-600 mt-1">{event?.name}</p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={handleAddStaff}
          >
            Assign Staff
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

      {/* Staff List */}
      {staffAssignments.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Shield className="w-12 h-12" />}
              title="No staff assigned"
              description="Assign staff members to manage different aspects of the event"
              action={
                canManage && (
                  <Button variant="primary" onClick={handleAddStaff}>
                    Assign First Staff Member
                  </Button>
                )
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedStaff).map(position => (
            <Card key={position}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant={getPositionBadgeVariant(position)}>
                      {getPositionLabel(position)}
                    </Badge>
                    <span className="text-sm font-normal text-gray-500">
                      ({groupedStaff[position].length} assigned)
                    </span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {groupedStaff[position].map(assignment => (
                    <div 
                      key={assignment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                          {assignment.user.firstName[0]}{assignment.user.lastName[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {assignment.user.firstName} {assignment.user.lastName}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {assignment.user.email}
                            </span>
                            {assignment.user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {assignment.user.phone}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="default" size="sm">
                              {assignment.user.role}
                            </Badge>
                            {assignment.user.position && (
                              <Badge variant="info" size="sm">
                                {assignment.user.position}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<UserMinus className="w-4 h-4 text-red-600" />}
                          onClick={() => handleRemoveStaff(
                            assignment.id, 
                            `${assignment.user.firstName} ${assignment.user.lastName}`,
                            position
                          )}
                          title="Remove assignment"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Staff Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setErrors({});
        }}
        title="Assign Staff Member"
        size="lg"
        footer={
          <>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowModal(false);
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={handleAssignStaff}
              loading={submitting}
            >
              Assign Staff
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Position"
            value={selectedPosition}
            onChange={(e) => {
              setSelectedPosition(e.target.value);
              if (errors.position) setErrors(prev => ({ ...prev, position: '' }));
            }}
            options={staffPositions}
            error={errors.position}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Staff Member <span className="text-red-500">*</span>
            </label>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* User List */}
            <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No users found
                </div>
              ) : (
                filteredUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUserId(u.id.toString());
                      if (errors.userId) setErrors(prev => ({ ...prev, userId: '' }));
                    }}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 ${
                      selectedUserId === u.id.toString() ? 'bg-primary-50' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="staffMember"
                      value={u.id}
                      checked={selectedUserId === u.id.toString()}
                      onChange={() => {}}
                      className="w-4 h-4 text-primary-600"
                    />
                    <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default" size="sm">{u.role}</Badge>
                        {u.position && (
                          <Badge variant="info" size="sm">{u.position}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {errors.userId && (
              <p className="text-sm text-red-600 mt-1">{errors.userId}</p>
            )}
          </div>

          {selectedPosition && selectedUserId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>{availableUsers.find(u => u.id.toString() === selectedUserId)?.firstName} {availableUsers.find(u => u.id.toString() === selectedUserId)?.lastName}</strong> will be assigned as <strong>{getPositionLabel(selectedPosition)}</strong> for this event.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
