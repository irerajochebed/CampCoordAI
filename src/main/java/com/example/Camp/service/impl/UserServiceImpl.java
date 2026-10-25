package com.example.Camp.service.impl;

import com.example.Camp.dto.user.ProvisionCoordinatorRequest;
import com.example.Camp.dto.user.UserResponse;
import com.example.Camp.dto.user.UserRolePositionRequest;
import com.example.Camp.dto.user.UserUpdateRequest;
import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.entity.User;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import com.example.Camp.exception.BadRequestException;
import com.example.Camp.exception.DuplicateResourceException;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.OrganizationUnitRepository;
import com.example.Camp.repository.UserRepository;
import com.example.Camp.repository.DepartmentRepository;
import com.example.Camp.entity.Department;
import com.example.Camp.service.JurisdictionScopeService;
import com.example.Camp.service.UserService;
import com.example.Camp.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final DtoMapper dtoMapper;
    private final JurisdictionScopeService jurisdictionScopeService;
    
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = null;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            currentUser = userRepository.findByEmail(auth.getName()).orElse(null);
        }

        List<Long> accessibleOrgUnitIds = null;
        if (currentUser != null && currentUser.getRole() != Role.ADMINISTRATOR) {
            if (jurisdictionScopeService.isUnionWideScope(currentUser)) {
                // Union Leader / Union Administrator manages the leaders within the union
                accessibleOrgUnitIds = null;
            } else {
                accessibleOrgUnitIds = jurisdictionScopeService.getAccessibleOrganizationUnitIds(currentUser);
            }
        }

        final List<Long> scopedUnitIds = accessibleOrgUnitIds;

        return userRepository.findAll().stream()
                .filter(user -> !Boolean.TRUE.equals(user.getDeleted()))
                .filter(user -> scopedUnitIds == null || (user.getOrganizationUnit() != null && scopedUnitIds.contains(user.getOrganizationUnit().getId())))
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
            user.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName().trim());
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new DuplicateResourceException("User", "email", newEmail);
            }
            user.setEmail(newEmail);
        }
        if (request.getPhoneNumber() != null) {
            String newPhone = request.getPhoneNumber().trim();
            if (!newPhone.isEmpty() && !newPhone.equals(user.getPhoneNumber()) && userRepository.existsByPhoneNumber(newPhone)) {
                throw new DuplicateResourceException("User", "phoneNumber", newPhone);
            }
            user.setPhoneNumber(newPhone.isEmpty() ? null : newPhone);
        }
        if (request.getPosition() != null) {
            user.setPosition(request.getPosition());
        }
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
            user.setDepartment(department);
            if (user.getPosition() == Position.DEPARTMENT_LEADER || user.getPosition() == Position.MINISTRY_LEADER) {
                department.setLeader(user);
                departmentRepository.save(department);
            }
        }
        if (request.getGovernmentDistrict() != null) {
            user.setGovernmentDistrict(request.getGovernmentDistrict());
        }
        if (request.getSdaDistrict() != null) {
            user.setSdaDistrict(request.getSdaDistrict());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getDateOfBirth() != null) {
            if (request.getDateOfBirth().isAfter(java.time.LocalDate.now())) {
                throw new BadRequestException("Date of birth cannot be in the future");
            }
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl().trim().isEmpty() ? null : request.getProfileImageUrl());
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

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
        }

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
                .department(department)
                .governmentDistrict(request.getGovernmentDistrict())
                .sdaDistrict(request.getSdaDistrict())
                .preferredLanguage(request.getPreferredLanguage() != null && !request.getPreferredLanguage().trim().isEmpty() ? request.getPreferredLanguage().trim() : "en")
                .active(true)
                .deleted(false)
                .build();

        User savedCoordinator = userRepository.save(coordinator);

        if (department != null && (savedCoordinator.getPosition() == Position.DEPARTMENT_LEADER || 
                                   savedCoordinator.getPosition() == Position.MINISTRY_LEADER)) {
            department.setLeader(savedCoordinator);
            departmentRepository.save(department);
            log.info("Assigned coordinator {} as leader of department {}", savedCoordinator.getEmail(), department.getName());
        }

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
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
            user.setDepartment(department);
            if (user.getPosition() == Position.DEPARTMENT_LEADER || user.getPosition() == Position.MINISTRY_LEADER) {
                department.setLeader(user);
                departmentRepository.save(department);
            }
        }
        if (request.getGovernmentDistrict() != null) {
            user.setGovernmentDistrict(request.getGovernmentDistrict());
        }
        if (request.getSdaDistrict() != null) {
            user.setSdaDistrict(request.getSdaDistrict());
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

    @Override
    public UserResponse uploadAvatar(Long id, org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new com.example.Camp.exception.BadRequestException("Uploaded file is empty");
        }

        User user = getUserById(id);

        try {
            java.io.File uploadDir = new java.io.File("uploads/avatars");
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalFilename != null && originalFilename.lastIndexOf('.') > 0) {
                extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            }

            String filename = "user_" + id + "_" + System.currentTimeMillis() + extension;
            java.nio.file.Path targetPath = uploadDir.toPath().resolve(filename);
            java.nio.file.Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = "/uploads/avatars/" + filename;
            user.setProfileImageUrl(avatarUrl);
            User savedUser = userRepository.save(user);

            log.info("Saved avatar for user {} at {}", user.getEmail(), avatarUrl);
            return dtoMapper.toUserResponse(savedUser);
        } catch (java.io.IOException e) {
            log.error("Failed to save avatar image file", e);
            throw new com.example.Camp.exception.BadRequestException("Failed to save avatar file: " + e.getMessage());
        }
    }
}
