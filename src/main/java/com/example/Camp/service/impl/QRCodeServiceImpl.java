package com.example.Camp.service.impl;

import com.example.Camp.entity.Registration;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.RegistrationRepository;
import com.example.Camp.service.QRCodeService;
import com.example.Camp.util.QRCodeGenerator;
import com.google.zxing.WriterException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class QRCodeServiceImpl implements QRCodeService {
    
    private final RegistrationRepository registrationRepository;
    private final QRCodeGenerator qrCodeGenerator;
    
    @Override
    public byte[] generateQRCodeForRegistration(Long registrationId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "id", registrationId));
        
        try {
            String qrData = buildQRDataForRegistration(registration);
            byte[] qrCode = qrCodeGenerator.generateQRCodeImage(qrData);
            
            log.info("QR code generated for registration: {}", registrationId);
            return qrCode;
        } catch (WriterException | IOException e) {
            log.error("Error generating QR code for registration {}: {}", registrationId, e.getMessage());
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }
    
    @Override
    public String generateQRCodeBase64ForRegistration(Long registrationId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "id", registrationId));
        
        try {
            String qrData = buildQRDataForRegistration(registration);
            String base64QRCode = qrCodeGenerator.generateQRCodeBase64(qrData);
            
            log.info("Base64 QR code generated for registration: {}", registrationId);
            return base64QRCode;
        } catch (WriterException | IOException e) {
            log.error("Error generating QR code for registration {}: {}", registrationId, e.getMessage());
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }
    
    @Override
    public byte[] generateQRCodeForText(String text) {
        try {
            return qrCodeGenerator.generateQRCodeImage(text);
        } catch (WriterException | IOException e) {
            log.error("Error generating QR code: {}", e.getMessage());
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }
    
    @Override
    public String generateQRCodeBase64ForText(String text) {
        try {
            return qrCodeGenerator.generateQRCodeBase64(text);
        } catch (WriterException | IOException e) {
            log.error("Error generating QR code: {}", e.getMessage());
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }
    
    private String buildQRDataForRegistration(Registration registration) {
        return String.format(
                "CAMPCOORDAI-REGISTRATION\n" +
                "Event: %s\n" +
                "Registration #: %s\n" +
                "Participant: %s %s\n" +
                "Church: %s\n" +
                "QR Code: %s",
                registration.getEvent().getName(),
                registration.getRegistrationNumber(),
                registration.getParticipant().getFirstName(),
                registration.getParticipant().getLastName(),
                registration.getParticipant().getOrganizationUnit().getName(),
                registration.getQrCode()
        );
    }
}
