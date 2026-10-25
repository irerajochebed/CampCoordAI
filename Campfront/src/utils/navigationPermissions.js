/**
 * SDA Rwanda Union Mission (RUM) Governance Hierarchy Navigation & Route Permission Matrix
 * 
 * Defines strict role and position visibility across CampCoordAI.
 */

export const NAV_KEYS = {
  DASHBOARD: 'dashboard',
  PROPOSALS: 'proposals',
  EVENTS: 'events',
  REGISTRATIONS: 'registrations',
  ATTENDANCE: 'attendance',
  ACCOMMODATION: 'accommodation',
  PAYMENTS: 'payments',
  RESOURCES: 'resources',
  ANALYTICS: 'analytics',
  COMMUNICATION: 'communication',
  DEPARTMENTS: 'departments',
  ORGANIZATION: 'organization',
  USERS: 'users',
};

const ALL_MASTER_TABS = [
  NAV_KEYS.DASHBOARD,
  NAV_KEYS.PROPOSALS,
  NAV_KEYS.EVENTS,
  NAV_KEYS.REGISTRATIONS,
  NAV_KEYS.ATTENDANCE,
  NAV_KEYS.ACCOMMODATION,
  NAV_KEYS.PAYMENTS,
  NAV_KEYS.RESOURCES,
  NAV_KEYS.ANALYTICS,
  NAV_KEYS.COMMUNICATION,
  NAV_KEYS.DEPARTMENTS,
  NAV_KEYS.ORGANIZATION,
  NAV_KEYS.USERS,
];

/**
 * Returns the exact list of allowed navigation keys for a given user.
 * Evaluates Role.java and Position.java according to SDA RUM official governance structure.
 * 
 * @param {Object} user - Authenticated user object containing `role`, `position`, `organizationLevel`
 * @returns {string[]} Array of allowed NAV_KEYS
 */
