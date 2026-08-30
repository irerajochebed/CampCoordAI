package com.example.Camp.dto.notification;

import com.example.Camp.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    
    private Long id;
    private Long recipientId;
    private String recipientName;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private Long parentNotificationId;
    private String parentNotificationTitle;
    private Long eventId;
    private String eventName;
    private NotificationType type;
    private String title;
    private String message;
    private Boolean isRead;
    private LocalDateTime readAt;
    private String actionUrl;
    private LocalDateTime createdAt;
}
