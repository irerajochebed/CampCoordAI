package com.example.Camp.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Component
@Slf4j
public class QRCodeGenerator {
    
    private static final int DEFAULT_WIDTH = 300;
    private static final int DEFAULT_HEIGHT = 300;
    
    /**
     * Generate QR code as byte array
     */
    public byte[] generateQRCodeImage(String text, int width, int height) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
        
        return outputStream.toByteArray();
    }
    
    /**
     * Generate QR code as byte array with default size
     */
    public byte[] generateQRCodeImage(String text) throws WriterException, IOException {
        return generateQRCodeImage(text, DEFAULT_WIDTH, DEFAULT_HEIGHT);
    }
    
    /**
     * Generate QR code as Base64 encoded string
     */
    public String generateQRCodeBase64(String text, int width, int height) throws WriterException, IOException {
        byte[] qrCodeImage = generateQRCodeImage(text, width, height);
        return Base64.getEncoder().encodeToString(qrCodeImage);
    }
    
    /**
     * Generate QR code as Base64 encoded string with default size
     */
    public String generateQRCodeBase64(String text) throws WriterException, IOException {
        return generateQRCodeBase64(text, DEFAULT_WIDTH, DEFAULT_HEIGHT);
    }
    
    /**
     * Generate QR code with data URL format (ready for HTML img tag)
     */
    public String generateQRCodeDataURL(String text) throws WriterException, IOException {
        String base64Image = generateQRCodeBase64(text);
        return "data:image/png;base64," + base64Image;
    }
    
    /**
     * Generate QR code for registration with formatted data
     */
    public String generateRegistrationQRCode(String registrationNumber, String participantName, String eventName) 
            throws WriterException, IOException {
        String qrData = String.format(
                "Registration Number: %s\nParticipant: %s\nEvent: %s",
                registrationNumber,
                participantName,
                eventName
        );
        return generateQRCodeBase64(qrData);
    }
}
