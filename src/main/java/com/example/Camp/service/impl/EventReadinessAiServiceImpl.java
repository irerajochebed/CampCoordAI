package com.example.Camp.service.impl;

import com.example.Camp.dto.ai.ActionableRecommendation;
import com.example.Camp.dto.ai.MitigationActionRequest;
import com.example.Camp.dto.ai.MitigationActionResponse;
import com.example.Camp.dto.ai.ReadinessAssessmentResponse;
import com.example.Camp.dto.ai.ReadinessWarning;
import com.example.Camp.entity.Accommodation;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.EventAssignment;
import com.example.Camp.entity.Notification;
import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.entity.Payment;
import com.example.Camp.entity.Proposal;
import com.example.Camp.entity.Registration;
import com.example.Camp.entity.Resource;
import com.example.Camp.entity.ResourceAllocation;
import com.example.Camp.entity.Room;
import com.example.Camp.entity.Session;
import com.example.Camp.entity.User;
import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.NotificationType;
import com.example.Camp.enums.PaymentStatus;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.RegistrationStatus;
import com.example.Camp.enums.ResourceType;
import com.example.Camp.enums.Role;
import com.example.Camp.exception.BadRequestException;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.EventAssignmentRepository;
import com.example.Camp.repository.EventRepository;
import com.example.Camp.repository.NotificationRepository;
import com.example.Camp.repository.OrganizationUnitRepository;
import com.example.Camp.repository.PaymentRepository;
import com.example.Camp.repository.RegistrationRepository;
import com.example.Camp.repository.ResourceAllocationRepository;
import com.example.Camp.repository.ResourceRepository;
import com.example.Camp.repository.RoomRepository;
import com.example.Camp.repository.SessionRepository;
import com.example.Camp.repository.UserRepository;
import com.example.Camp.service.EventReadinessAiService;
import com.example.Camp.service.JurisdictionScopeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EventReadinessAiServiceImpl implements EventReadinessAiService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final PaymentRepository paymentRepository;
    private final RoomRepository roomRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceAllocationRepository resourceAllocationRepository;
    private final SessionRepository sessionRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final UserRepository userRepository;
    private final OrganizationUnitRepository organizationUnitRepository;
    private final NotificationRepository notificationRepository;
    private final JurisdictionScopeService jurisdictionScopeService;

    @Override
    public ReadinessAssessmentResponse evaluateEventReadiness(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));
        return performReadinessAssessment(event);
    }

    @Override
    public List<ReadinessAssessmentResponse> evaluateUpcomingEventsReadiness(User currentUser) {
        LocalDate today = LocalDate.now();
        List<Event> allEvents = eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .filter(e -> e.getStatus() == EventStatus.PLANNED || e.getStatus() == EventStatus.REGISTRATION_OPEN || e.getStatus() == EventStatus.ONGOING)
                .filter(e -> e.getStartDate() != null && !e.getStartDate().isBefore(today.minusDays(1)))
                .toList();

        // Apply Hierarchical Jurisdiction Scope
        List<Event> scopedEvents;
        if (currentUser == null || jurisdictionScopeService.isUnionWideScope(currentUser)) {
            // Union Leaders and Administrators see all upcoming events across the Union
            scopedEvents = allEvents;
        } else {
            List<Long> accessibleOrgUnitIds = jurisdictionScopeService.getAccessibleOrganizationUnitIds(currentUser);
            scopedEvents = allEvents.stream().filter(event -> {
                // Check if coordinator is in scope
                if (event.getCoordinator() != null) {
                    if (event.getCoordinator().getId().equals(currentUser.getId())) return true;
                    if (event.getCoordinator().getOrganizationUnit() != null &&
                            accessibleOrgUnitIds.contains(event.getCoordinator().getOrganizationUnit().getId())) {
                        return true;
                    }
                }
                // Check if target organization unit of proposal is in scope
                if (event.getProposal() != null && event.getProposal().getTargetOrganizationUnit() != null &&
                        accessibleOrgUnitIds.contains(event.getProposal().getTargetOrganizationUnit().getId())) {
                    return true;
                }
                // Check event assignments
                boolean assigned = eventAssignmentRepository.findByEventId(event.getId()).stream()
                        .anyMatch(a -> a.getUser() != null && a.getUser().getId().equals(currentUser.getId()));
                return assigned;
            }).toList();
        }

        return scopedEvents.stream()
                .map(this::performReadinessAssessment)
                .sorted((a, b) -> {
                    // Sort CRITICAL first, then MODERATE, then OPTIMAL, then by daysUntilStart
                    int scoreCompare = Integer.compare(a.getOverallReadinessScore(), b.getOverallReadinessScore());
                    if (scoreCompare != 0) return scoreCompare;
                    return Integer.compare(a.getDaysUntilStart(), b.getDaysUntilStart());
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<ReadinessAssessmentResponse> evaluateAllUpcomingEvents() {
        LocalDate today = LocalDate.now();
        List<Event> allUpcoming = eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .filter(e -> e.getStartDate() != null && !e.getStartDate().isBefore(today.minusDays(1)))
                .toList();

        return allUpcoming.stream()
                .map(this::performReadinessAssessment)
                .collect(Collectors.toList());
    }

    /**
     * Core 5-Pillar AI Evaluation Algorithm
     */
    private ReadinessAssessmentResponse performReadinessAssessment(Event event) {
        LocalDate today = LocalDate.now();
        int daysUntilStart = event.getStartDate() != null ? (int) ChronoUnit.DAYS.between(today, event.getStartDate()) : 0;
        daysUntilStart = Math.max(0, daysUntilStart);

        List<ReadinessWarning> warnings = new ArrayList<>();
        List<ActionableRecommendation> recommendations = new ArrayList<>();

        // Resolve Field Name and Department
        String fieldName = "Rwanda Union Mission";
        if (event.getProposal() != null && event.getProposal().getTargetOrganizationUnit() != null) {
            fieldName = event.getProposal().getTargetOrganizationUnit().getName();
        } else if (event.getCoordinator() != null && event.getCoordinator().getOrganizationUnit() != null) {
            fieldName = event.getCoordinator().getOrganizationUnit().getName();
        }
        String departmentName = event.getDepartment() != null ? event.getDepartment().getName() : "General Ministries";

        // Expected Participants Target
        long expectedParticipants = 200;
        if (event.getProposal() != null && event.getProposal().getExpectedParticipants() != null && event.getProposal().getExpectedParticipants() > 0) {
            expectedParticipants = event.getProposal().getExpectedParticipants();
        } else if (event.getMaxParticipants() != null && event.getMaxParticipants() > 0) {
            expectedParticipants = event.getMaxParticipants();
        }

        // =========================================================================
        // PILLAR 1: Registration & Turnout Velocity Detection
        // =========================================================================
        List<Registration> eventRegistrations = registrationRepository.findByEventId(event.getId()).stream()
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()) && r.getStatus() != RegistrationStatus.CANCELLED)
                .toList();
        long currentRegistrations = eventRegistrations.size();

        // Standard historical sign-up milestone curve
        double milestoneExpectedRatio;
        if (daysUntilStart >= 75) {
            milestoneExpectedRatio = 20.0;
        } else if (daysUntilStart >= 50) {
            milestoneExpectedRatio = 35.0;
        } else if (daysUntilStart >= 30) {
            milestoneExpectedRatio = 50.0;
        } else if (daysUntilStart >= 18) {
            milestoneExpectedRatio = 65.0;
        } else if (daysUntilStart >= 10) {
            milestoneExpectedRatio = 80.0;
        } else {
            milestoneExpectedRatio = 90.0;
        }

        long expectedAtMilestone = Math.max(1, Math.round(expectedParticipants * (milestoneExpectedRatio / 100.0)));
        double registrationLagPercent = 0.0;
        int registrationScore = 20;

        if (currentRegistrations < expectedAtMilestone) {
            registrationLagPercent = ((double) (expectedAtMilestone - currentRegistrations) / expectedAtMilestone) * 100.0;
        }

        if (registrationLagPercent >= 25.0) {
            String severity = (daysUntilStart <= 20 && registrationLagPercent >= 35.0) ? "HIGH" : "MEDIUM";
            warnings.add(ReadinessWarning.builder()
                    .category("REGISTRATION")
                    .code("REGISTRATION_LAG")
                    .title("Registration Velocity Lag Detected")
                    .details(String.format("Sign-ups are %.0f%% below historical pace for this district (%d registered vs %d expected at T-%d days). Pastor mobilization recommended.",
                            registrationLagPercent, currentRegistrations, expectedAtMilestone, daysUntilStart))
                    .severity(severity)
                    .build());

            recommendations.add(ActionableRecommendation.builder()
                    .actionTitle("Mobilize District Pastors & Mobilizers")
                    .suggestedAction("Dispatch urgent SMS/Email mobilization bulletin to all District Pastors and youth leaders within the field to drive registrations.")
                    .targetRole("DISTRICT_PASTOR")
                    .actionType("REMIND_PASTORS")
                    .buttonLabel("Send Reminder to District Pastors")
                    .eventId(event.getId())
                    .build());

            int penalty = (int) Math.round((registrationLagPercent / 100.0) * 15.0);
            registrationScore = Math.max(2, 20 - penalty);
        } else {
            registrationScore = 20;
        }

        // =========================================================================
        // PILLAR 2: Lodging & Bed Capacity Deficit Detection
        // =========================================================================
        double residentialRatio = 0.70; // 70% residential requirement for camp meetings
        long projectedBedDemand = Math.round(Math.max(currentRegistrations, expectedParticipants * 0.60) * residentialRatio);

        // Fetch accommodation rooms capacity linked to event
        long totalBedCapacity = 0;
        if (event.getAccommodations() != null && !event.getAccommodations().isEmpty()) {
            for (Accommodation acc : event.getAccommodations()) {
                if (acc.getRooms() != null) {
                    totalBedCapacity += acc.getRooms().stream()
                            .filter(r -> !Boolean.TRUE.equals(r.getDeleted()) && r.getCapacity() != null)
                            .mapToLong(Room::getCapacity)
                            .sum();
                }
            }
        }
        // Also check if any rooms in database match this event's accommodations
        if (totalBedCapacity == 0) {
            List<Room> allRooms = roomRepository.findAll().stream()
                    .filter(r -> !Boolean.TRUE.equals(r.getDeleted()) && r.getCapacity() != null)
                    .filter(r -> r.getAccommodation() != null && r.getAccommodation().getEvent() != null && r.getAccommodation().getEvent().getId().equals(event.getId()))
                    .toList();
            totalBedCapacity = allRooms.stream().mapToLong(Room::getCapacity).sum();
        }

        long occupiedBeds = eventRegistrations.stream()
                .filter(r -> r.getRoomAssignments() != null && !r.getRoomAssignments().isEmpty())
                .count();

        long lodgingDeficitBeds = Math.max(0, projectedBedDemand - totalBedCapacity);
        int lodgingScore = 20;

        if (lodgingDeficitBeds > 0 || (projectedBedDemand > 20 && totalBedCapacity == 0)) {
            long deficitDisplay = lodgingDeficitBeds > 0 ? lodgingDeficitBeds : projectedBedDemand;
            String severity = (deficitDisplay >= 15 || totalBedCapacity == 0) ? "HIGH" : "MEDIUM";
            warnings.add(ReadinessWarning.builder()
                    .category("LODGING")
                    .code("LODGING_SHORTAGE")
                    .title("Lodging & Bed Capacity Deficit")
                    .details(String.format("Projected lodging demand (%d beds) exceeds available capacity (%d beds) by %d beds. Secure secondary dormitories or tent grounds immediately.",
                            projectedBedDemand, totalBedCapacity, deficitDisplay))
                    .severity(severity)
                    .build());

            recommendations.add(ActionableRecommendation.builder()
                    .actionTitle("Secure Secondary Dormitories & Tent Reserves")
                    .suggestedAction("Notify Accommodation Officer to contract overflow host venues, secondary dormitories, or reserve union tent grounds.")
                    .targetRole("ACCOMMODATION_OFFICER")
                    .actionType("NOTIFY_ACCOMMODATION")
                    .buttonLabel("Notify Accommodation Officer")
                    .eventId(event.getId())
                    .build());

            int deficitPenalty = totalBedCapacity == 0 ? 16 : Math.min(15, (int) ((double) deficitDisplay / Math.max(1, projectedBedDemand) * 20.0));
            lodgingScore = Math.max(2, 20 - deficitPenalty);
        }

        // =========================================================================
        // PILLAR 3: Financial & MTN MoMo Verification Pace
        // =========================================================================
        BigDecimal budgetBaseline = event.getBudget() != null && event.getBudget().compareTo(BigDecimal.ZERO) > 0
                ? event.getBudget()
                : (event.getProposal() != null && event.getProposal().getEstimatedBudget() != null && event.getProposal().getEstimatedBudget().compareTo(BigDecimal.ZERO) > 0
                ? event.getProposal().getEstimatedBudget()
                : BigDecimal.valueOf(expectedParticipants * (event.getRegistrationFee() != null ? event.getRegistrationFee().doubleValue() : 25000.0)));

        List<Payment> allEventPayments = paymentRepository.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getDeleted()))
                .filter(p -> p.getRegistration() != null && p.getRegistration().getEvent() != null && p.getRegistration().getEvent().getId().equals(event.getId()))
                .toList();

        BigDecimal collectedRevenue = allEventPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED)
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingRevenue = allEventPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaymentVolume = collectedRevenue.add(pendingRevenue);
        double pendingPaymentRatio = totalPaymentVolume.compareTo(BigDecimal.ZERO) > 0
                ? pendingRevenue.divide(totalPaymentVolume, 4, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        BigDecimal requiredDepositThreshold = budgetBaseline.multiply(BigDecimal.valueOf(0.40));
        boolean budgetThresholdMet = collectedRevenue.compareTo(requiredDepositThreshold) >= 0;

        int financeScore = 20;

        if (totalPaymentVolume.compareTo(BigDecimal.ZERO) > 0 && pendingPaymentRatio >= 0.40) {
            String severity = (daysUntilStart <= 14 || pendingPaymentRatio >= 0.50) ? "HIGH" : "MEDIUM";
            warnings.add(ReadinessWarning.builder()
                    .category("FINANCE")
                    .code("CASHFLOW_RISK")
                    .title("High Volume of Unverified MoMo Payments")
                    .details(String.format("High volume of pending unverified payments (%.0f%% unverified, totaling %s RWF). Prompt District Pastors to finalize member MoMo transfers.",
                            pendingPaymentRatio * 100.0, formatCurrency(pendingRevenue)))
                    .severity(severity)
                    .build());

            recommendations.add(ActionableRecommendation.builder()
                    .actionTitle("Expedite MTN MoMo Payment Verification")
                    .suggestedAction("Prompt District Pastors and Finance Officers to cross-verify all submitted MoMo mobile money transaction IDs and finalize verification.")
                    .targetRole("FINANCE_OFFICER")
                    .actionType("VERIFY_MOMO")
                    .buttonLabel("Prompt Pastors for MoMo Verification")
                    .eventId(event.getId())
                    .build());

            int finPenalty = (int) Math.round(pendingPaymentRatio * 16.0);
            financeScore = Math.max(3, 20 - finPenalty);
        } else if (daysUntilStart <= 14 && !budgetThresholdMet && budgetBaseline.compareTo(BigDecimal.ZERO) > 0) {
            warnings.add(ReadinessWarning.builder()
                    .category("FINANCE")
                    .code("CASHFLOW_RISK")
                    .title("Pre-Camp Operational Budget Deficit")
                    .details(String.format("Verified collections (%s RWF) are below the 40%% deposit baseline (%s RWF) needed by T-14 days to clear venue/catering deposits.",
                            formatCurrency(collectedRevenue), formatCurrency(requiredDepositThreshold)))
                    .severity("HIGH")
                    .build());

            recommendations.add(ActionableRecommendation.builder()
                    .actionTitle("Accelerate District Remittance & Sponsorships")
                    .suggestedAction("Engage Field Treasury and District Pastors to release church camp subventions and expedite participant payments.")
                    .targetRole("FINANCE_OFFICER")
                    .actionType("VERIFY_MOMO")
                    .buttonLabel("Prompt Pastors for MoMo Verification")
                    .eventId(event.getId())
                    .build());

            financeScore = Math.max(4, 20 - 12);
        }

        // =========================================================================
        // PILLAR 4: Equipment & Technical Allocation Clashes
        // =========================================================================
        int requiredSoundSystems = expectedParticipants > 300 ? 2 : 1;
        int requiredGenerators = 1;
        int requiredProjectors = expectedParticipants > 300 ? 2 : 1;

        List<ResourceAllocation> allocations = resourceAllocationRepository.findByEventId(event.getId()).stream()
                .filter(ra -> !Boolean.TRUE.equals(ra.getDeleted()) && !Boolean.TRUE.equals(ra.getReturned()))
                .toList();

        int allocatedSoundSystems = allocations.stream()
                .filter(ra -> ra.getResource() != null && ra.getResource().getType() == ResourceType.SOUND_SYSTEM)
                .mapToInt(ResourceAllocation::getQuantity)
                .sum();

        int allocatedGenerators = allocations.stream()
                .filter(ra -> ra.getResource() != null && ra.getResource().getType() == ResourceType.GENERATOR)
                .mapToInt(ResourceAllocation::getQuantity)
                .sum();

        int allocatedProjectors = allocations.stream()
                .filter(ra -> ra.getResource() != null && ra.getResource().getType() == ResourceType.PROJECTOR)
                .mapToInt(ResourceAllocation::getQuantity)
                .sum();

        // Check for concurrent events in the same time frame
        boolean concurrentClashDetected = false;
        String concurrentConflictDetails = null;

        if (event.getStartDate() != null && event.getEndDate() != null) {
            List<Event> concurrentEvents = eventRepository.findAll().stream()
                    .filter(e -> !Boolean.TRUE.equals(e.getDeleted()) && !e.getId().equals(event.getId()))
                    .filter(e -> e.getStartDate() != null && e.getEndDate() != null)
                    .filter(e -> !e.getStartDate().isAfter(event.getEndDate()) && !e.getEndDate().isBefore(event.getStartDate()))
                    .toList();

            if (!concurrentEvents.isEmpty()) {
                long totalAvailableSoundStock = resourceRepository.findByType(ResourceType.SOUND_SYSTEM).stream()
                        .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                        .mapToInt(Resource::getAvailableQuantity)
                        .sum();

                if (totalAvailableSoundStock < requiredSoundSystems && allocatedSoundSystems < requiredSoundSystems) {
                    concurrentClashDetected = true;
                    Event clashEvent = concurrentEvents.get(0);
                    concurrentConflictDetails = String.format("Concurrent event clash with '%s' (%s to %s)",
                            clashEvent.getName(), clashEvent.getStartDate(), clashEvent.getEndDate());
                }
            }
        }

        int soundSystemsShortage = Math.max(0, requiredSoundSystems - allocatedSoundSystems);
        int resourcesScore = 20;

        if (soundSystemsShortage > 0 || concurrentClashDetected || (daysUntilStart <= 14 && allocatedGenerators < requiredGenerators)) {
            String severity = (daysUntilStart <= 14) ? "HIGH" : "MEDIUM";
            String conflictSnippet = concurrentClashDetected ? (" (" + concurrentConflictDetails + ")") : "";
            warnings.add(ReadinessWarning.builder()
                    .category("RESOURCES")
                    .code("RESOURCE_BOTTLENECK")
                    .title("A/V Sound System & Generator Bottleneck")
                    .details(String.format("Shortage of %d high-capacity sound systems and backup power units%s. Reallocate from Central Field Depot.",
                            Math.max(1, soundSystemsShortage), conflictSnippet))
                    .severity(severity)
                    .build());

            recommendations.add(ActionableRecommendation.builder()
                    .actionTitle("Reallocate Equipment from Central Field Depot")
                    .suggestedAction("Submit priority equipment reallocation request to Central Field Depot or Adventist Media PA team.")
                    .targetRole("MEDIA_TEAM")
                    .actionType("REALLOCATE_DEPOT")
                    .buttonLabel("Reallocate from Central Field Depot")
                    .eventId(event.getId())
                    .build());

            int resPenalty = soundSystemsShortage * 7 + (concurrentClashDetected ? 5 : 0);
            resourcesScore = Math.max(3, 20 - resPenalty);
        }

        // =========================================================================
        // PILLAR 5: Program & Speaker Confirmation Completeness
        // =========================================================================
        List<Session> sessions = sessionRepository.findByEventId(event.getId()).stream()
                .filter(s -> !Boolean.TRUE.equals(s.getDeleted()))
                .toList();
        int totalSessions = sessions.size();
        int confirmedSessions = (int) sessions.stream().filter(s -> s.getSpeaker() != null).count();
        int unassignedSpeakersCount = totalSessions - confirmedSessions;
        boolean keySessionsAssigned = true;

        int programScore = 20;

        if (daysUntilStart <= 15) {
            if (totalSessions == 0) {
                warnings.add(ReadinessWarning.builder()
                        .category("PROGRAM")
                        .code("PROGRAM_INCOMPLETE")
                        .title("Master Program Schedule Unpopulated")
                        .details(String.format("No daily sessions or master schedule configured with only %d days until event start.", daysUntilStart))
                        .severity("HIGH")
                        .build());

                recommendations.add(ActionableRecommendation.builder()
                        .actionTitle("Configure Daily Master Schedule & Sessions")
                        .suggestedAction("Direct Camp Program Committee to enter keynote plenary, breakout, and divine service schedules.")
                        .targetRole("CAMP_DIRECTOR")
                        .actionType("CONFIRM_SPEAKERS")
                        .buttonLabel("Assign & Confirm Speakers")
                        .eventId(event.getId())
                        .build());

                programScore = 4;
            } else if (unassignedSpeakersCount > 0) {
                keySessionsAssigned = false;
                warnings.add(ReadinessWarning.builder()
                        .category("PROGRAM")
                        .code("PROGRAM_INCOMPLETE")
                        .title("Keynote Sessions Lack Confirmed Speakers")
                        .details(String.format("Keynote / Divine Service sessions have unassigned speakers (%d of %d sessions unconfirmed with %d days remaining).",
                                unassignedSpeakersCount, totalSessions, daysUntilStart))
                        .severity("HIGH")
                        .build());

                recommendations.add(ActionableRecommendation.builder()
                        .actionTitle("Finalize Keynote Speakers & Daily Roster")
                        .suggestedAction("Direct Camp Program Committee and Field Secretary to assign and confirm guest evangelists, speakers, and devotional leaders.")
                        .targetRole("CAMP_DIRECTOR")
                        .actionType("CONFIRM_SPEAKERS")
                        .buttonLabel("Assign & Confirm Speakers")
                        .eventId(event.getId())
                        .build());

                int progPenalty = (int) Math.round(((double) unassignedSpeakersCount / totalSessions) * 16.0);
                programScore = Math.max(4, 20 - progPenalty);
            }
        }

        // =========================================================================
        // OVERALL READINESS SCORE & RISK LEVEL COMPUTATION
        // =========================================================================
        int overallScore = registrationScore + lodgingScore + financeScore + resourcesScore + programScore;
        overallScore = Math.min(100, Math.max(0, overallScore));

        String riskLevel;
        if (overallScore >= 85) {
            riskLevel = "OPTIMAL";
        } else if (overallScore >= 65) {
            riskLevel = "MODERATE";
        } else {
            riskLevel = "CRITICAL";
        }

        return ReadinessAssessmentResponse.builder()
                .eventId(event.getId())
                .eventCode(event.getEventCode())
                .eventName(event.getName())
                .venue(event.getVenue())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .daysUntilStart(daysUntilStart)
                .overallReadinessScore(overallScore)
                .riskLevel(riskLevel)
                .fieldName(fieldName)
                .departmentName(departmentName)
                .registrationScore(registrationScore)
                .lodgingScore(lodgingScore)
                .financeScore(financeScore)
                .resourcesScore(resourcesScore)
                .programScore(programScore)
                .currentRegistrations(currentRegistrations)
                .expectedParticipants(expectedParticipants)
                .registrationPacePercent(Math.round(registrationLagPercent * 10.0) / 10.0)
                .milestoneExpectedRatio(milestoneExpectedRatio)
                .totalBedCapacity(totalBedCapacity)
                .occupiedBeds(occupiedBeds)
                .projectedBedDemand(projectedBedDemand)
                .lodgingDeficitBeds(lodgingDeficitBeds)
                .collectedRevenue(collectedRevenue)
                .pendingRevenue(pendingRevenue)
                .budgetBaseline(budgetBaseline)
                .pendingPaymentRatio(Math.round(pendingPaymentRatio * 100.0) / 100.0)
                .budgetThresholdMet(budgetThresholdMet)
                .requiredSoundSystems(requiredSoundSystems)
                .allocatedSoundSystems(allocatedSoundSystems)
                .soundSystemsShortage(soundSystemsShortage)
                .requiredGenerators(requiredGenerators)
                .allocatedGenerators(allocatedGenerators)
                .requiredProjectors(requiredProjectors)
                .allocatedProjectors(allocatedProjectors)
                .concurrentClashDetected(concurrentClashDetected)
                .concurrentConflictDetails(concurrentConflictDetails)
                .totalSessions(totalSessions)
                .confirmedSessions(confirmedSessions)
                .unassignedSpeakersCount(unassignedSpeakersCount)
                .keySessionsAssigned(keySessionsAssigned)
                .warnings(warnings)
                .recommendations(recommendations)
                .build();
    }

    @Override
    @Transactional
    public MitigationActionResponse executeMitigationAction(MitigationActionRequest request, User currentUser) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + request.getEventId()));

        String actionType = request.getActionType();
        List<User> targetRecipients = new ArrayList<>();
        String notificationTitle;
        String notificationMessage;
        String actionUrl = "/app/events/" + event.getId();

        switch (actionType) {
            case "REMIND_PASTORS":
                notificationTitle = "[AI Readiness Alert] Urgent Registration Drive: " + event.getName();
                notificationMessage = String.format("AI Readiness Engine flagged a registration velocity shortfall for '%s'. Please mobilize local church congregations and assist participants with registration before the milestone deadline.", event.getName());
                actionUrl = "/app/registrations/new?eventId=" + event.getId();

                // Find District Pastors and Church Leaders under this event's field
                targetRecipients.addAll(userRepository.findByPosition(Position.DISTRICT_PASTOR));
                targetRecipients.addAll(userRepository.findByPosition(Position.PASTOR));
                if (event.getCoordinator() != null) targetRecipients.add(event.getCoordinator());
                break;

            case "NOTIFY_ACCOMMODATION":
                notificationTitle = "[AI Readiness Alert] Lodging Shortage Action Required: " + event.getName();
                notificationMessage = String.format("AI Readiness Engine detected that projected lodging demand exceeds current room allocations for '%s'. Please inspect alternate dormitories or secure union tent grounds.", event.getName());
                actionUrl = "/app/accommodation/new/" + event.getId();

                // Find Accommodation Officers and Camp Directors
                targetRecipients.addAll(userRepository.findByPosition(Position.ACCOMMODATION_OFFICER));
                if (event.getCoordinator() != null) targetRecipients.add(event.getCoordinator());
                break;

            case "REALLOCATE_DEPOT":
                notificationTitle = "[AI Readiness Alert] Technical Resource Requisition: " + event.getName();
                notificationMessage = String.format("AI Readiness Engine flagged an equipment / PA sound system bottleneck for '%s'. Reallocation from Central Field Depot inventory requested.", event.getName());
                actionUrl = "/app/resources";

                targetRecipients.addAll(userRepository.findByPosition(Position.MEDIA_TEAM));
                targetRecipients.addAll(userRepository.findByPosition(Position.PA_TEAM));
                if (event.getCoordinator() != null) targetRecipients.add(event.getCoordinator());
                break;

            case "VERIFY_MOMO":
                notificationTitle = "[AI Readiness Alert] MTN MoMo Verification Pace Alert: " + event.getName();
                notificationMessage = String.format("AI Readiness Engine flagged high volume of pending MoMo payments for '%s'. Please finalize transaction verification to secure operational venue deposits.", event.getName());
                actionUrl = "/app/payments/verify";

                targetRecipients.addAll(userRepository.findByPosition(Position.FINANCE_OFFICER));
                if (event.getCoordinator() != null) targetRecipients.add(event.getCoordinator());
                break;

            case "CONFIRM_SPEAKERS":
                notificationTitle = "[AI Readiness Alert] Speaker & Schedule Finalization: " + event.getName();
                notificationMessage = String.format("AI Readiness Engine detected unassigned keynote and plenary sessions for '%s'. Please confirm speakers and populate the master session agenda.", event.getName());
                actionUrl = "/app/events/" + event.getId() + "/sessions";

                targetRecipients.addAll(userRepository.findByPosition(Position.CAMP_DIRECTOR));
                if (event.getCoordinator() != null) targetRecipients.add(event.getCoordinator());
                break;

            default:
                throw new BadRequestException("Unknown mitigation action type: " + actionType);
        }

        // Distinct recipients
        List<User> distinctRecipients = targetRecipients.stream()
                .filter(u -> u != null && Boolean.TRUE.equals(u.getActive()) && !Boolean.TRUE.equals(u.getDeleted()))
                .filter(u -> currentUser == null || !u.getId().equals(currentUser.getId()))
                .distinct()
                .toList();

        // If list is empty, fallback to notifying administrators & coordinators
        if (distinctRecipients.isEmpty()) {
            distinctRecipients = userRepository.findActiveByRole(Role.ADMINISTRATOR);
        }

        for (User recipient : distinctRecipients) {
            Notification notification = Notification.builder()
                    .recipient(recipient)
                    .sender(currentUser)
                    .event(event)
                    .type(NotificationType.EMERGENCY_NOTICE)
                    .title(notificationTitle)
                    .message(request.getCustomMessage() != null && !request.getCustomMessage().isBlank()
                            ? request.getCustomMessage()
                            : notificationMessage)
                    .actionUrl(actionUrl)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }

        log.info("Mitigation action '{}' executed by user {} for event '{}'. Dispatched {} in-app notifications.",
                actionType, currentUser != null ? currentUser.getEmail() : "SYSTEM", event.getName(), distinctRecipients.size());

        return MitigationActionResponse.builder()
                .success(true)
                .message("Mitigation action dispatched successfully: " + notificationTitle)
                .actionType(actionType)
                .eventId(event.getId())
                .eventName(event.getName())
                .recipientsNotifiedCount(distinctRecipients.size())
                .notifiedStakeholders(distinctRecipients.stream().map(User::getEmail).toList())
                .timestamp(LocalDateTime.now())
                .build();
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,d", amount.longValue());
    }
}
