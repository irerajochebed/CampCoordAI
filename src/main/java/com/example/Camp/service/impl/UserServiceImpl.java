package com.example.Camp.service.impl;

import com.example.Camp.dto.user.ProvisionCoordinatorRequest;
import com.example.Camp.dto.user.UserResponse;
import com.example.Camp.dto.user.UserRolePositionRequest;
import com.example.Camp.dto.user.UserUpdateRequest;
import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.entity.User;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import com.example.Camp.exception.DuplicateResourceException;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.OrganizationUnitRepository;
import com.example.Camp.repository.UserRepository;
import com.example.Camp.service.UserService;
import com.example.Camp.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final OrganizationUnitRepository organizationUnitRepository;
    private final PasswordEncoder passwordEncoder;
    private final DtoMapper dtoMapper;
    
    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }
    
    @Override
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserResponseById(Long id) {
        User user = getUserById(id);
        return dtoMapper.toUserResponse(user);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return getAllUsersFiltered(null, null, null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsersFiltered(Role role, Position position, Long organizationUnitId, Boolean active, String keyword) {
        return userRepository.findAll().stream()
                .filter(user -> !Boolean.TRUE.equals(user.getDeleted()))
                .filter(user -> role == null || user.getRole() == role)
                .filter(user -> position == null || user.getPosition() == position)
                .filter(user -> organizationUnitId == null || (user.getOrganizationUnit() != null && user.getOrganizationUnit().getId().equals(organizationUnitId)))
                .filter(user -> active == null || user.getActive().equals(active))
                .filter(user -> keyword == null || keyword.trim().isEmpty() ||
                        (user.getFirstName() != null && user.getFirstName().toLowerCase().contains(keyword.trim().toLowerCase())) ||
                        (user.getLastName() != null && user.getLastName().toLowerCase().contains(keyword.trim().toLowerCase())) ||
                        (user.getEmail() != null && user.getEmail().toLowerCase().contains(keyword.trim().toLowerCase())) ||
                        (user.getPhoneNumber() != null && user.getPhoneNumber().contains(keyword.trim())))
                .map(dtoMapper::toUserResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findActiveByRole(role).stream()
                .map(dtoMapper::toUserResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByOrganizationUnit(Long organizationUnitId) {
        return userRepository.findByRoleAndOrganizationUnitId(null, organizationUnitId).stream()
                .map(dtoMapper::toUserResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String keyword) {
        return userRepository.searchUsers(keyword).stream()
                .map(dtoMapper::toUserResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = getUserById(id);
        
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getPosition() != null) {
            user.setPosition(request.getPosition());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }
        if (request.getPreferredLanguage() != null) {
            user.setPreferredLanguage(request.getPreferredLanguage());
        }
        
        User savedUser = userRepository.save(user);
        log.info("User updated: {}", savedUser.getEmail());
        
        return dtoMapper.toUserResponse(savedUser);
    }
    
    @Override
    public UserResponse provisionCoordinator(ProvisionCoordinatorRequest request) {
        // Validate email uniqueness
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new DuplicateResourceException("User", "email", request.getEmail().trim());
        }

        // Validate phone uniqueness if provided
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty() &&
                userRepository.existsByPhoneNumber(request.getPhoneNumber().trim())) {
            throw new DuplicateResourceException("User", "phoneNumber", request.getPhoneNumber().trim());
        }

        // Verify organization unit exists
        OrganizationUnit organizationUnit = organizationUnitRepository.findById(request.getOrganizationUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("OrganizationUnit", "id", request.getOrganizationUnitId()));

        // Determine initial password (custom provided or default Coord@2026)
        String rawPassword = (request.getPassword() != null && !request.getPassword().trim().isEmpty())
                ? request.getPassword().trim()
                : "Coord@2026";

        User coordinator = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(request.getEmail().trim())
                .phoneNumber(request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty() ? request.getPhoneNumber().trim() : null)
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.COORDINATOR)
                .position(request.getPosition())
                .gender(request.getGender())
                .organizationUnit(organizationUnit)
                .preferredLanguage(request.getPreferredLanguage() != null && !request.getPreferredLanguage().trim().isEmpty() ? request.getPreferredLanguage().trim() : "en")
                .active(true)
                .deleted(false)
                .build();

        User savedCoordinator = userRepository.save(coordinator);
        log.info("Coordinator account provisioned successfully by administrator: {} [Position: {}, OrgUnit: {}]",
                savedCoordinator.getEmail(), savedCoordinator.getPosition(), organizationUnit.getName());

        return dtoMapper.toUserResponse(savedCoordinator);
    }
    
    @Override
    public UserResponse updateUserRolePosition(Long id, UserRolePositionRequest request) {
        User user = getUserById(id);

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getPosition() != null) {
            user.setPosition(request.getPosition());
        }
        if (request.getOrganizationUnitId() != null) {
            OrganizationUnit unit = organizationUnitRepository.findById(request.getOrganizationUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("OrganizationUnit", "id", request.getOrganizationUnitId()));
            user.setOrganizationUnit(unit);
        }
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        User savedUser = userRepository.save(user);
        log.info("Administrator updated role/position for user: {} [Role: {}, Position: {}, OrgUnit: {}]",
                savedUser.getEmail(), savedUser.getRole(), savedUser.getPosition(),
                savedUser.getOrganizationUnit() != null ? savedUser.getOrganizationUnit().getName() : "None");

        return dtoMapper.toUserResponse(savedUser);
    }
    
    @Override
    public void deactivateUser(Long id) {
        User user = getUserById(id);
        user.setActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", user.getEmail());
    }
    
    @Override
    public void activateUser(Long id) {
        User user = getUserById(id);
        user.setActive(true);
        userRepository.save(user);
        log.info("User activated: {}", user.getEmail());
    }
    
    @Override
    public void deleteUser(Long id) {
        User user = getUserById(id);
        user.setDeleted(true);
        user.setActive(false);
        userRepository.save(user);
        log.info("User soft deleted and deactivated: {}", user.getEmail());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long countUsersByRole(Role role) {
        return userRepository.countByRole(role);
    }
}
