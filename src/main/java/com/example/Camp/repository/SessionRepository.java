package com.example.Camp.repository;

import com.example.Camp.entity.Session;
import com.example.Camp.enums.SessionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    
    List<Session> findByEventId(Long eventId);
    
    List<Session> findBySpeakerId(Long speakerId);
    
    List<Session> findByEventIdAndType(Long eventId, SessionType type);
    
    @Query("SELECT s FROM Session s WHERE s.deleted = false AND s.event.id = :eventId " +
           "ORDER BY s.startTime ASC")
    List<Session> findByEventIdOrderByStartTime(@Param("eventId") Long eventId);
    
    @Query("SELECT s FROM Session s WHERE s.deleted = false AND " +
           "s.event.id = :eventId AND s.type = :type ORDER BY s.startTime ASC")
    List<Session> findByEventIdAndTypeOrderByStartTime(@Param("eventId") Long eventId, 
                                                       @Param("type") SessionType type);
    
    @Query("SELECT s FROM Session s WHERE s.deleted = false AND " +
           "s.startTime >= :startTime AND s.endTime <= :endTime")
    List<Session> findByTimeRange(@Param("startTime") LocalDateTime startTime, 
                                  @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT s FROM Session s WHERE s.deleted = false AND " +
           "s.event.id = :eventId AND s.startTime >= :startTime AND s.endTime <= :endTime " +
           "ORDER BY s.startTime ASC")
    List<Session> findByEventAndTimeRange(@Param("eventId") Long eventId,
                                         @Param("startTime") LocalDateTime startTime,
                                         @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT s FROM Session s WHERE s.deleted = false AND " +
           "s.speaker.id = :speakerId ORDER BY s.startTime ASC")
    List<Session> findActiveBySpeaker(@Param("speakerId") Long speakerId);
    
    @Query("SELECT COUNT(s) FROM Session s WHERE s.deleted = false AND s.event.id = :eventId")
    Long countByEvent(@Param("eventId") Long eventId);
}
