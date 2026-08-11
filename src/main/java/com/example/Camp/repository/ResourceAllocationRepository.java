package com.example.Camp.repository;

import com.example.Camp.entity.ResourceAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ResourceAllocationRepository extends JpaRepository<ResourceAllocation, Long> {
    
    List<ResourceAllocation> findByResourceId(Long resourceId);
    
    List<ResourceAllocation> findByEventId(Long eventId);
    
    @Query("SELECT ra FROM ResourceAllocation ra WHERE ra.deleted = false AND " +
           "ra.resource.id = :resourceId")
    List<ResourceAllocation> findActiveByResource(@Param("resourceId") Long resourceId);
    
    @Query("SELECT ra FROM ResourceAllocation ra WHERE ra.deleted = false AND " +
           "ra.event.id = :eventId")
    List<ResourceAllocation> findActiveByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT ra FROM ResourceAllocation ra WHERE ra.deleted = false AND " +
           "ra.resource.id = :resourceId AND ra.returned = false")
    List<ResourceAllocation> findUnreturnedByResource(@Param("resourceId") Long resourceId);
    
    @Query("SELECT ra FROM ResourceAllocation ra WHERE ra.deleted = false AND " +
           "ra.event.id = :eventId AND ra.returned = false")
    List<ResourceAllocation> findUnreturnedByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT ra FROM ResourceAllocation ra WHERE ra.deleted = false AND " +
           "ra.resource.id = :resourceId AND " +
           "((ra.allocatedFrom <= :endTime AND ra.allocatedTo >= :startTime))")
    List<ResourceAllocation> findConflictingAllocations(@Param("resourceId") Long resourceId,
                                                        @Param("startTime") LocalDateTime startTime,
                                                        @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT SUM(ra.quantity) FROM ResourceAllocation ra WHERE ra.deleted = false AND " +
           "ra.resource.id = :resourceId AND ra.returned = false")
    Long sumAllocatedQuantityByResource(@Param("resourceId") Long resourceId);
}
