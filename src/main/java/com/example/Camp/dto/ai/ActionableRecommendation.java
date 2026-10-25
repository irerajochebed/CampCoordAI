package com.example.Camp.dto.ai;

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
    private String targetRole; // e.g. "DISTRICT_PASTOR", "FINANCE_OFFICER", "CAMP_DIRECTOR", "ACCOMMODATION_OFFICER", "MEDIA_TEAM"
    private String actionType; // e.g. "REMIND_PASTORS", "NOTIFY_ACCOMMODATION", "REALLOCATE_DEPOT", "VERIFY_MOMO", "CONFIRM_SPEAKERS"
    private String buttonLabel;
    private Long eventId;
}
