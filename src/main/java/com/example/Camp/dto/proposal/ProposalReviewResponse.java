package com.example.Camp.dto.proposal;

import com.example.Camp.enums.ProposalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProposalReviewResponse {
    private Long id;
    private Long reviewerId;
    private String reviewerName;
    private String reviewerRole;
    private String reviewerPosition;
    private ProposalStatus decision;
    private String reviewStage;
    private String comments;
    private LocalDateTime createdAt;
}
