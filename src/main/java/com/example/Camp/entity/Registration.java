package com.example.Camp.entity;

import com.example.Camp.enums.RegistrationStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Registration extends BaseEntity {
    
    @Column(nullable = false, unique = true)
    private String registrationNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    @JsonIgnoreProperties({"accommodations", "sessions", "registrations", "assignments", "resourceAllocations", "notifications", "proposal", "department", "coordinator", "hibernateLazyInitializer", "handler"})
    private Event event;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    @JsonIgnoreProperties({"organizationUnit", "department", "password", "hibernateLazyInitializer", "handler"})
    private User participant;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by_id")
    @JsonIgnoreProperties({"organizationUnit", "department", "password", "hibernateLazyInitializer", "handler"})
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
    
    private LocalDateTime checkedOutAt;
    
    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL)
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Payment> payments = new ArrayList<>();
    
    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL)
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<RoomAssignment> roomAssignments = new ArrayList<>();
    
    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL)
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Attendance> attendances = new ArrayList<>();
}
