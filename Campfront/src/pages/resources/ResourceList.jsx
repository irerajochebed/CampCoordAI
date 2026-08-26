import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Package,
  Plus,
  Search,
  Filter,
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
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import { resourceApi, eventApi } from '../../api';

export default function ResourceList() {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [events, setEvents] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventFilter, setEventFilter] = useState(eventIdParam || '');

  const [stats, setStats] = useState({
    totalResources: 0,
    available: 0,
    allocated: 0,
    maintenance: 0
  });

  const resourceCategories = [
    { value: 'AUDIO_VISUAL', label: 'Audio/Visual', icon: Music },
    { value: 'TRANSPORTATION', label: 'Transportation', icon: Truck },
    { value: 'ACCOMMODATION', label: 'Accommodation', icon: Bed },
    { value: 'CATERING', label: 'Catering', icon: Utensils },
    { value: 'TECHNOLOGY', label: 'Technology', icon: Wifi },
    { value: 'OTHER', label: 'Other', icon: Package }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterResources();
    calculateStats();
  }, [resources, searchQuery, categoryFilter, statusFilter, eventFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch resources and events in parallel
      const [resourcesRes, eventsRes] = await Promise.all([
        resourceApi.getAll(),
        eventApi.getAll()
      ]);

      if (resourcesRes.data.success) {
        setResources(resourcesRes.data.data || []);
      }

      if (eventsRes.data.success) {
        setEvents(eventsRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = [...resources];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.name?.toLowerCase().includes(query) ||
        resource.description?.toLowerCase().includes(query) ||
        resource.serialNumber?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Event filter
    if (eventFilter) {
      filtered = filtered.filter(r => r.eventId?.toString() === eventFilter);
    }

    setFilteredResources(filtered);
  };

  const calculateStats = () => {
    const total = filteredResources.length;
    const available = filteredResources.filter(r => r.status === 'AVAILABLE').length;
    const allocated = filteredResources.filter(r => r.status === 'ALLOCATED').length;
    const maintenance = filteredResources.filter(r => r.status === 'MAINTENANCE').length;

    setStats({ totalResources: total, available, allocated, maintenance });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      setError(null);
      await resourceApi.delete(id);
      setSuccess('Resource deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Error deleting resource:', err);
      setError(err.response?.data?.message || 'Failed to delete resource');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      AVAILABLE: 'success',
      ALLOCATED: 'info',
      MAINTENANCE: 'warning',
      UNAVAILABLE: 'danger'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'ALLOCATED':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'MAINTENANCE':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'UNAVAILABLE':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category) => {
    const cat = resourceCategories.find(c => c.value === category);
    if (cat) {
      const Icon = cat.icon;
      return <Icon className="w-5 h-5" />;
    }
    return <Package className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
          <p className="text-gray-600 mt-1">Manage equipment, materials, and event resources</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchData}
          >
            Refresh
          </Button>
          <Link to="/resources/new">
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Resource
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Resources</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalResources}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.available}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Allocated</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.allocated}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.maintenance}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {resourceCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </Select>
            <Select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resources ({filteredResources.length})</CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching resources...</span>
              </div>
            </div>
          ) : filteredResources.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Allocated Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-lg">
                            {getCategoryIcon(resource.category)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{resource.name}</p>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {resource.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {resourceCategories.find(c => c.value === resource.category)?.label || resource.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {resource.serialNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{resource.quantity}</span>
                        {resource.unit && (
                          <span className="text-sm text-gray-500 ml-1">{resource.unit}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {resource.event ? (
                          <Link
                            to={`/events/${resource.event.id}`}
                            className="text-primary-600 hover:underline text-sm"
                          >
                            {resource.event.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(resource.status)}
                          {getStatusBadge(resource.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link to={`/resources/${resource.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 className="w-4 h-4" />}
                              title="Edit"
                            />
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4" />}
                            onClick={() => handleDelete(resource.id)}
                            title="Delete"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={<Package className="w-12 h-12" />}
              message={
                searchQuery || categoryFilter || statusFilter || eventFilter
                  ? 'No resources match your filters'
                  : 'No resources found. Add your first resource to get started.'
              }
              action={
                !searchQuery && !categoryFilter && !statusFilter && !eventFilter && (
                  <Link to="/resources/new">
                    <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                      Add Resource
                    </Button>
                  </Link>
                )
              }
            />
          )}
        </CardBody>
      </Card>

      {/* Resource Categories Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Categories</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resourceCategories.map((category) => {
              const Icon = category.icon;
              const count = resources.filter(r => r.category === category.value).length;
              return (
                <div
                  key={category.value}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{category.label}</p>
                    <p className="text-sm text-gray-600">{count} resources</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
