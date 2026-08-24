import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { proposalApi } from '../../api';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  FileText,
  Edit,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Building,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';

export default function ProposalDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'leader_recommend', 'leader_revision', 'leader_reject', 'admin_approve', 'admin_revision', 'admin_reject'
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Authorization checks
  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const isFieldLeader = user?.position === 'FIELD_LEADER';
  const isDeptLeader = user?.position === 'DEPARTMENT_LEADER';
  const isDistrictPastor = user?.position === 'DISTRICT_PASTOR';

  useEffect(() => {
    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await proposalApi.getById(id);
      if (response.data.success) {
        setProposal(response.data.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch proposal'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (action) => {
    setReviewAction(action);
    setReviewComments('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewComments.trim()) {
      setAlert({ type: 'error', message: 'Please provide review comments or recommendations.' });
      return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
      let response;
      
      if (reviewAction === 'leader_recommend') {
        response = await proposalApi.leaderReview(id, {
          decision: 'RECOMMENDED_BY_LEADER',
          comments: reviewComments.trim()
        });
      } else if (reviewAction === 'leader_revision') {
        response = await proposalApi.leaderReview(id, {
          decision: 'REVISION_REQUESTED',
          comments: reviewComments.trim()
        });
      } else if (reviewAction === 'leader_reject') {
        response = await proposalApi.leaderReview(id, {
          decision: 'REJECTED',
          comments: reviewComments.trim()
        });
      } else if (reviewAction === 'admin_approve') {
        response = await proposalApi.adminApproval(id, {
          decision: 'APPROVED',
          comments: reviewComments.trim()
        });
      } else if (reviewAction === 'admin_revision') {
        response = await proposalApi.requestRevision(id, reviewComments.trim());
      } else if (reviewAction === 'admin_reject') {
        response = await proposalApi.reject(id, reviewComments.trim());
      }

      if (response?.data?.success) {
        setAlert({
          type: 'success',
          message: reviewAction === 'admin_approve'
            ? 'Proposal successfully approved! Official event record has been generated and locked.'
            : reviewAction === 'leader_recommend'
            ? 'Proposal successfully recommended and forwarded to Union Administrator for final approval.'
            : 'Decision recorded successfully.'
        });
        setShowReviewModal(false);
        fetchProposal();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit decision'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProposal = async () => {
    if (!confirm('Are you sure you want to submit this proposal for hierarchical review?')) return;

    try {
      const response = await proposalApi.submit(id);
      if (response.data.success) {
        setAlert({ type: 'success', message: 'Proposal submitted successfully for leader review.' });
        fetchProposal();
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
      PENDING_LEADER_REVIEW: 'info',
      RECOMMENDED_BY_LEADER: 'warning',
      UNDER_REVIEW: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      REVISION_REQUESTED: 'warning',
    };
    return (
      <Badge variant={variants[status] || 'default'} size="lg">
        {status?.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return <PageSpinner message="Loading proposal details..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Proposal not found</h2>
        <p className="text-gray-600 mt-2">The proposal you're looking for doesn't exist.</p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => navigate('/proposals')}
        >
          Back to Proposals
        </Button>
      </div>
    );
  }

  const isOwner = proposal.proposedById === user?.userId || proposal.proposedById === user?.id;
  const canEdit = (proposal.status === 'DRAFT' || proposal.status === 'REVISION_REQUESTED') && (isOwner || isUnionAdmin);
  const canSubmit = (proposal.status === 'DRAFT' || proposal.status === 'REVISION_REQUESTED') && (isOwner || isUnionAdmin);

  // Level 1 Leader review permissions
  const isPendingLeaderReview = proposal.status === 'SUBMITTED' || proposal.status === 'PENDING_LEADER_REVIEW';
  const canLeaderReview = isPendingLeaderReview && (
    isUnionAdmin ||
    (proposal.scope === 'FIELD' && (isFieldLeader || isUnionAdmin)) ||
    (proposal.scope === 'UNION' && (isDeptLeader || isUnionAdmin)) ||
    (proposal.scope === 'DISTRICT' && (isDistrictPastor || isFieldLeader || isUnionAdmin))
  );

  // Level 2 Admin final approval permissions
  const isPendingAdminApproval = proposal.status === 'RECOMMENDED_BY_LEADER' || proposal.status === 'UNDER_REVIEW' || (isPendingLeaderReview && isUnionAdmin);
  const canAdminApprove = isUnionAdmin && proposal.status !== 'APPROVED' && proposal.status !== 'REJECTED';

  // Step Calculation for Visual Stepper
  const getStepStatus = (stepIndex) => {
    // 0: Draft, 1: Leader Review, 2: Admin Approval, 3: Event Created
    if (proposal.status === 'DRAFT') {
      return stepIndex === 0 ? 'current' : 'upcoming';
    }
    if (proposal.status === 'SUBMITTED' || proposal.status === 'PENDING_LEADER_REVIEW') {
      if (stepIndex === 0) return 'complete';
      if (stepIndex === 1) return 'current';
      return 'upcoming';
    }
    if (proposal.status === 'RECOMMENDED_BY_LEADER' || proposal.status === 'UNDER_REVIEW') {
      if (stepIndex <= 1) return 'complete';
      if (stepIndex === 2) return 'current';
      return 'upcoming';
    }
    if (proposal.status === 'APPROVED') {
      return 'complete';
    }
    if (proposal.status === 'REJECTED') {
      if (stepIndex === 0) return 'complete';
      return 'error';
    }
    if (proposal.status === 'REVISION_REQUESTED') {
      if (stepIndex === 0) return 'current';
      return 'warning';
    }
    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/proposals')}
            className="mb-3"
          >
            Back to Proposals
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{proposal.eventName}</h1>
            <Badge variant="info" size="md">
              {proposal.scope} SCOPE
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(proposal.status)}
            <Badge variant="default">{proposal.eventType}</Badge>
            {proposal.targetOrganizationUnitName && (
              <span className="text-xs text-gray-600 font-medium flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full">
                <Building className="w-3.5 h-3.5 text-gray-500" />
                Target Unit: {proposal.targetOrganizationUnitName}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 flex-wrap items-center">
          {canEdit && (
            <Link to={`/proposals/${id}/edit`}>
              <Button variant="ghost" icon={<Edit className="w-4 h-4" />}>
                Edit Proposal
              </Button>
            </Link>
          )}
          
          {canSubmit && (
            <Button variant="primary" onClick={handleSubmitProposal} icon={<Sparkles className="w-4 h-4" />}>
              Submit for Review
            </Button>
          )}

          {/* Level 1: Leader Actions */}
          {canLeaderReview && (
            <div className="flex gap-2 p-1.5 bg-blue-50 border border-blue-200 rounded-xl">
              <Button
                variant="primary"
                size="sm"
                icon={<Award className="w-4 h-4 text-white" />}
                onClick={() => handleOpenReview('leader_recommend')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Recommend to Union
              </Button>
              <Button
                variant="warning"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => handleOpenReview('leader_revision')}
              >
                Request Changes
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => handleOpenReview('leader_reject')}
              >
                Reject
              </Button>
            </div>
          )}

          {/* Level 2: Union Administrator Actions */}
          {canAdminApprove && (
            <div className="flex gap-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <Button
                variant="success"
                size="sm"
                icon={<ShieldCheck className="w-4 h-4 text-white" />}
                onClick={() => handleOpenReview('admin_approve')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
              >
                Final Approve & Lock Event
              </Button>
              <Button
                variant="warning"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => handleOpenReview('admin_revision')}
              >
                Admin Revision
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => handleOpenReview('admin_reject')}
              >
                Admin Reject
              </Button>
            </div>
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

      {/* Official Event Created Notification Banner */}
      {proposal.status === 'APPROVED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950">
                Official Event Record Created & Locked
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Dates and venue are confirmed. The official event has been initialized in the system catalog.
              </p>
            </div>
          </div>
          {proposal.createdEventId && (
            <Link to={`/events/${proposal.createdEventId}`}>
              <Button variant="success" size="sm" icon={<ExternalLink className="w-4 h-4" />}>
                View Event {proposal.createdEventCode && `(${proposal.createdEventCode})`}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Interactive Multi-Tier Approval Stepper */}
      <Card className="overflow-hidden border-slate-200">
        <CardBody className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
            Approval & Governance Pipeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1: Proposal Submission */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              getStepStatus(0) === 'complete' ? 'bg-emerald-50/70 border-emerald-200' :
              getStepStatus(0) === 'current' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                getStepStatus(0) === 'complete' ? 'bg-emerald-600 text-white' :
                getStepStatus(0) === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                {getStepStatus(0) === 'complete' ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Submission</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {proposal.proposedByName || 'Coordinator / Dept Leader'}
                </p>
              </div>
            </div>

            {/* Step 2: Level 1 Leader Review */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              getStepStatus(1) === 'complete' ? 'bg-emerald-50/70 border-emerald-200' :
              getStepStatus(1) === 'current' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' :
              getStepStatus(1) === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                getStepStatus(1) === 'complete' ? 'bg-emerald-600 text-white' :
                getStepStatus(1) === 'current' ? 'bg-blue-600 text-white' :
                getStepStatus(1) === 'error' ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                {getStepStatus(1) === 'complete' ? <CheckCircle2 className="w-4 h-4" /> :
                 getStepStatus(1) === 'error' ? <XCircle className="w-4 h-4" /> : '2'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Level 1 Leader</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {proposal.leaderReviewedByName ? `Recommended by ${proposal.leaderReviewedByName}` : 'Field/Union Leader Review'}
                </p>
              </div>
            </div>

            {/* Step 3: Level 2 Union Administrator Approval */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              getStepStatus(2) === 'complete' ? 'bg-emerald-50/70 border-emerald-200' :
              getStepStatus(2) === 'current' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                getStepStatus(2) === 'complete' ? 'bg-emerald-600 text-white' :
                getStepStatus(2) === 'current' ? 'bg-amber-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                {getStepStatus(2) === 'complete' ? <CheckCircle2 className="w-4 h-4" /> : '3'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Level 2 Union Admin</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {proposal.adminApprovedByName ? `Approved by ${proposal.adminApprovedByName}` : 'Final Governance Review'}
                </p>
              </div>
            </div>

            {/* Step 4: Event Lock & Generation */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              getStepStatus(3) === 'complete' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                getStepStatus(3) === 'complete' ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                {getStepStatus(3) === 'complete' ? <CheckCircle2 className="w-4 h-4" /> : '4'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Event Created</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {proposal.createdEventCode ? `Official ${proposal.createdEventCode}` : 'Automatic generation'}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Overview & Logistics</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Event Dates</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(proposal.startDate).toLocaleDateString('en-RW')}
                    </p>
                    <p className="text-xs text-gray-500">
                      to {new Date(proposal.endDate).toLocaleDateString('en-RW')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Venue & Location</p>
                    <p className="font-semibold text-gray-900">{proposal.venue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Expected Attendance</p>
                    <p className="font-semibold text-gray-900">
                      {proposal.expectedParticipants ? `${proposal.expectedParticipants} Participants` : 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Estimated Budget</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(proposal.estimatedBudget)}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Objectives */}
          <Card>
            <CardHeader>
              <CardTitle>Objectives & Spiritual Goals</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.objectives}</p>
            </CardBody>
          </Card>

          {/* Required Resources */}
          {proposal.requiredResources && (
            <Card>
              <CardHeader>
                <CardTitle>Required Resources & Equipment</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.requiredResources}</p>
              </CardBody>
            </Card>
          )}

          {/* Review History / Comments Log */}
          {proposal.reviewHistory && proposal.reviewHistory.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <CardTitle>Multi-Level Review History & Audit Log</CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {proposal.reviewHistory.map((rev, index) => (
                    <div key={rev.id || index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{rev.reviewerName}</span>
                          {rev.reviewerPosition && (
                            <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-medium">
                              {rev.reviewerPosition.replace(/_/g, ' ')}
                            </span>
                          )}
                          <Badge variant={
                            rev.decision === 'APPROVED' || rev.decision === 'RECOMMENDED_BY_LEADER' ? 'success' :
                            rev.decision === 'REJECTED' ? 'danger' : 'warning'
                          }>
                            {rev.decision?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {rev.createdAt ? new Date(rev.createdAt).toLocaleString('en-RW') : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-100">
                        {rev.comments}
                      </p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Governance Metadata</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Scope Level</p>
                  <p className="font-semibold text-gray-900">{proposal.scope} Scope</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="font-semibold text-gray-900">{proposal.departmentName || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Target Organization Unit</p>
                  <p className="font-semibold text-gray-900">{proposal.targetOrganizationUnitName || 'Union Wide'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Proposed By</p>
                  <p className="font-semibold text-gray-900">{proposal.proposedByName}</p>
                </div>

                {proposal.leaderReviewedByName && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700 font-semibold">Level 1 Leader Review</p>
                    <p className="text-sm text-blue-950 font-medium">{proposal.leaderReviewedByName}</p>
                    {proposal.leaderReviewedAt && (
                      <p className="text-xs text-blue-600 mt-0.5">
                        {new Date(proposal.leaderReviewedAt).toLocaleString('en-RW')}
                      </p>
                    )}
                  </div>
                )}

                {proposal.adminApprovedByName && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <p className="text-xs text-emerald-700 font-semibold">Level 2 Union Admin Approval</p>
                    <p className="text-sm text-emerald-950 font-medium">{proposal.adminApprovedByName}</p>
                    {proposal.adminApprovedAt && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {new Date(proposal.adminApprovedAt).toLocaleString('en-RW')}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <p>Created: {new Date(proposal.createdAt).toLocaleDateString('en-RW')}</p>
                  {proposal.updatedAt && <p>Updated: {new Date(proposal.updatedAt).toLocaleDateString('en-RW')}</p>}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Review Decision Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={
          reviewAction === 'admin_approve' ? 'Level 2: Final Approval & Event Locking' :
          reviewAction === 'leader_recommend' ? 'Level 1: Recommend Proposal to Union' :
          reviewAction?.includes('reject') ? 'Reject Proposal' : 'Request Proposal Revisions'
        }
        footer={
          <div className="flex justify-between w-full items-center">
            <Button variant="ghost" onClick={() => setShowReviewModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={
                reviewAction?.includes('approve') || reviewAction?.includes('recommend') ? 'primary' :
                reviewAction?.includes('reject') ? 'danger' : 'warning'
              }
              onClick={submitReview}
              loading={submitting}
            >
              Confirm Decision
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {reviewAction === 'admin_approve' && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Union Administrator Final Approval</p>
                <p className="mt-0.5">
                  Confirming approval locks the proposed dates and venue, and automatically creates the official event record in the events catalog.
                </p>
              </div>
            </div>
          )}

          {reviewAction === 'leader_recommend' && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-950">Respective Leader Recommendation</p>
                <p className="mt-0.5">
                  Recommending this proposal marks Level 1 Leader endorsement and advances the proposal to the Union Administrator for final review.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Review Notes & Decision Comments <span className="text-red-500">*</span>
            </label>
            <Textarea
              rows={5}
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              placeholder="Enter comprehensive review feedback, recommendations, or justification..."
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
