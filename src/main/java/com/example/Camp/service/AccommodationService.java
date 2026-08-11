package com.example.Camp.service;

import com.example.Camp.dto.accommodation.AccommodationRequest;
import com.example.Camp.dto.accommodation.RoomAssignmentRequest;
import com.example.Camp.dto.accommodation.RoomRequest;
import com.example.Camp.entity.Accommodation;
import com.example.Camp.entity.Room;
import com.example.Camp.entity.RoomAssignment;

import java.util.List;

public interface AccommodationService {
    
    Accommodation createAccommodation(Long eventId, AccommodationRequest request);
    
    Accommodation updateAccommodation(Long id, AccommodationRequest request);
    
    Accommodation getAccommodationById(Long id);
    
    List<Accommodation> getAccommodationsByEvent(Long eventId);
    
    void deleteAccommodation(Long id);
    
    Room createRoom(Long accommodationId, RoomRequest request);
    
    Room updateRoom(Long id, RoomRequest request);
    
    Room getRoomById(Long id);
    
    List<Room> getRoomsByAccommodation(Long accommodationId);
    
    List<Room> getAvailableRooms(Long accommodationId);
    
    void deleteRoom(Long id);
    
    RoomAssignment assignRoom(RoomAssignmentRequest request);
    
    RoomAssignment getRoomAssignmentById(Long id);
    
    RoomAssignment getRoomAssignmentByRegistration(Long registrationId);
    
    List<RoomAssignment> getRoomAssignmentsByRoom(Long roomId);
    
    void releaseRoomAssignment(Long id);
    
    Long getTotalCapacityByEvent(Long eventId);
    
    Long getOccupiedBedsByEvent(Long eventId);
}
