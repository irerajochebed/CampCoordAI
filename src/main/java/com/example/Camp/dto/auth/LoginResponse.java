package com.example.Camp.dto.auth;

import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
    private Position position;
    private Long organizationUnitId;
    private String organizationUnitName;
    private String preferredLanguage;
}
