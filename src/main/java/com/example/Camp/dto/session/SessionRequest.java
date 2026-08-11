package com.example.Camp.dto.session;

import com.example.Camp.enums.SessionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotNull(message = "Session type is required")
    private SessionType type;
    
    private String description;
    
    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;
    
    @NotNull(message = "End time is required")
    private LocalDateTime endTime;
    
    private String venue;
    
    private Long speakerId;
    
    private Integer maxAttendees;
}
