package com.example.Camp.dto.event;

import com.example.Camp.enums.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventRequest {
    
    @NotBlank(message = "Event name is required")
    private String name;
    
    @NotNull(message = "Event type is required")
    private EventType type;
    
    private String description;
    
    @NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    private LocalDate endDate;
    
    @NotBlank(message = "Venue is required")
    private String venue;
    
    private String venueAddress;
    
    private BigDecimal registrationFee;
    
    private LocalDate registrationStartDate;
    
    private LocalDate registrationEndDate;
    
    private Integer maxParticipants;
    
    private BigDecimal budget;
}
