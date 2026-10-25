package com.example.Camp.dto.registration;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationRequest {
    
    @NotNull(message = "Event ID is required")
    private Long eventId;
    
    private Long participantId;
    
    private String participantFirstName;
    
    private String participantLastName;
    
    private String participantEmail;
    
    private String participantPhone;
    
    private String specialRequirements;
    
    private String emergencyContactName;
    
    private String emergencyContactPhone;
}

