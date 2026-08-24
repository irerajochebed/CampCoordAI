package com.example.Camp.repository;

import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.enums.OrganizationLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationUnitRepository extends JpaRepository<OrganizationUnit, Long> {
    
    Optional<OrganizationUnit> findByCode(String code);
    
    List<OrganizationUnit> findByLevel(OrganizationLevel level);
    
    List<OrganizationUnit> findByParentIdOrderByNameAsc(Long parentId);
    
    default List<OrganizationUnit> findByParentId(Long parentId) {
        return findByParentIdOrderByNameAsc(parentId);
    }
    
    List<OrganizationUnit> findByParentIsNull();
    
    @Query("SELECT o FROM OrganizationUnit o WHERE o.deleted = false AND o.level = :level ORDER BY o.name ASC")
    List<OrganizationUnit> findActiveByLevel(@Param("level") OrganizationLevel level);
    
    @Query("SELECT o FROM OrganizationUnit o WHERE o.deleted = false AND o.parent.id = :parentId ORDER BY o.name ASC")
    List<OrganizationUnit> findActiveChildren(@Param("parentId") Long parentId);
    
    @Query("SELECT o FROM OrganizationUnit o WHERE o.deleted = false AND " +
           "LOWER(o.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<OrganizationUnit> searchByName(@Param("keyword") String keyword);
    
    boolean existsByCode(String code);
}
