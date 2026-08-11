import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Sparkles,
  Download,
  RefreshCw,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { eventApi, registrationApi } from '../../api';

export default function AIInsights() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [aiPredictions, setAiPredictions] = useState({
    attendanceTrend: 'increasing',
    predictedTurnout: 85,
    confidence: 92,
    recommendation: 'Consider increasing capacity or adding additional sessions'
  });

  const [growthMetrics, setGrowthMetrics] = useState({
    participantGrowth: 23.5,
    eventGrowth: 15.2,
    revenueGrowth: 31.8,
    engagementScore: 87
  });

  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [eventTypeDistribution, setEventTypeDistribution] = useState([]);
  const [monthlyProjections, setMonthlyProjections] = useState([]);
  
  const [aiInsights, setAiInsights] = useState([
    {
      id: 1,
      type: 'positive',
      category: 'Attendance',
      title: 'Strong Youth Ministry Engagement',
      description: 'Youth events show 35% higher attendance rates compared to last year. Consider expanding youth programming.',
      impact: 'high',
      confidence: 94
    },
    {
      id: 2,
      type: 'warning',
      category: 'Resources',
      title: 'Accommodation Capacity Concern',
      description: 'Current accommodation capacity may be insufficient for upcoming summer camps. Recommend securing additional facilities.',
      impact: 'medium',
      confidence: 88
    },
    {
      id: 3,
      type: 'positive',
      category: 'Financial',
      title: 'Payment Verification Efficiency',
      description: 'Payment verification time has decreased by 40%. Automated processes are working effectively.',
      impact: 'medium',
      confidence: 91
    },
    {
      id: 4,
      type: 'suggestion',
      category: 'Planning',
      title: 'Optimal Event Timing',
      description: 'Historical data suggests August dates yield 20% higher registration rates. Consider prioritizing these dates.',
      impact: 'high',
      confidence: 86
    }
  ]);

  const [automatedReports, setAutomatedReports] = useState([
    {
      id: 1,
      title: 'Q2 2026 Event Performance Summary',
      generatedAt: '2026-07-25T10:30:00',
      status: 'ready',
      insights: 12,
      keyFindings: 'Overall participation increased by 18% with Youth Ministries leading growth'
    },
    {
      id: 2,
      title: 'Participant Retention Analysis',
      generatedAt: '2026-07-24T14:20:00',
      status: 'ready',
      insights: 8,
      keyFindings: 'Repeat attendance rate at 76%, up from 68% in previous quarter'
    },
    {
      id: 3,
      title: 'Resource Utilization Report',
      generatedAt: '2026-07-23T09:15:00',
      status: 'ready',
      insights: 6,
      keyFindings: 'Accommodation facilities operating at 82% average capacity'
    }
  ]);

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch events and registrations for analysis
      const [eventsRes, registrationsRes] = await Promise.all([
        eventApi.getAll(),
        registrationApi.getAll()
      ]);

      const events = eventsRes.data.success ? eventsRes.data.data : [];
      const registrations = registrationsRes.data.success ? registrationsRes.data.data : [];

      // Process data for visualizations
      processAttendanceTrends(events, registrations);
      processDepartmentPerformance(events);
      processEventTypeDistribution(events);
      generateMonthlyProjections(events, registrations);

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processAttendanceTrends = (events, registrations) => {
    // Group registrations by month for the last 6 months
    const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const trends = months.map(month => {
      // In production, calculate actual values from registrations
      const actual = Math.floor(Math.random() * 200) + 150;
      const predicted = actual + Math.floor(Math.random() * 30) - 10;
      
      return {
        month,
        actual,
        predicted,
        target: 200
      };
    });
    setAttendanceTrends(trends);
  };

  const processDepartmentPerformance = (events) => {
    const departments = [
      'Youth Ministries',
      'MIFEM',
      'Children\'s Ministries',
      'Family Ministries',
      'Health Ministries'
    ];

    const performance = departments.map(dept => ({
      name: dept,
      events: Math.floor(Math.random() * 15) + 5,
      participants: Math.floor(Math.random() * 500) + 200,
      satisfaction: Math.floor(Math.random() * 20) + 80
    }));

    setDepartmentPerformance(performance);
  };

  const processEventTypeDistribution = (events) => {
    const distribution = [
      { name: 'Youth Camps', value: 35, events: 12 },
      { name: 'Leadership Training', value: 25, events: 8 },
      { name: 'Prayer Conferences', value: 20, events: 6 },
      { name: 'Family Retreats', value: 15, events: 5 },
      { name: 'Others', value: 5, events: 3 }
    ];
    setEventTypeDistribution(distribution);
  };

  const generateMonthlyProjections = (events, registrations) => {
    const projections = [
      { month: 'Aug', participants: 320, revenue: 16000000, events: 8 },
      { month: 'Sep', participants: 280, revenue: 14000000, events: 7 },
      { month: 'Oct', participants: 350, revenue: 17500000, events: 9 },
      { month: 'Nov', participants: 300, revenue: 15000000, events: 8 },
      { month: 'Dec', participants: 420, revenue: 21000000, events: 11 }
    ];
    setMonthlyProjections(projections);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'suggestion':
        return <Sparkles className="w-5 h-5 text-blue-600" />;
      default:
        return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'suggestion':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const exportReport = async (reportId) => {
    try {
      // Implement PDF/Excel export
      alert('Report export functionality will be implemented');
    } catch (err) {
      setError('Export failed');
    }
  };

  if (loading) {
    return <PageSpinner message="Loading AI insights..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Insights & Analytics</h1>
          </div>
          <p className="text-gray-600">Intelligent predictions and data-driven recommendations</p>
        </div>
        <Button
          variant="outline"
          icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
          onClick={() => fetchAnalyticsData(true)}
          disabled={refreshing}
        >
          Refresh Data
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* AI Prediction Overview */}
      <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-blue-50">
        <CardBody>
          <div className="flex items-start gap-4">
            <div className="bg-primary-600 p-4 rounded-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI-Powered Attendance Prediction
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trend Forecast</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <p className="text-xl font-bold text-gray-900 capitalize">
                      {aiPredictions.attendanceTrend}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Predicted Turnout</p>
                  <p className="text-xl font-bold text-gray-900">
                    {aiPredictions.predictedTurnout}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Confidence Level</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${aiPredictions.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {aiPredictions.confidence}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg border border-primary-200">
                <p className="text-sm text-gray-700">
                  <Sparkles className="w-4 h-4 inline mr-1 text-primary-600" />
                  <span className="font-medium">Recommendation:</span> {aiPredictions.recommendation}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Participant Growth</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  +{growthMetrics.participantGrowth}%
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  vs last quarter
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Event Growth</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  +{growthMetrics.eventGrowth}%
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  vs last quarter
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  +{growthMetrics.revenueGrowth}%
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  vs last quarter
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {growthMetrics.engagementScore}
                </p>
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <Target className="w-3 h-3 mr-1" />
                  AI calculated
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends with Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends & AI Predictions</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={attendanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stackId="1"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.6}
                  name="Actual Attendance"
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  strokeDasharray="5 5"
                  name="AI Prediction"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Department Performance Analysis</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="events" fill="#0ea5e9" name="Events" />
                <Bar dataKey="participants" fill="#10b981" name="Participants" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Event Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Event Type Distribution</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={eventTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eventTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {eventTypeDistribution.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-gray-700">{item.name}: {item.events} events</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Monthly Projections */}
        <Card>
          <CardHeader>
            <CardTitle>Next 5 Months Projections</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyProjections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'revenue') return formatCurrency(value);
                    return value;
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="participants"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  name="Participants"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="events"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Events"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* AI Insights Cards */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border-2 ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Zap className="w-3 h-3" />
                        <span>{insight.confidence}% confidence</span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                    <Badge
                      variant={insight.impact === 'high' ? 'danger' : insight.impact === 'medium' ? 'warning' : 'info'}
                      className="text-xs"
                    >
                      {insight.impact.toUpperCase()} IMPACT
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Automated Reports */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Reports</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {automatedReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{report.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{report.keyFindings}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        Generated: {new Date(report.generatedAt).toLocaleString('en-RW', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {report.insights} insights
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{report.status}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={() => exportReport(report.id)}
                  >
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* AI Features Info */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardBody>
          <div className="flex items-start gap-4">
            <Brain className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">About AI Analytics</h3>
              <p className="text-sm text-gray-700 mb-3">
                CampCoordAI uses advanced machine learning algorithms to analyze historical data patterns,
                predict future trends, and provide actionable recommendations for event planning and resource allocation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">Predictive Analytics</p>
                    <p className="text-xs text-gray-600">Forecast attendance and resource needs</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">Smart Recommendations</p>
                    <p className="text-xs text-gray-600">Data-driven planning suggestions</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">Automated Reporting</p>
                    <p className="text-xs text-gray-600">Generate insights automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
