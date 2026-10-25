import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { accommodationApi, registrationApi } from '../../api';
import { 
  ArrowLeft,
  Search,
  UserPlus,
  Home,
  Bed,
  Users,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  X,
  Calendar,
  LogOut,
  DoorOpen,
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

export default function RoomAssignment() {
  const navigate = useNavigate();
  const { id: accommodationId } = useParams();
  const { user, isAdmin, isCoordinator } = useAuth();
  
  const [accommodation, setAccommodation] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [unassignedRegistrations, setUnassignedRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [autoAssigning, setAutoAssigning] = useState(false);
  
  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('');
  const [bedNumber, setBedNumber] = useState('1');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [notes, setNotes] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [modalAlert, setModalAlert] = useState(null);

  // Search & Filter
  const [regSearchQuery, setRegSearchQuery] = useState('');
  const [releasingId, setReleasingId] = useState(null);

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const isAccommodationOfficer = user?.position === 'ACCOMMODATION_OFFICER';
  const canManage = isUnionAdmin || isCoordinator || isAccommodationOfficer;

  const parseDateToInput = (dateVal) => {
    if (!dateVal) return '';
    if (Array.isArray(dateVal)) {
      const [y, m, d] = dateVal;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (typeof dateVal === 'string') {
      return dateVal.split('T')[0];
    }
    return '';
  };

  const formatDisplayDate = (d) => {
    if (!d) return '';
    if (Array.isArray(d)) {
      const [y, m, day] = d;
      return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    try {
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? String(d) : parsed.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  useEffect(() => {
    fetchAccommodationAndRooms();
  }, [accommodationId]);

  const fetchAccommodationAndRooms = async () => {
    try {
      setLoading(true);
      const [accRes, roomsRes] = await Promise.all([
        accommodationApi.getById(accommodationId),
        accommodationApi.getRoomsByAccommodation(accommodationId)
      ]);

      const accData = accRes.data?.data || accRes.data;
      const roomsData = roomsRes.data?.data || roomsRes.data || [];

      setAccommodation(accData);
      setRooms(Array.isArray(roomsData) ? roomsData : []);

      if (accData?.event?.id) {
        await fetchRegistrations(accData.event.id);
        
        // Set default dates safely
        if (accData.event.startDate) {
          setCheckInDate(parseDateToInput(accData.event.startDate));
        } else {
          setCheckInDate(new Date().toISOString().split('T')[0]);
        }
        if (accData.event.endDate) {
          setCheckOutDate(parseDateToInput(accData.event.endDate));
        }
      }
    } catch (error) {
      console.error('Failed to load accommodation:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch accommodation details'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (eventId) => {
    try {
      const response = await registrationApi.getByEvent(eventId);
      const allRegs = response.data?.data || response.data || [];
      
      // Keep all active registrations (PENDING, CONFIRMED, etc.) that do NOT have active accommodation
      const unassigned = (Array.isArray(allRegs) ? allRegs : []).filter(r => {
        if (r.status === 'CANCELLED') return false;
        const hasAccommodation = Boolean(
          r.roomDetails || 
          r.accommodation || 
          (r.roomAssignment && r.roomAssignment.active !== false)
        );
        return !hasAccommodation;
      });
      setUnassignedRegistrations(unassigned);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    }
  };

  const handleOpenAssignModal = (room) => {
    setSelectedRoom(room);
    setSelectedRegistrationId('');
    setModalAlert(null);
    
    // Find first available bed
    const activeAssignments = (room.assignments || []).filter(a => a.active !== false);
    const occupiedBeds = activeAssignments.map(a => a.bedNumber?.toString());
    let nextAvailable = 1;
    for (let i = 1; i <= (room.capacity || 1); i++) {
      if (!occupiedBeds.includes(i.toString())) {
        nextAvailable = i;
        break;
      }
    }
    setBedNumber(nextAvailable.toString());
    setShowAssignModal(true);
  };

  const handleAssignRoom = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedRegistrationId) {
      setModalAlert({ type: 'error', message: 'Please select a participant to assign' });
      return;
    }

    if (!bedNumber) {
      setModalAlert({ type: 'error', message: 'Please enter a bed number' });
      return;
    }

    if (!checkInDate) {
      setModalAlert({ type: 'error', message: 'Check-in date is required' });
      return;
    }

    const targetReg = unassignedRegistrations.find(r => r.id.toString() === selectedRegistrationId.toString());
    const targetGender = targetReg?.gender || targetReg?.participantGender || targetReg?.participant?.gender;

    // Strict gender separation check
    if (selectedRoom?.genderRestriction && targetGender && selectedRoom.genderRestriction !== targetGender) {
      setModalAlert({
        type: 'error',
        message: `Gender mismatch: Room ${selectedRoom.roomNumber} is designated for ${selectedRoom.genderRestriction} only, but participant is ${targetGender}. Girls and boys cannot mix in the same room.`
      });
      return;
    }

    setAssignSubmitting(true);
    setModalAlert(null);

    try {
      const payload = {
        roomId: selectedRoom.id,
        registrationId: parseInt(selectedRegistrationId),
        bedNumber: bedNumber.toString(),
        checkInDate: checkInDate,
        checkOutDate: checkOutDate || null,
        notes: (notes || '').trim() || null
      };

      await accommodationApi.assignRoom(payload);

      setAlert({ type: 'success', message: 'Participant assigned to room successfully!' });
      setShowAssignModal(false);
      setSelectedRegistrationId('');
      setSelectedRoom(null);
      setModalAlert(null);
      await fetchAccommodationAndRooms();
    } catch (error) {
      console.error('Failed to assign room:', error);
      setModalAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to assign room. Please check capacity and gender restrictions.'
      });
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleAutoAssignAll = async () => {
    if (!accommodation?.event?.id) return;
    if (!window.confirm(`Automatically assign all ${unassignedRegistrations.length} unassigned participants to rooms according to gender (strictly separating boys and girls)?`)) {
      return;
    }
    try {
      setAutoAssigning(true);
      setAlert(null);
      const res = await accommodationApi.autoAssignEvent(accommodation.event.id);
      const msg = res.data?.message || 'Auto-assignment completed';
      setAlert({ type: 'success', message: msg });
      await fetchAccommodationAndRooms();
    } catch (error) {
      console.error('Auto-assignment failed:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to auto-assign participants'
      });
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleReleaseAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to release this bed assignment?')) return;
    try {
      setReleasingId(assignmentId);
      await accommodationApi.releaseAssignment(assignmentId);
      setAlert({ type: 'success', message: 'Bed assignment released successfully' });
      await fetchAccommodationAndRooms();
    } catch (error) {
      console.error('Failed to release assignment:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to release assignment'
      });
    } finally {
      setReleasingId(null);
    }
  };

  const getGenderBadge = (gender) => {
    if (gender === 'MALE') return <Badge variant="info" size="sm">Male Only</Badge>;
    if (gender === 'FEMALE') return <Badge variant="danger" size="sm">Female Only</Badge>;
    if (gender === 'MIXED') return <Badge variant="default" size="sm">Mixed</Badge>;
    return <Badge variant="default" size="sm">Any Gender</Badge>;
  };

  // Filter unassigned registrations based on search query
  const filteredRegistrations = unassignedRegistrations.filter(reg => {
    if (!regSearchQuery.trim()) return true;
    const q = regSearchQuery.toLowerCase();
    const name = [
      reg.participantFirstName || reg.participant?.firstName,
      reg.participantLastName || reg.participant?.lastName
    ].filter(Boolean).join(' ').toLowerCase();
    const email = (reg.participantEmail || reg.participant?.email || '').toLowerCase();
    const phone = (reg.participantPhone || reg.participant?.phoneNumber || '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q);
  });

  if (loading) {
    return <PageSpinner message="Loading room assignments..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4 mr-1.5" />}
          onClick={() => navigate(`/app/accommodation/${accommodationId}`)}
          className="mb-2 text-xs font-semibold"
        >
          Back to {accommodation?.buildingName || accommodation?.name || 'Accommodation'}
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Room & Bed Assignments
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {accommodation?.buildingName || accommodation?.name} • {accommodation?.event?.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700">
              Unassigned Students: <strong>{unassignedRegistrations.length}</strong>
            </span>
            {canManage && unassignedRegistrations.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                icon={<Sparkles className="w-3.5 h-3.5 mr-1" />}
                onClick={handleAutoAssignAll}
                loading={autoAssigning}
                title="Automatically assign rooms according to participant gender without mixing"
              >
                Auto-Assign All by Gender ({unassignedRegistrations.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          dismissible
        />
      )}

      {/* Strict Gender Notice Banner */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Strict Gender Policy Enforced:</strong> Female participants are assigned only to Female rooms, and Male participants only to Male rooms. No room mixing is permitted.
        </span>
      </div>

      {/* Rooms Assignment Grid */}
      {rooms.length === 0 ? (
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody className="py-12">
            <EmptyState
              icon={<Home className="w-12 h-12 text-gray-400" />}
              title="No rooms in this building"
              description="You need to add rooms before you can assign participants."
              action={
                canManage && (
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/app/accommodation/${accommodationId}/rooms/new`)}
                  >
                    Add Rooms Now
                  </Button>
                )
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => {
            const activeAssignments = (room.assignments || []).filter(a => a.active !== false);
            const occupied = activeAssignments.length;
            const capacity = room.capacity || 0;
            const available = Math.max(0, capacity - occupied);
            const isFull = available === 0;

            return (
              <Card 
                key={room.id}
                className="dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between"
              >
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>Room {room.roomNumber}</span>
                        {room.floor && (
                          <span className="text-xs font-normal text-gray-400">({room.floor})</span>
                        )}
                      </CardTitle>
                    </div>
                    {getGenderBadge(room.genderRestriction)}
                  </div>
                </CardHeader>

                <CardBody className="p-4 space-y-4 flex-1">
                  {/* Capacity pill */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Beds:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {occupied} / {capacity} Occupied ({available} Available)
                    </span>
                  </div>

                  {/* Bed Slots Grid */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Bed Assignments
                    </p>
                    
                    {Array.from({ length: capacity }, (_, i) => {
                      const bedNum = (i + 1).toString();
                      const assignment = activeAssignments.find(a => a.bedNumber?.toString() === bedNum);

                      if (assignment) {
                        const pName = assignment.registration?.participantFirstName
                          ? `${assignment.registration.participantFirstName} ${assignment.registration.participantLastName || ''}`
                          : assignment.registration?.participant?.firstName
                          ? `${assignment.registration.participant.firstName} ${assignment.registration.participant.lastName || ''}`
                          : `Participant #${assignment.registrationId || assignment.id}`;

                        const pGender = assignment.registration?.participant?.gender || 
                                        assignment.registration?.participantGender || 
                                        assignment.registration?.gender;

                        return (
                          <div 
                            key={bedNum}
                            className="p-2.5 rounded-lg bg-blue-50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {bedNum}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                    {pName}
                                  </p>
                                  {pGender && (
                                    <span className={`text-[9px] font-bold px-1 rounded ${
                                      pGender === 'MALE' 
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                                        : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
                                    }`}>
                                      {pGender}
                                    </span>
                                  )}
                                </div>
                                {assignment.checkInDate && (
                                  <p className="text-[10px] text-gray-400">
                                    In: {formatDisplayDate(assignment.checkInDate)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {canManage && (
                              <button
                                onClick={() => handleReleaseAssignment(assignment.id)}
                                disabled={releasingId === assignment.id}
                                title="Release Bed (Check-out)"
                                className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={bedNum}
                          className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-slate-700/60 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center">
                              {bedNum}
                            </span>
                            <span className="text-xs text-gray-400 italic">Empty Bed</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>

                <div className="p-4 pt-0 border-t border-gray-100 dark:border-slate-800 mt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs font-semibold justify-center"
                    icon={<UserPlus className="w-3.5 h-3.5 mr-1" />}
                    onClick={() => handleOpenAssignModal(room)}
                    disabled={isFull || !canManage}
                  >
                    {isFull ? 'Room is Full' : 'Assign Participant'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignment Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => { setShowAssignModal(false); setModalAlert(null); }}
        title={`Assign Participant to Room ${selectedRoom?.roomNumber || ''}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowAssignModal(false)}
              disabled={assignSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<CheckCircle2 className="w-4 h-4 mr-1.5" />}
              onClick={handleAssignRoom}
              loading={assignSubmitting}
            >
              Confirm Assignment
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAssignRoom} className="space-y-4">
          {/* Modal-level error alert */}
          {modalAlert && (
            <Alert
              type={modalAlert.type}
              message={modalAlert.message}
              onClose={() => setModalAlert(null)}
              dismissible
            />
          )}

          {/* Room info banner */}
          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-400">Building: </span>
              <strong className="text-gray-900 dark:text-white">{accommodation?.buildingName || accommodation?.name}</strong>
            </div>
            <div>
              <span className="text-gray-400">Room: </span>
              <strong className="text-gray-900 dark:text-white">{selectedRoom?.roomNumber}</strong>
            </div>
            <div>
              {getGenderBadge(selectedRoom?.genderRestriction)}
            </div>
          </div>

          {/* Participant search & selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Select Unassigned Participant <span className="text-red-500">*</span>
            </label>
            
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by participant name, email, or phone..."
                value={regSearchQuery}
                onChange={(e) => setRegSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg divide-y divide-gray-100 dark:divide-slate-800">
              {filteredRegistrations.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  {unassignedRegistrations.length === 0 
                    ? "All participants for this event have been assigned rooms." 
                    : "No participants match your search."}
                </div>
              ) : (
                filteredRegistrations.map((reg) => {
                  const pName = [
                    reg.participantFirstName || reg.participant?.firstName,
                    reg.participantLastName || reg.participant?.lastName
                  ].filter(Boolean).join(' ') || reg.participantEmail || `Reg #${reg.id}`;

                  const pGender = reg.participantGender || reg.gender || reg.participant?.gender;
                  const isGenderMismatch = selectedRoom?.genderRestriction && 
                                          pGender && 
                                          selectedRoom.genderRestriction !== pGender;

                  const isSelected = selectedRegistrationId === reg.id.toString();

                  return (
                    <div
                      key={reg.id}
                      onClick={() => {
                        if (isGenderMismatch) {
                          setModalAlert({
                            type: 'error',
                            message: `Cannot select ${pName}: Participant is ${pGender}, but Room ${selectedRoom.roomNumber} is reserved for ${selectedRoom.genderRestriction} participants only.`
                          });
                          return;
                        }
                        setModalAlert(null);
                        setSelectedRegistrationId(reg.id.toString());
                      }}
                      className={`p-2.5 text-xs flex items-center justify-between transition ${
                        isGenderMismatch 
                          ? 'opacity-40 cursor-not-allowed bg-gray-50/50 dark:bg-slate-800/20' 
                          : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800'
                      } ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 font-semibold' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{pName}</p>
                          {pGender && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              pGender === 'MALE'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
                            }`}>
                              {pGender}
                            </span>
                          )}
                          <span className={`text-[9px] font-medium px-1 rounded ${
                            reg.status === 'CONFIRMED' || reg.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {reg.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {reg.participantEmail || reg.participant?.email} • {reg.participantPhone || reg.participant?.phoneNumber || 'No phone'}
                          {isGenderMismatch && (
                            <span className="text-red-500 font-semibold ml-2">
                              • Mismatched Gender
                            </span>
                          )}
                        </p>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bed selection & dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Bed Number <span className="text-red-500">*</span>
              </label>
              <select
                value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white outline-none"
              >
                {Array.from({ length: selectedRoom?.capacity || 1 }, (_, i) => {
                  const bNum = (i + 1).toString();
                  const isOccupied = (selectedRoom?.assignments || []).some(
                    a => a.active !== false && a.bedNumber?.toString() === bNum
                  );
                  return (
                    <option key={bNum} value={bNum} disabled={isOccupied}>
                      Bed {bNum} {isOccupied ? '(Occupied)' : '(Available)'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Check-in Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Check-out Date
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Special Requests / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Lower bed requested for elderly participant, medical considerations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
