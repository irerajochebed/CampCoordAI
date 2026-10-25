import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save,
  ArrowLeft,
  Package,
  Layers,
  Sparkles,
  Tag,
  Hash,
  FileText,
  Truck,
  Wifi,
  Music,
  Bed,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import { resourceApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export default function ResourceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { user, isAdmin, isCoordinator } = useAuth();

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'PROJECTOR',
    code: '',
    quantity: '1',
    condition: 'EXCELLENT',
    description: ''
  });

  const [errors, setErrors] = useState({});

  const resourceTypes = [
    { value: 'PROJECTOR', label: 'Projector (Audio/Visual)' },
    { value: 'MICROPHONE', label: 'Microphone & Wireless Audio' },
    { value: 'SOUND_SYSTEM', label: 'Sound System / PA Equipment' },
    { value: 'GENERATOR', label: 'Power Generator' },
    { value: 'VEHICLE', label: 'Vehicle / Transportation' },
    { value: 'TENT', label: 'Tent & Canopies' },
    { value: 'CHAIR', label: 'Chairs & Seating' },
    { value: 'TABLE', label: 'Tables & Desks' },
    { value: 'STAGE_EQUIPMENT', label: 'Stage & Platform Equipment' },
    { value: 'LIGHTING', label: 'Stage & Flood Lighting' },
    { value: 'OTHER', label: 'Other General Resource' }
  ];

  const conditionOptions = [
    { value: 'EXCELLENT', label: 'Excellent (Like New / Pristine)' },
    { value: 'GOOD', label: 'Good (Fully Functional)' },
    { value: 'FAIR', label: 'Fair (Minor Wear & Tear)' },
    { value: 'POOR', label: 'Poor (Functional with Limitations)' },
    { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance (Needs Servicing)' }
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchResource();
    }
  }, [id]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await resourceApi.getById(id);
      const resource = response.data?.data || response.data;
      if (resource) {
        setFormData({
          name: resource.name || '',
          type: resource.type || 'PROJECTOR',
          code: resource.code || '',
          quantity: resource.quantity?.toString() || '1',
          condition: resource.condition || 'EXCELLENT',
          description: resource.description || ''
        });
      }
    } catch (err) {
      console.error('Error fetching resource:', err);
      setError(err.response?.data?.message || 'Failed to load resource details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Resource name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Resource type is required';
    }

    const qty = parseInt(formData.quantity);
    if (!formData.quantity || isNaN(qty) || qty < 1) {
      newErrors.quantity = 'Quantity must be at least 1 unit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const submitData = {
        name: formData.name.trim(),
        type: formData.type,
        code: formData.code.trim() || null,
        quantity: parseInt(formData.quantity),
        condition: formData.condition || 'EXCELLENT',
        description: formData.description.trim() || null
      };

      if (isEditMode) {
        await resourceApi.update(id, submitData);
        setSuccess('Resource updated successfully!');
      } else {
        await resourceApi.create(submitData);
        setSuccess('Resource created successfully!');
      }

      setTimeout(() => {
        navigate('/app/resources');
      }, 800);
    } catch (err) {
      console.error('Error saving resource:', err);
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} resource`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return <PageSpinner message="Loading resource details..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
          onClick={() => navigate('/app/resources')}
          className="mb-3 text-xs font-semibold"
        >
          Back to Resources
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Resource' : 'Add New Resource'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isEditMode 
            ? 'Update equipment details, quantity, or maintenance condition' 
            : 'Register new equipment, materials, or vehicles into the inventory system'}
        </p>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          dismissible
        />
      )}

      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
          dismissible
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
              Resource Information
            </CardTitle>
          </CardHeader>
          <CardBody className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Resource / Equipment Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Package className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Yamaha Sound Mixer, Optoma 4K Projector, Big Camp Tent"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Resource Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  options={resourceTypes}
                  error={errors.type}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Code / Asset Tag / Serial (Optional)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value)}
                    placeholder="e.g., RES-AV-001, SN-987654"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Total Inventory Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
                {errors.quantity && (
                  <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Current Condition
                </label>
                <Select
                  value={formData.condition}
                  onChange={(e) => handleChange('condition', e.target.value)}
                  options={conditionOptions}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Description, Specifications & Accessories (Optional)
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Include cables, carrying cases, storage location, or special operating notes..."
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/app/resources')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Save className="w-4 h-4 mr-1.5" />}
            loading={saving}
          >
            {saving ? 'Saving...' : isEditMode ? 'Update Resource' : 'Save Resource'}
          </Button>
        </div>
      </form>
    </div>
  );
}
