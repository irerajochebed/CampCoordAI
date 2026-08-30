package com.example.Camp.dto.notification;

import com.example.Camp.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    
    @NotNull(message = "Recipient ID is required")
    private Long recipientId;
    
    private Long senderId;
    private Long parentNotificationId;
    private Long eventId;
    
    @NotNull(message = "Notification type is required")
    private NotificationType type;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Message is required")
    private String message;
    
    private String actionUrl;
}
