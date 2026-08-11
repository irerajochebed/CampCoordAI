package com.example.Camp.repository;

import com.example.Camp.entity.Accommodation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccommodationRepository extends JpaRepository<Accommodation, Long> {
    
    List<Accommodation> findByEventId(Long eventId);
    
    Optional<Accommodation> findByEventIdAndBuildingCode(Long eventId, String buildingCode);
    
    @Query("SELECT a FROM Accommodation a WHERE a.deleted = false AND a.event.id = :eventId")
    List<Accommodation> findActiveByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT COUNT(a) FROM Accommodation a WHERE a.deleted = false AND a.event.id = :eventId")
    Long countByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT a FROM Accommodation a WHERE a.deleted = false AND " +
           "LOWER(a.buildingName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Accommodation> searchByBuildingName(@Param("keyword") String keyword);
}
