package com.example.Camp.repository;

import com.example.Camp.entity.Department;
import com.example.Camp.enums.DepartmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    
    Optional<Department> findByType(DepartmentType type);
    Optional<Department> findByName(String name);

    // Returns the first department led by this user (a leader typically leads one dept)
    Optional<Department> findFirstByLeaderId(Long leaderId);

    List<Department> findByLeaderId(Long leaderId);
    
    @Query("SELECT d FROM Department d WHERE d.deleted = false")
    List<Department> findAllActive();
    
    @Query("SELECT d FROM Department d WHERE d.deleted = false AND d.leader.id = :leaderId")
    List<Department> findActiveByLeader(@Param("leaderId") Long leaderId);
    
    boolean existsByType(DepartmentType type);
}
