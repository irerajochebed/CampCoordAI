package com.example.Camp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resource_allocations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class ResourceAllocation extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false)
    private LocalDateTime allocatedFrom;
    
    @Column(nullable = false)
    private LocalDateTime allocatedTo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocated_by_id")
    private User allocatedBy;
    
    private String purpose;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean returned = false;
    
    private LocalDateTime returnedAt;
    
    private String notes;
}
