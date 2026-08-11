package com.example.Camp.repository;

import com.example.Camp.entity.Resource;
import com.example.Camp.enums.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    
    Optional<Resource> findByCode(String code);
    
    List<Resource> findByType(ResourceType type);
    
    @Query("SELECT r FROM Resource r WHERE r.deleted = false AND r.type = :type")
    List<Resource> findActiveByType(@Param("type") ResourceType type);
    
    @Query("SELECT r FROM Resource r WHERE r.deleted = false AND r.available = true")
    List<Resource> findAllAvailable();
    
    @Query("SELECT r FROM Resource r WHERE r.deleted = false AND " +
           "r.available = true AND r.availableQuantity > 0")
    List<Resource> findAvailableWithStock();
    
    @Query("SELECT r FROM Resource r WHERE r.deleted = false AND " +
           "r.type = :type AND r.available = true AND r.availableQuantity > 0")
    List<Resource> findAvailableByType(@Param("type") ResourceType type);
    
    @Query("SELECT r FROM Resource r WHERE r.deleted = false AND " +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Resource> searchByName(@Param("keyword") String keyword);
    
    @Query("SELECT COUNT(r) FROM Resource r WHERE r.deleted = false AND r.type = :type")
    Long countByType(@Param("type") ResourceType type);
    
    boolean existsByCode(String code);
}
