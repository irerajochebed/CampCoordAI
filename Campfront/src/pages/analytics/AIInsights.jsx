import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Brain,
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  Target,
  SlidersHorizontal,
  Package,
  ArrowRight,
  ShieldAlert,
  Radio,
  Building2,
  Info,
  Layers,
  Bed,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { analyticsApi, eventApi, getCachedData } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import ReadinessRadarWidget from '../../components/ai/ReadinessRadarWidget';
import { exportReadinessAuditToExcel } from '../../utils/excelExport';

export default function AIInsights() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'predictions'
  const [currentAssessment, setCurrentAssessment] = useState(null);

  // Instant In-Memory Cache Initialization (Zero-Delay Instant UI Rendering)
  const cachedAiData = useMemo(() => {
    const cached = getCachedData('/analytics/ai-insights') || getCachedData('/ai/insights');
    return cached?.data || cached || null;
  }, []);

  const cachedEvents = useMemo(() => {
    const cached = getCachedData('/events');
    const list = cached?.data || cached || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const [loading, setLoading] = useState(!cachedAiData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Live database AI data
  const [aiData, setAiData] = useState(cachedAiData);
  const [events, setEvents] = useState(cachedEvents);

  // Interactive Scenario Simulator State (initialized from live DB)
  const [simEventId, setSimEventId] = useState('ALL');
  const [simParticipants, setSimParticipants] = useState(cachedAiData?.defaultEventMaxParticipants || 100);
  const [simFee, setSimFee] = useState(cachedAiData?.defaultEventRegistrationFee ? Number(cachedAiData.defaultEventRegistrationFee) : 25000);
  const [simLodgingPercent, setSimLodgingPercent] = useState(65);
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    fetchAIAnalytics(cachedAiData !== null);
  }, []);

  useEffect(() => {
    runSimulation();
  }, [simParticipants, simFee, simLodgingPercent, simEventId, aiData]);

  const fetchAIAnalytics = async (isBackground = false) => {
    try {
      if (isBackground) {
        setRefreshing(true);
      } else if (!aiData) {
        setLoading(true);
      }
      setError(null);

      const [aiRes, eventsRes] = await Promise.all([
        analyticsApi.getAIInsights(),
        eventApi.getAll().catch(() => ({ data: { data: [] } }))
      ]);

      const data = aiRes.data?.data || aiRes.data;
      const evList = eventsRes.data?.data || eventsRes.data || [];

      setAiData(data);
      setEvents(Array.isArray(evList) ? evList : []);

      // Initialize simulator defaults dynamically from live database records
      if (data?.defaultEventMaxParticipants) {
        setSimParticipants(Number(data.defaultEventMaxParticipants));
      } else if (evList.length > 0) {
        const firstEv = evList[0];
        if (firstEv.maxParticipants) {
          setSimParticipants(Number(firstEv.maxParticipants));
        }
      }

      if (data?.defaultEventRegistrationFee) {
        setSimFee(Number(data.defaultEventRegistrationFee));
      } else if (evList.length > 0 && evList[0].registrationFee) {
        setSimFee(Number(evList[0].registrationFee));
      }
    } catch (err) {
      console.error('Failed to load AI analytics:', err);
      if (!aiData) {
        setError(err.response?.data?.message || 'Failed to load predictive analytics data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSelectSimEvent = (eventId) => {
    setSimEventId(eventId);
    if (eventId === 'ALL') {
      setSimParticipants(aiData?.defaultEventMaxParticipants || (aiData?.totalRegistrations > 0 ? aiData.totalRegistrations : 100));
      setSimFee(aiData?.defaultEventRegistrationFee ? Number(aiData.defaultEventRegistrationFee) : 25000);
      return;
    }

    const ev = events.find(e => e.id?.toString() === eventId.toString());
    if (ev) {
      if (ev.maxParticipants) setSimParticipants(Number(ev.maxParticipants));
      else if (ev.expectedParticipants) setSimParticipants(Number(ev.expectedParticipants));
      else setSimParticipants(100);

      if (ev.registrationFee) setSimFee(Number(ev.registrationFee));
      else setSimFee(25000);
    }
  };

  const runSimulation = () => {
    // Grounded turnout rate derived directly from database completed events
    const turnoutRate = aiData?.predictedTurnoutRate ? (aiData.predictedTurnoutRate / 100) : 0.85;
    const projectedAttendees = Math.round(simParticipants * turnoutRate);
    const projectedRevenue = projectedAttendees * simFee;
    const bedsRequired = Math.round(projectedAttendees * (simLodgingPercent / 100));
    
    // Live accommodation telemetry from database
    const totalBedCap = aiData?.totalBedCapacity || 0;
    const occupiedBeds = aiData?.totalOccupiedBeds || 0;
    const availableBeds = Math.max(0, totalBedCap - occupiedBeds);
    const bedDeficit = Math.max(0, bedsRequired - availableBeds);

    let riskType = 'OPTIMAL'; // 'OPTIMAL' | 'STRAIN' | 'DEFICIT' | 'UNASSIGNED'
    let riskTitle = t('analytics.optimalCapacity', 'Optimal Capacity');

    if (totalBedCap === 0 && bedsRequired > 0) {
      riskType = 'UNASSIGNED';
      riskTitle = t('analytics.unassignedLodging', 'Unassigned Lodging Infrastructure');
    } else if (bedDeficit > 0) {
      riskType = 'DEFICIT';
      riskTitle = t('analytics.deficitRisk', 'Lodging Capacity Deficit');
    } else if (availableBeds > 0 && bedsRequired > availableBeds * 0.85) {
      riskType = 'STRAIN';
      riskTitle = t('analytics.moderateStrain', 'Moderate Capacity Strain');
    }

    setSimulationResult({
      projectedAttendees,
      projectedRevenue,
      bedsRequired,
      availableBeds,
      totalBedCap,
      bedDeficit,
      riskType,
      riskTitle,
      simParticipants,
      simFee,
      simLodgingPercent,
      soundSystemsNeeded: Math.max(1, Math.ceil(projectedAttendees / 300)),
      projectorsNeeded: Math.max(1, Math.ceil(projectedAttendees / 250))
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleExportReport = () => {
    try {
      const filename = exportReadinessAuditToExcel({
        currentAssessment,
        aiData,
        simulationResult,
        user,
        t
      });
      setSuccess(`${t('analytics.exportSuccess', 'Readiness audit exported to Excel successfully.')} (${filename})`);
    } catch (err) {
      console.error('Failed to export Excel report:', err);
      setError('Failed to generate Excel spreadsheet. Please try again.');
    }
  };

  if (loading && !aiData) {
    return <PageSpinner message={t('analytics.loadingDiagnostics', 'Loading attendance records and readiness indicators...')} />;
  }

  const turnoutRate = aiData?.predictedTurnoutRate ?? 0;
  const confidenceScore = aiData?.turnoutConfidenceScore ?? 80;
  const occupancyRate = aiData?.overallOccupancyRate ?? 0;
  const totalVerifiedRevenue = Number(aiData?.totalVerifiedRevenue || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('analytics.pageTitle', 'Readiness Analytics & Logistics Forecasts')}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            {t('analytics.pageSubtitle', 'Real-time registration metrics, automated logistics shortfall diagnostics, and turnout projections.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            icon={<RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={() => fetchAIAnalytics(true)}
            disabled={refreshing}
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {refreshing ? t('analytics.recalculating', 'Recalculating...') : t('analytics.recalculateDiagnostics', 'Recalculate Diagnostics')}
          </Button>

          {/* Meaningful, Humanized Excel Export Button */}
          <Button
            variant="primary"
            icon={<FileSpreadsheet className="w-4 h-4 mr-1.5" />}
            onClick={handleExportReport}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            {t('analytics.exportAudit', 'Export Audit (Excel)')}
          </Button>
        </div>
      </div>

      {/* Humanized & Meaningful Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'radar'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Radio className="w-4 h-4" />
          {t('analytics.tabReadiness', 'Readiness Assessment')}
        </button>

        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'predictions'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          {t('analytics.tabModeling', 'Turnout & Capacity Modeling')}
        </button>
      </div>

      {/* Historical Data Limitation Notice */}
      {aiData && !aiData.hasSufficientHistoricalData && (
        <div className="flex items-start sm:items-center gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 text-xs">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <span className="font-semibold text-slate-900 dark:text-white">{t('analytics.liveDataNotice', 'Live Data Mode')}: </span>
            Turnout and demand models are currently computed from {aiData.totalEvents || 0} active/scoped {aiData.totalEvents === 1 ? 'event' : 'events'} and {aiData.totalRegistrations || 0} verified registrations.
          </div>
        </div>
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          dismissible
        />
      )}

      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
          dismissible
        />
      )}

      {/* TAB 1: Preparation & Readiness Assessment */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          <ReadinessRadarWidget onAssessmentChange={setCurrentAssessment} />
        </div>
      )}

      {/* TAB 2: Turnout & Capacity Modeling */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {/* Top Primary Executive Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Predicted Turnout Rate */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardBody className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('analytics.historicalTurnout', 'Historical Turnout')}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono font-semibold border border-blue-200 dark:border-blue-800">
                    {confidenceScore}% {t('analytics.confidence', 'Conf')}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                    {turnoutRate}%
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{t('analytics.completedEvents', 'Completed Events')}:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                    {aiData?.completedEventsCount || 0}
                  </span>
                </div>
              </CardBody>
            </Card>

            {/* Verified Revenue */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardBody className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('analytics.verifiedRevenue', 'Verified Revenue')}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-semibold border border-emerald-200 dark:border-emerald-800">
                    {t('analytics.momoTreasury', 'MoMo & Treasury')}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white truncate">
                    {formatCurrency(totalVerifiedRevenue)}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{t('analytics.totalInflowPipeline', 'Total Inflow Pipeline')}:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-200 truncate ml-2">
                    {formatCurrency(aiData?.totalRevenue)}
                  </span>
                </div>
              </CardBody>
            </Card>

            {/* Bed Occupancy */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardBody className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('analytics.lodgingUtilization', 'Lodging Utilization')}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono font-semibold border border-amber-200 dark:border-amber-800">
                    {aiData?.totalOccupiedBeds || 0} / {aiData?.totalBedCapacity || 0} {t('analytics.beds', 'Beds')}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                    {occupancyRate}%
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{t('analytics.capacityStatus', 'Capacity Status')}:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {(aiData?.totalBedCapacity || 0) === 0 ? t('analytics.noBedRecords', 'No Bed Records') : occupancyRate > 90 ? t('analytics.nearCapacity', 'Near Capacity') : t('analytics.available', 'Available')}
                  </span>
                </div>
              </CardBody>
            </Card>

            {/* Active Pipeline */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardBody className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('analytics.registrationPipeline', 'Registration Pipeline')}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono font-semibold border border-indigo-200 dark:border-indigo-800">
                    {aiData?.totalConfirmedRegistrations || 0} {t('analytics.confirmed', 'Confirmed')}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                    {aiData?.totalRegistrations || 0}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{t('analytics.scopedEvents', 'Scoped Events')}:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                    {aiData?.totalEvents || 0} {t('analytics.active', 'Active')}
                  </span>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Scenario & Turnout Simulator */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50/70 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {t('analytics.simulatorTitle', 'Scenario & Turnout Simulator')}
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('analytics.simulatorSubtitle', 'Adjust participant volume, registration fees, and lodging ratios to project operational demand.')}
                    </p>
                  </div>
                </div>

                {/* Preset Scoped Event Selector */}
                {events.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {t('analytics.eventPreset', 'Event Preset')}:
                    </span>
                    <select
                      value={simEventId}
                      onChange={(e) => handleSelectSimEvent(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">{t('analytics.allAggregatedEvents', 'All Scoped Events')}</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name} ({ev.maxParticipants || 100} max)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardBody className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Simulator Controls */}
                <div className="space-y-5 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-5 lg:pb-0 lg:pr-6">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-slate-700 dark:text-slate-300">
                        {t('analytics.targetParticipants', 'Target Participant Capacity')}:
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{simParticipants}</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="1500"
                      step="10"
                      value={simParticipants}
                      onChange={(e) => setSimParticipants(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span>20</span>
                      <span>750</span>
                      <span>1,500</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-slate-700 dark:text-slate-300">
                        {t('analytics.registrationFee', 'Registration Fee (RWF)')}:
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{simFee.toLocaleString()} RWF</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="2500"
                      value={simFee}
                      onChange={(e) => setSimFee(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span>0</span>
                      <span>50,000</span>
                      <span>100,000</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-slate-700 dark:text-slate-300">
                        {t('analytics.lodgingRequirement', 'Lodging / Bed Requirement')}:
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{simLodgingPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={simLodgingPercent}
                      onChange={(e) => setSimLodgingPercent(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Output with meaningful color alerts */}
                {simulationResult && (
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t('analytics.projectedAttendees', 'Projected Attendees')}
                        </p>
                        <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                          {simulationResult.projectedAttendees}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">({turnoutRate}% {t('analytics.historicalTurnout', 'historical')})</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t('analytics.projectedRevenue', 'Projected Revenue')}
                        </p>
                        <p className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white mt-1 truncate">
                          {formatCurrency(simulationResult.projectedRevenue)}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">Gross collections</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t('analytics.bedDemand', 'Beds Required')}
                        </p>
                        <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                          {simulationResult.bedsRequired}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {t('analytics.bedsAvailable', 'Avail')}: {simulationResult.availableBeds}
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t('analytics.soundSystemsNeeded', 'A/V Sound Units')}
                        </p>
                        <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                          {simulationResult.soundSystemsNeeded}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">Recommended</p>
                      </div>
                    </div>

                    {/* Meaningful Risk Assessment Alert Banners */}
                    {simulationResult.riskType === 'DEFICIT' || simulationResult.riskType === 'UNASSIGNED' ? (
                      <div className="border-l-4 border-l-rose-500 bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 p-4 rounded-r-xl flex items-start gap-3 shadow-xs">
                        <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-rose-900 dark:text-rose-200">
                            {t('analytics.deficitRisk', 'Readiness Alert')}: {simulationResult.riskTitle}
                          </p>
                          <p className="text-rose-700 dark:text-rose-300">
                            {simulationResult.riskType === 'UNASSIGNED'
                              ? t('analytics.unassignedLodging', 'No accommodation room infrastructure has been configured in the database for this venue. Register dormitory blocks or off-site lodge allocations.')
                              : `Simulated lodging demand (${simulationResult.bedsRequired} beds) exceeds available accommodation capacity (${simulationResult.availableBeds} beds) by ${simulationResult.bedDeficit} beds.`}
                          </p>
                        </div>
                      </div>
                    ) : simulationResult.riskType === 'STRAIN' ? (
                      <div className="border-l-4 border-l-amber-500 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 p-4 rounded-r-xl flex items-start gap-3 shadow-xs">
                        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-amber-900 dark:text-amber-200">
                            {t('analytics.moderateStrain', 'Readiness Notice')}: {simulationResult.riskTitle}
                          </p>
                          <p className="text-amber-700 dark:text-amber-300">
                            Lodging demand ({simulationResult.bedsRequired} beds) utilizes over 85% of available capacity ({simulationResult.availableBeds} beds). Minimal buffer remains for walk-ins.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="border-l-4 border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-r-xl flex items-start gap-3 shadow-xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-emerald-900 dark:text-emerald-200">
                            {t('analytics.optimalCapacity', 'Readiness Confirmed')}: {simulationResult.riskTitle}
                          </p>
                          <p className="text-emerald-700 dark:text-emerald-300">
                            Venue infrastructure comfortably accommodates this scenario with {Math.max(0, simulationResult.availableBeds - simulationResult.bedsRequired)} reserve beds remaining.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Clean Executive Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Attendance Trends */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                      Monthly Attendance & Dynamic Turnout
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Actual checked-in attendance vs 3-month moving average projection
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Last 6 Months</span>
                </div>
              </CardHeader>
              <CardBody className="p-4">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={aiData?.attendanceTrends || []} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#334155', 
                          borderRadius: '6px', 
                          color: '#f8fafc',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        name="Actual Turnout" 
                        stroke="#0f172a" 
                        strokeWidth={2.5} 
                        dot={{ r: 4, fill: '#0f172a' }} 
                        activeDot={{ r: 6 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="predicted" 
                        name="Moving Avg Projection" 
                        stroke="#2563eb" 
                        strokeWidth={2} 
                        strokeDasharray="4 4" 
                        dot={{ r: 3, fill: '#2563eb' }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Department Engagement */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                      Department & Ministry Engagement
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Total registrations and coordinated events grouped by department
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">DB Records</span>
                </div>
              </CardHeader>
              <CardBody className="p-4">
                <div className="h-72 w-full">
                  {aiData?.departmentPerformance && aiData.departmentPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={aiData.departmentPerformance} 
                        margin={{ top: 15, right: 15, left: -20, bottom: 25 }}
                      >
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#64748b" 
                          fontSize={11} 
                          interval={0} 
                          angle={-25} 
                          textAnchor="end" 
                          height={45} 
                          tickLine={false}
                        />
                        <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: '#334155', 
                            borderRadius: '6px', 
                            color: '#f8fafc',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}
                          formatter={(val, name, item) => [val, `${item.payload.fullName || item.payload.name} (${name})`]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="participants" name="Registrations" fill="#1e293b" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="events" name="Events Coordinated" fill="#475569" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <Building2 className="w-8 h-8 stroke-1 mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No department registration records linked yet</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Events will appear here automatically when departments are assigned.</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
