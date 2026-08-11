package com.example.Camp.dto.registration;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationRequest {
    
    @NotNull(message = "Event ID is required")
    private Long eventId;
    
    @NotNull(message = "Participant ID is required")
    private Long participantId;
    
    private String specialRequirements;
    
    private String emergencyContactName;
    
    private String emergencyContactPhone;
}
