package com.example.Camp.repository;

import com.example.Camp.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByUserId(Long userId);
    
    List<AuditLog> findByAction(String action);
    
    List<AuditLog> findByEntityType(String entityType);
    
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId);
    
    @Query("SELECT al FROM AuditLog al WHERE al.deleted = false AND " +
           "al.user.id = :userId ORDER BY al.timestamp DESC")
    List<AuditLog> findByUserOrderByTimestampDesc(@Param("userId") Long userId);
    
    @Query("SELECT al FROM AuditLog al WHERE al.deleted = false AND " +
           "al.entityType = :entityType AND al.entityId = :entityId ORDER BY al.timestamp DESC")
    List<AuditLog> findByEntityOrderByTimestampDesc(@Param("entityType") String entityType, 
                                                    @Param("entityId") Long entityId);
    
    @Query("SELECT al FROM AuditLog al WHERE al.deleted = false AND " +
           "al.timestamp >= :startTime AND al.timestamp <= :endTime ORDER BY al.timestamp DESC")
    List<AuditLog> findByTimeRange(@Param("startTime") LocalDateTime startTime, 
                                   @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT al FROM AuditLog al WHERE al.deleted = false AND " +
           "al.action = :action ORDER BY al.timestamp DESC")
    List<AuditLog> findByActionOrderByTimestampDesc(@Param("action") String action);
    
    @Query("SELECT al FROM AuditLog al WHERE al.deleted = false " +
           "ORDER BY al.timestamp DESC")
    List<AuditLog> findAllOrderByTimestampDesc();
}
