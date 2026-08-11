package com.example.Camp.dto.resource;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceAllocationRequest {
    
    @NotNull(message = "Resource ID is required")
    private Long resourceId;
    
    @NotNull(message = "Event ID is required")
    private Long eventId;
    
    @NotNull(message = "Quantity is required")
    private Integer quantity;
    
    @NotNull(message = "Allocated from date is required")
    private LocalDateTime allocatedFrom;
    
    @NotNull(message = "Allocated to date is required")
    private LocalDateTime allocatedTo;
    
    private String purpose;
}
