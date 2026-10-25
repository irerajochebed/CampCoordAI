/**
 * Utility helper to format and resolve specific user roles and position titles.
 * Prioritizes specific church/field leadership designations (e.g. Field Leader for NRF,
 * Local Church Leader for church units, Department Leader, District Pastor) over generic 'Coordinator'.
 */

export function getUserDisplayRole(user, t) {
  if (!user) return 'User';

  const translate = (key, fallback) => {
    if (typeof t === 'function') {
      return t(key, fallback);
    }
    return fallback;
  };

  // 1. If explicit position is assigned, use it
  if (user.position) {
    const posKey = `positions.${user.position}`;
    const fallbackText = user.position
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    
    return translate(posKey, fallbackText);
  }

  // 2. If Coordinator role, determine specific leadership role based on organization level or unit name
  if (user.role === 'COORDINATOR') {
    const orgLevel = user.organizationLevel || '';
    const orgName = (user.organizationUnitName || '').toUpperCase();

    // Check if assigned to a Field / Conference (e.g., NRF, CRF, WRF, SERF, NERF, ETR)
    if (
      orgLevel === 'FIELD' ||
      orgName.includes('FIELD') ||
      orgName.includes('CONFERENCE') ||
      orgName.includes('NRF') ||
      orgName.includes('CRF') ||
      orgName.includes('WRF') ||
      orgName.includes('NERF') ||
      orgName.includes('SERF') ||
      orgName.includes('ETR')
    ) {
      return translate('positions.FIELD_LEADER', 'Field Leader');
    }

    // Check if assigned to a Local Church
    if (
      orgLevel === 'LOCAL_CHURCH' ||
      orgLevel === 'CHURCH' ||
      orgName.includes('CHURCH') ||
      orgName.includes('ITORERO')
    ) {
      return translate('positions.LOCAL_CHURCH_LEADER', 'Local Church Leader');
    }

    // Check if assigned to a District
    if (orgLevel === 'DISTRICT' || orgName.includes('DISTRICT')) {
      return translate('positions.DISTRICT_PASTOR', 'District Leader');
    }

    // Check if assigned to Union level
    if (orgLevel === 'UNION' || orgName.includes('UNION') || orgName.includes('RUM')) {
      return translate('positions.UNION_LEADER', 'Union Leader');
    }

    // Generic fallback for Coordinator
    return translate('roles.COORDINATOR', 'Coordinator');
  }

  // 3. Administrator Role
  if (user.role === 'ADMINISTRATOR') {
    return translate('roles.ADMINISTRATOR', 'Administrator');
  }

  // 4. Participant / Member Role
  if (user.role === 'PARTICIPANT') {
    return translate('roles.PARTICIPANT', 'Church Member');
  }

  return translate(`roles.${user.role}`, user.role || 'User');
}

/**
 * Resolves profile image URLs (handling blob:, data:, full http:, and relative /uploads/... paths)
 */
export function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendOrigin}${cleanPath}`;
}
