package com.example.Camp.entity;

import com.example.Camp.enums.ProposalStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "proposal_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class ProposalReview extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false)
    private Proposal proposal;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProposalStatus decision;
    
    @Column(length = 2000)
    private String comments;
}
