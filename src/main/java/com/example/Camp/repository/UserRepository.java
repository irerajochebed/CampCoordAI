package com.example.Camp.repository;

import com.example.Camp.entity.User;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByPhoneNumber(String phoneNumber);
    
    boolean existsByEmail(String email);
    
    boolean existsByPhoneNumber(String phoneNumber);
    
    List<User> findByRole(Role role);
    
    List<User> findByPosition(Position position);
    
    List<User> findByOrganizationUnitId(Long organizationUnitId);
    
    List<User> findByRoleAndOrganizationUnitId(Role role, Long organizationUnitId);
    
    @Query("SELECT u FROM User u WHERE u.deleted = false AND u.active = true")
    List<User> findAllActive();
    
    @Query("SELECT u FROM User u WHERE u.deleted = false AND u.role = :role AND u.active = true")
    List<User> findActiveByRole(@Param("role") Role role);

    @Query("SELECT u FROM User u WHERE u.deleted = false AND u.active = true AND u.position = :position AND u.organizationUnit.id = :orgUnitId")
    List<User> findActiveByPositionAndOrganizationUnitId(@Param("position") Position position, @Param("orgUnitId") Long orgUnitId);

    @Query("SELECT u FROM User u WHERE u.deleted = false AND u.active = true AND u.organizationUnit.id = :orgUnitId")
    List<User> findActiveByOrganizationUnitId(@Param("orgUnitId") Long orgUnitId);

    @Query("SELECT u FROM User u WHERE u.deleted = false AND u.active = true AND u.organizationUnit.parent IS NOT NULL AND u.organizationUnit.parent.id = :parentOrgUnitId")
    List<User> findActiveByParentOrganizationUnitId(@Param("parentOrgUnitId") Long parentOrgUnitId);
    
    @Query("SELECT u FROM User u WHERE u.deleted = false AND " +
           "(LOWER(u.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<User> searchUsers(@Param("keyword") String keyword);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.deleted = false AND u.role = :role")
    Long countByRole(@Param("role") Role role);
}
