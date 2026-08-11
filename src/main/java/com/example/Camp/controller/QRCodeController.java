package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.service.QRCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/qrcode")
@RequiredArgsConstructor
public class QRCodeController {
    
    private final QRCodeService qrCodeService;
    
    @GetMapping("/registration/{registrationId}/image")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<byte[]> getQRCodeImageForRegistration(@PathVariable Long registrationId) {
        byte[] qrCode = qrCodeService.generateQRCodeForRegistration(registrationId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setContentLength(qrCode.length);
        headers.set("Content-Disposition", "inline; filename=qrcode-" + registrationId + ".png");
        
        return new ResponseEntity<>(qrCode, headers, HttpStatus.OK);
    }
    
    @GetMapping("/registration/{registrationId}/base64")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> getQRCodeBase64ForRegistration(@PathVariable Long registrationId) {
        String base64QRCode = qrCodeService.generateQRCodeBase64ForRegistration(registrationId);
        return ResponseEntity.ok(ApiResponse.success("QR code generated successfully", base64QRCode));
    }
    
    @PostMapping("/generate/image")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<byte[]> generateQRCodeImage(@RequestParam String text) {
        byte[] qrCode = qrCodeService.generateQRCodeForText(text);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setContentLength(qrCode.length);
        headers.set("Content-Disposition", "inline; filename=qrcode.png");
        
        return new ResponseEntity<>(qrCode, headers, HttpStatus.OK);
    }
    
    @PostMapping("/generate/base64")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> generateQRCodeBase64(@RequestParam String text) {
        String base64QRCode = qrCodeService.generateQRCodeBase64ForText(text);
        return ResponseEntity.ok(ApiResponse.success("QR code generated successfully", base64QRCode));
    }
}
