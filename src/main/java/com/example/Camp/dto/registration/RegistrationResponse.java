package com.example.Camp.dto.registration;

import com.example.Camp.dto.event.EventResponse;
import com.example.Camp.dto.payment.PaymentResponse;
import com.example.Camp.enums.RegistrationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    private LocalDate eventStartDate;
    private LocalDate eventEndDate;
    private String eventVenue;
    private BigDecimal eventRegistrationFee;
    private EventResponse event;
    
    private Long participantId;
    private String participantName;
    private String participantFirstName;
    private String participantLastName;
    private String participantEmail;
    private String participantPhone;
    private com.example.Camp.enums.Gender participantGender;
    private String gender;
    private String churchName;
    
    private RegistrationStatus status;
    private String specialRequirements;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String qrCode;
    private LocalDateTime checkedInAt;
    private LocalDateTime checkedOutAt;
    private String roomDetails;
    private LocalDateTime createdAt;
    private LocalDateTime registrationDate;
    
    private PaymentResponse payment;
}

