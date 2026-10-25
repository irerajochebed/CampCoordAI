package com.example.Camp.entity;

import com.example.Camp.enums.Gender;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User extends BaseEntity {
    
    @Column(nullable = false)
    private String firstName;
    
    @Column(nullable = false)
    private String lastName;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(unique = true)
    private String phoneNumber;
    
    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    
    @Enumerated(EnumType.STRING)
    private Position position;
    
    @Enumerated(EnumType.STRING)
    private Gender gender;
    
    private LocalDate dateOfBirth;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_unit_id", nullable = false)
    @JsonIgnoreProperties({"parent", "children", "users", "hibernateLazyInitializer", "handler"})
    private OrganizationUnit organizationUnit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    @JsonIgnoreProperties({"users", "leader", "proposals", "hibernateLazyInitializer", "handler"})
    private Department department;

    @Column(name = "government_district")
    private String governmentDistrict;

    @Column(name = "sda_district")
    private String sdaDistrict;
    
    @Column(name = "custom_church_name")
    private String customChurchName;
    
    @Column(name = "preferred_language")
    @Builder.Default
    private String preferredLanguage = "en";
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
    
    @Column(name = "profile_image_url", columnDefinition = "TEXT")
    private String profileImageUrl;
    
    @OneToMany(mappedBy = "proposedBy", cascade = CascadeType.ALL)
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Proposal> proposals = new ArrayList<>();
    
    @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL)
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Registration> registrations = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<EventAssignment> eventAssignments = new ArrayList<>();
    
    @OneToMany(mappedBy = "recipient", cascade = CascadeType.ALL)
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Notification> notifications = new ArrayList<>();
}
