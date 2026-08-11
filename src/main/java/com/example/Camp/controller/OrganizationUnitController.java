package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.entity.OrganizationUnit;
import com.example.Camp.enums.OrganizationLevel;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.OrganizationUnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("name", u.getName());
                    map.put("level", u.getLevel().name());
                    map.put("code", u.getCode() != null ? u.getCode() : "");
                    map.put("location", u.getLocation() != null ? u.getLocation() : "");
                    map.put("parentId", u.getParent() != null ? u.getParent().getId() : null);
                    map.put("isCustom", Boolean.TRUE.equals(u.getIsCustom()));
                    return map;
                })
                .toList();
        return ResponseEntity.ok(ApiResponse.success(units));
    }

    @GetMapping("/children")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getChildren(@RequestParam(required = false) Long parentId) {
        List<OrganizationUnit> units;
        if (parentId == null) {
            units = organizationUnitRepository.findByParentIsNull();
            if (units.isEmpty()) {
                units = organizationUnitRepository.findByLevel(OrganizationLevel.UNION);
            }
        } else {
            units = organizationUnitRepository.findActiveChildren(parentId);
            if (units.isEmpty()) {
                units = organizationUnitRepository.findByParentId(parentId);
            }
        }

        List<Map<String, Object>> result = units.stream()
                .filter(u -> !Boolean.TRUE.equals(u.getDeleted()))
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("name", u.getName());
                    map.put("level", u.getLevel() != null ? u.getLevel().name() : "");
                    map.put("code", u.getCode() != null ? u.getCode() : "");
                    map.put("location", u.getLocation() != null ? u.getLocation() : "");
                    map.put("parentId", u.getParent() != null ? u.getParent().getId() : null);
                    map.put("isCustom", Boolean.TRUE.equals(u.getIsCustom()));
                    return map;
                })
                .toList();

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/level/{level}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getByLevel(@PathVariable OrganizationLevel level) {
        List<Map<String, Object>> units = organizationUnitRepository.findByLevel(level).stream()
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("name", u.getName());
                    map.put("level", u.getLevel().name());
                    map.put("code", u.getCode() != null ? u.getCode() : "");
                    map.put("location", u.getLocation() != null ? u.getLocation() : "");
                    map.put("isCustom", Boolean.TRUE.equals(u.getIsCustom()));
                    return map;
                })
                .toList();
        return ResponseEntity.ok(ApiResponse.success(units));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable Long id) {
        OrganizationUnit unit = organizationUnitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OrganizationUnit", "id", id));
        Map<String, Object> data = new HashMap<>();
        data.put("id", unit.getId());
        data.put("name", unit.getName());
        data.put("level", unit.getLevel().name());
        data.put("code", unit.getCode() != null ? unit.getCode() : "");
        data.put("location", unit.getLocation() != null ? unit.getLocation() : "");
        data.put("parentId", unit.getParent() != null ? unit.getParent().getId() : null);
        data.put("isCustom", Boolean.TRUE.equals(unit.getIsCustom()));
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
