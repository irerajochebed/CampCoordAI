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
    private final UserService userService;
    private final NotificationService notificationService;
    private final DtoMapper dtoMapper;

    public ProposalServiceImpl(
            ProposalRepository proposalRepository,
            ProposalReviewRepository proposalReviewRepository,
            DepartmentRepository departmentRepository,
            EventRepository eventRepository,
            OrganizationUnitRepository organizationUnitRepository,
            UserService userService,
            @Lazy NotificationService notificationService,
            DtoMapper dtoMapper) {
        this.proposalRepository = proposalRepository;
        this.proposalReviewRepository = proposalReviewRepository;
        this.departmentRepository = departmentRepository;
        this.eventRepository = eventRepository;
        this.organizationUnitRepository = organizationUnitRepository;
        this.userService = userService;
        this.notificationService = notificationService;
        this.dtoMapper = dtoMapper;
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    @Override
    public ProposalResponse createProposal(ProposalRequest request, Long userId) {
        validateDates(request.getStartDate(), request.getEndDate());
        User proposedBy = userService.getUserById(userId);
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
        OrganizationUnit targetUnit = organizationUnitRepository.findById(request.getTargetOrganizationUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("OrganizationUnit", "id", request.getTargetOrganizationUnitId()));

        validateScopeMatchesUnit(request.getScope(), targetUnit);

        Proposal proposal = Proposal.builder()
                .eventName(request.getEventName())
                .eventType(request.getEventType())
                .department(department)
                .proposedBy(proposedBy)
                .objectives(request.getObjectives())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .venue(request.getVenue())
                .expectedParticipants(request.getExpectedParticipants())
                .estimatedBudget(request.getEstimatedBudget())
                .requiredResources(request.getRequiredResources())
                .scope(request.getScope())
                .targetOrganizationUnit(targetUnit)
                .status(ProposalStatus.SUBMITTED)
                .build();

        Proposal saved = proposalRepository.save(proposal);
        log.info("Proposal created: {} (scope={}) by user {}", saved.getEventName(), saved.getScope(), userId);
        return dtoMapper.toProposalResponse(saved);
    }

    @Override
    public ProposalResponse createProposal(ProposalCreateRequest request, Long userId) {
        validateDates(request.getStartDate(), request.getEndDate());
        User proposedBy = userService.getUserById(userId);
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
        OrganizationUnit targetUnit = organizationUnitRepository.findById(request.getTargetOrganizationUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("OrganizationUnit", "id", request.getTargetOrganizationUnitId()));

        validateScopeMatchesUnit(request.getScope(), targetUnit);

        Proposal proposal = Proposal.builder()
                .eventName(request.getEventName())
                .eventType(request.getEventType())
                .department(department)
                .proposedBy(proposedBy)
                .objectives(request.getObjectives())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .venue(request.getVenue())
                .expectedParticipants(request.getExpectedParticipants())
                .estimatedBudget(request.getEstimatedBudget())
                .requiredResources(request.getRequiredResources())
                .scope(request.getScope())
                .targetOrganizationUnit(targetUnit)
                .status(ProposalStatus.SUBMITTED)
                .build();

        Proposal saved = proposalRepository.save(proposal);
        log.info("Proposal created: {} (scope={}) by user {}", saved.getEventName(), saved.getScope(), userId);
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
        proposal.setStatus(ProposalStatus.SUBMITTED);
        proposal.setDeptLeaderEndorsed(false); // reset on re-submission
        log.info("Proposal {} submitted (scope={})", id, proposal.getScope());
        return dtoMapper.toProposalResponse(proposalRepository.save(proposal));
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
            }
            request.setType(NotificationType.GENERAL_ANNOUNCEMENT);
            request.setTitle("Proposal Approved!");
            request.setMessage("Your proposal '" + proposal.getEventName() + "' has been approved by the Union Administrator.");
            notificationService.createNotification(request);
            log.info("Sent proposal approval notification to user {}", proposal.getProposedBy().getId());
        } catch (Exception e) {
            log.warn("Failed to send proposal approval notification: {}", e.getMessage());
        }
    }

    private void autoCreateEvent(Proposal proposal) {
        if (proposal.getEvent() != null) return;
        Event event = Event.builder()
                .eventCode("EVT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .name(proposal.getEventName())
                .type(proposal.getEventType())
                .startDate(proposal.getStartDate())
                .endDate(proposal.getEndDate())
                .venue(proposal.getVenue())
                .budget(proposal.getEstimatedBudget())
                .status(EventStatus.PLANNED)
                .proposal(proposal)
                .coordinator(proposal.getProposedBy())
                .build();
        eventRepository.save(event);
        proposal.setEvent(event);
        log.info("Auto-created Event {} for approved proposal {}", event.getEventCode(), proposal.getId());
    }
}
