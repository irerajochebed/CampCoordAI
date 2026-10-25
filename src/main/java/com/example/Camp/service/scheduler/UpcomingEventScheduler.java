package com.example.Camp.service.scheduler;

import com.example.Camp.dto.ai.upcoming.UpcomingEventInsightResponse;
import com.example.Camp.entity.*;
import com.example.Camp.enums.NotificationType;
import com.example.Camp.enums.Role;
import com.example.Camp.repository.AuditLogRepository;
import com.example.Camp.repository.NotificationRepository;
import com.example.Camp.repository.RegistrationRepository;
import com.example.Camp.repository.UserRepository;
import com.example.Camp.service.JurisdictionScopeService;
import com.example.Camp.service.UpcomingEventAiService;
import com.example.Camp.service.gateway.NotificationGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Daily Automated Scheduled Task for Upcoming Event Detection and AI Readiness Alerts.
 * Runs on a configurable cron schedule (default 5:00 AM daily).
 * Detects upcoming events at key milestones, computes attendance and risk insights,
 * writes audit logs, and dispatches deduplicated alerts.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "camp.scheduler.upcoming-events.enabled", havingValue = "true", matchIfMissing = true)
public class UpcomingEventScheduler {

    private final UpcomingEventAiService upcomingEventAiService;
    private final NotificationGateway notificationGateway;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final JurisdictionScopeService jurisdictionScopeService;
    private final AuditLogRepository auditLogRepository;

    @Scheduled(cron = "${camp.scheduler.upcoming-events.cron:0 0 5 * * ?}")
    @Transactional
    public void runUpcomingEventDetectionAndInsights() {
        log.info("Starting Daily Automated Upcoming Event AI Detection & Readiness Scan...");
        LocalDate today = LocalDate.now();

        List<Event> detectedEvents = upcomingEventAiService.detectUpcomingEventsForScheduler();
        int insightsGenerated = 0;
        int alertsSent = 0;

        for (Event event : detectedEvents) {
            try {
                String windowLabel = resolveWindowLabel(event, today);
                UpcomingEventInsightResponse insight = upcomingEventAiService.generateAndSaveInsight(event, windowLabel);
                insightsGenerated++;

                alertsSent += dispatchDeduplicatedAlerts(event, insight, windowLabel, today);
            } catch (Exception ex) {
                log.error("Failed processing AI upcoming event scan for event {} (ID: {}): {}",
                        event.getName(), event.getId(), ex.getMessage(), ex);
            }
        }

        // Daily Administrator Digest (if high risks detected across any events)
        long highRiskCount = detectedEvents.stream()
                .filter(e -> {
                    // Check if event has high risk insight
                    return true;
                }).count();

        // Write AuditLog for the automated scheduler execution
        AuditLog auditLog = AuditLog.builder()
                .user(null) // Automated System Process
                .action("AI_UPCOMING_EVENT_SCHEDULER_RUN")
                .entityType("SYSTEM")
                .entityId(null)
                .details(String.format("Scheduled AI Detection scan completed. Detected %d events, generated %d insights, sent %d deduplicated alerts.",
                        detectedEvents.size(), insightsGenerated, alertsSent))
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(auditLog);

        log.info("Finished Daily Upcoming Event AI Scan. Processed {} events, generated {} insights, dispatched {} alerts.",
                detectedEvents.size(), insightsGenerated, alertsSent);
    }

