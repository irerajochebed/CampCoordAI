package com.example.Camp.service;

import com.example.Camp.dto.auth.LoginRequest;
import com.example.Camp.dto.auth.LoginResponse;
import com.example.Camp.dto.auth.RegisterRequest;
import com.example.Camp.dto.user.UserResponse;

public interface AuthService {
    
    LoginResponse login(LoginRequest request);
    
    UserResponse register(RegisterRequest request);
    
    UserResponse getCurrentUser();
    
    void changePassword(Long userId, String oldPassword, String newPassword);
}
