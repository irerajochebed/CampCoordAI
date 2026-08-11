package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.dto.session.SessionRequest;
import com.example.Camp.dto.session.SessionResponse;
import com.example.Camp.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    
    private final SessionService sessionService;
    
    @PostMapping("/event/{eventId}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<SessionResponse>> createSession(
            @PathVariable Long eventId,
            @Valid @RequestBody SessionRequest request) {
        SessionResponse response = sessionService.createSession(eventId, request);
        return ResponseEntity.ok(ApiResponse.success("Session created successfully", response));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<SessionResponse>> updateSession(
            @PathVariable Long id,
            @Valid @RequestBody SessionRequest request) {
        SessionResponse response = sessionService.updateSession(id, request);
        return ResponseEntity.ok(ApiResponse.success("Session updated successfully", response));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SessionResponse>> getSessionById(@PathVariable Long id) {
        SessionResponse response = sessionService.getSessionById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getSessionsByEvent(
            @PathVariable Long eventId) {
        List<SessionResponse> response = sessionService.getSessionsByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/speaker/{speakerId}")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getSessionsBySpeaker(
            @PathVariable Long speakerId) {
        List<SessionResponse> response = sessionService.getSessionsBySpeaker(speakerId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deleteSession(@PathVariable Long id) {
        sessionService.deleteSession(id);
        return ResponseEntity.ok(ApiResponse.success("Session deleted successfully", null));
    }
}
