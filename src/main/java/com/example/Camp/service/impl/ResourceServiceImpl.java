package com.example.Camp.service.impl;

import com.example.Camp.dto.resource.ResourceAllocationRequest;
import com.example.Camp.dto.resource.ResourceRequest;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.Resource;
import com.example.Camp.entity.ResourceAllocation;
import com.example.Camp.entity.User;
import com.example.Camp.enums.ResourceType;
import com.example.Camp.exception.BusinessRuleException;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.ResourceAllocationRepository;
import com.example.Camp.repository.ResourceRepository;
import com.example.Camp.service.EventService;
import com.example.Camp.service.ResourceService;
import com.example.Camp.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ResourceServiceImpl implements ResourceService {
    
    private final ResourceRepository resourceRepository;
    private final ResourceAllocationRepository resourceAllocationRepository;
    private final EventService eventService;
    private final UserService userService;
    
    @Override
    public Resource createResource(ResourceRequest request) {
        // Check if code already exists
        if (request.getCode() != null && resourceRepository.existsByCode(request.getCode())) {
            throw new BusinessRuleException("Resource with code " + request.getCode() + " already exists");
        }
        
        Resource resource = Resource.builder()
                .name(request.getName())
                .type(request.getType())
                .code(request.getCode())
                .description(request.getDescription())
                .quantity(request.getQuantity())
                .availableQuantity(request.getQuantity())
                .condition(request.getCondition())
                .available(true)
                .build();
        
        Resource saved = resourceRepository.save(resource);
        log.info("Resource created: {}", saved.getName());
        return saved;
    }
    
    @Override
    public Resource updateResource(Long id, ResourceRequest request) {
        Resource resource = getResourceById(id);
        
        resource.setName(request.getName());
        resource.setType(request.getType());
        resource.setCode(request.getCode());
        resource.setDescription(request.getDescription());
        resource.setQuantity(request.getQuantity());
        resource.setCondition(request.getCondition());
        
        // Adjust available quantity if total quantity changed
        int quantityDifference = request.getQuantity() - resource.getQuantity();
        resource.setAvailableQuantity(resource.getAvailableQuantity() + quantityDifference);
        
        Resource saved = resourceRepository.save(resource);
        log.info("Resource updated: {}", id);
        return saved;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Resource getResourceById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", id));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Resource> getAllResources() {
        return resourceRepository.findAll().stream()
                .filter(r -> !r.getDeleted())
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Resource> getResourcesByType(ResourceType type) {
        return resourceRepository.findActiveByType(type);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Resource> getAvailableResources() {
        return resourceRepository.findAvailableWithStock();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Resource> getAvailableResourcesByType(ResourceType type) {
        return resourceRepository.findAvailableByType(type);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Resource> searchResources(String keyword) {
        return resourceRepository.searchByName(keyword);
    }
    
    @Override
    public void deleteResource(Long id) {
        Resource resource = getResourceById(id);
        resource.setDeleted(true);
        resourceRepository.save(resource);
        log.info("Resource soft deleted: {}", id);
    }
    
    @Override
    public ResourceAllocation allocateResource(ResourceAllocationRequest request, Long allocatedById) {
        Resource resource = getResourceById(request.getResourceId());
        Event event = eventService.getEventEntity(request.getEventId());
        User allocatedBy = allocatedById != null ? userService.getUserById(allocatedById) : null;
        
        // Check if resource is available
        if (!resource.getAvailable()) {
            throw new BusinessRuleException("Resource is not available");
        }
        
        // Check if sufficient quantity available
        if (resource.getAvailableQuantity() < request.getQuantity()) {
            throw new BusinessRuleException("Insufficient quantity available. Available: " + 
                    resource.getAvailableQuantity() + ", Requested: " + request.getQuantity());
        }
        
        // Check for conflicting allocations
        List<ResourceAllocation> conflicts = resourceAllocationRepository.findConflictingAllocations(
                request.getResourceId(),
                request.getAllocatedFrom(),
                request.getAllocatedTo()
        );
        
        if (!conflicts.isEmpty()) {
            int totalConflictingQuantity = conflicts.stream()
                    .mapToInt(ResourceAllocation::getQuantity)
                    .sum();
            if (resource.getAvailableQuantity() - totalConflictingQuantity < request.getQuantity()) {
                throw new BusinessRuleException("Resource is already allocated for the requested time period");
            }
        }
        
        ResourceAllocation allocation = ResourceAllocation.builder()
                .resource(resource)
                .event(event)
                .quantity(request.getQuantity())
                .allocatedFrom(request.getAllocatedFrom())
                .allocatedTo(request.getAllocatedTo())
                .allocatedBy(allocatedBy)
                .purpose(request.getPurpose())
                .returned(false)
                .build();
        
        ResourceAllocation saved = resourceAllocationRepository.save(allocation);
        
        // Update available quantity
        resource.setAvailableQuantity(resource.getAvailableQuantity() - request.getQuantity());
        resourceRepository.save(resource);
        
        log.info("Resource allocated: Resource {} Event {} Quantity {}", 
                request.getResourceId(), request.getEventId(), request.getQuantity());
        return saved;
    }
    
    @Override
    @Transactional(readOnly = true)
    public ResourceAllocation getAllocationById(Long id) {
        return resourceAllocationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ResourceAllocation", "id", id));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ResourceAllocation> getAllocationsByResource(Long resourceId) {
        return resourceAllocationRepository.findActiveByResource(resourceId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ResourceAllocation> getAllocationsByEvent(Long eventId) {
        return resourceAllocationRepository.findActiveByEvent(eventId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ResourceAllocation> getUnreturnedAllocations(Long eventId) {
        return resourceAllocationRepository.findUnreturnedByEvent(eventId);
    }
    
    @Override
    public ResourceAllocation returnResource(Long allocationId) {
        ResourceAllocation allocation = getAllocationById(allocationId);
        
        if (allocation.getReturned()) {
            throw new BusinessRuleException("Resource has already been returned");
        }
        
        allocation.setReturned(true);
        allocation.setReturnedAt(LocalDateTime.now());
        ResourceAllocation saved = resourceAllocationRepository.save(allocation);
        
        // Update available quantity
        Resource resource = allocation.getResource();
        resource.setAvailableQuantity(resource.getAvailableQuantity() + allocation.getQuantity());
        resourceRepository.save(resource);
        
        log.info("Resource returned: Allocation {}", allocationId);
        return saved;
    }
    
    @Override
    public void cancelAllocation(Long allocationId) {
        ResourceAllocation allocation = getAllocationById(allocationId);
        
        if (allocation.getReturned()) {
            throw new BusinessRuleException("Cannot cancel returned allocation");
        }
        
        // Restore available quantity
        Resource resource = allocation.getResource();
        resource.setAvailableQuantity(resource.getAvailableQuantity() + allocation.getQuantity());
        resourceRepository.save(resource);
        
        allocation.setDeleted(true);
        resourceAllocationRepository.save(allocation);
        
        log.info("Resource allocation cancelled: {}", allocationId);
    }
}
