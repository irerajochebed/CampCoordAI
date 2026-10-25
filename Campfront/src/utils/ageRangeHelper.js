/**
 * Ministry and Event Age Range Helper Utility
 * 
 * Rules:
 * - Youth Ministries / Events: 15 - 25 years old
 * - Children Ministries / Clubs: 6 - 15 years old
 * - MIFEM / Women's Ministries / Family Ministries: All Ages (Children, Adults, and Seniors welcome)
 * - Ministerial / Pastors Advisory: 21+ years old
 * - Health, Stewardship, Publishing, Communication & Others: 18+ years old
 */

export const getMinistryAgeRule = (deptTypeOrName, eventType = '') => {
  const normDept = (deptTypeOrName || '').toString().toUpperCase();
  const normType = (eventType || '').toString().toUpperCase();

  // 1. Youth Ministries / Events
  if (
    normDept.includes('YOUTH') ||
    normType.includes('YOUTH') ||
    normType.includes('AYM') ||
    normDept === 'YOUTH' ||
    normDept === 'YOUTH_MINISTRIES'
  ) {
    return {
      minAge: 15,
      maxAge: 25,
      badgeText: '15 - 25 yrs',
      fullLabel: 'Youth (15 - 25 years)',
      category: 'YOUTH',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
      description: 'Registration is specifically for youth aged between 15 and 25 years old.'
    };
  }

  // 2. Children Ministries / Clubs / Adventurers
  if (
    normDept.includes('CHILD') ||
    normType.includes('CHILD') ||
    normType.includes('ADVENTURER') ||
    normType.includes('PATHFINDER') ||
    normDept === 'CHILDREN' ||
    normDept === 'CHILDREN_MINISTRIES' ||
    normDept === 'CHILDRENS_MINISTRIES'
  ) {
    return {
      minAge: 6,
      maxAge: 15,
      badgeText: '6 - 15 yrs',
      fullLabel: 'Children (6 - 15 years)',
      category: 'CHILDREN',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
      description: 'Registration is open for children and junior club members aged 6 to 15 years.'
    };
  }

  // 3. Women Ministries (MIFEM) / Family Ministries
  if (
    normDept.includes('WOMEN') ||
    normDept.includes('MIFEM') ||
    normDept.includes('FAMILY') ||
    normDept === 'MIFEM' ||
    normDept === 'WOMEN' ||
    normDept === 'WOMEN_MINISTRIES' ||
    normDept === 'FAMILY' ||
    normDept === 'FAMILY_MINISTRIES'
  ) {
    return {
      minAge: null,
      maxAge: null,
      badgeText: 'All Ages (Family & Seniors)',
      fullLabel: 'Family & Seniors (All Ages)',
      category: 'FAMILY_MIFEM',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60',
      description: 'All age groups, mothers, fathers, young couples, and senior church members are welcome.'
    };
  }

  // 4. Ministerial / Pastors Advisory
  if (
    normDept.includes('MINISTER') ||
    normType.includes('ADVISORY') ||
    normDept === 'MINISTERIAL' ||
    normDept === 'MINISTERIAL_ASSOCIATION'
  ) {
    return {
      minAge: 21,
      maxAge: null,
      badgeText: 'Pastors & Elders',
      fullLabel: 'Ministers & Elders (21+ yrs)',
      category: 'MINISTERIAL',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      description: 'Pastoral workers, ordained ministers, local elders, and their spouses.'
    };
  }

  // 5. Default / Adult / General Ministries (Health, Stewardship, Publishing, etc.)
  return {
    minAge: 18,
    maxAge: null,
    badgeText: '18+ yrs',
    fullLabel: 'Adults & Leaders (18+ yrs)',
    category: 'GENERAL',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    description: 'Open to adult church members and departmental leaders.'
  };
};

/**
 * Get formatted age range label for an event
 */
