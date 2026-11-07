package com.example.Camp.service.impl;

import com.example.Camp.ai.provider.AiSummaryProvider;
import com.example.Camp.ai.provider.model.AiInsightContext;
import com.example.Camp.dto.ai.upcoming.ReadinessRiskDto;
import com.example.Camp.dto.ai.upcoming.UpcomingEventInsightResponse;
import com.example.Camp.dto.ai.upcoming.UpcomingEventResponse;
import com.example.Camp.entity.*;
import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.OrganizationLevel;
import com.example.Camp.enums.PaymentStatus;
import com.example.Camp.enums.RiskSeverity;
import com.example.Camp.enums.Role;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.exception.UnauthorizedException;
import com.example.Camp.repository.*;
import com.example.Camp.service.EventService;
import com.example.Camp.service.JurisdictionScopeService;
import com.example.Camp.service.UpcomingEventAiService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Production implementation of UpcomingEventAiService.
 * Implements deterministic detection windows, statistical turnout prediction,
 * multi-pillar readiness checks, and anonymized summary generation.
 */
@Service
@Slf4j
@Transactional
public class UpcomingEventAiServiceImpl implements UpcomingEventAiService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final PaymentRepository paymentRepository;
    private final RoomRepository roomRepository;
    private final SessionRepository sessionRepository;
    private final AiInsightRepository aiInsightRepository;
    private final AuditLogRepository auditLogRepository;
    private final OrganizationUnitRepository organizationUnitRepository;
    private final EventService eventService;
    private final JurisdictionScopeService jurisdictionScopeService;
    private final AiSummaryProvider summaryProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public UpcomingEventAiServiceImpl(
            EventRepository eventRepository,
            RegistrationRepository registrationRepository,
            PaymentRepository paymentRepository,
            RoomRepository roomRepository,
            SessionRepository sessionRepository,
            AiInsightRepository aiInsightRepository,
            AuditLogRepository auditLogRepository,
            OrganizationUnitRepository organizationUnitRepository,
            @Lazy EventService eventService,
            JurisdictionScopeService jurisdictionScopeService,
            @Qualifier("llmSummaryProvider") AiSummaryProvider summaryProvider) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.paymentRepository = paymentRepository;
        this.roomRepository = roomRepository;
        this.sessionRepository = sessionRepository;
        this.aiInsightRepository = aiInsightRepository;
        this.auditLogRepository = auditLogRepository;
        this.organizationUnitRepository = organizationUnitRepository;
        this.eventService = eventService;
        this.jurisdictionScopeService = jurisdictionScopeService;
        this.summaryProvider = summaryProvider;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UpcomingEventResponse> findUpcomingEvents(Integer days, User currentUser) {
        int lookaheadDays = (days == null || days <= 0) ? 365 : Math.max(days, 90);
        LocalDate today = LocalDate.now();
        LocalDate maxDate = today.plusDays(lookaheadDays);

        List<Event> allEvents = eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .filter(e -> e.getStatus() != EventStatus.CANCELLED && e.getStatus() != EventStatus.COMPLETED)
                .filter(e -> e.getStartDate() != null)
                .filter(e -> (e.getEndDate() != null ? !e.getEndDate().isBefore(today) : !e.getStartDate().isBefore(today))
                        && !e.getStartDate().isAfter(maxDate))
                .sorted(Comparator.comparing(Event::getStartDate))
                .toList();

        // RBAC Scoping
        List<Event> scopedEvents = filterEventsByUserRole(allEvents, currentUser);

        boolean isParticipant = currentUser != null && currentUser.getRole() == Role.PARTICIPANT;

        List<UpcomingEventResponse> responses = new ArrayList<>();
        for (Event event : scopedEvents) {
            long daysUntilStart = ChronoUnit.DAYS.between(today, event.getStartDate());
            Long daysUntilRegEnd = null;
            if (event.getRegistrationEndDate() != null) {
                daysUntilRegEnd = ChronoUnit.DAYS.between(today, event.getRegistrationEndDate());
            }

            boolean isRegOpen = isRegistrationWindowOpen(event, today);
            int currentRegs = registrationRepository.findByEventId(event.getId()).stream()
                    .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                    .toList().size();

            UpcomingEventResponse.UpcomingEventResponseBuilder builder = UpcomingEventResponse.builder()
                    .eventId(event.getId())
                    .eventCode(event.getEventCode())
                    .eventName(event.getName())
                    .eventType(event.getType())
                    .status(event.getStatus())
                    .venue(event.getVenue())
                    .startDate(event.getStartDate())
                    .endDate(event.getEndDate())
                    .registrationStartDate(event.getRegistrationStartDate())
                    .registrationEndDate(event.getRegistrationEndDate())
                    .daysUntilStart(daysUntilStart)
                    .daysUntilRegistrationEnd(daysUntilRegEnd)
                    .registrationOpen(isRegOpen)
                    .maxParticipants(event.getMaxParticipants())
                    .currentRegistrations(currentRegs)
                    .coordinatorName(event.getCoordinator() != null
                            ? event.getCoordinator().getFirstName() + " " + event.getCoordinator().getLastName()
                            : "Unassigned")
                    .departmentName(event.getDepartment() != null ? event.getDepartment().getName() : null);

            if (event.getProposal() != null && event.getProposal().getTargetOrganizationUnit() != null) {
                builder.organizationUnitName(event.getProposal().getTargetOrganizationUnit().getName());
            }

            // For ADMINISTRATOR and COORDINATOR: enrich with AI readiness from cache
            if (!isParticipant) {
                Optional<AiInsight> latestInsight = aiInsightRepository.findTopByEventIdAndDeletedFalseOrderByGeneratedAtDesc(event.getId());
                if (latestInsight.isPresent()) {
                    AiInsight insight = latestInsight.get();
                    builder.predictedAttendance(insight.getPredictedAttendance())
                            .confidence(insight.getConfidence())
                            .riskLevel(insight.getRiskLevel())
                            .lastInsightGeneratedAt(insight.getGeneratedAt());
                } else {
                    // Compute lightweight baseline prediction if no insight generated yet
                    PredictionResult pred = predictAttendance(event, today);
                    builder.predictedAttendance(pred.predictedAttendance)
                            .confidence(pred.confidence)
                            .riskLevel("LOW");
                }
            }

            responses.add(builder.build());
        }

        return responses;
    }

    @Override
    public UpcomingEventInsightResponse getEventInsight(Long eventId, User currentUser) {
        Event event = eventRepository.findById(eventId)
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));

        validateInsightAccess(event, currentUser);

        // Check if an insight has been generated within the last 24 hours
        Optional<AiInsight> cached = aiInsightRepository.findTopByEventIdAndDeletedFalseOrderByGeneratedAtDesc(eventId);
        if (cached.isPresent() && cached.get().getGeneratedAt().isAfter(LocalDateTime.now().minusHours(24))) {
            return mapInsightToResponse(event, cached.get());
        }

        // Generate and persist fresh insight
        return generateAndSaveInsight(event, "ON_DEMAND");
    }

    @Override
    public UpcomingEventInsightResponse refreshEventInsight(Long eventId, User currentUser) {
        Event event = eventRepository.findById(eventId)
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));

        validateInsightAccess(event, currentUser);

        UpcomingEventInsightResponse response = generateAndSaveInsight(event, "MANUAL_REFRESH");

        // Audit Log Entry
        AuditLog auditLog = AuditLog.builder()
                .user(currentUser)
                .action("AI_INSIGHT_MANUAL_REFRESH")
                .entityType("EVENT")
                .entityId(eventId)
                .details(String.format("User %s triggered manual AI insight refresh for event '%s' (ID: %d). Resulting risk: %s, predicted: %d.",
                        currentUser != null ? currentUser.getEmail() : "SYSTEM",
                        event.getName(), event.getId(), response.getRiskLevel(), response.getPredictedAttendance()))
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(auditLog);

        return response;
    }

    @Override
    public List<Event> detectUpcomingEventsForScheduler() {
        LocalDate today = LocalDate.now();
        List<Event> detected = new ArrayList<>();

        List<Event> activeEvents = eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .filter(e -> e.getStatus() != EventStatus.CANCELLED && e.getStatus() != EventStatus.COMPLETED)
                .toList();

        for (Event event : activeEvents) {
            // Check if starting today -> Auto-transition to ONGOING
            if (event.getStartDate() != null && event.getStartDate().isEqual(today)) {
                if (event.getStatus() == EventStatus.PLANNED || event.getStatus() == EventStatus.REGISTRATION_CLOSED) {
                    event.setStatus(EventStatus.ONGOING);
                    eventRepository.save(event);
                    log.info("Scheduler transitioned event {} to ONGOING.", event.getId());
                }
                detected.add(event);
                continue;
            }

            boolean isMilestone = false;

            // 1. Planned events starting in 30, 14, 7, 3, 1 days
            if (event.getStartDate() != null && event.getStatus() == EventStatus.PLANNED) {
                long daysUntilStart = ChronoUnit.DAYS.between(today, event.getStartDate());
                if (daysUntilStart == 30 || daysUntilStart == 14 || daysUntilStart == 7 || daysUntilStart == 3 || daysUntilStart == 1) {
                    isMilestone = true;
                }
            }

            // 2. Registration deadline in 3 or 1 days
            if (event.getRegistrationEndDate() != null) {
                long daysUntilRegEnd = ChronoUnit.DAYS.between(today, event.getRegistrationEndDate());
                if (daysUntilRegEnd == 3 || daysUntilRegEnd == 1) {
                    isMilestone = true;
                }
            }

            // 3. Registration window is open now
            if (isRegistrationWindowOpen(event, today)) {
                isMilestone = true;
            }

            if (isMilestone && !detected.contains(event)) {
                detected.add(event);
            }
        }

        return detected;
    }

    @Override
    public UpcomingEventInsightResponse generateAndSaveInsight(Event event, String windowLabel) {
        LocalDate today = LocalDate.now();
        long daysUntilStart = event.getStartDate() != null ? ChronoUnit.DAYS.between(today, event.getStartDate()) : 0;
        Long daysUntilRegEnd = event.getRegistrationEndDate() != null ? ChronoUnit.DAYS.between(today, event.getRegistrationEndDate()) : null;
        boolean regOpen = isRegistrationWindowOpen(event, today);

        // 1. Gather Registrations & Attendance Numbers
        List<Registration> eventRegistrations = registrationRepository.findByEventId(event.getId()).stream()
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                .toList();
        int currentRegs = eventRegistrations.size();
        int confirmedRegs = (int) eventRegistrations.stream()
                .filter(r -> "CONFIRMED".equalsIgnoreCase(String.valueOf(r.getStatus())))
                .count();

        // 2. Payments Metrics
        List<Payment> payments = paymentRepository.findByEvent(event.getId()).stream()
                .filter(p -> !Boolean.TRUE.equals(p.getDeleted()))
                .toList();
        int pendingPayments = (int) payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .count();
        int verifiedPayments = (int) payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED)
                .count();

        // 3. Accommodations & Lodging Metrics
        Long totalRoomCapacity = roomRepository.getTotalCapacityByEvent(event.getId());
        long accommodationCap = totalRoomCapacity != null ? totalRoomCapacity : 0L;

        // 4. Sessions & Itinerary Metrics
        List<Session> sessions = sessionRepository.findByEventId(event.getId()).stream()
                .filter(s -> !Boolean.TRUE.equals(s.getDeleted()))
                .toList();
        int sessionCount = sessions.size();
        int sessionsWithSpeaker = (int) sessions.stream()
                .filter(s -> s.getSpeaker() != null)
                .count();

        // 5. Statistical Attendance Forecast
        PredictionResult prediction = predictAttendance(event, today);

        // 6. Multi-Pillar Readiness Risk Assessment (6 Core Rules)
        List<ReadinessRiskDto> risks = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        // Risk Rule 1: Registration Velocity Pace
        if (daysUntilStart <= 14 && currentRegs < Math.round(prediction.predictedAttendance * 0.40)) {
            int pacePct = (int) Math.round((currentRegs * 100.0) / Math.max(1, prediction.predictedAttendance));
            risks.add(ReadinessRiskDto.builder()
                    .category("REGISTRATION_PACE")
                    .severity(RiskSeverity.HIGH)
                    .title("Severe Registration Deficit")
                    .details(String.format("Current registrations (%d) are at only %d%% of projected turnout with %d days remaining.",
                            currentRegs, pacePct, daysUntilStart))
                    .build());
            recommendations.add(String.format("Mobilize District Pastors and youth coordinators immediately: only %d%% of expected registrations received %d days before event.",
                    pacePct, daysUntilStart));
        } else if (daysUntilStart <= 30 && currentRegs < Math.round(prediction.predictedAttendance * 0.30)) {
            risks.add(ReadinessRiskDto.builder()
                    .category("REGISTRATION_PACE")
                    .severity(RiskSeverity.MEDIUM)
                    .title("Registration Pace Lag")
                    .details(String.format("Registrations (%d) are behind historical milestone pace for D-%d.", currentRegs, daysUntilStart))
                    .build());
            recommendations.add("Publish event promotional bulletins through local church announcements to accelerate registration uptake.");
        }

        // Risk Rule 2: Overbooking / Capacity Overflow
        if (event.getMaxParticipants() != null && event.getMaxParticipants() > 0) {
            int maxCap = event.getMaxParticipants();
            if (currentRegs >= maxCap) {
                risks.add(ReadinessRiskDto.builder()
                        .category("OVERBOOKING")
                        .severity(RiskSeverity.HIGH)
                        .title("Venue Overbooking Alert")
                        .details(String.format("Registrations (%d) have reached or exceeded maximum capacity limit (%d).", currentRegs, maxCap))
                        .build());
                recommendations.add(String.format("Venue capacity reached (%d/%d). Close open registrations or arrange overflow seating and auxiliary facilities.", currentRegs, maxCap));
            } else if (currentRegs >= Math.round(maxCap * 0.90)) {
                risks.add(ReadinessRiskDto.builder()
                        .category("OVERBOOKING")
                        .severity(RiskSeverity.MEDIUM)
                        .title("Near Maximum Venue Capacity")
                        .details(String.format("Registrations are at %d%% of max capacity (%d/%d).", (currentRegs * 100 / maxCap), currentRegs, maxCap))
                        .build());
                recommendations.add("Monitor remaining capacity closely and prepare registration waitlist.");
            }
        }

        // Risk Rule 3: Unverified / Pending Payments Close to Start
        if (event.getRegistrationFee() != null && event.getRegistrationFee().compareTo(BigDecimal.ZERO) > 0) {
            if (daysUntilStart <= 7 && pendingPayments > 0 && ((double) pendingPayments / Math.max(1, pendingPayments + verifiedPayments) > 0.30)) {
                risks.add(ReadinessRiskDto.builder()
                        .category("FINANCIAL")
                        .severity(RiskSeverity.HIGH)
                        .title("Significant Unverified Payments")
                        .details(String.format("%d payment(s) remain pending/unverified with only %d day(s) until start.", pendingPayments, daysUntilStart))
                        .build());
                recommendations.add(String.format("Follow up urgently with %d participants having pending MTN MoMo or bank slip payments.", pendingPayments));
            } else if (daysUntilStart <= 14 && pendingPayments > 5) {
                risks.add(ReadinessRiskDto.builder()
                        .category("FINANCIAL")
                        .severity(RiskSeverity.MEDIUM)
                        .title("Pending Payment Verification Backlog")
                        .details(String.format("%d transactions awaiting treasury review.", pendingPayments))
                        .build());
                recommendations.add("Field treasury officer should expedite verification of submitted payment slips.");
            }
        }

        // Risk Rule 4: Lodging Capacity Deficit
        if (accommodationCap > 0 && accommodationCap < prediction.predictedAttendance) {
            long deficit = prediction.predictedAttendance - accommodationCap;
            if (deficit > 20) {
                risks.add(ReadinessRiskDto.builder()
                        .category("ACCOMMODATION")
                        .severity(RiskSeverity.HIGH)
                        .title("Lodging Bed Shortfall")
                        .details(String.format("Assigned bed capacity (%d) is %d beds short of projected turnout (%d).", accommodationCap, deficit, prediction.predictedAttendance))
                        .build());
                recommendations.add(String.format("Reserve approximately %d extra beds or coordinate with host institutions/nearby schools.", deficit));
            } else {
                risks.add(ReadinessRiskDto.builder()
                        .category("ACCOMMODATION")
                        .severity(RiskSeverity.MEDIUM)
                        .title("Minor Lodging Shortfall")
                        .details(String.format("Bed capacity is %d beds below projected demand.", deficit))
                        .build());
                recommendations.add(String.format("Arrange auxiliary bedding for approximately %d additional attendees.", deficit));
            }
        }

        // Risk Rule 5: Program Schedule & Speaker Assignment
        if (sessionCount == 0) {
            risks.add(ReadinessRiskDto.builder()
                    .category("PROGRAM")
                    .severity(RiskSeverity.HIGH)
                    .title("No Sessions Scheduled")
                    .details("Event has zero sessions or worship programs entered in the itinerary.")
                    .build());
            recommendations.add("Draft and enter the master spiritual schedule and workshop itinerary in the Session Manager.");
        } else if (sessionsWithSpeaker == 0) {
            risks.add(ReadinessRiskDto.builder()
                    .category("PROGRAM")
                    .severity(RiskSeverity.HIGH)
                    .title("No Speakers Assigned")
                    .details(String.format("None of the %d scheduled session(s) have assigned keynote speakers.", sessionCount))
                    .build());
            recommendations.add("Assign guest pastors and speakers to scheduled worship and plenary sessions.");
        } else if (sessionsWithSpeaker < sessionCount && daysUntilStart <= 7) {
            int missingSpeakers = sessionCount - sessionsWithSpeaker;
            risks.add(ReadinessRiskDto.builder()
                    .category("PROGRAM")
                    .severity(RiskSeverity.MEDIUM)
                    .title("Unassigned Session Speakers")
                    .details(String.format("%d of %d session(s) do not have designated speakers.", missingSpeakers, sessionCount))
                    .build());
            recommendations.add(String.format("Confirm remaining %d speaker assignments before publishing the program bulletin.", missingSpeakers));
        }

        // Risk Rule 6: Coordinator Assignment
        if (event.getCoordinator() == null) {
            risks.add(ReadinessRiskDto.builder()
                    .category("COORDINATION")
                    .severity(RiskSeverity.HIGH)
                    .title("No Event Coordinator Assigned")
                    .details("No coordinator is designated to oversee on-ground camp operations.")
                    .build());
            recommendations.add("Appoint an official Camp Coordinator immediately to direct field logistics and security.");
        }

        // Overall Risk Level
        RiskSeverity overallSeverity = RiskSeverity.LOW;
        if (risks.stream().anyMatch(r -> r.getSeverity() == RiskSeverity.HIGH)) {
            overallSeverity = RiskSeverity.HIGH;
        } else if (risks.stream().anyMatch(r -> r.getSeverity() == RiskSeverity.MEDIUM)) {
            overallSeverity = RiskSeverity.MEDIUM;
        }

        if (recommendations.isEmpty()) {
            recommendations.add("Preparation is on track. Continue standard mobilization and logistics readiness protocols.");
        }

        // 7. Generate Natural Language Summary via Pluggable Provider
        List<String> riskTitles = risks.stream().map(ReadinessRiskDto::getTitle).toList();
        AiInsightContext context = AiInsightContext.builder()
                .eventName(event.getName())
                .eventType(String.valueOf(event.getType()))
                .daysUntilStart(daysUntilStart)
                .daysUntilRegistrationEnd(daysUntilRegEnd)
                .registrationOpen(regOpen)
                .maxParticipants(event.getMaxParticipants() != null ? event.getMaxParticipants() : 0)
                .currentRegistrations(currentRegs)
                .confirmedRegistrations(confirmedRegs)
                .predictedAttendance(prediction.predictedAttendance)
                .confidence(prediction.confidence)
                .riskLevel(overallSeverity.name())
                .pendingPayments(pendingPayments)
                .verifiedPayments(verifiedPayments)
                .accommodationCapacity(accommodationCap)
                .sessionCount(sessionCount)
                .sessionsWithSpeakers(sessionsWithSpeaker)
                .coordinatorAssigned(event.getCoordinator() != null)
                .detectedRiskTitles(riskTitles)
                .recommendations(recommendations)
                .build();

        String summaryText = summaryProvider.generateSummary(context);
        String providerUsed = summaryProvider.getProviderName();

        // 8. Persist to ai_insights table
        String risksJson = serializeJson(risks);
        String recommendationsJson = serializeJson(recommendations);

        AiInsight insight = AiInsight.builder()
                .event(event)
                .generatedAt(LocalDateTime.now())
                .windowLabel(windowLabel)
                .predictedAttendance(prediction.predictedAttendance)
                .confidence(prediction.confidence)
                .riskLevel(overallSeverity.name())
                .risks(risksJson)
                .recommendations(recommendationsJson)
                .summaryText(summaryText)
                .providerUsed(providerUsed)
                .build();

        AiInsight saved = aiInsightRepository.save(insight);
        log.info("Saved AI Insight for event '{}' [id={}]: Risk={}, Predicted={}, Provider={}",
                event.getName(), event.getId(), saved.getRiskLevel(), saved.getPredictedAttendance(), providerUsed);

        return mapInsightToResponse(event, saved);
    }

    // ── Statistical Turnout Prediction ──────────────────────────────────────────

    private record PredictionResult(int predictedAttendance, String confidence, String method) {}

    private PredictionResult predictAttendance(Event event, LocalDate today) {
        // Query past completed events matching event type
        List<Event> completedEvents = eventRepository.findActiveByStatus(EventStatus.COMPLETED);

        // Filter by same type and department/unit if available
        List<Event> filtered = completedEvents.stream()
                .filter(e -> e.getType() == event.getType())
                .toList();

        int currentRegs = registrationRepository.findByEventId(event.getId()).stream()
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                .toList().size();

        long daysUntilStart = event.getStartDate() != null ? Math.max(1, ChronoUnit.DAYS.between(today, event.getStartDate())) : 30;

        // Velocity benchmark ratio (portion of total registrations expected by milestone)
        double velocityFactor;
        if (daysUntilStart >= 30) velocityFactor = 0.30;
        else if (daysUntilStart >= 14) velocityFactor = 0.60;
        else if (daysUntilStart >= 7) velocityFactor = 0.85;
        else velocityFactor = 0.95;

        // Current pace projection
        int pacedProjection = (int) Math.round(currentRegs / velocityFactor);

        if (!filtered.isEmpty()) {
            // Compute historical average turnout
            double sumTurnout = 0;
            int count = 0;
            for (Event past : filtered) {
                int regs = registrationRepository.findByEventId(past.getId()).stream()
                        .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                        .toList().size();
                if (regs > 0) {
                    sumTurnout += regs;
                    count++;
                }
            }

            double histMean = count > 0 ? (sumTurnout / count) : 100.0;

            // Weighted combination: 65% current registration pace + 35% historical mean
            int predicted = (int) Math.round((0.65 * Math.max(currentRegs, pacedProjection)) + (0.35 * histMean));
            if (predicted < currentRegs) predicted = currentRegs;

            if (event.getMaxParticipants() != null && event.getMaxParticipants() > 0) {
                int capLimit = (int) Math.round(event.getMaxParticipants() * 1.25);
                if (predicted > capLimit) predicted = capLimit;
            }

            String confidence = filtered.size() >= 3 ? "HIGH" : "MEDIUM";
            String method = String.format("Weighted turnout regression & registration velocity pace (N=%d completed events)", filtered.size());

            return new PredictionResult(predicted, confidence, method);
        } else {
            // Fallback when no past history is available
            int baseline = 50;
            if (event.getProposal() != null && event.getProposal().getExpectedParticipants() != null && event.getProposal().getExpectedParticipants() > 0) {
                baseline = event.getProposal().getExpectedParticipants();
            } else if (event.getMaxParticipants() != null && event.getMaxParticipants() > 0) {
                baseline = (int) Math.round(event.getMaxParticipants() * 0.80);
            } else if (currentRegs > 0) {
                baseline = Math.max(50, (int) Math.round(currentRegs / velocityFactor));
            }

            int predicted = Math.max(currentRegs, baseline);
            return new PredictionResult(predicted, "LOW", "Proposal baseline forecast (insufficient historical records)");
        }
    }

    // ── Helper Methods & Mappers ────────────────────────────────────────────────

    private boolean isRegistrationWindowOpen(Event event, LocalDate today) {
        if (event == null) return false;
        if (event.getStatus() == EventStatus.REGISTRATION_OPEN) {
            if (event.getRegistrationEndDate() != null && today.isAfter(event.getRegistrationEndDate())) {
                return false;
            }
            if (event.getRegistrationStartDate() != null && today.isBefore(event.getRegistrationStartDate())) {
                return false;
            }
            return true;
        }
        if (event.getRegistrationStartDate() != null && event.getRegistrationEndDate() != null) {
            return !today.isBefore(event.getRegistrationStartDate()) && !today.isAfter(event.getRegistrationEndDate());
        }
        return false;
    }

    private List<Event> filterEventsByUserRole(List<Event> events, User user) {
        if (user == null || user.getRole() == Role.ADMINISTRATOR || jurisdictionScopeService.isUnionWideScope(user)) {
            return events;
        }

        if (user.getRole() == Role.COORDINATOR) {
            return events.stream()
                    .filter(e -> (e.getCoordinator() != null && e.getCoordinator().getId().equals(user.getId()))
                            || isCoordinatorAllowedEvent(user, e))
                    .toList();
        }

        // Participant role: upcoming/active events accessible to the participant based on jurisdiction & status
        return events.stream()
                .filter(e -> isParticipantEligibleForEvent(user, e))
                .toList();
    }

    private boolean isCoordinatorAllowedEvent(User user, Event event) {
        if (event == null) return false;
        if (event.getCoordinator() != null && event.getCoordinator().getId().equals(user.getId())) {
            return true;
        }
        if (user.getDepartment() != null) {
            Department eventDept = event.getDepartment();
            if (eventDept == null && event.getProposal() != null) {
                eventDept = event.getProposal().getDepartment();
            }
            if (eventDept != null && eventDept.getId().equals(user.getDepartment().getId())) {
                return true;
            }
        }
        List<Long> accessibleUnits = jurisdictionScopeService.getAccessibleOrganizationUnitIds(user);
        if (accessibleUnits.isEmpty()) return true;
        Long targetUnitId = null;
        if (event.getProposal() != null && event.getProposal().getTargetOrganizationUnit() != null) {
            targetUnitId = event.getProposal().getTargetOrganizationUnit().getId();
        } else if (event.getCoordinator() != null && event.getCoordinator().getOrganizationUnit() != null) {
            targetUnitId = event.getCoordinator().getOrganizationUnit().getId();
        }
        return targetUnitId == null || accessibleUnits.contains(targetUnitId);
    }

    private boolean isParticipantEligibleForEvent(User user, Event event) {
        if (event == null || Boolean.TRUE.equals(event.getDeleted())) {
            return false;
        }
        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED || event.getStatus() == EventStatus.DRAFT) {
            return false;
        }

        // If participant is registered, always allow them to see it
        if (user != null && registrationRepository.findByEventAndParticipant(event.getId(), user.getId()).isPresent()) {
            return true;
        }

        // Target unit of the event
        OrganizationUnit targetUnit = null;
        if (event.getProposal() != null && event.getProposal().getTargetOrganizationUnit() != null) {
            targetUnit = event.getProposal().getTargetOrganizationUnit();
        } else if (event.getCoordinator() != null && event.getCoordinator().getOrganizationUnit() != null) {
            targetUnit = event.getCoordinator().getOrganizationUnit();
        }

        // If target unit is null or UNION level, it is open union-wide to all participants
        if (targetUnit == null || targetUnit.getLevel() == OrganizationLevel.UNION) {
            return true;
        }

        // If user has no specific organization unit, allow viewing
        if (user == null || user.getOrganizationUnit() == null) {
            return true;
        }

        Long userUnitId = user.getOrganizationUnit().getId();

        // 1. If target unit is FIELD level
        if (targetUnit.getLevel() == OrganizationLevel.FIELD) {
            List<Long> unitsInField = organizationUnitRepository.findUnitIdsUnderField(targetUnit.getId());
            return unitsInField.contains(userUnitId);
        }

        // 2. If target unit is DISTRICT level
        if (targetUnit.getLevel() == OrganizationLevel.DISTRICT) {
            List<Long> unitsInDistrict = organizationUnitRepository.findUnitIdsUnderDistrict(targetUnit.getId());
            return unitsInDistrict.contains(userUnitId);
        }

        // 3. If target unit is CHURCH level
        return targetUnit.getId().equals(userUnitId);
    }

    private void validateInsightAccess(Event event, User user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication required to access event readiness insights.");
        }
        if (user.getRole() == Role.ADMINISTRATOR || jurisdictionScopeService.isUnionWideScope(user)) {
            return;
        }
        if (user.getRole() == Role.COORDINATOR) {
            if (event.getCoordinator() != null && event.getCoordinator().getId().equals(user.getId())) {
                return;
            }
            throw new UnauthorizedException("Coordinators can only inspect readiness insights for their assigned events.");
        }
        // Participants are forbidden from viewing internal operational risks
        throw new UnauthorizedException("Participants do not have permission to view internal operational risks and financial readiness.");
    }

    private UpcomingEventInsightResponse mapInsightToResponse(Event event, AiInsight insight) {
        LocalDate today = LocalDate.now();
        long daysUntilStart = event.getStartDate() != null ? ChronoUnit.DAYS.between(today, event.getStartDate()) : 0;
        Long daysUntilRegEnd = event.getRegistrationEndDate() != null ? ChronoUnit.DAYS.between(today, event.getRegistrationEndDate()) : null;

        List<Registration> regs = registrationRepository.findByEventId(event.getId()).stream()
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                .toList();
        int confirmedCount = (int) regs.stream()
                .filter(r -> "CONFIRMED".equalsIgnoreCase(String.valueOf(r.getStatus())))
                .count();

        List<Payment> payments = paymentRepository.findByEvent(event.getId()).stream()
                .filter(p -> !Boolean.TRUE.equals(p.getDeleted()))
                .toList();
        int pendingPayCount = (int) payments.stream().filter(p -> p.getStatus() == PaymentStatus.PENDING).count();
        int verifiedPayCount = (int) payments.stream().filter(p -> p.getStatus() == PaymentStatus.VERIFIED).count();

        Long bedCapacity = roomRepository.getTotalCapacityByEvent(event.getId());

        List<Session> sessions = sessionRepository.findByEventId(event.getId()).stream()
                .filter(s -> !Boolean.TRUE.equals(s.getDeleted()))
                .toList();
        int totalSessions = sessions.size();
        int sessionsWithSpeaker = (int) sessions.stream().filter(s -> s.getSpeaker() != null).count();

        List<ReadinessRiskDto> riskList = deserializeJson(insight.getRisks(), new TypeReference<List<ReadinessRiskDto>>() {});
        List<String> recList = deserializeJson(insight.getRecommendations(), new TypeReference<List<String>>() {});

        return UpcomingEventInsightResponse.builder()
                .eventId(event.getId())
                .eventCode(event.getEventCode())
                .eventName(event.getName())
                .eventType(event.getType())
                .status(event.getStatus())
                .venue(event.getVenue())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .registrationStartDate(event.getRegistrationStartDate())
                .registrationEndDate(event.getRegistrationEndDate())
                .daysUntilStart(daysUntilStart)
                .daysUntilRegistrationEnd(daysUntilRegEnd)
                .registrationOpen(isRegistrationWindowOpen(event, today))
                .maxParticipants(event.getMaxParticipants())
                .currentRegistrations(regs.size())
                .confirmedRegistrations(confirmedCount)
                .pendingPaymentsCount(pendingPayCount)
                .verifiedPaymentsCount(verifiedPayCount)
                .totalAccommodationCapacity(bedCapacity != null ? bedCapacity : 0L)
                .totalSessionsCount(totalSessions)
                .sessionsWithSpeakerCount(sessionsWithSpeaker)
                .coordinatorName(event.getCoordinator() != null
                        ? event.getCoordinator().getFirstName() + " " + event.getCoordinator().getLastName()
                        : "Unassigned")
                .coordinatorEmail(event.getCoordinator() != null ? event.getCoordinator().getEmail() : null)
                .organizationUnitName(event.getProposal() != null && event.getProposal().getTargetOrganizationUnit() != null
                        ? event.getProposal().getTargetOrganizationUnit().getName()
                        : null)
                .departmentName(event.getDepartment() != null ? event.getDepartment().getName() : null)
                .predictedAttendance(insight.getPredictedAttendance())
                .confidence(insight.getConfidence())
                .predictionMethod("Weighted regression & velocity milestone model")
                .riskLevel(insight.getRiskLevel())
                .risks(riskList != null ? riskList : Collections.emptyList())
                .recommendations(recList != null ? recList : Collections.emptyList())
                .summaryText(insight.getSummaryText())
                .providerUsed(insight.getProviderUsed())
                .windowLabel(insight.getWindowLabel())
                .generatedAt(insight.getGeneratedAt())
                .build();
    }

    private String serializeJson(Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (Exception ex) {
            log.warn("Failed to serialize to JSON: {}", ex.getMessage());
            return "[]";
        }
    }

    private <T> T deserializeJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception ex) {
            log.warn("Failed to deserialize JSON: {}", ex.getMessage());
            return null;
        }
    }
}
