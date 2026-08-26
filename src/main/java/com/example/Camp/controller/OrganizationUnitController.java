package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.enums.OrganizationLevel;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.OrganizationUnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/org-units", "/api/v1/organization-units", "/api/organization-units"})
@RequiredArgsConstructor
public class OrganizationUnitController {

    private final OrganizationUnitRepository organizationUnitRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAll() {
        List<Map<String, Object>> units = organizationUnitRepository.findAll().stream()
                .filter(u -> !Boolean.TRUE.equals(u.getDeleted()))
                .sorted(Comparator.comparing(OrganizationUnit::getName))
                .map(this::mapToDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(units));
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
        map.put("level", u.getLevel() != null ? u.getLevel().name() : "");
        map.put("code", u.getCode() != null ? u.getCode() : "");
        map.put("location", u.getLocation() != null ? u.getLocation() : "");
        map.put("parentId", u.getParent() != null ? u.getParent().getId() : null);
        map.put("isCustom", Boolean.TRUE.equals(u.getIsCustom()));
        return map;
    }
}
