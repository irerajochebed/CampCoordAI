package com.example.Camp.entity;

import com.example.Camp.enums.Gender;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Room extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accommodation_id", nullable = false)
    @JsonIgnoreProperties({"rooms", "hibernateLazyInitializer", "handler", "event"})
    private Accommodation accommodation;
    
    @Column(nullable = false)
    private String roomNumber;
    
    @Column(nullable = false)
    private Integer capacity;
    
    @Enumerated(EnumType.STRING)
    private Gender genderRestriction;
    
    private String floor;
    
    @Column(length = 1000)
    private String amenities;
    
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnoreProperties({"room", "hibernateLazyInitializer", "handler"})
    private List<RoomAssignment> assignments = new ArrayList<>();
}
