package com.example.Camp.repository;

import com.example.Camp.entity.RoomAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomAssignmentRepository extends JpaRepository<RoomAssignment, Long> {
    
    List<RoomAssignment> findByRoomId(Long roomId);
    
    List<RoomAssignment> findByRegistrationId(Long registrationId);
    
    @Query("SELECT ra FROM RoomAssignment ra WHERE ra.deleted = false AND " +
           "ra.room.id = :roomId AND ra.active = true")
    List<RoomAssignment> findActiveByRoom(@Param("roomId") Long roomId);
    
    @Query("SELECT ra FROM RoomAssignment ra WHERE ra.deleted = false AND " +
           "ra.registration.id = :registrationId AND ra.active = true")
    Optional<RoomAssignment> findActiveByRegistration(@Param("registrationId") Long registrationId);
    
    @Query("SELECT ra FROM RoomAssignment ra WHERE ra.deleted = false AND " +
           "ra.room.accommodation.event.id = :eventId")
    List<RoomAssignment> findByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT COUNT(ra) FROM RoomAssignment ra WHERE ra.deleted = false AND " +
           "ra.room.id = :roomId AND ra.active = true")
    Long countActiveByRoom(@Param("roomId") Long roomId);
    
    @Query("SELECT ra FROM RoomAssignment ra WHERE ra.deleted = false AND " +
           "ra.room.id = :roomId AND ra.bedNumber = :bedNumber AND ra.active = true")
    Optional<RoomAssignment> findActiveByRoomAndBed(@Param("roomId") Long roomId, 
                                                    @Param("bedNumber") String bedNumber);
}
