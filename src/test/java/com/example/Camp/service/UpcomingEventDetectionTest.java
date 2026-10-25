package com.example.Camp.service;

import com.example.Camp.ai.provider.AiSummaryProvider;
import com.example.Camp.entity.Event;
import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.EventType;
import com.example.Camp.repository.*;
import com.example.Camp.service.impl.UpcomingEventAiServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpcomingEventDetectionTest {

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
    }

    @Test
    @DisplayName("Should detect events starting in exact windows (30, 14, 7, 3, 1 days)")
    void testDetectUpcomingEvents_StartDates() {
        LocalDate today = LocalDate.now();

        Event event30 = createTestEvent(1L, "Camp 30", EventStatus.PLANNED, today.plusDays(30), today.plusDays(35), null, null);
        Event event14 = createTestEvent(2L, "Camp 14", EventStatus.PLANNED, today.plusDays(14), today.plusDays(20), null, null);
        Event event7 = createTestEvent(3L, "Camp 7", EventStatus.PLANNED, today.plusDays(7), today.plusDays(12), null, null);
        Event event3 = createTestEvent(4L, "Camp 3", EventStatus.PLANNED, today.plusDays(3), today.plusDays(6), null, null);
        Event event1 = createTestEvent(5L, "Camp 1", EventStatus.PLANNED, today.plusDays(1), today.plusDays(4), null, null);
        Event event20 = createTestEvent(6L, "Camp 20 (Not milestone)", EventStatus.PLANNED, today.plusDays(20), today.plusDays(25), null, null);

        when(eventRepository.findAll()).thenReturn(List.of(event30, event14, event7, event3, event1, event20));

        List<Event> detected = service.detectUpcomingEventsForScheduler();

        assertEquals(5, detected.size());
        assertTrue(detected.contains(event30));
        assertTrue(detected.contains(event14));
        assertTrue(detected.contains(event7));
        assertTrue(detected.contains(event3));
        assertTrue(detected.contains(event1));
        assertFalse(detected.contains(event20));
    }

    @Test
    @DisplayName("Should detect events with registration deadlines in 3 days and 1 day")
    void testDetectUpcomingEvents_RegistrationDeadlines() {
        LocalDate today = LocalDate.now();

        Event regDeadline3 = createTestEvent(10L, "Retreat Reg 3", EventStatus.PLANNING, today.plusDays(45), today.plusDays(50),
                today.minusDays(10), today.plusDays(3));
        Event regDeadline1 = createTestEvent(11L, "Retreat Reg 1", EventStatus.PLANNING, today.plusDays(45), today.plusDays(50),
                today.minusDays(10), today.plusDays(1));
        Event regDeadline5 = createTestEvent(12L, "Retreat Reg 5 (Not milestone)", EventStatus.PLANNING, today.plusDays(45), today.plusDays(50),
                today.minusDays(10), today.plusDays(5));

        when(eventRepository.findAll()).thenReturn(List.of(regDeadline3, regDeadline1, regDeadline5));

        List<Event> detected = service.detectUpcomingEventsForScheduler();

        assertEquals(2, detected.size());
        assertTrue(detected.contains(regDeadline3));
        assertTrue(detected.contains(regDeadline1));
        assertFalse(detected.contains(regDeadline5));
    }

    @Test
    @DisplayName("Should detect events with registration open currently")
    void testDetectUpcomingEvents_RegistrationOpen() {
        LocalDate today = LocalDate.now();

        Event openWindow = createTestEvent(20L, "Open Window Event", EventStatus.PLANNING, today.plusDays(40), today.plusDays(45),
                today.minusDays(5), today.plusDays(10));
        Event openStatus = createTestEvent(21L, "Open Status Event", EventStatus.REGISTRATION_OPEN, today.plusDays(40), today.plusDays(45),
                null, null);

        when(eventRepository.findAll()).thenReturn(List.of(openWindow, openStatus));

        List<Event> detected = service.detectUpcomingEventsForScheduler();

        assertEquals(2, detected.size());
    }

    @Test
    @DisplayName("Should auto-transition events starting today to ONGOING status")
    void testDetectUpcomingEvents_StartingTodayTransitionsToOngoing() {
        LocalDate today = LocalDate.now();

        Event startingToday = createTestEvent(30L, "Camp Starting Today", EventStatus.PLANNED, today, today.plusDays(5),
                today.minusDays(20), today.minusDays(1));

        when(eventRepository.findAll()).thenReturn(List.of(startingToday));

        List<Event> detected = service.detectUpcomingEventsForScheduler();

        assertEquals(1, detected.size());
        assertEquals(EventStatus.ONGOING, startingToday.getStatus());
        verify(eventRepository).save(startingToday);
    }

    private Event createTestEvent(Long id, String name, EventStatus status, LocalDate start, LocalDate end, LocalDate regStart, LocalDate regEnd) {
        Event e = Event.builder()
                .eventCode("EVT-" + id)
                .name(name)
                .type(EventType.CAMP)
                .status(status)
                .startDate(start)
                .endDate(end)
                .registrationStartDate(regStart)
                .registrationEndDate(regEnd)
                .venue("Test Venue")
                .build();
        e.setId(id);
        e.setDeleted(false);
        return e;
    }
}
