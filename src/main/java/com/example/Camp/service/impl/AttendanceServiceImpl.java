package com.example.Camp.service.impl;

import com.example.Camp.entity.Attendance;
import com.example.Camp.entity.Registration;
import com.example.Camp.entity.Session;
import com.example.Camp.entity.User;
import com.example.Camp.exception.BusinessRuleException;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.AttendanceRepository;
import com.example.Camp.repository.RegistrationRepository;
import com.example.Camp.repository.SessionRepository;
import com.example.Camp.service.AttendanceService;
import com.example.Camp.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AttendanceServiceImpl implements AttendanceService {
    
    private final AttendanceRepository attendanceRepository;
    private final SessionRepository sessionRepository;
    private final RegistrationRepository registrationRepository;
    private final UserService userService;
    
    @Override
    public Attendance recordAttendance(Long sessionId, Long registrationId, Long checkedInById) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
        
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "id", registrationId));
        
        User checkedInBy = checkedInById != null ? userService.getUserById(checkedInById) : null;
        
        // Check if already attended
        if (attendanceRepository.findBySessionAndRegistration(sessionId, registrationId).isPresent()) {
            throw new BusinessRuleException("Attendance already recorded for this session");
        }
        
        // Check if session is for the same event as registration
        if (!session.getEvent().getId().equals(registration.getEvent().getId())) {
            throw new BusinessRuleException("Session and registration are for different events");
        }
        
        Attendance attendance = Attendance.builder()
                .session(session)
                .registration(registration)
                .checkInTime(LocalDateTime.now())
                .checkInMethod("MANUAL")
                .checkedInBy(checkedInBy)
                .build();
        
        Attendance saved = attendanceRepository.save(attendance);
        log.info("Attendance recorded: Session {} Registration {}", sessionId, registrationId);
        return saved;
    }
    
    @Override
    public Attendance recordAttendanceByQR(Long sessionId, String qrCode, Long checkedInById) {
        Registration registration = registrationRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "qrCode", qrCode));
        
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
        
        User checkedInBy = checkedInById != null ? userService.getUserById(checkedInById) : null;
        
        // Check if already attended
        if (attendanceRepository.findBySessionAndRegistration(sessionId, registration.getId()).isPresent()) {
            throw new BusinessRuleException("Attendance already recorded for this session");
        }
        
        // Check if session is for the same event as registration
        if (!session.getEvent().getId().equals(registration.getEvent().getId())) {
            throw new BusinessRuleException("QR code is for a different event");
        }
        
        Attendance attendance = Attendance.builder()
                .session(session)
                .registration(registration)
                .checkInTime(LocalDateTime.now())
                .checkInMethod("QR_SCAN")
                .checkedInBy(checkedInBy)
                .build();
        
        Attendance saved = attendanceRepository.save(attendance);
        log.info("Attendance recorded by QR: Session {} QR {}", sessionId, qrCode);
        return saved;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Attendance getAttendanceById(Long id) {
        return attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", "id", id));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceBySession(Long sessionId) {
        return attendanceRepository.findActiveBySession(sessionId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceByRegistration(Long registrationId) {
        return attendanceRepository.findActiveByRegistration(registrationId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceByEvent(Long eventId) {
        return attendanceRepository.findByEvent(eventId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long getAttendanceCountBySession(Long sessionId) {
        return attendanceRepository.countBySession(sessionId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long getAttendanceCountByEventAndRegistration(Long eventId, Long registrationId) {
        return attendanceRepository.countByEventAndRegistration(eventId, registrationId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean hasAttended(Long sessionId, Long registrationId) {
        return attendanceRepository.findBySessionAndRegistration(sessionId, registrationId).isPresent();
    }
    
    @Override
    public void deleteAttendance(Long id) {
        Attendance attendance = getAttendanceById(id);
        attendance.setDeleted(true);
        attendanceRepository.save(attendance);
        log.info("Attendance soft deleted: {}", id);
    }
}
