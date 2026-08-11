package com.example.Camp.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoordinatorDashboardResponse {
    
    private Long assignedEventsCount;
    private Long totalRegistrations;
    private Long pendingPaymentsCount;
    private Long verifiedPaymentsCount;
    private BigDecimal totalRevenueCollected;
    private Long totalRoomCapacity;
    private Long occupiedBedsCount;
    private Double roomOccupancyRate;
    private Long realtimeCheckInCount;
    private Long pendingProposalsCount; // New field for coordinator's pending proposals
}
