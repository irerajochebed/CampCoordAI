import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { proposalApi, departmentApi, organizationApi } from '../../api';
import { FileText, Save, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';

import OrganizationUnitSelector from '../../components/ui/OrganizationUnitSelector';

export default function ProposalForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [userDepartment, setUserDepartment] = useState(null);
  
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'CAMP',
    departmentId: '',
    scope: 'FIELD',
    targetOrganizationUnitId: '',
    objectives: '',
    startDate: '',
    endDate: '',
    venue: '',
    expectedParticipants: '',
    estimatedBudget: '',
    requiredResources: ''
  });

  const [errors, setErrors] = useState({});
  const [orgUnits, setOrgUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);

  useEffect(() => {
    fetchUserDepartment();
    fetchOrgUnits();
    if (isEdit) fetchProposal();
  }, [id]);

  // Filter org units whenever scope changes
  useEffect(() => {
    const level = formData.scope === 'UNION' ? 'UNION' : formData.scope === 'DISTRICT' ? 'DISTRICT' : 'FIELD';
    setFilteredUnits(orgUnits.filter(u => u.level === level));
    setFormData(prev => ({ ...prev, targetOrganizationUnitId: '' }));
  }, [formData.scope, orgUnits]);

  const fetchOrgUnits = async () => {
    try {
      const res = await organizationApi.getAll();
      setOrgUnits(res.data?.data || []);
    } catch {}
  };

  const fetchUserDepartment = async () => {
    try {
      // Fetch all departments and find the one where current user is the leader
      const response = await departmentApi.getAll();
      if (response.data.success) {
        const departments = response.data.data || [];
        // Find department where current user is the leader
        const myDepartment = departments.find(dept => dept.leader?.id === user.userId);
        
        if (myDepartment) {
          setUserDepartment(myDepartment);
          setFormData(prev => ({ ...prev, departmentId: myDepartment.id }));
        } else {
          setAlert({
            type: 'warning',
            message: 'You are not assigned as a leader of any department. Please contact the administrator.'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user department:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Failed to load your department information. Please check if the backend is running.'
      });
    }
  };

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await proposalApi.getById(id);
      if (response.data.success) {
        const p = response.data.data;
        setFormData({
          eventName: p.eventName,
          eventType: p.eventType,
          departmentId: p.departmentId || '',
          scope: p.scope || 'FIELD',
          targetOrganizationUnitId: p.targetOrganizationUnitId || '',
          objectives: p.objectives,
          startDate: p.startDate,
          endDate: p.endDate,
          venue: p.venue,
          expectedParticipants: p.expectedParticipants || '',
          estimatedBudget: p.estimatedBudget || '',
          requiredResources: p.requiredResources || ''
        });
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to fetch proposal' });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }

    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Department is required. You must be assigned as a department leader.';
    }

    if (!formData.objectives.trim()) {
      newErrors.objectives = 'Objectives are required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }

    if (!formData.estimatedBudget || formData.estimatedBudget <= 0) {
      newErrors.estimatedBudget = 'Valid budget is required';
    }
    if (!formData.scope) newErrors.scope = 'Scope is required';
    if (!formData.targetOrganizationUnitId) newErrors.targetOrganizationUnitId = 'Target organization unit is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      setAlert({ type: 'error', message: 'Please fill in all required fields correctly' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        departmentId: parseInt(formData.departmentId),
        targetOrganizationUnitId: parseInt(formData.targetOrganizationUnitId),
        expectedParticipants: formData.expectedParticipants ? parseInt(formData.expectedParticipants) : null,
        estimatedBudget: parseFloat(formData.estimatedBudget)
      };

      let response;
      if (isEdit) {
        response = await proposalApi.update(id, payload);
      } else {
        response = await proposalApi.create(payload);
      }

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `Proposal ${isEdit ? 'updated' : 'created'} successfully`
        });
        setTimeout(() => navigate('/proposals'), 1500);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} proposal`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const scopeOptions = [
    { value: 'DISTRICT', label: 'District — reviewed by District Pastor' },
    { value: 'FIELD', label: 'Field — reviewed by Field Leader' },
    { value: 'UNION', label: 'Union — reviewed by Dept Leader then Union Admin' },
  ];

  const eventTypeOptions = [
    { value: 'CAMP', label: 'Camp' },
    { value: 'CONFERENCE', label: 'Conference' },
    { value: 'RETREAT', label: 'Retreat' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'WORKSHOP', label: 'Workshop' },
    { value: 'SEMINAR', label: 'Seminar' },
  ];

  if (loading) {
    return <PageSpinner message="Loading proposal..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Proposal' : 'Create New Proposal'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update your event proposal' : 'Submit a new event proposal for review'}
          </p>
        </div>
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/proposals')}
        >
          Back to Proposals
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Proposal Details</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Event Name"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  error={errors.eventName}
                  required
                  placeholder="Enter event name"
                />

                <Select
                  label="Event Type"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  options={eventTypeOptions}
                  error={errors.eventType}
                  required
                />
              </div>

              {/* Department - Auto-filled and Read-only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userDepartment?.name || 'Loading department...'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is automatically set based on the department you lead
                  </p>
                </div>
              </div>

              {/* Scope and Target Organization Unit */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Proposal Scope"
                    name="scope"
                    value={formData.scope}
                    onChange={handleChange}
                    options={scopeOptions}
                    error={errors.scope}
                    required
                  />
                  {formData.scope !== 'DISTRICT' && (
                    <Select
                      label={formData.scope === 'UNION' ? 'Target Union' : 'Target Field'}
                      name="targetOrganizationUnitId"
                      value={formData.targetOrganizationUnitId}
                      onChange={handleChange}
                      options={filteredUnits.map(u => ({ value: u.id, label: u.name }))}
                      error={errors.targetOrganizationUnitId}
                      placeholder={`Select ${formData.scope === 'UNION' ? 'union' : 'field'}`}
                      required
                    />
                  )}
                </div>

                {formData.scope === 'DISTRICT' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Target District Location Scope <span className="text-red-500">*</span>
                    </label>
                    <OrganizationUnitSelector
                      showChurch={false}
                      value={{
                        districtId: formData.targetOrganizationUnitId,
                        organizationUnitId: formData.targetOrganizationUnitId
                      }}
                      onChange={({ districtId, organizationUnitId, fieldId }) => {
                        const targetId = districtId || organizationUnitId || fieldId || '';
                        setFormData(prev => ({ ...prev, targetOrganizationUnitId: targetId }));
                        if (errors.targetOrganizationUnitId) {
                          setErrors(prev => ({ ...prev, targetOrganizationUnitId: '' }));
                        }
                      }}
                      error={errors.targetOrganizationUnitId}
                      required
                    />
                  </div>
                )}
              </div>

              <Textarea
                label="Objectives"
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                error={errors.objectives}
                required
                rows={4}
                placeholder="Describe the main objectives of this event..."
              />

              {/* Dates and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  error={errors.startDate}
                  required
                />

                <Input
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  error={errors.endDate}
                  required
                />
              </div>

              <Input
                label="Venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                error={errors.venue}
                required
                placeholder="Enter event venue/location"
              />

              {/* Participants and Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Expected Participants"
                  name="expectedParticipants"
                  type="number"
                  value={formData.expectedParticipants}
                  onChange={handleChange}
                  error={errors.expectedParticipants}
                  placeholder="Number of expected participants"
                  min="0"
                />

                <Input
                  label="Estimated Budget (RWF)"
                  name="estimatedBudget"
                  type="number"
                  value={formData.estimatedBudget}
                  onChange={handleChange}
                  error={errors.estimatedBudget}
                  required
                  placeholder="Enter budget in RWF"
                  min="0"
                  step="1000"
                />
              </div>

              <Textarea
                label="Required Resources"
                name="requiredResources"
                value={formData.requiredResources}
                onChange={handleChange}
                rows={4}
                placeholder="List any special resources needed (equipment, materials, etc.)..."
              />
            </div>
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/proposals')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={submitting}
          >
            {isEdit ? 'Update Proposal' : 'Create Proposal'}
          </Button>
        </div>
      </form>
    </div>
  );
}
