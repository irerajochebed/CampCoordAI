package com.example.Camp.repository;

import com.example.Camp.entity.Proposal;
import com.example.Camp.enums.ProposalScope;
import com.example.Camp.enums.ProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    
    List<Proposal> findByStatus(ProposalStatus status);
    
    List<Proposal> findByProposedById(Long userId);
    
    List<Proposal> findByDepartmentId(Long departmentId);
    
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false AND p.status = :status")
    List<Proposal> findActiveByStatus(@Param("status") ProposalStatus status);
    
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false AND p.proposedBy.id = :userId")
    List<Proposal> findActiveByProposedBy(@Param("userId") Long userId);
    
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false AND p.department.id = :departmentId")
    List<Proposal> findActiveByDepartment(@Param("departmentId") Long departmentId);
    
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false AND " +
           "p.startDate >= :startDate AND p.endDate <= :endDate")
    List<Proposal> findByDateRange(@Param("startDate") LocalDate startDate, 
                                   @Param("endDate") LocalDate endDate);
    
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false AND " +
           "p.status IN ('SUBMITTED', 'PENDING_LEADER_REVIEW', 'UNDER_REVIEW', 'RECOMMENDED_BY_LEADER') ORDER BY p.createdAt ASC")
    List<Proposal> findPendingReview();
    
    @Query("SELECT COUNT(p) FROM Proposal p WHERE p.deleted = false AND p.status = :status")
    Long countByStatus(@Param("status") ProposalStatus status);
    
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false AND " +
           "LOWER(p.eventName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Proposal> searchByEventName(@Param("keyword") String keyword);
    
    // Organizational Hierarchy Queries
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false AND " +
           "p.proposedBy.organizationUnit.id = :orgUnitId AND " +
           "p.status IN ('SUBMITTED', 'PENDING_LEADER_REVIEW', 'UNDER_REVIEW', 'RECOMMENDED_BY_LEADER') ORDER BY p.createdAt ASC")
    List<Proposal> findPendingReviewByOrgUnit(@Param("orgUnitId") Long orgUnitId);
    
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false AND " +
           "p.proposedBy.organizationUnit.id IN :orgUnitIds AND " +
           "p.status IN ('SUBMITTED', 'PENDING_LEADER_REVIEW', 'UNDER_REVIEW', 'RECOMMENDED_BY_LEADER') ORDER BY p.createdAt ASC")
    List<Proposal> findPendingReviewByOrgUnits(@Param("orgUnitIds") List<Long> orgUnitIds);
    
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false AND " +
           "p.department.id = :departmentId AND " +
           "p.status IN ('SUBMITTED', 'PENDING_LEADER_REVIEW', 'UNDER_REVIEW', 'RECOMMENDED_BY_LEADER') ORDER BY p.createdAt ASC")
    List<Proposal> findPendingReviewByDepartment(@Param("departmentId") Long departmentId);
    
    @Query("SELECT COUNT(p) FROM Proposal p WHERE p.deleted = false AND " +
           "p.status IN ('SUBMITTED', 'PENDING_LEADER_REVIEW', 'UNDER_REVIEW', 'RECOMMENDED_BY_LEADER')")
    Long countPendingReview();
    
    @Query("SELECT COUNT(p) FROM Proposal p WHERE p.deleted = false AND " +
           "p.proposedBy.organizationUnit.id IN :orgUnitIds AND " +
           "p.status IN ('SUBMITTED', 'PENDING_LEADER_REVIEW', 'UNDER_REVIEW', 'RECOMMENDED_BY_LEADER')")
    Long countPendingReviewByOrgUnits(@Param("orgUnitIds") List<Long> orgUnitIds);

    // ── Scope-based routing queries ──────────────────────────────────────────

    // FIELD scope: proposals targeting a specific field unit, pending Field Leader review
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false " +
           "AND p.scope = 'FIELD' " +
           "AND p.targetOrganizationUnit.id = :fieldUnitId " +
           "AND p.status IN ('SUBMITTED', 'PENDING_LEADER_REVIEW', 'UNDER_REVIEW') " +
           "ORDER BY p.createdAt ASC")
    List<Proposal> findPendingForFieldLeader(@Param("fieldUnitId") Long fieldUnitId);

    // UNION scope step-1: pending Dept Leader endorsement (not yet endorsed)
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false " +
           "AND p.scope = 'UNION' " +
           "AND p.department.id = :departmentId " +
           "AND p.deptLeaderEndorsed = false " +
           "AND p.status IN ('SUBMITTED', 'PENDING_LEADER_REVIEW') " +
           "ORDER BY p.createdAt ASC")
    List<Proposal> findPendingEndorsementForDeptLeader(@Param("departmentId") Long departmentId);

    // Proposals awaiting Union Admin final approval (recommended by leader or under review)
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false " +
           "AND p.status IN ('RECOMMENDED_BY_LEADER', 'UNDER_REVIEW') " +
           "ORDER BY p.createdAt ASC")
    List<Proposal> findPendingFinalApprovalForUnionAdmin();

    // Count helpers for dashboard badges
    @Query("SELECT COUNT(p) FROM Proposal p WHERE p.deleted = false " +
           "AND p.scope = 'FIELD' " +
           "AND p.targetOrganizationUnit.id = :fieldUnitId " +
           "AND p.status IN ('SUBMITTED', 'PENDING_LEADER_REVIEW', 'UNDER_REVIEW')")
    Long countPendingForFieldLeader(@Param("fieldUnitId") Long fieldUnitId);

    @Query("SELECT COUNT(p) FROM Proposal p WHERE p.deleted = false " +
           "AND p.scope = 'UNION' " +
           "AND p.department.id = :departmentId " +
           "AND p.deptLeaderEndorsed = false " +
           "AND p.status IN ('SUBMITTED', 'PENDING_LEADER_REVIEW')")
    Long countPendingEndorsementForDeptLeader(@Param("departmentId") Long departmentId);

    @Query("SELECT COUNT(p) FROM Proposal p WHERE p.deleted = false " +
           "AND p.status IN ('RECOMMENDED_BY_LEADER', 'UNDER_REVIEW')")
    Long countPendingFinalApprovalForUnionAdmin();

    // Position and Scope-based combined routing query
    @Query("SELECT p FROM Proposal p WHERE p.deleted = false " +
           "AND p.status IN ('SUBMITTED', 'PENDING_LEADER_REVIEW', 'UNDER_REVIEW', 'RECOMMENDED_BY_LEADER') " +
           "AND (" +
           "   (:position = 'DISTRICT_PASTOR' AND p.scope = 'DISTRICT' AND p.targetOrganizationUnit.id = :userOrgUnitId) " +
           "   OR (:position = 'FIELD_LEADER' AND p.scope = 'FIELD' AND (p.targetOrganizationUnit.id = :userOrgUnitId OR (p.targetOrganizationUnit.parent IS NOT NULL AND p.targetOrganizationUnit.parent.id = :userOrgUnitId))) " +
           "   OR ((:position IN ('ADMINISTRATOR', 'UNION_LEADER', 'UNION_ADMINISTRATOR'))) " +
           ") " +
           "ORDER BY p.createdAt ASC")
    List<Proposal> findPendingReviewsForUser(
            @Param("userId") Long userId,
            @Param("position") String position,
            @Param("userOrgUnitId") Long userOrgUnitId);

    @Query("SELECT p FROM Proposal p WHERE p.deleted = false AND " +
           "p.proposedBy.id = :userId AND p.status = :status")
    List<Proposal> findByProposedByAndStatus(@Param("userId") Long userId, @Param("status") ProposalStatus status);
}
