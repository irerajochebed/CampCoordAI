package com.example.Camp.entity;

import com.example.Camp.enums.RegistrationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "registrations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Registration extends BaseEntity {
    
    @Column(nullable = false, unique = true)
    private String registrationNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private User participant;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by_id")
    private User registeredBy;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RegistrationStatus status = RegistrationStatus.PENDING;
    
    private String specialRequirements;
    
    private String emergencyContactName;
    
    private String emergencyContactPhone;
    
    @Column(unique = true)
    private String qrCode;
    
    private LocalDateTime checkedInAt;
    
    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();
    
    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL)
    @Builder.Default
    private List<RoomAssignment> roomAssignments = new ArrayList<>();
    
    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Attendance> attendances = new ArrayList<>();
}
