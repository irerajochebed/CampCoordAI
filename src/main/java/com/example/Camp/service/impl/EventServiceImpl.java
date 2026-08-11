package com.example.Camp.service.impl;

import com.example.Camp.dto.event.EventAssignmentRequest;
import com.example.Camp.dto.event.EventRequest;
import com.example.Camp.dto.event.EventResponse;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.EventAssignment;
import com.example.Camp.entity.Proposal;
import com.example.Camp.entity.User;
import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.RegistrationStatus;
import com.example.Camp.repository.EventAssignmentRepository;
import com.example.Camp.repository.EventRepository;
import com.example.Camp.repository.RegistrationRepository;
import com.example.Camp.service.EventService;
import com.example.Camp.service.ProposalService;
import com.example.Camp.service.UserService;
import com.example.Camp.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EventServiceImpl implements EventService {
    
    private final EventRepository eventRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final RegistrationRepository registrationRepository;
    private final UserService userService;
    private final ProposalService proposalService;
    private final DtoMapper dtoMapper;
    
    @Override
    public EventResponse createEvent(EventRequest request, Long coordinatorId) {
        User coordinator = userService.getUserById(coordinatorId);
        
        Event event = Event.builder()
                .eventCode(generateEventCode())
                .name(request.getName())
                .type(request.getType())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .venue(request.getVenue())
                .venueAddress(request.getVenueAddress())
                .status(EventStatus.PLANNED)
                .registrationFee(request.getRegistrationFee())
                .registrationStartDate(request.getRegistrationStartDate())
                .registrationEndDate(request.getRegistrationEndDate())
                .maxParticipants(request.getMaxParticipants())
                .budget(request.getBudget())
                .coordinator(coordinator)
                .build();
        
        Event savedEvent = eventRepository.save(event);
        log.info("Event created: {} with code {}", savedEvent.getName(), savedEvent.getEventCode());
        
        return buildEventResponse(savedEvent);
    }
    
    @Override
    public EventResponse createEventFromProposal(Long proposalId, Long coordinatorId) {
        Proposal proposal = proposalService.getProposalEntity(proposalId);
        User coordinator = userService.getUserById(coordinatorId);
        
        Event event = Event.builder()
                .eventCode(generateEventCode())
                .name(proposal.getEventName())
                .type(proposal.getEventType())
                .description(proposal.getObjectives())
                .startDate(proposal.getStartDate())
                .endDate(proposal.getEndDate())
                .venue(proposal.getVenue())
                .status(EventStatus.PLANNED)
                .budget(proposal.getEstimatedBudget())
                .coordinator(coordinator)
                .proposal(proposal)
                .build();
        
        Event savedEvent = eventRepository.save(event);
        log.info("Event created from proposal {}: {}", proposalId, savedEvent.getEventCode());
        
        return buildEventResponse(savedEvent);
    }
    
    @Override
    public EventResponse updateEvent(Long id, EventRequest request) {
        Event event = getEventEntity(id);
        
        event.setName(request.getName());
        event.setType(request.getType());
        event.setDescription(request.getDescription());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setVenue(request.getVenue());
        event.setVenueAddress(request.getVenueAddress());
        event.setRegistrationFee(request.getRegistrationFee());
        event.setRegistrationStartDate(request.getRegistrationStartDate());
        event.setRegistrationEndDate(request.getRegistrationEndDate());
        event.setMaxParticipants(request.getMaxParticipants());
        event.setBudget(request.getBudget());
        
        Event savedEvent = eventRepository.save(event);
        log.info("Event updated: {}", savedEvent.getId());
        
        return buildEventResponse(savedEvent);
    }
    
    @Override
    @Transactional(readOnly = true)
    public EventResponse getEventById(Long id) {
        Event event = getEventEntity(id);
        return buildEventResponse(event);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll().stream()
                .filter(e -> !e.getDeleted())
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> getEventsByStatus(EventStatus status) {
        return eventRepository.findActiveByStatus(status).stream()
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> getEventsByCoordinator(Long coordinatorId) {
        return eventRepository.findActiveByCoordinator(coordinatorId).stream()
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> getUpcomingEvents() {
        return eventRepository.findUpcomingEvents(LocalDate.now()).stream()
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> getOngoingEvents() {
        return eventRepository.findOngoingEvents(LocalDate.now()).stream()
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> getOpenForRegistration() {
        return eventRepository.findOpenForRegistration(LocalDate.now()).stream()
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public EventResponse updateEventStatus(Long id, EventStatus status) {
        Event event = getEventEntity(id);
        event.setStatus(status);
        Event savedEvent = eventRepository.save(event);
        log.info("Event status updated: {} to {}", id, status);
        return buildEventResponse(savedEvent);
    }
    
    @Override
    public EventResponse openRegistration(Long id) {
        return updateEventStatus(id, EventStatus.REGISTRATION_OPEN);
    }
    
    @Override
    public EventResponse closeRegistration(Long id) {
        return updateEventStatus(id, EventStatus.REGISTRATION_CLOSED);
    }
    
    @Override
    public EventResponse startEvent(Long id) {
        return updateEventStatus(id, EventStatus.ONGOING);
    }
    
    @Override
    public EventResponse completeEvent(Long id) {
        return updateEventStatus(id, EventStatus.COMPLETED);
    }
    
    @Override
    public void assignStaff(Long eventId, EventAssignmentRequest request) {
        Event event = getEventEntity(eventId);
        User user = userService.getUserById(request.getUserId());
        
        EventAssignment assignment = EventAssignment.builder()
                .event(event)
                .user(user)
                .position(request.getPosition())
                .responsibilities(request.getResponsibilities())
                .active(true)
                .build();
        
        eventAssignmentRepository.save(assignment);
        log.info("Staff assigned to event {}: user {} as {}", eventId, request.getUserId(), request.getPosition());
    }
    
    @Override
    public void removeStaffAssignment(Long eventId, Long userId) {
        EventAssignment assignment = eventAssignmentRepository.findActiveByEventAndUser(eventId, userId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        assignment.setActive(false);
        eventAssignmentRepository.save(assignment);
        log.info("Staff assignment removed from event {}: user {}", eventId, userId);
    }
    
    @Override
    public void deleteEvent(Long id) {
        Event event = getEventEntity(id);
        event.setDeleted(true);
        eventRepository.save(event);
        log.info("Event soft deleted: {}", id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Event getEventEntity(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
    }
    
    @Override
    public String generateEventCode() {
        String prefix = "EVT";
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uuid = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return prefix + "-" + date + "-" + uuid;
    }
    
    private EventResponse buildEventResponse(Event event) {
        Long totalRegistrations = registrationRepository.countByEvent(event.getId());
        Long confirmedRegistrations = registrationRepository.countByEventAndStatus(
                event.getId(), RegistrationStatus.CONFIRMED);
        
        return dtoMapper.toEventResponse(event, totalRegistrations, confirmedRegistrations);
    }
}
