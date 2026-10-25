import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { accommodationApi, eventApi } from '../../api';
import { 
  Search, 
  Plus,
  Eye,
  Home,
  Users,
  MapPin,
  Building,
  Bed,
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  DoorOpen,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { useTranslation } from '../../contexts/LanguageContext';

export default function AccommodationList() {
  const navigate = useNavigate();
  const { user, isAdmin, isCoordinator } = useAuth();
  const { t } = useTranslation();
  
  const [accommodations, setAccommodations] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAccommodations, setLoadingAccommodations] = useState(false);
  const [alert, setAlert] = useState(null);
  
  // Delete modal state
  const [deletingAccommodation, setDeletingAccommodation] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const isAccommodationOfficer = user?.position === 'ACCOMMODATION_OFFICER';
  const canManage = isUnionAdmin || isCoordinator || isAccommodationOfficer;

  const formatEventDate = (d) => {
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
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAccommodations();
    } else {
      setAccommodations([]);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = isCoordinator && !isUnionAdmin
        ? await eventApi.getMyEvents()
        : await eventApi.getAll();
      
      const rawData = response.data?.data ?? response.data;
      const eventList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.content) ? rawData.content : []);
      setEvents(eventList);
      
      // Auto-select first event or upcoming event
      if (eventList.length > 0) {
        const upcomingEvent = eventList.find(e => 
          e && (e.status === 'REGISTRATION_OPEN' || e.status === 'IN_PROGRESS' || e.status === 'UPCOMING')
        );
        const autoSelected = upcomingEvent || eventList[0];
        if (autoSelected?.id != null) {
          setSelectedEventId(autoSelected.id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setAlert({
        type: 'error',
        message: 'Failed to fetch events'
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccommodations = async () => {
    if (!selectedEventId) return;
    try {
      setLoadingAccommodations(true);
      const response = await accommodationApi.getByEvent(selectedEventId);
      const rawData = response.data?.data ?? response.data;
      const data = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.content) ? rawData.content : []);
      setAccommodations(data);
    } catch (error) {
      console.error('Error fetching accommodations:', error);
      if (error.response?.status !== 404) {
        setAlert({
          type: 'error',
          message: error.response?.data?.message || 'Failed to fetch accommodations'
        });
      }
      setAccommodations([]);
    } finally {
      setLoadingAccommodations(false);
    }
  };

  const handleDeleteAccommodation = async () => {
    if (!deletingAccommodation) return;
    try {
      setDeleting(true);
      await accommodationApi.delete(deletingAccommodation.id);
      setAlert({ type: 'success', message: 'Accommodation deleted successfully' });
      setShowDeleteModal(false);
      setDeletingAccommodation(null);
      fetchAccommodations();
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete accommodation. Please ensure rooms have no active occupants.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const safeEvents = Array.isArray(events) ? events : [];
  const eventOptions = [
    { value: '', label: 'Select an event...' },
    ...safeEvents
      .filter(event => event && event.id != null)
      .map(event => {
        const dateStr = formatEventDate(event.startDate);
        return {
          value: event.id.toString(),
          label: `${event.name || 'Event'}${dateStr ? ` (${dateStr})` : ''}`
        };
      })
  ];

  const selectedEvent = safeEvents.find(e => e?.id != null && e.id.toString() === String(selectedEventId));

  const safeAccommodations = Array.isArray(accommodations) ? accommodations : [];

  // Filter accommodations by search query
  const filteredAccommodations = safeAccommodations.filter(acc => {
    if (!acc) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (acc.buildingName || acc.name || '').toLowerCase().includes(q) ||
      (acc.location || '').toLowerCase().includes(q) ||
      (acc.description || '').toLowerCase().includes(q)
    );
  });

  // Calculate statistics across all accommodations in the event
  const stats = {
    totalBuildings: safeAccommodations.length,
    totalCapacity: safeAccommodations.reduce((sum, acc) => {
      const roomSum = (acc?.rooms || []).reduce((rSum, room) => rSum + (room?.capacity || 0), 0);
      return sum + (acc?.totalCapacity || roomSum || 0);
    }, 0),
    totalOccupied: safeAccommodations.reduce((sum, acc) => {
      const roomOccupied = (acc?.rooms || []).reduce((rSum, room) => {
        const count = (room?.assignments || []).filter(a => a?.active !== false).length;
        return rSum + count;
      }, 0);
      return sum + (acc?.occupiedCount || roomOccupied || 0);
    }, 0)
  };
  stats.totalAvailable = Math.max(0, stats.totalCapacity - stats.totalOccupied);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('accommodation.title', 'Accommodation Management')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('accommodation.subtitle', 'Manage event accommodations, rooms, and participant assignments')}
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4 mr-1.5" />}
            onClick={() => navigate(selectedEventId ? `/app/accommodation/new/${selectedEventId}` : '/app/accommodation/new')}
          >
            {t('accommodation.addAccommodation', 'Add Accommodation')}
          </Button>
        )}
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          dismissible
        />
      )}

      {/* Event Selection Card */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardBody className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {t('accommodation.selectEvent', 'Select Event:')}
              </span>
            </div>
            
            <div className="flex-1 w-full">
              <Select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                options={eventOptions}
                className="w-full"
              />
            </div>

            {selectedEventId && (
              <div className="w-full sm:w-72">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder={t('accommodation.searchBuildings', 'Search buildings...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody>
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>{t('common.loading', 'Loading...')}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : !selectedEventId ? (
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardBody>
            <EmptyState
              icon={<Calendar className="w-12 h-12 text-gray-400" />}
              title={t('accommodation.noEventSelected', 'No event selected')}
              description={t('accommodation.selectEventAbove', 'Please select an event above to view and manage its accommodations.')}
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Statistics Bar */}
          {accommodations.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardBody className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('accommodation.totalBuildings', 'Total Buildings')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalBuildings}</p>
                  </div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                    <Building className="w-6 h-6" />
                  </div>
                </CardBody>
              </Card>

              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardBody className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('accommodation.totalCapacity', 'Total Bed Capacity')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalCapacity}</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Bed className="w-6 h-6" />
                  </div>
                </CardBody>
              </Card>

              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardBody className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('accommodation.totalOccupied', 'Occupied Beds')}</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.totalOccupied}</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </CardBody>
              </Card>

              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardBody className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('accommodation.availableBeds', 'Available Beds')}</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.totalAvailable}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <DoorOpen className="w-6 h-6" />
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Accommodations List */}
          {loadingAccommodations ? (
            <div className="text-center py-12 text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching accommodations...</span>
              </div>
            </div>
          ) : filteredAccommodations.length === 0 ? (
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardBody className="py-12">
                <EmptyState
                  icon={<Home className="w-14 h-14 text-gray-400" />}
                  title={searchQuery ? "No matching accommodations" : "No accommodations found"}
                  description={
                    searchQuery 
                      ? `No accommodations match your search "${searchQuery}".`
                      : `No accommodations have been added for ${selectedEvent?.name || 'this event'} yet.`
                  }
                  action={
                    canManage && !searchQuery && (
                      <Button
                        variant="primary"
                        icon={<Plus className="w-4 h-4 mr-1.5" />}
                        onClick={() => navigate(selectedEventId ? `/app/accommodation/new/${selectedEventId}` : '/app/accommodation/new')}
                      >
                        Add First Accommodation
                      </Button>
                    )
                  }
                />
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAccommodations.map((acc) => {
                const roomCount = (acc.rooms || []).length;
                const capacity = (acc.rooms || []).reduce((sum, r) => sum + (r.capacity || 0), 0) || acc.totalCapacity || 0;
                const occupied = (acc.rooms || []).reduce((sum, r) => {
                  const count = (r.assignments || []).filter(a => a.active !== false).length;
                  return sum + count;
                }, 0) || acc.occupiedCount || 0;
                const available = Math.max(0, capacity - occupied);
                const occupancyPercent = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

                return (
                  <Card 
                    key={acc.id} 
                    className="hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                            {acc.buildingName || acc.name}
                          </CardTitle>
                          {acc.buildingCode && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-medium">
                              Code: {acc.buildingCode}
                            </span>
                          )}
                        </div>
                        <Badge 
                          variant={occupancyPercent >= 100 ? 'danger' : occupancyPercent >= 75 ? 'warning' : 'success'} 
                          size="sm"
                        >
                          {occupancyPercent >= 100 ? 'Full' : `${occupancyPercent}% Occupied`}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardBody className="py-4 space-y-4 flex-1">
                      {acc.location && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{acc.location}</span>
                        </p>
                      )}

                      {acc.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {acc.description}
                        </p>
                      )}

                      {/* Stats pills */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-2">
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                          <p className="text-[10px] text-gray-400 font-medium uppercase">Rooms</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{roomCount}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                          <p className="text-[10px] text-gray-400 font-medium uppercase">Total Beds</p>
                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">{capacity}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                          <p className="text-[10px] text-gray-400 font-medium uppercase">Available</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{available}</p>
                        </div>
                      </div>

                      {/* Occupancy Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>Occupancy</span>
                          <span>{occupied} / {capacity} beds</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              occupancyPercent >= 100 ? 'bg-red-500' :
                              occupancyPercent >= 75 ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardBody>

                    <div className="p-4 pt-0 border-t border-gray-100 dark:border-slate-800 mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/app/accommodation/${acc.id}`)}
                          className="text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Details
                        </Button>
                        
                        {canManage && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/app/accommodation/${acc.id}/assign`)}
                            className="text-xs"
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                            Assign Rooms
                          </Button>
                        )}
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/accommodation/${acc.id}/edit`)}
                            title="Edit Accommodation"
                            className="text-gray-500 hover:text-gray-900 dark:hover:text-white px-2"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingAccommodation(acc);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Accommodation"
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 px-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingAccommodation(null);
        }}
        title="Delete Accommodation Building"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingAccommodation(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="w-4 h-4 mr-1.5" />}
              onClick={handleDeleteAccommodation}
              loading={deleting}
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete accommodation{' '}
            <strong className="text-gray-900 dark:text-white">
              {deletingAccommodation?.buildingName || deletingAccommodation?.name}
            </strong>
            ?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            This will permanently remove the building and all associated rooms. This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
