package com.example.Camp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "accommodations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Accommodation extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "accommodations", "sessions", "registrations", "assignments", "resourceAllocations", "notifications", "proposal", "department", "coordinator"})
    private Event event;
    
    @Column(nullable = false)
    private String buildingName;
    
    private String buildingCode;
    
    private String location;
    
    @Column(length = 1000)
    private String description;
    
    @OneToMany(mappedBy = "accommodation", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnoreProperties({"accommodation", "hibernateLazyInitializer", "handler"})
    private List<Room> rooms = new ArrayList<>();
}
