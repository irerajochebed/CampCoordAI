package com.example.Camp.repository;

import com.example.Camp.entity.Payment;
import com.example.Camp.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    Optional<Payment> findByTransactionReference(String transactionReference);
    
    List<Payment> findByRegistrationId(Long registrationId);
    
    List<Payment> findByStatus(PaymentStatus status);
    
    @Query("SELECT p FROM Payment p WHERE p.deleted = false AND p.registration.id = :registrationId ORDER BY p.createdAt DESC")
    List<Payment> findActiveByRegistration(@Param("registrationId") Long registrationId);
    
    @Query("SELECT p FROM Payment p WHERE p.deleted = false AND p.status = :status ORDER BY p.createdAt DESC")
    List<Payment> findActiveByStatus(@Param("status") PaymentStatus status);
    
    @Query("SELECT p FROM Payment p WHERE p.deleted = false AND " +
           "p.registration.event.id = :eventId ORDER BY p.createdAt DESC")
    List<Payment> findByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT p FROM Payment p WHERE p.deleted = false AND " +
           "p.registration.event.id = :eventId AND p.status = :status ORDER BY p.createdAt DESC")
    List<Payment> findByEventAndStatus(@Param("eventId") Long eventId, @Param("status") PaymentStatus status);
    
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.deleted = false AND " +
           "p.registration.event.id = :eventId AND p.status = 'VERIFIED'")
    BigDecimal sumVerifiedPaymentsByEvent(@Param("eventId") Long eventId);
    
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.deleted = false AND " +
           "p.registration.event.id = :eventId AND p.status = :status")
    Long countByEventAndStatus(@Param("eventId") Long eventId, @Param("status") PaymentStatus status);
    
    @Query("SELECT p FROM Payment p WHERE p.deleted = false ORDER BY p.createdAt DESC")
    List<Payment> findAllActive();
    
    boolean existsByTransactionReference(String transactionReference);

    // ── SCOPED JURISDICTION QUERIES ───────────────────────────────────────────

    @Query("SELECT p FROM Payment p WHERE p.deleted = false AND " +
           "(p.registration.participant.organizationUnit.id IN :orgUnitIds OR (p.registration.registeredBy IS NOT NULL AND p.registration.registeredBy.id = :userId)) " +
           "ORDER BY p.createdAt DESC")
    List<Payment> findActiveByOrgUnitIdsOrRegisteredBy(
            @Param("orgUnitIds") List<Long> orgUnitIds,
            @Param("userId") Long userId);

    @Query("SELECT p FROM Payment p WHERE p.deleted = false AND " +
           "p.registration.event.id = :eventId AND " +
           "(p.registration.participant.organizationUnit.id IN :orgUnitIds OR (p.registration.registeredBy IS NOT NULL AND p.registration.registeredBy.id = :userId)) " +
           "ORDER BY p.createdAt DESC")
    List<Payment> findActiveByEventAndOrgUnitIdsOrRegisteredBy(
            @Param("eventId") Long eventId,
            @Param("orgUnitIds") List<Long> orgUnitIds,
            @Param("userId") Long userId);

    @Query("SELECT p FROM Payment p WHERE p.deleted = false AND " +
           "p.status = :status AND " +
           "(p.registration.participant.organizationUnit.id IN :orgUnitIds OR (p.registration.registeredBy IS NOT NULL AND p.registration.registeredBy.id = :userId)) " +
           "ORDER BY p.createdAt DESC")
    List<Payment> findActiveByStatusAndOrgUnitIdsOrRegisteredBy(
            @Param("status") PaymentStatus status,
            @Param("orgUnitIds") List<Long> orgUnitIds,
            @Param("userId") Long userId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.deleted = false AND " +
           "p.registration.event.id = :eventId AND p.status = 'VERIFIED' AND " +
           "(p.registration.participant.organizationUnit.id IN :orgUnitIds OR (p.registration.registeredBy IS NOT NULL AND p.registration.registeredBy.id = :userId))")
    BigDecimal sumVerifiedPaymentsByEventAndOrgUnitIdsOrRegisteredBy(
            @Param("eventId") Long eventId,
            @Param("orgUnitIds") List<Long> orgUnitIds,
            @Param("userId") Long userId);
}
