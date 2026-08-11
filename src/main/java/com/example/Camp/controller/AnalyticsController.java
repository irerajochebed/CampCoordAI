package com.example.Camp.controller;

import com.example.Camp.dto.analytics.AdminDashboardResponse;
import com.example.Camp.dto.analytics.CoordinatorDashboardResponse;
import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.security.UserDetailsImpl;
import com.example.Camp.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/analytics", "/api/analytics"})
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping({"/dashboard/admin", "/admin/dashboard"})
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAdminDashboard() {
        AdminDashboardResponse response = analyticsService.getAdminDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard statistics retrieved successfully", response));
    }

    @GetMapping({"/dashboard/coordinator", "/coordinator/dashboard", "/coordinator/{coordinatorId}/dashboard"})
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<CoordinatorDashboardResponse>> getCoordinatorDashboard(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        CoordinatorDashboardResponse response = analyticsService.getCoordinatorDashboardStats(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Coordinator dashboard statistics retrieved successfully", response));
    }
}
