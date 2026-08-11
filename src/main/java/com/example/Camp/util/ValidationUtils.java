package com.example.Camp.util;

import com.example.Camp.exception.BadRequestException;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ValidationUtils {
    
    public static void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email cannot be empty");
        }
        
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        if (!email.matches(emailRegex)) {
            throw new BadRequestException("Invalid email format");
        }
    }
    
    public static void validatePhoneNumber(String phoneNumber) {
        if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
            String phoneRegex = "^[+]?[0-9]{10,15}$";
            if (!phoneNumber.matches(phoneRegex)) {
                throw new BadRequestException("Invalid phone number format");
            }
        }
    }
    
    public static void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new BadRequestException("Start date and end date are required");
        }
        
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("End date cannot be before start date");
        }
    }
    
    public static void validateDateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new BadRequestException("Start time and end time are required");
        }
        
        if (endTime.isBefore(startTime)) {
            throw new BadRequestException("End time cannot be before start time");
        }
    }
    
    public static void validatePositiveNumber(Number number, String fieldName) {
        if (number == null) {
            throw new BadRequestException(fieldName + " is required");
        }
        
        if (number.doubleValue() <= 0) {
            throw new BadRequestException(fieldName + " must be greater than zero");
        }
    }
    
    public static void validateNotNull(Object object, String fieldName) {
        if (object == null) {
            throw new BadRequestException(fieldName + " is required");
        }
    }
    
    public static void validateNotEmpty(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(fieldName + " cannot be empty");
        }
    }
}
