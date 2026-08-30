package com.example.Camp.dto.proposal;

import com.example.Camp.enums.EventType;
import com.example.Camp.enums.ProposalScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalRequest {
    
    @NotBlank(message = "Event name is required")
    private String eventName;
    
    @NotNull(message = "Event type is required")
    private EventType eventType;
    
    @NotNull(message = "Department ID is required")
    private Long departmentId;

    @NotNull(message = "Proposal scope is required")
    private ProposalScope scope;

    private Long targetOrganizationUnitId;
    
    @NotBlank(message = "Objectives are required")
    private String objectives;
    
    @NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    private LocalDate endDate;
    
    @NotBlank(message = "Venue is required")
    private String venue;
    
    private Integer expectedParticipants;
    
    @NotNull(message = "Estimated budget is required")
    private BigDecimal estimatedBudget;
    
    private String requiredResources;
}
