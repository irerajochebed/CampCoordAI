package com.example.Camp.service.gateway;

import com.example.Camp.entity.Event;
import com.example.Camp.entity.Notification;
import com.example.Camp.entity.User;
import com.example.Camp.enums.NotificationType;

/**
 * Gateway interface for dispatching notifications across multiple communication channels
 * (In-App, SMS, and Email).
 */
public interface NotificationGateway {

    /**
     * Creates and persists an in-app notification for the specified recipient.
     */
    Notification sendInApp(User recipient, Event event, NotificationType type, String title, String message, String actionUrl);

    /**
     * Interface for SMS notification delivery (e.g. via Rwanda local telecom SMS gateway).
     */
    void sendSms(String phoneNumber, String message);

    /**
     * Interface for Email notification delivery (e.g. SMTP / SendGrid / AWS SES).
     */
    void sendEmail(String email, String subject, String body);
}
