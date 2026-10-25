package com.example.Camp.repository;

import com.example.Camp.entity.Registration;
import com.example.Camp.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    
    Optional<Registration> findByRegistrationNumber(String registrationNumber);
    
    Optional<Registration> findByQrCode(String qrCode);
    
    List<Registration> findByEventId(Long eventId);
    
    List<Registration> findByParticipantId(Long participantId);
    
    List<Registration> findByStatus(RegistrationStatus status);
    
    List<Registration> findByEventIdAndStatus(Long eventId, RegistrationStatus status);
    
    @Query("SELECT r FROM Registration r WHERE r.deleted = false AND r.event.id = :eventId ORDER BY r.createdAt DESC")
    List<Registration> findActiveByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT r FROM Registration r WHERE r.deleted = false AND r.participant.id = :participantId ORDER BY r.createdAt DESC")
    List<Registration> findActiveByParticipant(@Param("participantId") Long participantId);
    
    @Query("SELECT r FROM Registration r WHERE r.deleted = false AND " +
           "r.event.id = :eventId AND r.status = :status ORDER BY r.createdAt DESC")
    List<Registration> findActiveByEventAndStatus(@Param("eventId") Long eventId, 
                                                  @Param("status") RegistrationStatus status);
    
    @Query("SELECT r FROM Registration r WHERE r.deleted = false AND " +
           "r.event.id = :eventId AND r.participant.organizationUnit.id = :organizationUnitId ORDER BY r.createdAt DESC")
    List<Registration> findByEventAndOrganizationUnit(@Param("eventId") Long eventId, 
                                                      @Param("organizationUnitId") Long organizationUnitId);
    
    @Query("SELECT COUNT(r) FROM Registration r WHERE r.deleted = false AND " +
           "r.event.id = :eventId AND r.status = :status")
    Long countByEventAndStatus(@Param("eventId") Long eventId, @Param("status") RegistrationStatus status);
    
    @Query("SELECT COUNT(r) FROM Registration r WHERE r.deleted = false AND r.event.id = :eventId")
    Long countByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT r FROM Registration r WHERE r.deleted = false AND " +
           "r.event.id = :eventId AND r.status = 'CONFIRMED' " +
           "ORDER BY r.participant.organizationUnit.name, r.participant.lastName")
    List<Registration> findConfirmedByEventOrderByChurch(@Param("eventId") Long eventId);
    
    boolean existsByRegistrationNumber(String registrationNumber);
    
    boolean existsByQrCode(String qrCode);
    
    @Query("SELECT r FROM Registration r WHERE r.deleted = false ORDER BY r.createdAt DESC")
    List<Registration> findAllActive();
    
    @Query("SELECT r FROM Registration r WHERE r.deleted = false AND " +
           "r.event.id = :eventId AND r.participant.id = :participantId")
    Optional<Registration> findByEventAndParticipant(@Param("eventId") Long eventId, 
                                                     @Param("participantId") Long participantId);

    // ── SCOPED JURISDICTION QUERIES ───────────────────────────────────────────

    @Query("SELECT r FROM Registration r WHERE r.deleted = false AND " +
           "(r.participant.organizationUnit.id IN :orgUnitIds OR (r.registeredBy IS NOT NULL AND r.registeredBy.id = :userId)) " +
           "ORDER BY r.createdAt DESC")
    List<Registration> findActiveByOrgUnitIdsOrRegisteredBy(
            @Param("orgUnitIds") List<Long> orgUnitIds,
            @Param("userId") Long userId);

    @Query("SELECT r FROM Registration r WHERE r.deleted = false AND " +
           "r.event.id = :eventId AND " +
           "(r.participant.organizationUnit.id IN :orgUnitIds OR (r.registeredBy IS NOT NULL AND r.registeredBy.id = :userId)) " +
           "ORDER BY r.createdAt DESC")
    List<Registration> findActiveByEventAndOrgUnitIdsOrRegisteredBy(
            @Param("eventId") Long eventId,
            @Param("orgUnitIds") List<Long> orgUnitIds,
            @Param("userId") Long userId);

    @Query("SELECT r FROM Registration r WHERE r.deleted = false AND " +
           "r.event.id = :eventId AND r.status = :status AND " +
           "(r.participant.organizationUnit.id IN :orgUnitIds OR (r.registeredBy IS NOT NULL AND r.registeredBy.id = :userId)) " +
           "ORDER BY r.createdAt DESC")
    List<Registration> findActiveByEventStatusAndOrgUnitIdsOrRegisteredBy(
            @Param("eventId") Long eventId,
            @Param("status") RegistrationStatus status,
            @Param("orgUnitIds") List<Long> orgUnitIds,
            @Param("userId") Long userId);
}
