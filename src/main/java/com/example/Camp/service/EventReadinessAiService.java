package com.example.Camp.service;

import com.example.Camp.dto.ai.MitigationActionRequest;
import com.example.Camp.dto.ai.MitigationActionResponse;
import com.example.Camp.dto.ai.ReadinessAssessmentResponse;
import com.example.Camp.entity.User;

import java.util.List;

/**
 * AI Early-Warning & Readiness Detection Engine Service.
 * Evaluates upcoming camp meetings & events across 5 core pillars:
 * 1. Registration & Turnout Velocity Lag
 * 2. Lodging & Bed Capacity Deficit
 * 3. Financial & MTN MoMo Verification Pace
 * 4. Equipment & Technical Allocation Clashes
 * 5. Program & Speaker Confirmation Completeness
 */
public interface EventReadinessAiService {

    /**
     * Evaluates a single event by ID across all 5 readiness pillars.
     */
    ReadinessAssessmentResponse evaluateEventReadiness(Long eventId);

    /**
     * Evaluates all upcoming events (starting within 30 to 90 days), scoped to the authenticated user's jurisdiction.
     */
    List<ReadinessAssessmentResponse> evaluateUpcomingEventsReadiness(User currentUser);

    /**
     * Evaluates all upcoming events across the entire Union (unrestricted scope, for scheduler and master analytics).
     */
    List<ReadinessAssessmentResponse> evaluateAllUpcomingEvents();

    /**
     * Executes a one-click AI mitigation workflow shortcut.
     */
    MitigationActionResponse executeMitigationAction(MitigationActionRequest request, User currentUser);
}
