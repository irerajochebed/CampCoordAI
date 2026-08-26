package com.example.Camp.config;

import com.example.Camp.entity.Department;
import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.entity.User;
import com.example.Camp.enums.*;
import com.example.Camp.repository.DepartmentRepository;
import com.example.Camp.repository.OrganizationUnitRepository;
import com.example.Camp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {
    
    private final OrganizationUnitRepository organizationUnitRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking data seeding for CampCoordAI...");
        if (organizationUnitRepository.count() == 0) {
            log.info("No organization units found in database. Seeding official RUM hierarchy...");
            seedOrganizationStructure();
        } else {
            log.info("Organization units already present in database (count: {}).", organizationUnitRepository.count());
        }
        
        if (departmentRepository.count() == 0) {
            seedDepartments();
        }
        
        if (userRepository.count() == 0) {
            seedInitialUsers();
        }
        log.info("Data seeding check completed.");
    }
    
    private void seedOrganizationStructure() {
        log.info("Seeding organization structure for Rwanda Union Mission");
        
        // 1. Create Rwanda Union Mission
        OrganizationUnit union = OrganizationUnit.builder()
                .name("Rwanda Union Mission")
                .level(OrganizationLevel.UNION)
                .code("RUM")
                .location("Kigali, Rwanda")
                .contactEmail("info@rum.adventist.org")
                .contactPhone("+250788000000")
                .build();
        union = organizationUnitRepository.save(union);
        log.info("Created Union: {}", union.getName());
        
        // 2. Create 8 Fields
        OrganizationUnit northField = createField("North Rwanda Field", "NRF", "Musanze", union);
        OrganizationUnit eastCentralField = createField("East Central Rwanda Field", "ECRF", "Kigali", union);
        createField("North-East Rwanda Field", "NERF", "Nyagatare", union);
        createField("South-East Rwanda Field", "SERF", "Ngoma", union);
        createField("North-West Rwanda Field", "NWRF", "Rubavu", union);
        createField("West Rwanda Field", "WRF", "Karongi", union);
        createField("South Rwanda Field", "SRF", "Southern Province", union);
        createField("Central Rwanda Field", "CRF", "Muhanga / Gitwe", union);
        
        // 3. Create Official Districts under North Rwanda Field (NRF)
        // Kigombe Zone
        createDistrict("Kigombe District", "NRF-KIG", "Kigombe Zone, Musanze", northField);
        OrganizationUnit musanzeDistrict = createDistrict("Musanze District", "NRF-MUS", "Kigombe Zone, Musanze", northField);
        createDistrict("Bugarura District", "NRF-BUG", "Kigombe Zone, Musanze", northField);
        createDistrict("Bukonya District", "NRF-BUK", "Kigombe Zone, Musanze", northField);
        createDistrict("Bwuzuri District", "NRF-BWU", "Kigombe Zone, Musanze", northField);
        createDistrict("Kabere District", "NRF-KAB", "Kigombe Zone, Musanze", northField);
        createDistrict("Kalinzi District", "NRF-KAL", "Kigombe Zone, Musanze", northField);
        createDistrict("Ndusu District", "NRF-NDU", "Kigombe Zone, Musanze", northField);
        
        // Bukamba Zone
        createDistrict("Bukamba District", "NRF-BKA", "Bukamba Zone, Musanze", northField);
        createDistrict("Kidaho District", "NRF-KID", "Bukamba Zone, Musanze", northField);
        createDistrict("Kinigi District", "NRF-KIN", "Bukamba Zone, Musanze", northField);
        createDistrict("Nkumba District", "NRF-NKU", "Bukamba Zone, Musanze", northField);
        createDistrict("Nyarugina District", "NRF-NYA", "Bukamba Zone, Musanze", northField);
        createDistrict("Ruhanga District", "NRF-RUH", "Bukamba Zone, Musanze", northField);
        createDistrict("Ruhondo District", "NRF-RHO", "Bukamba Zone, Musanze", northField);
        
        // Kibali Zone
        createDistrict("Kibali District", "NRF-KIB", "Kibali Zone, Gicumbi", northField);
        createDistrict("Gasiho District", "NRF-GAS", "Kibali Zone, Gicumbi", northField);
        createDistrict("Joma District", "NRF-JOM", "Kibali Zone, Gicumbi", northField);
        createDistrict("Kivuruga District", "NRF-KIV", "Kibali Zone, Gicumbi", northField);
        createDistrict("Mataba District", "NRF-MAT", "Kibali Zone, Gicumbi", northField);
        createDistrict("Munyana District", "NRF-MUN", "Kibali Zone, Gicumbi", northField);
        createDistrict("Runoga District", "NRF-RUN", "Kibali Zone, Gicumbi", northField);
        
        // Ndorwa Zone
        createDistrict("Ndorwa District", "NRF-NDO", "Ndorwa Zone, Gicumbi", northField);
        createDistrict("Buberuka District", "NRF-BBE", "Ndorwa Zone, Gicumbi", northField);
        createDistrict("Kivuye District", "NRF-KVY", "Ndorwa Zone, Gicumbi", northField);
        createDistrict("Kirambo District", "NRF-KIR", "Ndorwa Zone, Gicumbi", northField);
        createDistrict("Mucaca District", "NRF-MUC", "Ndorwa Zone, Gicumbi", northField);
        createDistrict("Rutovu District", "NRF-RUT", "Ndorwa Zone, Gicumbi", northField);
        
        // Nkuli Zone
        createDistrict("Nkuli District", "NRF-NKL", "Nkuli Zone, Nyabihu", northField);
        createDistrict("Rwankeri District", "NRF-RWN", "Nkuli Zone, Nyabihu", northField);
        createDistrict("Buhoma District", "NRF-BUH", "Nkuli Zone, Nyabihu", northField);
        createDistrict("Marangara District", "NRF-MAR", "Nkuli Zone, Nyabihu", northField);
        createDistrict("Mugali District", "NRF-MUG", "Nkuli Zone, Nyabihu", northField);
        createDistrict("CAR (Collège Adventiste de Rwankeri) District", "NRF-CAR", "Nkuli Zone, Nyabihu", northField);
        
        log.info("Official organization structure seeded successfully (up to DISTRICT level)");
    }
    
    private OrganizationUnit createField(String name, String code, String location, OrganizationUnit parent) {
        OrganizationUnit field = OrganizationUnit.builder()
                .name(name)
                .level(OrganizationLevel.FIELD)
                .code(code)
                .location(location)
                .contactEmail(code.toLowerCase() + "@rum.adventist.org")
                .contactPhone("+25078" + (int)(Math.random() * 10000000))
                .parent(parent)
                .build();
        field = organizationUnitRepository.save(field);
        log.info("Created Field: {}", field.getName());
        return field;
    }
    
    private OrganizationUnit createDistrict(String name, String code, String location, OrganizationUnit parent) {
        OrganizationUnit district = OrganizationUnit.builder()
                .name(name)
                .level(OrganizationLevel.DISTRICT)
                .code(code)
                .location(location)
                .contactEmail(code.toLowerCase().replace("-", "") + "@rum.adventist.org")
                .contactPhone("+25078" + (int)(Math.random() * 10000000))
                .parent(parent)
                .build();
        district = organizationUnitRepository.save(district);
        log.info("Created District: {}", district.getName());
        return district;
    }
    
    private void seedDepartments() {
        log.info("Seeding 14 Official Rwanda Union Mission (RUM) Ministries");
        
        createDepartment(DepartmentType.YOUTH, "Youth Ministries", 
                "Ministry focused on young people spiritual growth, Pathfinder clubs, and youth camps");
        createDepartment(DepartmentType.WOMEN, "Women Ministries (MIFEM)", 
                "Ministères Féminins — Empowering Adventist women in leadership and service");
        createDepartment(DepartmentType.CHILDREN, "Children Ministries", 
                "Ministry dedicated to children spiritual education, Bible clubs, and activities");
        createDepartment(DepartmentType.FAMILY, "Family Ministries", 
                "Supporting and strengthening Christian family units, marriage, and home life");
        createDepartment(DepartmentType.MINISTERIAL, "Ministerial Association", 
                "Supporting pastors, elders, evangelists, and gospel workers across fields");
        createDepartment(DepartmentType.PERSONAL_MINISTRIES, "Personal Ministries & Sabbath School", 
                "Evangelism, outreach, Bible study, and discipleship programs");
        createDepartment(DepartmentType.CHAPLAINCY, "Adventist Chaplaincy Ministries (ACM)", 
                "Chaplaincy services in schools, universities, hospitals, prisons, and military");
        createDepartment(DepartmentType.POSSIBILITY, "Adventist Possibility Ministries (APM)", 
                "Inclusion and support for individuals with special needs and disabilities");
        createDepartment(DepartmentType.HEALTH, "Health Ministries", 
                "Promoting physical, mental, and spiritual health principles and wellness");
        createDepartment(DepartmentType.PUBLISHING, "Publishing Ministries", 
                "Literature evangelism, publications, and Christian book ministry");
        createDepartment(DepartmentType.STEWARDSHIP, "Stewardship Ministries", 
                "Biblical stewardship, tithing, and financial management");
        createDepartment(DepartmentType.PARL, "Public Affairs & Religious Liberty (PARL)", 
                "Promoting religious freedom, freedom of conscience, and public relations");
        createDepartment(DepartmentType.EDUCATION, "Education Department", 
                "Overseeing Adventist schools, universities, and educational institutions");
        createDepartment(DepartmentType.COMMUNICATION, "Communication Department", 
                "Media relations, digital evangelism, technology, and broadcasting");
        
        log.info("All 14 Official RUM Ministries seeded successfully");
    }
    
    private void createDepartment(DepartmentType type, String name, String description) {
        Department department = Department.builder()
                .type(type)
                .name(name)
                .description(description)
                .build();
        departmentRepository.save(department);
        log.info("Created Ministry/Department: {}", name);
    }
    
    private void seedInitialUsers() {
        log.info("Seeding initial users");
        
        OrganizationUnit union = organizationUnitRepository.findByCode("RUM")
                .orElseThrow(() -> new RuntimeException("Union not found"));
        
        // Create System Administrator
        User admin = User.builder()
                .firstName("System")
                .lastName("Administrator")
                .email("admin@campcoordai.rw")
                .phoneNumber("+250788123456")
                .password(passwordEncoder.encode("Admin@2026"))
                .role(Role.ADMINISTRATOR)
                .position(Position.UNION_ADMINISTRATOR)
                .gender(Gender.MALE)
                .dateOfBirth(LocalDate.of(1980, 1, 1))
                .organizationUnit(union)
                .active(true)
                .build();
        userRepository.save(admin);
        log.info("Created Administrator: {}", admin.getEmail());
        
        // Create Department Leaders
        Department youthDept = departmentRepository.findByType(DepartmentType.YOUTH)
                .orElseThrow(() -> new RuntimeException("Youth department not found"));
        
        User youthLeader = User.builder()
                .firstName("Jean")
                .lastName("Mugiraneza")
                .email("youth.leader@rum.adventist.org")
                .phoneNumber("+250788234567")
                .password(passwordEncoder.encode("Youth@2026"))
                .role(Role.COORDINATOR)
                .position(Position.DEPARTMENT_LEADER)
                .gender(Gender.MALE)
                .dateOfBirth(LocalDate.of(1985, 3, 15))
                .organizationUnit(union)
                .active(true)
                .build();
        userRepository.save(youthLeader);
        
        // Update department with leader
        youthDept.setLeader(youthLeader);
        departmentRepository.save(youthDept);
        log.info("Created Youth Leader: {}", youthLeader.getEmail());
        
        // Create Field Leaders
        OrganizationUnit ecrfField = organizationUnitRepository.findByCode("ECRF")
                .orElseThrow(() -> new RuntimeException("East Central Rwanda Field not found"));
        
        User fieldLeader = User.builder()
                .firstName("Paul")
                .lastName("Uwizeye")
                .email("ecrf.field@rum.adventist.org")
                .phoneNumber("+250788345678")
                .password(passwordEncoder.encode("Field@2026"))
                .role(Role.COORDINATOR)
                .position(Position.FIELD_LEADER)
                .gender(Gender.MALE)
                .dateOfBirth(LocalDate.of(1975, 5, 20))
                .organizationUnit(ecrfField)
                .active(true)
                .build();
        userRepository.save(fieldLeader);
        log.info("Created Field Leader: {}", fieldLeader.getEmail());
        
        // Create Sample Pastor
        OrganizationUnit musanzeDistrict = organizationUnitRepository.findByCode("NRF-MUS")
                .orElseThrow(() -> new RuntimeException("Musanze District not found"));
        
        User pastor = User.builder()
                .firstName("David")
                .lastName("Niyonzima")
                .email("pastor.musanze@rum.adventist.org")
                .phoneNumber("+250788456789")
                .password(passwordEncoder.encode("Pastor@2026"))
                .role(Role.COORDINATOR)
                .position(Position.PASTOR)
                .gender(Gender.MALE)
                .dateOfBirth(LocalDate.of(1982, 8, 10))
                .organizationUnit(musanzeDistrict)
                .active(true)
                .build();
        userRepository.save(pastor);
        log.info("Created Pastor: {}", pastor.getEmail());
        
        // Create Sample Participants
        User participant1 = User.builder()
                .firstName("Grace")
                .lastName("Uwera")
                .email("grace.uwera@example.com")
                .phoneNumber("+250788567890")
                .password(passwordEncoder.encode("Grace@2026"))
                .role(Role.PARTICIPANT)
                .gender(Gender.FEMALE)
                .dateOfBirth(LocalDate.of(1995, 11, 25))
                .organizationUnit(musanzeDistrict)
                .active(true)
                .build();
        userRepository.save(participant1);
        
        User participant2 = User.builder()
                .firstName("Emmanuel")
                .lastName("Habimana")
                .email("emmanuel.habimana@example.com")
                .phoneNumber("+250788678901")
                .password(passwordEncoder.encode("Emmanuel@2026"))
                .role(Role.PARTICIPANT)
                .gender(Gender.MALE)
                .dateOfBirth(LocalDate.of(1992, 7, 30))
                .organizationUnit(musanzeDistrict)
                .active(true)
                .build();
        userRepository.save(participant2);
        
        log.info("Created Sample Participants");
        log.info("Initial users seeded successfully");
        
        // Log credentials
        log.info("=== DEFAULT LOGIN CREDENTIALS ===");
        log.info("Administrator - Email: admin@campcoordai.rw, Password: Admin@2026");
        log.info("Youth Leader - Email: youth.leader@rum.adventist.org, Password: Youth@2026");
        log.info("Field Leader - Email: kigali.field@rum.adventist.org, Password: Field@2026");
        log.info("Pastor - Email: pastor.remera@rum.adventist.org, Password: Pastor@2026");
        log.info("Participant - Email: grace.uwera@example.com, Password: Grace@2026");
        log.info("================================");
    }
}
