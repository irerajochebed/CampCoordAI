package com.example.Camp.service.impl;

import com.example.Camp.dto.registration.RegistrationRequest;
import com.example.Camp.dto.registration.RegistrationResponse;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.Registration;
import com.example.Camp.entity.User;
import com.example.Camp.enums.RegistrationStatus;
import com.example.Camp.repository.RegistrationRepository;
import com.example.Camp.service.EventService;
import com.example.Camp.service.RegistrationService;
import com.example.Camp.service.UserService;
import com.example.Camp.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RegistrationServiceImpl implements RegistrationService {
    
    private final RegistrationRepository registrationRepository;
    private final EventService eventService;
    private final UserService userService;
    private final DtoMapper dtoMapper;
    
    @Override
    public RegistrationResponse registerParticipant(RegistrationRequest request, Long registeredById) {
        Event event = eventService.getEventEntity(request.getEventId());
        User participant = userService.getUserById(request.getParticipantId());
        User registeredBy = registeredById != null ? userService.getUserById(registeredById) : participant;
        
        // Check if already registered
        if (registrationRepository.findByEventAndParticipant(request.getEventId(), request.getParticipantId()).isPresent()) {
            throw new RuntimeException("Participant already registered for this event");
        }
        
        Registration registration = Registration.builder()
                .registrationNumber(generateRegistrationNumber())
                .event(event)
                .participant(participant)
                .registeredBy(registeredBy)
                .status(RegistrationStatus.PENDING)
                .specialRequirements(request.getSpecialRequirements())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .build();
        
        Registration savedRegistration = registrationRepository.save(registration);
        log.info("Registration created: {} for event {}", savedRegistration.getRegistrationNumber(), event.getId());
        
        return dtoMapper.toRegistrationResponse(savedRegistration);
    }
    
    @Override
    @Transactional(readOnly = true)
    public RegistrationResponse getRegistrationById(Long id) {
        Registration registration = getRegistrationEntity(id);
        return dtoMapper.toRegistrationResponse(registration);
    }
    
    @Override
    @Transactional(readOnly = true)
    public RegistrationResponse getRegistrationByNumber(String registrationNumber) {
        Registration registration = registrationRepository.findByRegistrationNumber(registrationNumber)
                .orElseThrow(() -> new RuntimeException("Registration not found with number: " + registrationNumber));
        return dtoMapper.toRegistrationResponse(registration);
    }
    
    @Override
    @Transactional(readOnly = true)
    public RegistrationResponse getRegistrationByQrCode(String qrCode) {
        Registration registration = registrationRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("Registration not found with QR code: " + qrCode));
        return dtoMapper.toRegistrationResponse(registration);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getRegistrationsByEvent(Long eventId) {
        return registrationRepository.findActiveByEvent(eventId).stream()
                .map(dtoMapper::toRegistrationResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getRegistrationsByParticipant(Long participantId) {
        return registrationRepository.findActiveByParticipant(participantId).stream()
                .map(dtoMapper::toRegistrationResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getRegistrationsByStatus(Long eventId, RegistrationStatus status) {
        return registrationRepository.findActiveByEventAndStatus(eventId, status).stream()
                .map(dtoMapper::toRegistrationResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public RegistrationResponse updateRegistrationStatus(Long id, RegistrationStatus status) {
        Registration registration = getRegistrationEntity(id);
        registration.setStatus(status);
        Registration savedRegistration = registrationRepository.save(registration);
        log.info("Registration status updated: {} to {}", id, status);
        return dtoMapper.toRegistrationResponse(savedRegistration);
    }
    
    @Override
    public RegistrationResponse confirmRegistration(Long id) {
        Registration registration = getRegistrationEntity(id);
        registration.setStatus(RegistrationStatus.CONFIRMED);
        
        // Generate QR code if not already generated
        if (registration.getQrCode() == null || registration.getQrCode().isEmpty()) {
            String qrCode = generateQrCode(id);
            registration.setQrCode(qrCode);
        }
        
        Registration savedRegistration = registrationRepository.save(registration);
        log.info("Registration confirmed: {}", id);
        return dtoMapper.toRegistrationResponse(savedRegistration);
    }
    
    @Override
    public RegistrationResponse cancelRegistration(Long id) {
        return updateRegistrationStatus(id, RegistrationStatus.CANCELLED);
    }
    
    @Override
    public RegistrationResponse checkIn(Long id) {
        Registration registration = getRegistrationEntity(id);
        registration.setStatus(RegistrationStatus.CHECKED_IN);
        registration.setCheckedInAt(LocalDateTime.now());
        Registration savedRegistration = registrationRepository.save(registration);
        log.info("Participant checked in: {}", id);
        return dtoMapper.toRegistrationResponse(savedRegistration);
    }
    
    @Override
    public RegistrationResponse checkInByQrCode(String qrCode) {
        Registration registration = registrationRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("Registration not found with QR code: " + qrCode));
        return checkIn(registration.getId());
    }
    
    @Override
    public String generateQrCode(Long registrationId) {
        Registration registration = getRegistrationEntity(registrationId);
        String qrCode = "REG-" + registration.getRegistrationNumber() + "-" + 
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        registration.setQrCode(qrCode);
        registrationRepository.save(registration);
        log.info("QR code generated for registration: {}", registrationId);
        return qrCode;
    }
    
    @Override
    public void deleteRegistration(Long id) {
        Registration registration = getRegistrationEntity(id);
        registration.setDeleted(true);
        registrationRepository.save(registration);
        log.info("Registration soft deleted: {}", id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Registration getRegistrationEntity(Long id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registration not found with id: " + id));
    }
    
    @Override
    public String generateRegistrationNumber() {
        String prefix = "RG";
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%04d", (int)(Math.random() * 10000));
        return prefix + timestamp + random;
    }
}
