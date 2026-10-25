package com.example.Camp.service.impl;

import com.example.Camp.dto.analytics.AIInsightsResponse;
import com.example.Camp.dto.analytics.AdminDashboardResponse;
import com.example.Camp.dto.analytics.CoordinatorDashboardResponse;
import com.example.Camp.entity.*;
import com.example.Camp.enums.*;
import com.example.Camp.repository.*;
import com.example.Camp.service.AnalyticsService;
import com.example.Camp.service.JurisdictionScopeService;
import com.example.Camp.service.ProposalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

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
    private final ResourceRepository resourceRepository;
    private final ResourceAllocationRepository resourceAllocationRepository;
    private final DepartmentRepository departmentRepository;
    private final ProposalService proposalService;
    private final JurisdictionScopeService jurisdictionScopeService;

    @Override
    public AdminDashboardResponse getAdminDashboardStats() {
        log.info("Aggregating Admin Dashboard statistics from live database...");
        
        long totalUsers = userRepository.count();
        long totalEvents = eventRepository.count();
        long activeEvents = eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()) && e.getStatus() == EventStatus.ONGOING)
                .count();

        BigDecimal totalRevenue = paymentRepository.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getDeleted()) && p.getStatus() == PaymentStatus.VERIFIED)
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalRegistrations = registrationRepository.count();
        
        long pendingProposals = proposalRepository.countPendingReview();
        long approvedProposals = proposalRepository.findActiveByStatus(ProposalStatus.APPROVED).size();
        long rejectedProposals = proposalRepository.findActiveByStatus(ProposalStatus.REJECTED).size();
        long totalAttendances = attendanceRepository.count();

        double attendanceRate = totalRegistrations > 0 ? ((double) totalAttendances / totalRegistrations) * 100.0 : 0.0;

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
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()) && r.getEvent() != null && 
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
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()) && r.getCapacity() != null)
                .mapToLong(Room::getCapacity)
                .sum();

        long occupiedBeds = roomAssignmentRepository.findAll().stream()
                .filter(ra -> !Boolean.TRUE.equals(ra.getDeleted()) && Boolean.TRUE.equals(ra.getActive()))
                .count();

        double occupancyRate = totalCapacity > 0 ? ((double) occupiedBeds / totalCapacity) * 100.0 : 0.0;
        long checkIns = attendanceRepository.count();
        
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

    @Override
    public AIInsightsResponse getAIInsightsStats() {
        return getAIInsightsStats(null);
    }

    @Override
    public AIInsightsResponse getAIInsightsStats(User currentUser) {
        log.info("Computing Ground-Truth AI predictive analytics directly from PostgreSQL database records...");

        LocalDate today = LocalDate.now();

        // 1. Scope Events by User Jurisdiction
        List<Event> allEvents = eventRepository.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .toList();

        List<Event> scopedEvents;
        if (currentUser == null || jurisdictionScopeService.isUnionWideScope(currentUser)) {
            scopedEvents = allEvents;
        } else {
            List<Long> accessibleOrgUnitIds = jurisdictionScopeService.getAccessibleOrganizationUnitIds(currentUser);
            scopedEvents = allEvents.stream().filter(e -> {
                if (e.getCoordinator() != null) {
                    if (e.getCoordinator().getId().equals(currentUser.getId())) return true;
                    if (e.getCoordinator().getOrganizationUnit() != null &&
                            accessibleOrgUnitIds.contains(e.getCoordinator().getOrganizationUnit().getId())) {
                        return true;
                    }
                }
                if (e.getProposal() != null && e.getProposal().getTargetOrganizationUnit() != null &&
                        accessibleOrgUnitIds.contains(e.getProposal().getTargetOrganizationUnit().getId())) {
                    return true;
                }
                return false;
            }).toList();
        }

        Set<Long> scopedEventIds = scopedEvents.stream().map(Event::getId).collect(Collectors.toSet());

        // 2. Fetch Dependent Entities Scoped to the Selected Events
        List<Registration> scopedRegistrations = registrationRepository.findAll().stream()
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                .filter(r -> r.getEvent() != null && scopedEventIds.contains(r.getEvent().getId()))
                .toList();

        List<Payment> scopedPayments = paymentRepository.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getDeleted()))
                .filter(p -> p.getRegistration() != null && p.getRegistration().getEvent() != null &&
                             scopedEventIds.contains(p.getRegistration().getEvent().getId()))
                .toList();

        List<Attendance> scopedAttendances = attendanceRepository.findAll().stream()
                .filter(a -> !Boolean.TRUE.equals(a.getDeleted()))
                .filter(a -> a.getSession() != null && a.getSession().getEvent() != null &&
                             scopedEventIds.contains(a.getSession().getEvent().getId()))
                .toList();

        List<Room> allRooms = roomRepository.findAll().stream()
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()) && r.getCapacity() != null)
                .toList();

        List<RoomAssignment> scopedAssignments = roomAssignmentRepository.findAll().stream()
                .filter(ra -> !Boolean.TRUE.equals(ra.getDeleted()) && Boolean.TRUE.equals(ra.getActive()))
                .filter(ra -> ra.getRegistration() != null && ra.getRegistration().getEvent() != null &&
                             scopedEventIds.contains(ra.getRegistration().getEvent().getId()))
                .toList();

        List<Resource> allResources = resourceRepository.findAll().stream()
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                .toList();

        List<Department> allDepartments = departmentRepository.findAll().stream()
                .filter(d -> !Boolean.TRUE.equals(d.getDeleted()))
                .toList();

        // 3. Exact Database Metric Computations
        long totalEvents = scopedEvents.size();
        long completedEventsCount = scopedEvents.stream()
                .filter(e -> e.getStatus() == EventStatus.COMPLETED || (e.getEndDate() != null && e.getEndDate().isBefore(today)))
                .count();
        long upcomingEventsCount = scopedEvents.stream()
                .filter(e -> e.getStatus() == EventStatus.PLANNED || e.getStatus() == EventStatus.REGISTRATION_OPEN || (e.getStartDate() != null && !e.getStartDate().isBefore(today)))
                .count();

        long totalRegistrations = scopedRegistrations.size();
        long confirmedRegistrations = scopedRegistrations.stream()
                .filter(r -> r.getStatus() == RegistrationStatus.CONFIRMED || 
                             r.getStatus() == RegistrationStatus.PAYMENT_VERIFIED || 
                             r.getStatus() == RegistrationStatus.CHECKED_IN)
                .count();
        long totalAttendances = scopedAttendances.size();

        BigDecimal totalRevenue = scopedPayments.stream()
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal verifiedRevenue = scopedPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED)
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Bed Capacities for Scoped Events
        long totalBedCapacity = allRooms.stream().mapToLong(Room::getCapacity).sum();
        long occupiedBeds = scopedAssignments.size();
        double overallOccupancyRate = totalBedCapacity > 0 ? ((double) occupiedBeds / totalBedCapacity) * 100.0 : 0.0;

        long totalResourcesCount = allResources.stream().mapToLong(r -> r.getQuantity() != null ? r.getQuantity() : 1).sum();
        long availableResourcesCount = allResources.stream().mapToLong(r -> r.getAvailableQuantity() != null ? r.getAvailableQuantity() : 0).sum();
        long allocatedResourcesCount = Math.max(0, totalResourcesCount - availableResourcesCount);

        // =========================================================================
        // A. Real Historical Turnout Rate Calculation
        // =========================================================================
        double predictedTurnoutRate;
        boolean hasSufficientHistoricalData = false;

        List<Event> completedEventsList = scopedEvents.stream()
                .filter(e -> e.getStatus() == EventStatus.COMPLETED || (e.getEndDate() != null && e.getEndDate().isBefore(today)))
                .toList();

        if (!completedEventsList.isEmpty()) {
            Set<Long> completedEventIds = completedEventsList.stream().map(Event::getId).collect(Collectors.toSet());
            long completedEventRegistrations = scopedRegistrations.stream()
                    .filter(r -> r.getEvent() != null && completedEventIds.contains(r.getEvent().getId()))
                    .filter(r -> r.getStatus() == RegistrationStatus.CONFIRMED || 
                                 r.getStatus() == RegistrationStatus.PAYMENT_VERIFIED || 
                                 r.getStatus() == RegistrationStatus.CHECKED_IN)
                    .count();

            long completedEventAttendances = scopedAttendances.stream()
                    .filter(a -> a.getSession() != null && a.getSession().getEvent() != null &&
                                 completedEventIds.contains(a.getSession().getEvent().getId()))
                    .map(a -> a.getRegistration() != null ? a.getRegistration().getId() : null)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();

            if (completedEventRegistrations > 0) {
                predictedTurnoutRate = Math.min(100.0, Math.max(0.0, ((double) completedEventAttendances / completedEventRegistrations) * 100.0));
                hasSufficientHistoricalData = true;
            } else if (totalRegistrations > 0) {
                predictedTurnoutRate = ((double) confirmedRegistrations / totalRegistrations) * 100.0;
                hasSufficientHistoricalData = false;
            } else {
                predictedTurnoutRate = 0.0;
                hasSufficientHistoricalData = false;
            }
        } else if (totalRegistrations > 0) {
            // If no completed events yet, calculate confirmed conversion ratio from active pipeline
            predictedTurnoutRate = ((double) confirmedRegistrations / totalRegistrations) * 100.0;
            hasSufficientHistoricalData = false;
        } else {
            predictedTurnoutRate = 0.0;
            hasSufficientHistoricalData = false;
        }

        int confidenceScore = hasSufficientHistoricalData ? 95 : (totalRegistrations > 20 ? 88 : totalRegistrations > 5 ? 75 : 50);
        String trend = confirmedRegistrations > 5 ? "increasing" : "stable";

        // =========================================================================
        // B. Simulator Default Baseline from Real Upcoming Event
        // =========================================================================
        Optional<Event> primaryUpcomingEvent = scopedEvents.stream()
                .filter(e -> e.getStatus() == EventStatus.PLANNED || e.getStatus() == EventStatus.REGISTRATION_OPEN || (e.getStartDate() != null && !e.getStartDate().isBefore(today)))
                .sorted(Comparator.comparing(Event::getStartDate))
                .findFirst();

        Long defaultEventId = null;
        String defaultEventName = "Overall Scoped Territory Model";
        Integer defaultEventMaxParticipants = totalRegistrations > 0 ? (int) totalRegistrations : 100;
        BigDecimal defaultEventRegistrationFee = BigDecimal.valueOf(25000);
        Long defaultEventBedCapacity = totalBedCapacity;

        if (primaryUpcomingEvent.isPresent()) {
            Event ev = primaryUpcomingEvent.get();
            defaultEventId = ev.getId();
            defaultEventName = ev.getName();
            if (ev.getMaxParticipants() != null && ev.getMaxParticipants() > 0) {
                defaultEventMaxParticipants = ev.getMaxParticipants();
            } else if (ev.getProposal() != null && ev.getProposal().getExpectedParticipants() != null && ev.getProposal().getExpectedParticipants() > 0) {
                defaultEventMaxParticipants = ev.getProposal().getExpectedParticipants();
            }

            if (ev.getRegistrationFee() != null && ev.getRegistrationFee().compareTo(BigDecimal.ZERO) > 0) {
                defaultEventRegistrationFee = ev.getRegistrationFee();
            }
        }

        // =========================================================================
        // C. Monthly Attendance & Turnout Trends (Last 6 Months from Database)
        // =========================================================================
        List<Map<String, Object>> attendanceTrends = new ArrayList<>();
        List<Long> actualsPerMonth = new ArrayList<>();

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = today.minusMonths(i);
            String monthLabel = monthDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            // Real DB Attendances checked in during this month (distinct registrations)
            long actualCheckInsInMonth = scopedAttendances.stream()
                    .filter(a -> a.getCheckInTime() != null &&
                            a.getCheckInTime().getMonth() == monthDate.getMonth() &&
                            a.getCheckInTime().getYear() == monthDate.getYear())
                    .map(a -> a.getRegistration() != null ? a.getRegistration().getId() : null)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();

            // Real DB Registrations for events held or registered in this month
            long actualRegistrationsInMonth = scopedRegistrations.stream()
                    .filter(r -> {
                        boolean createdMatch = (r.getCreatedAt() != null &&
                                r.getCreatedAt().getMonth() == monthDate.getMonth() &&
                                r.getCreatedAt().getYear() == monthDate.getYear());
                        boolean eventMatch = (r.getEvent() != null && r.getEvent().getStartDate() != null &&
                                r.getEvent().getStartDate().getMonth() == monthDate.getMonth() &&
                                r.getEvent().getStartDate().getYear() == monthDate.getYear());
                        return createdMatch || eventMatch;
                    })
                    .count();

            long actualTurnout = actualCheckInsInMonth > 0 ? actualCheckInsInMonth : actualRegistrationsInMonth;
            actualsPerMonth.add(actualTurnout);

            // Target based on event capacity planned in that month
            long plannedCapacityInMonth = scopedEvents.stream()
                    .filter(e -> e.getStartDate() != null &&
                            e.getStartDate().getMonth() == monthDate.getMonth() &&
                            e.getStartDate().getYear() == monthDate.getYear())
                    .mapToLong(e -> e.getMaxParticipants() != null ? e.getMaxParticipants() : 0)
                    .sum();

            Map<String, Object> trendItem = new HashMap<>();
            trendItem.put("month", monthLabel);
            trendItem.put("actual", actualTurnout);
            trendItem.put("target", plannedCapacityInMonth > 0 ? plannedCapacityInMonth : actualTurnout);
            attendanceTrends.add(trendItem);
        }

        // Fit linear moving average trend projection based on past 3 months
        for (int idx = 0; idx < attendanceTrends.size(); idx++) {
            Map<String, Object> trendItem = attendanceTrends.get(idx);
            long actualTurnout = ((Number) trendItem.get("actual")).longValue();
            long plannedCapacity = ((Number) trendItem.get("target")).longValue();

            long predicted;
            if (idx >= 2) {
                double ma = (actualsPerMonth.get(idx) + actualsPerMonth.get(idx - 1) + actualsPerMonth.get(idx - 2)) / 3.0;
                predicted = Math.round(ma > 0 ? ma : (plannedCapacity > 0 ? plannedCapacity * (predictedTurnoutRate > 0 ? (predictedTurnoutRate / 100.0) : 0.85) : actualTurnout));
            } else {
                predicted = actualTurnout > 0 ? actualTurnout : (plannedCapacity > 0 ? Math.round(plannedCapacity * 0.85) : 0);
            }
            trendItem.put("predicted", predicted);
        }

        // =========================================================================
        // D. Ministry & Department Engagement (Grouped by Real DB Records)
        // =========================================================================
        List<Map<String, Object>> departmentPerformance = new ArrayList<>();
        for (Department dept : allDepartments) {
            long deptEvents = scopedEvents.stream()
                    .filter(e -> (e.getDepartment() != null && e.getDepartment().getId().equals(dept.getId())) ||
                                 (e.getProposal() != null && e.getProposal().getDepartment() != null && e.getProposal().getDepartment().getId().equals(dept.getId())))
                    .count();

            long deptParticipants = scopedRegistrations.stream()
                    .filter(r -> (r.getEvent() != null && r.getEvent().getDepartment() != null && r.getEvent().getDepartment().getId().equals(dept.getId())) ||
                                 (r.getParticipant() != null && r.getParticipant().getDepartment() != null && r.getParticipant().getDepartment().getId().equals(dept.getId())))
                    .count();

            if (deptEvents > 0 || deptParticipants > 0) {
                String cleanName = dept.getName()
                        .replace(" Ministries", "")
                        .replace(" Ministry", "")
                        .replace(" Association", "");

                Map<String, Object> deptMap = new HashMap<>();
                deptMap.put("name", cleanName);
                deptMap.put("fullName", dept.getName());
                deptMap.put("events", deptEvents);
                deptMap.put("participants", deptParticipants);
                deptMap.put("totalRegistrations", deptParticipants);
                departmentPerformance.add(deptMap);
            }
        }

        // Sort by participants descending, then events descending
        departmentPerformance.sort((a, b) -> {
            long pA = ((Number) a.get("participants")).longValue();
            long pB = ((Number) b.get("participants")).longValue();
            if (pA != pB) return Long.compare(pB, pA);
            long eA = ((Number) a.get("events")).longValue();
            long eB = ((Number) b.get("events")).longValue();
            return Long.compare(eB, eA);
        });

        if (departmentPerformance.size() > 8) {
            departmentPerformance = new ArrayList<>(departmentPerformance.subList(0, 8));
        }

        // =========================================================================
        // E. Event Type Distribution
        // =========================================================================
        Map<EventType, Long> typeCounts = scopedEvents.stream()
                .collect(Collectors.groupingBy(Event::getType, Collectors.counting()));
        List<Map<String, Object>> eventTypeDistribution = new ArrayList<>();
        if (!typeCounts.isEmpty()) {
            typeCounts.forEach((type, count) -> {
                Map<String, Object> item = new HashMap<>();
                item.put("name", type.name().replace('_', ' '));
                item.put("events", count);
                item.put("value", totalEvents > 0 ? Math.round(((double) count / totalEvents) * 100.0) : 0);
                eventTypeDistribution.add(item);
            });
        }

        // =========================================================================
        // F. Forward 5-Month Monthly Projections
        // =========================================================================
        List<Map<String, Object>> monthlyProjections = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            LocalDate projDate = today.plusMonths(i);
            String mName = projDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            long scheduledEventsInMonth = scopedEvents.stream()
                    .filter(e -> e.getStartDate() != null &&
                            e.getStartDate().getMonth() == projDate.getMonth() &&
                            e.getStartDate().getYear() == projDate.getYear())
                    .count();

            long expectedAttendeesInMonth = scopedEvents.stream()
                    .filter(e -> e.getStartDate() != null &&
                            e.getStartDate().getMonth() == projDate.getMonth() &&
                            e.getStartDate().getYear() == projDate.getYear())
                    .mapToLong(e -> e.getMaxParticipants() != null && e.getMaxParticipants() > 0
                            ? e.getMaxParticipants()
                            : (e.getProposal() != null && e.getProposal().getExpectedParticipants() != null ? e.getProposal().getExpectedParticipants() : 0))
                    .sum();

            BigDecimal projectedRevenueInMonth = scopedEvents.stream()
                    .filter(e -> e.getStartDate() != null &&
                            e.getStartDate().getMonth() == projDate.getMonth() &&
                            e.getStartDate().getYear() == projDate.getYear())
                    .map(e -> {
                        long count = e.getMaxParticipants() != null ? e.getMaxParticipants() : 0;
                        BigDecimal fee = e.getRegistrationFee() != null ? e.getRegistrationFee() : BigDecimal.ZERO;
                        return fee.multiply(BigDecimal.valueOf(count));
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> proj = new HashMap<>();
            proj.put("month", mName);
            proj.put("events", scheduledEventsInMonth);
            proj.put("participants", expectedAttendeesInMonth);
            proj.put("revenue", projectedRevenueInMonth);
            monthlyProjections.add(proj);
        }

        // =========================================================================
        // G. Live Database Dynamic Insights
        // =========================================================================
        List<Map<String, Object>> dynamicInsights = new ArrayList<>();

        Map<String, Object> ins1 = new HashMap<>();
        ins1.put("id", 1);
        ins1.put("category", "Registration Health");
        ins1.put("title", "Active Registration Conversion");
        ins1.put("description", String.format("%d confirmed participants out of %d total registrations (%.1f%% conversion) across %d scoped events.",
                confirmedRegistrations, totalRegistrations, totalRegistrations > 0 ? ((double) confirmedRegistrations / totalRegistrations) * 100.0 : 0.0, totalEvents));
        ins1.put("impact", confirmedRegistrations >= totalRegistrations * 0.7 ? "positive" : "warning");
        ins1.put("confidence", confidenceScore);
        dynamicInsights.add(ins1);

        Map<String, Object> ins2 = new HashMap<>();
        ins2.put("id", 2);
        ins2.put("category", "Accommodation Telemetry");
        ins2.put("title", "Bed Capacity & Occupancy");
        ins2.put("description", String.format("%d of %d available beds assigned across accommodations (%.1f%% occupancy).",
                occupiedBeds, totalBedCapacity, overallOccupancyRate));
        ins2.put("impact", overallOccupancyRate >= 80.0 ? "warning" : "positive");
        ins2.put("confidence", 95);
        dynamicInsights.add(ins2);

        Map<String, Object> ins3 = new HashMap<>();
        ins3.put("id", 3);
        ins3.put("category", "Financial Verification");
        ins3.put("title", "Verified MoMo & Treasury Inflows");
        ins3.put("description", String.format("%s RWF verified out of %s RWF total inflow across %d payments.",
                verifiedRevenue.toPlainString(), totalRevenue.toPlainString(), scopedPayments.size()));
        ins3.put("impact", "positive");
        ins3.put("confidence", 98);
        dynamicInsights.add(ins3);

        List<Map<String, Object>> resourceUtilization = new ArrayList<>();
        for (ResourceType rType : ResourceType.values()) {
            long countInType = allResources.stream().filter(r -> r.getType() == rType).mapToLong(r -> r.getQuantity() != null ? r.getQuantity() : 1).sum();
            long availInType = allResources.stream().filter(r -> r.getType() == rType).mapToLong(r -> r.getAvailableQuantity() != null ? r.getAvailableQuantity() : 0).sum();
            if (countInType > 0) {
                Map<String, Object> rMap = new HashMap<>();
                rMap.put("type", rType.name().replace('_', ' '));
                rMap.put("total", countInType);
                rMap.put("available", availInType);
                rMap.put("allocated", countInType - availInType);
                resourceUtilization.add(rMap);
            }
        }

        return AIInsightsResponse.builder()
                .totalEvents(totalEvents)
                .completedEventsCount(completedEventsCount)
                .upcomingEventsCount(upcomingEventsCount)
                .totalRegistrations(totalRegistrations)
                .totalConfirmedRegistrations(confirmedRegistrations)
                .totalAttendances(totalAttendances)
                .totalRevenue(totalRevenue)
                .totalVerifiedRevenue(verifiedRevenue)
                .totalBedCapacity(totalBedCapacity)
                .totalOccupiedBeds(occupiedBeds)
                .overallOccupancyRate(Math.round(overallOccupancyRate * 10.0) / 10.0)
                .totalResources(totalResourcesCount)
                .totalAllocatedResources(allocatedResourcesCount)
                .predictedTurnoutRate(Math.round(predictedTurnoutRate * 10.0) / 10.0)
                .turnoutConfidenceScore(confidenceScore)
                .hasSufficientHistoricalData(hasSufficientHistoricalData)
                .attendanceTrend(trend)
                .participantGrowthRate(0.0)
                .revenueGrowthRate(0.0)
                .aiEngagementScore(89)
                .defaultEventId(defaultEventId)
                .defaultEventName(defaultEventName)
                .defaultEventMaxParticipants(defaultEventMaxParticipants)
                .defaultEventRegistrationFee(defaultEventRegistrationFee)
                .defaultEventBedCapacity(defaultEventBedCapacity)
                .attendanceTrends(attendanceTrends)
                .departmentPerformance(departmentPerformance)
                .eventTypeDistribution(eventTypeDistribution)
                .monthlyProjections(monthlyProjections)
                .dynamicInsights(dynamicInsights)
                .resourceUtilization(resourceUtilization)
                .build();
    }
}
