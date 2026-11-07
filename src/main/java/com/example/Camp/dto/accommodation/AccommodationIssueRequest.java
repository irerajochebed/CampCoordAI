package com.example.Camp.dto.accommodation;

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
public class AccommodationIssueRequest {
    
    @NotNull(message = "Event ID is required")
    private Long eventId;
    
    @NotBlank(message = "Issue type is required")
    private String issueType; // e.g., ROOM_SWITCH, ACCESSIBILITY, MAINTENANCE, ROOMMATE_CONFLICT, OTHER
    
    @NotBlank(message = "Issue details are required")
    private String details;
    
    private String preferredRoomOrBed;
    
    private String contactPhone;
}
