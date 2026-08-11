import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { userApi } from '../../api';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // New: filter by active status
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'PARTICIPANT',
    position: '',
    active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAll();
      
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch users'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.phone?.includes(searchTerm)
      );
    }

    // Filter by role
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Filter by status (active/inactive)
    if (statusFilter === 'ACTIVE') {
      filtered = filtered.filter((u) => u.active === true);
    } else if (statusFilter === 'INACTIVE') {
      filtered = filtered.filter((u) => u.active === false);
    }
    // If 'ALL', show both active and inactive

    setFilteredUsers(filtered);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      position: user.position || '',
      active: user.active
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      const response = await userApi.update(selectedUser.id, formData);
      
      if (response.data.success) {
        setAlert({ type: 'success', message: 'User updated successfully' });
        setShowEditModal(false);
        fetchUsers();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update user'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (userId) => {
    try {
      const response = await userApi.activate(userId);
      if (response.data.success) {
        setAlert({ type: 'success', message: 'User activated successfully' });
        fetchUsers();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to activate user'
      });
    }
  };

  const handleDeactivate = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
      const response = await userApi.deactivate(userId);
      if (response.data.success) {
        setAlert({ type: 'success', message: 'User deactivated successfully' });
        fetchUsers();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to deactivate user'
      });
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm(
      'Are you sure you want to SOFT DELETE this user?\n\n' +
      'This will:\n' +
      '• Mark the user as deleted in the system\n' +
      '• Keep the record in database for audit purposes\n' +
      '• User will NOT be able to login\n' +
      '• User will NOT appear in any lists\n\n' +
      'This action can only be reversed by database administrators.'
    )) return;
    
    try {
      const response = await userApi.delete(userId);
      if (response.data.success) {
        setAlert({ type: 'success', message: 'User deleted successfully (soft delete)' });
        fetchUsers();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete user'
      });
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      ADMINISTRATOR: 'danger',
      COORDINATOR: 'warning',
      PARTICIPANT: 'info',
    };
    return <Badge variant={variants[role] || 'default'}>{role}</Badge>;
  };

  const roleOptions = [
    { value: 'ALL', label: 'All Roles' },
    { value: 'ADMINISTRATOR', label: 'Administrator' },
    { value: 'COORDINATOR', label: 'Coordinator' },
    { value: 'PARTICIPANT', label: 'Participant' },
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active Only' },
    { value: 'INACTIVE', label: 'Inactive Only' },
  ];

  const positionOptions = [
    { value: '', label: 'No Position' },
    { value: 'UNION_ADMINISTRATOR', label: 'Union Administrator' },
    { value: 'DEPARTMENT_LEADER', label: 'Department Leader' },
    { value: 'FIELD_LEADER', label: 'Field Leader' },
    { value: 'PASTOR', label: 'Pastor / Local Church Leader' },
    { value: 'FINANCE_OFFICER', label: 'Finance Officer' },
    { value: 'CAMP_DIRECTOR', label: 'Camp Director' },
    { value: 'CAMP_SECRETARY', label: 'Camp Secretary' },
    { value: 'SPEAKER', label: 'Speaker' },
    { value: 'PA_TEAM', label: 'PA Team' },
  ];

  if (loading) {
    return <PageSpinner message="Loading users..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
          Add New User
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={roleOptions}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
            />
          </div>
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredUsers.length} User{filteredUsers.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardBody>
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title="No users found"
              description={
                searchTerm || roleFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'No users have been added yet'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id}
                    className={!user.active ? 'bg-gray-50 opacity-60' : ''}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {user.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.position ? (
                        <Badge variant="default">
                          {user.position.replace(/_/g, ' ')}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                          onClick={() => handleEdit(user)}
                          title="Edit user"
                        >
                          Edit
                        </Button>
                        
                        {user.active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<XCircle className="w-4 h-4 text-amber-600" />}
                            onClick={() => handleDeactivate(user.id)}
                            title="Deactivate user"
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<CheckCircle className="w-4 h-4 text-green-600" />}
                            onClick={() => handleActivate(user.id)}
                            title="Activate user"
                          >
                            Activate
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-red-600" />}
                          onClick={() => handleDelete(user.id)}
                          title="Delete user permanently"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdate}
              loading={submitting}
            >
              Update User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={roleOptions.filter(opt => opt.value !== 'ALL')}
            required
          />

          <Select
            label="Position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            options={positionOptions}
          />
        </div>
      </Modal>
    </div>
  );
}
