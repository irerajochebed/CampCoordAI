package com.example.Camp.service;

import com.example.Camp.dto.payment.MomoInitiateRequest;
import com.example.Camp.dto.payment.MomoInitiateResponse;
import com.example.Camp.dto.payment.MomoVerifyRequest;
import com.example.Camp.dto.payment.PaymentRequest;
import com.example.Camp.dto.payment.PaymentResponse;
import com.example.Camp.enums.PaymentStatus;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentService {
    
    PaymentResponse createPayment(PaymentRequest request);
    
    PaymentResponse getPaymentById(Long id);

    PaymentResponse getPaymentById(Long id, Long currentUserId);
    
    List<PaymentResponse> getPaymentsByRegistration(Long registrationId);
    
    List<PaymentResponse> getPaymentsByEvent(Long eventId);

    List<PaymentResponse> getPaymentsByEvent(Long eventId, Long currentUserId);
    
    List<PaymentResponse> getPaymentsByStatus(PaymentStatus status);

    List<PaymentResponse> getPaymentsByStatus(PaymentStatus status, Long currentUserId);
    
    List<PaymentResponse> getAllPayments();

    List<PaymentResponse> getAllPayments(Long currentUserId);
    
    PaymentResponse verifyPayment(Long id, Long verifierId);

    PaymentResponse rejectPayment(Long id, String reason);

    PaymentResponse rejectPayment(Long id, String reason, Long verifierId);
    
    BigDecimal getTotalPaymentsByEvent(Long eventId);

    BigDecimal getTotalPaymentsByEvent(Long eventId, Long currentUserId);
    
    void deletePayment(Long id);

    // Free Mobile Money (MTN MoMo & Airtel Money) Integration
    MomoInitiateResponse initiateMomoPayment(MomoInitiateRequest request);
    
    PaymentResponse completeMomoPayment(MomoVerifyRequest request);
    
    PaymentResponse getMomoPaymentStatus(String transactionReference);
}
