import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for dashboard statistics
 * Provides role-based dashboard data
 */
export const useDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch dashboard stats based on user role
  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      let response;
      if (user.role === 'ADMINISTRATOR') {
        response = await analyticsApi.getAdminDashboardStats();
      } else if (user.role === 'COORDINATOR') {
        response = await analyticsApi.getCoordinatorDashboardStats(user.id);
      } else {
        // Participant dashboard - to be implemented
        setStats({});
        setLoading(false);
        return;
      }
      
      setStats(response.data.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-fetch on mount and user change
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Refresh stats
  const refreshStats = useCallback(() => {
    return fetchDashboardStats();
  }, [fetchDashboardStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    isAdmin: user?.role === 'ADMINISTRATOR',
    isCoordinator: user?.role === 'COORDINATOR',
    isParticipant: user?.role === 'PARTICIPANT',
  };
};

export default useDashboard;
