import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { accommodationApi } from '../../api';
import { 
  Building2, 
  DoorOpen, 
  Bed, 
  MapPin, 
  Calendar, 
  Users, 
  ShieldCheck, 
  AlertCircle, 
  MessageSquarePlus, 
  Clock, 
  Phone, 
  Mail, 
  Send, 
  Info,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { useTranslation } from '../../contexts/LanguageContext';

export default function ParticipantAccommodationView() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [alert, setAlert] = useState(null);

  // Issue reporting modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueForm, setIssueForm] = useState({
    issueType: 'ROOM_SWITCH',
    details: '',
    preferredRoomOrBed: '',
    contactPhone: user?.phoneNumber || '',
  });

  useEffect(() => {
    fetchMyAccommodation(selectedEventId);
  }, [selectedEventId]);

  const fetchMyAccommodation = async (eventId) => {
    try {
      setLoading(true);
      setAlert(null);
      const res = await accommodationApi.getMyAccommodation(eventId);
      const accData = res.data?.data || res.data;
      setData(accData);

      // Auto-select event if not already set and events exist
      if (!selectedEventId && accData?.registeredEvents?.length > 0) {
        // Prefer event that has accommodation assigned or the first one
        const assignedEvent = accData.registeredEvents.find(e => e.hasAccommodation);
        const targetEvent = assignedEvent || accData.registeredEvents[0];
        if (targetEvent?.id) {
          setSelectedEventId(targetEvent.id.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching participant accommodation:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.message || t('accommodation.fetchError', 'Failed to load your accommodation.')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenIssueModal = () => {
    setIssueForm({
      issueType: 'ROOM_SWITCH',
      details: '',
      preferredRoomOrBed: '',
      contactPhone: user?.phoneNumber || '',
    });
    setShowIssueModal(true);
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.details.trim()) {
      return;
    }

    const currentEventId = data?.eventId || selectedEventId;
    if (!currentEventId) {
      setAlert({ type: 'error', message: 'No event selected to report issue for.' });
      return;
    }

    setSubmittingIssue(true);
    try {
      await accommodationApi.reportIssue({
        eventId: Number(currentEventId),
        issueType: issueForm.issueType,
        details: issueForm.details.trim(),
        preferredRoomOrBed: issueForm.preferredRoomOrBed.trim() || null,
        contactPhone: issueForm.contactPhone.trim() || null,
      });

      setShowIssueModal(false);
      setAlert({
        type: 'success',
        message: data?.hasCoordinator
          ? t('accommodation.issueSentCoordinator', `Your request was delivered to ${data.coordinatorName} (Coordinator in charge). They will assist you with your room switch.`)
          : t('accommodation.issueSentAdmin', 'Your request was communicated to the System Administrator. They will review and switch your accommodation.')
      });
    } catch (err) {
      console.error('Error submitting accommodation issue:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.message || t('accommodation.issueSubmitError', 'Failed to submit request. Please try again.')
      });
    } finally {
      setSubmittingIssue(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return 'TBA';
    try {
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? String(d) : parsed.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  if (loading && !data) {
    return <PageSpinner message="Loading your assigned accommodation..." />;
  }

  const registeredEvents = data?.registeredEvents || [];
  const hasMultipleEvents = registeredEvents.length > 1;

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bed className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>{t('accommodation.myAccommodationTitle', 'My Accommodation')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('accommodation.myAccommodationSubtitle', 'Your private room location, assigned bed, and accommodation contact.')}
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Event Selector Dropdown if registered for events */}
          {registeredEvents.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="text-xs font-semibold bg-transparent border-none text-slate-800 dark:text-slate-200 pr-8 focus:ring-0 cursor-pointer"
              >
                {registeredEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} {ev.hasAccommodation ? '✓ (Assigned)' : '(Pending)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMyAccommodation(selectedEventId)}
            className="flex items-center gap-1.5"
            title="Refresh accommodation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.refresh', 'Refresh')}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenIssueModal}
            className="flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{t('accommodation.reportIssueBtn', 'Report Issue / Request Switch')}</span>
          </Button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Main View: Either Assigned Card or Pending State */}
      {data?.hasAssignment ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Room Card - 2 cols on desktop */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-indigo-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
              {/* Top ambient colored bar */}
              <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
              
              <CardBody className="p-6 sm:p-8">
                {/* Event Name & Verified Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-black tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
                      {data.eventName}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {data.buildingName}
                    </h2>
                    {data.location && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{data.location}</span>
                      </p>
                    )}
                  </div>

                  <Badge variant="success" className="px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('accommodation.activeAssignment', 'Assigned & Confirmed')}</span>
                  </Badge>
                </div>

                {/* Key Assignment Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {/* Bed Number */}
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-4 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                      {t('accommodation.yourBed', 'Your Bed')}
                    </span>
                    <span className="text-2xl font-black text-indigo-950 dark:text-indigo-200">
                      {data.bedNumber || 'Bed #1'}
                    </span>
                  </div>

                  {/* Room Number */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                      {t('accommodation.roomNumber', 'Room')}
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {data.roomNumber}
                    </span>
                  </div>

                  {/* Floor */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                      {t('accommodation.floor', 'Floor')}
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {data.floor || 'Ground'}
                    </span>
                  </div>

                  {/* Gender Restriction */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                      {t('accommodation.gender', 'Gender Rule')}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block">
                      {data.genderRestriction ? `${data.genderRestriction} Only` : 'All Members'}
                    </span>
                  </div>
                </div>

                {/* Additional Stay Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">{t('accommodation.checkInDate', 'Check-in Date')}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatDate(data.checkInDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">{t('accommodation.checkOutDate', 'Check-out Date')}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatDate(data.checkOutDate)}</span>
                    </div>
                  </div>

                  {data.amenities && (
                    <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400 block mb-1.5 font-bold uppercase tracking-wider text-[10px]">
                        {t('accommodation.amenities', 'Room Amenities')}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {data.amenities.split(',').map((amenity, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-xs"
                          >
                            {amenity.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.notes && (
                    <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400 block mb-1 font-bold uppercase tracking-wider text-[10px]">
                        {t('accommodation.notes', 'Accommodation Notes')}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 italic">{data.notes}</p>
                    </div>
                  )}
                </div>

                {/* Privacy Guarantee Note */}
                <div className="mt-6 flex items-start gap-3 p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-950 dark:text-indigo-200">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">{t('accommodation.privacyNoticeTitle', 'Private Accommodation Assignment')}</span>
                    {t('accommodation.privacyNoticeDesc', 'This view displays exclusively your assigned room and bed. General camp-wide building occupancy and other participants\' locations are protected and kept private.')}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Roommates Card */}
            {data.roommates && data.roommates.length > 0 && (
              <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t('accommodation.roommatesTitle', 'Room Occupants')}</span>
                    <span className="text-xs font-semibold text-slate-400 font-normal">
                      ({data.roommates.length + 1} / {data.capacity || 4} Beds)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardBody className="p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Current User */}
                    <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {user?.firstName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
                            {user?.firstName} {user?.lastName} (You)
                          </p>
                          <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                            {user?.organizationUnitName || 'Church Member'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="primary" size="sm">
                        {data.bedNumber || 'Bed #1'}
                      </Badge>
                    </div>

                    {/* Other Roommates */}
                    {data.roommates.map((rm) => (
                      <div
                        key={rm.id || rm.bedNumber}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                            {rm.name ? rm.name.charAt(0) : 'P'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {rm.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {rm.churchName || 'Church Member'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default" size="sm">
                          {rm.bedNumber || 'Bed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Right Column: Coordinator in Charge & Switch Help */}
          <div className="space-y-6">
            {/* Coordinator in Charge Card */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('accommodation.inChargeTitle', 'Accommodation Authority')}</span>
                </CardTitle>
              </CardHeader>
              <CardBody className="p-4 pt-0 space-y-3.5">
                {data.hasCoordinator ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {t('accommodation.eventCoordinator', 'Event Coordinator in Charge')}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {data.coordinatorName}
                    </h3>

                    {data.coordinatorEmail && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{data.coordinatorEmail}</span>
                      </p>
                    )}

                    {data.coordinatorPhone && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{data.coordinatorPhone}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      {t('accommodation.adminManaged', 'System Administration Only')}
                    </span>
                    <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      {t('accommodation.noCoordinatorDirect', 'No direct event coordinator assigned')}
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                      {t('accommodation.adminHandles', 'Your requests will be directed straight to the System Administrator for room changes.')}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    variant="primary"
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5"
                    onClick={handleOpenIssueModal}
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>{t('accommodation.requestSwitchBtn', 'Request Room Switch / Report Problem')}</span>
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Helpful FAQ / Guidance Card */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50">
              <CardBody className="p-5 text-xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold">
                  <Info className="w-4 h-4" />
                  <span>{t('accommodation.faqTitle', 'Accommodation Guidelines')}</span>
                </div>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300 list-disc list-inside leading-relaxed">
                  <li>
                    {t('accommodation.guideline1', 'Gender separation is strictly enforced across all dormitories.')}
                  </li>
                  <li>
                    {t('accommodation.guideline2', 'Bed assignments must be respected to avoid conflicts upon arrival.')}
                  </li>
                  <li>
                    {t('accommodation.guideline3', 'To switch rooms or beds, submit a request above. The coordinator or admin will review and update your spot.')}
                  </li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : (
        /* Empty / Pending State: Registered for event but no room assigned yet */
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm text-center p-8 sm:p-12">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center shadow-md">
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {t('accommodation.pendingTitle', 'Room Assignment in Progress')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {data?.eventName ? (
                  <>
                    You are registered for <strong className="text-slate-800 dark:text-slate-200">{data.eventName}</strong>. 
                    The event accommodation team is currently organizing rooms according to gender separation and capacity rules.
                  </>
                ) : (
                  <>
                    You have not been assigned to a room yet. If you have registered for an upcoming event, your room assignment will appear here once allocated.
                  </>
                )}
              </p>
            </div>

            {/* In-charge Info if available */}
            {data?.hasCoordinator && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-left">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                  {t('accommodation.coordinatorInCharge', 'Event Coordinator:')}
                </span>
                <span className="text-slate-900 dark:text-white font-extrabold">{data.coordinatorName}</span>
                {data.coordinatorEmail && <span className="block text-slate-500 dark:text-slate-400">{data.coordinatorEmail}</span>}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={handleOpenIssueModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>{t('accommodation.requestUrgentRoom', 'Request Accommodation / Contact Coordinator')}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchMyAccommodation(selectedEventId)}
                className="w-full sm:w-auto text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                <span>{t('common.checkAgain', 'Check Again')}</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Report Issue / Request Room Switch Modal */}
      {showIssueModal && (
        <Modal
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          title={t('accommodation.reportModalTitle', 'Report Accommodation Issue / Request Switch')}
          size="md"
        >
          <form onSubmit={handleSubmitIssue} className="space-y-4">
            {/* Target Recipient Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-indigo-950 dark:text-indigo-200">
                  {t('accommodation.routingTitle', 'Direct Routing')}
                </span>
                <p className="text-indigo-800 dark:text-indigo-300 mt-0.5">
                  {data?.hasCoordinator ? (
                    <>
                      This request will be sent directly to <strong>{data.coordinatorName}</strong> (Coordinator in charge of this event).
                    </>
                  ) : (
                    <>
                      No event coordinator is assigned; your request will be delivered to the <strong>System Administrator</strong> only.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Event Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {t('accommodation.event', 'Event')}
              </label>
              <input
                type="text"
                disabled
                value={data?.eventName || 'Selected Event'}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            {/* Current Room Details if assigned */}
            {data?.hasAssignment && (
              <div className="text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>{t('accommodation.currentRoom', 'Current Assignment:')}</span>
                <strong className="text-slate-900 dark:text-white">
                  {data.buildingName} - Room {data.roomNumber} ({data.bedNumber})
                </strong>
              </div>
            )}

            {/* Issue Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {t('accommodation.issueType', 'Issue Category')} <span className="text-rose-500">*</span>
              </label>
              <select
                value={issueForm.issueType}
                onChange={(e) => setIssueForm({ ...issueForm, issueType: e.target.value })}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              >
                <option value="ROOM_SWITCH">Room or Bed Switch Request</option>
                <option value="ACCESSIBILITY">Accessibility / Medical Need (e.g. Ground Floor, Disability Access)</option>
                <option value="MAINTENANCE">Maintenance / Facility Problem (Broken Bed, Water, Electricity, Lock)</option>
                <option value="ROOMMATE_CONFLICT">Roommate / Room Adjustment Request</option>
                <option value="OTHER">Other Accommodation Inquiry</option>
              </select>
            </div>

            {/* Preferred Room or Bed (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {t('accommodation.preferredSpot', 'Preferred Room / Bed (Optional)')}
              </label>
              <input
                type="text"
                value={issueForm.preferredRoomOrBed}
                onChange={(e) => setIssueForm({ ...issueForm, preferredRoomOrBed: e.target.value })}
                placeholder="e.g. Ground floor room, switch with friend Lydia, Bed near entrance"
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {t('accommodation.phone', 'Your Contact Phone')}
              </label>
              <input
                type="text"
                value={issueForm.contactPhone}
                onChange={(e) => setIssueForm({ ...issueForm, contactPhone: e.target.value })}
                placeholder="e.g. +250 788 123 456"
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Details */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {t('accommodation.details', 'Explanation / Reason')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={issueForm.details}
                onChange={(e) => setIssueForm({ ...issueForm, details: e.target.value })}
                placeholder="Please describe why you need to switch or the problem you are experiencing with your accommodation..."
                className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowIssueModal(false)}
                disabled={submittingIssue}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submittingIssue || !issueForm.details.trim()}
                className="flex items-center gap-1.5 font-bold"
              >
                {submittingIssue ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('common.sending', 'Sending...')}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('accommodation.submitRequest', 'Submit Request')}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
