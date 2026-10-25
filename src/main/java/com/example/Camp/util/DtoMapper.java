package com.example.Camp.util;

import com.example.Camp.dto.event.EventResponse;
import com.example.Camp.dto.notification.NotificationResponse;
import com.example.Camp.dto.payment.PaymentResponse;
import com.example.Camp.dto.proposal.ProposalResponse;
import com.example.Camp.dto.proposal.ProposalReviewResponse;
import com.example.Camp.dto.registration.RegistrationResponse;
import com.example.Camp.dto.session.SessionResponse;
import com.example.Camp.dto.user.UserResponse;
import com.example.Camp.entity.*;
import com.example.Camp.enums.*;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

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
                .organizationUnitId(user.getOrganizationUnit() != null ? user.getOrganizationUnit().getId() : null)
                .organizationUnitName(user.getOrganizationUnit() != null ? user.getOrganizationUnit().getName() : null)
                .organizationLevel(user.getOrganizationUnit() != null ? user.getOrganizationUnit().getLevel() : null)
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .governmentDistrict(user.getGovernmentDistrict())
                .sdaDistrict(user.getSdaDistrict())
                .active(user.getActive())
                .profileImageUrl(user.getProfileImageUrl())
                .preferredLanguage(user.getPreferredLanguage() != null ? user.getPreferredLanguage() : "en")
                .build();
    }
    
    public ProposalResponse toProposalResponse(Proposal proposal) {
        if (proposal == null) return null;
        
        String proposedByName = null;
        if (proposal.getProposedBy() != null) {
            String first = proposal.getProposedBy().getFirstName() != null ? proposal.getProposedBy().getFirstName().trim() : "";
            String last = proposal.getProposedBy().getLastName() != null ? proposal.getProposedBy().getLastName().trim() : "";
            proposedByName = (first + " " + last).trim();
            if (proposedByName.isEmpty()) {
                proposedByName = proposal.getProposedBy().getEmail();
            }
        }
        if (proposedByName == null || proposedByName.isEmpty()) {
            proposedByName = "District / Field Organizer";
        }

        String departmentName = (proposal.getDepartment() != null && proposal.getDepartment().getName() != null)
                ? proposal.getDepartment().getName()
                : "General Ministries";

        String targetOrgUnitName = (proposal.getTargetOrganizationUnit() != null && proposal.getTargetOrganizationUnit().getName() != null)
                ? proposal.getTargetOrganizationUnit().getName()
                : (proposal.getScope() == ProposalScope.UNION ? "Rwanda Union Mission (RUM)" : "Local Field / District");

        return ProposalResponse.builder()
                .id(proposal.getId())
                .eventName(proposal.getEventName())
                .eventType(proposal.getEventType())
                .departmentId(proposal.getDepartment() != null ? proposal.getDepartment().getId() : null)
                .departmentName(departmentName)
                .proposedById(proposal.getProposedBy() != null ? proposal.getProposedBy().getId() : null)
                .proposedByName(proposedByName)
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
                .targetOrganizationUnitName(targetOrgUnitName)
                .deptLeaderEndorsed(proposal.getDeptLeaderEndorsed())
                .reviewComments(proposal.getReviewComments())
                .reviewedById(proposal.getReviewedBy() != null ? proposal.getReviewedBy().getId() : null)
                .reviewedByName(proposal.getReviewedBy() != null ?
                        (proposal.getReviewedBy().getFirstName() + " " + proposal.getReviewedBy().getLastName()).trim() : null)
                // Level 1 Leader Review
                .leaderReviewedById(proposal.getLeaderReviewedBy() != null ? proposal.getLeaderReviewedBy().getId() : null)
                .leaderReviewedByName(proposal.getLeaderReviewedBy() != null ?
                        proposal.getLeaderReviewedBy().getFirstName() + " " + proposal.getLeaderReviewedBy().getLastName() : null)
                .leaderReviewComments(proposal.getLeaderReviewComments())
                .leaderReviewedAt(proposal.getLeaderReviewedAt())
                // Level 2 Admin Final Approval
                .adminApprovedById(proposal.getAdminApprovedBy() != null ? proposal.getAdminApprovedBy().getId() : null)
                .adminApprovedByName(proposal.getAdminApprovedBy() != null ?
                        proposal.getAdminApprovedBy().getFirstName() + " " + proposal.getAdminApprovedBy().getLastName() : null)
                .adminReviewComments(proposal.getAdminReviewComments())
                .adminApprovedAt(proposal.getAdminApprovedAt())
                // Event Link
                .createdEventId(proposal.getEvent() != null ? proposal.getEvent().getId() : null)
                .createdEventCode(proposal.getEvent() != null ? proposal.getEvent().getEventCode() : null)
                // Review History
                .reviewHistory(proposal.getReviews() != null ?
                        proposal.getReviews().stream().map(this::toProposalReviewResponse).collect(Collectors.toList()) : null)
                .createdAt(proposal.getCreatedAt())
                .updatedAt(proposal.getUpdatedAt())
                .build();
    }

    public ProposalReviewResponse toProposalReviewResponse(ProposalReview review) {
        if (review == null) return null;

        return ProposalReviewResponse.builder()
                .id(review.getId())
                .reviewerId(review.getReviewer() != null ? review.getReviewer().getId() : null)
                .reviewerName(review.getReviewer() != null ?
                        review.getReviewer().getFirstName() + " " + review.getReviewer().getLastName() : null)
                .reviewerRole(review.getReviewer() != null && review.getReviewer().getRole() != null ?
                        review.getReviewer().getRole().name() : null)
                .reviewerPosition(review.getReviewer() != null && review.getReviewer().getPosition() != null ?
                        review.getReviewer().getPosition().name() : null)
                .decision(review.getDecision())
                .reviewStage(review.getReviewStage())
                .comments(review.getComments())
                .createdAt(review.getCreatedAt())
                .build();
    }
    
    public EventResponse toEventResponse(Event event, Long totalRegistrations, Long confirmedRegistrations) {
        if (event == null) return null;
        
        com.example.Camp.dto.department.DepartmentResponse deptResponse = null;
        if (event.getDepartment() != null) {
            deptResponse = com.example.Camp.dto.department.DepartmentResponse.builder()
                    .id(event.getDepartment().getId())
                    .name(event.getDepartment().getName())
                    .type(event.getDepartment().getType())
                    .build();
        } else if (event.getProposal() != null && event.getProposal().getDepartment() != null) {
            deptResponse = com.example.Camp.dto.department.DepartmentResponse.builder()
                    .id(event.getProposal().getDepartment().getId())
                    .name(event.getProposal().getDepartment().getName())
                    .type(event.getProposal().getDepartment().getType())
                    .build();
        }

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
                .department(deptResponse)
                .coordinatorId(event.getCoordinator().getId())
                .coordinatorName(event.getCoordinator().getFirstName() + " " + event.getCoordinator().getLastName())
                .totalRegistrations(totalRegistrations)
                .confirmedRegistrations(confirmedRegistrations)
                .minAge(event.getMinAge())
                .maxAge(event.getMaxAge())
                .targetGender(event.getTargetGender())
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
        if (registration.getRoomAssignments() != null && !registration.getRoomAssignments().isEmpty()) {
            RoomAssignment assignment = registration.getRoomAssignments().stream()
                    .filter(RoomAssignment::getActive)
                    .findFirst()
                    .orElse(null);
            if (assignment != null && assignment.getRoom() != null) {
                Room room = assignment.getRoom();
                String building = room.getAccommodation() != null ? room.getAccommodation().getBuildingName() : "Main";
                roomDetails = building + " - Room " + room.getRoomNumber() + " - Bed " + assignment.getBedNumber();
            }
        }
        
        PaymentResponse latestPayment = null;
        if (registration.getPayments() != null && !registration.getPayments().isEmpty()) {
            latestPayment = registration.getPayments().stream()
                    .filter(p -> p != null && !p.getDeleted())
                    .reduce((first, second) -> second)
                    .map(this::toPaymentResponse)
                    .orElse(null);
        }

        Event event = registration.getEvent();
        User participant = registration.getParticipant();
        String church = (participant != null && participant.getOrganizationUnit() != null) 
                ? participant.getOrganizationUnit().getName() 
                : "N/A";
        
        return RegistrationResponse.builder()
                .id(registration.getId())
                .registrationNumber(registration.getRegistrationNumber())
                .eventId(event != null ? event.getId() : null)
                .eventName(event != null ? event.getName() : null)
                .eventStartDate(event != null ? event.getStartDate() : null)
                .eventEndDate(event != null ? event.getEndDate() : null)
                .eventVenue(event != null ? event.getVenue() : null)
                .eventRegistrationFee(event != null ? event.getRegistrationFee() : null)
                .event(event != null ? toEventResponse(event, null, null) : null)
                .participantId(participant != null ? participant.getId() : null)
                .participantName(participant != null ? (participant.getFirstName() + " " + participant.getLastName()) : null)
                .participantFirstName(participant != null ? participant.getFirstName() : null)
                .participantLastName(participant != null ? participant.getLastName() : null)
                .participantEmail(participant != null ? participant.getEmail() : null)
                .participantPhone(participant != null ? participant.getPhoneNumber() : null)
                .participantGender(participant != null ? participant.getGender() : null)
                .gender(participant != null && participant.getGender() != null ? participant.getGender().name() : null)
                .churchName(church)
                .status(registration.getStatus())
                .specialRequirements(registration.getSpecialRequirements())
                .emergencyContactName(registration.getEmergencyContactName())
                .emergencyContactPhone(registration.getEmergencyContactPhone())
                .qrCode(registration.getQrCode())
                .checkedInAt(registration.getCheckedInAt())
                .checkedOutAt(registration.getCheckedOutAt())
                .roomDetails(roomDetails)
                .createdAt(registration.getCreatedAt())
                .registrationDate(registration.getCreatedAt())
                .payment(latestPayment)
                .build();
    }

    
    public PaymentResponse toPaymentResponse(Payment payment) {
        if (payment == null) return null;
        
        Registration registration = payment.getRegistration();
        User participant = registration != null ? registration.getParticipant() : null;
        Event event = registration != null ? registration.getEvent() : null;
        String church = (participant != null && participant.getOrganizationUnit() != null) 
                ? participant.getOrganizationUnit().getName() 
                : "N/A";
        
        return PaymentResponse.builder()
                .id(payment.getId())
                .transactionReference(payment.getTransactionReference())
                .registrationId(registration != null ? registration.getId() : null)
                .registrationNumber(registration != null ? registration.getRegistrationNumber() : null)
                .eventId(event != null ? event.getId() : null)
                .eventName(event != null ? event.getName() : null)
                .participantName(participant != null ? (participant.getFirstName() + " " + participant.getLastName()) : "Participant")
                .participantEmail(participant != null ? participant.getEmail() : null)
                .participantPhone(participant != null ? participant.getPhoneNumber() : null)
                .churchName(church)
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
                .createdAt(payment.getCreatedAt())
                .build();
    }
    
    public NotificationResponse toNotificationResponse(Notification notification) {
        if (notification == null) return null;
        
        return NotificationResponse.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipient().getId())
                .recipientName(notification.getRecipient().getFirstName() + " " + 
                        notification.getRecipient().getLastName())
                .senderId(notification.getSender() != null ? notification.getSender().getId() : null)
                .senderName(notification.getSender() != null ? 
                        notification.getSender().getFirstName() + " " + notification.getSender().getLastName() : "System")
                .senderEmail(notification.getSender() != null ? notification.getSender().getEmail() : null)
                .parentNotificationId(notification.getParentNotification() != null ? notification.getParentNotification().getId() : null)
                .parentNotificationTitle(notification.getParentNotification() != null ? notification.getParentNotification().getTitle() : null)
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
