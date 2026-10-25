package com.adventist.campcoordai.dto.ai;

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
    private String title;
    private String details;
    private String severity; // "HIGH", "MEDIUM", "LOW"
}
