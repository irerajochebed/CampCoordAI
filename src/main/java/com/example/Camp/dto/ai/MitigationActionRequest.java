package com.example.Camp.dto.ai;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MitigationActionRequest {
    @NotNull(message = "Event ID is required")
    private Long eventId;

    @NotNull(message = "Action type is required")
    private String actionType; // "REMIND_PASTORS", "NOTIFY_ACCOMMODATION", "REALLOCATE_DEPOT", "VERIFY_MOMO", "CONFIRM_SPEAKERS"

    private String targetRole;
    private String customMessage;
}
