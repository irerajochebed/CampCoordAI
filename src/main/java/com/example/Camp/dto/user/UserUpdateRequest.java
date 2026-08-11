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
    private String phoneNumber;
    private Position position;
    private Gender gender;
    private LocalDate dateOfBirth;
    private String profileImageUrl;
    private String preferredLanguage;
}
