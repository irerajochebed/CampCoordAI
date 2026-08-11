package com.example.Camp.repository;

import com.example.Camp.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    
    List<Attendance> findBySessionId(Long sessionId);
    
    List<Attendance> findByRegistrationId(Long registrationId);
    
    @Query("SELECT a FROM Attendance a WHERE a.deleted = false AND a.session.id = :sessionId")
    List<Attendance> findActiveBySession(@Param("sessionId") Long sessionId);
    
    @Query("SELECT a FROM Attendance a WHERE a.deleted = false AND a.registration.id = :registrationId")
    List<Attendance> findActiveByRegistration(@Param("registrationId") Long registrationId);
    
    @Query("SELECT a FROM Attendance a WHERE a.deleted = false AND " +
           "a.session.event.id = :eventId")
    List<Attendance> findByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT a FROM Attendance a WHERE a.deleted = false AND " +
           "a.session.id = :sessionId AND a.registration.id = :registrationId")
    Optional<Attendance> findBySessionAndRegistration(@Param("sessionId") Long sessionId, 
                                                      @Param("registrationId") Long registrationId);
    
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.deleted = false AND a.session.id = :sessionId")
    Long countBySession(@Param("sessionId") Long sessionId);
    
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.deleted = false AND " +
           "a.session.event.id = :eventId AND a.registration.id = :registrationId")
    Long countByEventAndRegistration(@Param("eventId") Long eventId, @Param("registrationId") Long registrationId);
    
    @Query("SELECT a FROM Attendance a WHERE a.deleted = false AND " +
           "a.checkInTime >= :startTime AND a.checkInTime <= :endTime")
    List<Attendance> findByTimeRange(@Param("startTime") LocalDateTime startTime, 
                                    @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT a FROM Attendance a WHERE a.deleted = false AND " +
           "a.session.event.id = :eventId AND " +
           "a.registration.participant.organizationUnit.id = :organizationUnitId")
    List<Attendance> findByEventAndOrganizationUnit(@Param("eventId") Long eventId, 
                                                    @Param("organizationUnitId") Long organizationUnitId);
}
