import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import OrganizationUnitSelector from '../../components/ui/OrganizationUnitSelector';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useDashboard, useProposals } from '../../hooks';
import { eventApi } from '../../api';

import { useTranslation } from '../../contexts/LanguageContext';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [filterUnit, setFilterUnit] = useState({ fieldId: '', districtId: '' });
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useDashboard();
  const {
    pendingProposals,
    loading: proposalsLoading,
    error: proposalsError,
    fetchPendingReview,
    approveProposal,
    rejectProposal,
    requestRevision
  } = useProposals();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'approve', 'reject', 'revision'
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchPendingReview();
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    if (stats) {
      generateMonthlyData();
    }
  }, [stats]);

  const fetchUpcomingEvents = async () => {
    try {
      const response = await eventApi.getUpcoming();
      const events = response.data.data || [];
      setUpcomingEvents(events.slice(0, 5));
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    }
  };

  const generateMonthlyData = () => {
    // Generate sample monthly data for charts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map((month, index) => ({
      month,
      events: Math.floor(Math.random() * 20) + 5,
      participants: Math.floor(Math.random() * 200) + 50
    }));
    setMonthlyData(data);
  };

  const handleOpenProposalModal = (proposal) => {
    setSelectedProposal(proposal);
    setShowProposalModal(true);
    setComments('');
    setReviewAction(null);
    setActionError(null);
  };

  const handleCloseProposalModal = () => {
    setShowProposalModal(false);
    setSelectedProposal(null);
    setComments('');
    setReviewAction(null);
    setActionError(null);
  };

  const handleProposalAction = async () => {
    if (!selectedProposal || !reviewAction) return;

    setActionLoading(true);
    setActionError(null);

    try {
      if (reviewAction === 'approve') {
        await approveProposal(selectedProposal.id);
        setSuccessMessage(`Proposal "${selectedProposal.eventName}" approved successfully! Event has been auto-created.`);
      } else if (reviewAction === 'reject') {
        if (!comments.trim()) {
          setActionError('Please provide rejection comments');
          setActionLoading(false);
          return;
        }
        await rejectProposal(selectedProposal.id, comments);
        setSuccessMessage(`Proposal "${selectedProposal.eventName}" rejected.`);
      } else if (reviewAction === 'revision') {
        if (!comments.trim()) {
          setActionError('Please provide revision comments');
          setActionLoading(false);
          return;
        }
        await requestRevision(selectedProposal.id, comments);
        setSuccessMessage(`Revision requested for proposal "${selectedProposal.eventName}".`);
      }

      handleCloseProposalModal();
      await refreshStats();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to process proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      SUBMITTED: 'info',
      UNDER_REVIEW: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      REVISION_REQUESTED: 'warning',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const loading = statsLoading || proposalsLoading;
  const error = statsError || proposalsError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.adminDashboard', 'Admin Dashboard')}</h1>
        <p className="text-gray-600 mt-1">{t('dashboard.adminOverview', 'System overview and management')}</p>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => {}}
        />
      )}

      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Report & Scope District Filter Bar */}
      <Card className="bg-white border-primary-100 shadow-sm">
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary-600" />
              <h2 className="text-sm font-semibold text-gray-800">
                {t('dashboard.reportFilterTitle', 'Evangelical District & Field Report Filter')}
              </h2>
            </div>
            {filterUnit.districtId && (
              <span className="text-xs px-2.5 py-1 bg-primary-100 text-primary-800 rounded-full font-medium">
                District Filter Active
              </span>
            )}
          </div>
          <OrganizationUnitSelector
            showChurch={false}
            value={filterUnit}
            onChange={({ fieldId, districtId, organizationUnitId }) => {
              setFilterUnit({ fieldId, districtId: districtId || organizationUnitId });
            }}
          />
        </CardBody>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalUsers', 'Total Users')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {t('dashboard.activeUsersNote', 'Active system users')}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalEvents', 'Total Events')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalEvents || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {t('dashboard.allTimeEventsNote', 'All time events')}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.pendingProposals', 'Pending Proposals')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.pendingProposalsCount || 0}</p>
                <p className="text-xs text-amber-600 mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {t('dashboard.requireReviewNote', 'Require review')}
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
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalRevenue', 'Total Revenue')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats?.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {t('dashboard.verifiedPaymentsNote', 'Verified payments')}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.eventsOverview', 'Events Overview (Last 6 Months)')}</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="events" fill="#0ea5e9" name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.participantGrowth', 'Participant Growth')}</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="participants" stroke="#10b981" strokeWidth={2} name="Participants" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Proposals Review Queue */}
        <Card>
          <CardHeader action={
            <Link to="/app/proposals">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          }>
            <CardTitle>Pending Proposals ({pendingProposals.length})</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {pendingProposals.length > 0 ? (
                pendingProposals.slice(0, 5).map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{proposal.eventName}</p>
                      <p className="text-sm text-gray-600">
                        {proposal.department?.name || 'N/A'} • {proposal.eventType}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        By: {proposal.proposedBy?.firstName} {proposal.proposedBy?.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(proposal.status)}
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenProposalModal(proposal)}
                        icon={<Eye className="w-4 h-4" />}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No pending proposals</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader action={
            <Link to="/app/events">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          }>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.startDate).toLocaleDateString('en-RW')}
                      </p>
                      <div className="mt-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((event.registrationCount || 0) / (event.capacity || 1) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.registrationCount || 0} / {event.capacity || 0} registered
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No upcoming events</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/app/proposals">
              <Button variant="outline" className="w-full" icon={<FileText className="w-4 h-4" />}>
                Review Proposals ({stats?.pendingProposalsCount || 0})
              </Button>
            </Link>
            <Link to="/app/users">
              <Button variant="outline" className="w-full" icon={<Users className="w-4 h-4" />}>
                Manage Users
              </Button>
            </Link>
            <Link to="/app/events">
              <Button variant="outline" className="w-full" icon={<Calendar className="w-4 h-4" />}>
                View All Events
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Proposal Review Modal */}
      {showProposalModal && selectedProposal && (
        <Modal
          isOpen={showProposalModal}
          onClose={handleCloseProposalModal}
          title="Review Proposal"
          size="lg"
        >
          <div className="space-y-4">
            {/* Proposal Details */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-lg text-gray-900">{selectedProposal.eventName}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Event Type</p>
                  <p className="font-medium">{selectedProposal.eventType}</p>
                </div>
                <div>
                  <p className="text-gray-600">Department</p>
                  <p className="font-medium">{selectedProposal.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Proposed By</p>
                  <p className="font-medium">
                    {selectedProposal.proposedBy?.firstName} {selectedProposal.proposedBy?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  {getStatusBadge(selectedProposal.status)}
                </div>
                <div>
                  <p className="text-gray-600">Dates</p>
                  <p className="font-medium">
                    {new Date(selectedProposal.startDate).toLocaleDateString()} - {new Date(selectedProposal.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Venue</p>
                  <p className="font-medium">{selectedProposal.venue}</p>
                </div>
                <div>
                  <p className="text-gray-600">Expected Participants</p>
                  <p className="font-medium">{selectedProposal.expectedParticipants || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Estimated Budget</p>
                  <p className="font-medium">{formatCurrency(selectedProposal.estimatedBudget)}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600">Objectives</p>
                <p className="text-sm mt-1">{selectedProposal.objectives}</p>
              </div>
              {selectedProposal.requiredResources && (
                <div>
                  <p className="text-gray-600">Required Resources</p>
                  <p className="text-sm mt-1">{selectedProposal.requiredResources}</p>
                </div>
              )}
              {selectedProposal.reviewComments && (
                <div>
                  <p className="text-gray-600">Previous Comments</p>
                  <p className="text-sm mt-1 italic text-gray-700">{selectedProposal.reviewComments}</p>
                </div>
              )}
            </div>

            {actionError && (
              <Alert type="error" message={actionError} />
            )}

            {/* Action Selection */}
            {!reviewAction ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Select Action:</p>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="success"
                    onClick={() => setReviewAction('approve')}
                    icon={<CheckCircle className="w-5 h-5" />}
                    className="justify-start"
                  >
                    <div className="text-left">
                      <div className="font-semibold">Approve & Create Event</div>
                      <div className="text-xs opacity-90">Approve proposal and automatically create event</div>
                    </div>
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => setReviewAction('revision')}
                    icon={<AlertCircle className="w-5 h-5" />}
                    className="justify-start"
                  >
                    <div className="text-left">
                      <div className="font-semibold">Request Revision</div>
                      <div className="text-xs opacity-90">Send back for modifications</div>
                    </div>
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setReviewAction('reject')}
                    icon={<XCircle className="w-5 h-5" />}
                    className="justify-start"
                  >
                    <div className="text-left">
                      <div className="font-semibold">Reject Proposal</div>
                      <div className="text-xs opacity-90">Decline this proposal</div>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Action: <span className="text-primary-600">{reviewAction.toUpperCase()}</span>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReviewAction(null);
                      setComments('');
                      setActionError(null);
                    }}
                  >
                    Change
                  </Button>
                </div>

                {reviewAction !== 'approve' && (
                  <Textarea
                    label="Comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={`Enter ${reviewAction} comments...`}
                    rows={4}
                    required
                  />
                )}

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={handleProposalAction}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    {actionLoading ? 'Processing...' : `Confirm ${reviewAction}`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCloseProposalModal}
                    disabled={actionLoading}
                  >
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
