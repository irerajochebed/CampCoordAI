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

import java.util.List;

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
        
        Accommodation accommodation = Accommodation.builder()
                .event(event)
                .buildingName(request.getBuildingName())
                .buildingCode(request.getBuildingCode())
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
        
        accommodation.setBuildingName(request.getBuildingName());
        accommodation.setBuildingCode(request.getBuildingCode());
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
        
        Room room = Room.builder()
                .accommodation(accommodation)
                .roomNumber(request.getRoomNumber())
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
        
        room.setRoomNumber(request.getRoomNumber());
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
        if (room.getGenderRestriction() != null && 
            !room.getGenderRestriction().equals(registration.getParticipant().getGender())) {
            throw new BusinessRuleException("Room gender restriction does not match participant gender");
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
}
