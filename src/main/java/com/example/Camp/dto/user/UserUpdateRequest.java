package com.example.Camp.dto.user;

import com.example.Camp.enums.Gender;
import com.example.Camp.enums.Position;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private Position position;
    private Long departmentId;
    private String governmentDistrict;
    private String sdaDistrict;
    private Gender gender;
    @jakarta.validation.constraints.Past(message = "Date of birth cannot be in the future")
    private LocalDate dateOfBirth;
    private String profileImageUrl;
    private String preferredLanguage;
}
