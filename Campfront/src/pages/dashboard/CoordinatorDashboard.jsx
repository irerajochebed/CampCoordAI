import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, FileText, Users, CheckCircle2,
  Clock, AlertCircle, PlusCircle, Eye,
  CheckCircle, XCircle, ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../hooks';
import { eventApi, proposalApi } from '../../api';
import { useTranslation } from '../../contexts/LanguageContext';

export default function CoordinatorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    pendingProposals,
    pendingCount,
    loading: proposalsLoading,
    fetchPendingReview,
    fetchPendingCount,
    endorseProposal,
    fieldReviewProposal,
    requestRevision,
  } = useProposals();

  const [myEvents, setMyEvents] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [stats, setStats] = useState({ myEvents: 0, myProposals: 0, pendingReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Review modal state
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'endorse' | 'field-approve' | 'field-reject' | 'revision'
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const isFieldLeader = user?.position === 'FIELD_LEADER';
  const isDeptLeader = user?.position === 'DEPARTMENT_LEADER';

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, proposalsRes] = await Promise.all([
        eventApi.getMyEvents().catch(() => ({ data: { data: [] } })),
        proposalApi.getMyProposals().catch(() => ({ data: { data: [] } })),
      ]);

      const events = eventsRes.data?.data || [];
      const proposals = proposalsRes.data?.data || [];

      setMyEvents(events.slice(0, 5));
      setMyProposals(proposals.slice(0, 5));
      setStats({
        myEvents: events.length,
        myProposals: proposals.length,
        pendingReviews: pendingCount,
      });
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, pendingCount]);

  useEffect(() => {
    fetchPendingReview();
    fetchPendingCount();
    fetchDashboardData();
  }, []);

  // Keep stats.pendingReviews in sync with pendingCount
  useEffect(() => {
    setStats(prev => ({ ...prev, pendingReviews: pendingCount }));
  }, [pendingCount]);

  const openReviewModal = (proposal) => {
    setSelectedProposal(proposal);
    setReviewAction(null);
    setComments('');
    setActionError(null);
  };

  const closeReviewModal = () => {
    setSelectedProposal(null);
    setReviewAction(null);
    setComments('');
    setActionError(null);
  };

  const handleAction = async () => {
    if (!selectedProposal || !reviewAction) return;
    if (reviewAction !== 'field-approve' && reviewAction !== 'endorse' && !comments.trim()) {
      setActionError('Please provide comments');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      if (reviewAction === 'endorse') {
        await endorseProposal(selectedProposal.id, comments || 'Endorsed');
        setSuccessMessage(`Proposal "${selectedProposal.eventName}" endorsed and escalated to Union Admin.`);
      } else if (reviewAction === 'field-approve') {
        await fieldReviewProposal(selectedProposal.id, 'APPROVED', comments);
        setSuccessMessage(`Proposal "${selectedProposal.eventName}" approved. Event auto-created.`);
      } else if (reviewAction === 'field-reject') {
        await fieldReviewProposal(selectedProposal.id, 'REJECTED', comments);
        setSuccessMessage(`Proposal "${selectedProposal.eventName}" rejected.`);
      } else if (reviewAction === 'revision') {
        await requestRevision(selectedProposal.id, comments);
        setSuccessMessage(`Revision requested for "${selectedProposal.eventName}".`);
      }
      closeReviewModal();
      await fetchDashboardData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getScopeBadge = (scope) => (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      scope === 'UNION' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
    }`}>
      {scope}
    </span>
  );

  const getStatusBadge = (status) => {
    const map = {
      PLANNED: 'info', REGISTRATION_OPEN: 'success', ONGOING: 'warning',
      COMPLETED: 'default', SUBMITTED: 'info', UNDER_REVIEW: 'warning',
      APPROVED: 'success', REJECTED: 'danger', REVISION_REQUESTED: 'warning', DRAFT: 'default',
    };
    return <Badge variant={map[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  // What actions are available depends on position + proposal scope
  const getAvailableActions = (proposal) => {
    if (isFieldLeader && proposal.scope === 'FIELD') {
      return [
        { key: 'field-approve', label: 'Approve', icon: <CheckCircle className="w-4 h-4" />, variant: 'success' },
        { key: 'field-reject', label: 'Reject', icon: <XCircle className="w-4 h-4" />, variant: 'danger' },
        { key: 'revision', label: 'Request Revision', icon: <AlertCircle className="w-4 h-4" />, variant: 'warning' },
      ];
    }
    if (isDeptLeader && proposal.scope === 'UNION' && !proposal.deptLeaderEndorsed) {
      return [
        { key: 'endorse', label: 'Endorse & Escalate', icon: <ArrowRight className="w-4 h-4" />, variant: 'primary' },
        { key: 'revision', label: 'Request Revision', icon: <AlertCircle className="w-4 h-4" />, variant: 'warning' },
      ];
    }
    return [];
  };

  const pendingLabel = isFieldLeader
    ? 'Field Proposals Pending Your Review'
    : isDeptLeader
    ? 'Union Proposals Pending Your Endorsement'
    : 'Pending Reviews';

  if (loading && myEvents.length === 0) {
    return <PageSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.coordinatorDashboard', 'Coordinator Dashboard')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.position?.replace(/_/g, ' ')} &mdash; {user?.organizationUnitName || 'Rwanda Union Mission'}
          </p>
        </div>
        <Link to="/app/proposals/new">
          <Button variant="primary" icon={<PlusCircle className="w-4 h-4" />}>
            {t('dashboard.createProposal', 'New Proposal')}
          </Button>
        </Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.activeEvents', 'My Events')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.myEvents}</p>
                <p className="text-xs text-blue-600 mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />{t('dashboard.activeUsersNote', 'Active & upcoming')}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('nav.proposals', 'My Proposals')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.myProposals}</p>
                <p className="text-xs text-amber-600 mt-1">
                  <FileText className="w-3 h-3 inline mr-1" />{t('dashboard.allTimeEventsNote', 'All time')}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingCount}</p>
                <p className="text-xs text-red-600 mt-1">
                  <AlertCircle className="w-3 h-3 inline mr-1" />Action required
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scope-aware pending proposals */}
        {(isFieldLeader || isDeptLeader) && (
          <Card>
            <CardHeader action={
              <Link to="/app/proposals">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            }>
              <CardTitle>{pendingLabel} ({pendingProposals.length})</CardTitle>
            </CardHeader>
            <CardBody>
              {proposalsLoading ? (
                <p className="text-sm text-gray-500 text-center py-6">Loading...</p>
              ) : pendingProposals.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No proposals pending your review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingProposals.slice(0, 5).map(proposal => (
                    <div key={proposal.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-900 text-sm truncate">{proposal.eventName}</p>
                            {getScopeBadge(proposal.scope)}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            By {proposal.proposedByName} &bull; {proposal.departmentName}
                          </p>
                          <div className="mt-1">{getStatusBadge(proposal.status)}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<Eye className="w-3 h-3" />}
                          onClick={() => openReviewModal(proposal)}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* My recent events */}
        <Card>
          <CardHeader action={
            <Link to="/app/events">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          }>
            <CardTitle>My Events</CardTitle>
          </CardHeader>
          <CardBody>
            {myEvents.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No events yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myEvents.map(event => (
                  <div key={event.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{event.name}</p>
                          {getStatusBadge(event.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(event.startDate).toLocaleDateString('en-RW')}
                          &nbsp;&bull;&nbsp;
                          <Users className="w-3 h-3 inline mr-1" />
                          {event.totalRegistrations || 0} registered
                        </p>
                      </div>
                      <Link to={`/app/events/${event.id}`}>
                        <Button variant="outline" size="sm">Manage</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* My recent proposals */}
        <Card>
          <CardHeader action={
            <Link to="/app/proposals">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          }>
            <CardTitle>My Proposals</CardTitle>
          </CardHeader>
          <CardBody>
            {myProposals.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No proposals yet</p>
                <Link to="/app/proposals/new">
                  <Button variant="primary" size="sm" className="mt-3">Create First Proposal</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myProposals.map(proposal => (
                  <div key={proposal.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm truncate">{proposal.eventName}</p>
                          {getScopeBadge(proposal.scope)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(proposal.status)}
                          {proposal.scope === 'UNION' && proposal.deptLeaderEndorsed && (
                            <span className="text-xs text-green-600 font-medium">&#10003; Endorsed</span>
                          )}
                        </div>
                      </div>
                      <Link to={`/app/proposals/${proposal.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/app/proposals/new">
              <Button variant="outline" className="w-full" icon={<FileText className="w-4 h-4" />}>
                Create Proposal
              </Button>
            </Link>
            <Link to="/app/registrations">
              <Button variant="outline" className="w-full" icon={<Users className="w-4 h-4" />}>
                Registrations
              </Button>
            </Link>
            <Link to="/app/accommodation">
              <Button variant="outline" className="w-full" icon={<Calendar className="w-4 h-4" />}>
                Assign Rooms
              </Button>
            </Link>
            <Link to="/app/attendance">
              <Button variant="outline" className="w-full" icon={<CheckCircle2 className="w-4 h-4" />}>
                Attendance
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Review Modal */}
      {selectedProposal && (
        <Modal
          isOpen={!!selectedProposal}
          onClose={closeReviewModal}
          title="Review Proposal"
          size="lg"
        >
          <div className="space-y-4">
            {/* Proposal summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-base">{selectedProposal.eventName}</h3>
                {getScopeBadge(selectedProposal.scope)}
                {getStatusBadge(selectedProposal.status)}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-gray-600">
                <span><strong>Type:</strong> {selectedProposal.eventType}</span>
                <span><strong>Dept:</strong> {selectedProposal.departmentName}</span>
                <span><strong>By:</strong> {selectedProposal.proposedByName}</span>
                <span><strong>Target:</strong> {selectedProposal.targetOrganizationUnitName}</span>
                <span><strong>Dates:</strong> {selectedProposal.startDate} &rarr; {selectedProposal.endDate}</span>
                <span><strong>Venue:</strong> {selectedProposal.venue}</span>
              </div>
              <div>
                <strong className="text-gray-700">Objectives:</strong>
                <p className="mt-1 text-gray-600">{selectedProposal.objectives}</p>
              </div>
              {selectedProposal.reviewComments && (
                <div>
                  <strong className="text-gray-700">Previous Comments:</strong>
                  <p className="mt-1 italic text-gray-500">{selectedProposal.reviewComments}</p>
                </div>
              )}
            </div>

            {actionError && <Alert type="error" message={actionError} />}

            {/* Action buttons */}
            {!reviewAction ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Select action:</p>
                {getAvailableActions(selectedProposal).map(action => (
                  <Button
                    key={action.key}
                    variant={action.variant}
                    icon={action.icon}
                    className="w-full justify-start"
                    onClick={() => setReviewAction(action.key)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Action: <span className="text-primary-600 uppercase">{reviewAction.replace('-', ' ')}</span>
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => { setReviewAction(null); setComments(''); setActionError(null); }}>
                    Change
                  </Button>
                </div>

                {reviewAction !== 'field-approve' && (
                  <Textarea
                    label="Comments"
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    placeholder="Enter your comments..."
                    rows={3}
                    required={reviewAction !== 'endorse'}
                  />
                )}

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    loading={actionLoading}
                    onClick={handleAction}
                  >
                    Confirm
                  </Button>
                  <Button variant="outline" onClick={closeReviewModal} disabled={actionLoading}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
