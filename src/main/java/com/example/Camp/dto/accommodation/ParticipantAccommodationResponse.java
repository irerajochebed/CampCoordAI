package com.example.Camp.dto.accommodation;

import com.example.Camp.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipantAccommodationResponse {
    
    private boolean hasAssignment;
    private Long assignmentId;
    private Long registrationId;
    private String registrationNumber;
    
    // Event details
    private Long eventId;
    private String eventName;
    private LocalDate eventStartDate;
    private LocalDate eventEndDate;
    private String eventVenue;
    
    // Coordinator in charge
    private boolean hasCoordinator;
    private Long coordinatorId;
    private String coordinatorName;
    private String coordinatorEmail;
    private String coordinatorPhone;
    
    // Accommodation & Room details (where participant is located)
    private Long accommodationId;
    private String buildingName;
    private String buildingCode;
    private String location;
    private Long roomId;
    private String roomNumber;
    private String floor;
    private String bedNumber;
    private Integer capacity;
    private Gender genderRestriction;
    private String amenities;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Boolean active;
    private String notes;
    
    // Roommates info (others occupying the same room)
    @Builder.Default
    private List<RoommateDto> roommates = new ArrayList<>();
    
    // All events the participant is registered for
    @Builder.Default
    private List<EventOptionDto> registeredEvents = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoommateDto {
        private Long id;
        private String name;
        private String bedNumber;
        private Gender gender;
        private String churchName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EventOptionDto {
        private Long id;
        private String name;
        private LocalDate startDate;
        private LocalDate endDate;
        private String venue;
        private boolean hasAccommodation;
    }
}
