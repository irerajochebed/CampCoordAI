package com.adventist.campcoordai.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionableRecommendation {
    private String actionTitle;
    private String suggestedAction;
    private String targetRole; // e.g. "DISTRICT_PASTOR", "FINANCE_OFFICER", "CAMP_DIRECTOR"
}
