package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.dto.payment.MomoInitiateRequest;
import com.example.Camp.dto.payment.MomoInitiateResponse;
import com.example.Camp.dto.payment.MomoVerifyRequest;
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

    // Free Mobile Money (MTN MoMo & Airtel Money) Automated Checkout
    @PostMapping({"/momo/initiate", "/momo/request-to-pay"})
    public ResponseEntity<ApiResponse<MomoInitiateResponse>> initiateMomoPayment(
            @Valid @RequestBody MomoInitiateRequest request) {
        MomoInitiateResponse response = paymentService.initiateMomoPayment(request);
        return ResponseEntity.ok(ApiResponse.success("Mobile Money prompt sent to " + response.getPhoneNumber(), response));
    }

    @PostMapping({"/momo/verify", "/momo/confirm"})
    public ResponseEntity<ApiResponse<PaymentResponse>> completeMomoPayment(
            @Valid @RequestBody MomoVerifyRequest request) {
        PaymentResponse response = paymentService.completeMomoPayment(request);
        return ResponseEntity.ok(ApiResponse.success("Mobile Money payment verified! Registration confirmed with ticket badge.", response));
    }

    @GetMapping("/momo/status/{reference}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getMomoPaymentStatus(
            @PathVariable String reference) {
        PaymentResponse response = paymentService.getMomoPaymentStatus(reference);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getAllPayments(Authentication authentication) {
        Long currentUserId = getUserId(authentication);
        List<PaymentResponse> response = paymentService.getAllPayments(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(
            @PathVariable Long id,
            Authentication authentication) {
        Long currentUserId = getUserId(authentication);
        PaymentResponse response = paymentService.getPaymentById(id, currentUserId);
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
            @PathVariable Long eventId,
            Authentication authentication) {
        Long currentUserId = getUserId(authentication);
        List<PaymentResponse> response = paymentService.getPaymentsByEvent(eventId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByStatus(
            @PathVariable PaymentStatus status,
            Authentication authentication) {
        Long currentUserId = getUserId(authentication);
        List<PaymentResponse> response = paymentService.getPaymentsByStatus(status, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @RequestMapping(value = "/{id}/verify", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyPayment(
            @PathVariable Long id,
            Authentication authentication) {
        Long currentUserId = getUserId(authentication);
        PaymentResponse response = paymentService.verifyPayment(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", response));
    }
    
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<PaymentResponse>> rejectPayment(
            @PathVariable Long id,
            @RequestParam String reason,
            Authentication authentication) {
        Long currentUserId = getUserId(authentication);
        PaymentResponse response = paymentService.rejectPayment(id, reason, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Payment rejected", response));
    }
    
    @GetMapping("/event/{eventId}/total")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalPaymentsByEvent(
            @PathVariable Long eventId,
            Authentication authentication) {
        Long currentUserId = getUserId(authentication);
        BigDecimal total = paymentService.getTotalPaymentsByEvent(eventId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(total));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return ResponseEntity.ok(ApiResponse.success("Payment deleted successfully", null));
    }

    private Long getUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return null;
    }
}
