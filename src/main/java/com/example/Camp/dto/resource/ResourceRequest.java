package com.example.Camp.dto.resource;

import com.example.Camp.enums.ResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceRequest {
    
    @NotBlank(message = "Resource name is required")
    private String name;
    
    @NotNull(message = "Resource type is required")
    private ResourceType type;
    
    private String code;
    
    private String description;
    
    @NotNull(message = "Quantity is required")
    private Integer quantity;
    
    private String condition;
}
