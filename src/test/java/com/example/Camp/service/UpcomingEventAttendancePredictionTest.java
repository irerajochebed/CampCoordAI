package com.example.Camp.service;

import com.example.Camp.ai.provider.AiSummaryProvider;
import com.example.Camp.dto.ai.upcoming.UpcomingEventInsightResponse;
import com.example.Camp.entity.AiInsight;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.Proposal;
import com.example.Camp.entity.Registration;
import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.EventType;
import com.example.Camp.repository.*;
import com.example.Camp.service.impl.UpcomingEventAiServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpcomingEventAttendancePredictionTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private RoomRepository roomRepository;
    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private AiInsightRepository aiInsightRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private EventService eventService;
    @Mock
    private JurisdictionScopeService jurisdictionScopeService;
    @Mock
    private AiSummaryProvider summaryProvider;

    private UpcomingEventAiServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UpcomingEventAiServiceImpl(
                eventRepository,
                registrationRepository,
                paymentRepository,
                roomRepository,
                sessionRepository,
                aiInsightRepository,
                auditLogRepository,
                eventService,
                jurisdictionScopeService,
                summaryProvider,
                new ObjectMapper()
        );
        when(summaryProvider.getProviderName()).thenReturn("RULE_BASED");
        when(summaryProvider.generateSummary(any())).thenReturn("Test Summary");
        when(aiInsightRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("Prediction with EMPTY history: falls back to Proposal baseline with LOW confidence")
    void testPrediction_EmptyHistory() {
        LocalDate today = LocalDate.now();

        Proposal proposal = Proposal.builder()
                .expectedParticipants(250)
                .build();

        Event upcomingEvent = Event.builder()
                .eventCode("EVT-100")
                .name("Youth Camp 2026")
                .type(EventType.CAMP)
                .status(EventStatus.PLANNED)
                .startDate(today.plusDays(20))
                .endDate(today.plusDays(25))
                .proposal(proposal)
                .build();
        upcomingEvent.setId(100L);
        upcomingEvent.setDeleted(false);

        // No completed events in history
        when(eventRepository.findActiveByStatus(EventStatus.COMPLETED)).thenReturn(Collections.emptyList());
        when(registrationRepository.findByEventId(100L)).thenReturn(Collections.emptyList());

        UpcomingEventInsightResponse response = service.generateAndSaveInsight(upcomingEvent, "D-20");

        assertNotNull(response);
        assertEquals("LOW", response.getConfidence());
        assertTrue(response.getPredictedAttendance() >= 250);

        ArgumentCaptor<AiInsight> captor = ArgumentCaptor.forClass(AiInsight.class);
        verify(aiInsightRepository).save(captor.capture());
        assertEquals("LOW", captor.getValue().getConfidence());
        assertTrue(captor.getValue().getPredictedAttendance() >= 250);
    }

    @Test
    @DisplayName("Prediction with SMALL history (1-2 past events): produces MEDIUM confidence")
    void testPrediction_SmallHistory() {
        LocalDate today = LocalDate.now();

        Event upcomingEvent = Event.builder()
                .eventCode("EVT-101")
                .name("District Retreat 2026")
                .type(EventType.RETREAT)
                .status(EventStatus.PLANNED)
                .startDate(today.plusDays(14))
                .endDate(today.plusDays(17))
                .build();
        upcomingEvent.setId(101L);
        upcomingEvent.setDeleted(false);

        Event pastEvent1 = Event.builder().type(EventType.RETREAT).status(EventStatus.COMPLETED).build();
        pastEvent1.setId(201L);
        pastEvent1.setDeleted(false);
        Event pastEvent2 = Event.builder().type(EventType.RETREAT).status(EventStatus.COMPLETED).build();
        pastEvent2.setId(202L);
        pastEvent2.setDeleted(false);

        when(eventRepository.findActiveByStatus(EventStatus.COMPLETED)).thenReturn(List.of(pastEvent1, pastEvent2));
        when(registrationRepository.findByEventId(101L)).thenReturn(Collections.emptyList());
        when(registrationRepository.findByEventId(201L)).thenReturn(List.of(new Registration(), new Registration())); // 2
        when(registrationRepository.findByEventId(202L)).thenReturn(List.of(new Registration(), new Registration(), new Registration(), new Registration())); // 4

        UpcomingEventInsightResponse response = service.generateAndSaveInsight(upcomingEvent, "D-14");

        assertEquals("MEDIUM", response.getConfidence());
        assertNotNull(response.getPredictedAttendance());
    }

    @Test
    @DisplayName("Prediction with RICH history (>=3 past events): produces HIGH confidence and weighted regression")
    void testPrediction_RichHistory() {
        LocalDate today = LocalDate.now();

        Event upcomingEvent = Event.builder()
                .eventCode("EVT-102")
                .name("Union Congress 2026")
                .type(EventType.CONFERENCE)
                .status(EventStatus.PLANNED)
                .startDate(today.plusDays(7))
                .endDate(today.plusDays(10))
                .maxParticipants(500)
                .build();
        upcomingEvent.setId(102L);
        upcomingEvent.setDeleted(false);

        Event p1 = Event.builder().type(EventType.CONFERENCE).status(EventStatus.COMPLETED).build();
        p1.setId(301L);
        p1.setDeleted(false);
        Event p2 = Event.builder().type(EventType.CONFERENCE).status(EventStatus.COMPLETED).build();
        p2.setId(302L);
        p2.setDeleted(false);
        Event p3 = Event.builder().type(EventType.CONFERENCE).status(EventStatus.COMPLETED).build();
        p3.setId(303L);
        p3.setDeleted(false);

        when(eventRepository.findActiveByStatus(EventStatus.COMPLETED)).thenReturn(List.of(p1, p2, p3));
        when(registrationRepository.findByEventId(102L)).thenReturn(Collections.emptyList());
        when(registrationRepository.findByEventId(301L)).thenReturn(Collections.nCopies(300, new Registration()));
        when(registrationRepository.findByEventId(302L)).thenReturn(Collections.nCopies(350, new Registration()));
        when(registrationRepository.findByEventId(303L)).thenReturn(Collections.nCopies(320, new Registration()));

        UpcomingEventInsightResponse response = service.generateAndSaveInsight(upcomingEvent, "D-7");

        assertEquals("HIGH", response.getConfidence());
        assertTrue(response.getPredictedAttendance() > 0);
    }
}
