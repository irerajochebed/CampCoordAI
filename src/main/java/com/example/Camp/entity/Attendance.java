package com.example.Camp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendances")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Attendance extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id", nullable = false)
    private Registration registration;
    
    @Column(nullable = false)
    private LocalDateTime checkInTime;
    
    private String checkInMethod;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_in_by_id")
    private User checkedInBy;
    
    private String notes;
}
