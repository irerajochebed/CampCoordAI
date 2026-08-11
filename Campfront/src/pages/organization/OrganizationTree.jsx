import { useState, useEffect } from 'react';
import { 
  Building2, 
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  MapPin,
  Phone,
  Mail,
  Building,
  Home,
  Church as ChurchIcon,
  Save,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import { organizationApi } from '../../api';

export default function OrganizationTree() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set(['union-1']));
  const [selectedNode, setSelectedNode] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

  const [organizationTree, setOrganizationTree] = useState({
    id: 'union-1',
    type: 'UNION',
    name: 'Rwanda Union Mission',
    code: 'RUM',
    leader: 'Pastor Emmanuel Mugisha',
    contactEmail: 'info@rum.adventist.org',
    contactPhone: '+250 788 123 456',
    address: 'KN 3 Ave, Kigali, Rwanda',
    memberCount: 45000,
    children: [
      {
        id: 'field-1',
        type: 'FIELD',
        name: 'North Rwanda Field',
        code: 'NRF',
        leader: 'Pastor Jean Claude Habimana',
        contactEmail: 'info@nrf.adventist.org',
        contactPhone: '+250 788 234 567',
        address: 'Musanze District',
        memberCount: 12000,
        children: [
          {
            id: 'district-1',
            type: 'DISTRICT',
            name: 'Musanze District',
            code: 'MSD',
            leader: 'Elder Patrick Nkurunziza',
            contactEmail: 'musanze@nrf.adventist.org',
            contactPhone: '+250 788 345 678',
            address: 'Musanze Town',
            memberCount: 3500,
            children: [
              {
                id: 'church-1',
                type: 'CHURCH',
                name: 'Musanze Central Church',
                code: 'MCC',
                leader: 'Elder David Nsengimana',
                contactEmail: 'central@musanze.adventist.org',
                contactPhone: '+250 788 456 789',
                address: 'Musanze Central, RN4',
                memberCount: 850,
                children: []
              },
              {
                id: 'church-2',
                type: 'CHURCH',
                name: 'Ruhengeri Church',
                code: 'RHC',
                leader: 'Elder Paul Uwimana',
                contactEmail: 'ruhengeri@musanze.adventist.org',
                contactPhone: '+250 788 567 890',
                address: 'Ruhengeri Sector',
                memberCount: 620,
                children: []
              }
            ]
          },
          {
            id: 'district-2',
            type: 'DISTRICT',
            name: 'Gakenke District',
            code: 'GKD',
            leader: 'Elder Joseph Mukama',
            contactEmail: 'gakenke@nrf.adventist.org',
            contactPhone: '+250 788 678 901',
            address: 'Gakenke Town',
            memberCount: 2800,
            children: []
          }
        ]
      },
      {
        id: 'field-2',
        type: 'FIELD',
        name: 'South Rwanda Field',
        code: 'SRF',
        leader: 'Pastor Marie Claire Uwera',
        contactEmail: 'info@srf.adventist.org',
        contactPhone: '+250 788 789 012',
        address: 'Huye District',
        memberCount: 15000,
        children: []
      },
      {
        id: 'field-3',
        type: 'FIELD',
        name: 'East Rwanda Field',
        code: 'ERF',
        leader: 'Pastor Samuel Uwizeyimana',
        contactEmail: 'info@erf.adventist.org',
        contactPhone: '+250 788 890 123',
        address: 'Rwamagana District',
        memberCount: 10000,
        children: []
      }
    ]
  });

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'CHURCH',
    leader: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    memberCount: 0,
    parentId: null
  });

  useEffect(() => {
    fetchOrganizationTree();
  }, []);

  const fetchOrganizationTree = async () => {
    try {
      setLoading(true);
      setError(null);

      // In production, fetch from API
      // const response = await organizationApi.getTree();
      // if (response.data.success) {
      //   setOrganizationTree(response.data.data);
      // }

      // Using mock data for now
      setTimeout(() => {
        setLoading(false);
      }, 1000);

    } catch (err) {
      console.error('Error fetching organization tree:', err);
      setError(err.response?.data?.message || 'Failed to load organization structure');
      setLoading(false);
    }
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelectNode = (node) => {
    setSelectedNode(node);
  };

  const handleAddChild = (parentNode) => {
    setModalMode('add');
    setFormData({
      name: '',
      code: '',
      type: getChildType(parentNode.type),
      leader: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      memberCount: 0,
      parentId: parentNode.id
    });
    setShowModal(true);
  };

  const handleEdit = (node) => {
    setModalMode('edit');
    setFormData({
      id: node.id,
      name: node.name,
      code: node.code,
      type: node.type,
      leader: node.leader,
      contactEmail: node.contactEmail,
      contactPhone: node.contactPhone,
      address: node.address,
      memberCount: node.memberCount,
      parentId: null
    });
    setShowModal(true);
  };

  const handleDelete = async (node) => {
    if (!window.confirm(`Are you sure you want to delete ${node.name}? This will also delete all its sub-organizations.`)) {
      return;
    }

    try {
      setError(null);
      
      // In production, call API
      // await organizationApi.delete(node.id);
      
      setSuccess(`Successfully deleted ${node.name}`);
      fetchOrganizationTree();
    } catch (err) {
      console.error('Error deleting organization:', err);
      setError(err.response?.data?.message || 'Failed to delete organization');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      if (modalMode === 'add') {
        // In production, call API
        // await organizationApi.create(formData);
        setSuccess(`Successfully added ${formData.name}`);
      } else {
        // In production, call API
        // await organizationApi.update(formData.id, formData);
        setSuccess(`Successfully updated ${formData.name}`);
      }
      
      setShowModal(false);
      fetchOrganizationTree();
    } catch (err) {
      console.error('Error saving organization:', err);
      setError(err.response?.data?.message || 'Failed to save organization');
    }
  };

  const getChildType = (parentType) => {
    switch (parentType) {
      case 'UNION':
        return 'FIELD';
      case 'FIELD':
        return 'DISTRICT';
      case 'DISTRICT':
        return 'CHURCH';
      default:
        return 'CHURCH';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'UNION':
        return <Building2 className="w-5 h-5 text-purple-600" />;
      case 'FIELD':
        return <Building className="w-5 h-5 text-blue-600" />;
      case 'DISTRICT':
        return <Home className="w-5 h-5 text-green-600" />;
      case 'CHURCH':
        return <ChurchIcon className="w-5 h-5 text-amber-600" />;
      default:
        return <Building2 className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type) => {
    const variants = {
      UNION: 'default',
      FIELD: 'info',
      DISTRICT: 'success',
      CHURCH: 'warning'
    };
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>;
  };

  const filterTree = (node, query) => {
    if (!query) return true;
    
    const searchLower = query.toLowerCase();
    const matchesNode = 
      node.name.toLowerCase().includes(searchLower) ||
      node.code.toLowerCase().includes(searchLower) ||
      node.leader?.toLowerCase().includes(searchLower);

    if (matchesNode) return true;

    // Check children recursively
    return node.children?.some(child => filterTree(child, query));
  };

  const renderTreeNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const matchesSearch = filterTree(node, searchQuery);

    if (!matchesSearch && level > 0) return null;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${
            isSelected ? 'bg-primary-50 border-2 border-primary-300' : 'border border-transparent'
          }`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => handleSelectNode(node)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <div className="flex items-center gap-2 flex-1">
            {getTypeIcon(node.type)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{node.name}</p>
                {getTypeBadge(node.type)}
                <span className="text-xs text-gray-500">({node.code})</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {node.memberCount.toLocaleString()} members
                </span>
                <span>{node.leader}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {node.type !== 'CHURCH' && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddChild(node);
                }}
                title="Add child organization"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit2 className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(node);
              }}
              title="Edit"
            />
            {node.type !== 'UNION' && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(node);
                }}
                title="Delete"
              />
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <PageSpinner message="Loading organization structure..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Structure</h1>
        <p className="text-gray-600 mt-1">Manage the hierarchical organization tree (Union → Field → District → Church)</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {organizationTree.memberCount.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fields</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {organizationTree.children?.length || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Districts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {organizationTree.children?.reduce((sum, field) => 
                    sum + (field.children?.length || 0), 0
                  )}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Home className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Churches</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {organizationTree.children?.reduce((sum, field) => 
                    sum + (field.children?.reduce((distSum, dist) => 
                      distSum + (dist.children?.length || 0), 0
                    ) || 0), 0
                  )}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <ChurchIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Tree */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Organization Hierarchy</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="mb-4">
                <Input
                  placeholder="Search organizations, codes, or leaders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {renderTreeNode(organizationTree)}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Details Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardBody>
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    {getTypeIcon(selectedNode.type)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{selectedNode.name}</h3>
                      {getTypeBadge(selectedNode.type)}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Organization Code</p>
                      <p className="font-medium text-gray-900">{selectedNode.code}</p>
                    </div>

                    <div>
                      <p className="text-gray-600 mb-1">Leader</p>
                      <p className="font-medium text-gray-900">{selectedNode.leader}</p>
                    </div>

                    <div>
                      <p className="text-gray-600 mb-1 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Total Members
                      </p>
                      <p className="font-medium text-gray-900">{selectedNode.memberCount.toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-gray-600 mb-1 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        Email
                      </p>
                      <p className="font-medium text-gray-900 text-xs break-all">{selectedNode.contactEmail}</p>
                    </div>

                    <div>
                      <p className="text-gray-600 mb-1 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Phone
                      </p>
                      <p className="font-medium text-gray-900">{selectedNode.contactPhone}</p>
                    </div>

                    <div>
                      <p className="text-gray-600 mb-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Address
                      </p>
                      <p className="font-medium text-gray-900">{selectedNode.address}</p>
                    </div>

                    {selectedNode.children && selectedNode.children.length > 0 && (
                      <div>
                        <p className="text-gray-600 mb-1">Sub-Organizations</p>
                        <p className="font-medium text-gray-900">{selectedNode.children.length}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <Button
                      variant="primary"
                      className="w-full"
                      icon={<Edit2 className="w-4 h-4" />}
                      onClick={() => handleEdit(selectedNode)}
                    >
                      Edit Details
                    </Button>
                    {selectedNode.type !== 'CHURCH' && (
                      <Button
                        variant="outline"
                        className="w-full"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => handleAddChild(selectedNode)}
                      >
                        Add {getChildType(selectedNode.type)}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select an organization to view details</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Hierarchy Legend */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Hierarchy Legend</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Union</span>
                  <span className="text-gray-500">- Top level</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Field</span>
                  <span className="text-gray-500">- Regional divisions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-green-600" />
                  <span className="font-medium">District</span>
                  <span className="text-gray-500">- Local areas</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChurchIcon className="w-5 h-5 text-amber-600" />
                  <span className="font-medium">Church</span>
                  <span className="text-gray-500">- Local congregations</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === 'add' ? `Add New ${formData.type}` : `Edit ${formData.type}`}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter organization name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Code *
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., RUM, NRF"
                maxLength={10}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leader Name *
              </label>
              <Input
                value={formData.leader}
                onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                placeholder="Enter leader name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Count
              </label>
              <Input
                type="number"
                value={formData.memberCount}
                onChange={(e) => setFormData({ ...formData, memberCount: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email *
              </label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="email@example.org"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone *
              </label>
              <Input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+250 788 123 456"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Physical Address *
            </label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter full address"
              rows={2}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              icon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
            >
              {modalMode === 'add' ? 'Add' : 'Save'} {formData.type}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
