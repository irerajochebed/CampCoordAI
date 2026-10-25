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
  UserCog,
  BookOpen,
  Church,
  Award,
  RefreshCw,
  Phone,
  Mail
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
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
  const [leadershipCategory, setLeadershipCategory] = useState('ALL'); // 'ALL', 'DISTRICT_PASTORS', 'MINISTRY_DIRECTORS', 'OFFICERS'
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
  }, [searchTerm, leadershipCategory, roleFilter, positionFilter, statusFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAll();
      if (response.data.success) {
        setUsers(response.data.data || []);
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

    // Quick Leadership Category Filter
    if (leadershipCategory === 'DISTRICT_PASTORS') {
      filtered = filtered.filter(u => 
        u.position === 'DISTRICT_PASTOR' || 
        u.position === 'PASTOR' ||
        u.sdaDistrict != null ||
        (u.organizationUnitName && u.organizationUnitName.toLowerCase().includes('district'))
      );
    } else if (leadershipCategory === 'MINISTRY_DIRECTORS') {
      filtered = filtered.filter(u => 
        u.position === 'DEPARTMENT_LEADER' || 
        u.position === 'MINISTRY_LEADER' ||
        u.departmentId != null ||
        u.departmentName != null
      );
    } else if (leadershipCategory === 'OFFICERS') {
      filtered = filtered.filter(u => 
        u.position === 'FIELD_LEADER' || 
        u.position === 'UNION_LEADER' || 
        u.position === 'UNION_ADMINISTRATOR' || 
        u.position === 'FINANCE_OFFICER' ||
        u.role === 'ADMINISTRATOR'
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(term) ||
          u.lastName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.phoneNumber?.includes(term) ||
          u.organizationUnitName?.toLowerCase().includes(term) ||
          u.departmentName?.toLowerCase().includes(term) ||
          u.sdaDistrict?.toLowerCase().includes(term) ||
          u.governmentDistrict?.toLowerCase().includes(term) ||
          u.position?.toLowerCase().includes(term)
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
    return <Badge variant={variants[role] || 'default'} size="sm">{t(`roles.${role}`, role)}</Badge>;
  };

  const roleOptions = [
    { value: 'ALL', label: t('users.allRoles', 'All Roles') },
    { value: 'ADMINISTRATOR', label: t('roles.ADMINISTRATOR', 'Administrator') },
    { value: 'COORDINATOR', label: t('roles.COORDINATOR', 'Coordinator') },
    { value: 'PARTICIPANT', label: t('roles.PARTICIPANT', 'Participant') },
  ];

  const statusOptions = [
    { value: 'ALL', label: t('users.allStatuses', 'All Status') },
    { value: 'ACTIVE', label: t('users.activeOnly', 'Active Only') },
    { value: 'INACTIVE', label: t('users.inactiveOnly', 'Inactive Only') },
  ];

  const positionFilterOptions = [
    { value: 'ALL', label: t('users.allPositions', 'All Positions') },
    { value: 'DISTRICT_PASTOR', label: t('positions.DISTRICT_PASTOR', 'District Pastor') },
    { value: 'DEPARTMENT_LEADER', label: t('positions.DEPARTMENT_LEADER', 'Department Leader') },
    { value: 'MINISTRY_LEADER', label: t('positions.MINISTRY_LEADER', 'Ministry Leader') },
    { value: 'FIELD_LEADER', label: t('positions.FIELD_LEADER', 'Field Leader / President') },
    { value: 'UNION_LEADER', label: t('positions.UNION_LEADER', 'Union Leader') },
    { value: 'UNION_ADMINISTRATOR', label: t('positions.UNION_ADMINISTRATOR', 'Union Administrator') },
    { value: 'PASTOR', label: t('positions.PASTOR', 'Pastor') },
    { value: 'LOCAL_CHURCH_LEADER', label: t('positions.LOCAL_CHURCH_LEADER', 'Local Church Leader') },
    { value: 'FINANCE_OFFICER', label: t('positions.FINANCE_OFFICER', 'Finance Officer') },
    { value: 'CAMP_DIRECTOR', label: t('positions.CAMP_DIRECTOR', 'Camp Director') },
    { value: 'CAMP_SECRETARY', label: t('positions.CAMP_SECRETARY', 'Camp Secretary') },
    { value: 'SPEAKER', label: t('positions.SPEAKER', 'Speaker / Evangelist') },
    { value: 'PA_TEAM', label: t('positions.PA_TEAM', 'PA & Sound Team') },
    { value: 'MEDIA_TEAM', label: t('positions.MEDIA_TEAM', 'Media & Broadcast Team') },
    { value: 'ACCOMMODATION_OFFICER', label: t('positions.ACCOMMODATION_OFFICER', 'Accommodation Officer') },
  ];

  // Calculate statistics
  const totalCount = users.length;
  const districtPastorCount = users.filter(u => u.position === 'DISTRICT_PASTOR' || u.position === 'PASTOR').length;
  const ministryLeaderCount = users.filter(u => u.position === 'DEPARTMENT_LEADER' || u.position === 'MINISTRY_LEADER' || u.departmentName).length;
  const officerCount = users.filter(u => u.position === 'FIELD_LEADER' || u.position === 'UNION_LEADER' || u.position === 'UNION_ADMINISTRATOR').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('users.title', 'Leadership & User Governance Directory')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{t('users.subtitle', 'Complete register of Rwanda Union Mission (RUM) leaders, field officers, ministry directors, and district pastors across 8 fields')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchUsers}
            disabled={loading}
          >
            {t('common.refresh', 'Refresh')}
          </Button>
          <Button 
            variant="primary" 
            icon={<ShieldCheck className="w-4 h-4" />}
            onClick={() => setShowCreateCoordinatorModal(true)}
            className="shadow-sm"
          >
            {t('users.provisionCoordinator', 'Provision Coordinator')}
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

      {/* Leadership Directory Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setLeadershipCategory('ALL')} 
          className={`card p-4 cursor-pointer transition-all border-2 ${leadershipCategory === 'ALL' ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/40 shadow-xs' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('users.allUsers', 'All Users')}</span>
            <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">{totalCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t('users.allUsersDesc', 'Total registered accounts')}</p>
        </div>

        <div 
          onClick={() => setLeadershipCategory('DISTRICT_PASTORS')} 
          className={`card p-4 cursor-pointer transition-all border-2 ${leadershipCategory === 'DISTRICT_PASTORS' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">{t('users.districtPastors', 'District Pastors')}</span>
            <Church className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-300 mt-1.5">{districtPastorCount}</p>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">{t('users.districtPastorsDesc', 'Field Districts & Pastoral Network')}</p>
        </div>

        <div 
          onClick={() => setLeadershipCategory('MINISTRY_DIRECTORS')} 
          className={`card p-4 cursor-pointer transition-all border-2 ${leadershipCategory === 'MINISTRY_DIRECTORS' ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{t('users.ministryLeaders', 'Ministry Leaders')}</span>
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-300 mt-1.5">{ministryLeaderCount}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">{t('users.ministryLeadersDesc', 'Official RUM Ministries')}</p>
        </div>

        <div 
          onClick={() => setLeadershipCategory('OFFICERS')} 
          className={`card p-4 cursor-pointer transition-all border-2 ${leadershipCategory === 'OFFICERS' ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/40 shadow-xs' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">{t('users.fieldOfficers', 'Field & Union Officers')}</span>
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-900 dark:text-amber-300 mt-1.5">{officerCount}</p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{t('users.fieldOfficersDesc', 'Union & Field Executive Officers')}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder={t('users.searchPlaceholder', 'Search name, pastor, email, district, ministry...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              options={positionFilterOptions}
            />
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
          <div className="flex items-center justify-between">
            <CardTitle>
              {filteredUsers.length} {t('users.leadersListed', 'Leaders & Users Listed')}
              {leadershipCategory !== 'ALL' && (
                <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/70 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60">
                  {leadershipCategory.replace('_', ' ')}
                </span>
              )}
            </CardTitle>
            {(leadershipCategory !== 'ALL' || roleFilter !== 'ALL' || positionFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLeadershipCategory('ALL');
                  setRoleFilter('ALL');
                  setPositionFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchTerm('');
                }}
              >
                {t('users.resetFilters', 'Reset All Filters')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody className="p-0 sm:p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <div className="w-7 h-7 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <span className="text-sm font-medium">{t('users.fetching', 'Fetching directory records...')}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title={t('users.noUsersFound', 'No leaders or users found')}
              description={
                searchTerm || roleFilter !== 'ALL' || positionFilter !== 'ALL' || statusFilter !== 'ALL' || leadershipCategory !== 'ALL'
                  ? t('users.noUsersDesc', 'Try adjusting your search criteria or resetting filters')
                  : t('users.noUsersFound', 'No users have been registered yet')
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.nameHeader', 'Leader / Member Name')}</TableHead>
                  <TableHead>{t('users.contactHeader', 'Contact Info')}</TableHead>
                  <TableHead>{t('users.positionHeader', 'Position & Role')}</TableHead>
                  <TableHead>{t('users.unitHeader', 'Assigned Unit / District')}</TableHead>
                  <TableHead>{t('users.ministryHeader', 'Assigned Ministry')}</TableHead>
                  <TableHead>{t('users.statusHeader', 'Status')}</TableHead>
                  <TableHead className="text-right">{t('users.actionsHeader', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id}
                    className={!user.active ? 'opacity-50' : ''}
                  >
                    {/* Name & ID */}
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          ID: #{user.id}
                        </p>
                      </div>
                    </TableCell>

                    {/* Contact Info */}
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                          <span>{user.email}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                          <span>{user.phoneNumber || user.phone || '—'}</span>
                        </p>
                      </div>
                    </TableCell>

                    {/* Position & Role Badges */}
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {user.position ? (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                            user.position === 'DISTRICT_PASTOR' || user.position === 'PASTOR'
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60' 
                              : user.position === 'DEPARTMENT_LEADER' || user.position === 'MINISTRY_LEADER'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                              : user.position === 'FIELD_LEADER' || user.position === 'UNION_LEADER' || user.position === 'UNION_ADMINISTRATOR'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            {t(`positions.${user.position}`, user.position.replace(/_/g, ' '))}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">—</span>
                        )}
                        {getRoleBadge(user.role)}
                      </div>
                    </TableCell>

                    {/* Assigned Unit */}
                    <TableCell>
                      {user.organizationUnitName || user.sdaDistrict ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
                          <Building className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                          <span>{user.organizationUnitName || user.sdaDistrict}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs italic">—</span>
                      )}
                    </TableCell>

                    {/* Assigned Ministry */}
                    <TableCell>
                      {user.departmentName ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-1 rounded-lg">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{user.departmentName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {user.active ? (
                        <Badge variant="success" size="sm">{t('status.ACTIVE', 'Active')}</Badge>
                      ) : (
                        <Badge variant="danger" size="sm">{t('status.INACTIVE', 'Inactive')}</Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={<UserCog className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
                          onClick={() => handleEdit(user)}
                          title={t('users.editUser', 'Manage User Role & Position')}
                          className="font-semibold"
                        >
                          {t('common.edit', 'Edit')}
                        </Button>
                        
                        {user.active ? (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title={t('users.deactivate', 'Deactivate user')}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(user.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title={t('users.activate', 'Activate user')}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title={t('users.deleteUser', 'Soft delete user account')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
