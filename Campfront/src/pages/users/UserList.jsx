import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Building,
  UserCog
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { userApi } from '../../api';
import CreateCoordinatorModal from './CreateCoordinatorModal';
import EditUserModal from './EditUserModal';
import { useTranslation } from '../../contexts/LanguageContext';

export default function UserList() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateCoordinatorModal, setShowCreateCoordinatorModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alert, setAlert] = useState(null);

  const handleCoordinatorCreated = (newCoordinator) => {
    setAlert({
      type: 'success',
      message: `Coordinator account for ${newCoordinator.firstName} ${newCoordinator.lastName} (${newCoordinator.position?.replace(/_/g, ' ') || 'Coordinator'}) provisioned successfully!`
    });
    fetchUsers();
  };

  const handleUserUpdated = (updatedUser) => {
    setAlert({
      type: 'success',
      message: `User ${updatedUser.firstName} ${updatedUser.lastName} updated successfully!`
    });
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, positionFilter, statusFilter, users]);

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
          u.phoneNumber?.includes(searchTerm) ||
          u.organizationUnitName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Filter by position
    if (positionFilter !== 'ALL') {
      filtered = filtered.filter((u) => u.position === positionFilter);
    }

    // Filter by status (active/inactive)
    if (statusFilter === 'ACTIVE') {
      filtered = filtered.filter((u) => u.active === true);
    } else if (statusFilter === 'INACTIVE') {
      filtered = filtered.filter((u) => u.active === false);
    }

    setFilteredUsers(filtered);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
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

  const positionFilterOptions = [
    { value: 'ALL', label: 'All Positions' },
    { value: 'UNION_ADMINISTRATOR', label: 'Union Administrator' },
    { value: 'DEPARTMENT_LEADER', label: 'Department Leader' },
    { value: 'FIELD_LEADER', label: 'Field Leader' },
    { value: 'DISTRICT_PASTOR', label: 'District Pastor' },
    { value: 'PASTOR', label: 'Local Pastor' },
    { value: 'FINANCE_OFFICER', label: 'Finance Officer' },
    { value: 'CAMP_DIRECTOR', label: 'Camp Director' },
    { value: 'CAMP_SECRETARY', label: 'Camp Secretary' },
    { value: 'SPEAKER', label: 'Speaker' },
    { value: 'PA_TEAM', label: 'PA Team' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management & Governance</h1>
          <p className="text-gray-600 mt-1">Manage system accounts, leadership positions, permissions, and organization units</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            icon={<ShieldCheck className="w-4 h-4" />}
            onClick={() => setShowCreateCoordinatorModal(true)}
            className="shadow-sm"
          >
            Provision Coordinator
          </Button>
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search name, email, phone, unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={roleOptions}
            />
            <Select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              options={positionFilterOptions}
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
          <div className="flex items-center justify-between">
            <CardTitle>
              {filteredUsers.length} User{filteredUsers.length !== 1 ? 's' : ''} Listed
            </CardTitle>
            {(roleFilter !== 'ALL' || positionFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRoleFilter('ALL');
                  setPositionFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchTerm('');
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching users...</span>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title="No users found"
              description={
                searchTerm || roleFilter !== 'ALL' || positionFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'No users have been registered yet'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User / Member</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role & Position</TableHead>
                  <TableHead>Organization Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Governance Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id}
                    className={!user.active ? 'bg-gray-50/70 opacity-60' : ''}
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          UID: #{user.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-800">{user.email}</p>
                      <p className="text-xs text-gray-500">{user.phoneNumber || user.phone || 'No phone'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {getRoleBadge(user.role)}
                        {user.position && (
                          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {user.position.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.organizationUnitName ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                          <Building className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span>{user.organizationUnitName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Unassigned</span>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<UserCog className="w-4 h-4 text-blue-600" />}
                          onClick={() => handleEdit(user)}
                          title="Manage User Role & Position"
                        >
                          Govern
                        </Button>
                        
                        {user.active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<XCircle className="w-4 h-4 text-amber-600" />}
                            onClick={() => handleDeactivate(user.id)}
                            title="Deactivate user"
                          />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<CheckCircle className="w-4 h-4 text-green-600" />}
                            onClick={() => handleActivate(user.id)}
                            title="Activate user"
                          />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-red-600" />}
                          onClick={() => handleDelete(user.id)}
                          title="Soft delete user account"
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

      {/* Edit User Governance Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />

      {/* Provision Coordinator Modal */}
      <CreateCoordinatorModal
        isOpen={showCreateCoordinatorModal}
        onClose={() => setShowCreateCoordinatorModal(false)}
        onSuccess={handleCoordinatorCreated}
      />
    </div>
  );
}
