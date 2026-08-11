package com.example.Camp.dto.attendance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QRScanRequest {
    
    @NotBlank(message = "QR code is required")
    private String qrCode;
    
    @NotNull(message = "Session ID is required")
    private Long sessionId;
    
    private String notes;
}
