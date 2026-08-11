package com.example.Camp.repository;

import com.example.Camp.entity.Event;
import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    Optional<Event> findByEventCode(String eventCode);
    
    List<Event> findByStatus(EventStatus status);
    
    List<Event> findByType(EventType type);
    
    List<Event> findByCoordinatorId(Long coordinatorId);
    
    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.status = :status")
    List<Event> findActiveByStatus(@Param("status") EventStatus status);
    
    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.type = :type")
    List<Event> findActiveByType(@Param("type") EventType type);
    
    @Query("SELECT e FROM Event e WHERE e.deleted = false AND e.coordinator.id = :coordinatorId")
    List<Event> findActiveByCoordinator(@Param("coordinatorId") Long coordinatorId);
    
    @Query("SELECT e FROM Event e WHERE e.deleted = false AND " +
           "e.startDate >= :startDate AND e.endDate <= :endDate")
    List<Event> findByDateRange(@Param("startDate") LocalDate startDate, 
                                @Param("endDate") LocalDate endDate);
    
    @Query("SELECT e FROM Event e WHERE e.deleted = false AND " +
           "e.status = 'REGISTRATION_OPEN' AND " +
           "e.registrationStartDate <= :today AND e.registrationEndDate >= :today")
    List<Event> findOpenForRegistration(@Param("today") LocalDate today);
    
    @Query("SELECT e FROM Event e WHERE e.deleted = false AND " +
           "e.status = 'ONGOING' AND e.startDate <= :today AND e.endDate >= :today")
    List<Event> findOngoingEvents(@Param("today") LocalDate today);
    
    @Query("SELECT e FROM Event e WHERE e.deleted = false AND " +
           "e.startDate > :today ORDER BY e.startDate ASC")
    List<Event> findUpcomingEvents(@Param("today") LocalDate today);
    
    @Query("SELECT COUNT(e) FROM Event e WHERE e.deleted = false AND e.status = :status")
    Long countByStatus(@Param("status") EventStatus status);
    
    @Query("SELECT e FROM Event e WHERE e.deleted = false AND " +
           "LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> searchByName(@Param("keyword") String keyword);
    
    boolean existsByEventCode(String eventCode);
}
