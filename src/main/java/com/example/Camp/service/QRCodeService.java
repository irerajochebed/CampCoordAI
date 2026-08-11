package com.example.Camp.service;

public interface QRCodeService {
    
    byte[] generateQRCodeForRegistration(Long registrationId);
    
    String generateQRCodeBase64ForRegistration(Long registrationId);
    
    byte[] generateQRCodeForText(String text);
    
    String generateQRCodeBase64ForText(String text);
}
