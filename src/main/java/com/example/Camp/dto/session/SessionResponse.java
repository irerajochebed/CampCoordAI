package com.example.Camp.dto.session;

import com.example.Camp.enums.SessionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionResponse {
    
    private Long id;
    private Long eventId;
    private String eventName;
    private String title;
    private SessionType type;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String venue;
    private Long speakerId;
    private String speakerName;
    private Integer maxAttendees;
    private Long attendanceCount;
}