export const getEventAgeDisplay = (event) => {
  if (!event) return 'All Ages';

  // If specific minAge or maxAge is explicitly set on event
  if (event.minAge != null || event.maxAge != null) {
    if (event.minAge != null && event.maxAge != null) {
      return `${event.minAge} - ${event.maxAge} yrs`;
    } else if (event.minAge != null) {
      return `${event.minAge}+ yrs`;
    } else if (event.maxAge != null) {
      return `Up to ${event.maxAge} yrs`;
    }
  }

  // Fallback to ministry rule
  const deptType = event.department?.type || event.department?.name || event.departmentName || '';
  const rule = getMinistryAgeRule(deptType, event.type || event.name);
  return rule.badgeText;
};

/**
 * Calculate age from date of birth (YYYY-MM-DD)
 */
export const calculateAge = (dobString) => {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Validate participant age against event age rules
 */
export const validateParticipantAge = (ageOrDob, event) => {
  if (!event) return { valid: true };

  let age = typeof ageOrDob === 'number' ? ageOrDob : calculateAge(ageOrDob);
  if (age === null || isNaN(age)) {
    return { valid: true }; // Cannot determine, allow
  }

  let minAge = event.minAge;
  let maxAge = event.maxAge;

  if (minAge == null && maxAge == null) {
    const deptType = event.department?.type || event.department?.name || event.departmentName || '';
    const rule = getMinistryAgeRule(deptType, event.type || event.name);
    minAge = rule.minAge;
    maxAge = rule.maxAge;
  }

  if (minAge != null && age < minAge) {
    return {
      valid: false,
      message: `Participant is ${age} years old. Minimum required age for this event is ${minAge} years.`
    };
  }

  if (maxAge != null && age > maxAge) {
    return {
      valid: false,
      message: `Participant is ${age} years old. Maximum age for this event is ${maxAge} years.`
    };
  }

  return { valid: true };
};

/**
 * Get gender eligibility rule for an event
 */
export const getEventGenderRule = (event) => {
  if (!event) return { requiredGender: null, label: 'All Genders', isRestricted: false, badgeColor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300' };

  let targetGender = event.targetGender;

  if (!targetGender) {
    const dept = (event.department?.name || event.departmentName || event.department?.type || '').toUpperCase();
    const name = (event.name || '').toUpperCase();
    if (dept.includes('WOMEN') || dept.includes('MIFEM') || name.includes('WOMEN') || name.includes('MIFEM')) {
      targetGender = 'FEMALE';
    } else if (dept.includes('MEN') || dept.includes('AMO') || name.includes('MEN')) {
      targetGender = 'MALE';
    }
  }

  if (targetGender === 'FEMALE') {
    return {
      requiredGender: 'FEMALE',
      label: 'Women Only',
      isRestricted: true,
      badgeColor: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800/60',
      description: 'Registration is specifically for women and female members.'
    };
  }

  if (targetGender === 'MALE') {
    return {
      requiredGender: 'MALE',
      label: 'Men Only',
      isRestricted: true,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60',
      description: 'Registration is specifically for men and male members.'
    };
  }

  return {
    requiredGender: null,
    label: 'All Genders',
    isRestricted: false,
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    description: 'Open to both male and female participants.'
  };
};

/**
 * Validate participant gender against event gender requirement
 */
export const validateParticipantGender = (participantGender, event) => {
  if (!event) return { valid: true };

  const genderRule = getEventGenderRule(event);
  if (!genderRule.isRestricted || !genderRule.requiredGender) {
    return { valid: true };
  }

  const normGender = (participantGender || '').toString().toUpperCase();

  if (!normGender) {
    return {
      valid: false,
      message: `This event is restricted to ${genderRule.label.toLowerCase()} participants. Please ensure your gender is selected.`
    };
  }

  if (normGender !== genderRule.requiredGender) {
    return {
      valid: false,
      message: `This event is restricted to ${genderRule.label.toLowerCase()} participants only (Your selected gender: ${normGender.toLowerCase()}).`
    };
  }

  return { valid: true };
};