    /**
     * Dispatches deduplicated notifications to Coordinator, Administrators, and Participants.
     */
    public int dispatchDeduplicatedAlerts(Event event, UpcomingEventInsightResponse insight, String windowLabel, LocalDate today) {
        int count = 0;
        long daysUntilStart = event.getStartDate() != null ? ChronoUnit.DAYS.between(today, event.getStartDate()) : 0;

        // 1. Coordinator Alert (Readiness summary & risk flags)
        if (event.getCoordinator() != null) {
            String title = String.format("[%s AI Readiness] %s", windowLabel, event.getName());
            String message = String.format("Readiness update for '%s' (%s). Projected attendance: %d (%s confidence). Summary: %s",
                    event.getName(), insight.getRiskLevel(), insight.getPredictedAttendance(), insight.getConfidence(), insight.getSummaryText());
            String actionUrl = "/app/events/" + event.getId();

            if (!isNotificationAlreadySent(event.getCoordinator().getId(), event.getId(), NotificationType.AI_INSIGHT, windowLabel)) {
                notificationGateway.sendInApp(event.getCoordinator(), event, NotificationType.AI_INSIGHT, title, message, actionUrl);
                count++;
            }
        }

        // 2. Administrators: Alert if HIGH risk detected
        if ("HIGH".equalsIgnoreCase(insight.getRiskLevel())) {
            List<User> admins = userRepository.findActiveByRole(Role.ADMINISTRATOR);
            String title = String.format("[%s HIGH RISK ALERT] %s", windowLabel, event.getName());
            String message = String.format("High readiness risk flagged for upcoming event '%s' starting in %d days. Turnout: %d. Recommendation: %s",
                    event.getName(), daysUntilStart, insight.getPredictedAttendance(),
                    !insight.getRecommendations().isEmpty() ? insight.getRecommendations().get(0) : "Review event readiness details.");
            String actionUrl = "/app/events/" + event.getId();

            for (User admin : admins) {
                if (!isNotificationAlreadySent(admin.getId(), event.getId(), NotificationType.AI_INSIGHT, windowLabel)) {
                    notificationGateway.sendInApp(admin, event, NotificationType.AI_INSIGHT, title, message, actionUrl);
                    count++;
                }
            }
        }

        // 3. Registered Participants: Start Date Reminder (D-7, D-3, D-1)
        if (daysUntilStart == 7 || daysUntilStart == 3 || daysUntilStart == 1) {
            List<Registration> activeRegistrations = registrationRepository.findByEventId(event.getId()).stream()
                    .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                    .toList();

            for (Registration reg : activeRegistrations) {
                User participant = reg.getParticipant();
                if (participant != null) {
                    String title = String.format("[%s Reminder] %s Starts Soon", windowLabel, event.getName());
                    String message = String.format("Hello %s, '%s' starts in %d days at %s. Please review your schedule and accommodations.",
                            participant.getFirstName(), event.getName(), daysUntilStart, event.getVenue());
                    String actionUrl = "/app/events/" + event.getId();

                    if (!isNotificationAlreadySent(participant.getId(), event.getId(), NotificationType.UPCOMING_EVENT, windowLabel)) {
                        notificationGateway.sendInApp(participant, event, NotificationType.UPCOMING_EVENT, title, message, actionUrl);
                        count++;
                    }
                }
            }
        }

        // 4. Open Registration Reminders to Eligible Participants in Jurisdiction
        if (insight.isRegistrationOpen() && (windowLabel.contains("REG-DEADLINE") || daysUntilStart == 14 || daysUntilStart == 7)) {
            List<User> targetParticipants = findEligibleParticipantsForEvent(event);
            for (User participant : targetParticipants) {
                String title = String.format("[Registration Open] %s", event.getName());
                String message = String.format("Registration is currently open for '%s'. Register before %s.",
                        event.getName(), event.getRegistrationEndDate() != null ? event.getRegistrationEndDate() : "commencement");
                String actionUrl = "/app/events/" + event.getId();

                if (!isNotificationAlreadySent(participant.getId(), event.getId(), NotificationType.REGISTRATION_DEADLINE, windowLabel)) {
                    notificationGateway.sendInApp(participant, event, NotificationType.REGISTRATION_DEADLINE, title, message, actionUrl);
                    count++;
                }
            }
        }

        return count;
    }

    /**
     * Resolves the milestone window label for an event.
     */
    public String resolveWindowLabel(Event event, LocalDate today) {
        if (event.getStartDate() != null) {
            long daysUntilStart = ChronoUnit.DAYS.between(today, event.getStartDate());
            if (daysUntilStart == 30 || daysUntilStart == 14 || daysUntilStart == 7 || daysUntilStart == 3 || daysUntilStart == 1) {
                return "D-" + daysUntilStart;
            }
        }
        if (event.getRegistrationEndDate() != null) {
            long daysUntilRegEnd = ChronoUnit.DAYS.between(today, event.getRegistrationEndDate());
            if (daysUntilRegEnd == 3 || daysUntilRegEnd == 1) {
                return "REG-DEADLINE-" + daysUntilRegEnd;
            }
        }
        return "SCHEDULED-SCAN";
    }

    /**
     * Deduplication checker: returns true if a notification with this window label
     * has already been sent to this recipient for this event and notification type.
     */
    public boolean isNotificationAlreadySent(Long recipientId, Long eventId, NotificationType type, String windowLabel) {
        List<Notification> existing = notificationRepository.findByRecipientOrderByCreatedAtDesc(recipientId);
        return existing.stream()
                .filter(n -> !Boolean.TRUE.equals(n.getDeleted()))
                .filter(n -> n.getEvent() != null && n.getEvent().getId().equals(eventId))
                .filter(n -> n.getType() == type)
                .anyMatch(n -> (n.getTitle() != null && n.getTitle().contains(windowLabel)) ||
                               (n.getMessage() != null && n.getMessage().contains(windowLabel)));
    }

    private List<User> findEligibleParticipantsForEvent(Event event) {
        Long orgUnitId = null;
        if (event.getProposal() != null && event.getProposal().getTargetOrganizationUnit() != null) {
            orgUnitId = event.getProposal().getTargetOrganizationUnit().getId();
        } else if (event.getCoordinator() != null && event.getCoordinator().getOrganizationUnit() != null) {
            orgUnitId = event.getCoordinator().getOrganizationUnit().getId();
        }

        if (orgUnitId != null) {
            return userRepository.findByRoleAndOrganizationUnitId(Role.PARTICIPANT, orgUnitId).stream()
                    .filter(u -> Boolean.TRUE.equals(u.getActive()) && !Boolean.TRUE.equals(u.getDeleted()))
                    .toList();
        }
        return List.of();
    }
}
