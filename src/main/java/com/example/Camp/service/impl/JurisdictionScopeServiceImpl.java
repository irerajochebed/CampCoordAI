package com.example.Camp.service.impl;

import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.entity.Payment;
import com.example.Camp.entity.Registration;
import com.example.Camp.entity.User;
import com.example.Camp.enums.OrganizationLevel;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import com.example.Camp.exception.UnauthorizedException;
import com.example.Camp.repository.OrganizationUnitRepository;
import com.example.Camp.service.JurisdictionScopeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class JurisdictionScopeServiceImpl implements JurisdictionScopeService {

    private final OrganizationUnitRepository organizationUnitRepository;

    @Override
    public boolean isUnionWideScope(User user) {
        if (user == null) return false;
        
        // 1. Role: ADMINISTRATOR has full union-wide access
        if (user.getRole() == Role.ADMINISTRATOR) {
            return true;
        }

        Position pos = user.getPosition();
        if (pos == Position.UNION_ADMINISTRATOR || pos == Position.UNION_LEADER) {
            return true;
        }

        // 2. Union-level officers (stationed at Rwanda Union Mission / UNION level)
        if (user.getOrganizationUnit() != null && user.getOrganizationUnit().getLevel() == OrganizationLevel.UNION) {
            return true;
        }

        return false;
    }

    @Override
    public List<Long> getAccessibleOrganizationUnitIds(User user) {
        if (user == null) return Collections.emptyList();
        
        // Union-wide users have access to all units without restrictions
        if (isUnionWideScope(user)) {
            return Collections.emptyList();
        }

        Position pos = user.getPosition();
        OrganizationUnit orgUnit = user.getOrganizationUnit();

        // 1. FIELD LEVEL (e.g. Field Leader / Field Officers)
        // Access: The Field unit + all child Districts + all child Churches
        if (pos == Position.FIELD_LEADER || (orgUnit != null && orgUnit.getLevel() == OrganizationLevel.FIELD)) {
            Long fieldId = resolveFieldUnitId(orgUnit);
            if (fieldId != null) {
                List<Long> unitIds = organizationUnitRepository.findUnitIdsUnderField(fieldId);
                log.debug("Resolved Field-level scope for user {}: {} units under fieldId {}", user.getEmail(), unitIds.size(), fieldId);
                return unitIds;
            }
        }

        // 2. DISTRICT LEVEL (e.g. District Pastor / Pastor)
        // Access: The District unit + all child Churches under this district
        if (pos == Position.DISTRICT_PASTOR || pos == Position.PASTOR || (orgUnit != null && orgUnit.getLevel() == OrganizationLevel.DISTRICT)) {
            Long districtId = resolveDistrictUnitId(orgUnit);
            
            // Fallback: Check if user has sdaDistrict field code/name
            if (districtId == null && user.getSdaDistrict() != null && !user.getSdaDistrict().isBlank()) {
                String sdaDist = user.getSdaDistrict().trim();
                OrganizationUnit matched = organizationUnitRepository.findByCode(sdaDist)
                        .or(() -> organizationUnitRepository.searchByName(sdaDist).stream().findFirst())
                        .orElse(null);
                if (matched != null) {
                    districtId = resolveDistrictUnitId(matched);
                }
            }

            if (districtId != null) {
                List<Long> unitIds = organizationUnitRepository.findUnitIdsUnderDistrict(districtId);
                log.debug("Resolved District-level scope for user {}: {} units under districtId {}", user.getEmail(), unitIds.size(), districtId);
                return unitIds;
            }
        }

        // 3. LOCAL CHURCH LEVEL (e.g. Local Church Leader)
        if (orgUnit != null && (orgUnit.getLevel() == OrganizationLevel.CHURCH || orgUnit.getLevel() == OrganizationLevel.LOCAL_CHURCH)) {
            return Collections.singletonList(orgUnit.getId());
        }

        // 4. Default fallback: user's assigned unit
        if (orgUnit != null && orgUnit.getId() != null) {
            return Collections.singletonList(orgUnit.getId());
        }

        return Collections.emptyList();
    }

    @Override
    public boolean isRegistrationInJurisdiction(User user, Registration registration) {
        if (user == null || registration == null) return false;
        if (isUnionWideScope(user)) return true;

        // Participant viewing their own registration
        if (registration.getParticipant() != null && registration.getParticipant().getId().equals(user.getId())) {
            return true;
        }

        // Coordinator/Pastor who registered the participant on their behalf
        if (registration.getRegisteredBy() != null && registration.getRegisteredBy().getId().equals(user.getId())) {
            return true;
        }

        // Check if participant's organization unit belongs to user's jurisdiction subtree
        if (registration.getParticipant() != null && registration.getParticipant().getOrganizationUnit() != null) {
            Long participantUnitId = registration.getParticipant().getOrganizationUnit().getId();
            List<Long> accessibleIds = getAccessibleOrganizationUnitIds(user);
            return accessibleIds.contains(participantUnitId);
        }

        return false;
    }

    @Override
    public boolean isPaymentInJurisdiction(User user, Payment payment) {
        if (user == null || payment == null) return false;
        if (isUnionWideScope(user)) return true;
        if (payment.getRegistration() == null) return false;

        return isRegistrationInJurisdiction(user, payment.getRegistration());
    }

    @Override
    public void validateRegistrationAccess(User user, Registration registration) {
        if (user == null || registration == null) return;
        if (!isRegistrationInJurisdiction(user, registration)) {
            String userUnit = (user.getOrganizationUnit() != null) ? user.getOrganizationUnit().getName() : "Local jurisdiction";
            log.warn("Unauthorized registration access blocked: User {} ({}) attempted to access Registration #{} belonging to participant outside jurisdiction",
                    user.getEmail(), userUnit, registration.getRegistrationNumber());
            throw new UnauthorizedException("Access Denied: Registration #" + registration.getRegistrationNumber() + 
                    " belongs to a participant outside your assigned jurisdiction (" + userUnit + ")");
        }
    }

    @Override
    public void validatePaymentAccess(User user, Payment payment) {
        if (user == null || payment == null) return;
        if (!isPaymentInJurisdiction(user, payment)) {
            String userUnit = (user.getOrganizationUnit() != null) ? user.getOrganizationUnit().getName() : "Local jurisdiction";
            log.warn("Unauthorized payment access blocked: User {} ({}) attempted to access Payment #{} belonging to participant outside jurisdiction",
                    user.getEmail(), userUnit, payment.getTransactionReference());
            throw new UnauthorizedException("Access Denied: Payment transaction #" + payment.getTransactionReference() + 
                    " belongs to a participant outside your assigned jurisdiction (" + userUnit + ")");
        }
    }

    @Override
    public Long resolveFieldUnitId(OrganizationUnit unit) {
        if (unit == null) return null;
        if (unit.getLevel() == OrganizationLevel.FIELD) return unit.getId();
        if (unit.getParent() != null) return resolveFieldUnitId(unit.getParent());
        return null;
    }

    @Override
    public Long resolveDistrictUnitId(OrganizationUnit unit) {
        if (unit == null) return null;
        if (unit.getLevel() == OrganizationLevel.DISTRICT) return unit.getId();
        if (unit.getParent() != null) return resolveDistrictUnitId(unit.getParent());
        return null;
    }
}
