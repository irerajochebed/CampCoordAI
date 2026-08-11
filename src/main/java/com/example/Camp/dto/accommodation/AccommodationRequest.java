package com.example.Camp.dto.accommodation;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccommodationRequest {
    
    @NotBlank(message = "Building name is required")
    private String buildingName;
    
    private String buildingCode;
    
    private String location;
    
    private String description;
}
