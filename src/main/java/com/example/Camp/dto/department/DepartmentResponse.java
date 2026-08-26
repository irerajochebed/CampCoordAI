package com.example.Camp.dto.department;

import com.example.Camp.enums.DepartmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentResponse {
    private Long id;
    private DepartmentType type;
    private String name;
    private String description;
    private Long leaderId;
    private String leaderName;
}
