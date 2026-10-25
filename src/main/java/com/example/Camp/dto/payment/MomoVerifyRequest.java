package com.example.Camp.dto.payment;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MomoVerifyRequest {
    
    @NotBlank(message = "Transaction reference is required")
    private String transactionReference;
    
    private String momoPin;
    
    @Builder.Default
    private boolean approved = true;
}
