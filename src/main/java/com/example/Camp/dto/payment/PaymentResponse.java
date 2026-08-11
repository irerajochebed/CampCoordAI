package com.example.Camp.dto.payment;

import com.example.Camp.enums.PaymentMethod;
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
public class PaymentResponse {
    
    private Long id;
    private String transactionReference;
    private Long registrationId;
    private String participantName;
    private String eventName;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private LocalDateTime paidAt;
    private Long verifiedById;
    private String verifiedByName;
    private LocalDateTime verifiedAt;
    private String notes;
    private String receiptUrl;
}
