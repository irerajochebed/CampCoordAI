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

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import com.example.Camp.entity.Event;
import com.example.Camp.repository.EventRepository;
import java.math.BigDecimal;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {
    
    private final OrganizationUnitRepository organizationUnitRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;
    
    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking data seeding for CampCoordAI...");
        fixDatabaseConstraints();
        seedOrganizationStructure();
        seedDepartments();
        seedInitialUsers();
        seedEvents();
        log.info("Data seeding check completed successfully.");
    }

    private void fixDatabaseConstraints() {
        try {
            entityManager.createNativeQuery("ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_type_check").executeUpdate();
            entityManager.createNativeQuery("ALTER TABLE organization_units DROP CONSTRAINT IF EXISTS organization_units_level_check").executeUpdate();
            entityManager.createNativeQuery("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_position_check").executeUpdate();
            entityManager.createNativeQuery("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check").executeUpdate();
            entityManager.createNativeQuery("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check").executeUpdate();
        } catch (Exception e) {
            log.warn("Could not drop legacy table check constraints: {}", e.getMessage());
        }
    }
    
    private void seedOrganizationStructure() {
        log.info("Checking organization structure for Rwanda Union Mission & North Rwanda Field...");
        
        // 1. Create or fetch Rwanda Union Mission
        OrganizationUnit union = organizationUnitRepository.findByCode("RUM")
                .orElseGet(() -> organizationUnitRepository.save(OrganizationUnit.builder()
                        .name("Rwanda Union Mission")
                        .level(OrganizationLevel.UNION)
                        .code("RUM")
                        .location("Kigali, Rwanda")
                        .contactEmail("info@rumadventist.org")
                        .contactPhone("+250788000000")
                        .build()));
        
        // 2. Create 8 Fields under Rwanda Union Mission
        OrganizationUnit northField = createOrUpdateField("North Rwanda Field", "NRF", "Musanze, Northern Province", "info@nrf.rumadventist.org", "+250788756534", union);
        createOrUpdateField("Central Rwanda Field", "CRF", "Muhanga, Southern Province", "crf@rumadventist.org", "+250788100001", union);
        createOrUpdateField("East Central Rwanda Field", "ECRF", "Kigali City", "ecrf@rumadventist.org", "+250788100002", union);
        createOrUpdateField("North-East Rwanda Field", "NERF", "Nyagatare, Eastern Province", "nerf@rumadventist.org", "+250788100004", union);
        createOrUpdateField("North-West Rwanda Field", "NWRF", "Rubavu, Western Province", "nwrf@rumadventist.org", "+250788100005", union);
        createOrUpdateField("South Rwanda Field", "SRF", "Huye, Southern Province", "srf@rumadventist.org", "+250788100006", union);
        createOrUpdateField("South-East Rwanda Field", "SERF", "Ngoma, Eastern Province", "serf@rumadventist.org", "+250788100007", union);
        createOrUpdateField("West Rwanda Field", "WRF", "Karongi, Western Province", "wrf@rumadventist.org", "+250788100008", union);
        
        // Clean up any non-NRF districts from previous runs so only official NRF districts exist
        try {
            // 1. Reassign users on non-NRF districts/churches to the Union
            entityManager.createNativeQuery(
                "UPDATE users SET organization_unit_id = :unionId WHERE organization_unit_id IN (" +
                "  SELECT id FROM organization_units WHERE (level = 'DISTRICT' AND parent_id != :nrfId) " +
                "  OR (level = 'CHURCH' AND parent_id NOT IN (SELECT id FROM organization_units WHERE parent_id = :nrfId))" +
                ")"
            ).setParameter("unionId", union.getId()).setParameter("nrfId", northField.getId()).executeUpdate();

            // 2. Reassign proposals targeting non-NRF districts/churches to the Union
            entityManager.createNativeQuery(
                "UPDATE proposals SET target_organization_unit_id = :unionId WHERE target_organization_unit_id IN (" +
                "  SELECT id FROM organization_units WHERE (level = 'DISTRICT' AND parent_id != :nrfId) " +
                "  OR (level = 'CHURCH' AND parent_id NOT IN (SELECT id FROM organization_units WHERE parent_id = :nrfId))" +
                ")"
            ).setParameter("unionId", union.getId()).setParameter("nrfId", northField.getId()).executeUpdate();

            // 3. Delete non-NRF child churches first
            entityManager.createNativeQuery(
                "DELETE FROM organization_units WHERE level = 'CHURCH' " +
                "AND parent_id NOT IN (SELECT id FROM organization_units WHERE parent_id = :nrfId)"
            ).setParameter("nrfId", northField.getId()).executeUpdate();

            // 4. Delete non-NRF districts
            entityManager.createNativeQuery(
                "DELETE FROM organization_units WHERE level = 'DISTRICT' AND parent_id != :nrfId"
            ).setParameter("nrfId", northField.getId()).executeUpdate();

            // 5. Clean up any obsolete/legacy fields (ERF, KGF) so strictly 8 official fields remain
            entityManager.createNativeQuery(
                "UPDATE users SET organization_unit_id = (SELECT id FROM organization_units WHERE code = 'ECRF' LIMIT 1) " +
                "WHERE organization_unit_id IN (SELECT id FROM organization_units WHERE code IN ('ERF', 'KGF')); " +
                "DELETE FROM organization_units WHERE code IN ('ERF', 'KGF');"
            ).executeUpdate();
        } catch (Exception e) {
            log.warn("Could not execute cleanup query for non-NRF units: {}", e.getMessage());
        }

        // 3. Create 34 Official SDA Districts under North Rwanda Field (NRF)
        createOrUpdateDistrict("Bukamba District", "NRF-BUK", "Bukamba Zone, Musanze", "bukamba@nrf.rumadventist.org", northField, "Bukamba Central Church", "CH-BUK-1");
        createOrUpdateDistrict("Kivuye District", "NRF-KIV", "Ndorwa Zone, Gicumbi", "kivuye@nrf.rumadventist.org", northField, "Kivuye Central Church", "CH-KIV-1");
        createOrUpdateDistrict("Musanze District", "NRF-MUS", "Kigombe Zone, Musanze", "musanze@nrf.rumadventist.org", northField, "Musanze Central Church", "CH-MUS-1");
        createOrUpdateDistrict("Gasiho District", "NRF-GAS", "Kibali Zone, Gicumbi", "gasiho@nrf.rumadventist.org", northField, "Gasiho Central Church", "CH-GAS-1");
        createOrUpdateDistrict("Ruhondo District", "NRF-RUH", "Bukamba Zone, Musanze", "ruhondo@nrf.rumadventist.org", northField, "Ruhondo Central Church", "CH-RUH-1");
        createOrUpdateDistrict("Kabere District", "NRF-KAB", "Kigombe Zone, Musanze", "kabere@nrf.rumadventist.org", northField, "Kabere Central Church", "CH-KAB-1");
        createOrUpdateDistrict("Nkuli District", "NRF-NKU", "Nkuli Zone, Nyabihu", "nkuli@nrf.rumadventist.org", northField, "Nkuli Central Church", "CH-NKU-1");
        createOrUpdateDistrict("Kidaho District", "NRF-KID", "Bukamba Zone, Musanze", "kidaho@nrf.rumadventist.org", northField, "Kidaho Central Church", "CH-KID-1");
        createOrUpdateDistrict("CAR District", "NRF-CAR", "Nkuli Zone, Nyabihu", "car@nrf.rumadventist.org", northField, "CAR Campus Church", "CH-CAR-1");
        createOrUpdateDistrict("Kibali District", "NRF-KIB", "Kibali Zone, Gicumbi", "kibali@nrf.rumadventist.org", northField, "Kibali Central Church", "CH-KIB-1");
        createOrUpdateDistrict("Rwankeri District", "NRF-RWA", "Nkuli Zone, Nyabihu", "rwankeri@nrf.rumadventist.org", northField, "Rwankeri Central Church", "CH-RWA-1");
        createOrUpdateDistrict("Kigombe District", "NRF-KIG", "Kigombe Zone, Musanze", "kigombe@nrf.rumadventist.org", northField, "Kigombe Central Church", "CH-KIG-1");
        createOrUpdateDistrict("Joma District", "NRF-JOM", "Kibali Zone, Gicumbi", "joma@nrf.rumadventist.org", northField, "Joma Central Church", "CH-JOM-1");
        createOrUpdateDistrict("Ruhanga District", "NRF-RUHA", "Bukamba Zone, Musanze", "ruhanga@nrf.rumadventist.org", northField, "Ruhanga Central Church", "CH-RUHA-1");
        createOrUpdateDistrict("Nkumba District", "NRF-NKUM", "Bukamba Zone, Musanze", "nkumba@nrf.rumadventist.org", northField, "Nkumba Central Church", "CH-NKUM-1");
        createOrUpdateDistrict("Kinigi District", "NRF-KIN", "Bukamba Zone, Musanze", "kinigi@nrf.rumadventist.org", northField, "Kinigi Central Church", "CH-KIN-1");
        createOrUpdateDistrict("Mataba District", "NRF-MAT", "Kibali Zone, Gicumbi", "mataba@nrf.rumadventist.org", northField, "Mataba Central Church", "CH-MAT-1");
        createOrUpdateDistrict("Bugarura District", "NRF-BUG", "Kigombe Zone, Musanze", "bugarura@nrf.rumadventist.org", northField, "Bugarura Central Church", "CH-BUG-1");
        createOrUpdateDistrict("Kalinzi District", "NRF-KAL", "Kigombe Zone, Musanze", "kalinzi@nrf.rumadventist.org", northField, "Kalinzi Central Church", "CH-KAL-1");
        createOrUpdateDistrict("Kirambo District", "NRF-KIR", "Ndorwa Zone, Gicumbi", "kirambo@nrf.rumadventist.org", northField, "Kirambo Central Church", "CH-KIR-1");
        createOrUpdateDistrict("Runoga District", "NRF-RUN", "Kibali Zone, Gicumbi", "runoga@nrf.rumadventist.org", northField, "Runoga Central Church", "CH-RUN-1");
        createOrUpdateDistrict("Buberuka District", "NRF-BUB", "Ndorwa Zone, Gicumbi", "buberuka@nrf.rumadventist.org", northField, "Buberuka Central Church", "CH-BUB-1");
        createOrUpdateDistrict("Mugali District", "NRF-MUG", "Nkuli Zone, Nyabihu", "mugali@nrf.rumadventist.org", northField, "Mugali Central Church", "CH-MUG-1");
        createOrUpdateDistrict("Buhoma District", "NRF-BUHO", "Nkuli Zone, Nyabihu", "buhoma@nrf.rumadventist.org", northField, "Buhoma Central Church", "CH-BUHO-1");
        createOrUpdateDistrict("Nyarugina District", "NRF-NYA", "Bukamba Zone, Musanze", "nyarugina@nrf.rumadventist.org", northField, "Nyarugina Central Church", "CH-NYA-1");
        createOrUpdateDistrict("Kivuruga District", "NRF-KIVU", "Kibali Zone, Gicumbi", "kivuruga@nrf.rumadventist.org", northField, "Kivuruga Central Church", "CH-KIVU-1");
        createOrUpdateDistrict("Marangara District", "NRF-MAR", "Nkuli Zone, Nyabihu", "marangara@nrf.rumadventist.org", northField, "Marangara Central Church", "CH-MAR-1");
        createOrUpdateDistrict("Bwuzuri District", "NRF-BWU", "Kigombe Zone, Musanze", "bwuzuri@nrf.rumadventist.org", northField, "Bwuzuri Central Church", "CH-BWU-1");
        createOrUpdateDistrict("Bukonya District", "NRF-BUKO", "Kigombe Zone, Musanze", "bukonya@nrf.rumadventist.org", northField, "Bukonya Central Church", "CH-BUKO-1");
        createOrUpdateDistrict("Ndusu District", "NRF-NDU", "Kigombe Zone, Musanze", "ndusu@nrf.rumadventist.org", northField, "Ndusu Central Church", "CH-NDU-1");
        createOrUpdateDistrict("Munyana District", "NRF-MUN", "Kibali Zone, Gicumbi", "munyana@nrf.rumadventist.org", northField, "Munyana Central Church", "CH-MUN-1");
        createOrUpdateDistrict("Ndorwa District", "NRF-NDO", "Ndorwa Zone, Gicumbi", "ndorwa@nrf.rumadventist.org", northField, "Ndorwa Central Church", "CH-NDO-1");
        createOrUpdateDistrict("Rutovu District", "NRF-RUT", "Ndorwa Zone, Gicumbi", "rutovu@nrf.rumadventist.org", northField, "Rutovu Central Church", "CH-RUT-1");
        createOrUpdateDistrict("Mucaca District", "NRF-MUC", "Ndorwa Zone, Gicumbi", "mucaca@nrf.rumadventist.org", northField, "Mucaca Central Church", "CH-MUC-1");
    }
    
    private OrganizationUnit createOrUpdateField(String name, String code, String location, String email, String phone, OrganizationUnit parent) {
        OrganizationUnit field = organizationUnitRepository.findByCode(code)
                .orElseGet(() -> OrganizationUnit.builder().code(code).build());
        field.setName(name);
        field.setLevel(OrganizationLevel.FIELD);
        field.setLocation(location);
        field.setContactEmail(email);
        field.setContactPhone(phone);
        field.setParent(parent);
        return organizationUnitRepository.save(field);
    }
    
    private OrganizationUnit createOrUpdateDistrict(String name, String code, String location, String email, OrganizationUnit parent, String churchName, String churchCode) {
        OrganizationUnit district = organizationUnitRepository.findByCode(code)
                .orElseGet(() -> OrganizationUnit.builder().code(code).build());
        district.setName(name);
        district.setLevel(OrganizationLevel.DISTRICT);
        district.setLocation(location);
        district.setContactEmail(email);
        district.setParent(parent);
        district = organizationUnitRepository.save(district);

        // Seed Responsive Central Church
        Optional<OrganizationUnit> existingChurch = organizationUnitRepository.findByCode(churchCode);
        if (existingChurch.isEmpty()) {
            OrganizationUnit church = OrganizationUnit.builder()
                    .name(churchName)
                    .code(churchCode)
                    .level(OrganizationLevel.CHURCH)
                    .location(location)
                    .parent(district)
                    .build();
            organizationUnitRepository.save(church);
        }

        return district;
    }
    
    private void seedDepartments() {
        log.info("Checking Official Rwanda Union Mission (RUM) Ministries...");
        cleanupDuplicateDepartments();

        // 16 Official RUM Ministries (Directly from https://www.rumadventist.org/ministries/)
        createOrUpdateDepartment(DepartmentType.CHAPLAINCY, "Chaplaincy Ministries", 
                "Adventist Chaplaincy Ministries (ACM) is comprised of trained chaplains committed to Jesus-Christ and the global mission of the Seventh-day Adventist Church, ministering across schools, hospitals, and public institutions.");
        createOrUpdateDepartment(DepartmentType.POSSIBILITY, "Adventist Possibility Ministry", 
                "Adventist Possibility Ministries seek to bring wholeness to all in a world that is broken, proclaiming and emphasizing the value and dignity of each person with special needs and abilities.");
        createOrUpdateDepartment(DepartmentType.CHILDREN, "Children's Ministries", 
                "Children's Ministries is about developing the faith of children ages birth to fourteen, providing multiple ministries that lead them to Jesus and disciple them in their daily walk with Him.");
        createOrUpdateDepartment(DepartmentType.COMMUNICATION, "Communication Ministry", 
                "The Communication Department fosters hope and connectivity across Rwanda through Voice of Hope Radio, Hope Channel Rwanda, media evangelism, and public relations.");
        createOrUpdateDepartment(DepartmentType.EDUCATION, "Education Ministry", 
                "Serving as a prominent platform for religious instruction, nurturing faith, and ensuring comprehensive Christian education aligned with Seventh-day Adventist values.");
        createOrUpdateDepartment(DepartmentType.FAMILY, "Family Ministries", 
                "Focusing on people in relationships within the church and community, supporting Christian marriages, parenting, and Adventist home living.");
        createOrUpdateDepartment(DepartmentType.HEALTH, "Health Ministries", 
                "Promoting holistic healing, healthy living principles, and wellness, acting as a special agent of healing to relieve suffering and reveal God's love.");
        createOrUpdateDepartment(DepartmentType.MINISTERIAL, "Ministerial Association", 
                "Serving pastors, pastors' families, local church elders, company leaders, and Ministerial Association secretaries across all 8 fields in Rwanda.");
        createOrUpdateDepartment(DepartmentType.MINISTERIAL_ASSOCIATION, "Ministerial Spouses Association", 
                "Supporting, empowering, and providing spiritual fellowship for pastors' spouses and shepherdesses across Rwanda Union Mission.");
        createOrUpdateDepartment(DepartmentType.PUBLISHING, "Publishing", 
                "The Literature Ministry exists to share the gospel of Hope throughout Rwanda through publications, literature evangelism, and mass media cooperation.");
        createOrUpdateDepartment(DepartmentType.YOUTH, "Youth", 
                "Empowering young people to be in the forefront of mission activities of the Advent Movement, Pathfinder and Adventurer clubs, and youth congresses.");
        createOrUpdateDepartment(DepartmentType.WOMEN, "Women's Ministries (MIFEM)", 
                "Ministères Féminins — Dedicated to empowering and uplifting Adventist women as persons of spiritual strength, discipleship, and Christian service.");
        createOrUpdateDepartment(DepartmentType.PERSONAL_MINISTRIES, "Sabbath School & Personal Ministries", 
                "Fostering personal Bible study, community outreach, discipleship training, and weekly Sabbath School classes across Rwanda.");
        createOrUpdateDepartment(DepartmentType.STEWARDSHIP, "Stewardship Ministries", 
                "Teaching biblical principles of resource management, tithing faithfulness, and dedicated Christian stewardship.");
        createOrUpdateDepartment(DepartmentType.PARL, "Public Affairs & Religious Liberty (PARL)", 
                "Promoting religious freedom, human rights, freedom of conscience, and peaceful relations with public and inter-organizational entities.");
        createOrUpdateDepartment(DepartmentType.EVANGELISM, "Evangelism & Adventist Mission", 
                "Fulfilling the Great Commission through church planting, public evangelism campaigns (I Will Go & Total Member Involvement), and national mission outreach.");
    }

    private void cleanupDuplicateDepartments() {
        try {
            String[][] legacyPairs = {
                {"YOUTH_MINISTRIES", "YOUTH"},
                {"MIFEM", "WOMEN"},
                {"CHILDRENS_MINISTRIES", "CHILDREN"},
                {"FAMILY_MINISTRIES", "FAMILY"},
                {"HEALTH_MINISTRIES", "HEALTH"},
                {"PUBLISHING_MINISTRIES", "PUBLISHING"},
                {"SABBATH_SCHOOL", "PERSONAL_MINISTRIES"}
            };
            
            for (String[] pair : legacyPairs) {
                String legacyType = pair[0];
                String canonicalType = pair[1];
                
                @SuppressWarnings("unchecked")
                java.util.List<Number> canonicalIds = entityManager.createNativeQuery(
                    "SELECT id FROM departments WHERE type = :canonicalType ORDER BY id ASC")
                    .setParameter("canonicalType", canonicalType)
                    .getResultList();
                    
                @SuppressWarnings("unchecked")
                java.util.List<Number> legacyIds = entityManager.createNativeQuery(
                    "SELECT id FROM departments WHERE type = :legacyType")
                    .setParameter("legacyType", legacyType)
                    .getResultList();
                    
                if (!canonicalIds.isEmpty() && !legacyIds.isEmpty()) {
                    Long canonicalId = canonicalIds.get(0).longValue();
                    for (Number legId : legacyIds) {
                        Long legacyId = legId.longValue();
                        if (!legacyId.equals(canonicalId)) {
                            entityManager.createNativeQuery("UPDATE users SET department_id = :canonicalId WHERE department_id = :legacyId")
                                .setParameter("canonicalId", canonicalId)
                                .setParameter("legacyId", legacyId)
                                .executeUpdate();
                            entityManager.createNativeQuery("UPDATE events SET department_id = :canonicalId WHERE department_id = :legacyId")
                                .setParameter("canonicalId", canonicalId)
                                .setParameter("legacyId", legacyId)
                                .executeUpdate();
                            entityManager.createNativeQuery("UPDATE proposals SET department_id = :canonicalId WHERE department_id = :legacyId")
                                .setParameter("canonicalId", canonicalId)
                                .setParameter("legacyId", legacyId)
                                .executeUpdate();
                            entityManager.createNativeQuery("DELETE FROM departments WHERE id = :legacyId")
                                .setParameter("legacyId", legacyId)
                                .executeUpdate();
                        }
                    }
                } else if (canonicalIds.isEmpty() && !legacyIds.isEmpty()) {
                    entityManager.createNativeQuery("UPDATE departments SET type = :canonicalType WHERE type = :legacyType")
                        .setParameter("canonicalType", canonicalType)
                        .setParameter("legacyType", legacyType)
                        .executeUpdate();
                }
            }
            // Unlink any user, event, or proposal referencing obsolete departments before deletion
            entityManager.createNativeQuery(
                "UPDATE users SET department_id = NULL WHERE department_id IN (" +
                "  SELECT id FROM departments WHERE type NOT IN ('CHAPLAINCY', 'POSSIBILITY', 'CHILDREN', 'COMMUNICATION', 'EDUCATION', 'FAMILY', 'HEALTH', 'MINISTERIAL', 'MINISTERIAL_ASSOCIATION', 'PUBLISHING', 'YOUTH', 'WOMEN', 'PERSONAL_MINISTRIES', 'STEWARDSHIP', 'PARL', 'EVANGELISM')" +
                ")"
            ).executeUpdate();
            entityManager.createNativeQuery(
                "UPDATE events SET department_id = NULL WHERE department_id IN (" +
                "  SELECT id FROM departments WHERE type NOT IN ('CHAPLAINCY', 'POSSIBILITY', 'CHILDREN', 'COMMUNICATION', 'EDUCATION', 'FAMILY', 'HEALTH', 'MINISTERIAL', 'MINISTERIAL_ASSOCIATION', 'PUBLISHING', 'YOUTH', 'WOMEN', 'PERSONAL_MINISTRIES', 'STEWARDSHIP', 'PARL', 'EVANGELISM')" +
                ")"
            ).executeUpdate();
            entityManager.createNativeQuery(
                "UPDATE proposals SET department_id = NULL WHERE department_id IN (" +
                "  SELECT id FROM departments WHERE type NOT IN ('CHAPLAINCY', 'POSSIBILITY', 'CHILDREN', 'COMMUNICATION', 'EDUCATION', 'FAMILY', 'HEALTH', 'MINISTERIAL', 'MINISTERIAL_ASSOCIATION', 'PUBLISHING', 'YOUTH', 'WOMEN', 'PERSONAL_MINISTRIES', 'STEWARDSHIP', 'PARL', 'EVANGELISM')" +
                ")"
            ).executeUpdate();
            
            // Delete obsolete departments
            entityManager.createNativeQuery(
                "DELETE FROM departments WHERE type NOT IN ('CHAPLAINCY', 'POSSIBILITY', 'CHILDREN', 'COMMUNICATION', 'EDUCATION', 'FAMILY', 'HEALTH', 'MINISTERIAL', 'MINISTERIAL_ASSOCIATION', 'PUBLISHING', 'YOUTH', 'WOMEN', 'PERSONAL_MINISTRIES', 'STEWARDSHIP', 'PARL', 'EVANGELISM')"
            ).executeUpdate();
        } catch (Exception e) {
            log.warn("Department deduplication notice: {}", e.getMessage());
        }
    }
    
    private void createOrUpdateDepartment(DepartmentType type, String name, String description) {
        Department department = departmentRepository.findByType(type)
                .orElseGet(() -> Department.builder().type(type).build());
        department.setName(name);
        department.setDescription(description);
        departmentRepository.save(department);
    }
    
    private void seedInitialUsers() {
        log.info("Checking initial leaders & pastors seeding for Rwanda Union Mission...");
        
        OrganizationUnit union = organizationUnitRepository.findByCode("RUM").orElse(null);
        OrganizationUnit nrf = organizationUnitRepository.findByCode("NRF").orElse(null);
        if (union == null || nrf == null) return;
        
        String commonPassword = passwordEncoder.encode("Admin@2026");
        String pastorPassword = passwordEncoder.encode("Pastor@2026");
        String leaderPassword = passwordEncoder.encode("Leader@2026");
        
        // 1. Rwanda Union Mission (RUM) Administrators
        createOrUpdateUser("System", "Administrator", "admin@campcoordai.rw", "+250788123456", commonPassword, Role.ADMINISTRATOR, Position.UNION_ADMINISTRATOR, Gender.MALE, union, null, null);
        createOrUpdateUser("Dr. Hesron", "BYILINGIRO", "president@rumadventist.org", "+250788300001", leaderPassword, Role.COORDINATOR, Position.UNION_ADMINISTRATOR, Gender.MALE, union, null, null);
        createOrUpdateUser("Jean Pierre", "RUKUNDO", "exec@rumadventist.org", "+250788300002", leaderPassword, Role.COORDINATOR, Position.UNION_ADMINISTRATOR, Gender.MALE, union, null, null);
        createOrUpdateUser("Josue", "HABYARIMANA", "treasurer@rumadventist.org", "+250788300003", leaderPassword, Role.COORDINATOR, Position.FINANCE_OFFICER, Gender.MALE, union, null, null);

        // 2. North Rwanda Field (NRF) Officers
        createOrUpdateUser("SETAKO", "Sophonie", "president@nrf.rumadventist.org", "+250788756534", leaderPassword, Role.COORDINATOR, Position.FIELD_LEADER, Gender.MALE, nrf, null, null);
        createOrUpdateUser("Jean Nepo", "Rutikanga", "exec@nrf.rumadventist.org", "+250788756535", leaderPassword, Role.COORDINATOR, Position.FIELD_LEADER, Gender.MALE, nrf, null, null);
        createOrUpdateUser("Kageruka Elly", "Nkuba", "treasurer@nrf.rumadventist.org", "+250788354912", leaderPassword, Role.COORDINATOR, Position.FINANCE_OFFICER, Gender.MALE, nrf, null, null);
        createOrUpdateUser("Jackson", "NIYITEGEKA", "asstreasurer@nrf.rumadventist.org", "+250788354913", leaderPassword, Role.COORDINATOR, Position.FINANCE_OFFICER, Gender.MALE, nrf, null, null);
        createOrUpdateUser("MUKAYUHI N.", "Judith", "assistantexec@nrf.rumadventist.org", "+250788354914", leaderPassword, Role.COORDINATOR, Position.CAMP_SECRETARY, Gender.FEMALE, nrf, null, null);
        createOrUpdateUser("ELIE", "KAREMERA", "presiassistant@nrf.rumadventist.org", "+250788354915", leaderPassword, Role.COORDINATOR, Position.CAMP_SECRETARY, Gender.MALE, nrf, null, null);
        createOrUpdateUser("Maua", "UMUTONI", "accountant1@nrf.rumadventist.org", "+250788354916", leaderPassword, Role.COORDINATOR, Position.FINANCE_OFFICER, Gender.FEMALE, nrf, null, null);
        createOrUpdateUser("INES", "KANKUMI", "accountant2@nrf.rumadventist.org", "+250788354917", leaderPassword, Role.COORDINATOR, Position.FINANCE_OFFICER, Gender.FEMALE, nrf, null, null);
        createOrUpdateUser("GAPIRA GASUKU", "Olivier", "maintenance@nrf.rumadventist.org", "+250788354918", leaderPassword, Role.COORDINATOR, Position.ACCOMMODATION_OFFICER, Gender.MALE, nrf, null, null);

        // 3. Official Rwanda Union Mission (RUM) Ministry Directors
        seedMinistryLeader("Esdras", "MUPENZI", "youth@rumadventist.org", "+250788756540", leaderPassword, Gender.MALE, union, DepartmentType.YOUTH);
        seedMinistryLeader("Schadrack", "NTABUMWE", "stewardship@rumadventist.org", "+250788756541", leaderPassword, Gender.MALE, union, DepartmentType.STEWARDSHIP);
        seedMinistryLeader("Judith", "BATWARE", "womenmin@rumadventist.org", "+250788756542", leaderPassword, Gender.FEMALE, union, DepartmentType.WOMEN);
        seedMinistryLeader("Amie Fidele", "NGERERO", "evangelism@rumadventist.org", "+250788756543", leaderPassword, Gender.MALE, union, DepartmentType.EVANGELISM);
        seedMinistryLeader("Athalie", "NYIRANDAGIJIMANA", "ministerial@rumadventist.org", "+250788756544", leaderPassword, Gender.FEMALE, union, DepartmentType.MINISTERIAL);
        seedMinistryLeader("Beatrice", "MUKANDAYISENGA", "spouses@rumadventist.org", "+250788756557", leaderPassword, Gender.FEMALE, union, DepartmentType.MINISTERIAL_ASSOCIATION);
        seedMinistryLeader("Jean Pierre", "Mugiraneza", "personalmin@rumadventist.org", "+250788756545", leaderPassword, Gender.MALE, union, DepartmentType.PERSONAL_MINISTRIES);
        seedMinistryLeader("Alice", "Nyiraneza", "children@rumadventist.org", "+250788756546", leaderPassword, Gender.FEMALE, union, DepartmentType.CHILDREN);
        seedMinistryLeader("Eric", "Habiyambere", "family@rumadventist.org", "+250788756547", leaderPassword, Gender.MALE, union, DepartmentType.FAMILY);
        seedMinistryLeader("Joseph", "Mukama", "chaplaincy@rumadventist.org", "+250788756548", leaderPassword, Gender.MALE, union, DepartmentType.CHAPLAINCY);
        seedMinistryLeader("Claire", "Uwera", "possibility@rumadventist.org", "+250788756549", leaderPassword, Gender.FEMALE, union, DepartmentType.POSSIBILITY);
        seedMinistryLeader("Samuel", "Karemera", "health@rumadventist.org", "+250788756550", leaderPassword, Gender.MALE, union, DepartmentType.HEALTH);
        seedMinistryLeader("Mary", "Uwimana", "publishing@rumadventist.org", "+250788756551", leaderPassword, Gender.FEMALE, union, DepartmentType.PUBLISHING);
        seedMinistryLeader("Emmanuel", "Bizimana", "parl@rumadventist.org", "+250788756552", leaderPassword, Gender.MALE, union, DepartmentType.PARL);
        seedMinistryLeader("Peter", "Ndayisaba", "education@rumadventist.org", "+250788756553", leaderPassword, Gender.MALE, union, DepartmentType.EDUCATION);
        seedMinistryLeader("Jean Paul", "Manirakiza", "communication@rumadventist.org", "+250788756554", leaderPassword, Gender.MALE, union, DepartmentType.COMMUNICATION);

        // 4. 34 District Pastors (Abakuru b'Intara)
        seedDistrictPastor("Gad", "NIZEYIMANA", "nizeyimana.gad@nrf.rumadventist.org", "+250788002001", pastorPassword, "NRF-BUK", "Bukamba");
        seedDistrictPastor("Samuel", "NIYONZIMA", "niyonzima.samuel@nrf.rumadventist.org", "+250788002002", pastorPassword, "NRF-KIV", "Kivuye");
        seedDistrictPastor("Francois", "KANOTI", "kanoti.francois@nrf.rumadventist.org", "+250788002003", pastorPassword, "NRF-MUS", "Musanze");
        seedDistrictPastor("Froduald", "NIYONZIMA", "niyonzima.froduald@nrf.rumadventist.org", "+250788002004", pastorPassword, "NRF-GAS", "Gasiho");
        seedDistrictPastor("Faustin", "RUKUNDO B.", "rukundo.faustin@nrf.rumadventist.org", "+250788002005", pastorPassword, "NRF-RUH", "Ruhondo");
        seedDistrictPastor("Hesron", "NGAMIJE", "ngamije.hesron@nrf.rumadventist.org", "+250788002006", pastorPassword, "NRF-KAB", "Kabere");
        seedDistrictPastor("Kadahwema", "MUREGO A.", "murego.kadahwema@nrf.rumadventist.org", "+250788002007", pastorPassword, "NRF-NKU", "Nkuli");
        seedDistrictPastor("James", "NTARE MUSAFIRI", "ntare.james@nrf.rumadventist.org", "+250788002008", pastorPassword, "NRF-KID", "Kidaho");
        seedDistrictPastor("Josias", "UWIDUHAYE", "uwiduhaye.josias@nrf.rumadventist.org", "+250788002009", pastorPassword, "NRF-CAR", "CAR");
        seedDistrictPastor("JMV", "NGABOYISONGA", "ngaboyisonga.jmv@nrf.rumadventist.org", "+250788002010", pastorPassword, "NRF-KIB", "Kibali");
        seedDistrictPastor("Zelobabel", "NIZEYIMANA", "nizeyimana.zelobabel@nrf.rumadventist.org", "+250788002011", pastorPassword, "NRF-RWA", "Rwankeri");
        seedDistrictPastor("RWAMUCYO", "KABERUKA", "kaberuka.rwamucyo@nrf.rumadventist.org", "+250788002012", pastorPassword, "NRF-KIG", "Kigombe");
        seedDistrictPastor("Faustin", "HAKIZIMANA", "hakizimana.faustin@nrf.rumadventist.org", "+250788002013", pastorPassword, "NRF-JOM", "Joma");
        seedDistrictPastor("Bonaventure", "RUHANGA", "bonaventure@nrf.rumadventist.org", "+250788002014", pastorPassword, "NRF-RUHA", "Ruhanga");
        seedDistrictPastor("Gérard", "NKIRIYUMWAMI NGABO", "nkiriyumwami.gerard@nrf.rumadventist.org", "+250788002015", pastorPassword, "NRF-NKUM", "Nkumba");
        seedDistrictPastor("Job", "NSENGIYUMVA", "nsengiyumva.job@nrf.rumadventist.org", "+250788002016", pastorPassword, "NRF-KIN", "Kinigi");
        seedDistrictPastor("Jean Bosco", "SINDUKINGIYE", "sindukingiye.jeanbosco@nrf.rumadventist.org", "+250788002017", pastorPassword, "NRF-MAT", "Mataba");
        seedDistrictPastor("Thaddée", "NGERERO", "ngerero.thaddee@nrf.rumadventist.org", "+250788002018", pastorPassword, "NRF-BUG", "Bugarura");
        seedDistrictPastor("Joseph", "IYAMUREMYE", "iyamuremye.joseph@nrf.rumadventist.org", "+250788002019", pastorPassword, "NRF-KAL", "Kalinzi");
        seedDistrictPastor("Aimable", "NKUNDIMANA", "nkundimana.aimable@nrf.rumadventist.org", "+250788002020", pastorPassword, "NRF-KIR", "Kirambo");
        seedDistrictPastor("Emmanuel", "UWIRINGIYIMANA", "uwiringiyimana.emmanuel@nrf.rumadventist.org", "+250788002021", pastorPassword, "NRF-RUN", "Runoga");
        seedDistrictPastor("Jotham", "ABAYISENGA", "abayisenga.jotham@nrf.rumadventist.org", "+250788002022", pastorPassword, "NRF-BUB", "Buberuka");
        seedDistrictPastor("Gashabuka", "SEBUNTU", "sebuntu.gashabuka@nrf.rumadventist.org", "+250788002023", pastorPassword, "NRF-MUG", "Mugali");
        seedDistrictPastor("Martin", "NTAKIRUTIMANA", "ntakirutimana.martin@nrf.rumadventist.org", "+250788002024", pastorPassword, "NRF-BUHO", "Buhoma");
        seedDistrictPastor("Emmanuel", "NTIBAZIRIKANA", "ntibazirikana.emmanuel@nrf.rumadventist.org", "+250788002025", pastorPassword, "NRF-NYA", "Nyarugina");
        seedDistrictPastor("Jean Pierre", "BANTEGEYE", "bantegeye.jeanpierre@nrf.rumadventist.org", "+250788002026", pastorPassword, "NRF-KIVU", "Kivuruga");
        seedDistrictPastor("Amon", "MUTAZIHANA", "mutazihana.amon@nrf.rumadventist.org", "+250788002027", pastorPassword, "NRF-MAR", "Marangar");
        seedDistrictPastor("Javan", "KAMANUTSI", "kamanutsi.javan@nrf.rumadventist.org", "+250788002028", pastorPassword, "NRF-BWU", "Bwuzuri");
        seedDistrictPastor("Heritier", "UWIMANA", "uwimana.heritier@nrf.rumadventist.org", "+250788002029", pastorPassword, "NRF-BUKO", "Bukonya");
        seedDistrictPastor("Michel", "MASENGESHO", "masengesho.michel@nrf.rumadventist.org", "+250788002030", pastorPassword, "NRF-NDU", "Ndusu");
        seedDistrictPastor("Emile", "NSHIMIYIMANA", "nshimiyimana.emile@nrf.rumadventist.org", "+250788002031", pastorPassword, "NRF-MUN", "Munyana");
        seedDistrictPastor("J. Damascene", "NTABAJIYANA", "ntabajiyana.damascene@nrf.rumadventist.org", "+250788002032", pastorPassword, "NRF-NDO", "Ndorwa");
        seedDistrictPastor("Samuel", "NIRINGIYIMANA", "niringiyimana.samuel@nrf.rumadventist.org", "+250788002033", pastorPassword, "NRF-RUT", "Rutovu");
        seedDistrictPastor("Damien", "GASHUGURU", "gashuguru.damien@nrf.rumadventist.org", "+250788002034", pastorPassword, "NRF-MUC", "Mucaca");

        // 5. Sample Participant
        OrganizationUnit musanze = organizationUnitRepository.findByCode("NRF-MUS").orElse(nrf);
        createOrUpdateUser("Sample", "Participant", "participant@campcoordai.rw", "+250788999888", commonPassword, Role.PARTICIPANT, null, Gender.FEMALE, musanze, null, null);
    }
    
    private void seedMinistryLeader(String firstName, String lastName, String email, String phone, String password, Gender gender, OrganizationUnit orgUnit, DepartmentType deptType) {
        Department dept = departmentRepository.findByType(deptType).orElse(null);
        User leader = createOrUpdateUser(firstName, lastName, email, phone, password, Role.COORDINATOR, Position.MINISTRY_LEADER, gender, orgUnit, dept, null);
        if (dept != null && (dept.getLeader() == null || !dept.getLeader().getId().equals(leader.getId()))) {
            dept.setLeader(leader);
            departmentRepository.save(dept);
        }
    }
    
    private void seedDistrictPastor(String firstName, String lastName, String email, String phone, String password, String districtCode, String sdaDistrict) {
        OrganizationUnit district = organizationUnitRepository.findByCode(districtCode).orElse(null);
        if (district != null) {
            createOrUpdateUser(firstName, lastName, email, phone, password, Role.COORDINATOR, Position.DISTRICT_PASTOR, Gender.MALE, district, null, sdaDistrict);
        }
    }
    
    private User createOrUpdateUser(String firstName, String lastName, String email, String phone, String password, Role role, Position position, Gender gender, OrganizationUnit orgUnit, Department dept, String sdaDistrict) {
        User user = userRepository.findByEmail(email)
                .or(() -> (phone != null && !phone.isBlank()) ? userRepository.findByPhoneNumber(phone) : Optional.empty())
                .orElseGet(() -> User.builder().email(email).build());
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhoneNumber(phone);
        user.setPassword(password);
        user.setRole(role);
        user.setPosition(position);
        user.setGender(gender);
        user.setOrganizationUnit(orgUnit);
        user.setDepartment(dept);
        user.setSdaDistrict(sdaDistrict);
        user.setActive(true);
        user.setDeleted(false);
        return userRepository.save(user);
    }

    private void seedEvents() {
        log.info("Checking initial events seeding...");
        User admin = userRepository.findByEmail("admin@campcoordai.rw").orElse(null);
        if (admin == null) return;

        Department youthDept = departmentRepository.findByType(DepartmentType.YOUTH).orElse(null);
        Department ministerialDept = departmentRepository.findByType(DepartmentType.MINISTERIAL).orElse(null);
        Department childrenDept = departmentRepository.findByType(DepartmentType.CHILDREN).orElse(null);
        Department healthDept = departmentRepository.findByType(DepartmentType.HEALTH).orElse(null);
        Department stewardshipDept = departmentRepository.findByType(DepartmentType.STEWARDSHIP).orElse(null);
        Department womenDept = departmentRepository.findByType(DepartmentType.WOMEN).orElse(null);

        // 1. Rwanda Youth Congress 2026 (Youth: 15 - 25 years)
        createOrUpdateEvent(
            "EVT-RYC-2026",
            "Rwanda Youth Congress 2026",
            EventType.CONFERENCE,
            "National gathering of Seventh-day Adventist Youth across Rwanda Union Mission for revival, mission mobilization, and leadership empowerment.",
            LocalDate.of(2026, 6, 12),
            LocalDate.of(2026, 6, 16),
            "Kigali Convention Centre",
            "KG 2 Roundabout, Kigali",
            EventStatus.REGISTRATION_OPEN,
            BigDecimal.valueOf(15000),
            3500,
            BigDecimal.valueOf(50000000),
            15,
            25,
            youthDept,
            admin
        );

        // 2. Pastors Advisory Council (Ministerial: 21+ years)
        createOrUpdateEvent(
            "EVT-PAC-2026",
            "Pastors Advisory Council",
            EventType.SEMINAR,
            "Strategic advisory and pastoral leadership conference for ordained ministers, district pastors, and union executive leaders.",
            LocalDate.of(2026, 5, 20),
            LocalDate.of(2026, 5, 23),
            "Gitwe",
            "Gitwe Adventist Campus, Ruhango",
            EventStatus.REGISTRATION_OPEN,
            BigDecimal.ZERO,
            250,
            BigDecimal.valueOf(12000000),
            21,
            null,
            ministerialDept,
            admin
        );

        // 3. Pathfinder Camporee (Children: 6 - 15 years)
        createOrUpdateEvent(
            "EVT-PFC-2026",
            "Pathfinder Camporee",
            EventType.CAMP,
            "Union-wide Pathfinder and Adventurer Camporee featuring honors training, camping skills, nature exploration, and spiritual devotionals.",
            LocalDate.of(2026, 7, 4),
            LocalDate.of(2026, 7, 10),
            "Lake Kivu Camp",
            "Rubavu Lakeside Grounds",
            EventStatus.REGISTRATION_OPEN,
            BigDecimal.valueOf(12000),
            1800,
            BigDecimal.valueOf(30000000),
            6,
            15,
            childrenDept,
            admin
        );

        // 4. Health Ministries Training (Adults: 18+)
        createOrUpdateEvent(
            "EVT-HMT-2026",
            "Health Ministries Training",
            EventType.TRAINING,
            "Comprehensive medical missionary and lifestyle education training for health directors, nurses, and church volunteers.",
            LocalDate.of(2026, 4, 15),
            LocalDate.of(2026, 4, 18),
            "Mugonero",
            "Mugonero Hospital Grounds, Karongi",
            EventStatus.REGISTRATION_OPEN,
            BigDecimal.valueOf(5000),
            400,
            BigDecimal.valueOf(8000000),
            18,
            null,
            healthDept,
            admin
        );

        // 5. Stewardship Conference (Draft)
        createOrUpdateEvent(
            "EVT-STW-2026",
            "Stewardship Conference",
            EventType.CONFERENCE,
            "Faithful Christian stewardship, resource management, and gospel finance conference for church treasures and elders.",
            LocalDate.of(2026, 8, 22),
            LocalDate.of(2026, 8, 25),
            "Huye",
            "Huye Stadium Conference Hall",
            EventStatus.DRAFT,
            BigDecimal.valueOf(8000),
            600,
            BigDecimal.valueOf(10000000),
            18,
            null,
            stewardshipDept,
            admin
        );

        // 6. Women's Ministries Workshop (MIFEM / Family: All Ages & Seniors)
        createOrUpdateEvent(
            "EVT-WMW-2026",
            "Women's Ministries Workshop",
            EventType.WORKSHOP,
            "Ministères Féminins (MIFEM) annual leadership and family empowerment workshop for women, mothers, daughters, and grandmothers.",
            LocalDate.of(2026, 3, 30),
            LocalDate.of(2026, 4, 2),
            "Rwamagana",
            "Rwamagana Conference Center",
            EventStatus.REGISTRATION_OPEN,
            BigDecimal.valueOf(10000),
            300,
            BigDecimal.valueOf(6000000),
            null,
            null,
            Gender.FEMALE,
            womenDept,
            admin
        );
    }

    private void createOrUpdateEvent(
        String eventCode,
        String name,
        EventType type,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        String venue,
        String venueAddress,
        EventStatus status,
        BigDecimal fee,
        Integer maxParticipants,
        BigDecimal budget,
        Integer minAge,
        Integer maxAge,
        Gender targetGender,
        Department department,
        User coordinator
    ) {
        Event event = eventRepository.findByEventCode(eventCode)
            .orElseGet(() -> Event.builder().eventCode(eventCode).build());
        
        event.setName(name);
        event.setType(type);
        event.setDescription(description);
        event.setStartDate(startDate);
        event.setEndDate(endDate);
        event.setVenue(venue);
        event.setVenueAddress(venueAddress);
        event.setStatus(status);
        event.setRegistrationFee(fee);
        event.setMaxParticipants(maxParticipants);
        event.setBudget(budget);
        event.setMinAge(minAge);
        event.setMaxAge(maxAge);
        event.setTargetGender(targetGender);
        event.setDepartment(department);
        event.setCoordinator(coordinator);
        event.setDeleted(false);
        eventRepository.save(event);
    }

    private void createOrUpdateEvent(
        String eventCode,
        String name,
        EventType type,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        String venue,
        String venueAddress,
        EventStatus status,
        BigDecimal fee,
        Integer maxParticipants,
        BigDecimal budget,
        Integer minAge,
        Integer maxAge,
        Department department,
        User coordinator
    ) {
        createOrUpdateEvent(
            eventCode, name, type, description, startDate, endDate, venue, venueAddress,
            status, fee, maxParticipants, budget, minAge, maxAge, null, department, coordinator
        );
    }
}
