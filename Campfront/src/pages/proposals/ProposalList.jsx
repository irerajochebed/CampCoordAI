import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { proposalApi, getCachedData } from '../../api';
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
  CheckCheck,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  MapPin,
  Building,
  DollarSign
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

  const initialData = useMemo(() => {
    const cached = getCachedData('/proposals');
    if (cached?.data && Array.isArray(cached.data)) return cached.data;
    if (Array.isArray(cached)) return cached;
    return [];
  }, []);

  const [proposals, setProposals] = useState(initialData);
  const [filteredProposals, setFilteredProposals] = useState(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(isAdmin ? 'PENDING' : 'ALL'); // 'PENDING', 'APPROVED', 'REVISION', 'ALL'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'approve', 'reject', 'revision'
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // User position & role checks
  const isDepartmentLeader = user?.position === 'DEPARTMENT_LEADER';
  const isFieldLeader = user?.position === 'FIELD_LEADER';
  const isDistrictPastor = user?.position === 'DISTRICT_PASTOR' || user?.position === 'PASTOR';
  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const canCreateProposal = isCoordinator || isDepartmentLeader || isDistrictPastor || isFieldLeader || isUnionAdmin;

  useEffect(() => {
    fetchProposals(initialData.length > 0);
  }, []);

  useEffect(() => {
    filterProposals();
  }, [searchTerm, statusFilter, activeTab, proposals]);

  const fetchProposals = async (isBackground = false) => {
    try {
      if (!isBackground && proposals.length === 0) {
        setLoading(true);
      }
      setAlert(null);
      const response = await proposalApi.getAll();
      
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
      if (proposals.length === 0) {
        setAlert({
          type: 'error',
          message: errorMessage
        });
        setProposals([]);
      }
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
          p.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.proposedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.proposedBy?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.proposedBy?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.targetOrganizationUnitName?.toLowerCase().includes(searchTerm.toLowerCase())
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
        const isDistrictOrField = selectedProposal.scope === 'DISTRICT' || selectedProposal.scope === 'FIELD';
        if (isDistrictOrField || user?.position === 'DEPARTMENT_LEADER') {
          response = await proposalApi.leaderReview(selectedProposal.id, {
            recommendation: 'ENDORSED',
            comments: reviewComments
          });
        } else {
          response = await proposalApi.adminApproval(selectedProposal.id, { comments: reviewComments });
        }
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
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
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
          ) : viewMode === 'grid' ? (
            /* =========================================================================
               CARD GRID VIEW (Matching modern Cards design)
               ========================================================================= */
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-950/20">
              {filteredProposals.map((proposal) => {
                const creatorName = proposal.proposedByName
                  || (proposal.proposedBy ? `${proposal.proposedBy.firstName} ${proposal.proposedBy.lastName}` : null)
                  || (proposal.createdBy ? `${proposal.createdBy.firstName} ${proposal.createdBy.lastName}` : null)
                  || 'System User';

                const deptName = proposal.departmentName
                  || proposal.department?.name
                  || 'General Ministries';

                const targetUnitName = proposal.targetOrganizationUnitName
                  || proposal.targetOrganizationUnit?.name
                  || '';

                const isPendingReview = ['SUBMITTED', 'PENDING_LEADER_REVIEW', 'RECOMMENDED_BY_LEADER', 'UNDER_REVIEW'].includes(proposal.status);

                const isAuthor = Boolean(
                  (user?.id && (proposal.proposedById === user.id || proposal.proposedBy?.id === user.id || proposal.createdById === user.id)) ||
                  (user?.email && (proposal.proposedBy?.email === user.email || proposal.createdBy?.email === user.email))
                );

                const isDistrictScope = proposal.scope === 'DISTRICT';
                const isFieldScope = proposal.scope === 'FIELD';
                const isUnionScope = proposal.scope === 'UNION' || !proposal.scope;

                const canApprove = !isAuthor && (
                  (isDistrictScope && (isFieldLeader || isUnionAdmin)) ||
                  (isFieldScope && (isFieldLeader || isUnionAdmin)) ||
                  (isUnionScope && (isUnionAdmin || (isDepartmentLeader && proposal.status === 'SUBMITTED')))
                );

                return (
                  <div
                    key={proposal.id}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header: Scope Badge on Left, Status Badge on Right */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <Badge variant={proposal.scope === 'UNION' ? 'primary' : proposal.scope === 'FIELD' ? 'info' : 'warning'}>
                          {proposal.scope || 'FIELD'} SCOPE
                        </Badge>
                        <div>
                          {getStatusBadge(proposal.status)}
                        </div>
                      </div>

                      {/* Proposal Title */}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {proposal.eventName}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {t('proposals.proposedBy', 'Proposed by')}: <span className="font-semibold text-slate-700 dark:text-slate-300">{creatorName}</span>
                      </p>

                      {/* Metadata Rows */}
                      <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {/* Ministry / Department */}
                        <div className="flex items-center gap-2.5">
                          <Building className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{deptName}</span>
                        </div>

                        {/* Jurisdiction */}
                        {targetUnitName && (
                          <div className="flex items-center gap-2.5">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate">{targetUnitName}</span>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                            {proposal.startDate ? new Date(proposal.startDate).toLocaleDateString() : 'TBA'}
                            {proposal.endDate ? ` – ${new Date(proposal.endDate).toLocaleDateString()}` : ''}
                          </span>
                        </div>

                        {/* Budget */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500 text-[11px] font-medium">Est. Budget:</span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {proposal.estimatedBudget != null ? new Intl.NumberFormat('en-RW', { 
                              style: 'currency', 
                              currency: 'RWF',
                              maximumFractionDigits: 0 
                            }).format(proposal.estimatedBudget) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <Link to={`/app/proposals/${proposal.id}`} state={{ proposal }}>
                        <Button 
                          variant="outline" 
                          size="xs" 
                          icon={<Eye className="w-3.5 h-3.5" />}
                        >
                          {t('common.view', 'View')}
                        </Button>
                      </Link>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {proposal.status === 'DRAFT' && (isAuthor || canCreateProposal) && (
                          <>
                            <Link to={`/app/proposals/${proposal.id}/edit`}>
                              <Button 
                                variant="ghost" 
                                size="xs" 
                                icon={<Edit className="w-3.5 h-3.5" />}
                              >
                                {t('common.edit', 'Edit')}
                              </Button>
                            </Link>
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleSubmit(proposal.id)}
                            >
                              {t('common.submit', 'Submit')}
                            </Button>
                          </>
                        )}

                        {canApprove && isPendingReview && (
                          <>
                            <Button
                              variant="success"
                              size="xs"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              onClick={() => handleReviewAction(proposal, 'approve')}
                            >
                              {isUnionScope && isDepartmentLeader ? t('proposals.endorse', 'Endorse') : t('proposals.approveAndCreate', 'Approve')}
                            </Button>
                            <Button
                              variant="warning"
                              size="xs"
                              icon={<RefreshCw className="w-3.5 h-3.5" />}
                              onClick={() => handleReviewAction(proposal, 'revision')}
                            >
                              {t('proposals.requestRevision', 'Revision')}
                            </Button>
                            <Button
                              variant="danger"
                              size="xs"
                              icon={<XCircle className="w-3.5 h-3.5" />}
                              onClick={() => handleReviewAction(proposal, 'reject')}
                            >
                              {t('proposals.rejectProposal', 'Reject')}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('proposals.eventName', 'Event Name')}</TableHead>
                  <TableHead>{t('proposals.hostingMinistry', 'Ministry / Department')}</TableHead>
                  <TableHead>{t('proposals.scope', 'Scope & Jurisdiction')}</TableHead>
                  <TableHead>{t('proposals.startDate', 'Dates')}</TableHead>
                  <TableHead>{t('proposals.estimatedBudget', 'Budget')}</TableHead>
                  <TableHead>{t('common.status', 'Status')}</TableHead>
                  <TableHead>{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((proposal) => {
                  const creatorName = proposal.proposedByName
                    || (proposal.proposedBy ? `${proposal.proposedBy.firstName} ${proposal.proposedBy.lastName}` : null)
                    || (proposal.createdBy ? `${proposal.createdBy.firstName} ${proposal.createdBy.lastName}` : null)
                    || 'System User';

                  const deptName = proposal.departmentName
                    || proposal.department?.name
                    || 'General Ministries';

                  const targetUnitName = proposal.targetOrganizationUnitName
                    || proposal.targetOrganizationUnit?.name
                    || '';

                  const isPendingReview = ['SUBMITTED', 'PENDING_LEADER_REVIEW', 'RECOMMENDED_BY_LEADER', 'UNDER_REVIEW'].includes(proposal.status);

                  const isAuthor = Boolean(
                    (user?.id && (proposal.proposedById === user.id || proposal.proposedBy?.id === user.id || proposal.createdById === user.id)) ||
                    (user?.email && (proposal.proposedBy?.email === user.email || proposal.createdBy?.email === user.email))
                  );

                  const isDistrictScope = proposal.scope === 'DISTRICT';
                  const isFieldScope = proposal.scope === 'FIELD';
                  const isUnionScope = proposal.scope === 'UNION' || !proposal.scope;

                  const canApprove = !isAuthor && (
                    (isDistrictScope && (isFieldLeader || isUnionAdmin)) ||
                    (isFieldScope && (isFieldLeader || isUnionAdmin)) ||
                    (isUnionScope && (isUnionAdmin || (isDepartmentLeader && proposal.status === 'SUBMITTED')))
                  );

                  return (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">{proposal.eventName}</p>
                          <p className="text-xs text-gray-500">{t('proposals.proposedBy', 'Proposed by')}: {creatorName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {deptName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={proposal.scope === 'UNION' ? 'primary' : proposal.scope === 'FIELD' ? 'info' : 'warning'}>
                          {proposal.scope || 'FIELD'}
                        </Badge>
                        {targetUnitName && (
                          <span className="text-xs text-gray-500 block mt-0.5">{targetUnitName}</span>
                        )}
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
                          <Link to={`/app/proposals/${proposal.id}`} state={{ proposal }}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              icon={<Eye className="w-4 h-4" />}
                              title={t('common.viewDetails', 'View Details')}
                            >
                              {t('common.view', 'View')}
                            </Button>
                          </Link>
                          
                          {proposal.status === 'DRAFT' && (isAuthor || canCreateProposal) && (
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

                          {canApprove && isPendingReview && (
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant="success"
                                size="sm"
                                icon={<CheckCircle2 className="w-4 h-4" />}
                                onClick={() => handleReviewAction(proposal, 'approve')}
                              >
                                {isUnionScope && isDepartmentLeader ? t('proposals.endorse', 'Endorse') : t('proposals.approveAndCreate', 'Approve')}
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
        title={`${reviewAction === 'approve' ? (selectedProposal?.scope === 'UNION' && isDepartmentLeader ? t('proposals.endorse', 'Endorse') : t('proposals.approveAndCreate', 'Approve')) : reviewAction === 'reject' ? t('proposals.rejectProposal', 'Reject') : t('proposals.requestRevision', 'Request Revision')} ${t('proposals.title', 'Proposal')}`}
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
              {reviewAction === 'approve' ? (selectedProposal?.scope === 'UNION' && isDepartmentLeader ? t('proposals.endorse', 'Endorse Proposal') : t('proposals.approveAndCreate', 'Approve & Create Event')) : reviewAction === 'reject' ? t('proposals.rejectProposal', 'Reject') : t('proposals.requestRevision', 'Request Revision')}
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
              message={
                selectedProposal?.scope === 'DISTRICT'
                  ? "Approving this District proposal will officially approve it and create the official District event."
                  : selectedProposal?.scope === 'FIELD'
                  ? "Approving this Field proposal will officially approve it, auto-create the official event, and notify Rwanda Union Mission (RUM) Administration."
                  : isDepartmentLeader
                  ? "Endorsing this Union proposal will advance it to Tier 2 (Union Administrator) for final approval."
                  : "Approving this Union proposal will give final authorization and auto-create the official Union event."
              }
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

