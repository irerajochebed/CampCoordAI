package com.example.Camp.service.impl;

import com.example.Camp.dto.auth.LoginRequest;
import com.example.Camp.dto.auth.LoginResponse;
import com.example.Camp.dto.auth.RegisterRequest;
import com.example.Camp.dto.user.UserResponse;
import com.example.Camp.enums.OrganizationLevel;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.entity.User;
import com.example.Camp.exception.BadRequestException;
import com.example.Camp.exception.DuplicateResourceException;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.exception.UnauthorizedException;
import com.example.Camp.repository.OrganizationUnitRepository;
import com.example.Camp.repository.UserRepository;
import com.example.Camp.security.JwtUtils;
import com.example.Camp.security.UserDetailsImpl;
import com.example.Camp.service.AuthService;
import com.example.Camp.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthServiceImpl implements AuthService {
    
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final OrganizationUnitRepository organizationUnitRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final DtoMapper dtoMapper;
    
    @Override
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getEmail()));
        
        if (Boolean.FALSE.equals(user.getActive()) || Boolean.TRUE.equals(user.getDeleted())) {
            throw new BadRequestException("Your account is inactive or disabled. Please contact the administrator.");
        }

        // Validate portal type against user role
        if (request.getPortal() != null && !request.getPortal().trim().isEmpty()) {
            String portal = request.getPortal().trim().toUpperCase();
            if ("PARTICIPANT".equals(portal)) {
                if (user.getRole() != Role.PARTICIPANT) {
                    throw new BadRequestException("Access denied for Participant Portal. Coordinators & Administrators must sign in through the Coordinator & Administration Portal.");
                }
            } else if ("COORDINATOR_ADMIN".equals(portal) || "COORDINATOR".equals(portal) || "STAFF".equals(portal)) {
                if (user.getRole() != Role.COORDINATOR && user.getRole() != Role.ADMINISTRATOR) {
                    throw new BadRequestException("Access denied for Coordinator & Administration Portal. Church members must sign in through the Participant Portal.");
                }
            }
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        log.info("User logged in: {} [Role: {}, Portal: {}]", user.getEmail(), user.getRole(), request.getPortal());
        
        return LoginResponse.builder()
                .token(jwt)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .position(user.getPosition())
                .organizationUnitId(user.getOrganizationUnit().getId())
                .organizationUnitName(user.getOrganizationUnit().getName())
                .preferredLanguage(user.getPreferredLanguage() != null ? user.getPreferredLanguage() : "en")
                .build();
    }
    
    @Override
    public UserResponse register(RegisterRequest request) {
        // Validate email uniqueness
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }
        
        // Validate phone number uniqueness
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty() && userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new DuplicateResourceException("User", "phoneNumber", request.getPhoneNumber());
        }
        
        // Determine organization unit
        OrganizationUnit organizationUnit;
        String customChurchName = request.getCustomChurchName();
        if (customChurchName != null && !customChurchName.trim().isEmpty()) {
            Long districtId = request.getDistrictId() != null ? request.getDistrictId() : request.getOrganizationUnitId();
            if (districtId == null) {
                throw new BadRequestException("District ID is required when providing a custom church name");
            }
            OrganizationUnit district = organizationUnitRepository.findById(districtId)
                    .orElseThrow(() -> new ResourceNotFoundException("District", "id", districtId));

            // Auto-create custom church record under the selected district so future users can see it
            String cleanName = customChurchName.trim();
            String codePrefix = district.getCode() != null ? district.getCode() : "DIST-" + district.getId();
            String generatedCode = codePrefix + "-CH-" + (System.currentTimeMillis() % 100000);

            organizationUnit = OrganizationUnit.builder()
                    .name(cleanName)
                    .level(OrganizationLevel.CHURCH)
                    .parent(district)
                    .isCustom(true)
                    .code(generatedCode)
                    .location(district.getLocation())
                    .build();
            organizationUnit = organizationUnitRepository.save(organizationUnit);
            log.info("Auto-created custom church unit: '{}' under district ID: {}", cleanName, districtId);
        } else {
            if (request.getOrganizationUnitId() == null) {
                throw new BadRequestException("Organization unit ID is required");
            }
            organizationUnit = organizationUnitRepository.findById(request.getOrganizationUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("OrganizationUnit", "id", request.getOrganizationUnitId()));
        }

        // Self-registration strictly enforces PARTICIPANT role (public users cannot register as Coordinator or Administrator)
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PARTICIPANT)
                .position(null)
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .organizationUnit(organizationUnit)
                .customChurchName(customChurchName != null && !customChurchName.trim().isEmpty() ? customChurchName.trim() : null)
                .preferredLanguage(request.getPreferredLanguage() != null && !request.getPreferredLanguage().trim().isEmpty() ? request.getPreferredLanguage() : "en")
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Participant user self-registered successfully: {}", savedUser.getEmail());

        return dtoMapper.toUserResponse(savedUser);
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("No authenticated user found");
        }
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        
        return dtoMapper.toUserResponse(user);
    }
    
    @Override
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BadRequestException("Old password is incorrect");
        }
        
        // Set new password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        log.info("Password changed for user: {}", user.getEmail());
    }
}
