package com.example.Camp.dto.ai.upcoming;

import com.example.Camp.enums.RiskSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessRiskDto {
    private String category; // e.g. "REGISTRATION_PACE", "OVERBOOKING", "FINANCIAL", "ACCOMMODATION", "PROGRAM", "COORDINATION"
    private RiskSeverity severity; // LOW, MEDIUM, HIGH
    private String title;
    private String details;
}
