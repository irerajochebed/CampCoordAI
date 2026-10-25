package com.example.Camp.service.gateway.impl;

import com.example.Camp.entity.Event;
import com.example.Camp.entity.Notification;
import com.example.Camp.entity.User;
import com.example.Camp.enums.NotificationType;
import com.example.Camp.repository.NotificationRepository;
import com.example.Camp.service.gateway.NotificationGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Default implementation of NotificationGateway.
 * Persists in-app notifications and provides clear extension hooks for external SMS & Email providers.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DefaultNotificationGateway implements NotificationGateway {

    private final NotificationRepository notificationRepository;

    @Override
    public Notification sendInApp(User recipient, Event event, NotificationType type, String title, String message, String actionUrl) {
        if (recipient == null) {
            log.warn("Cannot send in-app notification: recipient is null.");
            return null;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .event(event)
                .type(type)
                .title(title)
                .message(message)
                .actionUrl(actionUrl)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.debug("In-app notification saved for user {} [id={}]: {}", recipient.getEmail(), saved.getId(), title);
        return saved;
    }

    @Override
    public void sendSms(String phoneNumber, String message) {
        // Extension point for external SMS gateway (e.g. MTN/Airtel Rwanda SMS Gateway)
        log.info("[SMS GATEWAY HOOK] Recipient: {}, Message: {}", phoneNumber, message);
    }

    @Override
    public void sendEmail(String email, String subject, String body) {
        // Extension point for external Email provider (e.g. JavaMailSender / SES)
        log.info("[EMAIL GATEWAY HOOK] Recipient: {}, Subject: {}", email, subject);
    }
}
