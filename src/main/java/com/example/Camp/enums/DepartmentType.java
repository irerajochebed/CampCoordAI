package com.example.Camp.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum DepartmentType {
    YOUTH,
    YOUTH_MINISTRIES,
    WOMEN,
    WOMEN_MINISTRIES,
    CHILDREN,
    CHILDREN_MINISTRIES,
    FAMILY,
    FAMILY_MINISTRIES,
    MINISTERIAL,
    PERSONAL_MINISTRIES,
    CHAPLAINCY,
    POSSIBILITY,
    HEALTH,
    HEALTH_MINISTRIES,
    PUBLISHING,
    PUBLISHING_MINISTRIES,
    STEWARDSHIP,
    STEWARDSHIP_MINISTRIES,
    PARL,
    EDUCATION,
    COMMUNICATION;

    @JsonCreator
    public static DepartmentType fromString(String value) {
        if (value == null || value.isBlank()) {
            return YOUTH;
        }
        String normalized = value.trim().toUpperCase().replace(" ", "_");
        try {
            return DepartmentType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            if (normalized.contains("YOUTH")) return YOUTH;
            if (normalized.contains("WOMEN") || normalized.contains("MIFEM")) return WOMEN;
            if (normalized.contains("CHILD")) return CHILDREN;
            if (normalized.contains("FAMILY")) return FAMILY;
            if (normalized.contains("MINISTER")) return MINISTERIAL;
            if (normalized.contains("PERSONAL") || normalized.contains("SABBATH")) return PERSONAL_MINISTRIES;
            if (normalized.contains("CHAPLAIN")) return CHAPLAINCY;
            if (normalized.contains("POSSIBILITY") || normalized.contains("APM")) return POSSIBILITY;
            if (normalized.contains("HEALTH")) return HEALTH;
            if (normalized.contains("PUBLISH")) return PUBLISHING;
            if (normalized.contains("STEWARD")) return STEWARDSHIP;
            if (normalized.contains("PARL") || normalized.contains("RELIGIOUS")) return PARL;
            if (normalized.contains("EDUCAT")) return EDUCATION;
            if (normalized.contains("COMMUNICAT")) return COMMUNICATION;
            return YOUTH;
        }
    }
}
