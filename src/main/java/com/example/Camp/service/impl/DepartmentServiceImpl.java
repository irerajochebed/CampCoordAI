package com.example.Camp.service.impl;

import com.example.Camp.dto.department.DepartmentResponse;
import com.example.Camp.entity.Department;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.DepartmentRepository;
import com.example.Camp.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAllActive().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
        return mapToResponse(department);
    }

    private DepartmentResponse mapToResponse(Department dept) {
        return DepartmentResponse.builder()
                .id(dept.getId())
                .type(dept.getType())
                .name(dept.getName())
                .description(dept.getDescription())
                .leaderId(dept.getLeader() != null ? dept.getLeader().getId() : null)
                .leaderName(dept.getLeader() != null ? dept.getLeader().getFirstName() + " " + dept.getLeader().getLastName() : null)
                .build();
    }
}
