package com.example.Camp.dto.proposal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminApprovalRequest {
    
    private String confirmedVenue;
    private LocalDate confirmedStartDate;
    private LocalDate confirmedEndDate;
    private String comments;
}
