package com.example.Camp.service;

import com.example.Camp.dto.resource.ResourceAllocationRequest;
import com.example.Camp.dto.resource.ResourceRequest;
import com.example.Camp.entity.Resource;
import com.example.Camp.entity.ResourceAllocation;
import com.example.Camp.enums.ResourceType;

import java.util.List;

public interface ResourceService {
    
    Resource createResource(ResourceRequest request);
    
    Resource updateResource(Long id, ResourceRequest request);
    
    Resource getResourceById(Long id);
    
    List<Resource> getAllResources();
    
    List<Resource> getResourcesByType(ResourceType type);
    
    List<Resource> getAvailableResources();
    
    List<Resource> getAvailableResourcesByType(ResourceType type);
    
    List<Resource> searchResources(String keyword);
    
    void deleteResource(Long id);
    
    ResourceAllocation allocateResource(ResourceAllocationRequest request, Long allocatedById);
    
    ResourceAllocation getAllocationById(Long id);
    
    List<ResourceAllocation> getAllocationsByResource(Long resourceId);
    
    List<ResourceAllocation> getAllocationsByEvent(Long eventId);
    
    List<ResourceAllocation> getUnreturnedAllocations(Long eventId);
    
    ResourceAllocation returnResource(Long allocationId);
    
    void cancelAllocation(Long allocationId);
}
