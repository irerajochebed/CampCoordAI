package com.example.Camp.service;

import com.example.Camp.dto.notification.NotificationRequest;
import com.example.Camp.dto.notification.NotificationResponse;

import java.util.List;

public interface NotificationService {
    
    NotificationResponse createNotification(NotificationRequest request);
    
    void sendBulkNotification(List<Long> recipientIds, NotificationRequest request);
    
    NotificationResponse getNotificationById(Long id);
    
    List<NotificationResponse> getNotificationsByRecipient(Long recipientId);
    
    List<NotificationResponse> getUnreadNotificationsByRecipient(Long recipientId);
    
    NotificationResponse markAsRead(Long id);
    
    NotificationResponse markAsUnread(Long id);
    
    NotificationResponse replyToNotification(Long notificationId, String replyMessage, Long senderUserId);
    
    void notifyUnionLeadersForFieldScope(String title, String message, String actionUrl, Long senderUserId, com.example.Camp.entity.Event event);
    
    void markAllAsRead(Long recipientId);
    
    Long getUnreadCount(Long recipientId);
    
    void deleteNotification(Long id);
}
