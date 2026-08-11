package com.example.Camp.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardResponse {
    
    private Long totalUsers;
    private Long totalEvents;
    private Long activeEvents;
    private BigDecimal totalRevenue;
    private Long totalRegistrations;
    private Long pendingProposalsCount;
    private Long approvedProposalsCount;
    private Long rejectedProposalsCount;
    private Double averageAttendanceRate;
    private Map<String, Long> proposalsByStatus;
    private Map<String, BigDecimal> revenueByPaymentMethod;
}
