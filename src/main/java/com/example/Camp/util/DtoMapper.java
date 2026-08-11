package com.example.Camp.util;

import com.example.Camp.dto.event.EventResponse;
import com.example.Camp.dto.notification.NotificationResponse;
import com.example.Camp.dto.payment.PaymentResponse;
import com.example.Camp.dto.proposal.ProposalResponse;
import com.example.Camp.dto.registration.RegistrationResponse;
import com.example.Camp.dto.session.SessionResponse;
import com.example.Camp.dto.user.UserResponse;
import com.example.Camp.entity.*;
import org.springframework.stereotype.Component;

@Component
public class DtoMapper {
    
    public UserResponse toUserResponse(User user) {
        if (user == null) return null;
        
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .position(user.getPosition())
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth())
                .organizationUnitId(user.getOrganizationUnit().getId())
                .organizationUnitName(user.getOrganizationUnit().getName())
                .active(user.getActive())
                .profileImageUrl(user.getProfileImageUrl())
                .preferredLanguage(user.getPreferredLanguage() != null ? user.getPreferredLanguage() : "en")
                .build();
    }
    
    public ProposalResponse toProposalResponse(Proposal proposal) {
        if (proposal == null) return null;
        
        return ProposalResponse.builder()
                .id(proposal.getId())
                .eventName(proposal.getEventName())
                .eventType(proposal.getEventType())
                .departmentId(proposal.getDepartment().getId())
                .departmentName(proposal.getDepartment().getName())
                .proposedById(proposal.getProposedBy().getId())
                .proposedByName(proposal.getProposedBy().getFirstName() + " " + proposal.getProposedBy().getLastName())
                .objectives(proposal.getObjectives())
                .startDate(proposal.getStartDate())
                .endDate(proposal.getEndDate())
                .venue(proposal.getVenue())
                .expectedParticipants(proposal.getExpectedParticipants())
                .estimatedBudget(proposal.getEstimatedBudget())
                .requiredResources(proposal.getRequiredResources())
                .status(proposal.getStatus())
                .scope(proposal.getScope())
                .targetOrganizationUnitId(proposal.getTargetOrganizationUnit() != null ? proposal.getTargetOrganizationUnit().getId() : null)
                .targetOrganizationUnitName(proposal.getTargetOrganizationUnit() != null ? proposal.getTargetOrganizationUnit().getName() : null)
                .deptLeaderEndorsed(proposal.getDeptLeaderEndorsed())
                .reviewComments(proposal.getReviewComments())
                .reviewedById(proposal.getReviewedBy() != null ? proposal.getReviewedBy().getId() : null)
                .reviewedByName(proposal.getReviewedBy() != null ?
                        proposal.getReviewedBy().getFirstName() + " " + proposal.getReviewedBy().getLastName() : null)
                .createdAt(proposal.getCreatedAt())
                .updatedAt(proposal.getUpdatedAt())
                .build();
    }
    
    public EventResponse toEventResponse(Event event, Long totalRegistrations, Long confirmedRegistrations) {
        if (event == null) return null;
        
        return EventResponse.builder()
                .id(event.getId())
                .eventCode(event.getEventCode())
                .name(event.getName())
                .type(event.getType())
                .description(event.getDescription())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .venue(event.getVenue())
                .venueAddress(event.getVenueAddress())
                .status(event.getStatus())
                .registrationFee(event.getRegistrationFee())
                .registrationStartDate(event.getRegistrationStartDate())
                .registrationEndDate(event.getRegistrationEndDate())
                .maxParticipants(event.getMaxParticipants())
                .budget(event.getBudget())
                .coordinatorId(event.getCoordinator().getId())
                .coordinatorName(event.getCoordinator().getFirstName() + " " + event.getCoordinator().getLastName())
                .totalRegistrations(totalRegistrations)
                .confirmedRegistrations(confirmedRegistrations)
                .build();
    }
    
    public SessionResponse toSessionResponse(Session session, Long attendanceCount) {
        if (session == null) return null;
        
        return SessionResponse.builder()
                .id(session.getId())
                .eventId(session.getEvent().getId())
                .eventName(session.getEvent().getName())
                .title(session.getTitle())
                .type(session.getType())
                .description(session.getDescription())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .venue(session.getVenue())
                .speakerId(session.getSpeaker() != null ? session.getSpeaker().getId() : null)
                .speakerName(session.getSpeaker() != null ? 
                        session.getSpeaker().getFirstName() + " " + session.getSpeaker().getLastName() : null)
                .maxAttendees(session.getMaxAttendees())
                .attendanceCount(attendanceCount)
                .build();
    }
    
    public RegistrationResponse toRegistrationResponse(Registration registration) {
        if (registration == null) return null;
        
        String roomDetails = null;
        if (!registration.getRoomAssignments().isEmpty()) {
            RoomAssignment assignment = registration.getRoomAssignments().stream()
                    .filter(RoomAssignment::getActive)
                    .findFirst()
                    .orElse(null);
            if (assignment != null) {
                Room room = assignment.getRoom();
                roomDetails = room.getAccommodation().getBuildingName() + 
                        " - Room " + room.getRoomNumber() + 
                        " - Bed " + assignment.getBedNumber();
            }
        }
        
        return RegistrationResponse.builder()
                .id(registration.getId())
                .registrationNumber(registration.getRegistrationNumber())
                .eventId(registration.getEvent().getId())
                .eventName(registration.getEvent().getName())
                .participantId(registration.getParticipant().getId())
                .participantName(registration.getParticipant().getFirstName() + " " + 
                        registration.getParticipant().getLastName())
                .participantEmail(registration.getParticipant().getEmail())
                .participantPhone(registration.getParticipant().getPhoneNumber())
                .churchName(registration.getParticipant().getOrganizationUnit().getName())
                .status(registration.getStatus())
                .specialRequirements(registration.getSpecialRequirements())
                .emergencyContactName(registration.getEmergencyContactName())
                .emergencyContactPhone(registration.getEmergencyContactPhone())
                .qrCode(registration.getQrCode())
                .checkedInAt(registration.getCheckedInAt())
                .roomDetails(roomDetails)
                .createdAt(registration.getCreatedAt())
                .build();
    }
    
    public PaymentResponse toPaymentResponse(Payment payment) {
        if (payment == null) return null;
        
        return PaymentResponse.builder()
                .id(payment.getId())
                .transactionReference(payment.getTransactionReference())
                .registrationId(payment.getRegistration().getId())
                .participantName(payment.getRegistration().getParticipant().getFirstName() + " " + 
                        payment.getRegistration().getParticipant().getLastName())
                .eventName(payment.getRegistration().getEvent().getName())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .paidAt(payment.getPaidAt())
                .verifiedById(payment.getVerifiedBy() != null ? payment.getVerifiedBy().getId() : null)
                .verifiedByName(payment.getVerifiedBy() != null ? 
                        payment.getVerifiedBy().getFirstName() + " " + payment.getVerifiedBy().getLastName() : null)
                .verifiedAt(payment.getVerifiedAt())
                .notes(payment.getNotes())
                .receiptUrl(payment.getReceiptUrl())
                .build();
    }
    
    public NotificationResponse toNotificationResponse(Notification notification) {
        if (notification == null) return null;
        
        return NotificationResponse.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipient().getId())
                .recipientName(notification.getRecipient().getFirstName() + " " + 
                        notification.getRecipient().getLastName())
                .eventId(notification.getEvent() != null ? notification.getEvent().getId() : null)
                .eventName(notification.getEvent() != null ? notification.getEvent().getName() : null)
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .readAt(notification.getReadAt())
                .actionUrl(notification.getActionUrl())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
