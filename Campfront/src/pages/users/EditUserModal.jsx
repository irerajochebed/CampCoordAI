import { useState, useEffect } from 'react';
import { Shield, UserCheck, AlertTriangle, Building, Check, X } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import OrganizationUnitSelector from '../../components/ui/OrganizationUnitSelector';
import { userApi } from '../../api';

export default function EditUserModal({ isOpen, onClose, user, onUserUpdated }) {
  const [role, setRole] = useState('PARTICIPANT');
  const [position, setPosition] = useState('');
  const [active, setActive] = useState(true);
  const [orgUnitData, setOrgUnitData] = useState({
    organizationUnitId: null,
    organizationUnitName: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (user) {
      setRole(user.role || 'PARTICIPANT');
      setPosition(user.position || '');
      setActive(user.active !== undefined ? user.active : true);
      setOrgUnitData({
        organizationUnitId: user.organizationUnitId || null,
        organizationUnitName: user.organizationUnitName || '',
      });
      setAlert(null);
    }
  }, [user, isOpen]);

  if (!user) return null;

  const roleOptions = [
    { value: 'PARTICIPANT', label: 'Participant (Church Member)' },
    { value: 'COORDINATOR', label: 'Coordinator (Staff / Leader)' },
    { value: 'ADMINISTRATOR', label: 'Administrator (Full Governance)' },
  ];

  const positionOptions = [
    { value: '', label: 'No Specific Position' },
    { value: 'UNION_ADMINISTRATOR', label: 'Union Administrator' },
    { value: 'DEPARTMENT_LEADER', label: 'Department Leader' },
    { value: 'FIELD_LEADER', label: 'Field Leader' },
    { value: 'DISTRICT_PASTOR', label: 'District Pastor' },
    { value: 'PASTOR', label: 'Local Church Pastor' },
    { value: 'FINANCE_OFFICER', label: 'Finance Officer' },
    { value: 'CAMP_DIRECTOR', label: 'Camp Director' },
    { value: 'CAMP_SECRETARY', label: 'Camp Secretary' },
    { value: 'SPEAKER', label: 'Speaker' },
    { value: 'PA_TEAM', label: 'PA Team' },
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setSubmitting(true);
    setAlert(null);

    try {
      const payload = {
        role,
        position: position || null,
        organizationUnitId: orgUnitData.organizationUnitId || null,
        active,
      };

      const response = await userApi.updateRolePosition(user.id, payload);
      if (response.data.success) {
        if (onUserUpdated) {
          onUserUpdated(response.data.data);
        }
        onClose();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update user role and governance settings.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Governance & Role Assignment"
      size="lg"
      footer={
        <div className="flex justify-between w-full items-center">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting} icon={<Check className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* User Card Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 text-base">
              {user.firstName} {user.lastName}
            </h4>
            <p className="text-xs text-gray-500">{user.email} • {user.phoneNumber || 'No phone'}</p>
            {user.organizationUnitName && (
              <p className="text-xs text-blue-600 mt-1 font-medium flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                Current Unit: {user.organizationUnitName}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={user.role === 'ADMINISTRATOR' ? 'danger' : user.role === 'COORDINATOR' ? 'warning' : 'info'}>
              {user.role}
            </Badge>
            <Badge variant={user.active ? 'success' : 'danger'}>
              {user.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* Security Alert if promoting to Administrator */}
        {role === 'ADMINISTRATOR' && user.role !== 'ADMINISTRATOR' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Administrator Access Elevation</p>
              <p>This will grant global administrative privileges across all union fields, proposals, events, and user accounts.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                System Role <span className="text-red-500">*</span>
              </label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={roleOptions}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Controls portal login and system capabilities.</p>
            </div>

            {/* Position Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Leadership Position
              </label>
              <Select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                options={positionOptions}
              />
              <p className="text-xs text-gray-500 mt-1">Governs proposal review scope and departmental rights.</p>
            </div>
          </div>

          {/* Organization Unit Reassignment */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Assigned Organization Unit
            </label>
            <OrganizationUnitSelector
              value={orgUnitData}
              onChange={(newOrg) => {
                setOrgUnitData(newOrg);
              }}
            />
          </div>

          {/* Account Status Toggle */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Account Status
            </label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="activeStatus"
                  checked={active === true}
                  onChange={() => setActive(true)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-900">Active (Access Allowed)</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="activeStatus"
                  checked={active === false}
                  onChange={() => setActive(false)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <span className="text-sm font-medium text-red-700">Deactivated / Suspended</span>
              </label>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
