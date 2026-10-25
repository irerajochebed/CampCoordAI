package com.example.Camp.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIInsightsResponse {

    // General Summary (Direct PostgreSQL Aggregations)
    private long totalEvents;
    private long completedEventsCount;
    private long upcomingEventsCount;
    private long totalRegistrations;
    private long totalConfirmedRegistrations;
    private long totalAttendances;
    private BigDecimal totalRevenue;
    private BigDecimal totalVerifiedRevenue;
    private long totalBedCapacity;
    private long totalOccupiedBeds;
    private double overallOccupancyRate;
    private long totalResources;
    private long totalAllocatedResources;

    // AI Predictive Metrics
    private double predictedTurnoutRate;
    private int turnoutConfidenceScore;
    private boolean hasSufficientHistoricalData;
    private String attendanceTrend; // "increasing", "stable", "decreasing"
    private double participantGrowthRate;
    private double revenueGrowthRate;
    private int aiEngagementScore;

    // Default Simulator Baseline from Real Upcoming Event
    private Long defaultEventId;
    private String defaultEventName;
    private Integer defaultEventMaxParticipants;
    private BigDecimal defaultEventRegistrationFee;
    private Long defaultEventBedCapacity;

    // Trend Breakdown Lists (Grounded in DB Records)
    private List<Map<String, Object>> attendanceTrends;
    private List<Map<String, Object>> departmentPerformance;
    private List<Map<String, Object>> eventTypeDistribution;
    private List<Map<String, Object>> monthlyProjections;
    private List<Map<String, Object>> dynamicInsights;
    private List<Map<String, Object>> resourceUtilization;
}
