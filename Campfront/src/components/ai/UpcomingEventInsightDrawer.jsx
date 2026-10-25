import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Building,
  DollarSign,
  BookOpen,
  ArrowRight,
  Info
} from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { PageSpinner } from '../ui/Spinner';
import { upcomingEventAiApi } from '../../api';

export default function UpcomingEventInsightDrawer({ eventId, isOpen, onClose, onRefreshSuccess }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchInsight();
    } else {
      setInsight(null);
      setError(null);
    }
  }, [isOpen, eventId]);

  const fetchInsight = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await upcomingEventAiApi.getEventInsights(eventId);
      const data = res.data?.data || res.data;
      setInsight(data);
    } catch (err) {
      console.error('Error fetching event AI insight:', err);
      setError(err.response?.data?.message || 'Failed to load AI readiness insight.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await upcomingEventAiApi.refreshInsights(eventId);
      const data = res.data?.data || res.data;
      setInsight(data);
      if (onRefreshSuccess) onRefreshSuccess(data);
    } catch (err) {
      console.error('Error refreshing AI insight:', err);
      setError(err.response?.data?.message || 'Failed to refresh AI insight.');
    } finally {
      setRefreshing(false);
    }
  };

  if (!isOpen) return null;

  const getRiskBadge = (level) => {
    const lvl = (level || 'LOW').toUpperCase();
    if (lvl === 'HIGH') {
      return <Badge variant="danger" className="px-2.5 py-1 text-xs font-bold uppercase">HIGH RISK</Badge>;
    }
    if (lvl === 'MEDIUM') {
      return <Badge variant="warning" className="px-2.5 py-1 text-xs font-bold uppercase">MEDIUM RISK</Badge>;
    }
    return <Badge variant="success" className="px-2.5 py-1 text-xs font-bold uppercase">ON TRACK (LOW RISK)</Badge>;
  };

  const getConfidenceBadge = (conf) => {
    const c = (conf || 'MEDIUM').toUpperCase();
    const colors = {
      HIGH: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
      MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400',
      LOW: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${colors[c] || colors.MEDIUM}`}>
        {c} Confidence
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Readiness & Turnout Insights</h2>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
                  AI-generated suggestion
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Decision-support analytics for Adventist leadership</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh AI'}
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-24 text-center">
              <PageSpinner />
              <p className="mt-3 text-sm text-slate-500 font-medium">Computing historical regressions & readiness indicators...</p>
            </div>
          )}

          {error && (
            <Alert variant="danger" title="Error Loading Insight">
              {error}
            </Alert>
          )}

          {!loading && insight && (
            <>
              {/* Event Context Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800/60 dark:to-indigo-950/20 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {insight.eventType}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-mono">{insight.eventCode}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{insight.eventName}</h3>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {insight.venue || 'Venue TBA'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {insight.startDate} to {insight.endDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    {getRiskBadge(insight.riskLevel)}
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      T-{insight.daysUntilStart} Days
                    </span>
                  </div>
                </div>

                {/* Quick Numbers Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Current Regs</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {insight.currentRegistrations} {insight.maxParticipants ? `/ ${insight.maxParticipants}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Confirmed</span>
                    <span className="font-bold text-emerald-600 text-sm">{insight.confirmedRegistrations}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Bed Capacity</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{insight.totalAccommodationCapacity || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sessions</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {insight.totalSessionsCount} ({insight.sessionsWithSpeakerCount} speakers)
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Prediction Section */}
              <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                      Forecasted Total Attendance
                    </h4>
                  </div>
                  {getConfidenceBadge(insight.confidence)}
                </div>

                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300">
                    ~{insight.predictedAttendance}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    projected attendees ({insight.predictionMethod || 'Historical pace model'})
                  </span>
                </div>
              </div>

              {/* Executive AI Summary Box */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Executive Briefing
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Provider: {insight.providerUsed || 'Rule-Based Engine'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {insight.summaryText}
                </p>
                <div className="pt-2 flex items-center gap-1 text-[10px] text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60">
                  <Info className="w-3 h-3 text-slate-400" />
                  <span>Rwanda Law No. 058/2021 Compliant • Aggregated data only • Decision-support advisory</span>
                </div>
              </div>

              {/* Identified Readiness Risks */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Readiness Diagnostic Flags ({insight.risks?.length || 0})
                </h4>

                {(!insight.risks || insight.risks.length === 0) ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>All 6 readiness pillars are currently within target benchmarks.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {insight.risks.map((risk, idx) => {
                      const isHigh = risk.severity === 'HIGH';
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs space-y-1 ${
                            isHigh
                              ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60'
                              : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-rose-600' : 'bg-amber-500'}`} />
                              {risk.title}
                            </span>
                            <Badge variant={isHigh ? 'danger' : 'warning'} className="text-[10px] px-1.5 py-0.5 font-bold">
                              {risk.severity}
                            </Badge>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] pl-3.5">{risk.details}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actionable Recommendations */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Recommended Operational Next Steps
                </h4>

                <div className="space-y-2">
                  {insight.recommendations?.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {insight?.generatedAt ? `Generated at ${new Date(insight.generatedAt).toLocaleTimeString()}` : ''}
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
