package com.example.Camp.service;

import com.example.Camp.dto.analytics.AdminDashboardResponse;
import com.example.Camp.dto.analytics.CoordinatorDashboardResponse;

public interface AnalyticsService {
    
    AdminDashboardResponse getAdminDashboardStats();
    
    CoordinatorDashboardResponse getCoordinatorDashboardStats(Long coordinatorId);
}
