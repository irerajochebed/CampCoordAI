import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
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
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import Textarea from '../ui/Textarea';
import { readinessApi, getCachedData } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export default function ReadinessRadarWidget({ compact = false, onNavigateEvent }) {
  const { user } = useAuth();

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
        setError(err.response?.data?.message || 'Failed to load AI Early-Warning & Readiness diagnostics');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const currentAssessment = assessments.find(a => a.eventId === selectedEventId) || assessments[0] || null;

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
      setError(err.response?.data?.message || 'Failed to dispatch AI mitigation action');
    } finally {
      setActionSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getScoreColorInfo = (score) => {
    if (score >= 85) {
      return {
        text: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800',
        stroke: '#10b981',
        badge: 'emerald',
        label: 'Optimal Readiness',
      };
    }
    if (score >= 65) {
      return {
        text: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800',
        stroke: '#f59e0b',
        badge: 'warning',
        label: 'Moderate Risk',
      };
    }
    return {
      text: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-800',
      stroke: '#f43f5e',
      badge: 'danger',
      label: 'Critical Shortfall Risk',
    };
  };

  if (loading && assessments.length === 0) {
    return (
      <Card className="dark:bg-slate-900 dark:border-slate-800 p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Scanning upcoming events & computing 5-pillar readiness telemetry...
          </p>
        </div>
      </Card>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card className="dark:bg-slate-900 dark:border-slate-800 p-6 text-center">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No Upcoming Events in Diagnostic Window
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            The AI Early-Warning engine continuously evaluates events starting within 30 to 90 days. No pending logistics risks detected.
          </p>
          <Button variant="outline" size="sm" onClick={() => fetchReadinessData(true)}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-scan Database
          </Button>
        </div>
      </Card>
    );
  }

  const scoreInfo = getScoreColorInfo(currentAssessment?.overallReadinessScore || 0);

  return (
    <div className="space-y-6">
      {/* Notifications / Alerts */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} dismissible />
      )}
      {actionSuccess && (
        <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess(null)} dismissible />
      )}

      {/* Main Radar Card */}
      <Card className="dark:bg-slate-900 dark:border-slate-800 border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Bar */}
        <CardHeader className="bg-slate-900 text-white p-5 border-b border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  AI Diagnostic Radar
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Autonomous 30–90 Day Preparation Engine
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 mt-1">
                {currentAssessment?.eventName || 'Upcoming Event Readiness'}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                <span>📍 {currentAssessment?.venue || 'Venue TBD'}</span>
                <span>🏛️ {currentAssessment?.fieldName}</span>
                <span>📅 T-{currentAssessment?.daysUntilStart} Days ({currentAssessment?.startDate} to {currentAssessment?.endDate})</span>
              </p>
            </div>

            {/* Event Selector & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {availableFields.length > 1 && (
                <select
                  value={selectedFieldFilter}
                  onChange={(e) => setSelectedFieldFilter(e.target.value)}
                  className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="ALL">All Fields Scope ({assessments.length})</option>
                  {availableFields.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              )}

              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-500 max-w-[220px] font-medium"
              >
                {filteredAssessments.map(ev => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.eventName} (Score: {ev.overallReadinessScore}/100)
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchReadinessData(true)}
                disabled={refreshing}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs py-1.5 rounded-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Evaluating...' : 'Re-evaluate'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-6 space-y-6">
          {/* Top Section: Health Index Gauge + Core Warning Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* 0-100 Gauge Widget */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl border dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-200 dark:text-slate-700"
                    fill="transparent"
                  />
                  {/* Active Progress */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={scoreInfo.stroke}
                    strokeWidth="8"
                    strokeDasharray={`${(currentAssessment?.overallReadinessScore || 0) * 2.51} 251.2`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black tracking-tight ${scoreInfo.text}`}>
                    {currentAssessment?.overallReadinessScore}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    / 100 Health
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full ${scoreInfo.bg} ${scoreInfo.text} border ${scoreInfo.border}`}>
                  {currentAssessment?.overallReadinessScore < 65 ? (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  ) : currentAssessment?.overallReadinessScore < 85 ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {scoreInfo.label}
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                  Evaluated at milestone T-{currentAssessment?.daysUntilStart} days before start
                </p>
              </div>
            </div>

            {/* Pillar Performance Breakdown */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  5 Core Readiness Pillars Telemetry
                </h3>
                <span className="text-xs text-gray-500">Target Baseline: 20 pts per pillar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pillar 1 */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Registration Velocity</p>
                      <p className="text-[11px] text-gray-500">
                        {currentAssessment?.currentRegistrations} / {currentAssessment?.expectedParticipants} signed up
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold ${currentAssessment?.registrationScore >= 16 ? 'text-emerald-600' : currentAssessment?.registrationScore >= 12 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {currentAssessment?.registrationScore}/20
                  </span>
                </div>

                {/* Pillar 2 */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                      <Bed className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Lodging & Dorm Capacity</p>
                      <p className="text-[11px] text-gray-500">
                        {currentAssessment?.totalBedCapacity} beds vs {currentAssessment?.projectedBedDemand} needed
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold ${currentAssessment?.lodgingScore >= 16 ? 'text-emerald-600' : currentAssessment?.lodgingScore >= 12 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {currentAssessment?.lodgingScore}/20
                  </span>
                </div>

                {/* Pillar 3 */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Financial & MoMo Inflow</p>
                      <p className="text-[11px] text-gray-500 truncate max-w-[170px]">
                        {formatCurrency(currentAssessment?.collectedRevenue)} verified
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold ${currentAssessment?.financeScore >= 16 ? 'text-emerald-600' : currentAssessment?.financeScore >= 12 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {currentAssessment?.financeScore}/20
                  </span>
                </div>

                {/* Pillar 4 */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">A/V Sound & Tech Clashes</p>
                      <p className="text-[11px] text-gray-500">
                        {currentAssessment?.allocatedSoundSystems}/{currentAssessment?.requiredSoundSystems} Sound Systems
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold ${currentAssessment?.resourcesScore >= 16 ? 'text-emerald-600' : currentAssessment?.resourcesScore >= 12 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {currentAssessment?.resourcesScore}/20
                  </span>
                </div>
              </div>

              {/* Pillar 5 */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 rounded-lg">
                    <Mic2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Program & Keynote Speakers</p>
                    <p className="text-[11px] text-gray-500">
                      {currentAssessment?.confirmedSessions} / {currentAssessment?.totalSessions} sessions confirmed
                      {currentAssessment?.unassignedSpeakersCount > 0 && ` (${currentAssessment?.unassignedSpeakersCount} pending speakers)`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-extrabold ${currentAssessment?.programScore >= 16 ? 'text-emerald-600' : currentAssessment?.programScore >= 12 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {currentAssessment?.programScore}/20
                </span>
              </div>
            </div>
          </div>

          {/* Categorized Preparation Checklist & Warning Badges */}
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Detected Preparation Shortfalls & Automated Diagnosis
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                {currentAssessment?.warnings?.length || 0} Flagged Item(s)
              </span>
            </div>

            {currentAssessment?.warnings?.length === 0 ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                  All preparation pillars are operating within optimal historical parameters. No logistical crises detected.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentAssessment?.warnings?.map((warning, idx) => {
                  const isHigh = warning.severity === 'HIGH';
                  let icon = <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
                  let categoryBadge = '⛺ Lodging Capacity';
                  if (warning.category === 'REGISTRATION') {
                    categoryBadge = '👥 Registration Trajectory';
                    icon = <Users className="w-4 h-4 text-blue-600 shrink-0" />;
                  } else if (warning.category === 'FINANCE') {
                    categoryBadge = '💳 Financial Inflow';
                    icon = <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />;
                  } else if (warning.category === 'RESOURCES') {
                    categoryBadge = '🔊 A/V & Technical Allocation';
                    icon = <Volume2 className="w-4 h-4 text-purple-600 shrink-0" />;
                  } else if (warning.category === 'PROGRAM') {
                    categoryBadge = '📋 Program & Speakers';
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
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {warning.title}
                          </span>
                        </div>
                        <Badge variant={isHigh ? 'danger' : 'warning'} size="sm">
                          {warning.severity} SEVERITY
                        </Badge>
                      </div>

                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                        {warning.details}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-gray-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-gray-600 dark:text-gray-400">
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

          {/* One-Click AI Mitigation Actions Drawer / Bar */}
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  One-Click AI Mitigation Workflow Shortcuts
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Execute direct automated interventions across pastoral, lodging, and logistics leadership
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentAssessment?.recommendations?.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 hover:border-slate-400 dark:hover:border-slate-600 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {rec.actionTitle}
                      </span>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {rec.targetRole?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {rec.suggestedAction}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs font-medium justify-center bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-md"
                    onClick={() => handleOpenMitigation(rec)}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {rec.buttonLabel || 'Trigger Mitigation'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Mitigation Action Confirmation Modal / Drawer */}
      <Modal
        isOpen={mitigationModalOpen}
        onClose={() => {
          if (!actionSubmitting) {
            setMitigationModalOpen(false);
            setActiveRecommendation(null);
          }
        }}
        title="Execute AI Mitigation Action"
      >
        {activeRecommendation && (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {activeRecommendation.actionTitle}
                </h4>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                {activeRecommendation.suggestedAction}
              </p>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold pt-1">
                Target Stakeholders: {activeRecommendation.targetRole?.replace('_', ' ')} & Camp Coordinators
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Custom Urgent Directives (Optional):
              </label>
              <Textarea
                rows={3}
                placeholder="Include custom instructions or specific deadlines for the field leadership team..."
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
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteMitigation}
                disabled={actionSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {actionSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Dispatching Directives...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Confirm & Dispatch Directives
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
