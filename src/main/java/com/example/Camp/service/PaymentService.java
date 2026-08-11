package com.example.Camp.service;

import com.example.Camp.dto.payment.PaymentRequest;
import com.example.Camp.dto.payment.PaymentResponse;
import com.example.Camp.enums.PaymentStatus;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentService {
    
    PaymentResponse createPayment(PaymentRequest request);
    
    PaymentResponse getPaymentById(Long id);
    
    List<PaymentResponse> getPaymentsByRegistration(Long registrationId);
    
    List<PaymentResponse> getPaymentsByEvent(Long eventId);
    
    List<PaymentResponse> getPaymentsByStatus(PaymentStatus status);
    
    PaymentResponse verifyPayment(Long id, Long verifierId);
    
    PaymentResponse rejectPayment(Long id, String reason);
    
    BigDecimal getTotalPaymentsByEvent(Long eventId);
    
    void deletePayment(Long id);
}
