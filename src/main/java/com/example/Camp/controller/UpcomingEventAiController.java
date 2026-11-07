package com.example.Camp.controller;

import com.example.Camp.dto.ai.upcoming.UpcomingEventInsightResponse;
import com.example.Camp.dto.ai.upcoming.UpcomingEventResponse;
import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.entity.User;
import com.example.Camp.security.UserDetailsImpl;
import com.example.Camp.service.UpcomingEventAiService;
import com.example.Camp.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for AI-Powered Upcoming Event Detection & Readiness Insights.
 * Endpoints are secured with JWT and role-based access control (RBAC).
 */
@RestController
@RequestMapping("/api/ai/upcoming-events")
@RequiredArgsConstructor
@Slf4j
public class UpcomingEventAiController {

    private final UpcomingEventAiService upcomingEventAiService;
    private final UserService userService;

    /**
     * Lists upcoming events with predicted attendance and risk level indicators.
     * Administrators see all events; Coordinators see their assigned events;
     * Participants see upcoming events open to their jurisdiction without financial/risk data.
     *
     * @param days Lookahead window in days (default 30).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRATOR', 'COORDINATOR', 'PARTICIPANT')")
    public ResponseEntity<ApiResponse<List<UpcomingEventResponse>>> getUpcomingEvents(
            @RequestParam(defaultValue = "365") Integer days,
            Authentication authentication) {
        User currentUser = resolveUser(authentication);
        List<UpcomingEventResponse> events = upcomingEventAiService.findUpcomingEvents(days, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Upcoming events retrieved successfully", events));
    }

    /**
     * Retrieves full readiness insights for a specific event.
     * Restricted to ADMINISTRATOR and the assigned event COORDINATOR.
     */
    @GetMapping("/{eventId}/insights")
    @PreAuthorize("hasAnyRole('ADMINISTRATOR', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<UpcomingEventInsightResponse>> getEventInsight(
            @PathVariable Long eventId,
            Authentication authentication) {
        User currentUser = resolveUser(authentication);
        UpcomingEventInsightResponse insight = upcomingEventAiService.getEventInsight(eventId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Event readiness insight retrieved successfully", insight));
    }

    /**
     * Forces re-generation of the AI readiness insight and summary for an event.
     * Writes an AUDIT_LOGS entry.
     */
    @PostMapping("/{eventId}/refresh")
    @PreAuthorize("hasAnyRole('ADMINISTRATOR', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<UpcomingEventInsightResponse>> refreshEventInsight(
            @PathVariable Long eventId,
            Authentication authentication) {
        User currentUser = resolveUser(authentication);
        UpcomingEventInsightResponse refreshed = upcomingEventAiService.refreshEventInsight(eventId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("AI readiness insight refreshed successfully", refreshed));
    }

    private User resolveUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            return userService.getUserById(userDetails.getId());
        }
        return null;
    }
}
