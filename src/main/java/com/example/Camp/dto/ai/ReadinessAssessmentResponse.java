package com.example.Camp.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessAssessmentResponse {
    private Long eventId;
    private String eventCode;
    private String eventName;
    private String venue;
    private LocalDate startDate;
    private LocalDate endDate;
    private int daysUntilStart;
    private int overallReadinessScore; // 0 - 100
    private String riskLevel;           // "CRITICAL", "MODERATE", "OPTIMAL"
    private String fieldName;
    private String departmentName;

    // Pillar Scores (0 - 20 each)
    private int registrationScore;
    private int lodgingScore;
    private int financeScore;
    private int resourcesScore;
    private int programScore;

    // Pillar 1: Registration Velocity Metrics
    private long currentRegistrations;
    private long expectedParticipants;
    private double registrationPacePercent; // velocity lag % (e.g. 28.0)
    private double milestoneExpectedRatio;  // target ratio at milestone (e.g. 60.0)

    // Pillar 2: Lodging Capacity Metrics
    private long totalBedCapacity;
    private long occupiedBeds;
    private long projectedBedDemand;
    private long lodgingDeficitBeds; // 0 or negative deficit

    // Pillar 3: Financial Inflow Metrics
    private BigDecimal collectedRevenue;
    private BigDecimal pendingRevenue;
    private BigDecimal budgetBaseline;
    private double pendingPaymentRatio; // e.g. 0.42 (42%)
    private boolean budgetThresholdMet;

    // Pillar 4: Resources & AV Metrics
    private int requiredSoundSystems;
    private int allocatedSoundSystems;
    private int soundSystemsShortage;
    private int requiredGenerators;
    private int allocatedGenerators;
    private int requiredProjectors;
    private int allocatedProjectors;
    private boolean concurrentClashDetected;
    private String concurrentConflictDetails;

    // Pillar 5: Program & Speakers Metrics
    private int totalSessions;
    private int confirmedSessions;
    private int unassignedSpeakersCount;
    private boolean keySessionsAssigned;

    @Builder.Default
    private List<ReadinessWarning> warnings = new ArrayList<>();

    @Builder.Default
    private List<ActionableRecommendation> recommendations = new ArrayList<>();
}
