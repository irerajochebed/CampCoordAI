package com.example.Camp.controller;

import com.example.Camp.dto.accommodation.AccommodationRequest;
import com.example.Camp.dto.accommodation.RoomAssignmentRequest;
import com.example.Camp.dto.accommodation.RoomRequest;
import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.entity.Accommodation;
import com.example.Camp.entity.Room;
import com.example.Camp.entity.RoomAssignment;
import com.example.Camp.service.AccommodationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accommodations")
@RequiredArgsConstructor
public class AccommodationController {
    
    private final AccommodationService accommodationService;
    
    @PostMapping("/event/{eventId}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<Accommodation>> createAccommodation(
            @PathVariable Long eventId,
            @Valid @RequestBody AccommodationRequest request) {
        Accommodation accommodation = accommodationService.createAccommodation(eventId, request);
        return ResponseEntity.ok(ApiResponse.success("Accommodation created successfully", accommodation));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<Accommodation>> updateAccommodation(
            @PathVariable Long id,
            @Valid @RequestBody AccommodationRequest request) {
        Accommodation accommodation = accommodationService.updateAccommodation(id, request);
        return ResponseEntity.ok(ApiResponse.success("Accommodation updated successfully", accommodation));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Accommodation>> getAccommodationById(@PathVariable Long id) {
        Accommodation accommodation = accommodationService.getAccommodationById(id);
        return ResponseEntity.ok(ApiResponse.success(accommodation));
    }
    
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<List<Accommodation>>> getAccommodationsByEvent(@PathVariable Long eventId) {
        List<Accommodation> accommodations = accommodationService.getAccommodationsByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success(accommodations));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deleteAccommodation(@PathVariable Long id) {
        accommodationService.deleteAccommodation(id);
        return ResponseEntity.ok(ApiResponse.success("Accommodation deleted successfully", null));
    }
    
    // Room endpoints
    @PostMapping("/{accommodationId}/rooms")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<Room>> createRoom(
            @PathVariable Long accommodationId,
            @Valid @RequestBody RoomRequest request) {
        Room room = accommodationService.createRoom(accommodationId, request);
        return ResponseEntity.ok(ApiResponse.success("Room created successfully", room));
    }
    
    @PutMapping("/rooms/{id}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<Room>> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody RoomRequest request) {
        Room room = accommodationService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponse.success("Room updated successfully", room));
    }
    
    @GetMapping("/rooms/{id}")
    public ResponseEntity<ApiResponse<Room>> getRoomById(@PathVariable Long id) {
        Room room = accommodationService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.success(room));
    }
    
    @GetMapping("/{accommodationId}/rooms")
    public ResponseEntity<ApiResponse<List<Room>>> getRoomsByAccommodation(@PathVariable Long accommodationId) {
        List<Room> rooms = accommodationService.getRoomsByAccommodation(accommodationId);
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }
    
    @GetMapping("/{accommodationId}/rooms/available")
    public ResponseEntity<ApiResponse<List<Room>>> getAvailableRooms(@PathVariable Long accommodationId) {
        List<Room> rooms = accommodationService.getAvailableRooms(accommodationId);
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }
    
    @DeleteMapping("/rooms/{id}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deleteRoom(@PathVariable Long id) {
        accommodationService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Room deleted successfully", null));
    }
    
    // Room assignment endpoints
    @PostMapping("/assign")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<RoomAssignment>> assignRoom(
            @Valid @RequestBody RoomAssignmentRequest request) {
        RoomAssignment assignment = accommodationService.assignRoom(request);
        return ResponseEntity.ok(ApiResponse.success("Room assigned successfully", assignment));
    }
    
    @GetMapping("/assignments/{id}")
    public ResponseEntity<ApiResponse<RoomAssignment>> getRoomAssignmentById(@PathVariable Long id) {
        RoomAssignment assignment = accommodationService.getRoomAssignmentById(id);
        return ResponseEntity.ok(ApiResponse.success(assignment));
    }
    
    @GetMapping("/assignments/registration/{registrationId}")
    public ResponseEntity<ApiResponse<RoomAssignment>> getRoomAssignmentByRegistration(
            @PathVariable Long registrationId) {
        RoomAssignment assignment = accommodationService.getRoomAssignmentByRegistration(registrationId);
        return ResponseEntity.ok(ApiResponse.success(assignment));
    }
    
    @GetMapping("/rooms/{roomId}/assignments")
    public ResponseEntity<ApiResponse<List<RoomAssignment>>> getRoomAssignmentsByRoom(@PathVariable Long roomId) {
        List<RoomAssignment> assignments = accommodationService.getRoomAssignmentsByRoom(roomId);
        return ResponseEntity.ok(ApiResponse.success(assignments));
    }
    
    @PatchMapping("/assignments/{id}/release")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> releaseRoomAssignment(@PathVariable Long id) {
        accommodationService.releaseRoomAssignment(id);
        return ResponseEntity.ok(ApiResponse.success("Room assignment released", null));
    }
    
    @GetMapping("/event/{eventId}/capacity")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getEventCapacity(@PathVariable Long eventId) {
        Long totalCapacity = accommodationService.getTotalCapacityByEvent(eventId);
        Long occupied = accommodationService.getOccupiedBedsByEvent(eventId);
        Long available = totalCapacity - occupied;
        
        Map<String, Long> capacity = Map.of(
                "totalCapacity", totalCapacity,
                "occupied", occupied,
                "available", available
        );
        
        return ResponseEntity.ok(ApiResponse.success(capacity));
    }
}
