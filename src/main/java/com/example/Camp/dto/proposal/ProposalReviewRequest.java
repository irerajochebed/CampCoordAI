package com.example.Camp.dto.proposal;

import com.example.Camp.enums.ProposalStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalReviewRequest {
    
    @NotNull(message = "Decision is required")
    private ProposalStatus decision;
    
    private String comments;
}
