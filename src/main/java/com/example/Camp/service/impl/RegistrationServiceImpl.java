package com.example.Camp.service.impl;

import com.example.Camp.dto.registration.RegistrationRequest;
import com.example.Camp.dto.registration.RegistrationResponse;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.Registration;
import com.example.Camp.entity.User;
import com.example.Camp.enums.Gender;
import com.example.Camp.enums.RegistrationStatus;
import com.example.Camp.exception.BadRequestException;
import com.example.Camp.repository.RegistrationRepository;
import com.example.Camp.service.EventService;
import com.example.Camp.service.JurisdictionScopeService;
import com.example.Camp.service.RegistrationService;
import com.example.Camp.service.UserService;
import com.example.Camp.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import com.example.Camp.entity.RoomAssignment;
import com.example.Camp.enums.Position;
import com.example.Camp.enums.Role;
import com.example.Camp.service.AccommodationService;
import org.springframework.context.annotation.Lazy;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RegistrationServiceImpl implements RegistrationService {
    
    private final RegistrationRepository registrationRepository;
    private final EventService eventService;
    private final UserService userService;
    private final JurisdictionScopeService jurisdictionScopeService;
    private final DtoMapper dtoMapper;
    @Lazy
    private final AccommodationService accommodationService;
    
    @Override
    public RegistrationResponse registerParticipant(RegistrationRequest request, Long registeredById) {
        Event event = eventService.getEventEntity(request.getEventId());
        
        LocalDate today = LocalDate.now();

        // 0. Validate Event Status and Deadlines
        if (event.getStatus() == com.example.Camp.enums.EventStatus.CANCELLED) {
            throw new BadRequestException("Registration is unavailable. This event has been cancelled.");
        }
        if (event.getStatus() == com.example.Camp.enums.EventStatus.COMPLETED || 
            (event.getEndDate() != null && event.getEndDate().isBefore(today))) {
            throw new BadRequestException("Registration is closed. The event ended on " + event.getEndDate() + ".");
        }
        if (event.getStatus() == com.example.Camp.enums.EventStatus.REGISTRATION_CLOSED) {
            throw new BadRequestException("Registration for this event is currently closed.");
        }
        if (event.getRegistrationEndDate() != null && event.getRegistrationEndDate().isBefore(today)) {
            throw new BadRequestException("Registration deadline (" + event.getRegistrationEndDate() + ") has passed. New registrations are closed.");
        }
        if (event.getRegistrationStartDate() != null && event.getRegistrationStartDate().isAfter(today)) {
            throw new BadRequestException("Registration for this event has not started yet. It opens on " + event.getRegistrationStartDate() + ".");
        }
        
        Long participantId = request.getParticipantId() != null ? request.getParticipantId() : registeredById;
        if (participantId == null) {
            throw new BadRequestException("Participant information is required for registration");
        }
        
        User participant = userService.getUserById(participantId);
        User registeredBy = registeredById != null ? userService.getUserById(registeredById) : participant;
        
        // 1. Validate Age Limit
        Integer participantAge = null;
        if (participant.getDateOfBirth() != null) {
            participantAge = Period.between(participant.getDateOfBirth(), LocalDate.now()).getYears();
        }
        
        Integer minAge = event.getMinAge();
        Integer maxAge = event.getMaxAge();
        
        if (minAge == null && maxAge == null) {
            String deptName = "";
            String deptType = "";
            if (event.getDepartment() != null) {
                deptName = event.getDepartment().getName() != null ? event.getDepartment().getName().toUpperCase() : "";
                deptType = event.getDepartment().getType() != null ? event.getDepartment().getType().name() : "";
            } else if (event.getProposal() != null && event.getProposal().getDepartment() != null) {
                deptName = event.getProposal().getDepartment().getName() != null ? event.getProposal().getDepartment().getName().toUpperCase() : "";
                deptType = event.getProposal().getDepartment().getType() != null ? event.getProposal().getDepartment().getType().name() : "";
            }
            String eventName = event.getName() != null ? event.getName().toUpperCase() : "";
            String eventType = event.getType() != null ? event.getType().name() : "";

            if (deptName.contains("YOUTH") || deptType.contains("YOUTH") || eventName.contains("YOUTH") || eventType.contains("YOUTH")) {
                minAge = 15;
                maxAge = 25;
            } else if (deptName.contains("CHILD") || deptType.contains("CHILD") || deptType.contains("ADVENTURER") || deptType.contains("PATHFINDER") || eventName.contains("PATHFINDER") || eventName.contains("CHILD")) {
                minAge = 6;
                maxAge = 15;
            } else if (deptName.contains("MINISTER") || deptType.contains("MINISTERIAL") || eventName.contains("PASTOR")) {
                minAge = 21;
            }
        }

        if (participantAge != null) {
            if (minAge != null && participantAge < minAge) {
                throw new BadRequestException("Participant is " + participantAge + " years old. Minimum required age for this event is " + minAge + " years.");
            }
            if (maxAge != null && participantAge > maxAge) {
                throw new BadRequestException("Participant is " + participantAge + " years old. Maximum age limit for this event is " + maxAge + " years.");
            }
        }
        
        // 2. Validate Gender Limit
        Gender requiredGender = event.getTargetGender();
        if (requiredGender == null) {
            String deptName = "";
            String deptType = "";
            if (event.getDepartment() != null) {
                deptName = event.getDepartment().getName() != null ? event.getDepartment().getName().toUpperCase() : "";
                deptType = event.getDepartment().getType() != null ? event.getDepartment().getType().name() : "";
            } else if (event.getProposal() != null && event.getProposal().getDepartment() != null) {
                deptName = event.getProposal().getDepartment().getName() != null ? event.getProposal().getDepartment().getName().toUpperCase() : "";
                deptType = event.getProposal().getDepartment().getType() != null ? event.getProposal().getDepartment().getType().name() : "";
            }
            String eventName = event.getName() != null ? event.getName().toUpperCase() : "";

            if (deptName.contains("WOMEN") || deptName.contains("MIFEM") || deptType.contains("WOMEN") || deptType.contains("MIFEM") || eventName.contains("WOMEN") || eventName.contains("MIFEM")) {
                requiredGender = Gender.FEMALE;
            } else if (deptName.contains("MEN") || deptName.contains("AMO") || deptType.contains("MEN") || eventName.contains("MEN'S")) {
                requiredGender = Gender.MALE;
            }
        }

        if (requiredGender != null) {
            if (participant.getGender() == null) {
                throw new BadRequestException("This event is restricted to " + requiredGender.name().toLowerCase() + " participants. Please update your profile with your gender before registering.");
            }
            if (participant.getGender() != requiredGender) {
                throw new BadRequestException("This event is restricted to " + requiredGender.name().toLowerCase() + " participants only. Your registered gender is " + participant.getGender().name().toLowerCase() + ".");
            }
        }
        
        // Update participant phone number if provided and not yet set
        if ((participant.getPhoneNumber() == null || participant.getPhoneNumber().isEmpty()) && 
            request.getParticipantPhone() != null && !request.getParticipantPhone().trim().isEmpty()) {
            participant.setPhoneNumber(request.getParticipantPhone().trim());
        }
        
        // Check if already registered
        if (registrationRepository.findByEventAndParticipant(request.getEventId(), participant.getId()).isPresent()) {
            throw new BadRequestException("Participant is already registered for this event");
        }
        
        // Check event capacity
        if (event.getMaxParticipants() != null && event.getMaxParticipants() > 0) {
            Long currentCount = registrationRepository.countByEvent(event.getId());
            if (currentCount != null && currentCount >= event.getMaxParticipants()) {
                throw new BadRequestException("This event has reached its maximum participant capacity (" + event.getMaxParticipants() + ")");
            }
        }
        
        // Determine status: free events are immediately confirmed with QR code
        boolean isFree = event.getRegistrationFee() == null || 
                         event.getRegistrationFee().compareTo(BigDecimal.ZERO) == 0;
        
        RegistrationStatus initialStatus = isFree ? RegistrationStatus.CONFIRMED : RegistrationStatus.PENDING;
        String regNumber = generateRegistrationNumber();
        
        Registration registration = Registration.builder()
                .registrationNumber(regNumber)
                .event(event)
                .participant(participant)
                .registeredBy(registeredBy)
                .status(initialStatus)
                .specialRequirements(request.getSpecialRequirements())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .build();
        
        if (isFree) {
            registration.setQrCode("REG-" + regNumber + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        
        Registration savedRegistration = registrationRepository.save(registration);
        log.info("Registration created: {} (Status: {}) for event {} by user {}", 
                savedRegistration.getRegistrationNumber(), initialStatus, event.getId(), registeredById);

        // Auto-assign to room and bed if accommodation exists for this event
        try {
            RoomAssignment autoAssignment = accommodationService.autoAssignParticipant(savedRegistration);
            if (autoAssignment != null) {
                if (savedRegistration.getRoomAssignments() == null) {
                    savedRegistration.setRoomAssignments(new ArrayList<>());
                }
                savedRegistration.getRoomAssignments().add(autoAssignment);
            }
        } catch (Exception e) {
            log.warn("Auto-assignment skipped or failed for registration {}: {}", 
                    savedRegistration.getId(), e.getMessage());
        }
        
        return dtoMapper.toRegistrationResponse(savedRegistration);
    }
    
    @Override
    @Transactional(readOnly = true)
    public RegistrationResponse getRegistrationById(Long id) {
        return getRegistrationById(id, null);
    }

    @Override
    @Transactional(readOnly = true)
    public RegistrationResponse getRegistrationById(Long id, Long currentUserId) {
        Registration registration = getRegistrationEntity(id);
        if (currentUserId != null) {
            User currentUser = userService.getUserById(currentUserId);
            jurisdictionScopeService.validateRegistrationAccess(currentUser, registration);
        }
        return dtoMapper.toRegistrationResponse(registration);
    }
    
    @Override
    @Transactional(readOnly = true)
    public RegistrationResponse getRegistrationByNumber(String registrationNumber) {
        Registration registration = registrationRepository.findByRegistrationNumber(registrationNumber)
                .orElseThrow(() -> new RuntimeException("Registration not found with number: " + registrationNumber));
        return dtoMapper.toRegistrationResponse(registration);
    }
    
    @Override
    @Transactional(readOnly = true)
    public RegistrationResponse getRegistrationByQrCode(String qrCode) {
        Registration registration = registrationRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("Registration not found with QR code: " + qrCode));
        return dtoMapper.toRegistrationResponse(registration);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getRegistrationsByEvent(Long eventId) {
        return getRegistrationsByEvent(eventId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getRegistrationsByEvent(Long eventId, Long currentUserId) {
        if (currentUserId == null) {
            return registrationRepository.findActiveByEvent(eventId).stream()
                    .map(dtoMapper::toRegistrationResponse)
                    .collect(Collectors.toList());
        }

        User user = userService.getUserById(currentUserId);
        if (jurisdictionScopeService.isUnionWideScope(user) || 
            user.getRole() == Role.ADMINISTRATOR || 
            user.getPosition() == Position.ACCOMMODATION_OFFICER) {
            return registrationRepository.findActiveByEvent(eventId).stream()
                    .map(dtoMapper::toRegistrationResponse)
                    .collect(Collectors.toList());
        }

        Event event = eventService.getEventEntity(eventId);
        if (event != null && event.getCoordinator() != null && event.getCoordinator().getId().equals(user.getId())) {
            return registrationRepository.findActiveByEvent(eventId).stream()
                    .map(dtoMapper::toRegistrationResponse)
                    .collect(Collectors.toList());
        }

        List<Long> orgUnitIds = jurisdictionScopeService.getAccessibleOrganizationUnitIds(user);
        if (orgUnitIds.isEmpty()) {
            return registrationRepository.findByEventAndParticipant(eventId, currentUserId)
                    .map(dtoMapper::toRegistrationResponse)
                    .map(List::of)
                    .orElse(Collections.emptyList());
        }

        return registrationRepository.findActiveByEventAndOrgUnitIdsOrRegisteredBy(eventId, orgUnitIds, currentUserId).stream()
                .map(dtoMapper::toRegistrationResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getRegistrationsByParticipant(Long participantId) {
        return registrationRepository.findActiveByParticipant(participantId).stream()
                .map(dtoMapper::toRegistrationResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getRegistrationsByStatus(Long eventId, RegistrationStatus status) {
        return getRegistrationsByStatus(eventId, status, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getRegistrationsByStatus(Long eventId, RegistrationStatus status, Long currentUserId) {
        if (currentUserId == null) {
            return registrationRepository.findActiveByEventAndStatus(eventId, status).stream()
                    .map(dtoMapper::toRegistrationResponse)
                    .collect(Collectors.toList());
        }

        User user = userService.getUserById(currentUserId);
        if (jurisdictionScopeService.isUnionWideScope(user)) {
            return registrationRepository.findActiveByEventAndStatus(eventId, status).stream()
                    .map(dtoMapper::toRegistrationResponse)
                    .collect(Collectors.toList());
        }

        List<Long> orgUnitIds = jurisdictionScopeService.getAccessibleOrganizationUnitIds(user);
        if (orgUnitIds.isEmpty()) {
            return Collections.emptyList();
        }

        return registrationRepository.findActiveByEventStatusAndOrgUnitIdsOrRegisteredBy(eventId, status, orgUnitIds, currentUserId).stream()
                .map(dtoMapper::toRegistrationResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public RegistrationResponse updateRegistrationStatus(Long id, RegistrationStatus status) {
        return updateRegistrationStatus(id, status, null);
    }

    @Override
    public RegistrationResponse updateRegistrationStatus(Long id, RegistrationStatus status, Long currentUserId) {
        Registration registration = getRegistrationEntity(id);
        if (currentUserId != null) {
            User user = userService.getUserById(currentUserId);
            jurisdictionScopeService.validateRegistrationAccess(user, registration);
        }
        registration.setStatus(status);
        Registration savedRegistration = registrationRepository.save(registration);
        log.info("Registration status updated: {} to {} by user {}", id, status, currentUserId);
        return dtoMapper.toRegistrationResponse(savedRegistration);
    }
    
    @Override
    public RegistrationResponse confirmRegistration(Long id) {
        return confirmRegistration(id, null);
    }

    @Override
    public RegistrationResponse confirmRegistration(Long id, Long currentUserId) {
        Registration registration = getRegistrationEntity(id);
        if (currentUserId != null) {
            User user = userService.getUserById(currentUserId);
            jurisdictionScopeService.validateRegistrationAccess(user, registration);
        }
        registration.setStatus(RegistrationStatus.CONFIRMED);
        
        // Generate QR code if not already generated
        if (registration.getQrCode() == null || registration.getQrCode().isEmpty()) {
            String qrCode = generateQrCode(id);
            registration.setQrCode(qrCode);
        }
        
        Registration savedRegistration = registrationRepository.save(registration);
        log.info("Registration confirmed: {} by user {}", id, currentUserId);

        // Auto-assign room if not yet assigned
        try {
            RoomAssignment autoAssignment = accommodationService.autoAssignParticipant(savedRegistration);
            if (autoAssignment != null) {
                if (savedRegistration.getRoomAssignments() == null) {
                    savedRegistration.setRoomAssignments(new ArrayList<>());
                }
                savedRegistration.getRoomAssignments().add(autoAssignment);
            }
        } catch (Exception e) {
            log.warn("Auto-assignment on confirm skipped for registration {}: {}", 
                    savedRegistration.getId(), e.getMessage());
        }

        return dtoMapper.toRegistrationResponse(savedRegistration);
    }
    
    @Override
    public RegistrationResponse cancelRegistration(Long id) {
        return cancelRegistration(id, null);
    }

    @Override
    public RegistrationResponse cancelRegistration(Long id, Long currentUserId) {
        return updateRegistrationStatus(id, RegistrationStatus.CANCELLED, currentUserId);
    }
    
    @Override
    public RegistrationResponse cancelOwnRegistration(Long id, Long currentUserId) {
        Registration registration = getRegistrationEntity(id);
        
        // Verify that the participant is cancelling their own registration
        if (!registration.getParticipant().getId().equals(currentUserId)) {
            throw new BadRequestException("You can only cancel your own registrations");
        }
        
        // Check if registration can be cancelled
        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new BadRequestException("Registration is already cancelled");
        }
        
        if (registration.getStatus() == RegistrationStatus.CHECKED_IN) {
            throw new BadRequestException("Cannot cancel registration after check-in");
        }
        
        if (registration.getStatus() == RegistrationStatus.CHECKED_OUT) {
            throw new BadRequestException("Cannot cancel completed registration");
        }
        
        // Check if event has already started or passed
        Event event = registration.getEvent();
        LocalDate today = LocalDate.now();
        if (event != null && event.getStartDate() != null && event.getStartDate().isBefore(today)) {
            throw new BadRequestException("Cannot cancel registration after event has started");
        }
        
        // Cancel the registration
        registration.setStatus(RegistrationStatus.CANCELLED);
        Registration savedRegistration = registrationRepository.save(registration);
        log.info("Registration {} cancelled by participant {}", id, currentUserId);
        
        // Handle payment refund if payment exists and was verified
        handlePaymentRefundForCancellation(savedRegistration);
        
        return dtoMapper.toRegistrationResponse(savedRegistration);
    }
    
    /**
     * Handle payment refund when registration is cancelled
     * - If payment was VERIFIED, mark it as REFUNDED and notify coordinator
     * - If payment was PENDING or REJECTED, just mark registration as cancelled
     */
    private void handlePaymentRefundForCancellation(Registration registration) {
        try {
            List<Payment> payments = paymentRepository.findActiveByRegistration(registration.getId());
            
            for (Payment payment : payments) {
                if (payment.getStatus() == PaymentStatus.VERIFIED) {
                    // Mark payment as REFUNDED
                    payment.setStatus(PaymentStatus.REFUNDED);
                    payment.setNotes("Registration cancelled by participant. Refund required for " + 
                                   payment.getAmount() + " " + 
                                   (payment.getPaymentMethod() != null ? payment.getPaymentMethod() : ""));
                    paymentRepository.save(payment);
                    
                    log.warn("Payment {} marked as REFUNDED for cancelled registration {}. Amount: {}", 
                            payment.getId(), registration.getId(), payment.getAmount());
                    
                    // Notify coordinator and finance officer about refund needed
                    notifyRefundRequired(registration, payment);
                } else if (payment.getStatus() == PaymentStatus.PENDING) {
                    // Just reject pending payment since it wasn't verified yet
                    payment.setStatus(PaymentStatus.REJECTED);
                    payment.setNotes("Registration cancelled before payment verification");
                    paymentRepository.save(payment);
                    log.info("Pending payment {} rejected for cancelled registration {}", 
                            payment.getId(), registration.getId());
                }
            }
        } catch (Exception e) {
            log.error("Error handling payment refund for registration {}: {}", 
                     registration.getId(), e.getMessage(), e);
        }
    }
    
    /**
     * Notify coordinator and finance officer that refund is required
     */
    private void notifyRefundRequired(Registration registration, Payment payment) {
        try {
            Event event = registration.getEvent();
            User participant = registration.getParticipant();
            
            String message = String.format(
                "REFUND REQUIRED: %s %s cancelled registration for '%s'. " +
                "Payment of %s (Ref: %s) needs to be refunded. " +
                "Contact participant at %s or %s",
                participant.getFirstName(),
                participant.getLastName(),
                event != null ? event.getTitle() : "event",
                payment.getAmount(),
                payment.getTransactionReference(),
                participant.getEmail(),
                participant.getPhoneNumber() != null ? participant.getPhoneNumber() : "N/A"
            );
            
            // Notify event coordinator
            if (event != null && event.getCoordinator() != null) {
                notificationService.createNotification(
                    event.getCoordinator().getId(),
                    "Refund Required",
                    message,
                    "/app/payments?registration=" + registration.getId()
                );
            }
            
            // Notify finance officers (Union Finance Officer and Field Finance Officers)
            notificationService.notifyByPosition(
                com.example.Camp.enums.Position.FINANCE_OFFICER,
                "Refund Required",
                message,
                "/app/payments?registration=" + registration.getId()
            );
            
            log.info("Refund notifications sent for registration {} and payment {}", 
                    registration.getId(), payment.getId());
        } catch (Exception e) {
            log.error("Error sending refund notifications for registration {}: {}", 
                     registration.getId(), e.getMessage(), e);
        }
    }
    
    @Override
    public RegistrationResponse checkIn(Long id) {
        return checkIn(id, null);
    }

    @Override
    public RegistrationResponse checkIn(Long id, Long currentUserId) {
        Registration registration = getRegistrationEntity(id);
        if (currentUserId != null) {
            User user = userService.getUserById(currentUserId);
            jurisdictionScopeService.validateRegistrationAccess(user, registration);
        }

        Event event = registration.getEvent();
        LocalDate today = LocalDate.now();
        if (event != null) {
            if (event.getStatus() == com.example.Camp.enums.EventStatus.CANCELLED) {
                throw new BadRequestException("Cannot check in: this event has been cancelled.");
            }
            if (event.getStatus() == com.example.Camp.enums.EventStatus.COMPLETED || 
                (event.getEndDate() != null && event.getEndDate().isBefore(today))) {
                throw new BadRequestException("Cannot check in: this event concluded on " + event.getEndDate() + ". Check-in is closed.");
            }
        }

        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new BadRequestException("Cannot check in: registration is cancelled.");
        }
        if (registration.getStatus() == RegistrationStatus.CHECKED_IN) {
            throw new BadRequestException("Participant is already checked in.");
        }
        if (registration.getStatus() == RegistrationStatus.CHECKED_OUT) {
            throw new BadRequestException("Participant has already checked out.");
        }

        registration.setStatus(RegistrationStatus.CHECKED_IN);
        registration.setCheckedInAt(LocalDateTime.now());
        Registration savedRegistration = registrationRepository.save(registration);
        log.info("Participant checked in: {} by user {}", id, currentUserId);
        return dtoMapper.toRegistrationResponse(savedRegistration);
    }
    
    @Override
    public RegistrationResponse checkInByQrCode(String qrCode) {
        Registration registration = registrationRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("Registration not found with QR code: " + qrCode));
        return checkIn(registration.getId());
    }

    @Override
    public RegistrationResponse checkOut(Long id) {
        return checkOut(id, null);
    }

    @Override
    public RegistrationResponse checkOut(Long id, Long currentUserId) {
        Registration registration = getRegistrationEntity(id);
        if (currentUserId != null) {
            User user = userService.getUserById(currentUserId);
            jurisdictionScopeService.validateRegistrationAccess(user, registration);
        }

        Event event = registration.getEvent();
        LocalDate today = LocalDate.now();
        if (event != null) {
            if (event.getStatus() == com.example.Camp.enums.EventStatus.CANCELLED) {
                throw new BadRequestException("Cannot check out: this event has been cancelled.");
            }
            if (event.getStatus() == com.example.Camp.enums.EventStatus.COMPLETED || 
                (event.getEndDate() != null && event.getEndDate().isBefore(today))) {
                throw new BadRequestException("Cannot check out: this event concluded on " + event.getEndDate() + ".");
            }
        }

        if (registration.getStatus() != RegistrationStatus.CHECKED_IN) {
            throw new BadRequestException("Participant must be checked in before checking out (Current status: " + registration.getStatus() + ").");
        }

        registration.setStatus(RegistrationStatus.CHECKED_OUT);
        registration.setCheckedOutAt(LocalDateTime.now());
        Registration savedRegistration = registrationRepository.save(registration);
        log.info("Participant checked out: {} by user {}", id, currentUserId);
        return dtoMapper.toRegistrationResponse(savedRegistration);
    }
    
    @Override
    public String generateQrCode(Long registrationId) {
        Registration registration = getRegistrationEntity(registrationId);
        String qrCode = "REG-" + registration.getRegistrationNumber() + "-" + 
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        registration.setQrCode(qrCode);
        registrationRepository.save(registration);
        log.info("QR code generated for registration: {}", registrationId);
        return qrCode;
    }
    
    @Override
    public void deleteRegistration(Long id) {
        Registration registration = getRegistrationEntity(id);
        registration.setDeleted(true);
        registrationRepository.save(registration);
        log.info("Registration soft deleted: {}", id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getAllRegistrations() {
        return getAllRegistrations(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getAllRegistrations(Long currentUserId) {
        if (currentUserId == null) {
            return registrationRepository.findAllActive().stream()
                    .map(dtoMapper::toRegistrationResponse)
                    .collect(Collectors.toList());
        }

        User user = userService.getUserById(currentUserId);
        
        // 1. Union-wide scope (Union Admins, Union President, Union Leaders)
        if (jurisdictionScopeService.isUnionWideScope(user)) {
            log.debug("User {} has Union-wide scope. Fetching all active registrations across RUM.", user.getEmail());
            return registrationRepository.findAllActive().stream()
                    .map(dtoMapper::toRegistrationResponse)
                    .collect(Collectors.toList());
        }

        // 2. Field, District, or Church-scoped coordinators & pastors
        List<Long> orgUnitIds = jurisdictionScopeService.getAccessibleOrganizationUnitIds(user);
        if (!orgUnitIds.isEmpty()) {
            log.debug("User {} scoped to {} org units. Fetching jurisdiction-scoped registrations.", user.getEmail(), orgUnitIds.size());
            return registrationRepository.findActiveByOrgUnitIdsOrRegisteredBy(orgUnitIds, currentUserId).stream()
                    .map(dtoMapper::toRegistrationResponse)
                    .collect(Collectors.toList());
        }

        // 3. Participant: fallback to self registrations
        return registrationRepository.findActiveByParticipant(currentUserId).stream()
                .map(dtoMapper::toRegistrationResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getMyRegistrations(Long userId) {
        return registrationRepository.findActiveByParticipant(userId).stream()
                .map(dtoMapper::toRegistrationResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Registration getRegistrationEntity(Long id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registration not found with id: " + id));
    }
    
    @Override
    public String generateRegistrationNumber() {
        String prefix = "RG";
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%04d", (int)(Math.random() * 10000));
        return prefix + timestamp + random;
    }
}
