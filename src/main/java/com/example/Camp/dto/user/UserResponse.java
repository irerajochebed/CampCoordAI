package com.example.Camp.dto.user;

import com.example.Camp.enums.Gender;
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
public class UserResponse {
    
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private Role role;
    private Position position;
    private Gender gender;
    private LocalDate dateOfBirth;
    private Long organizationUnitId;
    private String organizationUnitName;
    private Boolean active;
    private String profileImageUrl;
    private String preferredLanguage;
}
