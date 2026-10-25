package com.example.Camp.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessWarning {
    private String category; // "LODGING", "REGISTRATION", "FINANCE", "RESOURCES", "PROGRAM"
    private String code;     // e.g. "REGISTRATION_LAG", "LODGING_SHORTAGE", "CASHFLOW_RISK", "RESOURCE_BOTTLENECK", "PROGRAM_INCOMPLETE"
    private String title;
    private String details;
    private String severity; // "HIGH", "MEDIUM", "LOW"
}
