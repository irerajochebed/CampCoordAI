package com.example.Camp.dto.event;

import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.EventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {
    
    private Long id;
    private String eventCode;
    private String name;
    private EventType type;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String venue;
    private String venueAddress;
    private EventStatus status;
    private BigDecimal registrationFee;
    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;
    private Integer maxParticipants;
    private BigDecimal budget;
    private Long coordinatorId;
    private String coordinatorName;
    private Long totalRegistrations;
    private Long confirmedRegistrations;
}
