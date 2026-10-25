package com.example.Camp.service;

import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.entity.Payment;
import com.example.Camp.entity.Registration;
import com.example.Camp.entity.User;

import java.util.List;

/**
 * SDA Rwanda Union Mission (RUM) Jurisdiction Hierarchy Data Scoping Service.
 * 
 * Enforces strict jurisdiction-based data scoping across Registration, Payment,
 * and Treasury Ledger modules (Union -> Field -> District -> Local Church).
 */
public interface JurisdictionScopeService {
    
    /**
     * Checks if the user possesses Union-wide audit scope (e.g. Administrator, Union Leaders, Union Finance Officer).
     */
    boolean isUnionWideScope(User user);
    
    /**
     * Returns the list of all OrganizationUnit IDs within the user's jurisdiction subtree.
     * - Field Leader: Field unit + all child districts + all child churches.
     * - District Pastor: District unit + all child churches.
     * - Local Church Leader: Church unit.
     */
    List<Long> getAccessibleOrganizationUnitIds(User user);
    
    /**
     * Checks if a specific registration falls within the user's jurisdiction.
     */
    boolean isRegistrationInJurisdiction(User user, Registration registration);
    
    /**
     * Checks if a specific payment transaction falls within the user's jurisdiction.
     */
    boolean isPaymentInJurisdiction(User user, Payment payment);
    
    /**
     * Validates access and throws UnauthorizedException if registration is outside jurisdiction.
     */
    void validateRegistrationAccess(User user, Registration registration);
    
    /**
     * Validates access and throws UnauthorizedException if payment is outside jurisdiction.
     */
    void validatePaymentAccess(User user, Payment payment);

    /**
     * Traverses up the hierarchy to find the FIELD-level ancestor unit ID.
     */
    Long resolveFieldUnitId(OrganizationUnit unit);

    /**
     * Traverses up the hierarchy to find the DISTRICT-level ancestor unit ID.
     */
    Long resolveDistrictUnitId(OrganizationUnit unit);
}
