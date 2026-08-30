package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.dto.registration.RegistrationRequest;
import com.example.Camp.dto.registration.RegistrationResponse;
import com.example.Camp.enums.RegistrationStatus;
import com.example.Camp.security.UserDetailsImpl;
import com.example.Camp.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/registrations", "/api/registrations"})
@RequiredArgsConstructor
public class RegistrationController {
    
    private final RegistrationService registrationService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> getAllRegistrations() {
        List<RegistrationResponse> response = registrationService.getAllRegistrations();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-registrations")
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> getMyRegistrations(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<RegistrationResponse> response = registrationService.getMyRegistrations(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RegistrationResponse>> registerParticipant(
            @Valid @RequestBody RegistrationRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        RegistrationResponse response = registrationService.registerParticipant(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Registration created successfully", response));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RegistrationResponse>> getRegistrationById(@PathVariable Long id) {
        RegistrationResponse response = registrationService.getRegistrationById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/number/{registrationNumber}")
    public ResponseEntity<ApiResponse<RegistrationResponse>> getRegistrationByNumber(
            @PathVariable String registrationNumber) {
        RegistrationResponse response = registrationService.getRegistrationByNumber(registrationNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/qr/{qrCode}")
    public ResponseEntity<ApiResponse<RegistrationResponse>> getRegistrationByQrCode(
            @PathVariable String qrCode) {
        RegistrationResponse response = registrationService.getRegistrationByQrCode(qrCode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> getRegistrationsByEvent(
            @PathVariable Long eventId) {
        List<RegistrationResponse> response = registrationService.getRegistrationsByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/participant/{participantId}")
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> getRegistrationsByParticipant(
            @PathVariable Long participantId) {
        List<RegistrationResponse> response = registrationService.getRegistrationsByParticipant(participantId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/event/{eventId}/status/{status}")
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> getRegistrationsByStatus(
            @PathVariable Long eventId,
            @PathVariable RegistrationStatus status) {
        List<RegistrationResponse> response = registrationService.getRegistrationsByStatus(eventId, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<RegistrationResponse>> updateRegistrationStatus(
            @PathVariable Long id,
            @RequestParam RegistrationStatus status) {
        RegistrationResponse response = registrationService.updateRegistrationStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Registration status updated", response));
    }
    
    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<RegistrationResponse>> confirmRegistration(@PathVariable Long id) {
        RegistrationResponse response = registrationService.confirmRegistration(id);
        return ResponseEntity.ok(ApiResponse.success("Registration confirmed", response));
    }
    
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<RegistrationResponse>> cancelRegistration(@PathVariable Long id) {
        RegistrationResponse response = registrationService.cancelRegistration(id);
        return ResponseEntity.ok(ApiResponse.success("Registration cancelled", response));
    }
    
    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<RegistrationResponse>> checkIn(@PathVariable Long id) {
        RegistrationResponse response = registrationService.checkIn(id);
        return ResponseEntity.ok(ApiResponse.success("Participant checked in", response));
    }
    
    @PostMapping("/check-in/qr/{qrCode}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<RegistrationResponse>> checkInByQrCode(@PathVariable String qrCode) {
        RegistrationResponse response = registrationService.checkInByQrCode(qrCode);
        return ResponseEntity.ok(ApiResponse.success("Participant checked in", response));
    }
    
    @PostMapping("/{id}/generate-qr")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> generateQrCode(@PathVariable Long id) {
        String qrCode = registrationService.generateQrCode(id);
        return ResponseEntity.ok(ApiResponse.success("QR code generated", qrCode));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deleteRegistration(@PathVariable Long id) {
        registrationService.deleteRegistration(id);
        return ResponseEntity.ok(ApiResponse.success("Registration deleted successfully", null));
    }
}
