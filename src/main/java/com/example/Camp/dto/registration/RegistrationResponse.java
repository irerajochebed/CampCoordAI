package com.example.Camp.dto.registration;

import com.example.Camp.enums.RegistrationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationResponse {
    
    private Long id;
    private String registrationNumber;
    private Long eventId;
    private String eventName;
    private Long participantId;
    private String participantName;
    private String participantEmail;
    private String participantPhone;
    private String churchName;
    private RegistrationStatus status;
    private String specialRequirements;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String qrCode;
    private LocalDateTime checkedInAt;
    private String roomDetails;
    private LocalDateTime createdAt;
}
