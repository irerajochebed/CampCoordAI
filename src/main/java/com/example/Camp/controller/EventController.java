package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.dto.event.EventAssignmentRequest;
import com.example.Camp.dto.event.EventRequest;
import com.example.Camp.dto.event.EventResponse;
import com.example.Camp.enums.EventStatus;
import com.example.Camp.security.UserDetailsImpl;
import com.example.Camp.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.example.Camp.dto.event.ConflictCheckDto;
import com.example.Camp.service.ConflictValidationService;
import java.time.LocalDate;

@RestController
@RequestMapping({"/api/events", "/api/v1/events"})
@RequiredArgsConstructor
public class EventController {
    
    private final EventService eventService;
    private final ConflictValidationService conflictValidationService;

    @GetMapping("/check-conflicts")
    public ResponseEntity<ApiResponse<ConflictCheckDto>> checkConflicts(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long orgUnitId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String venue,
            @RequestParam(required = false) List<Long> leaderIds,
            @RequestParam(required = false) Long excludeProposalId) {
        
        LocalDate start = (startDate != null && !startDate.isBlank()) ? LocalDate.parse(startDate) : null;
        LocalDate end = (endDate != null && !endDate.isBlank()) ? LocalDate.parse(endDate) : null;

        ConflictCheckDto result = conflictValidationService.performFullConflictCheck(
                start, end, orgUnitId, departmentId, venue, leaderIds, excludeProposalId
        );

        return ResponseEntity.ok(ApiResponse.success(result));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @Valid @RequestBody EventRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        EventResponse response = eventService.createEvent(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Event created successfully", response));
    }
    
    @PostMapping("/from-proposal/{proposalId}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<EventResponse>> createEventFromProposal(
            @PathVariable Long proposalId,
            @RequestParam Long coordinatorId) {
        EventResponse response = eventService.createEventFromProposal(proposalId, coordinatorId);
        return ResponseEntity.ok(ApiResponse.success("Event created from proposal", response));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventRequest request) {
        EventResponse response = eventService.updateEvent(id, request);
        return ResponseEntity.ok(ApiResponse.success("Event updated successfully", response));
    }
    
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<EventResponse>> getEventById(@PathVariable Long id) {
        EventResponse response = eventService.getEventById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAllEvents() {
        List<EventResponse> response = eventService.getAllEvents();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getEventsByStatus(
            @PathVariable EventStatus status) {
        List<EventResponse> response = eventService.getEventsByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/coordinator/{coordinatorId}")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getEventsByCoordinator(
            @PathVariable Long coordinatorId) {
        List<EventResponse> response = eventService.getEventsByCoordinator(coordinatorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/my-events")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getMyEvents(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<EventResponse> response = eventService.getEventsByCoordinator(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getUpcomingEvents() {
        List<EventResponse> response = eventService.getUpcomingEvents();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/ongoing")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getOngoingEvents() {
        List<EventResponse> response = eventService.getOngoingEvents();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/registration-open")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getOpenForRegistration() {
        List<EventResponse> response = eventService.getOpenForRegistration();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<EventResponse>> updateEventStatus(
            @PathVariable Long id,
            @RequestParam EventStatus status) {
        EventResponse response = eventService.updateEventStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Event status updated", response));
    }
    
    @PatchMapping("/{id}/open-registration")
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<EventResponse>> openRegistration(@PathVariable Long id) {
        EventResponse response = eventService.openRegistration(id);
        return ResponseEntity.ok(ApiResponse.success("Registration opened", response));
    }
    
    @PatchMapping("/{id}/close-registration")
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<EventResponse>> closeRegistration(@PathVariable Long id) {
        EventResponse response = eventService.closeRegistration(id);
        return ResponseEntity.ok(ApiResponse.success("Registration closed", response));
    }
    
    @PatchMapping("/{id}/start")
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<EventResponse>> startEvent(@PathVariable Long id) {
        EventResponse response = eventService.startEvent(id);
        return ResponseEntity.ok(ApiResponse.success("Event started", response));
    }
    
    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<EventResponse>> completeEvent(@PathVariable Long id) {
        EventResponse response = eventService.completeEvent(id);
        return ResponseEntity.ok(ApiResponse.success("Event completed", response));
    }
    
    @PostMapping("/{eventId}/assign-staff")
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<String>> assignStaff(
            @PathVariable Long eventId,
            @Valid @RequestBody EventAssignmentRequest request) {
        eventService.assignStaff(eventId, request);
        return ResponseEntity.ok(ApiResponse.success("Staff assigned successfully", null));
    }
    
    @DeleteMapping("/{eventId}/staff/{userId}")
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<String>> removeStaffAssignment(
            @PathVariable Long eventId,
            @PathVariable Long userId) {
        eventService.removeStaffAssignment(eventId, userId);
        return ResponseEntity.ok(ApiResponse.success("Staff assignment removed", null));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully", null));
    }
}
