package com.example.Camp.dto.proposal;

import com.example.Camp.enums.EventType;
import com.example.Camp.enums.ProposalScope;
import com.example.Camp.enums.ProposalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProposalResponse {
    
    private Long id;
    private String eventName;
    private EventType eventType;
    private Long departmentId;
    private String departmentName;
    private Long proposedById;
    private String proposedByName;
    private String objectives;
    private LocalDate startDate;
    private LocalDate endDate;
    private String venue;
    private Integer expectedParticipants;
    private BigDecimal estimatedBudget;
    private String requiredResources;
    private ProposalStatus status;
    private ProposalScope scope;
    private Long targetOrganizationUnitId;
    private String targetOrganizationUnitName;
    private Boolean deptLeaderEndorsed;
    private String reviewComments;
    private Long reviewedById;
    private String reviewedByName;

    // Level 1 Leader Review
    private Long leaderReviewedById;
    private String leaderReviewedByName;
    private String leaderReviewComments;
    private LocalDateTime leaderReviewedAt;

    // Level 2 Admin Final Approval
    private Long adminApprovedById;
    private String adminApprovedByName;
    private String adminReviewComments;
    private LocalDateTime adminApprovedAt;

    // Associated Event Info (when approved)
    private Long createdEventId;
    private String createdEventCode;

    // Detailed Review History
    private List<ProposalReviewResponse> reviewHistory;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
