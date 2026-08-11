package com.example.Camp.service.impl;

import com.example.Camp.dto.notification.NotificationRequest;
import com.example.Camp.dto.notification.NotificationResponse;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.Notification;
import com.example.Camp.entity.User;
import com.example.Camp.repository.NotificationRepository;
import com.example.Camp.service.EventService;
import com.example.Camp.service.NotificationService;
import com.example.Camp.service.UserService;
import com.example.Camp.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationServiceImpl implements NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final EventService eventService;
    private final DtoMapper dtoMapper;
    
    @Override
    public NotificationResponse createNotification(NotificationRequest request) {
        User recipient = userService.getUserById(request.getRecipientId());
        Event event = request.getEventId() != null ? eventService.getEventEntity(request.getEventId()) : null;
        
        Notification notification = Notification.builder()
                .recipient(recipient)
                .event(event)
                .type(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .isRead(false)
                .actionUrl(request.getActionUrl())
                .build();
        
        Notification savedNotification = notificationRepository.save(notification);
        log.info("Notification created for user: {}", recipient.getId());
        
        return dtoMapper.toNotificationResponse(savedNotification);
    }
    
    @Override
    public void sendBulkNotification(List<Long> recipientIds, NotificationRequest request) {
        for (Long recipientId : recipientIds) {
            NotificationRequest individualRequest = new NotificationRequest();
            individualRequest.setRecipientId(recipientId);
            individualRequest.setEventId(request.getEventId());
            individualRequest.setType(request.getType());
            individualRequest.setTitle(request.getTitle());
            individualRequest.setMessage(request.getMessage());
            individualRequest.setActionUrl(request.getActionUrl());
            createNotification(individualRequest);
        }
        log.info("Bulk notification sent to {} recipients", recipientIds.size());
    }
    
    @Override
    @Transactional(readOnly = true)
    public NotificationResponse getNotificationById(Long id) {
        Notification notification = getNotificationEntity(id);
        return dtoMapper.toNotificationResponse(notification);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsByRecipient(Long recipientId) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(recipientId).stream()
                .map(dtoMapper::toNotificationResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotificationsByRecipient(Long recipientId) {
        return notificationRepository.findUnreadByRecipient(recipientId).stream()
                .map(dtoMapper::toNotificationResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public NotificationResponse markAsRead(Long id) {
        Notification notification = getNotificationEntity(id);
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        Notification savedNotification = notificationRepository.save(notification);
        return dtoMapper.toNotificationResponse(savedNotification);
    }
    
    @Override
    public void markAllAsRead(Long recipientId) {
        List<Notification> unreadNotifications = notificationRepository.findUnreadByRecipient(recipientId);
        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
        }
        notificationRepository.saveAll(unreadNotifications);
        log.info("All notifications marked as read for user: {}", recipientId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long getUnreadCount(Long recipientId) {
        return notificationRepository.countUnreadByRecipient(recipientId);
    }
    
    @Override
    public void deleteNotification(Long id) {
        Notification notification = getNotificationEntity(id);
        notification.setDeleted(true);
        notificationRepository.save(notification);
        log.info("Notification soft deleted: {}", id);
    }
    
    private Notification getNotificationEntity(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
    }
}
