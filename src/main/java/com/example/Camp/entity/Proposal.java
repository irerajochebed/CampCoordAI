package com.example.Camp.entity;

import com.example.Camp.enums.EventType;
import com.example.Camp.enums.ProposalScope;
import com.example.Camp.enums.ProposalStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "proposals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Proposal extends BaseEntity {
    
    @Column(nullable = false)
    private String eventName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_by_id", nullable = false)
    private User proposedBy;
    
    @Column(length = 2000, nullable = false)
    private String objectives;
    
    @Column(nullable = false)
    private LocalDate startDate;
    
    @Column(nullable = false)
    private LocalDate endDate;
    
    @Column(nullable = false)
    private String venue;
    
    private Integer expectedParticipants;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal estimatedBudget;
    
    @Column(length = 2000)
    private String requiredResources;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProposalStatus status = ProposalStatus.DRAFT;
    
    @Column(length = 1000)
    private String reviewComments;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    // Scope-based workflow fields
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProposalScope scope = ProposalScope.FIELD;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_organization_unit_id")
    private OrganizationUnit targetOrganizationUnit;

    // Tracks whether the Dept Leader has endorsed (for UNION scope)
    @Column(nullable = false)
    @Builder.Default
    private Boolean deptLeaderEndorsed = false;

    // Level 1 Review Tracking (Field Leader / Union Leader)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leader_reviewed_by_id")
    private User leaderReviewedBy;

    @Column(length = 1000)
    private String leaderReviewComments;

    private LocalDateTime leaderReviewedAt;

    // Level 2 Final Approval Tracking (Union Administrator)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_approved_by_id")
    private User adminApprovedBy;

    @Column(length = 1000)
    private String adminReviewComments;

    private LocalDateTime adminApprovedAt;

    @OneToMany(mappedBy = "proposal", cascade = CascadeType.ALL)
    @Builder.Default
    private List<ProposalReview> reviews = new ArrayList<>();
    
    @OneToOne(mappedBy = "proposal")
    private Event event;
}
