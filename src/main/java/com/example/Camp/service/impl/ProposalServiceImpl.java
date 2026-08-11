package com.example.Camp.service.impl;

import com.example.Camp.dto.proposal.ProposalRequest;
import com.example.Camp.dto.proposal.ProposalResponse;
import com.example.Camp.dto.proposal.ProposalReviewRequest;
import com.example.Camp.entity.*;
import com.example.Camp.enums.*;
import com.example.Camp.exception.BadRequestException;
import com.example.Camp.exception.ResourceNotFoundException;
import com.example.Camp.repository.*;
import com.example.Camp.service.ProposalService;
import com.example.Camp.service.UserService;
import com.example.Camp.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProposalServiceImpl implements ProposalService {

    private final ProposalRepository proposalRepository;
    private final ProposalReviewRepository proposalReviewRepository;
    private final DepartmentRepository departmentRepository;
    private final EventRepository eventRepository;
    private final OrganizationUnitRepository organizationUnitRepository;
    private final UserService userService;
    private final DtoMapper dtoMapper;

    // ── CREATE ────────────────────────────────────────────────────────────────

    @Override
    public ProposalResponse createProposal(ProposalRequest request, Long userId) {
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
                .status(ProposalStatus.DRAFT)
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

    // ── SCOPE-AWARE PENDING PROPOSALS FOR CURRENT USER ───────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<ProposalResponse> getPendingReviewProposalsForUser(Long userId) {
        User user = userService.getUserById(userId);
        Position position = user.getPosition();

        // Union Administrator: sees all UNION-scope proposals endorsed by Dept Leader
        if (user.getRole() == Role.ADMINISTRATOR ||
                position == Position.UNION_ADMINISTRATOR) {
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

        return new ArrayList<>();
    }

    @Override
    @Transactional(readOnly = true)
    public Long countPendingReviewForUser(Long userId) {
        User user = userService.getUserById(userId);
        Position position = user.getPosition();

        if (user.getRole() == Role.ADMINISTRATOR || position == Position.UNION_ADMINISTRATOR) {
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
        return 0L;
    }

    // ── FIELD LEADER REVIEW (FIELD scope) ────────────────────────────────────

    @Override
    public ProposalResponse fieldReviewProposal(Long id, ProposalReviewRequest request, Long fieldLeaderId) {
        Proposal proposal = getProposalEntity(id);
        User fieldLeader = userService.getUserById(fieldLeaderId);

        if (proposal.getScope() != ProposalScope.FIELD) {
            throw new BadRequestException("This proposal is UNION-scoped. Use the union review endpoint.");
        }
        if (fieldLeader.getPosition() != Position.FIELD_LEADER) {
            throw new BadRequestException("Only a Field Leader can review FIELD-scope proposals.");
        }

        ProposalStatus decision = request.getDecision();
        if (decision != ProposalStatus.APPROVED && decision != ProposalStatus.REJECTED
                && decision != ProposalStatus.REVISION_REQUESTED) {
            throw new BadRequestException("Invalid decision for field review: " + decision);
        }

        saveReview(proposal, fieldLeader, decision, request.getComments());
        proposal.setStatus(decision);
        proposal.setReviewedBy(fieldLeader);
        proposal.setReviewComments(request.getComments());

        if (decision == ProposalStatus.APPROVED) {
            autoCreateEvent(proposal);
        }

        log.info("Field Leader {} reviewed proposal {} → {}", fieldLeaderId, id, decision);
        return dtoMapper.toProposalResponse(proposalRepository.save(proposal));
    }

    // ── DEPT LEADER ENDORSEMENT (UNION scope step-1) ─────────────────────────

    @Override
    public ProposalResponse endorseProposal(Long id, String comments, Long coordinatorId) {
        Proposal proposal = getProposalEntity(id);
        User coordinator = userService.getUserById(coordinatorId);

        if (proposal.getScope() != ProposalScope.UNION) {
            throw new BadRequestException("Only UNION-scope proposals require Dept Leader endorsement.");
        }
        if (coordinator.getPosition() != Position.DEPARTMENT_LEADER) {
            throw new BadRequestException("Only a Department Leader can endorse UNION-scope proposals.");
        }
        if (proposal.getStatus() != ProposalStatus.SUBMITTED) {
            throw new BadRequestException("Only SUBMITTED proposals can be endorsed.");
        }

        saveReview(proposal, coordinator, ProposalStatus.UNDER_REVIEW,
                "Endorsed by Dept Leader " + coordinator.getFirstName() + " " + coordinator.getLastName() + ": " + comments);

        proposal.setDeptLeaderEndorsed(true);
        proposal.setStatus(ProposalStatus.UNDER_REVIEW);
        proposal.setReviewComments(comments);

        log.info("Dept Leader {} endorsed UNION proposal {} → escalated to Union Admin", coordinatorId, id);
        return dtoMapper.toProposalResponse(proposalRepository.save(proposal));
    }

    // ── UNION ADMIN FINAL REVIEW (UNION scope step-2) ────────────────────────

    @Override
    public ProposalResponse reviewProposal(Long id, ProposalReviewRequest request, Long reviewerId) {
        Proposal proposal = getProposalEntity(id);
        User reviewer = userService.getUserById(reviewerId);

        // For UNION scope, enforce that it has been endorsed first
        if (proposal.getScope() == ProposalScope.UNION && !proposal.getDeptLeaderEndorsed()) {
            throw new BadRequestException("This UNION-scope proposal must be endorsed by the Department Leader first.");
        }

        saveReview(proposal, reviewer, request.getDecision(), request.getComments());
        proposal.setStatus(request.getDecision());
        proposal.setReviewedBy(reviewer);
        proposal.setReviewComments(request.getComments());

        if (request.getDecision() == ProposalStatus.APPROVED) {
            autoCreateEvent(proposal);
        }

        log.info("Proposal {} reviewed by {} → {}", id, reviewerId, request.getDecision());
        return dtoMapper.toProposalResponse(proposalRepository.save(proposal));
    }

    @Override
    public ProposalResponse approveProposal(Long id, Long reviewerId) {
        ProposalReviewRequest req = new ProposalReviewRequest();
        req.setDecision(ProposalStatus.APPROVED);
        req.setComments("Approved");
        return reviewProposal(id, req, reviewerId);
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

    /**
     * Walks up the org hierarchy to find the FIELD-level unit.
     * A Field Leader may be assigned directly to a FIELD unit or a sub-unit.
     */
    private Long resolveFieldUnitId(OrganizationUnit unit) {
        if (unit == null) return null;
        if (unit.getLevel() == OrganizationLevel.FIELD) return unit.getId();
        if (unit.getParent() != null) return resolveFieldUnitId(unit.getParent());
        return null;
    }

    private void validateScopeMatchesUnit(ProposalScope scope, OrganizationUnit unit) {
        if (scope == ProposalScope.FIELD && unit.getLevel() != OrganizationLevel.FIELD) {
            throw new BadRequestException(
                    "FIELD-scope proposals must target a FIELD-level organization unit, got: " + unit.getLevel());
        }
        if (scope == ProposalScope.UNION && unit.getLevel() != OrganizationLevel.UNION) {
            throw new BadRequestException(
                    "UNION-scope proposals must target a UNION-level organization unit, got: " + unit.getLevel());
        }
    }

    private void saveReview(Proposal proposal, User reviewer, ProposalStatus decision, String comments) {
        ProposalReview review = ProposalReview.builder()
                .proposal(proposal)
                .reviewer(reviewer)
                .decision(decision)
                .comments(comments)
                .build();
        proposalReviewRepository.save(review);
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
        log.info("Auto-created Event {} for approved proposal {}", event.getEventCode(), proposal.getId());
    }
}
