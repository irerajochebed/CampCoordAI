package com.example.Camp.repository;

import com.example.Camp.entity.EventAssignment;
import com.example.Camp.enums.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventAssignmentRepository extends JpaRepository<EventAssignment, Long> {
    
    List<EventAssignment> findByEventId(Long eventId);
    
    List<EventAssignment> findByUserId(Long userId);
    
    List<EventAssignment> findByEventIdAndPosition(Long eventId, Position position);
    
    @Query("SELECT ea FROM EventAssignment ea WHERE ea.deleted = false AND " +
           "ea.event.id = :eventId AND ea.active = true")
    List<EventAssignment> findActiveByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT ea FROM EventAssignment ea WHERE ea.deleted = false AND " +
           "ea.user.id = :userId AND ea.active = true")
    List<EventAssignment> findActiveByUser(@Param("userId") Long userId);
    
    @Query("SELECT ea FROM EventAssignment ea WHERE ea.deleted = false AND " +
           "ea.event.id = :eventId AND ea.position = :position AND ea.active = true")
    Optional<EventAssignment> findActiveByEventAndPosition(@Param("eventId") Long eventId, 
                                                           @Param("position") Position position);
    
    @Query("SELECT ea FROM EventAssignment ea WHERE ea.deleted = false AND " +
           "ea.event.id = :eventId AND ea.user.id = :userId AND ea.active = true")
    Optional<EventAssignment> findActiveByEventAndUser(@Param("eventId") Long eventId, 
                                                       @Param("userId") Long userId);
}
