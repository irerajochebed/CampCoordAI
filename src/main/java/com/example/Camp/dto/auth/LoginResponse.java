package com.example.Camp.dto.auth;

import com.example.Camp.enums.Gender;
import com.example.Camp.enums.OrganizationLevel;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private Long userId;
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Role role;
    private Position position;
    private Gender gender;
    private LocalDate dateOfBirth;
    private Long organizationUnitId;
    private String organizationUnitName;
    private OrganizationLevel organizationLevel;
    private Long departmentId;
    private String departmentName;
    private String governmentDistrict;
    private String sdaDistrict;
    private String profileImageUrl;
    private String preferredLanguage;
}
