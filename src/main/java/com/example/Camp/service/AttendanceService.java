package com.example.Camp.service;

import com.example.Camp.entity.Attendance;

import java.util.List;

public interface AttendanceService {
    
    Attendance recordAttendance(Long sessionId, Long registrationId, Long checkedInById);
    
    Attendance recordAttendanceByQR(Long sessionId, String qrCode, Long checkedInById);
    
    Attendance getAttendanceById(Long id);
    
    List<Attendance> getAttendanceBySession(Long sessionId);
    
    List<Attendance> getAttendanceByRegistration(Long registrationId);
    
    List<Attendance> getAttendanceByEvent(Long eventId);
    
    Long getAttendanceCountBySession(Long sessionId);
    
    Long getAttendanceCountByEventAndRegistration(Long eventId, Long registrationId);
    
    boolean hasAttended(Long sessionId, Long registrationId);
    
    void deleteAttendance(Long id);
}
