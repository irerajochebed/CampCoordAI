package com.example.Camp.service.impl;

import com.example.Camp.dto.accommodation.AccommodationIssueRequest;
import com.example.Camp.dto.accommodation.AccommodationRequest;
import com.example.Camp.dto.accommodation.ParticipantAccommodationResponse;
import com.example.Camp.dto.accommodation.RoomAssignmentRequest;
import com.example.Camp.dto.accommodation.RoomRequest;
import com.example.Camp.entity.*;
import com.example.Camp.enums.NotificationType;
import com.example.Camp.enums.Role;
import com.example.Camp.exception.BadRequestException;
import com.example.Camp.exception.BusinessRuleException;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.*;
import com.example.Camp.service.AccommodationService;
import com.example.Camp.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import com.example.Camp.enums.Gender;
import com.example.Camp.enums.RegistrationStatus;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AccommodationServiceImpl implements AccommodationService {
    
    private final AccommodationRepository accommodationRepository;
    private final RoomRepository roomRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final EventRepository eventRepository;
    private final EventService eventService;
    
    @Override
    public Accommodation createAccommodation(Long eventId, AccommodationRequest request) {
        Event event = eventService.getEventEntity(eventId);
        
        List<Accommodation> existing = accommodationRepository.findActiveByEvent(eventId);
        if (request.getBuildingName() != null && !request.getBuildingName().isBlank()) {
            boolean nameExists = existing.stream()
                    .anyMatch(a -> a.getBuildingName() != null && 
                            a.getBuildingName().trim().equalsIgnoreCase(request.getBuildingName().trim()));
            if (nameExists) {
                throw new BusinessRuleException("An accommodation building with name '" + request.getBuildingName().trim() + "' already exists for this event.");
            }
        }
        if (request.getBuildingCode() != null && !request.getBuildingCode().isBlank()) {
            boolean codeExists = existing.stream()
                    .anyMatch(a -> a.getBuildingCode() != null && 
                            a.getBuildingCode().trim().equalsIgnoreCase(request.getBuildingCode().trim()));
            if (codeExists) {
                throw new BusinessRuleException("An accommodation with building code '" + request.getBuildingCode().trim() + "' already exists for this event.");
            }
        }
        
        Accommodation accommodation = Accommodation.builder()
                .event(event)
                .buildingName(request.getBuildingName().trim())
                .buildingCode(request.getBuildingCode() != null ? request.getBuildingCode().trim().toUpperCase() : null)
                .location(request.getLocation())
                .description(request.getDescription())
                .build();
        
        Accommodation saved = accommodationRepository.save(accommodation);
        log.info("Accommodation created: {} for event {}", saved.getBuildingName(), eventId);
        return saved;
    }
    
    @Override
    public Accommodation updateAccommodation(Long id, AccommodationRequest request) {
        Accommodation accommodation = getAccommodationById(id);
        Long eventId = accommodation.getEvent() != null ? accommodation.getEvent().getId() : null;
        
        if (eventId != null) {
            List<Accommodation> existing = accommodationRepository.findActiveByEvent(eventId);
            if (request.getBuildingName() != null && !request.getBuildingName().isBlank()) {
                boolean nameExists = existing.stream()
                        .anyMatch(a -> !a.getId().equals(id) && a.getBuildingName() != null && 
                                a.getBuildingName().trim().equalsIgnoreCase(request.getBuildingName().trim()));
                if (nameExists) {
                    throw new BusinessRuleException("An accommodation building with name '" + request.getBuildingName().trim() + "' already exists for this event.");
                }
            }
            if (request.getBuildingCode() != null && !request.getBuildingCode().isBlank()) {
                boolean codeExists = existing.stream()
                        .anyMatch(a -> !a.getId().equals(id) && a.getBuildingCode() != null && 
                                a.getBuildingCode().trim().equalsIgnoreCase(request.getBuildingCode().trim()));
                if (codeExists) {
                    throw new BusinessRuleException("An accommodation with building code '" + request.getBuildingCode().trim() + "' already exists for this event.");
                }
            }
        }
        
        accommodation.setBuildingName(request.getBuildingName().trim());
        accommodation.setBuildingCode(request.getBuildingCode() != null ? request.getBuildingCode().trim().toUpperCase() : null);
        accommodation.setLocation(request.getLocation());
        accommodation.setDescription(request.getDescription());
        
        Accommodation saved = accommodationRepository.save(accommodation);
        log.info("Accommodation updated: {}", id);
        return saved;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Accommodation getAccommodationById(Long id) {
        return accommodationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Accommodation", "id", id));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Accommodation> getAccommodationsByEvent(Long eventId) {
        return accommodationRepository.findActiveByEvent(eventId);
    }
    
    @Override
    public void deleteAccommodation(Long id) {
        Accommodation accommodation = getAccommodationById(id);
        accommodation.setDeleted(true);
        accommodationRepository.save(accommodation);
        log.info("Accommodation soft deleted: {}", id);
    }
    
    @Override
    public Room createRoom(Long accommodationId, RoomRequest request) {
        Accommodation accommodation = getAccommodationById(accommodationId);
        
        List<Room> existingRooms = roomRepository.findActiveByAccommodation(accommodationId);
        if (request.getRoomNumber() != null && !request.getRoomNumber().isBlank()) {
            boolean roomExists = existingRooms.stream()
                    .anyMatch(r -> r.getRoomNumber() != null && 
                            r.getRoomNumber().trim().equalsIgnoreCase(request.getRoomNumber().trim()));
            if (roomExists) {
                throw new BusinessRuleException("Room " + request.getRoomNumber().trim() + " already exists in this accommodation building.");
            }
        }
        
        Room room = Room.builder()
                .accommodation(accommodation)
                .roomNumber(request.getRoomNumber().trim())
                .capacity(request.getCapacity())
                .genderRestriction(request.getGenderRestriction())
                .floor(request.getFloor())
                .amenities(request.getAmenities())
                .build();
        
        Room saved = roomRepository.save(room);
        log.info("Room created: {} in accommodation {}", saved.getRoomNumber(), accommodationId);
        return saved;
    }
    
    @Override
    public Room updateRoom(Long id, RoomRequest request) {
        Room room = getRoomById(id);
        Long accId = room.getAccommodation() != null ? room.getAccommodation().getId() : null;
        
        if (accId != null && request.getRoomNumber() != null && !request.getRoomNumber().isBlank()) {
            boolean roomExists = roomRepository.findActiveByAccommodation(accId).stream()
                    .anyMatch(r -> !r.getId().equals(id) && r.getRoomNumber() != null && 
                            r.getRoomNumber().trim().equalsIgnoreCase(request.getRoomNumber().trim()));
            if (roomExists) {
                throw new BusinessRuleException("Room " + request.getRoomNumber().trim() + " already exists in this accommodation building.");
            }
        }
        
        room.setRoomNumber(request.getRoomNumber().trim());
        room.setCapacity(request.getCapacity());
        room.setGenderRestriction(request.getGenderRestriction());
        room.setFloor(request.getFloor());
        room.setAmenities(request.getAmenities());
        
        Room saved = roomRepository.save(room);
        log.info("Room updated: {}", id);
        return saved;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Room getRoomById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Room> getRoomsByAccommodation(Long accommodationId) {
        return roomRepository.findActiveByAccommodation(accommodationId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Room> getAvailableRooms(Long accommodationId) {
        return roomRepository.findAvailableByAccommodation(accommodationId);
    }
    
    @Override
    public void deleteRoom(Long id) {
        Room room = getRoomById(id);
        room.setDeleted(true);
        roomRepository.save(room);
        log.info("Room soft deleted: {}", id);
    }
    
    @Override
    public RoomAssignment assignRoom(RoomAssignmentRequest request) {
        Room room = getRoomById(request.getRoomId());
        Registration registration = registrationRepository.findById(request.getRegistrationId())
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "id", request.getRegistrationId()));
        
        // Check if participant already has room assignment
        if (roomAssignmentRepository.findActiveByRegistration(request.getRegistrationId()).isPresent()) {
            throw new BusinessRuleException("Participant already has a room assignment");
        }
        
        // Check if bed is already occupied
        if (roomAssignmentRepository.findActiveByRoomAndBed(request.getRoomId(), request.getBedNumber()).isPresent()) {
            throw new BusinessRuleException("Bed " + request.getBedNumber() + " is already occupied");
        }
        
        // Check room capacity
        Long occupiedBeds = roomAssignmentRepository.countActiveByRoom(request.getRoomId());
        if (occupiedBeds >= room.getCapacity()) {
            throw new BusinessRuleException("Room is at full capacity");
        }
        
        // Check gender restriction
        Gender participantGender = registration.getParticipant() != null ? registration.getParticipant().getGender() : null;
        if (room.getGenderRestriction() != null && 
            !room.getGenderRestriction().equals(participantGender)) {
            throw new BusinessRuleException("Room gender restriction (" + room.getGenderRestriction() + ") does not match participant gender (" + participantGender + ")");
        }

        // Strict gender separation: verify existing occupants to ensure no mixing
        List<RoomAssignment> activeOccupants = roomAssignmentRepository.findActiveByRoom(request.getRoomId());
        if (participantGender != null && !activeOccupants.isEmpty()) {
            for (RoomAssignment occ : activeOccupants) {
                if (occ.getRegistration() != null && occ.getRegistration().getParticipant() != null) {
                    Gender occGender = occ.getRegistration().getParticipant().getGender();
                    if (occGender != null && !occGender.equals(participantGender)) {
                        throw new BusinessRuleException("Strict gender separation violation: Room already houses " + 
                                occGender + " occupants. Cannot assign " + participantGender + " to the same room.");
                    }
                }
            }
        }
        
        RoomAssignment assignment = RoomAssignment.builder()
                .room(room)
                .registration(registration)
                .bedNumber(request.getBedNumber())
                .checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate())
                .active(true)
                .notes(request.getNotes())
                .build();
        
        RoomAssignment saved = roomAssignmentRepository.save(assignment);
        log.info("Room assigned: Room {} Bed {} to Registration {}", 
                room.getRoomNumber(), request.getBedNumber(), request.getRegistrationId());
        return saved;
    }
    
    @Override
    @Transactional(readOnly = true)
    public RoomAssignment getRoomAssignmentById(Long id) {
        return roomAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RoomAssignment", "id", id));
    }
    
    @Override
    @Transactional(readOnly = true)
    public RoomAssignment getRoomAssignmentByRegistration(Long registrationId) {
        return roomAssignmentRepository.findActiveByRegistration(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("RoomAssignment", "registrationId", registrationId));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RoomAssignment> getRoomAssignmentsByRoom(Long roomId) {
        return roomAssignmentRepository.findActiveByRoom(roomId);
    }
    
    @Override
    public void releaseRoomAssignment(Long id) {
        RoomAssignment assignment = getRoomAssignmentById(id);
        assignment.setActive(false);
        roomAssignmentRepository.save(assignment);
        log.info("Room assignment released: {}", id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long getTotalCapacityByEvent(Long eventId) {
        Long capacity = roomRepository.getTotalCapacityByEvent(eventId);
        return capacity != null ? capacity : 0L;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long getOccupiedBedsByEvent(Long eventId) {
        Long occupied = roomRepository.getOccupiedBedsByEvent(eventId);
        return occupied != null ? occupied : 0L;
    }

    @Override
    public RoomAssignment autoAssignParticipant(Registration registration) {
        if (registration == null || registration.getEvent() == null) {
            return null;
        }

        // Check if registration already has an active room assignment
        if (roomAssignmentRepository.findActiveByRegistration(registration.getId()).isPresent()) {
            return null;
        }

        User participant = registration.getParticipant();
        Gender participantGender = participant != null ? participant.getGender() : null;
        if (participantGender == null) {
            log.warn("Cannot auto-assign room for registration {}: participant has no gender specified", registration.getId());
            return null;
        }

        Long eventId = registration.getEvent().getId();
        List<Room> eventRooms = roomRepository.findByEvent(eventId);
        if (eventRooms == null || eventRooms.isEmpty()) {
            log.info("No accommodation rooms found for event {}", eventId);
            return null;
        }

        // Prioritize rooms:
        // 1. Rooms explicitly designated for participant's gender
        // 2. Unrestricted rooms that already house participant's gender
        // 3. Completely empty unrestricted rooms
        List<Room> candidateRooms = new ArrayList<>();
        
        // Exact gender match first
        for (Room r : eventRooms) {
            if (participantGender.equals(r.getGenderRestriction())) {
                candidateRooms.add(r);
            }
        }
        // Then unrestricted rooms
        for (Room r : eventRooms) {
            if (r.getGenderRestriction() == null && !candidateRooms.contains(r)) {
                candidateRooms.add(r);
            }
        }

        for (Room room : candidateRooms) {
            List<RoomAssignment> activeOccupants = roomAssignmentRepository.findActiveByRoom(room.getId());
            if (activeOccupants.size() >= room.getCapacity()) {
                continue; // room is full
            }

            // Strict gender separation check: ensure NO opposite gender occupant is present
            boolean hasOppositeGender = false;
            for (RoomAssignment occ : activeOccupants) {
                if (occ.getRegistration() != null && occ.getRegistration().getParticipant() != null) {
                    Gender occGender = occ.getRegistration().getParticipant().getGender();
                    if (occGender != null && !occGender.equals(participantGender)) {
                        hasOppositeGender = true;
                        break;
                    }
                }
            }
            if (hasOppositeGender) {
                continue; // Skip room to strictly prevent mixing genders
            }

            // Find lowest available bed number (1 .. capacity)
            Set<String> occupiedBeds = activeOccupants.stream()
                    .map(RoomAssignment::getBedNumber)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            int chosenBed = 1;
            for (int i = 1; i <= room.getCapacity(); i++) {
                if (!occupiedBeds.contains(String.valueOf(i))) {
                    chosenBed = i;
                    break;
                }
            }

            LocalDate checkIn = registration.getEvent().getStartDate() != null ? 
                    registration.getEvent().getStartDate() : LocalDate.now();
            LocalDate checkOut = registration.getEvent().getEndDate();

            RoomAssignment assignment = RoomAssignment.builder()
                    .room(room)
                    .registration(registration)
                    .bedNumber(String.valueOf(chosenBed))
                    .checkInDate(checkIn)
                    .checkOutDate(checkOut)
                    .active(true)
                    .notes("Auto-assigned by gender (" + participantGender + ")")
                    .build();

            RoomAssignment saved = roomAssignmentRepository.save(assignment);

            // If room had no gender restriction, assign it to participantGender to keep it clean
            if (room.getGenderRestriction() == null) {
                room.setGenderRestriction(participantGender);
                roomRepository.save(room);
            }

            log.info("Auto-assigned participant {} ({}) to Event {} Room {} Bed {}", 
                    participant.getEmail(), participantGender, eventId, room.getRoomNumber(), chosenBed);
            return saved;
        }

        log.info("No available room/bed found for event {} with gender {}", eventId, participantGender);
        return null;
    }

    @Override
    public List<RoomAssignment> autoAssignEventParticipants(Long eventId) {
        List<Registration> activeRegistrations = registrationRepository.findActiveByEvent(eventId);
        List<RoomAssignment> newAssignments = new ArrayList<>();

        for (Registration reg : activeRegistrations) {
            if (reg.getStatus() != RegistrationStatus.CANCELLED) {
                if (roomAssignmentRepository.findActiveByRegistration(reg.getId()).isEmpty()) {
                    RoomAssignment ra = autoAssignParticipant(reg);
                    if (ra != null) {
                        newAssignments.add(ra);
                    }
                }
            }
        }
        log.info("Completed auto-assignment for event {}: assigned {} participants", eventId, newAssignments.size());
        return newAssignments;
    }

    @Override
    @Transactional(readOnly = true)
    public ParticipantAccommodationResponse getMyAccommodation(Long currentUserId, Long eventId) {
        List<Registration> registrations = registrationRepository.findActiveByParticipant(currentUserId);

        List<ParticipantAccommodationResponse.EventOptionDto> registeredEvents = registrations.stream()
                .filter(r -> r.getEvent() != null)
                .map(r -> {
                    Event ev = r.getEvent();
                    boolean hasAcc = roomAssignmentRepository.findActiveByRegistration(r.getId()).isPresent();
                    return ParticipantAccommodationResponse.EventOptionDto.builder()
                            .id(ev.getId())
                            .name(ev.getName())
                            .startDate(ev.getStartDate())
                            .endDate(ev.getEndDate())
                            .venue(ev.getVenue())
                            .hasAccommodation(hasAcc)
                            .build();
                })
                .collect(Collectors.toList());

        if (registrations.isEmpty()) {
            return ParticipantAccommodationResponse.builder()
                    .hasAssignment(false)
                    .registeredEvents(Collections.emptyList())
                    .build();
        }

        Registration targetRegistration;
        if (eventId != null) {
            targetRegistration = registrations.stream()
                    .filter(r -> r.getEvent() != null && r.getEvent().getId().equals(eventId))
                    .findFirst()
                    .orElse(registrations.get(0));
        } else {
            targetRegistration = registrations.get(0);
        }

        Event event = targetRegistration.getEvent();
        User coordinator = event != null ? event.getCoordinator() : null;

        Optional<RoomAssignment> assignmentOpt = roomAssignmentRepository.findActiveByRegistration(targetRegistration.getId());

        ParticipantAccommodationResponse.ParticipantAccommodationResponseBuilder builder = ParticipantAccommodationResponse.builder()
                .registeredEvents(registeredEvents)
                .registrationId(targetRegistration.getId())
                .registrationNumber(targetRegistration.getRegistrationNumber());

        if (event != null) {
            builder.eventId(event.getId())
                   .eventName(event.getName())
                   .eventStartDate(event.getStartDate())
                   .eventEndDate(event.getEndDate())
                   .eventVenue(event.getVenue());
        }

        if (coordinator != null) {
            builder.hasCoordinator(true)
                   .coordinatorId(coordinator.getId())
                   .coordinatorName(coordinator.getFirstName() + " " + coordinator.getLastName())
                   .coordinatorEmail(coordinator.getEmail())
                   .coordinatorPhone(coordinator.getPhoneNumber());
        } else {
            builder.hasCoordinator(false);
        }

        if (assignmentOpt.isPresent()) {
            RoomAssignment assignment = assignmentOpt.get();
            Room room = assignment.getRoom();
            Accommodation accommodation = room != null ? room.getAccommodation() : null;

            builder.hasAssignment(true)
                   .assignmentId(assignment.getId())
                   .bedNumber(assignment.getBedNumber())
                   .checkInDate(assignment.getCheckInDate())
                   .checkOutDate(assignment.getCheckOutDate())
                   .active(assignment.getActive())
                   .notes(assignment.getNotes());

            if (room != null) {
                builder.roomId(room.getId())
                       .roomNumber(room.getRoomNumber())
                       .floor(room.getFloor())
                       .capacity(room.getCapacity())
                       .genderRestriction(room.getGenderRestriction())
                       .amenities(room.getAmenities());

                // Find roommates in the same room (excluding current registration)
                List<RoomAssignment> activeRoommates = roomAssignmentRepository.findActiveByRoom(room.getId());
                List<ParticipantAccommodationResponse.RoommateDto> roommates = activeRoommates.stream()
                        .filter(ra -> ra != null && !ra.getId().equals(assignment.getId()) && ra.getRegistration() != null)
                        .map(ra -> {
                            User part = ra.getRegistration().getParticipant();
                            String name = part != null ? (part.getFirstName() + " " + part.getLastName()) : "Participant";
                            String church = (part != null && part.getOrganizationUnit() != null) ? part.getOrganizationUnit().getName() : "";
                            return ParticipantAccommodationResponse.RoommateDto.builder()
                                    .id(ra.getId())
                                    .name(name)
                                    .bedNumber(ra.getBedNumber())
                                    .gender(part != null ? part.getGender() : null)
                                    .churchName(church)
                                    .build();
                        })
                        .collect(Collectors.toList());
                builder.roommates(roommates);
            }

            if (accommodation != null) {
                builder.accommodationId(accommodation.getId())
                       .buildingName(accommodation.getBuildingName())
                       .buildingCode(accommodation.getBuildingCode())
                       .location(accommodation.getLocation());
            }
        } else {
            builder.hasAssignment(false);
        }

        return builder.build();
    }

    @Override
    public void reportAccommodationIssue(Long currentUserId, AccommodationIssueRequest request) {
        User participant = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", request.getEventId()));

        Optional<Registration> regOpt = registrationRepository.findActiveByParticipant(currentUserId).stream()
                .filter(r -> r.getEvent() != null && r.getEvent().getId().equals(event.getId()))
                .findFirst();

        String currentRoomInfo = "Not assigned yet";
        if (regOpt.isPresent()) {
            Optional<RoomAssignment> raOpt = roomAssignmentRepository.findActiveByRegistration(regOpt.get().getId());
            if (raOpt.isPresent()) {
                Room room = raOpt.get().getRoom();
                String bName = (room != null && room.getAccommodation() != null) ? room.getAccommodation().getBuildingName() : "Main";
                String rNum = room != null ? room.getRoomNumber() : "?";
                currentRoomInfo = bName + " - Room " + rNum + " (Bed " + raOpt.get().getBedNumber() + ")";
            }
        }

        // Determine recipient: Coordinator in charge, or if none, System Admin ONLY!
        User coordinator = event.getCoordinator();
        List<User> recipients = new ArrayList<>();

        if (coordinator != null) {
            recipients.add(coordinator);
        } else {
            // Event has NO coordinator in charge -> communicate to System Admin ONLY!
            List<User> admins = userRepository.findActiveByRole(Role.ADMINISTRATOR);
            recipients.addAll(admins);
        }

        if (recipients.isEmpty()) {
            throw new BusinessRuleException("No event coordinator or system administrator found to receive the accommodation request.");
        }

        String participantFullName = participant.getFirstName() + " " + participant.getLastName();
        String title = "Accommodation Request: " + request.getIssueType().replace("_", " ") + " - " + participantFullName;

        StringBuilder msg = new StringBuilder();
        msg.append("Accommodation request from participant: ").append(participantFullName)
           .append(" (").append(participant.getEmail());
        if (participant.getPhoneNumber() != null && !participant.getPhoneNumber().isBlank()) {
            msg.append(", ").append(participant.getPhoneNumber());
        }
        msg.append(")\n");
        msg.append("Event: ").append(event.getName()).append("\n");
        msg.append("Current Location / Bed: ").append(currentRoomInfo).append("\n");
        msg.append("Issue Category: ").append(request.getIssueType()).append("\n");
        if (request.getPreferredRoomOrBed() != null && !request.getPreferredRoomOrBed().isBlank()) {
            msg.append("Preferred Switch / Need: ").append(request.getPreferredRoomOrBed().trim()).append("\n");
        }
        if (request.getContactPhone() != null && !request.getContactPhone().isBlank()) {
            msg.append("Contact Phone: ").append(request.getContactPhone().trim()).append("\n");
        }
        msg.append("Details: ").append(request.getDetails().trim());

        for (User targetUser : recipients) {
            Notification notification = Notification.builder()
                    .sender(participant)
                    .recipient(targetUser)
                    .event(event)
                    .type(NotificationType.ACCOMMODATION_NOTICE)
                    .title(title)
                    .message(msg.toString())
                    .actionUrl("/app/accommodation")
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }

        log.info("Accommodation issue recorded by participant {} for event {}. Recipient count: {}", 
                currentUserId, event.getId(), recipients.size());
    }
}
