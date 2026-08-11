import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { proposalApi } from '../../api';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  CheckCircle2, 
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Textarea from '../../components/ui/Textarea';

export default function ProposalList() {
  const { user, isAdmin, isCoordinator } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'approve', 'reject', 'revision'
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // Check if user is Department Leader
  const isDepartmentLeader = user?.position === 'DEPARTMENT_LEADER';
  // Check if user is Union Administrator (can be Admin role OR Coordinator with Union Admin position)
  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    fetchProposals();
  }, []);

  useEffect(() => {
    filterProposals();
  }, [searchTerm, statusFilter, proposals]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setAlert(null); // Clear previous alerts
      let response;
      
      if (isUnionAdmin) {
        // Union Admin sees all proposals
        response = await proposalApi.getAll();
      } else if (isDepartmentLeader) {
        // Department Leaders see only their proposals
        response = await proposalApi.getMyProposals();
      } else {
        // Others see all (read-only)
        response = await proposalApi.getAll();
      }
      
      if (response.data.success) {
        setProposals(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      
      // Better error message based on error type
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        // Server responded with an error
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Redirecting to login...';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to view proposals';
        } else {
          errorMessage = error.response.data?.message || 'Failed to fetch proposals';
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please check if the backend is running on port 8080.';
      } else {
        errorMessage = error.message || 'Failed to fetch proposals';
      }
      
      setAlert({
        type: 'error',
        message: errorMessage
      });
      setProposals([]); // Set empty array to show empty state
    } finally {
      setLoading(false);
    }
  };

  const filterProposals = () => {
    let filtered = [...proposals];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.venue?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProposals(filtered);
  };

  const handleReviewAction = (proposal, action) => {
    setSelectedProposal(proposal);
    setReviewAction(action);
    setReviewComments('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewComments.trim()) {
      setAlert({ type: 'error', message: 'Please enter comments' });
      return;
    }

    setSubmitting(true);
    try {
      let response;
      
      if (reviewAction === 'approve') {
        response = await proposalApi.approve(selectedProposal.id, reviewComments);
      } else if (reviewAction === 'reject') {
        response = await proposalApi.reject(selectedProposal.id, reviewComments);
      } else if (reviewAction === 'revision') {
        response = await proposalApi.requestRevision(selectedProposal.id, reviewComments);
      }

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `Proposal ${reviewAction === 'approve' ? 'approved' : reviewAction === 'reject' ? 'rejected' : 'sent for revision'} successfully`
        });
        setShowReviewModal(false);
        fetchProposals();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit review'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (proposalId) => {
    if (!confirm('Are you sure you want to submit this proposal for review?')) return;

    try {
      const response = await proposalApi.submit(proposalId);
      if (response.data.success) {
        setAlert({ type: 'success', message: 'Proposal submitted successfully' });
        fetchProposals();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit proposal'
      });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      DRAFT: 'default',
      SUBMITTED: 'info',
      UNDER_REVIEW: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      NEEDS_REVISION: 'warning',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'NEEDS_REVISION', label: 'Needs Revision' },
  ];

  if (loading) {
    return <PageSpinner message="Loading proposals..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Proposals</h1>
          <p className="text-gray-600 mt-1">
            {isUnionAdmin 
              ? 'Review and approve event proposals from department leaders' 
              : isDepartmentLeader
              ? 'Create and manage your department proposals'
              : 'View event proposals'}
          </p>
        </div>
        {isDepartmentLeader && (
          <Link to="/proposals/new">
            <Button 
              variant="primary" 
              icon={<Plus className="w-4 h-4" />}
              className="whitespace-nowrap"
            >
              Create New Proposal
            </Button>
          </Link>
        )}
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by event name, department, or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
            />
          </div>
        </CardBody>
      </Card>

      {/* Proposals Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredProposals.length} Proposal{filteredProposals.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardBody>
          {filteredProposals.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-12 h-12" />}
              title="No proposals found"
              description={
                searchTerm || statusFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : isDepartmentLeader
                  ? 'Create your first proposal for your department to get started'
                  : 'No proposals have been submitted yet'
              }
              action={
                isDepartmentLeader && (
                  <Link to="/proposals/new">
                    <Button variant="primary">Create Proposal</Button>
                  </Link>
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Expected Participants</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{proposal.eventName}</p>
                        <p className="text-xs text-gray-500">Created by: {proposal.createdBy?.firstName} {proposal.createdBy?.lastName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{proposal.department?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="info">{proposal.eventType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(proposal.startDate).toLocaleDateString()}</p>
                        <p className="text-gray-500">to {new Date(proposal.endDate).toLocaleDateString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>{proposal.expectedParticipants}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('en-RW', { 
                        style: 'currency', 
                        currency: 'RWF',
                        maximumFractionDigits: 0 
                      }).format(proposal.estimatedBudget)}
                    </TableCell>
                    <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/proposals/${proposal.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<Eye className="w-4 h-4" />}
                            title="View details"
                          >
                            View
                          </Button>
                        </Link>
                        
                        {proposal.status === 'DRAFT' && proposal.createdBy?.id === user.userId && isDepartmentLeader && (
                          <>
                            <Link to={`/proposals/${proposal.id}/edit`}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                icon={<Edit className="w-4 h-4" />}
                                title="Edit proposal"
                              >
                                Edit
                              </Button>
                            </Link>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleSubmit(proposal.id)}
                              title="Submit for review"
                            >
                              Submit for Review
                            </Button>
                          </>
                        )}

                        {isUnionAdmin && (proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW') && (
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="success"
                              size="sm"
                              icon={<CheckCircle2 className="w-4 h-4" />}
                              onClick={() => handleReviewAction(proposal, 'approve')}
                              title="Approve proposal"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="warning"
                              size="sm"
                              icon={<RefreshCw className="w-4 h-4" />}
                              onClick={() => handleReviewAction(proposal, 'revision')}
                              title="Request revision"
                            >
                              Revision
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<XCircle className="w-4 h-4" />}
                              onClick={() => handleReviewAction(proposal, 'reject')}
                              title="Reject proposal"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={`${reviewAction === 'approve' ? 'Approve' : reviewAction === 'reject' ? 'Reject' : 'Request Revision'} Proposal`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'success' : reviewAction === 'reject' ? 'danger' : 'warning'}
              onClick={submitReview}
              loading={submitting}
            >
              {reviewAction === 'approve' ? 'Approve' : reviewAction === 'reject' ? 'Reject' : 'Request Revision'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">Proposal: {selectedProposal?.eventName}</p>
            <p className="text-sm text-gray-600">Please provide your comments:</p>
          </div>
          
          <Textarea
            rows={6}
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            placeholder="Enter your review comments here..."
            required
          />

          {reviewAction === 'approve' && (
            <Alert
              type="info"
              message="Approving this proposal will automatically create an event and notify the coordinator."
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
