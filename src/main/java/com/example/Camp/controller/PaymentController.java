package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.dto.payment.PaymentRequest;
import com.example.Camp.dto.payment.PaymentResponse;
import com.example.Camp.enums.PaymentStatus;
import com.example.Camp.security.UserDetailsImpl;
import com.example.Camp.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/payments", "/api/payments"})
@RequiredArgsConstructor
public class PaymentController {
    
    private final PaymentService paymentService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @Valid @RequestBody PaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(request);
        return ResponseEntity.ok(ApiResponse.success("Payment submitted successfully", response));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(@PathVariable Long id) {
        PaymentResponse response = paymentService.getPaymentById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/registration/{registrationId}")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByRegistration(
            @PathVariable Long registrationId) {
        List<PaymentResponse> response = paymentService.getPaymentsByRegistration(registrationId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByEvent(
            @PathVariable Long eventId) {
        List<PaymentResponse> response = paymentService.getPaymentsByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByStatus(
            @PathVariable PaymentStatus status) {
        List<PaymentResponse> response = paymentService.getPaymentsByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @RequestMapping(value = "/{id}/verify", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyPayment(
            @PathVariable Long id,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        PaymentResponse response = paymentService.verifyPayment(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", response));
    }
    
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<PaymentResponse>> rejectPayment(
            @PathVariable Long id,
            @RequestParam String reason) {
        PaymentResponse response = paymentService.rejectPayment(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Payment rejected", response));
    }
    
    @GetMapping("/event/{eventId}/total")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalPaymentsByEvent(@PathVariable Long eventId) {
        BigDecimal total = paymentService.getTotalPaymentsByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success(total));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return ResponseEntity.ok(ApiResponse.success("Payment deleted successfully", null));
    }
}
