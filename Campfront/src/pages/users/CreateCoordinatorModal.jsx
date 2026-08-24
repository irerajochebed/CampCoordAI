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
import { userApi, organizationApi } from '../../api';

export default function CreateCoordinatorModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    position: 'FIELD_LEADER',
    organizationUnitId: '',
    password: '',
    gender: 'MALE',
    preferredLanguage: 'en'
  });

  const [orgUnits, setOrgUnits] = useState([]);
  const [loadingOrgUnits, setLoadingOrgUnits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});

  // Fetch organization units (Unions, Fields, Districts) for assignment
  useEffect(() => {
    if (isOpen) {
      fetchOrgUnits();
      // Reset state
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        position: 'FIELD_LEADER',
        organizationUnitId: '',
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
    { value: 'FIELD_LEADER', label: 'Field Leader / Conference Officer' },
    { value: 'DISTRICT_PASTOR', label: 'District Pastor' },
    { value: 'DEPARTMENT_LEADER', label: 'Department Leader' },
    { value: 'FINANCE_OFFICER', label: 'Finance Officer' },
    { value: 'CAMP_SECRETARY', label: 'Camp Secretary' },
    { value: 'CAMP_DIRECTOR', label: 'Camp Director' },
    { value: 'UNION_LEADER', label: 'Union Leader' },
    { value: 'UNION_ADMINISTRATOR', label: 'Union Administrator' },
    { value: 'PASTOR', label: 'Local Pastor / Elder' },
    { value: 'ACCOMMODATION_OFFICER', label: 'Accommodation Officer' },
    { value: 'SPEAKER', label: 'Speaker / Evangelist' },
    { value: 'PA_TEAM', label: 'PA & Media Team' },
  ];

  const genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
  ];

  const orgUnitOptions = orgUnits.map(unit => ({
    value: String(unit.id),
    label: `${unit.name} (${unit.level}${unit.code ? ` - ${unit.code}` : ''})`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Provision New Coordinator"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center text-xs text-gray-500 gap-1.5">
            <Info className="w-4 h-4 text-primary-600" />
            <span>Default initial password: <strong>Coord@2026</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<ShieldCheck className="w-4 h-4" />}
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              Provision Account
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner Note */}
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary-700 shrink-0 mt-0.5" />
          <div className="text-xs text-primary-900 leading-relaxed">
            <strong>Administrator Action:</strong> This form directly creates an active <strong>COORDINATOR</strong> account with leadership privileges. The user will be assigned to manage events and approvals for their assigned unit.
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
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              icon={<User className="w-4 h-4" />}
              placeholder="e.g. Samuel"
              required
            />
            <Input
              label="Last Name"
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
              label="Email Address"
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
              label="Phone Number"
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
              label="Leadership Position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              error={errors.position}
              options={positionOptions}
              required
            />
            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={genderOptions}
            />
          </div>

          {/* Assigned Organization Unit Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Assigned Organization Unit (Conference Field / Evangelical District) <span className="text-red-500">*</span>
            </label>
            <OrganizationUnitSelector
              showChurch={false}
              value={{
                districtId: formData.organizationUnitId,
                organizationUnitId: formData.organizationUnitId
              }}
              onChange={({ organizationUnitId, districtId, fieldId }) => {
                const targetId = organizationUnitId || districtId || fieldId || '';
                setFormData(prev => ({ ...prev, organizationUnitId: targetId }));
                if (errors.organizationUnitId) {
                  setErrors(prev => ({ ...prev, organizationUnitId: '' }));
                }
              }}
              error={errors.organizationUnitId}
              required
            />
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              The coordinator will have jurisdiction over events and proposals for this unit.
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
