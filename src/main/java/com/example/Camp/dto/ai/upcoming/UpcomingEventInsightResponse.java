package com.example.Camp.dto.ai.upcoming;

import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.EventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Detailed DTO representing full AI insights for a specific event.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingEventInsightResponse {
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

    // Metrics
    private Integer maxParticipants;
    private Integer currentRegistrations;
    private Integer confirmedRegistrations;
    private Integer pendingPaymentsCount;
    private Integer verifiedPaymentsCount;
    private Long totalAccommodationCapacity;
    private Integer totalSessionsCount;
    private Integer sessionsWithSpeakerCount;
    private String coordinatorName;
    private String coordinatorEmail;
    private String organizationUnitName;
    private String departmentName;

    // AI Prediction & Risk Assessment
    private Integer predictedAttendance;
    private String confidence; // "LOW", "MEDIUM", "HIGH"
    private String predictionMethod;
    private String riskLevel;  // "LOW", "MEDIUM", "HIGH"
    
    @Builder.Default
    private List<ReadinessRiskDto> risks = new ArrayList<>();

    @Builder.Default
    private List<String> recommendations = new ArrayList<>();

    private String summaryText;
    private String providerUsed; // "LLM" or "RULE_BASED"
    private String windowLabel;
    private LocalDateTime generatedAt;
}
