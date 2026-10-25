import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Users,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { PageSpinner } from '../ui/Spinner';
import { upcomingEventAiApi } from '../../api';

export default function UpcomingEventsCardList({
  role = 'ADMINISTRATOR',
  onSelectEventForInsight,
  maxItems = null,
  title = 'Upcoming Events & AI Turnout Forecasts',
  showViewAllLink = true
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isParticipant = role === 'PARTICIPANT';

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await upcomingEventAiApi.getUpcoming(30);
      const list = res.data?.data || res.data || [];
      setEvents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
      setError(err.response?.data?.message || 'Failed to load upcoming events.');
    } finally {
      setLoading(false);
    }
  };

  const displayedEvents = maxItems ? events.slice(0, maxItems) : events;

  const getRiskColor = (level) => {
    const lvl = (level || 'LOW').toUpperCase();
    if (lvl === 'HIGH') return 'bg-rose-500 text-white';
    if (lvl === 'MEDIUM') return 'bg-amber-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  const getDaysBadge = (event) => {
    const d = event.daysUntilStart;
    if (d === 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white animate-pulse">
          Starting Today
        </span>
      );
    }
    if (d <= 3) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300">
          In {d} Day{d > 1 ? 's' : ''}
        </span>
      );
    }
    if (d <= 7) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
          In {d} Days
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
        In {d} Days
      </span>
    );
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {title}
            {!isParticipant && (
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
                AI-generated suggestion
              </span>
            )}
          </CardTitle>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchUpcoming}
            disabled={loading}
            className="p-1 h-auto text-slate-500 hover:text-slate-700"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {showViewAllLink && (
            <Link to="/app/events" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
              View All
            </Link>
          )}
        </div>
      </CardHeader>

      <CardBody className="p-4">
        {loading && (
          <div className="py-8 text-center">
            <PageSpinner />
            <p className="mt-2 text-xs text-slate-500">Detecting upcoming events...</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && displayedEvents.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No upcoming events detected within the next 30 days.</p>
          </div>
        )}

        {!loading && !error && displayedEvents.length > 0 && (
          <div className="space-y-3">
            {displayedEvents.map((event) => {
              const isHighRisk = event.riskLevel === 'HIGH';
              return (
                <div
                  key={event.eventId}
                  className={`p-3.5 rounded-xl border transition-all hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    !isParticipant && isHighRisk
                      ? 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50'
                      : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  {/* Left Column: Event Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getDaysBadge(event)}
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {event.eventType}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({event.eventCode})</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {event.eventName}
                    </h4>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {event.venue || 'Venue TBA'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {event.startDate}
                      </span>
                      {event.coordinatorName && (
                        <>
                          <span>•</span>
                          <span>Coord: {event.coordinatorName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions & AI Metrics */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {!isParticipant && (
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${getRiskColor(event.riskLevel)}`}
                            title={`Risk Level: ${event.riskLevel || 'LOW'}`}
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            ~{event.predictedAttendance || event.currentRegistrations}
                          </span>
                          <span className="text-[11px] text-slate-500">turnout</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {event.confidence || 'MEDIUM'} confidence
                        </span>
                      </div>
                    )}

                    {isParticipant ? (
                      <div className="flex items-center gap-2">
                        {event.registrationEndDate && (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                            Deadline: {event.registrationEndDate}
                          </span>
                        )}
                        <Link to={`/app/registrations/new?eventId=${event.eventId}`}>
                          <Button size="sm" variant="primary" className="text-xs">
                            Register Now
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectEventForInsight && onSelectEventForInsight(event.eventId)}
                          className="text-xs flex items-center gap-1 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          AI Insights
                        </Button>
                        <Link to={`/app/events/${event.eventId}`}>
                          <Button size="sm" variant="ghost" className="text-xs p-1.5">
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
