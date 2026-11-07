/**
 * Role-based Session Inactivity Timeout Configuration
 * 
 * Rules:
 * - Admin & Coordinator with Finance role: 5 minutes without use -> auto-logout
 * - Standard Coordinator: 15 minutes without use -> auto-logout
 * - Participant: 5 hours without use -> auto-logout
 */

export const SESSION_TIMEOUTS = {
  // 5 minutes for Admin & Coordinator with finance role
  FAST_TIMEOUT_MS: 5 * 60 * 1000,
  // 15 minutes for standard Coordinator
  COORDINATOR_TIMEOUT_MS: 15 * 60 * 1000,
  // 5 hours for Participant
  PARTICIPANT_TIMEOUT_MS: 5 * 60 * 60 * 1000,
};

/**
 * Returns the exact inactivity timeout in milliseconds for the user.
 * 
 * @param {Object} user 
 * @returns {number} timeout in milliseconds
 */
export function getSessionInactivityTimeout(user) {
  if (!user) return SESSION_TIMEOUTS.COORDINATOR_TIMEOUT_MS;

  const role = (user.role || '').toUpperCase().trim();
  const position = (user.position || '').toUpperCase().trim();
  const departmentName = (user.departmentName || user.department?.name || '').toLowerCase();

  const isFinanceOfficer = position === 'FINANCE_OFFICER' || 
                           departmentName.includes('finance') || 
                           departmentName.includes('stewardship') ||
                           departmentName.includes('treasury');

  const isAdmin = role === 'ADMINISTRATOR' || position === 'UNION_ADMINISTRATOR';

  // Admin or Coordinator with finance role: 5 minutes
  if (isAdmin || (role === 'COORDINATOR' && isFinanceOfficer) || isFinanceOfficer) {
    return SESSION_TIMEOUTS.FAST_TIMEOUT_MS;
  }

  // Participant: 5 hours
  if (role === 'PARTICIPANT') {
    return SESSION_TIMEOUTS.PARTICIPANT_TIMEOUT_MS;
  }

  // Standard Coordinator: 15 minutes
  return SESSION_TIMEOUTS.COORDINATOR_TIMEOUT_MS;
}
