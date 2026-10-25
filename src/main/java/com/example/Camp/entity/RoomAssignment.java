package com.example.Camp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "room_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RoomAssignment extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    @JsonIgnoreProperties({"assignments", "hibernateLazyInitializer", "handler", "accommodation"})
    private Room room;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id", nullable = false)
    @JsonIgnoreProperties({"event", "payments", "attendances", "roomAssignments", "registeredBy", "hibernateLazyInitializer", "handler"})
    private Registration registration;
    
    @Column(nullable = false)
    private String bedNumber;
    
    @Column(nullable = false)
    private LocalDate checkInDate;
    
    private LocalDate checkOutDate;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
    
    private String notes;
}
