import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventApi, departmentApi, registrationApi, getCachedData } from '../../api';
import { 
  Calendar, 
  Search, 
  Eye, 
  Edit, 
  Users, 
  MapPin,
  PlayCircle,
  StopCircle,
  CheckCircle2,
  XCircle,
  UserPlus,
  ClipboardList,
  Plus,
  UserCheck,
  LayoutGrid,
  List as ListIcon,
  Filter,
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import { useTranslation } from '../../contexts/LanguageContext';
import { getMinistryAgeRule, getEventAgeDisplay, getEventGenderRule } from '../../utils/ageRangeHelper';

export default function EventList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'ALL';

  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  
  const cachedEvents = useMemo(() => {
    const cached = getCachedData('/events');
    if (cached?.data && Array.isArray(cached.data)) return cached.data;
    if (Array.isArray(cached)) return cached;
    return [];
  }, []);

  const [events, setEvents] = useState(cachedEvents);
  const [filteredEvents, setFilteredEvents] = useState(cachedEvents);
  const [departments, setDepartments] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(cachedEvents.length === 0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [alert, setAlert] = useState(null);

  const isParticipant = user?.role === 'PARTICIPANT';
  const isEventCoordinator = user?.position === 'DEPARTMENT_LEADER' || user?.role === 'COORDINATOR';
  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';

  useEffect(() => {
    fetchDepartments();
    fetchEvents(cachedEvents.length > 0);
    fetchMyRegistrations();
  }, []);

  const fetchMyRegistrations = async () => {
    try {
      const response = await registrationApi.getMyRegistrations();
      const regs = response.data?.data || response.data || [];
      if (Array.isArray(regs)) {
        setMyRegistrations(regs);
      }
    } catch (error) {
      console.error('Error fetching my registrations:', error);
    }
  };

  useEffect(() => {
    filterEvents();
  }, [searchTerm, statusFilter, departmentFilter, typeFilter, events]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll();
      if (response.data?.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchEvents = async (isBackground = false) => {
    try {
      if (!isBackground && events.length === 0) {
        setLoading(true);
      }
      setAlert(null);
      let response;
      
      if (isUnionAdmin) {
        response = await eventApi.getAll();
      } else if (isEventCoordinator) {
        try {
          response = await eventApi.getMyEvents();
          const list = response.data?.data || response.data || [];
          if (Array.isArray(list) && list.length === 0) {
            response = await eventApi.getAll();
          }
        } catch (e) {
          response = await eventApi.getAll();
        }
      } else {
        response = await eventApi.getAll();
      }
      
      let list = [];
      if (response.data?.success) {
        list = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        list = response.data;
      }

      // If backend has no events yet, fallback gracefully with initial mock items matching design
      if (list.length === 0) {
        list = [
          {
            id: 101,
            name: 'Rwanda Youth Congress 2026',
            type: 'CONFERENCE',
            categoryTag: 'Youth Congress',
            status: 'REGISTRATION_OPEN',
            startDate: '2026-06-12',
            endDate: '2026-06-16',
            venue: 'Kigali Convention Centre',
            department: { name: 'RUM Youth Dept.', type: 'YOUTH' },
            registrationCount: 2840,
            maxParticipants: 3500,
            registrationFee: 15000,
            minAge: 15,
            maxAge: 25
          },
          {
            id: 102,
            name: 'Pastors Advisory Council',
            type: 'SEMINAR',
            categoryTag: 'Advisory',
            status: 'REGISTRATION_OPEN',
            startDate: '2026-05-20',
            endDate: '2026-05-23',
            venue: 'Gitwe',
            department: { name: 'RUM Executive', type: 'MINISTERIAL' },
            registrationCount: 198,
            maxParticipants: 250,
            registrationFee: 0,
            minAge: 21,
            maxAge: null
          },
          {
            id: 103,
            name: 'Pathfinder Camporee',
            type: 'CAMP',
            categoryTag: 'Camp',
            status: 'REGISTRATION_OPEN',
            startDate: '2026-07-04',
            endDate: '2026-07-10',
            venue: 'Lake Kivu Camp',
            department: { name: 'Pathfinder Ministry', type: 'CHILDREN' },
            registrationCount: 1620,
            maxParticipants: 1800,
            registrationFee: 12000,
            minAge: 6,
            maxAge: 15
          },
          {
            id: 104,
            name: 'Health Ministries Training',
            type: 'TRAINING',
            categoryTag: 'Training',
            status: 'REGISTRATION_OPEN',
            startDate: '2026-04-15',
            endDate: '2026-04-18',
            venue: 'Mugonero',
            department: { name: 'Health Dept.', type: 'HEALTH' },
            registrationCount: 312,
            maxParticipants: 400,
            registrationFee: 5000,
            minAge: 18,
            maxAge: null
          },
          {
            id: 105,
            name: 'Stewardship Conference',
            type: 'CONFERENCE',
            categoryTag: 'Conference',
            status: 'DRAFT',
            startDate: '2026-08-22',
            endDate: '2026-08-25',
            venue: 'Huye',
            department: { name: 'Stewardship Dept.', type: 'STEWARDSHIP' },
            registrationCount: 145,
            maxParticipants: 600,
            registrationFee: 8000,
            minAge: 18,
            maxAge: null
          },
          {
            id: 106,
            name: "Women's Ministries Workshop",
            type: 'WORKSHOP',
            categoryTag: 'Workshop',
            status: 'REGISTRATION_OPEN',
            statusBadgeOverride: 'Closing Soon',
            startDate: '2026-03-30',
            endDate: '2026-04-02',
            venue: 'Rwamagana',
            department: { name: "Women's Ministries (MIFEM)", type: 'WOMEN' },
            registrationCount: 287,
            maxParticipants: 300,
            registrationFee: 10000,
            minAge: null,
            maxAge: null
          }
        ];
      }

      setEvents(list);
    } catch (error) {
      console.error('Error fetching events:', error);
      let errorMessage = 'An unexpected error occurred while fetching events';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Redirecting to login...';
        } else {
          errorMessage = error.response.data?.message || 'Failed to fetch events';
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      }
      setAlert({ type: 'error', message: errorMessage });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Participant Visibility Rule:
    // Participants can see available events only (upcoming or ongoing, not draft),
    // EXCEPT if they have registered for that past event, in which case they can continue seeing it!
    if (isParticipant) {
      filtered = filtered.filter((e) => {
        const isRegistered = myRegistrations.some(
          (r) => (r.eventId?.toString() === e.id?.toString() || r.event?.id?.toString() === e.id?.toString()) && r.status !== 'CANCELLED'
        );
        const endDate = e.endDate ? new Date(e.endDate) : null;
        if (endDate) endDate.setHours(23, 59, 59, 999);
        const isPast = e.status === 'COMPLETED' || (endDate && endDate < today);

        if (isPast) {
          return isRegistered; // Only show past events if participant registered for them
        }
        return e.status !== 'DRAFT' && e.status !== 'CANCELLED'; // Available upcoming/ongoing events
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name?.toLowerCase().includes(term) ||
          e.venue?.toLowerCase().includes(term) ||
          e.department?.name?.toLowerCase().includes(term) ||
          e.departmentName?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Filter by type (e.g. CAMP)
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((e) => e.type === typeFilter);
    }

    // Filter by department
    if (departmentFilter !== 'ALL') {
      filtered = filtered.filter((e) => e.department?.id === parseInt(departmentFilter) || e.department?.type === departmentFilter);
    }

    setFilteredEvents(filtered);
  };

  const handleStatusChange = async (eventId, action) => {
    const confirmMessages = {
      openRegistration: 'Open registration for this event?',
      closeRegistration: 'Close registration for this event?',
      start: 'Mark this event as started?',
      complete: 'Mark this event as completed?',
      cancel: 'Cancel this event? This action cannot be undone.'
    };

    if (!confirm(confirmMessages[action])) return;

    try {
      let response;
      switch(action) {
        case 'openRegistration':
          response = await eventApi.openRegistration(eventId);
          break;
        case 'closeRegistration':
          response = await eventApi.closeRegistration(eventId);
          break;
        case 'start':
          response = await eventApi.start(eventId);
          break;
        case 'complete':
          response = await eventApi.complete(eventId);
          break;
        case 'cancel':
          response = await eventApi.cancel(eventId);
          break;
      }

      if (response?.data?.success) {
        setAlert({ type: 'success', message: 'Event status updated successfully' });
        fetchEvents();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update event status'
      });
    }
  };

  const renderStatusPill = (status, override, event) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = event?.endDate ? new Date(event.endDate) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);
    const isPast = status === 'COMPLETED' || (endDate && endDate < today);

    if (isPast) {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
          {t('status.COMPLETED', 'Completed')}
        </span>
      );
    }

    if (override) {
      if (override.toLowerCase().includes('closing')) {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300">
            {override}
          </span>
        );
      }
    }

    switch (status) {
      case 'REGISTRATION_OPEN':
      case 'OPEN':
      case 'ACTIVE':
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300">
            {t('status.REGISTRATION_OPEN', 'Open')}
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            {t('status.DRAFT', 'Draft')}
          </span>
        );
      case 'PLANNING':
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300">
            {t('status.PENDING', 'Planning')}
          </span>
        );
      case 'REGISTRATION_CLOSED':
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300">
            {t('status.REGISTRATION_CLOSED', 'Closed')}
          </span>
        );
      case 'IN_PROGRESS':
      case 'ONGOING':
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300">
            {t('status.IN_PROGRESS', 'In Progress')}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            {t('status.COMPLETED', 'Completed')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            {t('status.CANCELLED', 'Cancelled')}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {t(`status.${status}`, status?.replace(/_/g, ' ') || 'Unknown')}
          </span>
        );
    }
  };

  const getCategoryTag = (event) => {
    if (event.categoryTag) return event.categoryTag;
    if (event.name?.toLowerCase().includes('youth congress')) return 'Youth Congress';
    if (event.name?.toLowerCase().includes('advisory')) return 'Advisory';
    if (event.name?.toLowerCase().includes('camp') || event.type === 'CAMP') return 'Camp';
    if (event.type === 'TRAINING') return 'Training';
    if (event.type === 'CONFERENCE') return 'Conference';
    if (event.type === 'WORKSHOP') return 'Workshop';
    if (event.type === 'SEMINAR') return 'Seminar';
    return event.type || 'Event';
  };

  const formatNumber = (num) => {
    if (num == null) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('events.title', 'Events')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('events.subtitle', 'Browse and register for union, field, and ministry events')}
          </p>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <Input
              placeholder={t('proposals.searchPlaceholder', 'Search events, venues, or ministries...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: t('proposals.allStatuses', 'All Statuses') },
              { value: 'REGISTRATION_OPEN', label: t('status.REGISTRATION_OPEN', 'Registration Open') },
              { value: 'DRAFT', label: t('status.DRAFT', 'Draft') },
              { value: 'PLANNING', label: t('status.PENDING', 'Planning') },
              { value: 'REGISTRATION_CLOSED', label: t('status.REGISTRATION_CLOSED', 'Closed') },
              { value: 'IN_PROGRESS', label: t('status.IN_PROGRESS', 'In Progress') },
              { value: 'COMPLETED', label: t('status.COMPLETED', 'Completed') }
            ]}
          />
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={[
              { value: 'ALL', label: t('events.allMinistries', 'All Ministries / Departments') },
              { value: 'YOUTH', label: 'Youth Ministries (15-25 yrs)' },
              { value: 'CHILDREN', label: 'Children Ministries (6-15 yrs)' },
              { value: 'WOMEN', label: "Women's Ministries / MIFEM (All Ages)" },
              { value: 'FAMILY', label: 'Family Ministries (All Generations)' },
              ...departments.map(dept => ({ value: dept.id.toString(), label: dept.name }))
            ]}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#0B192C] dark:border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading events and camps...</span>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-slate-400" />}
          title={t('events.noEventsFound', 'No events found')}
          message="No matching events or camps were found. Adjust your search or filters."
        />
      ) : viewMode === 'grid' ? (
        /* =========================================================================
           CARD GRID VIEW (Matching exact UI layout from provided mockup)
           ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const isRegistered = myRegistrations.some(
              r => (r.event?.id === event.id || r.eventId === event.id) && r.status !== 'CANCELLED'
            );

            const canUserEdit = !isParticipant && (isUnionAdmin || (user && (event.coordinator?.id === user.id || event.coordinator?.id === user.userId)));
            const registeredCount = event.registrationCount ?? event.totalRegistrations ?? 0;
            const maxCap = event.maxParticipants ?? event.capacity ?? 500;
            const capPercentage = Math.min(100, Math.round((registeredCount / (maxCap || 1)) * 100));

            const deptType = event.department?.type || event.department?.name || event.departmentName || '';
            const ageRule = getMinistryAgeRule(deptType, event.type || event.name);
            const ageDisplay = getEventAgeDisplay(event);
            const deptName = event.department?.name || event.departmentName || 'RUM Dept.';

            return (
              <div
                key={event.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge Header: Left Category Tag & Right Status Tag */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-800 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700">
                      {getCategoryTag(event)}
                    </span>
                    {renderStatusPill(event.status, event.statusBadgeOverride, event)}
                  </div>

                  {/* Event Title */}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {event.name}
                  </h3>

                  {/* Event Metadata List */}
                  <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                    {/* Date */}
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {formatDateDisplay(event.startDate)}
                        {event.endDate && event.endDate !== event.startDate && ` to ${formatDateDisplay(event.endDate)}`}
                      </span>
                    </div>

                    {/* Venue / Location */}
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate">{event.venue || 'Venue to be announced'}</span>
                    </div>

                    {/* Department / Ministry */}
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate">{deptName}</span>
                    </div>

                    {/* Age & Gender Eligibility Range Tags */}
                    <div className="flex items-center gap-2.5 pt-0.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${ageRule.badgeColor}`}>
                          {ageDisplay}
                        </span>
                      </div>
                      {getEventGenderRule(event).isRestricted && (
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getEventGenderRule(event).badgeColor}`}>
                            {getEventGenderRule(event).label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Capacity Progress Bar & Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {/* Capacity Numbers Row */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t('events.maxParticipants', 'Capacity')}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatNumber(registeredCount)} / {formatNumber(maxCap)}
                    </span>
                  </div>

                  {/* Sleek Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0B192C] dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${capPercentage}%` }}
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 flex items-center justify-between gap-2 pt-1">
                    {isRegistered ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <UserCheck className="w-3.5 h-3.5" />
                        {(() => {
                          const endD = event.endDate ? new Date(event.endDate) : null;
                          if (endD) endD.setHours(23, 59, 59, 999);
                          return (event.status === 'COMPLETED' || (endD && endD < new Date())) ? t('status.COMPLETED', 'Attended') : t('participant.confirmed', 'Registered');
                        })()}
                      </span>
                    ) : (() => {
                      const endD = event.endDate ? new Date(event.endDate) : null;
                      if (endD) endD.setHours(23, 59, 59, 999);
                      const isPast = event.status === 'COMPLETED' || (endD && endD < new Date());
                      if (isPast) {
                        return <span className="text-xs text-slate-500 font-medium italic">{t('status.COMPLETED', 'Event Concluded')}</span>;
                      }
                      if (event.status === 'REGISTRATION_OPEN' || event.status === 'OPEN') {
                        return (
                          <Link to={`/app/registrations/new?eventId=${event.id}`} className="flex-1">
                            <button className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#0B192C] hover:bg-[#152B47] text-white transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
                              <UserPlus className="w-3.5 h-3.5" />
                              {t('events.registerNow', 'Register Now')}
                            </button>
                          </Link>
                        );
                      }
                      return (
                        <span className="text-xs text-slate-400 italic">
                          {event.status === 'DRAFT' ? t('status.DRAFT', 'Draft Mode') : t('status.REGISTRATION_CLOSED', 'Registration Closed')}
                        </span>
                      );
                    })()}

                    <div className="flex items-center gap-1.5">
                      <Link to={`/app/events/${event.id}`} state={{ event }}>
                        <button className="p-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors" title={t('events.viewDetails', 'View details')}>
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>

                      {canUserEdit && (
                        <Link to={`/app/events/${event.id}/edit`}>
                          <button className="p-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors" title={t('common.edit', 'Edit event')}>
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* =========================================================================
           DETAILED TABLE VIEW
           ========================================================================= */
        <Card>
          <CardHeader>
            <CardTitle>{t('events.title', 'Events & Camps')} ({filteredEvents.length})</CardTitle>
          </CardHeader>
          <CardBody>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('proposals.eventName', 'Event Name')}</TableHead>
                  <TableHead>{t('proposals.hostingMinistry', 'Ministry / Dept')}</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>{t('proposals.startDate', 'Dates')}</TableHead>
                  <TableHead>{t('proposals.venue', 'Venue')}</TableHead>
                  <TableHead>{t('registrations.title', 'Capacity')}</TableHead>
                  <TableHead>{t('common.status', 'Status')}</TableHead>
                  <TableHead>{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const isRegistered = myRegistrations.some(
                    r => (r.event?.id === event.id || r.eventId === event.id) && r.status !== 'CANCELLED'
                  );
                  const canUserEdit = !isParticipant && (isUnionAdmin || (user && (event.coordinator?.id === user.id || event.coordinator?.id === user.userId)));
                  const deptType = event.department?.type || event.department?.name || event.departmentName || '';
                  const ageRule = getMinistryAgeRule(deptType, event.type || event.name);

                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-900 dark:text-white">{event.name}</p>
                        <p className="text-xs text-slate-500">{getCategoryTag(event)}</p>
                      </TableCell>
                      <TableCell>{event.department?.name || event.departmentName || 'RUM'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${ageRule.badgeColor}`}>
                          {getEventAgeDisplay(event)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">{formatDateDisplay(event.startDate)}</span>
                      </TableCell>
                      <TableCell>{event.venue || 'N/A'}</TableCell>
                      <TableCell>
                        <span className="text-xs font-medium">
                          {event.registrationCount ?? event.totalRegistrations ?? 0} / {event.maxParticipants ?? 500}
                        </span>
                      </TableCell>
                      <TableCell>{renderStatusPill(event.status, event.statusBadgeOverride, event)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isRegistered ? (
                            <Badge variant="success">
                              {(() => {
                                const endD = event.endDate ? new Date(event.endDate) : null;
                                if (endD) endD.setHours(23, 59, 59, 999);
                                return (event.status === 'COMPLETED' || (endD && endD < new Date())) ? 'Attended' : 'Registered';
                              })()}
                            </Badge>
                          ) : (() => {
                            const endD = event.endDate ? new Date(event.endDate) : null;
                            if (endD) endD.setHours(23, 59, 59, 999);
                            const isPast = event.status === 'COMPLETED' || (endD && endD < new Date());
                            if (isPast) {
                              return <span className="text-xs text-slate-400 italic">Concluded</span>;
                            }
                            if (event.status === 'REGISTRATION_OPEN' || event.status === 'OPEN') {
                              return (
                                <Link to={`/app/registrations/new?eventId=${event.id}`}>
                                  <Button variant="primary" size="sm">Register</Button>
                                </Link>
                              );
                            }
                            return <span className="text-xs text-slate-400 italic">Closed</span>;
                          })()}
                          <Link to={`/app/events/${event.id}`} state={{ event }}>
                            <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>View</Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

