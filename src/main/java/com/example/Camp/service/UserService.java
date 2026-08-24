package com.example.Camp.service;

import com.example.Camp.dto.user.ProvisionCoordinatorRequest;
import com.example.Camp.dto.user.UserResponse;
import com.example.Camp.dto.user.UserRolePositionRequest;
import com.example.Camp.dto.user.UserUpdateRequest;
import com.example.Camp.entity.User;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;

import java.util.List;

public interface UserService {
    
    User getUserById(Long id);
    
    User getUserByEmail(String email);
    
    UserResponse getUserResponseById(Long id);
    
    List<UserResponse> getAllUsers();

    List<UserResponse> getAllUsersFiltered(Role role, Position position, Long organizationUnitId, Boolean active, String keyword);
    
    List<UserResponse> getUsersByRole(Role role);
    
    List<UserResponse> getUsersByOrganizationUnit(Long organizationUnitId);
    
    List<UserResponse> searchUsers(String keyword);
    
    UserResponse updateUser(Long id, UserUpdateRequest request);

    UserResponse updateUserRolePosition(Long id, UserRolePositionRequest request);
    
    UserResponse provisionCoordinator(ProvisionCoordinatorRequest request);
    
    void deactivateUser(Long id);
    
    void activateUser(Long id);
    
    void deleteUser(Long id);
    
    Long countUsersByRole(Role role);
}
