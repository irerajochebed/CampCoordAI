package com.example.Camp.dto.payment;

import com.example.Camp.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MomoInitiateRequest {
    
    @NotNull(message = "Registration ID is required")
    private Long registrationId;
    
    @NotBlank(message = "Phone number is required (e.g. 0788123456)")
    private String phoneNumber;
    
    @NotNull(message = "Amount is required")
    private BigDecimal amount;
    
    @Builder.Default
    private String provider = "MTN"; // "MTN" or "AIRTEL"
    
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.MOBILE_MONEY;
}
