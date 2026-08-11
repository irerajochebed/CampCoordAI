package com.example.Camp.repository;

import com.example.Camp.entity.Notification;
import com.example.Camp.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByRecipientId(Long recipientId);
    
    List<Notification> findByEventId(Long eventId);
    
    List<Notification> findByType(NotificationType type);
    
    @Query("SELECT n FROM Notification n WHERE n.deleted = false AND " +
           "n.recipient.id = :recipientId ORDER BY n.createdAt DESC")
    List<Notification> findByRecipientOrderByCreatedAtDesc(@Param("recipientId") Long recipientId);
    
    @Query("SELECT n FROM Notification n WHERE n.deleted = false AND " +
           "n.recipient.id = :recipientId AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByRecipient(@Param("recipientId") Long recipientId);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.deleted = false AND " +
           "n.recipient.id = :recipientId AND n.isRead = false")
    Long countUnreadByRecipient(@Param("recipientId") Long recipientId);
    
    @Query("SELECT n FROM Notification n WHERE n.deleted = false AND " +
           "n.event.id = :eventId ORDER BY n.createdAt DESC")
    List<Notification> findByEventOrderByCreatedAtDesc(@Param("eventId") Long eventId);
    
    @Query("SELECT n FROM Notification n WHERE n.deleted = false AND " +
           "n.recipient.id = :recipientId AND n.type = :type ORDER BY n.createdAt DESC")
    List<Notification> findByRecipientAndType(@Param("recipientId") Long recipientId, 
                                              @Param("type") NotificationType type);
}