export function getAllowedNavKeys(user) {
  if (!user) return [];

  // 1. ADMINISTRATOR (UNION_ADMINISTRATOR) - Full system authority
  if (user.role === 'ADMINISTRATOR' || user.position === 'UNION_ADMINISTRATOR') {
    return ALL_MASTER_TABS;
  }

  const pos = user.position ? String(user.position).toUpperCase().trim() : '';

  // 2. UNION_LEADER & FIELD_LEADER
  // Access: Dashboard, Proposals, Events & Camps, Registrations, Attendance, Accommodation, Payments, Resources, AI Insights, Communication
  // Hide: Departments, Hierarchy Units, User Directory
  if (pos === 'UNION_LEADER' || pos === 'FIELD_LEADER') {
    return [
      NAV_KEYS.DASHBOARD,
      NAV_KEYS.PROPOSALS,
      NAV_KEYS.EVENTS,
      NAV_KEYS.REGISTRATIONS,
      NAV_KEYS.ATTENDANCE,
      NAV_KEYS.ACCOMMODATION,
      NAV_KEYS.PAYMENTS,
      NAV_KEYS.RESOURCES,
      NAV_KEYS.ANALYTICS,
      NAV_KEYS.COMMUNICATION,
    ];
  }

  // 3. MINISTRY_LEADER & DEPARTMENT_LEADER
  // Access: Dashboard, Proposals, Events & Camps, Registrations, Attendance, Resources, AI Insights, Communication
  // Hide: Accommodation, Payments, Departments, Hierarchy Units, User Directory
  if (pos === 'MINISTRY_LEADER' || pos === 'DEPARTMENT_LEADER') {
    return [
      NAV_KEYS.DASHBOARD,
      NAV_KEYS.PROPOSALS,
      NAV_KEYS.EVENTS,
      NAV_KEYS.REGISTRATIONS,
      NAV_KEYS.ATTENDANCE,
      NAV_KEYS.RESOURCES,
      NAV_KEYS.ANALYTICS,
      NAV_KEYS.COMMUNICATION,
    ];
  }

  // 4. DISTRICT_PASTOR & PASTOR (& LOCAL_CHURCH_LEADER)
  // Access: Dashboard, Proposals, Events & Camps, Registrations, Payments, Communication
  // Hide: Attendance, Accommodation, Resources, AI Insights, Departments, Hierarchy Units, User Directory
  if (pos === 'DISTRICT_PASTOR' || pos === 'PASTOR' || pos === 'LOCAL_CHURCH_LEADER') {
    return [
      NAV_KEYS.DASHBOARD,
      NAV_KEYS.PROPOSALS,
      NAV_KEYS.EVENTS,
      NAV_KEYS.REGISTRATIONS,
      NAV_KEYS.PAYMENTS,
      NAV_KEYS.COMMUNICATION,
    ];
  }

  // 5. CAMP_DIRECTOR
  // Access: Dashboard, Proposals, Events & Camps, Registrations, Attendance, Accommodation, Resources, Communication
  // Hide: Payments, AI Insights, Departments, Hierarchy Units, User Directory
  if (pos === 'CAMP_DIRECTOR') {
    return [
      NAV_KEYS.DASHBOARD,
      NAV_KEYS.PROPOSALS,
      NAV_KEYS.EVENTS,
      NAV_KEYS.REGISTRATIONS,
      NAV_KEYS.ATTENDANCE,
      NAV_KEYS.ACCOMMODATION,
      NAV_KEYS.RESOURCES,
      NAV_KEYS.COMMUNICATION,
    ];
  }

  // 6. FINANCE_OFFICER
  // Access: Dashboard, Events & Camps, Registrations, Payments, AI Insights, Communication
  // Hide: Proposals, Attendance, Accommodation, Resources, Departments, Hierarchy Units, User Directory
  if (pos === 'FINANCE_OFFICER') {
    return [
      NAV_KEYS.DASHBOARD,
      NAV_KEYS.EVENTS,
      NAV_KEYS.REGISTRATIONS,
      NAV_KEYS.PAYMENTS,
      NAV_KEYS.ANALYTICS,
      NAV_KEYS.COMMUNICATION,
    ];
  }

  // 7. CAMP_SECRETARY
  // Access: Dashboard, Events & Camps, Registrations, Attendance, Communication
  // Hide: Proposals, Accommodation, Payments, Resources, AI Insights, Departments, Hierarchy Units, User Directory
  if (pos === 'CAMP_SECRETARY') {
    return [
      NAV_KEYS.DASHBOARD,
      NAV_KEYS.EVENTS,
      NAV_KEYS.REGISTRATIONS,
      NAV_KEYS.ATTENDANCE,
      NAV_KEYS.COMMUNICATION,
    ];
  }

  // 8. ACCOMMODATION_OFFICER
  // Access: Dashboard, Events & Camps, Registrations, Accommodation, Communication
  // Hide: Proposals, Attendance, Payments, Resources, AI Insights, Departments, Hierarchy Units, User Directory
  if (pos === 'ACCOMMODATION_OFFICER') {
    return [
      NAV_KEYS.DASHBOARD,
      NAV_KEYS.EVENTS,
      NAV_KEYS.REGISTRATIONS,
      NAV_KEYS.ACCOMMODATION,
      NAV_KEYS.COMMUNICATION,
    ];
  }

  // 9. PA_TEAM & MEDIA_TEAM
  // Access: Dashboard, Events & Camps, Resources, Communication
  // Hide all member/governance tabs
  if (
    pos === 'PA_TEAM' || 
    pos === 'MEDIA_TEAM' ||
    user?.departmentName?.toLowerCase().includes('communication') ||
    user?.departmentName?.toLowerCase().includes('media') ||
    user?.department?.type === 'COMMUNICATION'
  ) {
    return [
      NAV_KEYS.DASHBOARD,
      NAV_KEYS.EVENTS,
      NAV_KEYS.RESOURCES,
      NAV_KEYS.COMMUNICATION,
    ];
  }

  // 10. SPEAKER
  if (pos === 'SPEAKER') {
    return [
      NAV_KEYS.DASHBOARD,
      NAV_KEYS.EVENTS,
      NAV_KEYS.RESOURCES,
      NAV_KEYS.ACCOMMODATION,
      NAV_KEYS.COMMUNICATION,
    ];
  }

  // Fallback for COORDINATOR role if position not explicitly set
  if (user.role === 'COORDINATOR') {
    const orgLevel = (user.organizationLevel || '').toUpperCase();
    const orgName = (user.organizationUnitName || '').toUpperCase();

    if (orgLevel === 'UNION' || orgName.includes('UNION') || orgName.includes('RUM')) {
      return [
        NAV_KEYS.DASHBOARD,
        NAV_KEYS.PROPOSALS,
        NAV_KEYS.EVENTS,
        NAV_KEYS.REGISTRATIONS,
        NAV_KEYS.ATTENDANCE,
        NAV_KEYS.ACCOMMODATION,
        NAV_KEYS.PAYMENTS,
        NAV_KEYS.RESOURCES,
        NAV_KEYS.ANALYTICS,
        NAV_KEYS.COMMUNICATION,
      ];
    }
    if (orgLevel === 'FIELD' || orgName.includes('FIELD') || orgName.includes('CONFERENCE')) {
      return [
        NAV_KEYS.DASHBOARD,
        NAV_KEYS.PROPOSALS,
        NAV_KEYS.EVENTS,
        NAV_KEYS.REGISTRATIONS,
        NAV_KEYS.ATTENDANCE,
        NAV_KEYS.ACCOMMODATION,
        NAV_KEYS.PAYMENTS,
        NAV_KEYS.RESOURCES,
        NAV_KEYS.ANALYTICS,
        NAV_KEYS.COMMUNICATION,
      ];
    }
    if (orgLevel === 'DISTRICT' || orgLevel === 'CHURCH' || orgLevel === 'LOCAL_CHURCH') {
      return [
        NAV_KEYS.DASHBOARD,
        NAV_KEYS.PROPOSALS,
        NAV_KEYS.EVENTS,
        NAV_KEYS.REGISTRATIONS,
        NAV_KEYS.PAYMENTS,
        NAV_KEYS.COMMUNICATION,
      ];
    }
    // General coordinator default
    return [
      NAV_KEYS.DASHBOARD,
      NAV_KEYS.PROPOSALS,
      NAV_KEYS.EVENTS,
      NAV_KEYS.REGISTRATIONS,
      NAV_KEYS.ATTENDANCE,
      NAV_KEYS.ACCOMMODATION,
      NAV_KEYS.RESOURCES,
      NAV_KEYS.COMMUNICATION,
    ];
  }

  // 11. PARTICIPANT (General Member)
  // Access: Dashboard, Events & Camps, Registrations, Accommodation, Communication
  return [
    NAV_KEYS.DASHBOARD,
    NAV_KEYS.EVENTS,
    NAV_KEYS.REGISTRATIONS,
    NAV_KEYS.ACCOMMODATION,
    NAV_KEYS.COMMUNICATION,
  ];
}

/**
 * Checks if a specific navigation key is permitted for the authenticated user.
 * 
 * @param {Object} user - Authenticated user object
 * @param {string} navKey - One of NAV_KEYS values (e.g., 'proposals', 'users')
 * @returns {boolean}
 */
export function isNavAllowed(user, navKey) {
  if (!user || !navKey) return false;
  const allowed = getAllowedNavKeys(user);
  return allowed.includes(navKey);
}
