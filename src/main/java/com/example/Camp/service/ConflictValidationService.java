package com.example.Camp.service;

import com.example.Camp.dto.event.ConflictCheckDto;

import java.time.LocalDate;
import java.util.List;

public interface ConflictValidationService {

    /**
     * Validates 30-day minimum advance notice rule for event proposals.
     * Throws BadRequestException if startDate < LocalDate.now().plusDays(30)
     */
    void validateAdvanceNotice(LocalDate startDate);

    /**
     * Checks if any of the required leaders are assigned to another overlapping active event or submitted proposal.
     * Returns list of conflict messages.
     */
    List<String> checkLeaderAvailability(List<Long> requiredLeaderIds, LocalDate start, LocalDate end, Long excludeProposalId);

    /**
     * Checks overlapping schedule, demographic, or venue conflicts.
     * Returns list of conflict messages.
     */
    List<String> checkScheduleConflicts(Long orgUnitId, Long departmentId, String venue, LocalDate start, LocalDate end, Long excludeProposalId);

    /**
     * Full aggregate conflict check used for real-time frontend feedback & backend validation.
     */
    ConflictCheckDto performFullConflictCheck(LocalDate start, LocalDate end, Long orgUnitId, Long departmentId, String venue, List<Long> leaderIds, Long excludeProposalId);
}
