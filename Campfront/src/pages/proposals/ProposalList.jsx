import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { proposalApi } from '../../api';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  CheckCircle2, 
  XCircle,
  Clock,
  RefreshCw,
  Inbox,
  CheckCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import Textarea from '../../components/ui/Textarea';
import { useTranslation } from '../../contexts/LanguageContext';

export default function ProposalList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAdmin, isCoordinator } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(isAdmin ? 'PENDING' : 'ALL'); // 'PENDING', 'APPROVED', 'REVISION', 'ALL'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'approve', 'reject', 'revision'
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // Check if user is Department Leader
  const isDepartmentLeader = user?.position === 'DEPARTMENT_LEADER';
  // Check if user is Union Administrator
  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  // Only Coordinators or Dept Leaders create proposals, pure Admins approve them
  const canCreateProposal = isCoordinator || isDepartmentLeader;

  useEffect(() => {
    fetchProposals();
  }, []);

  useEffect(() => {
    filterProposals();
  }, [searchTerm, statusFilter, activeTab, proposals]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setAlert(null);
      let response;
      
      if (isUnionAdmin) {
        response = await proposalApi.getAll();
      } else if (isDepartmentLeader) {
        response = await proposalApi.getMyProposals();
      } else {
        response = await proposalApi.getAll();
      }
      
      if (response.data?.success) {
        setProposals(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setProposals(response.data);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      let errorMessage = t('common.error', 'Failed to fetch proposals');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setAlert({
        type: 'error',
        message: errorMessage
      });
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProposals = () => {
    let filtered = [...proposals];

    // Filter by Tab first
    if (activeTab === 'PENDING') {
      filtered = filtered.filter((p) => 
        ['SUBMITTED', 'PENDING_LEADER_REVIEW', 'RECOMMENDED_BY_LEADER', 'UNDER_REVIEW'].includes(p.status)
      );
    } else if (activeTab === 'APPROVED') {
      filtered = filtered.filter((p) => p.status === 'APPROVED');
    } else if (activeTab === 'REVISION') {
      filtered = filtered.filter((p) => 
        ['REVISION_REQUESTED', 'NEEDS_REVISION', 'REJECTED'].includes(p.status)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.proposedBy?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.proposedBy?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by dropdown status filter
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
      setAlert({ type: 'error', message: t('common.error', 'Please enter review comments') });
      return;
    }

    setSubmitting(true);
    try {
      let response;
      if (reviewAction === 'approve') {
        response = await proposalApi.adminApproval(selectedProposal.id, { comments: reviewComments });
      } else if (reviewAction === 'reject') {
        response = await proposalApi.reject(selectedProposal.id, reviewComments);
      } else if (reviewAction === 'revision') {
        response = await proposalApi.requestRevision(selectedProposal.id, reviewComments);
      }

      if (response.data?.success) {
        setAlert({
          type: 'success',
          message: t('common.success', 'Proposal review submitted successfully')
        });
        setShowReviewModal(false);
        fetchProposals();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || error.response?.data?.error || t('common.error', 'Failed to submit review')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (proposalId) => {
    if (!confirm(t('proposals.confirmSubmit', 'Are you sure you want to submit this proposal for review?'))) return;

    try {
      const response = await proposalApi.submit(proposalId);
      if (response.data?.success) {
        setAlert({ type: 'success', message: t('common.success', 'Proposal submitted for review successfully') });
        fetchProposals();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || t('common.error', 'Failed to submit proposal')
      });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      DRAFT: 'default',
      SUBMITTED: 'info',
      PENDING_LEADER_REVIEW: 'warning',
      RECOMMENDED_BY_LEADER: 'primary',
      UNDER_REVIEW: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      REVISION_REQUESTED: 'warning',
      NEEDS_REVISION: 'warning',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {t(`status.${status}`, status ? status.replace(/_/g, ' ') : 'UNKNOWN')}
      </Badge>
    );
  };

  const pendingCount = proposals.filter((p) => 
    ['SUBMITTED', 'PENDING_LEADER_REVIEW', 'RECOMMENDED_BY_LEADER', 'UNDER_REVIEW'].includes(p.status)
  ).length;

  const approvedCount = proposals.filter((p) => p.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('proposals.title', 'Event Proposals')}</h1>
          <p className="text-gray-600 mt-1">
            {t('proposals.subtitle', 'Submit, track, and manage official RUM event proposals')}
          </p>
        </div>
        {canCreateProposal && (
          <Link to="/app/proposals/new">
            <Button 
              variant="primary" 
              icon={<Plus className="w-4 h-4" />}
              className="whitespace-nowrap"
            >
              + {t('proposals.newProposal', 'New Proposal')}
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
              activeTab === 'PENDING'
                ? 'border-primary-500 text-primary-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            {t('dashboard.pendingProposals', 'Pending Approval')}
            {pendingCount > 0 && (
              <span className="ml-1 bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('APPROVED')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
              activeTab === 'APPROVED'
                ? 'border-primary-500 text-primary-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            {t('status.APPROVED', 'Approved')} ({approvedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REVISION')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
              activeTab === 'REVISION'
                ? 'border-primary-500 text-primary-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            {t('status.REVISION_REQUESTED', 'Revisions & Rejected')}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
              activeTab === 'ALL'
                ? 'border-primary-500 text-primary-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Inbox className="w-4 h-4" />
            {t('common.all', 'All Proposals')} ({proposals.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder={t('proposals.searchPlaceholder', 'Search proposals by event name or venue...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: t('proposals.allStatuses', 'All Statuses') },
                { value: 'SUBMITTED', label: t('status.SUBMITTED', 'Submitted') },
                { value: 'PENDING_LEADER_REVIEW', label: t('status.PENDING_LEADER_REVIEW', 'Pending Leader Review') },
                { value: 'RECOMMENDED_BY_LEADER', label: t('status.RECOMMENDED_BY_LEADER', 'Recommended By Leader') },
                { value: 'APPROVED', label: t('status.APPROVED', 'Approved') },
                { value: 'REVISION_REQUESTED', label: t('status.REVISION_REQUESTED', 'Revision Requested') },
                { value: 'REJECTED', label: t('status.REJECTED', 'Rejected') },
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Proposals List Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'PENDING'
              ? `${t('dashboard.pendingProposals', 'Pending Review Proposals')} (${filteredProposals.length})`
              : activeTab === 'APPROVED'
              ? `${t('status.APPROVED', 'Approved Proposals')} (${filteredProposals.length})`
              : activeTab === 'REVISION'
              ? `${t('status.REVISION_REQUESTED', 'Revisions & Rejected Proposals')} (${filteredProposals.length})`
              : `${t('common.all', 'All Proposals')} (${filteredProposals.length})`}
          </CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>{t('common.loading', 'Loading...')}</span>
              </div>
            </div>
          ) : filteredProposals.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-12 h-12 text-gray-400" />}
              title={t('proposals.noProposalsFound', 'No proposals found')}
              message={t('proposals.noProposalsFound', 'No event proposals matching your criteria.')}
              action={
                canCreateProposal && (
                  <Button
                    variant="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => navigate('/app/proposals/new')}
                  >
                    {t('proposals.newProposal', 'New Proposal')}
                  </Button>
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('proposals.eventName', 'Event Name')}</TableHead>
                  <TableHead>{t('proposals.hostingMinistry', 'Ministry / Department')}</TableHead>
                  <TableHead>{t('proposals.scope', 'Scope')}</TableHead>
                  <TableHead>{t('proposals.startDate', 'Dates')}</TableHead>
                  <TableHead>{t('proposals.estimatedBudget', 'Budget')}</TableHead>
                  <TableHead>{t('common.status', 'Status')}</TableHead>
                  <TableHead>{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((proposal) => {
                  const creatorName = proposal.proposedBy 
                    ? `${proposal.proposedBy.firstName} ${proposal.proposedBy.lastName}`
                    : proposal.createdBy
                    ? `${proposal.createdBy.firstName} ${proposal.createdBy.lastName}`
                    : 'System User';

                  const isPendingReview = ['SUBMITTED', 'PENDING_LEADER_REVIEW', 'RECOMMENDED_BY_LEADER', 'UNDER_REVIEW'].includes(proposal.status);

                  return (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">{proposal.eventName}</p>
                          <p className="text-xs text-gray-500">{t('proposals.proposedBy', 'Proposed by')}: {creatorName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {t(`ministries.${proposal.department?.type}`, proposal.department?.name || 'N/A')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{proposal.scope || 'FIELD'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{proposal.startDate ? new Date(proposal.startDate).toLocaleDateString() : 'N/A'}</p>
                          <p className="text-gray-500 text-xs">to {proposal.endDate ? new Date(proposal.endDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {proposal.estimatedBudget != null ? new Intl.NumberFormat('en-RW', { 
                          style: 'currency', 
                          currency: 'RWF',
                          maximumFractionDigits: 0 
                        }).format(proposal.estimatedBudget) : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/app/proposals/${proposal.id}`}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              icon={<Eye className="w-4 h-4" />}
                              title={t('common.viewDetails', 'View Details')}
                            >
                              {t('common.view', 'View')}
                            </Button>
                          </Link>
                          
                          {proposal.status === 'DRAFT' && canCreateProposal && (
                            <>
                              <Link to={`/app/proposals/${proposal.id}/edit`}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  icon={<Edit className="w-4 h-4" />}
                                  title={t('common.edit', 'Edit')}
                                >
                                  {t('common.edit', 'Edit')}
                                </Button>
                              </Link>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSubmit(proposal.id)}
                                title={t('common.submit', 'Submit')}
                              >
                                {t('common.submit', 'Submit')}
                              </Button>
                            </>
                          )}

                          {isUnionAdmin && isPendingReview && (
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant="success"
                                size="sm"
                                icon={<CheckCircle2 className="w-4 h-4" />}
                                onClick={() => handleReviewAction(proposal, 'approve')}
                              >
                                {t('proposals.approveAndCreate', 'Approve')}
                              </Button>
                              <Button
                                variant="warning"
                                size="sm"
                                icon={<RefreshCw className="w-4 h-4" />}
                                onClick={() => handleReviewAction(proposal, 'revision')}
                              >
                                {t('proposals.requestRevision', 'Revision')}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                icon={<XCircle className="w-4 h-4" />}
                                onClick={() => handleReviewAction(proposal, 'reject')}
                              >
                                {t('proposals.rejectProposal', 'Reject')}
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={`${reviewAction === 'approve' ? t('proposals.approveAndCreate', 'Approve') : reviewAction === 'reject' ? t('proposals.rejectProposal', 'Reject') : t('proposals.requestRevision', 'Request Revision')} ${t('proposals.title', 'Proposal')}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReviewModal(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'success' : reviewAction === 'reject' ? 'danger' : 'warning'}
              onClick={submitReview}
              loading={submitting}
            >
              {reviewAction === 'approve' ? t('proposals.approveAndCreate', 'Approve & Create Event') : reviewAction === 'reject' ? t('proposals.rejectProposal', 'Reject') : t('proposals.requestRevision', 'Request Revision')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">{t('proposals.title', 'Proposal')}: {selectedProposal?.eventName}</p>
            <p className="text-sm text-gray-600">Please provide your review comments:</p>
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
              message="Approving this proposal will officially approve it, auto-create the official Event record, and send a notification to the coordinator."
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
