import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save,
  X,
  Package,
  AlertCircle,
  Truck,
  Wifi,
  Music,
  Utensils,
  Bed
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import { resourceApi, eventApi } from '../../api';

export default function ResourceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [events, setEvents] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    category: 'AUDIO_VISUAL',
    description: '',
    serialNumber: '',
    quantity: 1,
    unit: 'unit',
    status: 'AVAILABLE',
    eventId: '',
    notes: '',
    purchaseDate: '',
    purchaseCost: '',
    supplier: '',
    warrantyExpiryDate: '',
    maintenanceSchedule: ''
  });

  const [errors, setErrors] = useState({});

  const resourceCategories = [
    { value: 'AUDIO_VISUAL', label: 'Audio/Visual Equipment', icon: Music },
    { value: 'TRANSPORTATION', label: 'Transportation', icon: Truck },
    { value: 'ACCOMMODATION', label: 'Accommodation Supplies', icon: Bed },
    { value: 'CATERING', label: 'Catering Equipment', icon: Utensils },
    { value: 'TECHNOLOGY', label: 'Technology/IT', icon: Wifi },
    { value: 'OTHER', label: 'Other Resources', icon: Package }
  ];

  const statusOptions = [
    { value: 'AVAILABLE', label: 'Available', description: 'Ready for allocation' },
    { value: 'ALLOCATED', label: 'Allocated', description: 'Currently assigned to an event' },
    { value: 'MAINTENANCE', label: 'Under Maintenance', description: 'Being serviced or repaired' },
    { value: 'UNAVAILABLE', label: 'Unavailable', description: 'Out of service or retired' }
  ];

  const unitOptions = [
    'unit', 'piece', 'set', 'box', 'pack', 'kg', 'liter', 'meter'
  ];

  useEffect(() => {
    fetchEvents();
    if (isEditMode) {
      fetchResource();
    }
  }, [id]);

  const fetchEvents = async () => {
    try {
      const response = await eventApi.getAll();
      if (response.data.success) {
        setEvents(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchResource = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await resourceApi.getById(id);
      if (response.data.success) {
        const resource = response.data.data;
        setFormData({
          name: resource.name || '',
          category: resource.category || 'AUDIO_VISUAL',
          description: resource.description || '',
          serialNumber: resource.serialNumber || '',
          quantity: resource.quantity || 1,
          unit: resource.unit || 'unit',
          status: resource.status || 'AVAILABLE',
          eventId: resource.eventId?.toString() || '',
          notes: resource.notes || '',
          purchaseDate: resource.purchaseDate ? resource.purchaseDate.split('T')[0] : '',
          purchaseCost: resource.purchaseCost || '',
          supplier: resource.supplier || '',
          warrantyExpiryDate: resource.warrantyExpiryDate ? resource.warrantyExpiryDate.split('T')[0] : '',
          maintenanceSchedule: resource.maintenanceSchedule || ''
        });
      }
    } catch (err) {
      console.error('Error fetching resource:', err);
      setError(err.response?.data?.message || 'Failed to load resource');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Resource name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    if (formData.status === 'ALLOCATED' && !formData.eventId) {
      newErrors.eventId = 'Event is required when status is Allocated';
    }

    if (formData.purchaseCost && isNaN(formData.purchaseCost)) {
      newErrors.purchaseCost = 'Purchase cost must be a valid number';
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
        ...formData,
        eventId: formData.eventId ? parseInt(formData.eventId) : null,
        quantity: parseInt(formData.quantity),
        purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : null
      };

      if (isEditMode) {
        await resourceApi.update(id, submitData);
      } else {
        await resourceApi.create(submitData);
      }

      navigate('/resources');
    } catch (err) {
      console.error('Error saving resource:', err);
      setError(err.response?.data?.message || 'Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return <PageSpinner message="Loading resource..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Resource' : 'Add New Resource'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode ? 'Update resource information' : 'Add equipment, materials, or supplies to your inventory'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/resources')}
          icon={<X className="w-4 h-4" />}
        >
          Cancel
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Wireless Microphone, Projector, Bus"
                  error={errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <Select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  error={errors.category}
                >
                  {resourceCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                <Input
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                  placeholder="e.g., SN-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  min="1"
                  error={errors.quantity}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <Select
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                >
                  {unitOptions.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe the resource, its specifications, or special features..."
                  rows={3}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Status & Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Allocation</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {statusOptions.find(s => s.value === formData.status)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allocated Event {formData.status === 'ALLOCATED' && '*'}
                </label>
                <Select
                  value={formData.eventId}
                  onChange={(e) => handleChange('eventId', e.target.value)}
                  disabled={formData.status !== 'ALLOCATED'}
                  error={errors.eventId}
                >
                  <option value="">Not allocated to any event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {new Date(event.startDate).toLocaleDateString('en-RW')}
                    </option>
                  ))}
                </Select>
                {errors.eventId && (
                  <p className="text-sm text-red-600 mt-1">{errors.eventId}</p>
                )}
                {formData.status === 'ALLOCATED' && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Event selection is required for allocated resources
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Add any special notes, usage instructions, or important information..."
                  rows={2}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Purchase & Maintenance Information */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase & Maintenance (Optional)</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Date
                </label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Cost (RWF)
                </label>
                <Input
                  type="number"
                  value={formData.purchaseCost}
                  onChange={(e) => handleChange('purchaseCost', e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  error={errors.purchaseCost}
                />
                {errors.purchaseCost && (
                  <p className="text-sm text-red-600 mt-1">{errors.purchaseCost}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                  placeholder="Supplier or vendor name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty Expiry Date
                </label>
                <Input
                  type="date"
                  value={formData.warrantyExpiryDate}
                  onChange={(e) => handleChange('warrantyExpiryDate', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance Schedule
                </label>
                <Input
                  value={formData.maintenanceSchedule}
                  onChange={(e) => handleChange('maintenanceSchedule', e.target.value)}
                  placeholder="e.g., Every 6 months, Annual servicing required"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Helper Information */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">Resource Management Tips:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Keep serial numbers up to date for tracking and insurance purposes</li>
                  <li>Set status to "Allocated" when assigning resources to specific events</li>
                  <li>Use "Maintenance" status for resources undergoing repairs or servicing</li>
                  <li>Record purchase information to track asset value and warranty periods</li>
                  <li>Add detailed notes for special handling or usage instructions</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Form Actions */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/resources')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<Save className="w-4 h-4" />}
                disabled={saving}
              >
                {saving ? 'Saving...' : isEditMode ? 'Update Resource' : 'Add Resource'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
