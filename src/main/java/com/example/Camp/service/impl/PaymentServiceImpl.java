package com.example.Camp.service.impl;

import com.example.Camp.dto.payment.PaymentRequest;
import com.example.Camp.dto.payment.PaymentResponse;
import com.example.Camp.entity.Payment;
import com.example.Camp.entity.Registration;
import com.example.Camp.entity.User;
import com.example.Camp.enums.PaymentStatus;
import com.example.Camp.enums.RegistrationStatus;
import com.example.Camp.repository.PaymentRepository;
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
    private final DtoMapper dtoMapper;
    
    @Override
    public PaymentResponse createPayment(PaymentRequest request) {
        Registration registration = registrationService.getRegistrationEntity(request.getRegistrationId());
        
        String transactionRef = request.getTransactionReference() != null ? 
                request.getTransactionReference() : generateTransactionReference();
        
        Payment payment = Payment.builder()
                .transactionReference(transactionRef)
                .registration(registration)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.PENDING)
                .paidAt(request.getPaidAt() != null ? request.getPaidAt() : LocalDateTime.now())
                .notes(request.getNotes())
                .build();
        
        Payment savedPayment = paymentRepository.save(payment);
        
        // Update registration status
        if (registration.getStatus() == RegistrationStatus.PENDING) {
            registration.setStatus(RegistrationStatus.PAYMENT_SUBMITTED);
            registrationService.getRegistrationEntity(registration.getId());
        }
        
        log.info("Payment created: {} for registration {}", savedPayment.getTransactionReference(), registration.getId());
        return dtoMapper.toPaymentResponse(savedPayment);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        Payment payment = getPaymentEntity(id);
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
        return paymentRepository.findByEvent(eventId).stream()
                .map(dtoMapper::toPaymentResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByStatus(PaymentStatus status) {
        return paymentRepository.findActiveByStatus(status).stream()
                .map(dtoMapper::toPaymentResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public PaymentResponse verifyPayment(Long id, Long verifierId) {
        Payment payment = getPaymentEntity(id);
        User verifier = userService.getUserById(verifierId);
        
        payment.setStatus(PaymentStatus.VERIFIED);
        payment.setVerifiedBy(verifier);
        payment.setVerifiedAt(LocalDateTime.now());
        
        Payment savedPayment = paymentRepository.save(payment);
        
        // Update registration status and generate QR code
        Registration registration = payment.getRegistration();
        registrationService.updateRegistrationStatus(registration.getId(), RegistrationStatus.PAYMENT_VERIFIED);
        if (registration.getQrCode() == null) {
            registrationService.generateQrCode(registration.getId());
        }
        
        log.info("Payment verified: {} by user {}. Registration status updated and QR code generated.", id, verifierId);
        return dtoMapper.toPaymentResponse(savedPayment);
    }
    
    @Override
    public PaymentResponse rejectPayment(Long id, String reason) {
        Payment payment = getPaymentEntity(id);
        payment.setStatus(PaymentStatus.REJECTED);
        payment.setNotes(reason);
        Payment savedPayment = paymentRepository.save(payment);
        log.info("Payment rejected: {}", id);
        return dtoMapper.toPaymentResponse(savedPayment);
    }
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalPaymentsByEvent(Long eventId) {
        BigDecimal total = paymentRepository.sumVerifiedPaymentsByEvent(eventId);
        return total != null ? total : BigDecimal.ZERO;
    }
    
    @Override
    public void deletePayment(Long id) {
        Payment payment = getPaymentEntity(id);
        payment.setDeleted(true);
        paymentRepository.save(payment);
        log.info("Payment soft deleted: {}", id);
    }
    
    private Payment getPaymentEntity(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
    }
    
    private String generateTransactionReference() {
        return "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
