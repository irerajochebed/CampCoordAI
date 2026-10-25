package com.example.Camp.dto.ai.upcoming;

import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.EventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Summary DTO representing an upcoming event along with attendance prediction
 * and overall readiness risk status.
 * Note: Risk and financial fields are omitted (null) for PARTICIPANT users.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingEventResponse {
    private Long eventId;
    private String eventCode;
    private String eventName;
    private EventType eventType;
    private EventStatus status;
    private String venue;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;
    private long daysUntilStart;
    private Long daysUntilRegistrationEnd;
    private boolean registrationOpen;
    private Integer maxParticipants;
    private Integer currentRegistrations;

    // AI readiness fields (visible to ADMINISTRATOR & COORDINATOR; null for PARTICIPANT)
    private Integer predictedAttendance;
    private String confidence; // "LOW", "MEDIUM", "HIGH"
    private String riskLevel;  // "LOW", "MEDIUM", "HIGH"
    private String coordinatorName;
    private String organizationUnitName;
    private String departmentName;
    private LocalDateTime lastInsightGeneratedAt;
}
