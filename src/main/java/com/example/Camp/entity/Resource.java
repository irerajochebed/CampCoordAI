package com.example.Camp.entity;

import com.example.Camp.enums.ResourceType;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Resource extends BaseEntity {
    
    @Column(nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type;
    
    @Column(unique = true)
    private String code;
    
    @Column(length = 1000)
    private String description;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer availableQuantity = 1;
    
    private String condition;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean available = true;
    
    @OneToMany(mappedBy = "resource", cascade = CascadeType.ALL)
    @Builder.Default
    private List<ResourceAllocation> allocations = new ArrayList<>();
}
