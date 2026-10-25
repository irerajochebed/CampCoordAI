import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Building, 
  CheckCircle, 
  Info, 
  MapPin 
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import OrganizationUnitSelector from '../../components/ui/OrganizationUnitSelector';
import { useTranslation } from '../../contexts/LanguageContext';
import { userApi, organizationApi, departmentApi } from '../../api';

export default function CreateCoordinatorModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    position: 'FIELD_LEADER',
    organizationUnitId: '',
    departmentId: '',
    sdaDistrict: '',
    password: '',
    gender: 'MALE',
    preferredLanguage: 'en'
  });

  const [orgUnits, setOrgUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingOrgUnits, setLoadingOrgUnits] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});

  // Fetch organization units and departments for assignment
  useEffect(() => {
    if (isOpen) {
      fetchOrgUnits();
      fetchDepartments();
      // Reset state
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        position: 'FIELD_LEADER',
        organizationUnitId: '',
        departmentId: '',
        sdaDistrict: '',
        password: '',
        gender: 'MALE',
        preferredLanguage: 'en'
      });
      setErrors({});
      setAlert(null);
    }
  }, [isOpen]);

  const fetchOrgUnits = async () => {
    try {
      setLoadingOrgUnits(true);
      const res = await organizationApi.getAll();
      const units = res?.data?.data || [];
      setOrgUnits(units);
      if (units.length > 0) {
        setFormData(prev => ({ ...prev, organizationUnitId: String(units[0].id) }));
      }
    } catch (err) {
      console.error('Failed to load organization units', err);
    } finally {
      setLoadingOrgUnits(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const res = await departmentApi.getAll();
      setDepartments(res?.data?.data || []);
    } catch (err) {
      console.error('Failed to load departments', err);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.position) newErrors.position = 'Position is required';
    if (!formData.organizationUnitId) newErrors.organizationUnitId = 'Assigned organization unit is required';
    
    if ((formData.position === 'DEPARTMENT_LEADER' || formData.position === 'MINISTRY_LEADER') && !formData.departmentId) {
      newErrors.departmentId = 'Ministry/Department assignment is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
        position: formData.position,
        organizationUnitId: parseInt(formData.organizationUnitId, 10),
        departmentId: (formData.position === 'DEPARTMENT_LEADER' || formData.position === 'MINISTRY_LEADER') && formData.departmentId ? parseInt(formData.departmentId, 10) : null,
        governmentDistrict: null,
        sdaDistrict: formData.sdaDistrict?.trim() || null,
        password: formData.password.trim() || 'Coord@2026',
        gender: formData.gender || null,
        preferredLanguage: formData.preferredLanguage || 'en'
      };

      const response = await userApi.provisionCoordinator(payload);

      if (response.data.success) {
        if (onSuccess) {
          onSuccess(response.data.data);
        }
        onClose();
      } else {
        setAlert({
          type: 'error',
          message: response.data.message || 'Failed to provision coordinator account.'
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred while creating coordinator.';
      setAlert({
        type: 'error',
        message: msg
      });
    } finally {
      setSubmitting(false);
    }
  };

  const positionOptions = [
    { value: 'FIELD_LEADER', label: t('positions.FIELD_LEADER', 'Field Leader / Conference Officer') },
    { value: 'DISTRICT_PASTOR', label: t('positions.DISTRICT_PASTOR', 'District Pastor') },
    { value: 'DEPARTMENT_LEADER', label: t('positions.DEPARTMENT_LEADER', 'Department Leader') },
    { value: 'MINISTRY_LEADER', label: t('positions.MINISTRY_LEADER', 'Ministry Leader') },
    { value: 'FINANCE_OFFICER', label: t('positions.FINANCE_OFFICER', 'Finance Officer') },
    { value: 'CAMP_SECRETARY', label: t('positions.CAMP_SECRETARY', 'Camp Secretary') },
    { value: 'CAMP_DIRECTOR', label: t('positions.CAMP_DIRECTOR', 'Camp Director') },
    { value: 'UNION_LEADER', label: t('positions.UNION_LEADER', 'Union Leader') },
    { value: 'UNION_ADMINISTRATOR', label: t('positions.UNION_ADMINISTRATOR', 'Union Administrator') },
    { value: 'PASTOR', label: t('positions.PASTOR', 'Local Pastor / Elder') },
    { value: 'ACCOMMODATION_OFFICER', label: t('positions.ACCOMMODATION_OFFICER', 'Accommodation Officer') },
    { value: 'SPEAKER', label: t('positions.SPEAKER', 'Speaker / Evangelist') },
    { value: 'PA_TEAM', label: t('positions.PA_TEAM', 'PA & Sound Team') },
    { value: 'MEDIA_TEAM', label: t('positions.MEDIA_TEAM', 'Media & Broadcast Team') },
  ];

  const genderOptions = [
    { value: 'MALE', label: t('auth.male', 'Male') },
    { value: 'FEMALE', label: t('auth.female', 'Female') },
  ];

  const orgUnitOptions = orgUnits.map(unit => ({
    value: String(unit.id),
    label: `${unit.name} (${unit.level}${unit.code ? ` - ${unit.code}` : ''})`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('users.provisionModalTitle', 'Provision New Coordinator')}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5">
            <Info className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>{t('users.defaultPasswordNote', 'Default initial password:')} <strong className="text-slate-800 dark:text-white">Coord@2026</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              icon={<ShieldCheck className="w-4 h-4" />}
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              {t('users.provisionAccount', 'Provision Account')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner Note */}
        <div className="bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60 rounded-xl p-3.5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary-700 dark:text-primary-400 shrink-0 mt-0.5" />
          <div className="text-xs text-primary-900 dark:text-primary-200 leading-relaxed">
            {t('users.provisionModalDesc', 'Administrator Action: This form directly creates an active COORDINATOR account with leadership privileges. The user will be assigned to manage events and approvals for their assigned unit.')}
          </div>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('auth.firstName', 'First Name')}
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              icon={<User className="w-4 h-4" />}
              placeholder="e.g. Samuel"
              required
            />
            <Input
              label={t('auth.lastName', 'Last Name')}
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              icon={<User className="w-4 h-4" />}
              placeholder="e.g. Mugisha"
              required
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('auth.email', 'Email Address')}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={<Mail className="w-4 h-4" />}
              placeholder="coordinator@rum.adventist.org"
              required
            />
            <Input
              label={t('auth.phone', 'Phone Number')}
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              error={errors.phoneNumber}
              icon={<Phone className="w-4 h-4" />}
              placeholder="+250788000000"
            />
          </div>

          {/* Position & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t('profile.position', 'Leadership Position')}
              name="position"
              value={formData.position}
              onChange={handleChange}
              error={errors.position}
              options={positionOptions}
              required
            />
            <Select
              label={t('auth.gender', 'Gender')}
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={genderOptions}
            />
          </div>

          {/* Conditional Department Selection */}
          {(formData.position === 'DEPARTMENT_LEADER' || formData.position === 'MINISTRY_LEADER') && (
            <div className="animate-fadeIn">
              <Select
                label={t('profile.department', 'Assign Ministry/Department')}
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                error={errors.departmentId}
                options={[
                  { value: '', label: '-- Select Ministry/Department --' },
                  ...departments.map(d => ({ value: String(d.id), label: d.name }))
                ]}
                required
              />
            </div>
          )}

          {/* Assigned Organization Unit Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('profile.orgUnit', 'Assigned Organization Unit')} <span className="text-rose-500">*</span>
            </label>
            <OrganizationUnitSelector
              showChurch={false}
              value={{
                districtId: formData.organizationUnitId,
                organizationUnitId: formData.organizationUnitId
              }}
              onChange={({ organizationUnitId, districtId, fieldId, districtName }) => {
                const targetId = districtId || organizationUnitId || fieldId || '';
                setFormData(prev => ({ 
                  ...prev, 
                  organizationUnitId: targetId,
                  sdaDistrict: districtName || prev.sdaDistrict
                }));
                if (errors.organizationUnitId) {
                  setErrors(prev => ({ ...prev, organizationUnitId: '' }));
                }
              }}
              error={errors.organizationUnitId}
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {formData.position === 'DISTRICT_PASTOR' 
                ? 'Select North Rwanda Field (NRF), then choose the specific SDA District this pastor presides over.' 
                : 'The coordinator will have leadership and review jurisdiction over events in this unit.'}
            </p>
          </div>

          {/* Optional Password */}
          <div>
            <Input
              label="Initial Password (Optional)"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock className="w-4 h-4" />}
              placeholder="Leave blank for default (Coord@2026)"
              helperText="If blank, system will set password to 'Coord@2026'. The coordinator can change it upon sign in."
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}
