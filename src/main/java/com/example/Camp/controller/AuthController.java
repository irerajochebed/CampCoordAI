package com.example.Camp.controller;

import com.example.Camp.dto.auth.LoginRequest;
import com.example.Camp.dto.auth.LoginResponse;
import com.example.Camp.dto.auth.RegisterRequest;
import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.dto.user.UserResponse;
import com.example.Camp.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.Camp.dto.auth.ChangePasswordRequest;
import com.example.Camp.exception.BadRequestException;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }
    
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        UserResponse response = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @RequestBody(required = false) ChangePasswordRequest bodyRequest,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String oldPassword,
            @RequestParam(required = false) String newPassword) {
        
        Long targetUserId = (bodyRequest != null && bodyRequest.getUserId() != null) ? bodyRequest.getUserId() : userId;
        String oldPwd = (bodyRequest != null && bodyRequest.getOldPassword() != null) ? bodyRequest.getOldPassword() : oldPassword;
        String newPwd = (bodyRequest != null && bodyRequest.getNewPassword() != null) ? bodyRequest.getNewPassword() : newPassword;

        if (targetUserId == null) {
            try {
                UserResponse currentUser = authService.getCurrentUser();
                if (currentUser != null) {
                    targetUserId = currentUser.getId();
                }
            } catch (Exception e) {
                // Ignore if not in security context
            }
        }

        if (targetUserId == null || oldPwd == null || newPwd == null) {
            throw new BadRequestException("User ID, current password, and new password are required");
        }

        authService.changePassword(targetUserId, oldPwd, newPwd);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
