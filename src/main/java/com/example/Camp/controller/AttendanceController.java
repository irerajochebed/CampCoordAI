package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.entity.Attendance;
import com.example.Camp.security.UserDetailsImpl;
import com.example.Camp.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.example.Camp.dto.attendance.QRScanRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping({"/api/v1/attendances", "/api/v1/attendance", "/api/attendance", "/api/attendances"})
@RequiredArgsConstructor
public class AttendanceController {
    
    private final AttendanceService attendanceService;
    
    @PostMapping("/scan")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<Attendance>> scanAttendance(
            @Valid @RequestBody QRScanRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Attendance attendance = attendanceService.recordAttendanceByQR(request.getSessionId(), request.getQrCode(), userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Attendance recorded via QR scan", attendance));
    }
    
    @PostMapping("/session/{sessionId}/registration/{registrationId}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<Attendance>> recordAttendance(
            @PathVariable Long sessionId,
            @PathVariable Long registrationId,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Attendance attendance = attendanceService.recordAttendance(sessionId, registrationId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Attendance recorded successfully", attendance));
    }
    
    @PostMapping("/session/{sessionId}/qr-scan")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<Attendance>> recordAttendanceByQR(
            @PathVariable Long sessionId,
            @RequestParam String qrCode,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Attendance attendance = attendanceService.recordAttendanceByQR(sessionId, qrCode, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Attendance recorded via QR scan", attendance));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Attendance>> getAttendanceById(@PathVariable Long id) {
        Attendance attendance = attendanceService.getAttendanceById(id);
        return ResponseEntity.ok(ApiResponse.success(attendance));
    }
    
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ApiResponse<List<Attendance>>> getAttendanceBySession(@PathVariable Long sessionId) {
        List<Attendance> attendances = attendanceService.getAttendanceBySession(sessionId);
        return ResponseEntity.ok(ApiResponse.success(attendances));
    }
    
    @GetMapping("/registration/{registrationId}")
    public ResponseEntity<ApiResponse<List<Attendance>>> getAttendanceByRegistration(
            @PathVariable Long registrationId) {
        List<Attendance> attendances = attendanceService.getAttendanceByRegistration(registrationId);
        return ResponseEntity.ok(ApiResponse.success(attendances));
    }
    
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<List<Attendance>>> getAttendanceByEvent(@PathVariable Long eventId) {
        List<Attendance> attendances = attendanceService.getAttendanceByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success(attendances));
    }
    
    @GetMapping("/session/{sessionId}/count")
    public ResponseEntity<ApiResponse<Long>> getAttendanceCount(@PathVariable Long sessionId) {
        Long count = attendanceService.getAttendanceCountBySession(sessionId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
    
    @GetMapping("/event/{eventId}/registration/{registrationId}/count")
    public ResponseEntity<ApiResponse<Long>> getEventAttendanceCount(
            @PathVariable Long eventId,
            @PathVariable Long registrationId) {
        Long count = attendanceService.getAttendanceCountByEventAndRegistration(eventId, registrationId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
    
    @GetMapping("/session/{sessionId}/registration/{registrationId}/check")
    public ResponseEntity<ApiResponse<Boolean>> checkIfAttended(
            @PathVariable Long sessionId,
            @PathVariable Long registrationId) {
        Boolean hasAttended = attendanceService.hasAttended(sessionId, registrationId);
        return ResponseEntity.ok(ApiResponse.success(hasAttended));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deleteAttendance(@PathVariable Long id) {
        attendanceService.deleteAttendance(id);
        return ResponseEntity.ok(ApiResponse.success("Attendance deleted successfully", null));
    }
}
