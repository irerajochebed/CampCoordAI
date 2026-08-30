import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Users, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import Badge from '../ui/Badge';
import { eventApi, proposalApi } from '../../api';

export default function MasterScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateEvents, setSelectedDateEvents] = useState(null);

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      const [eventsRes, proposalsRes] = await Promise.all([
        eventApi.getAll().catch(() => ({ data: { data: [] } })),
        proposalApi.getAll().catch(() => ({ data: { data: [] } })),
      ]);

      setEvents(eventsRes.data?.data || []);
      setProposals(proposalsRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch schedule data', err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to format date string YYYY-MM-DD
  const formatDateStr = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Find events on a specific day
  const getItemsForDay = (day) => {
    const targetDateStr = formatDateStr(year, month, day);
    const dayDate = new Date(year, month, day);

    const dayEvents = events.filter(e => {
      if (!e.startDate || !e.endDate) return false;
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      return dayDate >= start && dayDate <= end;
    }).map(e => ({ ...e, isEvent: true }));

    const dayProposals = proposals.filter(p => {
      if (!p.startDate || !p.endDate || p.status === 'REJECTED') return false;
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return dayDate >= start && dayDate <= end;
    }).map(p => ({ ...p, isProposal: true }));

    return [...dayEvents, ...dayProposals];
  };

  return (
    <Card className="shadow-md border-primary-100 dark:border-slate-800">
      <CardHeader className="bg-gradient-to-r from-primary-900 to-slate-900 text-white rounded-t-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-primary-600/40 rounded-xl border border-primary-400/30">
              <Calendar className="w-6 h-6 text-primary-300" />
            </div>
            <div>
              <CardTitle className="text-xl text-white font-extrabold tracking-wide">
                RUM Master Schedule & Conflict Visualizer
              </CardTitle>
              <p className="text-xs text-primary-200/90 mt-0.5">
                Executive visibility into Rwanda Union Mission leadership commitments & venue windows
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold min-w-[130px] text-center text-white">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-4 sm:p-6">
        {/* Calendar Grid Header */}
        <div className="grid grid-cols-7 text-center font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 border-b pb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Grid Days */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty cells for padding before start of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 bg-gray-50/50 dark:bg-slate-900/40 rounded-lg border border-dashed border-gray-100 dark:border-slate-800"></div>
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const items = getItemsForDay(day);
            const hasMultiple = items.length > 1;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <div
                key={`day-${day}`}
                onClick={() => setSelectedDateEvents({ day, items })}
                className={`h-24 p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between overflow-hidden relative ${
                  isToday
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20'
                    : hasMultiple
                    ? 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/10'
                    : 'border-gray-200 dark:border-slate-800 hover:border-blue-400 hover:shadow-sm bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                    isToday ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {day}
                  </span>
                  {hasMultiple && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      {items.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-hidden">
                  {items.slice(0, 2).map((item, idx) => (
                    <div
                      key={idx}
                      className={`text-[10px] p-1 rounded font-semibold truncate flex items-center gap-1 ${
                        item.isEvent
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                      title={item.name || item.eventName}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.isEvent ? 'bg-blue-600' : 'bg-amber-500'}`}></span>
                      <span className="truncate">{item.name || item.eventName}</span>
                    </div>
                  ))}
                  {items.length > 2 && (
                    <p className="text-[9px] font-bold text-gray-500 text-center">
                      +{items.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Day Details Panel */}
        {selectedDateEvents && (
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-fadeIn">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Schedule Details for {monthNames[month]} {selectedDateEvents.day}, {year}
              </h4>
              <button
                onClick={() => setSelectedDateEvents(null)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Close
              </button>
            </div>

            {selectedDateEvents.items.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">No scheduled events or leadership commitments on this date.</p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.isEvent ? 'info' : 'warning'} size="sm">
                          {item.isEvent ? 'Confirmed Event' : 'Submitted Proposal'}
                        </Badge>
                        <h5 className="font-bold text-sm text-gray-900 dark:text-white">{item.name || item.eventName}</h5>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-300 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {item.venue || 'TBD'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {item.startDate} to {item.endDate}
                        </span>
                        {(item.coordinator || item.proposedBy) && (
                          <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                            <Users className="w-3.5 h-3.5" />
                            Leader: {item.coordinator?.firstName || item.proposedBy?.firstName} {item.coordinator?.lastName || item.proposedBy?.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
