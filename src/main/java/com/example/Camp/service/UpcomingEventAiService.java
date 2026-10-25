package com.example.Camp.service;

import com.example.Camp.dto.ai.upcoming.UpcomingEventInsightResponse;
import com.example.Camp.dto.ai.upcoming.UpcomingEventResponse;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.User;

import java.util.List;

/**
 * AI-powered Upcoming Event Detection and Readiness Insights Engine Service.
 * Detects upcoming Adventist camps and conferences, forecasts turnout using historical regressions,
 * evaluates 6 core readiness pillars, and generates plain-language executive recommendations.
 */
public interface UpcomingEventAiService {

    /**
     * Finds upcoming events within the specified lookahead window (default 30 days),
     * scoped to the authenticated user's RBAC role and jurisdiction.
     *
     * @param days Number of days ahead to look (e.g. 30).
     * @param currentUser Authenticated user (ADMINISTRATOR, COORDINATOR, PARTICIPANT).
     * @return List of upcoming events with attendance predictions and risk indicators.
     */
    List<UpcomingEventResponse> findUpcomingEvents(Integer days, User currentUser);

    /**
     * Retrieves full AI insight for a specific event (cached or computed).
     *
     * @param eventId Event identifier.
     * @param currentUser Authenticated user.
     * @return Full insight response.
     */
    UpcomingEventInsightResponse getEventInsight(Long eventId, User currentUser);

    /**
     * Forces re-computation of AI insights for an event, calling summary provider,
     * persisting to ai_insights, and logging an audit record.
     *
     * @param eventId Event identifier.
     * @param currentUser User triggering refresh (must be ADMINISTRATOR or event COORDINATOR).
     * @return Fresh insight response.
     */
    UpcomingEventInsightResponse refreshEventInsight(Long eventId, User currentUser);

    /**
     * Core detection method shared between the API and automated Spring Scheduler.
     * Returns all events that fall into critical detection milestones:
     * - Status PLANNED starting in 30, 14, 7, 3, or 1 days
     * - Registration deadline in 3 or 1 days
     * - Registration open now
     * - Starting today (transitions to ONGOING)
     *
     * @return List of detected events.
     */
    List<Event> detectUpcomingEventsForScheduler();

    /**
     * Generates and persists an AI insight record for an event at a specified milestone window.
     *
     * @param event Event entity.
     * @param windowLabel Window label (e.g. "D-30", "D-14", "D-7", "D-3", "D-1", "REG-DEADLINE-3", "REG-OPEN", "MANUAL").
     * @return Persisted insight response.
     */
    UpcomingEventInsightResponse generateAndSaveInsight(Event event, String windowLabel);
}
