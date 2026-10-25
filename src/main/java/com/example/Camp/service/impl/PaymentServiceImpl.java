package com.example.Camp.service.impl;

import com.example.Camp.dto.payment.MomoInitiateRequest;
import com.example.Camp.dto.payment.MomoInitiateResponse;
import com.example.Camp.dto.payment.MomoVerifyRequest;
import com.example.Camp.dto.payment.PaymentRequest;
import com.example.Camp.dto.payment.PaymentResponse;
import com.example.Camp.entity.Payment;
import com.example.Camp.entity.Registration;
import com.example.Camp.entity.User;
import com.example.Camp.enums.PaymentStatus;
import com.example.Camp.enums.RegistrationStatus;
import com.example.Camp.repository.PaymentRepository;
import com.example.Camp.service.JurisdictionScopeService;
import com.example.Camp.service.PaymentService;
import com.example.Camp.service.RegistrationService;
import com.example.Camp.service.UserService;
import com.example.Camp.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentServiceImpl implements PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final RegistrationService registrationService;
    private final UserService userService;
    private final JurisdictionScopeService jurisdictionScopeService;
    private final DtoMapper dtoMapper;
    
    @Override
    public PaymentResponse createPayment(PaymentRequest request) {
        Registration registration = registrationService.getRegistrationEntity(request.getRegistrationId());
        
        String transactionRef = request.getTransactionReference() != null && !request.getTransactionReference().trim().isEmpty() ? 
                request.getTransactionReference().trim() : generateTransactionReference();
        
        Payment payment = Payment.builder()
                .transactionReference(transactionRef)
                .registration(registration)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.PENDING)
                .paidAt(request.getPaidAt() != null ? request.getPaidAt() : LocalDateTime.now())
                .notes(request.getNotes())
                .receiptUrl(request.getReceiptUrl())
                .build();
        
        Payment savedPayment = paymentRepository.save(payment);
        
        // Update registration status to PAYMENT_SUBMITTED
        registrationService.updateRegistrationStatus(registration.getId(), RegistrationStatus.PAYMENT_SUBMITTED);
        
        log.info("Payment created: {} for registration {}", savedPayment.getTransactionReference(), registration.getId());
        return dtoMapper.toPaymentResponse(savedPayment);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        return getPaymentById(id, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id, Long currentUserId) {
        Payment payment = getPaymentEntity(id);
        if (currentUserId != null) {
            User user = userService.getUserById(currentUserId);
            jurisdictionScopeService.validatePaymentAccess(user, payment);
        }
        return dtoMapper.toPaymentResponse(payment);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByRegistration(Long registrationId) {
        return paymentRepository.findActiveByRegistration(registrationId).stream()
                .map(dtoMapper::toPaymentResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByEvent(Long eventId) {
        return getPaymentsByEvent(eventId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByEvent(Long eventId, Long currentUserId) {
        if (currentUserId == null) {
            return paymentRepository.findByEvent(eventId).stream()
                    .map(dtoMapper::toPaymentResponse)
                    .collect(Collectors.toList());
        }

        User user = userService.getUserById(currentUserId);
        if (jurisdictionScopeService.isUnionWideScope(user)) {
            return paymentRepository.findByEvent(eventId).stream()
                    .map(dtoMapper::toPaymentResponse)
                    .collect(Collectors.toList());
        }

        List<Long> orgUnitIds = jurisdictionScopeService.getAccessibleOrganizationUnitIds(user);
        if (orgUnitIds.isEmpty()) {
            return Collections.emptyList();
        }

        return paymentRepository.findActiveByEventAndOrgUnitIdsOrRegisteredBy(eventId, orgUnitIds, currentUserId).stream()
                .map(dtoMapper::toPaymentResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByStatus(PaymentStatus status) {
        return getPaymentsByStatus(status, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByStatus(PaymentStatus status, Long currentUserId) {
        if (currentUserId == null) {
            return paymentRepository.findActiveByStatus(status).stream()
                    .map(dtoMapper::toPaymentResponse)
                    .collect(Collectors.toList());
        }

        User user = userService.getUserById(currentUserId);
        if (jurisdictionScopeService.isUnionWideScope(user)) {
            return paymentRepository.findActiveByStatus(status).stream()
                    .map(dtoMapper::toPaymentResponse)
                    .collect(Collectors.toList());
        }

        List<Long> orgUnitIds = jurisdictionScopeService.getAccessibleOrganizationUnitIds(user);
        if (orgUnitIds.isEmpty()) {
            return Collections.emptyList();
        }

        return paymentRepository.findActiveByStatusAndOrgUnitIdsOrRegisteredBy(status, orgUnitIds, currentUserId).stream()
                .map(dtoMapper::toPaymentResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return getAllPayments(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments(Long currentUserId) {
        if (currentUserId == null) {
            return paymentRepository.findAllActive().stream()
                    .map(dtoMapper::toPaymentResponse)
                    .collect(Collectors.toList());
        }

        User user = userService.getUserById(currentUserId);
        
        // 1. Union-wide scope (Union Admins, Union Leaders, Union Finance Officer)
        if (jurisdictionScopeService.isUnionWideScope(user)) {
            log.debug("User {} has Union-wide scope. Fetching all payments across RUM.", user.getEmail());
            return paymentRepository.findAllActive().stream()
                    .map(dtoMapper::toPaymentResponse)
                    .collect(Collectors.toList());
        }

        // 2. Field, District, or Church-scoped leaders, pastors & officers
        List<Long> orgUnitIds = jurisdictionScopeService.getAccessibleOrganizationUnitIds(user);
        if (!orgUnitIds.isEmpty()) {
            log.debug("User {} scoped to {} org units. Fetching jurisdiction-scoped payments.", user.getEmail(), orgUnitIds.size());
            return paymentRepository.findActiveByOrgUnitIdsOrRegisteredBy(orgUnitIds, currentUserId).stream()
                    .map(dtoMapper::toPaymentResponse)
                    .collect(Collectors.toList());
        }

        // 3. Participant: return payments related to their registrations
        return registrationService.getMyRegistrations(currentUserId).stream()
                .flatMap(r -> paymentRepository.findActiveByRegistration(r.getId()).stream())
                .map(dtoMapper::toPaymentResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public PaymentResponse verifyPayment(Long id, Long verifierId) {
        Payment payment = getPaymentEntity(id);
        User verifier = userService.getUserById(verifierId);
        
        // Validate verifier has jurisdiction over this payment
        jurisdictionScopeService.validatePaymentAccess(verifier, payment);
        
        payment.setStatus(PaymentStatus.VERIFIED);
        payment.setVerifiedBy(verifier);
        payment.setVerifiedAt(LocalDateTime.now());
        
        Payment savedPayment = paymentRepository.save(payment);
        
        // Update registration status to CONFIRMED and ensure QR code is generated
        Registration registration = payment.getRegistration();
        registrationService.confirmRegistration(registration.getId(), verifierId);
        
        log.info("Payment verified: {} by user {}. Registration {} confirmed with QR code.", id, verifierId, registration.getId());
        return dtoMapper.toPaymentResponse(savedPayment);
    }
    
    @Override
    public PaymentResponse rejectPayment(Long id, String reason) {
        return rejectPayment(id, reason, null);
    }

    @Override
    public PaymentResponse rejectPayment(Long id, String reason, Long verifierId) {
        Payment payment = getPaymentEntity(id);
        if (verifierId != null) {
            User verifier = userService.getUserById(verifierId);
            jurisdictionScopeService.validatePaymentAccess(verifier, payment);
        }
        
        payment.setStatus(PaymentStatus.REJECTED);
        payment.setNotes(reason);
        Payment savedPayment = paymentRepository.save(payment);
        
        // Revert registration status to PENDING so participant can resubmit
        if (payment.getRegistration() != null) {
            registrationService.updateRegistrationStatus(payment.getRegistration().getId(), RegistrationStatus.PENDING, verifierId);
        }
        
        log.info("Payment rejected: {} with reason: {} by user {}", id, reason, verifierId);
        return dtoMapper.toPaymentResponse(savedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalPaymentsByEvent(Long eventId) {
        return getTotalPaymentsByEvent(eventId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalPaymentsByEvent(Long eventId, Long currentUserId) {
        if (currentUserId == null) {
            BigDecimal total = paymentRepository.sumVerifiedPaymentsByEvent(eventId);
            return total != null ? total : BigDecimal.ZERO;
        }

        User user = userService.getUserById(currentUserId);
        if (jurisdictionScopeService.isUnionWideScope(user)) {
            BigDecimal total = paymentRepository.sumVerifiedPaymentsByEvent(eventId);
            return total != null ? total : BigDecimal.ZERO;
        }

        List<Long> orgUnitIds = jurisdictionScopeService.getAccessibleOrganizationUnitIds(user);
        if (orgUnitIds.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal total = paymentRepository.sumVerifiedPaymentsByEventAndOrgUnitIdsOrRegisteredBy(eventId, orgUnitIds, currentUserId);
        return total != null ? total : BigDecimal.ZERO;
    }
    
    @Override
    public void deletePayment(Long id) {
        Payment payment = getPaymentEntity(id);
        payment.setDeleted(true);
        paymentRepository.save(payment);
        log.info("Payment soft deleted: {}", id);
    }

    @Override
    public MomoInitiateResponse initiateMomoPayment(MomoInitiateRequest request) {
        Registration registration = registrationService.getRegistrationEntity(request.getRegistrationId());
        
        String cleanPhone = normalizePhoneNumber(request.getPhoneNumber());
        String provider = detectProvider(cleanPhone, request.getProvider());
        String transactionRef = "MOMO-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        
        Payment payment = Payment.builder()
                .transactionReference(transactionRef)
                .registration(registration)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : com.example.Camp.enums.PaymentMethod.MOBILE_MONEY)
                .status(PaymentStatus.PENDING)
                .paidAt(LocalDateTime.now())
                .notes(provider + " MoMo Payment initiated on " + cleanPhone)
                .build();
        
        Payment savedPayment = paymentRepository.save(payment);
        
        // Update registration status to PAYMENT_SUBMITTED
        registrationService.updateRegistrationStatus(registration.getId(), RegistrationStatus.PAYMENT_SUBMITTED);
        
        String ussdPrompt = provider.equalsIgnoreCase("MTN") ? "*182*7*1#" : "*500#";
        String message = "USSD push prompt sent to " + cleanPhone + ". Please enter your " + provider + " Mobile Money PIN to authorize payment of " + request.getAmount() + " RWF.";

        log.info("Free MoMo sandbox payment initiated: ref={}, phone={}, amount={} RWF, event={}", 
                transactionRef, cleanPhone, request.getAmount(), registration.getEvent().getName());

        return MomoInitiateResponse.builder()
                .paymentId(savedPayment.getId())
                .registrationId(registration.getId())
                .registrationNumber(registration.getRegistrationNumber())
                .eventName(registration.getEvent().getName())
                .transactionReference(transactionRef)
                .amount(request.getAmount())
                .phoneNumber(cleanPhone)
                .provider(provider)
                .status(PaymentStatus.PENDING)
                .message(message)
                .ussdInstruction(ussdPrompt)
                .simulated(true)
                .initiatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    public PaymentResponse completeMomoPayment(MomoVerifyRequest request) {
        Payment payment = paymentRepository.findByTransactionReference(request.getTransactionReference())
                .orElseThrow(() -> new RuntimeException("Payment not found for transaction reference: " + request.getTransactionReference()));
        
        if (request.isApproved()) {
            payment.setStatus(PaymentStatus.VERIFIED);
            payment.setVerifiedAt(LocalDateTime.now());
            payment.setNotes(payment.getNotes() + " | Automatically approved via " + 
                    (request.getMomoPin() != null && !request.getMomoPin().trim().isEmpty() ? "MoMo PIN authorization" : "Instant Mobile Money Sandbox Gateway"));
            
            Payment savedPayment = paymentRepository.save(payment);
            
            // Automatically confirm registration and generate entrance QR Code ticket
            if (payment.getRegistration() != null) {
                registrationService.confirmRegistration(payment.getRegistration().getId());
                log.info("Registration #{} automatically CONFIRMED with QR code upon MoMo payment verification: {}", 
                        payment.getRegistration().getId(), request.getTransactionReference());
            }
            
            return dtoMapper.toPaymentResponse(savedPayment);
        } else {
            payment.setStatus(PaymentStatus.REJECTED);
            payment.setNotes(payment.getNotes() + " | MoMo authorization was cancelled or failed");
            Payment savedPayment = paymentRepository.save(payment);
            
            if (payment.getRegistration() != null) {
                registrationService.updateRegistrationStatus(payment.getRegistration().getId(), RegistrationStatus.PENDING);
            }
            return dtoMapper.toPaymentResponse(savedPayment);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getMomoPaymentStatus(String transactionReference) {
        Payment payment = paymentRepository.findByTransactionReference(transactionReference)
                .orElseThrow(() -> new RuntimeException("Payment not found for transaction reference: " + transactionReference));
        return dtoMapper.toPaymentResponse(payment);
    }
    
    private Payment getPaymentEntity(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
    }
    
    private String generateTransactionReference() {
        return "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String normalizePhoneNumber(String phone) {
        if (phone == null) return "";
        String clean = phone.replaceAll("[^0-9]", "");
        if (clean.startsWith("07") && clean.length() == 10) {
            return "250" + clean.substring(1);
        }
        if (clean.startsWith("7") && clean.length() == 9) {
            return "250" + clean;
        }
        return clean;
    }

    private String detectProvider(String phone, String requestedProvider) {
        if (phone != null) {
            if (phone.contains("25078") || phone.contains("25079") || phone.startsWith("078") || phone.startsWith("079")) {
                return "MTN";
            }
            if (phone.contains("25072") || phone.contains("25073") || phone.startsWith("072") || phone.startsWith("073")) {
                return "AIRTEL";
            }
        }
        return (requestedProvider != null && !requestedProvider.trim().isEmpty()) ? requestedProvider.toUpperCase() : "MTN";
    }
}
