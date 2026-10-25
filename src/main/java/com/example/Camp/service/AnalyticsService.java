package com.example.Camp.service;

import com.example.Camp.dto.analytics.AIInsightsResponse;
import com.example.Camp.dto.analytics.AdminDashboardResponse;
import com.example.Camp.dto.analytics.CoordinatorDashboardResponse;
import com.example.Camp.entity.User;

public interface AnalyticsService {
    
    AdminDashboardResponse getAdminDashboardStats();
    
    CoordinatorDashboardResponse getCoordinatorDashboardStats(Long coordinatorId);

    AIInsightsResponse getAIInsightsStats();

    AIInsightsResponse getAIInsightsStats(User currentUser);
}
