package com.example.Camp.service;

import com.example.Camp.dto.registration.RegistrationRequest;
import com.example.Camp.dto.registration.RegistrationResponse;
import com.example.Camp.entity.Registration;
import com.example.Camp.enums.RegistrationStatus;

import java.util.List;

public interface RegistrationService {
    
    RegistrationResponse registerParticipant(RegistrationRequest request, Long registeredById);
    
    RegistrationResponse getRegistrationById(Long id);

    RegistrationResponse getRegistrationById(Long id, Long currentUserId);
    
    RegistrationResponse getRegistrationByNumber(String registrationNumber);
    
    RegistrationResponse getRegistrationByQrCode(String qrCode);
    
    List<RegistrationResponse> getRegistrationsByEvent(Long eventId);

    List<RegistrationResponse> getRegistrationsByEvent(Long eventId, Long currentUserId);
    
    List<RegistrationResponse> getRegistrationsByParticipant(Long participantId);
    
    List<RegistrationResponse> getRegistrationsByStatus(Long eventId, RegistrationStatus status);

    List<RegistrationResponse> getRegistrationsByStatus(Long eventId, RegistrationStatus status, Long currentUserId);
    
    RegistrationResponse updateRegistrationStatus(Long id, RegistrationStatus status);

    RegistrationResponse updateRegistrationStatus(Long id, RegistrationStatus status, Long currentUserId);
    
    RegistrationResponse confirmRegistration(Long id);

    RegistrationResponse confirmRegistration(Long id, Long currentUserId);
    
    RegistrationResponse cancelRegistration(Long id);

    RegistrationResponse cancelRegistration(Long id, Long currentUserId);
    
    RegistrationResponse checkIn(Long id);

    RegistrationResponse checkIn(Long id, Long currentUserId);
    
    RegistrationResponse checkInByQrCode(String qrCode);

    RegistrationResponse checkOut(Long id);

    RegistrationResponse checkOut(Long id, Long currentUserId);
    
    String generateQrCode(Long registrationId);
    
    void deleteRegistration(Long id);
    
    Registration getRegistrationEntity(Long id);
    
    List<RegistrationResponse> getAllRegistrations();

    List<RegistrationResponse> getAllRegistrations(Long currentUserId);

    List<RegistrationResponse> getMyRegistrations(Long userId);

    String generateRegistrationNumber();
}
