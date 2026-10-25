package com.example.Camp.service;

import com.example.Camp.ai.provider.impl.LlmSummaryProvider;
import com.example.Camp.ai.provider.impl.RuleBasedSummaryProvider;
import com.example.Camp.ai.provider.model.AiInsightContext;
import com.example.Camp.dto.ai.upcoming.ReadinessRiskDto;
import com.example.Camp.dto.ai.upcoming.UpcomingEventInsightResponse;
import com.example.Camp.entity.*;
import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.EventType;
import com.example.Camp.enums.PaymentStatus;
import com.example.Camp.enums.RiskSeverity;
import com.example.Camp.repository.*;
import com.example.Camp.service.impl.UpcomingEventAiServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpcomingEventRiskRulesTest {

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

    private RuleBasedSummaryProvider ruleBasedProvider;
    private UpcomingEventAiServiceImpl service;

    @BeforeEach
    void setUp() {
        ruleBasedProvider = new RuleBasedSummaryProvider();
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
                ruleBasedProvider,
                new ObjectMapper()
        );
        when(aiInsightRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("Risk Rule 1: Registration pace far below expected at D-14 triggers HIGH risk")
    void testRiskRule_RegistrationVelocityLag() {
        LocalDate today = LocalDate.now();

        Proposal proposal = Proposal.builder().expectedParticipants(300).build();
        User coord = User.builder().firstName("John").lastName("Pastor").build();

        Event event = Event.builder()
                .eventCode("EVT-R1")
                .name("Annual Camp")
                .type(EventType.CAMP)
                .status(EventStatus.PLANNED)
                .startDate(today.plusDays(10)) // D-10
                .coordinator(coord)
                .proposal(proposal)
                .build();
        event.setId(501L);
        event.setDeleted(false);

        // Only 10 registrations out of ~300 expected (< 40%)
        when(registrationRepository.findByEventId(501L)).thenReturn(Collections.nCopies(10, new Registration()));
        // Provide 1 session with speaker to avoid program risk
        User speaker = User.builder().firstName("Guest").lastName("Speaker").build();
        Session session = Session.builder().title("Opening Keynote").speaker(speaker).build();
        when(sessionRepository.findByEventId(501L)).thenReturn(List.of(session));

        UpcomingEventInsightResponse response = service.generateAndSaveInsight(event, "D-10");

        assertTrue(response.getRisks().stream().anyMatch(r ->
                "REGISTRATION_PACE".equals(r.getCategory()) && r.getSeverity() == RiskSeverity.HIGH));
        assertEquals("HIGH", response.getRiskLevel());
    }

    @Test
    @DisplayName("Risk Rule 2: Overbooking triggers HIGH risk when registrations >= maxParticipants")
    void testRiskRule_Overbooking() {
        LocalDate today = LocalDate.now();
        User coord = User.builder().firstName("Jane").lastName("Coordinator").build();

        Event event = Event.builder()
                .eventCode("EVT-R2")
                .name("Leadership Retreat")
                .type(EventType.RETREAT)
                .status(EventStatus.PLANNED)
                .startDate(today.plusDays(20))
                .maxParticipants(50)
                .coordinator(coord)
                .build();
        event.setId(502L);
        event.setDeleted(false);

        // 55 registrations >= 50 capacity
        when(registrationRepository.findByEventId(502L)).thenReturn(Collections.nCopies(55, new Registration()));
        Session session = Session.builder().title("Plenary").speaker(coord).build();
        when(sessionRepository.findByEventId(502L)).thenReturn(List.of(session));

        UpcomingEventInsightResponse response = service.generateAndSaveInsight(event, "D-20");

        assertTrue(response.getRisks().stream().anyMatch(r ->
                "OVERBOOKING".equals(r.getCategory()) && r.getSeverity() == RiskSeverity.HIGH));
    }

    @Test
    @DisplayName("Risk Rule 3: High pending payments close to start date (D-5) triggers HIGH risk")
    void testRiskRule_PendingPayments() {
        LocalDate today = LocalDate.now();
        User coord = User.builder().firstName("David").lastName("Elder").build();

        Event event = Event.builder()
                .eventCode("EVT-R3")
                .name("Youth Congress")
                .type(EventType.CONFERENCE)
                .status(EventStatus.PLANNED)
                .startDate(today.plusDays(5)) // D-5
                .registrationFee(BigDecimal.valueOf(15000))
                .coordinator(coord)
                .build();
        event.setId(503L);
        event.setDeleted(false);

        when(registrationRepository.findByEventId(503L)).thenReturn(Collections.nCopies(50, new Registration()));
        List<Payment> payments = List.of(
                Payment.builder().status(PaymentStatus.PENDING).build(),
                Payment.builder().status(PaymentStatus.PENDING).build(),
                Payment.builder().status(PaymentStatus.PENDING).build(),
                Payment.builder().status(PaymentStatus.PENDING).build(),
                Payment.builder().status(PaymentStatus.VERIFIED).build()
        ); // 4 pending out of 5 (80%)
        when(paymentRepository.findByEvent(503L)).thenReturn(payments);
        Session session = Session.builder().title("Sermon").speaker(coord).build();
        when(sessionRepository.findByEventId(503L)).thenReturn(List.of(session));

        UpcomingEventInsightResponse response = service.generateAndSaveInsight(event, "D-5");

        assertTrue(response.getRisks().stream().anyMatch(r ->
                "FINANCIAL".equals(r.getCategory()) && r.getSeverity() == RiskSeverity.HIGH));
    }

    @Test
    @DisplayName("Risk Rule 4: Lodging capacity lower than expected attendance triggers HIGH risk")
    void testRiskRule_AccommodationDeficit() {
        LocalDate today = LocalDate.now();
        User coord = User.builder().firstName("Samuel").lastName("Director").build();

        Proposal proposal = Proposal.builder().expectedParticipants(200).build();

        Event event = Event.builder()
                .eventCode("EVT-R4")
                .name("Pathfinder Camporee")
                .type(EventType.CAMP)
                .status(EventStatus.PLANNED)
                .startDate(today.plusDays(25))
                .proposal(proposal)
                .coordinator(coord)
                .build();
        event.setId(504L);
        event.setDeleted(false);

        when(registrationRepository.findByEventId(504L)).thenReturn(Collections.nCopies(180, new Registration()));
        // Bed capacity is only 50 (deficit > 20)
        when(roomRepository.getTotalCapacityByEvent(504L)).thenReturn(50L);
        Session session = Session.builder().title("Campfire").speaker(coord).build();
        when(sessionRepository.findByEventId(504L)).thenReturn(List.of(session));

        UpcomingEventInsightResponse response = service.generateAndSaveInsight(event, "D-25");

        assertTrue(response.getRisks().stream().anyMatch(r ->
                "ACCOMMODATION".equals(r.getCategory()) && r.getSeverity() == RiskSeverity.HIGH));
    }

    @Test
    @DisplayName("Risk Rule 5: No sessions scheduled triggers HIGH risk")
    void testRiskRule_NoSessions() {
        LocalDate today = LocalDate.now();
        User coord = User.builder().firstName("Mark").lastName("Pastor").build();

        Event event = Event.builder()
                .eventCode("EVT-R5")
                .name("Music Festival")
                .type(EventType.CONFERENCE)
                .status(EventStatus.PLANNED)
                .startDate(today.plusDays(15))
                .coordinator(coord)
                .build();
        event.setId(505L);
        event.setDeleted(false);

        when(sessionRepository.findByEventId(505L)).thenReturn(Collections.emptyList());

        UpcomingEventInsightResponse response = service.generateAndSaveInsight(event, "D-15");

        assertTrue(response.getRisks().stream().anyMatch(r ->
                "PROGRAM".equals(r.getCategory()) && r.getSeverity() == RiskSeverity.HIGH));
    }

    @Test
    @DisplayName("Risk Rule 6: No coordinator assigned triggers HIGH risk")
    void testRiskRule_NoCoordinator() {
        LocalDate today = LocalDate.now();

        Event event = Event.builder()
                .eventCode("EVT-R6")
                .name("Unassigned Coord Event")
                .type(EventType.CAMP)
                .status(EventStatus.PLANNED)
                .startDate(today.plusDays(15))
                .coordinator(null) // Unassigned!
                .build();
        event.setId(506L);
        event.setDeleted(false);

        Session session = Session.builder().title("Service").build();
        when(sessionRepository.findByEventId(506L)).thenReturn(List.of(session));

        UpcomingEventInsightResponse response = service.generateAndSaveInsight(event, "D-15");

        assertTrue(response.getRisks().stream().anyMatch(r ->
                "COORDINATION".equals(r.getCategory()) && r.getSeverity() == RiskSeverity.HIGH));
        assertEquals("HIGH", response.getRiskLevel());
    }

    @Test
    @DisplayName("LLM Fallback: LlmSummaryProvider cleanly falls back to RuleBasedSummaryProvider when key missing or call fails")
    void testLlmSummaryProvider_FallbackToRuleBased() {
        ObjectMapper mapper = new ObjectMapper();
        LlmSummaryProvider llmProvider = new LlmSummaryProvider(ruleBasedProvider, mapper);

        // Configure with empty key
        ReflectionTestUtils.setField(llmProvider, "apiKey", "");

        AiInsightContext context = AiInsightContext.builder()
                .eventName("National Congress")
                .eventType("CONFERENCE")
                .daysUntilStart(7)
                .currentRegistrations(150)
                .maxParticipants(200)
                .predictedAttendance(180)
                .confidence("HIGH")
                .riskLevel("LOW")
                .accommodationCapacity(250)
                .recommendations(List.of("Continue standard monitoring."))
                .build();

        String summary = llmProvider.generateSummary(context);

        assertNotNull(summary);
        assertTrue(summary.contains("National Congress"));
        assertTrue(summary.contains("Overall readiness status: LOW"));
        assertEquals("RULE_BASED", llmProvider.getProviderName());
    }
}
