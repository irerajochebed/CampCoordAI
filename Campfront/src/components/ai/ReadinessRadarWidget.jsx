import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Bed,
  DollarSign,
  Volume2,
  Calendar,
  Mic2,
  Send,
  ChevronRight,
  ArrowUpRight,
  Activity,
  Filter,
  Layers,
  RefreshCw,
  Building,
  Check,
  X,
  Flame,
  Radio,
  ExternalLink,
  Info,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import Textarea from '../ui/Textarea';
import { readinessApi, getCachedData } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { exportReadinessAuditToExcel } from '../../utils/excelExport';

export default function ReadinessRadarWidget({ compact = false, onNavigateEvent, onAssessmentChange }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Instant In-Memory Cache Initialization (Zero-Delay Instant UI Rendering)
  const cachedReadiness = useMemo(() => {
    const cached = getCachedData('/ai/readiness') || getCachedData('/analytics/readiness');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const [assessments, setAssessments] = useState(cachedReadiness);
  const [selectedEventId, setSelectedEventId] = useState(cachedReadiness.length > 0 ? cachedReadiness[0].eventId : null);
  const [loading, setLoading] = useState(cachedReadiness.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Mitigation Drawer / Modal State
  const [mitigationModalOpen, setMitigationModalOpen] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState(null);
  const [customActionMessage, setCustomActionMessage] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Scope filter (for Union Admins who can view all fields)
  const [selectedFieldFilter, setSelectedFieldFilter] = useState('ALL');

  useEffect(() => {
    fetchReadinessData(cachedReadiness.length > 0);
  }, []);

  const fetchReadinessData = async (isBackground = false) => {
    try {
      if (isBackground) setRefreshing(true);
      else if (assessments.length === 0) setLoading(true);
      setError(null);

      const res = await readinessApi.getUpcoming();
      const list = res.data?.data || res.data || [];
      const validList = Array.isArray(list) ? list : [];
      setAssessments(validList);

      if (validList.length > 0 && (!selectedEventId || !validList.some(e => e.eventId === selectedEventId))) {
        setSelectedEventId(validList[0].eventId);
      }
    } catch (err) {
      console.error('Failed to fetch readiness assessments:', err);
      if (assessments.length === 0) {
        setError(err.response?.data?.message || 'Failed to load readiness diagnostics');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const currentAssessment = assessments.find(a => a.eventId === selectedEventId) || assessments[0] || null;

  // Notify parent of selected assessment
  useEffect(() => {
    if (onAssessmentChange && currentAssessment) {
      onAssessmentChange(currentAssessment);
    }
  }, [currentAssessment, onAssessmentChange]);

  // Filter distinct field names for Union Leaders/Admins
  const availableFields = Array.from(new Set(assessments.map(a => a.fieldName).filter(Boolean)));

  const filteredAssessments = assessments.filter(a => {
    if (selectedFieldFilter === 'ALL') return true;
    return a.fieldName === selectedFieldFilter;
  });

  const handleOpenMitigation = (rec) => {
    setActiveRecommendation(rec);
    setCustomActionMessage('');
    setMitigationModalOpen(true);
  };

  const handleExecuteMitigation = async () => {
    if (!activeRecommendation) return;

    try {
      setActionSubmitting(true);
      setError(null);

      const payload = {
        eventId: activeRecommendation.eventId || selectedEventId,
        actionType: activeRecommendation.actionType,
        targetRole: activeRecommendation.targetRole,
        customMessage: customActionMessage.trim() || undefined,
      };

      const res = await readinessApi.executeMitigation(payload);
      const data = res.data?.data || res.data;

      setActionSuccess(`Dispatched alert to ${data.recipientsNotifiedCount || 'designated'} leader(s): ${activeRecommendation.actionTitle}`);
      setMitigationModalOpen(false);
      setActiveRecommendation(null);
      setCustomActionMessage('');

      // Refresh assessments after brief interval
      setTimeout(() => {
        fetchReadinessData(true);
      }, 1000);
    } catch (err) {
      console.error('Failed to execute mitigation action:', err);
      setError(err.response?.data?.message || 'Failed to dispatch coordinator notification');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleSingleExport = () => {
    if (!currentAssessment) return;
    try {
      const filename = exportReadinessAuditToExcel({
        currentAssessment,
        aiData: null,
        simulationResult: null,
        user,
        t
      });
      setActionSuccess(`${t('analytics.exportSuccess', 'Readiness audit exported to Excel successfully.')} (${filename})`);
    } catch (err) {
      console.error('Failed to export Excel report:', err);
      setError('Failed to generate Excel document. Please try again.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Humanized, meaningful score styling
  const getScoreTheme = (score = 0) => {
    if (score >= 85) {
      return {
        text: 'text-emerald-700 dark:text-emerald-400',
        bgBox: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
        stroke: '#059669',
        label: t('analytics.optimalReadiness', 'Optimal Readiness'),
        icon: CheckCircle2,
      };
    }
    if (score >= 65) {
      return {
        text: 'text-amber-700 dark:text-amber-400',
        bgBox: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-300 dark:border-amber-700',
        stroke: '#d97706',
        label: t('analytics.moderateRisk', 'Moderate Risk'),
        icon: AlertTriangle,
      };
    }
    return {
      text: 'text-rose-700 dark:text-rose-400',
      bgBox: 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border-rose-300 dark:border-rose-700',
      stroke: '#e11d48',
      label: t('analytics.criticalRisk', 'Critical Shortfall Risk'),
      icon: ShieldAlert,
    };
  };

  if (loading && assessments.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t('analytics.loadingDiagnostics', 'Calculating readiness scores and logistics indicators...')}
          </p>
        </div>
      </Card>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('analytics.noUpcomingEvents', 'No Upcoming Events in Diagnostic Window')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('analytics.noUpcomingEventsDesc', 'The readiness assessment monitors camps scheduled within 30 to 90 days. No critical logistics flags detected.')}
          </p>
          <Button variant="outline" size="sm" onClick={() => fetchReadinessData(true)}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {t('analytics.rescanDatabase', 'Re-scan Database')}
          </Button>
        </div>
      </Card>
    );
  }

  const scoreTheme = getScoreTheme(currentAssessment?.overallReadinessScore || 0);
  const ScoreIcon = scoreTheme.icon;

  return (
    <div className="space-y-6">
      {/* Notifications / Alerts */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} dismissible />
      )}
      {actionSuccess && (
        <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess(null)} dismissible />
      )}

      {/* Main Readiness Assessment Card */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        {/* Humanized, Meaningful Header Bar (Replaces harsh pitch-black AI background) */}
        <CardHeader className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/50 dark:from-slate-850 dark:via-slate-800 dark:to-slate-850 p-5 sm:p-6 border-b border-slate-200 dark:border-slate-750">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 shadow-xs">
                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {t('analytics.diagnosticBadge', 'Operational Assessment')}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t('analytics.operationalTracking', 'Pre-Camp Operational Tracking (30–90 Days)')}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {currentAssessment?.eventName || 'Upcoming Event Readiness'}
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3 flex-wrap font-medium">
                <span className="inline-flex items-center gap-1">
                  📍 {currentAssessment?.venue || t('analytics.venueTbd', 'Venue TBD')}
                </span>
                <span className="inline-flex items-center gap-1">
                  🏛️ {currentAssessment?.fieldName}
                </span>
                <span className="inline-flex items-center gap-1">
                  📅 T-{currentAssessment?.daysUntilStart} {t('analytics.days', 'Days')} ({currentAssessment?.startDate} to {currentAssessment?.endDate})
                </span>
              </p>
            </div>

            {/* Event Selector & Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {availableFields.length > 1 && (
                <select
                  value={selectedFieldFilter}
                  onChange={(e) => setSelectedFieldFilter(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 font-medium shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">{t('analytics.allFieldsScope', 'All Fields Scope')} ({assessments.length})</option>
                  {availableFields.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              )}

              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className="text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 font-medium shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[240px]"
              >
                {filteredAssessments.map(ev => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.eventName} ({t('analytics.scoreOutOf', 'Score')}: {ev.overallReadinessScore}/100)
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchReadinessData(true)}
                disabled={refreshing}
                className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 text-xs py-2 px-3 rounded-lg font-semibold shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? t('analytics.evaluating', 'Evaluating...') : t('analytics.reevaluate', 'Re-evaluate')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSingleExport}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 text-xs py-2 px-3 rounded-lg font-semibold shadow-sm"
                title="Export this event readiness audit to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-6 space-y-6">
          {/* Top Section: Health Index Gauge + 5 Core Criteria */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Meaningful Score Gauge Widget (Dynamic Background reflecting readiness health) */}
            <div className={`lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl border ${scoreTheme.bgBox} text-center shadow-xs transition-colors duration-300`}>
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-200/80 dark:text-slate-700/60"
                    fill="transparent"
                  />
                  {/* Active Progress */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={scoreTheme.stroke}
                    strokeWidth="8"
                    strokeDasharray={`${(currentAssessment?.overallReadinessScore || 0) * 2.51} 251.2`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black tracking-tight ${scoreTheme.text}`}>
                    {currentAssessment?.overallReadinessScore}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    {t('analytics.scoreOutOf', '/ 100 Score')}
                  </span>
                </div>
              </div>

              <div className="mt-3.5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-xs ${scoreTheme.badgeClass}`}>
                  <ScoreIcon className="w-3.5 h-3.5" />
                  {scoreTheme.label}
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-medium">
                  {t('analytics.evaluatedAtMilestone', 'Evaluated at milestone T-{{days}} days before start').replace('{{days}}', currentAssessment?.daysUntilStart || 0)}
                </p>
              </div>
            </div>

            {/* 5 Core Readiness Criteria Breakdown */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {t('analytics.fivePillarsTitle', '5 Core Readiness Criteria Breakdown')}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {t('analytics.targetBenchmark', 'Target Benchmark: 20 pts per pillar')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pillar 1: Registration Velocity */}
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-700 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('analytics.pillarRegistration', 'Registration Trajectory')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {currentAssessment?.currentRegistrations} / {currentAssessment?.expectedParticipants} {t('analytics.signedUp', 'signed up')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                    (currentAssessment?.registrationScore ?? 0) >= 16 ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40' :
                    (currentAssessment?.registrationScore ?? 0) >= 12 ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40' :
                    'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40'
                  }`}>
                    {currentAssessment?.registrationScore}/20
                  </span>
                </div>

                {/* Pillar 2: Lodging Capacity */}
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between hover:border-amber-300 dark:hover:border-amber-700 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                      <Bed className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('analytics.pillarLodging', 'Lodging & Dorm Capacity')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {t('analytics.bedsVsNeeded', '{{beds}} beds vs {{needed}} needed')
                          .replace('{{beds}}', currentAssessment?.totalBedCapacity ?? 0)
                          .replace('{{needed}}', currentAssessment?.projectedBedDemand ?? 0)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                    (currentAssessment?.lodgingScore ?? 0) >= 16 ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40' :
                    (currentAssessment?.lodgingScore ?? 0) >= 12 ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40' :
                    'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40'
                  }`}>
                    {currentAssessment?.lodgingScore}/20
                  </span>
                </div>

                {/* Pillar 3: Financial & MoMo Inflow */}
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('analytics.pillarFinance', 'Financial & MoMo Inflow')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px] font-medium">
                        {formatCurrency(currentAssessment?.collectedRevenue)} {t('analytics.verified', 'verified')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                    (currentAssessment?.financeScore ?? 0) >= 16 ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40' :
                    (currentAssessment?.financeScore ?? 0) >= 12 ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40' :
                    'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40'
                  }`}>
                    {currentAssessment?.financeScore}/20
                  </span>
                </div>

                {/* Pillar 4: A/V Sound & Tech Clashes */}
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between hover:border-purple-300 dark:hover:border-purple-700 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('analytics.pillarResources', 'A/V Sound & Tech Allocation')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {currentAssessment?.allocatedSoundSystems}/{currentAssessment?.requiredSoundSystems} {t('analytics.soundSystems', 'Sound Systems')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                    (currentAssessment?.resourcesScore ?? 0) >= 16 ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40' :
                    (currentAssessment?.resourcesScore ?? 0) >= 12 ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40' :
                    'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40'
                  }`}>
                    {currentAssessment?.resourcesScore}/20
                  </span>
                </div>
              </div>

              {/* Pillar 5: Program & Keynote Speakers */}
              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between hover:border-cyan-300 dark:hover:border-cyan-700 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg">
                    <Mic2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {t('analytics.pillarProgram', 'Program & Keynote Speakers')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {currentAssessment?.confirmedSessions} / {currentAssessment?.totalSessions} {t('analytics.sessionsConfirmed', 'sessions confirmed')}
                      {currentAssessment?.unassignedSpeakersCount > 0 && ` (${currentAssessment?.unassignedSpeakersCount} ${t('analytics.pendingSpeakers', 'pending speakers')})`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                  (currentAssessment?.programScore ?? 0) >= 16 ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40' :
                  (currentAssessment?.programScore ?? 0) >= 12 ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40' :
                  'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40'
                }`}>
                  {currentAssessment?.programScore}/20
                </span>
              </div>
            </div>
          </div>

          {/* Categorized Preparation Checklist & Shortfalls */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                {t('analytics.shortfallsTitle', 'Detected Preparation Shortfalls & Automated Diagnosis')}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {currentAssessment?.warnings?.length || 0} {t('analytics.flaggedItems', 'Flagged Item(s)')}
              </span>
            </div>

            {currentAssessment?.warnings?.length === 0 ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                  {t('analytics.allPillarsOptimal', 'All preparation pillars are operating within optimal parameters. No logistical crises detected.')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentAssessment?.warnings?.map((warning, idx) => {
                  const isHigh = warning.severity === 'HIGH';
                  let icon = <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
                  let categoryBadge = t('analytics.catLodging', '⛺ Lodging Capacity');
                  if (warning.category === 'REGISTRATION') {
                    categoryBadge = t('analytics.catRegistration', '👥 Registration Trajectory');
                    icon = <Users className="w-4 h-4 text-blue-600 shrink-0" />;
                  } else if (warning.category === 'FINANCE') {
                    categoryBadge = t('analytics.catFinance', '💳 Financial Inflow');
                    icon = <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />;
                  } else if (warning.category === 'RESOURCES') {
                    categoryBadge = t('analytics.catResources', '🔊 A/V & Technical Allocation');
                    icon = <Volume2 className="w-4 h-4 text-purple-600 shrink-0" />;
                  } else if (warning.category === 'PROGRAM') {
                    categoryBadge = t('analytics.catProgram', '📋 Program & Speakers');
                    icon = <Mic2 className="w-4 h-4 text-cyan-600 shrink-0" />;
                  }

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isHigh
                          ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                          : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {icon}
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {warning.title}
                          </span>
                        </div>
                        <Badge variant={isHigh ? 'danger' : 'warning'} size="sm">
                          {warning.severity} {t('analytics.severity', 'SEVERITY')}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                        {warning.details}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          {categoryBadge}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          Code: {warning.code}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommended Action Items & Leader Alerts */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  {t('analytics.actionItemsTitle', 'Recommended Action Items & Leader Alerts')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('analytics.actionItemsSubtitle', 'Dispatch direct notifications across pastoral, lodging, and logistics leadership')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {currentAssessment?.recommendations?.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {rec.actionTitle}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {rec.targetRole?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {rec.suggestedAction}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs font-semibold justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
                    onClick={() => handleOpenMitigation(rec)}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {rec.buttonLabel || t('analytics.sendAlert', 'Send Leader Alert')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Mitigation Action Modal */}
      <Modal
        isOpen={mitigationModalOpen}
        onClose={() => {
          if (!actionSubmitting) {
            setMitigationModalOpen(false);
            setActiveRecommendation(null);
          }
        }}
        title={t('analytics.modalTitle', 'Dispatch Operational Notification')}
      >
        {activeRecommendation && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeRecommendation.actionTitle}
                </h4>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {activeRecommendation.suggestedAction}
              </p>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold pt-1">
                {t('analytics.targetStakeholders', 'Target Stakeholders')}: {activeRecommendation.targetRole?.replace(/_/g, ' ')} & {t('analytics.campCoordinators', 'Camp Coordinators')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('analytics.customDirectivesLabel', 'Custom Urgent Directives (Optional):')}
              </label>
              <Textarea
                rows={3}
                placeholder={t('analytics.customDirectivesPlaceholder', 'Include custom instructions or specific deadlines for the field leadership team...')}
                value={customActionMessage}
                onChange={(e) => setCustomActionMessage(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMitigationModalOpen(false)}
                disabled={actionSubmitting}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteMitigation}
                disabled={actionSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {t('analytics.dispatchingDirectives', 'Dispatching Directives...')}
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {t('analytics.confirmDispatch', 'Confirm & Dispatch Directives')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
