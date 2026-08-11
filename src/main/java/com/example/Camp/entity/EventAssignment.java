package com.example.Camp.entity;

import com.example.Camp.enums.Position;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "event_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class EventAssignment extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Position position;
    
    @Column(length = 1000)
    private String responsibilities;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
