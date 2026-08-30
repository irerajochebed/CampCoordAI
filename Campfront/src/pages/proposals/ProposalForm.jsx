import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { proposalApi, departmentApi, organizationApi, eventApi } from '../../api';
import { FileText, Save, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import OrganizationUnitSelector from '../../components/ui/OrganizationUnitSelector';
import { useTranslation } from '../../contexts/LanguageContext';

export default function ProposalForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [userDepartment, setUserDepartment] = useState(null);
  const [departments, setDepartments] = useState([]);
  
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
    amountPerParticipant: '',
    requiredResources: ''
  });

  const [errors, setErrors] = useState({});
  const [orgUnits, setOrgUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [conflictState, setConflictState] = useState({ loading: false, result: null });
  const minStartDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => {
    fetchUserDepartment();
    fetchOrgUnits();
    if (isEdit) fetchProposal();
  }, [id]);

  useEffect(() => {
    if (!formData.startDate || !formData.endDate) {
      setConflictState({ loading: false, result: null });
      return;
    }

    const timer = setTimeout(async () => {
      setConflictState({ loading: true, result: null });
      try {
        const res = await eventApi.checkConflicts({
          startDate: formData.startDate,
          endDate: formData.endDate,
          venue: formData.venue,
          departmentId: formData.departmentId,
          orgUnitId: formData.targetOrganizationUnitId,
          leaderIds: user?.id ? [user.id] : [],
          excludeProposalId: id ? Number(id) : null
        });
        setConflictState({ loading: false, result: res.data?.data });
      } catch (err) {
        setConflictState({ loading: false, result: null });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.startDate, formData.endDate, formData.venue, formData.departmentId, formData.targetOrganizationUnitId, user?.id, id]);

  useEffect(() => {
    const level = formData.scope === 'UNION' ? 'UNION' : formData.scope === 'DISTRICT' ? 'DISTRICT' : 'FIELD';
    const units = orgUnits.filter(u => u.level === level);
    setFilteredUnits(units);
    if (formData.scope === 'UNION') {
      const rumUnit = units.find(u => u.code === 'RUM' || u.id === 1) || units[0];
      setFormData(prev => ({ ...prev, targetOrganizationUnitId: rumUnit ? rumUnit.id : 1 }));
    } else {
      setFormData(prev => ({ ...prev, targetOrganizationUnitId: '' }));
    }
  }, [formData.scope, orgUnits]);

  const fetchOrgUnits = async () => {
    try {
      const res = await organizationApi.getAll();
      const units = res.data?.data || [];
      setOrgUnits(units);
      if (formData.scope === 'UNION') {
        const rumUnit = units.find(u => u.code === 'RUM' || u.id === 1) || units[0];
        setFormData(prev => ({ ...prev, targetOrganizationUnitId: rumUnit ? rumUnit.id : 1 }));
      }
    } catch {}
  };

  const OFFICIAL_RUM_MINISTRIES = [
    { id: 1, type: 'YOUTH', name: 'Youth Ministries' },
    { id: 2, type: 'WOMEN', name: "Women's Ministries (MIFEM)" },
    { id: 3, type: 'CHILDREN', name: "Children's Ministries" },
    { id: 4, type: 'FAMILY', name: 'Family Ministries' },
    { id: 5, type: 'MINISTERIAL', name: 'Ministerial Association' },
    { id: 6, type: 'PERSONAL_MINISTRIES', name: 'Personal Ministries & Sabbath School' },
    { id: 7, type: 'CHAPLAINCY', name: 'Adventist Chaplaincy Ministries (ACM)' },
    { id: 8, type: 'POSSIBILITY', name: 'Adventist Possibility Ministries (APM)' },
    { id: 9, type: 'HEALTH', name: 'Health Ministries' },
    { id: 10, type: 'PUBLISHING', name: 'Publishing Ministries' },
    { id: 11, type: 'STEWARDSHIP', name: 'Stewardship Ministries' },
    { id: 12, type: 'PARL', name: 'Public Affairs & Religious Liberty (PARL)' },
    { id: 13, type: 'EDUCATION', name: 'Education Department' },
    { id: 14, type: 'COMMUNICATION', name: 'Communication Department' }
  ];

  const activeMinistryList = (departments.length > 0 ? departments : OFFICIAL_RUM_MINISTRIES).map(d => ({
    id: d.id,
    type: d.type,
    name: t(`ministries.${d.type}`, d.name)
  }));

  const fetchUserDepartment = async () => {
    try {
      const response = await departmentApi.getAll();
      if (response.data?.success && response.data.data?.length > 0) {
        setDepartments(response.data.data);
        const dept = response.data.data.find(d => d.leader?.id === user?.userId || d.leader?.id === user?.id);
        if (dept) {
          setUserDepartment(dept);
          setFormData(prev => ({ ...prev, departmentId: dept.id }));
        } else if (response.data.data.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: response.data.data[0].id }));
        }
      } else {
        setFormData(prev => ({ ...prev, departmentId: 1 }));
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, departmentId: 1 }));
    }
  };

  const fetchProposal = async () => {
    try {
      const response = await proposalApi.getById(id);
      if (response.data?.success) {
        const proposal = response.data.data;
        setFormData({
          eventName: proposal.eventName || '',
          eventType: proposal.eventType || 'CAMP',
          departmentId: proposal.department?.id || '',
          scope: proposal.scope || 'FIELD',
          targetOrganizationUnitId: proposal.targetOrganizationUnit?.id || '',
          objectives: proposal.objectives || '',
          startDate: proposal.startDate || '',
          endDate: proposal.endDate || '',
          venue: proposal.venue || '',
          expectedParticipants: proposal.expectedParticipants || '',
          estimatedBudget: proposal.estimatedBudget || '',
          amountPerParticipant: proposal.amountPerParticipant || (proposal.estimatedBudget && proposal.expectedParticipants ? Math.round(Number(proposal.estimatedBudget) / Number(proposal.expectedParticipants)) : ''),
          requiredResources: proposal.requiredResources || ''
        });
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
      setAlert({
        type: 'error',
        message: t('common.error', 'Failed to fetch proposal details')
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.eventName.trim()) {
      newErrors.eventName = t('common.error', 'Event name is required');
    }

    if (!formData.eventType) {
      newErrors.eventType = t('common.error', 'Event type is required');
    }

    if (!formData.departmentId) {
      newErrors.departmentId = t('common.error', 'Department is required');
    }

    if (!formData.objectives.trim()) {
      newErrors.objectives = t('common.error', 'Objectives are required');
    }

    if (!formData.startDate) {
      newErrors.startDate = t('common.error', 'Start date is required');
    } else if (formData.startDate < minStartDate) {
      newErrors.startDate = t('proposals.advanceNoticeError', 'Events must be planned and scheduled at least 30 days in advance to allow proper participant preparation.');
    }

    if (!formData.endDate) {
      newErrors.endDate = t('common.error', 'End date is required');
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = t('common.error', 'End date must be after start date');
    }

    if (!formData.venue.trim()) {
      newErrors.venue = t('common.error', 'Venue is required');
    }

    if (!formData.estimatedBudget || Number(formData.estimatedBudget) <= 0) {
      newErrors.estimatedBudget = t('common.error', 'Valid budget is required');
    }
    if (!formData.scope) newErrors.scope = t('common.error', 'Scope is required');
    if (formData.scope !== 'UNION' && !formData.targetOrganizationUnitId) {
      newErrors.targetOrganizationUnitId = t('common.error', 'Target organization unit is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      setAlert({ type: 'error', message: t('common.error', 'Please fill in all required fields correctly') });
      return;
    }

    setSubmitting(true);
    try {
      const targetUnitId = formData.scope === 'UNION' 
        ? (formData.targetOrganizationUnitId ? Number(formData.targetOrganizationUnitId) : 1)
        : Number(formData.targetOrganizationUnitId);

      const payload = {
        ...formData,
        departmentId: Number(formData.departmentId),
        targetOrganizationUnitId: targetUnitId,
        expectedParticipants: formData.expectedParticipants ? Number(formData.expectedParticipants) : null,
        estimatedBudget: Number(formData.estimatedBudget)
      };

      let response;
      if (isEdit) {
        response = await proposalApi.update(id, payload);
      } else {
        response = await proposalApi.create(payload);
      }

      if (response.data?.success) {
        setAlert({
          type: 'success',
          message: t('common.success', `Proposal ${isEdit ? 'updated' : 'created'} successfully`)
        });
        setTimeout(() => navigate('/app/proposals'), 1500);
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      const serverMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || (typeof error.response?.data === 'string' ? error.response.data : null)
        || error.message 
        || t('common.error', 'Failed to save proposal');
      setAlert({
        type: 'error',
        message: serverMessage
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const scopeOptions = [
    { value: 'FIELD', label: t('orgSelector.step2Field', 'Conference / Field Level') },
    { value: 'UNION', label: t('orgSelector.step1Union', 'Rwanda Union Level (RUM)') },
    { value: 'DISTRICT', label: t('orgSelector.step3District', 'Evangelical District Level') }
  ];

  const eventTypeOptions = [
    { value: 'CAMP', label: 'Camp' },
    { value: 'CAMPOREE', label: 'Camporee' },
    { value: 'CONFERENCE', label: 'Conference' },
    { value: 'RETREAT', label: 'Retreat' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'WORKSHOP', label: 'Workshop' },
    { value: 'SEMINAR', label: 'Seminar' },
  ];

  if (loading) {
    return <PageSpinner message={t('common.loading', 'Loading proposal...')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? t('proposals.editProposal', 'Edit Proposal') : t('proposals.newProposal', 'Create New Proposal')}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? t('proposals.editProposal', 'Update your event proposal') : t('proposals.subtitle', 'Submit a new event proposal for review')}
          </p>
        </div>
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/app/proposals')}
        >
          {t('common.backToProposals', 'Back to Proposals')}
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
            <CardTitle>{t('proposals.proposalDetails', 'Proposal Details')}</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('proposals.eventName', 'Event Name')}
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  error={errors.eventName}
                  required
                  placeholder="Enter event name"
                />

                <Select
                  label={t('proposals.eventType', 'Event Type')}
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  options={eventTypeOptions}
                  error={errors.eventType}
                  required
                />
              </div>

              <Select
                label={t('proposals.hostingMinistry', 'Hosting Ministry / Department *')}
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                options={activeMinistryList.map(d => ({ value: d.id, label: d.name }))}
                error={errors.departmentId}
                placeholder="Select Ministry / Department"
                required
              />

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label={t('proposals.proposalScope', 'Proposal Scope')}
                    name="scope"
                    value={formData.scope}
                    onChange={handleChange}
                    options={scopeOptions}
                    error={errors.scope}
                    required
                  />
                  {formData.scope !== 'DISTRICT' && (
                    <Select
                      label={formData.scope === 'UNION' ? t('proposals.targetUnion', 'Target Union') : t('proposals.targetField', 'Target Field')}
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
                      {t('proposals.targetDistrict', 'Target District Location Scope')} <span className="text-red-500">*</span>
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
                label={t('proposals.objectives', 'Objectives')}
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                error={errors.objectives}
                required
                rows={4}
                placeholder="Describe the main objectives of this event..."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('proposals.startDate', 'Start Date')}
                  name="startDate"
                  type="date"
                  min={minStartDate}
                  value={formData.startDate}
                  onChange={handleChange}
                  error={errors.startDate}
                  required
                />

                <Input
                  label={t('proposals.endDate', 'End Date')}
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  error={errors.endDate}
                  required
                />
              </div>

              {formData.startDate && formData.endDate && (
                <div className="mt-2">
                  {conflictState.loading ? (
                    <div className="p-3 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
                      Checking RUM Master Calendar & Leader Availability...
                    </div>
                  ) : conflictState.result ? (
                    conflictState.result.hasConflict ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                          <span className="w-2.5 h-2.5 bg-red-600 rounded-full"></span>
                          Schedule & Leadership Conflict Detected
                        </div>
                        <ul className="list-disc list-inside text-xs text-red-700 space-y-1 font-medium">
                          {conflictState.result.conflicts.map((msg, idx) => (
                            <li key={idx}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                        Calendar Available: No schedule, venue, or leader conflicts detected for selected dates.
                      </div>
                    )
                  ) : null}
                </div>
              )}

              <Input
                label={t('proposals.venue', 'Venue')}
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                error={errors.venue}
                required
                placeholder="Enter event venue/location"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label={t('proposals.expectedParticipants', 'Expected Participants')}
                  name="expectedParticipants"
                  type="number"
                  value={formData.expectedParticipants}
                  onChange={handleChange}
                  error={errors.expectedParticipants}
                  placeholder="Number of expected participants"
                  min="0"
                />

                <Input
                  label={t('proposals.estimatedBudget', 'Estimated Total Budget (RWF)')}
                  name="estimatedBudget"
                  type="number"
                  value={formData.estimatedBudget}
                  onChange={handleChange}
                  error={errors.estimatedBudget}
                  required
                  placeholder="Enter total budget in RWF"
                  min="0"
                  step="1000"
                />

                <Input
                  label={t('proposals.amountPerParticipant', 'Amount per Participant to be Paid (RWF)')}
                  name="amountPerParticipant"
                  type="number"
                  value={formData.amountPerParticipant}
                  onChange={handleChange}
                  placeholder="Fee per participant in RWF"
                  min="0"
                  step="500"
                />
              </div>

              {Boolean(Number(formData.expectedParticipants) > 0 && Number(formData.estimatedBudget) > 0) && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-amber-900 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    Estimated Cost / Amount per Participant to be Paid:
                  </span>
                  <span className="font-bold text-amber-950 text-sm bg-white px-2.5 py-1 rounded-md border border-amber-200 shadow-sm">
                    {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(
                      formData.amountPerParticipant 
                        ? Number(formData.amountPerParticipant) 
                        : Math.round(Number(formData.estimatedBudget) / Number(formData.expectedParticipants))
                    )} / person
                  </span>
                </div>
              )}

              <Textarea
                label={t('proposals.requiredResources', 'Required Resources')}
                name="requiredResources"
                value={formData.requiredResources}
                onChange={handleChange}
                rows={4}
                placeholder="List any special resources needed (equipment, materials, etc.)..."
              />
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/app/proposals')}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={submitting}
          >
            {isEdit ? t('proposals.editProposal', 'Update Proposal') : t('proposals.newProposal', 'Create Proposal')}
          </Button>
        </div>
      </form>
    </div>
  );
}
