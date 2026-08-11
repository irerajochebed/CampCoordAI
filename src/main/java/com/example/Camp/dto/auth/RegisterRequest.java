package com.example.Camp.dto.auth;

import com.example.Camp.enums.Gender;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    private String phoneNumber;
    
    @NotBlank(message = "Password is required")
    private String password;
    
    @NotNull(message = "Role is required")
    private Role role;
    
    private Position position;
    
    private Gender gender;
    
    private LocalDate dateOfBirth;
    
    private Long organizationUnitId;
    
    private Long districtId;
    
    private String customChurchName;
    
    private String preferredLanguage;
}
