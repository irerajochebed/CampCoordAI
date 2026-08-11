package com.example.Camp.dto.accommodation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomAssignmentRequest {
    
    @NotNull(message = "Room ID is required")
    private Long roomId;
    
    @NotNull(message = "Registration ID is required")
    private Long registrationId;
    
    @NotBlank(message = "Bed number is required")
    private String bedNumber;
    
    @NotNull(message = "Check-in date is required")
    private LocalDate checkInDate;
    
    private LocalDate checkOutDate;
    
    private String notes;
}
