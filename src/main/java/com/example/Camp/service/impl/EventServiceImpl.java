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
import com.example.Camp.exception.BadRequestException;
import com.example.Camp.repository.DepartmentRepository;
import com.example.Camp.entity.Department;
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
    private final DepartmentRepository departmentRepository;
    private final DtoMapper dtoMapper;
    
    @Override
    public EventResponse createEvent(EventRequest request, Long coordinatorId) {
        if (request.getStartDate() == null) {
            throw new BadRequestException("Start date is required");
        }
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Event start date cannot be in the past");
        }
        if (request.getEndDate() == null) {
            throw new BadRequestException("End date is required");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Event end date cannot be before start date");
        }
        if (request.getRegistrationStartDate() != null && request.getRegistrationStartDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Registration start date cannot be in the past");
        }
        if (request.getRegistrationEndDate() != null && request.getRegistrationStartDate() != null && 
            request.getRegistrationEndDate().isBefore(request.getRegistrationStartDate())) {
            throw new BadRequestException("Registration end date cannot be before registration start date");
        }
        if (request.getMinAge() != null && request.getMaxAge() != null && request.getMinAge() > request.getMaxAge()) {
            throw new BadRequestException("Minimum age cannot be greater than maximum age");
        }
        
        User coordinator = userService.getUserById(coordinatorId);
        Department department = coordinator.getDepartment();
        
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
                .minAge(request.getMinAge())
                .maxAge(request.getMaxAge())
                .targetGender(request.getTargetGender())
                .coordinator(coordinator)
                .department(department)
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
                .department(proposal.getDepartment())
                .build();
        
        Event savedEvent = eventRepository.save(event);
        log.info("Event created from proposal {}: {}", proposalId, savedEvent.getEventCode());
        
        return buildEventResponse(savedEvent);
    }
    
    @Override
    public EventResponse updateEvent(Long id, EventRequest request) {
        Event event = getEventEntity(id);
        User currentUser = getCurrentUser();
        if (!isUserAllowedToAccessEvent(currentUser, event)) {
            throw new BadRequestException("You are not authorized to manage events for this department");
        }
        
        if (request.getStartDate() != null && request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Event end date cannot be before start date");
        }
        if (request.getMinAge() != null && request.getMaxAge() != null && request.getMinAge() > request.getMaxAge()) {
            throw new BadRequestException("Minimum age cannot be greater than maximum age");
        }
        
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
        event.setMinAge(request.getMinAge());
        event.setMaxAge(request.getMaxAge());
        event.setTargetGender(request.getTargetGender());
        
        Event savedEvent = eventRepository.save(event);
        log.info("Event updated: {}", savedEvent.getId());
        
        return buildEventResponse(savedEvent);
    }
    
    @Override
    @Transactional
    public EventResponse getEventById(Long id) {
        Event event = getEventEntity(id);
        User currentUser = getCurrentUser();
        if (!isUserAllowedToAccessEvent(currentUser, event)) {
            throw new BadRequestException("Event is closed and no longer available");
        }
        return buildEventResponse(event);
    }
    
    @Override
    @Transactional
    public List<EventResponse> getAllEvents() {
        User currentUser = getCurrentUser();
        return eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .map(this::autoUpdateEventStatus)
                .filter(e -> isUserAllowedToAccessEvent(currentUser, e))
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public List<EventResponse> getEventsByStatus(EventStatus status) {
        LocalDate today = LocalDate.now();
        return eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .map(this::autoUpdateEventStatus)
                .filter(e -> e.getStatus() == status)
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public List<EventResponse> getEventsByCoordinator(Long coordinatorId) {
        User currentUser = getCurrentUser();
        User coordinator = userService.getUserById(coordinatorId);
        
        if (coordinator.getPosition() == com.example.Camp.enums.Position.DEPARTMENT_LEADER || 
            coordinator.getPosition() == com.example.Camp.enums.Position.MINISTRY_LEADER) {
            Department dept = coordinator.getDepartment();
            if (dept != null) {
                return eventRepository.findAll().stream()
                        .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                        .map(this::autoUpdateEventStatus)
                        .filter(e -> (e.getDepartment() != null && e.getDepartment().getId().equals(dept.getId())) || 
                                     (e.getProposal() != null && e.getProposal().getDepartment() != null && e.getProposal().getDepartment().getId().equals(dept.getId())) ||
                                     e.getCoordinator().getId().equals(coordinatorId))
                        .map(this::buildEventResponse)
                        .collect(Collectors.toList());
            }
        }
        
        return eventRepository.findActiveByCoordinator(coordinatorId).stream()
                .map(this::autoUpdateEventStatus)
                .filter(e -> isUserAllowedToAccessEvent(currentUser, e))
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public List<EventResponse> getUpcomingEvents() {
        LocalDate today = LocalDate.now();
        return eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .map(this::autoUpdateEventStatus)
                .filter(e -> e.getStartDate() != null && e.getStartDate().isAfter(today) && e.getStatus() != EventStatus.CANCELLED)
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public List<EventResponse> getOngoingEvents() {
        LocalDate today = LocalDate.now();
        return eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .map(this::autoUpdateEventStatus)
                .filter(e -> e.getStatus() == EventStatus.ONGOING || 
                             (e.getStartDate() != null && !today.isBefore(e.getStartDate()) && 
                              e.getEndDate() != null && !today.isAfter(e.getEndDate()) && e.getStatus() != EventStatus.CANCELLED))
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public List<EventResponse> getOpenForRegistration() {
        LocalDate today = LocalDate.now();
        return eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .map(this::autoUpdateEventStatus)
                .filter(e -> e.getStatus() == EventStatus.REGISTRATION_OPEN &&
                             (e.getEndDate() == null || !e.getEndDate().isBefore(today)) &&
                             (e.getRegistrationEndDate() == null || !e.getRegistrationEndDate().isBefore(today)))
                .map(this::buildEventResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public EventResponse updateEventStatus(Long id, EventStatus status) {
        Event event = getEventEntity(id);
        User currentUser = getCurrentUser();
        if (!isUserAllowedToAccessEvent(currentUser, event)) {
            throw new BadRequestException("You are not authorized to manage events for this department");
        }
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
        User currentUser = getCurrentUser();
        if (!isUserAllowedToAccessEvent(currentUser, event)) {
            throw new BadRequestException("You are not authorized to manage events for this department");
        }
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
        User currentUser = getCurrentUser();
        if (!isUserAllowedToAccessEvent(currentUser, assignment.getEvent())) {
            throw new BadRequestException("You are not authorized to manage events for this department");
        }
        assignment.setActive(false);
        eventAssignmentRepository.save(assignment);
        log.info("Staff assignment removed from event {}: user {}", eventId, userId);
    }
    
    @Override
    public void deleteEvent(Long id) {
        Event event = getEventEntity(id);
        User currentUser = getCurrentUser();
        if (!isUserAllowedToAccessEvent(currentUser, event)) {
            throw new BadRequestException("You are not authorized to manage events for this department");
        }
        event.setDeleted(true);
        eventRepository.save(event);
        log.info("Event soft deleted: {}", id);
    }
    
    @Override
    @Transactional
    public Event getEventEntity(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
        return autoUpdateEventStatus(event);
    }
    
    /**
     * Automatically evaluates and updates event status based on current date:
     * 1. If event endDate is before today -> COMPLETED
     * 2. If event registrationEndDate is before today and status is REGISTRATION_OPEN -> REGISTRATION_CLOSED
     * 3. If today is between startDate and endDate, and status was PLANNED/REGISTRATION_CLOSED -> ONGOING
     */
    public Event autoUpdateEventStatus(Event event) {
        if (event == null || Boolean.TRUE.equals(event.getDeleted()) || event.getStatus() == EventStatus.CANCELLED) {
            return event;
        }

        LocalDate today = LocalDate.now();
        boolean modified = false;

        // 1. If event ending date has passed, the event is automatically COMPLETED / CLOSED
        if (event.getEndDate() != null && event.getEndDate().isBefore(today)) {
            if (event.getStatus() != EventStatus.COMPLETED) {
                event.setStatus(EventStatus.COMPLETED);
                modified = true;
                log.info("Auto-closing event {} because endDate {} has passed. Set status to COMPLETED.", event.getId(), event.getEndDate());
            }
        } 
        // 2. If registration deadline has passed, registration is closed
        else if (event.getRegistrationEndDate() != null && event.getRegistrationEndDate().isBefore(today)) {
            if (event.getStatus() == EventStatus.REGISTRATION_OPEN) {
                event.setStatus(EventStatus.REGISTRATION_CLOSED);
                modified = true;
                log.info("Auto-closing registration for event {} because registration deadline {} has passed.", event.getId(), event.getRegistrationEndDate());
            }
        }
        // 3. If currently happening within active event dates
        else if (event.getStartDate() != null && !today.isBefore(event.getStartDate()) && 
                 event.getEndDate() != null && !today.isAfter(event.getEndDate())) {
            if (event.getStatus() == EventStatus.REGISTRATION_CLOSED || event.getStatus() == EventStatus.PLANNED) {
                event.setStatus(EventStatus.ONGOING);
                modified = true;
                log.info("Auto-marking event {} as ONGOING as today is within event date range.", event.getId());
            }
        }

        if (modified) {
            try {
                return eventRepository.save(event);
            } catch (Exception e) {
                log.warn("Could not persist auto-updated event status: {}", e.getMessage());
            }
        }
        return event;
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

    private User getCurrentUser() {
        org.springframework.security.core.Authentication authentication = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || 
                "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.example.Camp.security.UserDetailsImpl) {
            return userService.getUserById(((com.example.Camp.security.UserDetailsImpl) principal).getId());
        }
        return null;
    }

    private boolean isUserAllowedToAccessEvent(User user, Event event) {
        if (event == null || Boolean.TRUE.equals(event.getDeleted())) {
            return false;
        }

        // Administrators and Union Leaders have full oversight of all events
        if (user != null && (user.getRole() == com.example.Camp.enums.Role.ADMINISTRATOR || 
            user.getPosition() == com.example.Camp.enums.Position.UNION_ADMINISTRATOR || 
            user.getPosition() == com.example.Camp.enums.Position.UNION_LEADER ||
            user.getPosition() == com.example.Camp.enums.Position.FIELD_LEADER)) {
            return true;
        }

        // Department/Ministry leaders can access events for their department
        if (user != null && (user.getPosition() == com.example.Camp.enums.Position.DEPARTMENT_LEADER || 
            user.getPosition() == com.example.Camp.enums.Position.MINISTRY_LEADER)) {
            Department userDept = user.getDepartment();
            if (userDept == null) {
                return false;
            }
            Department eventDept = event.getDepartment();
            if (eventDept == null && event.getProposal() != null) {
                eventDept = event.getProposal().getDepartment();
            }
            return eventDept != null && eventDept.getId().equals(userDept.getId());
        }

        // Event coordinators can access their own events
        if (user != null && event.getCoordinator() != null && event.getCoordinator().getId().equals(user.getId())) {
            return true;
        }

        // For PARTICIPANT (or general members browsing):
        // Rule: Can see available events only (upcoming or ongoing, not draft),
        // EXCEPT if they have registered for that past event, in which case they can continue seeing it!
        boolean isPast = event.getStatus() == EventStatus.COMPLETED || 
                (event.getEndDate() != null && event.getEndDate().isBefore(LocalDate.now()));

        if (isPast) {
            if (user != null) {
                // If registered, participant can still see it
                return registrationRepository.findByEventAndParticipant(event.getId(), user.getId()).isPresent();
            }
            return false; // Unregistered users/public cannot see past closed events in available lists
        }

        // For upcoming/ongoing events, participants cannot see DRAFT events
        if (event.getStatus() == EventStatus.DRAFT) {
            return false;
        }

        return true;
    }
}
