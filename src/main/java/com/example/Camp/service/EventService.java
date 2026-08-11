package com.example.Camp.service;

import com.example.Camp.dto.event.EventAssignmentRequest;
import com.example.Camp.dto.event.EventRequest;
import com.example.Camp.dto.event.EventResponse;
import com.example.Camp.entity.Event;
import com.example.Camp.enums.EventStatus;

import java.util.List;

public interface EventService {
    
    EventResponse createEvent(EventRequest request, Long coordinatorId);
    
    EventResponse createEventFromProposal(Long proposalId, Long coordinatorId);
    
    EventResponse updateEvent(Long id, EventRequest request);
    
    EventResponse getEventById(Long id);
    
    List<EventResponse> getAllEvents();
    
    List<EventResponse> getEventsByStatus(EventStatus status);
    
    List<EventResponse> getEventsByCoordinator(Long coordinatorId);
    
    List<EventResponse> getUpcomingEvents();
    
    List<EventResponse> getOngoingEvents();
    
    List<EventResponse> getOpenForRegistration();
    
    EventResponse updateEventStatus(Long id, EventStatus status);
    
    EventResponse openRegistration(Long id);
    
    EventResponse closeRegistration(Long id);
    
    EventResponse startEvent(Long id);
    
    EventResponse completeEvent(Long id);
    
    void assignStaff(Long eventId, EventAssignmentRequest request);
    
    void removeStaffAssignment(Long eventId, Long userId);
    
    void deleteEvent(Long id);
    
    Event getEventEntity(Long id);
    
    String generateEventCode();
}
