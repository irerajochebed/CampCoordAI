package com.example.Camp.entity;

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
public class RoomAssignment extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id", nullable = false)
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
