package com.example.Camp.service;

import com.example.Camp.dto.registration.RegistrationRequest;
import com.example.Camp.dto.registration.RegistrationResponse;
import com.example.Camp.entity.Registration;
import com.example.Camp.enums.RegistrationStatus;

import java.util.List;

public interface RegistrationService {
    
    RegistrationResponse registerParticipant(RegistrationRequest request, Long registeredById);
    
    RegistrationResponse getRegistrationById(Long id);
    
    RegistrationResponse getRegistrationByNumber(String registrationNumber);
    
    RegistrationResponse getRegistrationByQrCode(String qrCode);
    
    List<RegistrationResponse> getRegistrationsByEvent(Long eventId);
    
    List<RegistrationResponse> getRegistrationsByParticipant(Long participantId);
    
    List<RegistrationResponse> getRegistrationsByStatus(Long eventId, RegistrationStatus status);
    
    RegistrationResponse updateRegistrationStatus(Long id, RegistrationStatus status);
    
    RegistrationResponse confirmRegistration(Long id);
    
    RegistrationResponse cancelRegistration(Long id);
    
    RegistrationResponse checkIn(Long id);
    
    RegistrationResponse checkInByQrCode(String qrCode);
    
    String generateQrCode(Long registrationId);
    
    void deleteRegistration(Long id);
    
    Registration getRegistrationEntity(Long id);
    
    String generateRegistrationNumber();
}
