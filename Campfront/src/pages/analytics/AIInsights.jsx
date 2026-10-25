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
  Bed
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
import ReadinessRadarWidget from '../../components/ai/ReadinessRadarWidget';

export default function AIInsights() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'predictions'

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
    let riskTitle = 'Optimal Capacity';

    if (totalBedCap === 0 && bedsRequired > 0) {
      riskType = 'UNASSIGNED';
      riskTitle = 'Unassigned Lodging Infrastructure';
    } else if (bedDeficit > 0) {
      riskType = 'DEFICIT';
      riskTitle = 'Lodging Capacity Deficit';
    } else if (availableBeds > 0 && bedsRequired > availableBeds * 0.85) {
      riskType = 'STRAIN';
      riskTitle = 'Moderate Capacity Strain';
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
    if (!aiData) return;
    const reportData = {
      title: "CampCoordAI Predictive Intelligence & Readiness Audit",
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.email || 'Administrator',
      groundTruthMetrics: {
        totalEvents: aiData.totalEvents,
        completedEvents: aiData.completedEventsCount,
        upcomingEvents: aiData.upcomingEventsCount,
        totalRegistrations: aiData.totalRegistrations,
        totalConfirmedRegistrations: aiData.totalConfirmedRegistrations,
        historicalTurnoutRate: `${aiData.predictedTurnoutRate}%`,
        hasSufficientHistoricalData: aiData.hasSufficientHistoricalData,
        confidenceScore: `${aiData.turnoutConfidenceScore}%`,
        totalVerifiedRevenue: `${aiData.totalVerifiedRevenue || 0} RWF`,
        totalRevenueVolume: `${aiData.totalRevenue || 0} RWF`,
        totalBedCapacity: aiData.totalBedCapacity,
        occupiedBeds: aiData.totalOccupiedBeds,
        occupancyRate: `${aiData.overallOccupancyRate}%`,
        totalResources: aiData.totalResources,
        allocatedResources: aiData.totalAllocatedResources
      },
      monthlyAttendanceTrends: aiData.attendanceTrends || [],
      departmentEngagement: aiData.departmentPerformance || [],
      dynamicInsights: aiData.dynamicInsights || [],
      activeSimulation: simulationResult
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Insights_Executive_Report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('AI Intelligence executive audit exported successfully.');
  };

  if (loading && !aiData) {
    return <PageSpinner message="Computing PostgreSQL ground-truth telemetry and AI forecasts..." />;
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
              AI Insights & Operational Readiness
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL Ground Truth
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            Live database telemetry, automated shortfall diagnostics, and predictive scenario modeling.
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
            {refreshing ? 'Recalculating...' : 'Refresh Telemetry'}
          </Button>

          <Button
            variant="primary"
            icon={<Download className="w-4 h-4 mr-1.5" />}
            onClick={handleExportReport}
            className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Export Audit
          </Button>
        </div>
      </div>

      {/* Understated Executive Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'radar'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          Readiness Detection Radar
        </button>

        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'predictions'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          Predictive Forecaster & Simulator
        </button>
      </div>

      {/* Historical Data Limitation Notice */}
      {aiData && !aiData.hasSufficientHistoricalData && (
        <div className="flex items-start sm:items-center gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 text-xs">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <span className="font-semibold text-slate-900 dark:text-white">Live Data Mode: </span>
            Insufficient historical completed events to project long-term regression curves. Turnout and demand models are currently computed from {aiData.totalEvents || 0} active/scoped {aiData.totalEvents === 1 ? 'event' : 'events'} and {aiData.totalRegistrations || 0} verified registrations.
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

      {/* TAB 1: AI Future Preparation & Readiness Radar */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          <ReadinessRadarWidget />
        </div>
      )}

      {/* TAB 2: Machine Learning Forecaster & Simulator */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {/* Top Primary Executive Metrics (Monochrome & Mono Numbers) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Predicted Turnout Rate */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardBody className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Historical Turnout
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">
                    {confidenceScore}% Conf
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-semibold font-mono text-slate-900 dark:text-white">
                    {turnoutRate}%
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Completed Events:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-200">
                    {aiData?.completedEventsCount || 0}
                  </span>
                </div>
              </CardBody>
            </Card>

            {/* Verified Revenue */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardBody className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Verified Revenue
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">
                    MoMo & Treasury
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-2xl sm:text-3xl font-semibold font-mono text-slate-900 dark:text-white truncate">
                    {formatCurrency(totalVerifiedRevenue)}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Total Inflow Pipeline:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-200 truncate ml-2">
                    {formatCurrency(aiData?.totalRevenue)}
                  </span>
                </div>
              </CardBody>
            </Card>

            {/* Bed Occupancy */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardBody className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Lodging Utilization
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">
                    {aiData?.totalOccupiedBeds || 0} / {aiData?.totalBedCapacity || 0} Beds
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-semibold font-mono text-slate-900 dark:text-white">
                    {occupancyRate}%
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Capacity Status:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">
                    {(aiData?.totalBedCapacity || 0) === 0 ? 'No Bed Records' : occupancyRate > 90 ? 'Near Capacity' : 'Available'}
                  </span>
                </div>
              </CardBody>
            </Card>

            {/* Active Pipeline */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardBody className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Registration Pipeline
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">
                    {aiData?.totalConfirmedRegistrations || 0} Confirmed
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-semibold font-mono text-slate-900 dark:text-white">
                    {aiData?.totalRegistrations || 0}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Scoped Events:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-200">
                    {aiData?.totalEvents || 0} Active
                  </span>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Interactive AI Scenario Simulator */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <div>
                    <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                      Scenario & Turnout Simulator
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Adjust participant volume, registration fees, and lodging ratios to project operational demand.
                    </p>
                  </div>
                </div>

                {/* Preset Scoped Event Selector */}
                {events.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Event Preset:</span>
                    <select
                      value={simEventId}
                      onChange={(e) => handleSelectSimEvent(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="ALL">Overall Scoped Territory</option>
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
                {/* Simulator Controls with Neutral Slate Tracks */}
                <div className="space-y-5 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-5 lg:pb-0 lg:pr-6">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Target Sign-ups:</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{simParticipants}</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="1500"
                      step="10"
                      value={simParticipants}
                      onChange={(e) => setSimParticipants(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-100"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span>20</span>
                      <span>750</span>
                      <span>1,500</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Registration Fee:</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{simFee.toLocaleString()} RWF</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="2500"
                      value={simFee}
                      onChange={(e) => setSimFee(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-100"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span>Free</span>
                      <span>50,000</span>
                      <span>100,000</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Lodging Required:</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{simLodgingPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={simLodgingPercent}
                      onChange={(e) => setSimLodgingPercent(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-100"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span>0% (Day Camp)</span>
                      <span>50%</span>
                      <span>100% (Residential)</span>
                    </div>
                  </div>
                </div>

                {/* Simulated AI Output */}
                {simulationResult && (
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Projected Turnout</p>
                        <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1">
                          {simulationResult.projectedAttendees}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">({turnoutRate}% historical)</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Projected Revenue</p>
                        <p className="text-base sm:text-lg font-semibold font-mono text-slate-900 dark:text-white mt-1 truncate">
                          {formatCurrency(simulationResult.projectedRevenue)}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">Gross collections</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Beds Required</p>
                        <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1">
                          {simulationResult.bedsRequired}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">avail: {simulationResult.availableBeds}</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">A/V Sound Units</p>
                        <p className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1">
                          {simulationResult.soundSystemsNeeded}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">Recommended</p>
                      </div>
                    </div>

                    {/* Executive Clean Risk Assessment Alert Banners */}
                    {simulationResult.riskType === 'DEFICIT' || simulationResult.riskType === 'UNASSIGNED' ? (
                      <div className="border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 p-4 rounded-r-lg flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-semibold text-rose-900 dark:text-rose-200">
                            Readiness Alert: {simulationResult.riskTitle}
                          </p>
                          <p className="text-rose-700 dark:text-rose-300">
                            {simulationResult.riskType === 'UNASSIGNED'
                              ? 'No accommodation room infrastructure has been configured in the database for this venue. Register dormitory blocks or off-site lodge allocations.'
                              : `Simulated lodging demand (${simulationResult.bedsRequired} beds) exceeds available accommodation capacity (${simulationResult.availableBeds} beds) by ${simulationResult.bedDeficit} beds.`}
                          </p>
                        </div>
                      </div>
                    ) : simulationResult.riskType === 'STRAIN' ? (
                      <div className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-4 rounded-r-lg flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-semibold text-amber-900 dark:text-amber-200">
                            Readiness Notice: {simulationResult.riskTitle}
                          </p>
                          <p className="text-amber-700 dark:text-amber-300">
                            Lodging demand ({simulationResult.bedsRequired} beds) utilizes over 85% of available capacity ({simulationResult.availableBeds} beds). Minimal buffer remains for walk-ins.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-r-lg flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                            Readiness Confirmed: {simulationResult.riskTitle}
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

          {/* Clean Executive Monotone Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Attendance Trends */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
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

            {/* Department Engagement (Uniform Executive Navy Bars) */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
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
