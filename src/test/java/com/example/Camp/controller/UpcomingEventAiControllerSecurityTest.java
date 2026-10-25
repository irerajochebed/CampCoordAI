package com.example.Camp.controller;

import com.example.Camp.dto.ai.upcoming.UpcomingEventInsightResponse;
import com.example.Camp.dto.ai.upcoming.UpcomingEventResponse;
import com.example.Camp.entity.User;
import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.EventType;
import com.example.Camp.enums.Role;
import com.example.Camp.exception.GlobalExceptionHandler;
import com.example.Camp.exception.UnauthorizedException;
import com.example.Camp.security.UserDetailsImpl;
import com.example.Camp.service.UpcomingEventAiService;
import com.example.Camp.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UpcomingEventAiControllerSecurityTest {

    @Mock
    private UpcomingEventAiService upcomingEventAiService;

    @Mock
    private UserService userService;

    @InjectMocks
    private UpcomingEventAiController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("ADMINISTRATOR: GET /api/ai/upcoming-events returns 200 OK with event list")
    void testGetUpcomingEvents_Administrator() throws Exception {
        User admin = User.builder().firstName("Admin").lastName("User").role(Role.ADMINISTRATOR).build();
        admin.setId(1L);
        UserDetailsImpl userDetails = new UserDetailsImpl(1L, "admin@rum.org", "pass", List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRATOR")));

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        UpcomingEventResponse response = UpcomingEventResponse.builder()
                .eventId(100L)
                .eventName("National Camp 2026")
                .eventType(EventType.CAMP)
                .status(EventStatus.PLANNED)
                .startDate(LocalDate.now().plusDays(14))
                .predictedAttendance(500)
                .confidence("HIGH")
                .riskLevel("LOW")
                .build();

        when(userService.getUserById(1L)).thenReturn(admin);
        when(upcomingEventAiService.findUpcomingEvents(eq(30), eq(admin))).thenReturn(List.of(response));

        mockMvc.perform(get("/api/ai/upcoming-events?days=30").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].eventName").value("National Camp 2026"))
                .andExpect(jsonPath("$.data[0].predictedAttendance").value(500));
    }

    @Test
    @DisplayName("COORDINATOR: GET /api/ai/upcoming-events/{id}/insights returns 200 OK for their event")
    void testGetEventInsight_CoordinatorAllowed() throws Exception {
        User coordinator = User.builder().firstName("Coord").lastName("User").role(Role.COORDINATOR).build();
        coordinator.setId(2L);
        UserDetailsImpl userDetails = new UserDetailsImpl(2L, "coord@rum.org", "pass", List.of(new SimpleGrantedAuthority("ROLE_COORDINATOR")));

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        UpcomingEventInsightResponse insight = UpcomingEventInsightResponse.builder()
                .eventId(200L)
                .eventName("District Retreat")
                .riskLevel("MEDIUM")
                .predictedAttendance(150)
                .confidence("MEDIUM")
                .summaryText("Preparation underway.")
                .build();

        when(userService.getUserById(2L)).thenReturn(coordinator);
        when(upcomingEventAiService.getEventInsight(eq(200L), eq(coordinator))).thenReturn(insight);

        mockMvc.perform(get("/api/ai/upcoming-events/200/insights").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.riskLevel").value("MEDIUM"))
                .andExpect(jsonPath("$.data.predictedAttendance").value(150));
    }

    @Test
    @DisplayName("COORDINATOR: GET /api/ai/upcoming-events/{id}/insights throws UnauthorizedException when not their event")
    void testGetEventInsight_CoordinatorForbiddenOnOtherEvent() throws Exception {
        User coordinator = User.builder().firstName("Other").lastName("Coord").role(Role.COORDINATOR).build();
        coordinator.setId(3L);
        UserDetailsImpl userDetails = new UserDetailsImpl(3L, "other@rum.org", "pass", List.of(new SimpleGrantedAuthority("ROLE_COORDINATOR")));

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        when(userService.getUserById(3L)).thenReturn(coordinator);
        when(upcomingEventAiService.getEventInsight(eq(300L), eq(coordinator)))
                .thenThrow(new UnauthorizedException("Coordinators can only inspect readiness insights for their assigned events."));

        mockMvc.perform(get("/api/ai/upcoming-events/300/insights").principal(auth))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("PARTICIPANT: GET /api/ai/upcoming-events/{id}/insights throws UnauthorizedException (401/403)")
    void testGetEventInsight_ParticipantForbidden() throws Exception {
        User participant = User.builder().firstName("Faithful").lastName("Member").role(Role.PARTICIPANT).build();
        participant.setId(4L);
        UserDetailsImpl userDetails = new UserDetailsImpl(4L, "participant@rum.org", "pass", List.of(new SimpleGrantedAuthority("ROLE_PARTICIPANT")));

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        when(userService.getUserById(4L)).thenReturn(participant);
        when(upcomingEventAiService.getEventInsight(eq(400L), eq(participant)))
                .thenThrow(new UnauthorizedException("Participants do not have permission to view internal operational risks and financial readiness."));

        mockMvc.perform(get("/api/ai/upcoming-events/400/insights").principal(auth))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("PARTICIPANT: POST /api/ai/upcoming-events/{id}/refresh throws UnauthorizedException")
    void testRefreshEventInsight_ParticipantForbidden() throws Exception {
        User participant = User.builder().firstName("Member").lastName("Youth").role(Role.PARTICIPANT).build();
        participant.setId(5L);
        UserDetailsImpl userDetails = new UserDetailsImpl(5L, "youth@rum.org", "pass", List.of(new SimpleGrantedAuthority("ROLE_PARTICIPANT")));

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        when(userService.getUserById(5L)).thenReturn(participant);
        when(upcomingEventAiService.refreshEventInsight(eq(500L), eq(participant)))
                .thenThrow(new UnauthorizedException("Participants cannot trigger AI insight refreshes."));

        mockMvc.perform(post("/api/ai/upcoming-events/500/refresh").principal(auth))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }
}
