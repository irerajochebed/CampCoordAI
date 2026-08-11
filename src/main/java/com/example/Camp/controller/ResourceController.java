package com.example.Camp.controller;

import com.example.Camp.dto.common.ApiResponse;
import com.example.Camp.dto.resource.ResourceAllocationRequest;
import com.example.Camp.dto.resource.ResourceRequest;
import com.example.Camp.entity.Resource;
import com.example.Camp.entity.ResourceAllocation;
import com.example.Camp.enums.ResourceType;
import com.example.Camp.security.UserDetailsImpl;
import com.example.Camp.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {
    
    private final ResourceService resourceService;
    
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<Resource>> createResource(@Valid @RequestBody ResourceRequest request) {
        Resource resource = resourceService.createResource(request);
        return ResponseEntity.ok(ApiResponse.success("Resource created successfully", resource));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR') or hasRole('COORDINATOR')")
    public ResponseEntity<ApiResponse<Resource>> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ResourceRequest request) {
        Resource resource = resourceService.updateResource(id, request);
        return ResponseEntity.ok(ApiResponse.success("Resource updated successfully", resource));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Resource>> getResourceById(@PathVariable Long id) {
        Resource resource = resourceService.getResourceById(id);
        return ResponseEntity.ok(ApiResponse.success(resource));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Resource>>> getAllResources() {
        List<Resource> resources = resourceService.getAllResources();
        return ResponseEntity.ok(ApiResponse.success(resources));
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<Resource>>> getResourcesByType(@PathVariable ResourceType type) {
        List<Resource> resources = resourceService.getResourcesByType(type);
        return ResponseEntity.ok(ApiResponse.success(resources));
    }
    
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<Resource>>> getAvailableResources() {
        List<Resource> resources = resourceService.getAvailableResources();
        return ResponseEntity.ok(ApiResponse.success(resources));
    }
    
    @GetMapping("/available/type/{type}")
    public ResponseEntity<ApiResponse<List<Resource>>> getAvailableResourcesByType(@PathVariable ResourceType type) {
        List<Resource> resources = resourceService.getAvailableResourcesByType(type);
        return ResponseEntity.ok(ApiResponse.success(resources));
    }
    
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Resource>>> searchResources(@RequestParam String keyword) {
        List<Resource> resources = resourceService.searchResources(keyword);
        return ResponseEntity.ok(ApiResponse.success(resources));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.ok(ApiResponse.success("Resource deleted successfully", null));
    }
    
    // Resource allocation endpoints
    @PostMapping("/allocate")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<ResourceAllocation>> allocateResource(
            @Valid @RequestBody ResourceAllocationRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ResourceAllocation allocation = resourceService.allocateResource(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Resource allocated successfully", allocation));
    }
    
    @GetMapping("/allocations/{id}")
    public ResponseEntity<ApiResponse<ResourceAllocation>> getAllocationById(@PathVariable Long id) {
        ResourceAllocation allocation = resourceService.getAllocationById(id);
        return ResponseEntity.ok(ApiResponse.success(allocation));
    }
    
    @GetMapping("/{resourceId}/allocations")
    public ResponseEntity<ApiResponse<List<ResourceAllocation>>> getAllocationsByResource(
            @PathVariable Long resourceId) {
        List<ResourceAllocation> allocations = resourceService.getAllocationsByResource(resourceId);
        return ResponseEntity.ok(ApiResponse.success(allocations));
    }
    
    @GetMapping("/allocations/event/{eventId}")
    public ResponseEntity<ApiResponse<List<ResourceAllocation>>> getAllocationsByEvent(@PathVariable Long eventId) {
        List<ResourceAllocation> allocations = resourceService.getAllocationsByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success(allocations));
    }
    
    @GetMapping("/allocations/event/{eventId}/unreturned")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<List<ResourceAllocation>>> getUnreturnedAllocations(
            @PathVariable Long eventId) {
        List<ResourceAllocation> allocations = resourceService.getUnreturnedAllocations(eventId);
        return ResponseEntity.ok(ApiResponse.success(allocations));
    }
    
    @PatchMapping("/allocations/{allocationId}/return")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<ResourceAllocation>> returnResource(@PathVariable Long allocationId) {
        ResourceAllocation allocation = resourceService.returnResource(allocationId);
        return ResponseEntity.ok(ApiResponse.success("Resource returned successfully", allocation));
    }
    
    @DeleteMapping("/allocations/{allocationId}")
    @PreAuthorize("hasRole('COORDINATOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> cancelAllocation(@PathVariable Long allocationId) {
        resourceService.cancelAllocation(allocationId);
        return ResponseEntity.ok(ApiResponse.success("Allocation cancelled successfully", null));
    }
}
