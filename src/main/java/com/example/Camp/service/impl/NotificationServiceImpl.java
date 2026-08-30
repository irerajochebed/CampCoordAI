package com.example.Camp.service.impl;

import com.example.Camp.dto.notification.NotificationRequest;
import com.example.Camp.dto.notification.NotificationResponse;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.Notification;
import com.example.Camp.entity.User;
import com.example.Camp.enums.NotificationType;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import com.example.Camp.repository.EventRepository;
import com.example.Camp.repository.NotificationRepository;
import com.example.Camp.repository.UserRepository;
import com.example.Camp.service.EventService;
import com.example.Camp.service.NotificationService;
import com.example.Camp.service.UserService;
import com.example.Camp.util.DtoMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class NotificationServiceImpl implements NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EventService eventService;
    private final DtoMapper dtoMapper;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            UserService userService,
            UserRepository userRepository,
            EventRepository eventRepository,
            @Lazy EventService eventService,
            DtoMapper dtoMapper) {
        this.notificationRepository = notificationRepository;
        this.userService = userService;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.eventService = eventService;
        this.dtoMapper = dtoMapper;
    }
    
    @Override
    public NotificationResponse createNotification(NotificationRequest request) {
        User recipient = userService.getUserById(request.getRecipientId());
        User sender = request.getSenderId() != null 
                ? userService.getUserById(request.getSenderId()) 
                : null;
        Notification parent = request.getParentNotificationId() != null 
                ? notificationRepository.findById(request.getParentNotificationId()).orElse(null) 
                : null;
        Event event = request.getEventId() != null 
                ? eventRepository.findById(request.getEventId()).orElse(null) 
                : null;
        
        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .parentNotification(parent)
                .event(event)
                .type(request.getType() != null ? request.getType() : NotificationType.GENERAL_ANNOUNCEMENT)
                .title(request.getTitle())
                .message(request.getMessage())
                .isRead(false)
                .actionUrl(request.getActionUrl())
                .build();
        
        Notification savedNotification = notificationRepository.save(notification);
        log.info("Notification created for recipient user: {}", recipient.getId());
        
        return dtoMapper.toNotificationResponse(savedNotification);
    }
    
    @Override
    public void sendBulkNotification(List<Long> recipientIds, NotificationRequest request) {
        for (Long recipientId : recipientIds) {
            NotificationRequest individualRequest = new NotificationRequest();
            individualRequest.setRecipientId(recipientId);
            individualRequest.setSenderId(request.getSenderId());
            individualRequest.setParentNotificationId(request.getParentNotificationId());
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
    public NotificationResponse markAsUnread(Long id) {
        Notification notification = getNotificationEntity(id);
        notification.setIsRead(false);
        notification.setReadAt(null);
        Notification savedNotification = notificationRepository.save(notification);
        return dtoMapper.toNotificationResponse(savedNotification);
    }

    @Override
    public NotificationResponse replyToNotification(Long notificationId, String replyMessage, Long senderUserId) {
        Notification parentNotif = getNotificationEntity(notificationId);
        User senderUser = userService.getUserById(senderUserId);
        
        // Determine recipient: original sender if available, else original recipient
        User recipient = parentNotif.getSender() != null && !parentNotif.getSender().getId().equals(senderUserId)
                ? parentNotif.getSender()
                : parentNotif.getRecipient();

        String replyTitle = parentNotif.getTitle() != null && parentNotif.getTitle().startsWith("Re:")
                ? parentNotif.getTitle()
                : "Re: " + (parentNotif.getTitle() != null ? parentNotif.getTitle() : "Notification");

        Notification reply = Notification.builder()
                .recipient(recipient)
                .sender(senderUser)
                .parentNotification(parentNotif)
                .event(parentNotif.getEvent())
                .type(NotificationType.GENERAL_ANNOUNCEMENT)
                .title(replyTitle)
                .message(replyMessage)
                .isRead(false)
                .actionUrl(parentNotif.getActionUrl())
                .build();

        Notification saved = notificationRepository.save(reply);
        log.info("Reply notification #{} created from user #{} to user #{}", saved.getId(), senderUserId, recipient.getId());

        return dtoMapper.toNotificationResponse(saved);
    }

    @Override
    public void notifyUnionLeadersForFieldScope(String title, String message, String actionUrl, Long senderUserId, Event event) {
        List<User> unionAdmins = userRepository.findByPosition(Position.UNION_ADMINISTRATOR);
        List<User> unionLeaders = userRepository.findByPosition(Position.UNION_LEADER);
        List<User> admins = userRepository.findByRole(Role.ADMINISTRATOR);

        List<User> targetUsers = new ArrayList<>();
        targetUsers.addAll(unionAdmins);
        targetUsers.addAll(unionLeaders);
        targetUsers.addAll(admins);

        // Deduplicate recipients
        List<User> distinctRecipients = targetUsers.stream()
                .filter(u -> u != null && !Boolean.TRUE.equals(u.getDeleted()) && !Boolean.FALSE.equals(u.getActive()))
                .filter(u -> senderUserId == null || !u.getId().equals(senderUserId))
                .collect(Collectors.toList());

        for (User unionLeader : distinctRecipients) {
            NotificationRequest req = new NotificationRequest();
            req.setRecipientId(unionLeader.getId());
            req.setSenderId(senderUserId);
            req.setEventId(event != null ? event.getId() : null);
            req.setType(NotificationType.EVENT_REMINDER);
            req.setTitle(title);
            req.setMessage(message);
            req.setActionUrl(actionUrl);
            createNotification(req);
        }

        log.info("Notified {} Union Leaders for Field Scope event/proposal: {}", distinctRecipients.size(), title);
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
