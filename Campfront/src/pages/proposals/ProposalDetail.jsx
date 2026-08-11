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
  Clock
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
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if user is Department Leader
  const isDepartmentLeader = user?.position === 'DEPARTMENT_LEADER';
  // Check if user is Union Administrator (can be Admin role OR Coordinator with Union Admin position)
  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

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

  const handleReviewAction = (action) => {
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
        response = await proposalApi.approve(id, reviewComments);
      } else if (reviewAction === 'reject') {
        response = await proposalApi.reject(id, reviewComments);
      } else if (reviewAction === 'revision') {
        response = await proposalApi.requestRevision(id, reviewComments);
      }

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `Proposal ${reviewAction === 'approve' ? 'approved' : reviewAction === 'reject' ? 'rejected' : 'sent for revision'} successfully`
        });
        setShowReviewModal(false);
        fetchProposal();
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

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this proposal for review?')) return;

    try {
      const response = await proposalApi.submit(id);
      if (response.data.success) {
        setAlert({ type: 'success', message: 'Proposal submitted successfully' });
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
      UNDER_REVIEW: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      NEEDS_REVISION: 'warning',
    };
    return (
      <Badge variant={variants[status] || 'default'} size="lg">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  const isOwner = proposal.createdBy?.id === user.userId;
  const canEdit = proposal.status === 'DRAFT' && isOwner && isDepartmentLeader;
  const canSubmit = proposal.status === 'DRAFT' && isOwner && isDepartmentLeader;
  const canReview = isUnionAdmin && (proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/proposals')}
            className="mb-4"
          >
            Back to Proposals
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{proposal.eventName}</h1>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(proposal.status)}
            <Badge variant="info">{proposal.eventType}</Badge>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <Link to={`/proposals/${id}/edit`}>
              <Button variant="ghost" icon={<Edit className="w-4 h-4" />}>
                Edit
              </Button>
            </Link>
          )}
          
          {canSubmit && (
            <Button variant="primary" onClick={handleSubmit}>
              Submit for Review
            </Button>
          )}

          {canReview && (
            <>
              <Button
                variant="success"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => handleReviewAction('approve')}
              >
                Approve
              </Button>
              <Button
                variant="warning"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => handleReviewAction('revision')}
              >
                Request Revision
              </Button>
              <Button
                variant="danger"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => handleReviewAction('reject')}
              >
                Reject
              </Button>
            </>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Event Dates</p>
                    <p className="font-medium text-gray-900">
                      {new Date(proposal.startDate).toLocaleDateString('en-RW')}
                    </p>
                    <p className="text-sm text-gray-500">
                      to {new Date(proposal.endDate).toLocaleDateString('en-RW')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Venue</p>
                    <p className="font-medium text-gray-900">{proposal.venue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expected Participants</p>
                    <p className="font-medium text-gray-900">
                      {proposal.expectedParticipants || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Budget</p>
                    <p className="font-medium text-gray-900">
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
              <CardTitle>Objectives</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700 whitespace-pre-wrap">{proposal.objectives}</p>
            </CardBody>
          </Card>

          {/* Required Resources */}
          {proposal.requiredResources && (
            <Card>
              <CardHeader>
                <CardTitle>Required Resources</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700 whitespace-pre-wrap">{proposal.requiredResources}</p>
              </CardBody>
            </Card>
          )}

          {/* Review Comments */}
          {proposal.reviewComments && (
            <Card>
              <CardHeader>
                <CardTitle>Review Comments</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{proposal.reviewComments}</p>
                  {proposal.reviewedBy && (
                    <p className="text-sm text-gray-500 mt-2">
                      - {proposal.reviewedBy.firstName} {proposal.reviewedBy.lastName}
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{proposal.department?.name || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Proposed By</p>
                  <p className="font-medium text-gray-900">
                    {proposal.createdBy?.firstName} {proposal.createdBy?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{proposal.createdBy?.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(proposal.createdAt).toLocaleDateString('en-RW')}
                  </p>
                </div>

                {proposal.updatedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {new Date(proposal.updatedAt).toLocaleDateString('en-RW')}
                    </p>
                  </div>
                )}

                {proposal.reviewedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Reviewed</p>
                    <p className="font-medium text-gray-900">
                      {new Date(proposal.reviewedAt).toLocaleDateString('en-RW')}
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    proposal.status === 'DRAFT' ? 'bg-gray-200' : 'bg-green-500'
                  }`}>
                    {proposal.status !== 'DRAFT' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Draft</p>
                    <p className="text-xs text-gray-500">Proposal created</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(proposal.status)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}>
                    {['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(proposal.status) && (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Submitted</p>
                    <p className="text-xs text-gray-500">Awaiting review</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    proposal.status === 'APPROVED'
                      ? 'bg-green-500'
                      : proposal.status === 'REJECTED'
                      ? 'bg-red-500'
                      : 'bg-gray-200'
                  }`}>
                    {proposal.status === 'APPROVED' && <CheckCircle2 className="w-5 h-5 text-white" />}
                    {proposal.status === 'REJECTED' && <XCircle className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {proposal.status === 'APPROVED' ? 'Approved' : 
                       proposal.status === 'REJECTED' ? 'Rejected' : 'Decision'}
                    </p>
                    <p className="text-xs text-gray-500">Final status</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

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
            <p className="text-sm text-gray-600 mb-2">Please provide your comments:</p>
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
