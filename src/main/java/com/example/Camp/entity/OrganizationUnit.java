package com.example.Camp.entity;

import com.example.Camp.enums.OrganizationLevel;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "organization_units")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class OrganizationUnit extends BaseEntity {
    
    @Column(nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrganizationLevel level;
    
    @Column(unique = true)
    private String code;
    
    private String location;
    
    private String contactEmail;
    
    private String contactPhone;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private OrganizationUnit parent;
    
    @Column(name = "is_custom", columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isCustom = false;
    
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @Builder.Default
    private List<OrganizationUnit> children = new ArrayList<>();
    
    @OneToMany(mappedBy = "organizationUnit", cascade = CascadeType.ALL)
    @Builder.Default
    private List<User> users = new ArrayList<>();
}
