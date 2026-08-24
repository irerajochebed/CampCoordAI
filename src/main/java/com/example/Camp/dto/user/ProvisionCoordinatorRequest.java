package com.example.Camp.dto.user;

import com.example.Camp.enums.Gender;
import com.example.Camp.enums.Position;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProvisionCoordinatorRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    private String phoneNumber;

    @NotNull(message = "Position is required")
    private Position position;

    @NotNull(message = "Organization unit ID is required")
    private Long organizationUnitId;

    /**
     * Optional initial password. If null or blank, the system assigns default credentials (Coord@2026).
     */
    private String password;

    private Gender gender;

    @Builder.Default
    private String preferredLanguage = "en";
}
