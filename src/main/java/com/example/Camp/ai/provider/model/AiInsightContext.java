package com.example.Camp.ai.provider.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Aggregated, anonymized readiness context for AI summary generation.
 * STRICT PRIVACY COMPLIANCE: Adheres to Rwanda Law No. 058/2021 on Personal Data Protection.
 * Strictly contains aggregated numbers, rates, dates, and event metadata.
 * NEVER contains individual participant names, phone numbers, emails, or personal information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiInsightContext {
    private String eventName;
    private String eventType;
    private long daysUntilStart;
    private Long daysUntilRegistrationEnd;
    private boolean registrationOpen;
    private int maxParticipants;
    private int currentRegistrations;
    private int confirmedRegistrations;
    private int predictedAttendance;
    private String confidence;
    private String riskLevel;
    private int pendingPayments;
    private int verifiedPayments;
    private long accommodationCapacity;
    private int sessionCount;
    private int sessionsWithSpeakers;
    private boolean coordinatorAssigned;
    
    @Builder.Default
    private List<String> detectedRiskTitles = new ArrayList<>();
    
    @Builder.Default
    private List<String> recommendations = new ArrayList<>();
}
