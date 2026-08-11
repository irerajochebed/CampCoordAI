package com.example.Camp.repository;

import com.example.Camp.entity.Room;
import com.example.Camp.enums.Gender;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    
    List<Room> findByAccommodationId(Long accommodationId);
    
    Optional<Room> findByAccommodationIdAndRoomNumber(Long accommodationId, String roomNumber);
    
    @Query("SELECT r FROM Room r WHERE r.deleted = false AND r.accommodation.id = :accommodationId")
    List<Room> findActiveByAccommodation(@Param("accommodationId") Long accommodationId);
    
    @Query("SELECT r FROM Room r WHERE r.deleted = false AND " +
           "r.accommodation.event.id = :eventId")
    List<Room> findByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT r FROM Room r WHERE r.deleted = false AND " +
           "r.accommodation.event.id = :eventId AND r.genderRestriction = :gender")
    List<Room> findByEventAndGender(@Param("eventId") Long eventId, @Param("gender") Gender gender);
    
    @Query("SELECT r FROM Room r LEFT JOIN r.assignments a WHERE r.deleted = false AND " +
           "r.accommodation.id = :accommodationId AND " +
           "r.capacity > (SELECT COUNT(ra) FROM RoomAssignment ra WHERE ra.room.id = r.id AND ra.active = true AND ra.deleted = false)")
    List<Room> findAvailableByAccommodation(@Param("accommodationId") Long accommodationId);
    
    @Query("SELECT SUM(r.capacity) FROM Room r WHERE r.deleted = false AND " +
           "r.accommodation.event.id = :eventId")
    Long getTotalCapacityByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT COUNT(ra) FROM RoomAssignment ra WHERE ra.deleted = false AND " +
           "ra.room.accommodation.event.id = :eventId AND ra.active = true")
    Long getOccupiedBedsByEvent(@Param("eventId") Long eventId);
}
