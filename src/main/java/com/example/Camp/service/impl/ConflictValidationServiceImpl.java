package com.example.Camp.service.impl;

import com.example.Camp.dto.event.ConflictCheckDto;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.Proposal;
import com.example.Camp.entity.User;
import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.ProposalStatus;
import com.example.Camp.exception.BadRequestException;
import com.example.Camp.repository.EventRepository;
import com.example.Camp.repository.ProposalRepository;
import com.example.Camp.repository.UserRepository;
import com.example.Camp.service.ConflictValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConflictValidationServiceImpl implements ConflictValidationService {

    private final EventRepository eventRepository;
    private final ProposalRepository proposalRepository;
    private final UserRepository userRepository;

    @Override
    public void validateAdvanceNotice(LocalDate startDate) {
        if (startDate == null) {
            throw new BadRequestException("Event start date is required.");
        }
        LocalDate minAllowedDate = LocalDate.now().plusDays(30);
        if (startDate.isBefore(minAllowedDate)) {
            throw new BadRequestException("Events must be planned and scheduled at least 30 days in advance to allow proper participant preparation.");
        }
    }

    @Override
    public List<String> checkLeaderAvailability(List<Long> requiredLeaderIds, LocalDate start, LocalDate end, Long excludeProposalId) {
        List<String> conflicts = new ArrayList<>();
        if (requiredLeaderIds == null || requiredLeaderIds.isEmpty() || start == null || end == null) {
            return conflicts;
        }

        // Fetch active events
        List<Event> allEvents = eventRepository.findAll();
        // Fetch active proposals
        List<Proposal> allProposals = proposalRepository.findAllActiveProposals();

        for (Long leaderId : requiredLeaderIds) {
            if (leaderId == null) continue;
            User leader = userRepository.findById(leaderId).orElse(null);
            String leaderName = leader != null ? leader.getFirstName() + " " + leader.getLastName() : "Leader #" + leaderId;

            // Check events
            for (Event e : allEvents) {
                if (Boolean.TRUE.equals(e.getDeleted()) || e.getStatus() == EventStatus.CANCELLED) continue;
                if (e.getCoordinator() != null && e.getCoordinator().getId().equals(leaderId)) {
                    if (datesOverlap(start, end, e.getStartDate(), e.getEndDate())) {
                        conflicts.add("Leader Conflict: " + leaderName + " is already scheduled for event '" + e.getName() + "' between " + e.getStartDate() + " and " + e.getEndDate() + ".");
                    }
                }
            }

            // Check proposals
            for (Proposal p : allProposals) {
                if (excludeProposalId != null && excludeProposalId.equals(p.getId())) continue;
                if (Boolean.TRUE.equals(p.getDeleted()) || p.getStatus() == ProposalStatus.REJECTED) continue;
                if ((p.getProposedBy() != null && p.getProposedBy().getId().equals(leaderId)) ||
                    (p.getReviewedBy() != null && p.getReviewedBy().getId().equals(leaderId))) {
                    if (datesOverlap(start, end, p.getStartDate(), p.getEndDate())) {
                        conflicts.add("Leader Conflict: " + leaderName + " is assigned to pending/approved proposal '" + p.getEventName() + "' between " + p.getStartDate() + " and " + p.getEndDate() + ".");
                    }
                }
            }
        }

        return conflicts;
    }

    @Override
    public List<String> checkScheduleConflicts(Long orgUnitId, Long departmentId, String venue, LocalDate start, LocalDate end, Long excludeProposalId) {
        List<String> conflicts = new ArrayList<>();
        if (start == null || end == null) return conflicts;

        List<Event> allEvents = eventRepository.findAll();
        List<Proposal> allProposals = proposalRepository.findAllActiveProposals();

        String trimmedVenue = venue != null ? venue.trim().toLowerCase() : "";

        // Check active events
        for (Event e : allEvents) {
            if (Boolean.TRUE.equals(e.getDeleted()) || e.getStatus() == EventStatus.CANCELLED) continue;
            if (datesOverlap(start, end, e.getStartDate(), e.getEndDate())) {
                // Venue check
                if (!trimmedVenue.isEmpty() && e.getVenue() != null && e.getVenue().trim().toLowerCase().equals(trimmedVenue)) {
                    conflicts.add("Venue Conflict: Venue '" + e.getVenue() + "' is already booked for active event '" + e.getName() + "' between " + e.getStartDate() + " and " + e.getEndDate() + ".");
                }
                // Target Department & Org Unit check
                com.example.Camp.entity.Department eventDept = e.getProposal() != null ? e.getProposal().getDepartment() : null;
                com.example.Camp.entity.OrganizationUnit eventUnit = e.getProposal() != null ? e.getProposal().getTargetOrganizationUnit() : (e.getCoordinator() != null ? e.getCoordinator().getOrganizationUnit() : null);

                if (departmentId != null && eventDept != null && eventDept.getId().equals(departmentId) &&
                    orgUnitId != null && eventUnit != null && eventUnit.getId().equals(orgUnitId)) {
                    conflicts.add("Demographic Overlap Conflict: An active event '" + e.getName() + "' for the same department and organization unit is already scheduled between " + e.getStartDate() + " and " + e.getEndDate() + ".");
                }
            }
        }

        // Check proposals
        for (Proposal p : allProposals) {
            if (excludeProposalId != null && excludeProposalId.equals(p.getId())) continue;
            if (Boolean.TRUE.equals(p.getDeleted()) || p.getStatus() == ProposalStatus.REJECTED) continue;
            if (datesOverlap(start, end, p.getStartDate(), p.getEndDate())) {
                // Venue check
                if (!trimmedVenue.isEmpty() && p.getVenue() != null && p.getVenue().trim().toLowerCase().equals(trimmedVenue)) {
                    conflicts.add("Venue Conflict: Venue '" + p.getVenue() + "' is reserved for proposal '" + p.getEventName() + "' between " + p.getStartDate() + " and " + p.getEndDate() + ".");
                }
                // Target Department & Org Unit check
                if (departmentId != null && p.getDepartment() != null && p.getDepartment().getId().equals(departmentId) &&
                    orgUnitId != null && p.getTargetOrganizationUnit() != null && p.getTargetOrganizationUnit().getId().equals(orgUnitId)) {
                    conflicts.add("Demographic Overlap Conflict: A proposal '" + p.getEventName() + "' targeting the same department and organization unit is scheduled between " + p.getStartDate() + " and " + p.getEndDate() + ".");
                }
            }
        }

        return conflicts;
    }

    @Override
    public ConflictCheckDto performFullConflictCheck(LocalDate start, LocalDate end, Long orgUnitId, Long departmentId, String venue, List<Long> leaderIds, Long excludeProposalId) {
        boolean advanceValid = true;
        String advanceError = null;

        try {
            validateAdvanceNotice(start);
        } catch (BadRequestException ex) {
            advanceValid = false;
            advanceError = ex.getMessage();
        }

        List<String> leaderConflicts = checkLeaderAvailability(leaderIds, start, end, excludeProposalId);
        List<String> scheduleConflicts = checkScheduleConflicts(orgUnitId, departmentId, venue, start, end, excludeProposalId);

        List<String> allConflicts = new ArrayList<>();
        if (!advanceValid && advanceError != null) {
            allConflicts.add(advanceError);
        }
        allConflicts.addAll(leaderConflicts);
        allConflicts.addAll(scheduleConflicts);

        return ConflictCheckDto.builder()
                .hasConflict(!allConflicts.isEmpty())
                .advanceNoticeValid(advanceValid)
                .advanceNoticeError(advanceError)
                .conflicts(allConflicts)
                .leaderConflicts(leaderConflicts)
                .scheduleConflicts(scheduleConflicts)
                .venueConflicts(scheduleConflicts.stream().filter(s -> s.startsWith("Venue")).toList())
                .build();
    }

    private boolean datesOverlap(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2) {
        if (start1 == null || end1 == null || start2 == null || end2 == null) return false;
        return !start1.isAfter(end2) && !end1.isBefore(start2);
    }
}
