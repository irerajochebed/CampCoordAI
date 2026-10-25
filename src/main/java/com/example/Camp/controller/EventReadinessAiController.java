package com.example.Camp.controller;

import com.example.Camp.dto.ai.MitigationActionRequest;
import com.example.Camp.dto.ai.MitigationActionResponse;
import com.example.Camp.dto.ai.ReadinessAssessmentResponse;
import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.entity.User;
import com.example.Camp.security.UserDetailsImpl;
import com.example.Camp.service.EventReadinessAiService;
import com.example.Camp.service.UserService;
import com.example.Camp.service.scheduler.ReadinessScheduler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/ai/readiness", "/api/ai/readiness", "/api/v1/analytics/readiness", "/api/analytics/readiness"})
@RequiredArgsConstructor
@Slf4j
public class EventReadinessAiController {

    private final EventReadinessAiService readinessAiService;
    private final UserService userService;
    private final ReadinessScheduler readinessScheduler;

    /**
     * Get readiness assessments for all upcoming events (scoped to user's Union/Field/Coordinator jurisdiction).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('COORDINATOR', 'ADMINISTRATOR', 'PARTICIPANT')")
    public ResponseEntity<ApiResponse<List<ReadinessAssessmentResponse>>> getUpcomingReadinessAssessments(Authentication authentication) {
        User currentUser = null;
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            currentUser = userService.getUserById(userDetails.getId());
        }

        List<ReadinessAssessmentResponse> responses = readinessAiService.evaluateUpcomingEventsReadiness(currentUser);
        return ResponseEntity.ok(ApiResponse.success("AI readiness assessments retrieved successfully", responses));
    }

    /**
     * Get readiness assessment for a specific event.
     */
    @GetMapping("/{eventId}")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'ADMINISTRATOR', 'PARTICIPANT')")
    public ResponseEntity<ApiResponse<ReadinessAssessmentResponse>> getEventReadiness(@PathVariable Long eventId) {
        ReadinessAssessmentResponse response = readinessAiService.evaluateEventReadiness(eventId);
        return ResponseEntity.ok(ApiResponse.success("Event readiness assessment retrieved successfully", response));
    }

    /**
     * Execute a One-Click AI Mitigation Action.
     */
    @PostMapping("/mitigate")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<MitigationActionResponse>> executeMitigationAction(
            @Valid @RequestBody MitigationActionRequest request,
            Authentication authentication) {
        User currentUser = null;
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            currentUser = userService.getUserById(userDetails.getId());
        }

        MitigationActionResponse response = readinessAiService.executeMitigationAction(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("AI mitigation action dispatched successfully", response));
    }

    /**
     * Manual Trigger for Full System Diagnostic Scan.
     */
    @PostMapping("/scan-now")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> triggerFullScan() {
        readinessScheduler.scanAndEvaluateReadiness();
        return ResponseEntity.ok(ApiResponse.success("Automated AI readiness scan completed successfully and alerts dispatched", "SUCCESS"));
    }
}
