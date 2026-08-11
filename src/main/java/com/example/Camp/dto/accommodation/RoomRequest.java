package com.example.Camp.dto.accommodation;

import com.example.Camp.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomRequest {
    
    @NotBlank(message = "Room number is required")
    private String roomNumber;
    
    @NotNull(message = "Capacity is required")
    private Integer capacity;
    
    private Gender genderRestriction;
    
    private String floor;
    
    private String amenities;
}
