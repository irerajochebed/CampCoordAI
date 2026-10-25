package com.example.Camp.dto.payment;

import com.example.Camp.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MomoInitiateResponse {
    
    private Long paymentId;
    private Long registrationId;
    private String registrationNumber;
    private String eventName;
    private String transactionReference;
    private BigDecimal amount;
    private String phoneNumber;
    private String provider; // "MTN" or "AIRTEL"
    private PaymentStatus status;
    private String message;
    private String ussdInstruction;
    private boolean simulated;
    private LocalDateTime initiatedAt;
}
