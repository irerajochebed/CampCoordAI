import { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Shield, UserCheck, AlertTriangle, Building, Check, X } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import OrganizationUnitSelector from '../../components/ui/OrganizationUnitSelector';
import { userApi, organizationApi, departmentApi } from '../../api';

export default function EditUserModal({ isOpen, onClose, user, onUserUpdated }) {
  const { t } = useTranslation();
  const [role, setRole] = useState('PARTICIPANT');
  const [position, setPosition] = useState('');
  const [active, setActive] = useState(true);
  const [orgUnitData, setOrgUnitData] = useState({
    organizationUnitId: null,
    organizationUnitName: '',
  });
  const [departmentId, setDepartmentId] = useState('');
  const [sdaDistrict, setSdaDistrict] = useState('');
  
  const [departments, setDepartments] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);
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
      setDepartmentId(user.departmentId || '');
      setSdaDistrict(user.sdaDistrict || '');
      setAlert(null);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchOrgUnits();
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    try {
      const res = await departmentApi.getAll();
      setDepartments(res?.data?.data || []);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  const fetchOrgUnits = async () => {
    try {
      const res = await organizationApi.getAll();
      setOrgUnits(res?.data?.data || []);
    } catch (err) {
      console.error('Failed to load organization units', err);
    }
  };

  if (!user) return null;

  const roleOptions = [
    { value: 'PARTICIPANT', label: `${t('roles.PARTICIPANT', 'Participant')} (${t('users.participantHint', 'Church Member')})` },
    { value: 'COORDINATOR', label: `${t('roles.COORDINATOR', 'Coordinator')} (${t('users.coordinatorHint', 'Staff / Leader')})` },
    { value: 'ADMINISTRATOR', label: `${t('roles.ADMINISTRATOR', 'Administrator')} (${t('users.adminHint', 'Full Governance')})` },
  ];

  const positionOptions = [
    { value: '', label: t('users.noSpecificPosition', 'No Specific Position') },
    { value: 'UNION_ADMINISTRATOR', label: t('positions.UNION_ADMINISTRATOR', 'Union Administrator') },
    { value: 'UNION_LEADER', label: t('positions.UNION_LEADER', 'Union Leader') },
    { value: 'DEPARTMENT_LEADER', label: t('positions.DEPARTMENT_LEADER', 'Department Leader') },
    { value: 'MINISTRY_LEADER', label: t('positions.MINISTRY_LEADER', 'Ministry Leader') },
    { value: 'FIELD_LEADER', label: t('positions.FIELD_LEADER', 'Field Leader') },
    { value: 'DISTRICT_PASTOR', label: t('positions.DISTRICT_PASTOR', 'District Pastor') },
    { value: 'PASTOR', label: t('positions.PASTOR', 'Local Church Pastor') },
    { value: 'FINANCE_OFFICER', label: t('positions.FINANCE_OFFICER', 'Finance Officer') },
    { value: 'CAMP_DIRECTOR', label: t('positions.CAMP_DIRECTOR', 'Camp Director') },
    { value: 'CAMP_SECRETARY', label: t('positions.CAMP_SECRETARY', 'Camp Secretary') },
    { value: 'SPEAKER', label: t('positions.SPEAKER', 'Speaker / Evangelist') },
    { value: 'PA_TEAM', label: t('positions.PA_TEAM', 'PA & Sound Team') },
    { value: 'MEDIA_TEAM', label: t('positions.MEDIA_TEAM', 'Media & Broadcast Team') },
    { value: 'ACCOMMODATION_OFFICER', label: t('positions.ACCOMMODATION_OFFICER', 'Accommodation Officer') },
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
        departmentId: (position === 'DEPARTMENT_LEADER' || position === 'MINISTRY_LEADER') && departmentId ? parseInt(departmentId, 10) : null,
        governmentDistrict: null,
        sdaDistrict: (position === 'DISTRICT_PASTOR' || position === 'PASTOR') ? sdaDistrict.trim() : null,
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
        message: error.response?.data?.message || t('common.error', 'Failed to update user role and governance settings.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('users.editUserModalTitle', 'User Governance & Role Assignment')}
      size="lg"
      footer={
        <div className="flex justify-between w-full items-center">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting} icon={<Check className="w-4 h-4" />}>
            {t('users.saveChanges', 'Save Changes')}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* User Card Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              {user.firstName} {user.lastName}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email} • {user.phoneNumber || t('users.noPhone', 'No phone')}</p>
            {user.organizationUnitName && (
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-semibold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                {t('users.unitHeader', 'Current Unit')}: {user.organizationUnitName}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={user.role === 'ADMINISTRATOR' ? 'danger' : user.role === 'COORDINATOR' ? 'warning' : 'info'}>
              {t(`roles.${user.role}`, user.role)}
            </Badge>
            <Badge variant={user.active ? 'success' : 'danger'}>
              {user.active ? t('status.ACTIVE', 'Active') : t('status.INACTIVE', 'Inactive')}
            </Badge>
          </div>
        </div>

        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* Security Alert if promoting to Administrator */}
        {role === 'ADMINISTRATOR' && user.role !== 'ADMINISTRATOR' && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t('users.adminElevationTitle', 'Administrator Access Elevation')}</p>
              <p className="mt-0.5 leading-relaxed">{t('users.adminElevationDesc', 'This will grant global administrative privileges across all union fields, proposals, events, and user accounts.')}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                {t('users.systemRole', 'System Role')} <span className="text-red-500">*</span>
              </label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={roleOptions}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{t('users.roleHint', 'Controls portal login and system capabilities.')}</p>
            </div>

            {/* Position Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                {t('users.leadershipPosition', 'Leadership Position')}
              </label>
              <Select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                options={positionOptions}
              />
              <p className="text-xs text-gray-500 mt-1">{t('users.positionHint', 'Governs proposal review scope and departmental rights.')}</p>
            </div>
          </div>

          {/* Conditional Department Selection */}
          {(position === 'DEPARTMENT_LEADER' || position === 'MINISTRY_LEADER') && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                {t('users.assignMinistry', 'Assign Ministry/Department')}
              </label>
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                options={[
                  { value: '', label: t('users.selectMinistry', '-- Select Ministry/Department --') },
                  ...departments.map(d => ({ value: String(d.id), label: d.name }))
                ]}
              />
            </div>
          )}

          {/* Organization Unit Reassignment */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              {t('users.assignedUnit', 'Assigned Organization Unit (SDA Hierarchy)')}
            </label>
            <OrganizationUnitSelector
              value={orgUnitData}
              onChange={(newOrg) => {
                setOrgUnitData(newOrg);
                if (newOrg.districtName) {
                  setSdaDistrict(newOrg.districtName);
                }
              }}
            />
          </div>

          {/* Account Status Toggle */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              {t('common.status', 'Account Status')}
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
                <span className="text-sm font-medium text-gray-900">{t('users.activeStatus', 'Active (Access Allowed)')}</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="activeStatus"
                  checked={active === false}
                  onChange={() => setActive(false)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <span className="text-sm font-medium text-red-700">{t('users.inactiveStatus', 'Deactivated / Suspended')}</span>
              </label>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
