import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Truck,
  Wifi,
  Music,
  Utensils,
  Bed,
  RefreshCw,
  Share2,
  ArrowDownLeft,
  Calendar,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { resourceApi, eventApi, getCachedData } from '../../api';

export default function ResourceList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');
  const { user, isAdmin, isCoordinator } = useAuth();

  // Instant In-Memory Cache Initialization
  const cachedResources = useMemo(() => {
    const cached = getCachedData('/resources');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const cachedEvents = useMemo(() => {
    const cached = getCachedData('/events');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const [resources, setResources] = useState(cachedResources);
  const [events, setEvents] = useState(cachedEvents);
  const [loading, setLoading] = useState(cachedResources.length === 0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'allocations'
  const [allocations, setAllocations] = useState([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [eventFilter, setEventFilter] = useState(eventIdParam || '');

  // Delete modal state
  const [deletingResource, setDeletingResource] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Allocation modal state
  const [allocatingResource, setAllocatingResource] = useState(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    eventId: '',
    quantity: 1,
    allocatedFrom: '',
    allocatedTo: '',
    purpose: ''
  });
  const [allocating, setAllocating] = useState(false);

  // Return allocation state
  const [returningId, setReturningId] = useState(null);

  const canManage = isAdmin || isCoordinator;

  const resourceTypes = [
    { value: 'PROJECTOR', label: 'Projector', icon: Wifi },
    { value: 'MICROPHONE', label: 'Microphone', icon: Music },
    { value: 'SOUND_SYSTEM', label: 'Sound System', icon: Music },
    { value: 'GENERATOR', label: 'Generator', icon: Package },
    { value: 'VEHICLE', label: 'Vehicle / Transport', icon: Truck },
    { value: 'TENT', label: 'Tent & Canopies', icon: Bed },
    { value: 'CHAIR', label: 'Chairs', icon: Package },
    { value: 'TABLE', label: 'Tables', icon: Package },
    { value: 'STAGE_EQUIPMENT', label: 'Stage Equipment', icon: Layers },
    { value: 'LIGHTING', label: 'Lighting', icon: Sparkles },
    { value: 'OTHER', label: 'Other Equipment', icon: Package }
  ];

  const conditionOptions = [
    { value: '', label: 'All Conditions' },
    { value: 'EXCELLENT', label: 'Excellent' },
    { value: 'GOOD', label: 'Good' },
    { value: 'FAIR', label: 'Fair' },
    { value: 'POOR', label: 'Poor' },
    { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' }
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    ...resourceTypes.map(t => ({ value: t.value, label: t.label }))
  ];

  const availabilityOptions = [
    { value: '', label: 'All Availability' },
    { value: 'AVAILABLE', label: 'In Stock (Available)' },
    { value: 'OUT_OF_STOCK', label: 'Fully Allocated (Out of Stock)' },
    { value: 'MAINTENANCE', label: 'In Maintenance' }
  ];

  useEffect(() => {
    fetchData(cachedResources.length > 0);
  }, []);

  useEffect(() => {
    if (activeTab === 'allocations') {
      fetchAllocations();
    }
  }, [activeTab, eventFilter]);

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground && resources.length === 0) setLoading(true);
      setError(null);

      const [resourcesRes, eventsRes] = await Promise.all([
        resourceApi.getAll().catch(() => ({ data: { data: [] } })),
        eventApi.getAll().catch(() => ({ data: { data: [] } }))
      ]);

      const resList = resourcesRes.data?.data || resourcesRes.data || [];
      const evList = eventsRes.data?.data || eventsRes.data || [];

      setResources(Array.isArray(resList) ? resList : []);
      setEvents(Array.isArray(evList) ? evList : []);
    } catch (err) {
      console.error('Error fetching resources:', err);
      if (resources.length === 0) {
        setError(err.response?.data?.message || 'Failed to load resources');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async () => {
    try {
      setLoadingAllocations(true);
      if (eventFilter) {
        const res = await resourceApi.getAllocationsByEvent(eventFilter);
        setAllocations(res.data?.data || res.data || []);
      } else {
        // Collect unreturned allocations for all resources
        const allRes = resources.filter(r => r.allocations && r.allocations.length > 0);
        const combined = [];
        allRes.forEach(r => {
          (r.allocations || []).forEach(a => {
            if (!a.returned) {
              combined.push({ ...a, resource: a.resource || { id: r.id, name: r.name, code: r.code, type: r.type } });
            }
          });
        });
        setAllocations(combined);
      }
    } catch (err) {
      console.error('Error fetching allocations:', err);
    } finally {
      setLoadingAllocations(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingResource) return;
    try {
      setDeleting(true);
      setError(null);
      await resourceApi.delete(deletingResource.id);
      setSuccess(`Resource "${deletingResource.name}" deleted successfully`);
      setShowDeleteModal(false);
      setDeletingResource(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting resource:', err);
      setError(err.response?.data?.message || 'Failed to delete resource');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenAllocateModal = (resource) => {
    setAllocatingResource(resource);
    const today = new Date().toISOString().slice(0, 16);
    setAllocateForm({
      eventId: eventFilter || (events.length > 0 ? events[0].id.toString() : ''),
      quantity: 1,
      allocatedFrom: today,
      allocatedTo: '',
      purpose: ''
    });
    setShowAllocateModal(true);
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocateForm.eventId) {
      setError('Please select an event for allocation');
      return;
    }
    if (!allocateForm.quantity || allocateForm.quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }
    if (allocateForm.quantity > allocatingResource.availableQuantity) {
      setError(`Cannot allocate more than available stock (${allocatingResource.availableQuantity})`);
      return;
    }
    if (!allocateForm.allocatedFrom || !allocateForm.allocatedTo) {
      setError('Please provide start and end dates for allocation');
      return;
    }

    try {
      setAllocating(true);
      setError(null);

      const payload = {
        resourceId: allocatingResource.id,
        eventId: parseInt(allocateForm.eventId),
        quantity: parseInt(allocateForm.quantity),
        allocatedFrom: allocateForm.allocatedFrom,
        allocatedTo: allocateForm.allocatedTo,
        purpose: allocateForm.purpose.trim() || null
      };

      await resourceApi.allocate(payload);
      setSuccess(`Successfully allocated ${allocateForm.quantity} unit(s) of ${allocatingResource.name}!`);
      setShowAllocateModal(false);
      setAllocatingResource(null);
      fetchData();
      if (activeTab === 'allocations') {
        fetchAllocations();
      }
    } catch (err) {
      console.error('Failed to allocate resource:', err);
      setError(err.response?.data?.message || 'Failed to allocate resource');
    } finally {
      setAllocating(false);
    }
  };

  const handleReturnAllocation = async (allocationId) => {
    if (!window.confirm('Mark this allocated resource as returned to stock?')) return;
    try {
      setReturningId(allocationId);
      setError(null);
      await resourceApi.returnAllocation(allocationId);
      setSuccess('Resource returned to stock successfully!');
      fetchData();
      fetchAllocations();
    } catch (err) {
      console.error('Failed to return allocation:', err);
      setError(err.response?.data?.message || 'Failed to return resource');
    } finally {
      setReturningId(null);
    }
  };

  // Filter resources
  const filteredResources = resources.filter(resource => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (
        (resource.name || '').toLowerCase().includes(q) ||
        (resource.code || '').toLowerCase().includes(q) ||
        (resource.description || '').toLowerCase().includes(q)
      );
      if (!match) return false;
    }

    if (typeFilter && resource.type !== typeFilter) {
      return false;
    }

    if (conditionFilter && resource.condition !== conditionFilter) {
      return false;
    }

    if (availabilityFilter === 'AVAILABLE' && (resource.availableQuantity || 0) <= 0) {
      return false;
    }
    if (availabilityFilter === 'OUT_OF_STOCK' && (resource.availableQuantity || 0) > 0) {
      return false;
    }
    if (availabilityFilter === 'MAINTENANCE' && resource.condition !== 'UNDER_MAINTENANCE') {
      return false;
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    totalItems: resources.length,
    totalUnits: resources.reduce((sum, r) => sum + (r.quantity || 0), 0),
    availableUnits: resources.reduce((sum, r) => sum + (r.availableQuantity || 0), 0),
    allocatedUnits: resources.reduce((sum, r) => sum + ((r.quantity || 0) - (r.availableQuantity || 0)), 0),
    maintenanceItems: resources.filter(r => r.condition === 'UNDER_MAINTENANCE').length
  };

  const getTypeIcon = (type) => {
    const item = resourceTypes.find(t => t.value === type);
    if (item) {
      const Icon = item.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <Package className="w-4 h-4" />;
  };

  const getConditionBadge = (condition) => {
    switch (condition) {
      case 'EXCELLENT':
        return <Badge variant="success" size="sm">Excellent</Badge>;
      case 'GOOD':
        return <Badge variant="info" size="sm">Good</Badge>;
      case 'FAIR':
        return <Badge variant="warning" size="sm">Fair</Badge>;
      case 'POOR':
        return <Badge variant="danger" size="sm">Poor</Badge>;
      case 'UNDER_MAINTENANCE':
        return <Badge variant="danger" size="sm">Maintenance</Badge>;
      default:
        return <Badge variant="default" size="sm">{condition || 'Normal'}</Badge>;
    }
  };

  const eventOptions = [
    { value: '', label: 'All Events' },
    ...events.map(e => ({ value: e.id.toString(), label: e.name }))
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Resource Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage equipment, sound systems, vehicles, and camp supplies inventory
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4 mr-1.5" />}
            onClick={() => { fetchData(); if (activeTab === 'allocations') fetchAllocations(); }}
            className="text-xs font-semibold"
          >
            Refresh
          </Button>
          {canManage && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4 mr-1.5" />}
              onClick={() => navigate('/app/resources/new')}
            >
              Add Resource
            </Button>
          )}
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Inventory
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalUnits} <span className="text-xs font-normal text-gray-500">({stats.totalItems} types)</span>
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Available Units
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.availableUnits}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Allocated to Events
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {stats.allocatedUnits}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Maintenance
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {stats.maintenanceItems}
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'inventory'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Resource Inventory ({filteredResources.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'allocations'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Active Allocations ({stats.allocatedUnits})</span>
        </button>
      </div>

      {/* Filters Card */}
      {activeTab === 'inventory' ? (
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search resources, tags, codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={typeOptions}
              />

              <Select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                options={conditionOptions}
              />

              <Select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                options={availabilityOptions}
              />
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Filter by Event:</span>
            </div>
            <div className="flex-1 w-full">
              <Select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                options={eventOptions}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Main Content */}
      {loading ? (
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="py-12">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching resource inventory...</span>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : activeTab === 'inventory' ? (
        filteredResources.length === 0 ? (
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardBody className="py-12">
              <EmptyState
                icon={<Package className="w-12 h-12 text-gray-400" />}
                title={searchQuery || typeFilter || conditionFilter ? "No matching resources" : "No resources added yet"}
                description={
                  searchQuery || typeFilter || conditionFilter
                    ? "Try adjusting your search criteria or clearing filters."
                    : "Add equipment, vehicles, sound systems, or materials to begin managing your inventory."
                }
                action={
                  canManage && !searchQuery && !typeFilter && (
                    <Button
                      variant="primary"
                      icon={<Plus className="w-4 h-4 mr-1.5" />}
                      onClick={() => navigate('/app/resources/new')}
                    >
                      Add First Resource
                    </Button>
                  )
                }
              />
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((resource) => {
              const totalQty = resource.quantity || 0;
              const availQty = resource.availableQuantity != null ? resource.availableQuantity : totalQty;
              const allocatedQty = Math.max(0, totalQty - availQty);
              const isAvailable = availQty > 0 && resource.condition !== 'UNDER_MAINTENANCE';

              return (
                <Card 
                  key={resource.id} 
                  className="hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg mt-0.5 shrink-0">
                          {getTypeIcon(resource.type)}
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">
                            {resource.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-0.5">
                            {resource.code && (
                              <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 font-medium">
                                Tag: {resource.code}
                              </span>
                            )}
                            <span className="text-[10px] uppercase font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                              {resource.type?.replace(/_/g, ' ') || 'EQUIPMENT'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        {getConditionBadge(resource.condition)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardBody className="py-4 space-y-4 flex-1">
                    {resource.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {resource.description}
                      </p>
                    )}

                    {/* Stock pill counters */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                        <p className="text-[10px] text-gray-400 font-medium uppercase">Total Stock</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{totalQty}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                        <p className="text-[10px] text-gray-400 font-medium uppercase">Available</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{availQty}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                        <p className="text-[10px] text-gray-400 font-medium uppercase">Allocated</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">{allocatedQty}</p>
                      </div>
                    </div>

                    {/* Available Stock Indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        <span>Stock Availability</span>
                        <span>{availQty} / {totalQty} Units</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            availQty === 0 ? 'bg-red-500' :
                            availQty <= 2 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${totalQty > 0 ? (availQty / totalQty) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </CardBody>

                  {/* Actions */}
                  <div className="p-4 pt-0 border-t border-gray-100 dark:border-slate-800 mt-2 flex items-center justify-between gap-2">
                    {canManage && (
                      <Button
                        variant={availQty > 0 ? 'primary' : 'outline'}
                        size="sm"
                        className="text-xs font-semibold"
                        icon={<Share2 className="w-3.5 h-3.5 mr-1" />}
                        onClick={() => handleOpenAllocateModal(resource)}
                        disabled={availQty <= 0}
                      >
                        {availQty > 0 ? 'Allocate to Event' : 'Out of Stock'}
                      </Button>
                    )}

                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/app/resources/${resource.id}/edit`)}
                          title="Edit Resource"
                          className="text-gray-500 hover:text-gray-900 dark:hover:text-white px-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingResource(resource);
                            setShowDeleteModal(true);
                          }}
                          title="Delete Resource"
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 px-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Allocations Tab */
        loadingAllocations ? (
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardBody className="py-12">
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Fetching active allocations...</span>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : allocations.length === 0 ? (
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardBody className="py-12">
              <EmptyState
                icon={<Clock className="w-12 h-12 text-gray-400" />}
                title="No active allocations"
                description={eventFilter ? "No resources are currently allocated to this event." : "All resource inventory is currently in stock."}
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {allocations.map((alloc) => (
              <Card key={alloc.id} className="dark:bg-slate-900 dark:border-slate-800">
                <CardBody className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl mt-0.5 shrink-0">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {alloc.resource?.name || 'Resource Item'}
                        </h4>
                        <Badge variant="info" size="sm">
                          {alloc.quantity} Unit(s)
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <strong>Event:</strong> {alloc.event?.name || 'Assigned Event'}
                        {alloc.purpose && <span> • <em>{alloc.purpose}</em></span>}
                      </p>
                      {alloc.allocatedFrom && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Period: {new Date(alloc.allocatedFrom).toLocaleDateString()} {alloc.allocatedTo ? `to ${new Date(alloc.allocatedTo).toLocaleDateString()}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<ArrowDownLeft className="w-3.5 h-3.5 mr-1 text-emerald-600" />}
                        onClick={() => handleReturnAllocation(alloc.id)}
                        disabled={returningId === alloc.id}
                        className="text-xs font-semibold whitespace-nowrap"
                      >
                        {returningId === alloc.id ? 'Returning...' : 'Return to Stock'}
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Allocate Modal */}
      <Modal
        isOpen={showAllocateModal}
        onClose={() => {
          setShowAllocateModal(false);
          setAllocatingResource(null);
        }}
        title={`Allocate "${allocatingResource?.name}" to Event`}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAllocateModal(false);
                setAllocatingResource(null);
              }}
              disabled={allocating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Share2 className="w-4 h-4 mr-1.5" />}
              onClick={handleAllocateSubmit}
              loading={allocating}
            >
              Confirm Allocation
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAllocateSubmit} className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Total Quantity: </span>
              <strong className="text-gray-900 dark:text-white">{allocatingResource?.quantity}</strong>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Available to Allocate: </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{allocatingResource?.availableQuantity}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Select Event <span className="text-red-500">*</span>
            </label>
            <Select
              value={allocateForm.eventId}
              onChange={(e) => setAllocateForm(prev => ({ ...prev, eventId: e.target.value }))}
              options={events.map(e => ({ value: e.id.toString(), label: `${e.name} (${new Date(e.startDate).toLocaleDateString()})` }))}
              placeholder="Choose target event..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Units to Allocate <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={allocatingResource?.availableQuantity || 1}
              value={allocateForm.quantity}
              onChange={(e) => setAllocateForm(prev => ({ ...prev, quantity: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Allocated From <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={allocateForm.allocatedFrom}
                onChange={(e) => setAllocateForm(prev => ({ ...prev, allocatedFrom: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Allocated To <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={allocateForm.allocatedTo}
                onChange={(e) => setAllocateForm(prev => ({ ...prev, allocatedTo: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Purpose / Department / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Main stage worship session, Audio engineering team..."
              value={allocateForm.purpose}
              onChange={(e) => setAllocateForm(prev => ({ ...prev, purpose: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingResource(null);
        }}
        title="Delete Resource"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingResource(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="w-4 h-4 mr-1.5" />}
              onClick={handleDelete}
              loading={deleting}
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{deletingResource?.name}</strong>?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            This will remove this item from your equipment inventory. This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
