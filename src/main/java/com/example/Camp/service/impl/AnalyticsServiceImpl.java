package com.example.Camp.service.impl;

import com.example.Camp.dto.analytics.AdminDashboardResponse;
import com.example.Camp.dto.analytics.CoordinatorDashboardResponse;
import com.example.Camp.enums.EventStatus;
import com.example.Camp.enums.PaymentStatus;
import com.example.Camp.enums.ProposalStatus;
import com.example.Camp.enums.RegistrationStatus;
import com.example.Camp.repository.*;
import com.example.Camp.service.AnalyticsService;
import com.example.Camp.service.ProposalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final ProposalRepository proposalRepository;
    private final PaymentRepository paymentRepository;
    private final RegistrationRepository registrationRepository;
    private final AttendanceRepository attendanceRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final RoomRepository roomRepository;
    private final ProposalService proposalService;

    @Override
    public AdminDashboardResponse getAdminDashboardStats() {
        log.info("Aggregating Admin Dashboard statistics...");
        
        long totalUsers = userRepository.count();
        long totalEvents = eventRepository.count();
        long activeEvents = eventRepository.findAll().stream()
                .filter(e -> !e.getDeleted() && e.getStatus() == EventStatus.ONGOING)
                .count();

        BigDecimal totalRevenue = paymentRepository.findAll().stream()
                .filter(p -> !p.getDeleted() && p.getStatus() == PaymentStatus.VERIFIED)
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalRegistrations = registrationRepository.count();
        
        // Use the new hierarchy-aware count method
        long pendingProposals = proposalRepository.countPendingReview();
        long approvedProposals = proposalRepository.findActiveByStatus(ProposalStatus.APPROVED).size();
        long rejectedProposals = proposalRepository.findActiveByStatus(ProposalStatus.REJECTED).size();
        long totalAttendances = attendanceRepository.count();

        double attendanceRate = totalRegistrations > 0 ? ((double) totalAttendances / totalRegistrations) * 100 : 0.0;

        Map<String, Long> proposalsByStatus = new HashMap<>();
        for (ProposalStatus status : ProposalStatus.values()) {
            proposalsByStatus.put(status.name(), (long) proposalRepository.findActiveByStatus(status).size());
        }

        return AdminDashboardResponse.builder()
                .totalUsers(totalUsers)
                .totalEvents(totalEvents)
                .activeEvents(activeEvents)
                .totalRevenue(totalRevenue)
                .totalRegistrations(totalRegistrations)
                .pendingProposalsCount(pendingProposals)
                .approvedProposalsCount(approvedProposals)
                .rejectedProposalsCount(rejectedProposals)
                .averageAttendanceRate(Math.round(attendanceRate * 100.0) / 100.0)
                .proposalsByStatus(proposalsByStatus)
                .build();
    }

    @Override
    public CoordinatorDashboardResponse getCoordinatorDashboardStats(Long coordinatorId) {
        log.info("Aggregating Coordinator Dashboard statistics for user ID {}", coordinatorId);

        long assignedEvents = eventRepository.findActiveByCoordinator(coordinatorId).size();
        
        long totalRegistrations = registrationRepository.findAll().stream()
                .filter(r -> !r.getDeleted() && r.getEvent() != null && 
                             r.getEvent().getCoordinator() != null && 
                             r.getEvent().getCoordinator().getId().equals(coordinatorId))
                .count();

        long pendingPayments = paymentRepository.findActiveByStatus(PaymentStatus.PENDING).stream()
                .filter(p -> p.getRegistration() != null && p.getRegistration().getEvent() != null &&
                             p.getRegistration().getEvent().getCoordinator() != null &&
                             p.getRegistration().getEvent().getCoordinator().getId().equals(coordinatorId))
                .count();

        long verifiedPayments = paymentRepository.findActiveByStatus(PaymentStatus.VERIFIED).stream()
                .filter(p -> p.getRegistration() != null && p.getRegistration().getEvent() != null &&
                             p.getRegistration().getEvent().getCoordinator() != null &&
                             p.getRegistration().getEvent().getCoordinator().getId().equals(coordinatorId))
                .count();

        BigDecimal revenue = paymentRepository.findActiveByStatus(PaymentStatus.VERIFIED).stream()
                .filter(p -> p.getRegistration() != null && p.getRegistration().getEvent() != null &&
                             p.getRegistration().getEvent().getCoordinator() != null &&
                             p.getRegistration().getEvent().getCoordinator().getId().equals(coordinatorId))
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalCapacity = roomRepository.findAll().stream()
                .filter(r -> !r.getDeleted() && r.getCapacity() != null)
                .mapToLong(r -> r.getCapacity().longValue())
                .sum();

        long occupiedBeds = roomAssignmentRepository.findAll().stream()
                .filter(ra -> !ra.getDeleted() && ra.getActive())
                .count();

        double occupancyRate = totalCapacity > 0 ? ((double) occupiedBeds / totalCapacity) * 100 : 0.0;
        long checkIns = attendanceRepository.count();
        
        // Get pending proposals for this coordinator's hierarchy
        long pendingProposals = proposalService.countPendingReviewForUser(coordinatorId);

        return CoordinatorDashboardResponse.builder()
                .assignedEventsCount(assignedEvents)
                .totalRegistrations(totalRegistrations)
                .pendingPaymentsCount(pendingPayments)
                .verifiedPaymentsCount(verifiedPayments)
                .totalRevenueCollected(revenue)
                .totalRoomCapacity(totalCapacity)
                .occupiedBedsCount(occupiedBeds)
                .roomOccupancyRate(Math.round(occupancyRate * 100.0) / 100.0)
                .realtimeCheckInCount(checkIns)
                .pendingProposalsCount(pendingProposals)
                .build();
    }
}
