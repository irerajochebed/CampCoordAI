package com.example.Camp.dto.user;

import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRolePositionRequest {
    
    private Role role;
    private Position position;
    private Long organizationUnitId;
    private Boolean active;
}
