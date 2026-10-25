package com.adventist.campcoordai.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessAssessmentResponse {
    private Long eventId;
    private String eventName;
    private int daysUntilStart;
    private int overallReadinessScore; // 0 - 100
    private String riskLevel;           // "CRITICAL", "MODERATE", "OPTIMAL"
    private List<ReadinessWarning> warnings;
    private List<ActionableRecommendation> recommendations;
}
