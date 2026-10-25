package com.example.Camp.service.scheduler;

import com.example.Camp.dto.ai.ReadinessAssessmentResponse;
import com.example.Camp.dto.ai.ReadinessWarning;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.EventAssignment;
import com.example.Camp.entity.Notification;
import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.entity.User;
import com.example.Camp.enums.NotificationType;
import com.example.Camp.enums.OrganizationLevel;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import com.example.Camp.repository.EventAssignmentRepository;
import com.example.Camp.repository.EventRepository;
import com.example.Camp.repository.NotificationRepository;
import com.example.Camp.repository.UserRepository;
import com.example.Camp.service.EventReadinessAiService;
import com.example.Camp.service.JurisdictionScopeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReadinessScheduler {

    private final EventRepository eventRepository;
    private final EventReadinessAiService readinessAiService;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final JurisdictionScopeService jurisdictionScopeService;

    /**
     * Daily Scheduled AI Readiness Diagnostic Scan at 4:00 AM.
     * Evaluates all upcoming events starting within 30 to 90 days.
     * Automatically alerts Camp Directors and Field Leaders when HIGH or CRITICAL issues are detected.
     */
    @Scheduled(cron = "0 0 4 * * ?")
    @Transactional
    public void scanAndEvaluateReadiness() {
        log.info("Starting Daily Automated AI Readiness & Early-Warning Diagnostic Scan (4:00 AM)...");
        LocalDate today = LocalDate.now();

        List<Event> upcomingEvents = eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .filter(e -> e.getStartDate() != null)
                .filter(e -> {
                    long days = ChronoUnit.DAYS.between(today, e.getStartDate());
                    return days >= 0 && days <= 90;
                })
                .toList();

        int criticalAlertsGenerated = 0;

        for (Event event : upcomingEvents) {
            try {
                ReadinessAssessmentResponse assessment = readinessAiService.evaluateEventReadiness(event.getId());

                boolean hasHighOrCritical = "CRITICAL".equalsIgnoreCase(assessment.getRiskLevel()) ||
                        assessment.getWarnings().stream().anyMatch(w -> "HIGH".equalsIgnoreCase(w.getSeverity()));

                if (hasHighOrCritical) {
                    dispatchReadinessAlerts(event, assessment);
                    criticalAlertsGenerated++;
                }
            } catch (Exception ex) {
                log.error("Error evaluating readiness for event {}: {}", event.getId(), ex.getMessage(), ex);
            }
        }

        log.info("Completed Daily AI Readiness Diagnostic Scan. Evaluated {} events. Generated {} critical early-warning alerts.",
                upcomingEvents.size(), criticalAlertsGenerated);
    }

    /**
     * Dispatches in-app early-warning alerts to assigned Camp Director and Field Leader.
     */
    public void dispatchReadinessAlerts(Event event, ReadinessAssessmentResponse assessment) {
        List<User> recipients = new ArrayList<>();

        // 1. Identify Assigned CAMP_DIRECTOR or Coordinator
        List<EventAssignment> assignments = eventAssignmentRepository.findByEventId(event.getId());
        Optional<User> campDirector = assignments.stream()
                .filter(a -> a.getPosition() == Position.CAMP_DIRECTOR && a.getUser() != null)
                .map(EventAssignment::getUser)
                .findFirst();

        if (campDirector.isPresent()) {
            recipients.add(campDirector.get());
        } else if (event.getCoordinator() != null) {
            recipients.add(event.getCoordinator());
        }

        // 2. Identify Governing FIELD_LEADER
        Long fieldId = null;
        if (event.getProposal() != null && event.getProposal().getTargetOrganizationUnit() != null) {
            fieldId = jurisdictionScopeService.resolveFieldUnitId(event.getProposal().getTargetOrganizationUnit());
        } else if (event.getCoordinator() != null && event.getCoordinator().getOrganizationUnit() != null) {
            fieldId = jurisdictionScopeService.resolveFieldUnitId(event.getCoordinator().getOrganizationUnit());
        }

        if (fieldId != null) {
            List<User> fieldLeaders = userRepository.findActiveByPositionAndOrganizationUnitId(Position.FIELD_LEADER, fieldId);
            if (!fieldLeaders.isEmpty()) {
                recipients.addAll(fieldLeaders);
            } else {
                recipients.addAll(userRepository.findByPosition(Position.FIELD_LEADER));
            }
        } else {
            recipients.addAll(userRepository.findByPosition(Position.FIELD_LEADER));
        }

        // Fallback if no leaders found: alert Union Administrators
        if (recipients.isEmpty()) {
            recipients.addAll(userRepository.findActiveByRole(Role.ADMINISTRATOR));
        }

        // Distinct active recipients
        List<User> distinctRecipients = recipients.stream()
                .filter(u -> u != null && Boolean.TRUE.equals(u.getActive()) && !Boolean.TRUE.equals(u.getDeleted()))
                .distinct()
                .toList();

        // Highest severity warning
        ReadinessWarning topWarning = assessment.getWarnings().stream()
                .filter(w -> "HIGH".equalsIgnoreCase(w.getSeverity()))
                .findFirst()
                .orElse(assessment.getWarnings().isEmpty() ? null : assessment.getWarnings().get(0));

        String warningSummary = topWarning != null ? topWarning.getTitle() + ": " + topWarning.getDetails() : "Multiple preparation shortfalls detected.";

        String title = String.format("[AI Readiness %s] %s (%d/100)",
                assessment.getRiskLevel(), event.getName(), assessment.getOverallReadinessScore());

        String message = String.format("AI Early-Warning Alert for '%s' (T-%d days). Health Score: %d/100 (%s). %s Review and trigger one-click mitigation actions.",
                event.getName(), assessment.getDaysUntilStart(), assessment.getOverallReadinessScore(), assessment.getRiskLevel(), warningSummary);

        for (User recipient : distinctRecipients) {
            Notification notification = Notification.builder()
                    .recipient(recipient)
                    .event(event)
                    .type(NotificationType.EVENT_REMINDER)
                    .title(title)
                    .message(message)
                    .actionUrl("/app/analytics?tab=readiness&eventId=" + event.getId())
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }

        log.info("Dispatched automated AI Readiness Notification for event '{}' to {} leaders (Camp Director & Field Leader).",
                event.getName(), distinctRecipients.size());
    }
}
