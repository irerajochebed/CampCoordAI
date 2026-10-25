package com.example.Camp.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MitigationActionResponse {
    private boolean success;
    private String message;
    private String actionType;
    private Long eventId;
    private String eventName;
    private int recipientsNotifiedCount;
    private List<String> notifiedStakeholders;
    private LocalDateTime timestamp;
}
