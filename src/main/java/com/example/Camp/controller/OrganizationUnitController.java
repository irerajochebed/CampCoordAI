package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.entity.User;
import com.example.Camp.enums.OrganizationLevel;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.OrganizationUnitRepository;
import com.example.Camp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping({"/api/v1/org-units", "/api/v1/organization-units", "/api/organization-units"})
@RequiredArgsConstructor
public class OrganizationUnitController {

    private final OrganizationUnitRepository organizationUnitRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAll() {
        List<Map<String, Object>> units = organizationUnitRepository.findAll().stream()
                .filter(u -> !Boolean.TRUE.equals(u.getDeleted()))
                .sorted(Comparator.comparing(OrganizationUnit::getName))
                .map(this::mapToDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(units));
    }

    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrganizationTree() {
        List<OrganizationUnit> allUnits = organizationUnitRepository.findAll().stream()
                .filter(u -> !Boolean.TRUE.equals(u.getDeleted()))
                .toList();

        OrganizationUnit union = allUnits.stream()
                .filter(u -> u.getLevel() == OrganizationLevel.UNION)
                .findFirst()
                .orElse(null);

        if (union == null) {
            List<OrganizationUnit> fields = allUnits.stream()
                    .filter(u -> u.getLevel() == OrganizationLevel.FIELD)
                    .toList();
            if (!fields.isEmpty()) {
                union = fields.get(0);
            }
        }

        if (union == null) {
            return ResponseEntity.ok(ApiResponse.success(Collections.emptyMap()));
        }

        Map<String, Object> tree = buildSubTree(union, allUnits);
        return ResponseEntity.ok(ApiResponse.success(tree));
    }

    private Map<String, Object> buildSubTree(OrganizationUnit unit, List<OrganizationUnit> allUnits) {
        Map<String, Object> node = mapToDto(unit);
        List<Map<String, Object>> children = allUnits.stream()
                .filter(u -> u.getParent() != null && Objects.equals(u.getParent().getId(), unit.getId()))
                .sorted(Comparator.comparing(OrganizationUnit::getName))
                .map(child -> buildSubTree(child, allUnits))
                .toList();
        node.put("children", children);
        return node;
    }

    @GetMapping("/fields")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFields() {
        List<Map<String, Object>> fields = organizationUnitRepository.findActiveByLevel(OrganizationLevel.FIELD).stream()
                .sorted(Comparator.comparing(OrganizationUnit::getName))
                .map(this::mapToDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(fields));
    }

    @GetMapping("/children")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getChildren(@RequestParam(required = false) Long parentId) {
        List<OrganizationUnit> units;
        if (parentId == null) {
            units = organizationUnitRepository.findByParentIsNull();
            if (units.isEmpty()) {
                units = organizationUnitRepository.findActiveByLevel(OrganizationLevel.UNION);
            }
            if (units.isEmpty()) {
                units = organizationUnitRepository.findActiveByLevel(OrganizationLevel.FIELD);
            }
        } else {
            units = organizationUnitRepository.findActiveChildren(parentId);
            if (units.isEmpty()) {
                units = organizationUnitRepository.findByParentId(parentId);
            }
            if (units.isEmpty()) {
                OrganizationUnit parent = organizationUnitRepository.findById(parentId).orElse(null);
                if (parent != null && parent.getLevel() == OrganizationLevel.UNION) {
                    units = organizationUnitRepository.findActiveByLevel(OrganizationLevel.FIELD);
                }
            }
        }

        List<Map<String, Object>> result = units.stream()
                .filter(u -> !Boolean.TRUE.equals(u.getDeleted()))
                .sorted(Comparator.comparing(OrganizationUnit::getName))
                .map(this::mapToDto)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/level/{level}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getByLevel(@PathVariable OrganizationLevel level) {
        List<Map<String, Object>> units = organizationUnitRepository.findActiveByLevel(level).stream()
                .sorted(Comparator.comparing(OrganizationUnit::getName))
                .map(this::mapToDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(units));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable Long id) {
        OrganizationUnit unit = organizationUnitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OrganizationUnit", "id", id));
        return ResponseEntity.ok(ApiResponse.success(mapToDto(unit)));
    }

    private Map<String, Object> mapToDto(OrganizationUnit u) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("name", u.getName());
        map.put("type", u.getLevel() != null ? u.getLevel().name() : "DISTRICT");
        map.put("level", u.getLevel() != null ? u.getLevel().name() : "");
        map.put("code", u.getCode() != null ? u.getCode() : "");
        map.put("location", u.getLocation() != null ? u.getLocation() : "");
        map.put("address", u.getLocation() != null ? u.getLocation() : "");
        map.put("contactEmail", u.getContactEmail() != null ? u.getContactEmail() : "");
        map.put("contactPhone", u.getContactPhone() != null ? u.getContactPhone() : "");
        map.put("parentId", u.getParent() != null ? u.getParent().getId() : null);
        map.put("isCustom", Boolean.TRUE.equals(u.getIsCustom()));

        // Find primary leader
        List<User> users = userRepository.findActiveByOrganizationUnitId(u.getId());
        User primaryLeader = users.stream()
                .filter(user -> user.getPosition() != null && (
                        user.getPosition().name().contains("LEADER") ||
                        user.getPosition().name().contains("PASTOR") ||
                        user.getPosition().name().contains("ADMINISTRATOR")
                ))
                .findFirst()
                .orElse(users.isEmpty() ? null : users.get(0));

        if (primaryLeader != null) {
            String leaderTitle = (primaryLeader.getPosition() != null && primaryLeader.getPosition().name().contains("PASTOR")) ? "Pr. " : "";
            map.put("leader", leaderTitle + primaryLeader.getFirstName() + " " + primaryLeader.getLastName());
            map.put("leaderPosition", primaryLeader.getPosition() != null ? primaryLeader.getPosition().name() : "");
            if (u.getContactEmail() == null || u.getContactEmail().isBlank()) {
                map.put("contactEmail", primaryLeader.getEmail());
            }
            if (u.getContactPhone() == null || u.getContactPhone().isBlank()) {
                map.put("contactPhone", primaryLeader.getPhoneNumber());
            }
        } else {
            map.put("leader", "");
            map.put("leaderPosition", "");
        }

        // Estimate member count or calculate user count
        int memberCount = Math.max(users.size(), u.getLevel() == OrganizationLevel.UNION ? 125000 : 
                                               u.getLevel() == OrganizationLevel.FIELD ? 18000 : 
                                               u.getLevel() == OrganizationLevel.DISTRICT ? 3200 : 450);
        map.put("memberCount", memberCount);

        return map;
    }
}
