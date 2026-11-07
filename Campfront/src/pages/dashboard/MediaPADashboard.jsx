import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Tv, 
  Mic, 
  Mic2, 
  Volume2, 
  Radio, 
  Clock, 
  Calendar, 
  User, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  Sliders, 
  FileText, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowRight, 
  Eye, 
  Layers, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  Headphones, 
  Video, 
  Cast, 
  Activity,
  Music,
  Download,
  Flame,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { eventApi, sessionApi, resourceApi } from '../../api';

export default function MediaPADashboard() {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();

  // Core Data States
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState(null);

  // Time & Realtime States
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filter & Search States
  const [selectedDateTab, setSelectedDateTab] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Confidence Monitor / Fullscreen Stage Timer Modal
  const [showConfidenceMonitor, setShowConfidenceMonitor] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detail Modal State
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);

  // Technical Pre-Flight Checklist State (Stored by Session ID)
  const [checklists, setChecklists] = useState(() => {
    try {
      const saved = localStorage.getItem('campcoord_media_checklists');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Technical Notes State (Stored by Session ID)
  const [techNotes, setTechNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('campcoord_media_notes');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Ticking Real-Time Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save checklists & notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('campcoord_media_checklists', JSON.stringify(checklists));
    } catch (e) {
      console.error(e);
    }
  }, [checklists]);

  useEffect(() => {
    try {
      localStorage.setItem('campcoord_media_notes', JSON.stringify(techNotes));
    } catch (e) {
      console.error(e);
    }
  }, [techNotes]);

  // Initial Load: Fetch All Events
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch Sessions and Resources when selected event changes
  useEffect(() => {
    if (selectedEventId) {
      fetchEventDetailsAndSessions(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await eventApi.getAll();
      const eventList = res.data?.data || res.data || [];
      const list = Array.isArray(eventList) ? eventList : [];
      setEvents(list);

      if (list.length > 0) {
        // Default to first in-progress or upcoming event, or first event
        const active = list.find(e => e.status === 'IN_PROGRESS') ||
                       list.find(e => e.status === 'REGISTRATION_OPEN' || e.status === 'REGISTRATION_CLOSED') ||
                       list[0];
        setSelectedEventId(String(active.id));
        setSelectedEvent(active);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setAlert({ type: 'error', message: 'Failed to load events for Media & PA operations.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetailsAndSessions = async (eventId) => {
    try {
      setRefreshing(true);
      const [eventRes, sessionsRes, resourcesRes] = await Promise.all([
        eventApi.getById(eventId).catch(() => ({ data: { data: null } })),
        sessionApi.getByEvent(eventId).catch(() => ({ data: { data: [] } })),
        resourceApi.getByEvent(eventId).catch(() => ({ data: { data: [] } }))
      ]);

      const evData = eventRes.data?.data || eventRes.data;
      if (evData) {
        setSelectedEvent(evData);
      }

      const rawSessions = sessionsRes.data?.data || sessionsRes.data || [];
      const sessList = Array.isArray(rawSessions) ? rawSessions : [];
      // Sort sessions by start time ascending
      sessList.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      setSessions(sessList);

      const rawRes = resourcesRes.data?.data || resourcesRes.data || [];
      setResources(Array.isArray(rawRes) ? rawRes : []);
    } catch (err) {
      console.error('Error loading session data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Helper for checklist items
  const defaultChecklistItems = [
    { id: 'mic_check', label: 'Wireless Mics & Lapel Frequencies Checked', icon: Mic },
    { id: 'presentation_cued', label: 'Presentation Slides / Videos Loaded & Tested', icon: Tv },
    { id: 'audio_levels', label: 'Stage Monitor & PA Sound Levels Calibrated', icon: Volume2 },
    { id: 'livestream_ready', label: 'Livestream Stream Title & Broadcast Feed Live', icon: Radio },
    { id: 'recording_active', label: 'Master Multitrack / Video Recording Initialized', icon: Video },
    { id: 'translation_feed', label: 'Translation Channels / Headsets Active', icon: Headphones },
  ];

  const toggleChecklistItem = (sessionId, itemId) => {
    setChecklists(prev => {
      const sessionChecklist = prev[sessionId] || {};
      return {
        ...prev,
        [sessionId]: {
          ...sessionChecklist,
          [itemId]: !sessionChecklist[itemId]
        }
      };
    });
  };

  const handleTechNoteChange = (sessionId, text) => {
    setTechNotes(prev => ({
      ...prev,
      [sessionId]: text
    }));
  };

  // Compute Current Session & Next Session
  const { currentSession, nextSession, upcomingSessions, pastSessions } = useMemo(() => {
    const now = currentTime.getTime();
    let current = null;
    let next = null;
    const upcoming = [];
    const past = [];

    sessions.forEach(session => {
      const start = new Date(session.startTime).getTime();
      const end = new Date(session.endTime).getTime();

      if (now >= start && now <= end) {
        current = session;
      } else if (now < start) {
        upcoming.push(session);
      } else {
        past.push(session);
      }
    });

    if (upcoming.length > 0) {
      next = upcoming[0];
    }

    return {
      currentSession: current,
      nextSession: next,
      upcomingSessions: upcoming,
      pastSessions: past
    };
  }, [sessions, currentTime]);

  // Compute unique dates for tabs
  const uniqueDates = useMemo(() => {
    const dates = new Set();
    sessions.forEach(s => {
      if (s.startTime) {
        const d = s.startTime.split('T')[0];
        dates.add(d);
      }
    });
    return Array.from(dates).sort();
  }, [sessions]);

  // Filtered Sessions for the Master Timetable
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Date filter
      if (selectedDateTab !== 'ALL') {
        const sessionDate = session.startTime?.split('T')[0];
        if (sessionDate !== selectedDateTab) return false;
      }

      // Type filter
      if (selectedTypeFilter !== 'ALL') {
        if (session.type !== selectedTypeFilter) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = session.title?.toLowerCase().includes(q);
        const matchSpeaker = session.speakerName?.toLowerCase().includes(q);
        const matchVenue = session.venue?.toLowerCase().includes(q);
        const matchDesc = session.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchSpeaker && !matchVenue && !matchDesc) return false;
      }

      return true;
    });
  }, [sessions, selectedDateTab, selectedTypeFilter, searchQuery]);

  // Format Helpers
  const formatTimeSlot = (startTimeStr, endTimeStr) => {
    if (!startTimeStr) return 'TBA';
    try {
      const start = new Date(startTimeStr);
      const end = endTimeStr ? new Date(endTimeStr) : null;
      const startFormatted = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!end) return startFormatted;
      const endFormatted = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${startFormatted} - ${endFormatted}`;
    } catch (e) {
      return startTimeStr;
    }
  };

  const getCountdownString = (targetDateStr) => {
    if (!targetDateStr) return '';
    const target = new Date(targetDateStr).getTime();
    const now = currentTime.getTime();
    const diff = target - now;

    if (diff <= 0) return 'Starting Now';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `in ${hours}h ${minutes}m ${seconds}s`;
    }
    return `in ${minutes}m ${seconds}s`;
  };

  const getSessionProgress = (startTimeStr, endTimeStr) => {
    if (!startTimeStr || !endTimeStr) return { percentage: 0, elapsedMin: 0, remainingMin: 0 };
    const start = new Date(startTimeStr).getTime();
    const end = new Date(endTimeStr).getTime();
    const now = currentTime.getTime();

    if (now < start) return { percentage: 0, elapsedMin: 0, remainingMin: Math.round((end - start) / 60000) };
    if (now > end) return { percentage: 100, elapsedMin: Math.round((end - start) / 60000), remainingMin: 0 };

    const total = end - start;
    const elapsed = now - start;
    const percentage = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    const elapsedMin = Math.round(elapsed / 60000);
    const remainingMin = Math.max(0, Math.round((end - now) / 60000));

    return { percentage, elapsedMin, remainingMin };
  };

  const getSessionTypeBadge = (type) => {
    const config = {
      MORNING_DEVOTION: { label: 'Morning Devotion', color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300' },
      WORSHIP: { label: 'Divine Worship', color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300' },
      PLENARY_SESSION: { label: 'Plenary Session', color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300' },
      GENERAL_SESSION: { label: 'General Session', color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300' },
      GENERAL: { label: 'General Session', color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300' },
      WORKSHOP: { label: 'Workshop', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300' },
      SEMINAR: { label: 'Seminar', color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/50 dark:text-teal-300' },
      BREAKOUT_SESSION: { label: 'Breakout Session', color: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300' },
      EVENING_PROGRAM: { label: 'Evening Program', color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300' },
      SPECIAL_SESSION: { label: 'Special Session', color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300' },
      PRAYER: { label: 'Prayer & Consecration', color: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300' },
      RECREATION: { label: 'Recreation / Youth Activity', color: 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-950/50 dark:text-lime-300' },
      BREAK: { label: 'Intermission / Meal Break', color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
    };
    const c = config[type] || { label: type?.replace(/_/g, ' ') || 'Session', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    return (
      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${c.color}`}>
        {c.label}
      </span>
    );
  };

  const sessionTypes = [
    { value: 'ALL', label: 'All Session Types' },
    { value: 'MORNING_DEVOTION', label: 'Morning Devotion' },
    { value: 'WORSHIP', label: 'Divine Worship' },
    { value: 'PLENARY_SESSION', label: 'Plenary Session' },
    { value: 'GENERAL_SESSION', label: 'General Session' },
    { value: 'WORKSHOP', label: 'Workshop' },
    { value: 'SEMINAR', label: 'Seminar' },
    { value: 'BREAKOUT_SESSION', label: 'Breakout Session' },
    { value: 'EVENING_PROGRAM', label: 'Evening Program' },
    { value: 'SPECIAL_SESSION', label: 'Special Session' },
    { value: 'PRAYER', label: 'Prayer & Consecration' },
    { value: 'BREAK', label: 'Break' },
  ];

  if (loading) {
    return <PageSpinner message="Loading Media & PA Control Center..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND BAR: REALTIME CLOCK & EVENT SWITCHER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title & Role Context */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-600/30 border border-indigo-400/40 rounded-2xl text-indigo-300 shadow-inner">
              <Tv className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Media & PA Operations Center
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Technical Console
                </span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                Real-time session timeline, stage countdowns, and AV pre-flight readiness checklist
              </p>
            </div>
          </div>

          {/* Real-time Clock & Stage Display Trigger */}
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
            {/* Live Clock Card */}
            <div className="bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-2 text-center shadow-inner min-w-[150px]">
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">Local Stage Time</p>
              <p className="text-2xl font-mono font-extrabold text-amber-400 tracking-wider">
                {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>

            {/* Launch Confidence Monitor */}
            <Button
              variant="primary"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg font-bold border border-blue-400/30 whitespace-nowrap"
              icon={<Maximize2 className="w-4 h-4" />}
              onClick={() => setShowConfidenceMonitor(true)}
            >
              Stage Confidence Monitor
            </Button>
          </div>
        </div>

        {/* Event Selector & Quick Details Toolbar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Active Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.startDate?.split('T')[0]} to {ev.endDate?.split('T')[0]})
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {selectedEvent.venue || selectedEvent.location || 'Main Auditorium'}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                {sessions.length} Scheduled Sessions
              </span>
              <button
                onClick={() => fetchEventDetailsAndSessions(selectedEventId)}
                className="text-indigo-300 hover:text-white flex items-center gap-1 ml-auto font-medium transition-colors"
                title="Refresh Session Schedule"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Sync Schedule
              </button>
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

      {/* ========================================================================= */}
      {/* 2. OPERATIONAL HERO: NEXT SESSION PRE-FLIGHT & CURRENT LIVE SESSION */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* NEXT SESSION PREPARATION (7 Columns) - PRIMARY EMPHASIS */}
        <div className="lg:col-span-7">
          <Card className="h-full border-2 border-indigo-500/40 dark:border-indigo-600/40 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Sliders className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white font-black uppercase tracking-wide">
                      Next Session Pre-Flight & Preparation
                    </CardTitle>
                    <p className="text-xs text-indigo-100">
                      High-priority preparation tasks for Media & Sound crew
                    </p>
                  </div>
                </div>
                {nextSession && (
                  <span className="bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-extrabold shadow animate-bounce">
                    Starts {getCountdownString(nextSession.startTime)}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardBody className="p-5 space-y-5">
              {nextSession ? (
                <>
                  {/* Session Overview Card */}
                  <div className="bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {getSessionTypeBadge(nextSession.type)}
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTimeSlot(nextSession.startTime, nextSession.endTime)}
                          </span>
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                          {nextSession.title}
                        </h2>
                        {nextSession.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {nextSession.description}
                          </p>
                        )}
                      </div>

                      {/* Speaker Badge */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-slate-700 shadow-sm shrink-0 min-w-[180px]">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Scheduled Speaker</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {nextSession.speakerName ? nextSession.speakerName[0] : 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">
                              {nextSession.speakerName || 'Speaker TBA'}
                            </p>
                            <p className="text-[10px] text-gray-500">Stage Presenter</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        Stage/Venue: <strong className="text-gray-800 dark:text-gray-200">{nextSession.venue || selectedEvent?.venue || 'Main Auditorium'}</strong>
                      </span>
                      <button
                        onClick={() => setSelectedSessionForModal(nextSession)}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Full Details
                      </button>
                    </div>
                  </div>

                  {/* Pre-Flight Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        AV & Sound Technical Checklist
                      </h3>
                      <span className="text-[11px] font-semibold text-gray-500">
                        {Object.values(checklists[nextSession.id] || {}).filter(Boolean).length} of {defaultChecklistItems.length} checked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {defaultChecklistItems.map((item) => {
                        const isChecked = Boolean(checklists[nextSession.id]?.[item.id]);
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleChecklistItem(nextSession.id, item.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                              isChecked
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                                : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <button
                              type="button"
                              className="focus:outline-none shrink-0"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            <Icon className={`w-4 h-4 shrink-0 ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                            <span className={`text-xs font-semibold select-none leading-snug ${isChecked ? 'line-through text-emerald-800 dark:text-emerald-300 opacity-90' : ''}`}>
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage & Sound Cue Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      Session PA Cue Notes & Technical Directives
                    </label>
                    <textarea
                      rows={2}
                      value={techNotes[nextSession.id] || ''}
                      onChange={(e) => handleTechNoteChange(nextSession.id, e.target.value)}
                      placeholder="e.g. Speaker requested lapel mic + handheld for Q&A, keynote video at min 15, translator on channel 2..."
                      className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-500 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
                  <p className="font-bold text-gray-800 dark:text-gray-200">No Upcoming Sessions Left Today</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    All scheduled sessions for today have concluded. You can review the master schedule below or prepare for tomorrow.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* CURRENT LIVE SESSION (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-2 border-emerald-500/40 dark:border-emerald-600/40 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 animate-ping"></div>
                  <CardTitle className="text-lg text-white font-black uppercase tracking-wide">
                    Live On Stage Now
                  </CardTitle>
                </div>
                <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  In Progress
                </span>
              </div>
            </CardHeader>

            <CardBody className="p-5 space-y-4">
              {currentSession ? (
                (() => {
                  const progress = getSessionProgress(currentSession.startTime, currentSession.endTime);
                  return (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          {getSessionTypeBadge(currentSession.type)}
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                            {formatTimeSlot(currentSession.startTime, currentSession.endTime)}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                          {currentSession.title}
                        </h3>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          Speaker: <span className="text-gray-900 dark:text-white font-bold">{currentSession.speakerName || 'Speaker on Stage'}</span>
                        </p>
                      </div>

                      {/* Progress Bar & Timing Breakdown */}
                      <div className="bg-gray-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 font-medium">Elapsed: <strong>{progress.elapsedMin}m</strong></span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {progress.remainingMin > 0 ? `${progress.remainingMin}m remaining` : 'Ending Soon'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Live Technical Monitoring Indicators */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                          <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200">Broadcast</p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Live Stream OK</p>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                          <Video className="w-4 h-4 text-red-500 animate-pulse" />
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200">Recording</p>
                            <p className="text-[10px] text-red-600 dark:text-red-400">Capturing Audio/Video</p>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full text-xs font-bold border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        icon={<Maximize2 className="w-3.5 h-3.5" />}
                        onClick={() => setShowConfidenceMonitor(true)}
                      >
                        Open Live Stage Clock Mode
                      </Button>
                    </>
                  );
                })()
              ) : (
                <div className="py-6 text-center text-gray-500 space-y-2">
                  <Activity className="w-10 h-10 text-gray-400 mx-auto opacity-50" />
                  <p className="font-bold text-gray-700 dark:text-gray-300">No Session Active Right Now</p>
                  <p className="text-xs text-gray-400">
                    Stage is currently on intermission or standby. Check the next upcoming session.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Quick Media Assets & Attachments */}
          <Card className="shadow-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <CardHeader className="p-4 border-b border-gray-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Download className="w-4 h-4 text-indigo-600" />
                Event Media Files & Presentation Vault
              </CardTitle>
            </CardHeader>
            <CardBody className="p-4">
              {resources.length > 0 ? (
                <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
                  {resources.slice(0, 5).map(res => (
                    <div
                      key={res.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="truncate font-medium text-gray-800 dark:text-gray-200">{res.name || res.title}</span>
                      </div>
                      {res.fileUrl && (
                        <a
                          href={res.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-[11px] shrink-0"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-3">
                  No presentation assets uploaded for this event yet.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MASTER EVENT TIMETABLE & SCHEDULERS (FULL SCHEDULE VIEW) */}
      {/* ========================================================================= */}
      <Card className="shadow-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Master Event Timetable & Session Schedulers
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Complete chronological itinerary, speaker line-ups, and stage technical assignments
              </p>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                {filteredSessions.length} sessions listed
              </span>
            </div>
          </div>

          {/* Search & Type Filters */}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search sessions by title, speaker, or auditorium..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="w-full sm:w-64">
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {sessionTypes.map(st => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Filter Tabs */}
          {uniqueDates.length > 0 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
              <button
                onClick={() => setSelectedDateTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedDateTab === 'ALL'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                All Days ({sessions.length})
              </button>
              {uniqueDates.map((dt, idx) => {
                const count = sessions.filter(s => s.startTime?.startsWith(dt)).length;
                const dObj = new Date(dt + 'T00:00:00');
                const dayLabel = dObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <button
                    key={dt}
                    onClick={() => setSelectedDateTab(dt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      selectedDateTab === dt
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Day {idx + 1}: {dayLabel}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedDateTab === dt ? 'bg-indigo-700 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardHeader>

        <CardBody className="p-0">
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                icon={<Calendar className="w-12 h-12 text-gray-400" />}
                title="No Sessions Match Your Filter"
                description="Try selecting a different day tab, clearing your search query, or checking other session types."
                action={
                  <Button variant="outline" size="sm" onClick={() => { setSelectedDateTab('ALL'); setSelectedTypeFilter('ALL'); setSearchQuery(''); }}>
                    Reset Filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredSessions.map((session, index) => {
                const isLive = currentSession?.id === session.id;
                const isNext = nextSession?.id === session.id;
                const isPast = new Date(session.endTime).getTime() < currentTime.getTime();
                const sessionDate = session.startTime ? new Date(session.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : '';
                const checklistCount = Object.values(checklists[session.id] || {}).filter(Boolean).length;

                return (
                  <div
                    key={session.id}
                    className={`p-4 sm:p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isLive
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-l-4 border-emerald-500'
                        : isNext
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-l-4 border-indigo-500'
                        : isPast
                        ? 'opacity-60 bg-gray-50/30 dark:bg-slate-900/30'
                        : 'hover:bg-gray-50/80 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Left: Time Slot & Status */}
                    <div className="flex items-start gap-4 min-w-[200px]">
                      <div className="text-center p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700 shrink-0 min-w-[90px]">
                        <p className="text-[10px] uppercase font-bold text-gray-500">{sessionDate}</p>
                        <p className="text-sm font-extrabold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {session.startTime?.split('T')[1]?.substring(0, 5) || 'TBA'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          to {session.endTime?.split('T')[1]?.substring(0, 5) || 'TBA'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getSessionTypeBadge(session.type)}
                          {isLive && (
                            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                              Live
                            </span>
                          )}
                          {isNext && (
                            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                              Next Up
                            </span>
                          )}
                          {isPast && (
                            <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Finished
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-gray-900 dark:text-white">
                          {session.title}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5 text-indigo-500" />
                            {session.speakerName || 'Speaker TBA'}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {session.venue || selectedEvent?.venue || 'Main Stage'}
                          </span>
                          {checklistCount > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckSquare className="w-3 h-3" />
                              {checklistCount}/6 Tech Ready
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                        icon={<Sliders className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedSessionForModal(session)}
                      >
                        Tech Prep & Checklist
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedSessionForModal(session)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ========================================================================= */}
      {/* 4. TECHNICAL PRE-FLIGHT / DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedSessionForModal && (
        <Modal
          isOpen={Boolean(selectedSessionForModal)}
          onClose={() => setSelectedSessionForModal(null)}
          title={`Stage & AV Preparation: ${selectedSessionForModal.title}`}
          size="lg"
          footer={
            <div className="flex justify-between items-center w-full">
              <span className="text-xs text-gray-500">
                Media & PA Cue Sheet • Saved automatically
              </span>
              <Button
                variant="primary"
                onClick={() => setSelectedSessionForModal(null)}
              >
                Close & Continue
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getSessionTypeBadge(selectedSessionForModal.type)}
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {formatTimeSlot(selectedSessionForModal.startTime, selectedSessionForModal.endTime)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedSessionForModal.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Speaker: <strong>{selectedSessionForModal.speakerName || 'Speaker TBA'}</strong> • Venue: <strong>{selectedSessionForModal.venue || 'Main Auditorium'}</strong>
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2.5 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Pre-Flight Sound, Projection & Media Checklist
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {defaultChecklistItems.map((item) => {
                  const isChecked = Boolean(checklists[selectedSessionForModal.id]?.[item.id]);
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(selectedSessionForModal.id, item.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 ${isChecked ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span className={`text-xs font-semibold select-none leading-tight ${isChecked ? 'line-through opacity-80' : ''}`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Technical Notes & Stage Directives
              </label>
              <textarea
                rows={3}
                value={techNotes[selectedSessionForModal.id] || ''}
                onChange={(e) => handleTechNoteChange(selectedSessionForModal.id, e.target.value)}
                placeholder="Enter notes for sound operator, camera operator, and stage manager..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 5. STAGE CONFIDENCE MONITOR / FULLSCREEN DIGITAL TIMER MODAL */}
      {/* ========================================================================= */}
      {showConfidenceMonitor && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-6 sm:p-10 select-none animate-fadeIn">
          {/* Top Stage Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
                SDA CampCoordAI • PA Stage Confidence Monitor
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-mono">Current Time</p>
                <p className="text-xl font-mono font-bold text-amber-400">
                  {currentTime.toLocaleTimeString([], { hour12: false })}
                </p>
              </div>
              <button
                onClick={() => setShowConfidenceMonitor(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                title="Exit Stage Monitor"
              >
                <Minimize2 className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Central Main Stage Display */}
          <div className="my-auto text-center space-y-6 max-w-5xl mx-auto">
            {currentSession ? (
              (() => {
                const progress = getSessionProgress(currentSession.startTime, currentSession.endTime);
                const isOvertime = progress.percentage >= 100;
                const isWarning = progress.remainingMin <= 5 && !isOvertime;

                return (
                  <>
                    <div className="space-y-2">
                      <span className="px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        Current Session Live
                      </span>
                      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-2">
                        {currentSession.title}
                      </h1>
                      <p className="text-xl sm:text-2xl font-bold text-indigo-300">
                        Speaker: {currentSession.speakerName || 'Speaker on Stage'}
                      </p>
                    </div>

                    {/* Giant Digital Countdown Timer */}
                    <div className={`p-8 rounded-3xl border-4 shadow-2xl transition-all ${
                      isOvertime
                        ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse'
                        : isWarning
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                        : 'bg-slate-900/90 border-emerald-500 text-emerald-400'
                    }`}>
                      <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                        {isOvertime ? 'OVERTIME ALERT' : 'TIME REMAINING'}
                      </p>
                      <p className="text-6xl sm:text-9xl font-mono font-black tracking-tighter">
                        {isOvertime
                          ? `+${progress.elapsedMin - Math.round((new Date(currentSession.endTime) - new Date(currentSession.startTime)) / 60000)}m`
                          : `${progress.remainingMin} MIN`}
                      </p>
                      <p className="text-sm font-semibold text-slate-400 mt-2">
                        Scheduled: {formatTimeSlot(currentSession.startTime, currentSession.endTime)}
                      </p>
                    </div>
                  </>
                );
              })()
            ) : nextSession ? (
              <div className="space-y-4">
                <span className="px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Standby / Next Up
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white">
                  {nextSession.title}
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-amber-300">
                  Speaker: {nextSession.speakerName || 'Speaker TBA'}
                </p>
                <div className="p-8 bg-slate-900/80 border-2 border-indigo-500 rounded-3xl text-indigo-300">
                  <p className="text-xs uppercase font-bold text-slate-400 mb-1">Session Starts In</p>
                  <p className="text-5xl sm:text-8xl font-mono font-black text-amber-400">
                    {getCountdownString(nextSession.startTime)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-4xl font-bold text-slate-400">No Active Sessions</p>
                <p className="text-xl text-slate-600">Stage is ready for next program</p>
              </div>
            )}
          </div>

          {/* Bottom Stage Preview: Next Session */}
          <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              {nextSession && (
                <p>
                  <strong className="text-indigo-400 uppercase font-bold">Next Session Preview:</strong>{' '}
                  <span className="text-white font-bold">{nextSession.title}</span> ({nextSession.speakerName || 'TBA'}) • Starts {nextSession.startTime?.split('T')[1]?.substring(0, 5)}
                </p>
              )}
            </div>
            <div className="text-right text-slate-500">
              Press Escape or click minimize button to exit stage monitor
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
