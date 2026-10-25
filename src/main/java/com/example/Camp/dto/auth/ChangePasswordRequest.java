package com.example.Camp.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {
    
    private Long userId;
    
    @NotBlank(message = "Current password is required")
    private String oldPassword;
    
    @NotBlank(message = "New password is required")
    private String newPassword;
}
