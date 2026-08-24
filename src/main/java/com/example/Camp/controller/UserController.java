package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.dto.user.ProvisionCoordinatorRequest;
import com.example.Camp.dto.user.UserResponse;
import com.example.Camp.dto.user.UserRolePositionRequest;
import com.example.Camp.dto.user.UserUpdateRequest;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import com.example.Camp.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.example.Camp.service.AuthService;

@RestController
@RequestMapping({"/api/v1/users", "/api/users"})
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    private final AuthService authService;
    
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        UserResponse response = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserResponseById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Position position,
            @RequestParam(required = false) Long organizationUnitId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String keyword) {
        List<UserResponse> response = userService.getAllUsersFiltered(role, position, organizationUnitId, active, keyword);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByRole(@PathVariable Role role) {
        List<UserResponse> response = userService.getUsersByRole(role);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/organization/{organizationUnitId}")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByOrganizationUnit(
            @PathVariable Long organizationUnitId) {
        List<UserResponse> response = userService.getUsersByOrganizationUnit(organizationUnitId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserResponse>>> searchUsers(@RequestParam String keyword) {
        List<UserResponse> response = userService.searchUsers(keyword);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @RequestBody UserUpdateRequest request) {
        UserResponse response = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", response));
    }

    @PutMapping("/{id}/role-position")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRolePosition(
            @PathVariable Long id,
            @RequestBody UserRolePositionRequest request) {
        UserResponse response = userService.updateUserRolePosition(id, request);
        return ResponseEntity.ok(ApiResponse.success("User role and position updated successfully", response));
    }
    
    @PostMapping("/provision-coordinator")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<UserResponse>> provisionCoordinator(
            @Valid @RequestBody ProvisionCoordinatorRequest request) {
        UserResponse response = userService.provisionCoordinator(request);
        return ResponseEntity.ok(ApiResponse.success("Coordinator provisioned successfully", response));
    }
    
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully", null));
    }
    
    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> activateUser(@PathVariable Long id) {
        userService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", null));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }
    
    @GetMapping("/count/role/{role}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<Long>> countUsersByRole(@PathVariable Role role) {
        Long count = userService.countUsersByRole(role);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
