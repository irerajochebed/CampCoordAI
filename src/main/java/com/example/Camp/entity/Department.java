package com.example.Camp.entity;

import com.example.Camp.enums.DepartmentType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Department extends BaseEntity {
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private DepartmentType type;
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 1000)
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leader_id")
    @JsonIgnoreProperties({"organizationUnit", "department", "password", "hibernateLazyInitializer", "handler"})
    private User leader;
    
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private List<Proposal> proposals = new ArrayList<>();
}
