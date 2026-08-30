package com.example.Camp.service.impl;

import com.example.Camp.dto.proposal.ProposalCreateRequest;
import com.example.Camp.dto.proposal.ProposalRequest;
import com.example.Camp.dto.proposal.ProposalResponse;
import com.example.Camp.dto.proposal.ProposalReviewRequest;
import com.example.Camp.dto.proposal.AdminApprovalRequest;
import com.example.Camp.dto.notification.NotificationRequest;
import com.example.Camp.entity.*;
import com.example.Camp.enums.*;
import com.example.Camp.exception.BadRequestException;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.*;
import com.example.Camp.service.NotificationService;
import com.example.Camp.service.ProposalService;
import com.example.Camp.service.UserService;
import com.example.Camp.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class ProposalServiceImpl implements ProposalService {

    private final ProposalRepository proposalRepository;
    private final ProposalReviewRepository proposalReviewRepository;
    private final DepartmentRepository departmentRepository;
    private final EventRepository eventRepository;
    private final OrganizationUnitRepository organizationUnitRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final DtoMapper dtoMapper;
    private final com.example.Camp.service.ConflictValidationService conflictValidationService;

    public ProposalServiceImpl(
            ProposalRepository proposalRepository,
            ProposalReviewRepository proposalReviewRepository,
            DepartmentRepository departmentRepository,
            EventRepository eventRepository,
            OrganizationUnitRepository organizationUnitRepository,
            UserRepository userRepository,
            UserService userService,
            @Lazy NotificationService notificationService,
            DtoMapper dtoMapper,
            com.example.Camp.service.ConflictValidationService conflictValidationService) {
        this.proposalRepository = proposalRepository;
        this.proposalReviewRepository = proposalReviewRepository;
        this.departmentRepository = departmentRepository;
        this.eventRepository = eventRepository;
        this.organizationUnitRepository = organizationUnitRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.notificationService = notificationService;
        this.dtoMapper = dtoMapper;
        this.conflictValidationService = conflictValidationService;
    }

    // ── REVIEWER RESOLUTION LOGIC ─────────────────────────────────────────────

    // ── REVIEWER RESOLUTION LOGIC ─────────────────────────────────────────────

    @Override
    public User findDesignatedReviewer(ProposalScope scope, Long targetOrgUnitId, Long departmentId) {
        return findDesignatedReviewer(scope, targetOrgUnitId, departmentId, null);
    }

    @Override
    public User findDesignatedReviewer(ProposalScope scope, Long targetOrgUnitId, Long departmentId, Long creatorId) {
        log.info("Resolving designated reviewer: scope={}, targetOrgUnitId={}, departmentId={}, creatorId={}", scope, targetOrgUnitId, departmentId, creatorId);
        User resolved = null;
        try {
            if (scope == ProposalScope.UNION) {
                // 1. Look up user with organization_unit_id = 1 (RUM) AND matching department_id
                if (departmentId != null) {
                    Department dept = departmentRepository.findById(departmentId).orElse(null);
                    if (dept != null && dept.getLeader() != null 
                            && Boolean.TRUE.equals(dept.getLeader().getActive()) 
                            && !Boolean.TRUE.equals(dept.getLeader().getDeleted())) {
                        User leader = dept.getLeader();
                        if (leader.getOrganizationUnit() != null 
                                && Long.valueOf(1L).equals(leader.getOrganizationUnit().getId())
                                && (creatorId == null || !leader.getId().equals(creatorId))) {
                            log.info("Found Union Department Leader: {} for department {}", leader.getEmail(), departmentId);
                            resolved = leader;
                        }
                    }
                }
                // Fallback step 1: Check active users in Union (id=1) excluding creator
                if (resolved == null) {
                    List<User> unionUsers = userRepository.findActiveByOrganizationUnitId(1L);
                    for (User u : unionUsers) {
                        if ((u.getPosition() == Position.UNION_LEADER || u.getPosition() == Position.DEPARTMENT_LEADER)
                                && (creatorId == null || !u.getId().equals(creatorId))) {
                            log.info("Found Union Leader: {}", u.getEmail());
                            resolved = u;
                            break;
                        }
                    }
                }
            } else if (scope == ProposalScope.FIELD) {
                Long fieldId = (targetOrgUnitId != null && targetOrgUnitId > 0L) ? targetOrgUnitId : 1L;
                if (departmentId != null) {
                    Department dept = departmentRepository.findById(departmentId).orElse(null);
                    if (dept != null && dept.getLeader() != null 
                            && Boolean.TRUE.equals(dept.getLeader().getActive()) 
                            && !Boolean.TRUE.equals(dept.getLeader().getDeleted())) {
                        User leader = dept.getLeader();
                        if (leader.getPosition() == Position.FIELD_LEADER 
                                && leader.getOrganizationUnit() != null 
                                && fieldId.equals(leader.getOrganizationUnit().getId())
                                && (creatorId == null || !leader.getId().equals(creatorId))) {
                            log.info("Found Field Leader: {} for department {}", leader.getEmail(), departmentId);
                            resolved = leader;
                        }
                    }
                }
                if (resolved == null) {
                    List<User> fieldLeaders = userRepository.findActiveByPositionAndOrganizationUnitId(Position.FIELD_LEADER, fieldId);
                    for (User fl : fieldLeaders) {
                        if (creatorId == null || !fl.getId().equals(creatorId)) {
                            log.info("Fallback 1: Found Field Leader {} for field {}", fl.getEmail(), fieldId);
                            resolved = fl;
                            break;
                        }
                    }
                }
                if (resolved == null) {
                    List<User> childLeaders = userRepository.findActiveByParentOrganizationUnitId(fieldId);
                    for (User cl : childLeaders) {
                        if (creatorId == null || !cl.getId().equals(creatorId)) {
                            log.info("Fallback 2: Found Child District Leader {} under field {}", cl.getEmail(), fieldId);
                            resolved = cl;
                            break;
                        }
                    }
                }
            } else if (scope == ProposalScope.DISTRICT) {
                if (targetOrgUnitId != null && targetOrgUnitId > 0L) {
                    List<User> districtPastors = userRepository.findActiveByPositionAndOrganizationUnitId(Position.DISTRICT_PASTOR, targetOrgUnitId);
                    if (districtPastors.isEmpty()) {
                        districtPastors = userRepository.findActiveByPositionAndOrganizationUnitId(Position.PASTOR, targetOrgUnitId);
                    }
                    for (User dp : districtPastors) {
                        if (creatorId == null || !dp.getId().equals(creatorId)) {
                            resolved = dp;
                            break;
                        }
                    }
                    if (resolved == null) {
                        OrganizationUnit districtUnit = organizationUnitRepository.findById(targetOrgUnitId).orElse(null);
                        if (districtUnit != null && districtUnit.getParent() != null) {
                            List<User> fieldLeaders = userRepository.findActiveByPositionAndOrganizationUnitId(Position.FIELD_LEADER, districtUnit.getParent().getId());
                            for (User fl : fieldLeaders) {
                                if (creatorId == null || !fl.getId().equals(creatorId)) {
                                    resolved = fl;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in findDesignatedReviewer: {}", e.getMessage(), e);
        }

        // Resilient Fallback: Any active Administrator (excluding creator if possible)
        if (resolved == null) {
            List<User> admins = userRepository.findActiveByRole(Role.ADMINISTRATOR);
            for (User admin : admins) {
                if (creatorId == null || !admin.getId().equals(creatorId)) {
                    resolved = admin;
                    break;
                }
            }
            if (resolved == null && !admins.isEmpty()) {
                resolved = admins.get(0);
            }
        }

        log.info("Designated reviewer resolved: {}", resolved != null ? resolved.getEmail() : "None");
        return resolved;
    }

    private void sendProposalSubmissionNotifications(Proposal proposal, User reviewer, User creator) {
        if (notificationService == null) return;

        String reviewerTitle = (reviewer != null)
                ? (reviewer.getFirstName() + " " + reviewer.getLastName() + " (" + (reviewer.getPosition() != null ? reviewer.getPosition() : reviewer.getRole()) + ")")
                : "Union Administrator";

        String creatorTitle = (creator != null)
                ? (creator.getFirstName() + " " + creator.getLastName())
                : "Coordinator";

        // 1. Notify Creator: Inform WHO the proposal was sent to
        if (creator != null) {
            try {
                NotificationRequest creatorNotif = new NotificationRequest();
                creatorNotif.setRecipientId(creator.getId());
                creatorNotif.setActionUrl("/app/proposals/" + proposal.getId());
                creatorNotif.setType(NotificationType.GENERAL_ANNOUNCEMENT);
                creatorNotif.setTitle("Proposal Submitted: " + proposal.getEventName());
                creatorNotif.setMessage("Your proposal '" + proposal.getEventName() + "' (Scope: " + proposal.getScope() + ") has been submitted and sent to " + reviewerTitle + " for review.");
                notificationService.createNotification(creatorNotif);
                log.info("Sent proposal submission confirmation notification to creator {}", creator.getId());
            } catch (Exception e) {
                log.warn("Failed to send creator notification: {}", e.getMessage());
            }
        }

        // 2. Notify Reviewer: Inform pending review
        if (reviewer != null && (creator == null || !reviewer.getId().equals(creator.getId()))) {
            try {
                NotificationRequest reviewerNotif = new NotificationRequest();
                reviewerNotif.setRecipientId(reviewer.getId());
                reviewerNotif.setActionUrl("/app/proposals/" + proposal.getId());
                reviewerNotif.setType(NotificationType.GENERAL_ANNOUNCEMENT);
                reviewerNotif.setTitle("New Proposal Pending Review: " + proposal.getEventName());
                reviewerNotif.setMessage("A new proposal '" + proposal.getEventName() + "' has been submitted by " + creatorTitle + " and is awaiting your review.");
                notificationService.createNotification(reviewerNotif);
                log.info("Sent proposal review request notification to reviewer {}", reviewer.getId());
            } catch (Exception e) {
                log.warn("Failed to send reviewer notification: {}", e.getMessage());
            }
        }
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    @Override
    public ProposalResponse createProposal(ProposalRequest request, Long userId) {
        validateDates(request.getStartDate(), request.getEndDate());
        // 30-Day Advance Notice Rule
        conflictValidationService.validateAdvanceNotice(request.getStartDate());

        User proposedBy = userService.getUserById(userId);

        // Leader Availability & Schedule Conflict Validation
        List<Long> leadersToCheck = new ArrayList<>();
        if (userId != null) leadersToCheck.add(userId);
        List<String> leaderConflicts = conflictValidationService.checkLeaderAvailability(leadersToCheck, request.getStartDate(), request.getEndDate(), null);
        Long checkOrgUnitId = request.getTargetOrganizationUnitId() != null ? request.getTargetOrganizationUnitId() : (proposedBy.getOrganizationUnit() != null ? proposedBy.getOrganizationUnit().getId() : 1L);
        List<String> scheduleConflicts = conflictValidationService.checkScheduleConflicts(checkOrgUnitId, request.getDepartmentId(), request.getVenue(), request.getStartDate(), request.getEndDate(), null);

        List<String> allConflicts = new ArrayList<>();
        allConflicts.addAll(leaderConflicts);
        allConflicts.addAll(scheduleConflicts);

        if (!allConflicts.isEmpty()) {
            throw new BadRequestException("Proposal creation blocked due to schedule conflicts:\n- " + String.join("\n- ", allConflicts));
        }

        // Resilient Department Resolution
        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId()).orElse(null);
        }
        if (department == null) {
            department = departmentRepository.findByType(DepartmentType.YOUTH).orElse(null);
        }
        if (department == null) {
            List<Department> allDepts = departmentRepository.findAll();
            if (!allDepts.isEmpty()) {
                department = allDepts.get(0);
            } else {
                throw new ResourceNotFoundException("Department", "id", request.getDepartmentId() != null ? request.getDepartmentId() : 1L);
            }
        }

        // Resilient Target Unit Resolution
        Long targetUnitId = request.getTargetOrganizationUnitId();
        if (request.getScope() == ProposalScope.UNION || targetUnitId == null || targetUnitId <= 0L) {
            targetUnitId = 1L;
        }

        OrganizationUnit targetUnit = organizationUnitRepository.findById(targetUnitId).orElse(null);
        if (targetUnit == null) {
            targetUnit = organizationUnitRepository.findByCode("RUM").orElse(null);
        }
        if (targetUnit == null) {
            List<OrganizationUnit> units = organizationUnitRepository.findAll();
            if (!units.isEmpty()) {
                targetUnit = units.get(0);
            } else {
                throw new ResourceNotFoundException("OrganizationUnit", "id", targetUnitId);
            }
        }

        User reviewer = findDesignatedReviewer(request.getScope(), targetUnit.getId(), department.getId(), userId);

        Proposal proposal = Proposal.builder()
                .eventName(request.getEventName())
                .eventType(request.getEventType() != null ? request.getEventType() : EventType.CAMP)
                .department(department)
                .proposedBy(proposedBy)
                .objectives(request.getObjectives())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .venue(request.getVenue())
                .expectedParticipants(request.getExpectedParticipants())
                .estimatedBudget(request.getEstimatedBudget())
                .requiredResources(request.getRequiredResources())
                .scope(request.getScope() != null ? request.getScope() : ProposalScope.UNION)
                .targetOrganizationUnit(targetUnit)
                .status(ProposalStatus.SUBMITTED)
                .reviewedBy(reviewer)
                .leaderReviewedBy(reviewer)
                .build();

        Proposal saved = proposalRepository.save(proposal);
        sendProposalSubmissionNotifications(saved, reviewer, proposedBy);
        if (saved.getScope() == ProposalScope.FIELD) {
            notifyFieldScopeUnionLeaders(saved);
        }
        log.info("Proposal created: {} (scope={}) by user {}, assigned reviewer {}", saved.getEventName(), saved.getScope(), userId, reviewer != null ? reviewer.getEmail() : "None");
        return dtoMapper.toProposalResponse(saved);
    }

    @Override
    public ProposalResponse createProposal(ProposalCreateRequest request, Long userId) {
        validateDates(request.getStartDate(), request.getEndDate());
        User proposedBy = userService.getUserById(userId);

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId()).orElse(null);
        }
        if (department == null) {
            department = departmentRepository.findByType(DepartmentType.YOUTH).orElse(null);
        }
        if (department == null) {
            List<Department> allDepts = departmentRepository.findAll();
            if (!allDepts.isEmpty()) {
                department = allDepts.get(0);
            } else {
                throw new ResourceNotFoundException("Department", "id", request.getDepartmentId() != null ? request.getDepartmentId() : 1L);
            }
        }

        Long targetUnitId = request.getTargetOrganizationUnitId();
        if (request.getScope() == ProposalScope.UNION || targetUnitId == null || targetUnitId <= 0L) {
            targetUnitId = 1L;
        }

        OrganizationUnit targetUnit = organizationUnitRepository.findById(targetUnitId).orElse(null);
        if (targetUnit == null) {
            targetUnit = organizationUnitRepository.findByCode("RUM").orElse(null);
        }
        if (targetUnit == null) {
            List<OrganizationUnit> units = organizationUnitRepository.findAll();
            if (!units.isEmpty()) {
                targetUnit = units.get(0);
            } else {
                throw new ResourceNotFoundException("OrganizationUnit", "id", targetUnitId);
            }
        }

        User reviewer = findDesignatedReviewer(request.getScope(), targetUnit.getId(), department.getId(), userId);

        Proposal proposal = Proposal.builder()
                .eventName(request.getEventName())
                .eventType(request.getEventType() != null ? request.getEventType() : EventType.CAMP)
                .department(department)
                .proposedBy(proposedBy)
                .objectives(request.getObjectives())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .venue(request.getVenue())
                .expectedParticipants(request.getExpectedParticipants())
                .estimatedBudget(request.getEstimatedBudget())
                .requiredResources(request.getRequiredResources())
                .scope(request.getScope() != null ? request.getScope() : ProposalScope.UNION)
                .targetOrganizationUnit(targetUnit)
                .status(ProposalStatus.SUBMITTED)
                .reviewedBy(reviewer)
                .leaderReviewedBy(reviewer)
                .build();

        Proposal saved = proposalRepository.save(proposal);
        sendProposalSubmissionNotifications(saved, reviewer, proposedBy);
        log.info("Proposal created: {} (scope={}) by user {}, assigned reviewer {}", saved.getEventName(), saved.getScope(), userId, reviewer != null ? reviewer.getEmail() : "None");
        return dtoMapper.toProposalResponse(saved);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    @Override
    public ProposalResponse updateProposal(Long id, ProposalRequest request) {
        Proposal proposal = getProposalEntity(id);
        if (proposal.getStatus() != ProposalStatus.DRAFT && proposal.getStatus() != ProposalStatus.REVISION_REQUESTED) {
            throw new BadRequestException("Cannot update proposal in status: " + proposal.getStatus());
        }

        OrganizationUnit targetUnit = organizationUnitRepository.findById(request.getTargetOrganizationUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("OrganizationUnit", "id", request.getTargetOrganizationUnitId()));
        validateScopeMatchesUnit(request.getScope(), targetUnit);

        proposal.setEventName(request.getEventName());
        proposal.setEventType(request.getEventType());
        proposal.setObjectives(request.getObjectives());
        proposal.setStartDate(request.getStartDate());
        proposal.setEndDate(request.getEndDate());
        proposal.setVenue(request.getVenue());
        proposal.setExpectedParticipants(request.getExpectedParticipants());
        proposal.setEstimatedBudget(request.getEstimatedBudget());
        proposal.setRequiredResources(request.getRequiredResources());
        proposal.setScope(request.getScope());
        proposal.setTargetOrganizationUnit(targetUnit);

        return dtoMapper.toProposalResponse(proposalRepository.save(proposal));
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ProposalResponse getProposalById(Long id) {
        return dtoMapper.toProposalResponse(getProposalEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProposalResponse> getAllProposals() {
        return proposalRepository.findAll().stream()
                .filter(p -> !p.getDeleted())
                .map(dtoMapper::toProposalResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProposalResponse> getProposalsByStatus(ProposalStatus status) {
        return proposalRepository.findActiveByStatus(status).stream()
                .map(dtoMapper::toProposalResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProposalResponse> getProposalsByUser(Long userId) {
        return proposalRepository.findActiveByProposedBy(userId).stream()
                .map(dtoMapper::toProposalResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProposalResponse> getProposalsByDepartment(Long departmentId) {
        return proposalRepository.findActiveByDepartment(departmentId).stream()
                .map(dtoMapper::toProposalResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProposalResponse> getPendingReviewProposals() {
        return proposalRepository.findPendingReview().stream()
                .map(dtoMapper::toProposalResponse).collect(Collectors.toList());
    }

    // ── SUBMIT ────────────────────────────────────────────────────────────────

    @Override
    public ProposalResponse submitProposal(Long id) {
        Proposal proposal = getProposalEntity(id);
        if (proposal.getStatus() != ProposalStatus.DRAFT && proposal.getStatus() != ProposalStatus.REVISION_REQUESTED) {
            throw new BadRequestException("Only DRAFT or REVISION_REQUESTED proposals can be submitted");
        }
        User reviewer = findDesignatedReviewer(
                proposal.getScope(), 
                proposal.getTargetOrganizationUnit() != null ? proposal.getTargetOrganizationUnit().getId() : 1L, 
                proposal.getDepartment() != null ? proposal.getDepartment().getId() : null,
                proposal.getProposedBy() != null ? proposal.getProposedBy().getId() : null);
        
        proposal.setStatus(ProposalStatus.SUBMITTED);
        proposal.setDeptLeaderEndorsed(false); // reset on re-submission
        if (reviewer != null) {
            proposal.setReviewedBy(reviewer);
            proposal.setLeaderReviewedBy(reviewer);
        }
        Proposal saved = proposalRepository.save(proposal);
        sendProposalSubmissionNotifications(saved, reviewer, proposal.getProposedBy());
        log.info("Proposal {} submitted (scope={}), assigned reviewer {}", id, proposal.getScope(), reviewer != null ? reviewer.getEmail() : "None");
        return dtoMapper.toProposalResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProposalResponse> getPendingLeaderReviewProposalsForUser(Long userId) {
        return getPendingReviewProposalsForUser(userId);
    }

    // ── SCOPE-AWARE PENDING PROPOSALS FOR CURRENT USER ───────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<ProposalResponse> getPendingReviewProposalsForUser(Long userId) {
        User user = userService.getUserById(userId);
        Position position = user.getPosition();

        // Union Administrator / Union Leader: sees all UNION-scope proposals
        if (user.getRole() == Role.ADMINISTRATOR ||
                position == Position.UNION_ADMINISTRATOR ||
                position == Position.UNION_LEADER) {
            return proposalRepository.findPendingFinalApprovalForUnionAdmin().stream()
                    .map(dtoMapper::toProposalResponse).collect(Collectors.toList());
        }

        // Department Leader: sees UNION-scope proposals from their dept awaiting endorsement
        if (position == Position.DEPARTMENT_LEADER) {
            return getDeptLeaderPendingProposals(user);
        }

        // Field Leader: sees FIELD-scope proposals targeting their field unit
        if (position == Position.FIELD_LEADER) {
            return getFieldLeaderPendingProposals(user);
        }

        // District Pastor: sees DISTRICT-scope proposals targeting their district unit
        if (position == Position.DISTRICT_PASTOR) {
            return getDistrictPastorPendingProposals(user);
        }

        return new ArrayList<>();
    }

    @Override
    @Transactional(readOnly = true)
    public Long countPendingReviewForUser(Long userId) {
        User user = userService.getUserById(userId);
        Position position = user.getPosition();

        if (user.getRole() == Role.ADMINISTRATOR || position == Position.UNION_ADMINISTRATOR || position == Position.UNION_LEADER) {
            return proposalRepository.countPendingFinalApprovalForUnionAdmin();
        }
        if (position == Position.DEPARTMENT_LEADER) {
            return departmentRepository.findFirstByLeaderId(user.getId())
                    .map(dept -> proposalRepository.countPendingEndorsementForDeptLeader(dept.getId()))
                    .orElse(0L);
        }
        if (position == Position.FIELD_LEADER && user.getOrganizationUnit() != null) {
            Long fieldId = resolveFieldUnitId(user.getOrganizationUnit());
            return fieldId != null ? proposalRepository.countPendingForFieldLeader(fieldId) : 0L;
        }
        if (position == Position.DISTRICT_PASTOR && user.getOrganizationUnit() != null) {
            Long districtId = resolveDistrictUnitId(user.getOrganizationUnit());
            return districtId != null ? (long) getDistrictPastorPendingProposals(user).size() : 0L;
        }
        return 0L;
    }

    // ── MULTI-LEVEL LEADER REVIEW (Level 1: Field/Union Leader) ────────────────
    @Override
    public ProposalResponse leaderReviewProposal(Long id, ProposalReviewRequest request, Long leaderId) {
        Proposal proposal = getProposalEntity(id);
        User leader = userService.getUserById(leaderId);

        ProposalStatus decision = request.getDecision();
        ProposalStatus effectiveStatus;
        if (decision == ProposalStatus.APPROVED || decision == ProposalStatus.RECOMMENDED_BY_LEADER) {
            effectiveStatus = ProposalStatus.RECOMMENDED_BY_LEADER;
        } else if (decision == ProposalStatus.REJECTED) {
            effectiveStatus = ProposalStatus.REJECTED;
        } else if (decision == ProposalStatus.REVISION_REQUESTED) {
            effectiveStatus = ProposalStatus.REVISION_REQUESTED;
        } else {
            effectiveStatus = decision;
        }

        saveReview(proposal, leader, effectiveStatus, "LEADER_REVIEW", request.getComments());

        proposal.setStatus(effectiveStatus);
        proposal.setLeaderReviewedBy(leader);
        proposal.setLeaderReviewComments(request.getComments());
        proposal.setLeaderReviewedAt(LocalDateTime.now());
        proposal.setReviewedBy(leader);
        proposal.setReviewComments(request.getComments());
        if (proposal.getScope() == ProposalScope.UNION) {
            proposal.setDeptLeaderEndorsed(true);
        }

        Proposal saved = proposalRepository.save(proposal);
        log.info("Leader {} ({}) submitted review for proposal {} → {}", leader.getEmail(), leader.getPosition(), id, effectiveStatus);
        return dtoMapper.toProposalResponse(saved);
    }

    // ── MULTI-LEVEL ADMIN APPROVAL (Level 2: Union Administrator) ──────────────
    @Override
    public ProposalResponse adminApproval(Long id, AdminApprovalRequest request, Long adminId) {
        Proposal proposal = getProposalEntity(id);
        User admin = userService.getUserById(adminId);

        if (request != null) {
            if (request.getConfirmedVenue() != null && !request.getConfirmedVenue().trim().isEmpty()) {
                proposal.setVenue(request.getConfirmedVenue().trim());
            }
            if (request.getConfirmedStartDate() != null) {
                proposal.setStartDate(request.getConfirmedStartDate());
            }
            if (request.getConfirmedEndDate() != null) {
                proposal.setEndDate(request.getConfirmedEndDate());
            }
            validateDates(proposal.getStartDate(), proposal.getEndDate());
        }

        String comments = (request != null && request.getComments() != null && !request.getComments().trim().isEmpty())
                ? request.getComments().trim()
                : "Approved by Union Administrator";

        return executeAdminApproval(proposal, comments, admin);
    }

    @Override
    public ProposalResponse adminApproval(Long id, String comments, Long adminId) {
        Proposal proposal = getProposalEntity(id);
        User admin = userService.getUserById(adminId);

        String effectiveComments = (comments != null && !comments.trim().isEmpty())
                ? comments.trim()
                : "Approved by Union Administrator";

        return executeAdminApproval(proposal, effectiveComments, admin);
    }

    private ProposalResponse executeAdminApproval(Proposal proposal, String comments, User admin) {
        saveReview(proposal, admin, ProposalStatus.APPROVED, "ADMIN_FINAL_APPROVAL", comments);

        proposal.setStatus(ProposalStatus.APPROVED);
        proposal.setAdminApprovedBy(admin);
        proposal.setAdminReviewComments(comments);
        proposal.setAdminApprovedAt(LocalDateTime.now());
        proposal.setReviewedBy(admin);
        proposal.setReviewComments(comments);

        // System locks dates/venue and automatically creates the official event record
        autoCreateEvent(proposal);

        Proposal saved = proposalRepository.save(proposal);
        log.info("Union Administrator {} finalized approval for proposal {} → Status: APPROVED", admin.getEmail(), proposal.getId());
        
        // Automated notification to Coordinator
        sendApprovalNotification(saved);
        
        return dtoMapper.toProposalResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProposalResponse> getPendingAdminApprovalProposals() {
        return proposalRepository.findPendingFinalApprovalForUnionAdmin().stream()
                .map(dtoMapper::toProposalResponse).collect(Collectors.toList());
    }

    // ── FIELD LEADER REVIEW (FIELD scope) ────────────────────────────────────

    @Override
    public ProposalResponse fieldReviewProposal(Long id, ProposalReviewRequest request, Long fieldLeaderId) {
        return leaderReviewProposal(id, request, fieldLeaderId);
    }

    // ── DEPT LEADER ENDORSEMENT (UNION scope step-1) ─────────────────────────

    @Override
    public ProposalResponse endorseProposal(Long id, String comments, Long coordinatorId) {
        ProposalReviewRequest request = new ProposalReviewRequest();
        request.setDecision(ProposalStatus.RECOMMENDED_BY_LEADER);
        request.setComments(comments != null ? comments : "Endorsed for Union approval");
        return leaderReviewProposal(id, request, coordinatorId);
    }

    // ── UNION ADMIN FINAL REVIEW (UNION scope step-2) ────────────────────────

    @Override
    public ProposalResponse reviewProposal(Long id, ProposalReviewRequest request, Long reviewerId) {
        Proposal proposal = getProposalEntity(id);
        User reviewer = userService.getUserById(reviewerId);

        ProposalStatus decision = request.getDecision();
        saveReview(proposal, reviewer, decision, "ADMIN_REVIEW", request.getComments());

        proposal.setStatus(decision);
        proposal.setReviewedBy(reviewer);
        proposal.setReviewComments(request.getComments());

        if (decision == ProposalStatus.APPROVED) {
            proposal.setAdminApprovedBy(reviewer);
            proposal.setAdminReviewComments(request.getComments());
            proposal.setAdminApprovedAt(LocalDateTime.now());
            autoCreateEvent(proposal);
        }

        log.info("Proposal {} reviewed by {} → {}", id, reviewerId, decision);
        return dtoMapper.toProposalResponse(proposalRepository.save(proposal));
    }

    @Override
    public ProposalResponse approveProposal(Long id, Long reviewerId) {
        return adminApproval(id, "Approved by Union Administrator", reviewerId);
    }

    @Override
    public ProposalResponse rejectProposal(Long id, String comments, Long reviewerId) {
        ProposalReviewRequest req = new ProposalReviewRequest();
        req.setDecision(ProposalStatus.REJECTED);
        req.setComments(comments);
        return reviewProposal(id, req, reviewerId);
    }

    @Override
    public ProposalResponse requestRevision(Long id, String comments, Long reviewerId) {
        ProposalReviewRequest req = new ProposalReviewRequest();
        req.setDecision(ProposalStatus.REVISION_REQUESTED);
        req.setComments(comments);
        return reviewProposal(id, req, reviewerId);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @Override
    public void deleteProposal(Long id) {
        Proposal proposal = getProposalEntity(id);
        proposal.setDeleted(true);
        proposalRepository.save(proposal);
    }

    @Override
    @Transactional(readOnly = true)
    public Proposal getProposalEntity(Long id) {
        return proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", "id", id));
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    private List<ProposalResponse> getDeptLeaderPendingProposals(User deptLeader) {
        return departmentRepository.findFirstByLeaderId(deptLeader.getId())
                .map(dept -> proposalRepository.findPendingEndorsementForDeptLeader(dept.getId()).stream()
                        .map(dtoMapper::toProposalResponse).collect(Collectors.toList()))
                .orElse(new ArrayList<>());
    }

    private List<ProposalResponse> getFieldLeaderPendingProposals(User fieldLeader) {
        if (fieldLeader.getOrganizationUnit() == null) return new ArrayList<>();
        Long fieldId = resolveFieldUnitId(fieldLeader.getOrganizationUnit());
        if (fieldId == null) return new ArrayList<>();
        return proposalRepository.findPendingForFieldLeader(fieldId).stream()
                .map(dtoMapper::toProposalResponse).collect(Collectors.toList());
    }

    private List<ProposalResponse> getDistrictPastorPendingProposals(User districtPastor) {
        if (districtPastor.getOrganizationUnit() == null) return new ArrayList<>();
        Long districtId = resolveDistrictUnitId(districtPastor.getOrganizationUnit());
        if (districtId == null) return new ArrayList<>();
        return proposalRepository.findPendingReviewsForUser(districtPastor.getId(), "DISTRICT_PASTOR", districtId).stream()
                .map(dtoMapper::toProposalResponse).collect(Collectors.toList());
    }

    /**
     * Walks up the org hierarchy to find the FIELD-level unit.
     */
    private Long resolveFieldUnitId(OrganizationUnit unit) {
        if (unit == null) return null;
        if (unit.getLevel() == OrganizationLevel.FIELD) return unit.getId();
        if (unit.getParent() != null) return resolveFieldUnitId(unit.getParent());
        return null;
    }

    /**
     * Walks up the org hierarchy to find the DISTRICT-level unit.
     */
    private Long resolveDistrictUnitId(OrganizationUnit unit) {
        if (unit == null) return null;
        if (unit.getLevel() == OrganizationLevel.DISTRICT) return unit.getId();
        if (unit.getParent() != null) return resolveDistrictUnitId(unit.getParent());
        return null;
    }

    private void validateScopeMatchesUnit(ProposalScope scope, OrganizationUnit unit) {
        if (scope == ProposalScope.DISTRICT && unit.getLevel() != OrganizationLevel.DISTRICT) {
            throw new BadRequestException(
                    "DISTRICT-scope proposals must target a DISTRICT-level organization unit, got: " + unit.getLevel());
        }
        if (scope == ProposalScope.FIELD && unit.getLevel() != OrganizationLevel.FIELD) {
            throw new BadRequestException(
                    "FIELD-scope proposals must target a FIELD-level organization unit, got: " + unit.getLevel());
        }
        if (scope == ProposalScope.UNION && unit.getLevel() != OrganizationLevel.UNION) {
            throw new BadRequestException(
                    "UNION-scope proposals must target a UNION-level organization unit, got: " + unit.getLevel());
        }
    }

    private void saveReview(Proposal proposal, User reviewer, ProposalStatus decision, String reviewStage, String comments) {
        ProposalReview review = ProposalReview.builder()
                .proposal(proposal)
                .reviewer(reviewer)
                .decision(decision)
                .reviewStage(reviewStage)
                .comments(comments)
                .build();
        proposalReviewRepository.save(review);
    }

    private void validateDates(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new BadRequestException("Start date and end date are required");
        }
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("End date cannot be before start date");
        }
    }

    private void sendApprovalNotification(Proposal proposal) {
        if (proposal.getProposedBy() == null || notificationService == null) return;
        try {
            NotificationRequest request = new NotificationRequest();
            request.setRecipientId(proposal.getProposedBy().getId());
            if (proposal.getEvent() != null) {
                request.setEventId(proposal.getEvent().getId());
                request.setActionUrl("/app/events/" + proposal.getEvent().getId());
            } else {
                request.setActionUrl("/app/proposals/" + proposal.getId());
            }
            request.setType(NotificationType.GENERAL_ANNOUNCEMENT);
            request.setTitle("Proposal Approved & Registration Open!");
            request.setMessage("Your proposal '" + proposal.getEventName() + "' has been approved by the Union Administrator. The official event has been automatically created and registration is now OPEN!");
            notificationService.createNotification(request);
            log.info("Sent proposal approval and event registration open notification to user {}", proposal.getProposedBy().getId());
        } catch (Exception e) {
            log.warn("Failed to send proposal approval notification: {}", e.getMessage());
        }
    }

    private void notifyFieldScopeUnionLeaders(Proposal proposal) {
        if (proposal == null || notificationService == null) return;
        try {
            String title = "Field Scope Event / Proposal Scheduled: " + proposal.getEventName();
            String msg = "A Field Scope event proposal '" + proposal.getEventName() + "' at venue '" + proposal.getVenue() 
                    + "' (" + proposal.getStartDate() + " to " + proposal.getEndDate() + ") has been submitted by " 
                    + (proposal.getProposedBy() != null ? proposal.getProposedBy().getFirstName() + " " + proposal.getProposedBy().getLastName() : "Field Organizer") 
                    + " for field " + (proposal.getTargetOrganizationUnit() != null ? proposal.getTargetOrganizationUnit().getName() : "Field Unit") + ".";
            String actionUrl = proposal.getEvent() != null ? "/app/events/" + proposal.getEvent().getId() : "/app/proposals/" + proposal.getId();
            Long senderId = proposal.getProposedBy() != null ? proposal.getProposedBy().getId() : null;
            notificationService.notifyUnionLeadersForFieldScope(title, msg, actionUrl, senderId, proposal.getEvent());
        } catch (Exception e) {
            log.warn("Failed to notify Union Leaders for Field scope proposal: {}", e.getMessage());
        }
    }

    private void autoCreateEvent(Proposal proposal) {
        if (proposal.getEvent() != null) return;
        Event event = Event.builder()
                .eventCode("EVT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .name(proposal.getEventName())
                .type(proposal.getEventType())
                .description(proposal.getObjectives())
                .startDate(proposal.getStartDate())
                .endDate(proposal.getEndDate())
                .venue(proposal.getVenue())
                .budget(proposal.getEstimatedBudget())
                .maxParticipants(proposal.getExpectedParticipants())
                .registrationStartDate(LocalDate.now())
                .registrationEndDate(proposal.getEndDate())
                .status(EventStatus.REGISTRATION_OPEN)
                .proposal(proposal)
                .coordinator(proposal.getProposedBy())
                .build();
        Event saved = eventRepository.save(event);
        proposal.setEvent(saved);
        log.info("Auto-created Event {} (status: REGISTRATION_OPEN) for approved proposal {}", saved.getEventCode(), proposal.getId());

        if (proposal.getScope() == ProposalScope.FIELD) {
            notifyFieldScopeUnionLeaders(proposal);
        }
    }
}
