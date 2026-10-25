package com.example.Camp.service;

import com.example.Camp.dto.ai.upcoming.UpcomingEventInsightResponse;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.Notification;
import com.example.Camp.entity.User;
import com.example.Camp.enums.NotificationType;
import com.example.Camp.repository.AuditLogRepository;
import com.example.Camp.repository.NotificationRepository;
import com.example.Camp.repository.RegistrationRepository;
import com.example.Camp.repository.UserRepository;
import com.example.Camp.service.gateway.NotificationGateway;
import com.example.Camp.service.scheduler.UpcomingEventScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationDeduplicationTest {

    @Mock
    private UpcomingEventAiService upcomingEventAiService;
    @Mock
    private NotificationGateway notificationGateway;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private JurisdictionScopeService jurisdictionScopeService;
    @Mock
    private AuditLogRepository auditLogRepository;

    private UpcomingEventScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new UpcomingEventScheduler(
                upcomingEventAiService,
                notificationGateway,
                notificationRepository,
                userRepository,
                registrationRepository,
                jurisdictionScopeService,
                auditLogRepository
        );
    }

    @Test
    @DisplayName("Should send notification when no previous notification for window exists")
    void testDispatchAlerts_FirstTimeSent() {
        LocalDate today = LocalDate.now();
        User coordinator = User.builder().firstName("Paul").lastName("Coord").build();
        coordinator.setId(10L);

        Event event = Event.builder()
                .name("South Rwanda Camporee")
                .startDate(today.plusDays(7))
                .coordinator(coordinator)
                .build();
        event.setId(100L);

        UpcomingEventInsightResponse insight = UpcomingEventInsightResponse.builder()
                .eventId(100L)
                .riskLevel("LOW")
                .predictedAttendance(250)
                .confidence("HIGH")
                .summaryText("Preparation on schedule.")
                .build();

        // No previous notifications in DB
        when(notificationRepository.findByRecipientOrderByCreatedAtDesc(10L)).thenReturn(Collections.emptyList());

        int sent = scheduler.dispatchDeduplicatedAlerts(event, insight, "D-7", today);

        assertTrue(sent >= 1);
        verify(notificationGateway).sendInApp(
                eq(coordinator),
                eq(event),
                eq(NotificationType.AI_INSIGHT),
                contains("D-7"),
                any(),
                contains("/app/events/100")
        );
    }

    @Test
    @DisplayName("Should NOT duplicate notification when notification for window already exists")
    void testDispatchAlerts_DeduplicationPreventsResend() {
        LocalDate today = LocalDate.now();
        User coordinator = User.builder().firstName("Paul").lastName("Coord").build();
        coordinator.setId(10L);

        Event event = Event.builder()
                .name("South Rwanda Camporee")
                .startDate(today.plusDays(7))
                .coordinator(coordinator)
                .build();
        event.setId(100L);

        UpcomingEventInsightResponse insight = UpcomingEventInsightResponse.builder()
                .eventId(100L)
                .riskLevel("LOW")
                .predictedAttendance(250)
                .confidence("HIGH")
                .summaryText("Preparation on schedule.")
                .build();

        // Notification already in DB for this recipient, event, type, and window label D-7
        Notification existingNotif = Notification.builder()
                .recipient(coordinator)
                .event(event)
                .type(NotificationType.AI_INSIGHT)
                .title("[D-7 AI Readiness] South Rwanda Camporee")
                .message("Existing alert")
                .build();

        when(notificationRepository.findByRecipientOrderByCreatedAtDesc(10L)).thenReturn(List.of(existingNotif));

        int sent = scheduler.dispatchDeduplicatedAlerts(event, insight, "D-7", today);

        assertEquals(0, sent);
        verify(notificationGateway, never()).sendInApp(any(), any(), any(), any(), any(), any());
    }
}
