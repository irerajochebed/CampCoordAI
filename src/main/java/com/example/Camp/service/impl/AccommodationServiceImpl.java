package com.example.Camp.service.impl;

import com.example.Camp.dto.accommodation.AccommodationRequest;
import com.example.Camp.dto.accommodation.RoomAssignmentRequest;
import com.example.Camp.dto.accommodation.RoomRequest;
import com.example.Camp.entity.*;
import com.example.Camp.exception.BadRequestException;
import com.example.Camp.exception.BusinessRuleException;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.AccommodationRepository;
import com.example.Camp.repository.RegistrationRepository;
import com.example.Camp.repository.RoomAssignmentRepository;
import com.example.Camp.repository.RoomRepository;
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
}
